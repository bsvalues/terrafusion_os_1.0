import {useState, useEffect} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {MessageSquare, 
  Plus, 
  Pin, 
  CheckCircle2, 
  Warning, 
  Clock, 
  User,
  Edit3,
  Trash2,
  Flag,
  Eye,
  EyeOff} from '@mui/icons-material';
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Switch} from "@/components/ui/switch";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {useToast} from "@/hooks/use-toast";
import {format} from "date-fns";
import {apiRequest} from "@/lib/queryClient";

interface Annotation {id: number;
  entityType: string;
  entityId: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  coordinates?: any;
  metadata?: any;
  isPrivate: boolean;
  priority: string;
  status: string;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    role: string;};
}

interface Comment {id: number;
  parentId?: number;
  annotationId?: number;
  entityType?: string;
  entityId?: number;
  userId: number;
  content: string;
  mentions?: number[];
  attachments?: any[];
  isEdited: boolean;
  editedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    role: string;};
  replies?: Comment[];
}

interface AnnotationSystemProps {entityType: string;
  entityId: number;
  showCreateButton?: boolean;
  compact?: boolean;}

const priorityColors = {low: "bg-blue-100 text-blue-800",
  normal: "bg-gray-100 text-gray-800",
  high: "bg-yellow-100 text-yellow-800",
  urgent: "bg-red-100 text-red-800"};

const typeIcons = {general: MessageSquare,
  property_note: Pin,
  assessment_issue: Warning,
  compliance_flag: Flag,
  improvement_suggestion: Plus,
  risk_indicator: Warning,
  data_correction: Edit3,
  workflow_note: Clock};

export function AnnotationSystem({entityType, entityId, showCreateButton = true, compact = false}: AnnotationSystemProps) {const { toast} = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("annotations");
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

  // Fetch annotations
  const {data: annotations, isLoading: annotationsLoading} = useQuery({
    queryKey: ['/api/collaborative/annotations', entityType, entityId],
    queryFn: () =>apiRequest('GET', `/api/collaborative/annotations/${entityType}/${entityId}`)
  });

  // Fetch comments for entity
  const {data: comments, isLoading: commentsLoading} = useQuery({
    queryKey: ['/api/collaborative/comments', entityType, entityId],
    queryFn: () => apiRequest('GET', `/api/collaborative/comments?entityType=${entityType}&entityId=${entityId}`)
  });

  // Create annotation mutation
  const createAnnotationMutation = useMutation({mutationFn: (data: any) => apiRequest('POST', '/api/collaborative/annotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative/annotations']});
      setShowCreateDialog(false);
      toast({title: "Success",
        description: "Annotation created successfully"});
    },
    onError: (error) => {toast({
        title: "Error",
        description: "Failed to create annotation",
        variant: "destructive"});
    }
  });

  // Resolve annotation mutation
  const resolveAnnotationMutation = useMutation({mutationFn: ({ id, resolved}: {id: number; resolved: boolean}) => 
      apiRequest('PATCH', `/api/collaborative/annotations/${id}/resolve`, {resolved}),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/collaborative/annotations']});
      toast({title: "Success",
        description: "Annotation status updated"});
    }
  });

  const handleCreateAnnotation = (formData: FormData) => {const data = {
      entityType,
      entityId,
      type: formData.get('type'),
      title: formData.get('title'),
      content: formData.get('content'),
      priority: formData.get('priority'),
      isPrivate: formData.get('isPrivate') === 'on'};

    createAnnotationMutation.mutate(data);
  };

  const handleResolveAnnotation = (annotation: Annotation) => {resolveAnnotationMutation.mutate({
      id: annotation.id,
      resolved: annotation.status !== 'resolved'});
  };

  const AnnotationCard = ({annotation}: {annotation: Annotation}) => {
    const TypeIcon = typeIcons[annotation.type as keyof typeof typeIcons] || MessageSquare;
    
    return (<Card className="mb-4 border-l-4 border-l-terrafusion-cyan"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><TypeIcon size={16} className="text-terrafusion-cyan" /><CardTitle className="text-sm font-medium">{annotation.title}</CardTitle>{annotation.isPrivate &&<EyeOff size={14} className="text-gray-500" />}
            </div><div className="flex items-center gap-2"><Badge className={priorityColors[annotation.priority as keyof typeof priorityColors]}>{annotation.priority}</Badge>{annotation.status === 'resolved' && (<CheckCircle2 size={16} className="text-green-600" />)}</div></div><div className="flex items-center gap-2 text-xs text-gray-500"><Avatar className="h-5 w-5"><AvatarFallback className="text-xs">{annotation.user.fullName.charAt(0)}</AvatarFallback></Avatar><><span>{annotation.user.fullName}</span><span
</></>>•</span><span>{format(new Date(annotation.createdAt), 'MMM d, HH:mm')}</span></div></CardHeader><CardContent className="pt-0"><><p className="text-sm text-gray-700 mb-3">{annotation.content}</p><div
</>
className="flex items-center justify-between"><Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedAnnotation(annotation)}
            ><><MessageSquare size={14} className="mr-1" />Comments</Button><Button
</>variant="ghost"
              size="sm"
              onClick={() => handleResolveAnnotation(annotation)}
              className={annotation.status === 'resolved' ? 'text-green-600' : ''}
            >
              {annotation.status === 'resolved' ? (<CheckCircle2 size={14} className="mr-1" />Resolved

              ) : (<Clock size={14} className="mr-1" />Mark Resolved

              )}</Button></div></CardContent></Card>);
  };

  const CommentCard = ({comment}: {comment: Comment}) => (<Card className="mb-3"><CardContent className="pt-4"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{comment.user.fullName.charAt(0)}</AvatarFallback></Avatar><div><><span className="text-sm font-medium">{comment.user.fullName}</span><span
</>className="text-xs text-gray-500 ml-2">
                {format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>{comment.isEdited && (<span className="text-xs text-gray-400 ml-1">(edited)</span>)}</div></div></div><p className="text-sm text-gray-700">{comment.content}</p>{comment.replies && comment.replies.length > 0 && (<div className="ml-4 mt-3 border-l-2 border-gray-200 pl-3">{comment.replies.map((reply) => (<CommentCard key={reply.id} comment={reply} />))}</div>)}</CardContent></Card>);

  const CreateAnnotationDialog = () => (<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}><DialogTrigger asChild>{showCreateButton && (<Button className="bg-terrafusion-cyan hover:bg-terrafusion-cyan/90"><Plus size={16} className="mr-2" />Add Annotation</Button>)}</DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Create Annotation</DialogTitle></DialogHeader><form onSubmit={(e) => {
          e.preventDefault();
          handleCreateAnnotation(new FormData(e.currentTarget));}} className="space-y-4"><div><><Label htmlFor="type">Type</Label><Select
</>
name="type" defaultValue="general"><SelectTrigger><><SelectValue /></SelectTrigger><SelectContent
</></>><><SelectItem value="general">General Note</SelectItem><SelectItem
</>
value="property_note">Property Note</SelectItem><><SelectItem value="assessment_issue">Assessment Issue</SelectItem><SelectItem
</>
value="compliance_flag">Compliance Flag</SelectItem><><SelectItem value="improvement_suggestion">Improvement Suggestion</SelectItem><SelectItem
</>
value="risk_indicator">Risk Indicator</SelectItem><><SelectItem value="data_correction">Data Correction</SelectItem><SelectItem
</>
value="workflow_note">Workflow Note</SelectItem></SelectContent></Select></div><div><><Label htmlFor="title">Title</Label><Input
</>
name="title" required /></div><div><><Label htmlFor="content">Content</Label><Textarea
</>
name="content" required rows={3} /></div><div><><Label htmlFor="priority">Priority</Label><Select
</>
name="priority" defaultValue="normal"><SelectTrigger><><SelectValue /></SelectTrigger><SelectContent
</></>><><SelectItem value="low">Low</SelectItem><SelectItem
</>
value="normal">Normal</SelectItem><><SelectItem value="high">High</SelectItem><SelectItem
</>
value="urgent">Urgent</SelectItem></SelectContent></Select></div><div className="flex items-center space-x-2"><Switch id="isPrivate" name="isPrivate" /><Label htmlFor="isPrivate">Private (only visible to you)</Label></div><div className="flex justify-end gap-2"><><Button type="button" variant="outline" onClick={() =>setShowCreateDialog(false)}>
              Cancel</Button><Button
</>type="submit" disabled={createAnnotationMutation.isPending}>
              {createAnnotationMutation.isPending ? 'Creating...' : 'Create'}</Button></div></form></DialogContent></Dialog>);

  if (compact) {
    const totalAnnotations = annotations?.data?.length || 0;
    const activeAnnotations = annotations?.data?.filter((a: Annotation) => a.status === 'active').length || 0;
    const totalComments = comments?.data?.length || 0;

    return (<div className="flex items-center gap-4 text-sm text-gray-600"><div className="flex items-center gap-1"><Pin size={14} /><span>{activeAnnotations}/{totalAnnotations} annotations</span></div><div className="flex items-center gap-1"><MessageSquare size={14} /><span>{totalComments} comments</span></div><CreateAnnotationDialog /></div>);
  }

  return (<div className="space-y-4"><div className="flex items-center justify-between"><><h3 className="text-lg font-semibold text-white">Collaborative Notes</h3><CreateAnnotationDialog
</>
/></div><Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"><TabsList className="grid w-full grid-cols-2"><><TabsTrigger value="annotations">Annotations ({annotations?.data?.length || 0})</TabsTrigger><TabsTrigger
</>value="comments">
            Discussion ({comments?.data?.length || 0})</TabsTrigger></TabsList><TabsContent value="annotations" className="space-y-4">{annotationsLoading ? (<div className="text-center py-8 text-gray-500">Loading annotations...</div>) : annotations?.data?.length > 0 ? (
            annotations.data.map((annotation: Annotation) => (<AnnotationCard key={annotation.id} annotation={annotation} />))
          ) : (<div className="text-center py-8 text-gray-500">No annotations yet. Create one to get started.</div>)}</TabsContent><TabsContent value="comments" className="space-y-4">{commentsLoading ? (<div className="text-center py-8 text-gray-500">Loading comments...</div>) : comments?.data?.length > 0 ? (
            comments.data.map((comment: Comment) => (<CommentCard key={comment.id} comment={comment} />))
          ) : (<div className="text-center py-8 text-gray-500">No comments yet. Start a discussion.</div>)}</TabsContent></Tabs>{/* Comment Thread Dialog */}
      {selectedAnnotation && (<Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Comments: {selectedAnnotation.title}</DialogTitle></DialogHeader><div className="max-h-96 overflow-y-auto"><CommentThread annotationId={selectedAnnotation.id} /></div></DialogContent></Dialog>)}</div>);
}

// Comment Thread Component for annotation-specific comments
function CommentThread({annotationId}: {annotationId: number}) {const { data: comments} = useQuery({
    queryKey: ['/api/collaborative/comments', 'annotation', annotationId],
    queryFn: () => apiRequest(`/api/collaborative/comments?annotationId=${annotationId}`)
  });

  const [newComment, setNewComment] = useState('');
  const {toast} = useToast();
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({mutationFn: (data: any) => apiRequest('POST', '/api/collaborative/comments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborative/comments']});
      setNewComment('');
      toast({title: "Success",
        description: "Comment added successfully"});
    }
  });

  const handleSubmitComment = (e: React.FormEvent) => {e.preventDefault();
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      annotationId,
      content: newComment});
  };

  return (<div className="space-y-4">{comments?.data?.map((comment: Comment) => (<div key={comment.id} className="border-l-2 border-terrafusion-cyan pl-4"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{comment.user.fullName.charAt(0)}</AvatarFallback></Avatar><><span className="text-sm font-medium">{comment.user.fullName}</span><span
</>className="text-xs text-gray-500">
              {format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span></div><p className="text-sm text-gray-700">{comment.content}</p></div>))}<form onSubmit={handleSubmitComment} className="space-y-2"><Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
        /><Button 
          type="submit" 
          size="sm"
          disabled={createCommentMutation.isPending || !newComment.trim()}
        >{createCommentMutation.isPending ? 'Adding...' : 'Add Comment'}</Button></form></div>
  );
}