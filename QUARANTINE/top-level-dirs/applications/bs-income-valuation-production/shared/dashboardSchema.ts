import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Widget position schema
export const WidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1)
});

// Widget schema
export const WidgetSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  title: z.string(),
  position: WidgetPositionSchema,
  settings: z.record(z.any()).optional()
});

// Dashboard schema
export const DashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  widgets: z.array(WidgetSchema)
});

// Database tables
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  widgets: jsonb("widgets").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Type for insert operations
export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true, 
  createdAt: true,
  updatedAt: true
});

// Types based on schemas
export type Dashboard = z.infer<typeof DashboardSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type DBDashboard = typeof dashboards.$inferSelect;