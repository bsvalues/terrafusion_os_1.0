import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ComparableSale {
  id: string;
  apn: string;
  address: string;
  saleDate: string;
  salePrice: number;
  sqft: number;
  pricePerSqft: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  adjustedPrice: number;
  adjustmentTotal: number;
}

export function SalesComparisonGrid() {
  const [sales, setSales] = useState<ComparableSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('saleDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/valuation/comparable-sales');
        if (!res.ok) throw new Error('Failed to fetch comparable sales');
        setSales(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filtered = sales
    .filter((s) =>
      s.address.toLowerCase().includes(search.toLowerCase()) ||
      s.apn.includes(search)
    )
    .sort((a, b) => {
      const aVal = a[sortField as keyof ComparableSale];
      const bVal = b[sortField as keyof ComparableSale];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const csv = [
      ['APN', 'Address', 'Sale Date', 'Sale Price', 'Sqft', '$/Sqft', 'Adjusted Price'].join(','),
      ...filtered.map((s) =>
        [s.apn, `"${s.address}"`, s.saleDate, s.salePrice, s.sqft, s.pricePerSqft.toFixed(2), s.adjustedPrice].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparable-sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Comparison Grid</h1>
          <p className="text-muted-foreground">Comparable sales with adjustments</p>
        </div>
        <Badge variant="outline">BIV-089</Badge>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by APN or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortField} onValueChange={(v) => { setSortField(v); setSortDir('asc'); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saleDate">Sale Date</SelectItem>
            <SelectItem value="salePrice">Sale Price</SelectItem>
            <SelectItem value="sqft">Square Feet</SelectItem>
            <SelectItem value="pricePerSqft">Price/Sqft</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && <div className="p-8 text-center text-muted-foreground">Loading comparable sales...</div>}
          {error && <div className="p-8 text-center text-destructive">{error}</div>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('apn')}>APN</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('address')}>Address</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('saleDate')}>Sale Date</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('salePrice')}>Sale Price</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('sqft')}>Sqft</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('pricePerSqft')}>$/Sqft</TableHead>
                  <TableHead className="text-right">Adj Total</TableHead>
                  <TableHead className="text-right">Adj Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">{sale.apn}</TableCell>
                    <TableCell>{sale.address}</TableCell>
                    <TableCell>{sale.saleDate}</TableCell>
                    <TableCell className="text-right">${sale.salePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{sale.sqft.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${sale.pricePerSqft.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={sale.adjustmentTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {sale.adjustmentTotal >= 0 ? '+' : ''}${sale.adjustmentTotal.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${sale.adjustedPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No comparable sales found.
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
