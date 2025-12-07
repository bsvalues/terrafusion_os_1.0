/**
 * CommentThread - Threaded Comments with @Mentions
 *
 * Production-ready component for cell-level comment threads with @mention
 * support, reply threading, and comment resolution.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 6
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

// ==================== TYPES ====================

export interface Comment {
  id: string;
  cellIndex: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  mentions: Mention[];
  parentId?: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
  resolved?: boolean;
}

export interface Mention {
  userId: number;
  userName: string;
  position: number;
  length: number;
}

export interface CommentThreadProps {
  cellIndex: number;
  comments: Comment[];
  currentUser: {
    userId: number;
    userName: string;
    avatar?: string;
  };
  activeUsers: Array<{ userId: number; userName: string; avatar?: string }>;
  onAddComment: (content: string, mentions: Mention[], parentId?: string) => void;
  onEditComment: (commentId: string, content: string, mentions: Mention[]) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveThread: (commentId: string) => void;
  onMentionNotify?: (userId: number, commentId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse @mentions from text
 */
function parseMentions(
  text: string,
  activeUsers: Array<{ userId: number; userName: string }>
): Mention[] {
  const mentions: Mention[] = [];
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const userName = match[1];
    const user = activeUsers.find((u) => u.userName === userName);

    if (user) {
      mentions.push({
        userId: user.userId,
        userName: user.userName,
        position: match.index,
        length: match[0].length,
      });
    }
  }

  return mentions;
}

/**
 * Highlight @mentions in text
 */
function highlightMentions(text: string, mentions: Mention[]): React.ReactNode {
  if (mentions.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Sort mentions by position
  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  for (const mention of sortedMentions) {
    // Add text before mention
    if (mention.position > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex, mention.position)}</span>
      );
    }

    // Add highlighted mention
    parts.push(
      <Badge key={`mention-${mention.position}`} variant="secondary" className="mx-1">
        @{mention.userName}
      </Badge>
    );

    lastIndex = mention.position + mention.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/**
 * Get user initials for avatar
 */
function getUserInitials(userName: string): string {
  return userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ==================== COMPONENT ====================

export function CommentThread({
  cellIndex,
  comments,
  currentUser,
  activeUsers,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveThread,
  onMentionNotify,
  isOpen = true,
  onClose,
}: CommentThreadProps) {
  // ==================== STATE ====================

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ==================== COMPUTED ====================

  // Organize comments into threads
  const rootComments = comments.filter((c) => !c.parentId && c.cellIndex === cellIndex);
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parentId === commentId);

  // Filter users for @mention suggestions
  const mentionSuggestions = activeUsers.filter((user) =>
    user.userName.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // ==================== EFFECTS ====================

  // Detect @mentions while typing
  useEffect(() => {
    const text = editingComment ? editText : commentText;
    const cursorPosition = textareaRef.current?.selectionStart || 0;

    // Find @ symbol before cursor
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Check if we're in the middle of a mention (no spaces after @)
      if (!textAfterAt.includes(' ')) {
        setMentionFilter(textAfterAt);
        setShowMentionSuggestions(true);
        return;
      }
    }

    setShowMentionSuggestions(false);
    setMentionFilter('');
  }, [commentText, editText, editingComment]);

  // ==================== HANDLERS ====================

  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    const mentions = parseMentions(commentText, activeUsers);
    onAddComment(commentText, mentions, replyingTo || undefined);

    // Notify mentioned users
    if (onMentionNotify) {
      mentions.forEach((mention) => {
        if (mention.userId !== currentUser.userId) {
          onMentionNotify(mention.userId, `comment-${Date.now()}`);
        }
      });
    }

    setCommentText('');
    setReplyingTo(null);
  }, [commentText, replyingTo, activeUsers, currentUser, onAddComment, onMentionNotify]);

  const handleEditComment = useCallback(() => {
    if (!editingComment || !editText.trim()) return;

    const mentions = parseMentions(editText, activeUsers);
    onEditComment(editingComment, editText, mentions);

    setEditingComment(null);
    setEditText('');
  }, [editingComment, editText, activeUsers, onEditComment]);

  const handleMentionSelect = useCallback(
    (userName: string) => {
      const text = editingComment ? editText : commentText;
      const setText = editingComment ? setEditText : setCommentText;
      const cursorPosition = textareaRef.current?.selectionStart || 0;

      // Find @ symbol before cursor
      const textBeforeCursor = text.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const newText =
          text.slice(0, lastAtIndex) + `@${userName} ` + text.slice(cursorPosition);
        setText(newText);

        // Move cursor after the mention
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = lastAtIndex + userName.length + 2;
            textareaRef.current.selectionStart = newPosition;
            textareaRef.current.selectionEnd = newPosition;
            textareaRef.current.focus();
          }
        }, 0);
      }

      setShowMentionSuggestions(false);
      setMentionFilter('');
    },
    [commentText, editText, editingComment]
  );

  const startEdit = useCallback((comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingComment(null);
    setEditText('');
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (editingComment) {
          handleEditComment();
        } else {
          handleAddComment();
        }
      }
    },
    [editingComment, handleEditComment, handleAddComment]
  );

  // ==================== RENDER HELPERS ====================

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isEditing = editingComment === comment.id;
    const isAuthor = comment.userId === currentUser.userId;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`space-y-2 ${isReply ? 'ml-8' : ''}`}>
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.userAvatar} />
            <AvatarFallback>{getUserInitials(comment.userName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{comment.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
                {comment.edited && (
                  <Badge variant="outline" className="text-xs">
                    edited
                  </Badge>
                )}
                {comment.resolved && (
                  <Badge variant="success" className="text-xs">
                    ✓ resolved
                  </Badge>
                )}
              </div>

              {isAuthor && !isEditing && (
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(comment)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteComment(comment.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-sm"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEditComment}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm">{highlightMentions(comment.content, comment.mentions)}</div>
            )}

            {!isEditing && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  Reply
                </Button>
                {!comment.parentId && !comment.resolved && isAuthor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onResolveThread(comment.id)}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-2">{replies.map((reply) => renderComment(reply, true))}</div>
        )}

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <div className="ml-11 space-y-2">
            <Textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Reply to ${comment.userName}...`}
              className="text-sm"
              rows={2}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddComment}>
                Reply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================

  if (!isOpen) return null;

  return (
    <Card className="comment-thread">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Comments on Cell {cellIndex} ({rootComments.length})
          </CardTitle>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Comment List */}
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {rootComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              rootComments.map((comment) => renderComment(comment))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Add Comment Input */}
        {!replyingTo && (
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a comment... Use @username to mention someone"
                className="text-sm"
                rows={3}
              />

              {/* @Mention Suggestions */}
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border rounded-md shadow-md z-10">
                  <ScrollArea className="max-h-40">
                    {mentionSuggestions.map((user) => (
                      <button
                        key={user.userId}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
                        onClick={() => handleMentionSelect(user.userName)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getUserInitials(user.userName)}</AvatarFallback>
                        </Avatar>
                        <span>@{user.userName}</span>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Tip: Press Ctrl+Enter to submit
              </span>
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                Add Comment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CommentThread;
