import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {motion, AnimatePresence, useSpring, useTransform} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {BrainIcon,
  ZapIcon,
  TargetIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  EyeIcon,
  EyeOffIcon,
  StarIcon,
  StarOffIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  RefreshCwIcon,
  SettingsIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SkipForwardIcon,
  SkipBackIcon,
  FastForwardIcon,
  RewindIcon,
  SearchIcon,
  FileTextIcon,
  FileIcon,
  FolderIcon,
  TagIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  UsersIcon,
  LayersIcon,
  DatabaseIcon,
  ServerIcon,
  CloudIcon,
  HardDriveIcon,
  CpuIcon,
  MemoryStickIcon,
  WifiIcon,
  NetworkIcon,
  ShieldIcon,
  LockIcon,
  UnlockIcon,
  KeyIcon,
  SecurityIcon,
  VerifiedIcon,
  BookmarkIcon,
  BookmarkOffIcon,
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  LinkIcon,
  ExternalLinkIcon,
  CopyIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  UndoIcon,
  RedoIcon,
  RotateCcwIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  MinimizeIcon,
  ExpandIcon,
  ShrinkIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,} from 'lucide-react';

interface ClassificationResult {id: string;
  label: string;
  confidence: number;
  probability: number;
  category: string;
  subcategory?: string;
  description?: string;
  metadata?: {
    modelName: string;
    modelVersion: string;
    timestamp: Date;
    processingTime: number;
    features: Record<string, any>;
    threshold: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;};
  evidence?: Array<{type: 'keyword' | 'phrase' | 'pattern' | 'semantic' | 'statistical';
    value: string;
    weight: number;
    position?: { start: number; end: number};
    context?: string;
    relevance: number;
  }>;
  alternatives?: Array<{label: string;
    confidence: number;
    reasoning?: string;}>;
  flags?: Array<{type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    code?: string;}>;
  validation?: {humanVerified?: boolean;
    verifiedBy?: string;
    verificationDate?: Date;
    feedback?: 'correct' | 'incorrect' | 'partial';
    notes?: string;};
}

interface ConfidenceMetrics {overall: number;
  reliability: number;
  consistency: number;
  coverage: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  uncertaintyScore: number;
  agreementScore: number;
  distributionEntropy: number;
  calibrationScore: number;}

interface ClassificationStats {totalDocuments: number;
  processedDocuments: number;
  successfulClassifications: number;
  failedClassifications: number;
  averageConfidence: number;
  medianConfidence: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  categoryDistribution: Record<string, number>;
  confidenceDistribution: number[];
  processingTimeStats: {
    average: number;
    median: number;
    min: number;
    max: number;};
  modelPerformance: Record<
    string,
    {accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      totalPredictions: number;}
  >;
}

interface ClassificationConfidenceCardProps {result: ClassificationResult;
  metrics?: ConfidenceMetrics;
  stats?: ClassificationStats;
  showDetails?: boolean;
  showEvidence?: boolean;
  showAlternatives?: boolean;
  showMetadata?: boolean;
  showValidation?: boolean;
  allowFeedback?: boolean;
  enableInteractiveFeatures?: boolean;
  confidenceThreshold?: {
    high: number;
    medium: number;
    low: number;};
  onValidate?: (
    result: ClassificationResult,
    feedback: 'correct' | 'incorrect' | 'partial',
    notes?: string
  ) => void;
  onReclassify?: (result: ClassificationResult) => void;
  onExplainPrediction?: (result: ClassificationResult) => void;
  onViewEvidence?: (evidence: ClassificationResult['evidence']) => void;
  onUpdateThreshold?: (threshold: number) => void;
  onExportResult?: (result: ClassificationResult) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ClassificationConfidenceCard: React.FC<ClassificationConfidenceCardProps> = ({result,
  metrics,
  stats,
  showDetails = true,
  showEvidence = true,
  showAlternatives = true,
  showMetadata = false,
  showValidation = true,
  allowFeedback = true,
  enableInteractiveFeatures = true,
  confidenceThreshold = { high: 0.8, medium: 0.6, low: 0.4},
  onValidate,
  onReclassify,
  onExplainPrediction,
  onViewEvidence,
  onUpdateThreshold,
  onExportResult,
  className = '',
  style,
}) => {const [activeTab, setActiveTab] = useState('classification');
  const [expandedEvidence, setExpandedEvidence] = useState<string[]>([]);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  // Get confidence level and styling
  const getConfidenceLevel = (confidence: number) =>{
    if (confidence >= confidenceThreshold.high) {
      return {
        level: 'high',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        progressColor: 'bg-green-500',};
    } else if (confidence >= confidenceThreshold.medium) {return {
        level: 'medium',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        progressColor: 'bg-yellow-500',};
    } else if (confidence >= confidenceThreshold.low) {return {
        level: 'low',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        progressColor: 'bg-orange-500',};
    } else {return {
        level: 'very-low',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        progressColor: 'bg-red-500',};
    }
  };

  // Get flag styling
  const getFlagStyling = (type: string, severity: string) => {const typeStyles = {
      warning: { icon: AlertTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-50'},
      error: {icon: AlertCircleIcon, color: 'text-red-600', bg: 'bg-red-50'},
      info: {icon: InfoIcon, color: 'text-blue-600', bg: 'bg-blue-50'},
      success: {icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50'},
    };

    const severityStyles = {low: 'border-l-2',
      medium: 'border-l-4',
      high: 'border-l-4 font-semibold',
      critical: 'border-l-4 font-bold animate-pulse',};

    return {...typeStyles[type as keyof typeof typeStyles],
      severity: severityStyles[severity as keyof typeof severityStyles],};
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format processing time
  const formatProcessingTime = (milliseconds: number) => {
    if (milliseconds< 1000) {
      return `${milliseconds.toFixed(0)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  };

  // Handle evidence expansion
  const toggleEvidence = (evidenceId: string) =>{setExpandedEvidence(prev =>
      prev.includes(evidenceId) ? prev.filter(id => id !== evidenceId) : [...prev, evidenceId]
    );};

  // Handle feedback submission
  const handleFeedbackSubmit = (feedback: 'correct' | 'incorrect' | 'partial') => {if (onValidate) {
      onValidate(result, feedback, feedbackNotes);}
    setFeedbackMode(false);
    setFeedbackNotes('');
  };

  // Animate progress bar on mount
  useEffect(() => {setAnimateProgress(true);}, []);

  const confidenceDisplay = getConfidenceLevel(result.confidence);

  // Animation variants
  const cardVariants = {hidden: { opacity: 0, y: 20, scale: 0.95},
    visible: {opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut'},
    },
  };

  const progressVariants = {hidden: { width: 0},
    visible: {
      width: `${result.confidence * 100}%`,
      transition: {duration: 1, delay: 0.2, ease: 'easeOut'},
    },
  };

  return (<motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`${className}`}
      style={style}
    ><Card className={`${confidenceDisplay.border} border-2`}><CardHeader><div className="flex items-start justify-between"><div className="flex-1"><CardTitle className="flex items-center gap-3 mb-2"><div className={`p-2 rounded-lg ${confidenceDisplay.bg}`}><BrainIcon className={`h-6 w-6 ${confidenceDisplay.color}`} /></div><div><h3 className="text-xl font-bold">{result.label}</h3><p className="text-sm text-muted-foreground font-normal">{result.category}
                    {result.subcategory && ` • ${result.subcategory}`}</p></div></CardTitle>{/* Confidence bar */}<div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">Confidence Level</span><Badge
                    className={`${confidenceDisplay.bg} ${confidenceDisplay.color} border-current`}
                  >{formatPercentage(result.confidence)} - {confidenceDisplay.level.toUpperCase()}</Badge></div><div
                  className="relative h-3 bg-gray-200 rounded-full overflow-hidden"
                  ref={progressRef}
                ><motion.div
                    variants={progressVariants}
                    initial="hidden"
                    animate={animateProgress ? 'visible' : 'hidden'}
                    className={`h-full ${confidenceDisplay.progressColor} rounded-full`} />{/* Threshold markers */}<div className="absolute inset-0 flex items-center"><div
                      className="absolute w-0.5 h-full bg-gray-400 opacity-50"
                      style={{ left: `${confidenceThreshold.low * 100}%` }} /><div
                      className="absolute w-0.5 h-full bg-gray-400 opacity-50"
                      style={{ left: `${confidenceThreshold.medium * 100}%` }} /><div
                      className="absolute w-0.5 h-full bg-gray-400 opacity-50"
                      style={{ left: `${confidenceThreshold.high * 100}%` }} /></div></div><div className="flex justify-between text-xs text-muted-foreground"><span>Low ({formatPercentage(confidenceThreshold.low)})</span><span>Medium ({formatPercentage(confidenceThreshold.medium)})</span><span>High ({formatPercentage(confidenceThreshold.high)})</span></div></div></div>{/* Actions */}
            {enableInteractiveFeatures && (<div className="flex items-center gap-2">{allowFeedback && !feedbackMode && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => setFeedbackMode(true)}><ThumbsUpIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Provide feedback</p></TooltipContent></Tooltip></TooltipProvider>)}

                {onExplainPrediction && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowExplanation(!showExplanation);
                            onExplainPrediction(result);}}
                        ><ZapIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Explain prediction</p></TooltipContent></Tooltip></TooltipProvider>)}

                {onReclassify && (<TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => onReclassify(result)}><RefreshCwIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reclassify</p></TooltipContent></Tooltip></TooltipProvider>)}<TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => onExportResult?.(result)}><DownloadIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Export result</p></TooltipContent></Tooltip></TooltipProvider></div>)}</div>{/* Description */}
          {result.description && (<p className="text-sm text-muted-foreground mt-2">{result.description}</p>)}

          {/* Flags */}
          {result.flags && result.flags.length > 0 && (<div className="mt-3 space-y-2">{result.flags.map((flag, index) => {
                const flagStyle = getFlagStyling(flag.type, flag.severity);
                const FlagIcon = flagStyle.icon;

                return (<Alert
                    key={index}
                    className={`${flagStyle.bg} ${flagStyle.severity} ${flagStyle.color}`}
                  ><FlagIcon className="h-4 w-4" /><AlertDescription className="flex items-center justify-between"><span>{flag.message}</span>{flag.code && (<Badge variant="outline" className="text-xs">{flag.code}</Badge>)}</AlertDescription></Alert>);
              })}</div>)}

          {/* Feedback mode */}<AnimatePresence>{feedbackMode && (<motion.div
                initial={{ opacity: 0, height: 0}}
                animate={{ opacity: 1, height: 'auto'}}
                exit={{ opacity: 0, height: 0}}
                className="mt-4 p-4 border rounded-lg bg-gray-50"
              ><h4 className="text-sm font-medium mb-3">Provide Feedback</h4><div className="flex gap-2 mb-3"><Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFeedbackSubmit('correct')}
                    className="flex-1"
                  ><CheckIcon className="h-3 w-3 mr-1" />Correct</Button><Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFeedbackSubmit('partial')}
                    className="flex-1"
                  ><AlertTriangleIcon className="h-3 w-3 mr-1" />Partial</Button><Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFeedbackSubmit('incorrect')}
                    className="flex-1"
                  ><XIcon className="h-3 w-3 mr-1" />Incorrect</Button></div><textarea
                  placeholder="Additional notes (optional)..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full text-sm border rounded px-3 py-2 mb-2"
                  rows={2}
                /><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() =>setFeedbackMode(false)}>
                    Cancel</Button></div></motion.div>)}</AnimatePresence></CardHeader><CardContent>{showDetails && (<Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="grid w-full grid-cols-4 mb-4"><TabsTrigger value="classification">Classification</TabsTrigger><TabsTrigger value="evidence">Evidence</TabsTrigger><TabsTrigger value="alternatives">Alternatives</TabsTrigger><TabsTrigger value="metrics">Metrics</TabsTrigger></TabsList><TabsContent value="classification" className="space-y-4">{/* Classification details */}<div className="grid grid-cols-2 gap-4"><div><h4 className="text-sm font-medium mb-2">Prediction Details</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Confidence:</span><span className="font-medium">{formatPercentage(result.confidence)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Probability:</span><span className="font-medium">{formatPercentage(result.probability)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-medium">{result.category}</span></div>{result.subcategory && (<div className="flex justify-between"><span className="text-muted-foreground">Subcategory:</span><span className="font-medium">{result.subcategory}</span></div>)}</div></div>{result.metadata && (<div><h4 className="text-sm font-medium mb-2">Model Information</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Model:</span><span className="font-medium">{result.metadata.modelName}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Version:</span><span className="font-medium">{result.metadata.modelVersion}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Processing Time:</span><span className="font-medium">{formatProcessingTime(result.metadata.processingTime)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Threshold:</span><span className="font-medium">{formatPercentage(result.metadata.threshold)}</span></div></div></div>)}</div>{/* Validation status */}
                {showValidation && result.validation && (<div className="p-3 border rounded-lg bg-gray-50"><h4 className="text-sm font-medium mb-2">Validation Status</h4><div className="space-y-2 text-sm"><div className="flex items-center gap-2">{result.validation.humanVerified ? (<CheckCircleIcon className="h-4 w-4 text-green-600" />) : (<AlertCircleIcon className="h-4 w-4 text-yellow-600" />)}<span>{result.validation.humanVerified
                            ? 'Human verified'
                            : 'Pending verification'}</span></div>{result.validation.verifiedBy && (<div className="flex justify-between"><span className="text-muted-foreground">Verified by:</span><span className="font-medium">{result.validation.verifiedBy}</span></div>)}

                      {result.validation.feedback && (<div className="flex justify-between"><span className="text-muted-foreground">Feedback:</span><Badge
                            className={result.validation.feedback === 'correct'
                                ? 'bg-green-100 text-green-800'
                                : result.validation.feedback === 'incorrect'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'}
                          >{result.validation.feedback}</Badge></div>)}

                      {result.validation.notes && (<div className="mt-2 p-2 bg-white rounded text-xs"><span className="text-muted-foreground">Notes: </span>{result.validation.notes}</div>)}</div></div>)}</TabsContent><TabsContent value="evidence" className="space-y-4">{showEvidence && result.evidence && result.evidence.length > 0 ? (<div className="space-y-3"><h4 className="text-sm font-medium">Supporting Evidence</h4>{result.evidence
                      .sort((a, b) => b.weight - a.weight)
                      .map((evidence, index) => (<div
                          key={index}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleEvidence(`evidence-${index}`)}
                        ><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs">{evidence.type}</Badge><span className="text-sm font-medium">{evidence.value}</span></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Weight: {(evidence.weight * 100).toFixed(1)}%</span><span>Relevance: {(evidence.relevance * 100).toFixed(1)}%</span>{evidence.position && (<span>Position: {evidence.position.start}-{evidence.position.end}</span>)}</div></div><div className="flex items-center gap-2"><div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${evidence.weight * 100}%` }} /></div><ChevronDownIcon
                                className={`h-4 w-4 transition-transform ${
                                  expandedEvidence.includes(`evidence-${index}`) ? 'rotate-180' : ''
                                }`} /></div></div><AnimatePresence>{expandedEvidence.includes(`evidence-${index}`) && evidence.context && (<motion.div
                                initial={{ opacity: 0, height: 0}}
                                animate={{ opacity: 1, height: 'auto'}}
                                exit={{ opacity: 0, height: 0}}
                                className="mt-3 p-2 bg-gray-100 rounded text-xs"
                              ><strong>Context:</strong>{evidence.context}</motion.div>)}</AnimatePresence></div>))}

                    {onViewEvidence && (<Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewEvidence(result.evidence)}
                        className="w-full"
                      ><EyeIcon className="h-3 w-3 mr-1" />View All Evidence</Button>)}</div>) : (<div className="text-center py-6"><SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No evidence available</p></div>)}</TabsContent><TabsContent value="alternatives" className="space-y-4">{showAlternatives && result.alternatives && result.alternatives.length > 0 ? (<div className="space-y-3"><h4 className="text-sm font-medium">Alternative Classifications</h4>{result.alternatives
                      .sort((a, b) => b.confidence - a.confidence)
                      .map((alternative, index) => (<div key={index} className="p-3 border rounded-lg"><div className="flex items-center justify-between mb-2"><span className="font-medium">{alternative.label}</span><Badge variant="outline">{formatPercentage(alternative.confidence)}</Badge></div><div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2"><div
                              className="h-full bg-gray-400 rounded-full"
                              style={{ width: `${alternative.confidence * 100}%` }} /></div>{alternative.reasoning && (<p className="text-xs text-muted-foreground">{alternative.reasoning}</p>)}</div>))}</div>) : (<div className="text-center py-6"><TargetIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No alternative classifications</p></div>)}</TabsContent><TabsContent value="metrics" className="space-y-4">{metrics ? (<div className="grid grid-cols-2 gap-4"><div className="space-y-3"><h4 className="text-sm font-medium">Confidence Metrics</h4><div className="space-y-2">{Object.entries(metrics).map(([key, value]) => (<div key={key} className="flex justify-between text-sm"><span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span><span className="font-medium">{typeof value === 'number' ? formatPercentage(value) : value}</span></div>))}</div></div>{stats && (<div className="space-y-3"><h4 className="text-sm font-medium">Performance Stats</h4><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Success Rate:</span><span className="font-medium">{formatPercentage(
                                stats.successfulClassifications / stats.totalDocuments
                              )}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Confidence:</span><span className="font-medium">{formatPercentage(stats.averageConfidence)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">High Confidence:</span><span className="font-medium">{formatPercentage(stats.highConfidenceCount / stats.totalDocuments)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Processing:</span><span className="font-medium">{formatProcessingTime(stats.processingTimeStats.average)}</span></div></div></div>)}</div>) : (<div className="text-center py-6"><BarChart3Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No metrics available</p></div>)}</TabsContent></Tabs>)}</CardContent></Card></motion.div>
  );
};

export default ClassificationConfidenceCard;
