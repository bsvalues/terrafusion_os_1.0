import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, MapPin, Home, DollarSign, Calendar,
  CheckCircle, AlertCircle, Info, ChevronRight, ChevronLeft,
  User, Phone, Mail, Building, Briefcase, Image, File,
  CreditCard, Download, Send, Save, X
 } from '@mui/icons-material';

interface PermitApplicationProps {
  user?: any;
  onClose: () => void;
  onSubmit: (application: any) => void;
}

export const PermitApplication: React.FC<PermitApplicationProps> = ({ user, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    permitType: '',
    projectType: '',
    propertyAddress: '',
    parcelNumber: '',
    ownerName: user?.name || '',
    ownerEmail: user?.email || '',
    ownerPhone: '',
    contractorName: '',
    contractorLicense: '',
    projectDescription: '',
    estimatedCost: '',
    startDate: '',
    endDate: '',
    documents: [] as File[],
    additionalInfo: '',
    acknowledgements: {
      accuracy: false,
      fees: false,
      inspections: false,
      compliance: false
    }
  });

  const permitTypes = [
    { id: 'building', name: 'Building Permit', icon: Building, fee: 450, processing: '3-5 days' },
    { id: 'electrical', name: 'Electrical Permit', icon: '⚡', fee: 200, processing: '1-2 days' },
    { id: 'plumbing', name: 'Plumbing Permit', icon: '🚿', fee: 175, processing: '1-2 days' },
    { id: 'mechanical', name: 'Mechanical Permit', icon: '🔧', fee: 225, processing: '2-3 days' },
    { id: 'demolition', name: 'Demolition Permit', icon: '🏗️', fee: 300, processing: '5-7 days' },
    { id: 'fence', name: 'Fence Permit', icon: '🚧', fee: 125, processing: '1 day' },
    { id: 'deck', name: 'Deck/Patio Permit', icon: '🏡', fee: 250, processing: '2-3 days' },
    { id: 'roofing', name: 'Roofing Permit', icon: '🏠', fee: 175, processing: '1 day' }
  ];

  const steps = [
    { id: 'type', label: 'Permit Type', icon: FileText },
    { id: 'property', label: 'Property Info', icon: Home },
    { id: 'project', label: 'Project Details', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'review', label: 'Review & Pay', icon: CreditCard }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const calculateFee = () => {
    const permit = permitTypes.find(p => p.id === formData.permitType);
    const baseFee = permit?.fee || 0;
    const projectCost = parseFloat(formData.estimatedCost) || 0;
    const valuationFee = projectCost > 10000 ? projectCost * 0.01 : 0;
    return baseFee + valuationFee;
  };

  const handleSubmit = () => {
    const application = {
      id: `APP-${Date.now()}`,
      ...formData,
      fee: calculateFee(),
      status: 'submitted',
      submittedDate: new Date(),
      userId: user?.id
    };
    
    // Save to localStorage
    const existingApps = JSON.parse(localStorage.getItem('tfpr_applications') || '[]');
    existingApps.push(application);
    localStorage.setItem('tfpr_applications', JSON.stringify(existingApps));
    
    onSubmit(application);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4"><>

            <h2 className="text-2xl font-bold">Apply for Permit</h2>
            <button
</>

              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step /* , index */) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 ${index <= currentStep ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentStep ? 'bg-green-500' : index === currentStep ? 'bg-white text-blue-600' : 'bg-white/30'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (<>

                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
</>
className="text-sm hidden md:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-green-500' : 'bg-white/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Step 1: Permit Type */}
              {currentStep === 0 && (
                <div><>

                  <h3 className="text-xl font-semibold text-gray-900 mb-6">What type of permit do you need?</h3>
                  <div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permitTypes.map((permit) => (
                      <motion.button
                        key={permit.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setFormData(prev => ({ ...prev, permitType: permit.id }))}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.permitType === permit.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-2xl mb-2">
                              {typeof permit.icon === 'string' ? permit.icon : <permit.icon className="w-8 h-8" />}
                            </div><>

                            <h4 className="font-semibold text-gray-900">{permit.name}</h4>
                            <p
</>
className="text-sm text-gray-600 mt-1">Processing: {permit.processing}</p>
                          </div>
                          <div className="text-right"><>

                            <div className="text-lg font-bold text-gray-900">${permit.fee}</div>
                            <div
</>
className="text-xs text-gray-500">Base fee</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Property Information */}
              {currentStep === 1 && (
                <div><>

                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Property Information</h3>
                  <div
</>
className="space-y-4">
                    <div><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Address *
                      </label>
                      <div
</>
className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.propertyAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="123 Main St, Kennewick, WA 99336"
                          required
                        />
                      </div>
                    </div>

                    <div><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parcel Number (optional)
                      </label>
                      <input
</>

                        type="text"
                        value={formData.parcelNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, parcelNumber: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="123456789"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Owner Name *
                        </label>
                        <input
</>

                          type="text"
                          value={formData.ownerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Owner Phone *
                        </label>
                        <input
</>

                          type="tel"
                          value={formData.ownerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="(509) 555-0123"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900"><>

                          <p className="font-medium mb-1">Property Verification</p>
                          <p
</>
</>>We'll automatically verify this property information against county records. If you're not the owner, you'll need to provide authorization.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Project Details */}
              {currentStep === 2 && (
                <div><>

                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h3>
                  <div
</>
className="space-y-4">
                    <div><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Description *
                      </label>
                      <textarea
</>

                        value={formData.projectDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="Describe your project in detail..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Project Cost *
                        </label>
                        <div
</>
className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={formData.estimatedCost}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="10000"
                            required
                          />
                        </div>
                      </div>
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project Type
                        </label>
                        <select
</>

                          value={formData.projectType}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        ><>

                          <option value="">Select type...</option>
                          <option
</>
value="new">New Construction</option><>

                          <option value="addition">Addition</option>
                          <option
</>
value="alteration">Alteration</option><>

                          <option value="repair">Repair</option>
                          <option
</>
value="replacement">Replacement</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Start Date
                        </label>
                        <input
</>

                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div><>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated End Date
                        </label>
                        <input
</>

                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contractor Information (if applicable)
                      </label>
                      <div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={formData.contractorName}
                          onChange={(e) => setFormData(prev => ({ ...prev, contractorName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Contractor name"
                        />
                        <input
                          type="text"
                          value={formData.contractorLicense}
                          onChange={(e) => setFormData(prev => ({ ...prev, contractorLicense: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="License #"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 3 && (
                <div><>

                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Documents</h3>
                  
                  <div
</>
className="mb-6"><>

                    <p className="text-gray-600 mb-4">Please upload the following required documents:</p>
                    <ul
</>
className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2"><>

                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Site plan or plot plan
                      </li>
                      <li
</>
className="flex items-center gap-2"><>

                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Construction drawings/blueprints
                      </li>
                      <li
</>
className="flex items-center gap-2"><>

                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        Contractor license (if applicable)
                      </li>
                      <li
</>
className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        Property deed or authorization letter
                      </li>
                    </ul>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" /><>

                    <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                    <p
</>
className="text-sm text-gray-500 mb-4">PDF, JPG, PNG up to 10MB each</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-blue-700"
                    >
                      Select Files
                    </label>
                  </div>

                  {/* Uploaded Files */}
                  {formData.documents.length > 0 && (
                    <div className="mt-6"><>

                      <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                      <div
</>
className="space-y-2">
                        {formData.documents.map((doc /* , index */) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <File className="w-5 h-5 text-gray-400" /><>

                              <span className="text-sm text-gray-700">{doc.name}</span>
                              <span
</>
className="text-xs text-gray-500">
                                ({(doc.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review & Pay */}
              {currentStep === 4 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Review & Submit</h3>
                  
                  {/* Application Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6"><>

                    <h4 className="font-semibold text-gray-900 mb-4">Application Summary</h4>
                    <dl
</>
className="space-y-3 text-sm">
                      <div className="flex justify-between"><>

                        <dt className="text-gray-600">Permit Type:</dt>
                        <dd
</>
className="font-medium text-gray-900">
                          {permitTypes.find(p => p.id === formData.permitType)?.name}
                        </dd>
                      </div>
                      <div className="flex justify-between"><>

                        <dt className="text-gray-600">Property:</dt>
                        <dd
</>
className="font-medium text-gray-900">{formData.propertyAddress}</dd>
                      </div>
                      <div className="flex justify-between"><>

                        <dt className="text-gray-600">Project Cost:</dt>
                        <dd
</>
className="font-medium text-gray-900">${formData.estimatedCost}</dd>
                      </div>
                      <div className="flex justify-between"><>

                        <dt className="text-gray-600">Documents:</dt>
                        <dd
</>
className="font-medium text-gray-900">{formData.documents.length} files</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="bg-blue-50 rounded-lg p-6 mb-6"><>

                    <h4 className="font-semibold text-gray-900 mb-4">Fee Breakdown</h4>
                    <dl
</>
className="space-y-2 text-sm">
                      <div className="flex justify-between"><>

                        <dt className="text-gray-600">Base Permit Fee:</dt>
                        <dd
</>
className="font-medium text-gray-900">
                          ${permitTypes.find(p => p.id === formData.permitType)?.fee || 0}
                        </dd>
                      </div>
                      {parseFloat(formData.estimatedCost) > 10000 && (
                        <div className="flex justify-between"><>

                          <dt className="text-gray-600">Valuation Fee (1% of project cost):</dt>
                          <dd
</>
className="font-medium text-gray-900">
                            ${(parseFloat(formData.estimatedCost) * 0.01).toFixed(2)}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t"><>

                        <dt className="font-semibold text-gray-900">Total Due:</dt>
                        <dd
</>
className="font-bold text-lg text-gray-900">
                          ${calculateFee().toFixed(2)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Acknowledgements */}
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acknowledgements.accuracy}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          acknowledgements: { ...prev.acknowledgements, accuracy: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I certify that all information provided is accurate and complete.
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acknowledgements.fees}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          acknowledgements: { ...prev.acknowledgements, fees: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I understand that additional fees may apply based on inspection requirements.
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acknowledgements.inspections}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          acknowledgements: { ...prev.acknowledgements, inspections: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to schedule and pass all required inspections.
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acknowledgements.compliance}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          acknowledgements: { ...prev.acknowledgements, compliance: e.target.checked }
                        }))}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I will comply with all applicable codes and regulations.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            ><>

              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div
</>
className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Save Draft
              </button>
              
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!Object.values(formData.acknowledgements).every(v => v)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  Submit & Pay ${calculateFee().toFixed(2)}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};