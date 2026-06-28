import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index: userId + score descending
recommendationSchema.index({ userId: 1, score: -1 });

export default mongoose.model('Recommendation', recommendationSchema);
