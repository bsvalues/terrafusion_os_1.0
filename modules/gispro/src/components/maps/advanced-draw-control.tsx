import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { GeoJSONFeature, MapTool } from '@/lib/map-utils';
import { MapIcon, 
  Ruler, 
  Square, 
  LayoutList, 
  Undo2, 
  Redo2,
  Save,
  Clock,
  Edit3,
  Trash2,
  User,
  StickyNote,
  RotateCcw,
  Plus,
  EyeOff
 } from '@mui/icons-material';

// Import the new measurement, snapping, and history functionality
import { 
  MeasurementManager, 
  MeasurementDisplay, 
  MeasurementUnit 
} from '@/lib/measurement-system';
import { 
  SnapMode, 
  SnapOptions, 
  createSnapManager 
} from '@/lib/snap-to-feature';
import { 
  createDrawingHistoryManager, 
  DrawingHistoryManager 
} from '@/lib/drawing-history';
import { 
  createAnnotationManager, 
  AnnotationManager 
} from '@/lib/drawing-annotation';

export interface AdvancedDrawControlProps {
  position?: L.ControlPosition;
  currentTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onFeatureCreated?: (feature: GeoJSONFeature) => void;
  onFeatureEdited?: (feature: GeoJSONFeature) => void;
  onFeatureDeleted?: (feature: GeoJSONFeature) => void;
  existingFeatures?: GeoJSONFeature[];
  drawOptions?: L.Control.DrawConstructorOptions;
}

export const AdvancedDrawControl: React.FC<AdvancedDrawControlProps> = ({
  position = 'topleft',
  currentTool,
  onToolChange,
  onFeatureCreated,
  onFeatureEdited,
  onFeatureDeleted,
  existingFeatures = [],
  drawOptions
}) => {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const [isDrawActive, setIsDrawActive] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<L.Layer | null>(null);
  const [measurementText, setMeasurementText] = useState<string>('');
  const [snapMode, setSnapMode] = useState<SnapMode>(SnapMode.BOTH);
  const [snapThreshold, setSnapThreshold] = useState<number>(0.01);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [activeVersionName, setActiveVersionName] = useState<string>('Current');
  const [note, setNote] = useState<string>('');
  
  // Create manager instances
  const measurementManagerRef = useRef<MeasurementManager>(new MeasurementManager());
  const measurementDisplayRef = useRef<MeasurementDisplay>(new MeasurementDisplay());
  const snapManagerRef = useRef(createSnapManager());
  const historyManagerRef = useRef<DrawingHistoryManager>(createDrawingHistoryManager());
  const annotationManagerRef = useRef<AnnotationManager>(createAnnotationManager());
  
  // Store references to managers for easier access
  const measurementManager = measurementManagerRef.current;
  const measurementDisplay = measurementDisplayRef.current;
  const snapManager = snapManagerRef.current;
  const historyManager = historyManagerRef.current;
  const annotationManager = annotationManagerRef.current;
  
  // Get saved versions
  const [versions, setVersions] = useState(historyManager.getVersions());
  
  // Initialize draw control
  useEffect(() => {
    if (map) {
      // Create feature group if it doesn't exist
      if (!featureGroupRef.current) {
        featureGroupRef.current = new L.FeatureGroup().addTo(map);
      }
      
      // Add existing features to the feature group
      if (existingFeatures && existingFeatures.length > 0 && featureGroupRef.current) {
        // Clear previous features
        featureGroupRef.current.clearLayers();
        
        // Add each feature to the feature group
        existingFeatures.forEach(feature => {
          const layer = L.geoJSON(feature as any).getLayers()[0];
          featureGroupRef.current?.addLayer(layer);
          
          // Add feature to snap manager for snapping
          snapManager.addFeature(feature);
        });
      }

      // Create draw control with options
      const defaultOptions: L.Control.DrawConstructorOptions = {
        position,
        draw: {
          polyline: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 3
            }
          },
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e11d48',
              timeout: 1000
            },
            shapeOptions: {
              color: '#3b82f6',
              weight: 3
            }
          },
          circle: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 3
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 3
            }
          },
          marker: true,
          circlemarker: false
        },
        edit: {
          featureGroup: featureGroupRef.current,
          remove: true,
          edit: {
            selectedPathOptions: {
              color: '#f97316',
              weight: 4
            }
          }
        }
      };

      // Merge default options with provided options
      const mergedOptions = {
        ...defaultOptions,
        ...(drawOptions || {}),
        edit: {
          ...defaultOptions.edit,
          ...(drawOptions?.edit || {})
        }
      };

      // Create draw control
      drawControlRef.current = new L.Control.Draw(mergedOptions);
    }

    // Cleanup
    return () => {
      if (map && drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
    };
  }, [map, position, existingFeatures, drawOptions]);

  // Handle tool changes
  useEffect(() => {
    if (!map || !drawControlRef.current) return;

    // Remove existing control
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    // Add control if draw tool is selected
    if (currentTool === MapTool.DRAW || currentTool === MapTool.EDIT) {
      map.addControl(drawControlRef.current);
      setIsDrawActive(true);
    } else {
      setIsDrawActive(false);
    }
  }, [map, currentTool]);

  // Handle map events
  useEffect(() => {
    if (!map) return;

    // Event handler for when a new shape is created
    const handleCreated = (e: L.LeafletEvent) => {
      const layer = e.layer;
      featureGroupRef.current?.addLayer(layer);
      
      // Convert the layer to a GeoJSON feature
      const feature = layer.toGeoJSON() as GeoJSONFeature;
      
      // Add to history manager
      historyManager.addOperation('create', feature);
      
      // Add attribution information
      annotationManager.setAttribution(feature.id as string, {
        createdBy: 'Current User',
        createdAt: new Date()
      });
      
      // Add to snap manager for future snapping
      snapManager.addFeature(feature);
      
      // Update versions list
      setVersions(historyManager.getVersions());
      
      // Call callback if provided
      if (onFeatureCreated) {
        onFeatureCreated(feature);
      }
    };

    // Event handler for when a shape is edited
    const handleEdited = (e: L.LeafletEvent) => {
      const layers = (e as any).layers;
      layers.eachLayer((layer: L.Layer) => {
        // Convert the edited layer to a GeoJSON feature
        const feature = layer.toGeoJSON() as GeoJSONFeature;
        
        // Add to history manager
        historyManager.addOperation('modify', feature);
        
        // Record modification
        annotationManager.recordModification(feature.id as string, {
          modifiedBy: 'Current User',
          modifiedAt: new Date(),
          description: 'Shape edited'
        });
        
        // Update in snap manager
        snapManager.addFeature(feature);
        
        // Update versions list
        setVersions(historyManager.getVersions());
        
        // Call callback if provided
        if (onFeatureEdited) {
          onFeatureEdited(feature);
        }
      });
    };

    // Event handler for when a shape is deleted
    const handleDeleted = (e: L.LeafletEvent) => {
      const layers = (e as any).layers;
      layers.eachLayer((layer: L.Layer) => {
        // Convert the deleted layer to a GeoJSON feature
        const feature = layer.toGeoJSON() as GeoJSONFeature;
        
        // Add to history manager
        historyManager.addOperation('delete', feature);
        
        // Update versions list
        setVersions(historyManager.getVersions());
        
        // Call callback if provided
        if (onFeatureDeleted) {
          onFeatureDeleted(feature);
        }
      });
    };

    // Handle draw events for real-time measurements
    const handleDrawStart = (e: L.LeafletEvent) => {
      // Clear previous measurements
      measurementManager.clear();
    };

    const handleDrawVertex = (e: L.LeafletEvent) => {
      const latlng = (e as any).latlng;
      let point: [number, number] = [latlng.lng, latlng.lat];
      
      // Apply snapping if enabled
      if (snapEnabled) {
        point = snapManager.snapPoint(point, {
          mode: snapMode,
          threshold: snapThreshold
        });
      }
      
      // Add point to measurement manager
      measurementManager.addPoint(point);
      
      // Update measurement display
      updateMeasurementText();
    };

    // Add event listeners
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);
    map.on(L.Draw.Event.DRAWSTART, handleDrawStart);
    map.on(L.Draw.Event.DRAWVERTEX, handleDrawVertex);

    // Cleanup event listeners
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
      map.off(L.Draw.Event.DRAWVERTEX, handleDrawVertex);
    };
  }, [map, onFeatureCreated, onFeatureEdited, onFeatureDeleted, snapEnabled, snapMode, snapThreshold]);

  // Update measurement text displayed to the user
  const updateMeasurementText = useCallback(() => {
    const perimeter = measurementManager.getCurrentPerimeter();
    const area = measurementManager.getCurrentArea();
    
    let text = '';
    
    if (perimeter > 0) {
      text += `Distance: ${measurementDisplay.formatDistance(perimeter, MeasurementUnit.METERS)}`;
    }
    
    if (area > 0) {
      if (text) text += ' | ';
      text += `Area: ${measurementDisplay.formatArea(area, MeasurementUnit.SQUARE_METERS)}`;
      
      // Also show in acres for land management
      const acres = area / 4046.86;
      text += ` (${acres.toFixed(2)} ac)`;
    }
    
    setMeasurementText(text);
  }, [measurementManager, measurementDisplay]);

  // Handle undo operation
  const handleUndo = () => {
    if (historyManager.undo()) {
      // Update the feature group with the new state
      updateFeatureGroup();
    }
  };

  // Handle redo operation
  const handleRedo = () => {
    if (historyManager.redo()) {
      // Update the feature group with the new state
      updateFeatureGroup();
    }
  };

  // Save current state as a named version
  const handleSaveVersion = (name: string) => {
    const versionId = historyManager.saveVersion(name);
    setVersions(historyManager.getVersions());
    setActiveVersionName(name);
  };

  // Restore to a saved version
  const handleRestoreVersion = (versionId: string) => {
    if (historyManager.restoreVersion(versionId)) {
      // Update the feature group with the new state
      updateFeatureGroup();
      
      // Find the version name
      const version = versions.find(v => v.id === versionId);
      if (version) {
        setActiveVersionName(version.name);
      }
    }
  };

  // Add a note to the selected feature
  const handleAddNote = () => {
    if (selectedFeature && note) {
      const feature = selectedFeature.toGeoJSON() as GeoJSONFeature;
      annotationManager.addNote(feature.id as string, note);
      setNote('');
    }
  };

  // Update the feature group based on the current state
  const updateFeatureGroup = () => {
    if (!featureGroupRef.current) return;
    
    // Clear current features
    featureGroupRef.current.clearLayers();
    
    // Get current state and add features to the feature group
    const features = historyManager.getCurrentState();
    features.forEach(feature => {
      const layer = L.geoJSON(feature as any).getLayers()[0];
      featureGroupRef.current?.addLayer(layer);
    });
    
    // Reset snap manager
    snapManager.clearFeatures();
    features.forEach(feature => snapManager.addFeature(feature));
  };

  // Switch between draw tool modes
  const switchTool = (tool: MapTool) => {
    onToolChange(tool);
  };

  return (
    <div className="leaflet-draw-section">
      <div className="leaflet-draw-toolbar leaflet-bar">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === MapTool.PAN ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => switchTool(MapTool.PAN)}
                aria-label="Pan map"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pan</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === MapTool.MEASURE ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => switchTool(MapTool.MEASURE)}
                aria-label="Measure distances"
              >
                <Ruler className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Measure</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === MapTool.DRAW ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => switchTool(MapTool.DRAW)}
                aria-label="Draw shapes"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Draw</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === MapTool.EDIT ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => switchTool(MapTool.EDIT)}
                aria-label="Edit features"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {isDrawActive && (
        <div className="leaflet-draw-actions absolute left-0 top-10 bg-background border rounded-md p-2 shadow-md flex flex-col gap-2 z-50">
          {/* Measurement display */}
          {measurementText && (
            <div className="text-xs font-medium bg-muted p-2 rounded-md">
              {measurementText}
            </div>
          )}
          
          {/* Drawing tools */}
          <div className="flex flex-wrap gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleUndo}
                    aria-label="Undo last change"
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRedo}
                    aria-label="Redo last undone change"
                  >
                    <Redo2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Save feature version"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <div className="flex flex-col gap-2"><>

                    <h3 className="font-medium">Save Version</h3>
                    <Input
</>

                      placeholder="Version name"
                      onChange={(e) => setActiveVersionName(e.target.value)}
                      value={activeVersionName}
                    />
                    <Button size="sm" onClick={() => handleSaveVersion(activeVersionName)}>
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="View version history"
                  >
                    <Clock className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <div className="flex flex-col gap-2"><>

                    <h3 className="font-medium">Versions</h3>
                    <ScrollArea
</>
className="h-36">
                      {versions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No saved versions</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {versions.map((version) => (
                            <div key={version.id} className="flex justify-between items-center"><>

                              <span className="text-xs">
                                {version.name}
                              </span>
                              <Button
</>

                                size="xs" 
                                variant="ghost" 
                                onClick={() => handleRestoreVersion(version.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipProvider>
          </div>
          
          {/* Snapping controls */}
          <Tabs defaultValue="snap">
            <TabsList className="grid w-full grid-cols-2"><>

              <TabsTrigger value="snap">Snapping</TabsTrigger>
              <TabsTrigger
</>
value="annotations">Annotations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="snap" className="space-y-2">
              <div className="flex items-center justify-between"><>

                <Label htmlFor="snap-enabled" className="text-xs">Enable Snapping</Label>
                <input
</>

                  id="snap-enabled"
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                  className="toggle toggle-sm"
                />
              </div>
              
              <div className="flex flex-col gap-1"><>

                <Label htmlFor="snap-mode" className="text-xs">Snap Mode</Label>
                <Select
</>

                  value={snapMode}
                  onValueChange={(value) => setSnapMode(value as SnapMode)}
                >
                  <SelectTrigger id="snap-mode"><>

                    <SelectValue placeholder="Snap Mode" />
                  </SelectTrigger>
                  <SelectContent
</>
</>><>

                    <SelectItem value={SnapMode.VERTEX}>Vertex only</SelectItem>
                    <SelectItem
</>
value={SnapMode.EDGE}>Edge only</SelectItem><>

                    <SelectItem value={SnapMode.BOTH}>Both</SelectItem>
                    <SelectItem
</>
value={SnapMode.NONE}>None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-1"><>

                <Label htmlFor="snap-threshold" className="text-xs">
                  Snap Threshold: {snapThreshold.toFixed(3)}
                </Label>
                <input
</>

                  id="snap-threshold"
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.001"
                  value={snapThreshold}
                  onChange={(e) => setSnapThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="annotations" className="space-y-2">
              {selectedFeature ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span className="text-xs">Created by: Current User</span>
                  </div>
                  
                  <div className="flex flex-col gap-1"><>

                    <Label htmlFor="note" className="text-xs">Add Note</Label>
                    <div
</>
className="flex gap-1">
                      <Input 
                        id="note"
                        placeholder="Add a note..." 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="text-xs h-7"
                      />
                      <Button 
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={handleAddNote}
                        aria-label="Add annotation note"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1"><>

                    <Label className="text-xs">Notes</Label>
                    <ScrollArea
</>
className="h-20 border rounded-md p-1">
                      {selectedFeature && (
                        <div className="flex flex-col gap-1">
                          {annotationManager.getNotes((selectedFeature.toGeoJSON() as GeoJSONFeature).id as string).map((note /* , index */) => (
                            <div key={index} className="flex items-start gap-1 p-1 border-b">
                              <StickyNote className="h-3 w-3 mt-0.5" />
                              <span className="text-xs">{note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Select a feature to add annotations</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};