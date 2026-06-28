import Recommendation from '../models/Recommendation.model.js';
import WatchedItem from '../models/WatchedItem.model.js';
import Content from '../models/Content.model.js';
import { generateScores } from '../services/scorer.service.js';
import { rerank } from '../services/llmRanker.service.js';
import { seedNetflixContent } from '../services/tmdb.service.js';
import { success, error } from '../utils/apiResponse.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Trigger non-blocking seeding of Netflix candidates from TMDB
    seedNetflixContent().catch(err => console.error('Background Netflix seed failed:', err.message));

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
