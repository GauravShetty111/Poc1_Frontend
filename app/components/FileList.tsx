'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

interface FileListProps {
  token: string
  onFileSelect: (fileId: number) => void
}

interface FileItem {
  file_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export default function FileList({ token, onFileSelect }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFiles = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.get(`${API_BASE}/list-files-db`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setFiles(response.data.files)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch files')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isCSV = (mimeType: string) => {
    return mimeType && mimeType.toLowerCase().includes('csv')
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Files </h2>
        <button onClick={fetchFiles} className="btn btn-secondary">
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading files...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No files uploaded yet.</p>
          <p>Upload a file to get started!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>File Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Size</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Uploaded</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.file_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <strong>{file.original_name}</strong>
                      {isCSV(file.mime_type) && (
                        <span style={{ 
                          marginLeft: '8px', 
                          padding: '2px 6px', 
                          background: '#28a745', 
                          color: 'white', 
                          fontSize: '12px', 
                          borderRadius: '3px' 
                        }}>
                          CSV
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {file.file_id}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {file.mime_type || 'Unknown'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatFileSize(file.file_size)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {formatDate(file.uploaded_at)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isCSV(file.mime_type) ? (
                      <button
                        onClick={() => onFileSelect(file.file_id)}
                        className="btn btn-primary"
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        View Data
                      </button>
                    ) : (
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        Non-CSV file
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}