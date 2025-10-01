import React, {useState, useEffect, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Separator} from '@/components/ui/separator';
import {CheckCircle2,
  AlertCircle,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Edit,
  RotateCcw,
  FileText,
  Eye,
  Download,
  Share2,
  Clock,
  User,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Star,
  Award,
  Flag,
  Info,
  HelpCircle,
  RefreshCw,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  PauseCircle,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  MapPin,
  Tag,
  Bookmark,
  Archive,
  Hash,
  Layers,
  Activity,
  Database,
  GitBranch,
  MessageSquare,
  Users,
  Globe,
  Lock,
  Unlock,
  Verified,
  X,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  ChevronRight,} from 'lucide-react';
import {DocumentConfidenceIndicator} from './document-confidence-indicator';
import {ClassificationConfidenceCard} from './classification-confidence-card';

interface ClassificationResult {documentType: string;
  documentTypeLabel: string;
  confidence: number;
  wasManuallyClassified: boolean;
  classifiedAt?: string;
  modelVersion?: string;
  alternativeTypes?: Array<{
    type: string;
    label: string;
    confidence: number;}>;
  evidence?: Array<{feature: string;
    importance: number;
    description: string;}>;
  processingTime?: number;
  metadata?: {extractedText?: string;
    pageCount?: number;
    fileSize?: number;
    language?: string;
    keywords?: string[];
    entities?: Array<{
      text: string;
      type: string;
      confidence: number;}>;
  };
  flags?: Array<{type: 'warning' | 'error' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high';}>;
  humanFeedback?: {isCorrect?: boolean;
    suggestedType?: string;
    comments?: string;
    feedbackAt?: string;
    userId?: string;};
  validationStatus?: 'pending' | 'approved' | 'rejected' | 'needs_review';
  reclassificationHistory?: Array<{previousType: string;
    newType: string;
    confidence: number;
    timestamp: string;
    reason: string;
    userId?: string;}>;
}

interface Document {id?: string;
  name: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
  author?: string;}

interface DocumentClassificationResultProps {result: ClassificationResult;
  document?: Document;
  variant?: 'default' | 'compact' | 'card' | 'detailed';
  showActions?: boolean;
  showMetadata?: boolean;
  showEvidence?: boolean;
  showAlternatives?: boolean;
  showHistory?: boolean;
  showValidation?: boolean;
  onAcceptClassification?: (result: ClassificationResult) => void;
  onRejectClassification?: (result: ClassificationResult, reason?: string) => void;
  onUpdateClassification?: (newType: string, confidence?: number) => void;
  onRequestHumanReview?: (result: ClassificationResult) => void;
  onExportResult?: (result: ClassificationResult) => void;
  onReprocessDocument?: () => void;
  onViewDocument?: () => void;
  onEditDocument?: () => void;
  className?: string;}

const DocumentClassificationResult: React.FC<DocumentClassificationResultProps> = ({result: classification,
  document,
  variant = 'default',
  showActions = true,
  showMetadata = true,
  showEvidence = true,
  showAlternatives = true,
  showHistory = false,
  showValidation = false,
  onAcceptClassification,
  onRejectClassification,
  onUpdateClassification,
  onRequestHumanReview,
  onExportResult,
  onReprocessDocument,
  onViewDocument,
  onEditDocument,
  className = '',}) => {const [activeTab, setActiveTab] = useState('overview');
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [showAllAlternatives, setShowAllAlternatives] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['confidence']));
  const [animatedConfidence, setAnimatedConfidence] = useState(0);

  useEffect(() =>{
    const timer = setTimeout(() => {
      setAnimatedConfidence(classification.confidence);}, 300);
    return () => clearTimeout(timer);
  }, [classification.confidence]);

  const toggleSection = (section: string) => {setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);} else {newSet.add(section);}
      return newSet;
    });
  };

  const getConfidenceLevel = (confidence: number) => {if (confidence >= 0.9)
      return { level: 'very-high', label: 'Very High', color: 'bg-emerald-500'};
    if (confidence >= 0.8) return {level: 'high', label: 'High', color: 'bg-green-500'};
    if (confidence >= 0.7) return {level: 'medium', label: 'Medium', color: 'bg-yellow-500'};
    if (confidence >= 0.6) return {level: 'low', label: 'Low', color: 'bg-orange-500'};
    return {level: 'very-low', label: 'Very Low', color: 'bg-red-500'};
  };

  const confidenceInfo = getConfidenceLevel(classification.confidence);

  const formatProcessingTime = (timeMs: number) => {
    if (timeMs< 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) =>{return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',}).format(new Date(dateString));
  };

  const getValidationStatusBadge = (status: string) => {switch (status) {
      case 'approved':
        return<Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'needs_review':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Review</Badge>);
      default:
        return<Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;}
  };

  const renderMetrics = () => (<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="bg-blue-50 rounded-lg p-3 border border-blue-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-900">Confidence</p><p className="text-xl font-bold text-blue-700">{(classification.confidence * 100).toFixed(1)}%</p></div><div className="p-2 bg-blue-100 rounded-full"><Target className="w-5 h-5 text-blue-600" /></div></div></div><div className="bg-green-50 rounded-lg p-3 border border-green-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-green-900">Reliability</p><p className="text-xl font-bold text-green-700">{((classification.confidence + 0.1) * 0.9 * 100).toFixed(1)}%</p></div><div className="p-2 bg-green-100 rounded-full"><Shield className="w-5 h-5 text-green-600" /></div></div></div><div className="bg-purple-50 rounded-lg p-3 border border-purple-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-purple-900">Consistency</p><p className="text-xl font-bold text-purple-700">{((classification.confidence + 0.05) * 0.95 * 100).toFixed(1)}%</p></div><div className="p-2 bg-purple-100 rounded-full"><Activity className="w-5 h-5 text-purple-600" /></div></div></div><div className="bg-orange-50 rounded-lg p-3 border border-orange-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-orange-900">Processing</p><p className="text-xl font-bold text-orange-700">{classification.processingTime
                ? formatProcessingTime(classification.processingTime)
                : 'N/A'}</p></div><div className="p-2 bg-orange-100 rounded-full"><Zap className="w-5 h-5 text-orange-600" /></div></div></div></div>);

  const renderEvidenceAnalysis = () => (<div className="space-y-4"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-900">Evidence Analysis</h4><Button
          variant="outline"
          size="sm"
          onClick={() =>setShowAllEvidence(!showAllEvidence)}
          className="text-xs"
        >
          {showAllEvidence ? 'Show Less' : 'Show All'}
          {showAllEvidence ? (<ChevronUp className="w-3 h-3 ml-1" />) : (<ChevronDown className="w-3 h-3 ml-1" />)}</Button></div><div className="space-y-3">{(classification.evidence || [])
          .slice(0, showAllEvidence ? undefined : 3)
          .map((evidence, index) => (<motion.div
              key={index}
              initial={{ opacity: 0, x: -20}}
              animate={{ opacity: 1, x: 0}}
              transition={{ delay: index * 0.1}}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            ><div className="flex items-start justify-between mb-2"><h5 className="text-sm font-medium text-gray-900">{evidence.feature}</h5><div className="flex items-center gap-2"><span className="text-xs text-gray-600">Weight: {(evidence.importance * 100).toFixed(0)}%</span><div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${evidence.importance * 100}%` }} /></div></div></div><p className="text-xs text-gray-600">{evidence.description}</p></motion.div>))}</div></div>);

  const renderAlternativePredictions = () => (<div className="space-y-4"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-900">Alternative Classifications</h4><Button
          variant="outline"
          size="sm"
          onClick={() =>setShowAllAlternatives(!showAllAlternatives)}
          className="text-xs"
        >
          {showAllAlternatives ? 'Show Less' : 'Show All'}</Button></div><div className="space-y-2">{(classification.alternativeTypes || [])
          .slice(0, showAllAlternatives ? undefined : 3)
          .map((alt, index) => (<motion.div
              key={index}
              initial={{ opacity: 0, y: 10}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: index * 0.1}}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            ><div className="flex items-center gap-3"><span className="text-sm font-medium text-gray-900">{alt.label}</span><Badge variant="outline" className="text-xs">{(alt.confidence * 100).toFixed(1)}%</Badge></div>{onUpdateClassification && (<Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>onUpdateClassification(alt.type, alt.confidence)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Use This<ArrowRight className="w-3 h-3 ml-1" /></Button>)}</motion.div>))}</div></div>);

  const renderValidationWorkflow = () => (<div className="space-y-4"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-900">Validation Workflow</h4>{classification.validationStatus &&
          getValidationStatusBadge(classification.validationStatus)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{onAcceptClassification && (<Button
            onClick={() => onAcceptClassification(classification)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          ><CheckCircle2 className="w-4 h-4" />Accept Classification</Button>)}

        {onRejectClassification && (<Button
            variant="outline"
            onClick={() => onRejectClassification(classification)}
            className="flex items-center justify-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
          ><X className="w-4 h-4" />Reject Classification</Button>)}</div>{classification.humanFeedback && (<div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"><h5 className="text-sm font-medium text-blue-900 mb-2">Human Feedback</h5><div className="space-y-1 text-xs"><p><span className="font-medium">Correct:</span>{' '}
              {classification.humanFeedback.isCorrect ? 'Yes' : 'No'}
            </p>{classification.humanFeedback.suggestedType && (<p><span className="font-medium">Suggested Type:</span>{' '}
                {classification.humanFeedback.suggestedType}
              </p>)}
            {classification.humanFeedback.comments && (<p><span className="font-medium">Comments:</span>{' '}
                {classification.humanFeedback.comments}
              </p>)}</div></div>)}</div>);

  const renderInteractiveFeedback = () => (<div className="space-y-4"><h4 className="text-sm font-semibold text-gray-900">Provide Feedback</h4><div className="flex items-center gap-4"><Button
          variant="outline"
          size="sm"
          onClick={() => {
            /* Handle thumbs up */}}
          className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
        ><ThumbsUp className="w-4 h-4" />Correct</Button><Button
          variant="outline"
          size="sm"
          onClick={() => {
            /* Handle thumbs down */}}
          className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
        ><ThumbsDown className="w-4 h-4" />Incorrect</Button>{onRequestHumanReview && (<Button
            variant="outline"
            size="sm"
            onClick={() => onRequestHumanReview(classification)}
            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
          ><User className="w-4 h-4" />Request Review</Button>)}</div></div>);

  const renderConfidenceThresholds = () => (<div className="space-y-4"><h4 className="text-sm font-semibold text-gray-900">Confidence Thresholds</h4><div className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-gray-600">Current Threshold</span><Badge
            className={classification.confidence >= confidenceThreshold
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'}
          >{(confidenceThreshold * 100).toFixed(0)}%</Badge></div><div className="space-y-2"><input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={confidenceThreshold}
            onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          /><div className="flex justify-between text-xs text-gray-500"><span>50%</span><span>75%</span><span>100%</span></div></div><div className="flex items-center gap-2"><div
            className={`w-3 h-3 rounded-full ${classification.confidence >= confidenceThreshold ? 'bg-green-500' : 'bg-red-500'}`}
          /><span className="text-sm text-gray-600">{classification.confidence >= confidenceThreshold
              ? 'Classification meets threshold'
              : 'Classification below threshold'}</span></div></div></div>);

  // If card variant, use the ClassificationConfidenceCard component
  if (variant === 'card') {
    return (<ClassificationConfidenceCard
        documentType={classification.documentType}
        documentTypeLabel={classification.documentTypeLabel}
        confidence={classification.confidence}
        onReclassify={onUpdateClassification || onReprocessDocument} />);
  }

  // If compact variant, show minimal UI
  if (variant === 'compact') {
    return (<div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Badge className="capitalize px-2 py-0.5 text-xs">{classification.documentTypeLabel}</Badge>{classification.wasManuallyClassified ? (<div className="flex items-center text-xs text-gray-600"><CheckCircle2 className="h-3 w-3 text-green-500 mr-1" /><span>Verified</span></div>) : (<div className="flex items-center text-xs text-gray-600"><Brain className="h-3 w-3 text-purple-500 mr-1" /><span>AI</span></div>)}</div><DocumentConfidenceIndicator
          confidence={classification.confidence}
          size="sm"
          showPercentage={false} /></div>);
  }

  // Default and detailed views
  return (<motion.div
      initial={{ opacity: 0, y: 20}}
      animate={{ opacity: 1, y: 0}}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    ><div className="p-6"><div className="flex items-start justify-between mb-6"><div><h2 className="text-xl font-semibold text-gray-900 mb-2">Classification Results</h2>{document && (<div className="flex items-center gap-2 text-sm text-gray-600"><FileText className="w-4 h-4" /><span>{document.name}</span>{document.size &&<span>• {(document.size / 1024).toFixed(1)} KB</span>}
              </div>)}</div>{showActions && (<div className="flex items-center gap-2">{onViewDocument && (<Button variant="outline" size="sm" onClick={onViewDocument}><Eye className="w-4 h-4 mr-2" />View</Button>)}

              {onExportResult && (<Button variant="outline" size="sm" onClick={() => onExportResult(classification)}><Download className="w-4 h-4 mr-2" />Export</Button>)}

              {onReprocessDocument && (<Button variant="outline" size="sm" onClick={onReprocessDocument}><RefreshCw className="w-4 h-4 mr-2" />Reprocess</Button>)}</div>)}</div><div className="space-y-6"><motion.div
            initial={{ opacity: 0, scale: 0.95}}
            animate={{ opacity: 1, scale: 1}}
            transition={{ delay: 0.1}}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200"
          ><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-full"><FileText className="w-5 h-5 text-blue-600" /></div><div><h3 className="text-lg font-semibold text-gray-900">{classification.documentTypeLabel}</h3><p className="text-sm text-gray-600">Document Classification</p></div></div><div className="text-right"><div className="flex items-center gap-2"><span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${confidenceInfo.color} text-white`}
                  >{confidenceInfo.label}</span>{classification.wasManuallyClassified && (<CheckCircle2 className="w-5 h-5 text-green-500" />)}</div><p className="text-2xl font-bold text-gray-900 mt-1">{(animatedConfidence * 100).toFixed(1)}%</p></div></div><div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="text-gray-600">Confidence Level</span><span className="font-medium text-gray-900">{confidenceInfo.label}</span></div><div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"><motion.div
                  className={`h-full ${confidenceInfo.color} rounded-full`}
                  initial={{ width: 0}}
                  animate={{ width: `${animatedConfidence * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut'}} /></div><div className="flex items-center gap-4 text-xs text-gray-500">{classification.classifiedAt && (<span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(classification.classifiedAt)}</span>)}
                {classification.processingTime && (<span className="flex items-center gap-1"><Zap className="w-3 h-3" />{formatProcessingTime(classification.processingTime)}</span>)}
                {classification.modelVersion && (<span className="flex items-center gap-1"><Brain className="w-3 h-3" />Model v{classification.modelVersion}</span>)}</div></div></motion.div>{variant === 'detailed' && (<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"><TabsList className="grid w-full grid-cols-5"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="evidence">Evidence</TabsTrigger><TabsTrigger value="alternatives">Alternatives</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger><TabsTrigger value="metadata">Metadata</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-6">{renderMetrics()}
                {renderInteractiveFeedback()}
                {renderConfidenceThresholds()}</TabsContent><TabsContent value="evidence" className="space-y-6">{classification.evidence && renderEvidenceAnalysis()}</TabsContent><TabsContent value="alternatives" className="space-y-6">{classification.alternativeTypes && renderAlternativePredictions()}</TabsContent><TabsContent value="validation" className="space-y-6">{renderValidationWorkflow()}</TabsContent><TabsContent value="metadata" className="space-y-6">{showMetadata && classification.metadata && (<div className="space-y-4"><h4 className="text-sm font-semibold text-gray-900">Document Metadata</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{classification.metadata.pageCount && (<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Pages</span><span className="font-medium">{classification.metadata.pageCount}</span></div>)}

                      {classification.metadata.language && (<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Language</span><span className="font-medium">{classification.metadata.language}</span></div>)}

                      {classification.metadata.keywords && (<div className="col-span-full"><h5 className="text-sm font-medium text-gray-900 mb-2">Keywords</h5><div className="flex flex-wrap gap-2">{classification.metadata.keywords.map((keyword, index) => (<Badge key={index} variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{keyword}</Badge>))}</div></div>)}</div></div>)}</TabsContent></Tabs>)}

          {variant === 'default' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{showEvidence && classification.evidence && (<div className="space-y-4"><button
                    onClick={() => toggleSection('evidence')}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  ><h4 className="text-sm font-semibold text-gray-900">Evidence Analysis</h4>{expandedSections.has('evidence') ? (<ChevronUp className="w-4 h-4 text-gray-500" />) : (<ChevronDown className="w-4 h-4 text-gray-500" />)}</button><AnimatePresence>{expandedSections.has('evidence') && (<motion.div
                        initial={{ opacity: 0, height: 0}}
                        animate={{ opacity: 1, height: 'auto'}}
                        exit={{ opacity: 0, height: 0}}
                      >{renderEvidenceAnalysis()}</motion.div>)}</AnimatePresence></div>)}

              {showAlternatives && classification.alternativeTypes && (<div className="space-y-4"><button
                    onClick={() => toggleSection('alternatives')}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  ><h4 className="text-sm font-semibold text-gray-900">Alternative Classifications</h4>{expandedSections.has('alternatives') ? (<ChevronUp className="w-4 h-4 text-gray-500" />) : (<ChevronDown className="w-4 h-4 text-gray-500" />)}</button><AnimatePresence>{expandedSections.has('alternatives') && (<motion.div
                        initial={{ opacity: 0, height: 0}}
                        animate={{ opacity: 1, height: 'auto'}}
                        exit={{ opacity: 0, height: 0}}
                      >{renderAlternativePredictions()}</motion.div>)}</AnimatePresence></div>)}</div>)}

          {classification.flags && classification.flags.length > 0 && (<motion.div
              initial={{ opacity: 0, y: 10}}
              animate={{ opacity: 1, y: 0}}
              className="space-y-3"
            ><h4 className="text-sm font-semibold text-gray-900">Flags & Warnings</h4>{classification.flags.map((flag, index) => (<div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    flag.type === 'error'
                      ? 'bg-red-50 border-red-200'
                      : flag.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'}`}
                >{flag.type === 'error' &&<AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                  {flag.type === 'warning' && <Flag className="w-5 h-5 text-yellow-500 mt-0.5" />}
                  {flag.type === 'info' && <Info className="w-5 h-5 text-blue-500 mt-0.5" />}

                  <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span
                        className={`text-sm font-medium ${
                          flag.type === 'error'
                            ? 'text-red-900'
                            : flag.type === 'warning'
                              ? 'text-yellow-900'
                              : 'text-blue-900'}`}
                      >{flag.type.charAt(0).toUpperCase() + flag.type.slice(1)}</span><Badge variant="outline" className="text-xs">{flag.severity}</Badge></div><p
                      className={`text-sm ${
                        flag.type === 'error'
                          ? 'text-red-700'
                          : flag.type === 'warning'
                            ? 'text-yellow-700'
                            : 'text-blue-700'}`}
                    >{flag.message}</p></div></div>))}</motion.div>)}

          {showValidation && (<motion.div
              initial={{ opacity: 0, y: 10}}
              animate={{ opacity: 1, y: 0}}
              className="border-t border-gray-200 pt-6"
            >{renderValidationWorkflow()}</motion.div>)}</div></div></motion.div>
  );
};

export default DocumentClassificationResult;
