/**
 * Data Migration Page
 * 
 * This page provides functionality for migrating data to/from external systems
 * via FTP, including integration with spatialest.com.
 */
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FtpManager from '../components/data-migration/ftp-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon  } from '@mui/icons-material';

export default function DataMigrationPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet>
        <title>Data Migration - BentonGeoPro</title>
      </Helmet>
      
      <div className="flex flex-col space-y-2"><>

        <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
        <p
</>
className="text-muted-foreground">
          Manage data transfers between BentonGeoPro and external systems
        </p>
      </div>
      
      <Alert>
        <InfoIcon className="h-4 w-4" /><>

        <AlertTitle>Information</AlertTitle>
        <AlertDescription
</>
</>>
          The Data Migration system allows you to transfer spatial data files, documents, 
          and other information between BentonGeoPro and external systems. Connect to FTP servers
          to upload and download data for use in the application.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="ftp" className="space-y-4">
        <TabsList><>

          <TabsTrigger value="ftp">FTP Migration</TabsTrigger>
          <TabsTrigger
</>
value="spatialest" disabled>SpatialEST Integration</TabsTrigger>
          <TabsTrigger value="batch" disabled>Batch Processing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ftp" className="space-y-4"><>

          <FtpManager />
        </TabsContent>
        
        <TabsContent
</>
value="spatialest">
          <Card>
            <CardHeader><>

              <CardTitle>SpatialEST Integration</CardTitle>
              <CardDescription
</>
</>>
                Connect directly to SpatialEST for seamless data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <p>SpatialEST integration is coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch">
          <Card>
            <CardHeader><>

              <CardTitle>Batch Processing</CardTitle>
              <CardDescription
</>
</>>
                Configure automated batch import/export jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <p>Batch processing functionality is coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}