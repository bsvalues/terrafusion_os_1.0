import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Progress} from '@/components/ui/progress';
import {Textarea} from '@/components/ui/textarea';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Plus,
  Search,
  Filter,
  Download,
  FileText,
  MapPin,
  Settings,
  RefreshCw,} from '@mui/icons-material';

interface ParcelData {id: string;
  parcelNumber: string;
  address: string;
  owner: string;
  legalDescription: string;
  acreage: number;
  zoning: string;
  taxValue: number;
  coordinates: [number, number];
  generatedAt: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';}

interface GenerationConfig {count: number;
  region: string;
  parcelType: string;
  includeBuildings: boolean;
  includeUtilities: boolean;
  addressFormat: string;
  coordinateSystem: string;}

export default function ParcelGeneratorPage() {const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<ParcelData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);

  const [config, setConfig] = useState<GenerationConfig>({
    count: 50,
    region: 'texas',
    parcelType: 'residential',
    includeBuildings: true,
    includeUtilities: false,
    addressFormat: 'standard',
    coordinateSystem: 'wgs84',});

  // Load saved parcels on component mount
  useEffect(() =>{const savedParcels = localStorage.getItem('generated-parcels');
    if (savedParcels) {
      const parsed = JSON.parse(savedParcels);
      setParcels(parsed);
      setFilteredParcels(parsed);}
  }, []);

  // Filter parcels based on search term
  useEffect(() => {if (!searchTerm) {
      setFilteredParcels(parcels);} else {const filtered = parcels.filter(
        parcel =>
          parcel.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          parcel.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          parcel.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParcels(filtered);}
  }, [searchTerm, parcels]);

  // Generate random parcel data
  const generateParcels = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const newParcels: ParcelData[] = [];
    const streets = [
      'Main St',
      'Oak Ave',
      'Pine Rd',
      'Cedar Ln',
      'Elm Dr',
      'Maple Way',
      'Park Blvd',
    ];
    const owners = [
      'Smith, John',
      'Johnson, Mary',
      'Williams, David',
      'Brown, Susan',
      'Davis, Michael',
    ];
    const zonings = ['R-1', 'R-2', 'C-1', 'C-2', 'I-1', 'A-1'];

    for (let i = 0; i< config.count; i++) {
      const parcelNumber = `${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const streetNumber = Math.floor(Math.random() * 9999) + 1;
      const street = streets[Math.floor(Math.random() * streets.length)];
      const owner = owners[Math.floor(Math.random() * owners.length)];
      const zoning = zonings[Math.floor(Math.random() * zonings.length)];

      const parcel: ParcelData = {
        id: `parcel-${Date.now()}-${i}`,
        parcelNumber,
        address: `${streetNumber} ${street}`,
        owner,
        legalDescription: generateLegalDescription(),
        acreage: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
        zoning,
        taxValue: Math.floor(Math.random() * 500000) + 50000,
        coordinates: [
          -96.7969 + (Math.random() - 0.5) * 0.1,
          32.7767 + (Math.random() - 0.5) * 0.1,
        ],
        generatedAt: new Date().toISOString(),
        status: 'draft',
      };

      newParcels.push(parcel);

      // Update progress
      setGenerationProgress(((i + 1) / config.count) * 100);

      // Simulate processing time
      await new Promise(resolve =>setTimeout(resolve, 50));
    }

    const updatedParcels = [...parcels, ...newParcels];
    setParcels(updatedParcels);
    setFilteredParcels(updatedParcels);

    // Save to localStorage
    localStorage.setItem('generated-parcels', JSON.stringify(updatedParcels));

    setIsGenerating(false);
    setGenerationProgress(0);
    setSelectedTab('management');
  };

  // Generate realistic legal descriptions
  const generateLegalDescription = () => {const descriptions = [
      'Lot 12, Block 4, Heritage Addition, City of Dallas, Dallas County, Texas',
      'Beginning at the SW corner of Section 15, Township 2N, Range 3E, thence North 200 feet...',
      'Tract 1: A portion of the John Smith Survey, Abstract No. 456, containing 2.5 acres...',
      'Lots 1-3, Block 7, Riverside Subdivision, recorded in Volume 89, Page 123...',
      'Part of the SE 1/4 of Section 22, Township 1S, Range 2W, described as follows...',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];};

  // Toggle parcel selection
  const toggleParcelSelection = (parcelId: string) => {setSelectedParcels(prev =>
      prev.includes(parcelId) ? prev.filter(id => id !== parcelId) : [...prev, parcelId]
    );};

  // Select all parcels
  const selectAllParcels = () => {setSelectedParcels(filteredParcels.map(p => p.id));};

  // Clear selection
  const clearSelection = () => {setSelectedParcels([]);};

  // Export selected parcels
  const exportParcels = (format: 'csv' | 'json' | 'geojson') => {
    const selectedParcelData = parcels.filter(p => selectedParcels.includes(p.id));

    if (format === 'csv') {
      const headers = [
        'Parcel Number',
        'Address',
        'Owner',
        'Acreage',
        'Zoning',
        'Tax Value',
        'Status',
      ];
      const csvContent = [
        headers.join(','),
        ...selectedParcelData.map(p =>
          [
            p.parcelNumber,
            `"${p.address}"`,
            `"${p.owner}"`,
            p.acreage,
            p.zoning,
            p.taxValue,
            p.status,
          ].join(',')
        ),
      ].join('\n');

      downloadFile(csvContent, 'parcels.csv', 'text/csv');
    } else if (format === 'json') {downloadFile(JSON.stringify(selectedParcelData, null, 2), 'parcels.json', 'application/json');} else if (format === 'geojson') {const geojson = {
        type: 'FeatureCollection',
        features: selectedParcelData.map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: p.coordinates,},
          properties: {parcelNumber: p.parcelNumber,
            address: p.address,
            owner: p.owner,
            acreage: p.acreage,
            zoning: p.zoning,
            taxValue: p.taxValue,
            status: p.status,},
        })),
      };
      downloadFile(JSON.stringify(geojson, null, 2), 'parcels.geojson', 'application/geo+json');
    }
  };

  // Download file helper
  const downloadFile = (content: string, filename: string, contentType: string) => {const blob = new Blob([content], { type: contentType});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete selected parcels
  const deleteSelectedParcels = () => {const updatedParcels = parcels.filter(p => !selectedParcels.includes(p.id));
    setParcels(updatedParcels);
    setFilteredParcels(updatedParcels);
    localStorage.setItem('generated-parcels', JSON.stringify(updatedParcels));
    setSelectedParcels([]);};

  // Clear all parcels
  const clearAllParcels = () => {setParcels([]);
    setFilteredParcels([]);
    setSelectedParcels([]);
    localStorage.removeItem('generated-parcels');};

  return (<div className="container mx-auto p-6 space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Parcel Generator</h1><p className="text-muted-foreground">Generate and manage synthetic parcel data for testing and development</p></div><div className="flex items-center gap-2"><Badge variant="outline">{parcels.length} Total Parcels</Badge>{selectedParcels.length > 0 && (<Badge variant="default">{selectedParcels.length} Selected</Badge>)}</div></div><Tabs value={selectedTab} onValueChange={setSelectedTab}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="generator">Generator</TabsTrigger><TabsTrigger value="management">Management</TabsTrigger><TabsTrigger value="export">Export</TabsTrigger></TabsList><TabsContent value="generator" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Generation Configuration</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><div><Label htmlFor="count">Number of Parcels</Label><Input
                    id="count"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.count}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 50}))
                    }
                  /></div><div><Label htmlFor="region">Region</Label><Select
                    value={config.region}
                    onValueChange={value => setConfig(prev => ({ ...prev, region: value}))}
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="texas">Texas</SelectItem><SelectItem value="california">California</SelectItem><SelectItem value="florida">Florida</SelectItem><SelectItem value="newyork">New York</SelectItem></SelectContent></Select></div><div><Label htmlFor="parcelType">Parcel Type</Label><Select
                    value={config.parcelType}
                    onValueChange={value => setConfig(prev => ({ ...prev, parcelType: value}))}
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="industrial">Industrial</SelectItem><SelectItem value="agricultural">Agricultural</SelectItem><SelectItem value="mixed">Mixed Use</SelectItem></SelectContent></Select></div><div><Label htmlFor="addressFormat">Address Format</Label><Select
                    value={config.addressFormat}
                    onValueChange={value => setConfig(prev => ({ ...prev, addressFormat: value}))}
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">Standard (123 Main St)</SelectItem><SelectItem value="rural">Rural (County Road 45)</SelectItem><SelectItem value="apartment">Apartment (123 Main St #4B)</SelectItem></SelectContent></Select></div><div><Label htmlFor="coordinates">Coordinate System</Label><Select
                    value={config.coordinateSystem}
                    onValueChange={value =>
                      setConfig(prev => ({ ...prev, coordinateSystem: value}))
                    }
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="wgs84">WGS84 (Lat/Lon)</SelectItem><SelectItem value="utm">UTM</SelectItem><SelectItem value="state-plane">State Plane</SelectItem></SelectContent></Select></div></div><div className="flex items-center gap-4"><label className="flex items-center gap-2"><input
                    type="checkbox"
                    checked={config.includeBuildings}
                    onChange={e =>setConfig(prev => ({ ...prev, includeBuildings: e.target.checked}))
                    }
                  />
                  Include Building Data</label><label className="flex items-center gap-2"><input
                    type="checkbox"
                    checked={config.includeUtilities}
                    onChange={e =>setConfig(prev => ({ ...prev, includeUtilities: e.target.checked}))
                    }
                  />
                  Include Utility Information</label></div><div className="pt-4"><Button
                  onClick={generateParcels}
                  disabled={isGenerating}
                  className="w-full md:w-auto"
                >{isGenerating ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating... {Math.round(generationProgress)}%</>) : (<><Plus className="h-4 w-4 mr-2" />Generate Parcels</>)}</Button></div>{isGenerating && (<div className="space-y-2"><Progress value={generationProgress} className="w-full" /><p className="text-sm text-muted-foreground">Generating {config.count} parcels... {Math.round(generationProgress)}% complete</p></div>)}</CardContent></Card>{parcels.length === 0 && (<Alert><AlertDescription>No parcels have been generated yet. Configure your settings above and click
                "Generate Parcels" to start.</AlertDescription></Alert>)}</TabsContent><TabsContent value="management" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Parcel Management</CardTitle></CardHeader><CardContent><div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input
                    placeholder="Search parcels by number, address, or owner..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  /></div><div className="flex gap-2"><Button
                    variant="outline"
                    onClick={selectAllParcels}
                    disabled={filteredParcels.length === 0}
                  >Select All</Button><Button
                    variant="outline"
                    onClick={clearSelection}
                    disabled={selectedParcels.length === 0}
                  >Clear Selection</Button><Button
                    variant="destructive"
                    onClick={deleteSelectedParcels}
                    disabled={selectedParcels.length === 0}
                  >Delete Selected</Button></div></div>{filteredParcels.length === 0 ? (<Alert><AlertDescription>{parcels.length === 0
                      ? 'No parcels available. Generate some parcels first.'
                      : 'No parcels match your search criteria.'}</AlertDescription></Alert>) : (<div className="space-y-2">{filteredParcels.map(parcel => (<div
                      key={parcel.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedParcels.includes(parcel.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => toggleParcelSelection(parcel.id)}
                    ><div className="flex items-start justify-between"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1"><div><div className="font-medium">{parcel.parcelNumber}</div><div className="text-sm text-muted-foreground">{parcel.address}</div></div><div><div className="text-sm">Owner: {parcel.owner}</div><div className="text-sm">Acreage: {parcel.acreage}</div></div><div><Badge variant="outline" className="mr-2">{parcel.zoning}</Badge><Badge variant={parcel.status === 'approved' ? 'default' : 'secondary'}>{parcel.status}</Badge></div></div><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">${parcel.taxValue.toLocaleString()}</span></div></div></div>))}</div>)}</CardContent></Card>{parcels.length > 0 && (<Card><CardHeader><CardTitle>Bulk Actions</CardTitle></CardHeader><CardContent><div className="flex gap-2"><Button variant="destructive" onClick={clearAllParcels}>Clear All Parcels</Button></div></CardContent></Card>)}</TabsContent><TabsContent value="export" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Export Data</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Button
                  onClick={() => exportParcels('csv')}
                  disabled={selectedParcels.length === 0}
                  variant="outline"
                  className="h-20 flex-col"
                ><FileText className="h-6 w-6 mb-2" />Export CSV</Button><Button
                  onClick={() => exportParcels('json')}
                  disabled={selectedParcels.length === 0}
                  variant="outline"
                  className="h-20 flex-col"
                ><FileText className="h-6 w-6 mb-2" />Export JSON</Button><Button
                  onClick={() => exportParcels('geojson')}
                  disabled={selectedParcels.length === 0}
                  variant="outline"
                  className="h-20 flex-col"
                ><MapPin className="h-6 w-6 mb-2" />Export GeoJSON</Button></div>{selectedParcels.length === 0 && (<Alert><AlertDescription>Select one or more parcels from the Management tab to enable export options.</AlertDescription></Alert>)}

              {selectedParcels.length > 0 && (<Alert><AlertDescription>Ready to export {selectedParcels.length} selected parcel
                    {selectedParcels.length !== 1 ? 's' : ''}.</AlertDescription></Alert>)}</CardContent></Card></TabsContent></Tabs></div>
  );
}
