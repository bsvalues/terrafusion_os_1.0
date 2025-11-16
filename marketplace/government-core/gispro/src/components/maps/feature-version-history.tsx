import React, { useState, useEffect } from 'react';
import { 
  FeatureVersion, 
  FeatureVersionTracker 
} from '@/lib/advanced-drawing-utils';
import { GeoJSONFeature } from '@/lib/map-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';
import { CheckCircle, Clock, AlertCircle, RotateCcw  } from '@mui/icons-material';

interface FeatureVersionHistoryProps {
  featureId: string;
  versionTracker: FeatureVersionTracker;
  onVersionRestore?: (version: FeatureVersion) => void;
  onVersionCompare?: (version1: FeatureVersion, version2: FeatureVersion) => void;
  onClose?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Component that displays version history for a feature
 */
export function FeatureVersionHistory({
  featureId,
  versionTracker,
  onVersionRestore,
  onVersionCompare,
  onClose,
  open,
  setOpen
}: FeatureVersionHistoryProps) {
  const [versions, setVersions] = useState<FeatureVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<FeatureVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<FeatureVersion[]>([]);
  const { toast } = useToast();
  
  // Load versions when feature ID changes
  useEffect(() => {
    if (featureId) {
      const history = versionTracker.getVersions(featureId);
      setVersions(history);
      
      // Reset selections
      setSelectedVersion(null);
      setCompareMode(false);
      setCompareVersions([]);
    }
  }, [featureId, versionTracker]);
  
  // Handle version selection
  const handleVersionSelect = (version: FeatureVersion) => {
    if (!compareMode) {
      setSelectedVersion(version);
    } else {
      // In compare mode, we need to select 2 versions
      if (compareVersions.length === 0) {
        setCompareVersions([version]);
      } else if (compareVersions.length === 1) {
        if (compareVersions[0].id === version.id) {
          // Deselect if clicking the same version
          return;
        }
        
        // Complete the comparison pair
        const newCompareVersions = [...compareVersions, version].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        
        setCompareVersions(newCompareVersions);
        
        // Trigger comparison
        if (onVersionCompare) {
          onVersionCompare(newCompareVersions[0], newCompareVersions[1]);
        }
      }
    }
  };
  
  // Handle version restore
  const handleVersionRestore = () => {
    if (!selectedVersion) return;
    
    if (onVersionRestore) {
      onVersionRestore(selectedVersion);
    }
    
    toast({
      title: "Version Restored",
      description: `Restored version from ${formatDate(selectedVersion.timestamp)}`,
    });
    
    // Close dialog after restoration
    setOpen(false);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    return formatDistance(date, new Date(), { addSuffix: true });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><>

          <DialogTitle>Feature Version History</DialogTitle>
          <DialogDescription
</>
</>>
            View and restore previous versions of this feature
          </DialogDescription>
        </DialogHeader>
        
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No version history available for this feature
            </p>
          </div>
        ) : (
            <div className="flex justify-between items-center mb-4"><>

              <div className="text-sm text-muted-foreground">
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </div>
              
              <Button
</>

                variant="outline"
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareVersions([]);
                }}
              >
                {compareMode ? 'Exit Compare Mode' : 'Compare Versions'}
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead
</>
</>>Description</TableHead><>

                  <TableHead className="w-[140px]">Created By</TableHead>
                  <TableHead
</>
className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version /* , index */) => (
                  <TableRow 
                    key={version.id}
                    className={`cursor-pointer ${
                      selectedVersion?.id === version.id ? 'bg-primary/10' : ''
                    } ${
                      compareVersions.some(v => v.id === version.id) ? 'bg-secondary/20' : ''
                    }`}
                    onClick={() => handleVersionSelect(version)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col"><>

                        <span>{formatDate(version.timestamp)}</span>
                        <span
</>
className="text-xs text-muted-foreground">
                          {formatRelativeTime(version.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {version.description || 'No description'}
                      {index === 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Current
                        </span>
                      )}
                    </TableCell><>

                    <TableCell>{version.createdBy || 'System'}</TableCell>
                    <TableCell
</>
</>>
                      {index > 0 && !compareMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                          }}
                          className={selectedVersion?.id === version.id ? 'bg-primary text-primary-foreground' : ''}
                        >
                          Select
                        </Button>
                      )}
                      {compareMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVersionSelect(version);
                          }}
                          className={compareVersions.some(v => v.id === version.id) ? 'bg-secondary text-secondary-foreground' : ''}
                        >
                          {compareVersions.some(v => v.id === version.id) ? 'Selected' : 'Compare'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {selectedVersion && !compareMode && (
              <div className="mt-6 border rounded-md p-4"><>

                <h3 className="text-lg font-medium mb-2">Version Details</h3>
                <div
</>
className="grid grid-cols-2 gap-4">
                  <div><>

                    <p className="text-sm font-medium">Date:</p>
                    <p
</>
className="text-sm">{formatDate(selectedVersion.timestamp)}</p>
                  </div>
                  <div><>

                    <p className="text-sm font-medium">Created By:</p>
                    <p
</>
className="text-sm">{selectedVersion.createdBy || 'System'}</p>
                  </div>
                  <div className="col-span-2"><>

                    <p className="text-sm font-medium">Description:</p>
                    <p
</>
className="text-sm">{selectedVersion.description || 'No description'}</p>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="details"><>

                    <AccordionTrigger>Show Feature Details</AccordionTrigger>
                    <AccordionContent
</>
</>>
                      <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                        {JSON.stringify(selectedVersion.feature, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            
            {compareMode && compareVersions.length > 0 && (
              <div className="mt-6 border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">
                  {compareVersions.length === 1 
                    ? 'Select another version to compare' 
                    : 'Version Comparison'}
                </h3>
                
                {compareVersions.length === 2 && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border rounded-md p-3"><>

                      <h4 className="text-md font-medium mb-1">Newer Version</h4>
                      <p
</>
className="text-sm text-muted-foreground mb-2">
                        {formatDate(compareVersions[0].timestamp)}
                      </p>
                      <p className="text-sm mb-3">
                        {compareVersions[0].description || 'No description'}
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-3"><>

                      <h4 className="text-md font-medium mb-1">Older Version</h4>
                      <p
</>
className="text-sm text-muted-foreground mb-2">
                        {formatDate(compareVersions[1].timestamp)}
                      </p>
                      <p className="text-sm mb-3">
                        {compareVersions[1].description || 'No description'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
        )}
        
        <DialogFooter className="mt-6">
          {selectedVersion && !compareMode && selectedVersion.id !== versions[0]?.id && (
            <Button 
              onClick={handleVersionRestore}
              className="mr-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          )}
          
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeatureVersionHistory;