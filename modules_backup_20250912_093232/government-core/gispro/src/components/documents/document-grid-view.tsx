import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {motion, AnimatePresence, LayoutGroup} from 'framer-motion';
import {Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,} from '../ui';
import {FileText,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Download,
  Eye,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Calendar,
  User,
  FileIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus,
  Archive,
  Tag,
  Share2,} from 'lucide-react';
import {DocumentConfidenceIndicator} from './document-confidence-indicator';
import {cn} from '../../lib/utils';

// Enhanced document interface
interface Document {id: string;
  name: string;
  type: string;
  typeLabel?: string;
  size: number;
  uploadDate: Date;
  lastModified: Date;
  status: 'processing' | 'completed' | 'error' | 'archived';
  confidence?: number;
  thumbnail?: string;
  tags?: string[];
  description?: string;
  author?: string;
  version?: number;
  isStarred?: boolean;
  isSelected?: boolean;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    format?: string;
    classification?: string;};
  parcelAssociations?: Array<{parcelId: string;
    parcelNumber: string;
    associationType: 'primary' | 'secondary';}>;
}

interface DocumentGridViewProps {documents: Document[];
  loading?: boolean;
  error?: string;
  onDocumentSelect?: (document: Document) => void;
  onDocumentEdit?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentDownload?: (document: Document) => void;
  onDocumentStar?: (documentId: string, starred: boolean) => void;
  onBulkAction?: (action: string, documentIds: string[]) => void;
  onRefresh?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  enableSelection?: boolean;
  enableBulkActions?: boolean;
  showUploadButton?: boolean;
  onUpload?: () => void;
  className?: string;}

// View mode options
type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'uploadDate' | 'size' | 'type' | 'lastModified';
type SortDirection = 'asc' | 'desc';

// Filter options
interface FilterOptions {search: string;
  type: string;
  status: string;
  dateRange: string;
  tags: string[];
  starred: boolean | null;}

/**
 * Comprehensive Document Grid View component
 * Displays documents in grid or list format with advanced filtering,
 * sorting, selection, and bulk operations.
 */
export function DocumentGridView({documents,
  loading = false,
  error,
  onDocumentSelect,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentStar,
  onBulkAction,
  onRefresh,
  viewMode = 'grid',
  onViewModeChange,
  enableSelection = false,
  enableBulkActions = false,
  showUploadButton = true,
  onUpload,
  className,}: DocumentGridViewProps) {// State management
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);
  const [sortField, setSortField] = useState<SortField>('uploadDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: '',
    status: '',
    dateRange: '',
    tags: [],
    starred: null,});

  // Document type mapping for better display
  const documentTypeMap = useMemo(
    () => ({deed: { label: 'Deed', color: 'bg-blue-100 text-blue-800'},
      survey: {label: 'Survey', color: 'bg-green-100 text-green-800'},
      plat: {label: 'Plat', color: 'bg-purple-100 text-purple-800'},
      easement: {label: 'Easement', color: 'bg-orange-100 text-orange-800'},
      other: {label: 'Other', color: 'bg-gray-100 text-gray-800'},
    }),
    []
  );

  // Status mapping
  const statusMap = useMemo(
    () => ({processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: Clock},
      completed: {label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle},
      error: {label: 'Error', color: 'bg-red-100 text-red-800', icon: AlertCircle},
      archived: {label: 'Archived', color: 'bg-gray-100 text-gray-800', icon: Archive},
    }),
    []
  );

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {let filtered = documents.filter(doc => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !doc.name.toLowerCase().includes(searchLower) &&
          !doc.typeLabel?.toLowerCase().includes(searchLower) &&
          !doc.description?.toLowerCase().includes(searchLower)
        ) {
          return false;}
      }

      // Type filter
      if (filters.type && doc.type !== filters.type) return false;

      // Status filter
      if (filters.status && doc.status !== filters.status) return false;

      // Starred filter
      if (filters.starred !== null && doc.isStarred !== filters.starred) return false;

      // Tags filter
      if (filters.tags.length > 0) {const docTags = doc.tags || [];
        if (!filters.tags.some(tag => docTags.includes(tag))) return false;}

      return true;
    });

    // Sort documents
    filtered.sort((a, b) => {let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'uploadDate':
          aValue = a.uploadDate.getTime();
          bValue = b.uploadDate.getTime();
          break;
        case 'lastModified':
          aValue = a.lastModified.getTime();
          bValue = b.lastModified.getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.typeLabel || a.type;
          bValue = b.typeLabel || b.type;
          break;
        default:
          return 0;}

      if (aValue< bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, filters, sortField, sortDirection]);

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {setCurrentViewMode(mode);
      onViewModeChange?.(mode);},
    [onViewModeChange]
  );

  // Handle document selection
  const handleDocumentSelection = useCallback(
    (documentId: string, selected: boolean) => {const newSelected = new Set(selectedDocuments);
      if (selected) {
        newSelected.add(documentId);} else {newSelected.delete(documentId);}
      setSelectedDocuments(newSelected);
    },
    [selectedDocuments]
  );

  // Handle select all
  const handleSelectAll = useCallback(
    (selected: boolean) => {if (selected) {
        setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));} else {setSelectedDocuments(new Set());}
    },
    [filteredAndSortedDocuments]
  );

  // Handle bulk actions
  const handleBulkAction = useCallback(
    (action: string) => {const selectedIds = Array.from(selectedDocuments);
      if (selectedIds.length > 0) {
        onBulkAction?.(action, selectedIds);
        setSelectedDocuments(new Set());}
    },
    [selectedDocuments, onBulkAction]
  );

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];}, []);

  // Format date
  const formatDate = useCallback((date: Date) => {return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',});
  }, []);

  // Get unique document types for filter
  const documentTypes = useMemo(() => {const types = new Set(documents.map(doc => doc.type));
    return Array.from(types);}, [documents]);

  // Get unique tags for filter
  const allTags = useMemo(() => {const tags = new Set<string>();
    documents.forEach(doc =>{
      doc.tags?.forEach(tag => tags.add(tag));});
    return Array.from(tags);
  }, [documents]);

  // Loading state
  if (loading) {
    return (<div className={cn('space-y-6', className)}><div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({length: 8}).map((_, i) => (<Skeleton key={i} className="h-48 w-full" />))}</div></div>);
  }

  // Error state
  if (error) {
    return (<div className={cn('space-y-6', className)}><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error loading documents</AlertTitle><AlertDescription><p className="mt-1 text-sm text-red-600">{error}</p>{onRefresh && (<Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-1" />Try Again</Button>)}</AlertDescription></Alert></div>);
  }

  return (<TooltipProvider><div className={cn('space-y-6', className)}>{/* Header with actions */}<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Documents</h2><p className="text-muted-foreground">{filteredAndSortedDocuments.length} of {documents.length} documents</p></div><div className="flex items-center gap-2">{showUploadButton && onUpload && (<Button onClick={onUpload}><Plus className="h-4 w-4 mr-1" />Upload</Button>)}

            {onRefresh && (<Button variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button>)}</div></div>{/* Filters and search */}<div className="flex flex-col lg:flex-row gap-4">{/* Search */}<div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /><Input
                placeholder="Search documents..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value}))}
                className="pl-10"
              /></div></div>{/* Filters */}<div className="flex flex-wrap gap-2"><Select
              value={filters.type}
              onValueChange={value => setFilters(prev => ({ ...prev, type: value}))}
            ><SelectTrigger className="w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="">All Types</SelectItem>{documentTypes.map(type => (<SelectItem key={type} value={type}>{documentTypeMap[type as keyof typeof documentTypeMap]?.label || type}</SelectItem>))}</SelectContent></Select><Select
              value={filters.status}
              onValueChange={value => setFilters(prev => ({ ...prev, status: value}))}
            ><SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="">All Status</SelectItem>{Object.entries(statusMap).map(([status, config]) => (<SelectItem key={status} value={status}>{config.label}</SelectItem>))}</SelectContent></Select>{/* Sort controls */}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="gap-1"><ArrowUpDown className="h-4 w-4" />Sort</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Sort by</DropdownMenuLabel><DropdownMenuSeparator />{[
                  {field: 'name', label: 'Name'},
                  {field: 'uploadDate', label: 'Upload Date'},
                  {field: 'lastModified', label: 'Modified'},
                  {field: 'size', label: 'Size'},
                  {field: 'type', label: 'Type'},
                ].map(({field, label}) => (<DropdownMenuItem
                    key={field}
                    onClick={() =>{
                      if (sortField === field) {
                        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));} else {setSortField(field as SortField);
                        setSortDirection('asc');}
                    }}
                    className="flex items-center justify-between"
                  >
                    {label}
                    {sortField === field &&
                      (sortDirection === 'asc' ? (<SortAsc className="h-4 w-4" />) : (<SortDesc className="h-4 w-4" />))}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu>{/* View mode toggle */}<div className="flex border rounded-md"><Button
                variant={currentViewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => handleViewModeChange('grid')}
              ><Grid3X3 className="h-4 w-4" /></Button><Button
                variant={currentViewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => handleViewModeChange('list')}
              ><List className="h-4 w-4" /></Button></div></div></div>{/* Bulk actions bar */}
        {enableBulkActions && selectedDocuments.size > 0 && (<motion.div
            initial={{ opacity: 0, y: -20}}
            animate={{ opacity: 1, y: 0}}
            className="flex items-center justify-between p-3 bg-muted rounded-lg border"
          ><span className="text-sm font-medium">{selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected</span><div className="flex gap-2"><Button size="sm" onClick={() => handleBulkAction('download')}><Download className="h-4 w-4 mr-1" />Download</Button><Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}><Archive className="h-4 w-4 mr-1" />Archive</Button><Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}><Trash2 className="h-4 w-4 mr-1" />Delete</Button></div></motion.div>)}

        {/* Document grid/list */}<LayoutGroup>{currentViewMode === 'grid' ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"><AnimatePresence>{filteredAndSortedDocuments.map(document => (<DocumentGridCard
                    key={document.id}
                    document={document}
                    onSelect={onDocumentSelect}
                    onEdit={onDocumentEdit}
                    onDelete={onDocumentDelete}
                    onDownload={onDocumentDownload}
                    onStar={onDocumentStar}
                    enableSelection={enableSelection}
                    isSelected={selectedDocuments.has(document.id)}
                    onSelectionChange={handleDocumentSelection}
                    documentTypeMap={documentTypeMap}
                    statusMap={statusMap}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate} />))}</AnimatePresence></div>) : (<DocumentListView
              documents={filteredAndSortedDocuments}
              onSelect={onDocumentSelect}
              onEdit={onDocumentEdit}
              onDelete={onDocumentDelete}
              onDownload={onDocumentDownload}
              onStar={onDocumentStar}
              enableSelection={enableSelection}
              selectedDocuments={selectedDocuments}
              onSelectionChange={handleDocumentSelection}
              onSelectAll={handleSelectAll}
              documentTypeMap={documentTypeMap}
              statusMap={statusMap}
              formatFileSize={formatFileSize}
              formatDate={formatDate} />)}</LayoutGroup>{/* Empty state */}
        {filteredAndSortedDocuments.length === 0 && !loading && (<motion.div
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            className="text-center py-12"
          ><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No documents found</h3><p className="text-muted-foreground mb-4">{filters.search || filters.type || filters.status
                ? 'Try adjusting your filters to see more documents.'
                : 'Upload your first document to get started.'}</p>{showUploadButton && onUpload && (<Button onClick={onUpload}><Plus className="h-4 w-4 mr-1" />Upload Document</Button>)}</motion.div>)}</div></TooltipProvider>);
}

// Document card component for grid view
interface DocumentGridCardProps {document: Document;
  onSelect?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onDownload?: (document: Document) => void;
  onStar?: (documentId: string, starred: boolean) => void;
  enableSelection: boolean;
  isSelected: boolean;
  onSelectionChange: (documentId: string, selected: boolean) => void;
  documentTypeMap: any;
  statusMap: any;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;}

function DocumentGridCard({document,
  onSelect,
  onEdit,
  onDelete,
  onDownload,
  onStar,
  enableSelection,
  isSelected,
  onSelectionChange,
  documentTypeMap,
  statusMap,
  formatFileSize,
  formatDate,}: DocumentGridCardProps) {
  const typeConfig = documentTypeMap[document.type] || documentTypeMap.other;
  const statusConfig = statusMap[document.status];
  const StatusIcon = statusConfig.icon;

  return (<motion.div
      layout
      initial={{ opacity: 0, scale: 0.9}}
      animate={{ opacity: 1, scale: 1}}
      exit={{ opacity: 0, scale: 0.9}}
      transition={{ duration: 0.2}}
    ><Card
        className={cn(
          'group hover:shadow-md transition-all duration-200 cursor-pointer',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
      ><CardHeader className="pb-2"><div className="flex items-start justify-between"><div className="flex items-center gap-2 flex-1 min-w-0">{enableSelection && (<Checkbox
                  checked={isSelected}
                  onCheckedChange={checked =>onSelectionChange(document.id, checked as boolean)}
                />
              )}<div className="min-w-0 flex-1"><div className="flex items-center gap-1 mb-1"><FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" /><Badge variant="secondary" className={cn('text-xs', typeConfig.color)}>{typeConfig.label}</Badge></div><h3 className="font-medium text-sm truncate">{document.name}</h3></div></div><div className="flex items-center gap-1">{onStar && (<Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e =>{
                    e.stopPropagation();
                    onStar(document.id, !document.isStarred);}}
                >
                  {document.isStarred ? (<Star className="h-3 w-3 fill-current text-yellow-500" />) : (<StarOff className="h-3 w-3" />)}</Button>)}<DropdownMenu><DropdownMenuTrigger asChild><Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  ><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{onSelect && (<DropdownMenuItem onClick={() => onSelect(document)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>)}
                  {onEdit && (<DropdownMenuItem onClick={() => onEdit(document)}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>)}
                  {onDownload && (<DropdownMenuItem onClick={() => onDownload(document)}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>)}<DropdownMenuSeparator />{onDelete && (<DropdownMenuItem
                      onClick={() => onDelete(document.id)}
                      className="text-red-600"
                    ><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div></div></CardHeader><CardContent className="pt-0 space-y-3" onClick={() =>onSelect?.(document)}>
          {/* Thumbnail or icon */}<div className="aspect-[4/3] bg-muted rounded flex items-center justify-center">{document.thumbnail ? (<img
                src={document.thumbnail}
                alt={document.name}
                className="w-full h-full object-cover rounded" />) : (<FileText className="h-8 w-8 text-muted-foreground" />)}</div>{/* Document info */}<div className="space-y-2"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{formatFileSize(document.size)}</span><div className="flex items-center gap-1"><StatusIcon className="h-3 w-3" /><span className={statusConfig.color}>{statusConfig.label}</span></div></div>{document.confidence !== undefined && (<DocumentConfidenceIndicator
                confidence={document.confidence}
                showPercentage={true}
                size="sm" />)}<div className="text-xs text-muted-foreground">{formatDate(document.uploadDate)}</div>{document.tags && document.tags.length > 0 && (<div className="flex flex-wrap gap-1">{document.tags.slice(0, 2).map((tag, index) => (<Badge key={index} variant="outline" className="text-xs">{tag}</Badge>))}
                {document.tags.length > 2 && (<Badge variant="outline" className="text-xs">+{document.tags.length - 2}</Badge>)}</div>)}</div></CardContent></Card></motion.div>
  );
}

// Document list view component
interface DocumentListViewProps {documents: Document[];
  onSelect?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onDownload?: (document: Document) => void;
  onStar?: (documentId: string, starred: boolean) => void;
  enableSelection: boolean;
  selectedDocuments: Set<string>;
  onSelectionChange: (documentId: string, selected: boolean) =>void;
  onSelectAll: (selected: boolean) => void;
  documentTypeMap: any;
  statusMap: any;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;}

function DocumentListView({documents,
  onSelect,
  onEdit,
  onDelete,
  onDownload,
  onStar,
  enableSelection,
  selectedDocuments,
  onSelectionChange,
  onSelectAll,
  documentTypeMap,
  statusMap,
  formatFileSize,
  formatDate,}: DocumentListViewProps) {
  const allSelected = documents.length > 0 && documents.every(doc => selectedDocuments.has(doc.id));
  const someSelected = documents.some(doc => selectedDocuments.has(doc.id));

  return (<Card><div className="overflow-auto"><table className="w-full"><thead><tr className="border-b">{enableSelection && (<th className="text-left p-3 w-12"><Checkbox
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected && !allSelected;}}
                    onCheckedChange={checked => onSelectAll(checked as boolean)}
                  /></th>)}<th className="text-left p-3">Name</th><th className="text-left p-3">Type</th><th className="text-left p-3">Size</th><th className="text-left p-3">Status</th><th className="text-left p-3">Modified</th><th className="text-right p-3 w-12"></th></tr></thead><tbody><AnimatePresence>{documents.map(document => {
                const typeConfig = documentTypeMap[document.type] || documentTypeMap.other;
                const statusConfig = statusMap[document.status];
                const StatusIcon = statusConfig.icon;

                return (<motion.tr
                    key={document.id}
                    layout
                    initial={{ opacity: 0}}
                    animate={{ opacity: 1}}
                    exit={{ opacity: 0}}
                    className={cn(
                      'border-b hover:bg-muted/50 transition-colors cursor-pointer',
                      selectedDocuments.has(document.id) && 'bg-muted/30'
                    )}
                    onClick={() =>onSelect?.(document)}
                  >
                    {enableSelection && (<td className="p-3"><Checkbox
                          checked={selectedDocuments.has(document.id)}
                          onCheckedChange={checked =>
                            onSelectionChange(document.id, checked as boolean)}
                          onClick={e => e.stopPropagation()}
                        /></td>)}<td className="p-3"><div className="flex items-center gap-2 min-w-0"><FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{document.name}</p>{document.description && (<p className="text-xs text-muted-foreground truncate">{document.description}</p>)}</div>{document.isStarred && (<Star className="h-3 w-3 fill-current text-yellow-500 flex-shrink-0" />)}</div></td><td className="p-3"><Badge variant="secondary" className={cn('text-xs', typeConfig.color)}>{typeConfig.label}</Badge></td><td className="p-3 text-sm text-muted-foreground">{formatFileSize(document.size)}</td><td className="p-3"><div className="flex items-center gap-1"><StatusIcon className="h-3 w-3" /><span className={cn('text-xs', statusConfig.color)}>{statusConfig.label}</span></div></td><td className="p-3 text-sm text-muted-foreground">{formatDate(document.lastModified)}</td><td className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={e => e.stopPropagation()}
                          ><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{onEdit && (<DropdownMenuItem onClick={() => onEdit(document)}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>)}
                          {onDownload && (<DropdownMenuItem onClick={() => onDownload(document)}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>)}
                          {onStar && (<DropdownMenuItem
                              onClick={() =>onStar(document.id, !document.isStarred)}
                            >
                              {document.isStarred ? (<><StarOff className="h-4 w-4 mr-2" />Remove Star</>) : (<><Star className="h-4 w-4 mr-2" />Add Star</>)}</DropdownMenuItem>)}<DropdownMenuSeparator />{onDelete && (<DropdownMenuItem
                              onClick={() => onDelete(document.id)}
                              className="text-red-600"
                            ><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></td></motion.tr>);
              })}</AnimatePresence></tbody></table></div></Card>
  );
}

export default DocumentGridView;
