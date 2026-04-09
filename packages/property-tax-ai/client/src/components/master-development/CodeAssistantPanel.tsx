import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle, Code, Copy, FileCode, Brain, Cpu, Braces, Sparkles, PlusCircle, Plus, TerminalSquare, 
  SquarePen, User, Book, Server, Workflow, Layers, GitBranch, Lightbulb, Archive, Download, Upload, 
  ChevronsRight, ChevronsLeft, Search, Layout, Map, Calculator, Check, FileText, BarChart, ListFilter,
  Github, Database } from 'lucide-react';

// Development template types
interface DevelopmentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  language: string;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  templateCode: string;
}

// Code snippet types
interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  category: string;
  tags: string[];
  usageCount: number;
  lastUsed: string;
}

// Property-specific data model types
interface PropertyModel {
  id: string;
  name: string;
  description: string;
  fields: {
    name: string;
    type: string;
    description: string;
    example: string;
  }[];
  relationships: {
    relatedModel: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    description: string;
  }[];
}

// CAMA model types
interface CAMAModel {
  id: string;
  name: string;
  description: string;
  type: 'market' | 'cost' | 'income' | 'hybrid';
  complexity: 'basic' | 'intermediate' | 'advanced';
  applicablePropertyTypes: string[];
  parameters: {
    name: string;
    type: string;
    description: string;
    defaultValue: string;
  }[];
  algorithm: string;
}

// Regulation rule types
interface RegulationRule {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  category: string;
  severity: 'info' | 'warning' | 'error';
  codePattern: string;
  message: string;
  suggestion: string;
  reference: string;
}

// GIS template types
interface GISTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  mapType: 'parcel' | 'zoning' | 'district' | 'neighborhood' | 'analytic';
  previewImage: string;
  templateCode: string;
  dataRequirements: string[];
}

const CodeAssistantPanel: React.FC<{}> = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('assistant');
  const [activeDeveloperTab, setActiveDeveloperTab] = useState('ai-pair');
  const [activeDeveloperTool, setActiveDeveloperTool] = useState('pair-programming');
  const [inputValue, setInputValue] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PropertyModel | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DevelopmentTemplate | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [selectedCAMAModel, setSelectedCAMAModel] = useState<CAMAModel | null>(null);
  const [selectedRegulation, setSelectedRegulation] = useState<RegulationRule | null>(null);
  const [selectedGISTemplate, setSelectedGISTemplate] = useState<GISTemplate | null>(null);
  const [codeContext, setCodeContext] = useState('');
  const [generatedComponents, setGeneratedComponents] = useState<string[]>([]);
  const [projectContext, setProjectContext] = useState('');
  const [modelPlaygroundData, setModelPlaygroundData] = useState<string>('');
  const [modelResults, setModelResults] = useState<any>(null);
  const [codeToCheck, setCodeToCheck] = useState<string>('');
  const [regulationResults, setRegulationResults] = useState<any>(null);
  const [dataModelDiagram, setDataModelDiagram] = useState<string>('');
  const [gisVisualizationData, setGISVisualizationData] = useState<string>('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [applicationParts, setApplicationParts] = useState<string[]>([]);
  const [assistantHistory, setAssistantHistory] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  
  // Define missing variables for TypeScript errors
  const [selectedParcel, setSelectedParcel] = useState<{
    site_address: string;
    zoning: string;
    assessed_value: number;
    acres: number;
    tax_status: string;
  } | null>(null);
  
  // Sample property data for code that references property
  const [propertyData, setPropertyData] = useState<{
    id: string;
    propertyId: string;
    address: string;
    ownerName: string;
    assessedValue: number;
    taxLot: string;
    landValue: number;
    improvementDetails: Array<{
      id: string;
      type: string;
      value: number;
      yearBuilt: number;
      squareFeet: number;
    }>;
  } | null>(null);
  
  // Sample improvement and assessment data
  const [improvement, setImprovement] = useState<{
    id: string;
    type: string;
    yearBuilt: number;
    squareFeet: number;
    value: number;
  } | null>(null);
  
  const [assessment, setAssessment] = useState<{
    id: string;
    year: number;
    value: number;
    taxAmount: number;
    assessmentDate: string;
  } | null>(null);
  
  // Sample development context - in a real implementation, this would come from your application state
  const context = {
    domain: 'property-assessment',
    organization: 'Benton County Assessor\'s Office',
    currentProject: 'Property Assessment System',
    availableModels: ['Property', 'Improvement', 'Owner', 'Assessment', 'Land'],
    activeDataSources: ['PACS', 'GIS', 'CountyRecords', 'TaxRolls'],
    workflows: ['PropertyLookup', 'ValueCalculation', 'NoticeGeneration', 'AppealProcessing'],
    userTypes: ['Assessor', 'Administrator', 'PublicUser', 'CountyOfficial']
  };

  // Sample property models - in production, these would be fetched from your API
  const propertyModels: PropertyModel[] = [
    {
      id: 'property-model',
      name: 'Property',
      description: 'Core property record with ownership and valuation data',
      fields: [
        { name: 'propertyId', type: 'string', description: 'Unique identifier', example: 'BC12345' },
        { name: 'address', type: 'string', description: 'Physical location', example: '123 Main St, Corvallis' },
        { name: 'marketValue', type: 'number', description: 'Current market value', example: '350000' },
        { name: 'acres', type: 'number', description: 'Total land area in acres', example: '1.25' },
        { name: 'taxCode', type: 'string', description: 'Tax jurisdiction code', example: 'BC-R2' }
      ],
      relationships: [
        { relatedModel: 'Owner', type: 'one-to-many', description: 'Property owners (current and historical)' },
        { relatedModel: 'Improvement', type: 'one-to-many', description: 'Buildings and structures on property' },
        { relatedModel: 'Assessment', type: 'one-to-many', description: 'Annual assessment records' }
      ]
    },
    {
      id: 'improvement-model',
      name: 'Improvement',
      description: 'Buildings, structures and other property improvements',
      fields: [
        { name: 'improvementId', type: 'string', description: 'Unique identifier', example: 'IMP-5432' },
        { name: 'propertyId', type: 'string', description: 'Associated property', example: 'BC12345' },
        { name: 'type', type: 'string', description: 'Type of improvement', example: 'Single Family Residence' },
        { name: 'squareFeet', type: 'number', description: 'Building size', example: '2400' },
        { name: 'yearBuilt', type: 'number', description: 'Year of construction', example: '1998' }
      ],
      relationships: [
        { relatedModel: 'Property', type: 'one-to-one', description: 'Parent property' }
      ]
    }
  ];

  // Sample templates - in production, these would be fetched from your API
  const developmentTemplates: DevelopmentTemplate[] = [
    {
      id: 'property-lookup',
      name: 'Property Lookup Component',
      category: 'UI Component',
      description: 'Search interface for property records with address autocomplete',
      language: 'typescript',
      complexity: 'medium',
      tags: ['search', 'property', 'react', 'ui'],
      templateCode: `import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';

export const PropertyLookup: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Query to fetch property suggestions
  const { data, isLoading } = useQuery({
    queryKey: ['/api/properties/suggestions', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 3) return [];
      const response = await fetch(\`/api/properties/suggestions?q=\${encodeURIComponent(searchTerm)}\`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: searchTerm.length >= 3
  });
  
  useEffect(() => {
    if (data) setSuggestions(data);
  }, [data]);

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Enter address or property ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      
      {isLoading && <p className="text-sm text-gray-500">Loading suggestions...</p>}
      
      {suggestions.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => setSearchTerm(item.address)}
                >
                  {item.address}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};`
    },
    {
      id: 'assessment-calculation',
      name: 'Assessment Value Calculator',
      category: 'Business Logic',
      description: 'Utility for calculating property assessment values based on improvements and land',
      language: 'typescript',
      complexity: 'complex',
      tags: ['calculation', 'assessment', 'utility'],
      templateCode: `/**
 * Assessment Value Calculator
 * 
 * Benton County specialized utility for calculating property assessment values
 * based on land characteristics and improvements.
 */
export class AssessmentCalculator {
  // Constants for calculation adjustments
  private readonly LAND_VALUE_MULTIPLIER = 0.95;
  private readonly IMPROVEMENT_DEPRECIATION_RATE = 0.02;
  private readonly MAX_IMPROVEMENT_DEPRECIATION = 0.70;
  
  /**
   * Calculate the total assessed value of a property
   */
  public calculateAssessedValue(property: {
    landMarketValue: number;
    improvements: Array<{
      value: number;
      yearBuilt: number;
      squareFeet: number;
      type: string;
    }>;
    zoneType: string;
    specialAssessments: Record<string, number>;
  }): {
    totalValue: number;
    landValue: number;
    improvementsValue: number;
    specialAssessmentsValue: number;
  } {
    // Calculate land value
    const landValue = this.calculateLandValue(
      property.landMarketValue,
      property.zoneType
    );
    
    // Calculate improvements value
    const improvementsValue = this.calculateImprovementsValue(
      property.improvements
    );
    
    // Calculate special assessments
    const specialAssessmentsValue = Object.values(
      property.specialAssessments
    ).reduce((sum, value) => sum + value, 0);
    
    // Calculate total value
    const totalValue = landValue + improvementsValue + specialAssessmentsValue;
    
    return {
      totalValue,
      landValue,
      improvementsValue,
      specialAssessmentsValue
    };
  }
  
  /**
   * Calculate land value based on market value and zoning
   */
  private calculateLandValue(marketValue: number, zoneType: string): number {
    let adjustmentFactor = 1.0;
    
    // Apply zone-specific adjustments
    switch (zoneType) {
      case 'residential':
        adjustmentFactor = 1.0;
        break;
      case 'commercial':
        adjustmentFactor = 1.1;
        break;
      case 'agricultural':
        adjustmentFactor = 0.8;
        break;
      case 'industrial':
        adjustmentFactor = 1.15;
        break;
      default:
        adjustmentFactor = 1.0;
    }
    
    return marketValue * this.LAND_VALUE_MULTIPLIER * adjustmentFactor;
  }
  
  /**
   * Calculate improvements value with depreciation
   */
  private calculateImprovementsValue(improvements: Array<{
    value: number;
    yearBuilt: number;
    squareFeet: number;
    type: string;
  }>): number {
    const currentYear = new Date().getFullYear();
    
    return improvements.reduce((total, improvement) => {
      // Calculate age and depreciation
      const age = currentYear - improvement.yearBuilt;
      const depreciation = Math.min(
        age * this.IMPROVEMENT_DEPRECIATION_RATE,
        this.MAX_IMPROVEMENT_DEPRECIATION
      );
      
      // Apply type-specific adjustments
      let typeMultiplier = 1.0;
      switch (improvement.type.toLowerCase()) {
        case 'single family residence':
          typeMultiplier = 1.0;
          break;
        case 'commercial building':
          typeMultiplier = 1.15;
          break;
        case 'manufactured home':
          typeMultiplier = 0.85;
          break;
        case 'agricultural building':
          typeMultiplier = 0.75;
          break;
        default:
          typeMultiplier = 1.0;
      }
      
      // Calculate depreciated value
      const depreciatedValue = improvement.value * (1 - depreciation) * typeMultiplier;
      
      return total + depreciatedValue;
    }, 0);
  }
}`
    }
  ];

  // Sample CAMA models - in production, these would be fetched from your API
  const camaModels: CAMAModel[] = [
    {
      id: 'market-comparable-model',
      name: 'Market Comparable Analysis Model',
      description: 'CAMA model for property valuation based on comparable sales analysis',
      type: 'market',
      complexity: 'advanced',
      applicablePropertyTypes: ['residential', 'commercial', 'vacant land'],
      parameters: [
        { name: 'radiusMiles', type: 'number', description: 'Search radius for comparable properties', defaultValue: '1.0' },
        { name: 'maxAgeDays', type: 'number', description: 'Maximum age of sales to consider', defaultValue: '365' },
        { name: 'adjustmentFactors', type: 'object', description: 'Adjustment factors for property characteristics', defaultValue: '{}' },
        { name: 'minComparables', type: 'number', description: 'Minimum number of comparables required', defaultValue: '3' },
        { name: 'qualityThreshold', type: 'number', description: 'Minimum quality score for comparables', defaultValue: '0.7' }
      ],
      algorithm: `/**
 * Market Comparable Analysis Algorithm
 * Benton County implementation
 */
export class MarketComparableAnalysis {
  // Configuration parameters
  private radiusMiles: number;
  private maxAgeDays: number;
  private adjustmentFactors: Record<string, number>;
  private minComparables: number;
  private qualityThreshold: number;
  
  constructor(parameters: {
    radiusMiles: number;
    maxAgeDays: number;
    adjustmentFactors: Record<string, number>;
    minComparables: number;
    qualityThreshold: number;
  }) {
    this.radiusMiles = parameters.radiusMiles;
    this.maxAgeDays = parameters.maxAgeDays;
    this.adjustmentFactors = parameters.adjustmentFactors;
    this.minComparables = parameters.minComparables;
    this.qualityThreshold = parameters.qualityThreshold;
  }
  
  async performValuation(subject: {
    propertyId: string;
    location: { lat: number; lng: number };
    propertyType: string;
    squareFeet: number;
    yearBuilt: number;
    bedrooms: number;
    bathrooms: number;
    lotSize: number;
    features: string[];
  }): Promise<{
    estimatedValue: number;
    comparables: any[];
    adjustmentDetails: any[];
    confidenceScore: number;
    medianValue: number;
    valueRange: [number, number];
  }> {
    // Fetch comparable sales within radius and time period
    const comparables = await this.fetchComparables(
      subject.location,
      subject.propertyType
    );
    
    if (comparables.length < this.minComparables) {
      throw new Error(\`Insufficient comparables found (\${comparables.length})\`);
    }
    
    // Calculate quality scores for each comparable
    const scoredComparables = this.scoreComparables(subject, comparables);
    
    // Filter by quality threshold
    const qualifiedComparables = scoredComparables
      .filter(c => c.qualityScore >= this.qualityThreshold)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 10); // Use top 10 comparables
    
    if (qualifiedComparables.length < this.minComparables) {
      throw new Error(\`Insufficient qualified comparables (\${qualifiedComparables.length})\`);
    }
    
    // Apply adjustments to each comparable
    const adjustedComparables = this.applyAdjustments(subject, qualifiedComparables);
    
    // Calculate final valuation
    const valuationResult = this.calculateFinalValue(adjustedComparables);
    
    return {
      estimatedValue: valuationResult.estimatedValue,
      comparables: qualifiedComparables,
      adjustmentDetails: adjustedComparables.map(c => c.adjustments),
      confidenceScore: valuationResult.confidenceScore,
      medianValue: valuationResult.medianValue,
      valueRange: valuationResult.valueRange
    };
  }
  
  // Implementation details for helper methods would go here
  private async fetchComparables(location: { lat: number; lng: number }, propertyType: string): Promise<any[]> {
    // In a real implementation, this would call an API or database
    return []; // Placeholder
  }
  
  private scoreComparables(subject: any, comparables: any[]): any[] {
    // Calculate similarity scores
    return []; // Placeholder
  }
  
  private applyAdjustments(subject: any, comparables: any[]): any[] {
    // Apply adjustment factors to account for differences
    return []; // Placeholder
  }
  
  private calculateFinalValue(adjustedComparables: any[]): any {
    // Calculate final value statistics
    return {
      estimatedValue: 0,
      confidenceScore: 0,
      medianValue: 0,
      valueRange: [0, 0]
    }; // Placeholder
  }
}`
    },
    {
      id: 'cost-approach-model',
      name: 'Cost Approach Valuation Model',
      description: 'CAMA model for property valuation using the cost approach method',
      type: 'cost',
      complexity: 'intermediate',
      applicablePropertyTypes: ['residential', 'commercial', 'industrial'],
      parameters: [
        { name: 'costManual', type: 'string', description: 'Cost manual to use for base costs', defaultValue: 'marshall-swift' },
        { name: 'costMultiplier', type: 'number', description: 'Regional cost multiplier', defaultValue: '1.05' },
        { name: 'depreciationMethod', type: 'string', description: 'Method for calculating depreciation', defaultValue: 'age-life' },
        { name: 'economicObsolescence', type: 'number', description: 'Economic obsolescence factor', defaultValue: '0.0' }
      ],
      algorithm: `/**
 * Cost Approach Valuation Model
 * Benton County implementation
 */
export class CostApproachValuation {
  // Configuration parameters
  private costManual: string;
  private costMultiplier: number;
  private depreciationMethod: string;
  private economicObsolescence: number;
  
  constructor(parameters: {
    costManual: string;
    costMultiplier: number;
    depreciationMethod: string;
    economicObsolescence: number;
  }) {
    this.costManual = parameters.costManual;
    this.costMultiplier = parameters.costMultiplier;
    this.depreciationMethod = parameters.depreciationMethod;
    this.economicObsolescence = parameters.economicObsolescence;
  }
  
  performValuation(property: {
    landValue: number;
    improvementDetails: {
      type: string;
      quality: string;
      yearBuilt: number;
      squareFeet: number;
      stories: number;
      features: Record<string, boolean>;
    }[];
  }): {
    totalValue: number;
    landValue: number;
    improvementValue: number;
    replacementCost: number;
    depreciation: number;
    calculationDetails: any;
  } {
    // Calculate land value (typically from a separate model)
    const landValue = property.landValue;
    
    // Calculate replacement cost new for all improvements
    let totalReplacementCost = 0;
    const improvementDetails = [];
    
    for (const improvement of property.improvementDetails) {
      const baseCost = this.getBaseCostPerSqFt(
        improvement.type, 
        improvement.quality
      );
      
      // Apply adjustments for features
      const featureAdjustments = this.calculateFeatureAdjustments(improvement.features);
      
      // Apply regional multiplier
      const adjustedBaseCost = baseCost * this.costMultiplier;
      
      // Calculate total replacement cost
      const replacementCost = adjustedBaseCost * improvement.squareFeet;
      
      // Calculate depreciation
      const age = new Date().getFullYear() - improvement.yearBuilt;
      const depreciation = this.calculateDepreciation(
        age,
        improvement.type,
        replacementCost
      );
      
      // Calculate depreciated value
      const depreciatedValue = replacementCost - depreciation;
      
      totalReplacementCost += replacementCost;
      
      improvementDetails.push({
        type: improvement.type,
        squareFeet: improvement.squareFeet,
        baseCost,
        adjustedBaseCost,
        replacementCost,
        age,
        depreciation,
        depreciatedValue
      });
    }
    
    // Apply economic obsolescence if applicable
    const economicObsolescenceAdjustment = 
      totalReplacementCost * this.economicObsolescence;
    
    // Calculate total depreciation
    const totalDepreciation = improvementDetails.reduce(
      (sum, imp) => sum + imp.depreciation, 
      0
    ) + economicObsolescenceAdjustment;
    
    // Calculate total improvement value
    const improvementValue = totalReplacementCost - totalDepreciation;
    
    // Calculate total property value
    const totalValue = landValue + improvementValue;
    
    return {
      totalValue,
      landValue,
      improvementValue,
      replacementCost: totalReplacementCost,
      depreciation: totalDepreciation,
      calculationDetails: {
        improvements: improvementDetails,
        economicObsolescence: economicObsolescenceAdjustment
      }
    };
  }
  
  // Implementation details for helper methods would go here
  private getBaseCostPerSqFt(type: string, quality: string): number {
    // In a real implementation, this would look up values in a cost manual
    return 100; // Placeholder
  }
  
  private calculateFeatureAdjustments(features: Record<string, boolean>): number {
    // Calculate adjustments for special features
    return 0; // Placeholder
  }
  
  private calculateDepreciation(age: number, type: string, replacementCost: number): number {
    // Calculate depreciation based on the selected method
    return 0; // Placeholder
  }
}`
    }
  ];
  
  // Sample regulation rules - in production, these would be fetched from your API
  const regulationRules: RegulationRule[] = [
    {
      id: 'wa-assessment-ratio',
      name: 'Washington Assessment Ratio Requirement',
      description: 'Ensures property assessments comply with Washington state ratio requirements',
      jurisdiction: 'Washington',
      category: 'Assessment Calculation',
      severity: 'error',
      codePattern: '(?:assessed|assessment)\\s*(?:value|ratio)\\s*=\\s*([^\\n]*)',
      message: 'Washington state requires assessments at 100% of market value',
      suggestion: 'Ensure assessment calculations do not include non-standard ratio adjustments',
      reference: "RCW 84.40.030 - Basis of valuation, assessment, appraisal"
    },
    {
      id: 'benton-exemption-code',
      name: 'Benton County Exemption Code Validation',
      description: 'Validates exemption codes used in assessment calculations',
      jurisdiction: 'Benton County',
      category: 'Exemptions',
      severity: 'warning',
      codePattern: 'exemptionCode\\s*=\\s*[\'"]([^\'"]*)[\'"]',
      message: 'Unrecognized exemption code or format for Benton County',
      suggestion: 'Use standard Benton County exemption codes with format BC-EX-###',
      reference: "Benton County Assessor Office Exemption Code List 2025"
    },
    {
      id: 'wa-appeals-notification',
      name: 'Appeals Notification Requirement',
      description: 'Checks that assessment notices include required appeals information',
      jurisdiction: 'Washington',
      category: 'Notifications',
      severity: 'error',
      codePattern: 'generate(?:Notice|Assessment)\\s*\\([^\\)]*\\)',
      message: 'Assessment notices must include appeals rights and deadline information',
      suggestion: 'Include appeals information in all assessment notice templates',
      reference: "RCW 84.40.045 - Notice of change in valuation of real property"
    }
  ];
  
  // Sample GIS templates - in production, these would be fetched from your API
  const gisTemplates: GISTemplate[] = [
    {
      id: 'parcel-viewer',
      name: 'Benton County Parcel Viewer',
      description: 'Interactive parcel map with property data display',
      category: 'Property View',
      mapType: 'parcel',
      previewImage: 'parcel-viewer-preview.png',
      templateCode: `import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Source, Layer } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ParcelViewer = () => {
  const mapRef = useRef(null);
  const [selectedParcel, setSelectedParcel] = useState<{
    property_id: string;
    owner_name: string;
    site_address: string;
    zoning: string;
    assessed_value: number;
    acres: number;
    tax_status: string;
  } | null>(null);
  const [parcelData, setParcelData] = useState([]);
  const [viewport, setViewport] = useState({
    longitude: -119.2,
    latitude: 46.2,
    zoom: 10
  });

  // Fetch parcel data
  useEffect(() => {
    const fetchParcelData = async () => {
      try {
        const response = await fetch('/api/gis/parcels');
        if (response.ok) {
          const data = await response.json();
          setParcelData(data);
        }
      } catch (error) {
        console.error('Error fetching parcel data:', error);
      }
    };
    
    fetchParcelData();
  }, []);

  // Handle parcel selection
  const handleParcelClick = (event) => {
    const feature = event.features[0];
    if (feature) {
      setSelectedParcel(feature.properties);
    }
  };

  return (
    <div className="h-[600px] w-full flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-3/4 h-full relative">
        <Map
          ref={mapRef}
          mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
          {...viewport}
          width="100%"
          height="100%"
          onViewportChange={setViewport}
          interactiveLayerIds={['parcels-fill']}
          onClick={handleParcelClick}
        >
          <NavigationControl position="top-right" />
          
          {/* Parcels Layer */}
          <Source id="parcels" type="geojson" data={{ type: 'FeatureCollection', features: parcelData }}>
            <Layer
              id="parcels-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'zoning'],
                  'residential', '#A8E6CE',
                  'commercial', '#DCEDC2',
                  'industrial', '#FFD3B5',
                  'agricultural', '#FFAAA6',
                  '#CCCCCC'
                ],
                'fill-opacity': 0.6
              }}
            />
            <Layer
              id="parcels-outline"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 1
              }}
            />
          </Source>
        </Map>
      </div>
      
      <div className="w-full md:w-1/4 h-full overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Parcel Information</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedParcel ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Property ID</h3>
                  <p>{selectedParcel?.property_id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Owner</h3>
                  <p>{selectedParcel?.owner_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p>{selectedParcel?.site_address}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Zoning</h3>
                  <p>{selectedParcel?.zoning}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Assessed Value</h3>
                  <p>${selectedParcel?.assessed_value?.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Land Area</h3>
                  <p>{selectedParcel?.acres.toFixed(2)} acres</p>
                </div>
                <div>
                  <h3 className="font-semibold">Tax Status</h3>
                  <p>{selectedParcel?.tax_status}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a parcel to view details</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};`,
      dataRequirements: ['parcel-boundaries', 'ownership-data', 'assessment-values', 'zoning-data']
    },
    {
      id: 'sales-ratio-map',
      name: 'Sales Ratio Analysis Map',
      description: 'Visualization of assessed value to sale price ratios by neighborhood',
      category: 'Analysis',
      mapType: 'neighborhood',
      previewImage: 'sales-ratio-preview.png',
      templateCode: `import React, { useEffect, useState, useRef } from 'react';
import { Map, NavigationControl, Source, Layer } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const SalesRatioMap = () => {
  const mapRef = useRef(null);
  const [neighborhoodData, setNeighborhoodData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [viewport, setViewport] = useState({
    longitude: -119.2,
    latitude: 46.2,
    zoom: 10
  });

  // Fetch neighborhood and sales data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch neighborhood boundaries
        const neighborhoodResponse = await fetch('/api/gis/neighborhoods');
        if (neighborhoodResponse.ok) {
          const neighborhoods = await neighborhoodResponse.json();
          setNeighborhoodData(neighborhoods);
        }
        
        // Fetch sales ratio data for selected year
        const salesResponse = await fetch(\`/api/sales-ratios?year=\${selectedYear}\`);
        if (salesResponse.ok) {
          const sales = await salesResponse.json();
          setSalesData(sales);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [selectedYear]);

  // Calculate stats for each neighborhood
  const calculateNeighborhoodStats = () => {
    if (!neighborhoodData.length || !salesData.length) return [];
    
    const stats = neighborhoodData.map(neighborhood => {
      // Find sales in this neighborhood
      const neighborhoodSales = salesData.filter(
        sale => sale.neighborhood_id === neighborhood.properties.id
      );
      
      // Calculate median ratio
      let medianRatio = 0;
      if (neighborhoodSales.length) {
        const ratios = neighborhoodSales.map(sale => sale.assessment_ratio);
        ratios.sort((a, b) => a - b);
        const mid = Math.floor(ratios.length / 2);
        medianRatio = ratios.length % 2 === 0
          ? (ratios[mid - 1] + ratios[mid]) / 2
          : ratios[mid];
      }
      
      return {
        ...neighborhood,
        properties: {
          ...neighborhood.properties,
          sales_count: neighborhoodSales.length,
          median_ratio: medianRatio
        }
      };
    });
    
    return stats;
  };
  
  const enrichedNeighborhoods = calculateNeighborhoodStats();

  // Handle neighborhood selection
  const handleNeighborhoodClick = (event) => {
    const feature = event.features[0];
    if (feature) {
      setSelectedNeighborhood(feature.properties);
    }
  };

  // Calculate histogram data for selected neighborhood
  const getHistogramData = () => {
    if (!selectedNeighborhood) return [];
    
    const neighborhoodSales = salesData.filter(
      sale => sale.neighborhood_id === selectedNeighborhood.id
    );
    
    // Group by ratio ranges
    const histogramData = [
      { range: '<0.85', count: 0 },
      { range: '0.85-0.90', count: 0 },
      { range: '0.90-0.95', count: 0 },
      { range: '0.95-1.00', count: 0 },
      { range: '1.00-1.05', count: 0 },
      { range: '1.05-1.10', count: 0 },
      { range: '1.10-1.15', count: 0 },
      { range: '>1.15', count: 0 }
    ];
    
    neighborhoodSales.forEach(sale => {
      const ratio = sale.assessment_ratio;
      
      if (ratio < 0.85) histogramData[0].count++;
      else if (ratio < 0.90) histogramData[1].count++;
      else if (ratio < 0.95) histogramData[2].count++;
      else if (ratio < 1.00) histogramData[3].count++;
      else if (ratio < 1.05) histogramData[4].count++;
      else if (ratio < 1.10) histogramData[5].count++;
      else if (ratio < 1.15) histogramData[6].count++;
      else histogramData[7].count++;
    });
    
    return histogramData;
  };

  return (
    <div className="h-[600px] w-full flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-3/5 h-full relative">
        <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded shadow-md">
          <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2024, 2023, 2022, 2021].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Map
          ref={mapRef}
          mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
          {...viewport}
          width="100%"
          height="100%"
          onViewportChange={setViewport}
          interactiveLayerIds={['neighborhoods-fill']}
          onClick={handleNeighborhoodClick}
        >
          <NavigationControl position="top-right" />
          
          {/* Neighborhoods Layer with sales ratio coloring */}
          <Source id="neighborhoods" type="geojson" data={{ type: 'FeatureCollection', features: enrichedNeighborhoods }}>
            <Layer
              id="neighborhoods-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'median_ratio'],
                  0.85, '#d73027',
                  0.90, '#fc8d59',
                  0.95, '#fee090',
                  1.00, '#ffffbf',
                  1.05, '#e0f3f8',
                  1.10, '#91bfdb',
                  1.15, '#4575b4'
                ],
                'fill-opacity': 0.7
              }}
            />
            <Layer
              id="neighborhoods-outline"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 1
              }}
            />
            <Layer
              id="neighborhoods-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Regular'],
                'text-size': 12
              }}
              paint={{
                'text-color': '#000000',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1
              }}
            />
          </Source>
        </Map>
        
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-md">
          <div className="text-xs">Assessment to Sale Price Ratio</div>
          <div className="flex items-center mt-1">
            <div className="w-full h-4 bg-gradient-to-r from-[#d73027] via-[#ffffbf] to-[#4575b4]"></div>
          </div>
          <div className="flex justify-between text-xs">
            <span>0.85</span>
            <span>1.00</span>
            <span>1.15</span>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-2/5 h-full overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Sales Ratio Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNeighborhood ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedNeighborhood.name}</h3>
                  <p className="text-sm text-gray-500">Neighborhood ID: {selectedNeighborhood.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-3 rounded">
                    <div className="text-sm text-gray-500">Sales Count</div>
                    <div className="text-xl font-bold">{selectedNeighborhood.sales_count}</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <div className="text-sm text-gray-500">Median Ratio</div>
                    <div className="text-xl font-bold">{selectedNeighborhood.median_ratio.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Ratio Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getHistogramData()}>
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Button variant="outline" className="mt-2">Export Neighborhood Report</Button>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-gray-500">Select a neighborhood on the map to view sales ratio analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};`,
      dataRequirements: ['neighborhood-boundaries', 'sales-records', 'assessment-data', 'property-classifications']
    }
  ];

  // Sample code snippets - in production, these would be fetched from your API
  const codeSnippets: CodeSnippet[] = [
    {
      id: 'pacs-api-connection',
      title: 'PACS API Connection Utility',
      description: 'Connect to the Property Assessment and Collection System API',
      language: 'typescript',
      code: `/**
 * PACS API Connection Utility
 * 
 * Establishes a secure connection to the PACS system and handles 
 * authentication and data retrieval.
 */
import axios from 'axios';

export class PACSConnection {
  private baseUrl: string;
  private apiKey: string;
  private authToken: string | null = null;
  
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  /**
   * Authenticate with the PACS API
   */
  public async authenticate(): Promise<boolean> {
    try {
      const response = await axios.post(
        \`\${this.baseUrl}/auth\`, 
        { apiKey: this.apiKey }
      );
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PACS authentication failed:', error);
      return false;
    }
  }
  
  /**
   * Fetch property data from PACS
   */
  public async getProperty(propertyId: string): Promise<any> {
    if (!this.authToken) {
      await this.authenticate();
    }
    
    try {
      const response = await axios.get(
        \`\${this.baseUrl}/properties/\${propertyId}\`,
        {
          headers: {
            'Authorization': \`Bearer \${this.authToken}\`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(\`Failed to fetch property \${propertyId}:\`, error);
      throw new Error('Property data retrieval failed');
    }
  }
  
  /**
   * Fetch assessment history for a property
   */
  public async getAssessmentHistory(propertyId: string): Promise<any[]> {
    if (!this.authToken) {
      await this.authenticate();
    }
    
    try {
      const response = await axios.get(
        \`\${this.baseUrl}/properties/\${propertyId}/assessments\`,
        {
          headers: {
            'Authorization': \`Bearer \${this.authToken}\`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(\`Failed to fetch assessment history for \${propertyId}:\`, error);
      throw new Error('Assessment history retrieval failed');
    }
  }
}`,
      category: 'API Integration',
      tags: ['api', 'pacs', 'connection', 'authentication'],
      usageCount: 27,
      lastUsed: '2025-04-12T14:23:00Z'
    },
    {
      id: 'property-data-validation',
      title: 'Property Data Validation Schema',
      description: 'Zod schema for validating property data from forms and APIs',
      language: 'typescript',
      code: `/**
 * Property Data Validation Schema
 * 
 * Zod schema for validating property data coming from forms and APIs.
 * Specific to Benton County property records.
 */
import { z } from 'zod';

// Regex patterns
const PROPERTY_ID_PATTERN = /^BC[0-9]{5,6}$/;
const TAX_LOT_PATTERN = /^[0-9]{1,2}[A-Z][0-9]{1,2}[A-Z][0-9]{4,6}$/;
const ZONE_CODE_PATTERN = /^[A-Z]{1,3}-[A-Z0-9]{1,3}$/;

// Address schema
export const addressSchema = z.object({
  street: z.string().min(3).max(100),
  city: z.string().min(2).max(50),
  state: z.string().length(2),
  zip: z.string().regex(/^[0-9]{5}(-[0-9]{4})?$/),
  county: z.string().default('Benton')
});

// Owner schema
export const ownerSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['individual', 'business', 'government', 'nonprofit']),
  mailingAddress: addressSchema,
  ownershipPercentage: z.number().min(0).max(100),
  primaryContact: z.string().email().optional()
});

// Improvement schema
export const improvementSchema = z.object({
  improvementId: z.string().min(5).max(20),
  type: z.enum([
    'single family residence',
    'multi-family residence',
    'commercial building',
    'agricultural building',
    'manufactured home',
    'accessory structure',
    'other'
  ]),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()),
  squareFeet: z.number().positive(),
  value: z.number().nonnegative(),
  condition: z.enum(['excellent', 'good', 'average', 'fair', 'poor']),
  features: z.array(z.string()).optional()
});

// Main property schema
export const propertySchema = z.object({
  propertyId: z.string().regex(PROPERTY_ID_PATTERN, 'Invalid property ID format'),
  taxLot: z.string().regex(TAX_LOT_PATTERN, 'Invalid tax lot number'),
  address: addressSchema,
  acres: z.number().positive(),
  zoneCode: z.string().regex(ZONE_CODE_PATTERN, 'Invalid zone code'),
  owners: z.array(ownerSchema).min(1),
  improvements: z.array(improvementSchema).optional(),
  landMarketValue: z.number().nonnegative(),
  lastAssessmentDate: z.string().datetime(),
  inSpecialZone: z.boolean().default(false),
  specialZoneNotes: z.string().optional(),
  exemptions: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    expirationDate: z.string().datetime().optional()
  })).optional()
});

// Validation function for property data
export function validatePropertyData(data: unknown) {
  return propertySchema.safeParse(data);
}

// Partial schema for updates
export const propertyUpdateSchema = propertySchema.partial();

// Export types
export type PropertyAddress = z.infer<typeof addressSchema>;
export type PropertyOwner = z.infer<typeof ownerSchema>;
export type PropertyImprovement = z.infer<typeof improvementSchema>;
export type Property = z.infer<typeof propertySchema>;`,
      category: 'Data Validation',
      tags: ['validation', 'schema', 'zod', 'property'],
      usageCount: 18,
      lastUsed: '2025-04-14T09:45:00Z'
    }
  ];

  // Property assessment specific context interface
  interface PropertyAssessmentContext {
    includePACS: boolean;
    includeRegulations: boolean;
    includeGIS: boolean;
    includeCalculations: boolean;
    county: string;
    state: string;
    domain: string;
    organization: string;
  }
  
  // Function to generate specialized code based on property assessment context
  const generateSpecializedCode = (prompt: string, context: PropertyAssessmentContext): { code: string, message: string, className: string } => {
    const lowercasePrompt = prompt.toLowerCase();
    let code = '';
    let message = '';
    let className = '';
    
    // Extract a class name from the prompt
    const words = prompt.split(/\s+/);
    const nameWords = words.filter(w => w.length > 3 && !['component', 'create', 'build', 'make', 'implement', 'develop'].includes(w.toLowerCase()));
    if (nameWords.length > 0) {
      const baseName = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      className = baseName + 'Component';
    } else {
      className = 'PropertyComponent';
    }
    
    // Generate specialized imports based on context
    let imports = `import React, { useState } from 'react';\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\nimport { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\n`;
    
    if (context.includeGIS) {
      imports += `import { Map, NavigationControl, Source, Layer } from 'react-map-gl';\n`;
    }
    
    if (context.includeCalculations) {
      imports += `import { Calculator } from 'lucide-react';\nimport { AssessmentCalculator } from "@/utils/assessment-calculator";\n`;
    }
    
    if (lowercasePrompt.includes('search') || lowercasePrompt.includes('lookup') || lowercasePrompt.includes('find')) {
      code = generatePropertySearchComponent(imports, className, context);
      message = `I've created a specialized property search component for ${context.county} that incorporates ${context.includeRegulations ? 'assessment regulations, ' : ''}${context.includeGIS ? 'GIS mapping capabilities, ' : ''}${context.includePACS ? 'PACS integration, ' : ''}and ${context.includeCalculations ? 'assessment calculations' : 'basic search functionality'}.`;
    } else if (lowercasePrompt.includes('dashboard') || lowercasePrompt.includes('analytics') || lowercasePrompt.includes('overview')) {
      code = generatePropertyDashboardComponent(imports, className, context);
      message = `I've created a property assessment dashboard optimized for ${context.county} assessors that includes ${context.includeGIS ? 'interactive maps, ' : ''}${context.includeCalculations ? 'value analysis charts, ' : ''}and ${context.includePACS ? 'direct PACS data integration' : 'assessment data visualization'}.`;
    } else if (lowercasePrompt.includes('map') || lowercasePrompt.includes('gis') || lowercasePrompt.includes('spatial')) {
      code = generatePropertyMapComponent(imports, className, context);
      message = `I've created a specialized property mapping component for ${context.county} that integrates with GIS systems${context.includePACS ? ', connects to PACS data' : ''}${context.includeCalculations ? ', and displays value calculations' : ''}.`;
    } else if (lowercasePrompt.includes('calculation') || lowercasePrompt.includes('value') || lowercasePrompt.includes('assessment')) {
      code = generatePropertyCalculationComponent(imports, className, context);
      message = `I've created a property value calculator specific to ${context.county}'s assessment methodologies${context.includeRegulations ? ' that adheres to Washington State regulations' : ''}.`;
    } else {
      // Default to a property detail component
      code = generatePropertyDetailComponent(imports, className, context);
      message = `I've created a property detail component for ${context.county} Assessor's Office that displays comprehensive property information.`;
    }
    
    return { code, message, className };
  };
  
  // Helper function to generate a property search component
  const generatePropertySearchComponent = (imports: string, className: string, context: PropertyAssessmentContext): string => {
    return `${imports}
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

/**
 * ${className}
 * 
 * A specialized property search interface for ${context.county} Assessor's Office.
 * This component provides comprehensive search capabilities for property records.
 */
export const ${className}: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'address' | 'owner' | 'taxlot'>('address');
  const [results, setResults] = useState<any[]>([]);

  // Query to fetch property results
  const { isLoading, refetch } = useQuery({
    queryKey: ['/api/properties/search', searchType, searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const response = await fetch(
        \`/api/properties/search?\${searchType}=\${encodeURIComponent(searchTerm)}\`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch property data');
      }
      
      const data = await response.json();
      setResults(data);
      return data;
    },
    enabled: false // Don't run automatically, wait for user to click search
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      refetch();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">${context.county} Property Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Enter search term..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-2 py-1 border rounded-md"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
              >
                <option value="address">Address</option>
                <option value="owner">Owner Name</option>
                <option value="taxlot">Tax Lot ID</option>
              </select>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          
          {isLoading && <p className="text-sm text-gray-500">Searching property records...</p>}
          
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Search Results</h3>
              <div className="border rounded-md overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessed Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setPropertyData(item)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item?.propertyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item?.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item?.ownerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item?.assessedValue?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {results.length === 0 && !isLoading && searchTerm && (
            <p className="text-center py-4 text-gray-500">No properties found matching your search criteria.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};`;
  };
  
  // Handle form submission for AI assistant
  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      generateCodeMutation.mutate(inputValue);
    }
  };
  
  // Mutation for generating code from AI assistant
  const generateCodeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsGenerating(true);
      try {
        // Get specialized property assessment contexts
        const contextPACS = document.getElementById('context-pacs') as HTMLInputElement;
        const contextRegulations = document.getElementById('context-regulations') as HTMLInputElement;
        const contextGIS = document.getElementById('context-gis') as HTMLInputElement;
        const contextCalculations = document.getElementById('context-calculations') as HTMLInputElement;
        
        // Build specialized context for Benton County property assessment
        const specializedContext: PropertyAssessmentContext = {
          includePACS: contextPACS?.checked || false,
          includeRegulations: contextRegulations?.checked || false,
          includeGIS: contextGIS?.checked || false,
          includeCalculations: contextCalculations?.checked || false,
          county: 'Benton County',
          state: 'Washington',
          domain: 'property-assessment',
          organization: 'Benton County Assessor\'s Office'
        };
        
        // In a real implementation, this would call your AI service with the specialized context
        // Simulating AI response with a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result = generateSpecializedCode(prompt, specializedContext);
        
        return {
          code: result.code,
          message: result.message,
          className: result.className
        };
      } catch (error) {
        console.error('Error generating specialized code:', error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      setOutputCode(data.code);
      setAssistantHistory([
        ...assistantHistory, 
        { role: 'user', content: inputValue },
        { role: 'assistant', content: data.message }
      ]);
      setInputValue('');
      
      // If this is a new component, add it to our generated components list
      if (data.className && data.code) {
        const newComponent = {
          id: `component-${Date.now()}`,
          name: data.className,
          code: data.code,
          prompt: inputValue,
          timestamp: new Date().toISOString()
        };
        setGeneratedComponents(prev => [...prev, newComponent]);
      }
      
      toast({
        title: 'Code generated successfully',
        description: 'Your specialized Benton County property assessment component is ready to use.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate code',
        description: 'There was an error generating your code. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Helper functions to generate additional component types
  const generatePropertyDetailComponent = (imports: string, className: string, context: PropertyAssessmentContext): string => {
    return `${imports}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * ${className}
 * 
 * A comprehensive property detail component for ${context.county} Assessor's Office.
 * Displays property information, ownership history, and assessment details.
 */
export const ${className}: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const { data: propertyData, isLoading, error } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: async () => {
      const response = await fetch(\`/api/properties/\${propertyId}\`);
      if (!response.ok) throw new Error('Failed to fetch property details');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-4 text-center">Loading property details...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading property details</div>;
  if (!propertyData) return <div className="p-4 text-center">Property not found</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{propertyData.address}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Property Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Property ID:</span>
                  <span className="font-medium">{propertyData.propertyId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Lot:</span>
                  <span className="font-medium">{propertyData.taxLot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zoning:</span>
                  <span className="font-medium">{propertyData.zoning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Land Area:</span>
                  <span className="font-medium">{propertyData.acres} acres</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Assessment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Assessed Value:</span>
                  <span className="font-medium">${propertyData?.assessedValue?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Land Value:</span>
                  <span className="font-medium">${propertyData?.landValue?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Improvement Value:</span>
                  <span className="font-medium">${(propertyData?.assessedValue && propertyData?.landValue) ? 
                    (propertyData.assessedValue - propertyData.landValue).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Assessment:</span>
                  <span className="font-medium">{propertyData?.lastAssessmentDate ? 
                    new Date(propertyData.lastAssessmentDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="ownership" className="mt-6">
            <TabsList>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="history">Assessment History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ownership" className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Current Owner</h3>
                </div>
                <div className="border rounded-md p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{propertyData?.ownerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Owner Since:</span>
                      <span className="font-medium">{propertyData?.ownerSince || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mailing Address:</span>
                      <span className="font-medium">{propertyData?.mailingAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="improvements" className="pt-4">
              {propertyData.improvements?.length > 0 ? (
                <div className="space-y-4">
                  {propertyData.improvements.map((improvement, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{improvement?.type || 'Unknown'}</h4>
                          <span className="text-sm text-gray-500">Built {improvement?.yearBuilt || 'N/A'}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Square Feet:</span>
                            <span>{improvement?.squareFeet || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Value:</span>
                            <span>${improvement?.value?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Condition:</span>
                            <span>{improvement?.condition || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No improvements recorded for this property.</p>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="pt-4">
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Land Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {propertyData.assessmentHistory?.map((assessment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{assessment?.year || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${assessment?.value?.toLocaleString() || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${assessment?.value ? (assessment.value * 0.4).toLocaleString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">${assessment?.value ? (assessment.value * 0.6).toLocaleString() : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {assessment?.percentChange ? (
                            assessment.percentChange > 0 ? (
                              <span className="text-green-600">+{assessment.percentChange}%</span>
                            ) : (
                              <span className="text-red-600">{assessment.percentChange}%</span>
                            )
                          ) : (
                            <span>0%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};`;
  };
  
  const generatePropertyMapComponent = (imports: string, className: string, context: PropertyAssessmentContext): string => {
    return `${imports}
import { useRef, useState, useEffect } from 'react';
import { Map, NavigationControl, Source, Layer } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Layers } from 'lucide-react';

/**
 * ${className}
 * 
 * An interactive property map component for ${context.county} Assessor's Office
 * that displays property boundaries and assessment information.
 */
export const ${className}: React.FC = () => {
  const mapRef = useRef(null);
  const [viewport, setViewport] = useState({
    longitude: -119.25, // Benton County approximate center
    latitude: 46.25,
    zoom: 11
  });
  const [selectedParcelDetails, setSelectedParcelDetails] = useState<any>(null);
  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapStyle, setMapStyle] = useState('streets-v11');
  
  // Load parcel data on component mount
  useEffect(() => {
    async function loadParcels() {
      try {
        const response = await fetch('/api/gis/parcels');
        if (response.ok) {
          const data = await response.json();
          setParcels(data);
        }
      } catch (error) {
        console.error('Error loading parcel data:', error);
      }
    }
    
    loadParcels();
  }, []);
  
  const handleParcelClick = (event: any) => {
    if (event.features && event.features.length > 0) {
      const parcel = event.features[0];
      setSelectedParcelDetails(parcel.properties);
      
      // Center map on clicked parcel
      if (parcel.geometry?.coordinates) {
        const [lng, lat] = getCenterFromPolygon(parcel.geometry.coordinates);
        setViewport((prev: any) => ({
          ...prev,
          longitude: lng,
          latitude: lat
        }));
      }
    }
  };
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const response = await fetch(\`/api/properties/search?address=\${encodeURIComponent(searchTerm)}\`);
      if (response.ok) {
        const results = await response.json();
        if (results.length > 0) {
          // Find corresponding parcel
          const property = results[0];
          const parcel = parcels.find((p: any) => p.properties.property_id === property.propertyId);
          
          if (parcel) {
            setSelectedParcelDetails(parcel.properties);
            
            // Center and zoom to the parcel
            if (parcel.geometry?.coordinates) {
              const [lng, lat] = getCenterFromPolygon(parcel.geometry.coordinates);
              setViewport({
                longitude: lng,
                latitude: lat,
                zoom: 15
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching for property:', error);
    }
  };
  
  // Helper to calculate center point of a polygon
  const getCenterFromPolygon = (coordinates: any[]) => {
    // Simple centroid calculation - could be improved for complex polygons
    let lng = 0, lat = 0, count = 0;
    
    // Handle different geometry types
    if (Array.isArray(coordinates[0]) && !isNaN(coordinates[0][0])) {
      // It's a simple polygon
      coordinates.forEach(coord => {
        lng += coord[0];
        lat += coord[1];
        count++;
      });
    } else if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
      // It's a polygon with holes or a multipolygon
      coordinates[0].forEach(coord => {
        lng += coord[0];
        lat += coord[1];
        count++;
      });
    }
    
    return [lng / count, lat / count];
  };
  
  return (
    <div className="h-[600px] w-full flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-2/3 h-full relative">
        <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded shadow-md">
          <div className="flex space-x-2">
            <Input 
              placeholder="Search property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-48 md:w-64"
            />
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-white p-2 rounded shadow-md flex space-x-2">
            <Button 
              size="sm" 
              variant={mapStyle === 'streets-v11' ? 'default' : 'outline'}
              onClick={() => setMapStyle('streets-v11')}
            >
              Streets
            </Button>
            <Button 
              size="sm" 
              variant={mapStyle === 'satellite-v9' ? 'default' : 'outline'}
              onClick={() => setMapStyle('satellite-v9')}
            >
              Satellite
            </Button>
          </div>
        </div>
        
        <Map
          ref={mapRef}
          mapboxApiAccessToken={process.env.MAPBOX_TOKEN || 'pk.public.token'}
          mapStyle={\`mapbox://styles/mapbox/\${mapStyle}\`}
          {...viewport}
          width="100%"
          height="100%"
          onViewportChange={setViewport}
          interactiveLayerIds={['parcels-fill']}
          onClick={handleParcelClick}
        >
          <NavigationControl position="bottom-right" />
          
          {/* Parcel boundaries layer */}
          <Source id="parcels" type="geojson" data={{ type: 'FeatureCollection', features: parcels }}>
            <Layer
              id="parcels-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['==', ['get', 'property_id'], selectedParcelDetails?.property_id],
                  '#4d7cfe',
                  '#0080ff33'
                ],
                'fill-opacity': 0.6
              }}
            />
            <Layer
              id="parcels-line"
              type="line"
              paint={{
                'line-color': '#0080ff',
                'line-width': [
                  'case',
                  ['==', ['get', 'property_id'], selectedParcelDetails?.property_id],
                  2,
                  0.5
                ]
              }}
            />
          </Source>
        </Map>
      </div>
      
      <div className="w-full md:w-1/3 h-full overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Parcel Information</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedParcelDetails ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Property ID</h3>
                  <p>{selectedParcelDetails?.property_id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Owner</h3>
                  <p>{selectedParcelDetails?.owner_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p>{selectedParcelDetails?.site_address}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Zoning</h3>
                  <p>{selectedParcelDetails?.zoning}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Assessed Value</h3>
                  <p>\${selectedParcelDetails?.assessed_value?.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Land Area</h3>
                  <p>{selectedParcelDetails?.acres?.toFixed(2)} acres</p>
                </div>
                <div>
                  <h3 className="font-semibold">Tax Status</h3>
                  <p>{selectedParcelDetails?.tax_status}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a parcel to view details</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};`;
  };
  
  const generatePropertyDashboardComponent = (imports: string, className: string, context: PropertyAssessmentContext): string => {
    return `${imports}
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart2, PieChart, MapPin, TrendingUp, Filter } from 'lucide-react';

/**
 * ${className}
 * 
 * A comprehensive property assessment dashboard for ${context.county} Assessor's Office
 * that provides analytics and visualizations of assessment data.
 */
export const ${className}: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAssessmentData() {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from your API
        const response = await fetch(\`/api/assessments/statistics?year=\${selectedYear}&district=\${selectedDistrict}\`);
        if (response.ok) {
          const data = await response.json();
          setAssessmentData(data);
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAssessmentData();
  }, [selectedYear, selectedDistrict]);
  
  // Sample data for demonstration - would be replaced with real data
  const yearlyValueTrends = [
    { year: '2020', residentialValue: 2450000000, commercialValue: 980000000, agriculturalValue: 340000000 },
    { year: '2021', residentialValue: 2650000000, commercialValue: 1020000000, agriculturalValue: 360000000 },
    { year: '2022', residentialValue: 2900000000, commercialValue: 1080000000, agriculturalValue: 380000000 },
    { year: '2023', residentialValue: 3100000000, commercialValue: 1150000000, agriculturalValue: 395000000 },
    { year: '2024', residentialValue: 3350000000, commercialValue: 1210000000, agriculturalValue: 410000000 },
    { year: '2025', residentialValue: 3650000000, commercialValue: 1290000000, agriculturalValue: 430000000 },
  ];
  
  const propertyTypeDistribution = [
    { name: 'Residential', value: 72 },
    { name: 'Commercial', value: 15 },
    { name: 'Agricultural', value: 8 },
    { name: 'Industrial', value: 3 },
    { name: 'Other', value: 2 },
  ];
  
  const medianValues = [
    { district: 'North', value: 425000 },
    { district: 'South', value: 380000 },
    { district: 'East', value: 410000 },
    { district: 'West', value: 450000 },
    { district: 'Central', value: 490000 },
  ];
  
  // Format currency values for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">${context.county} Assessment Dashboard</h1>
          <p className="text-gray-500">Comprehensive property assessment analytics and trends</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {['2020', '2021', '2022', '2023', '2024', '2025'].map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              <SelectItem value="north">North District</SelectItem>
              <SelectItem value="south">South District</SelectItem>
              <SelectItem value="east">East District</SelectItem>
              <SelectItem value="west">West District</SelectItem>
              <SelectItem value="central">Central District</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Assessed Value</p>
              <p className="text-3xl font-bold">{formatCurrency(3650000000)}</p>
              <p className="text-xs text-green-500 mt-1">▲ 8.9% from previous year</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Properties Assessed</p>
              <p className="text-3xl font-bold">42,567</p>
              <p className="text-xs text-gray-500 mt-1">▲ 1.2% from previous year</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Median Property Value</p>
              <p className="text-3xl font-bold">{formatCurrency(425000)}</p>
              <p className="text-xs text-green-500 mt-1">▲ 5.7% from previous year</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Appeals Rate</p>
              <p className="text-3xl font-bold">1.7%</p>
              <p className="text-xs text-red-500 mt-1">▼ 0.3% from previous year</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Value Trends
          </TabsTrigger>
          <TabsTrigger value="district" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            District Analysis
          </TabsTrigger>
          <TabsTrigger value="property-types" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Property Types
          </TabsTrigger>
          <TabsTrigger value="market-trends" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Assessed Value Trends by Property Type</CardTitle>
              <CardDescription>Historical assessment values from 2020-2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyValueTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => \`\$\${(value / 1000000000).toFixed(1)}B\`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="residentialValue" name="Residential" stackId="a" fill="#8884d8" />
                    <Bar dataKey="commercialValue" name="Commercial" stackId="a" fill="#82ca9d" />
                    <Bar dataKey="agriculturalValue" name="Agricultural" stackId="a" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="district" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Median Property Values by District</CardTitle>
              <CardDescription>2025 assessment data comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={medianValues}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => \`\$\${(value / 1000).toFixed(0)}K\`} />
                    <YAxis type="category" dataKey="district" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" name="Median Value" fill="#6992f3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="property-types" className="pt-6">
          {/* Property type distribution visualization would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Property Type Distribution</CardTitle>
              <CardDescription>Percentage breakdown by property classification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {/* Pie chart would go here */}
                <div className="flex h-full items-center justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
                    {propertyTypeDistribution.map((item) => (
                      <Card key={item.name}>
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl font-bold">{item.value}%</div>
                          <div className="text-sm text-gray-500 mt-1">{item.name}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="market-trends" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Value to Assessed Value Ratio</CardTitle>
              <CardDescription>Analysis of assessment accuracy relative to market prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { year: '2020', ratio: 0.92 },
                      { year: '2021', ratio: 0.94 },
                      { year: '2022', ratio: 0.97 },
                      { year: '2023', ratio: 0.99 },
                      { year: '2024', ratio: 0.98 },
                      { year: '2025', ratio: 0.96 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0.85, 1.05]} ticks={[0.85, 0.9, 0.95, 1.0, 1.05]} tickFormatter={(value) => value.toFixed(2)} />
                    <Tooltip formatter={(value) => value.toFixed(2)} />
                    <Legend />
                    <Line type="monotone" dataKey="ratio" name="Assessment Ratio" stroke="#ff7300" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="" name="Target (1.0)" stroke="#82ca9d" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};`;
  };
  
  const generatePropertyCalculationComponent = (imports: string, className: string, context: PropertyAssessmentContext): string => {
    const code = imports + '\n' +
    'import { useState } from \'react\';\n' +
    'import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";\n' +
    'import { Input } from "@/components/ui/input";\n' +
    'import { Button } from "@/components/ui/button";\n' +
    'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n' +
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n' +
    'import { Calculator, Home, Building, Warehouse, Factory, FileText } from \'lucide-react\';\n' +
    'import { Separator } from "@/components/ui/separator";\n\n' +
    '/**\n' +
    ' * ' + className + '\n' +
    ' * \n' +
    ' * A specialized property value calculator for ' + context.county + ' Assessor\'s Office\n' +
    ' * that implements the Computer Assisted Mass Appraisal (CAMA) methodology.\n' +
    ' */\n' +
    'export const ' + className + ': React.FC = () => {\n' +
    '  // Component implementation will go here\n' +
    '  return (\n' +
    '    <div>Property Assessment Calculator Implementation</div>\n' +
    '  );\n' +
    '};\n';
    
    return code;

// Moved PropertyAssessmentCalculator definition to generated code
const ExamplePropertyCalculator = () => {
  const [activeTab, setActiveTab] = useState('residential');
  const [calculationResults, setCalculationResults] = useState<any>(null);
  
  // Residential property state
  const [residentialInputs, setResidentialInputs] = useState({
    landSquareFeet: 10000,
    landValuePerSqFt: 12,
    buildingSquareFeet: 2200,
    yearBuilt: 2000,
    quality: 'average',
    bedrooms: 3,
    bathrooms: 2,
    stories: 1,
    hasGarage: true,
    hasDeck: false,
    hasPool: false,
    neighborhood: 'average',
  });
  
  // Commercial property state
  const [commercialInputs, setCommercialInputs] = useState({
    landSquareFeet: 20000,
    landValuePerSqFt: 20,
    buildingSquareFeet: 5000,
    yearBuilt: 2005,
    buildingType: 'retail',
    stories: 1,
    condition: 'good',
    location: 'suburban',
    parking: true,
    loadingDock: false,
  });
  
  // Calculate residential property value
  const calculateResidentialValue = () => {
    // Land value calculation
    const landValue = residentialInputs.landSquareFeet * residentialInputs.landValuePerSqFt;
    
    // Base building value
    let baseBuildingValue = residentialInputs.buildingSquareFeet * 150; // Base rate per square foot
    
    // Adjust for quality
    const qualityMultipliers = {
      'low': 0.8,
      'below-average': 0.9,
      'average': 1.0,
      'above-average': 1.2,
      'high': 1.5,
      'luxury': 2.0
    };
    baseBuildingValue *= qualityMultipliers[residentialInputs.quality] || 1.0;
    
    // Age adjustment
    const effectiveAge = new Date().getFullYear() - residentialInputs.yearBuilt;
    const ageDepreciation = Math.min(0.5, effectiveAge * 0.01); // Maximum 50% depreciation
    baseBuildingValue *= (1 - ageDepreciation);
    
    // Features adjustments
    const featureValues = {
      bedrooms: (residentialInputs.bedrooms - 2) * 10000, // Adjustment for bedrooms over/under 2
      bathrooms: (residentialInputs.bathrooms - 1.5) * 15000, // Adjustment for bathrooms over/under 1.5
      stories: (residentialInputs.stories - 1) * 20000, // Adjustment for multi-story
      garage: residentialInputs.hasGarage ? 30000 : 0,
      deck: residentialInputs.hasDeck ? 15000 : 0,
      pool: residentialInputs.hasPool ? 50000 : 0
    };
    
    // Calculate features total (can't go negative)
    const featuresAdjustment = Object.values(featureValues).reduce((sum, value) => sum + value, 0);
    
    // Neighborhood adjustment
    const neighborhoodMultipliers = {
      'low': 0.7,
      'below-average': 0.85,
      'average': 1.0,
      'above-average': 1.3,
      'high': 1.6
    };
    const neighborhoodAdjustment = neighborhoodMultipliers[residentialInputs.neighborhood] || 1.0;
    
    // Calculate total improvements value
    const improvementsValue = (baseBuildingValue + Math.max(0, featuresAdjustment)) * neighborhoodAdjustment;
    
    // Total value is land + improvements
    const totalValue = landValue + improvementsValue;
    
    // Return detailed breakdown
    setCalculationResults({
      landValue: Math.round(landValue),
      improvementsValue: Math.round(improvementsValue),
      totalValue: Math.round(totalValue),
      details: {
        landArea: residentialInputs.landSquareFeet,
        landRatePerSqFt: residentialInputs.landValuePerSqFt,
        buildingArea: residentialInputs.buildingSquareFeet,
        qualityFactor: qualityMultipliers[residentialInputs.quality],
        ageDepreciationFactor: (1 - ageDepreciation).toFixed(2),
        neighborhoodFactor: neighborhoodAdjustment.toFixed(2),
        baseBuildingValue: Math.round(baseBuildingValue),
        featuresAdjustment: Math.round(featuresAdjustment)
      }
    });
  };
  
  // Calculate commercial property value
  const calculateCommercialValue = () => {
    // Land value calculation
    const landValue = commercialInputs.landSquareFeet * commercialInputs.landValuePerSqFt;
    
    // Base building value
    const buildingTypeRates = {
      'retail': 180,
      'office': 200,
      'industrial': 120,
      'warehouse': 100,
      'mixed-use': 190
    };
    let baseBuildingValue = commercialInputs.buildingSquareFeet * 
                           (buildingTypeRates[commercialInputs.buildingType] || 180);
    
    // Condition adjustment
    const conditionMultipliers = {
      'poor': 0.7,
      'fair': 0.85,
      'average': 1.0,
      'good': 1.15,
      'excellent': 1.3
    };
    baseBuildingValue *= conditionMultipliers[commercialInputs.condition] || 1.0;
    
    // Age adjustment
    const effectiveAge = new Date().getFullYear() - commercialInputs.yearBuilt;
    const ageDepreciation = Math.min(0.6, effectiveAge * 0.015); // Maximum 60% depreciation
    baseBuildingValue *= (1 - ageDepreciation);
    
    // Location adjustment
    const locationMultipliers = {
      'rural': 0.7,
      'suburban': 1.0,
      'urban': 1.3,
      'prime': 1.8
    };
    const locationAdjustment = locationMultipliers[commercialInputs.location] || 1.0;
    
    // Feature adjustments
    const featureValues = {
      stories: (commercialInputs.stories - 1) * 0.05 * baseBuildingValue, // adjustment per story
      parking: commercialInputs.parking ? 0.1 * baseBuildingValue : 0,
      loadingDock: commercialInputs.loadingDock ? 0.07 * baseBuildingValue : 0
    };
    
    // Calculate features total
    const featuresAdjustment = Object.values(featureValues).reduce((sum, value) => sum + value, 0);
    
    // Calculate total improvements value
    const improvementsValue = (baseBuildingValue + featuresAdjustment) * locationAdjustment;
    
    // Total value is land + improvements
    const totalValue = landValue + improvementsValue;
    
    // Return detailed breakdown
    setCalculationResults({
      landValue: Math.round(landValue),
      improvementsValue: Math.round(improvementsValue),
      totalValue: Math.round(totalValue),
      details: {
        landArea: commercialInputs.landSquareFeet,
        landRatePerSqFt: commercialInputs.landValuePerSqFt,
        buildingArea: commercialInputs.buildingSquareFeet,
        buildingType: commercialInputs.buildingType,
        ratePerSqFt: buildingTypeRates[commercialInputs.buildingType],
        conditionFactor: conditionMultipliers[commercialInputs.condition],
        ageDepreciationFactor: (1 - ageDepreciation).toFixed(2),
        locationFactor: locationAdjustment.toFixed(2),
        baseBuildingValue: Math.round(baseBuildingValue),
        featuresAdjustment: Math.round(featuresAdjustment)
      }
    });
  };
  
  const handleCalculate = () => {
    if (activeTab === 'residential') {
      calculateResidentialValue();
    } else if (activeTab === 'commercial') {
      calculateCommercialValue();
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-amber-500" />
            Property Assessment Calculator
          </CardTitle>
          <CardDescription>
            {context.county} Computer Assisted Mass Appraisal (CAMA) model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="residential" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="residential" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                Residential
              </TabsTrigger>
              <TabsTrigger value="commercial" className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Commercial
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="residential">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Property Characteristics</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Land Area (sq ft)</label>
                        <Input
                          type="number"
                          value={residentialInputs.landSquareFeet}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            landSquareFeet: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Land Value (per sq ft)</label>
                        <Input
                          type="number"
                          value={residentialInputs.landValuePerSqFt}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            landValuePerSqFt: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Building Area (sq ft)</label>
                        <Input
                          type="number"
                          value={residentialInputs.buildingSquareFeet}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            buildingSquareFeet: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Year Built</label>
                        <Input
                          type="number"
                          value={residentialInputs.yearBuilt}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            yearBuilt: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Quality</label>
                        <Select
                          value={residentialInputs.quality}
                          onValueChange={(value) => setResidentialInputs({
                            ...residentialInputs,
                            quality: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="below-average">Below Average</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="above-average">Above Average</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Neighborhood</label>
                        <Select
                          value={residentialInputs.neighborhood}
                          onValueChange={(value) => setResidentialInputs({
                            ...residentialInputs,
                            neighborhood: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select neighborhood" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Value Area</SelectItem>
                            <SelectItem value="below-average">Below Average Area</SelectItem>
                            <SelectItem value="average">Average Area</SelectItem>
                            <SelectItem value="above-average">Above Average Area</SelectItem>
                            <SelectItem value="high">High Value Area</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                        <Input
                          type="number"
                          value={residentialInputs.bedrooms}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            bedrooms: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                        <Input
                          type="number"
                          value={residentialInputs.bathrooms}
                          step="0.5"
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            bathrooms: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Stories</label>
                        <Input
                          type="number"
                          value={residentialInputs.stories}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            stories: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasGarage"
                          checked={residentialInputs.hasGarage}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            hasGarage: e.target.checked
                          })}
                        />
                        <label htmlFor="hasGarage">Garage</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasDeck"
                          checked={residentialInputs.hasDeck}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            hasDeck: e.target.checked
                          })}
                        />
                        <label htmlFor="hasDeck">Deck/Patio</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasPool"
                          checked={residentialInputs.hasPool}
                          onChange={(e) => setResidentialInputs({
                            ...residentialInputs,
                            hasPool: e.target.checked
                          })}
                        />
                        <label htmlFor="hasPool">Swimming Pool</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="commercial">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Property Characteristics</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Land Area (sq ft)</label>
                        <Input
                          type="number"
                          value={commercialInputs.landSquareFeet}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            landSquareFeet: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Land Value (per sq ft)</label>
                        <Input
                          type="number"
                          value={commercialInputs.landValuePerSqFt}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            landValuePerSqFt: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Building Area (sq ft)</label>
                        <Input
                          type="number"
                          value={commercialInputs.buildingSquareFeet}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            buildingSquareFeet: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Year Built</label>
                        <Input
                          type="number"
                          value={commercialInputs.yearBuilt}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            yearBuilt: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Building Type</label>
                        <Select
                          value={commercialInputs.buildingType}
                          onValueChange={(value) => setCommercialInputs({
                            ...commercialInputs,
                            buildingType: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="mixed-use">Mixed Use</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Condition</label>
                        <Select
                          value={commercialInputs.condition}
                          onValueChange={(value) => setCommercialInputs({
                            ...commercialInputs,
                            condition: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="excellent">Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <Select
                          value={commercialInputs.location}
                          onValueChange={(value) => setCommercialInputs({
                            ...commercialInputs,
                            location: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rural">Rural</SelectItem>
                            <SelectItem value="suburban">Suburban</SelectItem>
                            <SelectItem value="urban">Urban</SelectItem>
                            <SelectItem value="prime">Prime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Stories</label>
                        <Input
                          type="number"
                          value={commercialInputs.stories}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            stories: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="parking"
                          checked={commercialInputs.parking}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            parking: e.target.checked
                          })}
                        />
                        <label htmlFor="parking">Parking Area</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="loadingDock"
                          checked={commercialInputs.loadingDock}
                          onChange={(e) => setCommercialInputs({
                            ...commercialInputs,
                            loadingDock: e.target.checked
                          })}
                        />
                        <label htmlFor="loadingDock">Loading Dock</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <div className="mt-6">
              <Button onClick={handleCalculate} className="w-full md:w-auto">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Assessed Value
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {calculationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>
              CAMA assessment results based on {context.county} methodology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-1">Land Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculationResults.landValue)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-1">Improvements Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculationResults.improvementsValue)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Assessed Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculationResults.totalValue)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-4">Calculation Breakdown</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(calculationResults.details).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                      <div className="font-medium">
                        {typeof value === 'number' && value > 100 
                          ? formatCurrency(value) 
                          : value}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    This assessment follows {context.county} appraisal methodologies
                    {context.includeRegulations && ' and Washington State assessment regulations'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

  // Handle adding a template to the project
  const handleAddTemplate = (template: DevelopmentTemplate) => {
    setOutputCode(template.templateCode);
    toast({
      title: 'Template Added',
      description: 'Template has been loaded into the editor'
    });
  };

  // Handle adding a snippet to the project
  const handleAddSnippet = (snippet: CodeSnippet) => {
    setOutputCode(snippet.code);
    toast({
      title: 'Snippet Added',
      description: 'Snippet has been loaded into the editor'
    });
  };
  
  // Select model
  const handleSelectModel = (model: PropertyModel) => {
    setSelectedModel(model);
    // Create a simplified static model context instead of using template literals
    const modelContextCode = "/**\n" +
      " * " + model.name + " Model Interface\n" +
      " *\n" +
      " * Benton County Assessor's Office\n" +
      " * This model defines the structure for properties\n" +
      " */\n" +
      "export interface " + model.name + " {\n" +
      "  id: string;\n" +
      "  propertyId: string;\n" +
      "  address: string;\n" +
      "  ownerName: string;\n" +
      "  assessedValue: number;\n" +
      "  // Additional fields would be included here\n" +
      "}";
    
    setCodeContext(modelContextCode);
    toast({
      title: 'Model Selected',
      description: 'Model details have been loaded'
    });
  };
  
  // Generate a full application
  const generateFullApplication = () => {
    setApplicationParts([
      'PropertySearchComponent', 
      'PropertyDetailView', 
      'AssessmentHistoryChart',
      'TaxLotMapViewer',
      'ComparablePropertiesPanel',
      'PropertyDataExport'
    ]);
    setProjectContext("Project: Benton County Property Assessment Tool\n" +
      "Domain: Tax Assessment\n" +
      "Features:\n" +
      "- Property search and lookup\n" +
      "- Assessment history visualization\n" +
      "- Comparable properties analysis\n" +
      "- Tax lot mapping and visualization\n" +
      "- Data export and reporting tools\n" +
      "- Integration with PACS and GIS systems\n\n" +
      "Tech Stack:\n" +
      "- React + TypeScript frontend\n" +
      "- Node.js + Express backend\n" +
      "- PostgreSQL database\n" +
      "- Mapping via Leaflet/ArcGIS");
    toast({
      title: 'Application Structure Generated',
      description: 'Property assessment application structure has been outlined'
    });
  };

  // Utility function to extract component name from code
  const getComponentNameFromCode = (code: string): string => {
    try {
      // Try to extract the component name using regex
      const match = code.match(/export (?:const|function) ([A-Za-z0-9_]+)/);
      return match ? match[1] : '';
    } catch (e) {
      return '';
    }
  };
  
  // Copy the code to clipboard
  const handleCopyCode = () => {
    if (outputCode && navigator.clipboard) {
      navigator.clipboard.writeText(outputCode)
        .then(() => {
          toast({
            title: 'Code copied to clipboard',
            description: 'The generated code has been copied to your clipboard.'
          });
        })
        .catch((err) => {
          console.error('Failed to copy code:', err);
          toast({
            title: 'Failed to copy code',
            description: 'There was an error copying the code to your clipboard.',
            variant: 'destructive'
          });
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Benton County Code Assistant</h2>
          <p className="text-gray-500">
            Specialized development tools for property assessment applications
          </p>
        </div>
      </div>

      <Tabs defaultValue="assistant" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="assistant" className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileCode className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="snippets">
            <Code className="mr-2 h-4 w-4" />
            Snippets
          </TabsTrigger>
          <TabsTrigger value="models">
            <Database className="mr-2 h-4 w-4" />
            Data Models
          </TabsTrigger>
          <TabsTrigger value="generator">
            <Sparkles className="mr-2 h-4 w-4" />
            App Generator
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center bg-amber-100">
            <Cpu className="mr-2 h-4 w-4" />
            Developer
          </TabsTrigger>
        </TabsList>

        {/* AI Assistant Tab */}
        <TabsContent value="assistant">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  Property Assessment Code Assistant
                </CardTitle>
                <CardDescription>
                  Specialized AI assistant for Benton County property assessment development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col h-[400px]">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {assistantHistory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">How can I help you?</p>
                          <p className="text-sm mt-1">Ask me to create property assessment components or utilities</p>
                          <div className="mt-6 grid grid-cols-2 gap-3">
                            <Button variant="outline" className="text-sm justify-start" onClick={() => setInputValue("Create a property search component with address autocomplete")}>
                              <Search className="h-4 w-4 mr-2" />
                              Property search component
                            </Button>
                            <Button variant="outline" className="text-sm justify-start" onClick={() => setInputValue("Build a PACS data import utility")}>
                              <Upload className="h-4 w-4 mr-2" />
                              PACS data import utility
                            </Button>
                            <Button variant="outline" className="text-sm justify-start" onClick={() => setInputValue("Generate a tax lot mapping component")}>
                              <Map className="h-4 w-4 mr-2" />
                              Tax lot mapping component
                            </Button>
                            <Button variant="outline" className="text-sm justify-start" onClick={() => setInputValue("Create a property valuation calculator")}>
                              <Calculator className="h-4 w-4 mr-2" />
                              Property valuation calculator
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {assistantHistory.map((message, index) => (
                        <div 
                          key={index} 
                          className={"flex " + (message.role === 'user' ? 'justify-end' : 'justify-start')}
                        >
                          <div 
                            className={"max-w-[80%] rounded-lg p-3 " + 
                              (message.role === 'user' 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 dark:bg-gray-800')
                            }
                          >
                            {message.role === 'user' ? (
                              <div className="flex items-start">
                                <div className="mr-2 mt-0.5 h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-semibold">
                                  Y
                                </div>
                                <div>
                                  <p>{message.content}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start">
                                <div className="mr-2 mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Brain className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div>
                                  <p>{message.content}</p>
                                  {outputCode && index === assistantHistory.length - 1 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => handleCopyCode()}
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                                      Copy Code
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <form onSubmit={handleAssistantSubmit} className="mt-auto">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ask me to create property assessment components or utilities..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isGenerating}
                      />
                      <Button type="submit" disabled={isGenerating || !inputValue.trim()}>
                        {isGenerating ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          'Generate'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>
                  View and edit generated code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0" 
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md border">
                    <div className="flex items-center justify-between border-b px-3 py-1.5 text-sm">
                      <div className="flex items-center">
                        <FileCode className="h-3.5 w-3.5 mr-2 text-primary" />
                        <span className="font-medium">
                          {getComponentNameFromCode(outputCode) || 'Component.tsx'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        TypeScript
                      </Badge>
                    </div>
                    <Textarea
                      ref={editorRef}
                      value={outputCode}
                      onChange={(e) => setOutputCode(e.target.value)}
                      className="font-mono text-sm h-[350px] border-0 bg-transparent focus-visible:ring-0 resize-none"
                      placeholder="// Generated code will appear here"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {outputCode && (
                    <div className="text-xs text-gray-500">
                      {outputCode.split('\n').length} lines • {outputCode.length} characters
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <TerminalSquare className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {developmentTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    {template.category === 'UI Component' ? (
                      <Layout className="h-4 w-4 mr-2 text-primary" />
                    ) : template.category === 'Business Logic' ? (
                      <Cpu className="h-4 w-4 mr-2 text-primary" />
                    ) : (
                      <FileCode className="h-4 w-4 mr-2 text-primary" />
                    )}
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-3 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {template.language}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.complexity}
                    </Badge>
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded border p-2 overflow-auto h-[100px]">
                    <pre className="text-xs font-mono">
                      <code>{template.templateCode.substring(0, 200)}...</code>
                    </pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleAddTemplate(template)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Snippets Tab */}
        <TabsContent value="snippets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {codeSnippets.map((snippet) => (
              <Card key={snippet.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{snippet.title}</CardTitle>
                    <Badge variant="outline">{snippet.language}</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {snippet.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded border p-2 overflow-auto h-[120px]">
                    <pre className="text-xs font-mono">
                      <code>{snippet.code.substring(0, 300)}...</code>
                    </pre>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {snippet.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-gray-500">
                    Used {snippet.usageCount} times
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddSnippet(snippet)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Snippet
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Models Tab */}
        <TabsContent value="models">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Benton County Data Models</CardTitle>
                <CardDescription>
                  Specialized property assessment data models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {propertyModels.map((model) => (
                      <div 
                        key={model.id}
                        className={"p-3 border rounded-md cursor-pointer transition-colors " + 
                          (selectedModel?.id === model.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50')
                        }
                        onClick={() => handleSelectModel(model)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">{model.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectModel(model);
                            }}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {model.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          {model.fields.length} fields • {model.relationships.length} relationships
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Model Details</CardTitle>
                <CardDescription>
                  {selectedModel 
                    ? ("Viewing details for " + selectedModel.name + " model") 
                    : 'Select a model to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedModel ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Fields</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {selectedModel.fields.map((field, index) => (
                              <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="px-3 py-2 text-sm font-medium">{field.name}</td>
                                <td className="px-3 py-2 text-sm">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {field.type}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">{field.description}</td>
                                <td className="px-3 py-2 text-sm font-mono text-xs text-gray-600">{field.example}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Relationships</h3>
                      <div className="space-y-2">
                        {selectedModel.relationships.map((rel, index) => (
                          <div key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                            <div className="mr-3">
                              {rel.type === 'one-to-one' && (
                                <Badge variant="outline" className="text-xs">1:1</Badge>
                              )}
                              {rel.type === 'one-to-many' && (
                                <Badge variant="outline" className="text-xs">1:n</Badge>
                              )}
                              {rel.type === 'many-to-many' && (
                                <Badge variant="outline" className="text-xs">n:n</Badge>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{rel.relatedModel}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{rel.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Generated Type</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded border p-3 font-mono text-xs overflow-auto max-h-[200px]">
                        <pre>{codeContext}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Database className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Model Selected</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Select a data model from the list to view its details and structure
                    </p>
                    <p className="text-xs text-gray-400">
                      These models are specifically designed for Benton County property assessment data
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* App Generator Tab */}
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Builder</CardTitle>
                  <CardDescription>
                    Generate complete property assessment applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Application Type</Label>
                      <Select defaultValue="property-assessment">
                        <SelectTrigger>
                          <SelectValue placeholder="Select application type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property-assessment">Property Assessment</SelectItem>
                          <SelectItem value="tax-collection">Tax Collection</SelectItem>
                          <SelectItem value="appeals-management">Appeals Management</SelectItem>
                          <SelectItem value="public-portal">Public Information Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Users</Label>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Assessors
                        </Badge>
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Administrators
                        </Badge>
                        <Badge variant="secondary">
                          <User className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Officials
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Required Features</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="searchFeature" defaultChecked />
                          <Label htmlFor="searchFeature">Property Search</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mapFeature" defaultChecked />
                          <Label htmlFor="mapFeature">GIS Mapping</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="historyFeature" defaultChecked />
                          <Label htmlFor="historyFeature">Assessment History</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="comparablesFeature" defaultChecked />
                          <Label htmlFor="comparablesFeature">Comparable Analysis</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="exportFeature" defaultChecked />
                          <Label htmlFor="exportFeature">Data Export</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Integrations</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="pacsIntegration" defaultChecked />
                          <Label htmlFor="pacsIntegration">PACS System</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="gisIntegration" defaultChecked />
                          <Label htmlFor="gisIntegration">GIS Data</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="docsIntegration" />
                          <Label htmlFor="docsIntegration">Document Management</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="noticeIntegration" />
                          <Label htmlFor="noticeIntegration">Notice Generation</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={generateFullApplication}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Application
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Structure</CardTitle>
                  <CardDescription>
                    Generated property assessment application components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationParts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {projectContext}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {applicationParts.map((part, index) => (
                          <div key={index} className="flex items-start p-3 border rounded-lg">
                            <div className="mr-3 mt-0.5">
                              {index === 0 ? (
                                <Layout className="h-5 w-5 text-primary" />
                              ) : index === 1 ? (
                                <SquarePen className="h-5 w-5 text-purple-500" />
                              ) : index === 2 ? (
                                <BarChart className="h-5 w-5 text-amber-500" />
                              ) : index === 3 ? (
                                <Map className="h-5 w-5 text-green-500" />
                              ) : index === 4 ? (
                                <ListFilter className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{part}</h4>
                                <Button variant="ghost" size="sm" className="h-7 px-2">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500">
                                {index === 0 
                                  ? 'Property search interface with address autocomplete' 
                                  : index === 1 
                                  ? 'Detailed property information display' 
                                  : index === 2 
                                  ? 'Historical assessment data visualization' 
                                  : index === 3 
                                  ? 'Interactive GIS map for tax lot visualization' 
                                  : index === 4 
                                  ? 'Find and analyze similar properties' 
                                  : 'Export property data in various formats'}
                              </p>
                              <div className="flex mt-1">
                                <Badge variant="outline" className="mr-1 text-xs">React</Badge>
                                <Badge variant="outline" className="mr-1 text-xs">TypeScript</Badge>
                                {index === 2 && <Badge variant="outline" className="text-xs">Chart.js</Badge>}
                                {index === 3 && <Badge variant="outline" className="text-xs">Leaflet</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Archive className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Application Generated</h3>
                      <p className="text-gray-500 max-w-md mb-6">
                        Configure your application settings and click "Generate Application" to create a custom property assessment system for Benton County
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={generateFullApplication}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Sample Application
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {applicationParts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Project Architecture</CardTitle>
                    <CardDescription>
                      Visual representation of application components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border p-6">
                      <div className="flex flex-col items-center">
                        <div className="w-40 h-20 border-2 border-primary rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <div className="font-bold text-sm">App Entry</div>
                            <div className="text-xs text-gray-500">Authentication</div>
                          </div>
                        </div>
                        
                        <Workflow className="h-6 w-6 my-2 text-gray-400" />
                        
                        <div className="grid grid-cols-3 gap-4 w-full mb-4">
                          <div className="col-span-2 border-2 border-blue-500 rounded-lg p-2 text-center">
                            <div className="font-bold text-sm">Main Dashboard</div>
                            <div className="text-xs text-gray-500">User Portal</div>
                          </div>
                          <div className="border-2 border-purple-500 rounded-lg p-2 text-center">
                            <div className="font-bold text-sm">Admin Panel</div>
                            <div className="text-xs text-gray-500">Management</div>
                          </div>
                        </div>
                        
                        <Workflow className="h-6 w-6 my-2 text-gray-400" />
                        
                        <div className="grid grid-cols-3 gap-4 w-full mb-6">
                          <div className="border-2 border-green-500 rounded-lg p-2 text-center h-20 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">Property Search</div>
                            <div className="text-xs text-gray-500">Lookup Module</div>
                          </div>
                          <div className="border-2 border-amber-500 rounded-lg p-2 text-center h-20 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">Assessment View</div>
                            <div className="text-xs text-gray-500">Details & History</div>
                          </div>
                          <div className="border-2 border-red-500 rounded-lg p-2 text-center h-20 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">GIS Mapping</div>
                            <div className="text-xs text-gray-500">Tax Lot Display</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center w-full">
                          <div className="h-px bg-gray-300 dark:bg-gray-700 w-full" />
                          <Layers className="h-6 w-6 mx-4 text-gray-400" />
                          <div className="h-px bg-gray-300 dark:bg-gray-700 w-full" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 w-full mt-6">
                          <div className="border-2 border-indigo-500 rounded-lg p-2 text-center h-16 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">PACS API</div>
                            <div className="text-xs text-gray-500">Data Source</div>
                          </div>
                          <div className="border-2 border-cyan-500 rounded-lg p-2 text-center h-16 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">Database</div>
                            <div className="text-xs text-gray-500">PostgreSQL</div>
                          </div>
                          <div className="border-2 border-emerald-500 rounded-lg p-2 text-center h-16 flex flex-col items-center justify-center">
                            <div className="font-bold text-sm">GIS Server</div>
                            <div className="text-xs text-gray-500">Map Services</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Export Architecture
                    </Button>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Deploy App
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Developer Tab with specialized property assessment development tools */}
        <TabsContent value="developer">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Cpu className="h-5 w-5 mr-2 text-amber-500" />
                  BCBS GeoAssessment Developer Tools
                </CardTitle>
                <CardDescription>
                  Specialized tools for property assessment application development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ai-pair" value={activeDeveloperTab} onValueChange={setActiveDeveloperTab}>
                  <TabsList className="grid grid-cols-5 mb-6">
                    <TabsTrigger value="ai-pair" className="flex items-center">
                      <Brain className="mr-2 h-4 w-4" />
                      AI Pair Programming
                    </TabsTrigger>
                    <TabsTrigger value="cama-playground" className="flex items-center">
                      <Calculator className="mr-2 h-4 w-4" />
                      CAMA Playground
                    </TabsTrigger>
                    <TabsTrigger value="regulation-checker" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Regulation Checker
                    </TabsTrigger>
                    <TabsTrigger value="data-modeler" className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      Data Modeler
                    </TabsTrigger>
                    <TabsTrigger value="gis-tools" className="flex items-center">
                      <Map className="mr-2 h-4 w-4" />
                      GIS Tools
                    </TabsTrigger>
                  </TabsList>

                  {/* AI Pair Programming Tool */}
                  <TabsContent value="ai-pair">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="text-base">Property Assessment Pair Programming</CardTitle>
                          <CardDescription>AI-powered coding assistant specialized for property assessment</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium mb-2">Specialized Context</h3>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="context-pacs" />
                                  <Label htmlFor="context-pacs">PACS Integration</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="context-regulations" defaultChecked />
                                  <Label htmlFor="context-regulations">WA Assessment Regulations</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="context-gis" />
                                  <Label htmlFor="context-gis">GIS Mapping</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="context-calculations" defaultChecked />
                                  <Label htmlFor="context-calculations">Value Calculations</Label>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium mb-2">Common Tasks</h3>
                              <div className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <FileCode className="mr-2 h-4 w-4" />
                                  Property Lookup Component
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Calculator className="mr-2 h-4 w-4" />
                                  CAMA Value Calculator
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Map className="mr-2 h-4 w-4" />
                                  Parcel Map Integration
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <BarChart className="mr-2 h-4 w-4" />
                                  Value Analysis Dashboard
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Code Workspace</CardTitle>
                          <CardDescription>
                            Specialized coding environment for assessment applications
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Textarea 
                              placeholder="Describe what you want to build, or paste code to enhance..."
                              className="font-mono h-[200px] resize-none"
                            />
                            
                            <div className="flex justify-between">
                              <div className="flex space-x-2">
                                <Select defaultValue="typescript">
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="typescript">TypeScript</SelectItem>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="sql">SQL</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select defaultValue="component">
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="component">UI Component</SelectItem>
                                    <SelectItem value="calculation">Calculation</SelectItem>
                                    <SelectItem value="data">Data Model</SelectItem>
                                    <SelectItem value="utility">Utility</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button>
                                <Brain className="mr-2 h-4 w-4" />
                                Generate Code
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* CAMA Model Playground */}
                  <TabsContent value="cama-playground">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="text-base">CAMA Models</CardTitle>
                          <CardDescription>
                            Test and develop property valuation models
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {camaModels.map((model) => (
                                <div 
                                  key={model.id}
                                  className={"p-3 border rounded-md cursor-pointer transition-colors " + 
                                    (selectedCAMAModel?.id === model.id 
                                      ? 'border-amber-500 bg-amber-50' 
                                      : 'border-border hover:border-amber-300')
                                  }
                                  onClick={() => setSelectedCAMAModel(model)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Calculator className="h-4 w-4 mr-2 text-amber-500" />
                                      <span className="font-medium">{model.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {model.type}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {model.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Model Playground</CardTitle>
                          <CardDescription>
                            Test and visualize CAMA model results
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Textarea 
                              placeholder="Enter test property data as JSON..."
                              className="font-mono h-[200px] resize-none"
                              value={modelPlaygroundData}
                              onChange={(e) => setModelPlaygroundData(e.target.value)}
                            />
                            
                            <div className="flex justify-between">
                              <div>
                                <Select defaultValue="residential">
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Property Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="residential">Residential</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="agricultural">Agricultural</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button variant="outline">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Load Sample
                                </Button>
                                <Button>
                                  <Calculator className="mr-2 h-4 w-4" />
                                  Run Model
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Regulation Checker */}
                  <TabsContent value="regulation-checker">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="text-base">Regulation Rules</CardTitle>
                          <CardDescription>
                            Assessment compliance rules for Washington State
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[500px] overflow-auto">
                          <div className="space-y-2">
                            {regulationRules.map((rule) => (
                              <div 
                                key={rule.id}
                                className={"p-3 border rounded-md cursor-pointer transition-colors " + 
                                  (selectedRegulation?.id === rule.id 
                                    ? 'border-amber-500 bg-amber-50' 
                                    : 'border-border hover:border-amber-300')
                                }
                                onClick={() => setSelectedRegulation(rule)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {rule.severity === 'error' ? (
                                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                    ) : rule.severity === 'warning' ? (
                                      <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                                    )}
                                    <span className="font-medium text-sm">{rule.name}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {rule.jurisdiction}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {rule.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Code Compliance Checker</CardTitle>
                          <CardDescription>
                            Check assessment code against regulations
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Textarea 
                              placeholder="Paste assessment code to check for compliance..."
                              className="font-mono h-[200px] resize-none"
                              value={codeToCheck}
                              onChange={(e) => setCodeToCheck(e.target.value)}
                            />
                            
                            <div className="flex justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="rule-market-value" defaultChecked />
                                  <Label htmlFor="rule-market-value">Market Value</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="rule-exemptions" defaultChecked />
                                  <Label htmlFor="rule-exemptions">Exemptions</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="rule-notices" defaultChecked />
                                  <Label htmlFor="rule-notices">Notices</Label>
                                </div>
                              </div>
                              
                              <Button>
                                <FileText className="mr-2 h-4 w-4" />
                                Check Compliance
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Visual Data Model Builder */}
                  <TabsContent value="data-modeler">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="text-base">Property Models</CardTitle>
                          <CardDescription>
                            Design property assessment data models
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {propertyModels.map((model) => (
                                <div 
                                  key={model.id}
                                  className={"p-3 border rounded-md cursor-pointer transition-colors " + 
                                    (selectedModel?.id === model.id 
                                      ? 'border-amber-500 bg-amber-50' 
                                      : 'border-border hover:border-amber-300')
                                  }
                                  onClick={() => setSelectedModel(model)}
                                >
                                  <div className="flex items-center">
                                    <Database className="h-4 w-4 mr-2 text-amber-500" />
                                    <span className="font-medium">{model.name}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {model.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <Button variant="outline" size="sm" className="w-full">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              New Data Model
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Visual Model Designer</CardTitle>
                          <CardDescription>
                            Design and generate database schemas
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="border rounded-md h-[300px] p-4 bg-gray-50 flex items-center justify-center">
                              {dataModelDiagram ? (
                                <div>
                                  {/* Visual diagram would go here */}
                                  <div className="text-center text-gray-500">Data model diagram rendering</div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500">
                                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Select a model to view or create a new one</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Export Schema
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Import Schema
                                </Button>
                              </div>
                              
                              <Button size="sm">
                                <Database className="mr-2 h-4 w-4" />
                                Generate Drizzle Schema
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* GIS Integration Tools */}
                  <TabsContent value="gis-tools">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-1">
                        <CardHeader>
                          <CardTitle className="text-base">GIS Templates</CardTitle>
                          <CardDescription>
                            Map visualizations for property assessment
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {gisTemplates.map((template) => (
                                <div 
                                  key={template.id}
                                  className={"p-3 border rounded-md cursor-pointer transition-colors " + 
                                    (selectedGISTemplate?.id === template.id 
                                      ? 'border-amber-500 bg-amber-50' 
                                      : 'border-border hover:border-amber-300')
                                  }
                                  onClick={() => setSelectedGISTemplate(template)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Map className="h-4 w-4 mr-2 text-amber-500" />
                                      <span className="font-medium">{template.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {template.mapType}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {template.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Map Component Builder</CardTitle>
                          <CardDescription>
                            Create property assessment map visualizations
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="border rounded-md h-[300px] p-4 bg-gray-50 flex items-center justify-center">
                              {gisVisualizationData ? (
                                <div>
                                  {/* GIS visualization would go here */}
                                  <div className="text-center text-gray-500">Map visualization preview</div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-500">
                                  <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Select a GIS template to preview</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between">
                              <div className="flex space-x-2">
                                <Select defaultValue="parcel">
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Map Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="parcel">Parcel Map</SelectItem>
                                    <SelectItem value="zoning">Zoning Map</SelectItem>
                                    <SelectItem value="district">District Map</SelectItem>
                                    <SelectItem value="neighborhood">Neighborhood Map</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Preview
                                </Button>
                                <Button size="sm">
                                  <Map className="mr-2 h-4 w-4" />
                                  Generate Component
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Context sidebar for additional tools */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2">
        <div className="bg-white dark:bg-gray-950 rounded-full shadow-lg p-1.5 flex flex-col items-center space-y-2 border">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Context Panel">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Separator className="w-5" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Documentation">
            <Book className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Backend API">
            <Server className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Code Templates">
            <FileCode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="AI Assistant">
            <Brain className="h-4 w-4" />
          </Button>
          <Separator className="w-5" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="GitHub">
            <Github className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
export default CodeAssistantPanel;
