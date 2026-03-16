// TFT-147 — Data quality page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { DataQualityScore } from '@/types/realEstate';
import { getDataQualityList } from '@/services/forge/neighborhoodClientService';

const GRADE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  A: 'default',
  B: 'default',
  C: 'secondary',
  D: 'outline',
  F: 'destructive',
};

export function DataQualityPage() {
  const [items, setItems] = useState<DataQualityScore[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('overallScore');

  useEffect(() => {
    setLoading(true);
    getDataQualityList({ grade: gradeFilter || undefined, sort: sortBy })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gradeFilter, sortBy]);

  return (
    <div data-testid="data-quality" className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Data Quality</h1>
      <p className="text-sm text-muted-foreground">
        Per-parcel quality scores with A-F grades
      </p>

      <div className="flex gap-2">
        {['', 'A', 'B', 'C', 'D', 'F'].map((g) => (
          <button
            key={g}
            onClick={() => setGradeFilter(g)}
            className={`rounded-md px-3 py-1 text-sm ${
              gradeFilter === g ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
            }`}
          >
            {g || 'All'}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quality Scores</CardTitle>
            <span className="text-xs text-muted-foreground">{total} parcels</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table data-material="bento">
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel ID</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Completeness</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Consistency</TableHead>
                  <TableHead className="text-right">Timeliness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.parcelId}>
                    <TableCell className="font-mono text-xs">{item.parcelId}</TableCell>
                    <TableCell>
                      <Badge variant={GRADE_VARIANT[item.overallGrade] ?? 'outline'}>
                        {item.overallGrade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">{item.overallScore.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-xs">{item.completeness.toFixed(0)}%</TableCell>
                    <TableCell className="text-right text-xs">{item.accuracy.toFixed(0)}%</TableCell>
                    <TableCell className="text-right text-xs">{item.consistency.toFixed(0)}%</TableCell>
                    <TableCell className="text-right text-xs">{item.timeliness.toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No results found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
