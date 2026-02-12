import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronUp, ChevronDown, Search, Check, Info  } from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ComparableRecord } from "./CompsMap";

interface CompsGridProps {
  records?: ComparableRecord[];
  isLoading?: boolean;
  error?: string;
  onComparableClick?: (comparable: ComparableRecord) => void;
  onComparableSelect?: (comparable: ComparableRecord, selected: boolean) => void;
  selectedIds?: number[];
  showSelectionColumn?: boolean;
  onPushToForm?: (comparable: ComparableRecord) => void;
}

type SortField =
  | "saleAmount"
  | "saleDate"
  | "squareFeet"
  | "distanceToSubject"
  | "yearBuilt"
  | "acreage"
  | "bedrooms"
  | "bathrooms";

type SortDirection = "asc" | "desc";

export function CompsGrid({
  records = [],
  isLoading = false,
  error,
  onComparableClick,
  onComparableSelect,
  selectedIds = [],
  showSelectionColumn = false,
  onPushToForm,
}: CompsGridProps) {
  const [sortField, setSortField] = useState<SortField>("saleDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterText, setFilterText] = useState("");
  const [detailRecord, setDetailRecord] = useState<ComparableRecord | null>(null);

  // Sort and filter records
  const sortedRecords = React.useMemo(() => {
    // First filter
    let filtered = records;
    if (filterText) {
      const lowercaseFilter = filterText.toLowerCase();
      filtered = records.filter(
        (record) =>
          record.address.toLowerCase().includes(lowercaseFilter) ||
          record.city.toLowerCase().includes(lowercaseFilter) ||
          record.county.toLowerCase().includes(lowercaseFilter)
      );
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      // Special handling for dates
      if (sortField === "saleDate") {
        const dateA = new Date(a.saleDate).getTime();
        const dateB = new Date(b.saleDate).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle numeric fields
      const fieldA = a[sortField as keyof typeof a] as number | undefined;
      const fieldB = b[sortField as keyof typeof b] as number | undefined;

      // Handle undefined values
      if (fieldA === undefined && fieldB === undefined) return 0;
      if (fieldA === undefined) return sortDirection === "asc" ? -1 : 1;
      if (fieldB === undefined) return sortDirection === "asc" ? 1 : -1;

      // Normal numeric comparison
      return sortDirection === "asc"
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA);
    });
  }, [records, sortField, sortDirection, filterText]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending when changing fields
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleRowClick = (comparable: ComparableRecord) => {
    if (onComparableClick) {
      onComparableClick(comparable);
    }
  };

  const toggleSelection = (comparable: ComparableRecord) => {
    if (onComparableSelect) {
      const isSelected = selectedIds.includes(comparable.id);
      onComparableSelect(comparable, !isSelected);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading Comparable Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Comparables</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><>

          <CardTitle>Comparable Properties</CardTitle>
          <div
</> className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comparables..."
              className="pl-8"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
        <CardDescription>{sortedRecords.length} comparable properties found</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {showSelectionColumn && <TableHead className="w-12">Select</TableHead>}<>

                <TableHead>Address</TableHead>
                <TableHead
</>>
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("saleAmount")}
                  >
                    Sale Price {getSortIcon("saleAmount")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("saleDate")}
                  >
                    Sale Date {getSortIcon("saleDate")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("squareFeet")}
                  >
                    Size {getSortIcon("squareFeet")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("yearBuilt")}
                  >
                    Year {getSortIcon("yearBuilt")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("bedrooms")}
                  >
                    Beds {getSortIcon("bedrooms")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center focus:outline-none"
                    onClick={() => toggleSort("bathrooms")}
                  >
                    Baths {getSortIcon("bathrooms")}
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showSelectionColumn ? 9 : 8} className="h-24 text-center">
                    No comparable properties found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(record)}
                  >
                    {showSelectionColumn && (
                      <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelection(record)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium"><>

                      <div>{record.address}</div>
                      <div
</> className="text-xs text-muted-foreground">
                        {record.city}, {record.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">${record.saleAmount.toLocaleString()}</div>
                      {record.adjustedSaleAmount &&
                        record.adjustedSaleAmount !== record.saleAmount && (
                          <div className="text-xs text-muted-foreground">
                            Adj: ${record.adjustedSaleAmount.toLocaleString()}
                          </div>
                        )}
                    </TableCell><>

                    <TableCell>
                      {record.saleDate ? new Date(record.saleDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell
</>>
                      {record.squareFeet ? `${record.squareFeet.toLocaleString()} sqft` : "N/A"}
                    </TableCell><>

                    <TableCell>{record.yearBuilt || "N/A"}</TableCell>
                    <TableCell
</> className="hidden md:table-cell">
                      {record.bedrooms || "N/A"}
                    </TableCell><>

                    <TableCell className="hidden md:table-cell">
                      {record.bathrooms || "N/A"}
                    </TableCell>
                    <TableCell
</> className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDetailRecord(record)}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><>

                              <DialogTitle>Comparable Property Details</DialogTitle>
                              <DialogDescription
</>>
                                {record.address}, {record.city}, {record.state} {record.zipCode}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Sale Price</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  ${record.saleAmount.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Sale Date</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.saleDate
                                    ? new Date(record.saleDate).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Property Type</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.propertyType}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Year Built</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.yearBuilt || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Size</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.squareFeet
                                    ? `${record.squareFeet.toLocaleString()} sq ft`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Lot Size</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.acreage
                                    ? `${record.acreage.toLocaleString()} acres`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Beds</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.bedrooms || "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1"><>

                                <p className="text-sm font-medium leading-none">Baths</p>
                                <p
</> className="text-sm text-muted-foreground">
                                  {record.bathrooms || "N/A"}
                                </p>
                              </div>
                              {record.distanceToSubject && (
                                <div className="space-y-1 col-span-2"><>

                                  <p className="text-sm font-medium leading-none">
                                    Distance to Subject
                                  </p>
                                  <p
</> className="text-sm text-muted-foreground">
                                    {record.distanceToSubject.toFixed(2)} miles
                                  </p>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              {onPushToForm && (
                                <Button
                                  onClick={() => {
                                    onPushToForm(record);
                                    setDetailRecord(null);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Use as Comparable
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {onPushToForm && (
                          <Button variant="outline" size="sm" onClick={() => onPushToForm(record)}>
                            <Check className="h-4 w-4 mr-2" />
                            Use
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {selectedIds.length > 0 && (
        <CardFooter className="flex justify-between pt-4">
          <div>
            <Badge>{selectedIds.length} selected</Badge>
          </div>
          {onPushToForm && (
            <Button
              variant="secondary"
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={() => {
                const selectedRecord = sortedRecords.find((r) => r.id === selectedIds[0]);
                if (selectedRecord && onPushToForm) {
                  onPushToForm(selectedRecord);
                }
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Use Selected
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
