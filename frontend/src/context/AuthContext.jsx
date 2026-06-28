import React, { createContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true)
      try {
        const response = await api.get('/auth/me')
        if (response.data && response.data.data && response.data.data.user) {
          setUser(response.data.data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        // Session not found or expired is expected on fresh load
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const userData = response.data.data.user
      setUser(userData)
      return response
    } catch (err) {
      setUser(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const userData = response.data.data.user
      setUser(userData)
      return response
    } catch (err) {
      setUser(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setLoading(false)
      navigate('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
