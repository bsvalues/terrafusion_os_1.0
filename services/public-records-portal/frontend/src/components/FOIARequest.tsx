import React, { useState, useEffect } from 'react';
import './FOIARequest.css';

interface RequesterInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface RequestDetails {
  requestType: 'foia' | 'public-records';
  subject: string;
  description: string;
  specificRecords: string;
  dateRange: {
    start: string;
    end: string;
  };
  department: string;
  category: string;
  urgency: 'routine' | 'expedited' | 'emergency';
  format: 'electronic' | 'physical' | 'either';
  deliveryMethod: 'email' | 'mail' | 'pickup';
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
}

const FOIARequest: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [requesterInfo, setRequesterInfo] = useState<RequesterInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [requestDetails, setRequestDetails] = useState<RequestDetails>({
    requestType: 'foia',
    subject: '',
    description: '',
    specificRecords: '',
    dateRange: { start: '', end: '' },
    department: '',
    category: '',
    urgency: 'routine',
    format: 'electronic',
    deliveryMethod: 'email'
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');

  const totalSteps = 4;

  const departments = [
    'City Council', 'Mayor\'s Office', 'Public Works', 'Police Department',
    'Fire Department', 'Parks & Recreation', 'Planning & Development',
    'Finance Department', 'Human Resources', 'Legal Department',
    'Environmental Services', 'Public Health', 'Transportation',
    'Information Technology', 'Community Development'
  ];

  const categories = [
    'Financial Records', 'Meeting Minutes', 'Legal Documents', 'Planning Documents',
    'Personnel Records', 'Public Safety', 'Environmental Reports', 'Infrastructure',
    'Electoral Records', 'Permits & Licenses', 'Budget Documents', 'Audit Reports',
    'Contracts', 'Communications', 'Reports & Studies', 'Maps & Surveys'
  ];

  useEffect(() => {
    // Auto-save form data to localStorage
    const formData = {
      requesterInfo,
      requestDetails,
      uploadedFiles,
      currentStep
    };
    localStorage.setItem('foiaFormData', JSON.stringify(formData));
  }, [requesterInfo, requestDetails, uploadedFiles, currentStep]);

  useEffect(() => {
    // Load saved form data on mount
    const savedData = localStorage.getItem('foiaFormData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.requesterInfo) setRequesterInfo(data.requesterInfo);
        if (data.requestDetails) setRequestDetails(data.requestDetails);
        if (data.uploadedFiles) setUploadedFiles(data.uploadedFiles);
        if (data.currentStep) setCurrentStep(data.currentStep);
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
  }, []);

  const handleRequesterInfoChange = (field: keyof RequesterInfo, value: string) => {
    setRequesterInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRequestDetailsChange = (field: keyof RequestDetails, value: any) => {
    setRequestDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString()
        };
        setUploadedFiles(prev => [...prev, newFile]);
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return requesterInfo.firstName && requesterInfo.lastName && 
               requesterInfo.email && requesterInfo.phone;
      case 2:
        return requestDetails.subject && requestDetails.description && 
               requestDetails.department;
      case 3:
        return true; // File upload is optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitRequest = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate request ID
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const id = `${requestDetails.requestType.toUpperCase()}-${year}-${month}${day}-${random}`;
      
      setRequestId(id);
      setSubmitSuccess(true);
      
      // Clear saved form data
      localStorage.removeItem('foiaFormData');
      
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setRequesterInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setRequestDetails({
      requestType: 'foia',
      subject: '',
      description: '',
      specificRecords: '',
      dateRange: { start: '', end: '' },
      department: '',
      category: '',
      urgency: 'routine',
      format: 'electronic',
      deliveryMethod: 'email'
    });
    setUploadedFiles([]);
    setSubmitSuccess(false);
    setRequestId('');
    localStorage.removeItem('foiaFormData');
  };

  if (submitSuccess) {
    return (
      <div className="foia-request">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1>Request Submitted Successfully!</h1>
          <div className="request-id">
            <span className="id-label">Your Request ID:</span>
            <span className="id-value">{requestId}</span>
          </div>
          <div className="success-details">
            <p>
              Your {requestDetails.requestType === 'foia' ? 'FOIA' : 'Public Records'} request 
              has been submitted and is now in our processing queue.
            </p>
            <div className="next-steps">
              <h3>What happens next?</h3>
              <ul>
                <li>📧 You'll receive a confirmation email within 15 minutes</li>
                <li>📋 Your request will be reviewed within 1-2 business days</li>
                <li>⏱️ You'll receive updates as your request is processed</li>
                <li>📄 Documents will be provided via your chosen delivery method</li>
              </ul>
            </div>
            <div className="estimated-response">
              <strong>Estimated Response Time:</strong>{' '}
              {requestDetails.urgency === 'emergency' ? '24 hours' :
               requestDetails.urgency === 'expedited' ? '3-5 business days' :
               '5-10 business days'}
            </div>
          </div>
          <div className="success-actions">
            <button className="track-btn">
              <span className="btn-icon">📋</span>
              Track Your Request
            </button>
            <button className="new-request-btn" onClick={resetForm}>
              <span className="btn-icon">📝</span>
              Submit New Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="foia-request">
      
      {/* Header */}
      <div className="request-header">
        <h1>
          {requestDetails.requestType === 'foia' ? 'Freedom of Information Act' : 'Public Records'} Request
        </h1>
        <p>Submit a formal request for government records and documents</p>
        
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step}
                className={`progress-step ${currentStep >= step ? 'completed' : ''} ${currentStep === step ? 'active' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Requester Info'}
                  {step === 2 && 'Request Details'}
                  {step === 3 && 'Supporting Documents'}
                  {step === 4 && 'Review & Submit'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Steps */}
      <div className="form-container">
        
        {/* Step 1: Requester Information */}
        {currentStep === 1 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Requester Information</h2>
              <p>Please provide your contact information for this request</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={requesterInfo.firstName}
                  onChange={(e) => handleRequesterInfoChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={requesterInfo.lastName}
                  onChange={(e) => handleRequesterInfoChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={requesterInfo.email}
                  onChange={(e) => handleRequesterInfoChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={requesterInfo.phone}
                  onChange={(e) => handleRequesterInfoChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="organization">Organization (Optional)</label>
                <input
                  type="text"
                  id="organization"
                  value={requesterInfo.organization}
                  onChange={(e) => handleRequesterInfoChange('organization', e.target.value)}
                  placeholder="Company, News Organization, Law Firm, etc."
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="address">Mailing Address</label>
                <input
                  type="text"
                  id="address"
                  value={requesterInfo.address}
                  onChange={(e) => handleRequesterInfoChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  value={requesterInfo.city}
                  onChange={(e) => handleRequesterInfoChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  value={requesterInfo.state}
                  onChange={(e) => handleRequesterInfoChange('state', e.target.value)}
                >
                  <option value="">Select State</option>
                  <option value="WA">Washington</option>
                  <option value="OR">Oregon</option>
                  <option value="CA">California</option>
                  {/* Add more states as needed */}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code</label>
                <input
                  type="text"
                  id="zipCode"
                  value={requesterInfo.zipCode}
                  onChange={(e) => handleRequesterInfoChange('zipCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Request Details */}
        {currentStep === 2 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Request Details</h2>
              <p>Describe the records or information you are seeking</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="requestType">Request Type *</label>
                <select
                  id="requestType"
                  value={requestDetails.requestType}
                  onChange={(e) => handleRequestDetailsChange('requestType', e.target.value)}
                >
                  <option value="foia">Freedom of Information Act (FOIA)</option>
                  <option value="public-records">Public Records Request</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="urgency">Request Priority</label>
                <select
                  id="urgency"
                  value={requestDetails.urgency}
                  onChange={(e) => handleRequestDetailsChange('urgency', e.target.value)}
                >
                  <option value="routine">Routine (Standard Processing)</option>
                  <option value="expedited">Expedited (Faster Processing)</option>
                  <option value="emergency">Emergency (Immediate Need)</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="subject">Request Subject *</label>
                <input
                  type="text"
                  id="subject"
                  value={requestDetails.subject}
                  onChange={(e) => handleRequestDetailsChange('subject', e.target.value)}
                  placeholder="Brief description of what you're requesting"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="description">Detailed Description *</label>
                <textarea
                  id="description"
                  value={requestDetails.description}
                  onChange={(e) => handleRequestDetailsChange('description', e.target.value)}
                  placeholder="Provide a detailed description of the records you are seeking. Be as specific as possible to help us locate the information."
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="specificRecords">Specific Records or Documents</label>
                <textarea
                  id="specificRecords"
                  value={requestDetails.specificRecords}
                  onChange={(e) => handleRequestDetailsChange('specificRecords', e.target.value)}
                  placeholder="List specific document names, case numbers, contract numbers, or other identifying information if known."
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="department">Department/Agency *</label>
                <select
                  id="department"
                  value={requestDetails.department}
                  onChange={(e) => handleRequestDetailsChange('department', e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Record Category</label>
                <select
                  id="category"
                  value={requestDetails.category}
                  onChange={(e) => handleRequestDetailsChange('category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="dateStart">From Date</label>
                <input
                  type="date"
                  id="dateStart"
                  value={requestDetails.dateRange.start}
                  onChange={(e) => handleRequestDetailsChange('dateRange', {
                    ...requestDetails.dateRange,
                    start: e.target.value
                  })}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dateEnd">To Date</label>
                <input
                  type="date"
                  id="dateEnd"
                  value={requestDetails.dateRange.end}
                  onChange={(e) => handleRequestDetailsChange('dateRange', {
                    ...requestDetails.dateRange,
                    end: e.target.value
                  })}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="format">Preferred Format</label>
                <select
                  id="format"
                  value={requestDetails.format}
                  onChange={(e) => handleRequestDetailsChange('format', e.target.value)}
                >
                  <option value="electronic">Electronic (PDF, Digital)</option>
                  <option value="physical">Physical (Paper Copies)</option>
                  <option value="either">Either Format</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryMethod">Delivery Method</label>
                <select
                  id="deliveryMethod"
                  value={requestDetails.deliveryMethod}
                  onChange={(e) => handleRequestDetailsChange('deliveryMethod', e.target.value)}
                >
                  <option value="email">Email Delivery</option>
                  <option value="mail">US Mail</option>
                  <option value="pickup">In-Person Pickup</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Supporting Documents */}
        {currentStep === 3 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Supporting Documents</h2>
              <p>Upload any supporting documents that may help process your request (optional)</p>
            </div>
            
            <div className="upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  id="fileUpload"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label htmlFor="fileUpload" className="upload-label">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <div className="upload-title">Click to upload files</div>
                    <div className="upload-subtitle">or drag and drop</div>
                  </div>
                  <div className="upload-formats">
                    Supported: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each)
                  </div>
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h3>Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="files-list">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="file-item">
                        <div className="file-icon">📎</div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-details">
                            {formatFileSize(file.size)} • {file.type}
                          </div>
                        </div>
                        <button 
                          className="remove-file"
                          onClick={() => removeFile(file.id)}
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="upload-guidelines">
              <h3>Upload Guidelines</h3>
              <ul>
                <li>📄 Supporting documents can include correspondence, forms, or reference materials</li>
                <li>🔒 Files are securely encrypted and only accessible by authorized personnel</li>
                <li>📏 Maximum file size: 10MB per file</li>
                <li>📁 Accepted formats: PDF, Word documents, text files, and common image formats</li>
                <li>🗑️ Files can be removed before submission if needed</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Review & Submit</h2>
              <p>Please review your request details before submitting</p>
            </div>
            
            <div className="review-sections">
              
              {/* Requester Information Review */}
              <div className="review-section">
                <h3>Requester Information</h3>
                <div className="review-grid">
                  <div><strong>Name:</strong> {requesterInfo.firstName} {requesterInfo.lastName}</div>
                  <div><strong>Email:</strong> {requesterInfo.email}</div>
                  <div><strong>Phone:</strong> {requesterInfo.phone}</div>
                  {requesterInfo.organization && (
                    <div><strong>Organization:</strong> {requesterInfo.organization}</div>
                  )}
                  {requesterInfo.address && (
                    <div className="full-width">
                      <strong>Address:</strong> {requesterInfo.address}, {requesterInfo.city}, {requesterInfo.state} {requesterInfo.zipCode}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Request Details Review */}
              <div className="review-section">
                <h3>Request Details</h3>
                <div className="review-grid">
                  <div><strong>Type:</strong> {requestDetails.requestType === 'foia' ? 'FOIA Request' : 'Public Records Request'}</div>
                  <div><strong>Priority:</strong> {requestDetails.urgency}</div>
                  <div><strong>Department:</strong> {requestDetails.department}</div>
                  {requestDetails.category && (
                    <div><strong>Category:</strong> {requestDetails.category}</div>
                  )}
                  <div className="full-width"><strong>Subject:</strong> {requestDetails.subject}</div>
                  <div className="full-width"><strong>Description:</strong> {requestDetails.description}</div>
                  {requestDetails.specificRecords && (
                    <div className="full-width"><strong>Specific Records:</strong> {requestDetails.specificRecords}</div>
                  )}
                  {(requestDetails.dateRange.start || requestDetails.dateRange.end) && (
                    <div>
                      <strong>Date Range:</strong> {requestDetails.dateRange.start || 'No start date'} to {requestDetails.dateRange.end || 'No end date'}
                    </div>
                  )}
                  <div><strong>Format:</strong> {requestDetails.format}</div>
                  <div><strong>Delivery:</strong> {requestDetails.deliveryMethod}</div>
                </div>
              </div>
              
              {/* Files Review */}
              {uploadedFiles.length > 0 && (
                <div className="review-section">
                  <h3>Supporting Documents ({uploadedFiles.length})</h3>
                  <div className="review-files">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="review-file">
                        📎 {file.name} ({formatFileSize(file.size)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Legal Notice */}
              <div className="legal-notice">
                <h3>⚖️ Legal Notice & Agreement</h3>
                <div className="notice-content">
                  <p>
                    By submitting this request, you acknowledge and agree to the following:
                  </p>
                  <ul>
                    <li>This request is made under applicable Freedom of Information Act and Public Records laws</li>
                    <li>Processing fees may apply based on the nature and volume of requested records</li>
                    <li>Response times may vary based on request complexity and current workload</li>
                    <li>Some records may be partially or fully exempt from disclosure under applicable law</li>
                    <li>You may be required to provide additional information to clarify your request</li>
                    <li>False or fraudulent requests may be subject to legal penalties</li>
                  </ul>
                  <p>
                    <strong>Privacy Notice:</strong> Your contact information will only be used to process 
                    this request and communicate with you regarding its status. Information will not be 
                    shared with third parties except as required by law.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button 
              type="button"
              className="nav-btn secondary"
              onClick={prevStep}
            >
              ← Previous Step
            </button>
          )}
          
          <div className="nav-spacer"></div>
          
          {currentStep < totalSteps ? (
            <button 
              type="button"
              className={`nav-btn primary ${!validateStep(currentStep) ? 'disabled' : ''}`}
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Next Step →
            </button>
          ) : (
            <button 
              type="button"
              className={`nav-btn submit ${isSubmitting ? 'submitting' : ''}`}
              onClick={submitRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting Request...
                </>
              ) : (
                <>
                  📤 Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FOIARequest;