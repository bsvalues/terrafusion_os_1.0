import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProperty, useUpdateProperty, useDeleteProperty } from '../hooks/useProperties';
import { useAppraisalsByProperty, useCreateAppraisal } from '../hooks/useAppraisals';
import { Property, InsertAppraisal } from '../types';
import { format } from 'date-fns';

const APPRAISAL_STATUSES = ['Scheduled', 'In Progress', 'Review', 'Completed', 'Canceled'];

const APPRAISAL_PURPOSES = [
  'Purchase', 
  'Refinance', 
  'Home Equity', 
  'Estate Planning',
  'Tax Assessment',
  'Divorce Settlement',
  'Bankruptcy',
  'PMI Removal',
  'Pre-Listing',
  'Other'
];

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = parseInt(id || '0');
  
  // Fetch property details
  const { 
    data: property, 
    isLoading: isLoadingProperty,
    error: propertyError
  } = useProperty(propertyId);
  
  // Fetch property appraisals
  const { 
    data: appraisals = [], 
    isLoading: isLoadingAppraisals 
  } = useAppraisalsByProperty(propertyId);
  
  // Property update/delete mutations
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  const createAppraisalMutation = useCreateAppraisal();
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewAppraisalForm, setShowNewAppraisalForm] = useState(false);
  const [editableProperty, setEditableProperty] = useState<Property | null>(null);
  
  // New appraisal form state
  const [newAppraisal, setNewAppraisal] = useState<Partial<InsertAppraisal>>({
    property_id: propertyId,
    appraiser_id: 1, // Default to first appraiser
    status: 'Scheduled',
    purpose: 'Purchase'
  });
  
  // Handle form changes for property editing
  const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editableProperty) return;
    
    const { name, value } = e.target;
    
    if (['square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'year_built', 'latitude', 'longitude'].includes(name)) {
      setEditableProperty({
        ...editableProperty,
        [name]: value === '' ? undefined : Number(value)
      });
    } else {
      setEditableProperty({
        ...editableProperty,
        [name]: value
      });
    }
  };
  
  // Handle form changes for new appraisal
  const handleAppraisalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['property_id', 'appraiser_id'].includes(name)) {
      setNewAppraisal({
        ...newAppraisal,
        [name]: Number(value)
      });
    } else {
      setNewAppraisal({
        ...newAppraisal,
        [name]: value
      });
    }
  };
  
  // Start editing
  const startEditing = () => {
    if (property) {
      setEditableProperty({...property});
      setIsEditing(true);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditableProperty(null);
  };
  
  // Save property changes
  const savePropertyChanges = () => {
    if (!editableProperty) return;
    
    updatePropertyMutation.mutate({
      id: editableProperty.id,
      data: editableProperty
    }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditableProperty(null);
      },
      onError: (error) => {
        console.error('Error updating property:', error);
        alert('Failed to update property. Please try again.');
      }
    });
  };
  
  // Delete property
  const deleteProperty = () => {
    if (!property) return;
    
    deletePropertyMutation.mutate(property, {
      onSuccess: () => {
        navigate('/');
      },
      onError: (error) => {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      }
    });
  };
  
  // Create new appraisal
  const createAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    
    createAppraisalMutation.mutate(newAppraisal as InsertAppraisal, {
      onSuccess: (data) => {
        setShowNewAppraisalForm(false);
        setNewAppraisal({
          property_id: propertyId,
          appraiser_id: 1,
          status: 'Scheduled',
          purpose: 'Purchase'
        });
        
        // Navigate to the new appraisal detail page
        navigate(`/appraisals/${data.id}`);
      },
      onError: (error) => {
        console.error('Error creating appraisal:', error);
        alert('Failed to create appraisal. Please try again.');
      }
    });
  };
  
  // Loading state
  if (isLoadingProperty || isLoadingAppraisals) {
    return <div className="p-8 flex justify-center">Loading property details...</div>;
  }
  
  // Error state
  if (propertyError || !property) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"><>

          <p className="font-medium">Error loading property</p>
          <p
</> className="mt-1">The property you're looking for doesn't exist or couldn't be loaded.</p>
          <Link to="/" className="inline-block mt-4 text-red-700 hover:text-red-800 font-medium">
            ← Return to Properties
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate general property info
  const formattedAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const formattedBedBaths = `${property.bedrooms || 0} bed${(property.bedrooms || 0) !== 1 ? 's' : ''} | ${property.bathrooms || 0} bath${(property.bathrooms || 0) !== 1 ? 's' : ''}`;
  const formattedSize = property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : 'Size not specified';
  
  return (
    <div className="p-6">
      {/* Property Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center space-x-2"><>

            <Link to="/" className="text-primary hover:text-primary/80">← Back to Properties</Link>
            <span
</> className="text-gray-400">|</span>
            <span className="text-gray-500 text-sm">Property ID: {property.id}</span>
          </div><>

          <h1 className="text-3xl font-bold mt-2 text-gray-800">{property.address}</h1>
          <p
</> className="text-gray-600">{property.city}, {property.state} {property.zip_code}</p>
        </div>
        
        <div className="mt-4 md:mt-0 space-x-2">
          {!isEditing ? (
            <><>

              <button 
                onClick={startEditing}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit Property
              </button>
              <button
</> 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <><>

              <button 
                onClick={savePropertyChanges}
                disabled={updatePropertyMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updatePropertyMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
</> 
                onClick={cancelEditing}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"><>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Property Deletion</h3>
            <p
</> className="text-gray-600 mb-6">
              Are you sure you want to delete this property? This action cannot be undone and will also delete all associated appraisals and data.
            </p>
            <div className="flex justify-end space-x-3"><>

              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
</> 
                onClick={deleteProperty}
                disabled={deletePropertyMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {deletePropertyMutation.isPending ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Property Image or Placeholder */}
            <div className="h-64 bg-gray-200 flex items-center justify-center border-b">
              <div className="text-8xl text-gray-400">
                {property.property_type === 'Commercial' ? '🏢' : 
                 property.property_type === 'Land' ? '🏞️' : 
                 property.property_type === 'Multi-Family' ? '🏘️' : '🏠'}
              </div>
            </div>
            
            {isEditing ? (
              // Edit Mode
              <div className="p-6"><>

                <h2 className="text-xl font-semibold mb-4">Edit Property Details</h2>
                
                <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="md:col-span-2"><>

                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <input
</>
                      type="text"
                      name="address"
                      value={editableProperty?.address || ''}
                      onChange={handlePropertyChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* City, State, ZIP */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
</>
                      type="text"
                      name="city"
                      value={editableProperty?.city || ''}
                      onChange={handlePropertyChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><>

                      <label className="block text-sm font-medium mb-1">State *</label>
                      <input
</>
                        type="text"
                        name="state"
                        value={editableProperty?.state || ''}
                        onChange={handlePropertyChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                      <input
</>
                        type="text"
                        name="zip_code"
                        value={editableProperty?.zip_code || ''}
                        onChange={handlePropertyChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  {/* Property Type */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">Property Type *</label>
                    <select
</>
                      name="property_type"
                      value={editableProperty?.property_type || ''}
                      onChange={handlePropertyChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    ><>

                      <option value="Single Family">Single Family</option>
                      <option
</> value="Condo">Condo</option><>

                      <option value="Multi-Family">Multi-Family</option>
                      <option
</> value="Commercial">Commercial</option><>

                      <option value="Land">Land</option>
                      <option
</> value="Industrial">Industrial</option>
                      <option value="Special Purpose">Special Purpose</option>
                    </select>
                  </div>
                  
                  {/* Year Built */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">Year Built</label>
                    <input
</>
                      type="number"
                      name="year_built"
                      value={editableProperty?.year_built || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  {/* Square Feet */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">Square Feet</label>
                    <input
</>
                      type="number"
                      name="square_feet"
                      value={editableProperty?.square_feet || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                  
                  {/* Lot Size */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">Lot Size (sq ft)</label>
                    <input
</>
                      type="number"
                      name="lot_size"
                      value={editableProperty?.lot_size || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                  
                  {/* Bedrooms & Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><>

                      <label className="block text-sm font-medium mb-1">Bedrooms</label>
                      <input
</>
                        type="number"
                        name="bedrooms"
                        value={editableProperty?.bedrooms || ''}
                        onChange={handlePropertyChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">Bathrooms</label>
                      <input
</>
                        type="number"
                        name="bathrooms"
                        value={editableProperty?.bathrooms || ''}
                        onChange={handlePropertyChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                  
                  {/* Parcel Number & Zoning */}
                  <div><>

                    <label className="block text-sm font-medium mb-1">Parcel Number</label>
                    <input
</>
                      type="text"
                      name="parcel_number"
                      value={editableProperty?.parcel_number || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div><>

                    <label className="block text-sm font-medium mb-1">Zoning</label>
                    <input
</>
                      type="text"
                      name="zoning"
                      value={editableProperty?.zoning || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="md:col-span-2"><>

                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
</>
                      name="description"
                      value={editableProperty?.description || ''}
                      onChange={handlePropertyChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={4}
                    ></textarea>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:divide-x md:divide-gray-200">
                  <div className="md:pr-6 mb-4 md:mb-0 md:w-1/2"><>

                    <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                    <div
</> className="space-y-3">
                      <div><>

                        <p className="text-sm text-gray-500">Address</p>
                        <p
</> className="font-medium">{formattedAddress}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Property Type</p>
                        <p
</> className="font-medium">{property.property_type}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Year Built</p>
                        <p
</> className="font-medium">{property.year_built || 'Not specified'}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Parcel Number</p>
                        <p
</> className="font-medium">{property.parcel_number || 'Not specified'}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Zoning</p>
                        <p
</> className="font-medium">{property.zoning || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:pl-6 md:w-1/2"><>

                    <h2 className="text-xl font-semibold mb-4 md:hidden">Property Specifications</h2>
                    <div
</> className="space-y-3">
                      <div><>

                        <p className="text-sm text-gray-500">Size</p>
                        <p
</> className="font-medium">{formattedSize}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Bedrooms / Bathrooms</p>
                        <p
</> className="font-medium">{formattedBedBaths}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Lot Size</p>
                        <p
</> className="font-medium">{property.lot_size ? `${property.lot_size.toLocaleString()} sqft` : 'Not specified'}</p>
                      </div>
                      {property.description && (
                        <div className="mt-4"><>

                          <p className="text-sm text-gray-500 mb-1">Description</p>
                          <p
</> className="text-gray-700">{property.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Appraisal History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4"><>

              <h2 className="text-xl font-semibold">Appraisal History</h2>
              <button
</>
                onClick={() => setShowNewAppraisalForm(!showNewAppraisalForm)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {showNewAppraisalForm ? 'Cancel' : 'New Appraisal'}
              </button>
            </div>
            
            {/* New Appraisal Form */}
            {showNewAppraisalForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4 animate-fade-in"><>

                <h3 className="text-lg font-medium mb-3">Create New Appraisal</h3>
                <form
</> onSubmit={createAppraisal}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><>

                      <label className="block text-sm font-medium mb-1">Purpose *</label>
                      <select
</>
                        name="purpose"
                        value={newAppraisal.purpose || ''}
                        onChange={handleAppraisalChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {APPRAISAL_PURPOSES.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div><>

                      <label className="block text-sm font-medium mb-1">Status *</label>
                      <select
</>
                        name="status"
                        value={newAppraisal.status || ''}
                        onChange={handleAppraisalChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {APPRAISAL_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div><>

                      <label className="block text-sm font-medium mb-1">Client Name</label>
                      <input
</>
                        type="text"
                        name="client_name"
                        value={newAppraisal.client_name || ''}
                        onChange={handleAppraisalChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div><>

                      <label className="block text-sm font-medium mb-1">Client Email</label>
                      <input
</>
                        type="email"
                        name="client_email"
                        value={newAppraisal.client_email || ''}
                        onChange={handleAppraisalChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div><>

                      <label className="block text-sm font-medium mb-1">Lender Name</label>
                      <input
</>
                        type="text"
                        name="lender_name"
                        value={newAppraisal.lender_name || ''}
                        onChange={handleAppraisalChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div><>

                      <label className="block text-sm font-medium mb-1">Loan Number</label>
                      <input
</>
                        type="text"
                        name="loan_number"
                        value={newAppraisal.loan_number || ''}
                        onChange={handleAppraisalChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="md:col-span-2"><>

                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea
</>
                        name="notes"
                        value={newAppraisal.notes || ''}
                        onChange={handleAppraisalChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={createAppraisalMutation.isPending}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {createAppraisalMutation.isPending ? 'Creating...' : 'Create Appraisal'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {appraisals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md"><>

                <p className="text-gray-500">No appraisals found for this property.</p>
                <p
</> className="text-sm text-gray-500 mt-1">Click 'New Appraisal' to start one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr><>

                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th
</> className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><>

                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th
</> className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th><>

                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th
</> className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appraisals.map((appraisal) => {
                      const statusColor = appraisal.status === 'Completed' ? 'text-green-600 bg-green-100' :
                                          appraisal.status === 'In Progress' ? 'text-blue-600 bg-blue-100' :
                                          appraisal.status === 'Scheduled' ? 'text-yellow-600 bg-yellow-100' :
                                          appraisal.status === 'Canceled' ? 'text-red-600 bg-red-100' :
                                          'text-gray-600 bg-gray-100';
                      
                      return (
                        <tr key={appraisal.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">#{appraisal.id}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {format(new Date(appraisal.created_at), 'MMM d, yyyy')}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{appraisal.purpose}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{appraisal.client_name || '—'}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                              {appraisal.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {appraisal.market_value
                                ? new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0
                                  }).format(appraisal.market_value)
                                : '—'
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                            <Link 
                              to={`/appraisals/${appraisal.id}`} 
                              className="text-primary hover:text-primary/80 font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Property Map and Location */}
        <div className="space-y-6">
          {/* Map Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              {/* Placeholder for a map - would be replaced with a real map component */}
              <div className="text-center p-4"><>

                <div className="text-4xl mb-2">📍</div>
                <p
</> className="text-gray-600">Map View</p>
                <p className="text-sm text-gray-500 mt-1">{formattedAddress}</p>
              </div>
            </div>
            
            <div className="p-4"><>

              <h3 className="font-medium mb-2">Property Location</h3>
              <p
</> className="text-gray-600 text-sm mb-2">{formattedAddress}</p>
              
              {(property.latitude && property.longitude) && (
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Latitude:</span> {property.latitude}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span> {property.longitude}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Nearby Comparables Card */}
          <div className="bg-white rounded-lg shadow-md p-4"><>

            <h3 className="font-medium mb-3">Nearby Comparable Properties</h3>
            
            <div
</> className="space-y-3">
              <div className="flex items-start border-l-4 border-primary pl-3 py-1">
                <div className="flex-1 min-w-0"><>

                  <p className="text-sm font-medium text-gray-900 truncate">
                    123 Nearby St
                  </p>
                  <p
</> className="text-xs text-gray-500">
                    Sold: $850,000 (Mar 15, 2025)
                  </p>
                </div>
                <div className="text-right"><>

                  <p className="text-sm font-semibold text-gray-900">$708/sqft</p>
                  <p
</> className="text-xs text-gray-500">1,200 sqft</p>
                </div>
              </div>
              
              <div className="flex items-start border-l-4 border-primary pl-3 py-1">
                <div className="flex-1 min-w-0"><>

                  <p className="text-sm font-medium text-gray-900 truncate">
                    456 Close Ave
                  </p>
                  <p
</> className="text-xs text-gray-500">
                    Sold: $925,000 (Feb 3, 2025)
                  </p>
                </div>
                <div className="text-right"><>

                  <p className="text-sm font-semibold text-gray-900">$750/sqft</p>
                  <p
</> className="text-xs text-gray-500">1,233 sqft</p>
                </div>
              </div>
              
              <div className="flex items-start border-l-4 border-primary pl-3 py-1">
                <div className="flex-1 min-w-0"><>

                  <p className="text-sm font-medium text-gray-900 truncate">
                    789 Similar Ln
                  </p>
                  <p
</> className="text-xs text-gray-500">
                    Sold: $890,000 (Jan 22, 2025)
                  </p>
                </div>
                <div className="text-right"><>

                  <p className="text-sm font-semibold text-gray-900">$712/sqft</p>
                  <p
</> className="text-xs text-gray-500">1,250 sqft</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                View All Comparable Properties
              </button>
            </div>
          </div>
          
          {/* Local Market Data Card */}
          <div className="bg-white rounded-lg shadow-md p-4"><>

            <h3 className="font-medium mb-3">Local Market Trends</h3>
            
            <div
</> className="space-y-4">
              <div>
                <div className="flex justify-between mb-1"><>

                  <p className="text-sm text-gray-600">Median Price</p>
                  <p
</> className="text-sm font-medium">$925,000</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Up 5.3% from last year</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1"><>

                  <p className="text-sm text-gray-600">Days on Market</p>
                  <p
</> className="text-sm font-medium">18 days</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Down 12% from last year</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1"><>

                  <p className="text-sm text-gray-600">Price per sqft</p>
                  <p
</> className="text-sm font-medium">$725/sqft</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Up 3.8% from last year</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/market-analysis" className="text-sm text-primary hover:text-primary/80 font-medium">
                View Full Market Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;