// TFT-157 — Property data search/listing page
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { PropertyListing } from '@/types/realEstate';

interface PropertyDataPageProps {
  onPropertySelect?: (parcelId: string) => void;
}

export function PropertyDataPage({ onPropertySelect }: PropertyDataPageProps) {
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = () => {
    if (!search.trim()) return;
    setLoading(true);
    fetch(`/api/properties?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((data) => {
        setProperties(data.items ?? data);
        setTotal(data.total ?? (data.items ?? data).length);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Property Data</h1>
      <p className="text-sm text-muted-foreground">
        Search and browse property records
      </p>

      <div className="flex gap-2 items-end">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Address, parcel ID, or owner..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Results</CardTitle>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">{total} properties</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'No properties found' : 'Enter a search term to find properties'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Sq Ft</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow
                    key={p.parcelId}
                    className={onPropertySelect ? 'cursor-pointer' : ''}
                    onClick={() => onPropertySelect?.(p.parcelId)}
                  >
                    <TableCell className="font-mono text-xs">{p.parcelId}</TableCell>
                    <TableCell className="text-xs">{p.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{p.propertyType}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      ${p.marketValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {p.squareFeet.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{p.yearBuilt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
