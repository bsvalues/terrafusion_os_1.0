import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type AppraisalTab = 'cost' | 'depreciation' | 'income' | 'sales';

export function MassAppraisalPage() {
  const [activeTab, setActiveTab] = useState<AppraisalTab>('cost');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mass Appraisal</h1>
          <p className="text-muted-foreground">
            Valuation approaches and analysis tools
          </p>
        </div>
        <Badge variant="outline">BIV-084</Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AppraisalTab)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cost">Cost Manual</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="income">Income Approach</TabsTrigger>
          <TabsTrigger value="sales">Sales Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="cost">
          <Card>
            <CardHeader>
              <CardTitle>Cost Manual Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Marshall &amp; Swift cost schedule reference tables. Select a
                building class and quality grade to view base rates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation">
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calculate physical, functional, and external depreciation based
                on property age, condition, and quality.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Net operating income analysis, capitalization rates, and gross
                rent multiplier calculations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Comparison Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comparable sales analysis with adjustment columns, sorting, and
                export capabilities.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
