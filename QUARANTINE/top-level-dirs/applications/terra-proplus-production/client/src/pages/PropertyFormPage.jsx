import React, { useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const PropertyFormPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'residential',
    bedrooms: 3,
    bathrooms: '2',
    squareFeet: '',
    lotSize: '',
    yearBuilt: new Date().getFullYear(),
    description: '',
    parcelNumber: '',
    zoning: '',
  });
  
  const [errors, setErrors] = useState({});

  // Fetch property data if we're in edit mode
  const { data: propertyData, isLoading: propertyLoading } = useQuery({
    queryKey: ['/api/properties', id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }
      return response.json();
    },
    enabled: isEditMode,
  });

  // Update form data when property data is loaded
  useEffect(() => {
    if (propertyData) {
      setFormData(propertyData);
    }
  }, [propertyData]);

  // Create property mutation
  const createProperty = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create property');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate properties query and redirect to the new property
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      history.push(`/properties/${data.id}`);
    },
  });

  // Update property mutation
  const updateProperty = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate property query and redirect back to the property
      queryClient.invalidateQueries({ queryKey: ['/api/properties', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      history.push(`/properties/${id}`);
    },
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
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
    
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode?.trim()) {
      newErrors.zipCode = 'Zip code is required';
    }
    
    if (!formData.propertyType?.trim()) {
      newErrors.propertyType = 'Property type is required';
    }
    
    if (!formData.bedrooms || formData.bedrooms < 0) {
      newErrors.bedrooms = 'Valid number of bedrooms is required';
    }
    
    if (!formData.bathrooms?.trim()) {
      newErrors.bathrooms = 'Bathrooms is required';
    }
    
    if (!formData.squareFeet?.trim()) {
      newErrors.squareFeet = 'Square feet is required';
    }
    
    if (!formData.yearBuilt || formData.yearBuilt < 1800 || formData.yearBuilt > new Date().getFullYear()) {
      newErrors.yearBuilt = `Year built must be between 1800 and ${new Date().getFullYear()}`;
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.parcelNumber?.trim()) {
      newErrors.parcelNumber = 'Parcel number is required';
    }
    
    if (!formData.zoning?.trim()) {
      newErrors.zoning = 'Zoning is required';
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
      updateProperty.mutate(formData);
    } else {
      createProperty.mutate(formData);
    }
  };

  // Loading state
  if (isEditMode && propertyLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span>Loading property data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link 
          to={isEditMode ? `/properties/${id}` : "/properties"} 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          {isEditMode ? 'Back to Property' : 'Back to Properties'}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Property' : 'Add New Property'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Address */}
            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.address ? 'border-red-300' : ''
                  }`}
                  placeholder="123 Main St"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* City */}
            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.city ? 'border-red-300' : ''
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>

            {/* State */}
            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="state"
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.state ? 'border-red-300' : ''
                  }`}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Zip Code */}
            <div className="sm:col-span-2">
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                Zip Code <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.zipCode ? 'border-red-300' : ''
                  }`}
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                )}
              </div>
            </div>

            {/* Property Type */}
            <div className="sm:col-span-3">
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.propertyType ? 'border-red-300' : ''
                  }`}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="land">Land</option>
                  <option value="multi-family">Multi-Family</option>
                </select>
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>
                )}
              </div>
            </div>

            {/* Parcel Number */}
            <div className="sm:col-span-3">
              <label htmlFor="parcelNumber" className="block text-sm font-medium text-gray-700">
                Parcel Number <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="parcelNumber"
                  id="parcelNumber"
                  value={formData.parcelNumber}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.parcelNumber ? 'border-red-300' : ''
                  }`}
                />
                {errors.parcelNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.parcelNumber}</p>
                )}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="sm:col-span-2">
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                Bedrooms <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="bedrooms"
                  id="bedrooms"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.bedrooms ? 'border-red-300' : ''
                  }`}
                />
                {errors.bedrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>
                )}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="sm:col-span-2">
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                Bathrooms <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="bathrooms"
                  id="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.bathrooms ? 'border-red-300' : ''
                  }`}
                />
                {errors.bathrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>
                )}
              </div>
            </div>

            {/* Year Built */}
            <div className="sm:col-span-2">
              <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700">
                Year Built <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="yearBuilt"
                  id="yearBuilt"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.yearBuilt ? 'border-red-300' : ''
                  }`}
                />
                {errors.yearBuilt && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearBuilt}</p>
                )}
              </div>
            </div>

            {/* Square Feet */}
            <div className="sm:col-span-3">
              <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700">
                Square Feet <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="squareFeet"
                  id="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.squareFeet ? 'border-red-300' : ''
                  }`}
                />
                {errors.squareFeet && (
                  <p className="mt-1 text-sm text-red-600">{errors.squareFeet}</p>
                )}
              </div>
            </div>

            {/* Lot Size */}
            <div className="sm:col-span-3">
              <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700">
                Lot Size
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="lotSize"
                  id="lotSize"
                  value={formData.lotSize || ''}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Zoning */}
            <div className="sm:col-span-3">
              <label htmlFor="zoning" className="block text-sm font-medium text-gray-700">
                Zoning <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="zoning"
                  id="zoning"
                  value={formData.zoning}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.zoning ? 'border-red-300' : ''
                  }`}
                />
                {errors.zoning && (
                  <p className="mt-1 text-sm text-red-600">{errors.zoning}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.description ? 'border-red-300' : ''
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form action buttons */}
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <Link
                to={isEditMode ? `/properties/${id}` : "/properties"}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createProperty.isPending || updateProperty.isPending}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {(createProperty.isPending || updateProperty.isPending) ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isEditMode ? 'Update Property' : 'Create Property'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {(createProperty.isError || updateProperty.isError) && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {isEditMode ? 'Error updating property' : 'Error creating property'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{createProperty.error?.message || updateProperty.error?.message}</p>
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

export default PropertyFormPage;