import WatchedItem from '../models/WatchedItem.model.js';
import Content from '../models/Content.model.js';

// Helper to extract keywords from title (excluding short and common words)
const extractKeywords = (title) => {
  if (!title) return [];
  const commonWords = new Set([
    'with', 'this', 'that', 'from', 'your', 'about', 'their', 'there', 'here',
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'video', 'youtube', 'channel', 'playlist', 'watch', 'episode', 'series', 'season'
  ]);
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(word => word.length >= 4 && !commonWords.has(word));
};

export const generateScores = async (userId) => {
  try {
    // Step 1: Fetch user's watched items
    const watchedItems = await WatchedItem.find({ userId })
      .populate('contentId')
      .sort({ watchedAt: -1 })
      .limit(100);

    const watchedContentIds = watchedItems
      .map(w => (w.contentId ? w.contentId._id.toString() : null))
      .filter(Boolean);

    // Edge Case: If user has no watched items, return 20 random Content docs with score 50
    if (watchedItems.length === 0) {
      const randomDocs = await Content.aggregate([{ $sample: { size: 20 } }]).catch(() => []);
      let fallbackDocs = randomDocs;
      if (fallbackDocs.length === 0) {
        fallbackDocs = await Content.find().limit(20);
      }
      return fallbackDocs.map(doc => ({
        contentId: doc._id,
        score: 50,
        title: doc.title,
        content: doc
      }));
    }

    // Step 2: Build taste profile from watched content
    const genreFreq = {};
    const tagFreq = {};
    const watchedSources = new Set();

    watchedItems.forEach(item => {
      const content = item.contentId;
      if (!content) return;

      if (content.source) {
        watchedSources.add(content.source);
      }

      let hasTasteMetadata = false;

      if (content.genre && Array.isArray(content.genre) && content.genre.length > 0) {
        content.genre.forEach(g => {
          genreFreq[g] = (genreFreq[g] || 0) + 1;
        });
        hasTasteMetadata = true;
      }

      if (content.tags && Array.isArray(content.tags) && content.tags.length > 0) {
        content.tags.forEach(t => {
          tagFreq[t] = (tagFreq[t] || 0) + 1;
        });
        hasTasteMetadata = true;
      }

      // YouTube videos or titles without tags/genres -> Extract keywords from title
      if (!hasTasteMetadata && content.title) {
        const keywords = extractKeywords(content.title);
        keywords.forEach(k => {
          tagFreq[k] = (tagFreq[k] || 0) + 1;
        });
      }
    });

    const maxGenreFreq = Math.max(...Object.values(genreFreq), 1);
    const maxTagFreq = Math.max(...Object.values(tagFreq), 1);

    // Step 3: Fetch candidate content not yet watched by user
    let candidates = await Content.find({ _id: { $nin: watchedContentIds } }).limit(200);
    if (candidates.length === 0) {
      candidates = await Content.find().limit(200);
    }
    if (candidates.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Step 4: Score each candidate
    const scoredCandidates = candidates.map(candidate => {
      // a) genreScore (0-1)
      const candidateGenres = candidate.genre || [];
      const matchingGenres = candidateGenres.filter(g => genreFreq[g]);
      const genreScore = matchingGenres.length > 0
        ? matchingGenres.reduce((sum, g) => sum + genreFreq[g], 0) / maxGenreFreq
        : 0;

      // b) tagScore (0-1)
      const candidateTags = candidate.tags || [];
      const candidateKeywords = extractKeywords(candidate.title);
      const combinedCandidateTags = [...new Set([...candidateTags, ...candidateKeywords])];
      const matchingTags = combinedCandidateTags.filter(t => tagFreq[t]);
      const tagScore = matchingTags.length > 0
        ? matchingTags.reduce((sum, t) => sum + (tagFreq[t] || 0), 0) / maxTagFreq
        : 0;

      // c) titleKeywordScore (0-1)
      const matchingTitleKeywords = candidateKeywords.filter(k => tagFreq[k]);
      const titleKeywordScore = candidateKeywords.length > 0
        ? Math.min(1, matchingTitleKeywords.length / candidateKeywords.length)
        : 0;

      // d) recencyBonus (0-1)
      const addedAt = candidate.createdAt || new Date();
      const recencyBonus = addedAt > thirtyDaysAgo ? 0.3 : 0;

      // e) sourceBonus
      const sourceBonus = watchedSources.has(candidate.source) ? 0.1 : 0;

      // f) FINAL SCORE calculation
      let finalScore = (
        (genreScore * 0.30) +
        (tagScore * 0.25) +
        (titleKeywordScore * 0.25) +
        (recencyBonus * 0.15) +
        (sourceBonus * 0.05)
      ) * 100;

      // g) MINIMUM SCORE GUARANTEE (Assign random score between 40-70 if final is 0)
      if (finalScore === 0) {
        finalScore = Math.floor(Math.random() * 31) + 40;
      }

      return {
        contentId: candidate._id,
        score: Math.round(finalScore) || 50,
        title: candidate.title,
        content: candidate
      };
    });

    // Step 5: Return all scored candidates sorted by score
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates;

  } catch (err) {
    console.error('❌ Error in generateScores:', err.message);
    return [];
  }
};
