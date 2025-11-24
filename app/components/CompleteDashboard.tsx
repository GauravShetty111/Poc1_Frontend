'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface FileData {
  file_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface FileAnalytics {
  data: any[];
  total_rows: number;
  columns: string[];
  filename: string;
}

export default function CompleteDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState<FileData[]>([]);
  const [fileAnalytics, setFileAnalytics] = useState<FileAnalytics | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000';

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No access token');

    console.log('Making request to:', url);
    console.log('Using token:', token.substring(0, 20) + '...');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    return response.json();
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await fetchWithAuth(`${API_BASE}/list-files-db`);
      setFiles(fileList.files || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadFileData = async (fileId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading file data for ID:', fileId);
      const fileData = await fetchWithAuth(`${API_BASE}/get-file-data/${fileId}`);
      console.log('File data loaded:', fileData);
      setFileAnalytics(fileData);
      setSelectedFile(fileId);
    } catch (err) {
      console.error('Error loading file data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file data');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadLoading(true);
      setUploadMessage(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setUploadMessage(`File "${result.filename}" uploaded successfully!`);
      loadFiles(); // Refresh file list
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const generateChart = (fileId: number, chartType: string, xColumn: string, yColumn?: string) => {
    if (!fileAnalytics || fileAnalytics.data.length === 0) {
      console.error('No file data available for chart generation');
      return;
    }

    try {
      const data = fileAnalytics.data;
      
      if (chartType === 'pie') {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          const value = String(row[xColumn] || 'Unknown');
          counts[value] = (counts[value] || 0) + 1;
        });
        
        setChartData({
          chart_type: 'pie',
          data: Object.entries(counts).map(([label, value]) => ({ label, value }))
        });
      } else if (chartType === 'bar' || chartType === 'line') {
        if (!yColumn) {
          console.error('Y column required for bar/line charts');
          return;
        }
        
        const xValues = data.map(row => String(row[xColumn] || '')).slice(0, 20);
        const yValues = data.map(row => {
          const val = row[yColumn];
          return typeof val === 'number' ? val : parseFloat(val) || 0;
        }).slice(0, 20);
        
        setChartData({
          chart_type: chartType,
          x: xValues,
          y: yValues,
          x_column: xColumn,
          y_column: yColumn
        });
      }
    } catch (err) {
      console.error('Error generating chart:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
  const today = new Date().toDateString();
  const filesToday = files.filter(file => new Date(file.uploaded_at).toDateString() === today).length;
  
  const fileTypes: Record<string, number> = {};
  files.forEach(file => {
    const type = file.mime_type || 'unknown';
    fileTypes[type] = (fileTypes[type] || 0) + 1;
  });

  const fileTypesPlotData = {
    values: Object.values(fileTypes),
    labels: Object.keys(fileTypes),
    type: 'pie' as const,
    marker: { colors: ['#000', '#333', '#666', '#999', '#ccc', '#eee'] }
  };

  const renderChart = () => {
    if (!chartData) return null;

    const layout = {
      autosize: true,
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#000' }
    };

    const config = { responsive: true, displayModeBar: false };

    switch (chartData.chart_type) {
      case 'pie':
        return <Plot
          data={[{
            values: chartData.data.map((d: any) => d.value),
            labels: chartData.data.map((d: any) => d.label),
            type: 'pie',
            marker: { colors: ['#000', '#333', '#666', '#999', '#ccc'] }
          }]}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
        />;
      case 'bar':
        return <Plot
          data={[{
            x: chartData.x,
            y: chartData.y,
            type: 'bar',
            marker: { color: '#000' },
            name: chartData.y_column
          }]}
          layout={{ ...layout, xaxis: { title: chartData.x_column }, yaxis: { title: chartData.y_column } }}
          config={config}
          style={{ width: '100%', height: '100%' }}
        />;
      case 'line':
        return <Plot
          data={[{
            x: chartData.x,
            y: chartData.y,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#000' },
            name: chartData.y_column
          }]}
          layout={{ ...layout, xaxis: { title: chartData.x_column }, yaxis: { title: chartData.y_column } }}
          config={config}
          style={{ width: '100%', height: '100%' }}
        />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #f3f3f3', 
            borderTop: '3px solid #000', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite', 
            margin: '0 auto 20px' 
          }}></div>
          <h3>Loading dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', background: 'white', border: '1px solid #ddd', overflow: 'hidden' }}>
          <div style={{ background: '#000', color: 'white', padding: '30px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}> Dashboard</h1>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa' }}>
            {[
              { id: 'dashboard', label: 'KPI Dashboard' },
              { id: 'upload', label: 'Upload File' },
              { id: 'files', label: 'Files' },
              { id: 'data', label: 'View Data' },
              { id: 'charts', label: 'Charts' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '15px 25px',
                  border: 'none',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#000' : '#666',
                  borderBottom: activeTab === tab.id ? '3px solid #000' : 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '30px' }}>
            {activeTab === 'dashboard' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: '#f8f9fa', padding: '25px', border: '1px solid #ddd', textAlign: 'center', borderLeft: '5px solid #000' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>{totalFiles}</div>
                    <div style={{ color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Files</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '25px', border: '1px solid #ddd', textAlign: 'center', borderLeft: '5px solid #000' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>{Math.round(totalSize / (1024 * 1024) * 100) / 100} MB</div>
                    <div style={{ color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Size</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '25px', border: '1px solid #ddd', textAlign: 'center', borderLeft: '5px solid #000' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>{filesToday}</div>
                    <div style={{ color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Files Today</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '25px', border: '1px solid #ddd', textAlign: 'center', borderLeft: '5px solid #000' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>{Object.keys(fileTypes).length}</div>
                    <div style={{ color: '#666', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>File Types</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', padding: '25px', border: '1px solid #ddd' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#000', marginBottom: '20px', textAlign: 'center' }}>File Types Distribution</h3>
                    <div style={{ height: '300px' }}>
                      <Plot
                        data={[fileTypesPlotData]}
                        layout={{
                          autosize: true,
                          margin: { l: 20, r: 20, t: 20, b: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          showlegend: true,
                          font: { color: '#000' }
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '25px', border: '1px solid #ddd' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#000', marginBottom: '20px', textAlign: 'center' }}>Recent Files</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {files.slice(0, 10).map((file) => (
                        <div key={file.file_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #ddd', cursor: 'pointer' }} onClick={() => loadFileData(file.file_id)}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#000' }}>{file.original_name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{Math.round(file.file_size / 1024)} KB - {file.mime_type}</div>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>{new Date(file.uploaded_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#000' }}>Upload File</h2>
                <div style={{ background: 'white', padding: '30px', border: '1px solid #ddd', maxWidth: '600px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h3 style={{ color: '#000', marginBottom: '10px' }}>Select a file to upload</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Supported formats: CSV files only</p>
                  </div>
                  
                  <div style={{ 
                    border: '2px dashed #ddd', 
                    padding: '40px', 
                    textAlign: 'center', 
                    marginBottom: '20px',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    <input 
                      id="fileInput"
                      type="file" 
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.name.toLowerCase().endsWith('.csv')) {
                          uploadFile(file);
                        } else {
                          setUploadMessage('Please select a CSV file only');
                        }
                      }}
                    />
                    <div style={{ fontSize: '3rem', color: '#ddd', marginBottom: '10px' }}>+</div>
                    <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '5px' }}>Click to select file</p>
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>or drag and drop here</p>
                  </div>
                  
                  {uploadLoading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ 
                        width: '30px', 
                        height: '30px', 
                        border: '3px solid #f3f3f3', 
                        borderTop: '3px solid #000', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite', 
                        margin: '0 auto 10px' 
                      }}></div>
                      <p style={{ color: '#666' }}>Uploading...</p>
                    </div>
                  )}
                  
                  {uploadMessage && (
                    <div style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      background: uploadMessage.includes('successfully') ? '#f8f9fa' : '#f8f9fa',
                      color: uploadMessage.includes('successfully') ? '#000' : '#000',
                      textAlign: 'center',
                      marginTop: '20px'
                    }}>
                      {uploadMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#000' }}>File Manager</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {files.map((file) => (
                    <div key={file.file_id} style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
                      <h4 style={{ color: '#000', marginBottom: '10px' }}>{file.original_name}</h4>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Size: {Math.round(file.file_size / 1024)} KB</p>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>Type: {file.mime_type}</p>
                      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}</p>
                      <button onClick={() => { loadFileData(file.file_id); setActiveTab('data'); }} style={{ background: '#000', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', marginRight: '10px' }}>View Data</button>
                      <button onClick={() => { loadFileData(file.file_id); setActiveTab('charts'); }} style={{ background: '#666', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>Create Chart</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#000' }}>View Data</h2>
                {error && (
                  <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '15px', marginBottom: '20px', color: '#000' }}>
                    Error: {error}
                  </div>
                )}
                {fileAnalytics ? (
                  <div>
                    <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', marginBottom: '20px' }}>
                      <h3 style={{ color: '#000', marginBottom: '15px' }}>{fileAnalytics.filename}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>{fileAnalytics.total_rows}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Rows</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>{fileAnalytics.columns.length}</div>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Columns</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #ddd', height: '500px' }} className="ag-theme-alpine">
                      <AgGridReact
                        rowData={fileAnalytics.data}
                        columnDefs={fileAnalytics.columns.map(col => ({ field: col, headerName: col, sortable: true, filter: true }))}
                        defaultColDef={{ resizable: true, minWidth: 100 }}
                        pagination={true}
                        paginationPageSize={20}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', padding: '50px' }}>Select a file from the File Manager to view its data</p>
                )}
              </div>
            )}

            {activeTab === 'charts' && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#000' }}>Charts</h2>
                {error && (
                  <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '15px', marginBottom: '20px', color: '#000' }}>
                    Error: {error}
                  </div>
                )}
                {selectedFile && fileAnalytics ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                    <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
                      <h3 style={{ marginBottom: '15px', color: '#000' }}>Chart Options</h3>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>File: {fileAnalytics.filename}</p>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#000' }}>Chart Type:</label>
                        <select id="chartType" style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}>
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#000' }}>X Column:</label>
                        <select id="xColumn" style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}>
                          {fileAnalytics.columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#000' }}>Y Column (for Bar/Line):</label>
                        <select id="yColumn" style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}>
                          <option value="">Select Y Column</option>
                          {fileAnalytics.columns.filter(col => 
                            fileAnalytics.data.some(row => typeof row[col] === 'number' || !isNaN(parseFloat(row[col])))
                          ).map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const chartType = (document.getElementById('chartType') as HTMLSelectElement).value;
                          const xColumn = (document.getElementById('xColumn') as HTMLSelectElement).value;
                          const yColumn = (document.getElementById('yColumn') as HTMLSelectElement).value;
                          generateChart(selectedFile, chartType, xColumn, yColumn || undefined);
                        }}
                        style={{ width: '100%', background: '#000', color: 'white', border: 'none', padding: '12px', cursor: 'pointer', fontSize: '16px' }}
                      >
                        Generate Chart
                      </button>
                    </div>
                    <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd' }}>
                      <h3 style={{ marginBottom: '15px', color: '#000' }}>Chart Preview</h3>
                      <div style={{ height: '400px' }}>
                        {chartData ? renderChart() : <p style={{ textAlign: 'center', color: '#666', paddingTop: '150px' }}>Select columns and generate a chart to see preview</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', padding: '50px' }}>Select a file and view its data first, then create charts</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}