import { Router } from "express";
import { db } from "../db";
import { orders, properties, appraisalForms } from "../../shared/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Get recent orders
router.get("/recent", async (req, res) => {
  try {
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        clientName: orders.clientName,
        dueDate: orders.dueDate,
        status: orders.status,
        priorityLevel: orders.priorityLevel,
        propertyAddress: properties.address,
        completionPercentage: appraisalForms.completionPercentage,
      })
      .from(orders)
      .leftJoin(properties, eq(orders.propertyId, properties.id))
      .leftJoin(appraisalForms, eq(orders.id, appraisalForms.orderId))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    const formattedOrders = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      propertyAddress: order.propertyAddress || "Address not specified",
      clientName: order.clientName,
      dueDate: order.dueDate?.toISOString() || new Date().toISOString(),
      status: order.status,
      priority: order.priorityLevel || "normal",
      completionPercentage: order.completionPercentage || 0,
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Recent orders error:", error);
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
});

export default router;
