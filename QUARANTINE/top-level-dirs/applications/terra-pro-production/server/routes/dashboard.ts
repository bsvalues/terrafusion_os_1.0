import { Router } from "express";
import { db } from "../db";
import { orders, valuations, appraisalForms } from "../../shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const router = Router();

// Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // Get total active orders
    const activeOrders = await db.select().from(orders).where(eq(orders.status, "in_progress"));

    // Get completed orders this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = await db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "completed"), gte(orders.updatedAt, weekAgo)));

    // Get total AI valuations generated
    const aiValuations = await db
      .select()
      .from(valuations)
      .where(eq(valuations.valuationMethod, "ai"));

    // Calculate average completion percentage
    const allForms = await db.select().from(appraisalForms);

    const averageCompletion =
      allForms.length > 0
        ? Math.round(
            allForms.reduce((sum, form) => sum + (form.completionPercentage || 0), 0) /
              allForms.length
          )
        : 0;

    res.json({
      totalOrders: activeOrders.length + completedThisWeek.length,
      activeOrders: activeOrders.length,
      completedThisWeek: completedThisWeek.length,
      pendingReview: 0, // TODO: Implement review system count
      aiValuationsGenerated: aiValuations.length,
      averageCompletion,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

export default router;
