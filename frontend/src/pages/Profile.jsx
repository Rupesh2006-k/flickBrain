import React, { useEffect } from 'react'
import { RiLogoutBoxLine } from 'react-icons/ri'
import useAuth from '../hooks/useAuth'

const Profile = () => {
  const { user, logout } = useAuth()

  useEffect(() => {
    document.title = 'Profile - FlickBrain'
  }, [])

  // Helper to extract first two initials
  const getInitials = (name) => {
    if (!name) return 'FB'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  // Helper to format date as "Month Year"
  const formatMemberDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      {/* Title */}
      <div className="border-b border-[#1e1e2e] pb-5 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Manage your subscription and accounts
        </p>
      </div>

      {/* Main card */}
      {user && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-8 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
          {/* Accent glow top */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#7c3aed] to-indigo-500" />

          {/* User info header section */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Initials Avatar circle */}
            <div className="w-20 h-20 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-[#7c3aed]/10 select-none">
              {getInitials(user.name)}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {user.name}
              </h2>
              <p className="text-[#94a3b8] text-sm font-medium">
                {user.email}
              </p>
            </div>

            {/* Plan Badge */}
            {user.plan === 'premium' ? (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wider bg-gradient-to-r from-yellow-600 to-amber-500 text-white shadow-md shadow-amber-900/10">
                PREMIUM SUBSCRIBER
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                FREE MEMBER
              </span>
            )}
          </div>

          {/* Stats section */}
          <div className="border-t border-b border-[#1e1e2e] py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Account Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Member Since</span>
              <span className="text-slate-200 font-medium">
                {formatMemberDate(user.createdAt)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Sync Status</span>
              <span className="text-slate-200 font-medium">
                {user.youtubeToken ? (
                  <span className="text-purple-400">YouTube Linked</span>
                ) : (
                  <span className="text-slate-500">YouTube Disconnected</span>
                )}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 py-3 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-950/20 text-rose-400 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <RiLogoutBoxLine className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Profile
