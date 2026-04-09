import { useState } from 'react';
import { PermitComment } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { FaComments } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface PermitCommentsProps {
  comments: PermitComment[];
  permitId: number;
  currentUserId?: string | null;
  currentUserColor?: string | null;
  onAddComment: (permitId: number, message: string) => void;
}

export function PermitComments({ 
  comments, 
  permitId, 
  currentUserId, 
  currentUserColor,
  onAddComment 
}: PermitCommentsProps) {
  const [newComment, setNewComment] = useState('');
  
  // Filter comments for this specific permit
  const permitComments = comments.filter(c => c.permitId === permitId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !permitId) return;
    
    onAddComment(permitId, newComment);
    setNewComment('');
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FaComments className="h-4 w-4" />
          <span>Comments ({permitComments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px] pr-4">
          <div className="space-y-4">
            {permitComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Start the discussion!
              </p>
            ) : (
              permitComments.map((comment) => (
                <div 
                  key={comment.id}
                  className={`flex gap-3 ${comment.userId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  {comment.userId !== currentUserId && (
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarFallback className="text-xs">
                        {comment.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${comment.userId === currentUserId ? 'bg-primary/10' : 'bg-muted'} p-3 rounded-lg`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                  </div>
                  
                  {comment.userId === currentUserId && (
                    <Avatar className="h-8 w-8 mt-0.5" style={{ borderColor: currentUserColor || undefined }}>
                      <AvatarFallback 
                        className="text-xs" 
                        style={{ backgroundColor: currentUserColor || undefined, color: 'white' }}
                      >
                        {comment.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full space-y-2">
          <Textarea
            placeholder="Type your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button type="submit" disabled={!newComment.trim()} className="w-full">
            Post Comment
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}