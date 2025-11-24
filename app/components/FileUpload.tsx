'use client'

import { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

interface FileUploadProps {
  token: string
  onUploadSuccess: (fileId: number) => void
}

export default function FileUpload({ token, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage('Please select a file')
      return
    }

    setLoading(true)
    setMessage('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE}/upload-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setMessage('File uploaded successfully to PostgreSQL database!')
      onUploadSuccess(response.data.file_id)
      
      // Reset form
      setFile(null)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Upload failed')
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h2>Upload File </h2>
      
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select File (Any Type):</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          {file && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading to PostgreSQL...' : 'Upload File'}
        </button>
      </form>
    </div>
  )
}