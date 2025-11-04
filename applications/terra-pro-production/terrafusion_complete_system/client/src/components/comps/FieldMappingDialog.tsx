import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ComparableSnapshot } from "@shared/types/comps";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FieldMappingDialogProps {
  snapshot: ComparableSnapshot;
  onClose: () => void;
  onPushToForm: (formId: string, fieldMappings: Record<string, string>) => void;
}

interface Form {
  id: string;
  name: string;
  fields: {
    id: string;
    name: string;
    type: string;
    required?: boolean;
  }[];
}

export function FieldMappingDialog({ snapshot, onClose, onPushToForm }: FieldMappingDialogProps) {
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});

  // Fetch available forms
  const {
    data: forms,
    isLoading: isLoadingForms,
    error: formsError,
  } = useQuery({
    queryKey: ["/api/forms"],
    queryFn: async () => {
      return apiRequest<Form[]>("/api/forms");
    },
  });

  // Get the selected form
  const selectedForm = forms?.find((form) => form.id === selectedFormId);

  // Reset field mappings when form changes
  useEffect(() => {
    if (selectedForm) {
      // Initialize mappings to empty
      const initialMappings: Record<string, string> = {};

      // For each form field, try to find an automatic mapping based on name similarity
      selectedForm.fields.forEach((field) => {
        const formFieldName = field.name.toLowerCase();

        // Try to auto-map snapshot fields to form fields based on name similarity
        const matchingSnapshotField = Object.keys(snapshot.fields).find((snapshotField) => {
          const snapshotFieldLower = snapshotField.toLowerCase();
          return (
            snapshotFieldLower === formFieldName ||
            formFieldName.includes(snapshotFieldLower) ||
            snapshotFieldLower.includes(formFieldName)
          );
        });

        if (matchingSnapshotField) {
          initialMappings[field.id] = matchingSnapshotField;
        } else {
          initialMappings[field.id] = "";
        }
      });

      setFieldMappings(initialMappings);
    }
  }, [selectedFormId, selectedForm, snapshot]);

  // Update a specific field mapping
  const handleMappingChange = (formFieldId: string, snapshotField: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [formFieldId]: snapshotField,
    }));
  };

  // Handle the submit action
  const handleSubmit = () => {
    // Filter out any fields that weren't mapped
    const validMappings: Record<string, string> = {};
    Object.entries(fieldMappings).forEach(([formFieldId, snapshotField]) => {
      if (snapshotField) {
        validMappings[formFieldId] = snapshotField;
      }
    });

    onPushToForm(selectedFormId, validMappings);
  };

  // Get snapshot field options
  const snapshotFieldOptions = Object.keys(snapshot.fields).map((field) => ({
    value: field,
    label: field,
    sampleValue: formatFieldValue(snapshot.fields[field]),
  }));

  // Format field value for display
  function formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      return (
        JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? "..." : "")
      );
    }

    return String(value);
  }

  // Count mapped fields
  const mappedFieldsCount = Object.values(fieldMappings).filter(Boolean).length;
  const totalFieldsCount = selectedForm?.fields.length || 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><>

          <DialogTitle>Map Snapshot Data to Form</DialogTitle>
          <DialogDescription
</>>
            Select a form and map snapshot fields to form fields. This will push the snapshot data
            to the selected form.
          </DialogDescription>
        </DialogHeader>

        {isLoadingForms ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : formsError ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            Error loading forms:{" "}
            {formsError instanceof Error ? formsError.message : "Failed to load available forms"}
          </div>
        ) : forms && forms.length === 0 ? (
          <div className="bg-amber-50 text-amber-700 p-4 rounded-md">
            No forms available to push data to. Please create a form first.
          </div>
        ) : (
          <>
            <div className="mb-6"><>

              <Label htmlFor="form-select">Select a Form</Label>
              <Select
</> value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger id="form-select" className="w-full"><>

                  <SelectValue placeholder="Select a form to map data to" />
                </SelectTrigger>
                <SelectContent
</>>
                  {forms?.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormId && selectedForm && (
              <>
                <div className="bg-slate-50 p-3 rounded-md mb-4 text-sm">
                  <div>
                    <span className="font-semibold">Form:</span> {selectedForm.name}
                  </div>
                  <div>
                    <span className="font-semibold">Fields Mapped:</span> {mappedFieldsCount} of{" "}
                    {totalFieldsCount}
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow><>

                        <TableHead>Form Field</TableHead>
                        <TableHead
</>>Required</TableHead><>

                        <TableHead>Type</TableHead>
                        <TableHead
</>>Snapshot Field</TableHead>
                        <TableHead>Sample Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedForm.fields.map((field) => (
                        <TableRow key={field.id}><>

                          <TableCell className="font-medium">{field.name}</TableCell>
                          <TableCell
</>>
                            {field.required ? (
                              <span className="text-red-500">Yes</span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </TableCell><>

                          <TableCell>{field.type}</TableCell>
                          <TableCell
</>>
                            <Select
                              value={fieldMappings[field.id] || ""}
                              onValueChange={(value) => handleMappingChange(field.id, value)}
                            >
                              <SelectTrigger className="w-full"><>

                                <SelectValue placeholder="Select a field" />
                              </SelectTrigger>
                              <SelectContent
</>>
                                <SelectItem value="">-- None --</SelectItem>
                                {snapshotFieldOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 truncate max-w-[200px]">
                            {fieldMappings[field.id] ? (
                              formatFieldValue(snapshot.fields[fieldMappings[field.id]])
                            ) : (
                              <span className="text-gray-400 italic">No field selected</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <div className="flex-1 text-sm text-gray-500">
            {selectedFormId && (
              <>
                {mappedFieldsCount} of {totalFieldsCount} fields mapped
                {mappedFieldsCount === 0 && (
                  <span className="text-amber-500 ml-2">Please map at least one field</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2"><>

            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
</> onClick={handleSubmit} disabled={!selectedFormId || mappedFieldsCount === 0}>
              Push to Form
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
