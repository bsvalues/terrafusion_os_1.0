import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ArrowLeftRight, ExternalLink, Share2, FileText  } from '@mui/icons-material';
import { ComparableSnapshot } from "@shared/types/comps";
import { SnapshotTile } from "./SnapshotTile";
import { SnapshotDiff } from "./SnapshotDiff";
import { FieldMappingDialog } from "./FieldMappingDialog";
import { useSnapshotHistory } from "@/hooks/useSnapshotHistory";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

interface SnapshotViewerProps {
  propertyId: string;
}

export function SnapshotViewer({ propertyId }: SnapshotViewerProps) {
  const [activeTab, setActiveTab] = useState("history");
  const [selectedSnapshot, setSelectedSnapshot] = useState<ComparableSnapshot | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<ComparableSnapshot | null>(null);
  const [showFieldMappingDialog, setShowFieldMappingDialog] = useState(false);

  const { snapshots, isLoading, error, pushToForm } = useSnapshotHistory(propertyId);

  // Reset selected snapshots when property changes
  useEffect(() => {
    setSelectedSnapshot(null);
    setCompareSnapshot(null);
  }, [propertyId]);

  // Select a snapshot for viewing or comparison
  const handleSelectSnapshot = (snapshot: ComparableSnapshot) => {
    if (activeTab === "compare" && selectedSnapshot) {
      setCompareSnapshot(snapshot);
    } else {
      setSelectedSnapshot(snapshot);

      // If we're in compare mode and no primary snapshot was selected yet,
      // move to the first position and clear the comparison
      if (activeTab === "compare") {
        setCompareSnapshot(null);
      }
    }
  };

  // Clear selected snapshot for comparison
  const handleClearComparison = () => {
    setCompareSnapshot(null);
  };

  // Show the field mapping dialog
  const handlePushToForm = () => {
    if (selectedSnapshot) {
      setShowFieldMappingDialog(true);
    }
  };

  // Close the field mapping dialog
  const handleCloseFieldMapping = () => {
    setShowFieldMappingDialog(false);
  };

  // Push snapshot data to a form
  const handlePushSnapshotToForm = (formId: string, fieldMappings: Record<string, string>) => {
    if (selectedSnapshot) {
      pushToForm(selectedSnapshot, formId, fieldMappings);
      setShowFieldMappingDialog(false);
    }
  };

  // Swap selected snapshots for comparison
  const handleSwapSnapshots = () => {
    if (selectedSnapshot && compareSnapshot) {
      const temp = selectedSnapshot;
      setSelectedSnapshot(compareSnapshot);
      setCompareSnapshot(temp);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader><>

          <CardTitle>Snapshot History</CardTitle>
          <CardDescription
</>>Loading property snapshots...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="w-full bg-red-50 border-red-200">
        <CardHeader><>

          <CardTitle className="text-red-800">Error Loading Snapshots</CardTitle>
          <CardDescription
</> className="text-red-700">
            There was a problem loading the snapshot history
          </CardDescription>
        </CardHeader>
        <CardContent><>

          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : String(error)}
          </p>
          <Button
</> onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader><>

          <CardTitle>Snapshot History</CardTitle>
          <CardDescription
</>>No snapshots available for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<History className="h-12 w-12 text-gray-400" />}
            title="No Snapshot History"
            description="This property doesn't have any snapshot history recorded yet. 
              Snapshots are created when property data is imported or edited."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle>Snapshot History</CardTitle>
            <CardDescription
</>>
              {snapshots.length} snapshots available for this property
            </CardDescription>
          </div>

          {selectedSnapshot && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePushToForm}><>

                <FileText className="mr-2 h-4 w-4" />
                Push to Form
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/api/snapshots/${selectedSnapshot.id}/export`, "_blank")
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          defaultValue="history"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="history"><>

              <History className="mr-2 h-4 w-4" />
              History View
            </TabsTrigger>
            <TabsTrigger
</> value="compare">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Compare Snapshots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snapshot) => (
                <SnapshotTile
                  key={snapshot.id}
                  snapshot={snapshot}
                  isSelected={selectedSnapshot?.id === snapshot.id}
                  onClick={() => handleSelectSnapshot(snapshot)}
                />
              ))}
            </div>

            {selectedSnapshot && (
              <div className="mt-6 pt-6 border-t"><>

                <h3 className="text-lg font-semibold mb-4">Selected Snapshot Details</h3>
                <pre
</> className="bg-slate-50 p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(selectedSnapshot, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Base Snapshot</h3>
                {!selectedSnapshot ? (
                  <Card className="bg-slate-50 border-dashed border-2 p-6 text-center"><>

                    <p className="text-gray-500 mb-2">Select a base snapshot</p>
                    <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {snapshots.slice(0, 3).map((snapshot) => (
                        <SnapshotTile
                          key={snapshot.id}
                          snapshot={snapshot}
                          isSelected={false}
                          compact={true}
                          onClick={() => handleSelectSnapshot(snapshot)}
                        />
                      ))}
                      {snapshots.length > 3 && (
                        <div className="text-sm text-gray-500 p-2">
                          + {snapshots.length - 3} more
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (<>

                  <SnapshotTile snapshot={selectedSnapshot} isSelected={true} onClick={() => {}} />
                )}
              </div>

              <div
</>>
                <h3 className="font-medium mb-3">Comparison Snapshot</h3>
                {!compareSnapshot ? (
                  <Card className="bg-slate-50 border-dashed border-2 p-6 text-center">
                    <p className="text-gray-500 mb-2">
                      {selectedSnapshot
                        ? "Select a snapshot to compare"
                        : "First select a base snapshot"}
                    </p>
                    {selectedSnapshot && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {snapshots
                          .filter((s) => s.id !== selectedSnapshot.id)
                          .slice(0, 4)
                          .map((snapshot) => (
                            <SnapshotTile
                              key={snapshot.id}
                              snapshot={snapshot}
                              isSelected={false}
                              compact={true}
                              onClick={() => handleSelectSnapshot(snapshot)}
                            />
                          ))}
                        {snapshots.length > 5 && (
                          <div className="text-sm text-gray-500 p-2">
                            + {snapshots.length - 5} more
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ) : (
                  <div>
                    <div className="flex justify-between mb-2"><>

                      <Button variant="ghost" size="sm" onClick={handleClearComparison}>
                        Clear
                      </Button>
                      <Button
</> variant="ghost" size="sm" onClick={handleSwapSnapshots}>
                        <Share2 className="mr-1 h-4 w-4" /> Swap
                      </Button>
                    </div>
                    <SnapshotTile snapshot={compareSnapshot} isSelected={true} onClick={() => {}} />
                  </div>
                )}
              </div>
            </div>

            {selectedSnapshot && compareSnapshot && (
              <div className="mt-6 pt-6 border-t"><>

                <h3 className="text-lg font-semibold mb-4">Comparison Results</h3>
                <SnapshotDiff
</> baseSnapshot={selectedSnapshot} compareSnapshot={compareSnapshot} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {showFieldMappingDialog && selectedSnapshot && (
        <FieldMappingDialog
          snapshot={selectedSnapshot}
          onClose={handleCloseFieldMapping}
          onPushToForm={handlePushSnapshotToForm}
        />
      )}
    </Card>
  );
}
