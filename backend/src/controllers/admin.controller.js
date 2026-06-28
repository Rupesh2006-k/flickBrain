import User from '../models/User.model.js';
import Content from '../models/Content.model.js';
import Recommendation from '../models/Recommendation.model.js';
import { success, error } from '../utils/apiResponse.js';

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return success(res, 'Users list retrieved successfully.', {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, 200);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return error(res, 'User not found.', null, 404);
    }
    return success(res, 'User details retrieved.', { user }, 200);
  } catch (err) {
    next(err);
  }
};

export const updateUserPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan || !['free', 'premium'].includes(plan)) {
      return error(res, 'Invalid plan. Must be "free" or "premium".', null, 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return error(res, 'User not found.', null, 404);
    }

    return success(res, 'User plan updated successfully.', { user }, 200);
  } catch (err) {
    next(err);
  }
};

export const softDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return error(res, 'User not found.', null, 404);
    }

    return success(res, 'User soft-deleted successfully.', { user }, 200);
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalContent = await Content.countDocuments();
    const totalRecommendations = await Recommendation.countDocuments();
    const premiumUsers = await User.countDocuments({ plan: 'premium' });

    // Additional breakdown metrics for better dashboard visualization
    const netflixCount = await Content.countDocuments({ source: 'netflix' });
    const youtubeCount = await Content.countDocuments({ source: 'youtube' });

    return success(res, 'Dashboard statistics retrieved successfully.', {
      totalUsers,
      totalContent,
      totalRecommendations,
      premiumUsers,
      breakdown: {
        netflixContent: netflixCount,
        youtubeContent: youtubeCount
      }
    }, 200);
  } catch (err) {
    next(err);
  }
};
