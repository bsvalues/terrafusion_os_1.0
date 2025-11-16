
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCounties } from "@/hooks/useCounties";
import { FTPDataImportService, FTPConnectionConfig, FTPFileInfo } from "@/services/FTPDataImportService";
import { Server, Download, FileText, Map, Database, CheckCircle, Warning  } from '@mui/icons-material';

export default function FTPDataImportManager() {
  const [ftpConfig, setFtpConfig] = useState<FTPConnectionConfig>({
    host: '',
    port: 21,
    username: '',
    password: '',
    secure: false,
    basePath: '/'
  });
  
  const [ftpService, setFtpService] = useState<FTPDataImportService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<FTPFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  
  const { toast } = useToast();
  const { data: counties } = useCounties();

  const handleConnect = async () => {
    if (!ftpConfig.host || !ftpConfig.username) {
      toast({
        title: "Missing Information",
        description: "Please provide FTP host and username.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const service = new FTPDataImportService(ftpConfig);
      const connectionTest = await service.testConnection();
      
      if (connectionTest) {
        setFtpService(service);
        setIsConnected(true);
        
        // List files
        const fileList = await service.listFiles(ftpConfig.basePath);
        setFiles(fileList);
        
        toast({
          title: "FTP Connected",
          description: `Connected successfully. Found ${fileList.length} files.`,
        });
      } else {
        throw new Error("Connection test failed");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to FTP server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setFtpService(null);
    setIsConnected(false);
    setFiles([]);
    toast({
      title: "Disconnected",
      description: "FTP connection closed.",
    });
  };

  const handleFileImport = async (file: FTPFileInfo, importType: string) => {
    if (!ftpService) return;

    if (importType === 'properties' && !selectedCounty) {
      toast({
        title: "County Required",
        description: "Please select a county for property imports.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const importId = await ftpService.downloadAndProcessFile(
        file, 
        importType, 
        selectedCounty || undefined
      );
      
      toast({
        title: "Import Started",
        description: `File ${file.name} is being processed. Import ID: ${importId}`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'csv': return <FileText className="w-4 h-4 text-green-500" />;
      case 'shp': return <Map className="w-4 h-4 text-blue-500" />;
      case 'dbf': return <Database className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImportTypeForFile = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('county') || name.includes('counties')) return 'counties';
    if (name.includes('property') || name.includes('properties') || name.includes('parcel')) return 'properties';
    if (name.includes('owner') || name.includes('owners')) return 'owners';
    return 'unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Server className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">FTP Data Import</h2>
        {isConnected && (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )}
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader><>

            <CardTitle>FTP Server Configuration</CardTitle>
            <CardDescription
</>>
              Connect to your FTP server to import CSV files and geo data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><>

                <Label htmlFor="ftp-host">FTP Host</Label>
                <Input
</>
                  id="ftp-host"
                  placeholder="ftp.yourdomain.com"
                  value={ftpConfig.host}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="ftp-port">Port</Label>
                <Input
</>
                  id="ftp-port"
                  type="number"
                  placeholder="21"
                  value={ftpConfig.port}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 21 }))}
                />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="ftp-username">Username</Label>
                <Input
</>
                  id="ftp-username"
                  value={ftpConfig.username}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="ftp-password">Password</Label>
                <Input
</>
                  id="ftp-password"
                  type="password"
                  value={ftpConfig.password}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="ftp-path">Base Path (optional)</Label>
                <Input
</>
                  id="ftp-path"
                  placeholder="/data"
                  value={ftpConfig.basePath}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, basePath: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={handleConnect} disabled={isLoading} className="w-full">
              {isLoading ? "Connecting..." : "Connect to FTP Server"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><>

                <CardTitle>Connected to {ftpConfig.host}</CardTitle>
                <CardDescription
</>>Found {files.length} files available for import</CardDescription>
              </div>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>County Selection</CardTitle>
              <CardDescription
</>>Select default county for property imports</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger><>

                  <SelectValue placeholder="Select a county" />
                </SelectTrigger>
                <SelectContent
</>>
                  {counties?.map((county) => (
                    <SelectItem key={county.id} value={county.id}>
                      {county.name}, {county.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>Available Files</CardTitle>
              <CardDescription
</>>Select files to import into Terrafusion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file /* , index */) => {
                  const suggestedType = getImportTypeForFile(file.name);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div><>

                          <div className="font-medium">{file.name}</div>
                          <div
</> className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.toUpperCase()} file
                          </div>
                        </div>
                        {suggestedType !== 'unknown' && (
                          <Badge variant="secondary">
                            Suggested: {suggestedType}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.type === 'csv' && (
                          <><>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFileImport(file, 'counties')}
                              disabled={isLoading}
                            >
                              Import as Counties
                            </Button>
                            <Button
</>
                              size="sm"
                              variant="outline"
                              onClick={() => handleFileImport(file, 'properties')}
                              disabled={isLoading}
                            >
                              Import as Properties
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFileImport(file, 'owners')}
                              disabled={isLoading}
                            >
                              Import as Owners
                            </Button>
                          </>
                        )}
                        {file.type === 'shp' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileImport(file, 'shapefile')}
                            disabled={isLoading}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Process Shapefile
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {files.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No files found in the specified directory.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Warning className="h-4 w-4" />
            <AlertDescription>
              Note: This is a demo version. In production, actual FTP connections and file downloads would be implemented using secure FTP client libraries.
              Shapefile processing requires specialized GIS tools and may need additional configuration.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
