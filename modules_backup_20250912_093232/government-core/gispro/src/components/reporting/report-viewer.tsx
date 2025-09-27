import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Progress} from '@/components/ui/progress';
import {Textarea} from '@/components/ui/textarea';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Eye,
  Download,
  Share2,
  Print,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  FileText,
  Search,
  Bookmark,
  MessageCircle,
  Edit,
  Save,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Settings,
  Filter,
  Layers,
  Target,
  Activity,} from 'lucide-react';
import {format} from 'date-fns';

// Types
interface ReportData {id: string;
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'word' | 'powerpoint';
  createdAt: string;
  createdBy: string;
  size: string;
  pages: number;
  version: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  content: ReportContent;}

interface ReportContent {sections: ReportSection[];
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string[];
    created: string;
    modified: string;};
  statistics: {wordCount: number;
    characterCount: number;
    pageCount: number;
    imageCount: number;
    tableCount: number;
    chartCount: number;};
}

interface ReportSection {id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'list';
  content: string | TableData | ChartData | ImageData | ListData;
  pageNumber: number;
  position: { x: number; y: number; width: number; height: number};
}

interface TableData {headers: string[];
  rows: string[][];
  caption?: string;}

interface ChartData {type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: { label: string; value: number}[];
  options: Record<string, any>;
}

interface ImageData {src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;}

interface ListData {type: 'ordered' | 'unordered';
  items: string[];}

interface ViewerSettings {zoom: number;
  rotation: number;
  fitToWidth: boolean;
  showAnnotations: boolean;
  highlightColor: string;
  theme: 'light' | 'dark' | 'sepia';}

interface Annotation {id: string;
  type: 'highlight' | 'note' | 'bookmark';
  content: string;
  position: { x: number; y: number; width?: number; height?: number};
  pageNumber: number;
  createdAt: string;
  createdBy: string;
}

// Animation variants
const containerVariants = {hidden: { opacity: 0},
  visible: {opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,},
  },
};

const cardVariants = {hidden: { opacity: 0, y: 20},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut'},
  },
};

const toolbarVariants = {hidden: { opacity: 0, y: -10},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.3},
  },
};

export default function ReportViewer() {// State management
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ page: number; matches: number}[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({zoom: 100,
    rotation: 0,
    fitToWidth: true,
    showAnnotations: true,
    highlightColor: '#ffeb3b',
    theme: 'light',});

  const viewerRef = useRef<HTMLDivElement>(null);

  // Sample report data
  const sampleReport: ReportData = {id: 'rpt-001',
    title: 'Q4 2024 Financial Analysis Report',
    description:
      'Comprehensive financial performance analysis for Q4 2024 including revenue trends, expense analysis, and strategic recommendations.',
    type: 'pdf',
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'John Smith',
    size: '2.4 MB',
    pages: 24,
    version: '1.2',
    status: 'published',
    tags: ['Financial', 'Q4', 'Analysis', 'Performance'],
    content: {
      sections: [
        {
          id: 'sec-001',
          title: 'Executive Summary',
          type: 'text',
          content:
            'This report provides a comprehensive analysis of our financial performance during Q4 2024. Key highlights include revenue growth of 15%, improved profit margins, and strategic market expansion initiatives. The analysis covers revenue streams, operational efficiency metrics, and future growth projections.',
          pageNumber: 1,
          position: { x: 50, y: 100, width: 500, height: 200},
        },
        {id: 'sec-002',
          title: 'Revenue Analysis',
          type: 'chart',
          content: {
            type: 'bar',
            title: 'Monthly Revenue Trends',
            data: [
              { label: 'October', value: 450000},
              {label: 'November', value: 520000},
              {label: 'December', value: 680000},
            ],
            options: {currency: true},
          } as ChartData,
          pageNumber: 2,
          position: {x: 50, y: 150, width: 400, height: 300},
        },
        {id: 'sec-003',
          title: 'Financial Metrics',
          type: 'table',
          content: {
            headers: ['Metric', 'Q3 2024', 'Q4 2024', 'Change'],
            rows: [
              ['Revenue', '$1.2M', '$1.65M', '+37.5%'],
              ['Net Profit', '$320K', '$445K', '+39.1%'],
              ['Profit Margin', '26.7%', '27.0%', '+0.3%'],
              ['Operating Expenses', '$880K', '$1.205M', '+36.9%'],
            ],
            caption: 'Key financial performance indicators comparison',} as TableData,
          pageNumber: 3,
          position: {x: 50, y: 100, width: 500, height: 250},
        },
      ],
      metadata: {title: 'Q4 2024 Financial Analysis Report',
        author: 'John Smith',
        subject: 'Financial Analysis',
        keywords: ['Financial', 'Q4', 'Analysis', 'Revenue', 'Profit'],
        created: '2024-01-15T10:30:00Z',
        modified: '2024-01-15T14:20:00Z',},
      statistics: {wordCount: 2840,
        characterCount: 18650,
        pageCount: 24,
        imageCount: 8,
        tableCount: 6,
        chartCount: 12,},
    },
  };

  const sampleAnnotations: Annotation[] = [
    {id: 'ann-001',
      type: 'highlight',
      content: 'Key performance indicator',
      position: { x: 150, y: 200, width: 200, height: 20},
      pageNumber: 1,
      createdAt: '2024-01-15T11:00:00Z',
      createdBy: 'John Smith',
    },
    {id: 'ann-002',
      type: 'note',
      content: 'This trend indicates strong market demand and effective sales strategies.',
      position: { x: 250, y: 300},
      pageNumber: 2,
      createdAt: '2024-01-15T11:15:00Z',
      createdBy: 'Sarah Johnson',
    },
    {id: 'ann-003',
      type: 'bookmark',
      content: 'Revenue Analysis Section',
      position: { x: 0, y: 0},
      pageNumber: 2,
      createdAt: '2024-01-15T11:30:00Z',
      createdBy: 'Mike Davis',
    },
  ];

  // Initialize data
  useEffect(() =>{setCurrentReport(sampleReport);
    setAnnotations(sampleAnnotations);}, []);

  // Viewer actions
  const handleZoomIn = () => {setViewerSettings(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 25, 500),}));
  };

  const handleZoomOut = () => {setViewerSettings(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 25, 25),}));
  };

  const handleResetZoom = () => {setViewerSettings(prev => ({
      ...prev,
      zoom: 100,}));
  };

  const handleRotate = () => {setViewerSettings(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,}));
  };

  const handleFitToWidth = () => {setViewerSettings(prev => ({
      ...prev,
      fitToWidth: !prev.fitToWidth,
      zoom: prev.fitToWidth ? 100 : 150,}));
  };

  const handleSearch = (term: string) => {setSearchTerm(term);
    if (!term.trim() || !currentReport) {
      setSearchResults([]);
      return;}

    // Simulate search through report content
    const results: {page: number; matches: number}[] = [];
    currentReport.content.sections.forEach(section => {const content =
        typeof section.content === 'string' ? section.content : JSON.stringify(section.content);
      const matches = (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || [])
        .length;

      if (matches > 0) {
        const existingPage = results.find(r => r.page === section.pageNumber);
        if (existingPage) {
          existingPage.matches += matches;} else {results.push({ page: section.pageNumber, matches});
        }
      }
    });

    setSearchResults(results);
  };

  const handleAddAnnotation = (
    type: Annotation['type'],
    content: string,
    position: {x: number; y: number}
  ) => {
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type,
      content,
      position: type === 'highlight' ? {...position, width: 200, height: 20} : position,
      pageNumber: currentPage,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const handleDeleteAnnotation = (annotationId: string) => {setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));};

  const handleDownload = () => {
    if (currentReport) {
      console.log(`Downloading report: ${currentReport.title}`);
      // Simulate download
      const link = document.createElement('a');
      link.href = `/api/reports/${currentReport.id}/download`;
      link.download = `${currentReport.title}.${currentReport.type}`;
      link.click();
    }
  };

  const handlePrint = () => {window.print();};

  const handleShare = () => {if (navigator.share && currentReport) {
      navigator.share({
        title: currentReport.title,
        text: currentReport.description,
        url: window.location.href,});
    } else {// Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Report URL copied to clipboard');}
  };

  const navigateToPage = (page: number) => {if (currentReport && page >= 1 && page<= currentReport.pages) {
      setCurrentPage(page);}
  };

  const getCurrentPageAnnotations = () =>{return annotations.filter(ann => ann.pageNumber === currentPage);};

  const getAnnotationIcon = (type: Annotation['type']) => {switch (type) {
      case 'highlight':
        return '🖍️';
      case 'note':
        return '📝';
      case 'bookmark':
        return '🔖';
      default:
        return '📌';}
  };

  if (!currentReport) {return (<div className="container mx-auto py-8"><Card><CardContent className="flex items-center justify-center py-16"><div className="text-center"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-semibold mb-2">No Report Selected</h3><p className="text-muted-foreground">Select a report to view its contents.</p></div></CardContent></Card></div>);}

  return (<motion.div
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >{/* Header */}
      {!isFullscreen && (<motion.div className="container mx-auto py-4 space-y-4" variants={cardVariants}><div className="text-center space-y-2"><h1 className="text-3xl font-bold text-foreground">Report Viewer</h1><p className="text-muted-foreground">Interactive document viewer with annotations and collaboration tools</p><div className="flex items-center justify-center gap-4"><Badge variant="outline" className="flex items-center gap-2"><Eye className="h-3 w-3" />Interactive</Badge><Badge variant="outline" className="flex items-center gap-2"><Target className="h-3 w-3" />Annotations</Badge><Badge variant="outline" className="flex items-center gap-2"><Activity className="h-3 w-3" />Collaboration</Badge></div></div></motion.div>)}

      {/* Toolbar */}<motion.div
        className={`${isFullscreen ? 'container mx-auto' : 'container mx-auto'} pb-4`}
        variants={toolbarVariants}
      ><Card><CardContent className="py-3"><div className="flex items-center justify-between flex-wrap gap-4"><div className="flex items-center space-x-2"><h2 className="font-semibold text-lg truncate max-w-xs">{currentReport.title}</h2><Badge variant="outline">{currentReport.type.toUpperCase()}</Badge><Badge variant="outline" className="flex items-center gap-1"><FileText className="h-3 w-3" />{currentReport.pages} pages</Badge></div><div className="flex items-center space-x-2"><div className="flex items-center space-x-1 border rounded"><Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>navigateToPage(currentPage - 1)}
                    disabled={currentPage<= 1}
                  ><ArrowLeft className="h-3 w-3" /></Button><Input
                    type="number"
                    value={currentPage}
                    onChange={e => navigateToPage(parseInt(e.target.value) || 1)}
                    className="w-16 text-center text-sm border-0"
                    min={1}
                    max={currentReport.pages}
                  /><span className="text-sm text-muted-foreground px-2">of {currentReport.pages}</span><Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage >= currentReport.pages}
                  ><ArrowRight className="h-3 w-3" /></Button></div><div className="flex items-center space-x-1 border rounded"><Button variant="ghost" size="sm" onClick={handleZoomOut}><ZoomOut className="h-3 w-3" /></Button><span className="text-sm px-2 min-w-16 text-center">{viewerSettings.zoom}%</span><Button variant="ghost" size="sm" onClick={handleZoomIn}><ZoomIn className="h-3 w-3" /></Button></div><Button variant="outline" size="sm" onClick={handleFitToWidth}><Layers className="h-3 w-3 mr-1" />Fit</Button><Button variant="outline" size="sm" onClick={handleRotate}><RotateCw className="h-3 w-3" /></Button><Button variant="outline" size="sm" onClick={() =>setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? (<Minimize className="h-3 w-3" />) : (<Maximize className="h-3 w-3" />)}</Button><Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-3 w-3" /></Button><Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-3 w-3" /></Button><Button variant="outline" size="sm" onClick={handlePrint}><Print className="h-3 w-3" /></Button></div></div></CardContent></Card></motion.div>{/* Main Content */}<div className={`${isFullscreen ? 'container mx-auto' : 'container mx-auto'} pb-8`}><div className="grid grid-cols-12 gap-6">{/* Sidebar */}<motion.div className="col-span-12 lg:col-span-3 space-y-4" variants={cardVariants}><Tabs defaultValue="toc" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="toc">TOC</TabsTrigger><TabsTrigger value="search">Search</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger></TabsList><TabsContent value="toc" className="space-y-2"><Card><CardHeader className="pb-3"><CardTitle className="text-sm">Table of Contents</CardTitle></CardHeader><CardContent><ScrollArea className="h-64"><div className="space-y-2">{currentReport.content.sections.map(section => (<button
                            key={section.id}
                            onClick={() => navigateToPage(section.pageNumber)}
                            className={`text-left w-full p-2 rounded text-sm hover:bg-accent transition-colors ${
                              currentPage === section.pageNumber ? 'bg-accent' : ''}`}
                          ><div className="font-medium">{section.title}</div><div className="text-xs text-muted-foreground">Page {section.pageNumber}</div></button>))}</div></ScrollArea></CardContent></Card></TabsContent><TabsContent value="search" className="space-y-2"><Card><CardHeader className="pb-3"><CardTitle className="text-sm">Search Report</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex items-center space-x-2"><Input
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={e => handleSearch(e.target.value)}
                          className="text-sm"
                        /><Button size="sm" variant="outline"><Search className="h-3 w-3" /></Button></div>{searchResults.length > 0 && (<ScrollArea className="h-48"><div className="space-y-2">{searchResults.map(result => (<button
                                key={result.page}
                                onClick={() => navigateToPage(result.page)}
                                className="text-left w-full p-2 rounded text-sm hover:bg-accent transition-colors"
                              ><div className="font-medium">Page {result.page}</div><div className="text-xs text-muted-foreground">{result.matches} match{result.matches !== 1 ? 'es' : ''}</div></button>))}</div></ScrollArea>)}

                      {searchTerm && searchResults.length === 0 && (<div className="text-sm text-muted-foreground text-center py-4">No results found</div>)}</div></CardContent></Card></TabsContent><TabsContent value="notes" className="space-y-2"><Card><CardHeader className="pb-3"><CardTitle className="text-sm">Annotations</CardTitle></CardHeader><CardContent><ScrollArea className="h-64"><div className="space-y-2">{annotations.map(annotation => (<div key={annotation.id} className="p-2 border rounded text-sm"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{getAnnotationIcon(annotation.type)} {annotation.type}</span><Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>handleDeleteAnnotation(annotation.id)}
                                className="h-4 w-4 p-0"
                              >
                                ×</Button></div><div className="text-xs text-muted-foreground mb-1">Page {annotation.pageNumber} • {annotation.createdBy}</div><div>{annotation.content}</div></div>))}</div></ScrollArea></CardContent></Card></TabsContent></Tabs></motion.div>{/* Viewer */}<motion.div className="col-span-12 lg:col-span-9" variants={cardVariants}><Card className="min-h-96"><CardContent className="p-6"><div
                  ref={viewerRef}
                  className="relative bg-white border rounded-lg shadow-sm overflow-hidden"
                  style={{
                    transform: `scale(${viewerSettings.zoom / 100}) rotate(${viewerSettings.rotation}deg)`,
                    transformOrigin: 'top left',
                    height: `${600 * (viewerSettings.zoom / 100)}px`,
                    width: viewerSettings.fitToWidth
                      ? '100%'
                      : `${800 * (viewerSettings.zoom / 100)}px`,
                  }}
                >{/* Document Content */}<div className="p-8 min-h-full bg-white relative">{/* Page Header */}<div className="text-center mb-8 border-b pb-4"><h1 className="text-2xl font-bold mb-2">{currentReport.content.metadata.title}</h1><p className="text-muted-foreground">Page {currentPage} of {currentReport.pages}</p></div>{/* Content Sections for Current Page */}
                    {currentReport.content.sections
                      .filter(section => section.pageNumber === currentPage)
                      .map(section => (<div
                          key={section.id}
                          className="mb-6 relative"
                          style={{
                            position: 'relative',
                            left: section.position.x,
                            top: section.position.y,
                            width: section.position.width,
                            minHeight: section.position.height,}}
                        ><h2 className="text-xl font-semibold mb-3">{section.title}</h2>{section.type === 'text' && (<div className="prose max-w-none"><p>{section.content as string}</p></div>)}

                          {section.type === 'table' && (<div className="overflow-auto"><table className="w-full border-collapse border border-gray-300"><thead><tr className="bg-gray-50">{(section.content as TableData).headers.map((header, index) => (<th
                                        key={index}
                                        className="border border-gray-300 px-3 py-2 text-left font-medium"
                                      >{header}</th>))}</tr></thead><tbody>{(section.content as TableData).rows.map((row, rowIndex) => (<tr key={rowIndex}>{row.map((cell, cellIndex) => (<td
                                          key={cellIndex}
                                          className="border border-gray-300 px-3 py-2"
                                        >{cell}</td>))}</tr>))}</tbody></table>{(section.content as TableData).caption && (<p className="text-sm text-muted-foreground mt-2 text-center">{(section.content as TableData).caption}</p>)}</div>)}

                          {section.type === 'chart' && (<div className="bg-gray-50 p-4 rounded border"><h3 className="font-medium mb-3">{(section.content as ChartData).title}</h3><div className="space-y-2">{(section.content as ChartData).data.map((item, index) => (<div key={index} className="flex justify-between"><span>{item.label}</span><span className="font-mono">${item.value.toLocaleString()}</span></div>))}</div></div>)}</div>))}

                    {/* Annotations Overlay */}
                    {viewerSettings.showAnnotations &&
                      getCurrentPageAnnotations().map(annotation => (<div
                          key={annotation.id}
                          className={`absolute pointer-events-none ${
                            annotation.type === 'highlight'
                              ? 'bg-yellow-200 bg-opacity-50'
                              : 'bg-blue-100 border border-blue-300 rounded p-1'}`}
                          style={{
                            left: annotation.position.x,
                            top: annotation.position.y,
                            width: annotation.position.width || 'auto',
                            height: annotation.position.height || 'auto',}}
                          title={annotation.content}
                        >{annotation.type !== 'highlight' && (<div className="text-xs font-medium">{getAnnotationIcon(annotation.type)} {annotation.content}</div>)}</div>))}</div></div></CardContent></Card></motion.div></div></div>{/* Features Overview */}
      {!isFullscreen && (<motion.div className="container mx-auto pb-8" variants={cardVariants}><Alert className="border-purple-200 bg-purple-50"><Eye className="h-4 w-4" /><AlertDescription><strong>Advanced Document Viewer:</strong>Interactive report viewing with zoom
              controls, rotation, full-screen mode, search functionality, annotation system, table
              of contents navigation, and collaborative commenting features.</AlertDescription></Alert></motion.div>)}</motion.div>
  );
}
