import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, BarChart4, Calculator, ChartBar, ChevronsUpDown, DollarSign, Download, FileText, FileUp, Home, LayoutDashboard, PieChart, TrendingUp  } from '@mui/icons-material';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn, formatCurrency, formatPercentage } from '../lib/utils';
import VisualizationDashboard from '../components/pro-forma/VisualizationDashboard';
import ProFormaWorksheet, { ProFormaWorksheetRef } from '../components/pro-forma/ProFormaWorksheet';

// Define schema for the Pro Forma Calculator form
const proFormaSchema = z.object({
  propertyInfo: z.object({
    propertyType: z.string(),
    propertyAddress: z.string().min(1, "Address is required"),
    squareFootage: z.number().positive("Must be a positive number"),
    yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()),
    currentAssessment: z.number().nonnegative(),
    location: z.string().min(1, "Location is required")
  }),
  incomeProjections: z.object({
    rentalIncome: z.number().nonnegative(),
    rentalUnit: z.string(),
    vacancyRate: z.number().min(0).max(100),
    otherIncome: z.number().nonnegative(),
    otherIncomeSource: z.string().optional()
  }),
  expenseProjections: z.object({
    propertyTaxes: z.number().nonnegative(),
    insurance: z.number().nonnegative(),
    utilities: z.number().nonnegative(),
    maintenance: z.number().nonnegative(),
    managementFees: z.number().nonnegative(),
    replacementReserves: z.number().nonnegative(),
    otherExpenses: z.number().nonnegative()
  }),
  financing: z.object({
    purchasePrice: z.number().positive(),
    downPayment: z.number().min(0),
    loanAmount: z.number().nonnegative(),
    interestRate: z.number().min(0).max(30),
    loanTerm: z.number().int().positive(),
    monthlyPayment: z.number().nonnegative()
  })
});

type ProFormaFormValues = z.infer<typeof proFormaSchema>;

// Default values for the form
const defaultValues: ProFormaFormValues = {
  propertyInfo: {
    propertyType: "residential",
    propertyAddress: "",
    squareFootage: 0,
    yearBuilt: 2000,
    currentAssessment: 0,
    location: "South Richland"
  },
  incomeProjections: {
    rentalIncome: 0,
    rentalUnit: "monthly",
    vacancyRate: 5,
    otherIncome: 0,
    otherIncomeSource: ""
  },
  expenseProjections: {
    propertyTaxes: 0,
    insurance: 0,
    utilities: 0,
    maintenance: 0,
    managementFees: 0,
    replacementReserves: 0,
    otherExpenses: 0
  },
  financing: {
    purchasePrice: 0,
    downPayment: 0,
    loanAmount: 0,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyPayment: 0
  }
};

// Benton County locations for dropdown
const bentonCountyLocations = [
  "South Richland",
  "North Richland", 
  "West Richland",
  "East Kennewick",
  "West Kennewick", 
  "Downtown Kennewick",
  "East Pasco",
  "West Pasco",
  "Prosser",
  "Benton City"
];

// Property types for dropdown
const propertyTypes = [
  { value: "residential", label: "Single-Family Residential" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Vacant Land" }
];

// AI analysis result type
interface AIAnalysis {
  valuation: number;
  capRate: number;
  cashOnCash: number;
  roi: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  comparables: Array<{
    address: string;
    price: number;
    sqft: number;
    pricePerSqft: number;
  }>;
  insights: string[];
}

export default function ProFormaCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('calculator');
  const [isCalculating, setIsCalculating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [scenarios, setScenarios] = useState<Array<{ name: string, data: ProFormaFormValues, analysis: AIAnalysis | null }>>([]);
  // State for visualization and worksheet features
  const [showVisualization, setShowVisualization] = useState(false);
  const [showWorksheet, setShowWorksheet] = useState(false);
  
  // Ref for the ProFormaWorksheet component
  const worksheetRef = useRef<ProFormaWorksheetRef>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<ProFormaFormValues>({
    resolver: zodResolver(proFormaSchema),
    defaultValues,
    mode: "onChange"
  });
  
  // Watch form values to perform live calculations
  const formValues = form.watch();
  const purchasePrice = form.watch('financing.purchasePrice');
  const downPayment = form.watch('financing.downPayment');
  const interestRate = form.watch('financing.interestRate');
  const loanTerm = form.watch('financing.loanTerm');
  const rentalIncome = form.watch('incomeProjections.rentalIncome');
  const rentalUnit = form.watch('incomeProjections.rentalUnit');
  const vacancyRate = form.watch('incomeProjections.vacancyRate');
  const squareFootage = form.watch('propertyInfo.squareFootage');
  
  // Update derived values when form values change
  useEffect(() => {
    // Calculate loan amount based on purchase price and down payment
    const loanAmount = purchasePrice - downPayment;
    form.setValue('financing.loanAmount', loanAmount > 0 ? loanAmount : 0);
    
    // Calculate monthly payment (P&I)
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;
      const monthlyPayment = 
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      form.setValue('financing.monthlyPayment', Math.round(monthlyPayment * 100) / 100);
    } else {
      form.setValue('financing.monthlyPayment', 0);
    }
    
    // Set property taxes based on location and assessed value (simplified calculation)
    const assessment = form.watch('propertyInfo.currentAssessment');
    // Benton County tax rate is approximately 1.2% of assessed value
    const annualTaxes = assessment * 0.012;
    form.setValue('expenseProjections.propertyTaxes', Math.round(annualTaxes));
    
    // Calculate per square foot rental amount if we have both values
    if (squareFootage > 0 && rentalIncome > 0) {
      const annualRent = rentalUnit === 'monthly' ? rentalIncome * 12 : rentalIncome;
      // Could display this value somewhere if needed
      const perSqFtRent = annualRent / squareFootage;
    }
  }, [form, purchasePrice, downPayment, interestRate, loanTerm, rentalIncome, rentalUnit, squareFootage]);

  // Function to run AI analysis based on input data
  const runAnalysis = async () => {
    if (!form.formState.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before running analysis.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      // This would be an API call to a backend agent in a production environment
      // For now, we'll simulate the response with calculated values
      
      const data = form.getValues();
      
      // Calculate potential income
      const annualRentalIncome = data.incomeProjections.rentalUnit === 'monthly' 
        ? data.incomeProjections.rentalIncome * 12 
        : data.incomeProjections.rentalIncome;
      
      const effectiveIncome = annualRentalIncome * (1 - data.incomeProjections.vacancyRate / 100) + 
        data.incomeProjections.otherIncome;
      
      // Calculate operating expenses
      const totalExpenses = 
        data.expenseProjections.propertyTaxes +
        data.expenseProjections.insurance +
        data.expenseProjections.utilities +
        data.expenseProjections.maintenance +
        data.expenseProjections.managementFees +
        data.expenseProjections.replacementReserves +
        data.expenseProjections.otherExpenses;
      
      // Calculate NOI
      const netOperatingIncome = effectiveIncome - totalExpenses;
      
      // Calculate debt service
      const annualDebtService = data.financing.monthlyPayment * 12;
      
      // Calculate cash flow
      const cashFlow = netOperatingIncome - annualDebtService;
      
      // Calculate cap rate
      const capRate = netOperatingIncome / data.financing.purchasePrice * 100;
      
      // Calculate cash-on-cash return
      const cashOnCash = (cashFlow / data.financing.downPayment) * 100;
      
      // Simulated valuation using income approach (simplified)
      // Assuming market cap rate of 5.5% for Benton County
      const valuation = netOperatingIncome / 0.055;
      
      // Risk assessment
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (capRate > 7 && cashOnCash > 8) {
        riskLevel = 'low';
      } else if (capRate < 4 || cashOnCash < 3) {
        riskLevel = 'high';
      }
      
      // Generate recommendations based on analysis
      const recommendations = [];
      
      if (data.incomeProjections.vacancyRate > 7) {
        recommendations.push("Consider strategies to reduce vacancy rate, such as property upgrades or adjusting rental pricing.");
      }
      
      if (totalExpenses / effectiveIncome > 0.5) {
        recommendations.push("Operating expenses are high relative to income. Look for cost-saving opportunities.");
      }
      
      if (data.financing.interestRate > 5) {
        recommendations.push("Interest rate is above current Benton County averages. Refinancing might improve cash flow.");
      }
      
      if (cashOnCash < 5) {
        recommendations.push("Cash-on-cash return is below target. Consider negotiating purchase price or finding ways to increase income.");
      }
      
      // Generate insights
      const insights = [
        `Based on the income approach, the property's estimated value is ${formatCurrency(valuation)}.`,
        `The capitalization rate of ${capRate.toFixed(2)}% is ${
          capRate > 6 ? "above" : "below"
        } the Benton County average of 6.0%.`,
        `At the current vacancy rate of ${data.incomeProjections.vacancyRate}%, you can expect an annual cash flow of ${formatCurrency(cashFlow)}.`,
        `Your cash-on-cash return is ${cashOnCash.toFixed(2)}%, which is ${
          cashOnCash > 7 ? "favorable" : "below average"
        } for similar properties in ${data.propertyInfo.location}.`
      ];
      
      // Generate comparable properties
      const comparables = [
        {
          address: "123 Jadwin Ave, Richland",
          price: Math.round(valuation * 0.95),
          sqft: data.propertyInfo.squareFootage - 200,
          pricePerSqft: Math.round((valuation * 0.95) / (data.propertyInfo.squareFootage - 200))
        },
        {
          address: "456 Columbia Center Blvd, Kennewick",
          price: Math.round(valuation * 1.05),
          sqft: data.propertyInfo.squareFootage + 150,
          pricePerSqft: Math.round((valuation * 1.05) / (data.propertyInfo.squareFootage + 150))
        },
        {
          address: "789 Road 68, Pasco",
          price: Math.round(valuation * 0.98),
          sqft: data.propertyInfo.squareFootage + 50,
          pricePerSqft: Math.round((valuation * 0.98) / (data.propertyInfo.squareFootage + 50))
        }
      ];
      
      // Create the analysis result
      const analysisResult: AIAnalysis = {
        valuation,
        capRate,
        cashOnCash,
        roi: (netOperatingIncome / data.financing.purchasePrice) * 100,
        riskLevel,
        recommendations: recommendations.length > 0 ? recommendations : ["This appears to be a balanced investment opportunity."],
        comparables,
        insights
      };
      
      // In a real implementation, this would come from an API call
      // await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnalysis(analysisResult);
      setActiveTab('analysis');
      
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error running the analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Add current scenario to saved scenarios
  const saveScenario = () => {
    const scenarioName = `Scenario ${scenarios.length + 1}`;
    const newScenario = {
      name: scenarioName,
      data: form.getValues(),
      analysis: analysis
    };
    
    setScenarios([...scenarios, newScenario]);
    
    toast({
      title: "Scenario Saved",
      description: `"${scenarioName}" has been saved for comparison.`
    });
  };
  
  // Load a saved scenario
  const loadScenario = (index: number) => {
    const scenario = scenarios[index];
    form.reset(scenario.data);
    setAnalysis(scenario.analysis);
    
    toast({
      title: "Scenario Loaded",
      description: `"${scenario.name}" has been loaded.`
    });
  };
  
  // Reset the form to default values
  const resetForm = () => {
    form.reset(defaultValues);
    setAnalysis(null);
    setActiveTab('calculator');
    
    toast({
      title: "Form Reset",
      description: "All values have been reset to defaults."
    });
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div><>

            <h1 className="text-2xl font-bold text-primary-700">Pro Forma Calculator</h1>
            <p
</>

className="text-slate-600">Interactive property analysis for Benton County real estate</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              Reset
            </Button>
            {analysis && (
              <Button variant="outline" size="sm" onClick={saveScenario}>
                Save Scenario
              </Button>
            )}
          </div>
        </div>
        
        <ErrorBoundary>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!analysis}>
                <BarChart4 className="h-4 w-4" />
                <span>Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="visualization" className="flex items-center gap-2" disabled={!analysis}>
                <ChartBar className="h-4 w-4" />
                <span>Visualizations</span>
              </TabsTrigger>
              <TabsTrigger value="worksheet" className="flex items-center gap-2" disabled={!analysis}>
                <FileText className="h-4 w-4" />
                <span>Worksheet</span>
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex items-center gap-2" disabled={scenarios.length === 0}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Scenarios ({scenarios.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator">
              <Form {...form}>
                <form className="space-y-8">
                  {/* Property Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <Home className="h-5 w-5 text-primary-500" />
                        Property Information
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Enter the basic details about the property
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="propertyInfo.propertyType"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Property Type</FormLabel>
                              <Select
</>

onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select property type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {propertyTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="propertyInfo.location"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Location</FormLabel>
                              <Select
</>

onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bentonCountyLocations.map((location) => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="propertyInfo.propertyAddress"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Property Address</FormLabel>
                              <FormControl
</>

</>><>

                                <Input placeholder="123 Main St, Richland, WA" {...field} />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="propertyInfo.squareFootage"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Square Footage</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  type="number" 
                                  placeholder="2000" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="propertyInfo.yearBuilt"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Year Built</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  type="number" 
                                  placeholder="2000" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="propertyInfo.currentAssessment"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Current Assessment Value</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  type="number" 
                                  placeholder="300000" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                />
                              </FormControl>
                              <FormDescription
</>

</>>
                                Current tax assessment value in Benton County
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Income Projections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <TrendingUp className="h-5 w-5 text-primary-500" />
                        Income Projections
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Project the potential income for this property
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="incomeProjections.rentalIncome"
                            render={({ field }) => (
                              <FormItem className="col-span-1"><>

                                <FormLabel>Rental Income</FormLabel>
                                <FormControl
</>

</>>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500"><>

                                      <DollarSign className="h-4 w-4" />
                                    </span>
                                    <Input
</>

                                      type="number" 
                                      placeholder="2000" 
                                      className="pl-10"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="incomeProjections.rentalUnit"
                            render={({ field }) => (
                              <FormItem className="col-span-1"><>

                                <FormLabel>Period</FormLabel>
                                <Select
</>

onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent><>

                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem
</>

value="annual">Annual</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="incomeProjections.vacancyRate"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Vacancy Rate (%)</FormLabel>
                              <div
</>

className="flex items-center gap-4">
                                <FormControl><>

                                  <Slider
                                    defaultValue={[field.value]}
                                    max={20}
                                    step={0.5}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <span
</>

className="w-12 text-right">{field.value}%</span>
                              </div><>

                              <FormDescription>
                                Average vacancy rate in Benton County is 5-7%
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="incomeProjections.otherIncome"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Other Income (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="1000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Laundry, parking, storage, etc.
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="incomeProjections.otherIncomeSource"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Other Income Source</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  placeholder="Laundry, parking, etc."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Expense Projections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <PieChart className="h-5 w-5 text-primary-500" />
                        Expense Projections
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Estimate annual operating expenses for the property
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="expenseProjections.propertyTaxes"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Property Taxes (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="4000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Calculated based on assessment and Benton County rates
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.insurance"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Insurance (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="1200" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.utilities"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Utilities (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="2400" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Owner-paid utilities only
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.maintenance"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Maintenance (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="2000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.managementFees"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Management Fees (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="1800" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Typically 8-10% of rental income in Benton County
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.replacementReserves"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Replacement Reserves (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="1200" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Savings for major repairs and replacements
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expenseProjections.otherExpenses"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Other Expenses (Annual)</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="1000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Financing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <DollarSign className="h-5 w-5 text-primary-500" />
                        Financing
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Enter purchase and financing details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="financing.purchasePrice"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Purchase Price</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="350000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financing.downPayment"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Down Payment</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="70000" 
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                {purchasePrice > 0 && downPayment > 0 ? 
                                  `${((downPayment / purchasePrice) * 100).toFixed(1)}% of purchase price` : 
                                  "Typically 20-25% for investment properties"}
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financing.loanAmount"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Loan Amount</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    placeholder="280000" 
                                    className="pl-10"
                                    disabled
                                    {...field}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Calculated as Purchase Price - Down Payment
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financing.interestRate"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Interest Rate (%)</FormLabel>
                              <div
</>

className="flex items-center gap-4">
                                <FormControl><>

                                  <Slider
                                    defaultValue={[field.value]}
                                    min={2}
                                    max={10}
                                    step={0.125}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <span
</>

className="w-12 text-right">{field.value}%</span>
                              </div><>

                              <FormDescription>
                                Current average rate in Benton County is 4.5-5.5%
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financing.loanTerm"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Loan Term (Years)</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  type="number" 
                                  placeholder="30" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financing.monthlyPayment"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Monthly Mortgage Payment</FormLabel>
                              <FormControl
</>

</>>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500"><>

                                    <DollarSign className="h-4 w-4" />
                                  </span>
                                  <Input
</>

                                    type="number" 
                                    className="pl-10"
                                    disabled
                                    {...field}
                                  />
                                </div>
                              </FormControl><>

                              <FormDescription>
                                Principal and interest only
                              </FormDescription>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="mt-8 flex justify-center">
                    <Button 
                      type="button" 
                      onClick={runAnalysis} 
                      disabled={isCalculating} 
                      className="px-8"
                      size="lg"
                    >
                      {isCalculating ? (
                        <>Calculating...<div ) : (
                        <>Run AI Analysis<div )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="analysis">
              {analysis && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <FileText className="h-5 w-5 text-primary-500" />
                        Property Valuation Summary
                      </CardTitle>
                      <CardDescription
</>

</>>
                        AI-powered analysis based on your inputs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <div><>

                            <h3 className="text-lg font-semibold text-primary-700">Property Value</h3>
                            <div
</>

className="mt-1 text-3xl font-bold text-slate-800">
                              {formatCurrency(analysis.valuation)}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Based on income approach calculation
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div><>

                              <h4 className="text-sm font-medium text-slate-600">Cap Rate</h4>
                              <div
</>

className="mt-1 text-xl font-semibold text-slate-800">
                                {analysis.capRate.toFixed(2)}%
                              </div>
                            </div>
                            <div><>

                              <h4 className="text-sm font-medium text-slate-600">Cash on Cash</h4>
                              <div
</>

className="mt-1 text-xl font-semibold text-slate-800">
                                {analysis.cashOnCash.toFixed(2)}%
                              </div>
                            </div>
                            <div><>

                              <h4 className="text-sm font-medium text-slate-600">ROI</h4>
                              <div
</>

className="mt-1 text-xl font-semibold text-slate-800">
                                {analysis.roi.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          
                          <div><>

                            <h3 className="text-sm font-semibold text-slate-700">Risk Assessment</h3>
                            <div
</>

className="mt-2 flex items-center">
                              <div 
                                className={`h-3 w-3 rounded-full mr-2 ${
                                  analysis.riskLevel === 'low' 
                                    ? 'bg-emerald-500' 
                                    : analysis.riskLevel === 'medium' 
                                      ? 'bg-amber-500' 
                                      : 'bg-rose-500'
                                }`} 
                              />
                              <span className="text-sm capitalize">{analysis.riskLevel} Risk</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-6 md:pt-0"><>

                          <h3 className="text-sm font-semibold text-slate-700 mb-3">AI Insights</h3>
                          <ul
</>

className="space-y-2">
                            {analysis.insights.map((insight, i) => (
                              <li key={i} className="text-sm text-slate-600">{insight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-0.5 bg-primary-100 p-1 rounded-full"><>

                                <AlertCircle className="h-4 w-4 text-primary-600" />
                              </div>
                              <span
</>

className="text-sm text-slate-600">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Comparable Properties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200"><>

                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Property</th>
                                <th
</>

className="text-right py-2 px-3 text-sm font-medium text-slate-600">Price</th><>

                                <th className="text-right py-2 px-3 text-sm font-medium text-slate-600">Size</th>
                                <th
</>

className="text-right py-2 px-3 text-sm font-medium text-slate-600">$/Sq.Ft</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysis.comparables.map((comp, i) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50"><>

                                  <td className="py-2 px-3 text-sm text-slate-700">{comp.address}</td>
                                  <td
</>

className="py-2 px-3 text-sm text-right text-slate-700">{formatCurrency(comp.price)}</td><>

                                  <td className="py-2 px-3 text-sm text-right text-slate-700">{comp.sqft.toLocaleString()}</td>
                                  <td
</>

className="py-2 px-3 text-sm text-right text-slate-700">${comp.pricePerSqft}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8 flex justify-center gap-4"><>

                    <Button variant="outline" onClick={() => setActiveTab('calculator')}>
                      Back to Calculator
                    </Button>
                    <Button
</>

onClick={saveScenario}>
                      Save this Scenario
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="visualization">
              {analysis && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <PieChart className="h-5 w-5 text-primary-500" />
                        Property Valuation Visualizations
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Interactive charts and visualizations for your property analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Wrap the VisualizationDashboard with error boundary in case of rendering issues */}
                      <ErrorBoundary>
                        <div className="border rounded-lg p-4">
                          <div className="mb-4"><>

                            <h3 className="text-lg font-semibold">Visualization Dashboard</h3>
                            <p
</>

className="text-sm text-muted-foreground">Interactive data visualizations for Benton County property</p>
                          </div>

                          {/* Pass the analysis data to the visualization component */}
                          <VisualizationDashboard 
                            formData={form.getValues()}
                            calculatedMetrics={{
                              effectiveGrossIncome: (form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome,
                              operatingExpenses: form.getValues().expenseProjections.propertyTaxes +
                                form.getValues().expenseProjections.insurance +
                                form.getValues().expenseProjections.utilities +
                                form.getValues().expenseProjections.maintenance +
                                form.getValues().expenseProjections.managementFees +
                                form.getValues().expenseProjections.replacementReserves +
                                form.getValues().expenseProjections.otherExpenses,
                              netOperatingIncome: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) - 
                              (form.getValues().expenseProjections.propertyTaxes +
                              form.getValues().expenseProjections.insurance +
                              form.getValues().expenseProjections.utilities +
                              form.getValues().expenseProjections.maintenance +
                              form.getValues().expenseProjections.managementFees +
                              form.getValues().expenseProjections.replacementReserves +
                              form.getValues().expenseProjections.otherExpenses),
                              annualDebtService: form.getValues().financing.monthlyPayment * 12,
                              cashFlow: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) - 
                              (form.getValues().expenseProjections.propertyTaxes +
                              form.getValues().expenseProjections.insurance +
                              form.getValues().expenseProjections.utilities +
                              form.getValues().expenseProjections.maintenance +
                              form.getValues().expenseProjections.managementFees +
                              form.getValues().expenseProjections.replacementReserves +
                              form.getValues().expenseProjections.otherExpenses) -
                              (form.getValues().financing.monthlyPayment * 12),
                              capRate: analysis.capRate,
                              cashOnCash: analysis.cashOnCash,
                              roi: analysis.roi,
                              vacancyLoss: (form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (form.getValues().incomeProjections.vacancyRate / 100),
                              operatingExpenseRatio: ((form.getValues().expenseProjections.propertyTaxes +
                                form.getValues().expenseProjections.insurance +
                                form.getValues().expenseProjections.utilities +
                                form.getValues().expenseProjections.maintenance +
                                form.getValues().expenseProjections.managementFees +
                                form.getValues().expenseProjections.replacementReserves +
                                form.getValues().expenseProjections.otherExpenses) /
                                ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome)) * 100,
                              dscr: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) /
                                (form.getValues().financing.monthlyPayment * 12),
                              totalReturnFiveYears: analysis.roi * 5,
                              totalReturnTenYears: analysis.roi * 10
                            }}
                            applyAssumptions={() => {}}
                          />
                        </div>
                      </ErrorBoundary>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="worksheet">
              {analysis && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><>

                        <FileText className="h-5 w-5 text-primary-500" />
                        Pro Forma Worksheet
                      </CardTitle>
                      <CardDescription
</>

</>>
                        Comprehensive financial worksheet with exportable data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ErrorBoundary>
                        <div className="border rounded-lg p-4">
                          <div className="mb-4 flex justify-between items-center">
                            <div><>

                              <h3 className="text-lg font-semibold">Valuation Worksheet</h3>
                              <p
</>

className="text-sm text-muted-foreground">Download or print your property analysis</p>
                            </div>
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-2"
                              onClick={() => {
                                // Use the ref to call the PDF export function
                                if (worksheetRef.current) {
                                  worksheetRef.current.downloadPDF();
                                  toast({
                                    title: "Exporting PDF",
                                    description: "Your Valuation Worksheet is being generated as a PDF.",
                                  });
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                              <span>Export PDF</span>
                            </Button>
                          </div>
                          
                          <ProFormaWorksheet 
                            ref={worksheetRef}
                            formData={form.getValues()}
                            calculatedMetrics={{
                              effectiveGrossIncome: (form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome,
                              operatingExpenses: form.getValues().expenseProjections.propertyTaxes +
                                form.getValues().expenseProjections.insurance +
                                form.getValues().expenseProjections.utilities +
                                form.getValues().expenseProjections.maintenance +
                                form.getValues().expenseProjections.managementFees +
                                form.getValues().expenseProjections.replacementReserves +
                                form.getValues().expenseProjections.otherExpenses,
                              netOperatingIncome: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) - 
                              (form.getValues().expenseProjections.propertyTaxes +
                              form.getValues().expenseProjections.insurance +
                              form.getValues().expenseProjections.utilities +
                              form.getValues().expenseProjections.maintenance +
                              form.getValues().expenseProjections.managementFees +
                              form.getValues().expenseProjections.replacementReserves +
                              form.getValues().expenseProjections.otherExpenses),
                              annualDebtService: form.getValues().financing.monthlyPayment * 12,
                              cashFlow: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) - 
                              (form.getValues().expenseProjections.propertyTaxes +
                              form.getValues().expenseProjections.insurance +
                              form.getValues().expenseProjections.utilities +
                              form.getValues().expenseProjections.maintenance +
                              form.getValues().expenseProjections.managementFees +
                              form.getValues().expenseProjections.replacementReserves +
                              form.getValues().expenseProjections.otherExpenses) -
                              (form.getValues().financing.monthlyPayment * 12),
                              capRate: analysis.capRate,
                              cashOnCash: analysis.cashOnCash,
                              roi: analysis.roi,
                              vacancyLoss: (form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (form.getValues().incomeProjections.vacancyRate / 100),
                              operatingExpenseRatio: ((form.getValues().expenseProjections.propertyTaxes +
                                form.getValues().expenseProjections.insurance +
                                form.getValues().expenseProjections.utilities +
                                form.getValues().expenseProjections.maintenance +
                                form.getValues().expenseProjections.managementFees +
                                form.getValues().expenseProjections.replacementReserves +
                                form.getValues().expenseProjections.otherExpenses) /
                                ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome)) * 100,
                              dscr: ((form.getValues().incomeProjections.rentalUnit === 'monthly' 
                                ? form.getValues().incomeProjections.rentalIncome * 12 
                                : form.getValues().incomeProjections.rentalIncome) * 
                                (1 - form.getValues().incomeProjections.vacancyRate / 100) + 
                                form.getValues().incomeProjections.otherIncome) /
                                (form.getValues().financing.monthlyPayment * 12),
                              totalReturnFiveYears: analysis.roi * 5,
                              totalReturnTenYears: analysis.roi * 10
                            }}
                            appreciationRate={3.0}
                            rentGrowthRate={2.5}
                          />
                        </div>
                      </ErrorBoundary>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="scenarios">
              <div className="space-y-6">
                <Card>
                  <CardHeader><>

                    <CardTitle>Saved Scenarios</CardTitle>
                    <CardDescription
</>

</>>
                      Compare different investment options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200"><>

                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Scenario</th>
                            <th
</>

className="text-left py-3 px-4 text-sm font-medium text-slate-600">Property</th><>

                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Purchase Price</th>
                            <th
</>

className="text-right py-3 px-4 text-sm font-medium text-slate-600">Valuation</th><>

                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Cap Rate</th>
                            <th
</>

className="text-right py-3 px-4 text-sm font-medium text-slate-600">Cash on Cash</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios.map((scenario /* , index */) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50"><>

                              <td className="py-3 px-4 text-sm font-medium text-slate-700">{scenario.name}</td>
                              <td
</>

className="py-3 px-4 text-sm text-slate-700">
                                {scenario.data.propertyInfo.propertyAddress || 
                                 `${scenario.data.propertyInfo.location} Property`}
                              </td><>

                              <td className="py-3 px-4 text-sm text-right text-slate-700">
                                {formatCurrency(scenario.data.financing.purchasePrice)}
                              </td>
                              <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">
                                {scenario.analysis ? formatCurrency(scenario.analysis.valuation) : "N/A"}
                              </td><>

                              <td className="py-3 px-4 text-sm text-right text-slate-700">
                                {scenario.analysis ? `${scenario.analysis.capRate.toFixed(2)}%` : "N/A"}
                              </td>
                              <td
</>

className="py-3 px-4 text-sm text-right text-slate-700">
                                {scenario.analysis ? `${scenario.analysis.cashOnCash.toFixed(2)}%` : "N/A"}
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary-600 hover:text-primary-700"
                                  onClick={() => loadScenario(index)}
                                >
                                  Load
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
}