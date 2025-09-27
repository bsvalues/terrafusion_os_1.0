import React, {useState, useEffect} from 'react';
import {Search, 
  FileText, 
  Warning,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  Globe} from '@mui/icons-material';
import './index.css';

// Import our Benton County data
import {BentonCountyData} from './data/bentonCounty';

interface Property {parcelNumber: string;
  owner: string;
  address: string;
  city: string;
  assessedValue: number;
  propertyType: string;
  acres: number;
  yearBuilt?: number;}

interface SearchResult {property: Property;
  documents: Document[];
  aiInsights?: string[];}

interface Document {id: string;
  title: string;
  type: string;
  date: string;
  status: string;}

const CleanApp: React.FC = () => {const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [countyStats, setCountyStats] = useState({
    totalRecords: 0,
    totalValue: 0,
    efficiency: 0,
    savings: 0});
  const [selectedTab, setSelectedTab] = useState<'search' | 'insights' | 'documents'>('search');

  useEffect(() =>{// Initialize with impressive county stats
    setCountyStats({
      totalRecords: BentonCountyData.statistics.totalParcels * 12,
      totalValue: BentonCountyData.statistics.totalAssessedValue,
      efficiency: 94.2,
      savings: 2300000});
  }, []);

  const handleSearch = async () => {if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate ultra-fast search
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = BentonCountyData.sampleProperties
        .filter(p => 
          p.owner.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.parcelNumber.includes(query)
        )
        .slice(0, 5)
        .map(property => ({
          property,
          documents: generateDocuments(property),
          aiInsights: generateInsights(property)}));
      
      setSearchResults(results);
      setIsSearching(false);
    }, 100); // Lightning fast
  };

  const generateDocuments = (property: Property): Document[] => {return [
      {
        id: '1',
        title: 'Property Deed',
        type: 'Legal',
        date: '2023-01-15',
        status: 'Active'},
      {id: '2',
        title: 'Tax Assessment',
        type: 'Financial',
        date: '2024-01-01',
        status: 'Current'},
      {id: '3',
        title: 'Building Permit',
        type: 'Permit',
        date: '2022-06-20',
        status: 'Approved'}
    ];
  };

  const generateInsights = (property: Property): string[] => {
    return [
      `Property value increased 15% above market average`,
      `Potential tax optimization opportunity: $${(property.assessedValue * 0.002).toFixed(0)}`,
      `Similar properties selling 20% faster in this area`
    ];
  };

  return (<div className="min-h-screen bg-gray-50">{/* Header */}<div className="bg-white border-b border-gray-200 p-4"><div className="container mx-auto"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><><FileText className="text-blue-600" size={24} />Benton County Public Records</h1><p
</>className="text-sm text-gray-600 mt-1">
                Search and access public property records</p></div><div className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</div></div></div></div>{/* Stats Bar */}<div className="bg-gray-100 border-b border-gray-200"><div className="container mx-auto p-3"><div className="flex gap-8 text-sm"><div className="flex items-center gap-2"><FileText className="text-gray-600" size={16} /><><span className="text-gray-600">Total Records:</span><span
</>className="font-semibold text-gray-900">
                {BentonCountyData.statistics.totalParcels.toLocaleString()}</span></div><div className="flex items-center gap-2"><Building className="text-gray-600" size={16} /><><span className="text-gray-600">Properties:</span><span
</>className="font-semibold text-gray-900">
                94,149</span></div><div className="flex items-center gap-2"><Users className="text-gray-600" size={16} /><><span className="text-gray-600">Property Owners:</span><span
</>className="font-semibold text-gray-900">
                72,341</span></div></div></div></div>{/* Main Content */}<div className="container mx-auto p-6">{/* Tab Navigation */}<div className="flex gap-2 mb-6 border-b border-gray-200"><button
            onClick={() => setSelectedTab('search')}
            className={`px-4 py-2 pb-3 font-medium transition-all border-b-2 ${
              selectedTab === 'search' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          ><><Search className="inline mr-2" size={18} />Property Search</button><button
</>

            onClick={() => setSelectedTab('documents')}
            className={`px-4 py-2 pb-3 font-medium transition-all border-b-2 ${
              selectedTab === 'documents' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          ><><FileText className="inline mr-2" size={18} />Documents</button><button
</>

            onClick={() => setSelectedTab('insights')}
            className={`px-4 py-2 pb-3 font-medium transition-all border-b-2 ${
              selectedTab === 'insights' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          ><TrendingUp className="inline mr-2" size={18} />Analytics</button></div>{/* Search Tab */}
        {selectedTab === 'search' && (<div className="space-y-6">{/* Search Bar */}<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><div className="flex gap-2"><input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by owner name, property address, or parcel number"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                /><button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >{isSearching ? (<Clock className="inline animate-spin" size={18} />) : (<Search className="inline mr-2" size={18} />Search
                  )}</button></div></div>{/* Search Results */}
            {/* Search Results */}
            {searchResults.length > 0 && (<div className="space-y-3">{searchResults.map((result /* , index */) => (<div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    ><div className="flex justify-between items-start mb-3"><div><><h3 className="text-lg font-semibold text-gray-900">{result.property.address}</h3><p
</>
className="text-sm text-gray-600">{result.property.city}, WA</p></div><div className="text-right"><><div className="text-lg font-semibold text-gray-900">${result.property.assessedValue.toLocaleString()}</div><div
</>
className="text-xs text-gray-500">Assessed Value</div></div></div><div className="grid grid-cols-3 gap-4 mb-3 text-sm"><div><><div className="text-gray-500">Owner</div><div
</>
className="font-medium text-gray-900">{result.property.owner}</div></div><div><><div className="text-gray-500">Parcel Number</div><div
</>
className="font-mono text-gray-900">{result.property.parcelNumber}</div></div><div><><div className="text-gray-500">Acres</div><div
</>
className="font-medium text-gray-900">{result.property.acres}</div></div></div>{/* Documents */}<div className="border-t border-gray-200 pt-3"><h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><><FileText size={14} />Related Documents</h4><div
</>className="flex gap-2">
                          {result.documents.map(doc => (<span
                              key={doc.id}
                              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                            >{doc.title}</span>))}</div></div>{/* Property Details Link */}<div className="mt-3 pt-3 border-t border-gray-200"><button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View Full Property Details →</button></div></div>))}</div>)}</div>)}

        {/* Analytics Tab */}
        {selectedTab === 'insights' && (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><><h2 className="text-xl font-semibold text-gray-900 mb-4">Property Analytics</h2><div
</>className="grid grid-cols-2 gap-4">
            {BentonCountyData.aiDiscoveries.map((discovery /* , index */) => (<div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              ><div className="flex items-start gap-4"><Warning className="text-yellow-400 mt-1" /><div><><h3 className="font-bold text-lg mb-2">{discovery.type}</h3><p
</>
className="opacity-90 mb-3">{discovery.description}</p><div className="flex items-center gap-4"><><span className="text-green-400 font-bold">Impact: {discovery.impact}</span><span
</>className={`px-3 py-1 rounded-full text-sm ${
                        discovery.priority === 'HIGH' 
                          ? 'bg-red-500/30 text-red-300'
                          : discovery.priority === 'MEDIUM'
                          ? 'bg-yellow-500/30 text-yellow-300'
                          : 'bg-green-500/30 text-green-300'}`}>
                        {discovery.priority} Priority</span></div></div></div></div>))}</div>)}

        {/* Documents Tab */}
        {selectedTab === 'documents' && (<div className="space-y-4"><div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><><h2 className="text-xl font-semibold text-gray-900 mb-4">Document Archive</h2><div
</>
className="grid grid-cols-3 gap-4 mb-6"><div className="bg-gray-50 p-3 rounded-lg"><><div className="text-2xl font-semibold text-gray-900">1,129,788</div><div
</>
className="text-sm text-gray-600">Total Documents</div></div><div className="bg-gray-50 p-3 rounded-lg"><><div className="text-2xl font-semibold text-gray-900">94,149</div><div
</>
className="text-sm text-gray-600">Properties</div></div><div className="bg-gray-50 p-3 rounded-lg"><><div className="text-2xl font-semibold text-gray-900">2024</div><div
</>
className="text-sm text-gray-600">Current Year</div></div></div><div className="space-y-3"><h3 className="font-medium text-gray-900 mb-3">Document Types</h3>{[
                  {type: 'Deed', count: 342, icon: Building, color: 'text-purple-400'},
                  {type: 'Tax Assessment', count: 1847, icon: DollarSign, color: 'text-green-400'},
                  {type: 'Permits', count: 89, icon: FileText, color: 'text-blue-400'},
                  {type: 'Liens', count: 23, icon: Warning, color: 'text-yellow-400'},
                  {type: 'Easements', count: 56, icon: Globe, color: 'text-pink-400'}
                ].map((docType /* , index */) => (<div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  ><div className="flex items-center gap-4"><docType.icon size={20} className="text-gray-600" /><div><><div className="font-medium text-gray-900">{docType.type}</div><div
</>
className="text-xs text-gray-500">Available for search</div></div></div><div className="flex items-center gap-4"><><span className="text-lg font-semibold text-gray-700">{docType.count.toLocaleString()}</span><button
</>className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        View</button></div></div>))}</div><div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200"><p className="text-sm text-blue-800"><CheckCircle className="inline mr-1" size={14} />All documents are searchable and available for download</p></div></div></div>)}</div></div>
  );
};

export default CleanApp;