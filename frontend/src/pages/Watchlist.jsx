import React, { useState, useEffect } from 'react'
import { RiYoutubeFill, RiCheckLine, RiDeleteBinLine, RiCheckboxCircleFill, RiBookmarkLine } from 'react-icons/ri'
import api from '../api/axios'
import useToast from '../hooks/useToast'

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('towatch')
  const { showToast } = useToast()

  const fetchWatchlist = async () => {
    setLoading(true)
    try {
      const res = await api.get('/watchlist')
      const rawList = res.data?.data?.watchlist || []
      const validList = rawList.filter(w => w.contentId)
      setWatchlist(validList)
    } catch (err) {
      showToast('Failed to retrieve your watchlist.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Watchlist - FlickBrain'
    fetchWatchlist()
  }, [])

  const handleMarkWatched = async (id) => {
    try {
      await api.patch(`/watchlist/${id}`)
      setWatchlist(prev =>
        prev.map(item => (item._id === id ? { ...item, watched: true } : item))
      )
      showToast('Marked as watched!', 'success')
    } catch (err) {
      showToast('Failed to update watchlist item.', 'error')
    }
  }

  const handleRemove = async (id) => {
    try {
      await api.delete(`/watchlist/${id}`)
      setWatchlist(prev => prev.filter(item => item._id !== id))
      showToast('Removed from watchlist.', 'info')
    } catch (err) {
      showToast('Failed to remove watchlist item.', 'error')
    }
  }

  const toWatch = watchlist.filter(w => !w.watched)
  const watched = watchlist.filter(w => w.watched)
  const activeItems = activeTab === 'towatch' ? toWatch : watched

  const getGradientClass = (source) => {
    if (source === 'youtube') return 'from-red-900 to-red-700'
    if (source === 'netflix') return 'from-red-800 to-black'
    return 'from-purple-900 to-purple-700'
  }

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'high') return 'bg-red-900/40 text-red-300 border border-red-500/20'
    if (priority === 'low') return 'bg-green-900/40 text-green-300 border border-green-500/20'
    return 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/20'
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-[#1e1e2e] pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          My Watchlist
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Save candidates to watch later or review completed lists
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-[#1e1e2e] gap-6 text-sm">
        <button
          onClick={() => setActiveTab('towatch')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeTab === 'towatch'
              ? 'border-b-2 border-[#7c3aed] text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          To Watch ({toWatch.length})
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeTab === 'watched'
              ? 'border-b-2 border-[#7c3aed] text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Watched ({watched.length})
        </button>
      </div>

      {/* Watchlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(n => (
            <div key={n} className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 h-[120px] animate-pulse flex gap-4">
              <div className="w-16 h-full bg-slate-800 rounded-lg flex-shrink-0" />
              <div className="flex-grow space-y-3 py-1">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activeItems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 bg-[#13131a] border border-[#1e1e2e] rounded-xl text-center max-w-md mx-auto mt-6">
          <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-[#7c3aed] mb-4">
            <RiBookmarkLine className="w-6 h-6" />
          </div>
          <p className="text-slate-300 font-semibold text-sm">
            {activeTab === 'towatch'
              ? 'Nothing to watch — add from recommendations'
              : 'No watched items yet'}
          </p>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {activeItems.map(item => {
            const content = item.contentId
            const title = content?.title || 'Untitled Content'
            const poster = content?.poster
            const source = content?.source
            const externalId = content?.externalId
            const priority = item.priority || 'medium'

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

            return (
              <div
                key={item._id}
                className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 shadow-lg hover:shadow-[#7c3aed]/5 transition-all duration-300 flex items-center gap-4 relative overflow-hidden"
              >
                {/* Poster image or colored placeholder */}
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
                          alt={title}
                          className="w-16 h-20 object-cover rounded-lg border border-[#1e1e2e]"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-16 h-20 rounded-lg bg-gradient-to-br ${getGradientClass(source)} flex items-center justify-center text-xl font-bold text-white border border-[#1e1e2e]`}>
                          {title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </a>
                  ) : (
                    poster ? (
                      <img
                        src={poster}
                        alt={title}
                        className="w-16 h-20 object-cover rounded-lg border border-[#1e1e2e]"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-16 h-20 rounded-lg bg-gradient-to-br ${getGradientClass(source)} flex items-center justify-center text-xl font-bold text-white border border-[#1e1e2e]`}>
                        {title.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0 pr-12">
                  {watchLink ? (
                    <a
                      href={watchLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors block text-left"
                      title="Watch content in another tab"
                    >
                      <h3 className="text-white hover:text-purple-400 font-semibold text-sm truncate">
                        {title}
                      </h3>
                    </a>
                  ) : (
                    <h3 className="text-white font-semibold text-sm truncate" title={title}>
                      {title}
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
                        <span className="text-[#e50914] font-extrabold text-xs">N</span>
                        <span>Netflix</span>
                      </>
                    ) : (
                      <span>Content</span>
                    )}
                  </div>

                  {/* Priority Badge */}
                  {!item.watched && (
                    <span className={`inline-block text-[10px] px-2 py-0.5 mt-2 rounded font-semibold uppercase tracking-wider ${getPriorityBadgeClass(priority)}`}>
                      {priority}
                    </span>
                  )}
                </div>

                {/* Right Side Action Controls */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Mark as Watched button */}
                  {activeTab === 'towatch' ? (
                    <button
                      onClick={() => handleMarkWatched(item._id)}
                      className="p-2 text-slate-400 hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-all cursor-pointer"
                      title="Mark as watched"
                    >
                      <RiCheckLine className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="p-2 text-[#10b981]" title="Watched">
                      <RiCheckboxCircleFill className="w-5 h-5" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="p-2 text-slate-500 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <RiDeleteBinLine className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Watchlist
