import React, {useState, useCallback, useMemo} from 'react';
import {useQuery, useMutation, QueryClient, useQueryClient} from '@tanstack/react-query';
import {MapLayer} from '@shared/schema';

// Define interface for layer metadata
interface LayerMetadata {description?: string;
  attribution?: string;
  category?: string;
  url?: string;
  [key: string]: any; // Allow for other properties}
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Slider} from '@/components/ui/slider';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Search, Eye, EyeOff, Layers, ArrowUp, ArrowDown, Info, Settings} from '@mui/icons-material';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Skeleton} from '@/components/ui/skeleton';
import {Popover,
  PopoverContent,
  PopoverTrigger,} from "@/components/ui/popover";
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from "@/components/ui/select";

/**
 * Enhanced Layer Control component
 * Provides advanced functionality for managing map layers:
 * - Toggle layer visibility
 * - Adjust layer opacity
 * - Reorder layers
 * - Filter layers by type or category
 */
export function EnhancedLayerControl() {const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const queryClient = useQueryClient();

  // Fetch all map layers, including hidden ones
  const { data: layers, isLoading, error} = useQuery<MapLayer[]>({queryKey: ['/api/map-layers/all'],
    staleTime: 60000, // 1 minute});

  // Mutation for updating layer properties
  const updateLayerMutation = useMutation({mutationFn: async ({ id, updates}: {id: number, updates: Partial<MapLayer>}) =>{
      const response = await fetch(`/api/map-layers/${id}`, {method: 'PATCH',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update layer: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/map-layers']});
    },
  });

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layer: MapLayer) => {updateLayerMutation.mutate({
      id: layer.id,
      updates: { visible: !layer.visible}
    });
  }, [updateLayerMutation]);

  // Update layer opacity
  const updateOpacity = useCallback((layer: MapLayer, opacity: number) => {updateLayerMutation.mutate({
      id: layer.id,
      updates: { opacity}
    });
  }, [updateLayerMutation]);

  // Move layer up in order
  const moveLayerUp = useCallback((layer: MapLayer, allLayers: MapLayer[]) => {const currentIndex = allLayers.findIndex(l => l.id === layer.id);
    if (currentIndex<= 0) return; // Already at the top
    
    const targetLayer = allLayers[currentIndex - 1];
    
    // Swap orders
    updateLayerMutation.mutate({
      id: layer.id,
      updates: { order: targetLayer.order}
    });
    
    updateLayerMutation.mutate({id: targetLayer.id,
      updates: { order: layer.order}
    });
  }, [updateLayerMutation]);

  // Move layer down in order
  const moveLayerDown = useCallback((layer: MapLayer, allLayers: MapLayer[]) =>{const currentIndex = allLayers.findIndex(l => l.id === layer.id);
    if (currentIndex >= allLayers.length - 1) return; // Already at the bottom
    
    const targetLayer = allLayers[currentIndex + 1];
    
    // Swap orders
    updateLayerMutation.mutate({
      id: layer.id,
      updates: { order: targetLayer.order}
    });
    
    updateLayerMutation.mutate({id: targetLayer.id,
      updates: { order: layer.order}
    });
  }, [updateLayerMutation]);

  // Filter and sort layers
  const filteredLayers = useMemo(() => {if (!layers) return [];
    
    let filtered = [...layers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(layer => 
        layer.name.toLowerCase().includes(term) || 
        (layer.metadata && (layer.metadata as LayerMetadata).category && (layer.metadata as LayerMetadata).category.toLowerCase().includes(term))
      );}
    
    // Apply type filter
    if (filterType) {filtered = filtered.filter(layer => layer.type === filterType);}
    
    // Apply source filter
    if (filterSource) {filtered = filtered.filter(layer => layer.source === filterSource);}
    
    // Apply tab filter
    if (activeTab === 'visible') {filtered = filtered.filter(layer => layer.visible);} else if (activeTab === 'hidden') {filtered = filtered.filter(layer => !layer.visible);}
    
    // Sort by order
    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [layers, searchTerm, filterType, filterSource, activeTab]);

  // Get unique layer types and sources for filtering
  const {layerTypes, layerSources} = useMemo(() => {if (!layers || !layers.length) return { layerTypes: [], layerSources: []};
    
    const types = Array.from(new Set(layers.map(layer => layer.type as string)));
    const sources = Array.from(new Set(layers.map(layer => layer.source as string)));
    
    return {layerTypes: types, layerSources: sources};
  }, [layers]);

  // Loading state
  if (isLoading) {return (<div className="space-y-4 p-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-10 w-full" /><div className="space-y-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></div>);}

  // Error state
  if (error) {return (<div className="p-4 text-destructive"><><h3 className="font-medium">Error loading map layers</h3><p
</>
className="text-sm">Please try refreshing the page</p></div>);}

  return (<Card className="w-full border shadow-sm"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-lg flex items-center"><><Layers className="mr-2 h-5 w-5" />Layer Control</CardTitle><CardDescription
</></>>Manage map layer visibility and properties</CardDescription></div></div></CardHeader><CardContent className="px-0">{/* Search and filter */}<div className="px-4 pb-3"><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input
              placeholder="Search layers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            /></div></div>{/* Layer filter tabs */}<div className="px-4 pb-2"><Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}><TabsList className="w-full"><><TabsTrigger value="all" className="flex-1">All Layers</TabsTrigger><TabsTrigger
</>
value="visible" className="flex-1">Visible</TabsTrigger><TabsTrigger value="hidden" className="flex-1">Hidden</TabsTrigger></TabsList></Tabs></div>{/* Additional filters */}<div className="px-4 py-2 flex flex-wrap gap-2"><Select value={filterType || ""} onValueChange={(value) => setFilterType(value || null)}><SelectTrigger className="w-[120px]"><><SelectValue placeholder="Layer Type" /></SelectTrigger><SelectContent
</></>><SelectItem value="">All Types</SelectItem>{layerTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><Select value={filterSource || ""} onValueChange={(value) => setFilterSource(value || null)}><SelectTrigger className="w-[120px]"><><SelectValue placeholder="Source" /></SelectTrigger><SelectContent
</></>><SelectItem value="">All Sources</SelectItem>{layerSources.map(source => (<SelectItem key={source} value={source}>{source}</SelectItem>))}</SelectContent></Select>{(filterType || filterSource || searchTerm) && (<Button 
              variant="ghost" 
              size="sm" 
              onClick={() =>{
                setFilterType(null);
                setFilterSource(null);
                setSearchTerm('');}}
            >
              Clear Filters</Button>)}</div><Separator className="my-1" />{/* Layer list */}<ScrollArea className="h-[350px] px-4">{filteredLayers.length === 0 ? (<div className="p-4 text-center text-muted-foreground">No layers found matching your filters</div>) : (<div className="space-y-3 py-2">{filteredLayers.map((layer) => (<div 
                  key={layer.id} 
                  className="rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                ><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Switch 
                        checked={layer.visible === true}
                        onCheckedChange={() => toggleLayerVisibility(layer)}
                        aria-label={`Toggle ${layer.name} visibility`}
                      /><div><><h4 className="text-sm font-medium">{layer.name}</h4><div
</>
className="flex items-center space-x-1 mt-1"><><Badge variant="outline" className="text-xs capitalize">{layer.type}</Badge><Badge
</>variant="secondary" className="text-xs capitalize">
                            {layer.source}</Badge>{layer.metadata && (layer.metadata as LayerMetadata).category && (<Badge variant="outline" className="text-xs">{(layer.metadata as LayerMetadata).category}</Badge>)}</div></div></div><div className="flex items-center"><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Layer information"><Info className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80"><div className="space-y-2"><><h4 className="font-medium">{layer.name}</h4><p
</>className="text-sm text-muted-foreground">
                              {layer.metadata && typeof layer.metadata === 'object' && 'description' in layer.metadata
                                ? (layer.metadata as LayerMetadata).description
                                : 'No description available'
                              }</p>{layer.metadata && (layer.metadata as LayerMetadata).attribution && (<p className="text-xs text-muted-foreground mt-2">Attribution: {(layer.metadata as LayerMetadata).attribution}</p>)}</div></PopoverContent></Popover><div className="flex flex-col ml-1"><Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => moveLayerUp(layer, filteredLayers)}
                          disabled={filteredLayers.indexOf(layer) === 0}
                          aria-label="Move layer up"
                        ><><ArrowUp className="h-3 w-3" /></Button><Button
</>

                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => moveLayerDown(layer, filteredLayers)}
                          disabled={filteredLayers.indexOf(layer) === filteredLayers.length - 1}
                          aria-label="Move layer down"
                        ><ArrowDown className="h-3 w-3" /></Button></div></div></div>{/* Opacity control - only show for visible layers */}
                  {layer.visible === true && (<div className="mt-2"><div className="flex items-center space-x-2"><><Label htmlFor={`opacity-${layer.id}`} className="text-xs">Opacity: {layer.opacity}%</Label><div
</>
className="flex-1"><Slider
                            id={`opacity-${layer.id}`}
                            min={0}
                            max={100}
                            step={5}
                            defaultValue={[layer.opacity || 100]}
                            onValueChange={(values) => updateOpacity(layer, values[0])}
                            aria-label="Adjust layer opacity"
                          /></div></div></div>)}</div>))}</div>)}</ScrollArea></CardContent><CardFooter className="flex justify-between"><><Button 
          variant="outline" 
          size="sm"
          onClick={() =>{
            // Reset all filters
            setSearchTerm('');
            setFilterType(null);
            setFilterSource(null);
            setActiveTab('all');}}
        >
          Reset Filters</Button><Button
</>
variant="secondary" size="sm"><Settings className="mr-2 h-4 w-4" />Save Configuration</Button></CardFooter></Card>
  );
}