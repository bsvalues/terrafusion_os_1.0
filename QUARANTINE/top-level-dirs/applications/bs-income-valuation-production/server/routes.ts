import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertIncomeSchema, insertValuationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { authRouter } from "./authRoutes";
import { dashboardRouter } from "./dashboardRoutes";
import { valuationRouter } from "./valuationRoutes";
import { agentRouter } from "./agentRoutes";
import { devAuthRouter } from "./devAuthRoutes";
import { timeSeriesRouter } from "./timeSeriesRoutes";
import { patternRecognitionRouter } from "./patternRecognitionRoutes";
import { mcpRouter } from "./mcpRoutes";
import { asyncHandler, NotFoundError, ValidationError } from "./errorHandler";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Health check route
  router.get("/health", (req: Request, res: Response) => {
    res.json({ message: "Income Valuation SaaS API is running!" });
  });
  
  // Register auth routes
  router.use("/auth", authRouter);
  
  // Register dashboard routes
  router.use("/dashboard", dashboardRouter);
  
  // Register valuation routes
  router.use("/valuations", valuationRouter);
  
  // Register AI agent routes
  router.use("/agents", agentRouter);
  
  // Register dev auth routes (only available in development)
  router.use("/dev-auth", devAuthRouter);
  
  // Register time series routes
  router.use("/timeseries", timeSeriesRouter);
  
  // Register pattern recognition routes
  router.use("/patterns", patternRecognitionRouter);
  
  // Register MCP routes
  router.use("/mcp", mcpRouter);
  
  // Income multipliers route
  router.get("/multipliers", asyncHandler(async (req: Request, res: Response) => {
    const multipliers = await storage.getAllIncomeMultipliers();
    res.json(multipliers);
  }));

  // User routes
  router.post("/users", asyncHandler(async (req: Request, res: Response) => {
    console.log("Request body:", req.body);
    try {
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);
      const user = await storage.createUser(userData);
      console.log("Created user:", user);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError(validationError.message);
      }
      throw error;
    }
  }));

  router.get("/users/:id", asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new NotFoundError("User not found");
    }
    
    res.json(user);
  }));

  // Income routes
  router.get("/users/:userId/incomes", asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const incomes = await storage.getIncomesByUserId(userId);
    res.json(incomes);
  }));

  router.get("/incomes/:id", asyncHandler(async (req: Request, res: Response) => {
    const incomeId = parseInt(req.params.id);
    const income = await storage.getIncomeById(incomeId);
    
    if (!income) {
      throw new NotFoundError("Income not found");
    }
    
    res.json(income);
  }));

  router.post("/incomes", asyncHandler(async (req: Request, res: Response) => {
    try {
      const incomeData = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(incomeData);
      res.status(201).json({
        success: true,
        data: income,
        message: "Income source added successfully" 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError("Invalid income data", validationError.details);
      }
      throw error;
    }
  }));

  router.put("/incomes/:id", asyncHandler(async (req: Request, res: Response) => {
    const incomeId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(incomeId) || incomeId <= 0) {
      throw new ValidationError("Invalid income ID", { id: "Must be a positive integer" });
    }
    
    // Validate update data
    const incomeData = insertIncomeSchema.partial().parse(req.body);
    const income = await storage.updateIncome(incomeId, incomeData);
    
    if (!income) {
      throw new NotFoundError("Income not found");
    }
    
    res.json({
      success: true,
      data: income,
      message: "Income updated successfully"
    });
  }));

  router.delete("/incomes/:id", asyncHandler(async (req: Request, res: Response) => {
    const incomeId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(incomeId) || incomeId <= 0) {
      throw new ValidationError("Invalid income ID", { id: "Must be a positive integer" });
    }
    
    const success = await storage.deleteIncome(incomeId);
    
    if (!success) {
      throw new NotFoundError("Income not found");
    }
    
    res.json({
      success: true,
      message: "Income deleted successfully"
    });
  }));

  // Valuation routes
  router.get("/users/:userId/valuations", asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    
    // Validate ID parameter
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID", { userId: "Must be a positive integer" });
    }
    
    const valuations = await storage.getValuationsByUserId(userId);
    res.json({
      success: true,
      data: valuations,
      count: valuations.length
    });
  }));

  router.get("/valuations/:id", asyncHandler(async (req: Request, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(valuationId) || valuationId <= 0) {
      throw new ValidationError("Invalid valuation ID", { id: "Must be a positive integer" });
    }
    
    const valuation = await storage.getValuationById(valuationId);
    if (!valuation) {
      throw new NotFoundError("Valuation not found");
    }
    
    res.json({
      success: true,
      data: valuation
    });
  }));

  router.post("/valuations", asyncHandler(async (req: Request, res: Response) => {
    let valuationData;
    try {
      valuationData = insertValuationSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new ValidationError("Invalid valuation data", validationError.details);
      }
      throw error;
    }
    
    const valuation = await storage.createValuation(valuationData);
    res.status(201).json({
      success: true,
      data: valuation,
      message: "Valuation created successfully"
    });
  }));

  router.put("/valuations/:id", asyncHandler(async (req: Request, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(valuationId) || valuationId <= 0) {
      throw new ValidationError("Invalid valuation ID", { id: "Must be a positive integer" });
    }
    
    // Validate update data
    const valuationData = insertValuationSchema.partial().parse(req.body);
    const valuation = await storage.updateValuation(valuationId, valuationData);
    
    if (!valuation) {
      throw new NotFoundError("Valuation not found");
    }
    
    res.json({
      success: true,
      data: valuation,
      message: "Valuation updated successfully"
    });
  }));

  router.delete("/valuations/:id", asyncHandler(async (req: Request, res: Response) => {
    const valuationId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(valuationId) || valuationId <= 0) {
      throw new ValidationError("Invalid valuation ID", { id: "Must be a positive integer" });
    }
    
    const success = await storage.deleteValuation(valuationId);
    
    if (!success) {
      throw new NotFoundError("Valuation not found");
    }
    
    res.json({
      success: true,
      message: "Valuation deleted successfully"
    });
  }));

  // Register API routes with /api prefix
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
