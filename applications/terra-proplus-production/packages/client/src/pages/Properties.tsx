import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProperties, useCreateProperty } from '../hooks/useProperties';
import { InsertProperty } from '../types';

const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Multi-Family',
  'Commercial',
  'Land',
  'Industrial',
  'Special Purpose'
];

const Properties = () => {
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useProperties();
  const createPropertyMutation = useCreateProperty();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // New property form state
  const [newProperty, setNewProperty] = useState<Partial<InsertProperty>>({
    property_type: 'Single Family',
    year_built: new Date().getFullYear() - 20, // Default to 20 years old
    square_feet: 0,
    bedrooms: 0,
    bathrooms: 0,
    lot_size: 0
  });
  
  // Handle property creation form submission
  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newProperty.address || !newProperty.city || !newProperty.state || 
        !newProperty.zip_code || !newProperty.property_type) {
      alert('Please fill out all required fields');
      return;
    }
    
    createPropertyMutation.mutate(newProperty as InsertProperty, {
      onSuccess: (data) => {
        // Reset form and hide it
        setNewProperty({
          property_type: 'Single Family',
          year_built: new Date().getFullYear() - 20,
          square_feet: 0,
          bedrooms: 0,
          bathrooms: 0,
          lot_size: 0
        });
        setShowCreateForm(false);
        
        // Navigate to the new property detail page
        navigate(`/properties/${data.id}`);
      },
      onError: (error) => {
        console.error('Error creating property:', error);
        alert('Failed to create property. Please try again.');
      }
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'year_built'].includes(name)) {
      setNewProperty(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setNewProperty(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Filter properties based on search term and property type
  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchTerm === '' || 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.zip_code.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === '' || property.property_type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Loading state
  if (isLoading) {
    return <div className="p-8">Loading properties...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6"><>

        <h1 className="text-3xl font-bold mb-4 md:mb-0">Properties</h1>
        <button
</> 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Add New Property'}
        </button>
      </div>
      
      {/* Property Creation Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade-in"><>

          <h2 className="text-xl font-semibold mb-4">Add New Property</h2>
          <form
</> onSubmit={handleCreateProperty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <div className="md:col-span-2"><>

              <label className="block text-sm font-medium mb-1">Address *</label>
              <input
</>
                type="text"
                name="address"
                value={newProperty.address || ''}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Street address"
              />
            </div>
            
            {/* City, State, ZIP */}
            <div><>

              <label className="block text-sm font-medium mb-1">City *</label>
              <input
</>
                type="text"
                name="city"
                value={newProperty.city || ''}
                onChange={handleInputChange}
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
                  value={newProperty.state || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="CA"
                />
              </div>
              <div><>

                <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                <input
</>
                  type="text"
                  name="zip_code"
                  value={newProperty.zip_code || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="94102"
                />
              </div>
            </div>
            
            {/* Property Type */}
            <div><>

              <label className="block text-sm font-medium mb-1">Property Type *</label>
              <select
</>
                name="property_type"
                value={newProperty.property_type || ''}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Year Built */}
            <div><>

              <label className="block text-sm font-medium mb-1">Year Built</label>
              <input
</>
                type="number"
                name="year_built"
                value={newProperty.year_built || ''}
                onChange={handleInputChange}
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
                value={newProperty.square_feet || ''}
                onChange={handleInputChange}
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
                  value={newProperty.bedrooms || ''}
                  onChange={handleInputChange}
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
                  value={newProperty.bathrooms || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            
            {/* Lot Size */}
            <div><>

              <label className="block text-sm font-medium mb-1">Lot Size (sq ft)</label>
              <input
</>
                type="number"
                name="lot_size"
                value={newProperty.lot_size || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            
            {/* Parcel Number & Zoning */}
            <div><>

              <label className="block text-sm font-medium mb-1">Parcel Number</label>
              <input
</>
                type="text"
                name="parcel_number"
                value={newProperty.parcel_number || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div><>

              <label className="block text-sm font-medium mb-1">Zoning</label>
              <input
</>
                type="text"
                name="zoning"
                value={newProperty.zoning || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., R-1, C-2"
              />
            </div>
            
            {/* Description */}
            <div className="md:col-span-2"><>

              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
</>
                name="description"
                value={newProperty.description || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              ></textarea>
            </div>
            
            {/* Submission buttons */}
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                disabled={createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><>

            <label className="block text-sm font-medium mb-1">Search</label>
            <input
</>
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Search address, city, state, or ZIP"
            />
          </div>
          <div><>

            <label className="block text-sm font-medium mb-1">Filter by Type</label>
            <select
</>
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Property Types</option>
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Property List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No properties found matching your search criteria.</p>
            {searchTerm || filterType ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                }}
                className="mt-2 text-primary hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <p className="mt-2 text-gray-500">Add a new property to get started.</p>
            )}
          </div>
        ) : (
          filteredProperties.map(property => (
            <Link 
              key={property.id} 
              to={`/properties/${property.id}`}
              className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gray-200 flex items-center justify-center">
                <div className="text-4xl text-gray-400">
                  {property.property_type === 'Commercial' ? '🏢' : 
                   property.property_type === 'Land' ? '🏞️' : 
                   property.property_type === 'Multi-Family' ? '🏘️' : '🏠'}
                </div>
              </div>
              <div className="p-4"><>

                <h3 className="font-semibold text-lg mb-1 text-primary">{property.address}</h3>
                <p
</> className="text-gray-600 text-sm mb-3">{property.city}, {property.state} {property.zip_code}</p>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Type:</span> {property.property_type}
                  </div>
                  {property.square_feet && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Size:</span> {property.square_feet.toLocaleString()} sqft
                    </div>
                  )}
                  {property.bedrooms > 0 && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Beds:</span> {property.bedrooms}
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Baths:</span> {property.bathrooms}
                    </div>
                  )}
                  {property.year_built && (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Built:</span> {property.year_built}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Properties;