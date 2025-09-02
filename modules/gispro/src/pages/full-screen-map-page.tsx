import React, { useState, useRef } from 'react';
import { MapPin, 
  Layers as LayersIcon, 
  Ruler, 
  Pencil, 
  HandMetal, 
  MousePointer2,
  Square,
  Circle,
  Trash2,
  ChevronRight, 
  Info
 } from '@mui/icons-material';

import { FullScreenMapLayout } from '@/components/maps/full-screen-map-layout';
import { MapControlPanel } from '@/components/maps/map-control-panel';
import { SleekMapControls } from '@/components/maps/sleek-map-controls';
import EnhancedMapViewer from '@/components/maps/enhanced-map-viewer';
import { Button } from '@/components/ui/button';
import { MapTool, MeasurementType, MeasurementUnit } from '@/lib/map-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';

/**
 * Full screen map page with sleek controls and beautiful framing.
 * This page demonstrates a production-ready map interface with elegant
 * design and responsive layout.
 */
export default function FullScreenMapPage() {
  // Map state
  const [activeTool, setActiveTool] = useState<MapTool>(MapTool.PAN);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [measurementType, setMeasurementType] = useState<MeasurementType | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(MeasurementUnit.FEET);
  const [measurementValue, setMeasurementValue] = useState<number | undefined>(undefined);
  const [showParcelInfo, setShowParcelInfo] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const mapRef = useRef<any>(null);
  // Using toast directly from import

  // Define map layers
  const mapLayers = [
    {
      name: 'Parcels',
      visible: true,
      style: {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.2,
        fillColor: '#93C5FD'
      }
    },
    {
      name: 'Buildings',
      visible: true,
      style: {
        color: '#4B5563',
        weight: 1,
        fillOpacity: 0.3,
        fillColor: '#9CA3AF'
      }
    },
    {
      name: 'Roads',
      visible: true,
      style: {
        color: '#EC4899',
        weight: 3,
        fillOpacity: 0,
      }
    },
    {
      name: 'Waterways',
      visible: false,
      style: {
        color: '#0EA5E9',
        weight: 2,
        fillOpacity: 0.3,
        fillColor: '#7DD3FC'
      }
    }
  ];

  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
    toast({
      title: 'Parcel Selected',
      description: `Selected parcel ID: ${parcelId}`,
      variant: 'success'
    });
  };

  // Handle tool change
  const handleToolChange = (tool: MapTool) => {
    setActiveTool(tool);
    
    // If switching to measurement tool, set default measurement type
    if (tool === MapTool.MEASURE && !measurementType) {
      setMeasurementType(MeasurementType.DISTANCE);
    }
    
    // If switching away from measurement tool, clear measurement type
    if (tool !== MapTool.MEASURE) {
      setMeasurementType(null);
    }
  };

  // Define control groups for the map controls
  const controlGroups = [
    {
      id: 'navigation',
      label: 'Navigation Controls',
      controls: [
        {
          id: 'pan',
          label: 'Pan Tool',
          icon: <HandMetal className="h-4 w-4" />,
          isActive: activeTool === MapTool.PAN,
          onClick: () => handleToolChange(MapTool.PAN)
        },
        {
          id: 'select',
          label: 'Select Tool',
          icon: <MousePointer2 className="h-4 w-4" />,
          isActive: activeTool === MapTool.SELECT,
          onClick: () => handleToolChange(MapTool.SELECT)
        }
      ]
    },
    {
      id: 'measure',
      label: 'Measurement Tools',
      controls: [
        {
          id: 'measure',
          label: 'Measure Tool',
          icon: <Ruler className="h-4 w-4" />,
          isActive: activeTool === MapTool.MEASURE,
          onClick: () => handleToolChange(MapTool.MEASURE)
        }
      ]
    },
    {
      id: 'draw',
      label: 'Drawing Tools',
      controls: [
        {
          id: 'draw',
          label: 'Draw Tool',
          icon: <Pencil className="h-4 w-4" />,
          isActive: activeTool === MapTool.DRAW,
          onClick: () => handleToolChange(MapTool.DRAW)
        },
        {
          id: 'rectangle',
          label: 'Draw Rectangle',
          icon: <Square className="h-4 w-4" />,
          isActive: false,
          isDisabled: activeTool !== MapTool.DRAW,
          onClick: () => {
            // This would trigger rectangle drawing in a real implementation
          }
        },
        {
          id: 'circle',
          label: 'Draw Circle',
          icon: <Circle className="h-4 w-4" />,
          isActive: false,
          isDisabled: activeTool !== MapTool.DRAW,
          onClick: () => {
            // This would trigger circle drawing in a real implementation
          }
        },
        {
          id: 'clear',
          label: 'Clear Drawing',
          icon: <Trash2 className="h-4 w-4" />,
          isActive: false,
          onClick: () => {
            // This would clear drawings in a real implementation
          }
        }
      ]
    }
  ];

  // Create the header content
  const headerContent = (
    <div className="container mx-auto px-4 py-2 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span>BentonGeoPro</span>
        </h1>
        <p className="text-xs text-muted-foreground">GIS Workflow Solution</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1">
          <Info className="h-4 w-4" />
          Help
        </Button>
      </div>
    </div>
  );

  // Create the sidebar content
  const sidebarContent = (
      <div className="p-4 border-b"><>

        <h2 className="text-lg font-semibold mb-1">Map Controls</h2>
        <p
</>
className="text-sm text-muted-foreground">Configure map display and tools</p>
      </div>

      <Tabs defaultValue="property" className="w-full">
        <TabsList className="px-4 py-2 w-full grid grid-cols-3 gap-1">
          <TabsTrigger value="property" className="text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Property</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="layers" className="text-xs">
            <div className="flex items-center gap-1">
              <LayersIcon className="h-3.5 w-3.5" />
              <span>Layers</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              <span>Tools</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Property Tab */}
        <TabsContent value="property" className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
          {selectedParcelId ? (
            <div className="space-y-4">
              <div><>

                <Label className="text-xs font-medium text-gray-500">Parcel ID</Label>
                <p
</>
className="text-sm font-medium">{selectedParcelId}</p>
              </div>
              <div><>

                <Label className="text-xs font-medium text-gray-500">Owner</Label>
                <p
</>
className="text-sm font-medium">John Smith</p>
              </div>
              <div><>

                <Label className="text-xs font-medium text-gray-500">Address</Label>
                <p
</>
className="text-sm font-medium">123 Main St, Kennewick, WA 99336</p>
              </div>
              <div><>

                <Label className="text-xs font-medium text-gray-500">Area</Label>
                <p
</>
className="text-sm font-medium">2.45 acres (10,724 sq ft)</p>
              </div>
              <div><>

                <Label className="text-xs font-medium text-gray-500">Zoning</Label>
                <p
</>
className="text-sm font-medium">Residential (R-1)</p>
              </div>
              <div><>

                <Label className="text-xs font-medium text-gray-500">Assessed Value</Label>
                <p
</>
className="text-sm font-medium">$245,000</p>
              </div>
              
              <div className="pt-2 grid grid-cols-2 gap-2"><>

                <Button variant="outline" size="sm" className="w-full">View Details</Button>
                <Button
</>
variant="outline" size="sm" className="w-full">Export</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <MapPin className="text-gray-400 mb-2" size={32} /><>

              <p className="text-gray-500 mb-1">No parcel selected</p>
              <p
</>
className="text-xs text-gray-400">Click on a parcel on the map to see its details</p>
            </div>
          )}
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent value="layers" className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-3">
              {mapLayers.map((layer /* , index */) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: layer.style.color }}
                    />
                    <Label htmlFor={`layer-${index}`} className="text-sm cursor-pointer">
                      {layer.name}
                    </Label>
                  </div>
                  <Switch 
                    id={`layer-${index}`} 
                    defaultChecked={layer.visible} 
                  />
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t"><>

              <Label className="text-xs font-medium text-gray-500 mb-2 block">Base Map</Label>
              <div
</>
className="grid grid-cols-3 gap-2"><>

                <Button variant="outline" size="sm" className="w-full text-xs">Streets</Button>
                <Button
</>
variant="outline" size="sm" className="w-full text-xs">Satellite</Button>
                <Button variant="outline" size="sm" className="w-full text-xs">Hybrid</Button>
              </div>
            </div>
            
            <div className="pt-4 border-t"><>

              <Label className="text-xs font-medium text-gray-500 mb-2 block">Opacity</Label>
              <Input
</>

                type="range" 
                min="0" 
                max="100" 
                defaultValue="100" 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><>

                <span>0%</span>
                <span
</>
</>>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
          <div className="space-y-6">
            <div><>

              <Label className="text-xs font-medium text-gray-500 mb-2 block">Active Tool</Label>
              <div
</>
className="grid grid-cols-3 gap-2">
                <Button 
                  variant={activeTool === MapTool.PAN ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => handleToolChange(MapTool.PAN)}
                ><>

                  <HandMetal className="h-3.5 w-3.5 mr-1" />
                  Pan
                </Button>
                <Button
</>

                  variant={activeTool === MapTool.SELECT ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => handleToolChange(MapTool.SELECT)}
                ><>

                  <MousePointer2 className="h-3.5 w-3.5 mr-1" />
                  Select
                </Button>
                <Button
</>

                  variant={activeTool === MapTool.MEASURE ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => handleToolChange(MapTool.MEASURE)}
                >
                  <Ruler className="h-3.5 w-3.5 mr-1" />
                  Measure
                </Button>
              </div>
            </div>
            
            {activeTool === MapTool.MEASURE && (
              <div><>

                <Label className="text-xs font-medium text-gray-500 mb-2 block">Measurement</Label>
                <RadioGroup
</>

                  value={measurementType || ''}
                  onValueChange={(value) => {
                    if (value === '') {
                      setMeasurementType(null);
                    } else {
                      setMeasurementType(value as MeasurementType);
                    }
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={MeasurementType.DISTANCE} id="distance" />
                      <Label htmlFor="distance" className="text-xs">Distance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={MeasurementType.AREA} id="area" />
                      <Label htmlFor="area" className="text-xs">Area</Label>
                    </div>
                  </div>
                </RadioGroup>
                
                <div className="mt-2"><>

                  <Label className="text-xs font-medium text-gray-500 mb-2 block">Units</Label>
                  <RadioGroup
</>

                    value={measurementUnit}
                    onValueChange={(value) => setMeasurementUnit(value as MeasurementUnit)}
                  >
                    <div className="grid grid-cols-3 gap-1">
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value={MeasurementUnit.FEET} id="feet" />
                        <Label htmlFor="feet" className="text-xs">Feet</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value={MeasurementUnit.METERS} id="meters" />
                        <Label htmlFor="meters" className="text-xs">Meters</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value={MeasurementUnit.MILES} id="miles" />
                        <Label htmlFor="miles" className="text-xs">Miles</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                
                {measurementValue && (
                  <Card className="mt-4 bg-muted/50">
                    <CardContent className="p-3"><>

                      <Label className="text-xs font-medium text-gray-500 block">Measurement Result</Label>
                      <p
</>
className="text-sm font-medium">
                        {measurementType === MeasurementType.DISTANCE ? 'Distance' : 'Area'}: {measurementValue.toFixed(2)} {
                          measurementType === MeasurementType.DISTANCE 
                            ? (measurementUnit === MeasurementUnit.FEET ? 'ft' : 
                               measurementUnit === MeasurementUnit.METERS ? 'm' : 'mi')
                            : (measurementUnit === MeasurementUnit.FEET ? 'sq ft' : 
                               measurementUnit === MeasurementUnit.METERS ? 'sq m' : 'sq mi')
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {activeTool === MapTool.DRAW && (
              <div><>

                <Label className="text-xs font-medium text-gray-500 mb-2 block">Drawing Tools</Label>
                <div
</>
className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="w-full text-xs"><>

                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Free
                  </Button>
                  <Button
</>
variant="outline" size="sm" className="w-full text-xs"><>

                    <Square className="h-3.5 w-3.5 mr-1" />
                    Rectangle
                  </Button>
                  <Button
</>
variant="outline" size="sm" className="w-full text-xs">
                    <Circle className="h-3.5 w-3.5 mr-1" />
                    Circle
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All Drawings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
  );

  return (
    <FullScreenMapLayout
      headerContent={headerContent}
      sidebarContent={sidebarContent}
      defaultCollapsed={false}
    >
      {/* Enhanced Map Viewer */}
      <EnhancedMapViewer
        width="100%"
        height="100%"
        center={[46.23, -119.16]} // Benton County, WA
        zoom={11}
        mapLayers={mapLayers}
        activeTool={activeTool}
        onParcelSelect={handleParcelSelect}
        ref={mapRef}
        showDrawTools={true}
        showMeasureTools={true}
        measurementType={measurementType}
        measurementUnit={measurementUnit}
        onMeasure={(value, type) => {
          setMeasurementValue(value);
          if (type) setMeasurementType(type);
        }}
      />

      {/* Sleek Map Controls */}
      <SleekMapControls
        controlGroups={controlGroups}
        position="top-left"
        direction="horizontal"
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />
      
      {/* Floating Map Control Panel for Layer Visibility */}
      {showLayers && (
        <MapControlPanel
          title="Visible Layers"
          position="top-right"
          collapsible={true}
          defaultCollapsed={true}
          dismissible={true}
          onDismiss={() => setShowLayers(false)}
        >
          <div className="space-y-2">
            {mapLayers.map((layer /* , index */) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: layer.style.color }}
                  />
                  <Label htmlFor={`quick-layer-${index}`} className="text-sm cursor-pointer">
                    {layer.name}
                  </Label>
                </div>
                <Switch 
                  id={`quick-layer-${index}`} 
                  defaultChecked={layer.visible} 
                />
              </div>
            ))}
          </div>
        </MapControlPanel>
      )}
      
      {/* Floating Parcel Info Panel */}
      {selectedParcelId && showParcelInfo && (
        <MapControlPanel
          title="Parcel Information"
          position="bottom-right"
          collapsible={true}
          defaultCollapsed={false}
          dismissible={true}
          onDismiss={() => setShowParcelInfo(false)}
        >
          <div className="space-y-3">
            <div><>

              <Label className="text-xs font-medium text-gray-500">Parcel ID</Label>
              <p
</>
className="text-sm font-medium">{selectedParcelId}</p>
            </div>
            <div><>

              <Label className="text-xs font-medium text-gray-500">Owner</Label>
              <p
</>
className="text-sm font-medium">John Smith</p>
            </div>
            <div><>

              <Label className="text-xs font-medium text-gray-500">Assessed Value</Label>
              <p
</>
className="text-sm font-medium">$245,000</p>
            </div>
            
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
              <ChevronRight className="h-4 w-4" /> View Details
            </Button>
          </div>
        </MapControlPanel>
      )}
    </FullScreenMapLayout>
  );
}