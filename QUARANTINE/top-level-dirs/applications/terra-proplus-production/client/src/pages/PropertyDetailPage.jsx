import React, { useState } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Edit, Trash2, Plus, Loader2, AlertCircle, Home } from 'lucide-react';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch property details
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery({
    queryKey: ['/api/properties', id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      return response.json();
    }
  });

  // Fetch appraisals for this property
  const { data: appraisals, isLoading: appraisalsLoading } = useQuery({
    queryKey: ['/api/appraisals', { propertyId: id }],
    queryFn: async () => {
      const response = await fetch(`/api/appraisals?propertyId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appraisals');
      }
      return response.json();
    },
    enabled: !!id
  });

  // Delete property mutation
  const deleteProperty = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      return true;
    },
    onSuccess: () => {
      // Redirect to properties list
      history.push('/properties');
      // Invalidate properties query
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    }
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    deleteProperty.mutate();
  };

  if (propertyLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span>Loading property details...</span>
      </div>
    );
  }

  if (propertyError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium">Error loading property</h3>
            <p className="text-sm">{propertyError.message}</p>
            <Link to="/properties" className="text-sm text-red-700 underline mt-2 inline-block">
              Return to Property List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link to="/properties" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Properties
        </Link>
      </div>

      {/* Property header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property?.address}</h1>
          <p className="text-gray-600">{property?.city}, {property?.state} {property?.zipCode}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/properties/${id}/edit`}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Property details */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Home className="mr-2" size={20} />
            Property Details
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Property Type</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.propertyType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Year Built</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.yearBuilt}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.bedrooms}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.bathrooms}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Square Feet</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.squareFeet}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lot Size</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.lotSize || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Parcel Number</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.parcelNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Zoning</h3>
              <p className="mt-1 text-sm text-gray-900">{property?.zoning}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm text-gray-900">{property?.description}</p>
          </div>
        </div>
      </div>

      {/* Appraisals section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="mr-2" size={20} />
            Appraisals
          </h2>
          <Link
            to={`/properties/${id}/appraisals/new`}
            className="flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            New Appraisal
          </Link>
        </div>

        <div className="p-6">
          {appraisalsLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />
              <span className="text-gray-600">Loading appraisals...</span>
            </div>
          ) : appraisals?.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appraisals</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new appraisal.</p>
              <div className="mt-6">
                <Link
                  to={`/properties/${id}/appraisals/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-1 -ml-1" size={16} />
                  New Appraisal
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appraiser
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appraisals?.map((appraisal) => (
                    <tr key={appraisal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(appraisal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${appraisal.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            appraisal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {appraisal.status === 'in_progress' ? 'In Progress' : 
                           appraisal.status === 'completed' ? 'Completed' : 
                           appraisal.status.charAt(0).toUpperCase() + appraisal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appraisal.appraiser?.name || 'Appraiser #' + appraisal.appraiserId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appraisal.marketValue ? `$${Number(appraisal.marketValue).toLocaleString()}` : 'Not Set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appraisal.purpose || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/appraisals/${appraisal.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Property</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this property? This action cannot be undone.
                        All appraisals associated with this property will also be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                  disabled={deleteProperty.isPending}
                >
                  {deleteProperty.isPending ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;