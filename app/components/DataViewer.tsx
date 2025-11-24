'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

const API_BASE = 'http://localhost:8000'

interface DataViewerProps {
  token: string
  fileId: number | null
}

interface DataResponse {
  data: any[]
  total_rows: number
  returned_rows: number
  columns: string[]
}

export default function DataViewer({ token, fileId }: DataViewerProps) {
  const [data, setData] = useState<DataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const gridRef = useRef<AgGridReact>(null)

  const fetchData = async () => {
    if (!fileId) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.get(`${API_BASE}/get-file-data/${fileId}?limit=1000&offset=0`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setData(response.data)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch data')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (fileId) {
      fetchData()
    }
  }, [fileId])

  const columnDefs = useMemo(() => {
    if (!data) return []
    return data.columns.map(col => ({
      field: col,
      headerName: col,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      resizable: true,
    }))
  }, [data])

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const onQuickFilterChanged = () => {
    if (gridRef.current) {
      gridRef.current.api.setQuickFilter(searchText)
    }
  }

  useEffect(() => {
    onQuickFilterChanged()
  }, [searchText])

  if (!fileId) {
    return (
      <div className="card">
        <h2>Data Viewer</h2>
        <p>Please select a CSV file from "My Files" to view data.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Data Viewer - {data?.filename || `File ID: ${fileId}`}</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : data ? (
        <>
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
            <strong>Total Rows:</strong> {data.total_rows.toLocaleString()} | 
            <strong> Showing:</strong> {data.returned_rows} rows
          </div>

          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '300px'
              }}
            />
            <button
              onClick={() => setSearchText('')}
              style={{
                padding: '8px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={data.data}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={50}
              animateRows={true}
              rowSelection="multiple"
              suppressMenuHide={true}
              enableRangeSelection={true}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}