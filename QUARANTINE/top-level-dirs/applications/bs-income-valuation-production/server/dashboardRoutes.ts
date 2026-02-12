import { Router, Request, Response } from "express";
import { authenticateJWT } from "./auth";
import { storage } from "./storage";

export const dashboardRouter = Router();

// Define summary data structures
interface IncomeSummary {
  source: string;
  total: number;
  count: number;
  averageAmount: number;
}

interface DashboardResponse {
  recentValuations: any[];
  incomeSummaryByType: IncomeSummary[];
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  valuationCount: number;
  incomeCount: number;
  latestValuation: any | null;
}

// Dashboard overview endpoint
dashboardRouter.get('/', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Get user's incomes
    const incomes = await storage.getIncomesByUserId(userId);
    
    // Get user's valuations
    const valuations = await storage.getValuationsByUserId(userId);
    
    // Process incomes for summary data
    const incomeSummaryMap = new Map<string, { total: number; count: number }>();
    let totalMonthlyIncome = 0;
    
    for (const income of incomes) {
      const source = income.source;
      const amount = parseFloat(income.amount);
      totalMonthlyIncome += isNaN(amount) ? 0 : amount;
      
      const summary = incomeSummaryMap.get(source) || { total: 0, count: 0 };
      summary.total += isNaN(amount) ? 0 : amount;
      summary.count += 1;
      incomeSummaryMap.set(source, summary);
    }
    
    // Calculate income summary by type
    const incomeSummaryByType: IncomeSummary[] = Array.from(incomeSummaryMap.entries()).map(
      ([source, { total, count }]) => ({
        source,
        total,
        count,
        averageAmount: count > 0 ? total / count : 0
      })
    );
    
    // Calculate total annual income
    const totalAnnualIncome = totalMonthlyIncome * 12;
    
    // Get latest valuation
    const latestValuation = valuations.length > 0 
      ? valuations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
    
    // Sort valuations by date (recent first) and limit to 5
    const recentValuations = valuations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // Compile dashboard data
    const dashboardData: DashboardResponse = {
      recentValuations,
      incomeSummaryByType,
      totalMonthlyIncome,
      totalAnnualIncome,
      valuationCount: valuations.length,
      incomeCount: incomes.length,
      latestValuation
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch dashboard data"
      }
    });
  }
});

// Detailed dashboard data 
dashboardRouter.get('/detailed', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Get all income data
    const incomes = await storage.getIncomesByUserId(userId);
    
    // Get all valuation history
    const valuations = await storage.getValuationsByUserId(userId);
    
    // Get income multipliers
    const multipliers = await storage.getAllIncomeMultipliers();
    
    res.json({
      success: true,
      data: {
        incomes,
        valuations,
        multipliers
      }
    });
  } catch (error) {
    console.error("Error fetching detailed dashboard data:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch detailed dashboard data"
      }
    });
  }
});

// Get summary of a specific valuation
dashboardRouter.get('/valuation/:id/summary', authenticateJWT, async (req: Request & { user?: any }, res: Response) => {
  try {
    const valuationId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    // Get the valuation
    const valuation = await storage.getValuationById(valuationId);
    
    if (!valuation) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Valuation not found"
        }
      });
    }
    
    // Verify ownership
    if (valuation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: "You don't have permission to access this valuation"
        }
      });
    }
    
    // Parse income breakdown from JSON
    let incomeBreakdown = [];
    try {
      if (valuation.incomeBreakdown) {
        incomeBreakdown = JSON.parse(valuation.incomeBreakdown);
      }
    } catch (err) {
      console.error("Error parsing income breakdown:", err);
    }
    
    // Return valuation summary
    res.json({
      success: true,
      data: {
        id: valuation.id,
        name: valuation.name,
        valuationAmount: valuation.valuationAmount,
        totalAnnualIncome: valuation.totalAnnualIncome,
        multiplier: valuation.multiplier,
        incomeBreakdown,
        createdAt: valuation.createdAt,
        notes: valuation.notes
      }
    });
  } catch (error) {
    console.error("Error fetching valuation summary:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch valuation summary"
      }
    });
  }
});