import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { ArrowLeft,
  Check,
  Copy,
  Edit,
  FileText,
  Grid,
  Image as ImageIcon,
  Info,
  Layers,
  Maximize,
  Minimize,
  Pencil,
  PencilRuler,
  Plus,
  Redo,
  RotateCcw,
  Save,
  Square,
  Trash,
  Triangle,
  Undo,
  X,
  XCircle,
 } from '@mui/icons-material';
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { toast } from "../hooks/use-toast";

// Define sketch schema
const sketchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sketchType: z.string().min(1, "Sketch type is required"),
  squareFootage: z.coerce.number().min(0, "Square footage must be at least 0"),
  scale: z.string().optional(),
  notes: z.string().optional(),
});

// Define type for sketch data
interface Sketch {
  id: number;
  reportId: number;
  title: string;
  description: string | null;
  sketchUrl: string | null;
  sketchData: string | null;
  sketchType: string;
  squareFootage: number | null;
  scale: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Define type for measurement
interface Measurement {
  id: string;
  type: "length" | "area";
  value: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  unit: "ft" | "m";
}

// Define shape types for the sketch editor
type ShapeType =
  | "rect"
  | "wall"
  | "door"
  | "window"
  | "stairs"
  | "counter"
  | "sink"
  | "bath"
  | "toilet"
  | "text";

// Define shape object for the sketch editor
interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  color?: string;
}

export default function EnhancedSketchesPage() {
  const params = useParams<{ reportId?: string }>();
  const paramReportId = params.reportId;
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const reportId = Number(paramReportId) || 1;

  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewSketchDialogOpen, setIsNewSketchDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeSketchType, setActiveSketchType] = useState<string>("all");

  // Sketch editor state
  const [editorScale, setEditorScale] = useState(1);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [activeDrawTool, setActiveDrawTool] = useState<ShapeType | null>(null);
  const [editorHistory, setEditorHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sketches for the report
  const {
    data: sketches = [],
    isLoading,
    isError,
  } = useQuery<Sketch[]>({
    queryKey: ["/api/reports", reportId, "sketches"],
    queryFn: () => apiRequest(`/api/reports/${reportId}/sketches`),
  });

  // Sketch types for filtering
  const allSketchTypes = [
    "all",
    ...Array.from(new Set(sketches.map((sketch) => sketch.sketchType))),
  ];

  // Filtered sketches based on active type
  const filteredSketches =
    activeSketchType === "all"
      ? sketches
      : sketches.filter((sketch) => sketch.sketchType === activeSketchType);

  // Create sketch mutation
  const createSketchMutation = useMutation({
    mutationFn: (data: z.infer<typeof sketchSchema>) =>
      apiRequest(`/api/sketches`, {
        method: "POST",
        data: {
          ...data,
          reportId,
          sketchData: JSON.stringify([]),
        },
      }),
    onSuccess: (newSketch) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "sketches"] });
      setIsNewSketchDialogOpen(false);
      setSelectedSketch(newSketch);
      setIsEditorOpen(true);
      setShapes([]);
      addToHistory([]);
    },
  });

  // Update sketch mutation
  const updateSketchMutation = useMutation({
    mutationFn: ({ sketchId, data }: { sketchId: number; data: any }) =>
      apiRequest(`/api/sketches/${sketchId}`, {
        method: "PUT",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "sketches"] });
      toast({
        title: "Sketch Saved",
        description: "Your sketch changes have been saved successfully.",
      });
    },
  });

  // Delete sketch mutation
  const deleteSketchMutation = useMutation({
    mutationFn: (sketchId: number) =>
      apiRequest(`/api/sketches/${sketchId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "sketches"] });
      setSelectedSketch(null);
      setIsEditorOpen(false);
    },
  });

  // New sketch form
  const newSketchForm = useForm<z.infer<typeof sketchSchema>>({
    resolver: zodResolver(sketchSchema),
    defaultValues: {
      title: "",
      description: "",
      sketchType: "floor_plan",
      squareFootage: 0,
      scale: "1/4\" = 1'",
      notes: "",
    },
  });

  // Handle new sketch submission
  const onNewSketchSubmit = (data: z.infer<typeof sketchSchema>) => {
    createSketchMutation.mutate(data);
  };

  // Save current sketch
  const saveSketch = () => {
    if (!selectedSketch) return;

    const sketchData = JSON.stringify(shapes);

    updateSketchMutation.mutate({
      sketchId: selectedSketch.id,
      data: {
        sketchData,
        // Convert to base64 data URL if needed in the future
        // sketchUrl: canvasToImage(),
      },
    });
  };

  // Add to editor history
  const addToHistory = (newShapes: Shape[]) => {
    // Remove any future history if we've gone back in time
    const newHistory = editorHistory.slice(0, historyIndex + 1);
    newHistory.push([...newShapes]);
    setEditorHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes([...editorHistory[historyIndex - 1]]);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < editorHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes([...editorHistory[historyIndex + 1]]);
    }
  };

  // Add a new shape to the canvas
  const addShape = (type: ShapeType) => {
    const newShape: Shape = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 100,
      y: 100,
      width: type === "wall" ? 100 : 50,
      height: type === "wall" ? 10 : 50,
      rotation: 0,
      color: "#333333",
    };

    const newShapes = [...shapes, newShape];
    setShapes(newShapes);
    addToHistory(newShapes);
    setSelectedShape(newShape.id);
  };

  // Delete selected shape
  const deleteSelectedShape = () => {
    if (!selectedShape) return;

    const newShapes = shapes.filter((shape) => shape.id !== selectedShape);
    setShapes(newShapes);
    addToHistory(newShapes);
    setSelectedShape(null);
  };

  // Handle mouse down on shape (for selection or dragging)
  const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    setSelectedShape(shapeId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse down on canvas (for new shape creation)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!activeDrawTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const snapX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const snapY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    const newShape: Shape = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activeDrawTool,
      x: snapX,
      y: snapY,
      width: activeDrawTool === "wall" ? 100 : 50,
      height: activeDrawTool === "wall" ? 10 : 50,
      rotation: 0,
      color: "#333333",
    };

    const newShapes = [...shapes, newShape];
    setShapes(newShapes);
    addToHistory(newShapes);
    setSelectedShape(newShape.id);
    setActiveDrawTool(null);
  };

  // Update shape properties
  const updateShapeProperty = (property: keyof Shape, value: any) => {
    if (!selectedShape) return;

    const newShapes = shapes.map((shape) => {
      if (shape.id === selectedShape) {
        return { ...shape, [property]: value };
      }
      return shape;
    });

    setShapes(newShapes);
    // Don't add to history for every property change, only on mouse up
  };

  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load sketch data when selecting a sketch
  useEffect(() => {
    if (selectedSketch?.sketchData) {
      try {
        const parsedData = JSON.parse(selectedSketch.sketchData);
        setShapes(parsedData);
        addToHistory(parsedData);
      } catch (e) {
        console.error("Error parsing sketch data:", e);
        setShapes([]);
        addToHistory([]);
      }
    } else {
      setShapes([]);
      addToHistory([]);
    }
  }, [selectedSketch]);

  // Get the currently selected shape object
  const selectedShapeObject = selectedShape
    ? shapes.find((shape) => shape.id === selectedShape)
    : null;

  // Get sketch thumbnail or placeholder
  const getSketchThumbnail = (sketch: Sketch) => {
    if (sketch.sketchUrl) return sketch.sketchUrl;

    // Return placeholder based on sketch type
    switch (sketch.sketchType) {
      case "floor_plan":
        return "https://placehold.co/600x400/e6f7ff/0369a1?text=Floor+Plan";
      case "site_plan":
        return "https://placehold.co/600x400/f0fdf4/166534?text=Site+Plan";
      case "elevation":
        return "https://placehold.co/600x400/fef3c7/92400e?text=Elevation";
      default:
        return "https://placehold.co/600x400/f5f5f5/6b7280?text=Property+Sketch";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold">Property Sketches</h1>
          <p
</> className="text-muted-foreground mt-1">
            Create and manage sketches for appraisal report #{reportId}
          </p>
        </div>
        <Button onClick={() => setIsNewSketchDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Sketch
        </Button>
      </div>

      {isEditorOpen ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditorOpen(false);
                  setSelectedSketch(null);
                }}
              ><>

                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sketches
              </Button>
              <h2
</> className="text-xl font-semibold ml-2">{selectedSketch?.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}><>

                <Undo className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= editorHistory.length - 1}
              ><>

                <Redo className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={() => setEditorScale(Math.max(0.5, editorScale - 0.1))}
              ><>

                <Minimize className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={() => setEditorScale(Math.min(2, editorScale + 0.1))}
              ><>

                <Maximize className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="default"
                size="sm"
                onClick={saveSketch}
                disabled={updateSketchMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent className="px-2 py-0">
                  <div className="grid grid-cols-3 gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "rect" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("rect")}
                          >
                            <Square className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Room</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "wall" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("wall")}
                          >
                            <div className="h-1 w-6 bg-current" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wall</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "door" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("door")}
                          >
                            <div className="relative w-6 h-6"><>

                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current"></div>
                              <div
</>
                                className="absolute top-1/2 left-0 w-3 h-0.5 bg-current"
                                style={{ transform: "rotate(-45deg) translateY(-4px)" }}
                              ></div>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Door</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "window" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("window")}
                          >
                            <div className="relative w-6 h-6"><>

                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current"></div>
                              <div
</> className="absolute top-1/2 left-0 w-full h-3 border-t border-b border-current"></div>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Window</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "stairs" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("stairs")}
                          >
                            <div className="relative w-6 h-6"><>

                              <div className="absolute top-0 left-0 w-full h-0.5 bg-current"></div>
                              <div
</> className="absolute top-2 left-0 w-full h-0.5 bg-current"></div><>

                              <div className="absolute top-4 left-0 w-full h-0.5 bg-current"></div>
                              <div
</> className="absolute top-6 left-0 w-full h-0.5 bg-current"></div>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Stairs</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeDrawTool === "text" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setActiveDrawTool("text")}
                          >
                            <FileText className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Text Label</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedShapeObject ? (
                    <div className="space-y-3">
                      <div><>

                        <label className="text-xs font-medium block mb-1">Position</label>
                        <div
</> className="grid grid-cols-2 gap-2">
                          <div><>

                            <label className="text-xs text-muted-foreground">X</label>
                            <Input
</>
                              type="number"
                              value={selectedShapeObject.x}
                              onChange={(e) => updateShapeProperty("x", Number(e.target.value))}
                              className="h-7"
                            />
                          </div>
                          <div><>

                            <label className="text-xs text-muted-foreground">Y</label>
                            <Input
</>
                              type="number"
                              value={selectedShapeObject.y}
                              onChange={(e) => updateShapeProperty("y", Number(e.target.value))}
                              className="h-7"
                            />
                          </div>
                        </div>
                      </div>

                      <div><>

                        <label className="text-xs font-medium block mb-1">Size</label>
                        <div
</> className="grid grid-cols-2 gap-2">
                          <div><>

                            <label className="text-xs text-muted-foreground">Width</label>
                            <Input
</>
                              type="number"
                              value={selectedShapeObject.width}
                              onChange={(e) => updateShapeProperty("width", Number(e.target.value))}
                              className="h-7"
                            />
                          </div>
                          <div><>

                            <label className="text-xs text-muted-foreground">Height</label>
                            <Input
</>
                              type="number"
                              value={selectedShapeObject.height}
                              onChange={(e) =>
                                updateShapeProperty("height", Number(e.target.value))
                              }
                              className="h-7"
                            />
                          </div>
                        </div>
                      </div>

                      <div><>

                        <label className="text-xs font-medium block mb-1">Rotation</label>
                        <Input
</>
                          type="number"
                          value={selectedShapeObject.rotation}
                          onChange={(e) => updateShapeProperty("rotation", Number(e.target.value))}
                          className="h-7"
                        />
                      </div>

                      {selectedShapeObject.type === "text" && (
                        <div><>

                          <label className="text-xs font-medium block mb-1">Label</label>
                          <Input
</>
                            value={selectedShapeObject.label || ""}
                            onChange={(e) => updateShapeProperty("label", e.target.value)}
                            className="h-7"
                          />
                        </div>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={deleteSelectedShape}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Select an object to edit its properties
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Canvas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><>

                    <label className="text-sm">Show Grid</label>
                    <Switch
</> checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>

                  <div className="flex items-center justify-between"><>

                    <label className="text-sm">Snap to Grid</label>
                    <Switch
</> checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><>

                      <label className="text-sm">Grid Size</label>
                      <span
</> className="text-xs">{gridSize}px</span>
                    </div><>

                    <Slider
                      min={10}
                      max={50}
                      step={5}
                      value={[gridSize]}
                      onValueChange={(value) => setGridSize(value[0])}
                    />
                  </div>

                  <div
</> className="space-y-2">
                    <div className="flex items-center justify-between"><>

                      <label className="text-sm">Zoom</label>
                      <span
</> className="text-xs">{Math.round(editorScale * 100)}%</span>
                    </div>
                    <Slider
                      min={50}
                      max={200}
                      step={10}
                      value={[editorScale * 100]}
                      onValueChange={(value) => setEditorScale(value[0] / 100)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Sketch Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><>

                    <span className="text-xs text-muted-foreground block">Type</span>
                    <span
</> className="text-sm">{selectedSketch?.sketchType.replace("_", " ")}</span>
                  </div>

                  {selectedSketch?.squareFootage && (
                    <div><>

                      <span className="text-xs text-muted-foreground block">Sq Footage</span>
                      <span
</> className="text-sm">{selectedSketch.squareFootage} sq ft</span>
                    </div>
                  )}

                  {selectedSketch?.scale && (
                    <div><>

                      <span className="text-xs text-muted-foreground block">Scale</span>
                      <span
</> className="text-sm">{selectedSketch.scale}</span>
                    </div>
                  )}

                  <div><>

                    <span className="text-xs text-muted-foreground block">Created</span>
                    <span
</> className="text-sm">
                      {selectedSketch?.createdAt ? formatDate(selectedSketch.createdAt) : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card className="h-full">
                <CardContent className="p-0">
                  <div
                    className="relative border-t overflow-auto h-[calc(100vh-12rem)]"
                    style={{
                      background: showGrid
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}' viewBox='0 0 ${gridSize} ${gridSize}'%3E%3Cpath d='M ${gridSize} 0 L 0 0 0 ${gridSize}' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='1'/%3E%3C/svg%3E")`
                        : "white",
                    }}
                    onClick={handleCanvasMouseDown}
                    ref={canvasRef}
                  >
                    <div
                      className="absolute top-0 left-0 transform-gpu"
                      style={{
                        transform: `scale(${editorScale})`,
                        transformOrigin: "0 0",
                      }}
                    >
                      {shapes.map((shape) => {
                        const isSelected = selectedShape === shape.id;

                        // Common styles
                        const shapeStyle: React.CSSProperties = {
                          position: "absolute",
                          left: `${shape.x}px`,
                          top: `${shape.y}px`,
                          width: `${shape.width}px`,
                          height: `${shape.height}px`,
                          transform: `rotate(${shape.rotation}deg)`,
                          border: isSelected ? "2px solid #3b82f6" : "1px solid #333",
                          backgroundColor:
                            shape.type === "rect" ? "rgba(241, 245, 249, 0.7)" : "transparent",
                          cursor: "pointer",
                        };

                        // Add selection handles if selected
                        const selectionHandles = isSelected ? (
                          <>
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
                          </>
                        ) : null;

                        // Special rendering for different shape types
                        switch (shape.type) {
                          case "wall":
                            return (
                              <div
                                key={shape.id}
                                style={shapeStyle}
                                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                              >
                                {selectionHandles}
                              </div>
                            );

                          case "door":
                            return (
                              <div
                                key={shape.id}
                                style={shapeStyle}
                                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                              >
                                <div className="absolute top-0 left-0 w-full h-full flex items-center">
                                  <div className="w-full h-0.5 bg-black"></div>
                                </div>
                                <div
                                  className="absolute top-0 left-0 w-1/2 h-1/2 border-t border-r border-black"
                                  style={{
                                    transformOrigin: "left bottom",
                                    transform: "rotate(-90deg)",
                                  }}
                                ></div>
                                {selectionHandles}
                              </div>
                            );

                          case "window":
                            return (
                              <div
                                key={shape.id}
                                style={shapeStyle}
                                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                              ><>

                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black transform -translate-y-1/2"></div>
                                <div
</> className="absolute top-1/2 left-0 w-full h-4 border-t border-b border-black transform -translate-y-1/2"></div>
                                {selectionHandles}
                              </div>
                            );

                          case "text":
                            return (
                              <div
                                key={shape.id}
                                style={{
                                  ...shapeStyle,
                                  border: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  background: isSelected
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : "transparent",
                                }}
                                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                              >
                                {shape.label || "Text Label"}
                                {selectionHandles}
                              </div>
                            );

                          default:
                            return (
                              <div
                                key={shape.id}
                                style={shapeStyle}
                                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                              >
                                {selectionHandles}
                              </div>
                            );
                        }
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            {allSketchTypes.map((type) => (
              <Badge
                key={type}
                variant={activeSketchType === type ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveSketchType(type)}
              >
                {type === "all" ? "All Sketches" : type.replace("_", " ")}
                {activeSketchType !== "all" && activeSketchType === type && (
                  <Check className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse"><>

                  <div className="aspect-video bg-muted"></div>
                  <CardContent
</> className="p-4"><>

                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div
</> className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="p-8 text-center">
              <p className="text-red-500">Error loading sketches. Please try again.</p>
            </Card>
          ) : filteredSketches.length === 0 ? (
            <Card className="border-dashed border-2 p-8 text-center">
              <PencilRuler className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

              <h3 className="text-lg font-medium mb-2">No Sketches Found</h3>
              <p
</> className="text-sm text-muted-foreground mb-4">
                {activeSketchType === "all"
                  ? "No sketches have been added to this report yet."
                  : `No sketches in the '${activeSketchType}' category.`}
              </p>
              <Button
                variant="outline"
                onClick={() => setIsNewSketchDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Create New Sketch
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSketches.map((sketch) => (
                <Card
                  key={sketch.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedSketch(sketch);
                    setIsEditorOpen(true);
                  }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={getSketchThumbnail(sketch)}
                      alt={sketch.title}
                      className="object-contain w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="sm">
                        <Pencil className="h-4 w-4 mr-1" /> Edit Sketch
                      </Button>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/50 hover:bg-black/50">
                      {sketch.sketchType.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{sketch.title}</h3>
                    {sketch.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {sketch.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                    <span>{sketch.createdAt ? formatDate(sketch.createdAt) : "Unknown"}</span>
                    {sketch.squareFootage && <span>{sketch.squareFootage} sq ft</span>}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Sketch Dialog */}
      <Dialog open={isNewSketchDialogOpen} onOpenChange={setIsNewSketchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><>

            <DialogTitle>Create New Sketch</DialogTitle>
            <DialogDescription
</>>Add a new sketch to your appraisal report</DialogDescription>
          </DialogHeader>

          <Form {...newSketchForm}>
            <form onSubmit={newSketchForm.handleSubmit(onNewSketchSubmit)} className="space-y-4">
              <FormField
                control={newSketchForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Title</FormLabel>
                    <FormControl
</>><>

                      <Input placeholder="First floor plan" {...field} />
                    </FormControl>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />

              <FormField
                control={newSketchForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Description</FormLabel>
                    <FormControl
</>><>

                      <Textarea
                        placeholder="Enter a description of the sketch"
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newSketchForm.control}
                  name="sketchType"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Sketch Type</FormLabel>
                      <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent><>

                          <SelectItem value="floor_plan">Floor Plan</SelectItem>
                          <SelectItem
</> value="site_plan">Site Plan</SelectItem><>

                          <SelectItem value="elevation">Elevation</SelectItem>
                          <SelectItem
</> value="detail">Detail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newSketchForm.control}
                  name="squareFootage"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Square Footage</FormLabel>
                      <FormControl
</>><>

                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newSketchForm.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Scale</FormLabel>
                      <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent><>

                          <SelectItem value="1/4 inch = 1 foot">1/4" = 1&apos;</SelectItem>
                          <SelectItem
</> value="1/8 inch = 1 foot">1/8" = 1&apos;</SelectItem>
                          <SelectItem value="1/16 inch = 1 foot">1/16" = 1&apos;</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newSketchForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Notes</FormLabel>
                    <FormControl
</>><>

                      <Textarea {...field} className="resize-none" />
                    </FormControl>
                    <FormMessage
</> />
                  </FormItem>
                )}
              />

              <DialogFooter><>

                <Button variant="outline" onClick={() => setIsNewSketchDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</> type="submit" disabled={createSketchMutation.isPending}>
                  {createSketchMutation.isPending ? "Creating..." : "Create & Edit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
