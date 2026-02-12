import { Request, Response } from "express";
import { storage } from "../storage";
import fs from "fs";
import path from "path";
import { parseOrderDetails, getUploadedFilePath } from "../utils/file-upload";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe if key is available
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

/**
 * Create a new order with optional file upload
 */
export async function createOrder(req: Request, res: Response) {
  try {
    // Parse and validate order data
    const orderData = req.body;

    const uploadedFilePath = getUploadedFilePath(req);
    if (uploadedFilePath) {
      orderData.attachmentPath = uploadedFilePath;
    }

    // If file name has order details, extract them
    if (uploadedFilePath) {
      const orderDetails = parseOrderDetails(uploadedFilePath);
      if (orderDetails && orderDetails.orderNumber) {
        orderData.notes = orderData.notes
          ? `${orderData.notes} (Order #${orderDetails.orderNumber})`
          : `Order #${orderDetails.orderNumber}`;
      }
    }

    // Set default values if not provided
    if (!orderData.status) orderData.status = "pending";
    if (!orderData.priority) orderData.priority = "medium";
    if (!orderData.dueDate) {
      // Set due date to 7 days from now by default
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      orderData.dueDate = dueDate;
    }

    // Validate with Zod schema
    const result = insertOrderSchema.safeParse(orderData);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid order data",
        details: result.error.format(),
      });
    }

    // Create the order
    const order = await storage.createOrder(result.data);

    return res.status(201).json({
      message: "Order created successfully",
      order,
      filePath: uploadedFilePath,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
}

/**
 * Get a list of all orders
 */
export async function getOrders(req: Request, res: Response) {
  try {
    // Check if filter parameters are provided
    const { status, type, userId, propertyId } = req.query;

    let orders;

    if (status) {
      orders = await storage.getOrdersByStatus(status as string);
    } else if (type) {
      orders = await storage.getOrdersByType(type as string);
    } else if (userId) {
      orders = await storage.getOrdersByUser(parseInt(userId as string));
    } else if (propertyId) {
      orders = await storage.getOrdersByProperty(parseInt(propertyId as string));
    } else {
      orders = await storage.getOrders();
    }

    return res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
}

/**
 * Update an existing order
 */
export async function updateOrder(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderData = req.body;

    // Upload new attachment if provided
    const uploadedFilePath = getUploadedFilePath(req);
    if (uploadedFilePath) {
      orderData.attachmentPath = uploadedFilePath;
    }

    // Partially validate the update data
    // For updates we don't require all fields
    const updateSchema = z.object({
      userId: z.number().optional(),
      propertyId: z.number().optional(),
      orderType: z.enum(["appraisal", "assessment", "tax", "other"]).optional(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.date().optional().nullable(),
      notes: z.string().optional().nullable(),
      attachmentPath: z.string().optional().nullable(),
    });

    const result = updateSchema.safeParse(orderData);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid order data",
        details: result.error.format(),
      });
    }

    // Update the order
    const updatedOrder = await storage.updateOrder(orderId, result.data);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ error: "Failed to update order" });
  }
}

/**
 * Update just the status of an order
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const { status, notes } = req.body;

    // Validate status
    const statusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);
    try {
      statusSchema.parse(status);
    } catch (error) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Update the order status
    const updatedOrder = await storage.updateOrderStatus(orderId, status, notes);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Get the order to check if it has attachments
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Delete attachments if they exist
    if (order.attachmentPath) {
      try {
        fs.unlinkSync(order.attachmentPath);
      } catch (err) {
        console.warn(`Could not delete attachment at ${order.attachmentPath}:`, err);
      }
    }

    // Delete the order
    const success = await storage.deleteOrder(orderId);

    if (!success) {
      return res.status(500).json({ error: "Failed to delete order" });
    }

    return res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
}

/**
 * Creates a Stripe payment intent for an order
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    const { amount, orderId } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Create a payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        orderId: orderId || "none",
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      message: "Payment intent created successfully",
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
}
