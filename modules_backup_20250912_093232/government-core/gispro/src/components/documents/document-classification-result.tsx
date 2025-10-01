import React, {useState, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Progress,} from '../ui';
import {FileText,
  Brain,
  AlertCircle,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  Info,
  Star,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  Lightbulb,
  Shield,
  Download,
  Share2,
  Edit3,} from 'lucide-react';
import {DocumentConfidenceIndicator} from './document-confidence-indicator';
import {cn} from '../../lib/utils';

// Enhanced interfaces for comprehensive document classification
interface ClassificationMetadata {extractedText?: string;
  keyTerms?: string[];
  suggestedCategories?: string[];
  processingTime?: number;
  modelVersion?: string;
  documentLanguage?: string;
  pageCount?: number;
  wordCount?: number;
  readabilityScore?: number;}

interface ValidationFlag {type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';}

interface DocumentClassification {id: string;
  documentTypeLabel: string;
  documentTypeId: string;
  confidence: number;
  wasManuallyClassified: boolean;
  alternatives?: Array<{
    label: string;
    confidence: number;
    typeId: string;}>;
  metadata?: ClassificationMetadata;
  validationFlags?: ValidationFlag[];
  tags?: string[];
  suggestedActions?: string[];
  classificationHistory?: Array<{timestamp: Date;
    type: string;
    confidence: number;
    method: 'ai' | 'manual';
    userId?: string;}>;
}

interface DocumentClassificationResultProps {classification: DocumentClassification;
  compact?: boolean;
  showAlternatives?: boolean;
  showMetadata?: boolean;
  showValidation?: boolean;
  showHistory?: boolean;
  onReclassify?: (newType: string) => void;
  onAcceptClassification?: () => void;
  onRejectClassification?: () => void;
  hasErrors?: boolean;
  className?: string;}

// Animation variants
const containerVariants = {initial: { opacity: 0, y: 20},
  animate: {opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,},
  },
};

const itemVariants = {initial: { opacity: 0, x: -20},
  animate: {opacity: 1,
    x: 0,
    transition: { duration: 0.3},
  },
};

const progressVariants = {initial: { width: 0},
  animate: {width: '100%',
    transition: {
      duration: 1.2,
      ease: 'easeOut',},
  },
};

/**
 * Comprehensive Document Classification Result component
 * Displays AI-powered document classification with confidence scoring,
 * alternative suggestions, metadata analysis, and validation feedback.
 */
export function DocumentClassificationResult({classification,
  compact = false,
  showAlternatives = true,
  showMetadata = true,
  showValidation = true,
  showHistory = false,
  onReclassify,
  onAcceptClassification,
  onRejectClassification,
  hasErrors = false,
  className,}: DocumentClassificationResultProps) {const [activeTab, setActiveTab] = useState('result');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = (section: string) =>{
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);} else {newExpanded.add(section);}
    setExpandedSections(newExpanded);
  };

  // Confidence level determination
  const confidenceLevel = useMemo(() => {if (classification.confidence >= 0.8) return 'high';
    if (classification.confidence >= 0.6) return 'medium';
    return 'low';}, [classification.confidence]);

  const confidenceColor = useMemo(() => {switch (confidenceLevel) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';}
  }, [confidenceLevel]);

  // Validation summary
  const validationSummary = useMemo(() => {if (!classification.validationFlags) return null;

    const errors = classification.validationFlags.filter(f => f.type === 'error').length;
    const warnings = classification.validationFlags.filter(f => f.type === 'warning').length;
    const info = classification.validationFlags.filter(f => f.type === 'info').length;

    return { errors, warnings, info};
  }, [classification.validationFlags]);

  // Compact view for smaller spaces
  if (compact) {
    return (<motion.div
        className={cn('space-y-3', className)}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      ><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{classification.documentTypeLabel}</span>{classification.wasManuallyClassified && (<Badge variant="outline" className="text-xs"><CircleCheck className="h-3 w-3 mr-1" />Verified</Badge>)}</div><DocumentConfidenceIndicator
            confidence={classification.confidence}
            showPercentage={true}
            size="sm" /></div>{validationSummary && (validationSummary.errors > 0 || validationSummary.warnings > 0) && (<div className="flex items-center gap-4 text-sm">{validationSummary.warnings > 0 && (<div className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-4 w-4" /><span className="text-sm">Warnings</span></div>)}
            {hasErrors && (<div className="flex items-center gap-1 text-red-600"><AlertCircle className="h-4 w-4" /><span className="text-sm">Errors</span></div>)}</div>)}</motion.div>);
  }

  // Full detailed view
  return (<TooltipProvider><motion.div
        className={cn('space-y-6', className)}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      ><Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="result">Classification</TabsTrigger><TabsTrigger value="alternatives">Alternatives</TabsTrigger><TabsTrigger value="metadata">Analysis</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger></TabsList>{/* Main Classification Result */}<TabsContent value="result" className="space-y-4 mt-6"><motion.div variants={itemVariants}><Card><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Classification</CardTitle><CardDescription>AI-powered analysis results</CardDescription></div>{classification.wasManuallyClassified ? (<Badge variant="default" className="flex items-center gap-1"><CircleCheck className="h-3 w-3" />Manually Verified</Badge>) : (<Badge variant="secondary" className="flex items-center gap-1"><Brain className="h-3 w-3" />AI Classification</Badge>)}</div></CardHeader><CardContent className="space-y-6">{/* Document Type and Confidence */}<div className="space-y-4"><div className="flex items-start justify-between"><div><h3 className="text-base font-medium mb-1">Document Type</h3><div className="flex items-center space-x-2"><Badge className="capitalize px-3 py-1">{classification.documentTypeLabel}</Badge>{classification.wasManuallyClassified && (<Badge variant="outline" className="flex items-center space-x-1"><CircleCheck className="h-3 w-3 text-green-500 mr-1" /><span>Manually Classified</span></Badge>)}</div></div>{classification.wasManuallyClassified ? (<div className="flex items-center text-sm text-slate-600 dark:text-slate-400"><CircleCheck className="h-4 w-4 text-green-500 mr-1" />Verified</div>) : (<div className="flex items-center text-sm text-slate-600 dark:text-slate-400"><Brain className="h-4 w-4 text-purple-500 mr-1" />AI Classification</div>)}</div><div><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">Confidence Score</span><DocumentConfidenceIndicator
                          confidence={classification.confidence}
                          showPercentage={true} /></div><div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div
                          className="h-full"
                          style={{
                            backgroundColor:
                              classification.confidence >= 0.8
                                ? '#22c55e'
                                : classification.confidence >= 0.6
                                  ? '#eab308'
                                  : '#ef4444',}}
                          initial="initial"
                          animate="animate"
                          variants={progressVariants}
                        /></div>{classification.confidence< 0.6 && (
                        <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded text-sm"><AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /><div><p className="font-medium text-red-800 dark:text-red-300">Low classification confidence</p><p className="text-xs text-red-700 dark:text-red-400 mt-0.5">This document may be misclassified. Consider manually reviewing the
                              document type.</p></div></div>)}</div></div>{/* Tags */}
                  {classification.tags && classification.tags.length > 0 && (<div><h4 className="text-sm font-medium mb-2">Document Tags</h4><div className="flex flex-wrap gap-1">{classification.tags.map((tag, index) => (<Badge key={index} variant="outline" className="text-xs">{tag}</Badge>))}</div></div>)}

                  {/* Suggested Actions */}
                  {classification.suggestedActions &&
                    classification.suggestedActions.length > 0 && (<div><h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Lightbulb className="h-4 w-4" />Suggested Actions</h4><ul className="space-y-1">{classification.suggestedActions.map((action, index) => (<li
                              key={index}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            ><ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />{action}</li>))}</ul></div>)}

                  {/* Action Buttons */}<div className="flex gap-2 pt-4 border-t">{onAcceptClassification && (<Button onClick={onAcceptClassification} size="sm"><CircleCheck className="h-4 w-4 mr-1" />Accept Classification</Button>)}
                    {onReclassify && (<Button
                        onClick={() => onReclassify(classification.documentTypeId)}
                        variant="outline"
                        size="sm"
                      ><Edit3 className="h-4 w-4 mr-1" />Reclassify</Button>)}
                    {onRejectClassification && (<Button onClick={onRejectClassification} variant="outline" size="sm">Reject</Button>)}</div></CardContent></Card></motion.div></TabsContent>{/* Alternative Classifications */}<TabsContent value="alternatives" className="space-y-4 mt-6">{showAlternatives &&
            classification.alternatives &&
            classification.alternatives.length > 0 ? (<motion.div variants={itemVariants}><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Alternative Classifications</CardTitle><CardDescription>Other possible document types based on analysis</CardDescription></CardHeader><CardContent><div className="space-y-3">{classification.alternatives.map((alt, index) => (<motion.div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          variants={itemVariants}
                        ><div className="flex items-center gap-2"><span className="font-medium">{alt.label}</span><Badge variant="outline" className="text-xs">{(alt.confidence * 100).toFixed(1)}%</Badge></div>{onReclassify && (<Button
                              onClick={() =>onReclassify(alt.typeId)}
                              variant="ghost"
                              size="sm"
                            >
                              Select</Button>)}</motion.div>))}</div></CardContent></Card></motion.div>) : (<Card><CardContent className="flex items-center justify-center h-32 text-muted-foreground"><div className="text-center"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No alternative classifications available</p></div></CardContent></Card>)}</TabsContent>{/* Metadata Analysis */}<TabsContent value="metadata" className="space-y-4 mt-6">{showMetadata && classification.metadata ? (<motion.div variants={itemVariants}><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Document Analysis</CardTitle><CardDescription>Detailed analysis results and extracted information</CardDescription></CardHeader><CardContent className="space-y-6">{/* Document Statistics */}<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{classification.metadata.pageCount && (<div className="text-center p-3 bg-muted rounded-lg"><div className="text-2xl font-bold text-primary">{classification.metadata.pageCount}</div><div className="text-xs text-muted-foreground">Pages</div></div>)}
                      {classification.metadata.wordCount && (<div className="text-center p-3 bg-muted rounded-lg"><div className="text-2xl font-bold text-primary">{classification.metadata.wordCount.toLocaleString()}</div><div className="text-xs text-muted-foreground">Words</div></div>)}
                      {classification.metadata.processingTime && (<div className="text-center p-3 bg-muted rounded-lg"><div className="text-2xl font-bold text-primary">{classification.metadata.processingTime}ms</div><div className="text-xs text-muted-foreground">Processing Time</div></div>)}
                      {classification.metadata.readabilityScore && (<div className="text-center p-3 bg-muted rounded-lg"><div className="text-2xl font-bold text-primary">{classification.metadata.readabilityScore}</div><div className="text-xs text-muted-foreground">Readability</div></div>)}</div>{/* Key Terms */}
                    {classification.metadata.keyTerms &&
                      classification.metadata.keyTerms.length > 0 && (<div><h4 className="text-sm font-medium mb-2">Key Terms Identified</h4><div className="flex flex-wrap gap-1">{classification.metadata.keyTerms.map((term, index) => (<Badge key={index} variant="secondary" className="text-xs">{term}</Badge>))}</div></div>)}

                    {/* Suggested Categories */}
                    {classification.metadata.suggestedCategories &&
                      classification.metadata.suggestedCategories.length > 0 && (<div><h4 className="text-sm font-medium mb-2">Suggested Categories</h4><div className="flex flex-wrap gap-1">{classification.metadata.suggestedCategories.map((category, index) => (<Badge key={index} variant="outline" className="text-xs">{category}</Badge>))}</div></div>)}

                    {/* Additional Metadata */}<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">{classification.metadata.documentLanguage && (<div><span className="font-medium">Language:</span>{' '}
                          {classification.metadata.documentLanguage}
                        </div>)}
                      {classification.metadata.modelVersion && (<div><span className="font-medium">Model Version:</span>{' '}
                          {classification.metadata.modelVersion}
                        </div>)}</div></CardContent></Card></motion.div>) : (<Card><CardContent className="flex items-center justify-center h-32 text-muted-foreground"><div className="text-center"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No detailed analysis available</p></div></CardContent></Card>)}</TabsContent>{/* Validation Results */}<TabsContent value="validation" className="space-y-4 mt-6">{showValidation &&
            classification.validationFlags &&
            classification.validationFlags.length > 0 ? (<motion.div variants={itemVariants}><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Validation Results</CardTitle><CardDescription>Quality checks and validation feedback</CardDescription></CardHeader><CardContent><div className="space-y-3">{classification.validationFlags.map((flag, index) => (<motion.div
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border',
                            flag.type === 'error'
                              ? 'bg-red-50 border-red-200'
                              : flag.type === 'warning'
                                ? 'bg-amber-50 border-amber-200'
                                : flag.type === 'info'
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-green-50 border-green-200'
                          )}
                          variants={itemVariants}
                        ><div className="flex items-start gap-2">{flag.type === 'error' && (<AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />)}
                            {flag.type === 'warning' && (<AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />)}
                            {flag.type === 'info' && (<Info className="w-5 h-5 text-blue-500 mt-0.5" />)}
                            {flag.type === 'success' && (<CircleCheck className="w-5 h-5 text-green-500 mt-0.5" />)}<div className="flex-1"><p
                                className={cn(
                                  'font-medium text-sm',
                                  flag.type === 'error'
                                    ? 'text-red-900'
                                    : flag.type === 'warning'
                                      ? 'text-amber-900'
                                      : flag.type === 'info'
                                        ? 'text-blue-900'
                                        : 'text-green-900'
                                )}
                              >{flag.message}</p>{flag.suggestion && (<p
                                  className={cn(
                                    'text-xs mt-1',
                                    flag.type === 'error'
                                      ? 'text-red-700'
                                      : flag.type === 'warning'
                                        ? 'text-amber-700'
                                        : flag.type === 'info'
                                          ? 'text-blue-700'
                                          : 'text-green-700'
                                  )}
                                >Suggestion: {flag.suggestion}</p>)}</div><Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                flag.severity === 'high' && 'border-red-300 text-red-700',
                                flag.severity === 'medium' && 'border-amber-300 text-amber-700',
                                flag.severity === 'low' && 'border-blue-300 text-blue-700'
                              )}
                            >{flag.severity}</Badge></div></motion.div>))}</div></CardContent></Card></motion.div>) : (<Card><CardContent className="flex items-center justify-center h-32 text-muted-foreground"><div className="text-center"><Shield className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No validation issues found</p></div></CardContent></Card>)}</TabsContent></Tabs>{/* Classification History */}
        {showHistory &&
          classification.classificationHistory &&
          classification.classificationHistory.length > 0 && (<motion.div variants={itemVariants}><Collapsible><CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between"><span className="flex items-center gap-2"><Clock className="h-4 w-4" />Classification History</span><ChevronDown className="h-4 w-4" /></Button></CollapsibleTrigger><CollapsibleContent><Card className="mt-2"><CardContent className="pt-6"><div className="space-y-3">{classification.classificationHistory.map((entry, index) => (<div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          ><div className="flex items-center gap-2">{entry.method === 'ai' ? (<Brain className="h-4 w-4 text-purple-500" />) : (<Users className="h-4 w-4 text-blue-500" />)}<span className="font-medium">{entry.type}</span><Badge variant="outline" className="text-xs">{(entry.confidence * 100).toFixed(1)}%</Badge></div><span className="text-xs text-muted-foreground">{entry.timestamp.toLocaleDateString()}</span></div>))}</div></CardContent></Card></CollapsibleContent></Collapsible></motion.div>)}</motion.div></TooltipProvider>
  );
}

export default DocumentClassificationResult;
