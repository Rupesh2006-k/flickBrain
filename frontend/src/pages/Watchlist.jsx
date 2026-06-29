import React, { useState, useEffect } from 'react'
import { RiYoutubeFill, RiCheckLine, RiDeleteBinLine, RiCheckboxCircleFill, RiBookmarkLine, RiMagicLine, RiLoader5Line, RiCloseLine } from 'react-icons/ri'
import api from '../api/axios'
import useToast from '../hooks/useToast'

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('towatch')
  const { showToast } = useToast()

  const [aiLoading, setAiLoading] = useState(false)
  const [aiStep, setAiStep] = useState('')
  const [aiResults, setAiResults] = useState(null)

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

  const handleAiRecommend = async () => {
    setAiLoading(true)
    setAiStep('Scanning trending lists on the internet...')
    
    // Set periodic steps for UX
    const step1 = setTimeout(() => setAiStep('Analyzing popular YouTube videos...'), 1000)
    const step2 = setTimeout(() => setAiStep('Fetching TMDB movie charts...'), 2000)
    const step3 = setTimeout(() => setAiStep('Evaluating likes and views with Groq AI...'), 3500)
    const step4 = setTimeout(() => setAiStep('Matching with your watch history...'), 5000)

    try {
      const res = await api.post('/recommend/auto-watchlist')
      const addedItems = res.data?.data?.addedItems || []
      
      if (addedItems.length === 0) {
        showToast('All suggested AI recommendations are already in your watchlist!', 'info')
      } else {
        setAiResults(addedItems)
        showToast('AI recommendations added successfully!', 'success')
        fetchWatchlist()
      }
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || 'Failed to generate AI recommendations.'
      showToast(errorMsg, 'error')
    } finally {
      clearTimeout(step1)
      clearTimeout(step2)
      clearTimeout(step3)
      clearTimeout(step4)
      setAiLoading(false)
      setAiStep('')
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

      {/* AI Recommendation Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#7c3aed]/30 bg-gradient-to-r from-purple-950/20 via-[#13131a] to-blue-950/10 p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 hover:border-[#7c3aed]/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/5 blur-3xl rounded-full -mr-10 -mt-10" />
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] shadow-lg shadow-purple-950/20 animate-pulse">
            <RiMagicLine className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base md:text-lg flex items-center gap-1.5">
              FlickBrain AI Recommendation Bot
              <span className="text-[10px] bg-[#7c3aed]/30 text-purple-200 border border-[#7c3aed]/50 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Groq Enabled
              </span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl mt-1 leading-relaxed">
              Let AI scan the internet for trending videos, movies, and shows matching your unique taste. The AI will evaluate likes, views, and ratings, then automatically add the top 3 picks to your <strong>To Watch</strong> list.
            </p>
          </div>
        </div>
        <button
          onClick={handleAiRecommend}
          disabled={aiLoading}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:from-[#6d28d9] hover:to-[#4338ca] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40 disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0"
        >
          {aiLoading ? (
            <>
              <RiLoader5Line className="w-4 h-4 animate-spin text-white" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <RiMagicLine className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Auto-Fill with AI</span>
            </>
          )}
        </button>
      </div>

      {/* AI Processing Status Overlay */}
      {aiLoading && aiStep && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-[#13131a] border border-[#1e1e2e] rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-950/50" />
              <div className="absolute inset-0 rounded-full border-4 border-[#7c3aed] border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#7c3aed]">
                <RiMagicLine className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-bold text-lg animate-pulse">AI Watchlist Assistant</h3>
              <p className="text-slate-400 text-sm h-10 flex items-center justify-center transition-all duration-300">
                {aiStep}
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#7c3aed] h-full rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendation Success Modal */}
      {aiResults && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13131a] border border-[#1e1e2e] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950/40 via-[#13131a] to-blue-950/20 p-5 border-b border-[#1e1e2e] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed]">
                  <RiMagicLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">AI Auto-Added Items</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{aiResults.length} {aiResults.length === 1 ? 'item' : 'items'} added to your Watchlist</p>
                </div>
              </div>
              <button
                onClick={() => setAiResults(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Recommendations List */}
            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-slate-300 text-xs md:text-sm">
                FlickBrain's AI selected these items from popular trending content on the web based on your watch history:
              </p>
              
              <div className="space-y-4">
                {aiResults.map((item, idx) => {
                  const content = item.watchlistItem?.contentId;
                  const reason = item.reason;
                  const title = content?.title || 'Untitled Content';
                  const poster = content?.poster;
                  const source = content?.source;

                  return (
                    <div 
                      key={item.watchlistItem?._id || idx}
                      className="p-4 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl flex gap-4 items-start"
                    >
                      {/* Poster */}
                      <div className="flex-shrink-0">
                        {poster ? (
                          <img
                            src={poster}
                            alt={title}
                            className="w-12 h-16 object-cover rounded-lg border border-[#1e1e2e]"
                          />
                        ) : (
                          <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${getGradientClass(source)} flex items-center justify-center text-sm font-bold text-white border border-[#1e1e2e]`}>
                            {title.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content details and AI reason */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-white font-semibold text-sm truncate" title={title}>
                            {title}
                          </h4>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0">
                            {source === 'youtube' ? (
                              <>
                                <RiYoutubeFill className="w-3.5 h-3.5 text-[#ff0000]" />
                                <span>YouTube</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[#e50914] font-extrabold text-[10px]">N</span>
                                <span>Netflix</span>
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="mt-2.5 bg-[#13131a] border-l-2 border-[#7c3aed] px-3 py-2 rounded-r-lg text-[11px] md:text-xs text-purple-200/90 leading-relaxed font-medium">
                          <span className="font-bold text-[#7c3aed] text-[10px] uppercase tracking-wider block mb-0.5">AI Reason:</span>
                          "{reason}"
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0a0a0f]/50 border-t border-[#1e1e2e] flex justify-end">
              <button
                onClick={() => setAiResults(null)}
                className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Awesome, view watchlist
              </button>
            </div>
          </div>
        </div>
      )}

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
