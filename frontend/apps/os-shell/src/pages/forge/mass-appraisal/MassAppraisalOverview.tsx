// TFT-101 — Mass appraisal overview page
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostManualComponent } from '@/components/forge/CostManualComponent';
import { DepreciationCalcComponent } from '@/components/forge/DepreciationCalcComponent';
import { IncomeApproachComponent } from '@/components/forge/IncomeApproachComponent';
import { SalesCompGridComponent } from '@/components/forge/SalesCompGridComponent';
import { RatioStudyPanel } from '@/components/forge/RatioStudyPanel';
import { ModelsListComponent } from '@/components/forge/ModelsListComponent';
import { ModelDetailsComponent } from '@/components/forge/ModelDetailsComponent';
import { QualityControlPanel } from '@/components/forge/QualityControlPanel';
import type { ModelSummary, ModelDetail, RatioStudyResult, QualityCheckResult } from '@/types/realEstate';
import { Input } from '@/components/ui/input';

export function MassAppraisalOverview() {
  const [parcelId, setParcelId] = React.useState('');
  const [activeParcel, setActiveParcel] = React.useState('');
  const [models, setModels] = React.useState<ModelSummary[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<ModelDetail | null>(null);
  const [ratioStudy, setRatioStudy] = React.useState<RatioStudyResult | null>(null);
  const [qcChecks, setQcChecks] = React.useState<QualityCheckResult[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {})
      .finally(() => setModelsLoading(false));

    fetch('/api/ratio-study')
      .then((r) => r.json())
      .then(setRatioStudy)
      .catch(() => {});

    fetch('/api/quality-control')
      .then((r) => r.json())
      .then(setQcChecks)
      .catch(() => {});
  }, []);

  const handleModelSelect = (model: ModelSummary) => {
    fetch(`/api/models/${model.modelId}`)
      .then((r) => r.json())
      .then(setSelectedModel)
      .catch(() => {});
  };

  const handleSetParcel = () => {
    if (parcelId.trim()) setActiveParcel(parcelId.trim());
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Mass Appraisal</h1>
      <p className="text-sm text-muted-foreground">
        Cost, depreciation, income, and sales comparison approaches
      </p>

      <div className="flex gap-2 items-end">
        <Input
          label="Subject Parcel"
          value={parcelId}
          onChange={(e) => setParcelId(e.target.value)}
          placeholder="Enter parcel ID for approaches..."
          onKeyDown={(e) => e.key === 'Enter' && handleSetParcel()}
        />
        <button
          onClick={handleSetParcel}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Load
        </button>
      </div>

      <Tabs defaultValue="cost">
        <TabsList>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="sales">Sales Comparison</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="cost">
          <CostManualComponent />
        </TabsContent>

        <TabsContent value="depreciation">
          <DepreciationCalcComponent />
        </TabsContent>

        <TabsContent value="income">
          {activeParcel ? (
            <IncomeApproachComponent parcelId={activeParcel} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Enter a parcel ID above to view income approach data
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales">
          {activeParcel ? (
            <SalesCompGridComponent parcelId={activeParcel} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Enter a parcel ID above to view comparables
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ModelsListComponent
              models={models}
              selectedModelId={selectedModel?.modelId}
              onSelect={handleModelSelect}
              loading={modelsLoading}
            />
            <div className="space-y-4">
              <ModelDetailsComponent model={selectedModel} />
              <RatioStudyPanel data={ratioStudy} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <QualityControlPanel checks={qcChecks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
