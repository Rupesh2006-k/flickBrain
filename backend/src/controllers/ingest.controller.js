import crypto from 'crypto';
import { parse } from 'csv-parse';
import axios from 'axios';
import Content from '../models/Content.model.js';
import WatchedItem from '../models/WatchedItem.model.js';
import User from '../models/User.model.js';
import { enrichContent, seedNetflixContent } from '../services/tmdb.service.js';
import { success, error } from '../utils/apiResponse.js';

// Helper to parse CSV buffer
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    parse(buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
};

export const netflixIngest = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No CSV file uploaded.', null, 400);
    }

    const records = await parseCSV(req.file.buffer);
    const ingestedItems = [];

    for (const record of records) {
      const title = record.Title || record.title || record.Name || record.name;
      const dateStr = record.Date || record.date || record['Start Time'] || record['Watched Date'] || record['WatchedAt'];

      if (!title) continue;

      const watchedAt = dateStr ? new Date(dateStr) : new Date();

      // Simple classification: if title mentions season, episode, part, etc. it's a TV show
      let type = 'movie';
      if (
        title.toLowerCase().includes(': season') ||
        title.toLowerCase().includes(': series') ||
        title.toLowerCase().includes(': episode') ||
        title.toLowerCase().includes(': part') ||
        title.toLowerCase().includes(': volume') ||
        title.toLowerCase().includes(': vol')
      ) {
        type = 'show';
      }

      // Generate a reproducible temporary externalId to avoid collisions
      const tempExternalId = 'nf_' + crypto.createHash('md5').update(title).digest('hex');

      // Check if content exists by title or temp external ID
      let content = await Content.findOne({
        $or: [
          { title: title, source: 'netflix' },
          { externalId: tempExternalId, source: 'netflix' }
        ]
      });

      if (!content) {
        content = new Content({
          title,
          source: 'netflix',
          externalId: tempExternalId,
          type,
          description: '',
          genre: [],
          tags: []
        });
        await content.save();
      }

      // Record this watch instance
      let watched = await WatchedItem.findOne({ userId: req.user._id, contentId: content._id });
      if (!watched) {
        watched = new WatchedItem({
          userId: req.user._id,
          contentId: content._id,
          source: 'netflix',
          watchedAt,
          completed: true
        });
        await watched.save();

        // Trigger background enrichment asynchronously (non-blocking)
        enrichContent(content._id).catch(err => {
          console.error(`❌ Background enrichment failed for content ID ${content._id}:`, err);
        });
      }

      ingestedItems.push({
        title: content.title,
        type: content.type,
        watchedAt
      });
    }

    return success(res, 'Netflix CSV ingested successfully.', { count: ingestedItems.length }, 200);
  } catch (err) {
    next(err);
  }
};

export const youtubeIngest = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.youtubeToken) {
      return error(res, 'YouTube not connected. Please connect via Google.', null, 400);
    }

    const headers = {
      Authorization: `Bearer ${user.youtubeToken}`
    };

    // Call both endpoints in parallel using Promise.allSettled
    const [likedResult, playlistResult] = await Promise.allSettled([
      axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails',
          myRating: 'like',
          maxResults: 50
        },
        headers
      }),
      axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet,contentDetails',
          playlistId: 'LL',
          maxResults: 50
        },
        headers
      })
    ]);

    const likedItems = likedResult.status === 'fulfilled'
      ? likedResult.value.data.items || []
      : [];

    const playlistItems = playlistResult.status === 'fulfilled'
      ? playlistResult.value.data.items || []
      : [];

    // Log which calls failed
    if (likedResult.status === 'rejected') {
      console.error('Liked videos fetch failed:', likedResult.reason?.message);
    }
    if (playlistResult.status === 'rejected') {
      console.error('Playlist fetch failed:', playlistResult.reason?.message);
    }

    const rawItems = [];

    // Format liked videos
    likedItems.forEach(item => {
      if (item && item.id) {
        rawItems.push({
          videoId: item.id,
          title: item.snippet?.title || 'Untitled YouTube Video',
          description: item.snippet?.description || '',
          tags: item.snippet?.tags || [],
          publishedAt: item.snippet?.publishedAt
        });
      }
    });

    // Format liked playlist items (LL)
    playlistItems.forEach(item => {
      const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
      if (videoId) {
        rawItems.push({
          videoId,
          title: item.snippet?.title || 'Untitled YouTube Video',
          description: item.snippet?.description || '',
          tags: [],
          publishedAt: item.snippet?.publishedAt
        });
      }
    });

    // Deduplicate by videoId
    const dedupedMap = new Map();
    for (const item of rawItems) {
      if (!item.videoId) continue;
      
      if (!dedupedMap.has(item.videoId)) {
        dedupedMap.set(item.videoId, item);
      } else {
        // If it exists, prefer the entry that contains tags metadata
        const existing = dedupedMap.get(item.videoId);
        if (existing.tags.length === 0 && item.tags.length > 0) {
          dedupedMap.set(item.videoId, item);
        }
      }
    }

    const deduplicatedItems = Array.from(dedupedMap.values());

    // If both calls failed or returned absolutely zero items
    if (deduplicatedItems.length === 0) {
      let is401 = false;
      let is403 = false;

      if (likedResult.status === 'rejected' && isTokenExpiredError(likedResult.reason)) {
        is401 = true;
      }
      if (likedResult.status === 'rejected' && likedResult.reason?.response?.status === 403) {
        is403 = true;
      }
      if (playlistResult.status === 'rejected' && isTokenExpiredError(playlistResult.reason)) {
        is401 = true;
      }
      if (playlistResult.status === 'rejected' && playlistResult.reason?.response?.status === 403) {
        is403 = true;
      }

      if (is401) {
        return error(res, 'YouTube token expired. Please reconnect via Google.', null, 401);
      }
      if (is403) {
        return error(res, 'YouTube API quota exceeded or access denied.', null, 403);
      }

      return error(res, 'Could not fetch any YouTube data. Token may be invalid.', null, 400);
    }

    const ingestedItems = [];

    for (const item of deduplicatedItems) {
      const { videoId, title, description, tags, publishedAt } = item;

      // Find or create Content document
      let content = await Content.findOne({ externalId: videoId, source: 'youtube' });
      if (!content) {
        content = await Content.create({
          title,
          source: 'youtube',
          externalId: videoId,
          type: 'video',
          description,
          tags,
          genre: [],
          poster: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        });
      } else if (!content.poster) {
        content.poster = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        await content.save();
      }
      console.log(content)

      // Find or create WatchedItem link
      let watched = await WatchedItem.findOne({ userId: user._id, contentId: content._id });
      if (!watched) {
        watched = await WatchedItem.create({
          userId: user._id,
          contentId: content._id,
          source: 'youtube',
          watchedAt: new Date(publishedAt || Date.now()),
          completed: true
        });

        // Trigger background enrichment asynchronously (non-blocking)
        enrichContent(content._id).catch(err => {
          console.error(`❌ Background enrichment failed for content ID ${content._id}:`, err.message);
        });
      }

      ingestedItems.push({ title, videoId });
    }
    console.log(ingestedItems);

    return success(res, 'YouTube history ingested successfully.', {
      count: ingestedItems.length,
      items: ingestedItems
    }, 200);

  } catch (err) {
    if (isTokenExpiredError(err)) {
      return error(res, 'YouTube token expired. Please reconnect via Google.', null, 401);
    }
    if (err.response?.status === 403) {
      return error(res, 'YouTube API quota exceeded or access denied.', null, 403);
    }
    return error(res, 'YouTube sync failed.', err.message, 500);
  }
};

// Helper function to detect expired tokens
const isTokenExpiredError = (err) => {
  return err?.response?.status === 401 || 
         err?.response?.data?.error === 'invalid_grant' ||
         err?.response?.data?.error?.code === 401;
};

export const searchContent = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return error(res, 'Search query is required', null, 400);
    }

    const tmdbRes = await axios.get('https://api.themoviedb.org/3/search/multi', {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: q,
        include_adult: false,
        language: 'en-US',
        page: 1
      }
    });

    const results = (tmdbRes.data.results || [])
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 10)
      .map(item => ({
        tmdbId: item.id,
        title: item.title || item.name,
        type: item.media_type === 'tv' ? 'show' : 'movie',
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w200${item.poster_path}` 
          : null,
        year: (item.release_date || item.first_air_date || '').slice(0, 4),
        overview: item.overview || ''
      }));

    return success(res, 'Search results fetched', { results }, 200);
  } catch (err) {
    next(err);
  }
};

export const markAsWatched = async (req, res, next) => {
  try {
    const { tmdbId, title, type, poster, year } = req.body;
    if (!tmdbId || !title) {
      return error(res, 'tmdbId and title are required', null, 400);
    }

    let finalType = type;
    if (finalType !== 'movie' && finalType !== 'show') {
      finalType = 'movie';
    }

    // Step 1 — Find or create Content
    let content = await Content.findOne({ externalId: String(tmdbId), source: 'netflix' });
    if (!content) {
      let genre = [];
      let description = '';
      let releaseYear = parseInt(year) || null;
      let tmdbData = null;

      try {
        const endpoint = finalType === 'show' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
        const details = await axios.get(`https://api.themoviedb.org/3${endpoint}`, {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US'
          }
        });

        if (details.data) {
          genre = details.data.genres?.map(g => g.name) || [];
          description = details.data.overview || '';
          tmdbData = details.data;
          const dateStr = details.data.release_date || details.data.first_air_date;
          if (dateStr) {
            releaseYear = parseInt(dateStr.slice(0, 4)) || releaseYear;
          }
        }
      } catch (tmdbErr) {
        console.error(`TMDB details fetch failed for ${tmdbId}:`, tmdbErr.message);
      }

      content = await Content.create({
        title,
        source: 'netflix',
        externalId: String(tmdbId),
        type: finalType,
        poster: poster || null,
        genre,
        tags: [],
        description,
        releaseYear,
        tmdbData
      });
    }

    // Step 2 — Check if already watched
    const watchedExists = await WatchedItem.findOne({ userId: req.user._id, contentId: content._id });
    if (watchedExists) {
      return error(res, 'Already in your watch history', null, 409);
    }

    // Step 3 — Create WatchedItem
    await WatchedItem.create({
      userId: req.user._id,
      contentId: content._id,
      source: 'netflix',
      watchedAt: new Date(),
      completed: true
    });

    // Step 4 — Trigger enrichment non-blocking
    enrichContent(content._id).catch(e => 
      console.error(`Enrichment failed for ${content._id}:`, e.message)
    );

    // Step 5 — Return response
    return success(res, `"${title}" added to your watch history`, {
      title,
      contentId: content._id
    }, 201);

  } catch (err) {
    next(err);
  }
};

export const netflixSync = async (req, res, next) => {
  try {
    await seedNetflixContent();
    const count = await Content.countDocuments({ source: 'netflix' });
    return success(res, 'Netflix metadata synced successfully.', { count }, 200);
  } catch (err) {
    next(err);
  }
};
