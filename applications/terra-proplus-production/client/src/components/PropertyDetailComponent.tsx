import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency, formatNumber, formatDate } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { propertyApi, appraisalApi, comparableApi } from '../api';
import { Property, Appraisal, Comparable } from '../types';

// Icons
import { Building, 
  MapPin, 
  Home, 
  Clock, 
  FileText, 
  BarChart, 
  Edit, 
  Download, 
  PlusCircle, 
  Search, 
  Upload, 
  Star 
 } from '@mui/icons-material';

type PropertyDetailProps = {
  propertyId?: string;
}

const PropertyDetailComponent = ({ propertyId }: PropertyDetailProps) => {
  const params = useParams();
  const id = propertyId || params.id;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transaction');
  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        // In a real implementation, these would be actual API calls
        const propertyResponse = await fetch(`/api/properties/${id}`);
        const propertyData = await propertyResponse.json();
        
        const appraisalsResponse = await fetch(`/api/properties/${id}/appraisals`);
        const appraisalsData = await appraisalsResponse.json();
        
        const comparablesResponse = await fetch(`/api/properties/${id}/comparables`);
        const comparablesData = await comparablesResponse.json();
        
        setProperty(propertyData);
        setAppraisals(appraisalsData);
        setComparables(comparablesData);
      } catch (error) {
        console.error('Error fetching property data:', error);
        
        // For demo purposes, set mock data if the API is not available
        // Add all required properties to match our types
        setProperty({
          id: 1,
          address: '123 Main Street',
          city: 'Austin',
          state: 'TX',
          zip_code: '78701',
          property_type: 'Single Family',
          year_built: 2005,
          square_feet: 2450,
          bedrooms: 3,
          bathrooms: 2.5,
          lot_size: 8500,
          description: 'Beautiful family home in a desirable neighborhood',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          parcel_number: '10-4567-89',
          zoning: 'Residential (R-1)',
          latitude: 30.267153,
          longitude: -97.743057,
          features: {
            pool: true,
            garage: '2-Car Attached',
            fireplace: true,
            stories: 2
          }
        });
        
        setAppraisals([
          {
            id: 1,
            propertyId: 1,
            appraiserId: 1,
            status: 'Completed',
            purpose: 'Refinance',
            marketValue: 975000,
            createdAt: '2024-05-15T00:00:00Z',
            completedAt: '2024-05-20T00:00:00Z',
            inspectionDate: '2024-05-18T00:00:00Z',
            effectiveDate: '2024-05-20T00:00:00Z',
            reportType: 'Form 1004',
            clientName: 'First National Bank',
            clientEmail: 'loans@firstnational.example',
            clientPhone: '555-123-4567',
            lenderName: 'First National Bank',
            loanNumber: 'L-12345',
            intendedUse: 'Refinance transaction',
            valuationMethod: 'Sales Comparison Approach',
            scopeOfWork: 'Full appraisal with interior and exterior inspection',
            notes: null
          },
          {
            id: 2,
            propertyId: 1,
            appraiserId: 2,
            status: 'In Review',
            purpose: 'Sale',
            marketValue: 950000,
            createdAt: '2023-10-10T00:00:00Z',
            completedAt: '2023-10-15T00:00:00Z',
            inspectionDate: '2023-10-12T00:00:00Z',
            effectiveDate: '2023-10-15T00:00:00Z',
            reportType: 'Form 1004',
            clientName: 'Capital Mortgage Co.',
            clientEmail: 'underwriting@capitalmortgage.example',
            clientPhone: '555-987-6543',
            lenderName: 'Capital Mortgage Co.',
            loanNumber: 'L-56789',
            intendedUse: 'Purchase transaction',
            valuationMethod: 'Sales Comparison Approach',
            scopeOfWork: 'Full appraisal with interior and exterior inspection',
            notes: null
          },
          {
            id: 3,
            propertyId: 1,
            appraiserId: 3,
            status: 'Draft',
            purpose: 'Home Equity',
            marketValue: null,
            createdAt: '2022-06-01T00:00:00Z',
            completedAt: null,
            inspectionDate: null,
            effectiveDate: null,
            reportType: 'Form 1004',
            clientName: 'Homeowners Bank',
            clientEmail: 'equity@homeowners.example',
            clientPhone: '555-456-7890',
            lenderName: 'Homeowners Bank',
            loanNumber: 'HELOC-8765',
            intendedUse: 'Home equity line of credit',
            valuationMethod: null,
            scopeOfWork: null,
            notes: 'Client requested rush service'
          }
        ]);
        
        setComparables([
          {
            id: 1,
            appraisalId: 1,
            address: '456 Oak Avenue',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            salePrice: 925000,
            saleDate: '2024-03-15T00:00:00Z',
            squareFeet: 2350,
            bedrooms: 3,
            bathrooms: 2,
            yearBuilt: 2003,
            propertyType: 'Single Family',
            lotSize: 7500,
            condition: 'Good',
            daysOnMarket: 28,
            source: 'MLS',
            adjustedPrice: 952000,
            adjustmentNotes: 'Adjusted for smaller square footage and lot size',
            createdAt: '2024-05-18T00:00:00Z'
          },
          {
            id: 2,
            appraisalId: 1,
            address: '789 Elm Drive',
            city: 'Austin',
            state: 'TX',
            zipCode: '78704',
            salePrice: 1050000,
            saleDate: '2024-04-02T00:00:00Z',
            squareFeet: 2650,
            bedrooms: 4,
            bathrooms: 3,
            yearBuilt: 2008,
            propertyType: 'Single Family',
            lotSize: 9000,
            condition: 'Excellent',
            daysOnMarket: 14,
            source: 'MLS',
            adjustedPrice: 985000,
            adjustmentNotes: 'Adjusted for larger square footage and newer construction',
            createdAt: '2024-05-18T00:00:00Z'
          },
          {
            id: 3,
            appraisalId: 1,
            address: '101 Pine Road',
            city: 'Austin',
            state: 'TX',
            zipCode: '78703',
            salePrice: 910000,
            saleDate: '2024-02-20T00:00:00Z',
            squareFeet: 2250,
            bedrooms: 3,
            bathrooms: 2.5,
            yearBuilt: 2002,
            propertyType: 'Single Family',
            lotSize: 8000,
            condition: 'Average',
            daysOnMarket: 35,
            source: 'MLS',
            adjustedPrice: 935000,
            adjustmentNotes: 'Adjusted for location and condition differences',
            createdAt: '2024-05-18T00:00:00Z'
          },
          {
            id: 4,
            appraisalId: 1,
            address: '222 Cedar Lane',
            city: 'Austin',
            state: 'TX',
            zipCode: '78705',
            salePrice: 980000,
            saleDate: '2024-04-12T00:00:00Z',
            squareFeet: 2400,
            bedrooms: 3,
            bathrooms: 2.5,
            yearBuilt: 2006,
            propertyType: 'Single Family',
            lotSize: 8200,
            condition: 'Good',
            daysOnMarket: 21,
            source: 'MLS',
            adjustedPrice: 965000,
            adjustmentNotes: 'Adjusted for slight differences in condition and features',
            createdAt: '2024-05-18T00:00:00Z'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [id]);
  
  if (loading) {
    return <div className="p-8 text-center">Loading property details...</div>;
  }
  
  if (!property) {
    return <div className="p-8 text-center">Property not found</div>;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Link */}
      <div className="container mx-auto px-4 py-6">
        <a 
          href="/properties" 
          className="inline-flex items-center text-blue-600 hover:underline mb-6"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Properties
        </a>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div><>

            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Property Details
            </h1>
            <p
</> className="text-gray-600">{property.address}, {property.city}, {property.state} {property.zip_code}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"><>

              <Edit className="w-4 h-4 mr-2" />
              Edit Property
            </button>
            <button
</> className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              New Appraisal
            </button>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Property Details Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Property Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><>

                    <p className="text-sm text-gray-500">Property Type</p>
                    <p
</> className="font-medium">{property.property_type}</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Square Feet</p>
                    <p
</> className="font-medium">{formatNumber(property.square_feet)} sq.ft.</p>
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

                    <p className="text-sm text-gray-500">Year Built</p>
                    <p
</> className="font-medium">{property.year_built}</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Lot Size</p>
                    <p
</> className="font-medium">{formatNumber(property.lot_size)} sq.ft.</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Garage</p>
                    <p
</> className="font-medium">2-Car Attached</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Stories</p>
                    <p
</> className="font-medium">2</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Foundation</p>
                    <p
</> className="font-medium">Slab</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Roof</p>
                    <p
</> className="font-medium">Composition Shingle</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Heating</p>
                    <p
</> className="font-medium">Central</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Cooling</p>
                    <p
</> className="font-medium">Central</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center"><>

                    <p className="text-sm text-gray-500">Estimated Value</p>
                    <p
</> className="text-xl font-semibold">{formatCurrency(975000)}</p>
                    <p className="text-xs text-green-600">+5.2% last 12 months</p>
                  </div>
                  <div className="text-center"><>

                    <p className="text-sm text-gray-500">Last Sale Price</p>
                    <p
</> className="text-xl font-semibold">{formatCurrency(850000)}</p>
                    <p className="text-xs text-gray-500">Mar 15, 2022</p>
                  </div>
                  <div className="text-center"><>

                    <p className="text-sm text-gray-500">Price per Sq.Ft.</p>
                    <p
</> className="text-xl font-semibold">{formatCurrency(398)}</p>
                    <p className="text-xs text-green-600">+3.8% from avg</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Location
                </h2>
              </div>
              <div className="p-6"><>

                <div className="bg-gray-100 rounded-lg h-64 mb-6 flex items-center justify-center text-gray-500 italic">
                  Map would be displayed here
                </div>
                
                <div
</> className="flex items-center mb-6"><>

                  <div className="text-green-600 mr-3">📍</div>
                  <div
</>><>

                    <p className="font-medium">{property.address}</p>
                    <p
</> className="text-gray-600">{property.city}, {property.state} {property.zip_code}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div><>

                    <p className="text-sm text-gray-500">County</p>
                    <p
</> className="font-medium">Travis</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">School District</p>
                    <p
</> className="font-medium">Austin ISD</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Neighborhood</p>
                    <p
</> className="font-medium">Downtown</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Zoning</p>
                    <p
</> className="font-medium">Residential (R-1)</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Flood Zone</p>
                    <p
</> className="font-medium">No</p>
                  </div>
                  <div><>

                    <p className="text-sm text-gray-500">Parcel Number</p>
                    <p
</> className="font-medium">10-4567-89</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <Home className="w-5 h-5 mr-2 text-purple-600" />
                  Features & Improvements
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  <li className="flex items-start"><>

                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      🏊
                    </div>
                    <div
</>><>

                      <p className="font-medium">Swimming Pool</p>
                      <p
</> className="text-sm text-gray-600">In-ground pool with patio area</p>
                    </div>
                  </li>
                  <li className="flex items-start"><>

                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      🔥
                    </div>
                    <div
</>><>

                      <p className="font-medium">Fireplace</p>
                      <p
</> className="text-sm text-gray-600">Gas fireplace in living room</p>
                    </div>
                  </li>
                  <li className="flex items-start"><>

                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      🧱
                    </div>
                    <div
</>><>

                      <p className="font-medium">Exterior</p>
                      <p
</> className="text-sm text-gray-600">Brick and stone veneer</p>
                    </div>
                  </li>
                  <li className="flex items-start"><>

                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      🛋️
                    </div>
                    <div
</>><>

                      <p className="font-medium">Interior Features</p>
                      <p
</> className="text-sm text-gray-600">Hardwood floors, granite countertops, stainless steel appliances</p>
                    </div>
                  </li>
                  <li className="flex items-start"><>

                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-3">
                      ⚡
                    </div>
                    <div
</>><>

                      <p className="font-medium">Energy Features</p>
                      <p
</> className="text-sm text-gray-600">Solar panels, energy efficient windows, programmable thermostat</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* History Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Property History
                </h2>
              </div>
              <div className="p-6">
                <div className="flex border-b border-gray-200"><>

                  <button 
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'transaction' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('transaction')}
                  >
                    Transaction History
                  </button>
                  <button
</> 
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'tax' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('tax')}
                  >
                    Tax History
                  </button>
                  <button 
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'price' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('price')}
                  >
                    Price History
                  </button>
                </div>
                
                <div className="py-4">
                  <div className="space-y-4">
                    <div className="flex"><>

                      <div className="w-24 text-sm text-gray-500">Mar 15, 2022</div>
                      <div
</> className="flex-1"><>

                        <p className="font-medium">Sale</p>
                        <p
</> className="text-sm text-gray-600">Sold to current owner</p>
                      </div>
                      <div className="font-medium">$850,000</div>
                    </div>
                    <div className="flex"><>

                      <div className="w-24 text-sm text-gray-500">Jan 10, 2022</div>
                      <div
</> className="flex-1"><>

                        <p className="font-medium">Listed for Sale</p>
                        <p
</> className="text-sm text-gray-600">Listed on MLS</p>
                      </div>
                      <div className="font-medium">$865,000</div>
                    </div>
                    <div className="flex"><>

                      <div className="w-24 text-sm text-gray-500">Jun 5, 2018</div>
                      <div
</> className="flex-1"><>

                        <p className="font-medium">Renovation</p>
                        <p
</> className="text-sm text-gray-600">Major kitchen renovation</p>
                      </div>
                      <div className="font-medium">$75,000</div>
                    </div>
                    <div className="flex"><>

                      <div className="w-24 text-sm text-gray-500">Apr 22, 2015</div>
                      <div
</> className="flex-1"><>

                        <p className="font-medium">Sale</p>
                        <p
</> className="text-sm text-gray-600">Sold to previous owner</p>
                      </div>
                      <div className="font-medium">$725,000</div>
                    </div>
                    <div className="flex"><>

                      <div className="w-24 text-sm text-gray-500">Sep 30, 2005</div>
                      <div
</> className="flex-1"><>

                        <p className="font-medium">Construction Complete</p>
                        <p
</> className="text-sm text-gray-600">New construction</p>
                      </div>
                      <div className="font-medium">$630,000</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-500 italic">
                    Price history chart would be displayed here
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 space-y-6">
            {/* Appraisals Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-amber-600" />
                  Appraisals
                </h2>
              </div>
              <div className="p-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr><>

                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th
</> className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appraisals.map((appraisal) => (
                      <tr key={appraisal.id}><>

                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          {formatDate(appraisal.createdAt)}
                        </td>
                        <td
</> className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${appraisal.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              appraisal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {appraisal.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                          {appraisal.marketValue ? formatCurrency(appraisal.marketValue) : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-4 text-center">
                  <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    View All Appraisals
                  </button>
                </div>
              </div>
            </div>
            
            {/* Comparable Properties Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-blue-500" />
                  Comparables
                </h2>
              </div>
              <div className="p-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr><>

                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th
</> className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sq.Ft.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparables.map((comparable) => (
                      <tr key={comparable.id}><>

                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          {comparable.address}
                        </td>
                        <td
</> className="px-3 py-3 whitespace-nowrap text-sm">
                          {formatCurrency(comparable.salePrice)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          {formatNumber(comparable.squareFeet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-4 text-center">
                  <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Find More Comparables
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><>

                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </button>
                  <button
</> className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><>

                    <Search className="w-4 h-4 mr-2" />
                    Find Similar Properties
                  </button>
                  <button
</> className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><>

                    <BarChart className="w-4 h-4 mr-2" />
                    Run Valuation Calculator
                  </button>
                  <button
</> className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Star className="w-4 h-4 mr-2" />
                    Save to Favorites
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data for development and demo purposes
const mockProperty: Property = {
  id: 1,
  address: '123 Main Street',
  city: 'Austin',
  state: 'TX',
  zip_code: '78701',
  property_type: 'Single Family',
  year_built: 2005,
  square_feet: 2450,
  bedrooms: 3,
  bathrooms: 2.5,
  lot_size: 8500,
  description: 'Beautiful single family home in the heart of Austin',
  created_at: '2022-01-01T00:00:00.000Z',
  updated_at: '2022-01-01T00:00:00.000Z',
  parcel_number: '10-4567-89',
  zoning: 'Residential (R-1)',
  longitude: -97.7431,
  latitude: 30.2672,
  features: {
    pool: true,
    garage: '2-Car Attached',
    fireplace: true,
    stories: 2
  }
};

const mockAppraisals: Appraisal[] = [
  {
    id: 1,
    propertyId: 1,
    appraiserId: 1,
    status: 'Completed',
    purpose: 'Refinance',
    marketValue: 975000,
    createdAt: '2025-04-15T00:00:00.000Z',
    completedAt: '2025-04-20T00:00:00.000Z'
  },
  {
    id: 2,
    propertyId: 1,
    appraiserId: 2,
    status: 'Completed',
    purpose: 'Purchase',
    marketValue: 925000,
    createdAt: '2024-03-10T00:00:00.000Z',
    completedAt: '2024-03-15T00:00:00.000Z'
  },
  {
    id: 3,
    propertyId: 1,
    appraiserId: 1,
    status: 'Completed',
    purpose: 'Estate Planning',
    marketValue: 875000,
    createdAt: '2023-02-05T00:00:00.000Z',
    completedAt: '2023-02-12T00:00:00.000Z'
  }
];

const mockComparables: Comparable[] = [
  {
    id: 1,
    appraisalId: 1,
    address: '125 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    salePrice: 980000,
    saleDate: '2025-01-15T00:00:00.000Z',
    squareFeet: 2500,
    propertyType: 'Single Family'
  },
  {
    id: 2,
    appraisalId: 1,
    address: '130 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    salePrice: 955000,
    saleDate: '2025-02-20T00:00:00.000Z',
    squareFeet: 2400,
    propertyType: 'Single Family'
  },
  {
    id: 3,
    appraisalId: 1,
    address: '112 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    salePrice: 940000,
    saleDate: '2025-03-05T00:00:00.000Z',
    squareFeet: 2350,
    propertyType: 'Single Family'
  },
  {
    id: 4,
    appraisalId: 1,
    address: '145 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    salePrice: 990000,
    saleDate: '2025-02-10T00:00:00.000Z',
    squareFeet: 2600,
    propertyType: 'Single Family'
  }
];

export default PropertyDetailComponent;