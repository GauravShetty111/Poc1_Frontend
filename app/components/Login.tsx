'use client'

import { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

interface LoginProps {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      await axios.post(`${API_BASE}/register`, { email, password })
      setMessage('Registration successful! Check your email for OTP.')
      setShowOtp(true)
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await axios.post(`${API_BASE}/verify-otp`, { email, otp })
      setMessage('Email verified! You can now login.')
      setShowOtp(false)
      setIsLogin(true)
      setOtp('')
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'OTP verification failed')
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password })
      onLogin(response.data.access_token)
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    setResendLoading(true)
    setMessage('')
    
    try {
      await axios.post(`${API_BASE}/resend-otp`, { email })
      setMessage('OTP resent successfully! Check your email.')
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to resend OTP')
    }
    setResendLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', border: '1px solid #ddd', padding: '40px', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#000', fontSize: '2rem' }}>
          {isLogin ? 'Login' : 'Register'}
        </h2>
        
        {message && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.includes('success') || message.includes('verified') ? '#f8f9fa' : '#f8f9fa',
            color: '#000',
            border: '1px solid #ddd'
          }}>
            {message}
          </div>
        )}

        {showOtp ? (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000', fontWeight: '500' }}>Enter OTP sent to your email:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '12px', background: '#000', color: 'white', border: 'none', padding: '12px', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={handleResendOtp} 
              disabled={resendLoading}
              style={{ 
                width: '100%', 
                background: '#666', 
                color: 'white', 
                border: 'none', 
                padding: '10px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              {resendLoading ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000', fontWeight: '500' }}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000', fontWeight: '500' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: '#000', color: 'white', border: 'none', padding: '12px', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
              setShowOtp(false)
              setOtp('')
            }}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Need to register?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  )
}