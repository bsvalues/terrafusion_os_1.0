import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useMap} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import {Button} from '@/components/ui/button';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ScrollArea} from '@/components/ui/scroll-area';
import {GeoJSONFeature, MapTool} from '@/lib/map-utils';
import {MapIcon,
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
  EyeOff,} from '@mui/icons-material';

// Import the new measurement, snapping, and history functionality
import {MeasurementManager, MeasurementDisplay, MeasurementUnit} from '@/lib/measurement-system';
import {SnapMode, SnapOptions, createSnapManager} from '@/lib/snap-to-feature';
import {createDrawingHistoryManager, DrawingHistoryManager} from '@/lib/drawing-history';
import {createAnnotationManager, AnnotationManager} from '@/lib/drawing-annotation';

export interface AdvancedDrawControlProps {position?: L.ControlPosition;
  currentTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  onFeatureCreated?: (feature: GeoJSONFeature) => void;
  onFeatureEdited?: (feature: GeoJSONFeature) => void;
  onFeatureDeleted?: (feature: GeoJSONFeature) => void;
  existingFeatures?: GeoJSONFeature[];
  drawOptions?: L.Control.DrawConstructorOptions;}

export const AdvancedDrawControl: React.FC<AdvancedDrawControlProps> = ({position = 'topleft',
  currentTool,
  onToolChange,
  onFeatureCreated,
  onFeatureEdited,
  onFeatureDeleted,
  existingFeatures = [],
  drawOptions,}) => {const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const [isDrawActive, setIsDrawActive] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<L.Layer | null>(null);
  const [measurementText, setMeasurementText] = useState<string>('');
  const [snapMode, setSnapMode] = useState<SnapMode>(SnapMode.BOTH);
  const [snapThreshold, setSnapThreshold] = useState<number>(0.01);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('metric');
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [historySnapshots, setHistorySnapshots] = useState<any[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<any | null>(null);
  const [annotationText, setAnnotationText] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Managers for advanced functionality
  const measurementManagerRef = useRef<MeasurementManager | null>(null);
  const historyManagerRef = useRef<DrawingHistoryManager | null>(null);
  const annotationManagerRef = useRef<AnnotationManager | null>(null);
  const snapManagerRef = useRef<any | null>(null);

  // Initialize measurement manager
  useEffect(() =>{
    if (map && !measurementManagerRef.current) {
      measurementManagerRef.current = new MeasurementManager(map, {
        unit: measurementUnit,
        showLabels: showMeasurements,
        precision: 2,});
    }
  }, [map, measurementUnit, showMeasurements]);

  // Initialize history manager
  useEffect(() => {if (map && featureGroupRef.current && !historyManagerRef.current) {
      historyManagerRef.current = createDrawingHistoryManager(featureGroupRef.current, {
        maxHistory: 50,
        onHistoryChanged: (snapshots, currentIndex) => {
          setHistorySnapshots(snapshots);
          setCurrentHistoryIndex(currentIndex);},
      });
    }
  }, [map]);

  // Initialize annotation manager
  useEffect(() => {if (map && !annotationManagerRef.current) {
      annotationManagerRef.current = createAnnotationManager(map, {
        showByDefault: showAnnotations,
        onAnnotationCreated: annotation => {
          setAnnotations(prev => [...prev, annotation]);},
        onAnnotationUpdated: annotation => {setAnnotations(prev => prev.map(a => (a.id === annotation.id ? annotation : a)));},
        onAnnotationDeleted: annotationId => {setAnnotations(prev => prev.filter(a => a.id !== annotationId));},
      });
    }
  }, [map, showAnnotations]);

  // Initialize snap manager
  useEffect(() => {if (map && featureGroupRef.current && !snapManagerRef.current) {
      snapManagerRef.current = createSnapManager(map, featureGroupRef.current, {
        mode: snapMode,
        threshold: snapThreshold,
        enabled: snapEnabled,});
    }
  }, [map, snapMode, snapThreshold, snapEnabled]);

  // Initialize feature group and draw control
  useEffect(() => {if (!map) return;

    // Create feature group for drawn items
    const featureGroup = new L.FeatureGroup();
    featureGroupRef.current = featureGroup;
    map.addLayer(featureGroup);

    // Add existing features
    existingFeatures.forEach(feature => {
      const layer = L.geoJSON(feature);
      featureGroup.addLayer(layer);});

    // Create draw control
    const drawControl = new L.Control.Draw({position: position,
      draw: {
        polyline: currentTool === 'polyline',
        polygon: currentTool === 'polygon',
        rectangle: currentTool === 'rectangle',
        circle: currentTool === 'circle',
        marker: currentTool === 'marker',
        circlemarker: false,},
      edit: {featureGroup: featureGroup,
        remove: true,},
      ...drawOptions,
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Event handlers
    const onDrawCreated = (e: any) => {const { layer} = e;
      featureGroup.addLayer(layer);

      // Add measurement if enabled
      if (measurementManagerRef.current && showMeasurements) {measurementManagerRef.current.addMeasurement(layer);}

      // Save to history
      if (historyManagerRef.current) {historyManagerRef.current.saveSnapshot();}

      // Convert to GeoJSON and notify parent
      const geoJson = layer.toGeoJSON();
      onFeatureCreated?.(geoJson);

      setIsDrawActive(false);
    };

    const onDrawEdited = (e: any) => {const { layers} = e;
      layers.eachLayer((layer: L.Layer) => {// Update measurements
        if (measurementManagerRef.current && showMeasurements) {
          measurementManagerRef.current.updateMeasurement(layer);}

        // Save to history
        if (historyManagerRef.current) {historyManagerRef.current.saveSnapshot();}

        // Convert to GeoJSON and notify parent
        const geoJson = (layer as any).toGeoJSON();
        onFeatureEdited?.(geoJson);
      });
    };

    const onDrawDeleted = (e: any) => {const { layers} = e;
      layers.eachLayer((layer: L.Layer) => {// Remove measurements
        if (measurementManagerRef.current) {
          measurementManagerRef.current.removeMeasurement(layer);}

        // Save to history
        if (historyManagerRef.current) {historyManagerRef.current.saveSnapshot();}

        // Convert to GeoJSON and notify parent
        const geoJson = (layer as any).toGeoJSON();
        onFeatureDeleted?.(geoJson);
      });
    };

    const onDrawStart = () => {setIsDrawActive(true);};

    const onDrawStop = () => {setIsDrawActive(false);};

    // Attach event listeners
    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);

    // Cleanup function
    return () => {map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);

      if (drawControl) {
        map.removeControl(drawControl);}
      if (featureGroup) {map.removeLayer(featureGroup);}
    };
  }, [map, position, drawOptions]);

  // Update draw control when tool changes
  useEffect(() => {if (!drawControlRef.current || !map) return;

    // Remove existing control
    map.removeControl(drawControlRef.current);

    // Create new control with updated tools
    const drawControl = new L.Control.Draw({
      position: position,
      draw: {
        polyline: currentTool === 'polyline',
        polygon: currentTool === 'polygon',
        rectangle: currentTool === 'rectangle',
        circle: currentTool === 'circle',
        marker: currentTool === 'marker',
        circlemarker: false,},
      edit: {featureGroup: featureGroupRef.current!,
        remove: true,},
      ...drawOptions,
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);
  }, [currentTool, map, position, drawOptions]);

  // Snap options update
  useEffect(() => {if (snapManagerRef.current) {
      snapManagerRef.current.updateOptions({
        mode: snapMode,
        threshold: snapThreshold,
        enabled: snapEnabled,});
    }
  }, [snapMode, snapThreshold, snapEnabled]);

  // History navigation functions
  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex< historySnapshots.length - 1;

  const handleUndo = useCallback(() =>{if (historyManagerRef.current && canUndo) {
      historyManagerRef.current.undo();}
  }, [canUndo]);

  const handleRedo = useCallback(() => {if (historyManagerRef.current && canRedo) {
      historyManagerRef.current.redo();}
  }, [canRedo]);

  const handleClearAll = useCallback(() => {if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();

      // Clear measurements
      if (measurementManagerRef.current) {
        measurementManagerRef.current.clearAll();}

      // Clear annotations
      if (annotationManagerRef.current) {annotationManagerRef.current.clearAll();}

      // Save to history
      if (historyManagerRef.current) {historyManagerRef.current.saveSnapshot();}
    }
  }, []);

  const handleSaveState = useCallback(() => {if (historyManagerRef.current) {
      const state = historyManagerRef.current.getCurrentState();
      // Here you would typically save to a backend or local storage
      console.log('Saving drawing state:', state);}
  }, []);

  const handleAddAnnotation = useCallback(() => {if (annotationManagerRef.current && selectedFeature && annotationText) {
      annotationManagerRef.current.addAnnotation(selectedFeature, {
        text: annotationText,
        author: 'Current User', // This would come from user context
        timestamp: new Date(),});
      setAnnotationText('');
      setSelectedFeature(null);
    }
  }, [selectedFeature, annotationText]);

  const handleToggleMeasurements = useCallback(() => {setShowMeasurements(prev => {
      const newValue = !prev;
      if (measurementManagerRef.current) {
        measurementManagerRef.current.setVisible(newValue);}
      return newValue;
    });
  }, []);

  const handleToggleAnnotations = useCallback(() => {setShowAnnotations(prev => {
      const newValue = !prev;
      if (annotationManagerRef.current) {
        annotationManagerRef.current.setVisible(newValue);}
      return newValue;
    });
  }, []);

  // Tool button configurations
  const toolConfigs = [
    {tool: 'marker' as MapTool,
      icon: MapIcon,
      label: 'Point',
      description: 'Draw a point marker',},
    {tool: 'polyline' as MapTool,
      icon: Ruler,
      label: 'Line',
      description: 'Draw a line or polyline',},
    {tool: 'polygon' as MapTool,
      icon: Square,
      label: 'Polygon',
      description: 'Draw a polygon area',},
    {tool: 'rectangle' as MapTool,
      icon: Square,
      label: 'Rectangle',
      description: 'Draw a rectangle',},
    {tool: 'circle' as MapTool,
      icon: Square,
      label: 'Circle',
      description: 'Draw a circle',},
  ];

  return (<React.Fragment>{/* Main drawing toolbar */}<div className="leaflet-bar leaflet-control"><div className="bg-white border border-gray-300 rounded shadow-md p-2 space-y-1">{toolConfigs.map(({tool, icon: Icon, label, description}) => (<TooltipProvider key={tool}><Tooltip><TooltipTrigger asChild><Button
                    variant={currentTool === tool ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onToolChange(tool)}
                  ><Icon className="h-4 w-4 mr-2" />{label}</Button></TooltipTrigger><TooltipContent side="right"><p>{description}</p></TooltipContent></Tooltip></TooltipProvider>))}

          {/* History controls */}<div className="border-t pt-2 space-y-1"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  ><Undo2 className="h-4 w-4 mr-2" />Undo</Button></TooltipTrigger><TooltipContent side="right"><p>Undo last action</p></TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleRedo}
                    disabled={!canRedo}
                  ><Redo2 className="h-4 w-4 mr-2" />Redo</Button></TooltipTrigger><TooltipContent side="right"><p>Redo last undone action</p></TooltipContent></Tooltip></TooltipProvider></div>{/* Action controls */}<div className="border-t pt-2 space-y-1"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleSaveState}
                  ><Save className="h-4 w-4 mr-2" />Save</Button></TooltipTrigger><TooltipContent side="right"><p>Save current drawing state</p></TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleClearAll}
                  ><Trash2 className="h-4 w-4 mr-2" />Clear All</Button></TooltipTrigger><TooltipContent side="right"><p>Clear all drawings</p></TooltipContent></Tooltip></TooltipProvider></div>{/* Advanced options popover */}<div className="border-t pt-2"><Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="w-full justify-start"><LayoutList className="h-4 w-4 mr-2" />Options</Button></PopoverTrigger><PopoverContent side="right" className="w-96"><Tabs defaultValue="drawing" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="drawing">Drawing</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList><TabsContent value="drawing" className="space-y-4"><div className="space-y-4"><div className="flex items-center justify-between"><Label>Snap to Features</Label><Button
                          variant={snapEnabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>setSnapEnabled(!snapEnabled)}
                        >
                          {snapEnabled ? 'On' : 'Off'}</Button></div><div className="flex flex-col gap-1"><Label htmlFor="snap-mode">Snap Mode</Label><Select
                          value={snapMode}
                          onValueChange={(value: SnapMode) => setSnapMode(value)}
                        ><SelectTrigger id="snap-mode"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={SnapMode.VERTEX}>Vertex only</SelectItem><SelectItem value={SnapMode.EDGE}>Edge only</SelectItem><SelectItem value={SnapMode.BOTH}>Vertex and Edge</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-1"><Label htmlFor="snap-threshold">Snap Threshold</Label><Input
                          id="snap-threshold"
                          type="number"
                          min="0.001"
                          max="0.1"
                          step="0.001"
                          value={snapThreshold}
                          onChange={e => setSnapThreshold(parseFloat(e.target.value))}
                        /></div><div className="flex items-center justify-between"><Label>Show Measurements</Label><Button
                          variant={showMeasurements ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleToggleMeasurements}
                        >{showMeasurements ? 'On' : 'Off'}</Button></div><div className="flex flex-col gap-1"><Label htmlFor="measurement-unit">Measurement Unit</Label><Select
                          value={measurementUnit}
                          onValueChange={(value: MeasurementUnit) => setMeasurementUnit(value)}
                        ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="metric">Metric (m/km²)</SelectItem><SelectItem value="imperial">Imperial (ft/acres)</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><Label>Show Annotations</Label><Button
                          variant={showAnnotations ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleToggleAnnotations}
                        >{showAnnotations ? 'On' : 'Off'}</Button></div><div className="flex flex-col gap-1"><Label htmlFor="annotation-text">Add Annotation</Label><Input
                          id="annotation-text"
                          placeholder="Enter annotation text..."
                          value={annotationText}
                          onChange={e => setAnnotationText(e.target.value)}
                        /><Button
                          size="sm"
                          onClick={handleAddAnnotation}
                          disabled={!selectedFeature || !annotationText}
                        ><Plus className="h-4 w-4 mr-1" />Add</Button></div></div></TabsContent><TabsContent value="history" className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between"><Label>Drawing History</Label><div className="text-sm text-muted-foreground">{currentHistoryIndex + 1} / {historySnapshots.length}</div></div><ScrollArea className="h-48 w-full border rounded p-2">{historySnapshots.length === 0 ? (<div className="text-center text-sm text-muted-foreground py-4"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />No history available</div>) : (<div className="space-y-1">{historySnapshots.map((snapshot, index) => (<div
                                key={index}
                                className={`p-2 rounded text-sm ${
                                  index === currentHistoryIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'}`}
                              ><div className="flex items-center gap-2"><Clock className="h-3 w-3" /><span>Version {index + 1}</span>{snapshot.timestamp && (<span className="text-xs opacity-70">{new Date(snapshot.timestamp).toLocaleTimeString()}</span>)}</div><div className="text-xs mt-1 opacity-70">{snapshot.featureCount || 0} features</div></div>))}</div>)}</ScrollArea><div className="flex gap-2"><Button
                          size="sm"
                          variant="outline"
                          onClick={handleUndo}
                          disabled={!canUndo}
                          className="flex-1"
                        ><Undo2 className="h-3 w-3 mr-1" />Undo</Button><Button
                          size="sm"
                          variant="outline"
                          onClick={handleRedo}
                          disabled={!canRedo}
                          className="flex-1"
                        ><Redo2 className="h-3 w-3 mr-1" />Redo</Button></div><Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveState}
                        className="w-full"
                      ><Save className="h-3 w-3 mr-1" />Save Current State</Button></div></TabsContent></Tabs></PopoverContent></Popover></div></div></div>{/* Measurement display */}
      {measurementText && (<div className="leaflet-control-custom-measurement"><div className="bg-white border border-gray-300 rounded shadow-md p-2"><div className="text-sm font-medium">{measurementText}</div></div></div>)}

      {/* Annotations panel */}
      {annotations.length > 0 && (<div className="leaflet-control-custom-annotations"><div className="bg-white border border-gray-300 rounded shadow-md p-2 max-w-xs"><div className="flex items-center justify-between mb-2"><h4 className="text-sm font-medium">Annotations</h4><Button size="sm" variant="ghost" onClick={handleToggleAnnotations}><EyeOff className="h-3 w-3" /></Button></div><ScrollArea className="max-h-32">{annotations.map((annotation, index) => (<div key={annotation.id || index} className="text-xs p-1 border-b"><div className="flex items-center gap-1"><User className="h-3 w-3" /><span className="font-medium">{annotation.author}</span></div><div className="text-muted-foreground">{annotation.text}</div><div className="text-xs opacity-50">{new Date(annotation.timestamp).toLocaleString()}</div></div>))}</ScrollArea></div></div>)}</React.Fragment>
  );
};

export default AdvancedDrawControl;
