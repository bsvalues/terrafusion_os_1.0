import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowRight, CalculatorIcon, Plus, Trash2  } from '@mui/icons-material';
import { useLocation } from "wouter";

// Income types and their descriptions
const incomeTypes = [
  { value: "salary", label: "Salary", description: "Regular employment income" },
  { value: "business", label: "Business", description: "Income from business ownership" },
  { value: "freelance", label: "Freelance", description: "Independent contractor work" },
  { value: "investment", label: "Investment", description: "Returns from investments" },
  { value: "rental", label: "Rental", description: "Income from property rentals" },
  { value: "other", label: "Other", description: "Other income sources" }
];

// Frequency options
const frequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "yearly", label: "Yearly" }
];

// Income item interface
interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  frequency: string;
  description: string;
}

// Initial empty income item
const emptyIncomeItem = {
  id: "",
  source: "salary",
  amount: 0,
  frequency: "monthly",
  description: ""
};

export default function Calculator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { setCurrentStep } = useOnboarding();
  const [, setLocation] = useLocation();
  
  // State for income items
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([
    { ...emptyIncomeItem, id: crypto.randomUUID() }
  ]);
  
  // State for valuation name and notes
  const [valuationName, setValuationName] = useState("My Valuation");
  const [valuationNotes, setValuationNotes] = useState("");
  
  // Fetch income multipliers from the API
  const { data: multipliers, isLoading: isLoadingMultipliers } = useQuery({
    queryKey: ['/api/multipliers'],
    queryFn: () => apiRequest("GET", "/api/multipliers")
      .then(data => {
        // Create a map of source to multiplier for easier lookup
        const multiplierMap: Record<string, number> = {};
        data.forEach((m: any) => {
          multiplierMap[m.source] = parseFloat(m.multiplier);
        });
        return multiplierMap;
      }),
    enabled: !!user
  });
  
  // Fallback multipliers if API call fails
  const defaultMultipliers: Record<string, number> = {
    salary: 2.5,
    business: 3.5,
    freelance: 2.0,
    investment: 4.0,
    rental: 5.0,
    other: 1.5
  };
  
  // Calculate the annual amount based on frequency
  const calculateAnnualAmount = (amount: number, frequency: string): number => {
    switch (frequency) {
      case "weekly":
        return amount * 52;
      case "biweekly":
        return amount * 26;
      case "monthly":
        return amount * 12;
      case "yearly":
        return amount;
      default:
        return amount * 12; // Default to monthly
    }
  };
  
  // Calculate valuation for each income source and the total
  const calculateValuation = () => {
    const breakdown = incomeItems.map(item => {
      const annualAmount = calculateAnnualAmount(item.amount, item.frequency);
      const multiplier = (multipliers && multipliers[item.source]) || defaultMultipliers[item.source] || 2.5;
      const valuation = annualAmount * multiplier;
      
      return {
        source: item.source,
        annualAmount,
        multiplier,
        valuation
      };
    });
    
    const totalAnnualIncome = breakdown.reduce((sum, item) => sum + item.annualAmount, 0);
    const totalValuation = breakdown.reduce((sum, item) => sum + item.valuation, 0);
    const weightedMultiplier = totalAnnualIncome > 0 ? totalValuation / totalAnnualIncome : 0;
    
    return {
      breakdown,
      totalAnnualIncome,
      weightedMultiplier,
      totalValuation
    };
  };
  
  // Calculate the valuation whenever income items change
  const valuation = calculateValuation();
  
  // Trigger calculator onboarding step when component is loaded
  useEffect(() => {
    // Use a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      setCurrentStep('calculator-intro');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [setCurrentStep]);
  
  // Add a new income item
  const addIncomeItem = () => {
    setIncomeItems([...incomeItems, { ...emptyIncomeItem, id: crypto.randomUUID() }]);
  };
  
  // Remove an income item
  const removeIncomeItem = (idToRemove: string) => {
    if (incomeItems.length > 1) {
      setIncomeItems(incomeItems.filter(item => item.id !== idToRemove));
    } else {
      toast({
        title: "Cannot remove",
        description: "You need at least one income source",
        variant: "destructive"
      });
    }
  };
  
  // Update an income item
  const updateIncomeItem = (id: string, field: keyof IncomeItem, value: any) => {
    setIncomeItems(incomeItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  // Save valuation mutation
  const saveValuationMutation = useMutation({
    mutationFn: async () => {
      const calculationResult = calculateValuation();
      
      const valuationData = {
        userId: user?.id,
        name: valuationName,
        totalAnnualIncome: calculationResult.totalAnnualIncome.toFixed(2),
        multiplier: calculationResult.weightedMultiplier.toFixed(2),
        valuationAmount: calculationResult.totalValuation.toFixed(2),
        incomeBreakdown: JSON.stringify(calculationResult.breakdown),
        notes: valuationNotes,
        isActive: true
      };
      
      return apiRequest("POST", "/api/valuations", {
        body: JSON.stringify(valuationData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Valuation saved",
        description: "Your valuation has been saved successfully"
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/valuations`] });
      
      // Navigate to the valuation result page
      setLocation(`/valuation/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the valuation",
        variant: "destructive"
      });
    }
  });
  
  // Handler for saving the valuation
  const handleSaveValuation = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to save a valuation",
        variant: "destructive"
      });
      return;
    }
    
    if (incomeItems.some(item => !item.amount)) {
      toast({
        title: "Invalid data",
        description: "All income amounts must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    saveValuationMutation.mutate();
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div><>

            <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Interactive Valuation Calculator</h1>
            <p
</>

className="text-slate-600 mt-1">Add your income sources and see your valuation in real-time</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Income inputs */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><>

                <CardTitle className="text-xl text-primary-700">Income Sources</CardTitle>
                <CardDescription
</>

</>>Add all your income sources to calculate your valuation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {incomeItems.map((item /* , index */) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-primary-800">Income Source #{index + 1}</h3>
                      {incomeItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIncomeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2"><>

                        <Label htmlFor={`source-${item.id}`}>Income Type</Label>
                        <Select
</>

                          value={item.source}
                          onValueChange={(value) => updateIncomeItem(item.id, 'source', value)}
                        >
                          <SelectTrigger id={`source-${item.id}`}><>

                            <SelectValue placeholder="Select income type" />
                          </SelectTrigger>
                          <SelectContent
</>

</>>
                            {incomeTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          {incomeTypes.find(t => t.value === item.source)?.description}
                        </p>
                      </div>
                      
                      <div className="space-y-2"><>

                        <Label htmlFor={`frequency-${item.id}`}>Frequency</Label>
                        <Select
</>

                          value={item.frequency}
                          onValueChange={(value) => updateIncomeItem(item.id, 'frequency', value)}
                        >
                          <SelectTrigger id={`frequency-${item.id}`}><>

                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent
</>

</>>
                            {frequencyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4"><>

                      <Label htmlFor={`amount-${item.id}`}>Amount</Label>
                      <div
</>

className="relative"><>

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input
</>

                          id={`amount-${item.id}`}
                          type="number"
                          min="0"
                          step="100"
                          value={item.amount || ''}
                          onChange={(e) => updateIncomeItem(item.id, 'amount', Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2"><>

                      <Label htmlFor={`description-${item.id}`}>Description (Optional)</Label>
                      <Input
</>

                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(e) => updateIncomeItem(item.id, 'description', e.target.value)}
                        placeholder="E.g., Software Engineer salary, Real estate rental"
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addIncomeItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Income Source
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><>

                <CardTitle className="text-xl text-primary-700">Valuation Details</CardTitle>
                <CardDescription
</>

</>>Name and describe your valuation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="valuation-name">Valuation Name</Label>
                  <Input
</>

                    id="valuation-name"
                    value={valuationName}
                    onChange={(e) => setValuationName(e.target.value)}
                    placeholder="E.g., 2025 Financial Valuation"
                  />
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="valuation-notes">Notes (Optional)</Label>
                  <Textarea
</>

                    id="valuation-notes"
                    value={valuationNotes}
                    onChange={(e) => setValuationNotes(e.target.value)}
                    placeholder="Add any additional notes or context for this valuation"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Results */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="bg-primary-50 rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                  <CalculatorIcon className="h-5 w-5 text-primary-600" />
                  <span className="text-xs font-medium text-primary-600 bg-white px-2 py-1 rounded-full">
                    Live Preview
                  </span>
                </div><>

                <CardTitle className="text-xl text-primary-800">Valuation Result</CardTitle>
                <CardDescription
</>

</>>Real-time calculation based on your inputs</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  <div className="bg-primary-50 p-4 rounded-lg text-center"><>

                    <p className="text-sm text-primary-700 mb-1">Your Estimated Valuation</p>
                    <h3
</>

className="text-3xl font-bold text-primary-800">
                      {formatCurrency(valuation.totalValuation)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Based on a {valuation.weightedMultiplier.toFixed(2)}x multiplier
                    </p>
                  </div>
                  
                  <div><>

                    <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                    <div
</>

className="space-y-3">
                      <div className="flex justify-between items-center text-sm"><>

                        <span className="text-slate-600">Total Annual Income:</span>
                        <span
</>

className="font-medium">{formatCurrency(valuation.totalAnnualIncome)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm"><>

                        <span className="text-slate-600">Weighted Multiplier:</span>
                        <span
</>

className="font-medium">{valuation.weightedMultiplier.toFixed(2)}x</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm font-medium"><>

                        <span className="text-primary-700">Total Valuation:</span>
                        <span
</>

className="text-primary-700">{formatCurrency(valuation.totalValuation)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div><>

                    <h4 className="text-sm font-medium text-slate-700 mb-2">Income Breakdown</h4>
                    <div
</>

className="space-y-4">
                      {valuation.breakdown.map((item /* , index */) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1"><>

                            <span className="text-sm font-medium text-slate-800 capitalize">
                              {item.source}
                            </span>
                            <span
</>

className="text-sm text-primary-700 font-medium">
                              {formatCurrency(item.valuation)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex justify-between"><>

                            <span>{formatCurrency(item.annualAmount)}/year</span>
                            <span
</>

</>>{item.multiplier}x multiplier</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 pt-0">
                <Button
                  className="w-full bg-primary-600 hover:bg-primary-700"
                  onClick={handleSaveValuation}
                  disabled={saveValuationMutation.isPending}
                >
                  {saveValuationMutation.isPending ? (
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                  ) : (
                      Save Valuation
                      <ArrowRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}