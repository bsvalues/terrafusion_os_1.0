import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, QrCode, FileDown, Copy, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SharingOptionsProps {
  shareId: string;
}

export function SharingOptions({ shareId }: SharingOptionsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("qrcode");
  
  // QR Code options
  const [qrWidth, setQrWidth] = useState("300");
  const [qrMargin, setQrMargin] = useState("4");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  
  // PDF options
  const [pdfTitle, setPdfTitle] = useState("Property Insight Report");
  const [pdfAuthor, setPdfAuthor] = useState("Benton County Assessor's Office");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  
  // URL
  const shareableUrl = `${window.location.origin}/property-insights/share/${shareId}`;
  
  // QR Code mutation
  const qrCodeMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams({
        width: qrWidth,
        margin: qrMargin,
        darkColor,
        lightColor
      });
      
      return apiRequest(`/api/property-insight-shares/${shareId}/qrcode?${params.toString()}`);
    },
    onSuccess: (data) => {
      toast({
        title: "QR Code Generated",
        description: "QR code has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating QR code",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // PDF Data mutation
  const pdfDataMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams({
        title: pdfTitle,
        author: pdfAuthor,
        includeImages: includeImages.toString(),
        includeMetadata: includeMetadata.toString()
      });
      
      return apiRequest(`/api/property-insight-shares/${shareId}/pdf-data?${params.toString()}`);
    },
    onSuccess: (data) => {
      toast({
        title: "PDF Data Generated",
        description: "PDF data has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating PDF data",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Shareable link has been copied to clipboard.",
      });
    }).catch((error) => {
      toast({
        title: "Error copying link",
        description: "Could not copy link to clipboard.",
        variant: "destructive"
      });
    });
  };
  
  // Handle QR Code generation
  const handleGenerateQRCode = () => {
    qrCodeMutation.mutate();
  };
  
  // Handle PDF data generation
  const handleGeneratePDFData = () => {
    pdfDataMutation.mutate();
  };
  
  // Handle direct access to QR code (open in new tab)
  const handleOpenQRCodeInNewTab = () => {
    const params = new URLSearchParams({
      width: qrWidth,
      margin: qrMargin,
      darkColor,
      lightColor
    });
    
    window.open(`/api/property-insight-shares/${shareId}/qrcode?${params.toString()}`, '_blank');
  };
  
  // Handle direct download of PDF data
  const handleDownloadPDFData = () => {
    const params = new URLSearchParams({
      title: pdfTitle,
      author: pdfAuthor,
      includeImages: includeImages.toString(),
      includeMetadata: includeMetadata.toString()
    });
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(pdfDataMutation.data || {}, null, 2)
    );
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `property-insight-${shareId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Options</CardTitle>
        <CardDescription>
          Choose how you want to share this property insight
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="pdf">PDF Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link">
            <div className="grid w-full gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="shareableUrl">Shareable URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="shareableUrl"
                    readOnly
                    value={shareableUrl}
                  />
                  <Button onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copy Link to Clipboard
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="qrcode">
            <div className="grid w-full gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="qrWidth">Width (px)</Label>
                  <Input
                    id="qrWidth"
                    type="number"
                    value={qrWidth}
                    onChange={(e) => setQrWidth(e.target.value)}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="qrMargin">Margin</Label>
                  <Input
                    id="qrMargin"
                    type="number"
                    value={qrMargin}
                    onChange={(e) => setQrMargin(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="darkColor">Dark Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="darkColor"
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-12"
                    />
                    <Input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="lightColor">Light Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="lightColor"
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-12"
                    />
                    <Input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button
                  onClick={handleGenerateQRCode}
                  disabled={qrCodeMutation.isPending}
                  className="w-full"
                >
                  {qrCodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>
              </div>
              
              {qrCodeMutation.data && qrCodeMutation.data.qrCode && (
                <div className="mt-4 flex flex-col items-center space-y-4">
                  <div className="border p-4 rounded-md max-w-xs mx-auto">
                    <img
                      src={qrCodeMutation.data.qrCode}
                      alt="QR Code for Property Insight"
                      className="w-full h-auto"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleOpenQRCodeInNewTab}
                  >
                    Open QR Code in New Tab
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pdf">
            <div className="grid w-full gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="pdfTitle">PDF Title</Label>
                <Input
                  id="pdfTitle"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="pdfAuthor">Author</Label>
                <Input
                  id="pdfAuthor"
                  value={pdfAuthor}
                  onChange={(e) => setPdfAuthor(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeImages"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="includeImages">Include Images</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="includeMetadata">Include Metadata</Label>
              </div>
              
              <div className="mt-4">
                <Button
                  onClick={handleGeneratePDFData}
                  disabled={pdfDataMutation.isPending}
                  className="w-full"
                >
                  {pdfDataMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate PDF Data
                </Button>
              </div>
              
              {pdfDataMutation.data && (
                <div className="mt-4 space-y-4">
                  <div className="border p-4 rounded-md bg-muted overflow-auto max-h-60">
                    <pre className="text-xs">
                      {JSON.stringify(pdfDataMutation.data, null, 2)}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDFData}
                    className="w-full"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF Data
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 flex flex-col items-start">
        <p className="text-sm text-muted-foreground">
          Note: You can also access these sharing options directly through the API endpoints.
        </p>
      </CardFooter>
    </Card>
  );
}