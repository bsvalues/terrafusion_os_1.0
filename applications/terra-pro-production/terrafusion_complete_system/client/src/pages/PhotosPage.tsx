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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera,
  Upload,
  Trash2,
  Edit,
  Plus,
  RotateCw,
  Image as ImageIcon,
  Maximize,
  X,
  Check,
 } from '@mui/icons-material';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the photo schema
const photoSchema = z.object({
  reportId: z.number(),
  type: z.string().min(1, "Photo type is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  imageData: z.string().min(1, "Image data is required"),
});

type PhotoFormValues = z.infer<typeof photoSchema>;

interface Photo {
  id: number;
  reportId: number;
  type: string;
  description: string;
  notes: string;
  imageData: string;
  dateCreated: string;
}

export default function PhotosPage() {
  const [location, navigate] = useLocation();
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [captureMode, setCaptureMode] = useState<boolean>(false);
  const [previewImageData, setPreviewImageData] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [offlinePhotos, setOfflinePhotos] = useState<Photo[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for mobile device and camera availability
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    };

    setIsMobile(checkMobile());

    // Check if camera is available
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        setIsCameraAvailable(cameras.length > 0);
      } catch (err) {
        console.error("Error checking camera availability:", err);
        setIsCameraAvailable(false);
      }
    };

    checkCamera();

    // Check for network connectivity
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOfflineMode(!navigator.onLine);

    // Initialize from local storage if in offline mode
    if (!navigator.onLine) {
      const cachedPhotos = localStorage.getItem("offlinePhotos");
      if (cachedPhotos) {
        setOfflinePhotos(JSON.parse(cachedPhotos));
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
  const photoForm = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      reportId: selectedReportId || 0,
      type: "",
      description: "",
      notes: "",
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

  // Fetch photos for selected report
  const photosQuery = useQuery({
    queryKey: ["/api/reports", selectedReportId, "photos"],
    queryFn: async () => {
      if (offlineMode) return offlinePhotos;
      return apiRequest(`/api/reports/${selectedReportId}/photos`, {
        method: "GET",
      });
    },
    enabled: !!selectedReportId && !offlineMode,
  });

  // Fetch single photo for editing
  const photoQuery = useQuery({
    queryKey: ["/api/photos", selectedPhotoId],
    queryFn: async () => {
      if (offlineMode) {
        return offlinePhotos.find((p) => p.id === selectedPhotoId) || null;
      }
      return apiRequest(`/api/photos/${selectedPhotoId}`, {
        method: "GET",
      });
    },
    enabled: !!selectedPhotoId && isPhotoDialogOpen,
  });

  // Update form when photo data is loaded
  useEffect(() => {
    if (photoQuery.data) {
      photoForm.reset({
        reportId: photoQuery.data.reportId,
        type: photoQuery.data.type,
        description: photoQuery.data.description || "",
        notes: photoQuery.data.notes || "",
        imageData: photoQuery.data.imageData,
      });
      setPreviewImageData(photoQuery.data.imageData);
    }
  }, [photoQuery.data]);

  // Create/update photo mutation
  const photoMutation = useMutation({
    mutationFn: async (data: PhotoFormValues) => {
      if (offlineMode) {
        // Handle offline mode - store locally
        const newPhoto: Photo = {
          id: selectedPhotoId || Date.now(),
          reportId: data.reportId,
          type: data.type,
          description: data.description || "",
          notes: data.notes || "",
          imageData: data.imageData,
          dateCreated: new Date().toISOString(),
        };

        if (selectedPhotoId) {
          // Update existing
          const updatedPhotos = offlinePhotos.map((p: Photo) =>
            p.id === selectedPhotoId ? newPhoto : p
          );
          setOfflinePhotos(updatedPhotos);
          localStorage.setItem("offlinePhotos", JSON.stringify(updatedPhotos));
          return newPhoto;
        } else {
          // Create new
          const updatedPhotos = [...offlinePhotos, newPhoto];
          setOfflinePhotos(updatedPhotos);
          localStorage.setItem("offlinePhotos", JSON.stringify(updatedPhotos));
          return newPhoto;
        }
      }

      if (selectedPhotoId) {
        return apiRequest(`/api/photos/${selectedPhotoId}`, {
          method: "PUT",
          data,
        });
      } else {
        return apiRequest("/api/photos", {
          method: "POST",
          data,
        });
      }
    },
    onSuccess: () => {
      if (!offlineMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", selectedReportId, "photos"] });
      }

      setIsPhotoDialogOpen(false);
      setCaptureMode(false);
      setPreviewImageData(null);

      toast({
        title: selectedPhotoId ? "Photo updated" : "Photo added",
        description: "Photo has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      if (offlineMode) {
        const updatedPhotos = offlinePhotos.filter((p) => p.id !== id);
        setOfflinePhotos(updatedPhotos);
        localStorage.setItem("offlinePhotos", JSON.stringify(updatedPhotos));
        return true;
      }

      return apiRequest(`/api/photos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      if (!offlineMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/reports", selectedReportId, "photos"] });
      }

      toast({
        title: "Photo deleted",
        description: "Photo has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onPhotoSubmit = (data: PhotoFormValues) => {
    photoMutation.mutate(data);
  };

  // Handler for adding a new photo
  const handleAddPhoto = () => {
    setSelectedPhotoId(null);
    photoForm.reset({
      reportId: selectedReportId || 0,
      type: "",
      description: "",
      notes: "",
      imageData: "",
    });
    setPreviewImageData(null);
    setIsPhotoDialogOpen(true);
  };

  // Handler for editing an existing photo
  const handleEditPhoto = (photo: Photo) => {
    setSelectedPhotoId(photo.id);
    setIsPhotoDialogOpen(true);
  };

  // Handler for viewing a photo in full screen
  const handleViewPhoto = (photo: Photo) => {
    setViewingPhoto(photo);
    setIsViewDialogOpen(true);
  };

  // Handler for deleting a photo
  const handleDeletePhoto = (id: number) => {
    if (window.confirm("Are you sure you want to delete this photo?")) {
      deletePhotoMutation.mutate(id);
    }
  };

  // Handler for camera capture mode
  const startCameraCapture = async () => {
    setCaptureMode(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setError(null);
        }
      } else {
        setError("Camera access not supported in this browser.");
        setCaptureMode(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check camera permissions.");
      setCaptureMode(false);
    }
  };

  // Handler to capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to the canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setPreviewImageData(imageData);
        photoForm.setValue("imageData", imageData);

        // Stop the camera stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        video.srcObject = null;

        setCaptureMode(false);
      }
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
        photoForm.setValue("imageData", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cancel camera capture
  const cancelCapture = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
    setCaptureMode(false);
  };

  // Sync offline photos when back online
  useEffect(() => {
    const syncOfflineData = async () => {
      if (navigator.onLine && offlinePhotos.length > 0) {
        toast({
          title: "Syncing",
          description: `Syncing ${offlinePhotos.length} photos from offline storage...`,
        });

        try {
          for (const photo of offlinePhotos) {
            await apiRequest("/api/photos", {
              method: "POST",
              data: {
                reportId: photo.reportId,
                type: photo.type,
                description: photo.description,
                notes: photo.notes,
                imageData: photo.imageData,
              },
            });
          }

          // Clear offline storage after successful sync
          localStorage.removeItem("offlinePhotos");
          setOfflinePhotos([]);

          // Refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/reports", selectedReportId, "photos"] });

          toast({
            title: "Sync Complete",
            description: "Your offline photos have been successfully synced.",
          });
        } catch (error) {
          console.error("Error syncing offline photos:", error);
          toast({
            title: "Sync Failed",
            description: "Failed to sync some offline photos. They will be kept for later sync.",
            variant: "destructive",
          });
        }
      }
    };

    if (!offlineMode && offlinePhotos.length > 0) {
      syncOfflineData();
    }
  }, [offlineMode, offlinePhotos.length]);

  // Photo type options
  const photoTypes = [
    "Front Exterior",
    "Rear Exterior",
    "Side Exterior",
    "Street View",
    "Living Room",
    "Kitchen",
    "Master Bedroom",
    "Bedroom",
    "Bathroom",
    "Dining Room",
    "Family Room",
    "Basement",
    "Garage",
    "Attic",
    "Yard",
    "Pool",
    "Other",
  ];

  // Group photos by type
  const getPhotosByType = () => {
    const photos = offlineMode ? offlinePhotos : photosQuery.data || [];
    const exterior = photos.filter((p: Photo) =>
      ["Front Exterior", "Rear Exterior", "Side Exterior", "Street View"].includes(p.type)
    );
    const interior = photos.filter((p: Photo) =>
      [
        "Living Room",
        "Kitchen",
        "Master Bedroom",
        "Bedroom",
        "Bathroom",
        "Dining Room",
        "Family Room",
        "Basement",
      ].includes(p.type)
    );
    const other = photos.filter(
      (p: Photo) =>
        ![
          "Front Exterior",
          "Rear Exterior",
          "Side Exterior",
          "Street View",
          "Living Room",
          "Kitchen",
          "Master Bedroom",
          "Bedroom",
          "Bathroom",
          "Dining Room",
          "Family Room",
          "Basement",
        ].includes(p.type)
    );

    return { exterior, interior, other };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Loading state
  if (!offlineMode && reportsQuery.isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  const { exterior, interior, other } = getPhotosByType();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Property Photos</h1>
          {offlineMode && (
            <div className="mt-1 text-sm text-amber-600 font-medium flex items-center">
              <span className="mr-1">●</span> Offline Mode - Photos will sync when online
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!offlineMode && reportsQuery.data && reportsQuery.data.length > 0 && (
            <Select
              value={selectedReportId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedReportId(Number(value));
                navigate(`/photos?reportId=${value}`);
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

          <div className="flex gap-2">
            <Button
              onClick={handleAddPhoto}
              disabled={!selectedReportId && !offlineMode}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Photo
            </Button>

            {isMobile && isCameraAvailable && (
              <Button
                variant="secondary"
                onClick={startCameraCapture}
                disabled={(!selectedReportId && !offlineMode) || captureMode}
                className="w-full sm:w-auto"
              >
                <Camera className="mr-2 h-4 w-4" /> Camera
              </Button>
            )}
          </div>
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
            Please select an appraisal report to view and manage photos.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {selectedReportId && !offlineMode && photosQuery.isLoading && <div>Loading photos...</div>}

      {/* No photos message */}
      {selectedReportId &&
        ((photosQuery.data && photosQuery.data.length === 0) ||
          (offlineMode && offlinePhotos.length === 0)) && (
          <Card className="p-8 text-center"><>

            <p className="text-muted-foreground mb-4">
              No photos have been added to this report yet.
            </p>
            <div
</> className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleAddPhoto}>
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              {isMobile && isCameraAvailable && (
                <Button variant="secondary" onClick={startCameraCapture}>
                  <Camera className="mr-2 h-4 w-4" /> Take Photo
                </Button>
              )}
            </div>
          </Card>
        )}

      {/* Exterior Photos */}
      {exterior.length > 0 && (
        <Card>
          <CardHeader><>

            <CardTitle>Exterior Photos</CardTitle>
            <CardDescription
</>>{exterior.length} exterior photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {exterior.map((photo: Photo) => (
                <div key={photo.id} className="border rounded-md p-2 space-y-2"><>

                  <div
                    className="h-48 rounded-md bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${photo.imageData})` }}
                    onClick={() => handleViewPhoto(photo)}
                  ></div>
                  <div
</> className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{photo.type}</div>
                      {photo.description && (
                        <div className="text-xs text-muted-foreground">{photo.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPhoto(photo)}><>

                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
</>
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interior Photos */}
      {interior.length > 0 && (
        <Card>
          <CardHeader><>

            <CardTitle>Interior Photos</CardTitle>
            <CardDescription
</>>{interior.length} interior photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {interior.map((photo: Photo) => (
                <div key={photo.id} className="border rounded-md p-2 space-y-2"><>

                  <div
                    className="h-48 rounded-md bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${photo.imageData})` }}
                    onClick={() => handleViewPhoto(photo)}
                  ></div>
                  <div
</> className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{photo.type}</div>
                      {photo.description && (
                        <div className="text-xs text-muted-foreground">{photo.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPhoto(photo)}><>

                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
</>
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Photos */}
      {other.length > 0 && (
        <Card>
          <CardHeader><>

            <CardTitle>Other Photos</CardTitle>
            <CardDescription
</>>{other.length} other photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {other.map((photo: Photo) => (
                <div key={photo.id} className="border rounded-md p-2 space-y-2"><>

                  <div
                    className="h-48 rounded-md bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${photo.imageData})` }}
                    onClick={() => handleViewPhoto(photo)}
                  ></div>
                  <div
</> className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{photo.type}</div>
                      {photo.description && (
                        <div className="text-xs text-muted-foreground">{photo.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPhoto(photo)}><>

                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
</>
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>{selectedPhotoId ? "Edit Photo" : "Add Photo"}</DialogTitle>
            <DialogDescription
</>>
              {selectedPhotoId
                ? "Update the details of this photo"
                : "Upload or capture a new photo for your appraisal report"}
            </DialogDescription>
          </DialogHeader>

          {captureMode ? (
            <div className="space-y-4">
              <div className="relative border rounded-md overflow-hidden max-h-[50vh] flex justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                ></video>
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={capturePhoto}><>

                  <Check className="mr-2 h-4 w-4" /> Capture
                </Button>
                <Button
</> variant="outline" onClick={cancelCapture}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Form {...photoForm}>
              <form onSubmit={photoForm.handleSubmit(onPhotoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={photoForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Photo Type</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {photoTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={photoForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Description</FormLabel>
                          <FormControl
</>><>

                            <Input
                              placeholder="Main entrance view"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={photoForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Notes</FormLabel>
                          <FormControl
</>><>

                            <Textarea
                              placeholder="Additional notes about this photo"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />

                    {!previewImageData && (
                      <div className="space-y-2"><>

                        <FormLabel>Upload Image</FormLabel>
                        <div
</> className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                          />
                          <FormMessage>{photoForm.formState.errors.imageData?.message}</FormMessage>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {previewImageData ? (
                      <div className="space-y-2"><>

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
</> className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewImageData(null);
                              photoForm.setValue("imageData", "");
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-md h-[300px] flex items-center justify-center bg-muted">
                        <div className="text-center space-y-2">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No image selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter><>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsPhotoDialogOpen(false);
                      setPreviewImageData(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
</>
                    type="submit"
                    disabled={photoMutation.isPending || !photoForm.getValues().imageData}
                  >
                    {photoMutation.isPending
                      ? "Saving..."
                      : selectedPhotoId
                        ? "Update Photo"
                        : "Add Photo"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Hidden canvas for camera capture */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <div>
              <DialogTitle>{viewingPhoto?.type}</DialogTitle>
              {viewingPhoto?.description && (
                <DialogDescription>{viewingPhoto.description}</DialogDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsViewDialogOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          {viewingPhoto && (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden flex justify-center bg-black">
                <img
                  src={viewingPhoto.imageData}
                  alt={viewingPhoto.type}
                  className="max-h-[70vh] object-contain"
                />
              </div>

              {viewingPhoto.notes && (
                <div><>

                  <h3 className="text-sm font-medium mb-1">Notes:</h3>
                  <p
</> className="text-sm text-muted-foreground">{viewingPhoto.notes}</p>
                </div>
              )}

              <div className="flex justify-between"><>

                <span className="text-xs text-muted-foreground">
                  {viewingPhoto.dateCreated && formatDate(viewingPhoto.dateCreated)}
                </span>

                <div
</> className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditPhoto(viewingPhoto);
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
                      handleDeletePhoto(viewingPhoto.id);
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
