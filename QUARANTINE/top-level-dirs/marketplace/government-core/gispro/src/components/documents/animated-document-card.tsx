import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  ChevronRightIcon
} from 'lucide-react';

interface DocumentMetadata {
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
    duration?: number; // for video/audio
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

interface AnimatedDocumentCardProps {
  document: DocumentMetadata;
  viewMode?: 'card' | 'list' | 'grid' | 'table';
  showPreview?: boolean;
  showMetadata?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showCollaborators?: boolean;
  isSelected?: boolean;
  isBookmarked?: boolean;
  isStarred?: boolean;
  animationDelay?: number;
  hoverEffects?: boolean;
  clickable?: boolean;
  onSelect?: (document: DocumentMetadata) => void;
  onPreview?: (document: DocumentMetadata) => void;
  onEdit?: (document: DocumentMetadata) => void;
  onDownload?: (document: DocumentMetadata) => void;
  onShare?: (document: DocumentMetadata) => void;
  onDelete?: (document: DocumentMetadata) => void;
  onBookmark?: (document: DocumentMetadata) => void;
  onStar?: (document: DocumentMetadata) => void;
  onComment?: (document: DocumentMetadata) => void;
  onTag?: (document: DocumentMetadata, tags: string[]) => void;
  onMove?: (document: DocumentMetadata, location: string) => void;
  onDuplicate?: (document: DocumentMetadata) => void;
  onVersionHistory?: (document: DocumentMetadata) => void;
  onPermissions?: (document: DocumentMetadata) => void;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedDocumentCard: React.FC<AnimatedDocumentCardProps> = ({
  document,
  viewMode = 'card',
  showPreview = true,
  showMetadata = true,
  showStats = true,
  showActions = true,
  showCollaborators = true,
  isSelected = false,
  isBookmarked = false,
  isStarred = false,
  animationDelay = 0,
  hoverEffects = true,
  clickable = true,
  onSelect,
  onPreview,
  onEdit,
  onDownload,
  onShare,
  onDelete,
  onBookmark,
  onStar,
  onComment,
  onTag,
  onMove,
  onDuplicate,
  onVersionHistory,
  onPermissions,
  className = '',
  style
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Animation springs
  const springConfig = { tension: 300, friction: 30 };
  const scale = useSpring(isHovered && hoverEffects ? 1.02 : 1, springConfig);
  const y = useSpring(isHovered && hoverEffects ? -2 : 0, springConfig);
  const rotateX = useSpring(isHovered && hoverEffects ? 5 : 0, springConfig);
  const rotateY = useSpring(isHovered && hoverEffects ? 5 : 0, springConfig);

  // Get document type icon and color
  const getDocumentTypeDisplay = (type: DocumentMetadata['type']) => {
    switch (type) {
      case 'pdf':
        return { icon: FileTextIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'doc':
      case 'docx':
        return { icon: FileTextIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'txt':
      case 'md':
        return { icon: FileTextIcon, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
      case 'xls':
      case 'xlsx':
        return { icon: BarChart3Icon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'ppt':
      case 'pptx':
        return { icon: LayersIcon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'image':
        return { icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'video':
        return { icon: VideoIcon, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' };
      case 'audio':
        return { icon: Volume2Icon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      default:
        return { icon: FileIcon, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  // Get status display
  const getStatusDisplay = (status: DocumentMetadata['status']) => {
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

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (clickable && onSelect) {
      onSelect(document);
    }
  }, [clickable, onSelect, document]);

  // Handle action click
  const handleActionClick = useCallback((action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      switch (action) {
        case 'preview':
          onPreview?.(document);
          break;
        case 'edit':
          onEdit?.(document);
          break;
        case 'download':
          onDownload?.(document);
          break;
        case 'share':
          onShare?.(document);
          break;
        case 'delete':
          onDelete?.(document);
          break;
        case 'bookmark':
          onBookmark?.(document);
          break;
        case 'star':
          onStar?.(document);
          break;
        case 'comment':
          onComment?.(document);
          break;
        case 'duplicate':
          onDuplicate?.(document);
          break;
        case 'version':
          onVersionHistory?.(document);
          break;
        case 'permissions':
          onPermissions?.(document);
          break;
      }
    }, 300);
  }, [document, onPreview, onEdit, onDownload, onShare, onDelete, onBookmark, onStar, onComment, onDuplicate, onVersionHistory, onPermissions]);

  const typeDisplay = getDocumentTypeDisplay(document.type);
  const statusDisplay = getStatusDisplay(document.status);
  const TypeIcon = typeDisplay.icon;
  const StatusIcon = statusDisplay.icon;

  // Card animations
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: animationDelay,
        ease: "easeOut"
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: animationDelay + 0.1
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverEffects ? "hover" : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${className}`}
      style={style}
      onAnimationComplete={() => setAnimationComplete(true)}
    >
      <Card 
        className={`
          cursor-pointer transition-all duration-200 overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${hoverEffects ? 'hover:shadow-lg' : ''}
          ${typeDisplay.border}
        `}
        onClick={handleCardClick}
      >
        {/* Card Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Document icon */}
              <motion.div 
                className={`p-2 rounded-lg ${typeDisplay.bg} ${typeDisplay.border} border`}
                whileHover={{ scale: 1.05 }}
              >
                <TypeIcon className={`h-5 w-5 ${typeDisplay.color}`} />
              </motion.div>

              {/* Title and metadata */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate mb-1">
                  {document.title}
                </CardTitle>
                
                {showMetadata && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(document.size)}</span>
                    <span>•</span>
                    <span>{formatDate(document.modified)}</span>
                    {document.content?.pageCount && (
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>{document.content.pageCount} pages</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status and tags */}
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <LockIcon className="h-3 w-3 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Encrypted</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {isStarred && (
                    <StarIcon className="h-3 w-3 text-yellow-500 fill-current" />
                  )}

                  {isBookmarked && (
                    <BookmarkIcon className="h-3 w-3 text-blue-500 fill-current" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            {showActions && (
              <motion.div 
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animationDelay + 0.2 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleActionClick('star', e)}
                        className="h-8 w-8 p-0"
                      >
                        {isStarred ? (
                          <StarIcon className="h-3 w-3 text-yellow-500 fill-current" />
                        ) : (
                          <StarOffIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isStarred ? 'Remove from favorites' : 'Add to favorites'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleActionClick('bookmark', e)}
                        className="h-8 w-8 p-0"
                      >
                        {isBookmarked ? (
                          <BookmarkIcon className="h-3 w-3 text-blue-500 fill-current" />
                        ) : (
                          <BookmarkOffIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? 'Remove bookmark' : 'Bookmark'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleActionClick('share', e)}
                        className="h-8 w-8 p-0"
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
                          setShowActions(!showActions);
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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {document.description && (
            <motion.p 
              className="text-sm text-muted-foreground line-clamp-2"
              variants={contentVariants}
            >
              {document.description}
            </motion.p>
          )}

          {/* Preview thumbnail */}
          {showPreview && document.content?.thumbnail && (
            <motion.div 
              className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video"
              variants={contentVariants}
            >
              <img
                ref={imageRef}
                src={document.content.thumbnail}
                alt={document.title}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCwIcon className="h-6 w-6 text-muted-foreground animate-spin" />
                </div>
              )}
              
              {/* Preview overlay */}
              <motion.div 
                className="absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-opacity-50 transition-all"
                whileHover={{ opacity: 1 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleActionClick('preview', e)}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                >
                  <EyeIcon className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Content excerpt */}
          {document.content?.excerpt && (
            <motion.div 
              className="text-xs text-muted-foreground line-clamp-3 bg-gray-50 p-3 rounded-lg"
              variants={contentVariants}
            >
              {document.content.excerpt}
            </motion.div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <motion.div 
              className="flex flex-wrap gap-1"
              variants={contentVariants}
            >
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <TagIcon className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{document.tags.length - 3} more
                </Badge>
              )}
            </motion.div>
          )}

          {/* Stats */}
          {showStats && (
            <motion.div 
              className="grid grid-cols-4 gap-2 text-center border-t pt-3"
              variants={contentVariants}
            >
              <div>
                <div className="text-xs font-medium">{document.stats.views}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div>
                <div className="text-xs font-medium">{document.stats.downloads}</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div>
                <div className="text-xs font-medium">{document.stats.comments}</div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
              <div>
                <div className="text-xs font-medium">{document.stats.likes}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
            </motion.div>
          )}

          {/* Collaborators */}
          {showCollaborators && document.collaborators && document.collaborators.length > 0 && (
            <motion.div 
              className="flex items-center justify-between border-t pt-3"
              variants={contentVariants}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Collaborators:</span>
                <div className="flex -space-x-1">
                  {document.collaborators.slice(0, 3).map((collaborator, index) => (
                    <Avatar key={collaborator.id} className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback className="text-xs">
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {document.collaborators.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        +{document.collaborators.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                by {document.author.name}
              </div>
            </motion.div>
          )}

          {/* Workflow progress */}
          {document.workflow && (
            <motion.div 
              className="space-y-2 border-t pt-3"
              variants={contentVariants}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Workflow: {document.workflow.stage}</span>
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
                  {document.workflow.checklist.slice(0, 2).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
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
                    <div className="text-xs text-muted-foreground">
                      +{document.workflow.checklist.length - 2} more tasks
                    </div>
                  )}
                </div>
              )}

              {document.workflow.dueDate && (
                <div className="text-xs text-muted-foreground">
                  Due: {formatDate(document.workflow.dueDate)}
                </div>
              )}
            </motion.div>
          )}

          {/* AI insights */}
          {document.ai?.analyzed && (
            <motion.div 
              className="space-y-2 border-t pt-3"
              variants={contentVariants}
            >
              <div className="flex items-center gap-2">
                <ZapIcon className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium">AI Insights</span>
              </div>
              
              {document.ai.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {document.ai.summary}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs">
                {document.ai.readabilityScore && (
                  <div>
                    <span className="text-muted-foreground">Readability: </span>
                    <span className="font-medium">{document.ai.readabilityScore}/100</span>
                  </div>
                )}
                {document.ai.sentiment && (
                  <div>
                    <span className="text-muted-foreground">Sentiment: </span>
                    <span className={`font-medium ${
                      document.ai.sentiment === 'positive' ? 'text-green-600' :
                      document.ai.sentiment === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {document.ai.sentiment}
                    </span>
                  </div>
                )}
              </div>

              {document.ai.keywords && document.ai.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.ai.keywords.slice(0, 3).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-purple-50">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
            >
              <RefreshCwIcon className="h-6 w-6 text-blue-600 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded actions menu */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-2 right-2 bg-white rounded-lg shadow-lg border p-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-3 gap-1">
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('preview', e)}>
                  <EyeIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('edit', e)}>
                  <FileEditIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('download', e)}>
                  <DownloadIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('duplicate', e)}>
                  <CopyIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('version', e)}>
                  <ClockIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => handleActionClick('permissions', e)}>
                  <SettingsIcon className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default AnimatedDocumentCard;
