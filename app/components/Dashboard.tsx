'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'
import DataViewer from './DataViewer'
import ChartViewer from './ChartViewer'

interface DashboardProps {
  token: string
  onLogout: () => void
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null)

  const handleUploadSuccess = (fileId: number) => {
    setUploadedFileId(fileId)
    setActiveTab('files')
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-content">
          <h1>POC1 Dashboard</h1>
          <div className="nav-links">
            <button
              onClick={() => setActiveTab('upload')}
              className={activeTab === 'upload' ? 'active' : ''}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={activeTab === 'files' ? 'active' : ''}
            >
              My Files
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={activeTab === 'data' ? 'active' : ''}
            >
              View Data
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={activeTab === 'charts' ? 'active' : ''}
            >
              Charts
            </button>
            <button onClick={onLogout} style={{ marginLeft: '20px', background: '#dc3545' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {activeTab === 'upload' && (
          <FileUpload token={token} onUploadSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'files' && (
          <FileList token={token} onFileSelect={setUploadedFileId} />
        )}
        {activeTab === 'data' && (
          <DataViewer token={token} fileId={uploadedFileId} />
        )}
        {activeTab === 'charts' && (
          <ChartViewer token={token} fileId={uploadedFileId} />
        )}
      </div>
    </div>
  )
}