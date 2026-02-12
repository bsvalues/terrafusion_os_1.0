import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';

const NewPipelineModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository: '',
    branch: 'main',
    type: 'deployment'
  });
  const [errors, setErrors] = useState({});

  // Mutation for creating a new pipeline
  const createPipeline = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pipeline');
      }
      
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating pipeline:', error);
    }
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Pipeline name is required';
    }
    
    if (!formData.repository.trim()) {
      newErrors.repository = 'Repository URL is required';
    } else if (!/^(github\.com\/|https?:\/\/github\.com\/)[\w-]+\/[\w-]+$/.test(formData.repository)) {
      newErrors.repository = 'Invalid repository format. Example: github.com/owner/repo';
    }
    
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      createPipeline.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Create New Pipeline</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Pipeline Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Pipeline Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. API Gateway Deployment"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          
          {/* Repository */}
          <div className="mb-4">
            <label htmlFor="repository" className="block text-sm font-medium text-gray-700 mb-1">
              Repository URL *
            </label>
            <input
              type="text"
              id="repository"
              name="repository"
              value={formData.repository}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.repository ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="github.com/owner/repo"
            />
            {errors.repository && (
              <p className="mt-1 text-sm text-red-600">{errors.repository}</p>
            )}
          </div>
          
          {/* Branch */}
          <div className="mb-4">
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <input
              type="text"
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.branch ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="main"
            />
            {errors.branch && (
              <p className="mt-1 text-sm text-red-600">{errors.branch}</p>
            )}
          </div>
          
          {/* Pipeline Type */}
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Pipeline Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="deployment">Deployment</option>
              <option value="build">Build</option>
              <option value="test">Test</option>
            </select>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of this pipeline's purpose"
            ></textarea>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPipeline.isPending}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                createPipeline.isPending
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {createPipeline.isPending ? 'Creating...' : 'Create Pipeline'}
            </button>
          </div>
          
          {/* Error message */}
          {createPipeline.isError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {createPipeline.error.message || 'An error occurred while creating the pipeline.'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewPipelineModal;