import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import BenchmarkingVisualization from '@/components/visualizations/BenchmarkingVisualization';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';

const BenchmarkingPage: React.FC = () => {
  // State for benchmarking parameters
  const [formState, setFormState] = useState({
    buildingType: '',
    revalArea: '',
    year: new Date().getFullYear(),
    squareFootage: 2500,
  });

  const [parameters, setParameters] = useState({
    buildingType: '',
    revalArea: '',
    year: new Date().getFullYear(),
    squareFootage: 2500,
  });

  // Fetch available building types and regions from TerraFusion OS CostForge endpoints
  const { data: buildingTypesData, isLoading: loadingBuildingTypes } = useQuery({
    queryKey: ['/api/costforge/building-types'],
    queryFn: async () => {
      const res = await fetch('/api/costforge/building-types');
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
  const buildingTypes: string[] = buildingTypesData?.buildingTypes?.map((b: { code: string; label: string }) => b.label) ?? [];

  const { data: regionsData, isLoading: loadingRegions } = useQuery({
    queryKey: ['/api/costforge/regions'],
    queryFn: async () => {
      const res = await fetch('/api/costforge/regions');
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
  const revalAreas: { code: string; label: string; factor: number }[] = regionsData?.revalAreas ?? [];

  // Handler for form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParameters(formState);
  };

  return (
    <MainLayout
      pageTitle="Building Cost Benchmarking"
      pageDescription="Benchmark Benton County building costs by building type and Reval Area using the county cost matrix."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Benchmarking Parameters</CardTitle>
            <CardDescription>
              Enter the details of your building to compare against similar buildings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select
                  value={formState.buildingType}
                  onValueChange={(value) => handleInputChange('buildingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingBuildingTypes && buildingTypes && Array.isArray(buildingTypes) ? (
                      buildingTypes.map((type: string) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revalArea">Reval Area (Cycle)</Label>
                <Select
                  value={formState.revalArea}
                  onValueChange={(value) => handleInputChange('revalArea', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reval Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingRegions && revalAreas.length > 0 ? (
                      revalAreas.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.label}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Reval 1">Reval 1 — Kennewick NE</SelectItem>
                        <SelectItem value="Reval 2">Reval 2 — Kennewick Urban</SelectItem>
                        <SelectItem value="Reval 3">Reval 3 — South Richland</SelectItem>
                        <SelectItem value="Reval 4">Reval 4 — Benton City / Prosser</SelectItem>
                        <SelectItem value="Reval 5">Reval 5 — Richland West</SelectItem>
                        <SelectItem value="Reval 6">Reval 6 — Historic Richland</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formState.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={formState.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', parseInt(e.target.value))}
                  min={500}
                  step={100}
                />
              </div>

              <Button type="submit" className="w-full">
                Generate Benchmark
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <BenchmarkingVisualization
            buildingType={parameters.buildingType}
            region={parameters.revalArea}
            year={parameters.year}
            squareFootage={parameters.squareFootage}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default BenchmarkingPage;