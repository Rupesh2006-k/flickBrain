import mongoose from 'mongoose';

const watchedItemSchema = new mongoose.Schema({
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
  source: {
    type: String,
    enum: ['netflix', 'youtube'],
    required: true,
  },
  watchedAt: {
    type: Date,
    default: Date.now,
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  completed: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound unique index: userId + contentId
watchedItemSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export default mongoose.model('WatchedItem', watchedItemSchema);
