/**
 * Data Anonymizer Component - RESTORED from BCBSCOSTApp
 * 
 * Critical government compliance component for data privacy and anonymization
 * of sensitive property and cost data according to privacy regulations.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Anonymization options interface
export interface AnonymizationOptions {
  removePersonalIdentifiers: boolean;
  anonymizeAddresses: boolean;
  generalizeNumbers: boolean;
  removeOwnerInfo: boolean;
  maskFinancialData: boolean;
  generalizationLevel: number; // 0-100
  retainStructuralData: boolean;
  addNoise: boolean;
  noiseLevel: number; // 0-100
}

interface DataAnonymizerProps {
  /**
   * The data to anonymize (can be a single record or an array of records)
   */
  data?: Record<string, any> | Record<string, any>[];
  
  /**
   * Type of data being anonymized
   */
  dataType?: 'building' | 'calculation';
  
  /**
   * Default anonymization options
   */
  defaultOptions?: AnonymizationOptions;
  
  /**
   * Called when data is anonymized with the anonymized data
   */
  onAnonymize?: (anonymizedData: any) => void;
  
  /**
   * Called when anonymization is canceled
   */
  onCancel?: () => void;
  
  /**
   * Show the component in compact mode
   */
  compact?: boolean;
}

// Default anonymization options
const defaultAnonymizationOptions: AnonymizationOptions = {
  removePersonalIdentifiers: true,
  anonymizeAddresses: true,
  generalizeNumbers: false,
  removeOwnerInfo: true,
  maskFinancialData: false,
  generalizationLevel: 50,
  retainStructuralData: true,
  addNoise: false,
  noiseLevel: 10
};

export function DataAnonymizer({
  data,
  dataType = 'building',
  defaultOptions = defaultAnonymizationOptions,
  onAnonymize,
  onCancel,
  compact = false
}: DataAnonymizerProps) {
  const [options, setOptions] = useState<AnonymizationOptions>(defaultOptions);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Anonymization utility functions
  const anonymizeValue = (value: any, type: string): any => {
    if (value === null || value === undefined) return value;
    
    switch (type) {
      case 'address':
        if (typeof value === 'string') {
          return value.replace(/\d+/g, 'XXX').replace(/\b[A-Za-z]+\s+(St|Ave|Rd|Dr|Ln|Blvd)\b/g, 'STREET');
        }
        return value;
      
      case 'owner':
        if (typeof value === 'string') {
          return value.replace(/[A-Za-z]/g, 'X');
        }
        return value;
      
      case 'financial':
        if (typeof value === 'number') {
          // Round to nearest thousand for generalization
          return Math.round(value / 1000) * 1000;
        }
        return value;
      
      case 'identifier':
        if (typeof value === 'string' || typeof value === 'number') {
          return 'REDACTED';
        }
        return value;
      
      default:
        return value;
    }
  };

  // Add statistical noise to numeric values
  const addNoise = (value: number, noiseLevel: number): number => {
    const noiseAmount = (value * noiseLevel / 100) * (Math.random() * 2 - 1);
    return Math.round(value + noiseAmount);
  };

  // Generalize numeric values
  const generalizeNumber = (value: number, level: number): number => {
    if (level === 0) return value;
    const factor = Math.pow(10, Math.floor(level / 20));
    return Math.round(value / factor) * factor;
  };

  // Main anonymization function
  const anonymizeData = (inputData: any): any => {
    if (!inputData) return inputData;
    
    const anonymize = (obj: Record<string, any>): Record<string, any> => {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        let newValue = value;
        
        // Apply anonymization based on options and key patterns
        if (options.removePersonalIdentifiers && /^(ssn|social|id|parcel_?id|account)$/i.test(key)) {
          newValue = anonymizeValue(value, 'identifier');
        } else if (options.anonymizeAddresses && /address|street|location/i.test(key)) {
          newValue = anonymizeValue(value, 'address');
        } else if (options.removeOwnerInfo && /owner|name|contact/i.test(key)) {
          newValue = anonymizeValue(value, 'owner');
        } else if (options.maskFinancialData && /cost|price|value|amount|fee/i.test(key)) {
          newValue = anonymizeValue(value, 'financial');
        } else if (typeof value === 'number') {
          if (options.generalizeNumbers) {
            newValue = generalizeNumber(value, options.generalizationLevel);
          }
          if (options.addNoise) {
            newValue = addNoise(newValue, options.noiseLevel);
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          newValue = anonymize(value);
        } else if (Array.isArray(value)) {
          newValue = value.map(item => 
            typeof item === 'object' ? anonymize(item) : item
          );
        }
        
        result[key] = newValue;
      }
      
      return result;
    };
    
    if (Array.isArray(inputData)) {
      return inputData.map(item => anonymize(item));
    } else {
      return anonymize(inputData);
    }
  };

  // Generate preview
  const generatePreview = () => {
    if (!data) return;
    setIsProcessing(true);
    
    try {
      const anonymized = anonymizeData(data);
      setPreviewData(anonymized);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply anonymization
  const handleAnonymize = () => {
    if (!data) return;
    setIsProcessing(true);
    
    try {
      const anonymized = anonymizeData(data);
      if (onAnonymize) {
        onAnonymize(anonymized);
      }
    } catch (error) {
      console.error('Error anonymizing data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate privacy level
  const calculatePrivacyLevel = (): number => {
    let score = 0;
    if (options.removePersonalIdentifiers) score += 25;
    if (options.anonymizeAddresses) score += 20;
    if (options.removeOwnerInfo) score += 25;
    if (options.maskFinancialData) score += 15;
    if (options.addNoise) score += 10;
    if (options.generalizeNumbers) score += 5;
    return Math.min(score, 100);
  };

  const privacyLevel = calculatePrivacyLevel();
  const privacyColor = privacyLevel >= 80 ? 'green' : privacyLevel >= 60 ? 'yellow' : 'red';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
<>

        <Button size="sm" onClick={handleAnonymize} disabled={!data || isProcessing}>
          🛡️ Anonymize Data
        </Button>
        <Badge
</>
variant={privacyColor === 'green' ? 'default' : 'secondary'}>
          {privacyLevel}% Privacy
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🛡️ Data Anonymizer
          <Badge variant="secondary">RESTORED</Badge>
        </CardTitle>
        <CardDescription>
          Government-compliant data privacy and anonymization for sensitive property data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
<>

              <span>Current Privacy Level:</span>
              <Badge
</>

                className={`${
                  privacyColor === 'green' ? 'bg-green-100 text-green-800' :
                  privacyColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {privacyLevel}%
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
<>

          <h4 className="font-medium">Anonymization Options</h4>
          
          <div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="remove-identifiers"
                  checked={options.removePersonalIdentifiers}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, removePersonalIdentifiers: checked }))}
                />
                <Label htmlFor="remove-identifiers">Remove Personal Identifiers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymize-addresses"
                  checked={options.anonymizeAddresses}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, anonymizeAddresses: checked }))}
                />
                <Label htmlFor="anonymize-addresses">Anonymize Addresses</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="remove-owner"
                  checked={options.removeOwnerInfo}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, removeOwnerInfo: checked }))}
                />
                <Label htmlFor="remove-owner">Remove Owner Information</Label>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mask-financial"
                  checked={options.maskFinancialData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, maskFinancialData: checked }))}
                />
                <Label htmlFor="mask-financial">Mask Financial Data</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="generalize-numbers"
                  checked={options.generalizeNumbers}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, generalizeNumbers: checked }))}
                />
                <Label htmlFor="generalize-numbers">Generalize Numbers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="add-noise"
                  checked={options.addNoise}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, addNoise: checked }))}
                />
                <Label htmlFor="add-noise">Add Statistical Noise</Label>
              </div>
            </div>
          </div>
          
          {options.generalizeNumbers && (
            <div className="space-y-2">
<>

              <Label>Generalization Level: {options.generalizationLevel}%</Label>
              <Slider
</>

                value={[options.generalizationLevel]}
                onValueChange={(value) => 
                  setOptions(prev => ({ ...prev, generalizationLevel: value[0] }))}
                max={100}
                min={0}
                step={10}
              />
            </div>
          )}
          
          {options.addNoise && (
            <div className="space-y-2">
<>

              <Label>Noise Level: {options.noiseLevel}%</Label>
              <Slider
</>

                value={[options.noiseLevel]}
                onValueChange={(value) => 
                  setOptions(prev => ({ ...prev, noiseLevel: value[0] }))}
                max={50}
                min={1}
                step={1}
              />
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex gap-2">
<>

          <Button onClick={generatePreview} disabled={!data || isProcessing}>
            {isProcessing ? 'Processing...' : 'Preview Anonymization'}
          </Button>
          <Button
</>
onClick={handleAnonymize} disabled={!data || isProcessing}>
            Apply Anonymization
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        
        {showPreview && previewData && (
          <div className="space-y-2">
<>

            <h4 className="font-medium">Preview (First 3 Records)</h4>
            <ScrollArea
</>
className="h-48">
              <pre className="text-xs bg-muted p-2 rounded">
                {JSON.stringify(
                  Array.isArray(previewData) ? previewData.slice(0, 3) : previewData,
                  null,
                  2
                )}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}