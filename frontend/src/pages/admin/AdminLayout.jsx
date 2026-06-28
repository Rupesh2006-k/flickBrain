import React, { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  RiFilmLine,
  RiDashboardLine,
  RiGroupLine,
  RiArrowGoBackLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine
} from 'react-icons/ri'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      showToast('Logged out successfully', 'success')
      navigate('/login')
      setIsMobileMenuOpen(false)
    } catch (err) {
      showToast('Logout failed. Please try again.', 'error')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const adminLinks = [
    { to: '/admin/stats', label: 'Dashboard Stats', icon: <RiDashboardLine className="w-5 h-5" /> },
    { to: '/admin/users', label: 'User Directory', icon: <RiGroupLine className="w-5 h-5" /> }
  ]

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Admin Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1e1e2e]">
          <div className="bg-[#7c3aed] p-2 rounded-lg text-white">
            <RiFilmLine className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white block">FlickBrain</span>
            <span className="text-[10px] tracking-wider text-[#7c3aed] font-bold block -mt-1">ADMIN PORTAL</span>
          </div>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-1.5">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#13131a]'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}

          {/* Switch back to Main App link */}
          <div className="pt-4 mt-4 border-t border-[#1e1e2e]">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-[#13131a] transition-all duration-200"
            >
              <RiArrowGoBackLine className="w-5 h-5 text-[#7c3aed]" />
              <span>Back to App</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Admin Logged In Details */}
      {user && (
        <div className="p-4 border-t border-[#1e1e2e] bg-[#0a0a0f]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-semibold text-sm">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">SysAdmin</p>
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
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex">
      {/* Desktop Sidebar (Left side, fixed) */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-60 bg-[#0d0d14] border-r border-[#1e1e2e] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d0d14]/90 backdrop-blur-md border-b border-[#1e1e2e] flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-[#7c3aed] p-1.5 rounded-lg text-white">
            <RiFilmLine className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block">FlickBrain</span>
            <span className="text-[8px] text-[#7c3aed] font-bold block uppercase -mt-1">Admin</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#13131a]"
          aria-label="Open Admin Menu"
        >
          <RiMenuLine className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-[#0d0d14] border-r border-[#1e1e2e] flex flex-col shadow-2xl animate-slide-in pointer-events-auto">
            <div className="flex justify-end p-4 border-b border-[#1e1e2e]">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#13131a]"
                aria-label="Close Admin Menu"
              >
                <RiCloseLine className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Admin Content Area */}
      <main className="flex-grow md:pl-60 p-6 md:p-8 min-h-screen overflow-x-hidden pt-20 md:pt-8 w-full">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
