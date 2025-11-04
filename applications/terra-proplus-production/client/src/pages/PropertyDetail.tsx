import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Clipboard, BarChart4, FileText, MapPin, Calendar, Home, Map  } from '@mui/icons-material';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  bedrooms: number;
  bathrooms: string;
  square_feet: string;
  lot_size: string | null;
  year_built: number;
  description: string;
  parcel_number: string;
  zoning: string;
  created_at: string;
  updated_at: string;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: property, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      return response.json() as Promise<Property>;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><>

        <strong className="font-bold">Error!</strong>
        <span
</> className="block sm:inline"> Failed to load property details. Please try again later.</span>
        <div className="mt-4">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/properties')}
          >
            Return to Properties
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { id: 'appraisals', label: 'Appraisals', icon: <Clipboard className="w-5 h-5" /> },
    { id: 'comparables', label: 'Comparables', icon: <MapPin className="w-5 h-5" /> },
    { id: 'marketData', label: 'Market Data', icon: <BarChart4 className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/properties')} className="text-gray-500 hover:text-primary"><>

            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
</> className="text-2xl font-bold text-gray-800">{property.address}</h1>
        </div>
        <Link to={`/properties/edit/${property.id}`} className="btn btn-primary flex items-center gap-2">
          <Edit className="w-5 h-5" />
          <span>Edit Property</span>
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex overflow-x-auto gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-1 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div><>

                    <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                    <div
</> className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div><>

                        <p className="text-sm text-gray-500">Property Type</p>
                        <p
</> className="font-medium">{property.property_type}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Bedrooms</p>
                        <p
</> className="font-medium">{property.bedrooms}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Bathrooms</p>
                        <p
</> className="font-medium">{property.bathrooms}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Square Feet</p>
                        <p
</> className="font-medium">{property.square_feet}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Lot Size</p>
                        <p
</> className="font-medium">{property.lot_size || 'N/A'}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Year Built</p>
                        <p
</> className="font-medium">{property.year_built}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Parcel Number</p>
                        <p
</> className="font-medium">{property.parcel_number}</p>
                      </div>
                      <div><>

                        <p className="text-sm text-gray-500">Zoning</p>
                        <p
</> className="font-medium">{property.zoning}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div><>

                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <p
</> className="text-gray-700">{property.description}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4"><>

                    <h2 className="text-lg font-semibold mb-3">Location</h2>
                    <div
</> className="mb-3"><>

                      <p className="text-gray-700">{property.address}</p>
                      <p
</> className="text-gray-700">{property.city}, {property.state} {property.zip_code}</p>
                    </div>
                    <div className="bg-gray-200 h-40 flex items-center justify-center rounded-lg">
                      <Map className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4"><>

                    <h2 className="text-lg font-semibold mb-3">Record Information</h2>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between"><>

                        <span className="text-gray-500">Created</span>
                        <span
</>>{new Date(property.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between"><>

                        <span className="text-gray-500">Last Updated</span>
                        <span
</>>{new Date(property.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'appraisals' && (
            <div className="text-center py-12">
              <Clipboard className="w-12 h-12 mx-auto text-gray-400 mb-4" /><>

              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appraisals Found</h3>
              <p
</> className="text-gray-500 mb-6">This property doesn't have any appraisals yet.</p>
              <button className="btn btn-primary">Create New Appraisal</button>
            </div>
          )}
          
          {activeTab === 'comparables' && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" /><>

              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Comparables Found</h3>
              <p
</> className="text-gray-500 mb-6">This property doesn't have any comparables yet.</p>
              <button className="btn btn-primary">Add Comparable Properties</button>
            </div>
          )}
          
          {activeTab === 'marketData' && (
            <div className="text-center py-12">
              <BarChart4 className="w-12 h-12 mx-auto text-gray-400 mb-4" /><>

              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Market Data Found</h3>
              <p
</> className="text-gray-500 mb-6">Market data for this property's area is not available yet.</p>
              <button className="btn btn-primary">Import Market Data</button>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" /><>

              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
              <p
</> className="text-gray-500 mb-6">No reports have been generated for this property.</p>
              <button className="btn btn-primary">Generate Report</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}