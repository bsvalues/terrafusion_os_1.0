import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import type { Calculation } from '@/types/api';
import { format } from "date-fns";
import {
    BuildingIcon,
    CalendarIcon,
    DollarSignIcon,
    DownloadIcon,
    FileTextIcon,
    HistoryIcon,
    InfoIcon,
    MapPinIcon,
    SearchIcon,
    TrashIcon,
    XCircleIcon
} from "lucide-react";
import { useState } from "react";

export function CalculationHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRevalArea, setSelectedRevalArea] = useState("all-reval-areas");
  const [selectedBuildingType, setSelectedBuildingType] = useState("all-building-types");
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<number | null>(null);

  const {
    getAll,
    remove,
    formatCalculation,
    formatCurrency
  } = useCalculationHistory();

  const calculations: Calculation[] = getAll.data || [];

  // Get unique Reval Areas and building types for filtering
  const revalAreas = [...new Set(calculations.map(calc => calc.revalArea))];
  const buildingTypes = [...new Set(calculations.map(calc => calc.buildingType))];

  // Filter calculations based on search term and filters
  const filteredCalculations = calculations.filter(calc => {
    const matchesSearch =
      !searchTerm ||
      (calc.revalArea && calc.revalArea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (calc.buildingType && calc.buildingType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (calc.name && calc.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRevalArea = !selectedRevalArea || selectedRevalArea === "all-reval-areas" || calc.revalArea === selectedRevalArea;
    const matchesBuildingType = !selectedBuildingType || selectedBuildingType === "all-building-types" || calc.buildingType === selectedBuildingType;

    return matchesSearch && matchesRevalArea && matchesBuildingType;
  });

  // Handle view details
  const handleViewDetails = (calculation: any) => {
    setSelectedCalculation(calculation);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (id: number) => {
    setCalculationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete execution
  const handleDelete = async () => {
    if (calculationToDelete) {
      await remove.mutateAsync(calculationToDelete);
      setIsDeleteDialogOpen(false);
      setCalculationToDelete(null);

      // Also close details dialog if the deleted calculation is currently viewed
      if (selectedCalculation && selectedCalculation.id === calculationToDelete) {
        setSelectedCalculation(null);
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRevalArea("all-reval-areas");
    setSelectedBuildingType("all-building-types");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <HistoryIcon className="mr-2 h-5 w-5" />
              Calculation History
            </CardTitle>
            <CardDescription>
              View and manage your building cost calculation history
            </CardDescription>
          </div>
          <div>
            <Badge variant="outline" className="ml-2">
              {calculations.length} Calculations
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calculations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedRevalArea} onValueChange={setSelectedRevalArea}>
              <SelectTrigger className="w-[150px]">
                <div className="flex items-center">
                  <MapPinIcon className="mr-2 h-4 w-4" />
                  {selectedRevalArea === "all-reval-areas" ? "All Reval Areas" : selectedRevalArea}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-reval-areas">All Reval Areas</SelectItem>
                {revalAreas.filter(ra => ra?.trim()).map((ra) => (
                  <SelectItem key={ra} value={ra || ''}>
                    {ra}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBuildingType} onValueChange={setSelectedBuildingType}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <BuildingIcon className="mr-2 h-4 w-4" />
                  {selectedBuildingType === "all-building-types" ? "All Building Types" : selectedBuildingType}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-building-types">All Building Types</SelectItem>
                {buildingTypes.filter(type => type?.trim()).map((type) => (
                  <SelectItem key={type} value={type || ''}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || selectedRevalArea !== "all-reval-areas" || selectedBuildingType !== "all-building-types") && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <XCircleIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Calculations Table */}
        {getAll.isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCalculations.length === 0 ? (
          <div className="text-center py-8">
            <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No calculation history found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {calculations.length > 0
                ? "Try adjusting your filters or search term"
                : "Start by making a new building cost calculation"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>Building cost calculations history</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reval Area</TableHead>
                  <TableHead>Building Type</TableHead>
                  <TableHead>Square Footage</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalculations.map((calculation) => (
                  <TableRow key={calculation.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {calculation.createdAt ? format(new Date(calculation.createdAt), "MMM d, yyyy") : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {calculation.revalArea}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {calculation.buildingType}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(calculation.squareFootage || 0).toLocaleString()} sq.ft
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end">
                        <DollarSignIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                        {formatCurrency(parseFloat(calculation.totalCost || '0'))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(calculation)}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteConfirm(calculation.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Calculation Details Dialog */}
      {selectedCalculation && (
        <Dialog open={!!selectedCalculation} onOpenChange={(open) => !open && setSelectedCalculation(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileTextIcon className="mr-2 h-5 w-5" />
                Calculation Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about the building cost calculation
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="summary" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="factors">Factors</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Reval Area</p>
                    <p className="text-sm">{selectedCalculation.revalArea}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Building Type</p>
                    <p className="text-sm">{selectedCalculation.buildingType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Square Footage</p>
                    <p className="text-sm">{(selectedCalculation.squareFootage || 0).toLocaleString()} sq.ft</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Year Built</p>
                    <p className="text-sm">{selectedCalculation.yearBuilt || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Base Cost</p>
                    <p className="text-sm">{formatCurrency(parseFloat(selectedCalculation.baseCost))}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-sm font-semibold">{formatCurrency(parseFloat(selectedCalculation.totalCost))}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cost Per Sq.Ft</p>
                    <p className="text-sm">{formatCurrency(parseFloat(selectedCalculation.costPerSqft))}/sq.ft</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Calculation Date</p>
                    <p className="text-sm">{format(new Date(selectedCalculation.createdAt), "PPP")}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="factors" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Complexity Factor</p>
                    <p className="text-sm">{selectedCalculation.complexityFactor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Condition Factor</p>
                    <p className="text-sm">{selectedCalculation.conditionFactor || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Reval Area Factor</p>
                    <p className="text-sm">{selectedCalculation.revalAreaFactor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Condition</p>
                    <p className="text-sm">{selectedCalculation.condition || "N/A"}</p>
                  </div>
                  {selectedCalculation.depreciationAmount && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Depreciation Amount</p>
                      <p className="text-sm">{formatCurrency(parseFloat(selectedCalculation.depreciationAmount))}</p>
                    </div>
                  )}
                  {selectedCalculation.assessedValue && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Assessed Value</p>
                      <p className="text-sm">{formatCurrency(parseFloat(selectedCalculation.assessedValue))}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4 py-4">
                {selectedCalculation.materialsBreakdown ? (
                  <div className="space-y-3">
                    {Object.entries(selectedCalculation.materialsBreakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <p className="text-sm">{key}</p>
                        <p className="text-sm font-medium">{formatCurrency(parseFloat(value as string))}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No detailed breakdown available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCalculation(null)}>
                Close
              </Button>
              <Button>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export to PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Calculation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this calculation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              {remove.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CalculationHistory;
