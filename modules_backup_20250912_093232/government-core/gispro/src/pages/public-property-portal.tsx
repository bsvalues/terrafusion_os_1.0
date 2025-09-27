import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Separator} from '@/components/ui/separator';
import {Search,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  FileText,
  Phone,
  Mail,} from '@mui/icons-material';

interface PropertyData {id: string;
  address: string;
  owner: string;
  taxParcelId: string;
  assessedValue: number;
  yearBuilt: number;
  squareFootage: number;
  lotSize: number;
  acreage: number;
  zoning: string;
  propertyType: string;
  lastSaleDate: string;
  lastSalePrice: number;
  taxYear: number;
  coordinates: [number, number];}

interface SearchFilters {propertyType: string;
  minValue: string;
  maxValue: string;
  yearBuilt: string;
  zoning: string;}

export default function PublicPropertyPortal() {const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<PropertyData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    propertyType: '',
    minValue: '',
    maxValue: '',
    yearBuilt: '',
    zoning: '',});

  // Sample property data for demonstration
  const sampleProperties: PropertyData[] = [
    {id: 'prop-1',
      address: '123 Main Street',
      owner: 'Johnson, Robert & Sarah',
      taxParcelId: 'R1234567890',
      assessedValue: 245000,
      yearBuilt: 1995,
      squareFootage: 1850,
      lotSize: 8400,
      acreage: 0.19,
      zoning: 'R-1',
      propertyType: 'Residential',
      lastSaleDate: '2022-08-15',
      lastSalePrice: 230000,
      taxYear: 2024,
      coordinates: [-119.2781, 46.2396],},
    {id: 'prop-2',
      address: '456 Oak Avenue',
      owner: 'Smith Family Trust',
      taxParcelId: 'R2345678901',
      assessedValue: 180000,
      yearBuilt: 1978,
      squareFootage: 1450,
      lotSize: 7200,
      acreage: 0.17,
      zoning: 'R-1',
      propertyType: 'Residential',
      lastSaleDate: '2021-03-22',
      lastSalePrice: 165000,
      taxYear: 2024,
      coordinates: [-119.2801, 46.2416],},
    {id: 'prop-3',
      address: '789 Business Way',
      owner: 'Columbia River Commerce LLC',
      taxParcelId: 'C3456789012',
      assessedValue: 850000,
      yearBuilt: 2005,
      squareFootage: 12000,
      lotSize: 43560,
      acreage: 1.0,
      zoning: 'C-2',
      propertyType: 'Commercial',
      lastSaleDate: '2020-11-10',
      lastSalePrice: 780000,
      taxYear: 2024,
      coordinates: [-119.2751, 46.2376],},
    {id: 'prop-4',
      address: '321 Industrial Drive',
      owner: 'Hanford Industrial Properties',
      taxParcelId: 'I4567890123',
      assessedValue: 1200000,
      yearBuilt: 1988,
      squareFootage: 25000,
      lotSize: 87120,
      acreage: 2.0,
      zoning: 'I-1',
      propertyType: 'Industrial',
      lastSaleDate: '2019-06-08',
      lastSalePrice: 1050000,
      taxYear: 2024,
      coordinates: [-119.2701, 46.2356],},
    {id: 'prop-5',
      address: '654 Agricultural Road',
      owner: 'Washington Farms Inc',
      taxParcelId: 'A5678901234',
      assessedValue: 320000,
      yearBuilt: 1965,
      squareFootage: 3200,
      lotSize: 435600,
      acreage: 10.0,
      zoning: 'A-1',
      propertyType: 'Agricultural',
      lastSaleDate: '2018-04-15',
      lastSalePrice: 285000,
      taxYear: 2024,
      coordinates: [-119.2671, 46.2296],},
  ];

  // Initialize with sample data
  useEffect(() =>{setProperties(sampleProperties);
    setFilteredProperties(sampleProperties);}, []);

  // Handle search
  const handleSearch = async () => {if (!searchTerm.trim()) {
      setFilteredProperties(properties);
      return;}

    setIsSearching(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const filtered = properties.filter(
      property =>
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.taxParcelId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProperties(filtered);
    setIsSearching(false);
  };

  // Handle property selection
  const handlePropertySelect = async (propertyId: string) => {setSelectedParcelId(propertyId);
    setIsLoadingDetails(true);

    // Simulate loading property details
    await new Promise(resolve => setTimeout(resolve, 800));

    const property = properties.find(p => p.id === propertyId);
    setPropertyDetails(property || null);
    setIsLoadingDetails(false);};

  // Apply filters
  const applyFilters = () => {let filtered = properties;

    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);}

    if (filters.minValue) {filtered = filtered.filter(p => p.assessedValue >= parseInt(filters.minValue));}

    if (filters.maxValue) {filtered = filtered.filter(p => p.assessedValue<= parseInt(filters.maxValue));}

    if (filters.yearBuilt) {filtered = filtered.filter(p =>p.yearBuilt >= parseInt(filters.yearBuilt));}

    if (filters.zoning) {filtered = filtered.filter(p => p.zoning === filters.zoning);}

    setFilteredProperties(filtered);
  };

  // Clear filters
  const clearFilters = () => {setFilters({
      propertyType: '',
      minValue: '',
      maxValue: '',
      yearBuilt: '',
      zoning: '',});
    setFilteredProperties(properties);
  };

  return (<div className="min-h-screen bg-gray-50"><header className="bg-primary-700 text-white py-6"><div className="container mx-auto px-4"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Benton County Property Portal</h1><p className="text-primary-100">Find property information across Benton County, Washington</p></div><div className="text-right"><p className="text-sm">Official Public Records</p><p className="text-xs">Updated Daily</p></div></div></div></header><main className="container mx-auto px-4 py-8"><Card className="mb-8"><CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Property Search</CardTitle><CardDescription>Search by address, owner name, or tax parcel ID</CardDescription></CardHeader><CardContent><div className="flex gap-4 mb-4"><div className="flex-1"><Input
                  placeholder="Enter address, owner name, or parcel ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                /></div><Button onClick={handleSearch} disabled={isSearching}>{isSearching ? 'Searching...' : 'Search'}</Button></div>{isSearching && (<div className="flex items-center gap-2 text-sm text-neutral-500 mt-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div><p>Searching properties...</p></div>)}

            {/* Advanced Filters */}<details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">Advanced Filters</summary><div className="mt-4 p-4 border rounded-lg bg-gray-50"><div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"><div><Label htmlFor="propertyType">Property Type</Label><select
                      id="propertyType"
                      className="w-full p-2 border rounded"
                      value={filters.propertyType}
                      onChange={e =>
                        setFilters(prev => ({ ...prev, propertyType: e.target.value}))
                      }
                    ><option value="">All Types</option><option value="Residential">Residential</option><option value="Commercial">Commercial</option><option value="Industrial">Industrial</option><option value="Agricultural">Agricultural</option></select></div><div><Label htmlFor="minValue">Min Value</Label><Input
                      id="minValue"
                      type="number"
                      placeholder="$0"
                      value={filters.minValue}
                      onChange={e => setFilters(prev => ({ ...prev, minValue: e.target.value}))}
                    /></div><div><Label htmlFor="maxValue">Max Value</Label><Input
                      id="maxValue"
                      type="number"
                      placeholder="No limit"
                      value={filters.maxValue}
                      onChange={e => setFilters(prev => ({ ...prev, maxValue: e.target.value}))}
                    /></div><div><Label htmlFor="yearBuilt">Built After</Label><Input
                      id="yearBuilt"
                      type="number"
                      placeholder="Year"
                      value={filters.yearBuilt}
                      onChange={e => setFilters(prev => ({ ...prev, yearBuilt: e.target.value}))}
                    /></div><div><Label htmlFor="zoning">Zoning</Label><select
                      id="zoning"
                      className="w-full p-2 border rounded"
                      value={filters.zoning}
                      onChange={e => setFilters(prev => ({ ...prev, zoning: e.target.value}))}
                    ><option value="">All Zones</option><option value="R-1">R-1 (Residential)</option><option value="C-1">C-1 (Commercial)</option><option value="C-2">C-2 (Commercial)</option><option value="I-1">I-1 (Industrial)</option><option value="A-1">A-1 (Agricultural)</option></select></div></div><div className="flex gap-2 mt-4"><Button onClick={applyFilters} size="sm">Apply Filters</Button><Button onClick={clearFilters} variant="outline" size="sm">Clear</Button></div></div></details>{/* Search Results */}
            {filteredProperties.length > 0 && (<div className="mt-6"><h3 className="text-lg font-semibold mb-4">Search Results ({filteredProperties.length} properties found)</h3><div className="space-y-2">{filteredProperties.map(property => (<div
                      key={property.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handlePropertySelect(property.id)}
                    ><div className="flex items-start justify-between"><div><h4 className="font-medium">{property.address}</h4><p className="text-sm text-neutral-500">Owner: {property.owner}</p><div className="flex items-center gap-2 mt-2"><Badge variant="outline">{property.propertyType}</Badge><Badge variant="secondary">{property.zoning}</Badge></div></div><div className="text-right"><p className="font-medium">${property.assessedValue.toLocaleString()}</p><p className="text-sm text-neutral-500">{property.yearBuilt}</p></div></div></div>))}</div></div>)}</CardContent></Card>{/* Property Details */}
        {selectedParcelId && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />Property Details</CardTitle><CardDescription>Detailed information for selected property</CardDescription></CardHeader><CardContent>{isLoadingDetails ? (<div className="flex items-center gap-2 text-sm text-neutral-500 mt-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div><p>Loading property details...</p></div>) : propertyDetails ? (<Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="assessment">Assessment</TabsTrigger><TabsTrigger value="zoning">Zoning</TabsTrigger></TabsList><TabsContent value="overview" className="mt-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold mb-3">Basic Information</h4><div className="space-y-2"><div className="flex justify-between"><span>Owner:</span><span>{propertyDetails.owner}</span></div><div className="flex justify-between"><span>Address:</span><span>{propertyDetails.address}</span></div><div className="flex justify-between"><span>Tax Parcel ID:</span><span>{propertyDetails.taxParcelId}</span></div><div className="flex justify-between"><span>Property Type:</span><span>{propertyDetails.propertyType}</span></div></div><Separator className="my-4" /><h4 className="font-semibold mb-3">Physical Details</h4><div className="space-y-2"><div className="flex justify-between"><span>Square Footage:</span><span>{propertyDetails.squareFootage.toLocaleString()} sq ft</span></div><div className="flex justify-between"><span>Lot Size:</span><span>{propertyDetails.lotSize.toLocaleString()} sq ft</span></div><div className="flex justify-between"><span>Acreage:</span><span>{propertyDetails.acreage.toFixed(2)} acres</span></div><div className="flex justify-between"><span>Year Built:</span><span>{propertyDetails.yearBuilt || 'N/A'}</span></div></div></div><div><h4 className="font-semibold mb-3">Location</h4><div className="flex items-start"><MapPin className="h-5 w-5 text-blue-600 mr-2 mt-1" /><div><p>{propertyDetails.address}</p><p className="text-sm text-neutral-500">Coordinates: {propertyDetails.coordinates[1].toFixed(4)},{' '}
                              {propertyDetails.coordinates[0].toFixed(4)}</p></div></div></div></div></TabsContent><TabsContent value="assessment" className="mt-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold mb-3">Current Assessment</h4><div className="space-y-2"><div className="flex justify-between"><span>Assessed Value:</span><span className="text-lg font-medium">${propertyDetails.assessedValue.toLocaleString()}</span></div><div className="flex justify-between"><span>Tax Year:</span><span>{propertyDetails.taxYear}</span></div></div></div><div><h4 className="font-semibold mb-3">Sales History</h4><div className="space-y-2"><div className="flex justify-between"><span>Last Sale Date:</span><span>{new Date(propertyDetails.lastSaleDate).toLocaleDateString()}</span></div><div className="flex justify-between"><span>Last Sale Price:</span><span className="text-sm text-neutral-600">${propertyDetails.lastSalePrice.toLocaleString()}</span></div></div></div></div></TabsContent><TabsContent value="zoning" className="mt-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold mb-3">Zoning Information</h4><div className="space-y-2"><div className="flex justify-between"><span>Zoning District:</span><span className="text-lg">{propertyDetails.zoning}</span></div><div className="flex justify-between"><span>Property Type:</span><span>{propertyDetails.propertyType}</span></div></div></div><div><h4 className="font-semibold mb-3">Additional Information</h4><div className="space-y-2"><p className="text-sm text-neutral-600">For detailed zoning regulations and permitted uses, please contact the
                            Planning Department.</p></div></div></div></TabsContent></Tabs>) : (<p className="text-neutral-500">Property details not found.</p>)}</CardContent></Card>)}

        {/* Help Section */}
        {!selectedParcelId && filteredProperties.length === 0 && !searchTerm && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />How to Use This Portal</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm"><li>• Search by property address, owner name, or tax parcel ID</li><li>• Use advanced filters to narrow your search</li><li>• Click on any property to view detailed information</li><li>• All data is from official county records</li></ul></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />Contact Information</CardTitle></CardHeader><CardContent><div className="space-y-2 text-sm"><p><strong>Assessor's Office:</strong>(509) 736-3085</p><p><strong>Planning Department:</strong>(509) 736-3090</p><p><strong>Email:</strong>assessor@co.benton.wa.us</p><p className="text-xs text-neutral-500 mt-2">This website provides public record information for reference purposes only.</p></div></CardContent></Card></div>)}</main><footer className="bg-gray-800 text-white py-8 mt-12"><div className="container mx-auto px-4"><div className="text-center"><h3 className="text-lg font-semibold">Benton County, Washington</h3><p className="text-sm text-gray-300 mt-1">This website provides public record information for reference purposes only.</p></div></div></footer></div>
  );
}
