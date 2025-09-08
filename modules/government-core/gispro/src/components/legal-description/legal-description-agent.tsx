import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot,
  Brain,
  Search,
  FileText,
  MapPin,
  Compass,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Settings,
  History,
  Download,
  Upload,
  Edit,
  Save,
  RefreshCw,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Layers,
  Map,
  Ruler,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface LegalDescriptionQuery {
  id: string;
  text: string;
  type: 'parse' | 'validate' | 'convert' | 'analyze' | 'generate';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  result?: LegalDescriptionResult;
  confidence?: number;
  processingTime?: number;
}

interface LegalDescriptionResult {
  parsedElements: ParsedElement[];
  coordinates: Coordinate[];
  area: number;
  perimeter: number;
  centroid: { latitude: number; longitude: number };
  accuracy: number;
  warnings: string[];
  suggestions: string[];
  validationErrors: string[];
  alternativeFormats: AlternativeFormat[];
}

interface ParsedElement {
  id: string;
  type: 'section' | 'township' | 'range' | 'quarter' | 'lot' | 'block' | 'subdivision' | 'bearing' | 'distance';
  value: string;
  confidence: number;
  position: { start: number; end: number };
  validation: 'valid' | 'warning' | 'error';
  message?: string;
}

interface Coordinate {
  latitude: number;
  longitude: number;
  elevation?: number;
  accuracy?: number;
  type: 'corner' | 'curve' | 'intermediate';
}

interface AlternativeFormat {
  format: 'metes_bounds' | 'plss' | 'lot_block' | 'coordinate' | 'deed';
  description: string;
  confidence: number;
}

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'parsing' | 'validation' | 'conversion' | 'analysis' | 'generation';
  accuracy: number;
  speed: 'fast' | 'medium' | 'slow';
  complexity: 'basic' | 'advanced' | 'expert';
  available: boolean;
}

interface ProcessingStatus {
  stage: string;
  progress: number;
  message: string;
  eta?: number;
  details?: string[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
};

export default function LegalDescriptionAgent() {
  // State management
  const [inputText, setInputText] = useState('');
  const [queries, setQueries] = useState<LegalDescriptionQuery[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [agentSettings, setAgentSettings] = useState({
    autoValidate: true,
    generateCoordinates: true,
    includeWarnings: true,
    voiceEnabled: false,
    realTimeProcessing: false,
    confidenceThreshold: 0.8
  });
  const [isListening, setIsListening] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);

  // Agent capabilities
  const agentCapabilities: AgentCapability[] = [
    {
      id: 'plss-parser',
      name: 'PLSS Parser',
      description: 'Parse Public Land Survey System descriptions',
      category: 'parsing',
      accuracy: 0.95,
      speed: 'fast',
      complexity: 'advanced',
      available: true
    },
    {
      id: 'metes-bounds-parser',
      name: 'Metes & Bounds Parser',
      description: 'Parse metes and bounds legal descriptions',
      category: 'parsing',
      accuracy: 0.92,
      speed: 'medium',
      complexity: 'expert',
      available: true
    },
    {
      id: 'coordinate-generator',
      name: 'Coordinate Generator',
      description: 'Generate precise coordinates from legal descriptions',
      category: 'conversion',
      accuracy: 0.98,
      speed: 'medium',
      complexity: 'expert',
      available: true
    },
    {
      id: 'legal-validator',
      name: 'Legal Validator',
      description: 'Validate legal description accuracy and completeness',
      category: 'validation',
      accuracy: 0.94,
      speed: 'fast',
      complexity: 'advanced',
      available: true
    },
    {
      id: 'description-generator',
      name: 'Description Generator',
      description: 'Generate legal descriptions from coordinates or maps',
      category: 'generation',
      accuracy: 0.90,
      speed: 'slow',
      complexity: 'expert',
      available: true
    },
    {
      id: 'area-calculator',
      name: 'Area Calculator',
      description: 'Calculate area and perimeter from legal descriptions',
      category: 'analysis',
      accuracy: 0.99,
      speed: 'fast',
      complexity: 'basic',
      available: true
    }
  ];

  // Sample queries
  const sampleQueries: LegalDescriptionQuery[] = [
    {
      id: 'query-001',
      text: 'The North Half of the Southwest Quarter of Section 15, Township 2 North, Range 3 East, of the 6th Principal Meridian',
      type: 'parse',
      status: 'completed',
      timestamp: '2024-01-15T10:30:00Z',
      confidence: 0.96,
      processingTime: 1.2,
      result: {
        parsedElements: [
          {
            id: 'elem-001',
            type: 'quarter',
            value: 'North Half of Southwest Quarter',
            confidence: 0.98,
            position: { start: 4, end: 41 },
            validation: 'valid'
          },
          {
            id: 'elem-002',
            type: 'section',
            value: '15',
            confidence: 0.99,
            position: { start: 53, end: 55 },
            validation: 'valid'
          },
          {
            id: 'elem-003',
            type: 'township',
            value: '2 North',
            confidence: 0.97,
            position: { start: 66, end: 73 },
            validation: 'valid'
          }
        ],
        coordinates: [
          { latitude: 40.7128, longitude: -74.0060, type: 'corner' },
          { latitude: 40.7130, longitude: -74.0058, type: 'corner' },
          { latitude: 40.7132, longitude: -74.0062, type: 'corner' },
          { latitude: 40.7130, longitude: -74.0064, type: 'corner' }
        ],
        area: 80.5,
        perimeter: 2240.8,
        centroid: { latitude: 40.7130, longitude: -74.0061 },
        accuracy: 0.96,
        warnings: [],
        suggestions: ['Consider adding meridian reference for clarity'],
        validationErrors: [],
        alternativeFormats: [
          {
            format: 'coordinate',
            description: 'Polygon coordinates: (40.7128,-74.0060), (40.7130,-74.0058), ...',
            confidence: 0.96
          }
        ]
      }
    },
    {
      id: 'query-002',
      text: 'Beginning at the NE corner of Lot 5, Block 12, Riverside Subdivision; thence S 89°30\'15" W 150.00 feet; thence S 0°15\'30" E 200.00 feet...',
      type: 'parse',
      status: 'completed',
      timestamp: '2024-01-15T11:15:00Z',
      confidence: 0.89,
      processingTime: 2.8,
      result: {
        parsedElements: [
          {
            id: 'elem-004',
            type: 'lot',
            value: 'Lot 5',
            confidence: 0.99,
            position: { start: 27, end: 32 },
            validation: 'valid'
          },
          {
            id: 'elem-005',
            type: 'bearing',
            value: 'S 89°30\'15" W',
            confidence: 0.95,
            position: { start: 82, end: 95 },
            validation: 'valid'
          },
          {
            id: 'elem-006',
            type: 'distance',
            value: '150.00 feet',
            confidence: 0.98,
            position: { start: 96, end: 107 },
            validation: 'valid'
          }
        ],
        coordinates: [
          { latitude: 40.7200, longitude: -74.0100, type: 'corner' },
          { latitude: 40.7202, longitude: -74.0105, type: 'corner' },
          { latitude: 40.7198, longitude: -74.0108, type: 'corner' }
        ],
        area: 30.2,
        perimeter: 700.0,
        centroid: { latitude: 40.7200, longitude: -74.0104 },
        accuracy: 0.89,
        warnings: ['Incomplete description - missing closure'],
        suggestions: ['Add closing statement to complete boundary'],
        validationErrors: [],
        alternativeFormats: [
          {
            format: 'plss',
            description: 'Approximate PLSS equivalent: Part of Section 22, T2N, R3E',
            confidence: 0.75
          }
        ]
      }
    }
  ];

  // Initialize data
  useEffect(() => {
    setQueries(sampleQueries);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      
      speechRecognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [queries]);

  // Processing simulation
  const simulateProcessing = (queryId: string, stages: string[]) => {
    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProcessingStatus({
          stage: stages[currentStage],
          progress: ((currentStage + 1) / stages.length) * 100,
          message: `Processing: ${stages[currentStage]}`,
          eta: (stages.length - currentStage - 1) * 0.5,
          details: [`Step ${currentStage + 1} of ${stages.length}`, 'Using advanced NLP algorithms', 'Validating against legal standards']
        });
        currentStage++;
      } else {
        clearInterval(interval);
        setProcessingStatus(null);
        setIsProcessing(false);
        
        // Update query status
        setQueries(prev => prev.map(q => 
          q.id === queryId 
            ? { ...q, status: 'completed', confidence: 0.85 + Math.random() * 0.1, processingTime: 1.5 + Math.random() * 2 }
            : q
        ));
      }
    }, 500);
  };

  // Agent actions
  const handleSubmitQuery = () => {
    if (!inputText.trim() || isProcessing) return;

    const newQuery: LegalDescriptionQuery = {
      id: `query-${Date.now()}`,
      text: inputText,
      type: 'parse',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setQueries(prev => [newQuery, ...prev]);
    setIsProcessing(true);
    setInputText('');

    // Start processing simulation
    setTimeout(() => {
      setQueries(prev => prev.map(q => 
        q.id === newQuery.id ? { ...q, status: 'processing' } : q
      ));
      
      const stages = [
        'Text Analysis',
        'Pattern Recognition',
        'Legal Validation',
        'Coordinate Generation',
        'Quality Check'
      ];
      
      simulateProcessing(newQuery.id, stages);
    }, 1000);
  };

  const handleVoiceToggle = () => {
    if (!speechRecognition.current) return;

    if (isListening) {
      speechRecognition.current.stop();
      setIsListening(false);
    } else {
      speechRecognition.current.start();
      setIsListening(true);
    }
  };

  const handleRetryQuery = (queryId: string) => {
    setQueries(prev => prev.map(q => 
      q.id === queryId ? { ...q, status: 'pending' } : q
    ));

    setTimeout(() => {
      setQueries(prev => prev.map(q => 
        q.id === queryId ? { ...q, status: 'processing' } : q
      ));
      
      const stages = ['Retry Analysis', 'Enhanced Processing', 'Validation'];
      simulateProcessing(queryId, stages);
    }, 500);
  };

  const handleExportResults = (query: LegalDescriptionQuery) => {
    if (query.result) {
      const exportData = {
        query: query.text,
        timestamp: query.timestamp,
        result: query.result
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal-description-analysis-${query.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = (status: LegalDescriptionQuery['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: LegalDescriptionQuery['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div 
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground">
          Legal Description Agent
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          AI-powered legal description parsing, validation, and coordinate generation 
          with advanced natural language processing capabilities.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Bot className="h-3 w-3" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Brain className="h-3 w-3" />
            NLP Processing
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            High Accuracy
          </Badge>
        </div>
      </motion.div>

      {/* Main Interface */}
      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Console */}
          <div className="lg:col-span-3 space-y-6">
            {/* Input Interface */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Legal Description Agent
                    </CardTitle>
                    <CardDescription>
                      Enter or speak a legal description for analysis
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </Button>
                    
                    {agentSettings.voiceEnabled && (
                      <Button
                        variant={isListening ? "default" : "outline"}
                        size="sm"
                        onClick={handleVoiceToggle}
                        disabled={!speechRecognition.current}
                      >
                        {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter legal description (e.g., 'The North Half of the Southwest Quarter of Section 15, Township 2 North, Range 3 East...')"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  
                  {isListening && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Volume2 className="h-3 w-3" />
                      Listening... Speak your legal description
                    </div>
                  )}
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Processing Options</label>
                      <div className="space-y-1">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={agentSettings.autoValidate}
                            onChange={(e) => setAgentSettings(prev => ({
                              ...prev,
                              autoValidate: e.target.checked
                            }))}
                          />
                          <span>Auto-validate results</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={agentSettings.generateCoordinates}
                            onChange={(e) => setAgentSettings(prev => ({
                              ...prev,
                              generateCoordinates: e.target.checked
                            }))}
                          />
                          <span>Generate coordinates</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={agentSettings.includeWarnings}
                            onChange={(e) => setAgentSettings(prev => ({
                              ...prev,
                              includeWarnings: e.target.checked
                            }))}
                          />
                          <span>Include warnings</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Confidence Threshold: {agentSettings.confidenceThreshold}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.05"
                        value={agentSettings.confidenceThreshold}
                        onChange={(e) => setAgentSettings(prev => ({
                          ...prev,
                          confidenceThreshold: parseFloat(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitQuery}
                    disabled={!inputText.trim() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Analyze Description
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setInputText('')}>
                    Clear
                  </Button>
                </div>

                {processingStatus && (
                  <div className="space-y-2 p-3 border rounded bg-blue-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{processingStatus.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(processingStatus.progress)}%
                      </span>
                    </div>
                    <Progress value={processingStatus.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {processingStatus.message}
                      {processingStatus.eta && ` • ETA: ${processingStatus.eta.toFixed(1)}s`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Recent legal description analysis results and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96" ref={chatRef}>
                  {queries.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                      <p className="text-muted-foreground">
                        Enter a legal description above to start analyzing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {queries.map((query) => (
                          <motion.div
                            key={query.id}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(query.status)}
                                  <Badge variant="outline" className={getStatusColor(query.status)}>
                                    {query.status}
                                  </Badge>
                                  <Badge variant="outline">{query.type}</Badge>
                                  {query.confidence && (
                                    <Badge variant="outline" className={getConfidenceColor(query.confidence)}>
                                      {Math.round(query.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-sm bg-gray-50 p-2 rounded">
                                  {query.text}
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(query.timestamp), 'MMM d, yyyy h:mm a')}
                                  {query.processingTime && ` • Processed in ${query.processingTime.toFixed(1)}s`}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {query.result && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedQuery(selectedQuery === query.id ? null : query.id)}
                                    >
                                      {selectedQuery === query.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleExportResults(query)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                
                                {query.status === 'failed' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRetryQuery(query.id)}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {selectedQuery === query.id && query.result && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 border-t pt-3"
                              >
                                <Tabs defaultValue="elements" className="w-full">
                                  <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="elements">Elements</TabsTrigger>
                                    <TabsTrigger value="coordinates">Coordinates</TabsTrigger>
                                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                                    <TabsTrigger value="validation">Validation</TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="elements" className="space-y-2">
                                    {query.result.parsedElements.map((element) => (
                                      <div key={element.id} className="text-sm border rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{element.type}</span>
                                          <Badge variant="outline" className={getConfidenceColor(element.confidence)}>
                                            {Math.round(element.confidence * 100)}%
                                          </Badge>
                                        </div>
                                        <div className="text-muted-foreground">{element.value}</div>
                                        {element.message && (
                                          <div className="text-xs text-yellow-600 mt-1">{element.message}</div>
                                        )}
                                      </div>
                                    ))}
                                  </TabsContent>
                                  
                                  <TabsContent value="coordinates" className="space-y-2">
                                    <div className="text-sm">
                                      <div className="grid grid-cols-3 gap-2 font-medium border-b pb-1">
                                        <span>Latitude</span>
                                        <span>Longitude</span>
                                        <span>Type</span>
                                      </div>
                                      {query.result.coordinates.map((coord, index) => (
                                        <div key={index} className="grid grid-cols-3 gap-2 py-1">
                                          <span>{coord.latitude.toFixed(6)}</span>
                                          <span>{coord.longitude.toFixed(6)}</span>
                                          <span className="capitalize">{coord.type}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="metrics" className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Area:</span> {query.result.area} acres
                                      </div>
                                      <div>
                                        <span className="font-medium">Perimeter:</span> {query.result.perimeter} feet
                                      </div>
                                      <div>
                                        <span className="font-medium">Centroid:</span> {query.result.centroid.latitude.toFixed(6)}, {query.result.centroid.longitude.toFixed(6)}
                                      </div>
                                      <div>
                                        <span className="font-medium">Accuracy:</span> {Math.round(query.result.accuracy * 100)}%
                                      </div>
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="validation" className="space-y-2">
                                    {query.result.warnings.length > 0 && (
                                      <div>
                                        <span className="font-medium text-yellow-600">Warnings:</span>
                                        <ul className="text-sm list-disc list-inside">
                                          {query.result.warnings.map((warning, index) => (
                                            <li key={index} className="text-yellow-600">{warning}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {query.result.suggestions.length > 0 && (
                                      <div>
                                        <span className="font-medium text-blue-600">Suggestions:</span>
                                        <ul className="text-sm list-disc list-inside">
                                          {query.result.suggestions.map((suggestion, index) => (
                                            <li key={index} className="text-blue-600">{suggestion}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agent Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentCapabilities.map((capability) => (
                    <div
                      key={capability.id}
                      className={`p-2 border rounded text-xs ${
                        capability.available ? '' : 'opacity-50'
                      }`}
                    >
                      <div className="font-medium">{capability.name}</div>
                      <div className="text-muted-foreground mb-1">
                        {capability.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(capability.accuracy * 100)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {capability.speed}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice Input</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAgentSettings(prev => ({
                      ...prev,
                      voiceEnabled: !prev.voiceEnabled
                    }))}
                  >
                    {agentSettings.voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Processing</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAgentSettings(prev => ({
                      ...prev,
                      realTimeProcessing: !prev.realTimeProcessing
                    }))}
                  >
                    {agentSettings.realTimeProcessing ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Features Overview */}
      <motion.div variants={cardVariants}>
        <Alert className="border-cyan-200 bg-cyan-50">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Legal Description Agent:</strong> Advanced natural language processing for parsing 
            legal descriptions, PLSS and metes & bounds analysis, coordinate generation, validation, 
            voice input, and real-time processing with high accuracy results.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
