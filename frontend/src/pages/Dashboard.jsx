import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RiRefreshLine, RiMovieLine } from 'react-icons/ri'
import api from '../api/axios'
import useToast from '../hooks/useToast'
import ContentCard from '../components/ContentCard'

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const { showToast } = useToast()

  const fetchRecommendations = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await api.get('/recommend')
      const rawRecs = res.data?.data?.recommendations || []
      const validRecs = rawRecs.filter(r => r.contentId)
      setRecommendations(validRecs)
    } catch (err) {
      console.error(err)
      setError('Failed to load recommendations')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Dashboard - FlickBrain'
    fetchRecommendations()
  }, [])

  const handleDismiss = async (recId) => {
    try {
      await api.post(`/recommend/dismiss/${recId}`)
      setRecommendations(prev => prev.filter(r => r._id !== recId))
      showToast('Recommendation dismissed.', 'info')
    } catch (err) {
      showToast('Failed to dismiss recommendation.', 'error')
    }
  }

  const handleRate = async (contentId, rating) => {
    try {
      await api.post(`/recommend/rate/${contentId}`, { rating })
      showToast('Rating updated successfully!', 'success')
      
      // Update local state to reflect rating
      setRecommendations(prev => prev.map(rec => {
        if (rec.contentId?._id === contentId) {
          return {
            ...rec,
            userRating: rating,
            contentId: { ...rec.contentId, userRating: rating }
          }
        }
        return rec
      }))
    } catch (err) {
      showToast('Failed to update rating.', 'error')
      throw err
    }
  }

  const handleAddToWatchlist = async (contentId) => {
    try {
      await api.post('/watchlist', { contentId, priority: 'medium' })
      showToast('Added to watchlist!', 'success')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add to watchlist.'
      showToast(errorMsg, 'error')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRecommendations(true)
    setRefreshing(false)
    showToast('Recommendations updated!', 'success')
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Row */}
      <div className="flex justify-between items-center border-b border-[#1e1e2e] pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Today's Picks
          </h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Based on your watch history
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="p-2.5 rounded-xl bg-[#13131a] border border-[#1e1e2e] hover:border-[#7c3aed]/40 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RiRefreshLine className={`w-5 h-5 ${refreshing ? 'animate-spin text-[#7c3aed]' : ''}`} />
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 h-[220px] animate-pulse flex flex-col justify-between">
              <div className="flex gap-3">
                <div className="w-16 h-24 bg-slate-800 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded w-full mt-4" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-800 rounded w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State Card */
        <div className="flex flex-col items-center justify-center py-16 bg-[#13131a] border border-[#1e1e2e] rounded-xl">
          <p className="text-rose-400 font-semibold mb-4">{error}</p>
          <button
            onClick={() => fetchRecommendations()}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        /* Empty State Card */
        <div className="flex flex-col items-center justify-center text-center p-12 bg-[#13131a] border border-[#1e1e2e] rounded-xl max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 bg-purple-950/40 border border-purple-900/30 rounded-2xl flex items-center justify-center text-[#7c3aed] mb-5">
            <RiMovieLine className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No recommendations yet</h2>
          <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">
            Sync your YouTube account in the ingest portal to populate your dashboard and personalize your feed.
          </p>
          <Link
            to="/ingest"
            className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-950/20"
          >
            Import Watch History
          </Link>
        </div>
      ) : (
        /* Recommendations Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map(rec => (
            <ContentCard
              key={rec._id}
              rec={rec}
              onDismiss={() => handleDismiss(rec._id)}
              onRate={(rating) => handleRate(rec.contentId?._id, rating)}
              onAddToWatchlist={() => handleAddToWatchlist(rec.contentId?._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
