import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    enum: ['netflix', 'youtube'],
    required: true,
  },
  externalId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['movie', 'show', 'video'],
    required: true,
  },
  genre: {
    type: [String],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  poster: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
  releaseYear: {
    type: Number,
  },
  tmdbData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound unique index: externalId + source
contentSchema.index({ externalId: 1, source: 1 }, { unique: true });

export default mongoose.model('Content', contentSchema);
