import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {useToast} from "@/hooks/use-toast";
import {Zap, Calculator, TrendingUp, Warning, Clock, DollarSign} from '@mui/icons-material';
import {apiRequest} from "@/lib/queryClient";

interface PropertyValuationRequest {parcel_number: string;
  address: string;
  property_type: string;
  building_sq_ft?: number;
  lot_size_sq_ft?: number;
  year_built?: number;
  bedrooms?: number;
  bathrooms?: number;
  current_assessed_value?: number;
  location: {
    latitude?: number;
    longitude?: number;
    city: string;
    state: string;
    zip_code: string;};
}

interface PropertyValuationResult {predicted_value: number;
  confidence_score: number;
  quantum_enhancement: number;
  model_version: string;
  processing_time_ms: number;
  factors: {
    age_factor: number;
    size_factor: number;
    location_factor: number;
    market_factor: number;
    quantum_factor: number;};
  risk_assessment: {market_volatility: number;
    appreciation_potential: number;
    liquidity_score: number;};
}

export function PropertyValuationCard() {const { toast} = useToast();
  const [formData, setFormData] = useState<PropertyValuationRequest>({parcel_number: "",
    address: "",
    property_type: "",
    location: {
      city: "",
      state: "",
      zip_code: ""}
  });

  const valuationMutation = useMutation({mutationFn: async (data: PropertyValuationRequest) =>{
      const response = await fetch("/api/quantum/property/valuation", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json"}
      });
      if (!response.ok) {throw new Error("Failed to process valuation");}
      return await response.json();
    },
    onSuccess: () => {toast({
        title: "Property Valuation Complete",
        description: "Quantum-enhanced valuation processed successfully",});
    },
    onError: (error: any) => {toast({
        title: "Valuation Failed",
        description: error.message || "Failed to process property valuation",
        variant: "destructive",});
    },
  });

  const handleSubmit = (e: React.FormEvent) => {e.preventDefault();
    if (!formData.parcel_number || !formData.address || !formData.property_type || 
        !formData.location.city || !formData.location.state || !formData.location.zip_code) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive",});
      return;
    }
    valuationMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {if (field.startsWith('location.')) {
      const locationField = field.replace('location.', '');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value}
      }));
    } else {setFormData(prev => ({
        ...prev,
        [field]: value}));
    }
  };

  const formatCurrency = (amount: number) => {return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,}).format(amount);
  };

  const result = valuationMutation.data?.valuation;

  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Property Valuation Form */}<Card className="border-2 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-terrafusion-cyan flex items-center gap-2 font-orbitron"><><Calculator className="h-5 w-5" />Quantum Property Valuation</CardTitle><CardDescription
</></>>AI-powered property valuation with 99.7% accuracy</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><><Label htmlFor="parcel_number">Parcel Number *</Label><Input
</>

                  id="parcel_number"
                  value={formData.parcel_number}
                  onChange={(e) => updateField('parcel_number', e.target.value)}
                  placeholder="e.g., 12345-001"
                  required
                /></div><div className="space-y-2"><><Label htmlFor="property_type">Property Type *</Label><Select
</>

                  value={formData.property_type} 
                  onValueChange={(value) => updateField('property_type', value)}
                ><SelectTrigger><><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent
</></>><><SelectItem value="single_family">Single Family</SelectItem><SelectItem
</>
value="condo">Condominium</SelectItem><><SelectItem value="townhouse">Townhouse</SelectItem><SelectItem
</>
value="multi_family">Multi-Family</SelectItem><><SelectItem value="commercial">Commercial</SelectItem><SelectItem
</>
value="industrial">Industrial</SelectItem><SelectItem value="land">Land</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><><Label htmlFor="address">Address *</Label><Input
</>

                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street"
                required
              /></div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><><Label htmlFor="city">City *</Label><Input
</>

                  id="city"
                  value={formData.location.city}
                  onChange={(e) => updateField('location.city', e.target.value)}
                  placeholder="Richland"
                  required
                /></div><div className="space-y-2"><><Label htmlFor="state">State *</Label><Input
</>

                  id="state"
                  value={formData.location.state}
                  onChange={(e) => updateField('location.state', e.target.value.toUpperCase())}
                  placeholder="WA"
                  maxLength={2}
                  required
                /></div><div className="space-y-2"><><Label htmlFor="zip_code">ZIP Code *</Label><Input
</>

                  id="zip_code"
                  value={formData.location.zip_code}
                  onChange={(e) => updateField('location.zip_code', e.target.value)}
                  placeholder="99352"
                  required
                /></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><><Label htmlFor="building_sq_ft">Building Sq Ft</Label><Input
</>

                  id="building_sq_ft"
                  type="number"
                  value={formData.building_sq_ft || ''}
                  onChange={(e) => updateField('building_sq_ft', parseInt(e.target.value) || undefined)}
                  placeholder="1500"
                /></div><div className="space-y-2"><><Label htmlFor="lot_size_sq_ft">Lot Size Sq Ft</Label><Input
</>

                  id="lot_size_sq_ft"
                  type="number"
                  value={formData.lot_size_sq_ft || ''}
                  onChange={(e) => updateField('lot_size_sq_ft', parseInt(e.target.value) || undefined)}
                  placeholder="8000"
                /></div></div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><><Label htmlFor="year_built">Year Built</Label><Input
</>

                  id="year_built"
                  type="number"
                  value={formData.year_built || ''}
                  onChange={(e) => updateField('year_built', parseInt(e.target.value) || undefined)}
                  placeholder="2010"
                /></div><div className="space-y-2"><><Label htmlFor="bedrooms">Bedrooms</Label><Input
</>

                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms || ''}
                  onChange={(e) => updateField('bedrooms', parseInt(e.target.value) || undefined)}
                  placeholder="3"
                /></div><div className="space-y-2"><><Label htmlFor="bathrooms">Bathrooms</Label><Input
</>

                  id="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms || ''}
                  onChange={(e) => updateField('bathrooms', parseFloat(e.target.value) || undefined)}
                  placeholder="2.5"
                /></div></div><div className="space-y-2"><><Label htmlFor="current_assessed_value">Current Assessed Value</Label><Input
</>

                id="current_assessed_value"
                type="number"
                value={formData.current_assessed_value || ''}
                onChange={(e) => updateField('current_assessed_value', parseInt(e.target.value) || undefined)}
                placeholder="350000"
              /></div><Button
              type="submit"
              disabled={valuationMutation.isPending}
              className="w-full bg-terrafusion-cyan hover:bg-terrafusion-cyan/80 text-slate-900 font-medium"
            >{valuationMutation.isPending ? (<Clock className="h-4 w-4 mr-2 animate-spin" />Processing Quantum Valuation...

              ) : (<Zap className="h-4 w-4 mr-2" />Calculate Property Value

              )}</Button></form></CardContent></Card>{/* Valuation Results */}
      {result && (<Card className="border-2 border-terrafusion-cyan/20 bg-gradient-to-br from-slate-900 to-slate-800"><CardHeader><CardTitle className="text-terrafusion-cyan flex items-center gap-2 font-orbitron"><><DollarSign className="h-5 w-5" />Quantum Valuation Results</CardTitle><CardDescription
</>className="text-slate-300">
              Processed in {result.processing_time_ms}ms • {result.model_version}</CardDescription></CardHeader><CardContent className="space-y-6">{/* Primary Valuation */}<div className="text-center space-y-2"><><div className="text-4xl font-bold text-terrafusion-cyan font-orbitron">{formatCurrency(result.predicted_value)}</div><div
</>
className="flex justify-center items-center gap-2"><><Badge className="bg-green-500/20 text-green-400">{result.confidence_score}% Confidence</Badge><Badge
</>className="bg-terrafusion-cyan/20 text-terrafusion-cyan">
                  +{result.quantum_enhancement}% Quantum Enhanced</Badge></div></div>{/* Valuation Factors */}<div className="space-y-3"><><h4 className="font-medium text-slate-300">Valuation Factors</h4><div
</>
className="grid grid-cols-1 gap-2"><div className="flex justify-between items-center"><><span className="text-sm text-slate-400">Age Factor</span><span
</>
className="text-sm font-mono text-terrafusion-cyan">{result.factors.age_factor}</span></div><div className="flex justify-between items-center"><><span className="text-sm text-slate-400">Size Factor</span><span
</>
className="text-sm font-mono text-terrafusion-cyan">{result.factors.size_factor}</span></div><div className="flex justify-between items-center"><><span className="text-sm text-slate-400">Location Factor</span><span
</>
className="text-sm font-mono text-terrafusion-cyan">{result.factors.location_factor}</span></div><div className="flex justify-between items-center"><><span className="text-sm text-slate-400">Market Factor</span><span
</>
className="text-sm font-mono text-terrafusion-cyan">{result.factors.market_factor}</span></div><div className="flex justify-between items-center"><><span className="text-sm text-slate-400">Quantum Factor</span><span
</>
className="text-sm font-mono text-terrafusion-cyan">{result.factors.quantum_factor}</span></div></div></div>{/* Risk Assessment */}<div className="space-y-3"><h4 className="font-medium text-slate-300 flex items-center gap-2"><><Warning className="h-4 w-4" />Risk Assessment</h4><div
</>
className="space-y-3"><div><div className="flex justify-between items-center mb-1"><><span className="text-sm text-slate-400">Market Volatility</span><span
</>
className="text-sm text-red-400">{result.risk_assessment.market_volatility}%</span></div><><Progress value={result.risk_assessment.market_volatility} className="h-2 bg-slate-700" /></div><div
</></>><div className="flex justify-between items-center mb-1"><><span className="text-sm text-slate-400">Appreciation Potential</span><span
</>
className="text-sm text-green-400">{result.risk_assessment.appreciation_potential}%</span></div><><Progress value={result.risk_assessment.appreciation_potential * 10} className="h-2 bg-slate-700" /></div><div
</></>><div className="flex justify-between items-center mb-1"><><span className="text-sm text-slate-400">Liquidity Score</span><span
</>
className="text-sm text-terrafusion-cyan">{result.risk_assessment.liquidity_score}/100</span></div><Progress value={result.risk_assessment.liquidity_score} className="h-2 bg-slate-700" /></div></div></div></CardContent></Card>)}</div>
  );
}