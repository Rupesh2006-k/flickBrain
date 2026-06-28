import axios from 'axios';
import WatchedItem from '../models/WatchedItem.model.js';

export const rerank = async (userId, candidates) => {
  try {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Step 1 — Fetch user's last 10 watched titles
    const items = await WatchedItem.find({ userId })
      .populate('contentId', 'title')
      .sort({ watchedAt: -1 })
      .limit(10);
    
    const watchedTitles = items.map(w => w.contentId?.title).filter(Boolean);

    // Step 2 — If Groq API key missing OR candidates empty
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || watchedTitles.length === 0) {
      return candidates.map(c => ({
        contentId: c.contentId.toString(),
        score: c.score,
        reason: 'Recommended based on your watch history'
      }));
    }

    // Only send the top 20 candidates to the LLM for ranking to prevent token limit crashes
    const itemsToRerank = candidates.slice(0, 20);
    const otherItems = candidates.slice(20);

    // Step 3 — Call Groq API
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are a content recommendation assistant. Always respond with valid JSON only. No explanation.'
          },
          {
            role: 'user',
            content: `User recently watched: ${watchedTitles.join(', ')}
        
Rank these content items by predicted enjoyment and give a short reason why.
Return ONLY a JSON array like this:
[
  { "contentId": "...", "score": 85, "reason": "Because you watched..." },
  ...
]

Content to rank:
${itemsToRerank.map(c => `- ID: ${c.contentId} | Title: ${c.title} | Score: ${c.score}`).join('\n')}

Return all ${itemsToRerank.length} items ranked. JSON only, no markdown.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Step 4 — Parse Groq response safely
    const responseText = response.data?.choices?.[0]?.message?.content || '';
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const fallbackOthers = otherItems.map(c => ({
      contentId: c.contentId.toString(),
      score: c.score,
      reason: 'Recommended based on your watch history'
    }));

    try {
      const ranked = JSON.parse(cleaned);
      if (!Array.isArray(ranked)) throw new Error('Not an array');
      return [...ranked, ...fallbackOthers];
    } catch {
      // Groq returned bad JSON — fallback to original order with default reason
      return candidates.map(c => ({
        contentId: c.contentId.toString(),
        score: c.score,
        reason: 'Recommended based on your watch history'
      }));
    }

  } catch (err) {
    console.error('Groq rerank failed:', err.message);
    return candidates.map(c => ({
      contentId: c.contentId.toString(),
      score: c.score,
      reason: 'Recommended based on your watch history'
    }));
  }
};
