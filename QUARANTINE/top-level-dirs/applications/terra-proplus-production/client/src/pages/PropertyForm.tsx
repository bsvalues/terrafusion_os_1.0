import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, 
  Save, 
  ArrowLeft, 
  Warning,
  Home,
  Building,
  MapPin,
  Users,
  Ruler
 } from '@mui/icons-material';

interface PropertyFormData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  squareFeet: number | '';
  bedrooms: number | '' | null;
  bathrooms: number | '' | null;
  yearBuilt: number | '' | null;
  lotSize: number | '' | null;
  lotSizeUnit: string | null;
  description: string | null;
}

const PropertyForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Residential',
    squareFeet: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    lotSize: '',
    lotSizeUnit: 'acres',
    description: ''
  });

  // Load property data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPropertyData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/properties/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch property data');
          }
          const data = await response.json();
          setFormData({
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            propertyType: data.propertyType,
            squareFeet: data.squareFeet,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            yearBuilt: data.yearBuilt,
            lotSize: data.lotSize,
            lotSizeUnit: data.lotSizeUnit,
            description: data.description
          });
          setIsLoading(false);
        } catch (error: any) {
          console.error('Error:', error);
          setError(error.message || 'Failed to load property details');
          setIsLoading(false);
        }
      };

      fetchPropertyData();
    }
  }, [id, isEditing]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate form data
  const validateForm = (): string | null => {
    // Required fields
    if (!formData.address) return 'Address is required';
    if (!formData.city) return 'City is required';
    if (!formData.state) return 'State is required';
    if (!formData.zipCode) return 'ZIP Code is required';
    if (!formData.propertyType) return 'Property type is required';
    if (formData.squareFeet === '') return 'Square feet is required';

    // Validate square feet
    if (typeof formData.squareFeet === 'number' && formData.squareFeet <= 0) {
      return 'Square feet must be greater than zero';
    }

    // Optional number fields should be positive if provided
    if (typeof formData.bedrooms === 'number' && formData.bedrooms < 0) {
      return 'Bedrooms cannot be negative';
    }
    if (typeof formData.bathrooms === 'number' && formData.bathrooms < 0) {
      return 'Bathrooms cannot be negative';
    }
    if (typeof formData.yearBuilt === 'number') {
      const currentYear = new Date().getFullYear();
      if (formData.yearBuilt < 1800 || formData.yearBuilt > currentYear) {
        return `Year built must be between 1800 and ${currentYear}`;
      }
    }
    if (typeof formData.lotSize === 'number' && formData.lotSize <= 0) {
      return 'Lot size must be greater than zero';
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Prepare data for submission - convert empty strings to null for optional fields
    const propertyData = {
      ...formData,
      bedrooms: formData.bedrooms === '' ? null : Number(formData.bedrooms),
      bathrooms: formData.bathrooms === '' ? null : Number(formData.bathrooms),
      yearBuilt: formData.yearBuilt === '' ? null : Number(formData.yearBuilt),
      lotSize: formData.lotSize === '' ? null : Number(formData.lotSize),
      description: formData.description === '' ? null : formData.description
    };

    try {
      const url = isEditing ? `/api/properties/${id}` : '/api/properties';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} property`);
      }

      const data = await response.json();
      setSubmitted(true);
      
      // Navigate back to properties list or property detail
      if (isEditing) {
        navigate(`/properties/${id}`);
      } else {
        navigate(`/properties/${data.id}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || `An error occurred while ${isEditing ? 'updating' : 'creating'} the property`);
      setIsLoading(false);
    }
  };

  // Determine appropriate property type icon
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'Residential':
        return <Home className="w-5 h-5" />;
      case 'Commercial':
        return <Building className="w-5 h-5" />;
      case 'Multi-Family':
        return <Users className="w-5 h-5" />;
      case 'Land':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/properties" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"><>

            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Properties
          </Link>
          <h1
</> className="text-2xl font-bold">{isEditing ? 'Edit Property' : 'Add New Property'}</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex items-center">
              <Warning className="w-5 h-5 mr-2" />
              <p className="font-medium">Please correct the following error:</p>
            </div>
            <p className="mt-1 ml-7">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div><>

            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label><>

                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                  required
                />
              </div>

              <div
</>>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label><>

                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                  required
                />
              </div>

              <div
</> className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label><>

                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="block w-full border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div
</>>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="block w-full border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className="block w-full border-gray-300 rounded-md pr-10"
                    required
                  ><>

                    <option value="Residential">Residential</option>
                    <option
</> value="Commercial">Commercial</option><>

                    <option value="Multi-Family">Multi-Family</option>
                    <option
</> value="Land">Land</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {getPropertyTypeIcon(formData.propertyType)}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700 mb-1">
                  Square Feet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="squareFeet"
                    name="squareFeet"
                    value={formData.squareFeet}
                    onChange={handleInputChange}
                    className="block w-full border-gray-300 rounded-md"
                    min="1"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Ruler className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div><>

            <h2 className="text-lg font-semibold mb-4">Property Details</h2>
            <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.propertyType !== 'Land' && formData.propertyType !== 'Commercial' && (
                <>
                  <div><>

                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
</>
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms === null ? '' : formData.bedrooms}
                      onChange={handleInputChange}
                      className="block w-full border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                </>
              )}

              <div><>

                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
</>
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms === null ? '' : formData.bathrooms}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                  min="0"
                  step="0.5"
                />
              </div>

              <div><>

                <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
</>
                  type="number"
                  id="yearBuilt"
                  name="yearBuilt"
                  value={formData.yearBuilt === null ? '' : formData.yearBuilt}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div><>

                <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Lot Size
                </label>
                <input
</>
                  type="number"
                  id="lotSize"
                  name="lotSize"
                  value={formData.lotSize === null ? '' : formData.lotSize}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div><>

                <label htmlFor="lotSizeUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Lot Size Unit
                </label>
                <select
</>
                  id="lotSizeUnit"
                  name="lotSizeUnit"
                  value={formData.lotSizeUnit || ''}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md"
                ><>

                  <option value="acres">Acres</option>
                  <option
</> value="square feet">Square Feet</option><>

                  <option value="square meters">Square Meters</option>
                  <option
</> value="hectares">Hectares</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div><>

            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <div
</>><>

              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Property Description
              </label>
              <textarea
</>
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="block w-full border-gray-300 rounded-md"
                placeholder="Enter a detailed description of the property..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;