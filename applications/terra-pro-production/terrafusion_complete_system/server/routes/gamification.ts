import { Router } from "express";
import { storage } from "../database-storage";
import * as z from "zod";
import {
  insertAchievementDefinitionSchema,
  insertUserAchievementSchema,
  insertLevelSchema,
  insertUserProgressSchema,
  insertUserChallengeSchema,
  insertUserNotificationSchema,
} from "@shared/schema";

const gamificationRoutes = Router();

// Achievement Definition routes
gamificationRoutes.get("/achievement-definitions", async (req, res) => {
  try {
    const definitions = await storage.getAllAchievementDefinitions();
    res.json(definitions);
  } catch (error) {
    console.error("Error getting achievement definitions:", error);
    res.status(500).json({ error: "Failed to get achievement definitions" });
  }
});

gamificationRoutes.get("/achievement-definitions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const definition = await storage.getAchievementDefinition(id);
    if (!definition) {
      return res.status(404).json({ error: "Achievement definition not found" });
    }
    res.json(definition);
  } catch (error) {
    console.error("Error getting achievement definition:", error);
    res.status(500).json({ error: "Failed to get achievement definition" });
  }
});

gamificationRoutes.get("/achievement-definitions/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const definitions = await storage.getAchievementDefinitionsByCategory(category);
    res.json(definitions);
  } catch (error) {
    console.error("Error getting achievement definitions by category:", error);
    res.status(500).json({ error: "Failed to get achievement definitions by category" });
  }
});

gamificationRoutes.get("/achievement-definitions/type/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const definitions = await storage.getAchievementDefinitionsByType(type);
    res.json(definitions);
  } catch (error) {
    console.error("Error getting achievement definitions by type:", error);
    res.status(500).json({ error: "Failed to get achievement definitions by type" });
  }
});

gamificationRoutes.post("/achievement-definitions", async (req, res) => {
  try {
    const validationResult = insertAchievementDefinitionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid achievement definition data",
        details: validationResult.error.format(),
      });
    }

    const definition = await storage.createAchievementDefinition(validationResult.data);
    res.status(201).json(definition);
  } catch (error) {
    console.error("Error creating achievement definition:", error);
    res.status(500).json({ error: "Failed to create achievement definition" });
  }
});

gamificationRoutes.put("/achievement-definitions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertAchievementDefinitionSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid achievement definition data",
        details: validationResult.error.format(),
      });
    }

    const updatedDefinition = await storage.updateAchievementDefinition(id, validationResult.data);
    if (!updatedDefinition) {
      return res.status(404).json({ error: "Achievement definition not found" });
    }
    res.json(updatedDefinition);
  } catch (error) {
    console.error("Error updating achievement definition:", error);
    res.status(500).json({ error: "Failed to update achievement definition" });
  }
});

gamificationRoutes.delete("/achievement-definitions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteAchievementDefinition(id);
    if (!success) {
      return res.status(404).json({ error: "Achievement definition not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting achievement definition:", error);
    res.status(500).json({ error: "Failed to delete achievement definition" });
  }
});

// User Achievement routes
gamificationRoutes.get("/user-achievements/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const achievements = await storage.getUserAchievementsByUser(userId);
    res.json(achievements);
  } catch (error) {
    console.error("Error getting user achievements:", error);
    res.status(500).json({ error: "Failed to get user achievements" });
  }
});

gamificationRoutes.get("/user-achievements/:userId/status/:status", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const status = req.params.status;
    const achievements = await storage.getUserAchievementsByStatus(status, userId);
    res.json(achievements);
  } catch (error) {
    console.error("Error getting user achievements by status:", error);
    res.status(500).json({ error: "Failed to get user achievements by status" });
  }
});

gamificationRoutes.post("/user-achievements", async (req, res) => {
  try {
    const validationResult = insertUserAchievementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user achievement data",
        details: validationResult.error.format(),
      });
    }

    const achievement = await storage.createUserAchievement(validationResult.data);

    // Increment completed achievements count in user progress
    try {
      await storage.incrementUserProgressStats(achievement.userId, "completedAchievements");
    } catch (progressError) {
      console.error("Error updating user progress:", progressError);
      // Continue with the response even if progress update fails
    }

    res.status(201).json(achievement);
  } catch (error) {
    console.error("Error creating user achievement:", error);
    res.status(500).json({ error: "Failed to create user achievement" });
  }
});

gamificationRoutes.put("/user-achievements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertUserAchievementSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user achievement data",
        details: validationResult.error.format(),
      });
    }

    const updatedAchievement = await storage.updateUserAchievement(id, validationResult.data);
    if (!updatedAchievement) {
      return res.status(404).json({ error: "User achievement not found" });
    }

    // Check if achievement status changed to 'completed'
    if (validationResult.data.status === "completed") {
      try {
        await storage.incrementUserProgressStats(
          updatedAchievement.userId,
          "completedAchievements"
        );
      } catch (progressError) {
        console.error("Error updating user progress:", progressError);
        // Continue with the response even if progress update fails
      }
    }

    res.json(updatedAchievement);
  } catch (error) {
    console.error("Error updating user achievement:", error);
    res.status(500).json({ error: "Failed to update user achievement" });
  }
});

// Level routes
gamificationRoutes.get("/levels", async (req, res) => {
  try {
    const levels = await storage.getAllLevels();
    res.json(levels);
  } catch (error) {
    console.error("Error getting levels:", error);
    res.status(500).json({ error: "Failed to get levels" });
  }
});

gamificationRoutes.get("/levels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const level = await storage.getLevel(id);
    if (!level) {
      return res.status(404).json({ error: "Level not found" });
    }
    res.json(level);
  } catch (error) {
    console.error("Error getting level:", error);
    res.status(500).json({ error: "Failed to get level" });
  }
});

gamificationRoutes.get("/levels/points/:points", async (req, res) => {
  try {
    const points = parseInt(req.params.points);
    const level = await storage.getLevelByPointThreshold(points);
    if (!level) {
      return res.status(404).json({ error: "No level found for the given points" });
    }
    res.json(level);
  } catch (error) {
    console.error("Error getting level by points:", error);
    res.status(500).json({ error: "Failed to get level by points" });
  }
});

gamificationRoutes.post("/levels", async (req, res) => {
  try {
    const validationResult = insertLevelSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid level data",
        details: validationResult.error.format(),
      });
    }

    const level = await storage.createLevel(validationResult.data);
    res.status(201).json(level);
  } catch (error) {
    console.error("Error creating level:", error);
    res.status(500).json({ error: "Failed to create level" });
  }
});

gamificationRoutes.put("/levels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertLevelSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid level data",
        details: validationResult.error.format(),
      });
    }

    const updatedLevel = await storage.updateLevel(id, validationResult.data);
    if (!updatedLevel) {
      return res.status(404).json({ error: "Level not found" });
    }
    res.json(updatedLevel);
  } catch (error) {
    console.error("Error updating level:", error);
    res.status(500).json({ error: "Failed to update level" });
  }
});

// User Progress routes
gamificationRoutes.get("/user-progress/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const progress = await storage.getUserProgressByUser(userId);
    if (!progress) {
      return res.status(404).json({ error: "User progress not found" });
    }
    res.json(progress);
  } catch (error) {
    console.error("Error getting user progress:", error);
    res.status(500).json({ error: "Failed to get user progress" });
  }
});

gamificationRoutes.post("/user-progress", async (req, res) => {
  try {
    const validationResult = insertUserProgressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user progress data",
        details: validationResult.error.format(),
      });
    }

    const progress = await storage.createUserProgress(validationResult.data);
    res.status(201).json(progress);
  } catch (error) {
    console.error("Error creating user progress:", error);
    res.status(500).json({ error: "Failed to create user progress" });
  }
});

gamificationRoutes.put("/user-progress/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertUserProgressSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user progress data",
        details: validationResult.error.format(),
      });
    }

    const updatedProgress = await storage.updateUserProgress(id, validationResult.data);
    if (!updatedProgress) {
      return res.status(404).json({ error: "User progress not found" });
    }
    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating user progress:", error);
    res.status(500).json({ error: "Failed to update user progress" });
  }
});

gamificationRoutes.post("/user-progress/:userId/add-points", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { points } = req.body;

    if (typeof points !== "number" || points <= 0) {
      return res.status(400).json({ error: "Points must be a positive number" });
    }

    const updatedProgress = await storage.addPointsToUserProgress(userId, points);
    if (!updatedProgress) {
      return res.status(404).json({ error: "User progress not found" });
    }
    res.json(updatedProgress);
  } catch (error) {
    console.error("Error adding points to user progress:", error);
    res.status(500).json({ error: "Failed to add points to user progress" });
  }
});

gamificationRoutes.post("/user-progress/:userId/update-streak", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updatedProgress = await storage.updateStreakDays(userId);
    if (!updatedProgress) {
      return res.status(404).json({ error: "User progress not found" });
    }
    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating streak days:", error);
    res.status(500).json({ error: "Failed to update streak days" });
  }
});

// User Challenge routes
gamificationRoutes.get("/user-challenges/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const challenges = await storage.getUserChallengesByUser(userId);
    res.json(challenges);
  } catch (error) {
    console.error("Error getting user challenges:", error);
    res.status(500).json({ error: "Failed to get user challenges" });
  }
});

gamificationRoutes.get("/user-challenges/:userId/active", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const challenges = await storage.getActiveChallengesByUser(userId);
    res.json(challenges);
  } catch (error) {
    console.error("Error getting active challenges:", error);
    res.status(500).json({ error: "Failed to get active challenges" });
  }
});

gamificationRoutes.post("/user-challenges", async (req, res) => {
  try {
    const validationResult = insertUserChallengeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user challenge data",
        details: validationResult.error.format(),
      });
    }

    const challenge = await storage.createUserChallenge(validationResult.data);
    res.status(201).json(challenge);
  } catch (error) {
    console.error("Error creating user challenge:", error);
    res.status(500).json({ error: "Failed to create user challenge" });
  }
});

gamificationRoutes.put("/user-challenges/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validationResult = insertUserChallengeSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user challenge data",
        details: validationResult.error.format(),
      });
    }

    const updatedChallenge = await storage.updateUserChallenge(id, validationResult.data);
    if (!updatedChallenge) {
      return res.status(404).json({ error: "User challenge not found" });
    }
    res.json(updatedChallenge);
  } catch (error) {
    console.error("Error updating user challenge:", error);
    res.status(500).json({ error: "Failed to update user challenge" });
  }
});

gamificationRoutes.post("/user-challenges/:id/progress", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { incrementBy } = req.body;

    if (typeof incrementBy !== "number" || incrementBy <= 0) {
      return res.status(400).json({ error: "Increment value must be a positive number" });
    }

    const updatedChallenge = await storage.incrementChallengeProgress(id, incrementBy);
    if (!updatedChallenge) {
      return res.status(404).json({ error: "User challenge not found" });
    }

    // If challenge was completed, update user progress
    if (updatedChallenge.status === "completed") {
      try {
        // Award points for completing the challenge
        const pointsToAward = updatedChallenge.pointValue || 10; // Default to 10 points if not specified
        await storage.addPointsToUserProgress(updatedChallenge.userId, pointsToAward);

        // Create a notification for challenge completion
        await storage.createUserNotification({
          userId: updatedChallenge.userId,
          type: "challenge_completed",
          title: "Challenge Completed!",
          message: `You've completed the challenge: ${updatedChallenge.title}`,
          read: false,
        });
      } catch (progressError) {
        console.error("Error updating progress after challenge completion:", progressError);
        // Continue with the response even if progress update fails
      }
    }

    res.json(updatedChallenge);
  } catch (error) {
    console.error("Error incrementing challenge progress:", error);
    res.status(500).json({ error: "Failed to increment challenge progress" });
  }
});

// User Notification routes
gamificationRoutes.get("/user-notifications/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const notifications = await storage.getUserNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error getting user notifications:", error);
    res.status(500).json({ error: "Failed to get user notifications" });
  }
});

gamificationRoutes.get("/user-notifications/:userId/unread", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const notifications = await storage.getUnreadNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    res.status(500).json({ error: "Failed to get unread notifications" });
  }
});

gamificationRoutes.post("/user-notifications", async (req, res) => {
  try {
    const validationResult = insertUserNotificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user notification data",
        details: validationResult.error.format(),
      });
    }

    const notification = await storage.createUserNotification(validationResult.data);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating user notification:", error);
    res.status(500).json({ error: "Failed to create user notification" });
  }
});

gamificationRoutes.post("/user-notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedNotification = await storage.markNotificationAsRead(id);
    if (!updatedNotification) {
      return res.status(404).json({ error: "User notification not found" });
    }
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

gamificationRoutes.post("/user-notifications/:userId/read-all", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const success = await storage.markAllUserNotificationsAsRead(userId);
    if (!success) {
      return res.status(404).json({ error: "User not found or no notifications to mark as read" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export { gamificationRoutes };
