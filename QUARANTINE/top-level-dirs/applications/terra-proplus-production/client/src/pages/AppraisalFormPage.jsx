import React, { useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Calendar, DollarSign } from 'lucide-react';

const AppraisalFormPage = () => {
  const { propertyId, id } = useParams();
  const history = useHistory();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    propertyId: propertyId ? parseInt(propertyId, 10) : '',
    appraiserId: 1, // Default to admin user for now
    status: 'in_progress',
    purpose: '',
    marketValue: '',
    valuationMethod: 'sales_comparison',
    effectiveDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});

  // Fetch property data to display property details
  const { data: property } = useQuery({
    queryKey: ['/api/properties', propertyId || formData.propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId || formData.propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }
      return response.json();
    },
    enabled: !!(propertyId || formData.propertyId),
  });

  // Fetch appraisal data if we're in edit mode
  const { data: appraisalData, isLoading: appraisalLoading } = useQuery({
    queryKey: ['/api/appraisals', id],
    queryFn: async () => {
      const response = await fetch(`/api/appraisals/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appraisal');
      }
      return response.json();
    },
    enabled: isEditMode,
  });

  // Update form data when appraisal data is loaded
  useEffect(() => {
    if (appraisalData) {
      // Format dates for the form inputs
      const formattedData = {
        ...appraisalData,
        effectiveDate: appraisalData.effectiveDate ? new Date(appraisalData.effectiveDate).toISOString().split('T')[0] : '',
        reportDate: appraisalData.reportDate ? new Date(appraisalData.reportDate).toISOString().split('T')[0] : ''
      };
      setFormData(formattedData);
    }
  }, [appraisalData]);

  // Create appraisal mutation
  const createAppraisal = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/appraisals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appraisal');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate appraisals query and redirect to the new appraisal
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      history.push(`/appraisals/${data.id}`);
    },
  });

  // Update appraisal mutation
  const updateAppraisal = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/appraisals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appraisal');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate appraisal queries and redirect back to the appraisal
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      history.push(`/appraisals/${id}`);
    },
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert propertyId to number
    if (name === 'propertyId') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.propertyId) {
      newErrors.propertyId = 'Property is required';
    }
    
    if (!formData.appraiserId) {
      newErrors.appraiserId = 'Appraiser is required';
    }
    
    if (!formData.purpose?.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    
    if (formData.status === 'completed' && !formData.marketValue) {
      newErrors.marketValue = 'Market value is required for completed appraisals';
    }
    
    if (formData.status === 'completed' && !formData.valuationMethod) {
      newErrors.valuationMethod = 'Valuation method is required for completed appraisals';
    }
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    }
    
    if (!formData.reportDate) {
      newErrors.reportDate = 'Report date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    if (isEditMode) {
      updateAppraisal.mutate(formData);
    } else {
      createAppraisal.mutate(formData);
    }
  };

  // Loading state
  if (isEditMode && appraisalLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span>Loading appraisal data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link 
          to={isEditMode ? `/appraisals/${id}` : propertyId ? `/properties/${propertyId}` : "/properties"} 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          {isEditMode ? 'Back to Appraisal' : propertyId ? 'Back to Property' : 'Back to Properties'}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Appraisal' : 'Create New Appraisal'}
          </h1>
          {property && (
            <p className="mt-1 text-sm text-gray-600">
              Property: {property.address}, {property.city}, {property.state} {property.zipCode}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Property ID (hidden if coming from property page) */}
            {!propertyId && (
              <div className="sm:col-span-3">
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
                  Property ID <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="propertyId"
                    id="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.propertyId ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.propertyId && (
                    <p className="mt-1 text-sm text-red-600">{errors.propertyId}</p>
                  )}
                </div>
              </div>
            )}

            {/* Purpose */}
            <div className="sm:col-span-3">
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                Purpose <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.purpose ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select Purpose</option>
                  <option value="purchase">Purchase</option>
                  <option value="refinance">Refinance</option>
                  <option value="estate">Estate</option>
                  <option value="tax_assessment">Tax Assessment</option>
                  <option value="litigation">Litigation</option>
                  <option value="insurance">Insurance</option>
                </select>
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Market Value */}
            <div className="sm:col-span-3">
              <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700">
                Market Value {formData.status === 'completed' && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="marketValue"
                  id="marketValue"
                  step="0.01"
                  value={formData.marketValue}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.marketValue ? 'border-red-300' : ''
                  }`}
                />
                {errors.marketValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.marketValue}</p>
                )}
              </div>
            </div>

            {/* Valuation Method */}
            <div className="sm:col-span-3">
              <label htmlFor="valuationMethod" className="block text-sm font-medium text-gray-700">
                Valuation Method {formData.status === 'completed' && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1">
                <select
                  id="valuationMethod"
                  name="valuationMethod"
                  value={formData.valuationMethod}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.valuationMethod ? 'border-red-300' : ''
                  }`}
                >
                  <option value="sales_comparison">Sales Comparison</option>
                  <option value="income_approach">Income Approach</option>
                  <option value="cost_approach">Cost Approach</option>
                  <option value="combined">Combined Methods</option>
                </select>
                {errors.valuationMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.valuationMethod}</p>
                )}
              </div>
            </div>

            {/* Effective Date */}
            <div className="sm:col-span-3">
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="effectiveDate"
                  id="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className={`pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.effectiveDate ? 'border-red-300' : ''
                  }`}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
                )}
              </div>
            </div>

            {/* Report Date */}
            <div className="sm:col-span-3">
              <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700">
                Report Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="reportDate"
                  id="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  className={`pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.reportDate ? 'border-red-300' : ''
                  }`}
                />
                {errors.reportDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.reportDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form action buttons */}
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <Link
                to={isEditMode ? `/appraisals/${id}` : propertyId ? `/properties/${propertyId}` : "/properties"}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createAppraisal.isPending || updateAppraisal.isPending}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {(createAppraisal.isPending || updateAppraisal.isPending) ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isEditMode ? 'Update Appraisal' : 'Create Appraisal'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {(createAppraisal.isError || updateAppraisal.isError) && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {isEditMode ? 'Error updating appraisal' : 'Error creating appraisal'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{createAppraisal.error?.message || updateAppraisal.error?.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppraisalFormPage;