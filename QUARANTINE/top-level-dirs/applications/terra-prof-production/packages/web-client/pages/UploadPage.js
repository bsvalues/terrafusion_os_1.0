/**
 * Upload Page Component
 * Allows users to upload files to the system
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FileUpload from '../components/ui/FileUpload';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useApp } from '../contexts/AppContext';

/**
 * Upload Page Component
 * @returns {JSX.Element} Upload page component
 */
const UploadPage = () => {
  const navigate = useNavigate();
  const { addToast, setIsLoading } = useApp();
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadType, setUploadType] = useState('property'); // property, report, etc.

  // Handle successful upload
  const handleUploadSuccess = (response) => {
    setUploadedFiles(response.files || []);
    setShowSuccessModal(true);
  };

  // Handle upload error
  const handleUploadError = (error) => {
    addToast({
      message: `Upload failed: ${error}`,
      type: 'error'
    });
  };

  // Proceed to sync after upload
  const proceedToSync = () => {
    setShowSuccessModal(false);
    navigate('/sync', { state: { uploadedFiles } });
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Upload Files</h1>
        <p className="page-description">
          Upload property data, reports, or other documents to the system.
        </p>
      </div>

      <div className="upload-section">
        <div className="section-header">
          <h2>Select Upload Type</h2>
        </div>

        <div className="upload-types">
          <div 
            className={`upload-type-card ${uploadType === 'property' ? 'selected' : ''}`}
            onClick={() => setUploadType('property')}
          >
            <div className="card-icon">🏠</div>
            <h3>Property Data</h3>
            <p>Upload property information in CSV, JSON, or Excel format.</p>
          </div>
          
          <div 
            className={`upload-type-card ${uploadType === 'report' ? 'selected' : ''}`}
            onClick={() => setUploadType('report')}
          >
            <div className="card-icon">📝</div>
            <h3>Appraisal Reports</h3>
            <p>Upload finalized appraisal reports in PDF format.</p>
          </div>
          
          <div 
            className={`upload-type-card ${uploadType === 'document' ? 'selected' : ''}`}
            onClick={() => setUploadType('document')}
          >
            <div className="card-icon">📄</div>
            <h3>Supporting Documents</h3>
            <p>Upload supporting documentation for properties or appraisals.</p>
          </div>
        </div>
      </div>

      <div className="upload-content">
        <FileUpload
          url={`/api/upload/${uploadType}`}
          onUpload={handleUploadSuccess}
          onError={handleUploadError}
          acceptedFileTypes={getAcceptedTypes(uploadType)}
          multiple={uploadType === 'document'}
          uploadButtonText="Upload Files"
          additionalData={{ type: uploadType }}
        />
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Upload Successful"
        size="small"
        footer={
          <>
            <Button onClick={() => setShowSuccessModal(false)} className="btn-secondary">
              Upload More
            </Button>
            <Button onClick={proceedToSync} className="btn-primary">
              Proceed to Sync
            </Button>
          </>
        }
      >
        <div className="success-content">
          <div className="success-icon">✓</div>
          <p>
            Successfully uploaded {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}.
          </p>
          <p>Would you like to upload more files or proceed to sync your data?</p>
        </div>
      </Modal>
    </Layout>
  );
};

/**
 * Get accepted file types based on upload type
 * @param {string} type - Upload type
 * @returns {string[]} Array of accepted file extensions
 */
function getAcceptedTypes(type) {
  switch (type) {
    case 'property':
      return ['.csv', '.json', '.xlsx', '.xls'];
    case 'report':
      return ['.pdf', '.docx', '.doc'];
    case 'document':
      return ['*']; // Accept all file types
    default:
      return ['*'];
  }
}

export default UploadPage;