import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  RiYoutubeFill,
  RiCheckboxCircleFill
} from 'react-icons/ri'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'

const Ingest = () => {
  const { user, setUser } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [syncingYoutube, setSyncingYoutube] = useState(false)
  const [syncingNetflix, setSyncingNetflix] = useState(false)

  useEffect(() => {
    document.title = 'Sync Accounts - FlickBrain'

    const errorParam = searchParams.get('error')
    if (errorParam === 'google_failed') {
      showToast('Google login failed. Try again.', 'error')
    }
  }, [searchParams])

  const handleSyncYoutube = async () => {
    setSyncingYoutube(true)
    try {
      const response = await api.post('/ingest/youtube')
      const count = response.data?.data?.count || response.data?.count || 0
      showToast(`YouTube history synced successfully! Ingested ${count} videos.`, 'success')
      
      // Refresh session info
      try {
        const meRes = await api.get('/auth/me')
        setUser(meRes.data.data.user || meRes.data.user || meRes.data)
      } catch (err) {}
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to sync YouTube history.'
      showToast(errorMsg, 'error')
    } finally {
      setSyncingYoutube(false)
    }
  }

  const handleSyncNetflix = async () => {
    setSyncingNetflix(true)
    try {
      const response = await api.post('/ingest/netflix/sync')
      const count = response.data?.data?.count || response.data?.count || 0
      showToast(`Netflix metadata synced successfully! Total ${count} titles in catalog.`, 'success')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to sync Netflix metadata.'
      showToast(errorMsg, 'error')
    } finally {
      setSyncingNetflix(false)
    }
  }

  const isYoutubeConnected = !!user?.youtubeToken

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-[#1e1e2e] pb-5 text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Sync Watch History
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Sync your media accounts to automatically build and enrich your personalized recommendation dashboard.
        </p>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Netflix Card Container */}
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-8 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="w-10 h-10 rounded-xl bg-[#e50914]/10 border border-[#e50914]/20 flex items-center justify-center font-bold text-[#e50914] text-lg select-none">
                N
              </span>
              <h2 className="text-xl font-bold text-white">Netflix Integration</h2>
            </div>

            <p className="text-sm text-[#94a3b8] leading-relaxed text-center max-w-md mx-auto">
              Sync Netflix catalog metadata including trending films, shows, and genres automatically matching your taste history.
            </p>

            <div className="flex items-center justify-center py-8 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl">
              <div className="text-center w-full px-4">
                <div className="flex flex-col items-center">
                  <RiCheckboxCircleFill className="w-16 h-16 text-[#10b981] mb-2 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-pulse" />
                  <span className="text-sm font-semibold text-[#10b981]">Netflix Sync Active</span>
                  <p className="text-xs text-[#94a3b8] mt-1">Automatic sync is enabled and ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e2e]">
            <button
              onClick={handleSyncNetflix}
              disabled={syncingNetflix}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#e50914] hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {syncingNetflix ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Syncing Netflix...</span>
                </>
              ) : (
                <span>Sync Now</span>
              )}
            </button>
          </div>
        </div>

        {/* YouTube Sync Card Container */}
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-8 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500">
                <RiYoutubeFill className="w-6 h-6 text-[#ff0000]" />
              </span>
              <h2 className="text-xl font-bold text-white">YouTube Integration</h2>
            </div>

            <p className="text-sm text-[#94a3b8] leading-relaxed text-center max-w-md mx-auto">
              Connect your Google / YouTube account to securely sync your video viewing history. This maps video metadata into our recommendation engine.
            </p>

            <div className="flex items-center justify-center py-8 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl">
              <div className="text-center w-full px-4">
                {isYoutubeConnected ? (
                  <div className="flex flex-col items-center">
                    <RiCheckboxCircleFill className="w-16 h-16 text-[#10b981] mb-2 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-pulse" />
                    <span className="text-sm font-semibold text-[#10b981]">YouTube Connected</span>
                    <p className="text-xs text-[#94a3b8] mt-1">Your YouTube watch history is fully linked</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <RiYoutubeFill className="w-16 h-16 text-[#ff0000] mb-2 filter drop-shadow-[0_0_8px_rgba(255,0,0,0.15)] animate-pulse" />
                    <span className="text-sm font-semibold text-white">Connect YouTube Account</span>
                    <p className="text-xs text-[#94a3b8] mt-1 max-w-xs mx-auto">
                      Sign in with the Google account linked to your YouTube to sync your watch history
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e2e]">
            {isYoutubeConnected ? (
              <div className="space-y-3">
                <button
                  onClick={handleSyncYoutube}
                  disabled={syncingYoutube}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl shadow-lg shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {syncingYoutube ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <span>Syncing YouTube...</span>
                    </>
                  ) : (
                    <span>Sync Now</span>
                  )}
                </button>
                <a
                  href="http://localhost:5000/api/auth/google"
                  className="text-xs text-slate-500 hover:text-[#7c3aed] transition-colors underline block text-center mt-3"
                >
                  Not your account? Reconnect
                </a>
              </div>
            ) : (
              <a
                href="http://localhost:5000/api/auth/google"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff0000] hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-900/20 transition-all text-center block text-sm cursor-pointer"
              >
                Connect via Google
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Ingest
