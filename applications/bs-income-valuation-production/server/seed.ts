import { db } from "./db";
import { incomeMultipliers, users, incomes, valuations } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface SeedMultiplier {
  source: string;
  multiplier: string;
  description: string;
}

const defaultMultipliers: SeedMultiplier[] = [
  {
    source: "salary",
    multiplier: "2.5",
    description: "Regular employment income with benefits and stability"
  },
  {
    source: "business",
    multiplier: "3.5",
    description: "Business ownership with established operations and track record"
  },
  {
    source: "freelance",
    multiplier: "2.0",
    description: "Independent contractor work with variable income"
  },
  {
    source: "investment",
    multiplier: "4.0",
    description: "Return on investments from assets, stocks, bonds, etc."
  },
  {
    source: "rental",
    multiplier: "5.0",
    description: "Passive income from property rentals"
  },
  {
    source: "other",
    multiplier: "1.5",
    description: "Miscellaneous income sources"
  }
];

// Development sample data
const sampleIncome = [
  {
    source: "salary",
    amount: "5000.00",
    frequency: "monthly",
    description: "Software Developer position at Tech Corp"
  },
  {
    source: "investment",
    amount: "500.00",
    frequency: "monthly",
    description: "Stock dividends from tech investments"
  },
  {
    source: "rental",
    amount: "1200.00",
    frequency: "monthly",
    description: "Rental property income from downtown apartment"
  }
];

const sampleValuations = [
  {
    name: "Initial Valuation",
    totalAnnualIncome: "84000.00", // 7000 monthly income x 12
    multiplier: "3.2",
    valuationAmount: "268800.00", // 84000 x 3.2
    incomeBreakdown: JSON.stringify({
      salary: 60000,
      investment: 6000,
      rental: 18000
    }),
    notes: "Initial valuation based on current income sources",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  },
  {
    name: "Updated Valuation",
    totalAnnualIncome: "90000.00",
    multiplier: "3.5",
    valuationAmount: "315000.00",
    incomeBreakdown: JSON.stringify({
      salary: 65000,
      investment: 7000,
      rental: 18000
    }),
    notes: "Updated valuation after salary increase",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  }
];

// Seed income multipliers
export async function seedIncomeMultipliers() {
  try {
    console.log("Starting seed process for income multipliers...");
    
    // Check if we already have multipliers
    const existingMultipliers = await db.select().from(incomeMultipliers);
    
    if (existingMultipliers.length > 0) {
      console.log(`Found ${existingMultipliers.length} existing multipliers. Skipping seed.`);
      return;
    }
    
    // Insert default multipliers
    for (const multiplier of defaultMultipliers) {
      await db.insert(incomeMultipliers).values({
        source: multiplier.source,
        multiplier: multiplier.multiplier,
        description: multiplier.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added multiplier for source: ${multiplier.source}`);
    }
    
    console.log("Successfully seeded income multipliers!");
  } catch (error) {
    console.error("Error seeding income multipliers:", error);
  }
}

// Seed mock user, incomes, and valuations for development
export async function seedDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping development seed data in non-development environment');
    return;
  }

  try {
    console.log("Starting seed process for development data...");
    
    // Check for existing dev user with ID 1
    const existingUser = await db.select().from(users).where(eq(users.id, 1));
    
    // If we already have the dev user, check for income and valuation data
    if (existingUser.length > 0) {
      const existingIncomes = await db.select().from(incomes).where(eq(incomes.userId, 1));
      const existingValuations = await db.select().from(valuations).where(eq(valuations.userId, 1));
      
      // If we have incomes and valuations, skip seeding
      if (existingIncomes.length > 0 && existingValuations.length > 0) {
        console.log(`Found existing development data for user ID 1. Skipping seed.`);
        return;
      }
    } else {
      // Create dev user if it doesn't exist
      console.log('Creating development user...');
      
      // Hash the password for the dev user
      const hashedPassword = await bcrypt.hash('Password123', 10);
      
      await db.insert(users).values({
        id: 1, // Fixed ID for dev user
        username: 'devuser',
        password: hashedPassword,
        email: 'dev@example.com',
        fullName: 'Development User',
        role: 'admin',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      console.log('Development user created successfully');
    }
    
    // Create sample incomes for the dev user
    const existingIncomes = await db.select().from(incomes).where(eq(incomes.userId, 1));
    if (existingIncomes.length === 0) {
      console.log('Creating sample income data...');
      
      for (const income of sampleIncome) {
        await db.insert(incomes).values({
          userId: 1,
          source: income.source as any,
          amount: income.amount,
          frequency: income.frequency,
          description: income.description,
          createdAt: new Date()
        });
      }
      
      console.log('Sample income data created successfully');
    }
    
    // Create sample valuations for the dev user
    const existingValuations = await db.select().from(valuations).where(eq(valuations.userId, 1));
    if (existingValuations.length === 0) {
      console.log('Creating sample valuation data...');
      
      for (const valuation of sampleValuations) {
        await db.insert(valuations).values({
          userId: 1,
          name: valuation.name,
          totalAnnualIncome: valuation.totalAnnualIncome,
          multiplier: valuation.multiplier,
          valuationAmount: valuation.valuationAmount,
          incomeBreakdown: valuation.incomeBreakdown,
          notes: valuation.notes,
          createdAt: valuation.createdAt,
          updatedAt: new Date(),
          isActive: true
        });
      }
      
      console.log('Sample valuation data created successfully');
    }
    
    console.log("Successfully seeded development data!");
  } catch (error) {
    console.error("Error seeding development data:", error);
  }
}