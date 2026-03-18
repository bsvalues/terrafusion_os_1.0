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
    getCostSchedule({ qualityClass, search })
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [qualityClass, search]);

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
        {error && <p className="text-sm text-red-500">{error}</p>}
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
              {entries.map((entry) => (
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
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No entries found
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
