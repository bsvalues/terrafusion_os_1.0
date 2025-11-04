import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import TerraFusionMap from '@/components/TerraFusionMap';
import { Search, Database, MapPin, FileText, Plus, Users, Building, Tractor, Home  } from '@mui/icons-material';

interface BentonParcel {
  id: string
  parcelNumber: string
  legalDescription: string
  situsAddress?: string
  ownerName?: string
  assessedValue?: number
  landValue?: number
  improvementValue?: number
  acreage?: number
  propertyType?: string
  taxingDistricts?: string[]
  lastModified: string
}

interface BentonCountyStats {
  totalParcels: number
  totalAssessedValue: number
  averageValue: number
  propertyTypes: {
    residential: number
    commercial: number
    agricultural: number
    industrial: number
  }
  recentActivity: number
}

export default function BentonCountyDashboard() {
  const [selectedParcel, setSelectedParcel] = useState<BentonParcel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: bentonConfig } = useQuery({
    queryKey: ['/api/benton-county/config'],
    enabled: true
  })

  const { data: bentonParcels = [], isLoading: parcelsLoading } = useQuery({
    queryKey: ['/api/benton-county/parcels', { limit: 100 }],
    enabled: true
  })

  const { data: bentonStats } = useQuery({
    queryKey: ['/api/benton-county/statistics'],
    enabled: true
  })

  const { data: recentDocuments = [] } = useQuery({
    queryKey: ['/api/documents', { limit: 10 }],
    enabled: true
  })

  const searchParcels = useQuery({
    queryKey: ['/api/benton-county/parcels', { search: searchQuery }],
    enabled: searchQuery.length > 2
  })

  const displayedParcels = searchQuery.length > 2 
    ? searchParcels.data || [] 
    : bentonParcels.slice(0, 15)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div><>

            <h1 className="text-2xl font-bold text-gray-900">Terrafusion Benton County</h1>
            <p
</>

className="text-gray-600">
              Civil Infrastructure Intelligence Platform - Benton County, Washington
            </p>
            {bentonConfig && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500"><>

                <span>Population: {bentonConfig.county.population.toLocaleString()}</span>
                <span
</>

</>>FIPS: {bentonConfig.county.fipsCode}</span>
                <span>Cities: {bentonConfig.cities.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} /><>

              <Input
                placeholder="Search Benton County parcels, addresses, owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-96"
              />
            </div>
            <Button
</>

</>>
              <Plus size={16} className="mr-2" />
              New Assessment
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        <aside className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Benton County Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database size={16} />
                  Benton County Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded"><>

                    <div className="font-bold text-lg text-blue-600">{bentonParcels.length}</div>
                    <div
</>

className="text-gray-600">Total Parcels</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded"><>

                    <div className="font-bold text-lg text-green-600">
                      {bentonStats ? formatCurrency(bentonStats.totalAssessedValue) : 'Loading...'}
                    </div>
                    <div
</>

className="text-gray-600">Total Value</div>
                  </div>
                </div>
                
                {bentonStats && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1"><>

                        <Home size={12} /> Residential
                      </span>
                      <Badge
</>

variant="secondary">{bentonStats.propertyTypes.residential}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1"><>

                        <Tractor size={12} /> Agricultural
                      </span>
                      <Badge
</>

variant="secondary">{bentonStats.propertyTypes.agricultural}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1"><>

                        <Building size={12} /> Commercial
                      </span>
                      <Badge
</>

variant="secondary">{bentonStats.propertyTypes.commercial}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cities in Benton County */}
            {bentonConfig && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin size={16} />
                    Benton County Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bentonConfig.cities.map((city: any) => (
                      <div key={city.name} className="flex justify-between items-center"><>

                        <span className="text-sm font-medium">{city.name}</span>
                        <span
</>

className="text-xs text-gray-600">
                          {city.population.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Parcels */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin size={16} />
                  Benton County Parcels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parcelsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {displayedParcels.map((parcel: BentonParcel) => (
                      <div
                        key={parcel.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          selectedParcel?.id === parcel.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedParcel(parcel)}
                      >
                        <div className="font-medium text-sm">{parcel.parcelNumber}</div>
                        {parcel.situsAddress && (
                          <div className="text-xs text-gray-600">{parcel.situsAddress}</div>
                        )}
                        {parcel.ownerName && (
                          <div className="text-xs text-gray-500">{parcel.ownerName}</div>
                        )}
                        {parcel.assessedValue && (
                          <div className="text-xs text-green-600 font-medium">
                            {formatCurrency(parcel.assessedValue)}
                          </div>
                        )}
                        {parcel.propertyType && (
                          <Badge variant="outline" className="text-xs">
                            {parcel.propertyType}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentDocuments.map((doc: any) => (
                    <div key={doc.id} className="p-2 border rounded text-xs"><>

                      <div className="font-medium">{doc.fileName}</div>
                      <div
</>

className="text-gray-600">{doc.documentType}</div>
                      <div className="text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {recentDocuments.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No documents available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="flex-1 relative">
          <TerraFusionMap 
            selectedParcelId={selectedParcel?.id}
            onParcelSelect={(parcelData) => {
              const parcel = bentonParcels.find((p: BentonParcel) => 
                p.parcelNumber === parcelData.parcelNumber
              )
              if (parcel) setSelectedParcel(parcel)
            }}
          />
          
          {selectedParcel && (
            <Card className="absolute bottom-4 left-4 w-96 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin size={16} />
                  Benton County Parcel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><>

                    <label className="text-xs font-medium text-gray-600">Parcel Number</label>
                    <div
</>

className="text-sm font-mono">{selectedParcel.parcelNumber}</div>
                  </div>
                  {selectedParcel.acreage && (
                    <div><>

                      <label className="text-xs font-medium text-gray-600">Acreage</label>
                      <div
</>

className="text-sm">{selectedParcel.acreage} acres</div>
                    </div>
                  )}
                </div>
                
                {selectedParcel.situsAddress && (
                  <div><>

                    <label className="text-xs font-medium text-gray-600">Situs Address</label>
                    <div
</>

className="text-sm">{selectedParcel.situsAddress}</div>
                  </div>
                )}
                
                {selectedParcel.ownerName && (
                  <div><>

                    <label className="text-xs font-medium text-gray-600">Owner</label>
                    <div
</>

className="text-sm">{selectedParcel.ownerName}</div>
                  </div>
                )}
                
                {selectedParcel.assessedValue && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded"><>

                      <div className="font-bold text-green-600">
                        {formatCurrency(selectedParcel.assessedValue)}
                      </div>
                      <div
</>

className="text-gray-600">Total Value</div>
                    </div>
                    {selectedParcel.landValue && (
                      <div className="text-center p-2 bg-blue-50 rounded"><>

                        <div className="font-bold text-blue-600">
                          {formatCurrency(selectedParcel.landValue)}
                        </div>
                        <div
</>

className="text-gray-600">Land</div>
                      </div>
                    )}
                    {selectedParcel.improvementValue && (
                      <div className="text-center p-2 bg-purple-50 rounded"><>

                        <div className="font-bold text-purple-600">
                          {formatCurrency(selectedParcel.improvementValue)}
                        </div>
                        <div
</>

className="text-gray-600">Improvements</div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedParcel.taxingDistricts && selectedParcel.taxingDistricts.length > 0 && (
                  <div><>

                    <label className="text-xs font-medium text-gray-600">Taxing Districts</label>
                    <div
</>

className="flex flex-wrap gap-1 mt-1">
                      {selectedParcel.taxingDistricts.map((district /* , index */) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {district}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-2 space-y-2"><>

                  <Button size="sm" className="w-full">
                    View Assessment Details
                  </Button>
                  <Button
</>

size="sm" variant="outline" className="w-full">
                    Generate SM00 Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}