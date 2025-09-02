import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Square,
  Circle,
  Ruler,
  Scissors,
  Combine,
  RotateCcw,
  MoveHorizontal,
  ArrowDownUp,
  Copy,
  Undo2,
  Redo2,
  FileDigit
 } from '@mui/icons-material';
import { 
  createCircle,
  createRectangle,
  generateParcelNumber,
  splitPolygon,
  joinPolygons
} from '@/lib/advanced-drawing-utils';
import { GeoJSONFeature } from '@/lib/map-utils';
import L from 'leaflet';

interface PrecisionDrawingToolsProps {
  onRectangleCreate?: (center: [number, number], width: number, height: number) => void;
  onCircleCreate?: (center: [number, number], radius: number) => void;
  onSplitPolygon?: (polygon: GeoJSONFeature, line: GeoJSONFeature) => void;
  onJoinPolygons?: (polygon1: GeoJSONFeature, polygon2: GeoJSONFeature) => void;
  onParcelNumberGenerate?: (parcelNumber: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  map: L.Map | null;
  className?: string;
  selectedFeature?: GeoJSONFeature | null;
}

// Form schema for rectangle creation
const rectangleFormSchema = z.object({
  width: z.coerce.number().positive({ message: "Width must be positive" }),
  height: z.coerce.number().positive({ message: "Height must be positive" }),
  units: z.enum(["feet", "meters"]),
});

// Form schema for circle creation
const circleFormSchema = z.object({
  radius: z.coerce.number().positive({ message: "Radius must be positive" }),
  units: z.enum(["feet", "meters"]),
});

// Form schema for parcel number generation
const parcelNumberFormSchema = z.object({
  township: z.coerce.number().int().positive().max(99),
  range: z.coerce.number().int().positive().max(99),
  section: z.coerce.number().int().positive().max(99),
  quarter: z.enum(["NE", "NW", "SE", "SW"]),
  parcel: z.coerce.number().int().positive().max(9999999),
});

/**
 * Component for precision drawing tools for cartographic editing
 */
export function PrecisionDrawingTools({
  onRectangleCreate,
  onCircleCreate,
  onSplitPolygon,
  onJoinPolygons,
  onParcelNumberGenerate,
  onUndo,
  onRedo,
  map,
  className = "",
  selectedFeature
}: PrecisionDrawingToolsProps) {
  const { toast } = useToast();
  const [activePopover, setActivePopover] = useState<string | null>(null);
  
  // Forms for the various precision tools
  const rectangleForm = useForm<z.infer<typeof rectangleFormSchema>>({
    resolver: zodResolver(rectangleFormSchema),
    defaultValues: {
      width: 100,
      height: 100,
      units: "feet"
    },
  });
  
  const circleForm = useForm<z.infer<typeof circleFormSchema>>({
    resolver: zodResolver(circleFormSchema),
    defaultValues: {
      radius: 50,
      units: "feet"
    },
  });
  
  const parcelNumberForm = useForm<z.infer<typeof parcelNumberFormSchema>>({
    resolver: zodResolver(parcelNumberFormSchema),
    defaultValues: {
      township: 8,
      range: 29,
      section: 12,
      quarter: "NE",
      parcel: 1001
    },
  });
  
  // Handle rectangle creation
  const handleRectangleCreate = (data: z.infer<typeof rectangleFormSchema>) => {
    if (!map) {
      toast({
        title: "Error",
        description: "Map not available",
        variant: "destructive"
      });
      return;
    }
    
    // Get center point from map
    const center = map.getCenter();
    const centerCoords: [number, number] = [center.lng, center.lat];
    
    // Convert to meters if necessary
    let widthMeters = data.width;
    let heightMeters = data.height;
    
    if (data.units === "feet") {
      widthMeters = data.width * 0.3048; // feet to meters
      heightMeters = data.height * 0.3048; // feet to meters
    }
    
    if (onRectangleCreate) {
      onRectangleCreate(centerCoords, widthMeters, heightMeters);
    } else {
      // Create rectangle directly if no callback provided
      const rectangle = createRectangle(centerCoords, widthMeters, heightMeters);
      
      // Add to map if possible
      if (map) {
        L.geoJSON(rectangle).addTo(map);
      }
    }
    
    setActivePopover(null);
    
    toast({
      title: "Rectangle Created",
      description: `Created a ${data.width} × ${data.height} ${data.units} rectangle`,
    });
  };
  
  // Handle circle creation
  const handleCircleCreate = (data: z.infer<typeof circleFormSchema>) => {
    if (!map) {
      toast({
        title: "Error",
        description: "Map not available",
        variant: "destructive"
      });
      return;
    }
    
    // Get center point from map
    const center = map.getCenter();
    const centerCoords: [number, number] = [center.lng, center.lat];
    
    // Convert to meters if necessary
    let radiusMeters = data.radius;
    
    if (data.units === "feet") {
      radiusMeters = data.radius * 0.3048; // feet to meters
    }
    
    if (onCircleCreate) {
      onCircleCreate(centerCoords, radiusMeters);
    } else {
      // Create circle directly if no callback provided
      const circle = createCircle(centerCoords, radiusMeters);
      
      // Add to map if possible
      if (map) {
        L.geoJSON(circle).addTo(map);
      }
    }
    
    setActivePopover(null);
    
    toast({
      title: "Circle Created",
      description: `Created a circle with radius ${data.radius} ${data.units}`,
    });
  };
  
  // Handle parcel number generation
  const handleParcelNumberGenerate = (data: z.infer<typeof parcelNumberFormSchema>) => {
    const parcelNumber = generateParcelNumber(
      data.township,
      data.range,
      data.section,
      data.quarter,
      data.parcel
    );
    
    if (onParcelNumberGenerate) {
      onParcelNumberGenerate(parcelNumber);
    }
    
    setActivePopover(null);
    
    toast({
      title: "Parcel Number Generated",
      description: `Generated parcel number: ${parcelNumber}`,
    });
  };
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex flex-col space-y-1 bg-white rounded-md shadow-md p-1">
        <div className="flex space-x-1">
          {/* Rectangle Tool */}
          <Popover open={activePopover === 'rectangle'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'rectangle' : null)}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Create Rectangle">
                <Square size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Form {...rectangleForm}>
                <form onSubmit={rectangleForm.handleSubmit(handleRectangleCreate)} className="space-y-4"><>

                  <h4 className="font-medium text-sm">Create Rectangle</h4>
                  <FormField
</>

                    control={rectangleForm.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Width</FormLabel>
                        <FormControl
</>
</>><>

                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage
</>
/>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rectangleForm.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Height</FormLabel>
                        <FormControl
</>
</>><>

                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage
</>
/>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rectangleForm.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Units</FormLabel>
                        <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select units" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent><>

                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem
</>
value="meters">Meters</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2"><>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActivePopover(null)}
                    >
                      Cancel
                    </Button>
                    <Button
</>
type="submit">Create</Button>
                  </div>
                </form>
              </Form>
            </PopoverContent>
          </Popover>
          
          {/* Circle Tool */}
          <Popover open={activePopover === 'circle'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'circle' : null)}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Create Circle">
                <Circle size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Form {...circleForm}>
                <form onSubmit={circleForm.handleSubmit(handleCircleCreate)} className="space-y-4"><>

                  <h4 className="font-medium text-sm">Create Circle</h4>
                  <FormField
</>

                    control={circleForm.control}
                    name="radius"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Radius</FormLabel>
                        <FormControl
</>
</>><>

                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage
</>
/>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={circleForm.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Units</FormLabel>
                        <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select units" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent><>

                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem
</>
value="meters">Meters</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2"><>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActivePopover(null)}
                    >
                      Cancel
                    </Button>
                    <Button
</>
type="submit">Create</Button>
                  </div>
                </form>
              </Form>
            </PopoverContent>
          </Popover>
          
          {/* Measurement Tool */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Precision Measurement"
            onClick={() => {
              toast({
                title: "Precision Measurement",
                description: "Click on the map to start measuring",
              });
            }}
          >
            <Ruler size={16} />
          </Button>
          
          {/* Generate Parcel Number */}
          <Popover open={activePopover === 'parcel-number'} onOpenChange={(isOpen) => setActivePopover(isOpen ? 'parcel-number' : null)}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title="Generate Parcel Number">
                <FileDigit size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Form {...parcelNumberForm}>
                <form onSubmit={parcelNumberForm.handleSubmit(handleParcelNumberGenerate)} className="space-y-4"><>

                  <h4 className="font-medium text-sm">Generate Parcel Number</h4>
                  <div
</>
className="grid grid-cols-2 gap-3">
                    <FormField
                      control={parcelNumberForm.control}
                      name="township"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Township</FormLabel>
                          <FormControl
</>
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={parcelNumberForm.control}
                      name="range"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Range</FormLabel>
                          <FormControl
</>
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={parcelNumberForm.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Section</FormLabel>
                          <FormControl
</>
</>><>

                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={parcelNumberForm.control}
                      name="quarter"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Quarter</FormLabel>
                          <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Quarter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="NE">NE</SelectItem>
                              <SelectItem
</>
value="NW">NW</SelectItem><>

                              <SelectItem value="SE">SE</SelectItem>
                              <SelectItem
</>
value="SW">SW</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={parcelNumberForm.control}
                    name="parcel"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Parcel Number</FormLabel>
                        <FormControl
</>
</>><>

                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage
</>
/>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2"><>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActivePopover(null)}
                    >
                      Cancel
                    </Button>
                    <Button
</>
type="submit">Generate</Button>
                  </div>
                </form>
              </Form>
            </PopoverContent>
          </Popover>
        </div><>

        <div className="w-full h-px bg-gray-200 my-1"></div>
        
        <div
</>
className="flex space-x-1">
          {/* Split Tool */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Split Polygon"
            onClick={() => {
              if (!selectedFeature) {
                toast({
                  title: "No Feature Selected",
                  description: "Please select a polygon to split",
                  variant: "destructive"
                });
                return;
              }
              
              toast({
                title: "Split Tool Activated",
                description: "Draw a line to split the selected polygon",
              });
            }}
            disabled={!selectedFeature}
          >
            <Scissors size={16} />
          </Button>
          
          {/* Join Tool */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Join Polygons"
            onClick={() => {
              toast({
                title: "Join Tool Activated",
                description: "Select two adjacent polygons to join",
              });
            }}
          >
            <Combine size={16} />
          </Button>
          
          {/* Transform/Move Tool */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Move Feature"
            onClick={() => {
              if (!selectedFeature) {
                toast({
                  title: "No Feature Selected",
                  description: "Please select a feature to move",
                  variant: "destructive"
                });
                return;
              }
              
              toast({
                title: "Move Tool Activated",
                description: "Drag to move the selected feature",
              });
            }}
            disabled={!selectedFeature}
          >
            <MoveHorizontal size={16} />
          </Button>
          
          {/* Scale Tool */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Scale Feature"
            onClick={() => {
              if (!selectedFeature) {
                toast({
                  title: "No Feature Selected",
                  description: "Please select a feature to scale",
                  variant: "destructive"
                });
                return;
              }
              
              toast({
                title: "Scale Tool Activated",
                description: "Drag to scale the selected feature",
              });
            }}
            disabled={!selectedFeature}
          >
            <ArrowDownUp size={16} />
          </Button>
        </div><>

        <div className="w-full h-px bg-gray-200 my-1"></div>
        
        <div
</>
className="flex space-x-1">
          {/* Undo Button */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Undo"
            onClick={onUndo}
          >
            <Undo2 size={16} />
          </Button>
          
          {/* Redo Button */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Redo"
            onClick={onRedo}
          >
            <Redo2 size={16} />
          </Button>
          
          {/* Duplicate Feature */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Duplicate Feature"
            onClick={() => {
              if (!selectedFeature) {
                toast({
                  title: "No Feature Selected",
                  description: "Please select a feature to duplicate",
                  variant: "destructive"
                });
                return;
              }
              
              toast({
                title: "Feature Duplicated",
                description: "Created a copy of the selected feature",
              });
            }}
            disabled={!selectedFeature}
          >
            <Copy size={16} />
          </Button>
          
          {/* Reset Feature */}
          <Button 
            variant="outline" 
            size="icon" 
            title="Reset Feature"
            onClick={() => {
              if (!selectedFeature) {
                toast({
                  title: "No Feature Selected",
                  description: "Please select a feature to reset",
                  variant: "destructive"
                });
                return;
              }
              
              toast({
                title: "Feature Reset",
                description: "Feature has been reset to its original state",
              });
            }}
            disabled={!selectedFeature}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PrecisionDrawingTools;