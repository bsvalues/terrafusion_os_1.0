import React, {useState, useEffect, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Grid,
  List,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  FileText,
  Calendar,
  User,
  Tag,
  Star,
  Download,
  Eye,
  Edit,
  MoreVertical,
  Folder,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Share2,
  Copy,
  Archive,
  RefreshCw,
  Settings,
  ExternalLink,
  Bookmark,
  Flag,
  TrendingUp,
  BarChart3,
  Layers,
  Database,
  Shield,
  Zap,
  Activity,
  Target,
  Award,
  GitBranch,
  MessageSquare,
  History,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,} from 'lucide-react';

interface DocumentGridItem {id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  confidence?: number;
  isStarred: boolean;
  isBookmarked: boolean;
  size: number;
  version: string;
  classification?: {
    type: string;
    confidence: number;
    isVerified: boolean;};
  metrics?: {views: number;
    downloads: number;
    shares: number;
    collaborators: number;};
  thumbnail?: string;
  lastAccessedAt?: Date;
  permissions: {canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canDownload: boolean;};
}

interface FilterOptions {types: string[];
  categories: string[];
  statuses: string[];
  authors: string[];
  dateRange: {
    start?: Date;
    end?: Date;};
  confidenceRange: {min: number;
    max: number;};
  tags: string[];
  hasClassification: boolean | null;
  isStarred: boolean | null;
  isBookmarked: boolean | null;
}

interface DocumentGridViewProps {documents: DocumentGridItem[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  error?: string;
  selectedDocuments: string[];
  onDocumentSelect: (documentId: string) => void;
  onDocumentDeselect: (documentId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDocumentClick: (document: DocumentGridItem) => void;
  onDocumentEdit?: (document: DocumentGridItem) => void;
  onDocumentDelete?: (document: DocumentGridItem) => void;
  onDocumentDownload?: (document: DocumentGridItem) => void;
  onDocumentShare?: (document: DocumentGridItem) => void;
  onDocumentStar?: (document: DocumentGridItem) => void;
  onDocumentBookmark?: (document: DocumentGridItem) => void;
  onBulkAction?: (action: string, documentIds: string[]) => void;
  onRefresh?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
  filters?: Partial<FilterOptions>;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  itemsPerPage?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  showBulkActions?: boolean;
  showMetrics?: boolean;}

const DocumentGridView: React.FC<DocumentGridViewProps> = ({
  documents,
  viewMode,
  loading = false,
  error,
  selectedDocuments,
  onDocumentSelect,
  onDocumentDeselect,
  onSelectAll,
  onDeselectAll,
  onDocumentClick,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentShare,
  onDocumentStar,
  onDocumentBookmark,
  onBulkAction,
  onRefresh,
  searchQuery = '',
  onSearchChange,
  sortBy = 'updatedAt',
  sortOrder = 'desc',
  onSortChange,
  filters = {},
  onFiltersChange,
  showFilters = false,
  onToggleFilters,
  itemsPerPage = 20,
  currentPage = 1,
  totalItems,
  onPageChange,
  showBulkActions = true,
  showMetrics = true,
}) => {const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bulkActionMenu, setBulkActionMenu] = useState(false);

  const handleSearchChange = (value: string) =>{
    setLocalSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);}
  };

  const handleDocumentToggle = (document: DocumentGridItem) => {if (selectedDocuments.includes(document.id)) {
      onDocumentDeselect(document.id);} else {onDocumentSelect(document.id);}
  };

  const handleBulkAction = (action: string) => {if (onBulkAction && selectedDocuments.length > 0) {
      onBulkAction(action, selectedDocuments);}
    setBulkActionMenu(false);
  };

  const getStatusColor = (status: string) => {switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';}
  };

  const getConfidenceColor = (confidence: number) => {if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';};

  const formatFileSize = (bytes: number) => {const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];};

  const formatDate = (date: Date) => {return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',}).format(date);
  };

  const filteredAndSortedDocuments = useMemo(() => {let filtered = documents;

    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.author.toLowerCase().includes(query) ||
          doc.tags.some(tag => tag.toLowerCase().includes(query))
      );}

    if (filters.types && filters.types.length > 0) {filtered = filtered.filter(doc => filters.types!.includes(doc.type));}

    if (filters.categories && filters.categories.length > 0) {filtered = filtered.filter(doc => filters.categories!.includes(doc.category));}

    if (filters.statuses && filters.statuses.length > 0) {filtered = filtered.filter(doc => filters.statuses!.includes(doc.status));}

    if (filters.authors && filters.authors.length > 0) {filtered = filtered.filter(doc => filters.authors!.includes(doc.author));}

    if (filters.isStarred !== null) {filtered = filtered.filter(doc => doc.isStarred === filters.isStarred);}

    if (filters.isBookmarked !== null) {filtered = filtered.filter(doc => doc.isBookmarked === filters.isBookmarked);}

    if (filters.hasClassification !== null) {filtered = filtered.filter(doc => !!doc.classification === filters.hasClassification);}

    filtered.sort((a, b) => {let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'confidence':
          aValue = a.classification?.confidence || 0;
          bValue = b.classification?.confidence || 0;
          break;
        default:
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();}

      if (sortOrder === 'asc') {return aValue > bValue ? 1 : -1;} else {return aValue< bValue ? 1 : -1;}
    });

    return filtered;
  }, [documents, localSearchQuery, filters, sortBy, sortOrder]);

  const paginatedDocuments = useMemo(() =>{const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDocuments.slice(startIndex, startIndex + itemsPerPage);}, [filteredAndSortedDocuments, currentPage, itemsPerPage]);

  const containerVariants = {hidden: { opacity: 0},
    visible: {opacity: 1,
      transition: {
        staggerChildren: 0.05,},
    },
  };

  const itemVariants = {hidden: { opacity: 0, y: 20},
    visible: {opacity: 1, y: 0},
  };

  return (<div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"><div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div className="flex-1"><h2 className="text-xl font-semibold text-gray-900 mb-2">Document Library</h2><div className="flex items-center gap-4 text-sm text-gray-600"><span>{filteredAndSortedDocuments.length} documents</span>{selectedDocuments.length > 0 && (<span className="text-blue-600 font-medium">{selectedDocuments.length} selected</span>)}
              {totalItems &&<span>Total: {totalItems}</span>}
            </div></div><div className="flex-1 max-w-md"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input
                type="text"
                placeholder="Search documents..."
                value={localSearchQuery}
                onChange={e =>handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {localSearchQuery && (<button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                ><X className="w-4 h-4" /></button>)}</div></div><div className="flex items-center gap-2">{onRefresh && (<button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              ><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>)}

            {onToggleFilters && (<button
                onClick={onToggleFilters}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              ><Filter className="w-4 h-4" /></button>)}<div className="flex items-center border border-gray-300 rounded-lg"><button
                onClick={() => {}}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              ><Grid className="w-4 h-4" /></button><button
                onClick={() => {}}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              ><List className="w-4 h-4" /></button></div></div></div><AnimatePresence>{showFilters && (<motion.div
              initial={{ opacity: 0, height: 0}}
              animate={{ opacity: 1, height: 'auto'}}
              exit={{ opacity: 0, height: 0}}
              className="mt-4 pt-4 border-t border-gray-200"
            ><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select
                    value={filters.types?.[0] || ''}
                    onChange={e =>
                      onFiltersChange?.({
                        ...filters,
                        types: e.target.value ? [e.target.value] : [],})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ><option value="">All Types</option><option value="pdf">PDF</option><option value="doc">Document</option><option value="spreadsheet">Spreadsheet</option><option value="presentation">Presentation</option><option value="image">Image</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select
                    value={filters.statuses?.[0] || ''}
                    onChange={e =>
                      onFiltersChange?.({
                        ...filters,
                        statuses: e.target.value ? [e.target.value] : [],})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ><option value="">All Statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="under_review">Under Review</option><option value="archived">Archived</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label><select
                    value={sortBy}
                    onChange={e => onSortChange?.(e.target.value, sortOrder)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ><option value="updatedAt">Last Modified</option><option value="createdAt">Created Date</option><option value="title">Title</option><option value="author">Author</option><option value="size">File Size</option><option value="confidence">Confidence</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Order</label><button
                    onClick={() =>onSortChange?.(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? (<React.Fragment><SortAsc className="w-4 h-4" />Ascending</React.Fragment>) : (<React.Fragment><SortDesc className="w-4 h-4" />Descending</React.Fragment>)}</button></div></div></motion.div>)}</AnimatePresence></div>{showBulkActions && selectedDocuments.length > 0 && (<div className="px-6 py-3 bg-blue-50 border-b border-blue-200"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><span className="text-sm font-medium text-blue-900">{selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}{' '}
                selected</span><div className="flex items-center gap-2"><button
                  onClick={() => handleBulkAction('download')}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
                ><Download className="w-4 h-4 mr-1 inline" />Download</button><button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
                ><Archive className="w-4 h-4 mr-1 inline" />Archive</button><button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                ><Trash2 className="w-4 h-4 mr-1 inline" />Delete</button></div></div><button onClick={onDeselectAll} className="text-sm text-blue-600 hover:text-blue-700">Clear Selection</button></div></div>)}<div className="p-6">{error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><div className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-5 h-5" /><span className="font-medium">Error loading documents</span></div><p className="mt-1 text-sm text-red-600">{error}</p></div>)}

        {loading ? (<div className="flex items-center justify-center py-12"><div className="flex items-center gap-3 text-gray-500"><RefreshCw className="w-5 h-5 animate-spin" /><span>Loading documents...</span></div></div>) : paginatedDocuments.length === 0 ? (<div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3><p className="text-gray-500">{localSearchQuery ||
              Object.keys(filters).some(key => filters[key as keyof FilterOptions])
                ? 'Try adjusting your search or filters'
                : 'Start by uploading your first document'}</p></div>) : (<React.Fragment>{viewMode === 'grid' && (<motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >{paginatedDocuments.map(document => (<motion.div
                    key={document.id}
                    variants={itemVariants}
                    className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                      selectedDocuments.includes(document.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => onDocumentClick(document)}
                  ><div className="p-4"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2"><input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={e => {
                              e.stopPropagation();
                              handleDocumentToggle(document);}}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          /><FileText className="w-5 h-5 text-blue-600" /></div><div className="flex items-center gap-1">{document.isStarred && (<Star className="w-4 h-4 text-yellow-500 fill-current" />)}
                          {document.isBookmarked && (<Bookmark className="w-4 h-4 text-blue-500 fill-current" />)}
                          {document.classification?.isVerified && (<Shield className="w-4 h-4 text-green-500" />)}</div></div><h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{document.title}</h3>{document.description && (<p className="text-sm text-gray-600 mb-3 line-clamp-2">{document.description}</p>)}<div className="flex items-center gap-2 mb-3"><span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}
                        >{document.status.replace('_', ' ')}</span><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{document.type.toUpperCase()}</span></div>{document.classification && (<div className="mb-3"><div className="flex items-center justify-between text-xs"><span className="text-gray-600">Classification</span><span
                              className={`font-medium ${getConfidenceColor(document.classification.confidence)}`}
                            >{(document.classification.confidence * 100).toFixed(1)}%</span></div><div className="mt-1 text-sm font-medium text-gray-900">{document.classification.type}</div></div>)}<div className="text-xs text-gray-500 space-y-1"><div className="flex items-center justify-between"><span>Size</span><span>{formatFileSize(document.size)}</span></div><div className="flex items-center justify-between"><span>Modified</span><span>{formatDate(document.updatedAt)}</span></div><div className="flex items-center justify-between"><span>Author</span><span className="truncate ml-2">{document.author}</span></div></div>{showMetrics && document.metrics && (<div className="mt-3 pt-3 border-t border-gray-100"><div className="grid grid-cols-2 gap-2 text-xs"><div className="flex items-center gap-1 text-gray-500"><Eye className="w-3 h-3" /><span>{document.metrics.views}</span></div><div className="flex items-center gap-1 text-gray-500"><Download className="w-3 h-3" /><span>{document.metrics.downloads}</span></div><div className="flex items-center gap-1 text-gray-500"><Share2 className="w-3 h-3" /><span>{document.metrics.shares}</span></div><div className="flex items-center gap-1 text-gray-500"><User className="w-3 h-3" /><span>{document.metrics.collaborators}</span></div></div></div>)}

                      {document.tags.length > 0 && (<div className="mt-3 pt-3 border-t border-gray-100"><div className="flex flex-wrap gap-1">{document.tags.slice(0, 3).map((tag, index) => (<span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                              ><Tag className="w-3 h-3 mr-1" />{tag}</span>))}
                            {document.tags.length > 3 && (<span className="text-xs text-gray-500">+{document.tags.length - 3} more</span>)}</div></div>)}</div><div className="px-4 py-3 bg-gray-50 border-t border-gray-100"><div className="flex items-center justify-between"><div className="flex items-center gap-2">{document.permissions.canEdit && onDocumentEdit && (<button
                              onClick={e => {
                                e.stopPropagation();
                                onDocumentEdit(document);}}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            ><Edit className="w-4 h-4" /></button>)}

                          {document.permissions.canDownload && onDocumentDownload && (<button
                              onClick={e => {
                                e.stopPropagation();
                                onDocumentDownload(document);}}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            ><Download className="w-4 h-4" /></button>)}

                          {document.permissions.canShare && onDocumentShare && (<button
                              onClick={e => {
                                e.stopPropagation();
                                onDocumentShare(document);}}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            ><Share2 className="w-4 h-4" /></button>)}</div><div className="flex items-center gap-2">{onDocumentStar && (<button
                              onClick={e => {
                                e.stopPropagation();
                                onDocumentStar(document);}}
                              className={`p-1 transition-colors ${
                                document.isStarred
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-yellow-500'}`}
                            ><Star
                                className={`w-4 h-4 ${document.isStarred ? 'fill-current' : ''}`} /></button>)}

                          {onDocumentBookmark && (<button
                              onClick={e => {
                                e.stopPropagation();
                                onDocumentBookmark(document);}}
                              className={`p-1 transition-colors ${
                                document.isBookmarked
                                  ? 'text-blue-500 hover:text-blue-600'
                                  : 'text-gray-400 hover:text-blue-500'}`}
                            ><Bookmark
                                className={`w-4 h-4 ${document.isBookmarked ? 'fill-current' : ''}`} /></button>)}</div></div></div></motion.div>))}</motion.div>)}

            {viewMode === 'list' && (<div className="space-y-2">{paginatedDocuments.map(document => (<motion.div
                    key={document.id}
                    variants={itemVariants}
                    className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDocuments.includes(document.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'bg-white hover:bg-gray-50 hover:shadow-sm'}`}
                    onClick={() => onDocumentClick(document)}
                  ><div className="flex items-center gap-4"><input
                        type="checkbox"
                        checked={selectedDocuments.includes(document.id)}
                        onChange={e => {
                          e.stopPropagation();
                          handleDocumentToggle(document);}}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      /><FileText className="w-5 h-5 text-blue-600 flex-shrink-0" /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-medium text-gray-900 truncate">{document.title}</h3>{document.isStarred && (<Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />)}
                          {document.isBookmarked && (<Bookmark className="w-4 h-4 text-blue-500 fill-current flex-shrink-0" />)}
                          {document.classification?.isVerified && (<Shield className="w-4 h-4 text-green-500 flex-shrink-0" />)}</div>{document.description && (<p className="text-sm text-gray-600 truncate mb-2">{document.description}</p>)}<div className="flex items-center gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><User className="w-3 h-3" />{document.author}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(document.updatedAt)}</span><span>{formatFileSize(document.size)}</span><span className="uppercase">{document.type}</span></div></div><div className="flex flex-col items-end gap-2 flex-shrink-0"><span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}
                        >{document.status.replace('_', ' ')}</span>{document.classification && (<div className="text-right"><div
                              className={`text-xs font-medium ${getConfidenceColor(document.classification.confidence)}`}
                            >{(document.classification.confidence * 100).toFixed(1)}% confidence</div><div className="text-xs text-gray-600">{document.classification.type}</div></div>)}</div><div className="flex items-center gap-2 flex-shrink-0">{document.permissions.canEdit && onDocumentEdit && (<button
                            onClick={e => {
                              e.stopPropagation();
                              onDocumentEdit(document);}}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          ><Edit className="w-4 h-4" /></button>)}

                        {document.permissions.canDownload && onDocumentDownload && (<button
                            onClick={e => {
                              e.stopPropagation();
                              onDocumentDownload(document);}}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          ><Download className="w-4 h-4" /></button>)}

                        {document.permissions.canShare && onDocumentShare && (<button
                            onClick={e => {
                              e.stopPropagation();
                              onDocumentShare(document);}}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          ><Share2 className="w-4 h-4" /></button>)}<button className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><MoreVertical className="w-4 h-4" /></button></div></div></motion.div>))}</div>)}

            {totalItems && totalItems > itemsPerPage && (<div className="mt-6 flex items-center justify-between"><div className="text-sm text-gray-700">Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedDocuments.length)} of{' '}
                  {filteredAndSortedDocuments.length} documents</div><div className="flex items-center gap-2"><button
                    onClick={() =>onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous</button><div className="flex items-center gap-1">{Array.from(
                      {length: Math.min(
                          5,
                          Math.ceil(filteredAndSortedDocuments.length / itemsPerPage)
                        ),},
                      (_, i) => {
                        const page = i + 1;
                        return (<button
                            key={page}
                            onClick={() =>onPageChange?.(page)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === page
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            {page}</button>);
                      }
                    )}</div><button
                    onClick={() =>onPageChange?.(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= filteredAndSortedDocuments.length}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next</button></div></div>)}</React.Fragment>)}</div></div>
  );
};

export default DocumentGridView;
