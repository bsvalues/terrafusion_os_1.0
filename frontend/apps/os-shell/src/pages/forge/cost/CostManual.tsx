import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { getCostSchedule } from '@/services/forge/propertyValuationClientService';
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

const SAMPLE_COST_SCHEDULES: CostScheduleRow[] = [
  { buildingClass: 'Residential - Wood Frame', qualityGrade: 'Average', baseRate: 125.5, unit: '$/SF', effectiveDate: '2025-01-01' },
  { buildingClass: 'Residential - Wood Frame', qualityGrade: 'Good', baseRate: 168.75, unit: '$/SF', effectiveDate: '2025-01-01' },
  { buildingClass: 'Residential - Masonry', qualityGrade: 'Average', baseRate: 142.0, unit: '$/SF', effectiveDate: '2025-01-01' },
  { buildingClass: 'Commercial - Steel Frame', qualityGrade: 'Average', baseRate: 195.25, unit: '$/SF', effectiveDate: '2025-01-01' },
  { buildingClass: 'Commercial - Steel Frame', qualityGrade: 'Good', baseRate: 248.0, unit: '$/SF', effectiveDate: '2025-01-01' },
  { buildingClass: 'Industrial - Prefab Metal', qualityGrade: 'Low', baseRate: 62.0, unit: '$/SF', effectiveDate: '2025-01-01' },
];

export function CostManual() {
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [rows, setRows] = useState<CostScheduleRow[]>(SAMPLE_COST_SCHEDULES);
  const [isSampleData, setIsSampleData] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCostSchedule({
          qualityClass: qualityFilter === 'all' ? undefined : qualityFilter,
        });

        if (!active) {
          return;
        }

        if (Array.isArray(result) && result.length > 0) {
          const normalized: CostScheduleRow[] = result.map((entry) => ({
            buildingClass: entry.description || entry.code || 'Unknown Class',
            qualityGrade: entry.qualityClass || 'Unspecified',
            baseRate: Number(entry.baseCost) || 0,
            unit: entry.unit || '$/SF',
            effectiveDate: entry.effectiveDate || 'Unknown',
          }));
          setRows(normalized);
          setIsSampleData(false);
        } else {
          setRows(SAMPLE_COST_SCHEDULES);
          setIsSampleData(true);
          setError('Cost schedule endpoint returned no records. Showing sample reference data.');
        }
      } catch (cause) {
        if (!active) {
          return;
        }
        setRows(SAMPLE_COST_SCHEDULES);
        setIsSampleData(true);
        setError(cause instanceof Error ? cause.message : 'Failed to load cost schedules.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadRows();

    return () => {
      active = false;
    };
  }, [qualityFilter]);

  const filtered = rows.filter((row) => {
    const matchesSearch = row.buildingClass.toLowerCase().includes(search.toLowerCase());
    const matchesQuality = qualityFilter === 'all' || row.qualityGrade === qualityFilter;
    return matchesSearch && matchesQuality;
  });

  return (
    <div className="space-y-4 p-4">
      {isSampleData && <DemoDataBanner module="Cost Manual" />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cost Manual Reference</h1>
          <p className="text-muted-foreground">
            Marshall &amp; Swift style cost schedules (read-only)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Source: {isSampleData ? 'Sample fallback' : 'Live cost schedule API'}
          </p>
          {error && (
            <p className="text-xs text-amber-600 mt-1">
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
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Average">Average</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
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
                    No matching cost schedules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
