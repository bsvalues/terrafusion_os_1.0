import React from 'react';
import { Container } from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import PACSDataManager from '@/components/tools/PACSDataManager';

const PACSPage: React.FC = () => {
  return (
    <Container className="py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">
            <Home className="h-4 w-4 mr-2" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" className="font-semibold">PACS Integration</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">PACS Integration</h1>
        <p className="text-muted-foreground">
          Manage property value data integration between development and production environments.
        </p>
      </div>
      
      <Separator className="my-6" />
      
      <PACSDataManager />
    </Container>
  );
};

export default PACSPage;