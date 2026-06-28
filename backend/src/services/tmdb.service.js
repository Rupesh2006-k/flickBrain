import axios from 'axios';
import Content from '../models/Content.model.js';
import WatchedItem from '../models/WatchedItem.model.js';
import Watchlist from '../models/Watchlist.model.js';
import Recommendation from '../models/Recommendation.model.js';

export const enrichContent = async (contentId) => {
  try {
    const content = await Content.findById(contentId);
    if (!content) {
      console.error(`❌ Content document not found for enrichment: ${contentId}`);
      return null;
    }

    if (content.source === 'netflix') {
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ TMDB_API_KEY is not defined. Skipping Netflix metadata enrichment.');
        return content;
      }

      // Step 1: Search TMDB by title
      const searchType = content.type === 'movie' ? 'movie' : (content.type === 'show' ? 'tv' : 'multi');
      const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(content.title)}`;
      const searchRes = await axios.get(searchUrl);
      
      const results = searchRes.data.results;
      if (!results || results.length === 0) {
        console.log(`⚠️ No TMDB search results found for title: ${content.title}`);
        return content;
      }

      // Get the first match
      const match = results[0];
      const tmdbId = match.id;
      const mediaType = searchType === 'multi' ? (match.media_type || 'movie') : searchType;

      // Step 2: Fetch details with credits & similar content
      const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}&append_to_response=credits,similar`;
      const detailRes = await axios.get(detailsUrl);
      const detail = detailRes.data;

      // Map values
      const genres = detail.genres ? detail.genres.map(g => g.name) : [];
      const cast = detail.credits && detail.credits.cast ? detail.credits.cast.slice(0, 5).map(c => c.name) : [];
      const tags = [...genres, ...cast];
      const posterUrl = detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : content.poster;
      
      let releaseYear = content.releaseYear;
      if (detail.release_date) {
        releaseYear = new Date(detail.release_date).getFullYear();
      } else if (detail.first_air_date) {
        releaseYear = new Date(detail.first_air_date).getFullYear();
      }

      const description = detail.overview || content.description;

      // Update Content fields
      content.genre = genres;
      content.tags = tags;
      content.poster = posterUrl;
      content.description = description;
      if (releaseYear) {
        content.releaseYear = releaseYear;
      }
      content.tmdbData = detail;

      // Check if a content record already exists with the real TMDB ID to prevent E11000 duplicate key error
      const existingEnrichedContent = await Content.findOne({
        externalId: String(tmdbId),
        source: 'netflix'
      });

      if (existingEnrichedContent && existingEnrichedContent._id.toString() !== content._id.toString()) {
        // Move references to the existing enriched content record
        await WatchedItem.updateMany(
          { contentId: content._id },
          { contentId: existingEnrichedContent._id }
        );
        await Watchlist.updateMany(
          { contentId: content._id },
          { contentId: existingEnrichedContent._id }
        );
        await Recommendation.updateMany(
          { contentId: content._id },
          { contentId: existingEnrichedContent._id }
        );

        // Delete the duplicate temporary content record
        await Content.findByIdAndDelete(content._id);
        
        console.log(`ℹ️ Duplicate content detected for TMDB ID ${tmdbId}. Consolidated references to existing document.`);
        return existingEnrichedContent;
      }

      content.externalId = String(tmdbId);
      await content.save();
      console.log(`✅ Netflix Content enriched successfully: "${content.title}" (TMDB ID: ${tmdbId})`);
      return content;
      
    } else if (content.source === 'youtube') {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ YOUTUBE_API_KEY is not defined. Skipping YouTube metadata enrichment.');
        return content;
      }

      // Fetch YouTube Video Data
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${content.externalId}&key=${apiKey}`;
      const res = await axios.get(url);
      const items = res.data.items;
      
      if (!items || items.length === 0) {
        console.log(`⚠️ No YouTube video found for ID: ${content.externalId}`);
        return content;
      }

      const snippet = items[0].snippet;
      const tags = snippet.tags || [];
      const description = snippet.description || '';
      
      // Map YouTube Category ID to general category/genre name
      const ytCategoryMap = {
        '1': 'Film & Animation',
        '2': 'Autos & Vehicles',
        '10': 'Music',
        '15': 'Pets & Animals',
        '17': 'Sports',
        '18': 'Short Movies',
        '19': 'Travel & Events',
        '20': 'Gaming',
        '21': 'Videoblogging',
        '22': 'People & Blogs',
        '23': 'Comedy',
        '24': 'Entertainment',
        '25': 'News & Politics',
        '26': 'Howto & Style',
        '27': 'Education',
        '28': 'Science & Technology',
        '29': 'Nonprofits & Activism'
      };
      
      const genreName = ytCategoryMap[snippet.categoryId] || 'Video';
      const genres = [genreName];

      const posterUrl = (snippet.thumbnails && (snippet.thumbnails.maxres || snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default))
        ? (snippet.thumbnails.maxres || snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default).url
        : `https://img.youtube.com/vi/${content.externalId}/mqdefault.jpg`;

      let releaseYear = content.releaseYear;
      if (snippet.publishedAt) {
        releaseYear = new Date(snippet.publishedAt).getFullYear();
      }

      content.genre = genres;
      content.tags = [...genres, ...tags];
      content.poster = posterUrl || `https://img.youtube.com/vi/${content.externalId}/mqdefault.jpg`;
      content.description = description;
      if (releaseYear) {
        content.releaseYear = releaseYear;
      }
      content.tmdbData = items[0]; // Raw YouTube API response saved under tmdbData field

      await content.save();
      console.log(`✅ YouTube Content enriched successfully: "${content.title}"`);
      return content;
    }

  } catch (err) {
    console.error(`❌ Error in enrichContent for ID ${contentId}:`, err.message);
    throw err;
  }
};

export const seedNetflixContent = async () => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return;

    // Check how many netflix items exist in DB
    const count = await Content.countDocuments({ source: 'netflix' });
    // If we already have, say, 60+ Netflix items, we don't need to seed again
    if (count > 60) return;

    console.log('🌱 Seeding popular Netflix content from TMDB...');

    // Fetch popular movies
    const moviesRes = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    const movies = moviesRes.data.results || [];

    // Fetch popular TV shows
    const tvRes = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=1`);
    const tvShows = tvRes.data.results || [];

    const items = [
      ...movies.map(m => ({ ...m, media_type: 'movie' })),
      ...tvShows.map(t => ({ ...t, media_type: 'tv' }))
    ];

    for (const item of items) {
      const tmdbId = item.id;
      const title = item.title || item.name;
      const type = item.media_type === 'tv' ? 'show' : 'movie';
      const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
      const releaseDate = item.release_date || item.first_air_date || '';
      const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : null;

      // Find or create
      const exists = await Content.findOne({ externalId: String(tmdbId), source: 'netflix' });
      if (!exists) {
        // Fetch detailed genres/credits for tags
        let genres = [];
        let cast = [];
        try {
          const detailsUrl = `https://api.themoviedb.org/3/${item.media_type}/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
          const details = await axios.get(detailsUrl);
          genres = details.data.genres ? details.data.genres.map(g => g.name) : [];
          cast = details.data.credits && details.data.credits.cast 
            ? details.data.credits.cast.slice(0, 5).map(c => c.name) 
            : [];
        } catch (e) {
          // ignore detail error
        }

        await Content.create({
          title,
          source: 'netflix',
          externalId: String(tmdbId),
          type,
          poster,
          genre: genres,
          tags: [...genres, ...cast],
          description: item.overview || '',
          releaseYear,
          tmdbData: item
        });
      }
    }
    console.log('✅ Popular Netflix content seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding Netflix content:', err.message);
  }
};
