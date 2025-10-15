import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileTextIcon,
  FileIcon,
  FilePlusIcon,
  FileEditIcon,
  FileCheckIcon,
  FileXIcon,
  DownloadIcon,
  UploadIcon,
  ShareIcon,
  StarIcon,
  StarOffIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  UsersIcon,
  TagIcon,
  LinkIcon,
  CopyIcon,
  TrashIcon,
  MoreHorizontalIcon,
  MessageCircleIcon,
  BookmarkIcon,
  BookmarkOffIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  ActivityIcon,
  LayersIcon,
  FolderIcon,
  FolderOpenIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  ZapIcon,
  RotateCcwIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  PrinterIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
  SearchIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  SettingsIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SkipBackIcon,
  SkipForwardIcon,
  VolumeXIcon,
  Volume2Icon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  CameraIcon,
  ImageIcon,
  PaperclipIcon,
  ScissorsIcon,
  HashIcon,
  AtSignIcon,
  DollarSignIcon,
  PercentIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  ListIcon,
  ColumnsIcon,
  RowsIcon,
  ExpandIcon,
  ShrinkIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoveIcon,
  RotateIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'image' | 'video' | 'audio' | 'other';
  size: number;
  format: string;
  version: string;
  created: Date;
  modified: Date;
  accessed?: Date;
  author: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'editor' | 'viewer' | 'commenter';
    lastAccessed?: Date;
  }>;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived' | 'deleted';
  visibility: 'private' | 'internal' | 'public' | 'restricted';
  tags?: string[];
  categories?: string[];
  location?: {
    folder: string;
    path: string;
    workspace?: string;
  };
  permissions: {
    read: boolean;
    write: boolean;
    share: boolean;
    delete: boolean;
    admin: boolean;
  };
  stats: {
    views: number;
    downloads: number;
    shares: number;
    comments: number;
    likes: number;
    bookmarks: number;
    edits: number;
    revisions: number;
  };
  content?: {
    preview?: string;
    thumbnail?: string;
    excerpt?: string;
    wordCount?: number;
    pageCount?: number;
    duration?: number;
  };
  workflow?: {
    stage: string;
    assignee?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    checklist?: Array<{
      id: string;
      task: string;
      completed: boolean;
      assignee?: string;
    }>;
  };
  security?: {
    encrypted: boolean;
    passwordProtected: boolean;
    watermarked: boolean;
    trackChanges: boolean;
    auditLog: boolean;
  };
  ai?: {
    analyzed: boolean;
    summary?: string;
    keywords?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    topics?: string[];
    readabilityScore?: number;
    language?: string;
  };
}

interface AnimatedListCardProps {
  documents: DocumentItem[];
  viewMode?: 'list' | 'compact' | 'detailed' | 'table';
  sortBy?: 'title' | 'modified' | 'created' | 'size' | 'type' | 'author' | 'status';
  sortOrder?: 'asc' | 'desc';
  filterBy?: {
    type?: DocumentItem['type'][];
    status?: DocumentItem['status'][];
    author?: string[];
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  };
  searchQuery?: string;
  selectedItems?: string[];
  showSelection?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  showStats?: boolean;
  showCollaborators?: boolean;
  itemsPerPage?: number;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  animationDelay?: number;
  staggerDelay?: number;
  hoverEffects?: boolean;
  clickableItems?: boolean;
  onItemSelect?: (item: DocumentItem) => void;
  onItemsSelect?: (items: string[]) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onFilterChange?: (filters: any) => void;
  onSearchChange?: (query: string) => void;
  onPreview?: (item: DocumentItem) => void;
  onEdit?: (item: DocumentItem) => void;
  onDownload?: (item: DocumentItem) => void;
  onShare?: (item: DocumentItem) => void;
  onDelete?: (item: DocumentItem) => void;
  onBulkAction?: (action: string, items: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedListCard: React.FC<AnimatedListCardProps> = ({
  documents,
  viewMode = 'list',
  sortBy = 'modified',
  sortOrder = 'desc',
  filterBy = {},
  searchQuery = '',
  selectedItems = [],
  showSelection = false,
  showFilters = true,
  showActions = true,
  showStats = true,
  showCollaborators = true,
  itemsPerPage = 20,
  enablePagination = true,
  enableVirtualization = false,
  animationDelay = 0,
  staggerDelay = 0.05,
  hoverEffects = true,
  clickableItems = true,
  onItemSelect,
  onItemsSelect,
  onSortChange,
  onFilterChange,
  onSearchChange,
  onPreview,
  onEdit,
  onDownload,
  onShare,
  onDelete,
  onBulkAction,
  className = '',
  style
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localSelectedItems, setLocalSelectedItems] = useState<string[]>(selectedItems);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get document type icon and color
  const getDocumentTypeDisplay = (type: DocumentItem['type']) => {
    switch (type) {
      case 'pdf':
        return { icon: FileTextIcon, color: 'text-red-600', bg: 'bg-red-50' };
      case 'doc':
      case 'docx':
        return { icon: FileTextIcon, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'txt':
      case 'md':
        return { icon: FileTextIcon, color: 'text-gray-600', bg: 'bg-gray-50' };
      case 'xls':
      case 'xlsx':
        return { icon: BarChart3Icon, color: 'text-green-600', bg: 'bg-green-50' };
      case 'ppt':
      case 'pptx':
        return { icon: LayersIcon, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'image':
        return { icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'video':
        return { icon: VideoIcon, color: 'text-pink-600', bg: 'bg-pink-50' };
      case 'audio':
        return { icon: Volume2Icon, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      default:
        return { icon: FileIcon, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // Get status display
  const getStatusDisplay = (status: DocumentItem['status']) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: FileEditIcon };
      case 'review':
        return { color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'published':
        return { color: 'bg-blue-100 text-blue-800', icon: GlobeIcon };
      case 'archived':
        return { color: 'bg-purple-100 text-purple-800', icon: FileIcon };
      case 'deleted':
        return { color: 'bg-red-100 text-red-800', icon: TrashIcon };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FileIcon };
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (localSearch) {
      const query = localSearch.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.author.name.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        doc.type.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterBy.type && filterBy.type.length > 0) {
      filtered = filtered.filter(doc => filterBy.type!.includes(doc.type));
    }

    // Apply status filter
    if (filterBy.status && filterBy.status.length > 0) {
      filtered = filtered.filter(doc => filterBy.status!.includes(doc.status));
    }

    // Apply author filter
    if (filterBy.author && filterBy.author.length > 0) {
      filtered = filtered.filter(doc => filterBy.author!.includes(doc.author.id));
    }

    // Apply tags filter
    if (filterBy.tags && filterBy.tags.length > 0) {
      filtered = filtered.filter(doc => 
        doc.tags?.some(tag => filterBy.tags!.includes(tag))
      );
    }

    // Apply date range filter
    if (filterBy.dateRange) {
      filtered = filtered.filter(doc => 
        doc.modified >= filterBy.dateRange!.start &&
        doc.modified <= filterBy.dateRange!.end
      );
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'modified':
          aValue = a.modified;
          bValue = b.modified;
          break;
        case 'created':
          aValue = a.created;
          bValue = b.created;
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'author':
          aValue = a.author.name.toLowerCase();
          bValue = b.author.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.modified;
          bValue = b.modified;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, localSearch, filterBy, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDocuments.length / itemsPerPage);
  const paginatedDocuments = enablePagination
    ? filteredAndSortedDocuments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredAndSortedDocuments;

  // Handle item selection
  const handleItemSelection = useCallback((itemId: string, selected: boolean) => {
    const newSelection = selected
      ? [...localSelectedItems, itemId]
      : localSelectedItems.filter(id => id !== itemId);
    
    setLocalSelectedItems(newSelection);
    onItemsSelect?.(newSelection);
  }, [localSelectedItems, onItemsSelect]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelection = selected
      ? paginatedDocuments.map(doc => doc.id)
      : [];
    
    setLocalSelectedItems(newSelection);
    onItemsSelect?.(newSelection);
  }, [paginatedDocuments, onItemsSelect]);

  // Handle item click
  const handleItemClick = useCallback((item: DocumentItem) => {
    if (clickableItems && onItemSelect) {
      onItemSelect(item);
    }
  }, [clickableItems, onItemSelect]);

  // Handle action click
  const handleActionClick = useCallback((action: string, item: DocumentItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    switch (action) {
      case 'preview':
        onPreview?.(item);
        break;
      case 'edit':
        onEdit?.(item);
        break;
      case 'download':
        onDownload?.(item);
        break;
      case 'share':
        onShare?.(item);
        break;
      case 'delete':
        onDelete?.(item);
        break;
    }
  }, [onPreview, onEdit, onDownload, onShare, onDelete]);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const types = [...new Set(documents.map(doc => doc.type))];
    const statuses = [...new Set(documents.map(doc => doc.status))];
    const authors = [...new Set(documents.map(doc => doc.author.name))];
    const tags = [...new Set(documents.flatMap(doc => doc.tags || []))];

    return { types, statuses, authors, tags };
  }, [documents]);

  // List item animation variants
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: animationDelay + (index * staggerDelay),
        ease: "easeOut"
      }
    }),
    hover: {
      scale: hoverEffects ? 1.01 : 1,
      y: hoverEffects ? -1 : 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // Render list item
  const renderListItem = (document: DocumentItem, index: number) => {
    const typeDisplay = getDocumentTypeDisplay(document.type);
    const statusDisplay = getStatusDisplay(document.status);
    const TypeIcon = typeDisplay.icon;
    const StatusIcon = statusDisplay.icon;
    const isSelected = localSelectedItems.includes(document.id);
    const isHovered = hoveredItem === document.id;

    return (
      <motion.div
        key={document.id}
        custom={index}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onHoverStart={() => setHoveredItem(document.id)}
        onHoverEnd={() => setHoveredItem(null)}
        className={`
          relative p-4 border rounded-lg transition-all cursor-pointer
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${hoverEffects ? 'hover:shadow-md' : ''}
        `}
        onClick={() => handleItemClick(document)}
      >
        <div className="flex items-center gap-4">
          {/* Selection checkbox */}
          {showSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleItemSelection(document.id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Document icon */}
          <div className={`p-2 rounded-lg ${typeDisplay.bg}`}>
            <TypeIcon className={`h-5 w-5 ${typeDisplay.color}`} />
          </div>

          {/* Document info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate mb-1">
                  {document.title}
                </h3>
                
                {viewMode === 'detailed' && document.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {document.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(document.size)}</span>
                  <span>•</span>
                  <span>{formatDate(document.modified)}</span>
                  <span>•</span>
                  <span>{document.author.name}</span>
                  {document.content?.pageCount && (
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>{document.content.pageCount} pages</span>
                    </div>
                  )}
                </div>

                {/* Tags and status */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${statusDisplay.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {document.status}
                  </Badge>
                  
                  {document.visibility !== 'private' && (
                    <Badge variant="outline" className="text-xs">
                      {document.visibility}
                    </Badge>
                  )}

                  {document.security?.encrypted && (
                    <LockIcon className="h-3 w-3 text-green-600" />
                  )}

                  {document.tags && document.tags.length > 0 && (
                    <div className="flex gap-1">
                      {document.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {document.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{document.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      <span>{document.stats.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DownloadIcon className="h-3 w-3" />
                      <span>{document.stats.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircleIcon className="h-3 w-3" />
                      <span>{document.stats.comments}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collaborators */}
            {showCollaborators && document.collaborators && document.collaborators.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Collaborators:</span>
                <div className="flex -space-x-1">
                  {document.collaborators.slice(0, 3).map((collaborator, collabIndex) => (
                    <Avatar key={collaborator.id} className="h-5 w-5 border border-white">
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback className="text-xs">
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {document.collaborators.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        +{document.collaborators.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow progress */}
            {viewMode === 'detailed' && document.workflow && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Workflow: {document.workflow.stage}</span>
                  <Badge 
                    className={`text-xs ${
                      document.workflow.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      document.workflow.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      document.workflow.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {document.workflow.priority}
                  </Badge>
                </div>
                
                {document.workflow.checklist && (
                  <div className="space-y-1">
                    {document.workflow.checklist.slice(0, 2).map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.completed ? (
                          <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                    {document.workflow.checklist.length > 2 && (
                      <div className="text-muted-foreground">
                        +{document.workflow.checklist.length - 2} more tasks
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <motion.div 
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0.7, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleActionClick('preview', document, e)}
                      className="h-8 w-8 p-0"
                    >
                      <EyeIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleActionClick('edit', document, e)}
                      className="h-8 w-8 p-0"
                      disabled={!document.permissions.write}
                    >
                      <FileEditIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleActionClick('download', document, e)}
                      className="h-8 w-8 p-0"
                    >
                      <DownloadIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleActionClick('share', document, e)}
                      className="h-8 w-8 p-0"
                      disabled={!document.permissions.share}
                    >
                      <ShareIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show more actions menu
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontalIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`} style={style}>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListIcon className="h-5 w-5" />
              Documents ({filteredAndSortedDocuments.length})
              {localSelectedItems.length > 0 && (
                <Badge variant="outline">
                  {localSelectedItems.length} selected
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* Bulk actions */}
              {localSelectedItems.length > 0 && onBulkAction && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBulkAction('download', localSelectedItems)}
                  >
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBulkAction('share', localSelectedItems)}
                  >
                    <ShareIcon className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBulkAction('delete', localSelectedItems)}
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}

              {/* View mode toggle */}
              <div className="flex items-center border rounded">
                <Button
                  size="sm"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  onClick={() => onFilterChange?.({ ...filterBy, viewMode: 'compact' })}
                  className="h-8 px-2"
                >
                  <RowsIcon className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => onFilterChange?.({ ...filterBy, viewMode: 'list' })}
                  className="h-8 px-2"
                >
                  <ListIcon className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  onClick={() => onFilterChange?.({ ...filterBy, viewMode: 'detailed' })}
                  className="h-8 px-2"
                >
                  <ExpandIcon className="h-3 w-3" />
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedFilters(!expandedFilters)}
              >
                <FilterIcon className="h-3 w-3 mr-1" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search documents..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange?.(e.target.value, sortOrder)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="modified">Modified</option>
                  <option value="created">Created</option>
                  <option value="title">Title</option>
                  <option value="size">Size</option>
                  <option value="type">Type</option>
                  <option value="author">Author</option>
                  <option value="status">Status</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSortChange?.(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  {sortOrder === 'asc' ? (
                    <SortAscIcon className="h-3 w-3" />
                  ) : (
                    <SortDescIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {showSelection && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={localSelectedItems.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select all</span>
                </div>
              )}
            </div>

            {/* Expanded filters */}
            <AnimatePresence>
              {expandedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-4 gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <select
                      multiple
                      value={filterBy.type || []}
                      onChange={(e) => {
                        const selectedTypes = Array.from(e.target.selectedOptions, option => option.value) as DocumentItem['type'][];
                        onFilterChange?.({ ...filterBy, type: selectedTypes });
                      }}
                      className="w-full text-sm border rounded px-2 py-1 max-h-20"
                    >
                      {filterOptions.types.map(type => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <select
                      multiple
                      value={filterBy.status || []}
                      onChange={(e) => {
                        const selectedStatuses = Array.from(e.target.selectedOptions, option => option.value) as DocumentItem['status'][];
                        onFilterChange?.({ ...filterBy, status: selectedStatuses });
                      }}
                      className="w-full text-sm border rounded px-2 py-1 max-h-20"
                    >
                      {filterOptions.statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Author</label>
                    <select
                      multiple
                      value={filterBy.author || []}
                      onChange={(e) => {
                        const selectedAuthors = Array.from(e.target.selectedOptions, option => option.value);
                        onFilterChange?.({ ...filterBy, author: selectedAuthors });
                      }}
                      className="w-full text-sm border rounded px-2 py-1 max-h-20"
                    >
                      {filterOptions.authors.map(author => (
                        <option key={author} value={author}>{author}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Tags</label>
                    <select
                      multiple
                      value={filterBy.tags || []}
                      onChange={(e) => {
                        const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
                        onFilterChange?.({ ...filterBy, tags: selectedTags });
                      }}
                      className="w-full text-sm border rounded px-2 py-1 max-h-20"
                    >
                      {filterOptions.tags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {/* Documents list */}
          <ScrollArea className="h-full" ref={listRef}>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCwIcon className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading documents...</p>
                </div>
              ) : paginatedDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
                  <p className="text-muted-foreground">
                    {filteredAndSortedDocuments.length === 0 ? (
                      'No documents match your current filters.'
                    ) : (
                      'Try adjusting your search or filters.'
                    )}
                  </p>
                </div>
              ) : (
                paginatedDocuments.map((document, index) => renderListItem(document, index))
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {enablePagination && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedDocuments.length)} of {filteredAndSortedDocuments.length} documents
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-3 w-3" />
                </Button>
                
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnimatedListCard;
