/**
 * Database Storage Implementation
 *
 * Implements the IStorage interface using a PostgreSQL database.
 */
import { IStorage } from "./storage";
import {
  users,
  type User,
  type InsertUser,
  orders,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

/**
 * Database Storage Class
 *
 * This class provides a concrete implementation of IStorage
 * using a PostgreSQL database for persistence.
 */
export class DatabaseStorage implements IStorage {
  /**
   * Get a user by ID
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));

      return user || undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));

      return user || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  /**
   * Create a new user
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();

      if (!user) {
        throw new Error("Failed to create user");
      }

      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Implement other IStorage methods as needed

  /**
   * Create a new order
   */
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      const [order] = await db.insert(orders).values(insertOrder).returning();

      if (!order) {
        throw new Error("Failed to create order");
      }

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const [order] = await db
        .update(orders)
        .set({
          ...orderData,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return order || undefined;
    } catch (error) {
      console.error("Error updating order:", error);
      return undefined;
    }
  }

  /**
   * Update an order's status
   */
  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined> {
    try {
      // Cast status to the appropriate type
      const validStatus = status as "pending" | "in_progress" | "completed" | "cancelled";

      const [order] = await db
        .update(orders)
        .set({
          status: validStatus,
          notes: notes ? notes : undefined,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return order || undefined;
    } catch (error) {
      console.error("Error updating order status:", error);
      return undefined;
    }
  }

  /**
   * Get an order by ID
   */
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));

      return order || undefined;
    } catch (error) {
      console.error("Error getting order by ID:", error);
      return undefined;
    }
  }

  /**
   * Get all orders
   */
  async getOrders(): Promise<Order[]> {
    try {
      const ordersList = await db.select().from(orders).orderBy(orders.createdAt);

      return ordersList;
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  /**
   * Delete an order
   */
  async deleteOrder(id: number): Promise<boolean> {
    try {
      const [order] = await db.delete(orders).where(eq(orders.id, id)).returning();

      return !!order;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }

  // Additional order methods needed to fulfill IStorage interface

  /**
   * Get orders by user ID
   */
  async getOrdersByUser(userId: number): Promise<Order[]> {
    try {
      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(orders.createdAt);

      return ordersList;
    } catch (error) {
      console.error("Error getting orders by user:", error);
      return [];
    }
  }

  /**
   * Get orders by property ID
   */
  async getOrdersByProperty(propertyId: number): Promise<Order[]> {
    try {
      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.propertyId, propertyId))
        .orderBy(orders.createdAt);

      return ordersList;
    } catch (error) {
      console.error("Error getting orders by property:", error);
      return [];
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      // Cast status to the appropriate type
      const validStatus = status as "pending" | "in_progress" | "completed" | "cancelled";

      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.status, validStatus))
        .orderBy(orders.createdAt);

      return ordersList;
    } catch (error) {
      console.error("Error getting orders by status:", error);
      return [];
    }
  }

  /**
   * Get orders by type
   */
  async getOrdersByType(type: string): Promise<Order[]> {
    try {
      // Cast type to the appropriate enum type
      const validType = type as "appraisal" | "assessment" | "tax" | "other";

      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.orderType, validType))
        .orderBy(orders.createdAt);

      return ordersList;
    } catch (error) {
      console.error("Error getting orders by type:", error);
      return [];
    }
  }

  // To be implemented as needed:
  // Properties, Assessment Reports, etc.
}
