import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  RiFilmLine,
  RiHomeLine,
  RiBookmarkLine,
  RiUploadLine,
  RiUserLine,
  RiSettings4Line
} from 'react-icons/ri'
import useAuth from '../hooks/useAuth'

const Sidebar = () => {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const getInitials = (name) => {
    if (!name) return 'FB'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: <RiHomeLine className="w-5 h-5" /> },
    { path: '/watchlist', label: 'Watchlist', icon: <RiBookmarkLine className="w-5 h-5" /> },
    { path: '/ingest', label: 'Sync Accounts', icon: <RiUploadLine className="w-5 h-5" /> },
    { path: '/profile', label: 'Profile', icon: <RiUserLine className="w-5 h-5" /> },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-[#0d0d14] border-r border-[#1e1e2e] flex-col justify-between z-30">
      {/* Brand Logo & Name */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1e1e2e]">
          <div className="bg-[#7c3aed] p-2 rounded-lg text-white shadow-lg shadow-[#7c3aed]/20">
            <RiFilmLine className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-[#7c3aed] bg-clip-text text-transparent">
            FlickBrain
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {links.map((link) => {
            const isActive = pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600/20 text-white border-l-2 border-purple-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          })}

          {/* Admin link if user is admin */}
          {user && user.role === 'admin' && (
            <div className="pt-4 mt-4 border-t border-[#1e1e2e]">
              <Link
                to="/admin/stats"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-600/20 text-white border-l-2 border-purple-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <RiSettings4Line className="w-5 h-5 text-[#7c3aed]" />
                <span>Admin Panel</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* User Info bottom */}
      {user && (
        <div className="p-4 border-t border-[#1e1e2e] bg-[#0a0a0f] flex items-center gap-3 min-w-0">
          {/* Avatar initials */}
          <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-semibold text-sm shadow-md shadow-[#7c3aed]/25 flex-shrink-0">
            {getInitials(user.name)}
          </div>
          
          {/* Details */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5" title={user.email}>{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
