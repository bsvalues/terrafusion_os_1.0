/**
 * Assessment Narrative
 *
 * Appraiser enters parcel characteristics, gets a plain-English explanation
 * of the RCNLD calculation they can use to defend value at a BOR hearing.
 */
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileText, Copy, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuildingTypeOption { value: string; label: string; }
interface RevalAreaOption    { value: string; label: string; }

interface FormValues {
  buildingType: string;
  revalArea: string;
  squareFeet: string;
  yearBuilt: string;
  quality: string;
  condition: string;
  parcelId: string;
  ownerName: string;
}

const QUALITY_OPTIONS = [
  { value: 'ECONOMY',  label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'GOOD',     label: 'Good' },
  { value: 'CUSTOM',   label: 'Custom' },
  { value: 'LUXURY',   label: 'Luxury' },
];

const CONDITION_OPTIONS = [
  { value: 'POOR',      label: 'Poor' },
  { value: 'FAIR',      label: 'Fair' },
  { value: 'AVERAGE',   label: 'Average' },
  { value: 'GOOD',      label: 'Good' },
  { value: 'EXCELLENT', label: 'Excellent' },
];

async function fetchBuildingTypes(): Promise<BuildingTypeOption[]> {
  const res = await fetch('/api/costforge/building-types');
  if (!res.ok) return [];
  const d = await res.json();
  const types = d.buildingTypes ?? d ?? [];
  return types.map((t: any) => ({ value: t.code ?? t, label: t.label ?? t }));
}

async function fetchRevalAreas(): Promise<RevalAreaOption[]> {
  const res = await fetch('/api/costforge/regions');
  if (!res.ok) return [];
  const d = await res.json();
  const regions = d.regions ?? d ?? [];
  return regions.map((r: any) => ({ value: r.name ?? r, label: r.name ?? r }));
}

async function generateNarrative(values: FormValues & { costResult: any }): Promise<string> {
  const res = await fetch('/api/aimodules/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'generate-assessment-narrative',
      parameters: {
        parcelId: values.parcelId || 'Unknown',
        ownerName: values.ownerName || 'Property Owner',
        buildingType: values.buildingType,
        squareFeet: Number(values.squareFeet),
        yearBuilt: Number(values.yearBuilt),
        quality: values.quality,
        condition: values.condition,
        revalArea: values.revalArea,
        costResult: values.costResult,
        context: 'Generate a professional assessment narrative suitable for a Washington State Board of Equalization hearing. Explain the cost approach (RCN, depreciation schedule, RCNLD) in plain English. Reference Benton County assessor methodology.',
      },
    }),
  });
  if (!res.ok) throw new Error('Narrative generation failed');
  const d = await res.json();
  return typeof d.result === 'string' ? d.result : JSON.stringify(d.result);
}

export default function AICalculationExplainer() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [costResult, setCostResult] = useState<any>(null);

  const [form, setForm] = useState<FormValues>({
    buildingType: '',
    revalArea: '',
    squareFeet: '',
    yearBuilt: String(new Date().getFullYear() - 15),
    quality: 'STANDARD',
    condition: 'AVERAGE',
    parcelId: '',
    ownerName: '',
  });

  const { data: buildingTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['building-types-narrative'],
    queryFn: fetchBuildingTypes,
  });

  const { data: revalAreas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ['reval-areas-narrative'],
    queryFn: fetchRevalAreas,
  });

  const set = (field: keyof FormValues, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // First compute cost, then generate narrative
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Step 1: compute RCNLD
      const costRes = await fetch('/api/costforge/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingType: values.buildingType,
          squareFeet: Number(values.squareFeet),
          yearBuilt: Number(values.yearBuilt),
          quality: values.quality,
          condition: values.condition,
          revalArea: values.revalArea,
        }),
      });
      if (!costRes.ok) throw new Error('Cost calculation failed');
      const cost = await costRes.json();
      setCostResult(cost);

      // Step 2: generate narrative
      return generateNarrative({ ...values, costResult: cost });
    },
    onSuccess: (text) => {
      setNarrative(text);
    },
    onError: (err: Error) => {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    },
  });

  const isReady = form.buildingType && form.revalArea && form.squareFeet && form.yearBuilt;

  const handleCopy = () => {
    navigator.clipboard.writeText(narrative).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Assessment Narrative
        </CardTitle>
        <CardDescription>
          Enter parcel characteristics and generate a plain-English cost approach narrative
          suitable for BOR hearings and assessment defense.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Optional parcel header */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Parcel ID <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="12-34-56-78-9000"
              value={form.parcelId}
              onChange={e => set('parcelId', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Owner Name <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="Smith, John"
              value={form.ownerName}
              onChange={e => set('ownerName', e.target.value)}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Building inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Building Type *</Label>
            {loadingTypes ? <Skeleton className="h-9 w-full" /> : (
              <Select value={form.buildingType} onValueChange={v => set('buildingType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {buildingTypes.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reval Area *</Label>
            {loadingAreas ? <Skeleton className="h-9 w-full" /> : (
              <Select value={form.revalArea} onValueChange={v => set('revalArea', v)}>
                <SelectTrigger><SelectValue placeholder="Select reval area" /></SelectTrigger>
                <SelectContent>
                  {revalAreas.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Square Feet *</Label>
            <Input
              type="number"
              placeholder="1800"
              value={form.squareFeet}
              onChange={e => set('squareFeet', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Year Built *</Label>
            <Input
              type="number"
              placeholder="2005"
              value={form.yearBuilt}
              onChange={e => set('yearBuilt', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quality Grade</Label>
            <Select value={form.quality} onValueChange={v => set('quality', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condition</Label>
            <Select value={form.condition} onValueChange={v => set('condition', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Computed cost preview */}
        {costResult && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Base Rate</div>
              <div className="font-medium">${costResult.baseCostPerSqft?.toFixed(2)}/sqft</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Depreciation</div>
              <div className="font-medium">{((1 - (costResult.depreciationFactor ?? 1)) * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">RCNLD</div>
              <div className="font-semibold text-primary">
                ${costResult.totalCost?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => mutation.mutate(form)}
          disabled={!isReady || mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating narrative…</>
          ) : (
            'Generate Assessment Narrative'
          )}
        </Button>

        {/* Narrative output */}
        {narrative && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Narrative
              </Label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1.5">
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Textarea
              readOnly
              value={narrative}
              className="min-h-[220px] text-sm font-mono bg-muted/30 resize-y"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
