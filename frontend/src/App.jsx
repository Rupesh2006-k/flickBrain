import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

// Providers
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Hooks
import useAuth from './hooks/useAuth'

// Route Guards
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

// Core Layout & Shared Components
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'

// User Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import Ingest from './pages/Ingest'
import Profile from './pages/Profile'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminStats from './pages/admin/AdminStats'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'

// Root Redirect component
const HomeRedirect = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

// User App Layout
const UserLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-grow md:pl-60 min-h-screen flex flex-col w-full">
        <Navbar />
        {/* Main Content Area */}
        <main className="flex-grow p-6 md:p-8 pt-24 md:pt-8 w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const AppContent = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected User Routes */}
      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/ingest" element={<Ingest />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        {/* /admin redirects to /admin/stats */}
        <Route index element={<Navigate to="/admin/stats" replace />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
      </Route>

      {/* Wildcard 404 redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App