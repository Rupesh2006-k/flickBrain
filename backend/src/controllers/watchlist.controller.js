import Watchlist from '../models/Watchlist.model.js';
import Content from '../models/Content.model.js';
import WatchedItem from '../models/WatchedItem.model.js';
import { success, error } from '../utils/apiResponse.js';

export const getWatchlist = async (req, res, next) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user._id })
      .populate('contentId')
      .sort({ addedAt: -1 });

    return success(res, 'Watchlist retrieved.', { watchlist }, 200);
  } catch (err) {
    next(err);
  }
};

export const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { contentId, priority } = req.body;

    if (!contentId) {
      return error(res, 'contentId is required.', null, 400);
    }

    const content = await Content.findById(contentId);
    if (!content) {
      return error(res, 'Content not found.', null, 404);
    }

    // Check duplicate
    const existingItem = await Watchlist.findOne({ userId, contentId });
    if (existingItem) {
      return error(res, 'Already in watchlist', null, 409);
    }

    const item = await Watchlist.create({
      userId,
      contentId,
      priority: priority || 'medium',
      watched: false,
      addedAt: new Date()
    });

    return success(res, 'Content added to watchlist.', item, 201);
  } catch (err) {
    next(err);
  }
};

export const markAsWatched = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const idParam = req.params.id;

    const item = await Watchlist.findOneAndUpdate(
      { _id: idParam, userId },
      { watched: true },
      { returnDocument: 'after' }
    );

    if (!item) {
      return error(res, 'Watchlist item not found.', null, 404);
    }

    // Auto-create WatchedItem for the user if it doesn't already exist
    const content = await Content.findById(item.contentId);
    if (content) {
      const watched = await WatchedItem.findOne({ userId, contentId: content._id });
      if (!watched) {
        await WatchedItem.create({
          userId,
          contentId: content._id,
          source: content.source,
          watchedAt: new Date(),
          completed: true
        });
      }
    }

    return success(res, 'Watchlist item marked as watched.', item, 200);
  } catch (err) {
    next(err);
  }
};

export const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const idParam = req.params.id;

    const item = await Watchlist.findOneAndDelete({ _id: idParam, userId });

    if (!item) {
      return error(res, 'Watchlist item not found.', null, 404);
    }

    return success(res, 'Watchlist item removed successfully.', item, 200);
  } catch (err) {
    next(err);
  }
};
