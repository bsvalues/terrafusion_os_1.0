import { Router } from 'express';
import { db } from './db';
import { emitCollaborativeEvent } from './socket';
import {
  annotations,
  comments,
  notifications,
  users,
  type Annotation,
  type Comment,
  type Notification,
  type InsertAnnotation,
  type InsertComment,
  type InsertNotification,
} from '@shared/schema';
import { eq, and, desc, or, isNull, sql } from 'drizzle-orm';

const router = Router();

// Get annotations for a specific entity
router.get('/annotations/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const includePrivate = req.query.includePrivate === 'true';
    const userId = req.user?.id;

    let query = db
      .select({
        annotation: annotations,
        user: {
          id: users.id,
          fullName: users.fullName,
          role: users.role,
        },
      })
      .from(annotations)
      .leftJoin(users, eq(annotations.userId, users.id))
      .where(
        and(
          eq(annotations.entityType, entityType),
          eq(annotations.entityId, parseInt(entityId)),
          eq(annotations.status, 'active')
        )
      )
      .orderBy(desc(annotations.createdAt));

    // Filter private annotations based on permissions
    if (!includePrivate || !userId) {
      query = query.where(eq(annotations.isPrivate, false));
    } else {
      query = query.where(or(eq(annotations.isPrivate, false), eq(annotations.userId, userId)));
    }

    const result = await query;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch annotations' });
  }
});

// Create new annotation
router.post('/annotations', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const annotationData: InsertAnnotation = {
      ...req.body,
      userId,
    };

    const [newAnnotation] = await db.insert(annotations).values(annotationData).returning();

    // Create notification for mentioned users or team members
    if (annotationData.metadata?.mentions?.length > 0) {
      const mentionNotifications = annotationData.metadata.mentions.map(
        (mentionedUserId: number) => ({
          userId: mentionedUserId,
          type: 'annotation_created',
          title: 'New annotation mentions you',
          content: `${req.user.fullName} created an annotation that mentions you`,
          entityType: annotationData.entityType,
          entityId: annotationData.entityId,
          relatedUserId: userId,
          actionUrl: `/annotations/${newAnnotation.id}`,
        })
      );

      await db.insert(notifications).values(mentionNotifications);
    }

    // Emit WebSocket event for real-time collaboration
    emitCollaborativeEvent('ANNOTATION_CREATED', {
      annotation: newAnnotation,
      user: { id: req.user?.id, username: req.user?.username },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: newAnnotation,
    });
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ success: false, error: 'Failed to create annotation' });
  }
});

// Update annotation
router.put('/annotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if user owns the annotation or has admin privileges
    const existingAnnotation = await db
      .select()
      .from(annotations)
      .where(eq(annotations.id, parseInt(id)))
      .limit(1);

    if (!existingAnnotation.length) {
      return res.status(404).json({ success: false, error: 'Annotation not found' });
    }

    if (existingAnnotation[0].userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const [updatedAnnotation] = await db
      .update(annotations)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(annotations.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      data: updatedAnnotation,
    });
  } catch (error) {
    console.error('Error updating annotation:', error);
    res.status(500).json({ success: false, error: 'Failed to update annotation' });
  }
});

// Resolve/unresolve annotation
router.patch('/annotations/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const [updatedAnnotation] = await db
      .update(annotations)
      .set({
        status: resolved ? 'resolved' : 'active',
        resolvedBy: resolved ? userId : null,
        resolvedAt: resolved ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(annotations.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      data: updatedAnnotation,
    });
  } catch (error) {
    console.error('Error resolving annotation:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve annotation' });
  }
});

// Get comments for an annotation or entity
router.get('/comments', async (req, res) => {
  try {
    const { annotationId, entityType, entityId } = req.query;

    let whereCondition;
    if (annotationId) {
      whereCondition = eq(comments.annotationId, parseInt(annotationId as string));
    } else if (entityType && entityId) {
      whereCondition = and(
        eq(comments.entityType, entityType as string),
        eq(comments.entityId, parseInt(entityId as string)),
        isNull(comments.annotationId)
      );
    } else {
      return res
        .status(400)
        .json({ success: false, error: 'Either annotationId or entityType+entityId required' });
    }

    const result = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          fullName: users.fullName,
          role: users.role,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(whereCondition, eq(comments.status, 'active')))
      .orderBy(comments.createdAt);

    // Build threaded comment structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    result.forEach(({ comment, user }) => {
      const commentWithUser = { ...comment, user };
      commentMap.set(comment.id, { ...commentWithUser, replies: [] });
    });

    result.forEach(({ comment }) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    res.json({
      success: true,
      data: rootComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// Create new comment
router.post('/comments', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const commentData: InsertComment = {
      ...req.body,
      userId,
    };

    const [newComment] = await db.insert(comments).values(commentData).returning();

    // Create notifications for mentions
    if (commentData.mentions?.length > 0) {
      const mentionNotifications = commentData.mentions.map((mentionedUserId: number) => ({
        userId: mentionedUserId,
        type: 'mention',
        title: 'You were mentioned in a comment',
        content: `${req.user.fullName} mentioned you in a comment`,
        entityType: commentData.entityType,
        entityId: commentData.entityId,
        relatedUserId: userId,
        actionUrl: `/comments/${newComment.id}`,
      }));

      await db.insert(notifications).values(mentionNotifications);
    }

    // Create reply notification
    if (commentData.parentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, commentData.parentId))
        .limit(1);

      if (parentComment.length && parentComment[0].userId !== userId) {
        await db.insert(notifications).values({
          userId: parentComment[0].userId,
          type: 'reply',
          title: 'New reply to your comment',
          content: `${req.user.fullName} replied to your comment`,
          entityType: commentData.entityType,
          entityId: commentData.entityId,
          relatedUserId: userId,
          actionUrl: `/comments/${newComment.id}`,
        });
      }
    }

    // Emit WebSocket event for real-time collaboration
    emitCollaborativeEvent('COMMENT_ADDED', {
      comment: newComment,
      user: { id: req.user?.id, username: req.user?.username },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
});

// Update comment
router.put('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if user owns the comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (!existingComment.length) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (existingComment[0].userId !== userId) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const [updatedComment] = await db
      .update(comments)
      .set({
        content: req.body.content,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if user owns the comment or has admin privileges
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (!existingComment.length) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (existingComment[0].userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    await db
      .update(comments)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(comments.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

// Get notifications for current user
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    let query = db
      .select({
        notification: notifications,
        relatedUser: {
          id: users.id,
          fullName: users.fullName,
          role: users.role,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.relatedUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }

    const result = await query;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, userId)));

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

// Get annotation and comment statistics
router.get('/stats/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const [annotationStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'active')`,
        resolved: sql<number>`count(*) filter (where status = 'resolved')`,
        byPriority: sql<any>`json_object_agg(priority, count(*))`,
      })
      .from(annotations)
      .where(
        and(eq(annotations.entityType, entityType), eq(annotations.entityId, parseInt(entityId)))
      );

    const [commentStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'active')`,
      })
      .from(comments)
      .where(
        and(
          eq(comments.entityType, entityType),
          eq(comments.entityId, parseInt(entityId)),
          eq(comments.status, 'active')
        )
      );

    res.json({
      success: true,
      data: {
        annotations: annotationStats,
        comments: commentStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Advanced search across all collaborative content
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      entityType,
      priority,
      status,
      assignedTo,
      dateRange,
      hasComments,
      hasAnnotations,
      location,
      tags,
      limit = '20',
    } = req.query;

    let results = [];

    // Build date filter
    let dateFilter;
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const hours = dateRange === '1h' ? 1 : dateRange === '24h' ? 24 : 0;
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 0;

      if (hours > 0) {
        dateFilter = new Date(now.getTime() - hours * 60 * 60 * 1000);
      } else if (days > 0) {
        dateFilter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
    }

    // Search annotations
    if (!entityType || entityType === 'all' || entityType === 'annotation') {
      const annotationQuery = db
        .select({
          id: annotations.id,
          type: sql<string>`'annotation'`,
          title: annotations.title,
          content: annotations.content,
          entityType: annotations.entityType,
          entityId: annotations.entityId,
          priority: annotations.priority,
          status: annotations.status,
          createdBy: users.username,
          createdAt: annotations.createdAt,
          tags: annotations.tags,
          location: annotations.location,
        })
        .from(annotations)
        .leftJoin(users, eq(annotations.createdBy, users.id));

      if (query) {
        annotationQuery.where(
          or(
            sql`${annotations.title} ILIKE ${'%' + query + '%'}`,
            sql`${annotations.content} ILIKE ${'%' + query + '%'}`
          )
        );
      }

      const annotationResults = await annotationQuery.limit(parseInt(limit as string));
      results.push(...annotationResults.map(r => ({ ...r, highlights: query ? [query] : [] })));
    }

    // Search comments
    if (!entityType || entityType === 'all' || entityType === 'comment') {
      const commentQuery = db
        .select({
          id: comments.id,
          type: sql<string>`'comment'`,
          title: sql<string>`'Comment'`,
          content: comments.content,
          entityType: comments.entityType,
          entityId: comments.entityId,
          priority: sql<string>`null`,
          status: comments.status,
          createdBy: users.username,
          createdAt: comments.createdAt,
          tags: sql<string[]>`null`,
          location: sql<string>`null`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.createdBy, users.id));

      if (query) {
        commentQuery.where(sql`${comments.content} ILIKE ${'%' + query + '%'}`);
      }

      const commentResults = await commentQuery.limit(parseInt(limit as string));
      results.push(...commentResults.map(r => ({ ...r, highlights: query ? [query] : [] })));
    }

    res.json({
      success: true,
      data: results.slice(0, parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
});

// Get audit trail entries
router.get('/audit-trail', async (req, res) => {
  try {
    const { entityType, entityId, search, action, dateRange = '7d', limit = '50' } = req.query;

    // For now, return mock audit trail data since we don't have a dedicated audit_trail table
    // In a real implementation, this would query an audit_trail table
    const mockAuditTrail = [
      {
        id: 1,
        entityType: 'annotation',
        entityId: 123,
        action: 'annotation_created',
        details: { title: 'Property Assessment Review', priority: 'high' },
        userId: 1,
        username: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.100',
      },
      {
        id: 2,
        entityType: 'comment',
        entityId: 123,
        action: 'comment_created',
        details: { content: 'Added clarification on zoning requirements' },
        userId: 2,
        username: 'Mike Chen',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.101',
      },
      {
        id: 3,
        entityType: 'annotation',
        entityId: 456,
        action: 'status_changed',
        details: { from: 'pending', to: 'resolved' },
        userId: 3,
        username: 'Lisa Rodriguez',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.102',
      },
      {
        id: 4,
        entityType: 'comment',
        entityId: 123,
        action: 'user_mentioned',
        details: { mentionedUser: 'John Smith' },
        userId: 1,
        username: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.100',
      },
    ];

    let filteredResults = mockAuditTrail;

    // Apply filters
    if (entityType) {
      filteredResults = filteredResults.filter(entry => entry.entityType === entityType);
    }
    if (entityId) {
      filteredResults = filteredResults.filter(
        entry => entry.entityId === parseInt(entityId as string)
      );
    }
    if (action && action !== 'all') {
      filteredResults = filteredResults.filter(entry => entry.action === action);
    }
    if (search) {
      filteredResults = filteredResults.filter(
        entry =>
          entry.username.toLowerCase().includes((search as string).toLowerCase()) ||
          entry.action.toLowerCase().includes((search as string).toLowerCase()) ||
          JSON.stringify(entry.details)
            .toLowerCase()
            .includes((search as string).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredResults.slice(0, parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit trail' });
  }
});

// Get team performance metrics
router.get('/team-metrics', async (req, res) => {
  try {
    const { dateRange = '7d', teamId } = req.query;

    // Mock team metrics data
    const mockMetrics = {
      totalMembers: 12,
      activeMembers: 8,
      totalAnnotations: 145,
      totalComments: 89,
      avgResponseTime: 2.5,
      collaborationTrend: 15,
      topPerformers: [
        {
          id: 1,
          username: 'Sarah Johnson',
          role: 'Senior Auditor',
          stats: {
            annotationsCreated: 24,
            commentsAdded: 18,
            issuesResolved: 12,
            responseTime: 1.2,
            collaborationScore: 95,
            activeThisWeek: true,
          },
        },
        {
          id: 2,
          username: 'Mike Chen',
          role: 'Property Analyst',
          stats: {
            annotationsCreated: 19,
            commentsAdded: 22,
            issuesResolved: 9,
            responseTime: 1.8,
            collaborationScore: 87,
            activeThisWeek: true,
          },
        },
        {
          id: 3,
          username: 'Lisa Rodriguez',
          role: 'Supervisor',
          stats: {
            annotationsCreated: 16,
            commentsAdded: 15,
            issuesResolved: 15,
            responseTime: 2.1,
            collaborationScore: 82,
            activeThisWeek: true,
          },
        },
      ],
      recentActivity: [
        { date: '2025-06-27', annotations: 12, comments: 8, resolutions: 5 },
        { date: '2025-06-26', annotations: 15, comments: 11, resolutions: 7 },
        { date: '2025-06-25', annotations: 18, comments: 9, resolutions: 6 },
        { date: '2025-06-24', annotations: 14, comments: 13, resolutions: 4 },
        { date: '2025-06-23', annotations: 16, comments: 7, resolutions: 8 },
      ],
    };

    res.json({
      success: true,
      data: mockMetrics,
    });
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team metrics' });
  }
});

// Get team members with performance data
router.get('/team-members', async (req, res) => {
  try {
    const { dateRange = '7d', teamId } = req.query;

    // Mock team members data
    const mockMembers = [
      {
        id: 1,
        username: 'Sarah Johnson',
        role: 'Senior Auditor',
        avatar: null,
        stats: {
          annotationsCreated: 24,
          commentsAdded: 18,
          issuesResolved: 12,
          responseTime: 1.2,
          collaborationScore: 95,
          activeThisWeek: true,
        },
      },
      {
        id: 2,
        username: 'Mike Chen',
        role: 'Property Analyst',
        avatar: null,
        stats: {
          annotationsCreated: 19,
          commentsAdded: 22,
          issuesResolved: 9,
          responseTime: 1.8,
          collaborationScore: 87,
          activeThisWeek: true,
        },
      },
      {
        id: 3,
        username: 'Lisa Rodriguez',
        role: 'Supervisor',
        avatar: null,
        stats: {
          annotationsCreated: 16,
          commentsAdded: 15,
          issuesResolved: 15,
          responseTime: 2.1,
          collaborationScore: 82,
          activeThisWeek: true,
        },
      },
      {
        id: 4,
        username: 'John Smith',
        role: 'Junior Auditor',
        avatar: null,
        stats: {
          annotationsCreated: 11,
          commentsAdded: 14,
          issuesResolved: 6,
          responseTime: 3.2,
          collaborationScore: 68,
          activeThisWeek: true,
        },
      },
      {
        id: 5,
        username: 'Emily Davis',
        role: 'Analyst',
        avatar: null,
        stats: {
          annotationsCreated: 8,
          commentsAdded: 12,
          issuesResolved: 4,
          responseTime: 4.1,
          collaborationScore: 55,
          activeThisWeek: false,
        },
      },
    ];

    res.json({
      success: true,
      data: mockMembers,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team members' });
  }
});

export default router;
