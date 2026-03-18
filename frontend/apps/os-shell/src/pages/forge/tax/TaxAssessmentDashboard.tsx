import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LevyRate {
  district: string;
  rate: number;
  amount: number;
}

interface TaxAssessment {
  parcelId: string;
  assessedValue: number;
  taxableValue: number;
  exemptions: Array<{ type: string; amount: number }>;
  levyRates: LevyRate[];
  totalTax: number;
  taxYear: number;
}

interface TaxAssessmentDashboardProps {
  parcelId: string;
}

export function TaxAssessmentDashboard({ parcelId }: TaxAssessmentDashboardProps) {
  const [assessment, setAssessment] = useState<TaxAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTax = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tax/assessment/${parcelId}`);
        if (!res.ok) throw new Error('Failed to fetch tax assessment');
        setAssessment(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchTax();
  }, [parcelId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tax assessment...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!assessment) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Assessment Dashboard</h1>
          <p className="text-muted-foreground">Tax year {assessment.taxYear}</p>
        </div>
        <Badge variant="outline">BIV-112</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Assessed Value</div>
            <div className="text-2xl font-bold">${assessment.assessedValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Taxable Value</div>
            <div className="text-2xl font-bold">${assessment.taxableValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Tax</div>
            <div className="text-2xl font-bold">${assessment.totalTax.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {assessment.exemptions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Exemptions Applied</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exemption Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessment.exemptions.map((ex, i) => (
                  <TableRow key={i}>
                    <TableCell>{ex.type}</TableCell>
                    <TableCell className="text-right">${ex.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Levy Rates by District</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Rate (per $1,000)</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessment.levyRates.map((levy, i) => (
                <TableRow key={i}>
                  <TableCell>{levy.district}</TableCell>
                  <TableCell className="text-right">${levy.rate.toFixed(4)}</TableCell>
                  <TableCell className="text-right">${levy.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
