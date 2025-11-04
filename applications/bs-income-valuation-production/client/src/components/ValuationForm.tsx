import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertValuationSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCurrency } from '@/lib/formatters';

// Extend the insertValuationSchema with custom form validations
const valuationFormSchema = insertValuationSchema.extend({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(100, 'Name must be less than 100 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

type ValuationFormValues = z.infer<typeof valuationFormSchema>;

interface Income {
  id: number;
  userId: number;
  source: string;
  amount: string;
  frequency: string;
  description?: string;
  createdAt: Date;
}

interface IncomeMultiplier {
  id: number;
  source: string;
  multiplier: string;
  description?: string;
  isActive: boolean;
}

interface Valuation {
  id: number;
  userId: number;
  name: string;
  totalAnnualIncome: string;
  multiplier: string;
  valuationAmount: string;
  incomeBreakdown?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface ValuationFormProps {
  incomeData: Income[];
  multipliers: IncomeMultiplier[];
  existingValuation?: Valuation;
  onSubmit: (data: ValuationFormValues) => void;
}

export function ValuationForm({ incomeData, multipliers, existingValuation, onSubmit }: ValuationFormProps) {
  const { toast } = useToast();
  const [calculatedValuation, setCalculatedValuation] = useState<string | null>(null);
  const [annualIncomeBySource, setAnnualIncomeBySource] = useState<Record<string, number>>({});
  const [totalAnnualIncome, setTotalAnnualIncome] = useState<string>("0.00");
  
  // Initialize form with default values or existing valuation data
  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: existingValuation 
      ? {
          userId: existingValuation.userId,
          name: existingValuation.name,
          totalAnnualIncome: existingValuation.totalAnnualIncome,
          multiplier: existingValuation.multiplier,
          valuationAmount: existingValuation.valuationAmount,
          incomeBreakdown: existingValuation.incomeBreakdown,
          notes: existingValuation.notes,
        }
      : {
          userId: 1, // Default to current user in development
          name: '',
          totalAnnualIncome: '0.00',
          multiplier: '3.0', // Default multiplier
          valuationAmount: '0.00',
          incomeBreakdown: '{}',
          notes: '',
        }
  });
  
  // Calculate annual income from income data
  useEffect(() => {
    if (!incomeData || incomeData.length === 0) return;
    
    const incomeBySource: Record<string, number> = {};
    let calculatedAnnualIncome = 0;
    
    incomeData.forEach(income => {
      const amount = parseFloat(income.amount);
      if (isNaN(amount)) return;
      
      // Calculate annual amount based on frequency
      let annualAmount = amount;
      switch (income.frequency) {
        case 'daily':
          annualAmount *= 365;
          break;
        case 'weekly':
          annualAmount *= 52;
          break;
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'quarterly':
          annualAmount *= 4;
          break;
        // yearly is already annual, no multiplication needed
      }
      
      // Add to source total
      if (!incomeBySource[income.source]) {
        incomeBySource[income.source] = 0;
      }
      incomeBySource[income.source] += annualAmount;
      calculatedAnnualIncome += annualAmount;
    });
    
    setAnnualIncomeBySource(incomeBySource);
    setTotalAnnualIncome(calculatedAnnualIncome.toFixed(2));
    
    // Update form value
    form.setValue('totalAnnualIncome', calculatedAnnualIncome.toFixed(2));
    
    // Set income breakdown JSON
    form.setValue('incomeBreakdown', JSON.stringify(incomeBySource));
    
  }, [incomeData, form]);
  
  // If there's an existing valuation, set the calculated valuation to its amount
  useEffect(() => {
    if (existingValuation) {
      setCalculatedValuation(existingValuation.valuationAmount);
    }
  }, [existingValuation]);
  
  // Calculate weighted average multiplier based on income sources
  const calculateWeightedMultiplier = (): string => {
    if (Object.keys(annualIncomeBySource).length === 0) return '3.0';
    
    let totalWeightedMultiplier = 0;
    let totalIncome = 0;
    
    Object.entries(annualIncomeBySource).forEach(([source, amount]) => {
      const sourceMultiplier = multipliers.find(m => m.source === source);
      if (sourceMultiplier) {
        totalWeightedMultiplier += amount * parseFloat(sourceMultiplier.multiplier);
        totalIncome += amount;
      }
    });
    
    if (totalIncome === 0) return '3.0';
    return (totalWeightedMultiplier / totalIncome).toFixed(2);
  };
  
  // Calculate valuation based on form inputs
  const calculateValuation = () => {
    const income = parseFloat(form.getValues('totalAnnualIncome'));
    const multiplier = parseFloat(form.getValues('multiplier'));
    
    if (isNaN(income) || isNaN(multiplier)) {
      toast({
        title: "Calculation Error",
        description: "Please ensure income and multiplier are valid numbers.",
        variant: "destructive"
      });
      return;
    }
    
    const valuationAmount = (income * multiplier).toFixed(2);
    setCalculatedValuation(valuationAmount);
    form.setValue('valuationAmount', valuationAmount);
  };
  
  // Auto-calculate weighted multiplier if not provided
  const handleCalculateWithDefaultMultiplier = () => {
    const weightedMultiplier = calculateWeightedMultiplier();
    form.setValue('multiplier', weightedMultiplier);
    calculateValuation();
  };
  
  // Form submission handler
  const handleSubmit = (values: ValuationFormValues) => {
    // Ensure valuation amount is calculated
    if (!calculatedValuation) {
      calculateValuation();
    }
    
    // Call the onSubmit callback with form values
    onSubmit(values);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{existingValuation ? 'Edit Valuation' : 'Create New Valuation'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Valuation Name</FormLabel>
                  <FormControl
</>

</>><>

                    <Input placeholder="e.g., Q1 2025 Valuation" {...field} />
                  </FormControl>
                  <FormDescription
</>

</>>
                    A descriptive name for this valuation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalAnnualIncome"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Total Annual Income</FormLabel>
                    <FormControl
</>

</>><>

                      <Input 
                        type="text" 
                        {...field} 
                        value={field.value !== '0.00' ? field.value : totalAnnualIncome}
                      />
                    </FormControl>
                    <FormDescription
</>

</>>
                      Calculated from your income sources
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="multiplier"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Income Multiplier</FormLabel>
                    <FormControl
</>

</>><>

                      <Input type="text" {...field} />
                    </FormControl>
                    <FormDescription
</>

</>>
                      Multiplier applied to your annual income
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCalculateWithDefaultMultiplier}
            >
              Calculate Valuation
            </Button>
            
            {calculatedValuation && (
              <div className="mt-6 p-4 bg-muted rounded-lg"><>

                <h3 className="text-lg font-medium">Valuation Amount</h3>
                <p
</>

className="text-3xl font-bold text-primary mt-2">
                  {formatCurrency(parseFloat(calculatedValuation))}
                </p>
              </div>
            )}
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="income-breakdown"><>

                <AccordionTrigger>Income Breakdown</AccordionTrigger>
                <AccordionContent
</>

</>>
                  <div className="space-y-2">
                    {Object.entries(annualIncomeBySource).map(([source, amount]) => (
                      <div key={source} className="flex justify-between py-1 border-b"><>

                        <span className="capitalize">{source}</span>
                        <span
</>

className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="multipliers"><>

                <AccordionTrigger>Income Source Multipliers</AccordionTrigger>
                <AccordionContent
</>

</>>
                  <div className="space-y-2">
                    {multipliers.map((multiplier) => (
                      <div key={multiplier.id} className="flex justify-between py-1 border-b"><>

                        <span className="capitalize">{multiplier.source}</span>
                        <span
</>

className="font-medium">{multiplier.multiplier}x</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="notes"><>

                <AccordionTrigger>Notes</AccordionTrigger>
                <AccordionContent
</>

</>>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><>

                          <Textarea 
                            placeholder="Add any notes or context about this valuation" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage
</>

/>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end gap-4"><>

              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button
</>

type="submit">
                Save Valuation
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}