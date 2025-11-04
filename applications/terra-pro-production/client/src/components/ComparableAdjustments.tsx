import { useState } from "react";
import { AdjustmentModel, Comparable, ModelAdjustment, Property } from "@shared/schema";
import { useAdjustmentModels } from "@/hooks/useAdjustmentModels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, Edit, Plus, Trash2  } from '@mui/icons-material';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ComparableAdjustmentsProps {
  subjectProperty: Property;
  comparable: Comparable;
  selectedModel: AdjustmentModel;
  readOnly?: boolean;
}

export function ComparableAdjustments({
  subjectProperty,
  comparable,
  selectedModel,
  readOnly = false,
}: ComparableAdjustmentsProps) {
  const { toast } = useToast();
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<number | null>(null);
  const [newAdjustmentType, setNewAdjustmentType] = useState<string>("");
  const [newAdjustmentAmount, setNewAdjustmentAmount] = useState<string>("");
  const [newAdjustmentDescription, setNewAdjustmentDescription] = useState<string>("");
  const [isAddingAdjustment, setIsAddingAdjustment] = useState(false);

  const {
    getComparableAdjustments,
    createAdjustment,
    isCreatingAdjustment,
    updateAdjustment,
    isUpdatingAdjustment,
    deleteAdjustment,
    isDeletingAdjustment,
  } = useAdjustmentModels();

  const { data: adjustmentsData, isLoading: isLoadingAdjustments } = getComparableAdjustments(
    comparable.id,
    selectedModel.id
  );

  const adjustments = (adjustmentsData as ModelAdjustment[]) || [];

  // Calculate total adjustments
  const totalAdjustment = adjustments.reduce((sum, adj) => {
    const amount = parseFloat(adj.amount as string);
    return isNaN(amount) ? sum : sum + amount;
  }, 0);

  const adjustedPrice = parseFloat(comparable.salePrice as string) + totalAdjustment;

  const handleAddAdjustment = async () => {
    if (!newAdjustmentType || !newAdjustmentAmount) {
      toast({
        title: "Missing Information",
        description: "Adjustment type and amount are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAdjustment(
        {
          modelId: selectedModel.id,
          comparableId: comparable.id,
          adjustmentType: newAdjustmentType,
          amount: newAdjustmentAmount,
          description: newAdjustmentDescription || null,
        },
        {
          onSuccess: () => {
            setNewAdjustmentType("");
            setNewAdjustmentAmount("");
            setNewAdjustmentDescription("");
            setIsAddingAdjustment(false);
            toast({
              title: "Adjustment Added",
              description: "The adjustment has been added successfully",
            });
          },
          onError: (error) => {
            toast({
              title: "Failed to Add Adjustment",
              description: "There was an error adding the adjustment",
              variant: "destructive",
            });
            console.error("Error adding adjustment:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error adding adjustment:", error);
    }
  };

  const handleUpdateAdjustment = async (id: number, data: any) => {
    try {
      await updateAdjustment(
        { id, data },
        {
          onSuccess: () => {
            setEditingAdjustmentId(null);
            toast({
              title: "Adjustment Updated",
              description: "The adjustment has been updated successfully",
            });
          },
          onError: (error) => {
            toast({
              title: "Failed to Update Adjustment",
              description: "There was an error updating the adjustment",
              variant: "destructive",
            });
            console.error("Error updating adjustment:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error updating adjustment:", error);
    }
  };

  const handleDeleteAdjustment = async (id: number) => {
    try {
      await deleteAdjustment(id, {
        onSuccess: () => {
          toast({
            title: "Adjustment Deleted",
            description: "The adjustment has been deleted successfully",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to Delete Adjustment",
            description: "There was an error deleting the adjustment",
            variant: "destructive",
          });
          console.error("Error deleting adjustment:", error);
        },
      });
    } catch (error) {
      console.error("Error deleting adjustment:", error);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[250px] w-full" />
    </div>
  );

  if (isLoadingAdjustments) {
    return renderSkeleton();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle className="text-lg">
            Comparable: {comparable.address}, {comparable.city}
          </CardTitle>
          <Badge
</> variant="outline" className="ml-2">
            Sale Price: ${parseFloat(comparable.salePrice as string).toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {adjustments.length === 0 && !isAddingAdjustment ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-4" />
            <p>No adjustments defined for this comparable</p>
            {!readOnly && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddingAdjustment(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Adjustment
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Adjustment Type</TableHead>
                  <TableHead
</>>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {!readOnly && <TableHead className="w-[120px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    {editingAdjustmentId === adjustment.id ? (
                      <>
                        <TableCell><>

                          <Input
                            value={adjustment.adjustmentType}
                            onChange={(e) =>
                              handleUpdateAdjustment(adjustment.id, {
                                adjustmentType: e.target.value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell
</>><>

                          <Input
                            value={adjustment.description || ""}
                            onChange={(e) =>
                              handleUpdateAdjustment(adjustment.id, { description: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell
</> className="text-right"><>

                          <Input
                            type="number"
                            value={adjustment.amount}
                            onChange={(e) =>
                              handleUpdateAdjustment(adjustment.id, { amount: e.target.value })
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell
</> className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingAdjustmentId(null)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <><>

                        <TableCell>{adjustment.adjustmentType}</TableCell>
                        <TableCell
</>>{adjustment.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(adjustment.amount as string).toLocaleString()}
                        </TableCell>
                        {!readOnly && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAdjustmentId(adjustment.id)}
                              ><>

                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
</>
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAdjustment(adjustment.id)}
                                disabled={isDeletingAdjustment}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))}

                {isAddingAdjustment && (
                  <TableRow>
                    <TableCell><>

                      <Input
                        placeholder="Type (e.g., Location)"
                        value={newAdjustmentType}
                        onChange={(e) => setNewAdjustmentType(e.target.value)}
                      />
                    </TableCell>
                    <TableCell
</>><>

                      <Input
                        placeholder="Description (optional)"
                        value={newAdjustmentDescription}
                        onChange={(e) => setNewAdjustmentDescription(e.target.value)}
                      />
                    </TableCell>
                    <TableCell
</> className="text-right"><>

                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newAdjustmentAmount}
                        onChange={(e) => setNewAdjustmentAmount(e.target.value)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell
</> className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleAddAdjustment}
                          disabled={isCreatingAdjustment}
                        ><>

                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
</>
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsAddingAdjustment(false)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Total row */}
                <TableRow className="font-medium"><>

                  <TableCell colSpan={2} className="text-right">
                    Total Adjustments:
                  </TableCell>
                  <TableCell
</> className="text-right">${totalAdjustment.toLocaleString()}</TableCell>
                  {!readOnly && <TableCell></TableCell>}
                </TableRow>
                <TableRow className="font-medium"><>

                  <TableCell colSpan={2} className="text-right">
                    Adjusted Price:
                  </TableCell>
                  <TableCell
</> className="text-right">${adjustedPrice.toLocaleString()}</TableCell>
                  {!readOnly && <TableCell></TableCell>}
                </TableRow>
              </TableBody>
            </Table>

            {!readOnly && !isAddingAdjustment && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setIsAddingAdjustment(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
