import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Pencil, Plus, Trash2, Download, Settings  } from '@mui/icons-material';
import config from "@shared/config";

interface Adjustment {
  id: string;
  comparableId: string;
  adjustmentType: string;
  amount: string;
  description: string;
}

interface Comparable {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  salePrice: string;
  saleDate: string;
  propertyType: string;
  yearBuilt: number | string;
  grossLivingArea: string;
  bedrooms: string;
  bathrooms: string;
  adjustments: Adjustment[];
}

interface BatchAdjustmentsProps {
  comparables: Comparable[];
  onUpdate: (comparables: Comparable[]) => void;
  appraisalId: string;
}

const BatchAdjustments: React.FC<BatchAdjustmentsProps> = ({
  comparables,
  onUpdate,
  appraisalId,
}) => {
  const { toast } = useToast();
  const [selectedComparables, setSelectedComparables] = useState<string[]>([]);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState("");
  const [bulkAdjustmentAmount, setBulkAdjustmentAmount] = useState("");
  const [bulkAdjustmentDescription, setBulkAdjustmentDescription] = useState("");

  // Export options
  const [exportFormat, setExportFormat] = useState<"pdf" | "zip">("zip");
  const [exportOptions, setExportOptions] = useState({
    includeCover: config.pdfExport.defaultOptionsIncludeCover,
    includePhotos: config.pdfExport.defaultOptionsIncludePhotos,
    includeAdjustments: config.pdfExport.defaultOptionsIncludeAdjustments,
    includeAIAnnotations: config.pdfExport.enableAIAnnotations,
    addWatermark: config.pdfExport.addWatermark,
    watermarkText: config.pdfExport.watermarkText,
    includeMetadata: config.zipExport.includeMetadata,
  });

  // Select/deselect all comparables
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComparables(comparables.map((comp) => comp.id));
    } else {
      setSelectedComparables([]);
    }
  };

  // Toggle selection of a single comparable
  const handleSelectComparable = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedComparables([...selectedComparables, id]);
    } else {
      setSelectedComparables(selectedComparables.filter((compId) => compId !== id));
    }
  };

  // Apply bulk adjustment to selected comparables
  const applyBulkAdjustment = () => {
    if (!bulkAdjustmentType || !bulkAdjustmentAmount) {
      toast({
        title: "Missing fields",
        description: "Please provide an adjustment type and amount.",
        variant: "destructive",
      });
      return;
    }

    // Create a new adjustment for each selected comparable
    const updatedComparables = comparables.map((comp) => {
      if (selectedComparables.includes(comp.id)) {
        const newAdjustment = {
          id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          comparableId: comp.id,
          adjustmentType: bulkAdjustmentType,
          amount: bulkAdjustmentAmount,
          description: bulkAdjustmentDescription || `${bulkAdjustmentType} adjustment`,
        };

        return {
          ...comp,
          adjustments: [...comp.adjustments, newAdjustment],
        };
      }
      return comp;
    });

    // Update comparables in parent component
    onUpdate(updatedComparables);
    setIsAdjustmentModalOpen(false);

    // Reset form fields
    setBulkAdjustmentType("");
    setBulkAdjustmentAmount("");
    setBulkAdjustmentDescription("");

    toast({
      title: "Adjustment applied",
      description: `Applied ${bulkAdjustmentType} adjustment to ${selectedComparables.length} comparables.`,
    });
  };

  // Delete adjustment
  const deleteAdjustment = (comparableId: string, adjustmentId: string) => {
    const updatedComparables = comparables.map((comp) => {
      if (comp.id === comparableId) {
        return {
          ...comp,
          adjustments: comp.adjustments.filter((adj) => adj.id !== adjustmentId),
        };
      }
      return comp;
    });

    onUpdate(updatedComparables);

    toast({
      title: "Adjustment deleted",
      description: "The adjustment has been removed.",
    });
  };

  // Export selected comparables
  const handleExport = async () => {
    if (selectedComparables.length === 0) {
      toast({
        title: "No comparables selected",
        description: "Please select at least one comparable to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedIds = selectedComparables;

      // Call the export API based on format selection
      const endpoint =
        exportFormat === "pdf"
          ? `/api/comparables/${selectedIds[0]}/export-pdf`
          : `/api/appraisals/${appraisalId}/export-zip`;

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          appraisalId,
          options: exportOptions,
        }),
      };

      // In a real implementation, we would make a fetch call to the backend
      // For demo purposes, simulate the export process
      toast({
        title: "Export started",
        description: "Preparing export files...",
      });

      // Simulate processing time
      setTimeout(() => {
        setIsExportModalOpen(false);

        toast({
          title: "Export complete",
          description: `${exportFormat === "pdf" ? "PDF" : "ZIP archive"} has been generated successfully.`,
        });

        // In a real implementation, we would trigger a download
        // For demo, just show success message
      }, 1500);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate adjusted prices
  const getAdjustedPrice = (comparable: Comparable) => {
    const salePrice = parseFloat(comparable.salePrice);
    if (isNaN(salePrice)) return "N/A";

    let totalAdjustment = 0;
    if (comparable.adjustments && comparable.adjustments.length > 0) {
      totalAdjustment = comparable.adjustments.reduce((sum, adj) => {
        const amount = parseFloat(adj.amount);
        return isNaN(amount) ? sum : sum + amount;
      }, 0);
    }

    const adjustedPrice = salePrice + totalAdjustment;
    return `$${adjustedPrice.toLocaleString()}`;
  };

  // Export a single comparable as PDF
  const handleExportSinglePDF = async (comparable: Comparable) => {
    try {
      toast({
        title: "Export started",
        description: `Preparing PDF for ${comparable.address}...`,
      });

      // In a real implementation, we would make a fetch call to the backend
      // const endpoint = `/api/comparables/${comparable.id}/export-pdf`;
      // const response = await fetch(endpoint, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     options: exportOptions,
      //   }),
      // });

      // For demo purposes, simulate the export process
      showDemoWarning();

      // Simulate processing time
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: "PDF has been generated successfully.",
        });
      }, 1000);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle export option
  const toggleExportOption = (option: string, value: boolean) => {
    setExportOptions({
      ...exportOptions,
      [option]: value,
    });
  };

  // Demo mode warning
  const showDemoWarning = () => {
    if (config.demoMode.enabled) {
      toast({
        title: "Demo Mode Active",
        description: "This is a demonstration. No actual files will be generated.",
      });
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedComparables.length > 0) {
                setIsAdjustmentModalOpen(true);
              } else {
                toast({
                  title: "No comparables selected",
                  description: "Please select at least one comparable to adjust.",
                  variant: "destructive",
                });
              }
            }}
            disabled={selectedComparables.length === 0}
          ><>

            <Plus className="h-4 w-4 mr-2" />
            Add Adjustment
          </Button>

          <Button
</>
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedComparables.length > 0) {
                setIsExportModalOpen(true);
                showDemoWarning();
              } else {
                toast({
                  title: "No comparables selected",
                  description: "Please select at least one comparable to export.",
                  variant: "destructive",
                });
              }
            }}
            disabled={selectedComparables.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {config.demoMode.enabled && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium border border-yellow-300">
              {config.demoMode.demoLabelText}
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Comparables table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Comparable Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><>

                  <Checkbox
                    checked={
                      selectedComparables.length === comparables.length && comparables.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
</>>Address</TableHead><>

                <TableHead>Sale Price</TableHead>
                <TableHead
</>>Sale Date</TableHead><>

                <TableHead>Adjustments</TableHead>
                <TableHead
</>>Adjusted Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparables.map((comparable) => (
                <TableRow key={comparable.id}>
                  <TableCell><>

                    <Checkbox
                      checked={selectedComparables.includes(comparable.id)}
                      onCheckedChange={(checked) =>
                        handleSelectComparable(comparable.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell
</>>
                    <div><>

                      <div className="font-medium">{comparable.address}</div>
                      <div
</> className="text-sm text-gray-500">
                        {comparable.city}, {comparable.state} {comparable.zipCode}
                      </div>
                    </div>
                  </TableCell><>

                  <TableCell>${parseInt(comparable.salePrice).toLocaleString()}</TableCell>
                  <TableCell
</>>{comparable.saleDate}</TableCell>
                  <TableCell>
                    {comparable.adjustments && comparable.adjustments.length > 0 ? (
                      <div className="space-y-1">
                        {comparable.adjustments.map((adjustment) => (
                          <div
                            key={adjustment.id}
                            className="flex items-center justify-between text-sm"
                          ><>

                            <span>{adjustment.adjustmentType}: </span>
                            <span
</>
                              className={`font-medium ${parseFloat(adjustment.amount) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {parseFloat(adjustment.amount) >= 0 ? "+" : ""}$
                              {parseInt(adjustment.amount).toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteAdjustment(comparable.id, adjustment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </TableCell><>

                  <TableCell className="font-medium">{getAdjustedPrice(comparable)}</TableCell>
                  <TableCell
</> className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportSinglePDF(comparable)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export as PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
              {comparables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No comparable properties found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk adjustment modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader><>

            <DialogTitle>Add Bulk Adjustment</DialogTitle>
            <DialogDescription
</>>
              Apply the same adjustment to all selected properties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><>

                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
</> value={bulkAdjustmentType} onValueChange={setBulkAdjustmentType}>
                  <SelectTrigger id="adjustmentType"><>

                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="Location">Location</SelectItem>
                    <SelectItem
</> value="GLA">Gross Living Area</SelectItem><>

                    <SelectItem value="Condition">Condition</SelectItem>
                    <SelectItem
</> value="Age">Age</SelectItem><>

                    <SelectItem value="FeatureAmenity">Feature/Amenity</SelectItem>
                    <SelectItem
</> value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="adjustmentAmount">Amount</Label>
                <Input
</>
                  id="adjustmentAmount"
                  type="text"
                  placeholder="e.g. 5000 or -3000"
                  value={bulkAdjustmentAmount}
                  onChange={(e) => setBulkAdjustmentAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2"><>

              <Label htmlFor="adjustmentDescription">Description (Optional)</Label>
              <Input
</>
                id="adjustmentDescription"
                placeholder="Describe the adjustment"
                value={bulkAdjustmentDescription}
                onChange={(e) => setBulkAdjustmentDescription(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2"><>

              <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>
                Cancel
              </Button>
              <Button
</> onClick={applyBulkAdjustment}>
                Apply to {selectedComparables.length} Properties
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export options modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader><>

            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription
</>>
              Configure export settings for {selectedComparables.length} selected properties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2"><>

              <Label>Export Format</Label>
              <div
</> className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="formatPDF"
                    checked={exportFormat === "pdf"}
                    onChange={() => setExportFormat("pdf")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="formatPDF" className="font-normal">
                    Single PDF
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="formatZIP"
                    checked={exportFormat === "zip"}
                    onChange={() => setExportFormat("zip")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="formatZIP" className="font-normal">
                    ZIP Archive
                  </Label>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {exportFormat === "pdf"
                  ? "Export as a single PDF file (only available when one property is selected)."
                  : "Export multiple PDFs in a ZIP archive with a metadata file."}
              </p>
            </div>

            <div className="border-t pt-4"><>

              <h4 className="font-medium mb-3">Content Options</h4>
              <div
</> className="space-y-3">
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="includeCover" className="font-normal">
                    Include cover page
                  </Label>
                  <Switch
</>
                    id="includeCover"
                    checked={exportOptions.includeCover}
                    onCheckedChange={(checked) => toggleExportOption("includeCover", checked)}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="includePhotos" className="font-normal">
                    Include property photos
                  </Label>
                  <Switch
</>
                    id="includePhotos"
                    checked={exportOptions.includePhotos}
                    onCheckedChange={(checked) => toggleExportOption("includePhotos", checked)}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="includeAdjustments" className="font-normal">
                    Include adjustments
                  </Label>
                  <Switch
</>
                    id="includeAdjustments"
                    checked={exportOptions.includeAdjustments}
                    onCheckedChange={(checked) => toggleExportOption("includeAdjustments", checked)}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="includeAIAnnotations" className="font-normal">
                    Include AI analysis
                  </Label>
                  <Switch
</>
                    id="includeAIAnnotations"
                    checked={exportOptions.includeAIAnnotations}
                    onCheckedChange={(checked) =>
                      toggleExportOption("includeAIAnnotations", checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4"><>

              <h4 className="font-medium mb-3">Advanced Options</h4>
              <div
</> className="space-y-3">
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="addWatermark" className="font-normal">
                    Add watermark
                  </Label>
                  <Switch
</>
                    id="addWatermark"
                    checked={exportOptions.addWatermark}
                    onCheckedChange={(checked) => toggleExportOption("addWatermark", checked)}
                  />
                </div>

                {exportOptions.addWatermark && (
                  <div className="space-y-2"><>

                    <Label htmlFor="watermarkText">Watermark Text</Label>
                    <Input
</>
                      id="watermarkText"
                      value={exportOptions.watermarkText}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, watermarkText: e.target.value })
                      }
                    />
                  </div>
                )}

                {exportFormat === "zip" && (
                  <div className="flex items-center justify-between"><>

                    <Label htmlFor="includeMetadata" className="font-normal">
                      Include metadata file
                    </Label>
                    <Switch
</>
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => toggleExportOption("includeMetadata", checked)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2"><>

              <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button
</> onClick={handleExport}>
                Generate {exportFormat === "pdf" ? "PDF" : "ZIP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchAdjustments;
