import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Public as Globe, Dataset as Database, People as Users, Lock, Router as Network  } from '@mui/icons-material';

interface DeploymentOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  useCase: string;
  counties?: string[];
}

const DeploymentModeSelector: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);

  const deploymentOptions: DeploymentOption[] = [
    {
      id: 'sovereign',
      name: 'Sovereign County',
      description: 'Complete independence and data sovereignty for a single county',
      icon: <Shield className="w-8 h-8 text-blue-500" />,
      features: [
        'Complete data isolation',
        'Independent infrastructure',
        'County-scoped API access',
        'Dedicated database schema',
        'Zero cross-county data sharing',
        'Full administrative control'
      ],
      useCase: 'Perfect for counties that require complete data sovereignty and independence'
    },
    {
      id: 'federated',
      name: 'Federated Counties',
      description: 'Shared infrastructure with logical separation and cross-county capabilities',
      icon: <Globe className="w-8 h-8 text-green-500" />,
      features: [
        'Unified API gateway',
        'Cross-county analytics',
        'Shared infrastructure costs',
        'Controlled data sharing',
        'Multi-county reporting',
        'Centralized management'
      ],
      useCase: 'Ideal for regional cooperation and shared services while maintaining county boundaries'
    }
  ];

  const availableCounties = [
    { id: 'benton', name: 'Benton County', parcels: 'await DynamicPropertyService.GetPropertyCountAsync("benton")', system: 'Harris PACS v12.4.7', status: 'Production Ready' },
    { id: 'pierce', name: 'Pierce County', parcels: '385,000', system: 'ArcGIS Open Data', status: 'Live API' },
    { id: 'king', name: 'King County', parcels: '750,000', system: 'Enterprise GIS', status: 'Microservices' },
    { id: 'yakima', name: 'Yakima County', parcels: '125,000', system: 'Open Data Portal', status: 'Multi-format' },
    { id: 'clark', name: 'Clark County', parcels: '195,000', system: 'ArcGIS Hub', status: 'GraphQL' }
  ];

  const handleCountyToggle = (countyId: string) => {
    if (selectedMode === 'sovereign') {
      setSelectedCounties([countyId]);
    } else {
      setSelectedCounties(prev => 
        prev.includes(countyId) 
          ? prev.filter(id => id !== countyId)
          : [...prev, countyId]
      );
    }
  };

  const generateDeploymentConfig = () => {
    const config = {
      mode: selectedMode,
      counties: selectedCounties,
      timestamp: new Date().toISOString()
    };

    console.log('Deployment Configuration:', config);
    
    // In a real implementation, this would trigger the deployment configurator
    alert(`Deployment configuration generated for ${selectedMode} mode with counties: ${selectedCounties.join(', ')}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 tf-government-badge">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tf-transcendence-glow">Terrafusion OS Deployment Configurator</h1>
        <p className="text-gray-600 tf-clarity-gradient">Choose your deployment model based on your county's needs and preferences</p>
      </div>

      {/* Deployment Mode Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {deploymentOptions.map((option) => (
          <Card 
            key={option.id}
            className={`cursor-pointer transition-all duration-200 tf-government-badge ${
              selectedMode === option.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedMode(option.id)}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                {option.icon}
                <div>
                  <CardTitle className="text-xl tf-transcendence-glow">{option.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1 tf-clarity-gradient">{option.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2 tf-transcendence-glow">Key Features:</h4>
                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center tf-clarity-gradient">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg tf-government-badge">
                  <p className="text-sm text-gray-700 tf-clarity-gradient">{option.useCase}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* County Selection */}
      {selectedMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Select Counties</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {selectedMode === 'sovereign' 
                ? 'Choose the county for your sovereign deployment'
                : 'Select multiple counties for your federated deployment'
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCounties.map((county) => (
                <div
                  key={county.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 tf-government-badge ${
                    selectedCounties.includes(county.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCountyToggle(county.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold tf-transcendence-glow">{county.name}</h3>
                      <Badge variant={county.status === 'Production Ready' ? 'default' : 'secondary'} className="tf-government-badge">
                        {county.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 tf-clarity-gradient">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{county.parcels} parcels</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Network className="w-4 h-4" />
                        <span>{county.system}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      {selectedMode && selectedCounties.length > 0 && (
        <Card className="tf-government-badge">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 tf-transcendence-glow">
              <Lock className="w-5 h-5" />
              <span>Deployment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 tf-transcendence-glow">Deployment Mode:</h4>
                  <p className="text-lg font-medium capitalize tf-clarity-gradient">{selectedMode} Counties</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 tf-transcendence-glow">Selected Counties:</h4>
                  <p className="text-lg font-medium tf-clarity-gradient">{selectedCounties.length} county(ies)</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2 tf-transcendence-glow">Counties:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCounties.map(countyId => {
                    const county = availableCounties.find(c => c.id === countyId);
                    return (
                      <Badge key={countyId} variant="outline" className="tf-government-badge">
                        {county?.name} ({county?.parcels} parcels)
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={generateDeploymentConfig}
                  className="w-full md:w-auto tf-government-badge"
                  size="lg"
                >
                  Generate Deployment Configuration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits Comparison */}
      <Card className="tf-government-badge">
        <CardHeader>
          <CardTitle className="tf-transcendence-glow">Deployment Model Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 tf-transcendence-glow">Feature</th>
                  <th className="text-center py-2 tf-transcendence-glow">Sovereign County</th>
                  <th className="text-center py-2 tf-transcendence-glow">Federated Counties</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-2 tf-clarity-gradient">Data Sovereignty</td>
                  <td className="text-center py-2 tf-clarity-gradient">✅ Complete</td>
                  <td className="text-center py-2 tf-clarity-gradient">⚠️ Controlled</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 tf-clarity-gradient">Infrastructure Costs</td>
                  <td className="text-center py-2 tf-clarity-gradient">💰 Full Cost</td>
                  <td className="text-center py-2 tf-clarity-gradient">💰 Shared Cost</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 tf-clarity-gradient">Cross-County Analytics</td>
                  <td className="text-center py-2 tf-clarity-gradient">❌ Not Available</td>
                  <td className="text-center py-2 tf-clarity-gradient">✅ Available</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 tf-clarity-gradient">Administrative Control</td>
                  <td className="text-center py-2 tf-clarity-gradient">✅ Full Control</td>
                  <td className="text-center py-2 tf-clarity-gradient">⚠️ Shared Control</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 tf-clarity-gradient">Setup Complexity</td>
                  <td className="text-center py-2 tf-clarity-gradient">🟢 Simple</td>
                  <td className="text-center py-2 tf-clarity-gradient">🟡 Moderate</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentModeSelector;
