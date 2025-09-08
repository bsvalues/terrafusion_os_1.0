import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  MapPin, 
  FileText, 
  Search, 
  Brain, 
  Target, 
  AlertCircle,
  CheckCircle,
  Clock,
  Compass,
  Ruler,
  MapIcon,
  Layers,
  RefreshCw,
  Download,
  Share2,
  Eye,
  BarChart3
} from 'lucide-react';

// Mock legal description parser results
interface ParsedLegalDescription {
  segments: Array<{
    id: string;
    type: 'section' | 'township' | 'range' | 'quarter' | 'direction' | 'distance' | 'bearing';
    content: string;
    coordinates?: { lat: number; lng: number };
    confidence: number;
    validated: boolean;
  }>;
  points: Array<{
    id: string;
    type: 'corner' | 'monument' | 'reference';
    coordinates: { lat: number; lng: number };
    description: string;
    confidence: number;
  }>;
  polygon?: {
    vertices: Array<{ lat: number; lng: number }>;
    area: number;
    perimeter: number;
  };
  confidence: number;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    segment?: string;
  }>;
  metadata: {
    processingTime: number;
    method: string;
    version: string;
    lastUpdated: string;
  };
}

// Sample legal descriptions for demonstration
const sampleDescriptions = [
  `The North Half of the Southwest Quarter of Section 14, Township 23 North, Range 8 West of the Willamette Meridian, in Benton County, Oregon.`,
  
  `Beginning at the Northeast corner of Section 15, Township 12 South, Range 3 West; thence South 89°15'30" West along the North line of said Section 15 a distance of 1,320.50 feet; thence South 0°44'30" East parallel to the East line of said Section 15 a distance of 660.25 feet; thence North 89°15'30" East parallel to the North line of said Section 15 a distance of 1,320.50 feet to the East line of said Section 15; thence North 0°44'30" West along said East line a distance of 660.25 feet to the point of beginning.`,
  
  `Lot 1 of Block 3 of Mountain View Subdivision, as recorded in Plat Book 15, Page 42, Records of Benton County, Oregon.`,
  
  `That portion of the Southeast Quarter of the Northwest Quarter of Section 22, Township 11 South, Range 5 West, lying South of the centerline of Highway 20, containing approximately 18.5 acres, more or less.`
];

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

// Utility functions
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-600 bg-green-100';
  if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getSegmentTypeIcon = (type: string) => {
  switch (type) {
    case 'section': return <MapIcon className="h-3 w-3" />;
    case 'township': return <Compass className="h-3 w-3" />;
    case 'range': return <Ruler className="h-3 w-3" />;
    case 'quarter': return <Layers className="h-3 w-3" />;
    case 'direction': return <Compass className="h-3 w-3" />;
    case 'distance': return <Ruler className="h-3 w-3" />;
    case 'bearing': return <Target className="h-3 w-3" />;
    default: return <FileText className="h-3 w-3" />;
  }
};

// Mock parsing function
const parseLegalDescription = async (description: string): Promise<ParsedLegalDescription> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Mock parsing results based on description content
  const segments = [
    {
      id: '1',
      type: 'quarter' as const,
      content: 'North Half of the Southwest Quarter',
      confidence: 0.95,
      validated: true
    },
    {
      id: '2',
      type: 'section' as const,
      content: 'Section 14',
      coordinates: { lat: 44.5646, lng: -123.2620 },
      confidence: 0.98,
      validated: true
    },
    {
      id: '3',
      type: 'township' as const,
      content: 'Township 23 North',
      confidence: 0.92,
      validated: true
    },
    {
      id: '4',
      type: 'range' as const,
      content: 'Range 8 West',
      confidence: 0.94,
      validated: true
    }
  ];

  const points = [
    {
      id: 'p1',
      type: 'corner' as const,
      coordinates: { lat: 44.5646, lng: -123.2620 },
      description: 'Northeast Corner',
      confidence: 0.96
    },
    {
      id: 'p2',
      type: 'corner' as const,
      coordinates: { lat: 44.5646, lng: -123.2720 },
      description: 'Northwest Corner',
      confidence: 0.94
    },
    {
      id: 'p3',
      type: 'corner' as const,
      coordinates: { lat: 44.5546, lng: -123.2720 },
      description: 'Southwest Corner',
      confidence: 0.91
    },
    {
      id: 'p4',
      type: 'corner' as const,
      coordinates: { lat: 44.5546, lng: -123.2620 },
      description: 'Southeast Corner',
      confidence: 0.93
    }
  ];

  const polygon = {
    vertices: points.map(p => p.coordinates),
    area: 160.5, // acres
    perimeter: 5280.0 // feet
  };

  const issues = description.length < 50 ? [
    {
      type: 'warning' as const,
      message: 'Description may be incomplete - consider adding more detail'
    }
  ] : [];

  const confidence = segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length;

  return {
    segments,
    points,
    polygon,
    confidence,
    issues,
    metadata: {
      processingTime: 2000 + Math.random() * 3000,
      method: 'AI-Enhanced PLSS Parser v2.1',
      version: '2.1.0',
      lastUpdated: new Date().toISOString()
    }
  };
};

export default function LegalDescriptionDemo() {
  const [description, setDescription] = useState(sampleDescriptions[0]);
  const [parsedResult, setParsedResult] = useState<ParsedLegalDescription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState(0);

  // Auto-parse when description changes (with debounce)
  useEffect(() => {
    if (!description.trim()) {
      setParsedResult(null);
      return;
    }

    const timeout = setTimeout(() => {
      handleParse();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [description]);

  const handleParse = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await parseLegalDescription(description);
      setParsedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse legal description');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (index: number) => {
    setSelectedSample(index);
    setDescription(sampleDescriptions[index]);
  };

  const exportResults = () => {
    if (!parsedResult) return;
    
    const data = {
      description,
      ...parsedResult,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal-description-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Legal Description Parser & Analysis
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Advanced AI-powered parsing and visualization of legal property descriptions 
          with PLSS (Public Land Survey System) integration and coordinate extraction.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Legal Description Input</CardTitle>
              </div>
              <CardDescription>
                Enter a legal property description to parse and analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Legal Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter legal description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="text-xs text-muted-foreground">
                  {description.length} characters
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleParse}
                  disabled={isLoading || !description.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Parsing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Parse Description
                    </div>
                  )}
                </Button>
                
                {parsedResult && (
                  <Button onClick={exportResults} variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Sample Descriptions */}
              <div className="space-y-2">
                <Label>Sample Descriptions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {sampleDescriptions.map((_, index) => (
                    <Button
                      key={index}
                      variant={selectedSample === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => loadSample(index)}
                      className="text-xs"
                    >
                      Sample {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {(isLoading || parsedResult) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Processing Description</span>
                      </div>
                      <Progress value={65} className="w-full" />
                      <div className="text-sm text-muted-foreground">
                        Analyzing PLSS components and extracting coordinates...
                      </div>
                    </div>
                  ) : parsedResult && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Analysis Complete</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">Segments:</span>
                          <span className="font-medium">{parsedResult.segments.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Points:</span>
                          <span className="font-medium">{parsedResult.points.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-muted-foreground">Confidence:</span>
                          <Badge className={getConfidenceColor(parsedResult.confidence)}>
                            {Math.round(parsedResult.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapIcon className="h-4 w-4 text-orange-600" />
                          <span className="text-muted-foreground">Polygon:</span>
                          <span className="font-medium">{parsedResult.polygon ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      
                      {parsedResult.issues && parsedResult.issues.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                            <AlertCircle className="h-4 w-4" />
                            Analysis Issues
                          </div>
                          <ul className="text-sm text-amber-700 space-y-1">
                            {parsedResult.issues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                                {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        <motion.div 
          className="lg:col-span-2"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {parsedResult ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="segments">Segments</TabsTrigger>
                <TabsTrigger value="coordinates">Coordinates</TabsTrigger>
                <TabsTrigger value="json">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analysis Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Statistics Grid */}
                    <motion.div 
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div variants={itemVariants} className="text-center p-4 bg-blue-50 rounded-lg">
                        <Layers className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-blue-900">{parsedResult.segments.length}</div>
                        <div className="text-sm text-blue-700">Segments</div>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="text-center p-4 bg-green-50 rounded-lg">
                        <MapPin className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-900">{parsedResult.points.length}</div>
                        <div className="text-sm text-green-700">Control Points</div>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="text-center p-4 bg-purple-50 rounded-lg">
                        <Target className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-purple-900">
                          {Math.round(parsedResult.confidence * 100)}%
                        </div>
                        <div className="text-sm text-purple-700">Confidence</div>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="text-center p-4 bg-orange-50 rounded-lg">
                        <Clock className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                        <div className="text-2xl font-bold text-orange-900">
                          {Math.round(parsedResult.metadata.processingTime / 1000)}s
                        </div>
                        <div className="text-sm text-orange-700">Processing Time</div>
                      </motion.div>
                    </motion.div>

                    {/* Polygon Information */}
                    {parsedResult.polygon && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapIcon className="h-4 w-4" />
                          Property Boundary
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Area:</span>
                            <span className="ml-2 font-medium">{parsedResult.polygon.area} acres</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Perimeter:</span>
                            <span className="ml-2 font-medium">{parsedResult.polygon.perimeter.toLocaleString()} feet</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vertices:</span>
                            <span className="ml-2 font-medium">{parsedResult.polygon.vertices.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Shape:</span>
                            <span className="ml-2 font-medium">
                              {parsedResult.polygon.vertices.length === 4 ? 'Quadrilateral' : 'Polygon'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Processing Metadata</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-medium">{parsedResult.metadata.method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span className="font-medium">{parsedResult.metadata.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="font-medium">
                            {new Date(parsedResult.metadata.lastUpdated).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="segments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Parsed Segments
                    </CardTitle>
                    <CardDescription>
                      Individual components extracted from the legal description
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="space-y-3"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {parsedResult.segments.map((segment, index) => (
                        <motion.div
                          key={segment.id}
                          variants={itemVariants}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getSegmentTypeIcon(segment.type)}
                              <span className="font-medium">{segment.content}</span>
                              <Badge variant="outline" className="text-xs">
                                {segment.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getConfidenceColor(segment.confidence)}>
                                {Math.round(segment.confidence * 100)}%
                              </Badge>
                              {segment.validated && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                          {segment.coordinates && (
                            <div className="text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {segment.coordinates.lat.toFixed(6)}, {segment.coordinates.lng.toFixed(6)}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coordinates">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Control Points & Coordinates
                    </CardTitle>
                    <CardDescription>
                      Extracted geographic coordinates and reference points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="space-y-3"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {parsedResult.points.map((point, index) => (
                        <motion.div
                          key={point.id}
                          variants={itemVariants}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{point.description}</span>
                              <Badge variant="outline" className="text-xs">
                                {point.type}
                              </Badge>
                            </div>
                            <Badge className={getConfidenceColor(point.confidence)}>
                              {Math.round(point.confidence * 100)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Latitude:</span>
                              <span className="ml-2 font-mono">{point.coordinates.lat.toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Longitude:</span>
                              <span className="ml-2 font-mono">{point.coordinates.lng.toFixed(6)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="json">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Raw JSON Data
                    </CardTitle>
                    <CardDescription>
                      Complete parsing results in JSON format
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(parsedResult, null, 2))}
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                        {JSON.stringify(parsedResult, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Parse</h3>
                <p className="text-muted-foreground">
                  Enter a legal description on the left to begin analysis
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
