import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Expand,
  FileImage,
  Image,
  Trash,
  Upload,
  ZoomIn,
 } from '@mui/icons-material';
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";

// Define photo schema
const photoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  viewpoint: z.string().optional(),
  tags: z.string().optional(),
});

// Define type for photo data from API
interface PhotoFromAPI {
  id: number;
  reportId: number;
  photoType: string;
  url: string;
  caption: string | null;
  dateTaken: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | null;
  metadata: any | null;
}

// Define type for photo data as used in the UI
interface Photo {
  id: number;
  reportId: number;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  viewpoint: string | null;
  tags: string | null;
  createdAt: string | null;
}

export default function EnhancedPhotosPage() {
  const params = useParams<{ reportId?: string }>();
  const paramReportId = params.reportId;
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const reportId = Number(paramReportId) || 1;

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos for the report
  const {
    data: photosFromAPI = [],
    isLoading,
    isError,
  } = useQuery<PhotoFromAPI[]>({
    queryKey: ["/api/reports", reportId, "photos"],
    queryFn: () => apiRequest(`/api/reports/${reportId}/photos`),
  });

  // Transform API data to UI format
  const photos: Photo[] = photosFromAPI.map((apiPhoto) => ({
    id: apiPhoto.id,
    reportId: apiPhoto.reportId,
    title: apiPhoto.caption || `Photo ${apiPhoto.id}`,
    description: null,
    imageUrl: apiPhoto.url,
    category: apiPhoto.photoType,
    viewpoint: null,
    tags: null,
    createdAt: apiPhoto.createdAt,
  }));

  // Categories for filtering with null check
  const photoCategories = photos
    .map((photo) => photo.category)
    .filter((category) => category !== null && category !== undefined) as string[];

  const allCategories = ["all", ...Array.from(new Set(photoCategories))];

  // Filtered photos based on active category
  const filteredPhotos =
    activeCategory === "all" ? photos : photos.filter((photo) => photo.category === activeCategory);

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest(`/api/photos`, {
        method: "POST",
        data: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "photos"] });
      setIsUploadDialogOpen(false);
      setUploadedImage(null);
    },
  });

  // Update photo mutation
  const updatePhotoMutation = useMutation({
    mutationFn: ({ photoId, data }: { photoId: number; data: z.infer<typeof photoSchema> }) => {
      // Transform the UI data to match the API expectations
      const apiData = {
        caption: data.title,
        photoType: data.category,
        // Include any other fields that the API expects
      };

      return apiRequest(`/api/photos/${photoId}`, {
        method: "PUT",
        data: apiData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "photos"] });
      setIsEditing(false);
      setEditingPhoto(null);
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) =>
      apiRequest(`/api/photos/${photoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "photos"] });
      setSelectedPhoto(null);
      setIsViewerOpen(false);
    },
  });

  // Upload form
  const uploadForm = useForm<z.infer<typeof photoSchema>>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "exterior",
      viewpoint: "",
      tags: "",
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof photoSchema>>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      viewpoint: "",
      tags: "",
    },
  });

  // Handle file selection for upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo upload
  const onUploadSubmit = (data: z.infer<typeof photoSchema>) => {
    if (!uploadedImage || !fileInputRef.current?.files?.[0]) return;

    // Map UI concepts to API concepts
    const formData = new FormData();
    formData.append("reportId", reportId.toString());
    formData.append("image", fileInputRef.current.files[0]);
    formData.append("caption", data.title); // title -> caption
    formData.append("photoType", data.category); // category -> photoType

    // Add additional data as metadata
    const metadata = {
      description: data.description || "",
      viewpoint: data.viewpoint || "",
      tags: data.tags || "",
    };
    formData.append("metadata", JSON.stringify(metadata));

    uploadPhotoMutation.mutate(formData);
  };

  // Handle photo update
  const onEditSubmit = (data: z.infer<typeof photoSchema>) => {
    if (!editingPhoto) return;
    updatePhotoMutation.mutate({ photoId: editingPhoto.id, data });
  };

  // Open photo viewer
  const openPhotoViewer = (photo: Photo /* , index */: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    setIsViewerOpen(true);
  };

  // Navigate to next photo in viewer
  const nextPhoto = () => {
    if (currentIndex < filteredPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    }
  };

  // Navigate to previous photo in viewer
  const prevPhoto = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    }
  };

  // Start editing a photo
  const startEditing = (photo: Photo) => {
    setEditingPhoto(photo);
    editForm.reset({
      title: photo.title,
      description: photo.description || "",
      category: photo.category,
      viewpoint: photo.viewpoint || "",
      tags: photo.tags || "",
    });
    setIsEditing(true);
    setIsViewerOpen(false);
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

  // Generate image placeholder
  const getPlaceholderImage = (category: string) => {
    switch (category.toLowerCase()) {
      case "exterior":
        return "https://placehold.co/600x400/e6f7ff/0369a1?text=Exterior";
      case "interior":
        return "https://placehold.co/600x400/f0fdf4/166534?text=Interior";
      case "site":
        return "https://placehold.co/600x400/fef3c7/92400e?text=Site";
      case "street":
        return "https://placehold.co/600x400/f1f5f9/334155?text=Street";
      default:
        return "https://placehold.co/600x400/f5f5f5/6b7280?text=Property+Photo";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold">Property Photos</h1>
          <p
</> className="text-muted-foreground mt-1">
            Manage photos for appraisal report #{reportId}
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" /> Add Photo
        </Button>
      </div>

      <Tabs defaultValue="gallery" className="mb-6">
        <TabsList><>

          <TabsTrigger value="gallery">Gallery View</TabsTrigger>
          <TabsTrigger
</> value="table">Table View</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery">
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(category)}
              >
                {category === "all"
                  ? "All Photos"
                  : category.charAt(0).toUpperCase() + category.slice(1)}
                {activeCategory !== "all" && activeCategory === category && (
                  <Check className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <p className="text-red-500">Error loading photos. Please try again.</p>
            </Card>
          ) : filteredPhotos.length === 0 ? (
            <Card className="border-dashed border-2 p-8 text-center">
              <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

              <h3 className="text-lg font-medium mb-2">No Photos Found</h3>
              <p
</> className="text-sm text-muted-foreground mb-4">
                {activeCategory === "all"
                  ? "No photos have been added to this report yet."
                  : `No photos in the '${activeCategory}' category.`}
              </p>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" /> Upload New Photo
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo /* , index */) => (
                <Card
                  key={photo.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openPhotoViewer(photo /* , index */)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={photo.imageUrl || getPlaceholderImage(photo.category)}
                      alt={photo.title}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhotoViewer(photo /* , index */);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/50 hover:bg-black/50">
                      {photo.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{photo.title}</h3>
                    {photo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {photo.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                    <span>{formatDate(photo.createdAt)}</span>
                    {photo.viewpoint && <span>{photo.viewpoint}</span>}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b"><>

                      <th className="text-left py-3 px-4">Thumbnail</th>
                      <th
</> className="text-left py-3 px-4">Title</th><>

                      <th className="text-left py-3 px-4">Category</th>
                      <th
</> className="text-left py-3 px-4">Viewpoint</th><>

                      <th className="text-left py-3 px-4">Date Added</th>
                      <th
</> className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          Loading photos...
                        </td>
                      </tr>
                    ) : photos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <p className="text-muted-foreground">
                            No photos found. Upload some photos to get started.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      photos.map((photo) => (
                        <tr key={photo.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="w-16 h-16 relative">
                              <img
                                src={photo.imageUrl || getPlaceholderImage(photo.category)}
                                alt={photo.title}
                                className="object-cover w-full h-full rounded"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{photo.title}</p>
                            {photo.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {photo.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{photo.category}</Badge>
                          </td><>

                          <td className="py-3 px-4">{photo.viewpoint || "-"}</td>
                          <td
</> className="py-3 px-4 text-sm">{formatDate(photo.createdAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPhotoViewer(photo, photos.indexOf(photo))}
                              ><>

                                <Expand className="h-4 w-4" />
                              </Button>
                              <Button
</>
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(photo)}
                              ><>

                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
</>
                                variant="ghost"
                                size="icon"
                                onClick={() => deletePhotoMutation.mutate(photo.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis">
          <Card>
            <CardHeader><>

              <CardTitle>AI Photo Analysis</CardTitle>
              <CardDescription
</>>
                Automatically detect and categorize property features from your photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 text-center border rounded-md bg-muted/50">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

                <h3 className="text-lg font-medium mb-2">AI Photo Analysis</h3>
                <p
</> className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Our AI can analyze your property photos to identify features, conditions, and
                  potential value factors.
                </p>
                <Button>Analyze Photos with AI</Button>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Feature Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      AI can detect property features like fireplaces, renovated kitchens, updated
                      bathrooms, and more.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Condition Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Get an automated assessment of property condition based on visual cues in your
                      photos.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quality Grading</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      AI can help grade materials and finishes to ensure accurate quality
                      assessments.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Categorization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Automatically sort and label photos into appropriate categories for your
                      report.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-5xl h-[80vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex justify-between items-center"><>

                <DialogTitle>{selectedPhoto?.title}</DialogTitle>
                <div
</> className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startEditing(selectedPhoto!)}
                  ><>

                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
</>
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(selectedPhoto?.imageUrl, "_blank")}
                  ><>

                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
</>
                    variant="outline"
                    size="icon"
                    onClick={() => deletePhotoMutation.mutate(selectedPhoto!.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 bg-black/90 relative flex items-center justify-center p-4">
              <img
                src={selectedPhoto?.imageUrl}
                alt={selectedPhoto?.title}
                className="max-h-full max-w-full object-contain"
              />

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20"
                onClick={prevPhoto}
                disabled={currentIndex === 0}
              ><>

                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
</>
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20"
                onClick={nextPhoto}
                disabled={currentIndex === filteredPhotos.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div className="px-6 py-4 border-t bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2"><>

                  <h3 className="text-sm font-medium">Details</h3>
                  <dl
</> className="text-sm">
                    <div className="flex justify-between py-1"><>

                      <dt className="text-muted-foreground">Category:</dt>
                      <dd
</>>
                        <Badge variant="outline">{selectedPhoto?.category}</Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between py-1"><>

                      <dt className="text-muted-foreground">Added:</dt>
                      <dd
</>>
                        {selectedPhoto?.createdAt ? formatDate(selectedPhoto.createdAt) : "Unknown"}
                      </dd>
                    </div>
                    {selectedPhoto?.viewpoint && (
                      <div className="flex justify-between py-1"><>

                        <dt className="text-muted-foreground">Viewpoint:</dt>
                        <dd
</>>{selectedPhoto.viewpoint}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="md:col-span-2 space-y-2"><>

                  <h3 className="text-sm font-medium">Description</h3>
                  <p
</> className="text-sm text-muted-foreground">
                    {selectedPhoto?.description || "No description provided."}
                  </p>

                  {selectedPhoto?.tags && (
                    <div className="mt-2 pt-2 border-t"><>

                      <h3 className="text-sm font-medium mb-1">Tags</h3>
                      <div
</> className="flex flex-wrap gap-1">
                        {selectedPhoto.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><>

            <DialogTitle>Upload New Photo</DialogTitle>
            <DialogDescription
</>>Add a new photo to your appraisal report</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="relative aspect-video">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="h-full w-full object-contain rounded-md"
                  />
                </div>
              ) : (
                <>
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to select an image or drag and drop
                  </p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {uploadedImage && (
              <Form {...uploadForm}>
                <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                  <FormField
                    control={uploadForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Title</FormLabel>
                        <FormControl
</>><>

                          <Input placeholder="Front elevation" {...field} />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={uploadForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Description</FormLabel>
                        <FormControl
</>><>

                          <Textarea
                            placeholder="Enter a description of the photo"
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
                      control={uploadForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Category</FormLabel>
                          <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="exterior">Exterior</SelectItem>
                              <SelectItem
</> value="interior">Interior</SelectItem><>

                              <SelectItem value="site">Site</SelectItem>
                              <SelectItem
</> value="street">Street</SelectItem><>

                              <SelectItem value="view">View</SelectItem>
                              <SelectItem
</> value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={uploadForm.control}
                      name="viewpoint"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Viewpoint</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="e.g. North" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={uploadForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Tags</FormLabel>
                        <FormControl
</>><>

                          <Input placeholder="renovation, updated, kitchen" {...field} />
                        </FormControl>
                        <FormDescription
</>>Separate tags with commas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter><>

                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
</> type="submit" disabled={uploadPhotoMutation.isPending}>
                      {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader><>

            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription
</>>Update photo information</DialogDescription>
          </DialogHeader>

          {editingPhoto && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="aspect-video bg-muted/50 rounded-md overflow-hidden mb-4"><>

                  <img
                    src={editingPhoto.imageUrl || getPlaceholderImage(editingPhoto.category)}
                    alt={editingPhoto.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <FormField
</>
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Title</FormLabel>
                      <FormControl
</>><>

                        <Input {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Description</FormLabel>
                      <FormControl
</>><>

                        <Textarea {...field} value={field.value || ""} className="resize-none" />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Category</FormLabel>
                        <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent><>

                            <SelectItem value="exterior">Exterior</SelectItem>
                            <SelectItem
</> value="interior">Interior</SelectItem><>

                            <SelectItem value="site">Site</SelectItem>
                            <SelectItem
</> value="street">Street</SelectItem><>

                            <SelectItem value="view">View</SelectItem>
                            <SelectItem
</> value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="viewpoint"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Viewpoint</FormLabel>
                        <FormControl
</>><>

                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Tags</FormLabel>
                      <FormControl
</>><>

                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription
</>>Separate tags with commas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter><>

                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
</> type="submit" disabled={updatePhotoMutation.isPending}>
                    {updatePhotoMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
