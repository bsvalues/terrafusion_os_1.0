import React from 'react';
import TerraFusionProcessor from '@/components/terrafusion/TerraFusionProcessor';
import { FileCheck, Info  } from '@mui/icons-material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * TerraFusionPermitPage - A page component that wraps the TerraFusionProcessor
 * with contextual help and tooltips.
 */
const TerraFusionPermitPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TerraFusionPermit Processing</h1>
          <p className="text-gray-500 mt-1">Intelligent permit processing and analysis system</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            <span>v2.1.5</span>
          </Badge>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span>Documentation</span>
          </Button>
        </div>
      </div>
      
      <Card className="border-blue-100 bg-blue-50/30 mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 text-lg">Welcome to TerraFusionPermit</CardTitle>
          <CardDescription
>
            Use this intelligent system to process, validate, and analyze permit applications efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            TerraFusionPermit combines advanced AI processing with efficient workflows to streamline your permit 
            management process. Follow the steps below to get started.
          </p>
        </CardContent>
      </Card>
      
      <TerraFusionProcessor />
    </div>
  );
};

export default TerraFusionPermitPage;