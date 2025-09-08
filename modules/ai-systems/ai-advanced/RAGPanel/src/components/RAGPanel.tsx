import React, { useState, useEffect } from 'react';
import { Upload, Search, Activity, FileText, AlertCircle, CheckCircle  } from '@mui/icons-material';

interface RAGHealth {
  status: string;
  ollama_healthy: boolean;
  embedding_healthy: boolean;
  document_count: number;
  query_count: number;
  storage_type: string;
  timestamp: string;
}

interface RAGStats {
  document_count: number;
  query_count: number;
  storage_type: string;
  version: string;
}

interface QueryResult {
  answer: string;
  sources: Array<{
    metadata: any;
    content_preview: string;
  }>;
  confidence: number;
  query_time_ms: number;
}

const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8080';

export const RAGPanel: React.FC = () => {
  const [health, setHealth] = useState<RAGHealth | null>(null);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch health status
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${RAG_API_URL}/health`);
        const data = await response.json();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch health:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${RAG_API_URL}/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setQueryResult(null);

    try {
      const response = await fetch(`${RAG_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query, n_results: 5 }),
      });

      const data = await response.json();
      setQueryResult(data);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('source', 'gui_upload');

    try {
      const response = await fetch(`${RAG_API_URL}/add_document`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadStatus({
          success: true,
          message: `Document uploaded successfully (ID: ${data.document_id?.substring(0, 8)}...)`,
        });
        setUploadFile(null);
        // Refresh stats to show new document count
        const statsResponse = await fetch(`${RAG_API_URL}/stats`);
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        setUploadStatus({
          success: false,
          message: data.error || 'Upload failed',
        });
      }
    } catch (error) {
      setUploadStatus({
        success: false,
        message: 'Network error during upload',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Terrafusion RAG Knowledge Base
      </h2>

      {/* Health Status */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center"><>

            <Activity className="mr-2" size={20} />
            System Health
          </h3>
          <div
</>
className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            health?.status === 'healthy' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {health?.status === 'healthy' ? (
              <CheckCircle size={16} className="mr-1" />
            ) : (
              <AlertCircle size={16} className="mr-1" />
            )}
            {health?.status || 'Unknown'}
          </div>
        </div>
        
        {health && (
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><>

              <span className="text-gray-600 dark:text-gray-400">Ollama:</span>
              <span
</>
className={`ml-2 font-medium ${
                health.ollama_healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {health.ollama_healthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div><>

              <span className="text-gray-600 dark:text-gray-400">Embeddings:</span>
              <span
</>
className={`ml-2 font-medium ${
                health.embedding_healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {health.embedding_healthy ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            <div><>

              <span className="text-gray-600 dark:text-gray-400">Storage:</span>
              <span
</>
className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                {health.storage_type}
              </span>
            </div>
            <div><>

              <span className="text-gray-600 dark:text-gray-400">Documents:</span>
              <span
</>
className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                {stats?.document_count || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><>

          <Upload className="mr-2" size={20} />
          Upload Document
        </h3>
        
        <div
</>
className="flex items-center space-x-4">
          <input
            type="file"
            accept=".txt,.md,.json,.csv"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
          />
          <button
            onClick={handleFileUpload}
            disabled={!uploadFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        
        {uploadStatus && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            uploadStatus.success 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
              : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
          }`}>
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* Query Interface */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><>

          <Search className="mr-2" size={20} />
          Query Knowledge Base
        </h3>
        
        <div
</>
className="flex space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleQuery}
            disabled={!query.trim() || isQuerying}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isQuerying ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Query Results */}
      {queryResult && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><>

            <FileText className="mr-2" size={20} />
            Results
          </h3>
          
          <div
</>
className="space-y-4">
            <div><>

              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Answer:</h4>
              <p
</>
className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                {queryResult.answer}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400"><>

              <span>Confidence: {(queryResult.confidence * 100).toFixed(1)}%</span>
              <span
</>
</>>Query time: {queryResult.query_time_ms}ms</span>
              <span>Sources: {queryResult.sources.length}</span>
            </div>
            
            {queryResult.sources.length > 0 && (
              <div><>

                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sources:</h4>
                <div
</>
className="space-y-2">
                  {queryResult.sources.map((source, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <p className="text-gray-700 dark:text-gray-300">{source.content_preview}</p>
                      {source.metadata.filename && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          Source: {source.metadata.filename}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};