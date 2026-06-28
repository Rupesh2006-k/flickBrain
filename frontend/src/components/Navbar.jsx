import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  RiMenuLine,
  RiCloseLine,
  RiFilmLine,
  RiHomeLine,
  RiBookmarkLine,
  RiUploadLine,
  RiUserLine,
  RiLogoutBoxRLine,
  RiSettings4Line
} from 'react-icons/ri'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      showToast('Logged out successfully', 'success')
      navigate('/login')
      setIsOpen(false)
    } catch (err) {
      showToast('Logout failed. Please try again.', 'error')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <RiHomeLine className="w-5 h-5" /> },
    { to: '/watchlist', label: 'Watchlist', icon: <RiBookmarkLine className="w-5 h-5" /> },
    { to: '/ingest', label: 'Sync Accounts', icon: <RiUploadLine className="w-5 h-5" /> },
    { to: '/profile', label: 'Profile', icon: <RiUserLine className="w-5 h-5" /> },
  ]

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d0d14]/90 backdrop-blur-md border-b border-[#1e1e2e] flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-[#7c3aed] p-1.5 rounded-lg text-white">
            <RiFilmLine className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white">FlickBrain</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#13131a]"
          aria-label="Open Menu"
        >
          <RiMenuLine className="w-6 h-6" />
        </button>
      </header>

      {/* Slide-in Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-[#0d0d14] border-r border-[#1e1e2e] flex flex-col justify-between shadow-2xl animate-slide-in pointer-events-auto">
            <div>
              {/* Header inside drawer */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e1e2e]">
                <div className="flex items-center gap-3">
                  <div className="bg-[#7c3aed] p-2 rounded-lg text-white">
                    <RiFilmLine className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-white">FlickBrain</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#13131a]"
                  aria-label="Close Menu"
                >
                  <RiCloseLine className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="p-4 space-y-1.5">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#7c3aed] text-white shadow-md'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#13131a]'
                      }`
                    }
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                ))}

                {/* Admin panel redirect inside drawer */}
                {user && user.role === 'admin' && (
                  <div className="pt-4 mt-4 border-t border-[#1e1e2e]">
                    <NavLink
                      to="/admin/stats"
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#13131a]'
                        }`
                      }
                    >
                      <RiSettings4Line className="w-5 h-5 text-[#7c3aed]" />
                      <span>Admin Panel</span>
                    </NavLink>
                  </div>
                )}
              </nav>
            </div>

            {/* User details at bottom of drawer */}
            {user && (
              <div className="p-4 border-t border-[#1e1e2e] bg-[#0a0a0f]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-semibold text-sm">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-[#94a3b8] truncate capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/30 rounded-lg border border-rose-950/30 transition-all cursor-pointer"
                >
                  <RiLogoutBoxRLine className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
