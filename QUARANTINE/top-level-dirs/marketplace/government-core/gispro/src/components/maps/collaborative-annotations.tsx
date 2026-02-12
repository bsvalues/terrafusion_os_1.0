import { useState, useEffect, useRef } from 'react';
import { Map as MapboxMap } from 'mapbox-gl';
import { 
  useCollaborativeAnnotations, 
  AnnotationType
} from '@/hooks/use-collaborative-annotations';
import { ConnectionStatusEnum } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, 
  MessageSquare, 
  Image as ImageIcon, 
  Ruler, 
  Edit2, 
  Trash2, 
  Warning,
  CheckCircle,
  Loader2
 } from '@mui/icons-material';
import { toast } from '@/hooks/use-toast';

interface CollaborativeAnnotationsProps {
  map: MapboxMap;
  roomId: string;
  className?: string;
}

export function CollaborativeAnnotations({ map, roomId, className = '' }: CollaborativeAnnotationsProps) {
  // Get annotations functionality
  const { 
    annotations, 
    createAnnotation, 
    updateAnnotation, 
    deleteAnnotation,
    connectionStatus
  } = useCollaborativeAnnotations(roomId);
  
  // State for the annotation being created
  const [isCreating, setIsCreating] = useState(false);
  const [creatingType, setCreatingType] = useState<AnnotationType>(AnnotationType.TEXT);
  const [annotationText, setAnnotationText] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
  // Ref to track map click listeners
  const mapListenerActive = useRef(false);
  
  // Clear creation mode if connection is lost
  useEffect(() => {
    if (connectionStatus !== ConnectionStatusEnum.CONNECTED && isCreating) {
      setIsCreating(false);
      mapListenerActive.current = false;
      
      toast({
        title: "Annotation creation canceled",
        description: "Lost connection to collaboration server",
        variant: "destructive"
      });
      
      // Remove the click listener if it exists
      if (map && mapListenerActive.current) {
        map.off('click', handleMapClick);
        mapListenerActive.current = false;
      }
    }
  }, [connectionStatus, isCreating, map]);
  
  // Clean up map listeners on unmount
  useEffect(() => {
    return () => {
      if (map && mapListenerActive.current) {
        map.off('click', handleMapClick);
      }
    };
  }, [map]);
  
  // Handle starting annotation creation
  const startCreatingAnnotation = (type: AnnotationType) => {
    if (connectionStatus !== ConnectionStatusEnum.CONNECTED) {
      toast({
        title: "Cannot create annotation",
        description: "No connection to collaboration server",
        variant: "destructive"
      });
      return;
    }
    
    setCreatingType(type);
    setIsCreating(true);
    setAnnotationText('');
    
    // Set cursor to show user they can place an annotation
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
      
      // Add click listener if not already added
      if (!mapListenerActive.current) {
        map.on('click', handleMapClick);
        mapListenerActive.current = true;
      }
    }
    
    toast({
      title: `Creating ${type} annotation`,
      description: "Click on the map to place your annotation",
    });
  };
  
  // Handle canceling annotation creation
  const cancelCreatingAnnotation = () => {
    setIsCreating(false);
    setAnnotationText('');
    
    // Reset cursor
    if (map) {
      map.getCanvas().style.cursor = '';
      
      // Remove click listener
      if (mapListenerActive.current) {
        map.off('click', handleMapClick);
        mapListenerActive.current = false;
      }
    }
  };
  
  // Handle map click for placing annotations
  const handleMapClick = (e: any) => {
    if (!isCreating || !map) return;
    
    const position = {
      lat: e.lngLat.lat,
      lng: e.lngLat.lng
    };
    
    // For text annotations, prompt for text content
    if (creatingType === AnnotationType.TEXT) {
      // Use input value rather than prompting
      if (!annotationText.trim()) {
        toast({
          title: "Text required",
          description: "Please enter text for your annotation",
          variant: "destructive"
        });
        return;
      }
      
      // Create the annotation
      const annotation = createAnnotation({
        type: creatingType,
        position,
        content: annotationText,
        styling: {
          color: '#3b82f6', // Default blue
          fontSize: 14
        }
      });
      
      // Reset state
      setAnnotationText('');
      setIsCreating(false);
      
      // Remove click listener and reset cursor
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
      mapListenerActive.current = false;
      
      toast({
        title: "Annotation created",
        description: "Your text annotation has been added",
      });
    } 
    // For marker annotations, no need for additional text
    else if (creatingType === AnnotationType.MARKER) {
      createAnnotation({
        type: creatingType,
        position,
        content: "Location marker",
        styling: {
          color: '#ef4444', // Default red for markers
          size: 'medium'
        }
      });
      
      // Keep creation mode active for multiple markers
      toast({
        title: "Marker added",
        description: "Click again to add another marker, or cancel to finish",
      });
    }
    // For measurement annotations 
    else if (creatingType === AnnotationType.MEASUREMENT) {
      // In a full implementation, this would start a measurement sequence
      createAnnotation({
        type: creatingType,
        position,
        content: "Measurement point",
        styling: {
          color: '#8b5cf6', // Purple for measurements
          lineWidth: 2
        }
      });
      
      toast({
        title: "Measurement point added",
        description: "Click again to complete the measurement, or cancel to finish",
      });
    }
    // For image annotations
    else if (creatingType === AnnotationType.IMAGE) {
      // In a full implementation, this would prompt for image upload
      createAnnotation({
        type: creatingType,
        position,
        content: "Image placeholder",
        styling: {
          width: 200,
          height: 150
        }
      });
      
      setIsCreating(false);
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
      mapListenerActive.current = false;
      
      toast({
        title: "Image placeholder added",
        description: "In a full implementation, this would allow image upload",
      });
    }
  };
  
  // Handle editing annotation
  const startEditingAnnotation = (id: string) => {
    const annotation = annotations.find(a => a.id === id);
    if (!annotation) return;
    
    setSelectedAnnotation(id);
    setEditingContent(annotation.content);
  };
  
  // Save edited annotation
  const saveEditedAnnotation = () => {
    if (!selectedAnnotation) return;
    
    updateAnnotation(selectedAnnotation, {
      content: editingContent
    });
    
    setSelectedAnnotation(null);
    setEditingContent('');
    
    toast({
      title: "Annotation updated",
      description: "Your changes have been saved and shared",
    });
  };
  
  // Cancel editing annotation
  const cancelEditingAnnotation = () => {
    setSelectedAnnotation(null);
    setEditingContent('');
  };
  
  // Handle deleting annotation
  const handleDeleteAnnotation = (id: string) => {
    deleteAnnotation(id);
    
    if (selectedAnnotation === id) {
      setSelectedAnnotation(null);
      setEditingContent('');
    }
    
    toast({
      title: "Annotation deleted",
      description: "The annotation has been removed",
    });
  };
  
  // Focus map on annotation
  const focusOnAnnotation = (annotation: any) => {
    if (!map) return;
    
    map.flyTo({
      center: [annotation.position.lng, annotation.position.lat],
      zoom: 14,
      essential: true
    });
  };
  
  // Get icon for annotation type
  const getAnnotationIcon = (type: AnnotationType) => {
    switch (type) {
      case AnnotationType.TEXT:
        return <MessageSquare className="h-4 w-4" />;
      case AnnotationType.MARKER:
        return <MapPin className="h-4 w-4" />;
      case AnnotationType.IMAGE:
        return <ImageIcon className="h-4 w-4" />;
      case AnnotationType.MEASUREMENT:
        return <Ruler className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Get connection status display
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case ConnectionStatusEnum.CONNECTED:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Connected</span>
          </Badge>
        );
      case ConnectionStatusEnum.CONNECTING:
      case ConnectionStatusEnum.RECONNECTING:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
            <span>Connecting...</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-destructive">
            <Warning className="h-3 w-3" />
            <span>Disconnected</span>
          </Badge>
        );
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold">Map Annotations</h3>
        {getConnectionStatus()}
      </div>
      
      {/* Creation tools */}
      <Card className="mb-2">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm">Add Annotation</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-1">
            <Button 
              onClick={() => startCreatingAnnotation(AnnotationType.TEXT)} 
              variant="outline" 
              size="sm"
              disabled={isCreating || connectionStatus !== ConnectionStatusEnum.CONNECTED}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Text</span>
            </Button>
            
            <Button 
              onClick={() => startCreatingAnnotation(AnnotationType.MARKER)} 
              variant="outline" 
              size="sm"
              disabled={isCreating || connectionStatus !== ConnectionStatusEnum.CONNECTED}
              className="flex items-center gap-1"
            >
              <MapPin className="h-4 w-4" />
              <span>Marker</span>
            </Button>
            
            <Button 
              onClick={() => startCreatingAnnotation(AnnotationType.MEASUREMENT)} 
              variant="outline" 
              size="sm"
              disabled={isCreating || connectionStatus !== ConnectionStatusEnum.CONNECTED}
              className="flex items-center gap-1"
            >
              <Ruler className="h-4 w-4" />
              <span>Measure</span>
            </Button>
            
            <Button 
              onClick={() => startCreatingAnnotation(AnnotationType.IMAGE)} 
              variant="outline" 
              size="sm"
              disabled={isCreating || connectionStatus !== ConnectionStatusEnum.CONNECTED}
              className="flex items-center gap-1"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Image</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Text input for annotations */}
      {isCreating && creatingType === AnnotationType.TEXT && (
        <Card className="mb-2">
          <CardContent className="p-2">
            <div className="flex flex-col space-y-2">
              <Textarea
                placeholder="Enter annotation text..."
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                className="w-full text-sm"
                rows={2}
              />
              <div className="flex justify-end space-x-1"><>

                <Button 
                  onClick={cancelCreatingAnnotation} 
                  variant="ghost" 
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
</>

                  disabled={!annotationText.trim()} 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <span>Click map to place</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cancel button for other annotation types */}
      {isCreating && creatingType !== AnnotationType.TEXT && (
        <Card className="mb-2">
          <CardContent className="p-2">
            <div className="flex justify-between items-center"><>

              <span className="text-sm">Click on the map to place the annotation</span>
              <Button
</>

                onClick={cancelCreatingAnnotation} 
                variant="ghost" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* List of annotations */}
      <ScrollArea className="flex-1 border rounded-md p-2">
        {annotations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No annotations added yet
          </div>
        ) : (
          <div className="space-y-1">
            {annotations.map(annotation => (
              <div 
                key={annotation.id} 
                className={`border rounded-md p-2 text-sm ${selectedAnnotation === annotation.id ? 'border-primary' : ''}`}
              >
                {selectedAnnotation === annotation.id ? (
                  // Editing UI
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full text-sm"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-1"><>

                      <Button 
                        onClick={cancelEditingAnnotation} 
                        variant="ghost" 
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
</>

                        onClick={saveEditedAnnotation} 
                        variant="default" 
                        size="sm"
                        disabled={!editingContent.trim() || connectionStatus !== ConnectionStatusEnum.CONNECTED}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View UI
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant="outline" className="flex items-center gap-1 px-1">
                            {getAnnotationIcon(annotation.type)}
                            <span className="text-xs capitalize">
                              {annotation.type}
                            </span>
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(annotation.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{annotation.content}</p>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          onClick={() => focusOnAnnotation(annotation)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                        ><>

                          <MapPin className="h-3 w-3" />
                        </Button>
                        <Button
</>

                          onClick={() => startEditingAnnotation(annotation.id)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={connectionStatus !== ConnectionStatusEnum.CONNECTED}
                        ><>

                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
</>

                          onClick={() => handleDeleteAnnotation(annotation.id)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          disabled={connectionStatus !== ConnectionStatusEnum.CONNECTED}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}