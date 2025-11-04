import { Router, Request, Response } from "express";
import { NotificationService } from "../services/notification-service";

export const notificationRouter = Router();

/**
 * Get notifications for a user
 */
notificationRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const notificationService = NotificationService.getInstance();
    const notifications = notificationService.getNotificationsForUser(userId);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching notifications:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: errorMessage,
    });
  }
});

/**
 * Mark a notification as read
 */
notificationRouter.post("/:id/read", async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = Number(req.body.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    const notificationService = NotificationService.getInstance();
    const success = notificationService.markAsRead(userId, notificationId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already marked as read",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error marking notification as read:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: errorMessage,
    });
  }
});

/**
 * Clear all notifications for a user
 */
notificationRouter.delete("/clear", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const notificationService = NotificationService.getInstance();
    notificationService.clearNotifications(userId);

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error clearing notifications:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Error clearing notifications",
      error: errorMessage,
    });
  }
});

/**
 * Send a test notification
 */
notificationRouter.post("/test", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.body.userId);
    const type = req.body.type;
    const title = req.body.title || "Test Notification";
    const message = req.body.message || "This is a test notification";

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    const notificationService = NotificationService.getInstance();
    const notification = notificationService.sendNotification(
      userId,
      type,
      title,
      message,
      req.body.options
    );

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending test notification:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Error sending test notification",
      error: errorMessage,
    });
  }
});

export default notificationRouter;
