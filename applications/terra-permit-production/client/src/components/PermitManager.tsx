import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Upload,
  Download,
  FileUp,
  FileDown,
  History,
  Info,
  HelpCircle
 } from '@mui/icons-material';
import { TourType } from '@/tours';
import UploadForm from '@/components/UploadForm';
import { UploadResult } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ContextualTooltip } from '@/components/ui/contextual-tooltip';
import { FeatureSpotlight } from '@/components/tour/FeatureSpotlight';
import TourButton from '@/components/tour/TourButton';
import { downloadTemplate } from '@/lib/api';
import { motion } from 'framer-motion';
import { ContextualHelp } from '@/components/help/ContextualHelp';

interface PermitManagerProps {
  onUploadComplete: (result: UploadResult) => void;
}

const PermitManager: React.FC<PermitManagerProps> = ({ onUploadComplete }) => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <Card className="mb-8 shadow-md border-0" data-tour="permit-management">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-xl font-bold text-gray-800">Permit Management</CardTitle>
            <CardDescription
</> className="text-gray-600">
              Upload new permits or download template files
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TourButton 
              tourName="permit_processing"
              label="Tour Process"
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 bg-white"
              data-tour="start_processing_tour"
            />
            <div data-tour="permit-info">
              <ContextualHelp
                content={
                  <div className="space-y-1.5"><>

                    <p>The Permit Management system allows you to:</p>
                    <ul
</> className="list-disc ml-4 space-y-0.5"><>

                      <li>Upload permit spreadsheets for processing</li>
                            <li
</>>Download permit templates and historical data</li>
                      <li>Access previously processed permit batches</li>
                    </ul>
                  </div>
                }
                position="right"
                className="text-blue-500"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full rounded-none bg-gray-100 px-4 py-2">
            <FeatureSpotlight
              id="upload_permits_tab"
              title="Upload Permits"
              description="Switch to this tab to upload permit spreadsheets for AI processing."
              position="bottom"
            >
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-blue-700"
                data-tour="permit-upload"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Permits</span>
              </TabsTrigger>
            </FeatureSpotlight>
            
            <FeatureSpotlight
              id="download_tab"
              title="Download Templates"
              description="Access templates and export previously processed permits."
              position="bottom"
            >
              <TabsTrigger 
                value="download" 
                className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-blue-700"
                data-tour="permit-download"
              >
                <Download className="h-4 w-4" />
                <span>Download Templates</span>
              </TabsTrigger>
            </FeatureSpotlight>
            
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-blue-700"
              data-tour="permit-history"
            >
              <History className="h-4 w-4" />
              <span>Upload History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="m-0"><>

            <UploadForm onUploadComplete={onUploadComplete} />
          </TabsContent>
          
          <TabsContent
</> value="download" className="m-0 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template Download Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-blue-600" />
                      <span>Permit Template</span>
                    </CardTitle>
                    <CardDescription>Standard template for permit uploads</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      Download our Excel template with pre-formatted columns and example data to ensure your permit uploads are processed correctly.<>

                      <ContextualHelp
                        content="Our template contains all required fields formatted according to system requirements."
                        position="top"
                      />
                    </p>
                    <Alert
</> className="bg-blue-50 border-blue-200 mb-4">
                      <Info className="h-4 w-4 text-blue-600" /><>

                      <AlertTitle className="text-blue-800 text-sm">Required Fields</AlertTitle>
                      <AlertDescription
</> className="text-blue-700 text-xs"><>

                        <p className="mt-1">The template includes all required fields:</p>
                        <ul
</> className="list-disc ml-4 mt-1 space-y-0.5"><>

                          <li>Parcel Number (required)</li>
                            <li
</>>Permit Type</li><>

                          <li>Value</li>
                            <li
</>>Location/Address</li>
                          <li>Description</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t">
                    <Button 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => downloadTemplate()}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Template</span>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              {/* Export Previously Processed Permits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-purple-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileUp className="h-5 w-5 text-purple-600" />
                      <span>Export Processed Permits</span>
                    </CardTitle>
                    <CardDescription>Download previously processed permits</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      Export your previously processed permit batches with classification results as Excel spreadsheets for your records or further analysis.<>

                      <ContextualHelp
                        content="Exports include all permit data along with AI classification results and processing metadata."
                        position="top"
                      />
                    </p>
                    <Alert
</> className="bg-purple-50 border-purple-200 mb-4">
                      <Info className="h-4 w-4 text-purple-600" /><>

                      <AlertTitle className="text-purple-800 text-sm">Export Features</AlertTitle>
                      <AlertDescription
</> className="text-purple-700 text-xs"><>

                        <p className="mt-1">Exports include additional data:</p>
                        <ul
</> className="list-disc ml-4 mt-1 space-y-0.5"><>

                          <li>AI classification results</li>
                            <li
</>>Processing timestamps</li><>

                          <li>Confidence scores</li>
                            <li
</>>Review history</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t">
                    <Button 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => window.location.href = '/history'}
                    >
                      <History className="h-4 w-4" />
                      <span>View Upload History</span>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="m-0 p-6">
            <div className="text-center p-12 bg-gray-50">
              <History className="h-16 w-16 mx-auto text-gray-400 mb-4" /><>

              <h3 className="text-lg font-medium text-gray-700 mb-2">Upload History</h3>
              <p
</> className="text-gray-500 max-w-md mx-auto mb-6">
                View your permit processing history and access previously uploaded batches.
              </p>
              <Button 
                onClick={() => window.location.href = '/history'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to History Page
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PermitManager;