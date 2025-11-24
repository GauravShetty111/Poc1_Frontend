'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'

// Dynamic import with proper typing
const Plot = dynamic(
  () => import('react-plotly.js').catch(() => ({ default: () => <div>Loading chart...</div> })),
  { 
    ssr: false,
    loading: () => <div className="loading">Loading chart component...</div>
  }
)

const API_BASE = 'http://localhost:8000'

interface ChartViewerProps {
  token: string
  fileId: number | null
}

interface ChartData {
  chart_type: string
  x?: any[]
  y?: any[]
  data?: { label: string; value: number }[]
  x_column?: string
  y_column?: string
}

export default function ChartViewer({ token, fileId }: ChartViewerProps) {
  const [columns, setColumns] = useState<string[]>([])
  const [chartType, setChartType] = useState('line')
  const [xColumn, setXColumn] = useState('')
  const [yColumn, setYColumn] = useState('')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plotlyLoaded, setPlotlyLoaded] = useState(false)

  useEffect(() => {
    // Check if Plotly is available
    const checkPlotly = async () => {
      try {
        await import('react-plotly.js')
        setPlotlyLoaded(true)
      } catch (e) {
        console.warn('Plotly not available, install with: npm install plotly.js react-plotly.js')
      }
    }
    checkPlotly()
  }, [])

  useEffect(() => {
    if (fileId) {
      fetchColumns()
    }
  }, [fileId])

  const fetchColumns = async () => {
    try {
      const response = await axios.get(`${API_BASE}/get-file-columns/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setColumns(response.data.columns)
      if (response.data.columns.length > 0) {
        setXColumn(response.data.columns[0])
        if (response.data.columns.length > 1) {
          setYColumn(response.data.columns[1])
        }
      }
    } catch (error: any) {
      setError('Failed to fetch columns')
    }
  }

  const generateChart = async () => {
    if (!fileId || !xColumn) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file_id', fileId.toString())
      formData.append('chart_type', chartType)
      formData.append('x_column', xColumn)
      if (chartType !== 'pie' && yColumn) {
        formData.append('y_column', yColumn)
      }

      const response = await axios.post(`${API_BASE}/generate-chart-db`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setChartData(response.data)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate chart')
    }
    setLoading(false)
  }

  const renderChart = () => {
    if (!chartData || !plotlyLoaded) return null

    const layout = {
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart - File ID: ${fileId}`,
      autosize: true,
      margin: { l: 50, r: 50, t: 50, b: 50 },
    }

    if (chartData.chart_type === 'pie' && chartData.data) {
      const data = [{
        type: 'pie' as const,
        labels: chartData.data.map(item => item.label),
        values: chartData.data.map(item => item.value),
        hole: 0.3,
      }]
      
      return (
        <Plot
          data={data}
          layout={layout}
          style={{ width: '100%', height: '500px' }}
          useResizeHandler={true}
        />
      )
    }

    if (chartData.x && chartData.y) {
      let data: any[] = []

      switch (chartData.chart_type) {
        case 'line':
          data = [{
            type: 'scatter',
            mode: 'lines+markers',
            x: chartData.x,
            y: chartData.y,
            name: chartData.y_column || 'Y Values',
            line: { color: '#1f77b4' }
          }]
          break
        case 'bar':
          data = [{
            type: 'bar',
            x: chartData.x,
            y: chartData.y,
            name: chartData.y_column || 'Y Values',
            marker: { color: '#1f77b4' }
          }]
          break
        case 'scatter':
          data = [{
            type: 'scatter',
            mode: 'markers',
            x: chartData.x,
            y: chartData.y,
            name: `${chartData.x_column} vs ${chartData.y_column}`,
            marker: { color: '#1f77b4', size: 8 }
          }]
          break
      }

      const extendedLayout = {
        ...layout,
        xaxis: { title: chartData.x_column || 'X Axis' },
        yaxis: { title: chartData.y_column || 'Y Axis' }
      }

      return (
        <Plot
          data={data}
          layout={extendedLayout}
          style={{ width: '100%', height: '500px' }}
          useResizeHandler={true}
        />
      )
    }

    return null
  }

  if (!fileId) {
    return (
      <div className="card">
        <h2>Chart Viewer</h2>
        <p>Please select a CSV file from "My Files" to create charts.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Chart Viewer - File ID: {fileId}</h2>
      
      {!plotlyLoaded && (
        <div className="alert alert-error">
          Plotly.js not installed. Run: <code>npm install plotly.js react-plotly.js @types/plotly.js</code>
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label>Chart Type:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>

        <div className="form-group">
          <label>X Column:</label>
          <select value={xColumn} onChange={(e) => setXColumn(e.target.value)}>
            <option value="">Select column</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {chartType !== 'pie' && (
          <div className="form-group">
            <label>Y Column:</label>
            <select value={yColumn} onChange={(e) => setYColumn(e.target.value)}>
              <option value="">Select column</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button 
        className="btn btn-primary" 
        onClick={generateChart}
        disabled={loading || !xColumn || (chartType !== 'pie' && !yColumn) || !plotlyLoaded}
      >
        {loading ? 'Generating Chart...' : 'Generate Chart'}
      </button>

      {chartData && plotlyLoaded && (
        <div style={{ marginTop: '30px' }}>
          {renderChart()}
        </div>
      )}
    </div>
  )
}