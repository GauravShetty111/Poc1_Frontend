'use client'

import { useState, useEffect } from 'react'
import Login from './components/Login'
import CompleteDashboard from './components/CompleteDashboard'

export default function Home() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || localStorage.getItem('access_token')
    if (savedToken) {
      setToken(savedToken)
    }
    setLoading(false)
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
    localStorage.setItem('access_token', newToken) // For compatibility
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      {token ? (
        <div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
            <button 
              onClick={handleLogout}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
          <CompleteDashboard />
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

