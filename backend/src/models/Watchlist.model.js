import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  watched: {
    type: Boolean,
    default: false,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index: userId + watched
watchlistSchema.index({ userId: 1, watched: 1 });
// Compound index to ensure uniqueness per user/content combination
watchlistSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema);
