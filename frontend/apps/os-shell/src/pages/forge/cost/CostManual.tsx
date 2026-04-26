/**
 * CostManual.tsx
 *
 * Forge Cost Schedule — Benton County local cost schedules (ratio-study calibrated).
 * Fetches live cost matrix rows from /costforge/schedule. Quality filtering is
 * applied by the live API for primary rows, and free-text search is applied
 * client-side after load.
 *
 * Secondary-feature section: %-of-BIV rates for accessory structures (CovPatio,
 * ATTGAR, DETGAR, BSMT, POLEBLDG, POOL) seeded by EnsureSecondaryFeatureMatricesAsync
 * and returned in the same /costforge/schedule response with matrixType="SecondaryFeature".
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetchJson } from '@/lib/apiBase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CostScheduleRow {
  buildingClass: string;
  qualityGrade: string;
  baseRate: number;
  unit: string;
  effectiveDate: string;
}

interface SecondaryFeatureRow {
  code: string;
  description: string;
  pctOfBiv: number; // 0–1 fraction, e.g. 0.03 = 3%
  region: string;
  effectiveDate: string;
}

// Shape returned by GET /costforge/schedule
interface CostScheduleApiRow {
  code?: string;
  description?: string;
  qualityClass?: string;
  baseCost?: number;
  unit?: string;
  effectiveDate?: string;
  buildingType?: string;
  revalArea?: string;
  matrixType?: string;
  secondaryFeaturePctOfBiv?: number;
}

type CostManualReadState = 'loading' | 'live' | 'unavailable';

async function getCostSchedule(
  qualityClass: string,
  signal: AbortSignal,
): Promise<CostScheduleApiRow[]> {
  const qs = qualityClass !== 'all' ? `?qualityClass=${encodeURIComponent(qualityClass)}` : '';
  return apiFetchJson<CostScheduleApiRow[]>(`/costforge/schedule${qs}`, { signal });
}

const QUALITY_OPTIONS = [
  { value: 'all', label: 'All Grades' },
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LUXURY', label: 'Luxury' },
] as const;

export function CostManual() {
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [rows, setRows] = useState<CostScheduleRow[]>([]);
  const [sfRows, setSfRows] = useState<SecondaryFeatureRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readState, setReadState] = useState<CostManualReadState>('loading');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const loadRows = async () => {
      setIsLoading(true);
      setError(null);
      setReadState('loading');

      try {
        // The live API applies quality filtering only to primary schedule rows.
        // Secondary-feature rows have no quality tier and still return alongside
        // the filtered primary payload.
        const result = await getCostSchedule(qualityFilter, signal);

        if (Array.isArray(result)) {
          const primary: CostScheduleRow[] = [];
          const secondary: SecondaryFeatureRow[] = [];

          for (const entry of result) {
            if (entry.matrixType === 'SecondaryFeature') {
              secondary.push({
                code: entry.buildingType ?? entry.code ?? '—',
                description: entry.description ?? entry.buildingType ?? '—',
                pctOfBiv: Number(entry.secondaryFeaturePctOfBiv) || 0,
                region: entry.revalArea ?? 'Benton',
                effectiveDate: entry.effectiveDate ?? '—',
              });
            } else {
              primary.push({
                buildingClass: entry.description ?? entry.code ?? 'Unknown Class',
                qualityGrade: entry.qualityClass ?? 'Unspecified',
                baseRate: Number(entry.baseCost) || 0,
                unit: entry.unit ?? '$/SF',
                effectiveDate: entry.effectiveDate ?? '—',
              });
            }
          }

          setRows(primary);
          setSfRows(secondary);
          if (primary.length === 0) {
            setReadState('unavailable');
            setError('Live cost schedule endpoint returned no primary schedule rows.');
          } else {
            setReadState('live');
          }
        } else {
          setRows([]);
          setSfRows([]);
          setReadState('unavailable');
          setError('Live cost schedule endpoint returned an invalid payload.');
        }
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setRows([]);
        setSfRows([]);
        setReadState('unavailable');
        setError(cause instanceof Error ? cause.message : 'Failed to load cost schedules.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRows();

    return () => {
      abortRef.current?.abort();
    };
  }, [qualityFilter]);

  // Server filters by qualityClass; apply client-side search on top
  const filtered = rows.filter((row) =>
    row.buildingClass.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 p-4">
      {readState === 'unavailable' && (
        <div
          data-testid="cost-manual-unavailable"
          className="rounded-lg border px-4 py-3"
          style={{ background: 'hsl(var(--tf-warning) / 0.08)', borderColor: 'hsl(var(--tf-warning) / 0.35)' }}
        >
          <p className="text-sm font-medium">Live cost schedule unavailable.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Benton schedule rows are not being replaced with sample data on this surface.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cost Schedule</h1>
          <p className="text-muted-foreground">
            Benton County base rates — {rows.length > 0 ? `${rows.length} schedule rows` : readState === 'unavailable' ? 'live schedule unavailable' : 'loading…'}
          </p>
          {error && (
            <p className="text-xs text-amber-500 mt-1">
              {error}
            </p>
          )}
        </div>
        <Badge variant="outline">BIV-085</Badge>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search building class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={qualityFilter} onValueChange={setQualityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Quality Grade" />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building Class</TableHead>
                <TableHead>Quality Grade</TableHead>
                <TableHead className="text-right">Base Rate</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Effective Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading cost schedules...
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.buildingClass}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.qualityGrade}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${row.baseRate.toFixed(2)}
                  </TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.effectiveDate}</TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {readState === 'unavailable' ? 'Cost schedule unavailable. No Benton schedule rows are being shown.' : 'No matching cost schedules found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Secondary-feature %-of-BIV rates (Benton Method) */}
      {(sfRows.length > 0 || isLoading || readState === 'unavailable') && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Secondary Feature Rates
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                %-of-BIV · Benton Method
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accessory structure values expressed as a percentage of the Building
              Improvement Value (BIV). Applied on top of the primary cost approach.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">% of BIV</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Effective Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Loading secondary feature rates...
                    </TableCell>
                  </TableRow>
                )}
                {sfRows.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="font-mono text-sm font-medium">
                      {row.code}
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {(row.pctOfBiv * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.region}</TableCell>
                    <TableCell className="text-muted-foreground">{row.effectiveDate}</TableCell>
                  </TableRow>
                ))}
                {!isLoading && sfRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      {readState === 'unavailable' ? 'Secondary feature rates unavailable from the live schedule API.' : 'No secondary feature rates found. Run a Benton sync to populate.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
