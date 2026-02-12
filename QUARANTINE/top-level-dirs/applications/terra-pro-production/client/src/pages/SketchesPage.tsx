import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PenLine,
  Upload,
  Trash2,
  Edit,
  Plus,
  Download,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  Square,
  Circle,
  Pencil,
  MousePointer,
  MoveHorizontal,
  X,
  Save,
  Undo2,
  Redo2,
  Image as ImageIcon,
  LayoutGrid,
 } from '@mui/icons-material';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the sketch schema
const sketchSchema = z.object({
  reportId: z.number(),
  type: z.string().min(1, "Sketch type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dimensions: z.string().optional(),
  area: z.coerce.number().optional(),
  imageData: z.string().min(1, "Sketch data is required"),
});

type SketchFormValues = z.infer<typeof sketchSchema>;

interface Sketch {
  id: number;
  reportId: number;
  type: string;
  title: string;
  description: string;
  dimensions: string;
  area: number;
  imageData: string;
  dateCreated: string;
}

// Drawing tool types
type Tool = "select" | "move" | "pen" | "line" | "rectangle" | "circle" | "text" | "measure";
type DrawingPoint = { x: number; y: number };
type DrawingShape = {
  type: "path" | "line" | "rectangle" | "circle" | "text" | "measure";
  points: DrawingPoint[];
  color: string;
  width: number;
  text?: string;
  value?: string;
};

export default function SketchesPage() {
  const [location, navigate] = useLocation();
  const [isSketchDialogOpen, setIsSketchDialogOpen] = useState<boolean>(false);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [selectedSketchId, setSelectedSketchId] = useState<number | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [previewImageData, setPreviewImageData] = useState<string | null>(null);
  const [viewingSketch, setViewingSketch] = useState<Sketch | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [offlineSketches, setOfflineSketches] = useState<Sketch[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Drawing state
  const [currentTool, setCurrentTool] = useState<Tool>("pen");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [history, setHistory] = useState<DrawingShape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lineColor, setLineColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(10); // pixels per foot
  const [lastPoint, setLastPoint] = useState<DrawingPoint | null>(null);
  const [selectedShape, setSelectedShape] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for mobile device and offline capability
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    };

    setIsMobile(checkMobile());

    // Check for network connectivity
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOfflineMode(!navigator.onLine);

    // Initialize from local storage if in offline mode
    if (!navigator.onLine) {
      const cachedSketches = localStorage.getItem("offlineSketches");
      if (cachedSketches) {
        setOfflineSketches(JSON.parse(cachedSketches));
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get report ID from URL if present
  const reportIdFromUrl = new URLSearchParams(location.split("?")[1]).get("reportId");

  useEffect(() => {
    if (reportIdFromUrl) {
      setSelectedReportId(Number(reportIdFromUrl));
    }
  }, [reportIdFromUrl]);

  // Initialize the form
  const sketchForm = useForm<SketchFormValues>({
    resolver: zodResolver(sketchSchema),
    defaultValues: {
      reportId: selectedReportId || 0,
      type: "floor",
      title: "",
      description: "",
      dimensions: "",
      area: undefined,
      imageData: "",
    },
  });

  // Fetch reports for selection
  const reportsQuery = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      if (offlineMode) return [];
      return apiRequest(`/api/reports`, {
        method: "GET",
      });
    },
    enabled: !offlineMode,
  });

  // Fetch sketches for selected report
  const sketchesQuery = useQuery({
    queryKey: ["/api/reports", selectedReportId, "sketches"],
    queryFn: async () => {
      if (offlineMode)
        return offlineSketches.filter((s: Sketch) => s.reportId === selectedReportId);
      return apiRequest(`/api/reports/${selectedReportId}/sketches`, {
        method: "GET",
      });
    },
    enabled: !!selectedReportId && !offlineMode,
  });

  // Fetch single sketch for editing
  const sketchQuery = useQuery({
    queryKey: ["/api/sketches", selectedSketchId],
    queryFn: async () => {
      if (offlineMode) {
        return offlineSketches.find((s: Sketch) => s.id === selectedSketchId) || null;
      }
      return apiRequest(`/api/sketches/${selectedSketchId}`, {
        method: "GET",
      });
    },
    enabled: !!selectedSketchId && isSketchDialogOpen,
  });

  // Update form when sketch data is loaded
  useEffect(() => {
    if (sketchQuery.data) {
      sketchForm.reset({
        reportId: sketchQuery.data.reportId,
        type: sketchQuery.data.type,
        title: sketchQuery.data.title,
        description: sketchQuery.data.description || "",
        dimensions: sketchQuery.data.dimensions || "",
        area: sketchQuery.data.area,
        imageData: sketchQuery.data.imageData,
      });
      setPreviewImageData(sketchQuery.data.imageData);
    }
  }, [sketchQuery.data]);

  // Create/update sketch mutation
  const sketchMutation = useMutation({
    mutationFn: async (data: SketchFormValues) => {
      if (offlineMode) {
        // Handle offline mode - store locally
        const newSketch: Sketch = {
          id: selectedSketchId || Date.now(),
          reportId: data.reportId,
          type: data.type,
          title: data.title,
          description: data.description || "",
          dimensions: data.dimensions || "",
          area: data.area || 0,
          imageData: data.imageData,
          dateCreated: new Date().toISOString(),
        };

        if (selectedSketchId) {
          // Update existing
          const updatedSketches = offlineSketches.map((s: Sketch) =>
            s.id === selectedSketchId ? newSketch : s
          );
          setOfflineSketches(updatedSketches);
          localStorage.setItem("offlineSketches", JSON.stringify(updatedSketches));
          return newSketch;
        } else {
          // Create new
          const updatedSketches = [...offlineSketches, newSketch];
          setOfflineSketches(updatedSketches);
          localStorage.setItem("offlineSketches", JSON.stringify(updatedSketches));
          return newSketch;
        }
      }

      if (selectedSketchId) {
        return apiRequest(`/api/sketches/${selectedSketchId}`, {
          method: "PUT",
          data,
        });
      } else {
        return apiRequest("/api/sketches", {
          method: "POST",
          data,
        });
      }
    },
    onSuccess: () => {
      if (!offlineMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", selectedReportId, "sketches"] });
      }

      setIsSketchDialogOpen(false);
      setIsDrawingMode(false);
      setPreviewImageData(null);
      resetDrawingState();

      toast({
        title: selectedSketchId ? "Sketch updated" : "Sketch added",
        description: "Sketch has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save sketch. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete sketch mutation
  const deleteSketchMutation = useMutation({
    mutationFn: async (id: number) => {
      if (offlineMode) {
        const updatedSketches = offlineSketches.filter((s: Sketch) => s.id !== id);
        setOfflineSketches(updatedSketches);
        localStorage.setItem("offlineSketches", JSON.stringify(updatedSketches));
        return true;
      }

      return apiRequest(`/api/sketches/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      if (!offlineMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", selectedReportId, "sketches"] });
      }

      toast({
        title: "Sketch deleted",
        description: "Sketch has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete sketch. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSketchSubmit = (data: SketchFormValues) => {
    sketchMutation.mutate(data);
  };

  // Reset drawing state
  const resetDrawingState = () => {
    setShapes([]);
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentTool("pen");
    setLineColor("#000000");
    setLineWidth(2);
    setShowGrid(true);
    setCurrentShape(null);
    setLastPoint(null);
    setSelectedShape(null);
  };

  // Handler for adding a new sketch
  const handleAddSketch = () => {
    setSelectedSketchId(null);
    sketchForm.reset({
      reportId: selectedReportId || 0,
      type: "floor",
      title: "",
      description: "",
      dimensions: "",
      area: undefined,
      imageData: "",
    });
    resetDrawingState();
    setPreviewImageData(null);
    setIsSketchDialogOpen(true);
  };

  // Handler for starting drawing mode
  const handleStartDrawing = () => {
    resetDrawingState();
    setIsDrawingMode(true);
  };

  // Handler for editing an existing sketch
  const handleEditSketch = (sketch: Sketch) => {
    setSelectedSketchId(sketch.id);
    setIsSketchDialogOpen(true);
  };

  // Handler for viewing a sketch in full screen
  const handleViewSketch = (sketch: Sketch) => {
    setViewingSketch(sketch);
    setIsViewDialogOpen(true);
  };

  // Handler for deleting a sketch
  const handleDeleteSketch = (id: number) => {
    if (window.confirm("Are you sure you want to delete this sketch?")) {
      deleteSketchMutation.mutate(id);
    }
  };

  // Handler for file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPreviewImageData(imageData);
        sketchForm.setValue("imageData", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drawing functions
  useEffect(() => {
    if (isDrawingMode) {
      drawCanvas();
    }
  }, [isDrawingMode, shapes, showGrid, currentShape, selectedShape]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;

      // Draw grid lines
      const gridSize = scale;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw all shapes
    shapes.forEach((shape /* , index */) => {
      drawShape(ctx, shape, index === selectedShape);
    });

    // Draw current shape
    if (currentShape) {
      drawShape(ctx, currentShape, false);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: DrawingShape, isSelected: boolean) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Highlight selected shape
    if (isSelected) {
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    if (shape.type === "path" && shape.points.length > 0) {
      // Draw free-hand path
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);

      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }

      ctx.stroke();
    } else if (shape.type === "line" && shape.points.length === 2) {
      // Draw straight line
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      ctx.lineTo(shape.points[1].x, shape.points[1].y);
      ctx.stroke();
    } else if (shape.type === "rectangle" && shape.points.length === 2) {
      // Draw rectangle
      const startX = Math.min(shape.points[0].x, shape.points[1].x);
      const startY = Math.min(shape.points[0].y, shape.points[1].y);
      const width = Math.abs(shape.points[1].x - shape.points[0].x);
      const height = Math.abs(shape.points[1].y - shape.points[0].y);

      ctx.strokeRect(startX, startY, width, height);
    } else if (shape.type === "circle" && shape.points.length === 2) {
      // Draw circle
      const centerX = shape.points[0].x;
      const centerY = shape.points[0].y;
      const radius = Math.sqrt(
        Math.pow(shape.points[1].x - centerX, 2) + Math.pow(shape.points[1].y - centerY, 2)
      );

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shape.type === "text" && shape.points.length === 1 && shape.text) {
      // Draw text
      ctx.font = `${14}px sans-serif`;
      ctx.fillText(shape.text, shape.points[0].x, shape.points[0].y);
    } else if (shape.type === "measure" && shape.points.length === 2) {
      // Draw measurement line
      const dx = shape.points[1].x - shape.points[0].x;
      const dy = shape.points[1].y - shape.points[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const feet = (distance / scale).toFixed(1);

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      ctx.lineTo(shape.points[1].x, shape.points[1].y);
      ctx.stroke();

      // Draw arrow heads at both ends
      drawArrowhead(ctx, shape.points[0], shape.points[1], shape.width);
      drawArrowhead(ctx, shape.points[1], shape.points[0], shape.width);

      // Draw measurement text
      const midX = (shape.points[0].x + shape.points[1].x) / 2;
      const midY = (shape.points[0].y + shape.points[1].y) / 2;

      ctx.font = `${12}px sans-serif`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw background for text
      const text = `${feet}'`;
      const textMetrics = ctx.measureText(text);
      const padding = 4;

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(
        midX - textMetrics.width / 2 - padding,
        midY - 8 - padding,
        textMetrics.width + padding * 2,
        16 + padding * 2
      );

      // Draw text
      ctx.fillStyle = "#000000";
      ctx.fillText(text, midX, midY);
    }
  };

  const drawArrowhead = (
    ctx: CanvasRenderingContext2D,
    from: DrawingPoint,
    to: DrawingPoint,
    width: number
  ) => {
    const arrowSize = 8 + width;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(
      from.x - arrowSize * Math.cos(angle - Math.PI / 6),
      from.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      from.x - arrowSize * Math.cos(angle + Math.PI / 6),
      from.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  // Canvas mouse event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);

    if (currentTool === "select") {
      // Find clicked shape
      let selectedIndex = -1;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(shapes[i], { x, y })) {
          selectedIndex = i;
          break;
        }
      }
      setSelectedShape(selectedIndex >= 0 ? selectedIndex : null);
      return;
    }

    if (currentTool === "move") {
      if (selectedShape !== null) {
        setLastPoint({ x, y });
      }
      return;
    }

    // For drawing tools
    let newShape: DrawingShape;

    switch (currentTool) {
      case "pen":
        newShape = {
          type: "path",
          points: [{ x, y }],
          color: lineColor,
          width: lineWidth,
        };
        break;
      case "line":
      case "rectangle":
      case "circle":
      case "measure":
        newShape = {
          type:
            currentTool === "line"
              ? "line"
              : currentTool === "rectangle"
                ? "rectangle"
                : currentTool === "circle"
                  ? "circle"
                  : "measure",
          points: [
            { x, y },
            { x, y },
          ],
          color: lineColor,
          width: lineWidth,
        };
        break;
      case "text":
        const text = prompt("Enter text:");
        if (!text) return;

        newShape = {
          type: "text",
          points: [{ x, y }],
          color: lineColor,
          width: lineWidth,
          text,
        };
        break;
      default:
        return;
    }

    setCurrentShape(newShape);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "move" && selectedShape !== null && lastPoint) {
      // Move selected shape
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;

      const updatedShapes = [...shapes];
      const shape = updatedShapes[selectedShape];

      // Move all points
      const newPoints = shape.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      }));

      updatedShapes[selectedShape] = {
        ...shape,
        points: newPoints,
      };

      setShapes(updatedShapes);
      setLastPoint({ x, y });
      return;
    }

    if (!currentShape) return;

    if (currentTool === "pen") {
      // Add point to path
      setCurrentShape({
        ...currentShape,
        points: [...currentShape.points, { x, y }],
      });
    } else if (["line", "rectangle", "circle", "measure"].includes(currentTool)) {
      // Update second point
      setCurrentShape({
        ...currentShape,
        points: [currentShape.points[0], { x, y }],
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (
      currentShape &&
      ["pen", "line", "rectangle", "circle", "text", "measure"].includes(currentTool)
    ) {
      // Add current shape to shapes array
      const newShapes = [...shapes, currentShape];
      setShapes(newShapes);

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newShapes);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setCurrentShape(null);
    }

    setLastPoint(null);
  };

  // Check if a point is inside a shape
  const isPointInShape = (shape: DrawingShape, point: DrawingPoint): boolean => {
    if (shape.type === "path") {
      // Check if point is near any part of the path
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (isPointNearLine(shape.points[i], shape.points[i + 1], point, shape.width + 5)) {
          return true;
        }
      }
    } else if (shape.type === "line") {
      // Check if point is near the line
      return isPointNearLine(shape.points[0], shape.points[1], point, shape.width + 5);
    } else if (shape.type === "rectangle") {
      // Check if point is near any of the rectangle sides
      const startX = Math.min(shape.points[0].x, shape.points[1].x);
      const startY = Math.min(shape.points[0].y, shape.points[1].y);
      const width = Math.abs(shape.points[1].x - shape.points[0].x);
      const height = Math.abs(shape.points[1].y - shape.points[0].y);

      const topLeft = { x: startX, y: startY };
      const topRight = { x: startX + width, y: startY };
      const bottomLeft = { x: startX, y: startY + height };
      const bottomRight = { x: startX + width, y: startY + height };

      return (
        isPointNearLine(topLeft, topRight, point, shape.width + 5) ||
        isPointNearLine(topRight, bottomRight, point, shape.width + 5) ||
        isPointNearLine(bottomRight, bottomLeft, point, shape.width + 5) ||
        isPointNearLine(bottomLeft, topLeft, point, shape.width + 5)
      );
    } else if (shape.type === "circle") {
      // Check if point is near the circle circumference
      const centerX = shape.points[0].x;
      const centerY = shape.points[0].y;
      const radius = Math.sqrt(
        Math.pow(shape.points[1].x - centerX, 2) + Math.pow(shape.points[1].y - centerY, 2)
      );

      const distanceFromCenter = Math.sqrt(
        Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
      );

      return Math.abs(distanceFromCenter - radius) <= shape.width + 5;
    } else if (shape.type === "text") {
      // Check if point is near the text position
      const distance = Math.sqrt(
        Math.pow(point.x - shape.points[0].x, 2) + Math.pow(point.y - shape.points[0].y, 2)
      );

      return distance <= 20; // Use larger hit area for text
    } else if (shape.type === "measure") {
      // Check if point is near the measurement line
      return isPointNearLine(shape.points[0], shape.points[1], point, shape.width + 5);
    }

    return false;
  };

  // Check if a point is near a line
  const isPointNearLine = (
    lineStart: DrawingPoint,
    lineEnd: DrawingPoint,
    point: DrawingPoint,
    threshold: number
  ): boolean => {
    const lineLength = Math.sqrt(
      Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2)
    );

    if (lineLength === 0) return false;

    const distance =
      Math.abs(
        (lineEnd.y - lineStart.y) * point.x -
          (lineEnd.x - lineStart.x) * point.y +
          lineEnd.x * lineStart.y -
          lineEnd.y * lineStart.x
      ) / lineLength;

    // Check if point is near the line segment, not just the line
    const dotProduct =
      (point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y);

    const squaredLength = lineLength * lineLength;

    if (dotProduct < 0 || dotProduct > squaredLength) {
      // Point is not between the line endpoints
      return false;
    }

    return distance <= threshold;
  };

  // Undo/redo functions
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
      setSelectedShape(null);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setShapes([]);
      setSelectedShape(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
      setSelectedShape(null);
    }
  };

  // Delete selected shape
  const handleDeleteShape = () => {
    if (selectedShape === null) return;

    const newShapes = [...shapes];
    newShapes.splice(selectedShape, 1);
    setShapes(newShapes);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setSelectedShape(null);
  };

  // Save the current canvas as an image
  const saveSketch = () => {
    if (!canvasRef.current) return;

    // Temporarily hide the grid
    const gridState = showGrid;
    setShowGrid(false);

    // Wait for canvas to update before capturing
    setTimeout(() => {
      if (!canvasRef.current) return;

      // Get image data from canvas
      const imageData = canvasRef.current.toDataURL("image/png");

      // Calculate total area if measurements are present
      let totalArea = 0;
      if (shapes.length > 0) {
        // Look for rectangle measurements
        const rectangles = shapes.filter((s) => s.type === "rectangle");
        for (const rect of rectangles) {
          if (rect.points.length === 2) {
            const width = Math.abs(rect.points[1].x - rect.points[0].x) / scale;
            const height = Math.abs(rect.points[1].y - rect.points[0].y) / scale;
            totalArea += width * height;
          }
        }
      }

      // Find dimensions from measurement lines
      let dimensions = "";
      const measureLines = shapes.filter((s) => s.type === "measure");
      if (measureLines.length > 0) {
        const measurements = measureLines.map((m) => {
          if (m.points.length === 2) {
            const dx = m.points[1].x - m.points[0].x;
            const dy = m.points[1].y - m.points[0].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return (distance / scale).toFixed(1);
          }
          return 0;
        });

        // Take the two largest measurements as dimensions
        if (measurements.length >= 2) {
          measurements.sort((a, b) => parseFloat(b.toString()) - parseFloat(a.toString()));
          dimensions = `${measurements[0]}' × ${measurements[1]}'`;
        } else if (measurements.length === 1) {
          dimensions = `${measurements[0]}'`;
        }
      }

      // Set form values
      sketchForm.setValue("imageData", imageData);

      if (totalArea > 0) {
        sketchForm.setValue("area", Math.round(totalArea));
      }

      if (dimensions) {
        sketchForm.setValue("dimensions", dimensions);
      }

      setPreviewImageData(imageData);
      setIsDrawingMode(false);

      // Restore grid state
      setShowGrid(gridState);
    }, 50);
  };

  // Calculate area from shape
  const calculateAreaFromShape = (shape: DrawingShape): number => {
    if (shape.type === "rectangle" && shape.points.length === 2) {
      const width = Math.abs(shape.points[1].x - shape.points[0].x) / scale;
      const height = Math.abs(shape.points[1].y - shape.points[0].y) / scale;
      return width * height;
    }
    return 0;
  };

  // Sync offline sketches when back online
  useEffect(() => {
    const syncOfflineData = async () => {
      if (navigator.onLine && offlineSketches.length > 0) {
        toast({
          title: "Syncing",
          description: `Syncing ${offlineSketches.length} sketches from offline storage...`,
        });

        try {
          for (const sketch of offlineSketches) {
            await apiRequest("/api/sketches", {
              method: "POST",
              data: {
                reportId: sketch.reportId,
                type: sketch.type,
                title: sketch.title,
                description: sketch.description,
                dimensions: sketch.dimensions,
                area: sketch.area,
                imageData: sketch.imageData,
              },
            });
          }

          // Clear offline storage after successful sync
          localStorage.removeItem("offlineSketches");
          setOfflineSketches([]);

          // Refresh data
          queryClient.invalidateQueries({
            queryKey: ["/api/reports", selectedReportId, "sketches"],
          });

          toast({
            title: "Sync Complete",
            description: "Your offline sketches have been successfully synced.",
          });
        } catch (error) {
          console.error("Error syncing offline sketches:", error);
          toast({
            title: "Sync Failed",
            description: "Failed to sync some offline sketches. They will be kept for later sync.",
            variant: "destructive",
          });
        }
      }
    };

    if (!offlineMode && offlineSketches.length > 0) {
      syncOfflineData();
    }
  }, [offlineMode, offlineSketches.length]);

  // Sketch type options
  const sketchTypes = ["floor", "site", "elevation", "exterior", "lot"];

  // Group sketches by type
  const getSketchesByType = () => {
    const sketches = offlineMode
      ? offlineSketches.filter((s: Sketch) => s.reportId === selectedReportId)
      : sketchesQuery.data || [];

    if (selectedType === "all") {
      return sketches;
    }

    return sketches.filter((s: Sketch) => s.type === selectedType);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Format area
  const formatArea = (area: number) => {
    return `${area.toLocaleString()} sq ft`;
  };

  // Loading state
  if (!offlineMode && reportsQuery.isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  const filteredSketches = getSketchesByType();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Property Sketches</h1>
          {offlineMode && (
            <div className="mt-1 text-sm text-amber-600 font-medium flex items-center">
              <span className="mr-1">●</span> Offline Mode - Sketches will sync when online
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!offlineMode && reportsQuery.data && reportsQuery.data.length > 0 && (
            <Select
              value={selectedReportId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedReportId(Number(value));
                navigate(`/sketches?reportId=${value}`);
              }}
            >
              <SelectTrigger className="w-full sm:w-[280px]"><>

                <SelectValue placeholder="Select a report" />
              </SelectTrigger>
              <SelectContent
</>>
                {reportsQuery.data.map((report: any) => (
                  <SelectItem key={report.id} value={report.id.toString()}>
                    Report #{report.id} ({report.formType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleAddSketch}
            disabled={!selectedReportId && !offlineMode}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Sketch
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive"><>

          <AlertTitle>Error</AlertTitle>
          <AlertDescription
</>>{error}</AlertDescription>
        </Alert>
      )}

      {/* No report selected message */}
      {!selectedReportId && !offlineMode && (
        <Alert><>

          <AlertTitle>No report selected</AlertTitle>
          <AlertDescription
</>>
            Please select an appraisal report to view and manage sketches.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {selectedReportId && !offlineMode && sketchesQuery.isLoading && (
        <div>Loading sketches...</div>
      )}

      {/* Filter by type */}
      {selectedReportId &&
        ((sketchesQuery.data && sketchesQuery.data.length > 0) ||
          (offlineMode &&
            offlineSketches.filter((s: Sketch) => s.reportId === selectedReportId).length > 0)) && (
          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <div className="flex overflow-auto pb-2">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("all")}
                  className="whitespace-nowrap"
                >
                  All
                </Button>
                {sketchTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="ml-2 whitespace-nowrap"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* No sketches message */}
      {selectedReportId &&
        ((sketchesQuery.data && sketchesQuery.data.length === 0) ||
          (offlineMode &&
            offlineSketches.filter((s: Sketch) => s.reportId === selectedReportId).length ===
              0)) && (
          <Card className="p-8 text-center"><>

            <p className="text-muted-foreground mb-4">
              No sketches have been added to this report yet.
            </p>
            <div
</> className="flex gap-2 justify-center">
              <Button onClick={handleAddSketch}><>

                <Upload className="mr-2 h-4 w-4" /> Upload Sketch
              </Button>
              <Button
</> variant="secondary" onClick={handleStartDrawing}>
                <PenLine className="mr-2 h-4 w-4" /> Create Sketch
              </Button>
            </div>
          </Card>
        )}

      {/* Sketches Grid */}
      {filteredSketches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSketches.map((sketch: Sketch) => (
            <Card key={sketch.id} className="p-4 space-y-3"><>

              <div
                className="h-64 rounded-md bg-cover bg-center cursor-pointer border"
                style={{ backgroundImage: `url(${sketch.imageData})` }}
                onClick={() => handleViewSketch(sketch)}
              ></div>
              <div
</> className="flex justify-between items-start">
                <div><>

                  <h3 className="font-medium">{sketch.title}</h3>
                  <div
</> className="text-sm text-muted-foreground space-y-1">
                    <p>{sketch.type.charAt(0).toUpperCase() + sketch.type.slice(1)}</p>
                    {sketch.dimensions && <p>Dimensions: {sketch.dimensions}</p>}
                    {sketch.area > 0 && <p>Area: {formatArea(sketch.area)}</p>}
                  </div>
                </div>
                <div className="space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditSketch(sketch)}><>

                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
</> variant="ghost" size="icon" onClick={() => handleDeleteSketch(sketch.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sketch Dialog for upload or edit */}
      <Dialog
        open={isSketchDialogOpen && !isDrawingMode}
        onOpenChange={(open) => {
          if (!open && isDrawingMode) {
            // If closing while in drawing mode, confirm
            if (window.confirm("Discard changes to this sketch?")) {
              setIsSketchDialogOpen(false);
              setIsDrawingMode(false);
            }
          } else {
            setIsSketchDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>{selectedSketchId ? "Edit Sketch" : "Add Sketch"}</DialogTitle>
            <DialogDescription
</>>
              {selectedSketchId
                ? "Update the details of this sketch"
                : "Upload or create a new sketch for your appraisal report"}
            </DialogDescription>
          </DialogHeader>

          <Form {...sketchForm}>
            <form onSubmit={sketchForm.handleSubmit(onSketchSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={sketchForm.control}
                    name="type"
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
                          <SelectContent>
                            {sketchTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sketchForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Title</FormLabel>
                        <FormControl
</>><>

                          <Input placeholder="First Floor Plan" {...field} />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sketchForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Description</FormLabel>
                        <FormControl
</>><>

                          <Textarea
                            placeholder="Brief description of this sketch"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={sketchForm.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Dimensions</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="30' × 40'" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sketchForm.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Area (sq ft)</FormLabel>
                          <FormControl
</>><>

                            <Input
                              type="number"
                              placeholder="1200"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!previewImageData && (
                    <div className="space-y-4">
                      <div className="space-y-2"><>

                        <FormLabel>Upload Image</FormLabel>
                        <Input
</>
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          ref={fileInputRef}
                        />
                        <FormMessage>{sketchForm.formState.errors.imageData?.message}</FormMessage>
                      </div>

                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
                        <div className="text-center space-y-2">
                          <Button type="button" variant="outline" onClick={handleStartDrawing}><>

                            <PenLine className="mr-2 h-4 w-4" /> Draw Sketch
                          </Button>
                          <p
</> className="text-xs text-muted-foreground">
                            Create a new sketch using the drawing tools
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {previewImageData && (
                  <div className="space-y-4"><>

                    <FormLabel>Preview</FormLabel>
                    <div
</> className="border rounded-md p-2 overflow-hidden"><>

                      <img
                        src={previewImageData}
                        alt="Preview"
                        className="max-h-[300px] w-full object-contain rounded"
                      />
                    </div>
                    <div
</> className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStartDrawing}
                      ><>

                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
</>
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewImageData(null);
                          sketchForm.setValue("imageData", "");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter><>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSketchDialogOpen(false);
                    setPreviewImageData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
</>
                  type="submit"
                  disabled={sketchMutation.isPending || !sketchForm.getValues().imageData}
                >
                  {sketchMutation.isPending
                    ? "Saving..."
                    : selectedSketchId
                      ? "Update Sketch"
                      : "Add Sketch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Drawing Mode Dialog */}
      <Dialog
        open={isDrawingMode}
        onOpenChange={(open) => {
          if (!open) {
            // Confirm before closing
            if (window.confirm("Discard changes to this sketch?")) {
              setIsDrawingMode(false);
              setIsSketchDialogOpen(false);
            }
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between"><>

              <DialogTitle>Create Sketch</DialogTitle>
              <Button
</>
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm("Discard changes to this sketch?")) {
                    setIsDrawingMode(false);
                    setIsSketchDialogOpen(false);
                  }
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Drawing tools */}
            <div className="p-2 border-b flex flex-wrap gap-1">
              <Button
                variant={currentTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("select")}
                title="Select"
              ><>

                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "move" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("move")}
                title="Move"
              ><>

                <MoveHorizontal className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("pen")}
                title="Pen"
              ><>

                <Pencil className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("line")}
                title="Line"
              ><>

                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("rectangle")}
                title="Rectangle"
              ><>

                <Square className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("circle")}
                title="Circle"
              ><>

                <Circle className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "measure" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("measure")}
                title="Measure"
              ><>

                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={currentTool === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("text")}
                title="Text"
              >
                T
              </Button>

              <Separator orientation="vertical" className="mx-2 h-8" />

              <div className="flex items-center"><>

                <label className="text-xs mr-2">Color:</label>
                <Input
</>
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-8 h-8 p-0"
                />
              </div>

              <div className="flex items-center ml-2"><>

                <label className="text-xs mr-2">Width:</label>
                <select
</>
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-12 h-8 rounded border text-sm"
                >
                  {[1, 2, 3, 4, 5].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center ml-2"><>

                <label className="text-xs mr-2">Grid:</label>
                <Switch
</> checked={showGrid} onCheckedChange={setShowGrid} />
              </div>

              <div className="flex items-center ml-2"><>

                <label className="text-xs mr-2">Scale:</label>
                <select
</>
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-16 h-8 rounded border text-sm"
                ><>

                  <option value="5">5 px/ft</option>
                  <option
</> value="10">10 px/ft</option><>

                  <option value="15">15 px/ft</option>
                  <option
</> value="20">20 px/ft</option>
                </select>
              </div>

              <Separator orientation="vertical" className="mx-2 h-8" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex < 0}
                title="Undo"
              ><>

                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              ><>

                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={handleDeleteShape}
                disabled={selectedShape === null}
                title="Delete Selected"
              ><>

                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={() => setShapes([])}
                disabled={shapes.length === 0}
                title="Clear All"
              ><>

                <Trash2 className="h-4 w-4" />
              </Button>

              <div
</> className="ml-auto">
                <Button onClick={saveSketch} disabled={shapes.length === 0}>
                  <Save className="mr-2 h-4 w-4" /> Save Sketch
                </Button>
              </div>
            </div>

            {/* Drawing canvas */}
            <div className="flex-grow overflow-auto relative bg-muted p-4">
              <div className="bg-white shadow-md mx-auto" style={{ width: 800, height: 600 }}>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="border cursor-crosshair"
                ></canvas>
              </div>
            </div>

            {/* Status bar */}
            <div className="p-2 border-t text-xs text-muted-foreground">
              <div className="flex justify-between"><>

                <div>Tool: {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}</div>
                <div
</>>Shapes: {shapes.length}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sketch Viewer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <div>
              <DialogTitle>{viewingSketch?.title}</DialogTitle>
              {viewingSketch?.dimensions && (
                <DialogDescription>
                  Dimensions: {viewingSketch.dimensions}
                  {viewingSketch.area > 0 && ` | Area: ${formatArea(viewingSketch.area)}`}
                </DialogDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsViewDialogOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          {viewingSketch && (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden flex justify-center bg-black">
                <img
                  src={viewingSketch.imageData}
                  alt={viewingSketch.title}
                  className="max-h-[70vh] object-contain"
                />
              </div>

              {viewingSketch.description && (
                <div><>

                  <h3 className="text-sm font-medium mb-1">Description:</h3>
                  <p
</> className="text-sm text-muted-foreground">{viewingSketch.description}</p>
                </div>
              )}

              <div className="flex justify-between"><>

                <span className="text-xs text-muted-foreground">
                  {viewingSketch.dateCreated && formatDate(viewingSketch.dateCreated)}
                </span>

                <div
</> className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditSketch(viewingSketch);
                    }}
                  ><>

                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleDeleteSketch(viewingSketch.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
