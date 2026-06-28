import React from 'react'
import { RiYoutubeFill, RiBookmarkLine, RiCloseLine } from 'react-icons/ri'
import RatingStars from './RatingStars'

const ContentCard = ({ rec, onDismiss, onRate, onAddToWatchlist }) => {
  const { _id, score, reason, contentId } = rec || {}
  const { title, source, genre, tags, poster, externalId } = contentId || {}

  // Determine poster gradients for placeholder
  const getGradientClass = () => {
    if (source === 'youtube') return 'from-red-900 to-red-700'
    if (source === 'netflix') return 'from-red-800 to-black'
    return 'from-purple-900 to-purple-700'
  };

  // Determine watch link based on source
  const getWatchLink = () => {
    if (source === 'youtube' && externalId) {
      return `https://www.youtube.com/watch?v=${externalId}`;
    }
    if (source === 'netflix' && title) {
      return `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
    }
    return null;
  };

  const watchLink = getWatchLink();

  // Determine which badges/genres to display (max 2)
  const displayBadges = (genre && genre.length > 0) 
    ? genre.slice(0, 2) 
    : (tags && tags.length > 0) ? tags.slice(0, 2) : [];

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 shadow-lg hover:shadow-[#7c3aed]/5 transition-all duration-300 flex flex-col justify-between">
      <div className="flex gap-3">
        {/* Left Side: Poster or Placeholder */}
        <div className="flex-shrink-0">
          {watchLink ? (
            <a 
              href={watchLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block cursor-pointer hover:opacity-85 transition-opacity"
              title="Watch content in another tab"
            >
              {poster ? (
                <img 
                  src={poster} 
                  alt={title || 'Content'} 
                  className="w-16 h-24 object-cover rounded-lg border border-[#1e1e2e]" 
                  loading="lazy"
                />
              ) : (
                <div className={`w-16 h-24 rounded-lg bg-gradient-to-br ${getGradientClass()} flex items-center justify-center text-2xl font-bold text-white border border-[#1e1e2e]`}>
                  {title ? title.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </a>
          ) : (
            poster ? (
              <img 
                src={poster} 
                alt={title || 'Content'} 
                className="w-16 h-24 object-cover rounded-lg border border-[#1e1e2e]" 
                loading="lazy"
              />
            ) : (
              <div className={`w-16 h-24 rounded-lg bg-gradient-to-br ${getGradientClass()} flex items-center justify-center text-2xl font-bold text-white border border-[#1e1e2e]`}>
                {title ? title.charAt(0).toUpperCase() : '?'}
              </div>
            )
          )}
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Title */}
            {watchLink ? (
              <a 
                href={watchLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-purple-400 transition-colors block text-left"
                title="Watch content in another tab"
              >
                <h3 className="text-white hover:text-purple-400 font-semibold text-sm leading-tight line-clamp-2 hover:line-clamp-none transition-all duration-200">
                  {title || 'Untitled Video'}
                </h3>
              </a>
            ) : (
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:line-clamp-none transition-all duration-200" title={title}>
                {title || 'Untitled Video'}
              </h3>
            )}

            {/* Source */}
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              {source === 'youtube' ? (
                <>
                  <RiYoutubeFill className="w-4 h-4 text-[#ff0000]" />
                  <span>YouTube</span>
                </>
              ) : source === 'netflix' ? (
                <>
                  <span className="text-[#e50914] font-extrabold text-sm leading-none">N</span>
                  <span>Netflix</span>
                </>
              ) : (
                <span>Content</span>
              )}
            </div>

            {/* Tags/Genres */}
            {displayBadges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayBadges.map((badge, idx) => (
                  <span key={idx} className="bg-purple-950/40 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Score Indicator */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400">Match</span>
              <span className="text-purple-400 font-semibold">{score || 50}%</span>
            </div>
            <div className="w-full bg-[#1e1e2e] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-purple-500 rounded-full h-full transition-all duration-500" 
                style={{ width: `${score || 50}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reason Row */}
      {reason && (
        <div 
          className="mt-3 py-1.5 px-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-slate-400 italic truncate" 
          title={reason}
        >
          💡 {reason}
        </div>
      )}

      {/* Bottom Actions Row */}
      <div className="mt-4 pt-3 border-t border-[#1e1e2e] flex items-center justify-between">
        {/* Rating component */}
        <RatingStars 
          contentId={contentId?._id} 
          onRate={onRate} 
          currentRating={rec.userRating || contentId?.userRating || 0} 
        />

        {/* Watchlist and Dismiss Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddToWatchlist}
            className="text-slate-400 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-purple-950/20 cursor-pointer"
            title="Add to watchlist"
          >
            <RiBookmarkLine className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-rose-950/20 cursor-pointer"
            title="Not interested"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
