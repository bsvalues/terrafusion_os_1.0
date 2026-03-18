import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PropertyResult {
  parcelId: string;
  apn: string;
  address: string;
  owner: string;
  propertyType: string;
  assessedValue: number;
}

type SearchField = 'apn' | 'address' | 'owner';

interface PropertySearchProps {
  onSelectProperty?: (parcelId: string) => void;
}

export function PropertySearch({ onSelectProperty }: PropertySearchProps) {
  const [searchField, setSearchField] = useState<SearchField>('address');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ [searchField]: query });
      const res = await fetch(`/api/properties/search?${params}`);
      if (!res.ok) throw new Error('Search failed');
      setResults(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Search</h1>
          <p className="text-muted-foreground">Search by APN, address, or owner name</p>
        </div>
        <Badge variant="outline">BIV-101</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apn">APN</SelectItem>
                <SelectItem value="address">Address</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Search by ${searchField}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardContent className="p-0">
            {loading && <div className="p-8 text-center text-muted-foreground">Searching...</div>}
            {error && <div className="p-8 text-center text-destructive">{error}</div>}
            {!loading && !error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>APN</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Assessed Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((p) => (
                    <TableRow
                      key={p.parcelId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectProperty?.(p.parcelId)}
                    >
                      <TableCell className="font-mono text-sm">{p.apn}</TableCell>
                      <TableCell>{p.address}</TableCell>
                      <TableCell>{p.owner}</TableCell>
                      <TableCell><Badge variant="secondary">{p.propertyType}</Badge></TableCell>
                      <TableCell className="text-right">${p.assessedValue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {results.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No properties found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
