import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  insertReviewRequestSchema,
  insertCommentSchema,
  insertAnnotationSchema,
  insertRevisionHistorySchema,
} from "@shared/schema";
import * as reviewerWsService from "../services/reviewer-ws-service";

export const reviewerRouter = Router();

// Review Request routes
reviewerRouter.get("/review-requests", async (req, res) => {
  try {
    // Parse query parameters
    const objectType = req.query.objectType as string;
    const objectId = req.query.objectId ? Number(req.query.objectId) : undefined;
    const requesterId = req.query.requesterId ? Number(req.query.requesterId) : undefined;
    const reviewerId = req.query.reviewerId ? Number(req.query.reviewerId) : undefined;
    const status = req.query.status as string;

    let requests;

    if (requesterId) {
      requests = await storage.getReviewRequestsByRequester(requesterId);
    } else if (reviewerId) {
      requests = await storage.getReviewRequestsByReviewer(reviewerId);
    } else if (objectType && objectId) {
      requests = await storage.getReviewRequestsByObject(objectType, objectId);
    } else if (status) {
      requests = await storage.getReviewRequestsByStatus(status);
    } else {
      requests = await storage.getPendingReviewRequests();
    }

    res.json(requests);
  } catch (error) {
    console.error("Error getting review requests:", error);
    res.status(500).json({ error: "Failed to get review requests" });
  }
});

reviewerRouter.get("/review-requests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const request = await storage.getReviewRequest(id);

    if (!request) {
      return res.status(404).json({ error: "Review request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error getting review request:", error);
    res.status(500).json({ error: "Failed to get review request" });
  }
});

reviewerRouter.post("/review-requests", async (req, res) => {
  try {
    const validationResult = insertReviewRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid review request data",
        details: validationResult.error.format(),
      });
    }

    const request = await storage.createReviewRequest(validationResult.data);

    // Notify connected clients via WebSocket
    reviewerWsService.notifyNewReviewRequest(request);

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating review request:", error);
    res.status(500).json({ error: "Failed to create review request" });
  }
});

reviewerRouter.put("/review-requests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validationResult = insertReviewRequestSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid review request data",
        details: validationResult.error.format(),
      });
    }

    const updatedRequest = await storage.updateReviewRequest(id, validationResult.data);

    if (!updatedRequest) {
      return res.status(404).json({ error: "Review request not found" });
    }

    // Notify connected clients via WebSocket
    reviewerWsService.notifyUpdatedReviewRequest(updatedRequest);

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating review request:", error);
    res.status(500).json({ error: "Failed to update review request" });
  }
});

reviewerRouter.post("/review-requests/:id/complete", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "Approved status must be a boolean" });
    }

    const completedRequest = await storage.completeReviewRequest(id, approved);

    if (!completedRequest) {
      return res.status(404).json({ error: "Review request not found" });
    }

    // Notify connected clients via WebSocket
    reviewerWsService.notifyUpdatedReviewRequest(completedRequest);

    res.json(completedRequest);
  } catch (error) {
    console.error("Error completing review request:", error);
    res.status(500).json({ error: "Failed to complete review request" });
  }
});

reviewerRouter.delete("/review-requests/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await storage.deleteReviewRequest(id);

    if (!success) {
      return res.status(404).json({ error: "Review request not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting review request:", error);
    res.status(500).json({ error: "Failed to delete review request" });
  }
});

// Comment routes
reviewerRouter.get("/comments", async (req, res) => {
  try {
    // Parse query parameters
    const objectType = req.query.objectType as string;
    const objectId = req.query.objectId ? Number(req.query.objectId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const threadId = req.query.threadId ? Number(req.query.threadId) : undefined;

    let comments;

    if (objectType && objectId) {
      comments = await storage.getCommentsByObject(objectType, objectId);
    } else if (userId) {
      comments = await storage.getCommentsByUser(userId);
    } else if (threadId) {
      comments = await storage.getCommentsByThread(threadId);
    } else {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    res.json(comments);
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

reviewerRouter.get("/comments/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const comment = await storage.getComment(id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(comment);
  } catch (error) {
    console.error("Error getting comment:", error);
    res.status(500).json({ error: "Failed to get comment" });
  }
});

reviewerRouter.post("/comments", async (req, res) => {
  try {
    const validationResult = insertCommentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid comment data",
        details: validationResult.error.format(),
      });
    }

    const comment = await storage.createComment(validationResult.data);

    // Notify connected clients via WebSocket
    reviewerWsService.notifyNewComment(comment);

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

reviewerRouter.put("/comments/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validationResult = insertCommentSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid comment data",
        details: validationResult.error.format(),
      });
    }

    const updatedComment = await storage.updateComment(id, validationResult.data);

    if (!updatedComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

reviewerRouter.delete("/comments/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await storage.deleteComment(id);

    if (!success) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Annotation routes
reviewerRouter.get("/annotations", async (req, res) => {
  try {
    // Parse query parameters
    const objectType = req.query.objectType as string;
    const objectId = req.query.objectId ? Number(req.query.objectId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const annotationType = req.query.type as string;

    let annotations;

    if (objectType && objectId) {
      annotations = await storage.getAnnotationsByObject(objectType, objectId);
    } else if (userId) {
      annotations = await storage.getAnnotationsByUser(userId);
    } else if (annotationType) {
      annotations = await storage.getAnnotationsByType(annotationType);
    } else {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    res.json(annotations);
  } catch (error) {
    console.error("Error getting annotations:", error);
    res.status(500).json({ error: "Failed to get annotations" });
  }
});

reviewerRouter.get("/annotations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const annotation = await storage.getAnnotation(id);

    if (!annotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    res.json(annotation);
  } catch (error) {
    console.error("Error getting annotation:", error);
    res.status(500).json({ error: "Failed to get annotation" });
  }
});

reviewerRouter.post("/annotations", async (req, res) => {
  try {
    const validationResult = insertAnnotationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid annotation data",
        details: validationResult.error.format(),
      });
    }

    const annotation = await storage.createAnnotation(validationResult.data);

    // Notify connected clients via WebSocket
    reviewerWsService.notifyNewAnnotation(annotation);

    res.status(201).json(annotation);
  } catch (error) {
    console.error("Error creating annotation:", error);
    res.status(500).json({ error: "Failed to create annotation" });
  }
});

reviewerRouter.put("/annotations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validationResult = insertAnnotationSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid annotation data",
        details: validationResult.error.format(),
      });
    }

    const updatedAnnotation = await storage.updateAnnotation(id, validationResult.data);

    if (!updatedAnnotation) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    res.json(updatedAnnotation);
  } catch (error) {
    console.error("Error updating annotation:", error);
    res.status(500).json({ error: "Failed to update annotation" });
  }
});

reviewerRouter.delete("/annotations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const success = await storage.deleteAnnotation(id);

    if (!success) {
      return res.status(404).json({ error: "Annotation not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting annotation:", error);
    res.status(500).json({ error: "Failed to delete annotation" });
  }
});

// Revision History routes
reviewerRouter.get("/revision-history", async (req, res) => {
  try {
    // Parse query parameters
    const objectType = req.query.objectType as string;
    const objectId = req.query.objectId ? Number(req.query.objectId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    let revisions;

    if (objectType && objectId) {
      revisions = await storage.getRevisionHistoryByObject(objectType, objectId);
    } else if (userId) {
      revisions = await storage.getRevisionHistoryByUser(userId);
    } else {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    res.json(revisions);
  } catch (error) {
    console.error("Error getting revision history:", error);
    res.status(500).json({ error: "Failed to get revision history" });
  }
});

reviewerRouter.get("/revision-history/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const revision = await storage.getRevisionHistory(id);

    if (!revision) {
      return res.status(404).json({ error: "Revision history not found" });
    }

    res.json(revision);
  } catch (error) {
    console.error("Error getting revision history:", error);
    res.status(500).json({ error: "Failed to get revision history" });
  }
});

reviewerRouter.post("/revision-history", async (req, res) => {
  try {
    const validationResult = insertRevisionHistorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid revision history data",
        details: validationResult.error.format(),
      });
    }

    const revision = await storage.createRevisionHistory(validationResult.data);

    // Notify connected clients via WebSocket
    reviewerWsService.notifyNewRevision(revision);

    res.status(201).json(revision);
  } catch (error) {
    console.error("Error creating revision history:", error);
    res.status(500).json({ error: "Failed to create revision history" });
  }
});
