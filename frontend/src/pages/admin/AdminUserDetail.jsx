import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  RiArrowLeftLine,
  RiUserLine,
  RiVipCrownLine,
  RiCalendarLine,
  RiMailLine,
  RiFileListLine,
  RiStarFill,
  RiSparklingLine,
  RiShieldUserLine
} from 'react-icons/ri'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminUserDetail = () => {
  const { id } = useParams()
  const [detailUser, setDetailUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  const fetchUserDetail = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/admin/users/${id}`)
      const data = response.data?.user || response.data
      setDetailUser(data)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch user profile details'
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Inspect User - FlickBrain'
    fetchUserDetail()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!detailUser) {
    return (
      <div className="space-y-4">
        <Link to="/admin/users" className="flex items-center gap-1 text-[#7c3aed] hover:underline text-sm font-semibold">
          <RiArrowLeftLine className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        <div className="text-center p-8 bg-[#13131a] rounded-xl border border-[#1e1e2e]">
          <p className="text-rose-400 font-semibold">User record not found or inaccessible.</p>
        </div>
      </div>
    )
  }

  const isPremium = detailUser.plan?.toLowerCase() === 'premium'
  const stats = detailUser.stats || {
    totalWatched: detailUser.totalWatched || 0,
    totalRated: detailUser.totalRated || 0,
    recommendationsReceived: detailUser.recommendationsReceived || 0
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="space-y-2 border-b border-[#1e1e2e] pb-5">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <RiUserLine className="text-[#7c3aed]" />
          <span>Inspect User Record</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* User Card */}
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-6 shadow-card flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 text-slate-200 border border-[#1e1e2e] flex items-center justify-center text-2xl font-bold mb-4">
            {detailUser.name ? detailUser.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{detailUser.name}</h2>
          <div className="flex items-center gap-1 text-xs text-[#94a3b8] mb-4">
            <RiMailLine className="w-3.5 h-3.5" />
            <span>{detailUser.email}</span>
          </div>

          <div className="w-full space-y-3 pt-5 border-t border-[#1e1e2e] text-left text-xs text-[#94a3b8]">
            <div className="flex justify-between">
              <span>Account Status</span>
              <span className="text-emerald-400 font-bold uppercase">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Subscription Tier</span>
              {isPremium ? (
                <span className="text-amber-400 font-bold uppercase flex items-center gap-0.5">
                  <RiVipCrownLine className="w-3.5 h-3.5" /> Premium
                </span>
              ) : (
                <span className="text-slate-400 font-semibold uppercase">Free</span>
              )}
            </div>
            <div className="flex justify-between">
              <span>Access Role</span>
              <span className="text-[#c084fc] font-bold uppercase flex items-center gap-0.5">
                <RiShieldUserLine className="w-3.5 h-3.5" /> {detailUser.role || 'user'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#1e1e2e]/55">
              <span className="flex items-center gap-1">
                <RiCalendarLine className="w-3.5 h-3.5" /> Joined on
              </span>
              <span className="text-slate-300 font-semibold">
                {new Date(detailUser.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* User Stats/Data Insights */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-white">Usage Analytics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 shadow-card flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed]">
                <RiFileListLine className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">{stats.totalWatched}</span>
                <span className="text-xs text-[#94a3b8]">Titles Watched</span>
              </div>
            </div>

            <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 shadow-card flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <RiStarFill className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">{stats.totalRated}</span>
                <span className="text-xs text-[#94a3b8]">Titles Rated</span>
              </div>
            </div>

            <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5 shadow-card flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <RiSparklingLine className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">{stats.recommendationsReceived}</span>
                <span className="text-xs text-[#94a3b8]">Picks Received</span>
              </div>
            </div>
          </div>

          {/* User History Sync details */}
          <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-6 shadow-card">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Integrations Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg">
                <div>
                  <span className="text-sm font-semibold text-white block">Netflix CSV Import</span>
                  <span className="text-xs text-[#94a3b8]">Manual viewing activity ingestion</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg">
                <div>
                  <span className="text-sm font-semibold text-white block">YouTube API Sync</span>
                  <span className="text-xs text-[#94a3b8]">OAuth sync connection</span>
                </div>
                {detailUser.youtubeToken ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Not Linked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUserDetail
