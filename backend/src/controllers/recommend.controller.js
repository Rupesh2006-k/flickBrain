import axios from 'axios';
import Recommendation from '../models/Recommendation.model.js';
import WatchedItem from '../models/WatchedItem.model.js';
import Content from '../models/Content.model.js';
import Watchlist from '../models/Watchlist.model.js';
import { generateScores } from '../services/scorer.service.js';
import { rerank } from '../services/llmRanker.service.js';
import { seedNetflixContent, seedYoutubeContent, enrichContent } from '../services/tmdb.service.js';
import { success, error } from '../utils/apiResponse.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Trigger non-blocking seeding of Netflix candidates from TMDB
    seedNetflixContent().catch(err => console.error('Background Netflix seed failed:', err.message));

    // Trigger non-blocking seeding of YouTube candidates from YouTube API
    seedYoutubeContent(userId).catch(err => console.error('Background YouTube seed failed:', err.message));

    // Step 2 — Run scorer
    const candidates = await generateScores(userId);
    if (candidates.length === 0) {
      return success(res, 'No recommendations yet. Import your watch history first.', { recommendations: [] }, 200);
    }

    // Step 3 — Run LLM reranker
    const ranked = await rerank(userId, candidates);

    // Step 4 — Save to Recommendation collection (upsert top 20)
    await Promise.all(
      ranked.map(item =>
        Recommendation.findOneAndUpdate(
          { userId, contentId: item.contentId },
          {
            userId,
            contentId: item.contentId,
            score: item.score || 50,
            reason: item.reason || 'Recommended for you',
            dismissed: false,
            generatedAt: new Date()
          },
          { upsert: true, returnDocument: 'after' }
        )
      )
    );

    // Step 5 — Fetch saved recommendations with populated content
    const recommendations = await Recommendation.find({
      userId,
      dismissed: false
    })
      .populate('contentId')
      .sort({ score: -1 })

    // Step 6 — Return response
    return success(res, 'Recommendations fetched.', { recommendations }, 200);

  } catch (err) {
    next(err);
  }
};

export const dismissRecommendation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recId = req.params.id;

    // Find and update recommendation to dismissed
    const rec = await Recommendation.findOneAndUpdate(
      { _id: recId, userId },
      { dismissed: true },
      { returnDocument: 'after' }
    );

    if (!rec) {
      return error(res, 'Recommendation not found.', null, 404);
    }

    return success(res, 'Recommendation dismissed successfully.', rec, 200);
  } catch (err) {
    next(err);
  }
};

export const rateContent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const itemOrContentId = req.params.id;
    const { rating } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return error(res, 'Rating is required and must be an integer between 1 and 5.', null, 400);
    }

    // Lookup WatchedItem by WatchedItem ID or Content ID
    let watched = await WatchedItem.findOneAndUpdate(
      {
        userId,
        $or: [
          { _id: itemOrContentId },
          { contentId: itemOrContentId }
        ]
      },
      { userRating: rating },
      { returnDocument: 'after' }
    );

    if (!watched) {
      const contentDoc = await Content.findById(itemOrContentId);
      if (!contentDoc) {
        return error(res, 'Watched item or Content not found.', null, 404);
      }
      
      watched = await WatchedItem.create({
        userId,
        contentId: contentDoc._id,
        source: contentDoc.source || 'netflix',
        watchedAt: new Date(),
        completed: true,
        userRating: rating
      });
    }

    return success(res, 'Rating updated successfully.', watched, 200);
  } catch (err) {
    next(err);
  }
};

export const autoAddToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const groqKey = process.env.GROQ_API_KEY;
    const tmdbKey = process.env.TMDB_API_KEY;
    const ytKey = process.env.YOUTUBE_API_KEY;

    if (!groqKey) {
      return error(res, 'Groq API Key is not configured on the server.', null, 500);
    }

    // Step 1: Fetch user's recent watched titles (up to 10)
    const watchedItems = await WatchedItem.find({ userId })
      .populate('contentId', 'title')
      .sort({ watchedAt: -1 })
      .limit(10);
    const watchedTitles = watchedItems.map(w => w.contentId?.title).filter(Boolean);

    // Step 2: Fetch trending candidates from TMDB and YouTube
    const candidates = [];

    // Fetch TMDB Movie popular
    if (tmdbKey) {
      try {
        const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdbKey}&language=en-US&page=1`);
        const movies = movieRes.data.results || [];
        movies.slice(0, 10).forEach(m => {
          candidates.push({
            externalId: String(m.id),
            title: m.title || m.original_title,
            description: m.overview || '',
            source: 'netflix',
            type: 'movie',
            popularity: m.popularity,
            voteAverage: m.vote_average,
            voteCount: m.vote_count,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            releaseYear: m.release_date ? new Date(m.release_date).getFullYear() : null,
          });
        });
      } catch (err) {
        console.error('Failed to fetch TMDB movies for auto-watchlist:', err.message);
      }

      // Fetch TMDB TV popular
      try {
        const tvRes = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${tmdbKey}&language=en-US&page=1`);
        const tvs = tvRes.data.results || [];
        tvs.slice(0, 10).forEach(t => {
          candidates.push({
            externalId: String(t.id),
            title: t.name || t.original_name,
            description: t.overview || '',
            source: 'netflix',
            type: 'show',
            popularity: t.popularity,
            voteAverage: t.vote_average,
            voteCount: t.vote_count,
            poster: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
            releaseYear: t.first_air_date ? new Date(t.first_air_date).getFullYear() : null,
          });
        });
      } catch (err) {
        console.error('Failed to fetch TMDB TV shows for auto-watchlist:', err.message);
      }
    }

    // Fetch YouTube popular
    if (ytKey) {
      try {
        const ytRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=15&key=${ytKey}`);
        const videos = ytRes.data.items || [];
        videos.forEach(v => {
          candidates.push({
            externalId: v.id,
            title: v.snippet.title,
            description: v.snippet.description || '',
            source: 'youtube',
            type: 'video',
            views: parseInt(v.statistics?.viewCount || 0),
            likes: parseInt(v.statistics?.likeCount || 0),
            poster: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
            releaseYear: v.snippet.publishedAt ? new Date(v.snippet.publishedAt).getFullYear() : null,
          });
        });
      } catch (err) {
        console.error('Failed to fetch YouTube videos for auto-watchlist:', err.message);
      }
    }

    // Fallback: If APIs failed or keys missing, fetch some popular items from existing database content
    if (candidates.length === 0) {
      const dbContent = await Content.find().limit(20);
      dbContent.forEach(c => {
        candidates.push({
          externalId: c.externalId,
          title: c.title,
          description: c.description || '',
          source: c.source,
          type: c.type,
          poster: c.poster,
          releaseYear: c.releaseYear,
        });
      });
    }

    if (candidates.length === 0) {
      return error(res, 'No candidate items found to recommend.', null, 400);
    }

    // Step 3: Construct Groq prompt and call API
    const candidatesForPrompt = candidates.map((c, index) => {
      let popularityStr = '';
      if (c.source === 'youtube') {
        popularityStr = `Views: ${c.views?.toLocaleString() || 0} | Likes: ${c.likes?.toLocaleString() || 0}`;
      } else {
        popularityStr = `Popularity Score: ${c.popularity || 0} | Rating: ${c.voteAverage || 0}/10`;
      }
      return `${index + 1}. [${c.source.toUpperCase()}] ID: ${c.externalId} | Title: "${c.title}" | ${popularityStr} | Desc: ${c.description ? c.description.substring(0, 100) : ''}...`;
    }).join('\n');

    const prompt = `You are a personalized entertainment recommendation assistant.
The user has recently watched these items:
${watchedTitles.length > 0 ? watchedTitles.map(t => `- ${t}`).join('\n') : 'No watch history yet.'}

Here is a list of popular, trending content currently being watched a lot on the internet (with views/likes/ratings):
${candidatesForPrompt}

Your task:
1. Select exactly the top 3 items from the trending list that this user would most likely enjoy watching next based on their watch history. If they have no history, select the 3 most popular items.
2. For each selected item, write a personalized, highly compelling reason (1-2 sentences) explaining why it's recommended. Highlight its popularity (e.g. mention it has high views/likes/rating) and why it matches their interest.
3. Return the response ONLY as a valid JSON array matching the structure below. Do not include markdown code block syntax (like \`\`\`json).

JSON structure:
[
  {
    "externalId": "...", // must exactly match the externalId from the list above
    "source": "...",     // must exactly match the source (youtube or netflix)
    "reason": "..."      // personalized reason
  }
]`;

    let selections = [];
    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content: 'You are a content recommendation assistant. Always respond with valid JSON only. No explanation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = groqResponse.data?.choices?.[0]?.message?.content || '';
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      selections = JSON.parse(cleanedJson);
      if (!Array.isArray(selections)) throw new Error('Not an array');
    } catch (groqErr) {
      console.warn('Groq API call or parsing failed, using fallback selections:', groqErr.message);
      // Fallback: Select the first 3 items from candidates
      selections = candidates.slice(0, 3).map(c => {
        let popText = '';
        if (c.source === 'youtube') {
          popText = `it has over ${c.views?.toLocaleString() || 0} views and is highly popular on YouTube.`;
        } else {
          popText = `it has a popularity score of ${c.popularity || 0} and a rating of ${c.voteAverage || 0}/10 on TMDB.`;
        }
        return {
          externalId: c.externalId,
          source: c.source,
          reason: `Trending ${c.source === 'youtube' ? 'video' : 'movie'} recommended for you because ${popText}`
        };
      });
    }

    // Step 4: Add selected items to database and watchlist
    const addedWatchlistItems = [];

    for (const sel of selections) {
      const match = candidates.find(c => 
        c.externalId && sel.externalId && c.source && sel.source &&
        String(c.externalId).trim() === String(sel.externalId).trim() && 
        String(c.source).toLowerCase() === String(sel.source).toLowerCase()
      );
      if (!match) continue;

      // Find or create Content document
      let content = await Content.findOne({ externalId: match.externalId, source: match.source });
      if (!content) {
        content = await Content.create({
          title: match.title,
          source: match.source,
          externalId: match.externalId,
          type: match.type,
          description: match.description,
          poster: match.poster,
          releaseYear: match.releaseYear,
          tags: match.tags || [],
          genre: match.genre || []
        });

        // Trigger background enrichment asynchronously (non-blocking)
        enrichContent(content._id).catch(err => {
          console.error(`❌ Background enrichment failed for content ID ${content._id}:`, err.message);
        });
      }

      // Check if already in user's watchlist
      let watchlistItem = await Watchlist.findOne({ userId, contentId: content._id });
      if (!watchlistItem) {
        watchlistItem = await Watchlist.create({
          userId,
          contentId: content._id,
          priority: 'medium',
          watched: false,
          addedAt: new Date()
        });
      } else if (watchlistItem.watched) {
        // If they already watched it, reset it to unwatched so it shows in "To Watch"
        watchlistItem.watched = false;
        watchlistItem.addedAt = new Date();
        await watchlistItem.save();
      }

      // Store the populated item with recommendation reason
      const populated = await Watchlist.findById(watchlistItem._id).populate('contentId');
      addedWatchlistItems.push({
        watchlistItem: populated,
        reason: sel.reason
      });
    }

    return success(res, 'AI recommendations automatically added to your watchlist!', {
      addedItems: addedWatchlistItems
    }, 200);

  } catch (err) {
    next(err);
  }
};
