import { IStorage } from '../../server/storage';
import { 
  User, 
  InsertUser, 
  Income, 
  InsertIncome, 
  Valuation, 
  InsertValuation,
  IncomeMultiplier,
  InsertIncomeMultiplier
} from '@shared/schema';

/**
 * Mock implementation of the Storage interface for testing
 */
export class MockStorage implements IStorage {
  private users: User[] = [];
  private incomes: Income[] = [];
  private valuations: Valuation[] = [];
  private incomeMultipliers: IncomeMultiplier[] = [];
  private userId = 1;
  private incomeId = 1;
  private valuationId = 1;
  private multiplierID = 1;
  
  constructor() {
    // Initialize default income multipliers
    this.seedDefaultMultipliers();
  }
  
  private seedDefaultMultipliers() {
    const defaultMultipliers = [
      { source: 'salary', multiplier: '2.5', description: 'Standard employment income' },
      { source: 'business', multiplier: '3.5', description: 'Business ownership income' },
      { source: 'freelance', multiplier: '2.0', description: 'Independent contractor work' },
      { source: 'investment', multiplier: '4.0', description: 'Investment returns' },
      { source: 'rental', multiplier: '5.0', description: 'Property rental income' },
      { source: 'other', multiplier: '1.5', description: 'Miscellaneous income sources' },
    ];
    
    for (const multiplier of defaultMultipliers) {
      this.incomeMultipliers.push({
        id: this.multiplierID++,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...multiplier
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.userId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      ...user
    };
    this.users.push(newUser);
    return newUser;
  }

  // Income operations
  async getIncomesByUserId(userId: number): Promise<Income[]> {
    return this.incomes
      .filter(income => income.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getIncomeById(id: number): Promise<Income | undefined> {
    return this.incomes.find(income => income.id === id);
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const newIncome: Income = {
      id: this.incomeId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...income
    };
    this.incomes.push(newIncome);
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined> {
    const index = this.incomes.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    const updatedIncome = {
      ...this.incomes[index],
      ...income,
      updatedAt: new Date()
    };
    this.incomes[index] = updatedIncome;
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<boolean> {
    const initialLength = this.incomes.length;
    this.incomes = this.incomes.filter(income => income.id !== id);
    return initialLength > this.incomes.length;
  }

  // Valuation operations
  async getValuationsByUserId(userId: number): Promise<Valuation[]> {
    return this.valuations
      .filter(valuation => valuation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getValuationById(id: number): Promise<Valuation | undefined> {
    return this.valuations.find(valuation => valuation.id === id);
  }

  async createValuation(valuation: InsertValuation): Promise<Valuation> {
    const newValuation: Valuation = {
      id: this.valuationId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...valuation
    };
    this.valuations.push(newValuation);
    return newValuation;
  }

  async updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined> {
    const index = this.valuations.findIndex(v => v.id === id);
    if (index === -1) return undefined;

    const updatedValuation = {
      ...this.valuations[index],
      ...valuation,
      updatedAt: new Date()
    };
    this.valuations[index] = updatedValuation;
    return updatedValuation;
  }

  async deleteValuation(id: number): Promise<boolean> {
    const initialLength = this.valuations.length;
    this.valuations = this.valuations.filter(valuation => valuation.id !== id);
    return initialLength > this.valuations.length;
  }

  // Income Multiplier operations
  async getAllIncomeMultipliers(): Promise<IncomeMultiplier[]> {
    return [...this.incomeMultipliers];
  }

  async getIncomeMultiplierBySource(source: string): Promise<IncomeMultiplier | undefined> {
    return this.incomeMultipliers.find(m => m.source === source);
  }

  async createIncomeMultiplier(multiplier: InsertIncomeMultiplier): Promise<IncomeMultiplier> {
    const newMultiplier: IncomeMultiplier = {
      id: this.multiplierID++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...multiplier
    };
    this.incomeMultipliers.push(newMultiplier);
    return newMultiplier;
  }

  async updateIncomeMultiplier(
    id: number, 
    multiplier: Partial<InsertIncomeMultiplier>
  ): Promise<IncomeMultiplier | undefined> {
    const index = this.incomeMultipliers.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    const updatedMultiplier = {
      ...this.incomeMultipliers[index],
      ...multiplier,
      updatedAt: new Date()
    };
    this.incomeMultipliers[index] = updatedMultiplier;
    return updatedMultiplier;
  }

  async deleteIncomeMultiplier(id: number): Promise<boolean> {
    const initialLength = this.incomeMultipliers.length;
    this.incomeMultipliers = this.incomeMultipliers.filter(m => m.id !== id);
    return initialLength > this.incomeMultipliers.length;
  }

  // Valuation calculation
  async calculateValuation(userId: number): Promise<{
    incomeBreakdown: Array<{ source: string, annualAmount: number, multiplier: number, valuation: number }>,
    totalAnnualIncome: number,
    weightedMultiplier: number,
    totalValuation: number
  }> {
    // Get user's incomes
    const incomes = await this.getIncomesByUserId(userId);
    
    if (incomes.length === 0) {
      return {
        incomeBreakdown: [],
        totalAnnualIncome: 0,
        weightedMultiplier: 0,
        totalValuation: 0
      };
    }

    let totalAnnualIncome = 0;
    let totalWeightedMultiplier = 0;
    const incomeBreakdown: Array<{ 
      source: string; 
      annualAmount: number; 
      multiplier: number; 
      valuation: number 
    }> = [];

    // Calculate annual amount and valuation for each income
    for (const income of incomes) {
      // Get the multiplier for this income source
      const multiplierObj = await this.getIncomeMultiplierBySource(income.source);
      const multiplier = multiplierObj ? parseFloat(multiplierObj.multiplier) : 1.5; // Default to 1.5 if not found
      
      // Convert income to annual amount based on frequency
      let annualAmount = 0;
      switch (income.frequency) {
        case 'weekly':
          annualAmount = income.amount * 52;
          break;
        case 'biweekly':
          annualAmount = income.amount * 26;
          break;
        case 'monthly':
          annualAmount = income.amount * 12;
          break;
        case 'quarterly':
          annualAmount = income.amount * 4;
          break;
        case 'yearly':
          annualAmount = income.amount;
          break;
        default:
          annualAmount = income.amount * 12; // Default to monthly
      }
      
      totalAnnualIncome += annualAmount;
      
      // Add to the breakdown
      incomeBreakdown.push({
        source: income.source,
        annualAmount,
        multiplier,
        valuation: annualAmount * multiplier
      });
    }

    // Calculate weighted multiplier
    for (const item of incomeBreakdown) {
      const weight = item.annualAmount / totalAnnualIncome;
      totalWeightedMultiplier += weight * item.multiplier;
    }

    // Calculate total valuation
    const totalValuation = totalAnnualIncome * totalWeightedMultiplier;

    return {
      incomeBreakdown,
      totalAnnualIncome,
      weightedMultiplier: totalWeightedMultiplier,
      totalValuation
    };
  }

  // For testing: reset all data
  reset() {
    this.users = [];
    this.incomes = [];
    this.valuations = [];
    this.incomeMultipliers = [];
    this.userId = 1;
    this.incomeId = 1;
    this.valuationId = 1;
    this.multiplierID = 1;
    
    // Re-seed multipliers
    this.seedDefaultMultipliers();
  }
}