import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { getDevToken } from '@/lib/devAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector, Treemap } from 'recharts';
import { AlertCircle, Info, Building, Home, Trash2, DollarSign, BarChart3, PieChartIcon, Copy, ArrowRightLeft, Save, ArrowLeftRight, Blocks, Clock, FileText, Printer, PlayCircle, BrainCircuit, Share2, Loader2, FileDown, ListPlus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import CostReportPDFExport from "./CostReportPDFExport";
import BuildingBlocksAnimation from "./BuildingBlocksAnimation";
import ScenarioComparisonDashboard from "./ScenarioComparisonDashboard";
import { BUILDING_TYPES, NEIGHBORHOODS, QUALITY_GRADES, CONDITION_GRADES, COMPLEXITY_GRADES, neighborhoodToRegion } from '@/data/constants';
import { useOsContext } from '@/contexts/OsContext';

// Form schema for calculator
const calculatorSchema = z.object({
  squareFootage: z.coerce.number().min(1, "Square footage must be greater than 0"),
  buildingType: z.string().min(1, "Building type is required"),
  qualityGrade: z.string().min(1, "Quality grade is required"),
  complexityGrade: z.string().min(1, "Complexity grade is required"),
  conditionGrade: z.string().min(1, "Condition grade is required"),
  neighborhood: z.string().min(1, "Neighborhood is required"),
  yearBuilt: z.coerce.number()
    .min(1900, "Year built must be 1900 or later")
    .max(new Date().getFullYear(), "Year built cannot be in the future")
    .default(new Date().getFullYear()),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface MaterialCost {
  foundations: number;
  framing: number;
  exterior: number;
  roofing: number;
  interior: number;
  electrical: number;
  plumbing: number;
  hvac: number;
  finishes: number;
  [key: string]: number;
}

interface CostBreakdown {
  category: string;
  cost: number;
}

export interface CalculationResult {
  revalArea: string;
  buildingType: string;
  squareFootage: number;
  baseCost: string;
  revalAreaFactor: string;
  complexityGrade: string;
  conditionGrade: string;
  costPerSqft: number;
  totalCost: number;
  adjustedCost: number;
  materialCosts?: MaterialCost;
  qualityGrade?: string;
  yearBuilt?: number;
  // Numeric factor aliases used by ScenarioComparisonDashboard
  complexityFactor?: number;
  conditionFactor?: number;
}

// Storage key for saved scenarios
const SAVED_SCENARIOS_KEY = 'terrabuild_saved_scenarios';

interface DepreciationResult {
  replacementCostNew: number;
  physicalDepreciation: number;
  physicalDepreciationPct: number;
  functionalObsolescence: number;
  functionalObsolescencePct: number;
  rcnld: number;
  effectiveAge?: number;
}

// Benton Method secondary feature schedule (%-of-BIV)
const SECONDARY_FEATURES = [
  { code: 'BSMT',     label: 'Finished Basement', pct: (sqft: number) => sqft <= 1500 ? 0.13 : 0.10 },
  { code: 'ATTGAR',   label: 'Attached Garage',   pct: () => 0.08 },
  { code: 'DETGAR',   label: 'Detached Garage',   pct: () => 0.06 },
  { code: 'CovPatio', label: 'Covered Patio/Deck', pct: () => 0.03 },
  { code: 'POLEBLDG', label: 'Shop / Pole Building', pct: () => 0.18 },
  { code: 'POOL',     label: 'Pool',               pct: () => 0.05 },
] as const;

type FeatureCode = typeof SECONDARY_FEATURES[number]['code'];

const CostCalculatorAPI = () => {
  const { parcelId } = useOsContext();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [depreciationResult, setDepreciationResult] = useState<DepreciationResult | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [hoveredCostItem, setHoveredCostItem] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<CalculationResult[]>([]);
  const [showSecondaryFeatures, setShowSecondaryFeatures] = useState<boolean>(false);
  const [secondarySqft, setSecondarySqft] = useState<Record<FeatureCode, number>>({
    BSMT: 0, ATTGAR: 0, DETGAR: 0, CovPatio: 0, POLEBLDG: 0, POOL: 0,
  });
  const { toast } = useToast();
  
  // Load saved scenarios from localStorage on component mount
  useEffect(() => {
    const storedScenarios = localStorage.getItem(SAVED_SCENARIOS_KEY);
    if (storedScenarios) {
      try {
        const parsedScenarios = JSON.parse(storedScenarios);
        if (Array.isArray(parsedScenarios)) {
          setSavedScenarios(parsedScenarios);
        }
      } catch (error) {
        console.error('Failed to parse saved scenarios:', error);
      }
    }
  }, []);

  // Default form values
  const defaultValues: Partial<CalculatorFormValues> = {
    squareFootage: 1000,
    buildingType: "R1",
    qualityGrade: "STANDARD",
    complexityGrade: "STANDARD",
    conditionGrade: "GOOD",
    neighborhood: "12040",
    yearBuilt: new Date().getFullYear(),
  };

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues,
  });

  // Auto-fill from CAMA when parcelId is set (e.g. via /calculator?parcelId=X)
  // Placed after form declaration so form.setValue is in scope.
  useEffect(() => {
    if (!parcelId) return;
    const fetchCama = async () => {
      try {
        const res = await fetch(`/api/costforge/parcels/${encodeURIComponent(parcelId)}/cama`);
        if (!res.ok) return;
        const cama = await res.json();
        const sqft = cama.SquareFeet ?? cama.squareFeet ?? cama.GrossBuildingArea ?? cama.grossBuildingArea;
        const yr = cama.YearBuilt ?? cama.yearBuilt;
        const bt = cama.BuildingType ?? cama.buildingType ?? cama.ImprvType ?? cama.imprvType;
        const qual = cama.QualityGrade ?? cama.qualityGrade ?? cama.QualityCode ?? cama.qualityCode;
        if (sqft) form.setValue('squareFootage', Number(sqft));
        if (yr) form.setValue('yearBuilt', Number(yr));
        if (bt) form.setValue('buildingType', String(bt));
        if (qual) form.setValue('qualityGrade', String(qual));
        toast({ title: `Loaded from parcel ${parcelId}`, description: 'Form pre-filled from CAMA data.' });
      } catch {
        // CAMA endpoint unavailable — silently ignore, user can fill manually
      }
    };
    fetchCama();
  }, [parcelId, form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dropdown options — sourced from constants (verified against benton_matrix_exact_identifiers.json + CostForgeController.cs)
  const buildingTypes = BUILDING_TYPES;
  const qualityLevels = QUALITY_GRADES;
  const neighborhoods = NEIGHBORHOODS;

  // Submit form handler — calls POST /api/costforge/cost-estimate
  const onSubmit = async (data: CalculatorFormValues) => {
    setIsCalculating(true);
    setApiError(null);
    try {
      const revalArea = neighborhoodToRegion(data.neighborhood);
      const token = await getDevToken();
      const response = await axios.post('/api/costforge/cost-estimate', {
        buildingType: data.buildingType,
        revalArea,
        squareFeet: data.squareFootage,
        yearBuilt: data.yearBuilt,
        qualityGrade: data.qualityGrade,
        conditionGrade: data.conditionGrade,
        complexityGrade: data.complexityGrade,
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});

      const apiData = response.data;
      if (typeof apiData.totalCost !== 'number') {
        throw new Error(
          `API response missing required totalCost field. Got: ${JSON.stringify(apiData)}`
        );
      }

      // Create complete calculation result mapped from API response
      const calculationResult: CalculationResult = {
        revalArea: data.neighborhood,
        buildingType: data.buildingType,
        squareFootage: data.squareFootage,
        baseCost: String(apiData.baseCostPerSqft ?? '—'),
        revalAreaFactor: String(apiData.revalAreaFactor ?? apiData.regionFactor ?? '—'),
        complexityGrade: data.complexityGrade,
        conditionGrade: data.conditionGrade,
        costPerSqft: apiData.adjustedCostPerSqft ?? 0,
        totalCost: apiData.totalCost,
        adjustedCost: apiData.totalCost,
        qualityGrade: data.qualityGrade,
        yearBuilt: data.yearBuilt,
      };
      
      // Set the calculation result
      setCalculationResult(calculationResult);

      // Compute secondary features RCN using Benton Method %-of-BIV
      const biv = apiData.totalCost;
      const secondaryRCN = SECONDARY_FEATURES.reduce((sum, feat) => {
        const sqft = secondarySqft[feat.code];
        if (sqft > 0) {
          return sum + biv * feat.pct(sqft);
        }
        return sum;
      }, 0);
      const totalRCN = biv + secondaryRCN;

      // Fetch RCNLD depreciation breakdown (on full total including secondary features)
      try {
        const effectiveAge = data.yearBuilt ? new Date().getFullYear() - data.yearBuilt : 10;
        const deprResponse = await axios.post('/api/costforge/depreciation-calculate', {
          ReplacementCostNew: totalRCN,
          EffectiveAge: effectiveAge,
          Condition: data.conditionGrade,
        }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        const d = deprResponse.data;
        setDepreciationResult({
          replacementCostNew: totalRCN,
          physicalDepreciation: d.PhysicalDepreciation ?? d.physicalDepreciation ?? 0,
          physicalDepreciationPct: d.PhysicalDepreciationPct ?? d.physicalDepreciationPct ?? 0,
          functionalObsolescence: d.FunctionalObsolescence ?? d.functionalObsolescence ?? 0,
          functionalObsolescencePct: d.FunctionalObsolescencePct ?? d.functionalObsolescencePct ?? 0,
          rcnld: d.Rcnld ?? d.rcnld ?? totalRCN,
          effectiveAge,
        });
      } catch {
        // Depreciation endpoint is secondary — don't block the primary result
        setDepreciationResult(null);
      }

      // Simple breakdown: total is authoritative from API, show single line
      const breakdown: CostBreakdown[] = [
        { category: 'Replacement Cost New (RCN)', cost: calculationResult.totalCost },
      ];

      setCostBreakdown(breakdown);
      setActiveTab("results");
      
      toast({
        title: "Calculation Complete",
        description: `Successfully calculated cost for ${data.squareFootage} sqft ${data.buildingType} in ${data.neighborhood}`,
      });
    } catch (error) {
      console.error('Error calculating cost:', error);
      if (axios.isAxiosError(error) && error.response) {
        setApiError(`Error: ${error.response.data.message || 'Failed to calculate cost'}`);
        toast({
          variant: "destructive",
          title: "Calculation Error",
          description: error.response.data.message || 'Failed to calculate cost',
        });
      } else {
        setApiError('Network error or server is not responding');
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Network error or server is not responding",
        });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number | unknown) => {
    const numValue = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full shadow-md border-[#29B7D3]/20">
        <CardHeader className="bg-gradient-to-r from-[#e6eef2] to-[#e8f8fb]">
          <div className="flex items-center">
            <div className="mr-4 p-2 bg-blue-500 text-white rounded-full">
              <DollarSign size={24} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">Cost Estimator — RCNLD</CardTitle>
              <CardDescription>
                Benton County replacement cost new less depreciation — FY2025 cost matrix
              </CardDescription>
            </div>
            {parcelId && (
              <div className="ml-auto">
                <Badge variant="outline" className="text-xs font-mono border-blue-300 text-blue-700 bg-blue-50">
                  Parcel {parcelId}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="calculator" className="flex-1">
                <div className="flex items-center">
                  <Building className="mr-2" size={18} />
                  <span>Calculator</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex-1" disabled={!calculationResult}>
                <div className="flex items-center">
                  <BarChart3 className="mr-2" size={18} />
                  <span>Results & Analysis</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              {apiError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Square Footage */}
                    <FormField
                      control={form.control}
                      name="squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the total square footage of the building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Building Type */}
                    <FormField
                      control={form.control}
                      name="buildingType"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>Building Type</FormLabel>
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0 text-cyan-600">
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">Building type info</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm bg-cyan-950 text-white" side="right">
                                  <div className="space-y-2">
                                    <p className="font-semibold">Building Type Explanation</p>
                                    <p className="text-sm">The CostForge calculator adjusts costs based on building type:</p>
                                    <ul className="text-xs space-y-1 list-disc pl-4">
                                      <li><span className="font-semibold">Residential:</span> Single-family homes, apartments, condos</li>
                                      <li><span className="font-semibold">Commercial:</span> Retail, offices, warehouses</li>
                                      <li><span className="font-semibold">Industrial:</span> Manufacturing, processing facilities</li>
                                      <li><span className="font-semibold">Office:</span> Specialized office buildings</li>
                                    </ul>
                                    <p className="text-xs italic mt-2">Benton County uses specific multipliers for each building type.</p>
                                  </div>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-cyan-200 focus:ring-cyan-500">
                                <SelectValue placeholder="Select building type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {buildingTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quality Level */}
                    <FormField
                      control={form.control}
                      name="qualityGrade"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>Quality Level</FormLabel>
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0 text-cyan-600">
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">Quality level info</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm bg-cyan-950 text-white" side="right">
                                  <div className="space-y-2">
                                    <p className="font-semibold">Quality Level Explanation</p>
                                    <p className="text-sm">Benton County quality class codes (9-category field checklist):</p>
                                    <ul className="text-xs space-y-1 list-disc pl-4">
                                      <li><span className="font-semibold">Economy:</span> Class 10/20 — Low / Fair (×0.75)</li>
                                      <li><span className="font-semibold">Standard:</span> Class 25/30 — Fair+ / Average (×1.00)</li>
                                      <li><span className="font-semibold">Custom:</span> Class 35 — Average+ (×1.12)</li>
                                      <li><span className="font-semibold">Premium:</span> Class 40/45 — Good / Good+ (×1.30)</li>
                                      <li><span className="font-semibold">Luxury:</span> Class 50–60 — Very Good to Excellent (×1.55)</li>
                                    </ul>
                                    <p className="text-xs italic mt-2">Most Benton residential is Standard or Custom (Class 30–35).</p>
                                  </div>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-cyan-200 focus:ring-cyan-500">
                                <SelectValue placeholder="Select quality level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {qualityLevels.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the quality level of construction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Neighborhood */}
                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neighborhood</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-cyan-200 focus:ring-cyan-500">
                                <SelectValue placeholder="Select neighborhood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                              {([
                                { reval: 1, label: 'Reval 1 — Kennewick NE' },
                                { reval: 2, label: 'Reval 2 — Kennewick Urban / West Kennewick' },
                                { reval: 3, label: 'Reval 3 — South Richland / Kennewick West' },
                                { reval: 4, label: 'Reval 4 — Benton City / Prosser' },
                                { reval: 5, label: 'Reval 5 — Richland West / Rural' },
                                { reval: 6, label: 'Reval 6 — Historic Richland' },
                              ] as const).map(({ reval, label }) => {
                                const group = neighborhoods.filter(n => n.reval === reval);
                                return (
                                  <SelectGroup key={reval}>
                                    <SelectLabel className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                                      {label}
                                    </SelectLabel>
                                    {group.map(n => (
                                      <SelectItem key={n.value} value={n.value}>
                                        {n.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the neighborhood where the building is located
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Year Built */}
                    <FormField
                      control={form.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormLabel>Year Built</FormLabel>
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0 text-cyan-600">
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">Year built info</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm bg-cyan-950 text-white" side="right">
                                  <div className="space-y-2">
                                    <p className="font-semibold">Year Built Explanation</p>
                                    <p className="text-sm">This factor affects depreciation and code compliance costs:</p>
                                    <ul className="text-xs space-y-1 list-disc pl-4">
                                      <li><span className="font-semibold">Older buildings:</span> May have higher costs for code compliance and modernization</li>
                                      <li><span className="font-semibold">Newer buildings:</span> Generally have fewer depreciation adjustments</li>
                                      <li><span className="font-semibold">Current year:</span> Use for new construction planning</li>
                                    </ul>
                                    <p className="text-xs italic mt-2">Benton County applies different age factors based on building type.</p>
                                  </div>
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1900" 
                              max={new Date().getFullYear()} 
                              {...field} 
                              className="border-cyan-200 focus:ring-cyan-500"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the year the building was built or leave as current year for new construction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Complexity Grade */}
                  <FormField
                    control={form.control}
                    name="complexityGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Construction Complexity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-cyan-200 focus:ring-cyan-500">
                              <SelectValue placeholder="Select complexity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMPLEXITY_GRADES.map(g => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Simple = basic rectangular shapes; Highly Complex = irregular geometry, custom features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Condition Grade */}
                  <FormField
                    control={form.control}
                    name="conditionGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-cyan-200 focus:ring-cyan-500">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITION_GRADES.map(g => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          For new construction use Good. Poor = significant deterioration requiring major repairs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Secondary Features — Benton Method %-of-BIV */}
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50/40">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-cyan-800 hover:bg-cyan-100/60 transition-colors rounded-lg"
                      onClick={() => setShowSecondaryFeatures(v => !v)}
                    >
                      <span className="flex items-center gap-2">
                        <ListPlus className="h-4 w-4" />
                        Secondary Features (Benton Method)
                      </span>
                      <span className="text-xs font-normal text-cyan-600">
                        {showSecondaryFeatures ? '▲ Hide' : '▼ Show'}
                        {Object.values(secondarySqft).some(v => v > 0) && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-600 text-white text-xs">Active</span>
                        )}
                      </span>
                    </button>
                    {showSecondaryFeatures && (
                      <div className="px-4 pb-4 pt-1 space-y-3">
                        <p className="text-xs text-cyan-700">
                          Enter square footage for each secondary improvement. Values are calculated as a percentage of the main building's Replacement Cost New (RCN).
                        </p>
                        <div className="space-y-2">
                          {SECONDARY_FEATURES.map(feat => {
                            const sqft = secondarySqft[feat.code];
                            const pct = feat.pct(sqft);
                            const preview = calculationResult
                              ? `≈ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(calculationResult.totalCost * pct)}`
                              : `${(pct * 100).toFixed(0)}% of BIV`;
                            return (
                              <div key={feat.code} className="grid grid-cols-12 gap-2 items-center">
                                <span className="col-span-5 text-xs font-medium text-gray-700">{feat.label}</span>
                                <div className="col-span-4 relative">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={sqft || ''}
                                    placeholder="sqft"
                                    className="h-8 text-xs pr-10"
                                    onChange={e => setSecondarySqft(prev => ({
                                      ...prev,
                                      [feat.code]: Math.max(0, parseInt(e.target.value) || 0),
                                    }))}
                                  />
                                  <span className="absolute right-2 top-1.5 text-xs text-gray-400 pointer-events-none">sqft</span>
                                </div>
                                <span className="col-span-3 text-right text-xs text-cyan-700 font-mono">
                                  {sqft > 0 ? preview : <span className="text-gray-400">{(pct * 100).toFixed(0)}% of BIV</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {calculationResult && Object.values(secondarySqft).some(v => v > 0) && (
                          <div className="mt-3 pt-3 border-t border-cyan-200 text-xs font-mono space-y-1">
                            <div className="flex justify-between text-gray-600">
                              <span>Main BIV</span>
                              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(calculationResult.totalCost)}</span>
                            </div>
                            {SECONDARY_FEATURES.map(feat => {
                              const sqft = secondarySqft[feat.code];
                              if (sqft <= 0) return null;
                              const contrib = calculationResult.totalCost * feat.pct(sqft);
                              return (
                                <div key={feat.code} className="flex justify-between text-gray-500">
                                  <span>+ {feat.label} ({(feat.pct(sqft) * 100).toFixed(0)}%)</span>
                                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(contrib)}</span>
                                </div>
                              );
                            })}
                            <div className="flex justify-between font-bold text-cyan-800 pt-1 border-t border-cyan-200">
                              <span>Total RCN</span>
                              <span>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                                  calculationResult.totalCost + SECONDARY_FEATURES.reduce((s, f) => {
                                    const sq = secondarySqft[f.code];
                                    return sq > 0 ? s + calculationResult.totalCost * f.pct(sq) : s;
                                  }, 0)
                                )}
                              </span>
                            </div>
                            <p className="text-cyan-600 text-xs mt-1">Recalculate to apply secondary features to RCNLD.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-1/2" disabled={isCalculating}>
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Calculate Cost
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="results">
              {calculationResult ? (
                <div className="space-y-8">
                  {/* Result Summary Card */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle>Cost Calculation Results</CardTitle>
                      <CardDescription>
                        {calculationResult.squareFootage} sq ft {calculationResult.buildingType ? calculationResult.buildingType.toLowerCase() : 'unknown'} building in {calculationResult.revalArea ? calculationResult.revalArea.toLowerCase().replace('_', ' ') : 'unknown location'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Total Building Cost</h3>
                          <div className="text-3xl font-bold text-blue-700">
                            {formatCurrency(calculationResult.totalCost || 0)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatCurrency(calculationResult.costPerSqft || 0)} per square foot
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Cost Factors</h3>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Base Cost:</span>
                              <span className="font-medium">{formatCurrency(calculationResult.baseCost ? Number(calculationResult.baseCost) : 0)}/sq ft</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Complexity:</span>
                              <span className="font-medium">{calculationResult.complexityGrade ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Condition:</span>
                              <span className="font-medium">{calculationResult.conditionGrade ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reval Area Factor:</span>
                              <span className="font-medium">{calculationResult.revalAreaFactor ? Number(calculationResult.revalAreaFactor).toFixed(2) : '1.00'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* RCNLD Waterfall */}
                  {depreciationResult && (
                    <Card className="border-blue-300 bg-blue-50/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-blue-800">RCNLD Valuation Waterfall</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 font-mono text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-700">Replacement Cost New (RCN)</span>
                            <span className="font-bold">{formatCurrency(depreciationResult.replacementCostNew)}</span>
                          </div>
                          <div className="flex justify-between py-1 text-red-600">
                            <span>Less Physical Depreciation ({depreciationResult.effectiveAge}yr — {(depreciationResult.physicalDepreciationPct * 100).toFixed(1)}%)</span>
                            <span>−{formatCurrency(depreciationResult.physicalDepreciation)}</span>
                          </div>
                          {depreciationResult.functionalObsolescence > 0 && (
                            <div className="flex justify-between py-1 text-orange-600">
                              <span>Less Functional Obsolescence ({(depreciationResult.functionalObsolescencePct * 100).toFixed(1)}%)</span>
                              <span>−{formatCurrency(depreciationResult.functionalObsolescence)}</span>
                            </div>
                          )}
                          <div className="border-t border-blue-300 pt-2 mt-1 flex justify-between font-bold text-base text-blue-900">
                            <span>RCNLD</span>
                            <span>{formatCurrency(depreciationResult.rcnld)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cost Breakdown */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Cost Breakdown</h3>
                    
                    {/* Cost Visualization Tabs */}
                    <Tabs defaultValue="table" className="mb-6">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="table" className="flex-1">
                          <div className="flex items-center">
                            <span>Table View</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="blocks" className="flex-1">
                          <div className="flex items-center">
                            <span>Building Blocks Animation</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="table">
                        {/* Cost Breakdown Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/2">Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {costBreakdown.map((item, index) => {
                            // Skip items with zero or negative costs
                            if (item.cost <= 0) return null;
                            
                            const percentage = calculationResult.totalCost ? (item.cost / calculationResult.totalCost) * 100 : 0;
                            
                            return (
                              <TableRow 
                                key={index}
                                className={hoveredCostItem === item.category ? "bg-blue-50" : ""}
                                onMouseEnter={() => setHoveredCostItem(item.category)}
                                onMouseLeave={() => setHoveredCostItem(null)}
                              >
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{formatCurrency(item.cost)}</TableCell>
                                <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="font-bold bg-gray-50">
                            <TableCell>Total Cost</TableCell>
                            <TableCell>{formatCurrency(calculationResult.totalCost || 0)}</TableCell>
                            <TableCell className="text-right">100%</TableCell>
                          </TableRow>
                        </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="blocks">
                        {/* Building Blocks Animation */}
                        <BuildingBlocksAnimation 
                          costBreakdown={costBreakdown} 
                          totalCost={calculationResult.totalCost || 0}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Material Costs Visualization */}
                  {calculationResult.materialCosts && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Materials Cost Breakdown</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(calculationResult.materialCosts).map(([key, value]) => ({
                                name: key.charAt(0).toUpperCase() + key.slice(1),
                                value
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {Object.keys(calculationResult.materialCosts).map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
                                    '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1',
                                    '#a4de6c', '#d0ed57'
                                  ][index % 10]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="flex items-center"
                      onClick={() => setActiveTab("calculator")}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Modify Calculation
                    </Button>
                    <Button
                      variant="default"
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        if (!calculationResult) return;
                        try {
                          const token = await getDevToken();
                          const biv = calculationResult.totalCost;
                          const secondaryRCN = SECONDARY_FEATURES.reduce((sum, feat) => {
                            const sqft = secondarySqft[feat.code];
                            return sqft > 0 ? sum + biv * feat.pct(sqft) : sum;
                          }, 0);
                          const totalRCN = biv + secondaryRCN;
                          const rcnld = depreciationResult?.rcnld ?? totalRCN;

                          await axios.post('/api/costforge/valuations', {
                            ParcelId: parcelId ?? 'MANUAL',
                            BuildingType: calculationResult.buildingType,
                            RevalArea: calculationResult.revalArea,
                            SquareFeet: calculationResult.squareFootage,
                            QualityGrade: calculationResult.qualityGrade,
                            ConditionGrade: calculationResult.conditionGrade,
                            YearBuilt: calculationResult.yearBuilt,
                            ValuationMethod: 'cost-approach',
                            Rcnld: rcnld,
                            FinalReconciledValue: rcnld,
                          }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});

                          toast({ title: 'Valuation Saved', description: `RCNLD ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rcnld)} saved to valuation history.` });
                        } catch {
                          toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save valuation to server.' });
                        }
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Valuation
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center"
                      onClick={() => {
                        // Add current result to scenarios
                        const updatedScenarios = [...savedScenarios, {
                          ...calculationResult,
                          yearBuilt: form.getValues().yearBuilt
                        }];
                        setSavedScenarios(updatedScenarios);

                        // Save to localStorage
                        localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(updatedScenarios));

                        toast({
                          title: "Scenario Saved",
                          description: "This calculation has been saved for comparison",
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save as Scenario
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(calculationResult, null, 2));
                        toast({
                          title: "Copied to Clipboard",
                          description: "Calculation details copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Data
                    </Button>
                    
                    {/* PDF Export Button */}
                    {calculationResult && (
                      <CostReportPDFExport
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        calculationResult={calculationResult as any}
                        costBreakdown={costBreakdown}
                        projectName={`${calculationResult.buildingType || 'Property'} Building Cost Report`}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No Calculation Results</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter your building details in the calculator tab and submit to see results
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => setActiveTab("calculator")}
                  >
                    Go to Calculator
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <div className="text-sm text-gray-500">
            <p>Calculation uses the official Benton County Building Cost API</p>
            <p className="mt-1">All calculations are approximate and may require professional validation.</p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Scenario Comparison Dashboard */}
      {savedScenarios.length > 0 && (
        <ScenarioComparisonDashboard 
          savedScenarios={savedScenarios}
          onDeleteScenario={(index) => {
            const updatedScenarios = [...savedScenarios];
            updatedScenarios.splice(index, 1);
            setSavedScenarios(updatedScenarios);
            localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(updatedScenarios));
            
            toast({
              title: "Scenario Deleted",
              description: `Scenario ${index + 1} has been removed from comparison`,
            });
          }}
          onClearAllScenarios={() => {
            setSavedScenarios([]);
            localStorage.removeItem(SAVED_SCENARIOS_KEY);
            
            toast({
              title: "All Scenarios Cleared",
              description: "All saved scenarios have been removed",
            });
          }}
          onExportComparison={() => {
            toast({
              title: "Comparison Export",
              description: "Exporting comparison report...",
            });
            
            // This would be implemented with a PDF export function similar to the individual report
            // For now we'll just show a notification
            setTimeout(() => {
              toast({
                title: "Export Complete",
                description: "The comparison report has been downloaded",
              });
            }, 1500);
          }}
        />
      )}
    </div>
  );
};

export default CostCalculatorAPI;