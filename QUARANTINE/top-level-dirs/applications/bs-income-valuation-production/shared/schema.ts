import { pgTable, text, serial, integer, numeric, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Income multipliers configuration
export const incomeMultipliers = pgTable("income_multipliers", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().unique(),
  multiplier: numeric("multiplier", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  role: text("role").default("user").notNull(),
});

// Auth tokens table for JWT refresh tokens
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revoked: boolean("revoked").default(false).notNull(),
});

// Development one-time auth tokens for instant login
export const devAuthTokens = pgTable("dev_auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  used: boolean("used").default(false).notNull(),
  description: text("description"),
  createdBy: text("created_by"),
  ipAddress: text("ip_address"),
});

// Income sources enum
export const incomeSourceEnum = pgEnum("income_source", [
  "salary",
  "business",
  "freelance",
  "investment",
  "rental",
  "other"
]);

// Income model
export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  source: incomeSourceEnum("source").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, yearly, etc.
  description: text("description"),
  date: timestamp("date"),  // Specific date this income was received
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Valuation model
export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  totalAnnualIncome: numeric("total_annual_income", { precision: 12, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 5, scale: 2 }).notNull(),
  valuationAmount: numeric("valuation_amount", { precision: 15, scale: 2 }).notNull(),
  incomeBreakdown: text("income_breakdown"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Dashboard model
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  widgets: jsonb("widgets").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  incomes: many(incomes),
  valuations: many(valuations),
  dashboards: many(dashboards),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
}));

export const valuationsRelations = relations(valuations, ({ one }) => ({
  user: one(users, {
    fields: [valuations.userId],
    references: [users.id],
  }),
}));

export const dashboardsRelations = relations(dashboards, ({ one }) => ({
  user: one(users, {
    fields: [dashboards.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .trim(),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, and ._-")
    .trim(),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(/.*[A-Z].*/, "Password must contain at least one uppercase letter")
    .regex(/.*[a-z].*/, "Password must contain at least one lowercase letter")
    .regex(/.*\d.*/, "Password must contain at least one number"),
  email: z.string()
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  fullName: z.string()
    .max(100, "Full name is too long")
    .optional()
    .transform(val => val === "" ? undefined : val?.trim()),
});

export const insertIncomeSchema = createInsertSchema(incomes)
  .pick({
    userId: true,
    source: true,
    amount: true,
    frequency: true,
    description: true,
    date: true,
  })
  .extend({
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    userId: z.number().int().positive("User ID must be a positive integer"),
    source: z.enum(["salary", "business", "freelance", "investment", "rental", "other"], {
      errorMap: () => ({ message: "Invalid income source type" })
    }),
    amount: z.union([z.string(), z.number()])
      .refine(val => {
        const numVal = Number(val);
        return !isNaN(numVal) && numVal > 0;
      }, "Amount must be a positive number")
      .transform(val => typeof val === 'string' ? val : val.toString()),
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"], {
      errorMap: () => ({ message: "Frequency must be daily, weekly, monthly, quarterly, or yearly" })
    }),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional()
      .transform(val => val === "" ? null : val?.trim()),
    date: z.date().optional().default(() => new Date()),
  });

export const insertValuationSchema = createInsertSchema(valuations)
  .pick({
    userId: true,
    name: true,
    totalAnnualIncome: true,
    multiplier: true,
    valuationAmount: true,
    incomeBreakdown: true,
    notes: true,
  })
  .extend({
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    userId: z.number().int().positive("User ID must be a positive integer"),
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters")
      .trim(),
    totalAnnualIncome: z.union([z.string(), z.number()])
      .refine(val => {
        const numVal = Number(val);
        return !isNaN(numVal) && numVal >= 0;
      }, "Total annual income must be a positive number")
      .transform(val => typeof val === 'string' ? val : val.toString()),
    multiplier: z.union([z.string(), z.number()])
      .refine(val => {
        const numVal = Number(val);
        return !isNaN(numVal) && numVal > 0;
      }, "Multiplier must be a positive number")
      .transform(val => typeof val === 'string' ? val : val.toString()),
    valuationAmount: z.union([z.string(), z.number()])
      .refine(val => {
        const numVal = Number(val);
        return !isNaN(numVal) && numVal >= 0;
      }, "Valuation amount must be a positive number")
      .transform(val => typeof val === 'string' ? val : val.toString()),
    incomeBreakdown: z.string().optional()
      .transform(val => val === "" ? null : val),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional()
      .transform(val => val === "" ? null : val?.trim()),
  });

export const insertIncomeMultiplierSchema = createInsertSchema(incomeMultipliers)
  .pick({
    source: true,
    multiplier: true,
    description: true,
    isActive: true,
  })
  .extend({
    source: z.string()
      .min(1, "Source is required")
      .max(50, "Source cannot exceed 50 characters")
      .trim(),
    multiplier: z.union([z.string(), z.number()])
      .refine(val => {
        const numVal = Number(val);
        return !isNaN(numVal) && numVal > 0 && numVal <= 100;
      }, "Multiplier must be a positive number between 0 and 100")
      .transform(val => typeof val === 'string' ? val : val.toString()),
    description: z.string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .transform(val => val === "" ? null : val?.trim()),
    isActive: z.boolean().default(true),
  });

// Dev auth token schema
export const createDevAuthTokenSchema = z.object({
  userId: z.number().int().positive(),
  description: z.string().optional(),
  expiresInMinutes: z.number().int().min(1).max(60 * 24).default(60), // Default 1 hour, max 24 hours
});

export const devAuthLoginSchema = z.object({
  token: z.string().min(10),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;

export type Valuation = typeof valuations.$inferSelect;
export type InsertValuation = z.infer<typeof insertValuationSchema>;

export type IncomeMultiplier = typeof incomeMultipliers.$inferSelect;
export type InsertIncomeMultiplier = z.infer<typeof insertIncomeMultiplierSchema>;

export type DevAuthToken = typeof devAuthTokens.$inferSelect;
export type CreateDevAuthToken = z.infer<typeof createDevAuthTokenSchema>;

// Dashboard schema
export const insertDashboardSchema = createInsertSchema(dashboards)
  .pick({
    userId: true,
    name: true,
    description: true,
    widgets: true,
  })
  .extend({
    userId: z.number().int().positive("User ID must be a positive integer"),
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters")
      .trim(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional()
      .transform(val => val === "" ? null : val?.trim()),
    widgets: z.array(WidgetSchema).default([])
  });

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
