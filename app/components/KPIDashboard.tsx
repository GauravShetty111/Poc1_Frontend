'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

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

export default function KPIDashboard() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [fileAnalytics, setFileAnalytics] = useState<FileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000';

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No access token');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  };

  const loadDashboard = async () => {
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

  const loadFileAnalytics = async (fileId: number) => {
    try {
      const fileData = await fetchWithAuth(`${API_BASE}/get-file-data/${fileId}`);
      setFileAnalytics(fileData);
    } catch (err) {
      console.error('Error loading file analytics:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg text-gray-600">Loading dashboard data...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  // Calculate KPIs from files data
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
  const today = new Date().toDateString();
  const filesToday = files.filter(file => new Date(file.uploaded_at).toDateString() === today).length;
  
  const fileTypes: Record<string, number> = {};
  files.forEach(file => {
    const type = file.mime_type || 'unknown';
    fileTypes[type] = (fileTypes[type] || 0) + 1;
  });

  const fileTypesChartData = {
    labels: Object.keys(fileTypes),
    datasets: [{
      data: Object.values(fileTypes),
      backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c']
    }]
  };

  const uploadTrendsChartData = {
    labels: [today],
    datasets: [{
      label: 'Files Uploaded',
      data: [filesToday],
      borderColor: '#3498db',
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-blue-600 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">📊 KPI Dashboard</h1>
          <p className="text-lg opacity-90">Complete overview of your data and file analytics</p>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-blue-500 hover:transform hover:-translate-y-1 transition-all">
              <div className="text-3xl font-bold text-gray-800 mb-2">{totalFiles}</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm">Total Files</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-green-500 hover:transform hover:-translate-y-1 transition-all">
              <div className="text-3xl font-bold text-gray-800 mb-2">{Math.round(totalSize / (1024 * 1024) * 100) / 100} MB</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm">Total Size</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-yellow-500 hover:transform hover:-translate-y-1 transition-all">
              <div className="text-3xl font-bold text-gray-800 mb-2">{filesToday}</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm">Files Today</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-purple-500 hover:transform hover:-translate-y-1 transition-all">
              <div className="text-3xl font-bold text-gray-800 mb-2">{Object.keys(fileTypes).length}</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm">File Types</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">File Types Distribution</h3>
              <div className="h-64">
                <Doughnut data={fileTypesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Upload Trends (Last 7 Days)</h3>
              <div className="h-64">
                <Line 
                  data={uploadTrendsChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">📁 Recent Files</h3>
              <div className="max-h-80 overflow-y-auto">
                {files.slice(0, 10).map((file) => (
                  <div 
                    key={file.file_id}
                    className="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => loadFileAnalytics(file.file_id)}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{file.original_name}</div>
                      <div className="text-sm text-gray-600">{Math.round(file.file_size / 1024)} KB • {file.mime_type}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">📈 File Analytics</h3>
              {fileAnalytics ? (
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">{fileAnalytics.filename}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{fileAnalytics.total_rows}</div>
                      <div className="text-sm text-gray-600 mt-1">Rows</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{fileAnalytics.columns.length}</div>
                      <div className="text-sm text-gray-600 mt-1">Columns</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{fileAnalytics.columns.filter(col => 
                        fileAnalytics.data.some(row => typeof row[col] === 'number')
                      ).length}</div>
                      <div className="text-sm text-gray-600 mt-1">Numeric</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{fileAnalytics.columns.filter(col => 
                        fileAnalytics.data.some(row => typeof row[col] === 'string')
                      ).length}</div>
                      <div className="text-sm text-gray-600 mt-1">Text</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">Click on a file to view detailed analytics</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}