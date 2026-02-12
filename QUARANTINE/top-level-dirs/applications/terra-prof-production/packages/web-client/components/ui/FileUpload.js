/**
 * FileUpload Component
 * A dropzone component for file uploads with progress tracking
 */

import React, { useState, useRef, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import Button from './Button';
import { useApp } from '../../contexts/AppContext';

/**
 * FileUpload Component
 * @param {Object} props - Component props
 * @param {Function} props.onUpload - Handler when file is uploaded successfully
 * @param {Function} props.onError - Handler when error occurs (optional)
 * @param {string} props.url - API endpoint for file upload
 * @param {string[]} props.acceptedFileTypes - Array of accepted file types (e.g. ['.pdf', '.doc'])
 * @param {number} props.maxFileSize - Maximum file size in bytes
 * @param {boolean} props.multiple - Allow multiple file upload
 * @param {string} props.uploadButtonText - Text for upload button
 * @param {Object} props.additionalData - Additional form data to send with file
 * @returns {JSX.Element} FileUpload component
 */
const FileUpload = ({
  onUpload,
  onError,
  url = '/api/upload',
  acceptedFileTypes = ['*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  uploadButtonText = 'Upload',
  additionalData = {}
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useApp();

  // Format the accepted file types for display
  const formatAcceptedTypes = () => {
    if (acceptedFileTypes.includes('*')) {
      return 'All files';
    }
    return acceptedFileTypes.join(', ');
  };

  // Format file size for display (KB, MB, GB)
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate a file against accepted types and max size
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxFileSize) {
      addToast({
        message: `File ${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`,
        type: 'error'
      });
      return false;
    }

    // Check file type if specific types are required
    if (!acceptedFileTypes.includes('*')) {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        addToast({
          message: `File type ${fileExtension} is not accepted`,
          type: 'error'
        });
        return false;
      }
    }

    return true;
  };

  // Handle file selection from input
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Validate files
    const validFiles = selectedFiles.filter(validateFile);
    
    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else if (validFiles.length > 0) {
      setFiles([validFiles[0]]);
    }
  };

  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      
      // Validate files
      const validFiles = droppedFiles.filter(validateFile);
      
      if (multiple) {
        setFiles(prev => [...prev, ...validFiles]);
      } else if (validFiles.length > 0) {
        setFiles([validFiles[0]]);
      }
    }
  };

  // Handle drag events
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload files to server
  const uploadFiles = () => {
    if (files.length === 0) {
      addToast({
        message: 'Please select files to upload',
        type: 'warning'
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    
    // Append files to form data
    if (multiple) {
      files.forEach((file /* , index */) => {
        formData.append('files[]', file);
      });
    } else {
      formData.append('file', files[0]);
    }
    
    // Append additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progressPercent = Math.round((event.loaded / event.total) * 100);
        setProgress(progressPercent);
      }
    });

    // Handle response
    xhr.onload = () => {
      setUploading(false);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Success
        const response = JSON.parse(xhr.responseText);
        addToast({
          message: 'Files uploaded successfully',
          type: 'success'
        });
        
        if (onUpload) {
          onUpload(response);
        }
        
        clearFiles();
      } else {
        // Error
        let errorMessage = 'Upload failed';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          // Could not parse response
        }
        
        addToast({
          message: errorMessage,
          type: 'error'
        });
        
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      setUploading(false);
      const errorMessage = 'Network error, please try again';
      
      addToast({
        message: errorMessage,
        type: 'error'
      });
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Send the form data
    xhr.send(formData);
  };

  return (
    <div className="file-upload-container">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes.includes('*') ? undefined : acceptedFileTypes.join(',')}
        multiple={multiple}
        className="file-input-hidden"
        tabIndex="-1"
      />
      
      {/* Dropzone area */}
      <div 
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 10V7H11V10H8L12 14L16 10H13Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="dropzone-text">
            <p>Drag & drop files here, or click to browse</p>
            <p className="dropzone-info">
              Accepted file types: {formatAcceptedTypes()}<br />
              Maximum file size: {formatFileSize(maxFileSize)}
            </p>
          </div>
        </div>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected Files:</h4>
          <ul>
            {files.map((file /* , index */) => (
              <li key={`${file.name}-${index}`} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({formatFileSize(file.size)})</span>
                <button 
                  className="file-remove" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={uploading}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Progress bar */}
      {uploading && (
        <div className="upload-progress">
          <ProgressBar progress={progress} />
          <p>{progress}% Uploaded</p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="upload-actions">
        <Button 
          onClick={uploadFiles} 
          disabled={files.length === 0 || uploading} 
          loading={uploading}
        >
          {uploadButtonText}
        </Button>
        
        {files.length > 0 && !uploading && (
          <Button 
            onClick={clearFiles}
            className="btn-secondary"
          >
            Clear Files
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;