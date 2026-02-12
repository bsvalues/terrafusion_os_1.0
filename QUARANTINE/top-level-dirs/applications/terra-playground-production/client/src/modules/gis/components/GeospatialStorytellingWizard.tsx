import { useState } from 'react';
import { useGIS } from '@/modules/gis/contexts/GISContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen,
  Check,
  MapPin,
  Sparkles,
  Route,
  Pencil,
  Image,
  BarChart4,
  Play,
  Share2,
  Layers,
 } from '@mui/icons-material';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the schema for the storytelling form
const storySchema = z.object({
  // Step 1: Story basics
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  coverImage: z.string().optional(),

  // Step 2: Map Settings
  baseMap: z.enum(['streets', 'satellite', 'terrain']).default('streets'),
  initialCenter: z.array(z.number()).length(2).default([-119.7, 46.2]),
  initialZoom: z.number().min(1).max(20).default(10),
  enableTerrainView: z.boolean().default(false),

  // Step 3: Story Points
  storyPoints: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        location: z.array(z.number()).length(2),
        mediaType: z.enum(['none', 'image', 'chart', 'video']).default('none'),
        mediaUrl: z.string().optional(),
        animationStyle: z.enum(['none', 'zoom', 'pan', 'fly']).default('none'),
      })
    )
    .default([]),

  // Step 4: Story Paths
  storyPaths: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        coordinates: z.array(z.array(z.number()).length(2)),
        style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
        color: z.string().default('#3b82f6'),
        width: z.number().min(1).max(10).default(3),
        animate: z.boolean().default(false),
      })
    )
    .default([]),

  // Step 5: Story Areas
  storyAreas: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        coordinates: z.array(z.array(z.array(z.number()).length(2))),
        fillColor: z.string().default('#3b82f680'),
        borderColor: z.string().default('#3b82f6'),
        highlight: z.boolean().default(false),
      })
    )
    .default([]),

  // Step 6: Story Settings
  autoPlay: z.boolean().default(false),
  loopStory: z.boolean().default(false),
  transitionDuration: z.number().min(0.5).max(10).default(2),
  showControls: z.boolean().default(true),
  allowInteraction: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'custom']).default('light'),
  customThemeColor: z.string().optional(),
});

type StoryFormType = z.infer<typeof storySchema>;

// Placeholder basemap options
const baseMaps = [
  { id: 'streets', name: 'Streets' },
  { id: 'satellite', name: 'Satellite' },
  { id: 'terrain', name: 'Terrain' },
];

// Animation styles for story points
const animationStyles = [
  { id: 'none', name: 'None' },
  { id: 'zoom', name: 'Zoom In/Out' },
  { id: 'pan', name: 'Pan' },
  { id: 'fly', name: 'Fly To' },
];

// Media types for story points
const mediaTypes = [
  { id: 'none', name: 'No Media' },
  { id: 'image', name: 'Image' },
  { id: 'chart', name: 'Chart/Graph' },
  { id: 'video', name: 'Video' },
];

// Path styles for story lines
const pathStyles = [
  { id: 'solid', name: 'Solid Line' },
  { id: 'dashed', name: 'Dashed Line' },
  { id: 'dotted', name: 'Dotted Line' },
];

// Theme options
const themeOptions = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'custom', name: 'Custom' },
];

/**
 * GeospatialStorytellingWizard Component
 *
 * A wizard interface for creating interactive, map-based data stories
 * with narration, waypoints, and multimedia elements.
 */
export default function GeospatialStorytellingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { isMapLoaded } = useGIS();
  const { toast } = useToast();

  const form = useForm<StoryFormType>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: '',
      description: '',
      baseMap: 'streets',
      initialCenter: [-119.7, 46.2],
      initialZoom: 10,
      enableTerrainView: false,
      storyPoints: [],
      storyPaths: [],
      storyAreas: [],
      autoPlay: false,
      loopStory: false,
      transitionDuration: 2,
      showControls: true,
      allowInteraction: true,
      theme: 'light',
    },
  });

  const steps = [
    { id: 'basics', title: 'Story Basics', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'map', title: 'Map Settings', icon: <Layers className="h-4 w-4" /> },
    { id: 'points', title: 'Story Points', icon: <MapPin className="h-4 w-4" /> },
    { id: 'paths', title: 'Story Paths', icon: <Route className="h-4 w-4" /> },
    { id: 'styling', title: 'Styling', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'publish', title: 'Preview & Publish', icon: <Share2 className="h-4 w-4" /> },
  ];

  // Create a new story point
  const addStoryPoint = () => {
    const currentPoints = form.getValues('storyPoints') || [];
    const newPoint = {
      id: `point-${Date.now()}`,
      title: `Story Point ${currentPoints.length + 1}`,
      description: 'Click to add description',
      location: [-119.7, 46.2], // Default location - would be current map center in real implementation
      mediaType: 'none' as const,
      animationStyle: 'none' as const,
    };

    form.setValue('storyPoints', [...currentPoints, newPoint]);
  };

  // Create a new story path
  const addStoryPath = () => {
    const currentPaths = form.getValues('storyPaths') || [];
    const newPath = {
      id: `path-${Date.now()}`,
      title: `Story Path ${currentPaths.length + 1}`,
      description: 'Click to add description',
      coordinates: [
        [-119.7, 46.2],
        [-119.6, 46.3],
      ], // Default coordinates - would be drawn by user in real implementation
      style: 'solid' as const,
      color: '#3b82f6',
      width: 3,
      animate: false,
    };

    form.setValue('storyPaths', [...currentPaths, newPath]);
  };

  // Create a new story area
  const addStoryArea = () => {
    const currentAreas = form.getValues('storyAreas') || [];
    const newArea = {
      id: `area-${Date.now()}`,
      title: `Story Area ${currentAreas.length + 1}`,
      description: 'Click to add description',
      coordinates: [
        [
          [-119.7, 46.2],
          [-119.6, 46.2],
          [-119.6, 46.3],
          [-119.7, 46.3],
          [-119.7, 46.2],
        ],
      ], // Default polygon - would be drawn by user in real implementation
      fillColor: '#3b82f680',
      borderColor: '#3b82f6',
      highlight: false,
    };

    form.setValue('storyAreas', [...currentAreas, newArea]);
  };

  // Remove a story point
  const removeStoryPoint = (pointId: string) => {
    const currentPoints = form.getValues('storyPoints') || [];
    form.setValue(
      'storyPoints',
      currentPoints.filter(point => point.id !== pointId)
    );
  };

  // Remove a story path
  const removeStoryPath = (pathId: string) => {
    const currentPaths = form.getValues('storyPaths') || [];
    form.setValue(
      'storyPaths',
      currentPaths.filter(path => path.id !== pathId)
    );
  };

  // Remove a story area
  const removeStoryArea = (areaId: string) => {
    const currentAreas = form.getValues('storyAreas') || [];
    form.setValue(
      'storyAreas',
      currentAreas.filter(area => area.id !== areaId)
    );
  };

  // Handle form submission
  const onSubmit = async (data: StoryFormType) => {
    setIsCreating(true);

    try {
      // In a real implementation, this would send the data to a backend API
      // to create and store the story

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: 'Story Created Successfully',
        description: `Your story "${data.title}" has been created and published.`,
        variant: 'default',
      });

      // Close the dialog
      setIsOpen(false);
      setCurrentStep(0);
      form.reset();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Failed to Create Story',
        description: 'There was an error creating your geospatial story. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    // Validate the current step before moving to the next
    const fieldsToValidate: Record<number, (keyof StoryFormType)[]> = {
      0: ['title', 'description'],
      1: ['baseMap', 'initialCenter', 'initialZoom'],
      2: [], // Story points are optional
      3: [], // Story paths are optional
      4: ['theme'],
      5: [], // Final step, no validation needed
    };

    const currentFields = fieldsToValidate[currentStep];
    const isValid = currentFields.length ? await form.trigger(currentFields as any) : true;

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Render step 1: Story Basics
  const renderStoryBasics = () => {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem><>

              <FormLabel>Story Title</FormLabel>
              <FormControl
</>><>

                <Input placeholder="Enter a title for your story" {...field} />
              </FormControl>
              <FormDescription
</>>
                A compelling title that describes your geospatial data story
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem><>

              <FormLabel>Story Description</FormLabel>
              <FormControl
</>><>

                <Textarea
                  placeholder="Enter a description for your story"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription
</>>
                A brief overview of what your story will cover and its purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem><>

              <FormLabel>Cover Image URL (Optional)</FormLabel>
              <FormControl
</>><>

                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormDescription
</>>
                An optional image URL to use as the cover for your story
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  // Render step 2: Map Settings
  const renderMapSettings = () => {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="baseMap"
          render={({ field }) => (
            <FormItem><>

              <FormLabel>Base Map Style</FormLabel>
              <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a base map style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {baseMaps.map(baseMap => (
                    <SelectItem key={baseMap.id} value={baseMap.id}>
                      {baseMap.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select><>

              <FormDescription>
                The map style that will be used as the foundation for your story
              </FormDescription>
              <FormMessage
</> />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initialZoom"
            render={({ field }) => (
              <FormItem><>

                <FormLabel>Initial Zoom Level</FormLabel>
                <FormControl
</>><>

                  <Input
                    type="number"
                    min={1}
                    max={20}
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription
</>>Zoom level when the story starts (1-20)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableTerrainView"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                <FormControl><>

                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div
</> className="space-y-1 leading-none"><>

                  <FormLabel>Enable 3D Terrain</FormLabel>
                  <FormDescription
</>>Show terrain in 3D when available</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div><>

          <FormLabel>Initial Map Center</FormLabel>
          <FormDescription
</> className="mb-2">
            The starting center point of the map (longitude, latitude)
          </FormDescription>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="initialCenter.0"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Longitude</FormLabel>
                  <FormControl
</>><>

                    <Input
                      type="number"
                      step="0.000001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage
</> />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialCenter.1"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Latitude</FormLabel>
                  <FormControl
</>><>

                    <Input
                      type="number"
                      step="0.000001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage
</> />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render step 3: Story Points
  const renderStoryPoints = () => {
    const storyPoints = form.watch('storyPoints') || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"><>

          <h3 className="text-lg font-medium">Story Points</h3>
          <Button
</> type="button" variant="outline" size="sm" onClick={addStoryPoint}>
            <MapPin className="h-4 w-4 mr-2" />
            Add Point
          </Button>
        </div>

        <FormDescription>
          Create points of interest on the map that tell parts of your story
        </FormDescription>

        {storyPoints.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-md">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No story points created yet. Add points to build your narrative.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {storyPoints.map((point /* , index */) => (
              <Card key={point.id} className="relative">
                <CardContent className="p-4">
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => removeStoryPoint(point.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center text-xs mr-2">
                        {index + 1}
                      </span>
                      {point.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {point.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><>

                      <span className="text-muted-foreground block">Location:</span>
                      <span
</>>{point.location.join(', ')}</span>
                    </div>
                    <div><>

                      <span className="text-muted-foreground block">Media:</span>
                      <span
</>>{mediaTypes.find(m => m.id === point.mediaType)?.name}</span>
                    </div>
                    <div><>

                      <span className="text-muted-foreground block">Animation:</span>
                      <span
</>>{animationStyles.find(a => a.id === point.animationStyle)?.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <FormDescription className="text-xs text-muted-foreground italic mt-2">
          In a real implementation, you would be able to click on the map to add points and
          configure their details through a form interface.
        </FormDescription>
      </div>
    );
  };

  // Render step 4: Story Paths
  const renderStoryPaths = () => {
    const storyPaths = form.watch('storyPaths') || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"><>

          <h3 className="text-lg font-medium">Story Paths</h3>
          <Button
</> type="button" variant="outline" size="sm" onClick={addStoryPath}>
            <Route className="h-4 w-4 mr-2" />
            Add Path
          </Button>
        </div>

        <FormDescription>
          Create paths on the map to show routes, trajectories, or connections
        </FormDescription>

        {storyPaths.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-md">
            <Route className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No story paths created yet. Add paths to show routes or connections.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {storyPaths.map((path /* , index */) => (
              <Card key={path.id} className="relative">
                <CardContent className="p-4">
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => removeStoryPath(path.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-sm font-medium flex items-center"><>

                      <Route className="h-4 w-4 mr-2" />
                      {path.title}
                    </h4>
                    <p
</> className="text-xs text-muted-foreground mt-1 truncate">
                      {path.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><>

                      <span className="text-muted-foreground block">Points:</span>
                      <span
</>>{path.coordinates.length} points</span>
                    </div>
                    <div><>

                      <span className="text-muted-foreground block">Style:</span>
                      <span
</>>{pathStyles.find(s => s.id === path.style)?.name}</span>
                    </div>
                    <div><>

                      <span className="text-muted-foreground block">Animated:</span>
                      <span
</>>{path.animate ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <FormDescription className="text-xs text-muted-foreground italic mt-2">
          In a real implementation, you would be able to draw paths on the map and configure their
          styling and animation properties.
        </FormDescription>
      </div>
    );
  };

  // Render step 5: Styling
  const renderStyling = () => {
    return (
      <div className="space-y-4"><>

        <h3 className="text-lg font-medium">Story Styling & Settings</h3>

        <FormDescription
</>>Configure how your story looks and behaves</FormDescription>

        <Tabs defaultValue="playback" className="w-full">
          <TabsList className="grid grid-cols-2"><>

            <TabsTrigger value="playback">Playback</TabsTrigger>
            <TabsTrigger
</> value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="playback" className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="autoPlay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><>

                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div
</> className="space-y-1 leading-none"><>

                    <FormLabel>Auto-Play Story</FormLabel>
                    <FormDescription
</>>
                      Automatically begin playback when the story loads
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loopStory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><>

                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div
</> className="space-y-1 leading-none"><>

                    <FormLabel>Loop Story</FormLabel>
                    <FormDescription
</>>
                      Restart the story from the beginning when it ends
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transitionDuration"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Transition Duration (seconds)</FormLabel>
                  <FormControl
</>><>

                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription
</>>
                    How long transitions between story points should take
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showControls"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><>

                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div
</> className="space-y-1 leading-none"><>

                    <FormLabel>Show Playback Controls</FormLabel>
                    <FormDescription
</>>
                      Display controls for navigating through the story
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="appearance" className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Story Theme</FormLabel>
                  <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {themeOptions.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select><>

                  <FormDescription>
                    The visual theme for your story controls and overlays
                  </FormDescription>
                  <FormMessage
</> />
                </FormItem>
              )}
            />

            {form.watch('theme') === 'custom' && (
              <FormField
                control={form.control}
                name="customThemeColor"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Custom Theme Color</FormLabel>
                    <FormControl
</>><>

                      <Input type="color" {...field} value={field.value || '#3b82f6'} />
                    </FormControl>
                    <FormDescription
</>>Select a primary color for your custom theme</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="allowInteraction"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><>

                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div
</> className="space-y-1 leading-none"><>

                    <FormLabel>Allow User Interaction</FormLabel>
                    <FormDescription
</>>
                      Let users pan and zoom the map during the story
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Render step 6: Preview & Publish
  const renderPreviewPublish = () => {
    const formData = form.getValues();

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"><>

          <h3 className="text-lg font-medium">Preview & Publish</h3>
          <Button
</> type="button" variant="outline" size="sm" onClick={togglePreview}>
            <Play className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>

        {previewMode ? (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

                <h3 className="text-xl font-bold">{formData.title}</h3>
                <p
</> className="max-w-md mx-auto text-sm text-muted-foreground mt-2">
                  {formData.description}
                </p>

                <div className="mt-6 text-sm text-muted-foreground"><>

                  <p>Story contains:</p>
                  <ul
</> className="flex justify-center space-x-6 mt-2">
                    <li className="flex items-center"><>

                      <MapPin className="h-4 w-4 mr-1" />
                      {formData.storyPoints.length} points
                    </li>
                    <li
</> className="flex items-center"><>

                      <Route className="h-4 w-4 mr-1" />
                      {formData.storyPaths.length} paths
                    </li>
                    <li
</> className="flex items-center">
                      <Layers className="h-4 w-4 mr-1" />
                      {formData.storyAreas.length} areas
                    </li>
                  </ul>
                </div>

                <Button type="button" className="mt-6" variant="secondary" onClick={togglePreview}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Return to Edit Mode
                </Button>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground italic">
              In a real implementation, this would show an interactive preview of your story with
              navigation controls and all configured map elements.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4"><>

                <h4 className="font-medium mb-2">Story Summary</h4>
                <div
</> className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>{' '}
                    <span className="font-medium">{formData.title}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Map:</span>{' '}
                    <span>{baseMaps.find(b => b.id === formData.baseMap)?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Story Points:</span>{' '}
                    <span>{formData.storyPoints.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Story Paths:</span>{' '}
                    <span>{formData.storyPaths.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Theme:</span>{' '}
                    <span>{themeOptions.find(t => t.id === formData.theme)?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto-Play:</span>{' '}
                    <span>{formData.autoPlay ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground"><>

              <p>
                Click "Preview" to see how your story will look, or "Create Story" to publish it.
              </p>
              <p
</> className="mt-1">
                Once published, you can embed the story on your website or share via URL.
              </p>
            </div>

            <FormField
              control={form.control}
              name="allowInteraction"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><>

                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div
</> className="space-y-1 leading-none"><>

                    <FormLabel>I confirm this story is ready to publish</FormLabel>
                    <FormDescription
</>>
                      The story will be publicly accessible once created
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStoryBasics();
      case 1:
        return renderMapSettings();
      case 2:
        return renderStoryPoints();
      case 3:
        return renderStoryPaths();
      case 4:
        return renderStyling();
      case 5:
        return renderPreviewPublish();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full mt-3 flex justify-start items-center"
          onClick={() => setIsOpen(true)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          <span className="text-xs">Create Data Story</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center"><>

            <BookOpen className="h-5 w-5 mr-2" />
            Create Geospatial Data Story
          </DialogTitle>
          <DialogDescription
</>>
            Build an interactive map-based narrative with data visualizations.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-4">
          <div className="flex justify-between">
            {steps.map((step /* , index */) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                    ${
                      index < currentStep
                        ? 'bg-primary text-white'
                        : index === currentStep
                          ? 'border-2 border-primary'
                          : 'border border-muted-foreground'
                    }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : step.icon}
                </div>
                <span className="text-xs">{step.title}</span>
              </div>
            ))}
          </div><>

          <Separator className="my-4" />
        </div>

        <Form
</> {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderCurrentStep()}
          </form>
        </Form>

        <DialogFooter className="flex justify-between items-center mt-4"><>

          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <Button
</> type="button" onClick={handleNext} disabled={isCreating}>
            {currentStep < steps.length - 1 ? 'Next' : isCreating ? 'Creating...' : 'Create Story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
