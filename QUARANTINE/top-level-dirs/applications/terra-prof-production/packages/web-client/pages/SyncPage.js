/**
 * Sync Page Component
 * Allows users to synchronize uploaded data with the system
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import { useApp } from '../contexts/AppContext';

/**
 * Sync Page Component
 * @returns {JSX.Element} Sync page component
 */
const SyncPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast, setIsLoading } = useApp();
  
  // Get uploaded files from location state or set empty array
  const [files, setFiles] = useState(location.state?.uploadedFiles || []);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResults, setSyncResults] = useState(null);
  
  // If there are no files and no results, suggest going to upload page
  const noFilesToSync = files.length === 0 && syncResults === null;

  // Simulate sync process
  const handleSync = async () => {
    if (files.length === 0) {
      addToast({
        message: 'No files to synchronize',
        type: 'warning'
      });
      return;
    }

    setSyncStatus('syncing');
    setSyncProgress(0);

    try {
      // Start the sync process
      const syncInterval = setInterval(() => {
        setSyncProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 100) {
            clearInterval(syncInterval);
            return 100;
          }
          return newProgress;
        });
      }, 500);

      // Simulate API call with artificial delay
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Successfully synchronized data',
            syncedFiles: files,
            stats: {
              processed: files.length,
              created: Math.floor(files.length * 0.6),
              updated: Math.floor(files.length * 0.3),
              failed: Math.floor(files.length * 0.1)
            }
          });
        }, 3000);
      });

      // Ensure progress is at 100% before showing results
      setTimeout(() => {
        clearInterval(syncInterval);
        setSyncProgress(100);
        setSyncResults(response);
        setSyncStatus('success');
        
        addToast({
          message: response.message,
          type: 'success'
        });
      }, 500);

    } catch (error) {
      setSyncStatus('error');
      addToast({
        message: error.message || 'Failed to synchronize data',
        type: 'error'
      });
    }
  };

  // Reset sync state
  const handleReset = () => {
    setSyncStatus('idle');
    setSyncProgress(0);
    setSyncResults(null);
    setFiles([]);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Synchronize Data</h1>
        <p className="page-description">
          Synchronize your uploaded files with the system database.
        </p>
      </div>

      {noFilesToSync ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h2>No Files to Synchronize</h2>
          <p>Upload files first to synchronize them with the system.</p>
          <Button onClick={() => navigate('/upload')}>
            Go to Upload
          </Button>
        </div>
      ) : (
        <div className="sync-container">
          {syncStatus === 'idle' && (
            <>
              <div className="section-header">
                <h2>Files Ready for Synchronization</h2>
              </div>

              <div className="file-list-container">
                <table className="file-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file /* , index */) => (
                      <tr key={index}>
                        <td>{file.name}</td>
                        <td>{file.type || 'Unknown'}</td>
                        <td>{formatFileSize(file.size)}</td>
                        <td>Ready</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="action-buttons">
                <Button onClick={handleSync} disabled={files.length === 0}>
                  Start Synchronization
                </Button>
              </div>
            </>
          )}

          {syncStatus === 'syncing' && (
            <div className="sync-progress-container">
              <h2>Synchronizing Data...</h2>
              <ProgressBar 
                progress={syncProgress} 
                height="20px"
                showLabel={true}
              />
              <p className="sync-status-message">
                Processing {files.length} file{files.length !== 1 ? 's' : ''}. Please wait...
              </p>
            </div>
          )}

          {syncStatus === 'success' && syncResults && (
            <div className="sync-results">
              <div className="success-banner">
                <div className="success-icon">✓</div>
                <h2>Synchronization Complete</h2>
              </div>

              <div className="sync-summary">
                <h3>Summary</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{syncResults.stats.processed}</div>
                    <div className="stat-label">Processed</div>
                  </div>
                  <div className="stat-card success">
                    <div className="stat-value">{syncResults.stats.created}</div>
                    <div className="stat-label">Created</div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-value">{syncResults.stats.updated}</div>
                    <div className="stat-label">Updated</div>
                  </div>
                  <div className="stat-card error">
                    <div className="stat-value">{syncResults.stats.failed}</div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <Button onClick={() => navigate('/dashboard')} className="btn-primary">
                  Go to Dashboard
                </Button>
                <Button onClick={() => navigate('/upload')} className="btn-secondary">
                  Upload More Files
                </Button>
                <Button onClick={handleReset} className="btn-tertiary">
                  Reset
                </Button>
              </div>
            </div>
          )}

          {syncStatus === 'error' && (
            <div className="sync-error">
              <div className="error-icon">✕</div>
              <h2>Synchronization Failed</h2>
              <p>There was an error synchronizing your files. Please try again.</p>
              <div className="action-buttons">
                <Button onClick={handleSync} className="btn-primary">
                  Retry
                </Button>
                <Button onClick={() => navigate('/upload')} className="btn-secondary">
                  Go Back to Upload
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default SyncPage;