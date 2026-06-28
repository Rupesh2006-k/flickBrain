import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RiFilmLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import { FcGoogle } from 'react-icons/fc'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [searchParams] = useSearchParams()

  const { login, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Login - FlickBrain'

    // Handle URL error param
    const errorParam = searchParams.get('error')
    if (errorParam === 'google_failed') {
      showToast('Google login failed. Try again.', 'error')
    } else if (errorParam === 'account_exists') {
      showToast('Account already exists. Please login.', 'error')
    }

    // Redirect if already logged in
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate, searchParams])

  const validate = () => {
    const newErrors = {}
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await login(email, password)
      showToast('Welcome back to FlickBrain!', 'success')
      navigate('/dashboard')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.'
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#7c3aed]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none" />

      {/* App Branding */}
      <div className="flex items-center gap-3 mb-8 select-none z-10 animate-fade-in">
        <div className="bg-[#7c3aed] p-2.5 rounded-xl text-white shadow-lg shadow-[#7c3aed]/20">
          <RiFilmLine className="w-8 h-8" />
        </div>
        <span className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-[#7c3aed] bg-clip-text text-transparent">
          FlickBrain
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#13131a] rounded-xl border-t-4 border-t-[#7c3aed] border-x border-b border-[#1e1e2e] shadow-2xl p-8 z-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1.5">Sign In</h2>
          <p className="text-[#94a3b8] text-sm">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="email">
              <RiMailLine className="w-4 h-4 text-[#94a3b8]" />
              <span>Email Address</span>
            </label>
            <input
              id="email"
              type="email"
              className={`input-field ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium mt-0.5">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="password">
              <RiLockLine className="w-4 h-4 text-[#94a3b8]" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input-field pr-10 ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-[#94a3b8] hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <RiEyeOffLine className="w-5 h-5" /> : <RiEyeLine className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-medium mt-0.5">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>Signing In...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5 select-none">
          <div className="flex-grow border-t border-[#1e1e2e]" />
          <span className="text-slate-500 text-sm font-medium">or</span>
          <div className="flex-grow border-t border-[#1e1e2e]" />
        </div>

        {/* Google OAuth Link */}
        <a href="http://localhost:3000/api/auth/google" className="block w-full">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-[#1a1a2e] hover:bg-[#16213e] border border-[#2e2e4e] hover:border-purple-500/40 text-white rounded-xl py-3 px-4 transition-all duration-200 text-sm font-medium pointer-events-none cursor-pointer"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </a>

        {/* Footer info */}
        <div className="mt-6 text-center text-sm">
          <span className="text-[#94a3b8]">Don't have an account? </span>
          <Link
            to="/register"
            className="text-[#7c3aed] font-semibold hover:underline hover:text-purple-400 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
