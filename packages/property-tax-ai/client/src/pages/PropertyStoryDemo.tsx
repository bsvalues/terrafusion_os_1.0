import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2, Share2, Eye, Trash2, Download, QrCode, Copy, Link, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PropertyStoryDemo() {
  const { toast } = useToast();
  const [propertyId, setPropertyId] = useState("BC101");
  const [multiplePropertyIds, setMultiplePropertyIds] = useState("BC101,BC102,BC103");
  const [comparePropertyIds, setComparePropertyIds] = useState("BC101,BC102,BC103");
  const [activeTab, setActiveTab] = useState("single");
  const [includeTax, setIncludeTax] = useState(true);
  const [includeAppeals, setIncludeAppeals] = useState(true);
  const [includeImprovements, setIncludeImprovements] = useState(true);
  const [includeLandRecords, setIncludeLandRecords] = useState(true);
  const [includeFields, setIncludeFields] = useState(true);
  
  // Property Insight Sharing state
  const [sharePropertyId, setSharePropertyId] = useState("BC001");
  const [shareTitle, setShareTitle] = useState("BC001 Property Analysis");
  const [shareInsightType, setShareInsightType] = useState("story");
  const [shareFormat, setShareFormat] = useState("detailed");
  const [shareExpiresInDays, setShareExpiresInDays] = useState("7");
  const [sharePassword, setSharePassword] = useState("");
  const [shareIsPublic, setShareIsPublic] = useState(true);
  const [viewShareId, setViewShareId] = useState("");
  const [viewSharePassword, setViewSharePassword] = useState("");
  
  // QR Code dialog state
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeCopying, setQrCodeCopying] = useState(false);
  const [qrCodeDownloading, setQrCodeDownloading] = useState(false);
  
  // PDF export state
  const [pdfDataLoading, setPdfDataLoading] = useState(false);
  
  // Email sharing states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("Property Insight Share");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Single property story mutation
  const singleStoryMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest(`/api/property-stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          propertyId: id,
          options: {
            tone: 'professional',
            includeTax,
            includeAppeals,
            includeImprovements,
            includeLandRecords,
            includeFields
          }
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-stories'] });
    },
    onError: (error) => {
      toast({
        title: "Error generating property story",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Multiple property stories mutation
  const multipleStoriesMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return apiRequest(`/api/property-stories/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          propertyIds: ids,
          options: {
            tone: 'professional',
            includeTax,
            includeAppeals,
            includeImprovements,
            includeLandRecords,
            includeFields
          }
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-stories/multiple'] });
    },
    onError: (error) => {
      toast({
        title: "Error generating multiple stories",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Compare properties mutation
  const comparePropertiesMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return apiRequest(`/api/property-stories/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          propertyIds: ids,
          options: {
            tone: 'professional',
            includeTax,
            includeAppeals,
            includeImprovements,
            includeLandRecords,
            includeFields
          }
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-stories/compare'] });
    },
    onError: (error) => {
      toast({
        title: "Error comparing properties",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Property Insight Sharing mutations
  const createShareMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest(`/api/property-insight-shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Share created successfully",
        description: `Share ID: ${data.shareId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-insight-shares'] });
    },
    onError: (error) => {
      toast({
        title: "Error creating share",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const getShareMutation = useMutation({
    mutationFn: ({ shareId, password }: { shareId: string, password?: string }) => {
      return apiRequest(`/api/property-insight-shares/${shareId}${password ? `?password=${password}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Share retrieved successfully",
        description: `Access count: ${data.accessCount}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error retrieving share",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const deleteShareMutation = useMutation({
    mutationFn: (shareId: string) => {
      return apiRequest(`/api/property-insight-shares/${shareId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Share deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/property-insight-shares'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting share",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Get all shares query
  const allSharesQuery = useQuery({
    queryKey: ['/api/property-insight-shares'],
    queryFn: () => apiRequest('/api/property-insight-shares'),
  });

  // Handlers
  const handleSingleGenerate = () => {
    singleStoryMutation.mutate(propertyId);
  };

  const handleMultipleGenerate = () => {
    const ids = multiplePropertyIds.split(',').map(id => id.trim());
    multipleStoriesMutation.mutate(ids);
  };

  const handleCompareGenerate = () => {
    const ids = comparePropertyIds.split(',').map(id => id.trim());
    comparePropertiesMutation.mutate(ids);
  };
  
  // Property Insight Sharing handlers
  const handleCreateShare = () => {
    // Generate property name based on property ID
    let propertyAddress = "Unknown Address";
    let propertyValue = "$0";
    
    // Map some sample property IDs to addresses and values for demonstration
    const propertyMap: Record<string, { address: string; value: string }> = {
      "BC001": { address: "1320 N Louis Ave, Benton City", value: "$285,000" },
      "BC002": { address: "4590 W Van Giesen St, Benton County", value: "$412,500" },
      "BC003": { address: "1124 Winding River Dr, West Richland", value: "$378,000" },
      "BC004": { address: "2550 Duportail St, Richland", value: "$450,000" },
      "BC005": { address: "1915 Mahan Ave, Richland", value: "$325,000" },
      "BC006": { address: "4711 W 34th Ave, Kennewick", value: "$295,000" }
    };
    
    if (sharePropertyId in propertyMap) {
      propertyAddress = propertyMap[sharePropertyId].address;
      propertyValue = propertyMap[sharePropertyId].value;
    }
    
    const insightData = {
      content: `This is a sample property insight for Property ID: ${sharePropertyId}`,
      generatedAt: new Date().toISOString(),
      propertyDetails: {
        id: sharePropertyId,
        address: propertyAddress,
        value: propertyValue,
        propertyName: `Property ${sharePropertyId}`,
      }
    };
    
    const expiresAt = shareExpiresInDays ? 
      new Date(Date.now() + parseInt(shareExpiresInDays) * 24 * 60 * 60 * 1000).toISOString() : 
      undefined;
      
    createShareMutation.mutate({
      propertyId: sharePropertyId,
      propertyName: `Property ${sharePropertyId}`,
      propertyAddress: propertyAddress,
      title: shareTitle,
      insightType: shareInsightType,
      insightData,
      format: shareFormat,
      expiresInDays: shareExpiresInDays ? parseInt(shareExpiresInDays) : undefined,
      password: sharePassword || undefined,
      isPublic: shareIsPublic
    });
  };
  
  const handleViewShare = () => {
    getShareMutation.mutate({
      shareId: viewShareId,
      password: viewSharePassword || undefined
    });
  };
  
  const handleDeleteShare = (shareId: string) => {
    deleteShareMutation.mutate(shareId);
  };
  
  // QR Code handler
  const handleShowQRCode = async (shareId: string) => {
    try {
      setQrCodeLoading(true);
      setActiveShareId(shareId);
      setQrDialogOpen(true);
      
      const response = await apiRequest(`/api/property-insight-shares/${shareId}/qrcode`);
      setQrCodeData(response.qrCode);
    } catch (error: any) {
      toast({
        title: "Error generating QR code",
        description: error.message || "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setQrCodeLoading(false);
    }
  };
  
  // PDF export handler
  const handleExportPDF = async (shareId: string) => {
    try {
      setPdfDataLoading(true);
      
      // Fetch PDF data
      const pdfData = await apiRequest(`/api/property-insight-shares/${shareId}/pdf-data`);
      
      // This would normally use jsPDF to generate a PDF on the client-side
      // For demo purposes, we'll just show a success notification
      toast({
        title: "PDF Data Retrieved Successfully",
        description: "A PDF would normally be generated and downloaded here",
      });
      
      // Log PDF data to console for demonstration
      console.log("PDF Export Data:", pdfData);
      
    } catch (error: any) {
      toast({
        title: "Error exporting PDF",
        description: error.message || "Failed to export PDF",
        variant: "destructive"
      });
    } finally {
      setPdfDataLoading(false);
    }
  };
  
  // Copy share link handler
  const handleCopyShareLink = (shareId: string) => {
    try {
      // Create shareable URL - this should match the URL format in SharingUtilsService
      const shareableUrl = `${window.location.origin}/share/${shareId}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableUrl);
      
      toast({
        title: "Link Copied to Clipboard",
        description: "Share link has been copied to clipboard"
      });
    } catch (error: any) {
      toast({
        title: "Failed to Copy Link",
        description: error.message || "Could not copy link to clipboard",
        variant: "destructive"
      });
    }
  };
  
  // Copy QR code image to clipboard
  const handleCopyQRCode = async () => {
    if (!qrCodeData) return;
    
    try {
      setQrCodeCopying(true);
      
      // Create an image element from the data URL
      const img = new Image();
      img.src = qrCodeData;
      
      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Create a canvas and draw the image on it
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      
      // Get the image as a blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error("Could not convert QR code to blob");
        }, 'image/png');
      });
      
      // Copy the image to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast({
        title: "QR Code Copied to Clipboard",
        description: "QR code image has been copied to clipboard"
      });
    } catch (error: any) {
      toast({
        title: "Failed to Copy QR Code",
        description: error.message || "Could not copy QR code to clipboard",
        variant: "destructive"
      });
    } finally {
      setQrCodeCopying(false);
    }
  };
  
  // Download QR code image
  const handleDownloadQRCode = async () => {
    if (!qrCodeData || !activeShareId) return;
    
    try {
      setQrCodeDownloading(true);
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `property-insight-qrcode-${activeShareId}.png`;
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "QR code image has been downloaded"
      });
    } catch (error: any) {
      toast({
        title: "Failed to Download QR Code",
        description: error.message || "Could not download QR code",
        variant: "destructive"
      });
    } finally {
      setQrCodeDownloading(false);
    }
  };
  
  // Email sharing handler
  const handleShowEmailDialog = (shareId: string) => {
    setActiveShareId(shareId);
    
    // Get property information for the selected share
    const share = allSharesQuery.data?.find((s: any) => s.shareId === shareId);
    
    if (share) {
      // Set default email subject and message
      setEmailSubject(`Property Insight: ${share.title}`);
      setEmailMessage(
        `I'd like to share this property insight with you:\n\n` +
        `Property: ${share.propertyName || `Property ${share.propertyId}`}\n` +
        `Address: ${share.propertyAddress || 'N/A'}\n\n` +
        `You can view it at: ${window.location.origin}/share/${shareId}\n\n` +
        `This is an automated message from the Benton County Assessor's Office Property Intelligence Platform.`
      );
      
      // Open the email dialog
      setEmailDialogOpen(true);
    }
  };
  
  // Send email handler
  const handleSendEmail = async () => {
    if (!activeShareId || !emailRecipient || !emailSubject || !emailMessage) return;
    
    try {
      setEmailSending(true);
      
      // API call to send the email
      await apiRequest(`/api/property-insight-shares/${activeShareId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: emailRecipient,
          subject: emailSubject,
          message: emailMessage
        })
      });
      
      // Close dialog and show success message
      setEmailDialogOpen(false);
      
      toast({
        title: "Email Sent Successfully",
        description: `Property insight has been emailed to ${emailRecipient}`,
      });
      
      // Reset form
      setEmailRecipient("");
      
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setEmailSending(false);
    }
  };

  // Render story output
  const renderStoryOutput = (data: any, isLoading: boolean, title: string) => {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data ? (
            <div className="whitespace-pre-wrap text-sm">
              {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
            </div>
          ) : (
            <div className="text-muted-foreground text-center h-60 flex items-center justify-center">
              Click "Generate" to see the property story
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Property Story Generator Demo</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>Configure what to include in the property stories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeTax" 
                checked={includeTax} 
                onCheckedChange={(checked) => setIncludeTax(checked as boolean)} 
              />
              <Label htmlFor="includeTax">Tax Info</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeAppeals" 
                checked={includeAppeals} 
                onCheckedChange={(checked) => setIncludeAppeals(checked as boolean)} 
              />
              <Label htmlFor="includeAppeals">Appeals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeImprovements" 
                checked={includeImprovements} 
                onCheckedChange={(checked) => setIncludeImprovements(checked as boolean)} 
              />
              <Label htmlFor="includeImprovements">Improvements</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeLandRecords" 
                checked={includeLandRecords} 
                onCheckedChange={(checked) => setIncludeLandRecords(checked as boolean)} 
              />
              <Label htmlFor="includeLandRecords">Land Records</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeFields" 
                checked={includeFields} 
                onCheckedChange={(checked) => setIncludeFields(checked as boolean)} 
              />
              <Label htmlFor="includeFields">Fields</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single Property</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Properties</TabsTrigger>
          <TabsTrigger value="compare">Compare Properties</TabsTrigger>
          <TabsTrigger value="share">Property Insight Sharing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Generate Single Property Story</CardTitle>
              <CardDescription>
                Enter a property ID to generate a detailed narrative about the property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="propertyId">Property ID</Label>
                  <Input
                    id="propertyId"
                    placeholder="Enter property ID (e.g., BC101)"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSingleGenerate} 
                disabled={singleStoryMutation.isPending || !propertyId}
              >
                {singleStoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Story
              </Button>
            </CardFooter>
          </Card>
          
          {renderStoryOutput(
            singleStoryMutation.data, 
            singleStoryMutation.isPending, 
            `Property Story for ${propertyId}`
          )}
        </TabsContent>
        
        <TabsContent value="multiple">
          <Card>
            <CardHeader>
              <CardTitle>Generate Multiple Property Stories</CardTitle>
              <CardDescription>
                Enter comma-separated property IDs to generate stories for multiple properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="multiplePropertyIds">Property IDs (comma-separated)</Label>
                  <Input
                    id="multiplePropertyIds"
                    placeholder="Enter property IDs (e.g., BC101,BC102,BC103)"
                    value={multiplePropertyIds}
                    onChange={(e) => setMultiplePropertyIds(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleMultipleGenerate} 
                disabled={multipleStoriesMutation.isPending || !multiplePropertyIds}
              >
                {multipleStoriesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Multiple Stories
              </Button>
            </CardFooter>
          </Card>
          
          {renderStoryOutput(
            multipleStoriesMutation.data, 
            multipleStoriesMutation.isPending, 
            `Multiple Property Stories`
          )}
        </TabsContent>
        
        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Compare Properties</CardTitle>
              <CardDescription>
                Enter comma-separated property IDs to generate a comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="comparePropertyIds">Property IDs (comma-separated)</Label>
                  <Input
                    id="comparePropertyIds"
                    placeholder="Enter property IDs (e.g., BC101,BC102,BC103)"
                    value={comparePropertyIds}
                    onChange={(e) => setComparePropertyIds(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCompareGenerate} 
                disabled={comparePropertiesMutation.isPending || !comparePropertyIds}
              >
                {comparePropertiesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Comparison
              </Button>
            </CardFooter>
          </Card>
          
          {renderStoryOutput(
            comparePropertiesMutation.data, 
            comparePropertiesMutation.isPending, 
            `Property Comparison`
          )}
        </TabsContent>
        
        <TabsContent value="share">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Share Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create Property Insight Share</CardTitle>
                <CardDescription>
                  Configure and create a shareable property insight
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="sharePropertyId">Property ID</Label>
                    <Input
                      id="sharePropertyId"
                      placeholder="Enter property ID (e.g., BC001)"
                      value={sharePropertyId}
                      onChange={(e) => setSharePropertyId(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="shareTitle">Share Title</Label>
                    <Input
                      id="shareTitle"
                      placeholder="Enter a title for this share"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="shareInsightType">Insight Type</Label>
                      <Select value={shareInsightType} onValueChange={setShareInsightType}>
                        <SelectTrigger id="shareInsightType">
                          <SelectValue placeholder="Select insight type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="comparison">Comparison</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="shareFormat">Format</Label>
                      <Select value={shareFormat} onValueChange={setShareFormat}>
                        <SelectTrigger id="shareFormat">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="shareExpiresInDays">Expires In (Days)</Label>
                    <Input
                      id="shareExpiresInDays"
                      type="number"
                      placeholder="Optional - leave empty for no expiration"
                      value={shareExpiresInDays}
                      onChange={(e) => setShareExpiresInDays(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="sharePassword">Password (Optional)</Label>
                    <Input
                      id="sharePassword"
                      type="password"
                      placeholder="Optional - leave empty for no password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="shareIsPublic" 
                      checked={shareIsPublic} 
                      onCheckedChange={(checked) => setShareIsPublic(checked as boolean)} 
                    />
                    <Label htmlFor="shareIsPublic">Public Share</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCreateShare} 
                  disabled={createShareMutation.isPending || !sharePropertyId || !shareTitle}
                >
                  {createShareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Share2 className="mr-2 h-4 w-4" />
                  Create Share
                </Button>
              </CardFooter>
            </Card>
            
            {/* View Share Card */}
            <Card>
              <CardHeader>
                <CardTitle>Access Shared Insight</CardTitle>
                <CardDescription>
                  View a shared property insight using the share ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="viewShareId">Share ID</Label>
                    <Input
                      id="viewShareId"
                      placeholder="Enter share ID"
                      value={viewShareId}
                      onChange={(e) => setViewShareId(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="viewSharePassword">Password (if required)</Label>
                    <Input
                      id="viewSharePassword"
                      type="password"
                      placeholder="Enter password if the share is protected"
                      value={viewSharePassword}
                      onChange={(e) => setViewSharePassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleViewShare} 
                  disabled={getShareMutation.isPending || !viewShareId}
                >
                  {getShareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Eye className="mr-2 h-4 w-4" />
                  View Share
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Output Cards */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* View Share Result */}
            {getShareMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Shared Property Insight</span>
                    <Badge>{getShareMutation.data.insightType}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {getShareMutation.data.title} - Access Count: {getShareMutation.data.accessCount}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(getShareMutation.data.insightData, null, 2)}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Created Share */}
            {createShareMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Share Created Successfully</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    <p><strong>Share ID:</strong> {createShareMutation.data.shareId}</p>
                    <p><strong>Title:</strong> {createShareMutation.data.title}</p>
                    <p><strong>Property ID:</strong> {createShareMutation.data.propertyId}</p>
                    <p><strong>Type:</strong> {createShareMutation.data.insightType}</p>
                    <p><strong>Format:</strong> {createShareMutation.data.format}</p>
                    <p><strong>Access Count:</strong> {createShareMutation.data.accessCount}</p>
                    <p><strong>Created At:</strong> {new Date(createShareMutation.data.createdAt).toLocaleString()}</p>
                    {createShareMutation.data.expiresAt && (
                      <p><strong>Expires At:</strong> {new Date(createShareMutation.data.expiresAt).toLocaleString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* All Shares List */}
            <Card>
              <CardHeader>
                <CardTitle>All Property Insight Shares</CardTitle>
                <CardDescription>
                  List of all available property insight shares
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allSharesQuery.isLoading ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : allSharesQuery.data && allSharesQuery.data.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {allSharesQuery.data.map((share: any) => (
                      <div 
                        key={share.shareId} 
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <div className="font-medium">{share.title}</div>
                          <div className="text-sm">
                            <span className="font-semibold">{share.propertyName || `Property ${share.propertyId}`}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {share.propertyId} | Type: {share.insightType} | Access Count: {share.accessCount}
                          </div>
                          {share.propertyAddress && (
                            <div className="text-xs text-muted-foreground italic mt-1">
                              {share.propertyAddress}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setViewShareId(share.shareId);
                                    setViewSharePassword("");
                                    handleViewShare();
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Property Insight</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleShowQRCode(share.shareId)}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Generate QR Code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExportPDF(share.shareId)}
                                  disabled={pdfDataLoading}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Export as PDF</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCopyShareLink(share.shareId)}
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Share Link</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleShowEmailDialog(share.shareId)}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Share via Email</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialog>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Share</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Share</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this share? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteShare(share.shareId)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No shares available. Create a share to see it here.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Share #{activeShareId}</DialogTitle>
            <DialogDescription>
              Scan this QR code with a mobile device to access the shared property insight
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center p-4 gap-4">
            {qrCodeLoading ? (
              <div className="flex items-center justify-center h-60 w-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : qrCodeData ? (
              <>
                <img 
                  src={qrCodeData} 
                  alt="Property insight QR code" 
                  className="h-60 w-60 object-contain" 
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleCopyQRCode}
                    disabled={qrCodeCopying}
                  >
                    {qrCodeCopying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Copying...
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDownloadQRCode}
                    disabled={qrCodeDownloading}
                    variant="outline"
                  >
                    {qrCodeDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-60 w-60 border rounded-md text-muted-foreground">
                Failed to generate QR code
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Email Sharing Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Property Insight via Email</DialogTitle>
            <DialogDescription>
              Send a link to this property insight to your colleagues or stakeholders
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emailRecipient">Recipient Email</Label>
              <Input
                id="emailRecipient"
                type="email"
                placeholder="recipient@example.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailMessage">Message</Label>
              <Textarea
                id="emailMessage"
                placeholder="Email message..."
                rows={5}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={emailSending || !emailRecipient}
            >
              {emailSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}