// TFT-102 — Cost manual display component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { CostScheduleEntry } from '@/types/realEstate';
import { getCostSchedule } from '@/services/forge/propertyValuationClientService';

interface CostManualComponentProps {
  qualityClass?: string;
}

export function CostManualComponent({ qualityClass }: CostManualComponentProps) {
  const [entries, setEntries] = useState<CostScheduleEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCostSchedule({ qualityClass })
      .then(setEntries)
      .catch((e) => {
        setEntries([]);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [qualityClass]);

  const filteredEntries = entries.filter((entry) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      entry.code.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.qualityClass.toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cost Schedule</CardTitle>
        <Input
          placeholder="Search cost codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-3" data-testid="cost-manual-component-unavailable">
            <p className="text-sm font-medium">Live cost schedule unavailable.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Certified cost schedule rows are not being replaced with local sample data.
            </p>
            <p className="text-xs text-amber-500 mt-2">{error}</p>
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Base Cost</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.code}>
                  <TableCell className="font-mono text-xs">{entry.code}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.qualityClass}</TableCell>
                  <TableCell className="text-right">
                    ${entry.baseCost.toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.unit}</TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {error ? 'Cost schedule unavailable. No certified schedule rows are being shown.' : 'No entries found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
