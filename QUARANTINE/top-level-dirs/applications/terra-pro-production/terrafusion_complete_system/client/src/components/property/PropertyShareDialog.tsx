import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, Link, Trash2, Calendar, AlertCircle  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyShareDialogProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyShareDialog({
  propertyId,
  isOpen,
  onClose,
}: PropertyShareDialogProps) {
  const { toast } = useToast();
  const [expiryDays, setExpiryDays] = useState<string>("7");
  const [viewsLimit, setViewsLimit] = useState<string>("10");
  const [showExpiration, setShowExpiration] = useState<boolean>(true);
  const [showViewLimit, setShowViewLimit] = useState<boolean>(false);
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeComparables, setIncludeComparables] = useState<boolean>(true);
  const [includeValuation, setIncludeValuation] = useState<boolean>(true);
  const [allowReports, setAllowReports] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch existing share links for this property
  const {
    data: shareLinks,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}/share-links`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen && propertyId > 0,
  });

  interface ShareLinkData {
    expiresAt?: string;
    viewsLimit?: number;
    includePhotos: boolean;
    includeComparables: boolean;
    includeValuation: boolean;
    allowReports: boolean;
  }

  // Create new share link
  const createShareLinkMutation = useMutation({
    mutationFn: async (shareData: ShareLinkData) => {
      return await apiRequest(`/api/properties/${propertyId}/share`, {
        method: "POST",
        data: shareData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/share-links`] });
      toast({
        title: "Share link created",
        description: "You can now share this property with others.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create share link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  interface PropertyShareLink {
    id: number;
    propertyId: number;
    userId: number;
    token: string;
    shareUrl: string;
    expiresAt?: string;
    viewsLimit?: number;
    viewCount: number;
    isActive: boolean;
    includePhotos: boolean;
    includeComparables: boolean;
    includeValuation: boolean;
    allowReports: boolean;
    createdAt: string;
    updatedAt: string;
  }

  // Delete share link
  const deleteShareLinkMutation = useMutation({
    mutationFn: async (shareLinkId: number) => {
      await apiRequest(`/api/property-shares/${shareLinkId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/share-links`] });
      toast({
        title: "Share link deleted",
        description: "The share link has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete share link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create new share link
  const handleCreateShareLink = () => {
    const shareData = {
      expiresAt: showExpiration
        ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      viewsLimit: showViewLimit ? parseInt(viewsLimit) : undefined,
      includePhotos,
      includeComparables,
      includeValuation,
      allowReports,
    };

    createShareLinkMutation.mutate(shareData);
  };

  // Handle copy link to clipboard
  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(token);
      setTimeout(() => setCopiedId(null), 2000);

      toast({
        title: "Link copied",
        description: "The share link has been copied to your clipboard.",
      });
    });
  };

  // Get formatted expiration date
  const getExpirationInfo = (expiresAt: string | undefined) => {
    if (!expiresAt) return "No expiration";

    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><>

          <DialogTitle>Share Property</DialogTitle>
          <DialogDescription
</>>
            Create and manage share links to provide property information to others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Share Link Form */}
          <div className="space-y-4"><>

            <h3 className="text-lg font-medium">Create New Share Link</h3>

            <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label htmlFor="expiration">Expiration</Label>
                    <div
</> className="text-muted-foreground text-xs">
                      Link will expire after this time
                    </div>
                  </div>
                  <Switch
                    id="expiration-toggle"
                    checked={showExpiration}
                    onCheckedChange={setShowExpiration}
                  />
                </div>

                {showExpiration && (
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select expiration" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem
</> value="3">3 days</SelectItem><>

                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem
</> value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label htmlFor="views-limit">Views Limit</Label>
                    <div
</> className="text-muted-foreground text-xs">
                      Limit number of times this can be viewed
                    </div>
                  </div>
                  <Switch
                    id="views-toggle"
                    checked={showViewLimit}
                    onCheckedChange={setShowViewLimit}
                  />
                </div>

                {showViewLimit && (<>

                  <Input
                    id="views-limit"
                    type="number"
                    min="1"
                    max="100"
                    value={viewsLimit}
                    onChange={(e) => setViewsLimit(e.target.value)}
                    placeholder="Number of views"
                  />
                )}
              </div>

              <div
</> className="space-y-4">
                <div className="space-y-2"><>

                  <Label className="text-sm font-medium">Include in Share</Label>

                  <div
</> className="flex items-center justify-between"><>

                    <Label
                      htmlFor="include-photos"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Property Photos
                    </Label>
                    <Switch
</>
                      id="include-photos"
                      checked={includePhotos}
                      onCheckedChange={setIncludePhotos}
                    />
                  </div>

                  <div className="flex items-center justify-between"><>

                    <Label
                      htmlFor="include-comparables"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Comparable Properties
                    </Label>
                    <Switch
</>
                      id="include-comparables"
                      checked={includeComparables}
                      onCheckedChange={setIncludeComparables}
                    />
                  </div>

                  <div className="flex items-center justify-between"><>

                    <Label
                      htmlFor="include-valuation"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Valuation Data
                    </Label>
                    <Switch
</>
                      id="include-valuation"
                      checked={includeValuation}
                      onCheckedChange={setIncludeValuation}
                    />
                  </div>

                  <div className="flex items-center justify-between"><>

                    <Label
                      htmlFor="allow-reports"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Appraisal Reports
                    </Label>
                    <Switch
</>
                      id="allow-reports"
                      checked={allowReports}
                      onCheckedChange={setAllowReports}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateShareLink}
              className="w-full"
              disabled={createShareLinkMutation.isPending}
            >
              {createShareLinkMutation.isPending ? "Creating..." : "Create Share Link"}
            </Button>
          </div>

          <Separator />

          {/* Existing Share Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Share Links</h3>

            {isLoading ? (
              <div className="text-center py-4">Loading share links...</div>
            ) : error ? (
              <div className="text-center py-4 text-destructive">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                Failed to load share links
              </div>
            ) : !shareLinks || !Array.isArray(shareLinks) || shareLinks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active share links for this property
              </div>
            ) : (
              <div className="space-y-3">
                {shareLinks &&
                  Array.isArray(shareLinks) &&
                  shareLinks.map((link: PropertyShareLink) => (
                    <Card key={link.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4 text-muted-foreground" /><>

                            <span className="font-medium">Share Link</span>

                            <div
</> className="flex gap-1">
                              {link.includePhotos && (
                                <Badge variant="outline" className="text-xs">
                                  Photos
                                </Badge>
                              )}
                              {link.includeComparables && (
                                <Badge variant="outline" className="text-xs">
                                  Comps
                                </Badge>
                              )}
                              {link.includeValuation && (
                                <Badge variant="outline" className="text-xs">
                                  Value
                                </Badge>
                              )}
                              {link.allowReports && (
                                <Badge variant="outline" className="text-xs">
                                  Reports
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {link.viewCount} view{link.viewCount !== 1 ? "s" : ""}
                              {link.viewsLimit ? ` of ${link.viewsLimit}` : ""}
                            </span>

                            {link.expiresAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{getExpirationInfo(link.expiresAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleCopyLink(link.token)}
                          >
                            {copiedId === link.token ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-1"
                            onClick={() => deleteShareLinkMutation.mutate(link.id)}
                            disabled={
                              deleteShareLinkMutation.isPending &&
                              deleteShareLinkMutation.variables === link.id
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleteShareLinkMutation.isPending &&
                            deleteShareLinkMutation.variables === link.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
