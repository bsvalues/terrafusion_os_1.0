import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, 
  User, 
  Clock, 
  Clipboard, 
  CheckCircle, 
  FileText,
  Map,
  ChevronRight,
  ChevronDown,
  Pencil,
  ArrowLeft
 } from '@mui/icons-material';
import { format } from 'date-fns';
import { wsClient, WebSocketMessageType, useWebSocketMessage } from '../lib/websocket';
import MarketDataChart from '../components/enhanced/MarketDataChart';
import ComparableAnalysis from '../components/enhanced/ComparableAnalysis';

// Define interfaces for our data types
interface Appraisal {
  id: number;
  propertyId: number;
  appraiserId: number;
  createdAt: string;
  completedAt: string | null;
  status: string;
  purpose: string | null;
  marketValue: number | null;
  valuationMethod: string | null;
  effectiveDate: string | null;
  reportDate: string | null;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  lotSize: string | null;
  yearBuilt: number;
  description: string;
  parcelNumber: string;
  zoning: string;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Comparable {
  id: number;
  appraisalId: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  salePrice: number;
  saleDate: string;
  adjustedValue: number | null;
}

// Status color mapping
const statusColors: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  review_pending: 'bg-amber-100 text-amber-800',
  revision_needed: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

// Function to format status text
const formatStatus = (status: string): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const EnhancedAppraisalDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appraisalId = id ? parseInt(id, 10) : 0;
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    propertyDetails: true,
    marketData: false,
    comparables: false
  });
  
  // Listen for WebSocket updates
  const [wsUpdate] = useWebSocketMessage(WebSocketMessageType.APPRAISAL_UPDATED);
  
  // Fetch appraisal data
  const { 
    data: appraisal, 
    isLoading: isLoadingAppraisal,
    refetch: refetchAppraisal
  } = useQuery({
    queryKey: [`/api/appraisals/${appraisalId}`],
    queryFn: async () => {
      const response = await fetch(`/api/appraisals/${appraisalId}`);
      if (!response.ok) throw new Error('Failed to fetch appraisal');
      return response.json() as Promise<Appraisal>;
    }
  });
  
  // Fetch property data
  const { 
    data: property,
    isLoading: isLoadingProperty
  } = useQuery({
    queryKey: [`/api/properties/${appraisal?.propertyId}`],
    queryFn: async () => {
      if (!appraisal?.propertyId) return null;
      const response = await fetch(`/api/properties/${appraisal.propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property');
      return response.json() as Promise<Property>;
    },
    enabled: !!appraisal?.propertyId
  });
  
  // Fetch appraiser data
  const {
    data: appraiser,
    isLoading: isLoadingAppraiser
  } = useQuery({
    queryKey: [`/api/users/${appraisal?.appraiserId}`],
    queryFn: async () => {
      if (!appraisal?.appraiserId) return null;
      
      // In a real application, this would fetch from an API
      // For now, we'll return mock data
      return {
        id: appraisal.appraiserId,
        username: 'appraiser1',
        firstName: 'John',
        lastName: 'Appraiser',
        role: 'appraiser'
      } as User;
    },
    enabled: !!appraisal?.appraiserId
  });
  
  // Fetch comparables count
  const {
    data: comparablesCount,
    isLoading: isLoadingComparables
  } = useQuery({
    queryKey: [`/api/comparables/count?appraisalId=${appraisalId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/comparables?appraisalId=${appraisalId}`);
        if (!response.ok) throw new Error('Failed to fetch comparables');
        const comparables = await response.json() as Comparable[];
        return comparables.length;
      } catch (error) {
        console.error('Error fetching comparables:', error);
        return 0;
      }
    }
  });
  
  // Refetch data when WebSocket updates come in
  useEffect(() => {
    if (wsUpdate && (wsUpdate as any).id === appraisalId) {
      refetchAppraisal();
    }
  }, [wsUpdate, appraisalId, refetchAppraisal]);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  if (isLoadingAppraisal || isLoadingProperty) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!appraisal || !property) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700"><>

        <p>Appraisal or property not found.</p>
        <Link
</> to="/appraisals" className="text-red-700 underline mt-2 inline-block">
          Back to Appraisals
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/appraisals" className="text-gray-600 hover:text-gray-900 flex items-center mb-2"><>

          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Appraisals
        </Link>
        
        <div
</> className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center"><>

              <Clipboard className="h-6 w-6 mr-2" />
              Appraisal #{appraisal.id}
            </h1>
            <p
</> className="text-gray-600">{property.address}, {property.city}, {property.state}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:items-end"><>

            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[appraisal.status] || 'bg-gray-100'}`}>
              {formatStatus(appraisal.status)}
            </span>
            <span
</> className="text-sm text-gray-500 mt-1">
              Created {format(new Date(appraisal.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full"><>

              <Building className="h-6 w-6 text-blue-700" />
            </div>
            <div
</> className="ml-4"><>

              <h3 className="text-lg font-medium">Property</h3>
              <p
</> className="text-gray-600">{property.propertyType}</p>
              <p className="text-gray-600">
                {property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sq ft
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start">
            <div className="bg-green-100 p-3 rounded-full"><>

              <User className="h-6 w-6 text-green-700" />
            </div>
            <div
</> className="ml-4">
              <h3 className="text-lg font-medium">Appraiser</h3>
              {isLoadingAppraiser ? (
                <p className="text-gray-400">Loading...</p>
              ) : appraiser ? (
                <><>

                  <p className="text-gray-600">{appraiser.firstName} {appraiser.lastName}</p>
                  <p
</> className="text-gray-600 capitalize">{appraiser.role}</p>
                </>
              ) : (
                <p className="text-gray-600">Not assigned</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start">
            <div className="bg-purple-100 p-3 rounded-full"><>

              <Clock className="h-6 w-6 text-purple-700" />
            </div>
            <div
</> className="ml-4"><>

              <h3 className="text-lg font-medium">Timeline</h3>
              <p
</> className="text-gray-600">
                Started: {format(new Date(appraisal.createdAt), 'MMM d, yyyy')}
              </p>
              {appraisal.completedAt ? (
                <p className="text-gray-600">
                  Completed: {format(new Date(appraisal.completedAt), 'MMM d, yyyy')}
                </p>
              ) : (
                <p className="text-gray-600">In progress</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Assessment Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center"><>

            <FileText className="h-5 w-5 mr-2" />
            Value Assessment
          </h2>
          
          <Link
</> 
            to={`/appraisals/${appraisalId}/edit`}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><>

            <p className="text-sm text-gray-500 mb-1">Market Value</p>
            <p
</> className="text-2xl font-bold">
              {appraisal.marketValue 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(appraisal.marketValue) 
                : 'Not yet determined'}
            </p>
          </div>
          
          <div><>

            <p className="text-sm text-gray-500 mb-1">Purpose</p>
            <p
</> className="text-lg">
              {appraisal.purpose 
                ? appraisal.purpose.charAt(0).toUpperCase() + appraisal.purpose.slice(1) 
                : 'Not specified'}
            </p>
          </div>
          
          <div><>

            <p className="text-sm text-gray-500 mb-1">Valuation Method</p>
            <p
</> className="text-lg">
              {appraisal.valuationMethod 
                ? appraisal.valuationMethod.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : 'Not specified'}
            </p>
          </div>
        </div>
        
        <div className="border-t mt-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><>

              <p className="text-sm text-gray-500 mb-1">Effective Date</p>
              <p
</> className="text-base">
                {appraisal.effectiveDate 
                  ? format(new Date(appraisal.effectiveDate), 'MMMM d, yyyy')
                  : 'Not specified'}
              </p>
            </div>
            
            <div><>

              <p className="text-sm text-gray-500 mb-1">Report Date</p>
              <p
</> className="text-base">
                {appraisal.reportDate 
                  ? format(new Date(appraisal.reportDate), 'MMMM d, yyyy')
                  : 'Not specified'}
              </p>
            </div>
            
            <div><>

              <p className="text-sm text-gray-500 mb-1">Comparables Used</p>
              <p
</> className="text-base">
                {isLoadingComparables 
                  ? 'Loading...'
                  : `${comparablesCount || 0} properties`}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Details Section */}
      <div className="bg-white shadow rounded-lg">
        <button 
          className="w-full px-6 py-4 flex justify-between items-center"
          onClick={() => toggleSection('propertyDetails')}
        >
          <h2 className="text-xl font-bold flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Property Details
          </h2>
          {expandedSections.propertyDetails ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.propertyDetails && (
          <div className="px-6 py-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div><>

                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p
</> className="text-base">{property.address}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p
</> className="text-base">{property.city}, {property.state} {property.zipCode}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Property Type</p>
                <p
</> className="text-base">{property.propertyType}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Year Built</p>
                <p
</> className="text-base">{property.yearBuilt}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Size</p>
                <p
</> className="text-base">{property.squareFeet} sq ft</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Bedrooms / Bathrooms</p>
                <p
</> className="text-base">{property.bedrooms} bed / {property.bathrooms} bath</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Lot Size</p>
                <p
</> className="text-base">{property.lotSize || 'Not specified'}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Parcel Number</p>
                <p
</> className="text-base">{property.parcelNumber}</p>
              </div>
              
              <div><>

                <p className="text-sm text-gray-500 mb-1">Zoning</p>
                <p
</> className="text-base">{property.zoning}</p>
              </div>
            </div>
            
            <div className="mt-6"><>

              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p
</> className="text-base">{property.description}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Market Data Section */}
      <div className="bg-white shadow rounded-lg">
        <button 
          className="w-full px-6 py-4 flex justify-between items-center"
          onClick={() => toggleSection('marketData')}
        >
          <h2 className="text-xl font-bold flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Market Analysis
          </h2>
          {expandedSections.marketData ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.marketData && (
          <div className="px-6 py-4 border-t">
            {property ? (
              <MarketDataChart 
                zipCode={property.zipCode} 
                propertyType={property.propertyType} 
              />
            ) : (
              <p>Loading market data...</p>
            )}
          </div>
        )}
      </div>
      
      {/* Comparables Section */}
      <div className="bg-white shadow rounded-lg">
        <button 
          className="w-full px-6 py-4 flex justify-between items-center"
          onClick={() => toggleSection('comparables')}
        >
          <h2 className="text-xl font-bold flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Comparable Analysis
          </h2>
          {expandedSections.comparables ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.comparables && (
          <div className="px-6 py-4 border-t">
            <ComparableAnalysis 
              appraisalId={appraisalId} 
              propertyId={property.id} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAppraisalDashboard;