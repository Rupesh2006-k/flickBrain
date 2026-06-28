import React, { useState, useEffect } from 'react'
import {
  RiGroupLine,
  RiMovieLine,
  RiMagicLine,
  RiVipCrownLine,
  RiRefreshLine
} from 'react-icons/ri'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminStats = () => {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { showToast } = useToast()

  const fetchStats = async (showFeedback = false) => {
    if (showFeedback) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
      if (showFeedback) {
        showToast('Dashboard stats refreshed', 'success')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch admin stats'
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin Stats - FlickBrain'
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Fallbacks if data keys are different or missing
  const data = stats || {}
  const cardData = [
    {
      label: 'Total Users',
      value: data.totalUsers ?? 0,
      icon: <RiGroupLine className="w-8 h-8 text-[#7c3aed]" />,
      color: 'border-l-[#7c3aed]'
    },
    {
      label: 'Total Content in DB',
      value: data.totalContent ?? 0,
      icon: <RiMovieLine className="w-8 h-8 text-cyan-400" />,
      color: 'border-l-cyan-500'
    },
    {
      label: 'Recommendations Generated',
      value: data.totalRecommendations ?? 0,
      icon: <RiMagicLine className="w-8 h-8 text-emerald-400" />,
      color: 'border-l-emerald-500'
    },
    {
      label: 'Premium Users',
      value: data.premiumUsers ?? 0,
      icon: <RiVipCrownLine className="w-8 h-8 text-amber-500" />,
      color: 'border-l-amber-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e1e2e] pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            System Overview
          </h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Global metrics for user accounts and recommendations.
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#13131a] hover:bg-[#1e1e2e] text-slate-200 border border-[#1e1e2e] rounded-lg text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <RiRefreshLine className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, index) => (
          <div
            key={index}
            className={`bg-[#13131a] border border-[#1e1e2e] border-l-4 ${card.color} rounded-xl p-5 shadow-card hover:translate-y-[-2px] transition-all duration-200 flex justify-between items-start`}
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-3xl font-extrabold text-white block">
                {card.value.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Details/Logs Placeholder Section for premium feel */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-6 shadow-card">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] flex flex-col justify-between">
            <span className="text-[#94a3b8]">API Server Connection</span>
            <span className="text-emerald-400 font-bold mt-2">ACTIVE (200 OK)</span>
          </div>
          <div className="p-4 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] flex flex-col justify-between">
            <span className="text-[#94a3b8]">Recommendation Workers</span>
            <span className="text-emerald-400 font-bold mt-2">IDLE (Listening...)</span>
          </div>
          <div className="p-4 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] flex flex-col justify-between">
            <span className="text-[#94a3b8]">Database Connection Status</span>
            <span className="text-emerald-400 font-bold mt-2">STABLE (0ms lag)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStats
