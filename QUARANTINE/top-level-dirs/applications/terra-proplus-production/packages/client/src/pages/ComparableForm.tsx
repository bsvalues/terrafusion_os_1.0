import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Home, Calendar, DollarSign, Ruler, ArrowLeft, Plus, Minus  } from '@mui/icons-material';
import { Appraisal } from '../types';

const ComparableForm = () => {
  // State for form data
  const [formData, setFormData] = useState({
    appraisalId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    salePrice: '',
    saleDate: '',
    squareFeet: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    lotSize: '',
    condition: 'Average',
    daysOnMarket: '',
    source: 'MLS',
    adjustments: [
      { category: '', description: '', amount: '', isPercentage: false }
    ]
  });

  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch appraisals for the dropdown
  const { data: appraisals } = useQuery({
    queryKey: ['/api/appraisals'],
    retry: 1,
  });

  // Property type options
  const propertyTypes = [
    'Single Family',
    'Condo',
    'Multi-Family',
    'Townhouse',
    'Land',
    'Commercial'
  ];

  // Condition options
  const conditions = [
    'Excellent',
    'Good',
    'Average',
    'Fair',
    'Poor'
  ];

  // Source options
  const sources = [
    'MLS',
    'Public Records',
    'Sales Office',
    'Owner',
    'Other'
  ];

  // Adjustment categories
  const adjustmentCategories = [
    'Sale Concessions',
    'Location',
    'Site/View',
    'Size',
    'Age/Condition',
    'Design/Style',
    'Quality of Construction',
    'Amenities',
    'Garage/Carport',
    'Other'
  ];

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle adjustment change
  const handleAdjustmentChange = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => {
      const newAdjustments = [...prev.adjustments];
      newAdjustments[index] = {
        ...newAdjustments[index],
        [field]: value
      };
      return {
        ...prev,
        adjustments: newAdjustments
      };
    });
  };

  // Add new adjustment
  const addAdjustment = () => {
    setFormData(prev => ({
      ...prev,
      adjustments: [
        ...prev.adjustments,
        { category: '', description: '', amount: '', isPercentage: false }
      ]
    }));
  };

  // Remove adjustment
  const removeAdjustment = (index: number) => {
    setFormData(prev => {
      const newAdjustments = [...prev.adjustments];
      newAdjustments.splice(index, 1);
      return {
        ...prev,
        adjustments: newAdjustments
      };
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.appraisalId) newErrors.appraisalId = 'Appraisal is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP Code is required';
    if (!formData.salePrice) newErrors.salePrice = 'Sale price is required';
    if (!formData.saleDate) newErrors.saleDate = 'Sale date is required';
    if (!formData.squareFeet) newErrors.squareFeet = 'Square feet is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    
    // Number validation
    if (formData.salePrice && isNaN(Number(formData.salePrice))) {
      newErrors.salePrice = 'Sale price must be a number';
    }
    if (formData.squareFeet && isNaN(Number(formData.squareFeet))) {
      newErrors.squareFeet = 'Square feet must be a number';
    }
    if (formData.bedrooms && isNaN(Number(formData.bedrooms))) {
      newErrors.bedrooms = 'Bedrooms must be a number';
    }
    if (formData.bathrooms && isNaN(Number(formData.bathrooms))) {
      newErrors.bathrooms = 'Bathrooms must be a number';
    }
    if (formData.yearBuilt && isNaN(Number(formData.yearBuilt))) {
      newErrors.yearBuilt = 'Year built must be a number';
    }
    if (formData.lotSize && isNaN(Number(formData.lotSize))) {
      newErrors.lotSize = 'Lot size must be a number';
    }
    if (formData.daysOnMarket && isNaN(Number(formData.daysOnMarket))) {
      newErrors.daysOnMarket = 'Days on market must be a number';
    }
    
    // Validate adjustments
    formData.adjustments.forEach((adjustment /* , index */) => {
      if (adjustment.category && !adjustment.amount) {
        newErrors[`adjustments[${index}].amount`] = 'Amount is required';
      }
      if (adjustment.amount && !adjustment.category) {
        newErrors[`adjustments[${index}].category`] = 'Category is required';
      }
      if (adjustment.amount && isNaN(Number(adjustment.amount))) {
        newErrors[`adjustments[${index}].amount`] = 'Amount must be a number';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-message');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Format data for API
      const formattedData = {
        appraisalId: parseInt(formData.appraisalId),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        salePrice: parseInt(formData.salePrice),
        saleDate: formData.saleDate,
        squareFeet: parseInt(formData.squareFeet),
        bedrooms: formData.bedrooms ? parseFloat(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        propertyType: formData.propertyType,
        lotSize: formData.lotSize ? parseInt(formData.lotSize) : undefined,
        condition: formData.condition,
        daysOnMarket: formData.daysOnMarket ? parseInt(formData.daysOnMarket) : undefined,
        source: formData.source,
        // Filter out empty adjustments
        adjustments: formData.adjustments
          .filter(adj => adj.category && adj.amount)
          .map(adj => ({
            category: adj.category,
            description: adj.description,
            amount: parseInt(adj.amount as string),
            isPercentage: adj.isPercentage
          }))
      };
      
      // Mock submission for now - in real app, this would be an API call
      // const response = await fetch('/api/comparables', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formattedData)
      // });
      
      // if (!response.ok) throw new Error('Failed to create comparable');
      
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          appraisalId: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          salePrice: '',
          saleDate: '',
          squareFeet: '',
          bedrooms: '',
          bathrooms: '',
          yearBuilt: '',
          propertyType: 'Single Family',
          lotSize: '',
          condition: 'Average',
          daysOnMarket: '',
          source: 'MLS',
          adjustments: [
            { category: '', description: '', amount: '', isPercentage: false }
          ]
        });
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating comparable:', error);
      setSubmitError('Failed to create comparable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => window.history.back()} className="flex items-center text-blue-600 hover:text-blue-800"><>

          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        <h1
</> className="text-3xl font-bold gradient-heading mt-2">Add Comparable Property</h1>
        <p className="text-gray-600 mt-1">Enter comparable property details for appraisal analysis</p>
      </div>
      
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6">
          Comparable property added successfully!
        </div>
      )}
      
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-6">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6"><>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Appraisal Information</h2>
          <div
</>>
            <label htmlFor="appraisalId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Appraisal <span className="text-red-500">*</span>
            </label>
            <select
              id="appraisalId"
              name="appraisalId"
              value={formData.appraisalId}
              onChange={handleChange}
              className={`mt-1 block w-full py-2 px-3 border ${errors.appraisalId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select an appraisal</option>
              {appraisals?.map((appraisal: Appraisal) => (
                <option key={appraisal.id} value={appraisal.id}>
                  {appraisal.address} - {appraisal.clientName || 'No client'} - {appraisal.status}
                </option>
              ))}
            </select>
            {errors.appraisalId && <p className="mt-1 text-sm text-red-600 error-message">{errors.appraisalId}</p>}
          </div>
        </div>
        
        <div className="mb-6"><>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Property Information</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                  <Home size={16} className="text-gray-400" />
                </div>
                <input
</>
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`pl-10 mt-1 block w-full py-2 px-3 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="123 Main St"
                />
              </div>
              {errors.address && <p className="mt-1 text-sm text-red-600 error-message">{errors.address}</p>}
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.city ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Springfield"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600 error-message">{errors.city}</p>}
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.state ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="CA"
                maxLength={2}
              />
              {errors.state && <p className="mt-1 text-sm text-red-600 error-message">{errors.state}</p>}
            </div>
            
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.zipCode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="90210"
              />
              {errors.zipCode && <p className="mt-1 text-sm text-red-600 error-message">{errors.zipCode}</p>}
            </div>
            
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.propertyType ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.propertyType && <p className="mt-1 text-sm text-red-600 error-message">{errors.propertyType}</p>}
            </div>
            
            <div><>

              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
</>
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-6"><>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Sale Information</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
</>
                  type="text"
                  id="salePrice"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  className={`pl-10 mt-1 block w-full py-2 px-3 border ${errors.salePrice ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="500000"
                />
              </div>
              {errors.salePrice && <p className="mt-1 text-sm text-red-600 error-message">{errors.salePrice}</p>}
            </div>
            
            <div>
              <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700 mb-1">
                Sale Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                  <Calendar size={16} className="text-gray-400" />
                </div>
                <input
</>
                  type="date"
                  id="saleDate"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleChange}
                  className={`pl-10 mt-1 block w-full py-2 px-3 border ${errors.saleDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              {errors.saleDate && <p className="mt-1 text-sm text-red-600 error-message">{errors.saleDate}</p>}
            </div>
            
            <div><>

              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
</>
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div><>

              <label htmlFor="daysOnMarket" className="block text-sm font-medium text-gray-700 mb-1">
                Days on Market
              </label>
              <input
</>
                type="text"
                id="daysOnMarket"
                name="daysOnMarket"
                value={formData.daysOnMarket}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.daysOnMarket ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="30"
              />
              {errors.daysOnMarket && <p className="mt-1 text-sm text-red-600 error-message">{errors.daysOnMarket}</p>}
            </div>
          </div>
        </div>
        
        <div className="mb-6"><>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Property Details</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700 mb-1">
                Square Feet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                  <Ruler size={16} className="text-gray-400" />
                </div>
                <input
</>
                  type="text"
                  id="squareFeet"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  className={`pl-10 mt-1 block w-full py-2 px-3 border ${errors.squareFeet ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="2000"
                />
              </div>
              {errors.squareFeet && <p className="mt-1 text-sm text-red-600 error-message">{errors.squareFeet}</p>}
            </div>
            
            <div><>

              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
</>
                type="text"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.bedrooms ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="3"
              />
              {errors.bedrooms && <p className="mt-1 text-sm text-red-600 error-message">{errors.bedrooms}</p>}
            </div>
            
            <div><>

              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
</>
                type="text"
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.bathrooms ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="2.5"
              />
              {errors.bathrooms && <p className="mt-1 text-sm text-red-600 error-message">{errors.bathrooms}</p>}
            </div>
            
            <div><>

              <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-1">
                Year Built
              </label>
              <input
</>
                type="text"
                id="yearBuilt"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.yearBuilt ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="2000"
              />
              {errors.yearBuilt && <p className="mt-1 text-sm text-red-600 error-message">{errors.yearBuilt}</p>}
            </div>
            
            <div><>

              <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-1">
                Lot Size (sq. ft.)
              </label>
              <input
</>
                type="text"
                id="lotSize"
                name="lotSize"
                value={formData.lotSize}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${errors.lotSize ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="8000"
              />
              {errors.lotSize && <p className="mt-1 text-sm text-red-600 error-message">{errors.lotSize}</p>}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b"><>

            <h2 className="text-lg font-semibold text-gray-800">Adjustments</h2>
            <button
</>
              type="button"
              onClick={addAdjustment}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add Adjustment
            </button>
          </div>
          
          {formData.adjustments.map((adjustment /* , index */) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
              <div className="flex justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Adjustment {index + 1}</h3>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAdjustment(index)}
                    className="text-red-600 hover:text-red-800 flex items-center text-sm"
                  >
                    <Minus size={16} className="mr-1" /> Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><>

                  <label htmlFor={`adjustmentCategory-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
</>
                    id={`adjustmentCategory-${index}`}
                    value={adjustment.category}
                    onChange={(e) => handleAdjustmentChange(index, 'category', e.target.value)}
                    className={`mt-1 block w-full py-2 px-3 border ${errors[`adjustments[${index}].category`] ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="">Select category</option>
                    {adjustmentCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors[`adjustments[${index}].category`] && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors[`adjustments[${index}].category`]}</p>
                  )}
                </div>
                
                <div><>

                  <label htmlFor={`adjustmentDescription-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
</>
                    type="text"
                    id={`adjustmentDescription-${index}`}
                    value={adjustment.description}
                    onChange={(e) => handleAdjustmentChange(index, 'description', e.target.value)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Superior location"
                  />
                </div>
                
                <div><>

                  <label htmlFor={`adjustmentAmount-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div
</> className="flex space-x-2">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
</>
                        type="text"
                        id={`adjustmentAmount-${index}`}
                        value={adjustment.amount}
                        onChange={(e) => handleAdjustmentChange(index, 'amount', e.target.value)}
                        className={`pl-10 mt-1 block w-full py-2 px-3 border ${errors[`adjustments[${index}].amount`] ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="5000"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`adjustmentIsPercentage-${index}`}
                        checked={adjustment.isPercentage as boolean}
                        onChange={(e) => handleAdjustmentChange(index, 'isPercentage', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`adjustmentIsPercentage-${index}`} className="ml-2 text-sm text-gray-700">
                        %
                      </label>
                    </div>
                  </div>
                  {errors[`adjustments[${index}].amount`] && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors[`adjustments[${index}].amount`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end"><>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-4 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
</>
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Comparable'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComparableForm;