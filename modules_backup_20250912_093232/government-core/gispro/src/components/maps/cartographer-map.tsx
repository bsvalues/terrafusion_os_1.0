import React, {useState, useRef, useEffect, useCallback} from 'react';
import {EnhancedMapViewer, 
  EnhancedMapViewerRef} from './enhanced-map-viewer';
import {AdvancedDrawControl} from './advanced-draw-control';
import {FeatureVersionHistory} from './feature-version-history';
import {PrecisionDrawingTools} from './precision-drawing-tools';
import {AnimatedCountyBoundaries} from './animated-county-boundaries';
import LeafletMap from './leaflet/leaflet-map';
import {GeoJSONFeature, 
  MapTool, 
  MapLayerStyle,
  MeasurementType,
  MeasurementUnit} from '@/lib/map-utils';
import {FeatureVersionTracker,
  createCircle,
  createRectangle,
  generateLegalDescription} from '@/lib/advanced-drawing-utils';
import {toast} from '@/hooks/use-toast';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,} from "@/components/ui/dialog";
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import L from 'leaflet';
import {bentonCountyBoundary,
  bentonTownshipBoundaries,
  bentonSectionBoundaries,
  bentonParcelBoundaries} from '@/data/county-boundary-data';

interface CartographerMapProps {width?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  initialFeatures?: GeoJSONFeature[];
  mapLayers?: any[];
  onFeaturesChanged?: (features: GeoJSONFeature[]) => void;
  className?: string;
  showPrecisionTools?: boolean;}

/**
 * Advanced cartographic map component with precision drawing tools and version history
 */
export function CartographerMap({width = '100%',
  height = '600px',
  center = [46.23, -119.16], // Benton County, WA
  zoom = 11,
  initialFeatures = [],
  mapLayers = [],
  onFeaturesChanged,
  className = '',
  showPrecisionTools = true}: CartographerMapProps) {const mapRef = useRef<L.Map | null>(null);
  const [features, setFeatures] = useState<GeoJSONFeature[]>(initialFeatures);
  const [activeTool, setActiveTool] = useState<MapTool>(MapTool.PAN);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isLegalDescriptionOpen, setIsLegalDescriptionOpen] = useState(false);
  const [legalDescription, setLegalDescription] = useState('');
  const versionTrackerRef = useRef<FeatureVersionTracker>(new FeatureVersionTracker());
  
  // Handle map ready
  const handleMapReady = (map: L.Map) =>{
    mapRef.current = map;};
  
  // Handle feature changes
  const handleFeaturesChanged = (newFeatures: GeoJSONFeature[]) => {setFeatures(newFeatures);
    
    if (onFeaturesChanged) {
      onFeaturesChanged(newFeatures);}
  };
  
  // Feature selection
  const handleFeatureClick = (feature: GeoJSONFeature) => {setSelectedFeature(feature);};
  
  // Handle version changes
  const handleVersionChange = (featureId: string, versionId: string) => {const version = versionTrackerRef.current.getVersion(featureId, versionId);
    
    if (!version) return;
    
    // Update the feature with the version data
    const updatedFeatures = features.map(f => {
      if (f.properties?.id === featureId) {
        return version.feature;}
      return f;
    });
    
    handleFeaturesChanged(updatedFeatures);
    
    toast({
      title: "Version Changed",
      description: `Switched to version: ${version.description || 'Unnamed version'}`,
    });
  };
  
  // Handle version restoration
  const handleVersionRestore = (version: any) => {if (!version?.feature || !version.feature.properties?.id) return;
    
    const featureId = version.feature.properties.id;
    
    // Update the feature with the version data
    const updatedFeatures = features.map(f => {
      if (f.properties?.id === featureId) {
        return version.feature;}
      return f;
    });
    
    handleFeaturesChanged(updatedFeatures);
    
    toast({
      title: "Version Restored",
      description: `Restored version: ${version.description || 'Unnamed version'}`,
    });
  };
  
  // Handle rectangle creation
  const handleRectangleCreate = (center: [number, number], width: number, height: number) => {const rectangle = createRectangle(center, width, height);
    
    // Add rectangle to features
    handleFeaturesChanged([...features, rectangle]);
    
    // Add to version history
    if (rectangle.properties?.id) {
      versionTrackerRef.current.addVersion(
        rectangle.properties.id,
        rectangle,
        'Created rectangle'
      );}
  };
  
  // Handle circle creation
  const handleCircleCreate = (center: [number, number], radius: number) => {const circle = createCircle(center, radius);
    
    // Add circle to features
    handleFeaturesChanged([...features, circle]);
    
    // Add to version history
    if (circle.properties?.id) {
      versionTrackerRef.current.addVersion(
        circle.properties.id,
        circle,
        'Created circle'
      );}
  };
  
  // Handle legal description generation
  const handleLegalDescriptionGenerate = (description: string, feature: GeoJSONFeature) => {setLegalDescription(description);
    setIsLegalDescriptionOpen(true);};
  
  // Handle feature creation
  const handleFeatureCreate = (feature: GeoJSONFeature) => {// Add feature to the list
    handleFeaturesChanged([...features, feature]);
    
    // Add to version history
    if (feature.properties?.id) {
      versionTrackerRef.current.addVersion(
        feature.properties.id,
        feature,
        'Created feature'
      );}
  };
  
  // Handle feature editing - single feature adapter for AdvancedDrawControl
  const handleFeatureEdit = (feature: GeoJSONFeature) => {// Call the multi-feature version with an array containing just this feature
    handleFeatureEditBatch([feature]);};
  
  // Handle feature editing - batch version for internal use
  const handleFeatureEditBatch = (editedFeatures: GeoJSONFeature[]) => {// Update features
    const updatedFeatures = features.map(f => {
      const editedFeature = editedFeatures.find(
        ef => ef.properties?.id === f.properties?.id
      );
      return editedFeature || f;});
    
    handleFeaturesChanged(updatedFeatures);
    
    // Add to version history
    editedFeatures.forEach(feature => {if (feature.properties?.id) {
        versionTrackerRef.current.addVersion(
          feature.properties.id,
          feature,
          'Edited feature'
        );}
    });
  };
  
  // Handle feature deletion - single feature adapter for AdvancedDrawControl
  const handleFeatureDelete = (feature: GeoJSONFeature) => {// Call the multi-feature version with an array containing just this feature
    handleFeatureDeleteBatch([feature]);};
  
  // Handle feature deletion - batch version for internal use
  const handleFeatureDeleteBatch = (deletedFeatures: GeoJSONFeature[]) => {// Remove deleted features
    const deletedIds = deletedFeatures.map(f => f.properties?.id).filter(Boolean);
    const remainingFeatures = features.filter(
      f => !deletedIds.includes(f.properties?.id)
    );
    
    handleFeaturesChanged(remainingFeatures);
    
    // Remove from selection if currently selected
    if (selectedFeature && deletedIds.includes(selectedFeature.properties?.id)) {
      setSelectedFeature(null);}
  };
  
  return (<div className={`relative ${className}`}><div className="relative">{/* Use the LeafletMap component instead of EnhancedMapViewer */}<LeafletMap
          width={width}
          height={height}
          latitude={center[0]}
          longitude={center[1]}
          zoom={zoom}
          onMapReady={handleMapReady}
        >{/* Advanced Drawing Control */}<AdvancedDrawControl
            position="topright"
            currentTool={activeTool}
            onToolChange={setActiveTool}
            onFeatureCreated={handleFeatureCreate}
            onFeatureEdited={handleFeatureEdit}
            onFeatureDeleted={handleFeatureDelete}
            existingFeatures={features} />{/* Animated County Boundaries Control */}<AnimatedCountyBoundaries
            countyData={bentonCountyBoundary}
            townshipData={bentonTownshipBoundaries}
            sectionData={bentonSectionBoundaries}
            parcelData={bentonParcelBoundaries}
            position="topleft"
            highlightColor="#3B82F6"
            animationDuration={800}
            onBoundaryChange={(state) => {
              toast({
                title: "Boundary Changed",
                description: `Switched to ${state} view`,
              });
            }}
          /></LeafletMap>{/* Precision Drawing Tools Panel */}
        {showPrecisionTools && (<div className="absolute top-2 right-2 z-[2000]"><PrecisionDrawingTools
              onRectangleCreate={handleRectangleCreate}
              onCircleCreate={handleCircleCreate}
              onParcelNumberGenerate={(parcelNumber) => {
                toast({
                  title: "Parcel Number",
                  description: parcelNumber,});
              }}
              onUndo={() => {
                toast({
                  title: "Undo",
                  description: "Undid last action",});
              }}
              onRedo={() => {
                toast({
                  title: "Redo",
                  description: "Redid last action",});
              }}
              map={mapRef.current}
              selectedFeature={selectedFeature}
            /></div>)}</div>{/* Feature Version History Dialog */}
      {selectedFeature && (<FeatureVersionHistory
          featureId={selectedFeature.properties?.id ?? ''}
          versionTracker={versionTrackerRef.current}
          onVersionRestore={handleVersionRestore}
          open={isVersionHistoryOpen}
          setOpen={setIsVersionHistoryOpen} />)}
      
      {/* Legal Description Dialog */}<Dialog open={isLegalDescriptionOpen} onOpenChange={setIsLegalDescriptionOpen}><DialogContent className="max-w-3xl"><DialogHeader><><DialogTitle>Legal Description</DialogTitle><DialogDescription
</></>>The following is a legal description of the selected parcel.</DialogDescription></DialogHeader><><div className="max-h-[400px] overflow-y-auto border rounded p-3 whitespace-pre-wrap font-mono text-sm">{legalDescription}</div><DialogFooter
</></>><><Button 
              variant="outline" 
              onClick={() =>{
                // Copy to clipboard
                navigator.clipboard.writeText(legalDescription);
                toast({
                  title: "Copied",
                  description: "Legal description copied to clipboard",});
              }}
            >
              Copy to Clipboard</Button><Button
</>
onClick={() => setIsLegalDescriptionOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog></div>
  );
}

export default CartographerMap;