import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertIncomeSchema, insertValuationSchema, Income } from "@shared/schema";
import { Plus, Trash2, Info, Check, ArrowRight, AlertCircle, Loader2  } from '@mui/icons-material';
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/components/ui/api-error";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServerError from "@/pages/ServerError";

// Extend the income schema
const incomeFormSchema = z.object({
  incomes: z.array(
    z.object({
      source: z.enum(["salary", "business", "freelance", "investment", "rental", "other"]),
      amount: z.string().min(1, "Amount is required").refine(
        val => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        { message: "Amount must be a positive number" }
      ),
      frequency: z.enum(["monthly", "yearly", "quarterly", "weekly"]),
      description: z.string().optional(),
    })
  ).min(1, "At least one income source is required"),
  notes: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

const defaultIncome = {
  source: "salary" as const,
  amount: "",
  frequency: "monthly" as const,
  description: "",
};

const getSourceMultiplier = (source: string): number => {
  // Different multipliers for different income types
  switch (source) {
    case "salary": return 0.8;
    case "business": return 3.5;
    case "freelance": return 2.0;
    case "investment": return 15.0;
    case "rental": return 10.0;
    case "other": return 1.0;
    default: return 1.0;
  }
};

const frequencyMultiplier = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export default function ValuationForm() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/valuation/new');
  const [editMatch, editParams] = useRoute('/valuation/edit/:id');
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setCurrentStep, hasCompletedOnboarding } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [multiplierFetchError, setMultiplierFetchError] = useState<Error | null>(null);
  
  // Extract query parameters for editing
  const queryParams = new URLSearchParams(window.location.search);
  const editIncomeId = queryParams.get('edit');
  
  // Fetch income multipliers from API
  const { 
    data: multipliers, 
    isLoading: multipliersLoading, 
    isError: isMultipliersError,
    error: multipliersError,
    refetch: refetchMultipliers
  } = useQuery({
    queryKey: ['/api/multipliers'],
    retry: 2,
  });
  
  // Fetch existing income if editing
  const { 
    data: existingIncome, 
    isLoading: incomeLoading,
    isError: isIncomeError,
    error: incomeError
  } = useQuery<Income, Error>({
    queryKey: [`/api/incomes/${editIncomeId}`],
    enabled: !!editIncomeId && !!user,
  });

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      incomes: [defaultIncome],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "incomes",
  });
  
  // Update form with existing income data if editing
  useEffect(() => {
    if (existingIncome && !incomeLoading && editIncomeId) {
      // Pre-fill form with existing income data, ensuring frequency is the correct type
      const formattedIncome = {
        source: existingIncome.source,
        amount: existingIncome.amount.toString(),
        frequency: existingIncome.frequency as "monthly" | "yearly" | "quarterly" | "weekly",
        description: existingIncome.description || "",
      };
      
      form.reset({
        incomes: [formattedIncome],
        notes: "",
      });
    }
  }, [existingIncome, incomeLoading, form, editIncomeId]);
  
  // Handle multiplier fetch error
  useEffect(() => {
    if (isMultipliersError && multipliersError) {
      setMultiplierFetchError(multipliersError);
    } else {
      setMultiplierFetchError(null);
    }
  }, [isMultipliersError, multipliersError]);
  
  // Trigger income entry onboarding step when form is loaded (if not editing)
  useEffect(() => {
    if (!editIncomeId && !authLoading && isAuthenticated && !incomeLoading) {
      // Use a small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        setCurrentStep('income-entry');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [editIncomeId, authLoading, isAuthenticated, incomeLoading, setCurrentStep]);

  const onSubmit = async (data: IncomeFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a valuation",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Calculate total annual income and valuation
      let totalAnnualIncome = 0;
      let weightedMultiplier = 0;
      let totalWeightedIncome = 0;
      const createdIncomeIds: number[] = [];
      
      // Create all income sources
      for (const income of data.incomes) {
        const amount = parseFloat(income.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Invalid amount: ${income.amount} for ${income.source} income`);
        }
        
        const annualAmount = amount * frequencyMultiplier[income.frequency];
        totalAnnualIncome += annualAmount;
        
        // Calculate weighted multiplier
        const sourceMultiplier = getSourceMultiplier(income.source);
        weightedMultiplier += (annualAmount * sourceMultiplier);
        totalWeightedIncome += annualAmount;
        
        try {
          // Save income to database
          const incomeResponse = await apiRequest("POST", "/api/incomes", {
            body: JSON.stringify({
              userId: user.id,
              source: income.source,
              amount: amount,
              frequency: income.frequency,
              description: income.description || null,
            })
          });
          
          if (incomeResponse && incomeResponse.id) {
            createdIncomeIds.push(incomeResponse.id);
          }
        } catch (error: any) {
          console.error("Error creating income:", error);
          setFormError(`Failed to save income source (${income.source}): ${error.message || "Unknown error"}`);
          
          // Clean up any incomes that were created before the error
          if (createdIncomeIds.length > 0) {
            try {
              // Attempt to delete any incomes that were created before the error
              await Promise.all(createdIncomeIds.map(id => 
                apiRequest("DELETE", `/api/incomes/${id}`, {})
              ));
            } catch (cleanupError) {
              console.error("Error cleaning up incomes after failure:", cleanupError);
            }
          }
          
          setIsSubmitting(false);
          return;
        }
      }
      
      // Calculate final weighted multiplier
      const finalMultiplier = totalWeightedIncome > 0 
        ? weightedMultiplier / totalWeightedIncome 
        : 1.0;
      
      // Calculate valuation amount
      const valuationAmount = totalAnnualIncome * finalMultiplier;
      
      try {
        // Create valuation
        const valuationResponse = await apiRequest("POST", "/api/valuations", {
          body: JSON.stringify({
            userId: user.id,
            totalAnnualIncome,
            multiplier: finalMultiplier,
            valuationAmount,
            notes: data.notes || null,
          })
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/incomes`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/valuations`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });

        toast({
          title: "Valuation Created",
          description: "Your income valuation has been calculated successfully",
        });
        
        // Redirect to the valuation result page
        setLocation(`/valuation/${valuationResponse.id}`);
      } catch (error: any) {
        console.error("Error creating valuation:", error);
        setFormError(`Failed to create valuation: ${error.message || "Unknown error"}`);
        
        // Don't clean up incomes here - they're still valid even if valuation failed
      }
    } catch (error: any) {
      console.error("Error in valuation process:", error);
      setFormError(`Valuation calculation error: ${error.message || "An unknown error occurred"}`);
      
      toast({
        title: "Error",
        description: "There was an error creating your valuation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not authenticated and auth loading is complete, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a valuation",
      });
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show server error for critical failures
  if (isMultipliersError && multiplierFetchError?.message.includes('500')) {
    return <ServerError 
      message="We encountered an error loading income multipliers. Our team has been notified."
      actionLink="/"
      actionText="Return to Home"
    />;
  }

  return (
    <div className="bg-slate-50 py-8">
      <ErrorBoundary>
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-800 mb-6">
            {editIncomeId ? "Edit Income Source" : "Create New Valuation"}
          </h1>
          
          {formError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" /><>

              <AlertTitle>Error</AlertTitle>
              <AlertDescription
</>

</>>{formError}</AlertDescription>
            </Alert>
          )}
          
          {isMultipliersError && (
            <div className="mb-6">
              <ApiError
                title="Error Loading Multipliers"
                message="We couldn't load the income valuation multipliers. This may affect your valuation calculation."
                error={multiplierFetchError}
                onRetry={() => refetchMultipliers()}
              />
            </div>
          )}
          
          {isIncomeError && editIncomeId && (
            <div className="mb-6">
              <ApiError
                title="Error Loading Income Data"
                message="We couldn't load the income data you're trying to edit."
                error={incomeError}
                onRetry={() => queryClient.invalidateQueries({ queryKey: [`/api/incomes/${editIncomeId}`] })}
              />
            </div>
          )}
          
          <Card>
            <CardHeader><>

              <CardTitle className="text-xl text-primary-700">Income Sources</CardTitle>
              <CardDescription
</>

</>>
                Add all your income sources to get an accurate valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-6">
                    {fields.map((field /* , index */) => (
                      <div key={field.id} className="p-4 border border-slate-200 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-slate-800">Income Source {index + 1}</h3>
                          {index > 0 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`incomes.${index}.source`}
                            render={({ field }) => (
                              <FormItem><>

                                <FormLabel>Income Type</FormLabel>
                                <Select
</>

                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={isSubmitting}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select income type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent><>

                                    <SelectItem value="salary">Salary</SelectItem>
                                    <SelectItem
</>

value="business">Business</SelectItem><>

                                    <SelectItem value="freelance">Freelance</SelectItem>
                                    <SelectItem
</>

value="investment">Investment</SelectItem><>

                                    <SelectItem value="rental">Rental</SelectItem>
                                    <SelectItem
</>

value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription className="flex items-center gap-1 text-xs">
                                  <Info className="h-3 w-3" />
                                  {field.value && (
                                      {field.value} multiplier: 
                                      <span className="font-medium">{getSourceMultiplier(field.value)}x</span>
                                  )}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`incomes.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem><>

                                <FormLabel>Frequency</FormLabel>
                                <Select
</>

                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={isSubmitting}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent><>

                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem
</>

value="monthly">Monthly</SelectItem><>

                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem
</>

value="yearly">Yearly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`incomes.${index}.amount`}
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Amount ($)</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription
</>

className="text-xs">
                                {field.value && !isNaN(parseFloat(field.value)) && 
                                  `Annual value: $${new Intl.NumberFormat('en-US').format(
                                    parseFloat(field.value) * frequencyMultiplier[form.getValues(`incomes.${index}.frequency`)]
                                  )}`
                                }
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`incomes.${index}.description`}
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl
</>

</>><>

                                <Input 
                                  placeholder="E.g., Salary from ABC Inc." 
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage
</>

/>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append(defaultIncome)}
                      className="mt-2"
                      disabled={isSubmitting}
                    ><>

                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Income Source
                    </Button>
                    
                    <FormField
</>

                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl
</>

</>><>

                            <Textarea 
                              placeholder="Add any additional notes about this valuation" 
                              className="min-h-[100px]" 
                              disabled={isSubmitting}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage
</>

/>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-8 flex justify-between items-center"><>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    
                    <Button
</>

                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Calculating...
                        </div>
                      ) : (
                          Calculate Valuation
                          <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
}