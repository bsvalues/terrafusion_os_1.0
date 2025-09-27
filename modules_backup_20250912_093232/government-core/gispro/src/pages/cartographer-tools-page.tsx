import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,} from '@/components/ui/dialog';
import {Map,
  Ruler,
  Compass,
  Layers,
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Pencil,
  Eraser,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Target,
  Grid,
  Info,
  HelpCircle,
  FileJson,
  Database,
  Crosshair,
  Move,
  RotateCw,
  Maximize,
  Minimize,} from 'lucide-react';

// Types
interface CartographyTool {id: string;
  name: string;
  icon: React.ReactNode;
  category: 'drawing' | 'measurement' | 'editing' | 'analysis' | 'export';
  description: string;
  hotkey?: string;
  isActive: boolean;
  isPremium?: boolean;}

interface MapFeature {id: string;
  type: 'point' | 'line' | 'polygon' | 'annotation';
  coordinates: [number, number][];
  properties: Record<string, any>;
  style: {
    color: string;
    fillColor?: string;
    weight: number;
    opacity: number;};
}

interface WorkspaceSettings {gridSize: number;
  snapToGrid: boolean;
  showCoordinates: boolean;
  autoSave: boolean;
  precision: number;
  units: 'metric' | 'imperial';}

// Animation variants
const containerVariants = {hidden: { opacity: 0},
  visible: {opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,},
  },
};

const cardVariants = {hidden: { opacity: 0, y: 20},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut'},
  },
};

const toolVariants = {hidden: { opacity: 0, scale: 0.9},
  visible: {opacity: 1,
    scale: 1,
    transition: { duration: 0.3},
  },
  hover: {scale: 1.05,
    transition: { duration: 0.2},
  },
};

export default function CartographerToolsPage() {// State management
  const [selectedTool, setSelectedTool] = useState<string>('pointer');
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({
    gridSize: 10,
    snapToGrid: true,
    showCoordinates: true,
    autoSave: true,
    precision: 2,
    units: 'metric',});
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [exportTab, setExportTab] = useState('json');
  const [importData, setImportData] = useState('');

  // Cartography tools
  const [cartographyTools] = useState<CartographyTool[]>([
    {id: 'pointer',
      name: 'Select',
      icon: <MousePointer2 className="h-5 w-5" />,
      category: 'editing',
      description: 'Select and move features',
      hotkey: 'V',
      isActive: true,},
    {id: 'point',
      name: 'Point',
      icon: <Crosshair className="h-5 w-5" />,
      category: 'drawing',
      description: 'Add point markers',
      hotkey: 'P',
      isActive: false,},
    {id: 'line',
      name: 'Line',
      icon: <Ruler className="h-5 w-5" />,
      category: 'drawing',
      description: 'Draw lines and polylines',
      hotkey: 'L',
      isActive: false,},
    {id: 'polygon',
      name: 'Polygon',
      icon: <Square className="h-5 w-5" />,
      category: 'drawing',
      description: 'Create polygon areas',
      hotkey: 'G',
      isActive: false,},
    {id: 'circle',
      name: 'Circle',
      icon: <Circle className="h-5 w-5" />,
      category: 'drawing',
      description: 'Draw circles and ellipses',
      hotkey: 'C',
      isActive: false,},
    {id: 'freehand',
      name: 'Freehand',
      icon: <Pencil className="h-5 w-5" />,
      category: 'drawing',
      description: 'Freehand drawing tool',
      hotkey: 'F',
      isActive: false,},
    {id: 'measure',
      name: 'Measure',
      icon: <Ruler className="h-5 w-5" />,
      category: 'measurement',
      description: 'Measure distances and areas',
      hotkey: 'M',
      isActive: false,},
    {id: 'bearing',
      name: 'Bearing',
      icon: <Compass className="h-5 w-5" />,
      category: 'measurement',
      description: 'Calculate bearings and angles',
      hotkey: 'B',
      isActive: false,},
    {id: 'area',
      name: 'Area',
      icon: <Target className="h-5 w-5" />,
      category: 'measurement',
      description: 'Calculate area measurements',
      hotkey: 'A',
      isActive: false,},
    {id: 'move',
      name: 'Move',
      icon: <Move className="h-5 w-5" />,
      category: 'editing',
      description: 'Move features',
      hotkey: 'O',
      isActive: false,},
    {id: 'rotate',
      name: 'Rotate',
      icon: <RotateCw className="h-5 w-5" />,
      category: 'editing',
      description: 'Rotate features',
      hotkey: 'R',
      isActive: false,},
    {id: 'scale',
      name: 'Scale',
      icon: <Maximize className="h-5 w-5" />,
      category: 'editing',
      description: 'Scale features',
      hotkey: 'S',
      isActive: false,},
    {id: 'eraser',
      name: 'Eraser',
      icon: <Eraser className="h-5 w-5" />,
      category: 'editing',
      description: 'Delete features',
      hotkey: 'E',
      isActive: false,},
  ]);

  // Sample map features
  useEffect(() =>{setMapFeatures([
      {
        id: 'feat-1',
        type: 'polygon',
        coordinates: [
          [100, 100],
          [200, 100],
          [200, 200],
          [100, 200],
          [100, 100],
        ],
        properties: { name: 'Property A', area: '2.5 acres'},
        style: {color: '#3B82F6', fillColor: '#3B82F6', weight: 2, opacity: 0.7},
      },
      {id: 'feat-2',
        type: 'line',
        coordinates: [
          [50, 250],
          [250, 250],
        ],
        properties: { name: 'Boundary Line', length: '200m'},
        style: {color: '#EF4444', weight: 3, opacity: 0.8},
      },
      {id: 'feat-3',
        type: 'point',
        coordinates: [[150, 300]],
        properties: { name: 'Survey Point', elevation: '125m'},
        style: {color: '#10B981', weight: 8, opacity: 1},
      },
    ]);
  }, []);

  // Tool handlers
  const handleToolSelect = (toolId: string) => {setSelectedTool(toolId);
    setIsDrawing(false);};

  const handleUndo = () => {console.log('Undo last action');};

  const handleRedo = () => {console.log('Redo last action');};

  const handleSave = () => {console.log('Save current work');};

  const handleDownloadGeoJSON = () => {const geojson = {
      type: 'FeatureCollection',
      features: mapFeatures.map(feature => ({
        type: 'Feature',
        geometry: {
          type:
            feature.type === 'point' ? 'Point' : feature.type === 'line' ? 'LineString' : 'Polygon',
          coordinates: feature.coordinates,},
        properties: feature.properties,
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cartographer-features.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGeoJSON = () => {
    try {
      const data = JSON.parse(importData);
      if (data.type === 'FeatureCollection') {
        const newFeatures: MapFeature[] = data.features.map((feature: any, index: number) => ({
          id: `imported-${index}`,
          type: feature.geometry.type.toLowerCase(),
          coordinates: feature.geometry.coordinates,
          properties: feature.properties || {},
          style: {color: '#8B5CF6', fillColor: '#8B5CF6', weight: 2, opacity: 0.7},
        }));
        setMapFeatures(prev => [...prev, ...newFeatures]);
        setImportData('');
        setJsonDialogOpen(false);
      }
    } catch (error) {console.error('Invalid GeoJSON data');}
  };

  const getCategoryTools = (category: CartographyTool['category']) => {return cartographyTools.filter(tool => tool.category === category);};

  const getCategoryIcon = (category: CartographyTool['category']) => {switch (category) {
      case 'drawing':
        return<Pencil className="h-4 w-4" />;
      case 'measurement':
        return <Ruler className="h-4 w-4" />;
      case 'editing':
        return <MousePointer2 className="h-4 w-4" />;
      case 'analysis':
        return <Target className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;}
  };

  return (
    <motion.div
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >{/* Header */}<motion.div className="text-center space-y-4" variants={cardVariants}><h1 className="text-4xl font-bold text-foreground">Professional Cartographer Tools</h1><p className="text-xl text-muted-foreground max-w-3xl mx-auto">Advanced mapping and surveying tools for precision cartography, boundary analysis, and
          professional geospatial data creation.</p><div className="flex items-center justify-center gap-4"><Badge variant="outline" className="flex items-center gap-2"><Target className="h-3 w-3" />Precision Tools</Badge><Badge variant="outline" className="flex items-center gap-2"><Compass className="h-3 w-3" />Survey Grade</Badge><Badge variant="outline" className="flex items-center gap-2"><Zap className="h-3 w-3" />Real-time Calc</Badge></div></motion.div>{/* Tool Categories */}<motion.div className="grid grid-cols-1 lg:grid-cols-4 gap-6" variants={cardVariants}>{['drawing', 'measurement', 'editing', 'analysis'].map(category => (<Card key={category}><CardHeader><CardTitle className="flex items-center gap-2 text-lg">{getCategoryIcon(category as CartographyTool['category'])}
                {category.charAt(0).toUpperCase() + category.slice(1)} Tools</CardTitle><CardDescription>{category === 'drawing' && 'Create geometric features and annotations'}
                {category === 'measurement' && 'Precise distance, area, and angle calculations'}
                {category === 'editing' && 'Modify and transform existing features'}
                {category === 'analysis' && 'Advanced spatial analysis and calculations'}</CardDescription></CardHeader><CardContent><motion.div
                className="grid grid-cols-2 gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >{getCategoryTools(category as CartographyTool['category']).map(tool => (<motion.div
                    key={tool.id}
                    variants={toolVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95}}
                  ><Button
                      variant={selectedTool === tool.id ? 'default' : 'outline'}
                      size="sm"
                      className="w-full flex flex-col items-center gap-1 h-16"
                      onClick={() =>handleToolSelect(tool.id)}
                    >
                      {tool.icon}<span className="text-xs">{tool.name}</span>{tool.hotkey && (<Badge variant="secondary" className="text-xs px-1 py-0">{tool.hotkey}</Badge>)}</Button></motion.div>))}</motion.div></CardContent></Card>))}</motion.div>{/* Workspace */}<motion.div className="grid grid-cols-1 xl:grid-cols-4 gap-6" variants={cardVariants}>{/* Main Canvas */}<div className="xl:col-span-3"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Drawing Canvas</CardTitle><CardDescription>Interactive cartography workspace with precision tools</CardDescription></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={handleUndo}><Undo className="h-3 w-3" /></Button><Button size="sm" variant="outline" onClick={handleRedo}><Redo className="h-3 w-3" /></Button><Button size="sm" variant="outline" onClick={handleSave}><Save className="h-3 w-3" /></Button><Button size="sm" onClick={() => setJsonDialogOpen(true)}><Download className="h-3 w-3 mr-1" />Export</Button></div></div></CardHeader><CardContent><div className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg h-96 border overflow-hidden">{/* Grid background */}
                {workspaceSettings.snapToGrid && (<div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: `${workspaceSettings.gridSize}px ${workspaceSettings.gridSize}px`,
                    }} />)}

                {/* Features */}<svg className="absolute inset-0 w-full h-full">{mapFeatures.map(feature => {
                    if (feature.type === 'polygon' && feature.coordinates.length > 0) {
                      const points = feature.coordinates.map(coord => coord.join(',')).join(' ');
                      return (<polygon
                          key={feature.id}
                          points={points}
                          fill={feature.style.fillColor}
                          stroke={feature.style.color}
                          strokeWidth={feature.style.weight}
                          opacity={feature.style.opacity}
                          className="cursor-pointer hover:opacity-80" />);
                    } else if (feature.type === 'line' && feature.coordinates.length >= 2) {
                      return (<polyline
                          key={feature.id}
                          points={feature.coordinates.map(coord =>coord.join(',')).join(' ')}
                          fill="none"
                          stroke={feature.style.color}
                          strokeWidth={feature.style.weight}
                          opacity={feature.style.opacity}
                          className="cursor-pointer hover:opacity-80"
                        />
                      );
                    } else if (feature.type === 'point' && feature.coordinates.length > 0) {
                      const [x, y] = feature.coordinates[0];
                      return (<circle
                          key={feature.id}
                          cx={x}
                          cy={y}
                          r={feature.style.weight}
                          fill={feature.style.color}
                          opacity={feature.style.opacity}
                          className="cursor-pointer hover:opacity-80" />);
                    }
                    return null;
                  })}</svg>{/* Coordinates display */}
                {workspaceSettings.showCoordinates && (<div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">Current Tool: {cartographyTools.find(t => t.id === selectedTool)?.name}</div>)}

                {/* Canvas controls */}<div className="absolute bottom-2 right-2 flex items-center gap-1"><Button size="sm" variant="outline"><Grid className="h-3 w-3" /></Button><Button size="sm" variant="outline"><Layers className="h-3 w-3" /></Button><Button size="sm" variant="outline"><Settings className="h-3 w-3" /></Button></div></div></CardContent><CardFooter><div className="flex items-center justify-between w-full"><div className="text-sm text-muted-foreground">{mapFeatures.length} feature{mapFeatures.length !== 1 ? 's' : ''} on map</div><div className="flex items-center gap-2"><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />View All</Button><Button size="sm" variant="outline" onClick={() => setShowTutorial(true)}><HelpCircle className="h-3 w-3 mr-1" />Help</Button></div></div></CardFooter></Card></div>{/* Properties Panel */}<div className="space-y-4">{/* Tool Properties */}<Card><CardHeader><CardTitle className="text-lg">Tool Properties</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium mb-2 block">Selected Tool</label><div className="p-3 border rounded-lg bg-muted/50"><div className="flex items-center gap-2 mb-1">{cartographyTools.find(t => t.id === selectedTool)?.icon}<span className="font-medium">{cartographyTools.find(t => t.id === selectedTool)?.name}</span></div><p className="text-xs text-muted-foreground">{cartographyTools.find(t => t.id === selectedTool)?.description}</p></div></div><div className="space-y-3"><div><label className="text-sm font-medium mb-1 block">Precision</label><Input
                    type="number"
                    value={workspaceSettings.precision}
                    onChange={e =>
                      setWorkspaceSettings(prev => ({
                        ...prev,
                        precision: parseInt(e.target.value),}))
                    }
                    min="0"
                    max="6"
                  /></div><div><label className="text-sm font-medium mb-1 block">Grid Size</label><Input
                    type="number"
                    value={workspaceSettings.gridSize}
                    onChange={e =>
                      setWorkspaceSettings(prev => ({
                        ...prev,
                        gridSize: parseInt(e.target.value),}))
                    }
                    min="5"
                    max="50"
                  /></div><div className="space-y-2"><Button
                    variant={workspaceSettings.snapToGrid ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setWorkspaceSettings(prev => ({
                        ...prev,
                        snapToGrid: !prev.snapToGrid,}))
                    }
                  ><Grid className="h-3 w-3 mr-1" />Snap to Grid</Button><Button
                    variant={workspaceSettings.showCoordinates ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setWorkspaceSettings(prev => ({
                        ...prev,
                        showCoordinates: !prev.showCoordinates,}))
                    }
                  ><Crosshair className="h-3 w-3 mr-1" />Show Coordinates</Button></div></div></CardContent></Card>{/* Feature List */}<Card><CardHeader><CardTitle className="text-lg">Features</CardTitle></CardHeader><CardContent><div className="space-y-2">{mapFeatures.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">No features created yet</p>) : (
                  mapFeatures.map(feature => (<div
                      key={feature.id}
                      className="flex items-center justify-between p-2 border rounded text-xs"
                    ><div><div className="font-medium">{feature.properties.name || feature.type}</div><div className="text-muted-foreground">{feature.type}</div></div><div className="flex items-center gap-1"><Button size="sm" variant="ghost"><Eye className="h-3 w-3" /></Button><Button size="sm" variant="ghost"><Eraser className="h-3 w-3" /></Button></div></div>))
                )}</div></CardContent></Card></div></motion.div>{/* Export/Import Dialog */}<Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Export/Import Data</DialogTitle><DialogDescription>Export your cartography work or import existing GeoJSON data</DialogDescription></DialogHeader><Tabs defaultValue="json" value={exportTab} onValueChange={setExportTab}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="json">Export GeoJSON</TabsTrigger><TabsTrigger value="import">Import</TabsTrigger></TabsList><TabsContent value="json" className="space-y-4"><div><label className="text-sm font-medium mb-2 block">GeoJSON Output</label><Textarea
                  value={JSON.stringify(
                    {
                      type: 'FeatureCollection',
                      features: mapFeatures.map(feature => ({
                        type: 'Feature',
                        geometry: {
                          type:
                            feature.type === 'point'
                              ? 'Point'
                              : feature.type === 'line'
                                ? 'LineString'
                                : 'Polygon',
                          coordinates: feature.coordinates,},
                        properties: feature.properties,
                      })),
                    },
                    null,
                    2
                  )}
                  readOnly
                  className="h-40 text-xs font-mono"
                /></div><DialogFooter className="mt-6"><Button onClick={handleDownloadGeoJSON}><Download className="h-4 w-4 mr-2" />Download GeoJSON</Button></DialogFooter></TabsContent><TabsContent value="import" className="space-y-4"><div><label className="text-sm font-medium mb-2 block">Import GeoJSON</label><Textarea
                  value={importData}
                  onChange={e => setImportData(e.target.value)}
                  placeholder='{"type":"FeatureCollection","features":[...]}'
                  className="h-40 text-xs font-mono"
                /></div><DialogFooter className="mt-6"><Button onClick={handleImportGeoJSON} disabled={!importData.trim()}><Upload className="h-4 w-4 mr-2" />Import Features</Button></DialogFooter></TabsContent></Tabs></DialogContent></Dialog>{/* Tutorial Dialog */}<Dialog open={showTutorial} onOpenChange={setShowTutorial}><DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Cartographer Tools Tutorial</DialogTitle><DialogDescription>Learn how to use professional cartography tools for precision mapping</DialogDescription></DialogHeader><div className="space-y-4 mt-4"><div className="border-l-4 border-blue-500 pl-4 py-2 mb-6 bg-blue-50 rounded"><h3 className="font-semibold text-blue-900">Getting Started</h3><p className="text-sm text-blue-800 mt-1">Select tools from the categories above and start creating precise geospatial
                features. Use keyboard shortcuts for faster workflow.</p></div><div><h4 className="font-semibold mb-2">Drawing Tools</h4><p className="text-sm text-muted-foreground mb-2">Create geometric features with precision</p><ul className="text-sm space-y-1 ml-4"><li><strong>Point Tool:</strong>Click to place precise markers</li><li><strong>Line Tool:</strong>Draw lines with precise measurements</li><li><strong>Polygon Tool:</strong>Create closed areas and boundaries</li><li><strong>Circle Tool:</strong>Draw perfect circles and ellipses</li><li><strong>Freehand Tool:</strong>Draw organic shapes and annotations</li></ul></div><div><h4 className="font-semibold mb-2">Measurement Tools</h4><p className="text-sm text-muted-foreground mb-2">Accurate distance, area, and angle calculations</p><ul className="text-sm space-y-1 ml-4"><li><strong>Measure Tool:</strong>Calculate distances between points</li><li><strong>Bearing Tool:</strong>Determine directional angles</li><li><strong>Area Tool:</strong>Calculate area measurements</li></ul></div><div><h4 className="font-semibold mb-2">Editing Tools</h4><p className="text-sm text-muted-foreground mb-2">Modify and transform existing features</p><ul className="text-sm space-y-1 ml-4"><li><strong>Select Tool:</strong>Choose and manipulate features</li><li><strong>Move Tool:</strong>Reposition features precisely</li><li><strong>Rotate Tool:</strong>Rotate features around pivot points</li><li><strong>Scale Tool:</strong>Resize features while maintaining proportions</li></ul></div><div><h4 className="font-semibold mb-2">Analysis Features</h4><p className="text-sm text-muted-foreground mb-2">Advanced spatial analysis capabilities</p><ul className="text-sm space-y-1 ml-4"><li><strong>Coordinate Display:</strong>Real-time coordinate tracking</li><li><strong>Grid System:</strong>Snap-to-grid for precision alignment</li><li><strong>Layer Management:</strong>Organize features in layers</li><li><strong>Annotations:</strong>Add notes to explain changes</li></ul></div><div><h4 className="font-semibold mb-2">Data Management</h4><p className="text-sm text-muted-foreground mb-2">Import, export, and share your cartographic work</p><ul className="text-sm space-y-1 ml-4"><li><strong>GeoJSON Export:</strong>Industry-standard format support</li><li><strong>Import Features:</strong>Load existing geospatial data</li><li><strong>Auto-save:</strong>Automatic work preservation</li><li><strong>Export:</strong>Download descriptions for use in legal documents</li></ul></div><div><h4 className="font-semibold mb-2">Professional Features</h4><p className="text-sm text-muted-foreground mb-2">Enterprise-grade capabilities for professional cartographers</p><ul className="text-sm space-y-1 ml-4"><li><strong>Survey Integration:</strong>Import survey data directly</li><li><strong>Legal Descriptions:</strong>Generate legal property descriptions</li><li><strong>Coordinate Systems:</strong>Support for multiple projections</li><li><strong>Interoperability:</strong>Compatible with other GIS systems</li></ul></div></div><DialogFooter className="mt-6"><Button onClick={() => setShowTutorial(false)}><CheckCircle className="h-4 w-4 mr-2" />Got it!</Button></DialogFooter></DialogContent></Dialog></motion.div>
  );
}
