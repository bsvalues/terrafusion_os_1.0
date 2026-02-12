import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart4,
  TrendingUp,
  Flame,
  Droplets,
  Home,
  Calendar,
  Clock,
  Layers,
  Warning,
  Filter,
  Eye,
 } from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import '@/styles/predictive-analysis.css';

interface PredictiveAnalysisLayerProps {
  map: Map;
  className?: string;
  onClose?: () => void;
}

type PredictionType = 'value' | 'risk' | 'development';
type TimeFrame = '1year' | '5year' | '10year';
type VisualizationMode = 'heatmap' | 'choropleth' | 'symbols';

interface PredictionData {
  propertyId: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  riskScore?: number;
  riskFactors?: string[];
  developmentPotential?: 'high' | 'medium' | 'low';
  coordinates: [number, number][]; // Array of polygon coordinates [lng, lat]
}

/**
 * AI-Powered Predictive Analysis Layer Component
 *
 * This component adds a powerful layer of AI-driven predictions to the map:
 * - Property value forecasting
 * - Risk assessment visualization
 * - Development potential identification
 * - Market trend analysis
 */
const PredictiveAnalysisLayer = ({ map, className, onClose }: PredictiveAnalysisLayerProps) => {
  const [predictionType, setPredictionType] = useState<PredictionType>('value');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1year');
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('choropleth');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(50);
  const [layerOpacity, setLayerOpacity] = useState<number>(70);
  const [detailLevel, setDetailLevel] = useState<number>(50);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const predictionLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Fetch prediction data from the server
  const {
    data: predictionData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['/api/gis/predictions', predictionType, timeFrame],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          `/api/gis/predictions?type=${predictionType}&timeframe=${timeFrame}`
        );

        // First cast to unknown, then to our specific type
        return (response as unknown as PredictionData[]) || ([] as PredictionData[]);
      } catch (error) {
        console.error('Error fetching prediction data:', error);
        return [] as PredictionData[];
      }
    },
    staleTime: 300000, // 5 minutes
  });

  // Create and add the prediction layer to the map
  useEffect(() => {
    if (!map) return;

    // Create vector source and layer if they don't exist
    if (!predictionLayerRef.current) {
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        className: 'prediction-layer',
        zIndex: 10, // Ensure it's above the base map but below UI elements
        opacity: layerOpacity / 100,
      });

      map.addLayer(vectorLayer);
      predictionLayerRef.current = vectorLayer;

      // Add click handler to select properties
      map.on('click', event => {
        const features = map.getFeaturesAtPixel(event.pixel, {
          layerFilter: layer => layer === vectorLayer,
        });

        if (features && features.length > 0) {
          const propertyId = features[0].get('propertyId');
          setSelectedPropertyId(propertyId === selectedPropertyId ? null : propertyId);
        } else {
          setSelectedPropertyId(null);
        }
      });
    }

    return () => {
      // Clean up layer when component unmounts
      if (predictionLayerRef.current) {
        map.removeLayer(predictionLayerRef.current);
        predictionLayerRef.current = null;
      }
    };
  }, [map]);

  // Update layer when prediction data changes
  useEffect(() => {
    if (!predictionLayerRef.current || !predictionData) return;

    const vectorSource = predictionLayerRef.current.getSource();
    if (!vectorSource) return;

    // Clear existing features
    vectorSource.clear();

    // Filter data based on confidence threshold
    const filteredData = predictionData.filter(
      (item: PredictionData) => item.confidence >= confidenceThreshold
    );

    // Add features to the layer
    filteredData.forEach((item: PredictionData) => {
      try {
        // Create polygon from coordinates
        const polygonCoords = item.coordinates.map((coord: [number, number]) =>
          fromLonLat([coord[0], coord[1]])
        );

        const polygon = new Polygon([polygonCoords]);
        const feature = new Feature({
          geometry: polygon,
          propertyId: item.propertyId,
          currentValue: item.currentValue,
          predictedValue: item.predictedValue,
          changePercent: item.changePercent,
          confidence: item.confidence,
          riskScore: item.riskScore,
          riskFactors: item.riskFactors,
          developmentPotential: item.developmentPotential,
        });

        // Set style based on prediction type and visualization mode
        feature.setStyle(
          createFeatureStyle(
            item,
            predictionType,
            visualizationMode,
            item.propertyId === selectedPropertyId
          )
        );

        vectorSource.addFeature(feature);
      } catch (error) {
        console.error('Error creating feature:', error);
      }
    });
  }, [predictionData, predictionType, visualizationMode, confidenceThreshold, selectedPropertyId]);

  // Update layer opacity when it changes
  useEffect(() => {
    if (predictionLayerRef.current) {
      predictionLayerRef.current.setOpacity(layerOpacity / 100);
    }
  }, [layerOpacity]);

  // Create style for features based on prediction type and visualization mode
  const createFeatureStyle = (
    item: PredictionData,
    type: PredictionType,
    mode: VisualizationMode,
    isSelected: boolean
  ): Style => {
    let color: string;
    let value: number;

    // Determine the value and color based on prediction type
    switch (type) {
      case 'value':
        value = item.changePercent;
        if (value > 15) color = 'rgba(0, 128, 0, 0.6)';
        else if (value > 5) color = 'rgba(144, 238, 144, 0.6)';
        else if (value > 0) color = 'rgba(240, 240, 240, 0.6)';
        else if (value > -5) color = 'rgba(255, 192, 203, 0.6)';
        else color = 'rgba(255, 0, 0, 0.6)';
        break;

      case 'risk':
        value = item.riskScore || 0;
        if (value > 75) color = 'rgba(255, 0, 0, 0.6)';
        else if (value > 50) color = 'rgba(255, 165, 0, 0.6)';
        else if (value > 25) color = 'rgba(255, 255, 0, 0.6)';
        else color = 'rgba(0, 128, 0, 0.6)';
        break;

      case 'development':
        if (item.developmentPotential === 'high') {
          value = 90;
          color = 'rgba(75, 0, 130, 0.6)';
        } else if (item.developmentPotential === 'medium') {
          value = 50;
          color = 'rgba(147, 112, 219, 0.6)';
        } else {
          value = 20;
          color = 'rgba(230, 230, 250, 0.6)';
        }
        break;

      default:
        value = item.changePercent;
        color = 'rgba(0, 0, 255, 0.6)';
    }

    // Apply selected state styling
    if (isSelected) {
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.7)',
        }),
        stroke: new Stroke({
          color: '#000',
          width: 2,
        }),
        text: new Text({
          text: `${Math.round(value)}%`,
          font: '12px Arial',
          fill: new Fill({
            color: '#000',
          }),
          backgroundFill: new Fill({
            color: 'rgba(255, 255, 255, 0.7)',
          }),
          padding: [3, 3, 3, 3],
        }),
      });
    }

    // Create style based on visualization mode
    switch (mode) {
      case 'heatmap':
        return new Style({
          fill: new Fill({
            color: color,
          }),
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
          }),
        });

      case 'choropleth':
        return new Style({
          fill: new Fill({
            color: color,
          }),
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
          }),
        });

      case 'symbols':
        // For symbol mode, we'll use text to show the change percentage
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.01)', // Nearly transparent fill
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.2)',
            width: 1,
          }),
          text: new Text({
            text: `${Math.round(value)}%`,
            font: '10px Arial',
            fill: new Fill({
              color: '#000',
            }),
            backgroundFill: new Fill({
              color: 'rgba(255, 255, 255, 0.7)',
            }),
            padding: [2, 2, 2, 2],
          }),
        });

      default:
        return new Style({
          fill: new Fill({
            color: color,
          }),
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
          }),
        });
    }
  };

  // Get selected property details
  const selectedProperty =
    selectedPropertyId && predictionData
      ? predictionData.find((item: PredictionData) => item.propertyId === selectedPropertyId)
      : null;

  return (
    <div className={cn('predictive-analysis-container', className)}>
      {/* Controls Panel */}
      <Card className="predictive-analysis-controls">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <BarChart4 className="h-4 w-4 mr-2 text-primary" />
              AI Prediction Layer
            </CardTitle>

            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="py-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-3">
              <Warning className="h-8 w-8 text-amber-500 mx-auto mb-2" /><>

              <p className="text-sm text-muted-foreground">Error loading prediction data</p>
              <Button
</>
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => {
                  // Retry loading data
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Prediction Type Selector */}
              <div className="mb-4"><>

                <label className="text-xs font-medium block mb-1.5">Prediction Type</label>
                <div
</> className="grid grid-cols-3 gap-2">
                  <Button
                    variant={predictionType === 'value' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPredictionType('value')}
                  ><>

                    <TrendingUp className="h-3 w-3 mr-1" /> Value
                  </Button>

                  <Button
</>
                    variant={predictionType === 'risk' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPredictionType('risk')}
                  ><>

                    <Flame className="h-3 w-3 mr-1" /> Risk
                  </Button>

                  <Button
</>
                    variant={predictionType === 'development' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPredictionType('development')}
                  >
                    <Home className="h-3 w-3 mr-1" /> Development
                  </Button>
                </div>
              </div>

              {/* Time Frame Selector */}
              <div className="mb-4"><>

                <label className="text-xs font-medium block mb-1.5">Time Frame</label>
                <div
</> className="grid grid-cols-3 gap-2">
                  <Button
                    variant={timeFrame === '1year' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTimeFrame('1year')}
                  ><>

                    <Clock className="h-3 w-3 mr-1" /> 1 Year
                  </Button>

                  <Button
</>
                    variant={timeFrame === '5year' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTimeFrame('5year')}
                  ><>

                    <Calendar className="h-3 w-3 mr-1" /> 5 Years
                  </Button>

                  <Button
</>
                    variant={timeFrame === '10year' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTimeFrame('10year')}
                  >
                    <Calendar className="h-3 w-3 mr-1" /> 10 Years
                  </Button>
                </div>
              </div>

              {/* Visualization Mode */}
              <div className="mb-4"><>

                <label className="text-xs font-medium block mb-1.5">Visualization Mode</label>
                <Tabs
</>
                  defaultValue={visualizationMode}
                  value={visualizationMode}
                  onValueChange={value => setVisualizationMode(value as VisualizationMode)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 h-8"><>

                    <TabsTrigger value="heatmap" className="text-xs">
                      Heatmap
                    </TabsTrigger>
                    <TabsTrigger
</> value="choropleth" className="text-xs">
                      Choropleth
                    </TabsTrigger>
                    <TabsTrigger value="symbols" className="text-xs">
                      Symbols
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Confidence Threshold */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5"><>

                  <label className="text-xs font-medium">Confidence Threshold</label>
                  <Badge
</> variant="outline" className="text-xs h-5">
                    {confidenceThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[confidenceThreshold]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={values => setConfidenceThreshold(values[0])}
                />
              </div>

              {/* Layer Opacity */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5"><>

                  <label className="text-xs font-medium">Layer Opacity</label>
                  <Badge
</> variant="outline" className="text-xs h-5">
                    {layerOpacity}%
                  </Badge>
                </div>
                <Slider
                  value={[layerOpacity]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={values => setLayerOpacity(values[0])}
                />
              </div>

              {/* Detail Level */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1.5"><>

                  <label className="text-xs font-medium">Detail Level</label>
                  <Badge
</> variant="outline" className="text-xs h-5">
                    {detailLevel < 30 ? 'Low' : detailLevel < 70 ? 'Medium' : 'High'}
                  </Badge>
                </div>
                <Slider
                  value={[detailLevel]}
                  min={0}
                  max={100}
                  step={10}
                  onValueChange={values => setDetailLevel(values[0])}
                />
              </div>

              {/* AI Model Info */}
              <div className="mt-4 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-0 h-auto mb-1 flex items-center justify-start text-muted-foreground"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Powered by AI Prediction Models
                </Button>

                {showInfo && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1 p-2 bg-muted/50 rounded-sm"><>

                    <p>• Uses 10+ years of historical property data</p>
                    <p
</>>• Considers 25+ external market factors</p>
                    <p>• Updated weekly with new market data</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Property Details */}
      {selectedProperty && (
        <Card className="predictive-analysis-details">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Property {selectedProperty.propertyId}</CardTitle>
          </CardHeader>

          <CardContent className="py-2">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted p-2 rounded"><>

                  <div className="text-xs text-muted-foreground">Current Value</div>
                  <div
</> className="font-medium">
                    ${selectedProperty.currentValue.toLocaleString()}
                  </div>
                </div>

                <div className="bg-muted p-2 rounded"><>

                  <div className="text-xs text-muted-foreground">Predicted Value</div>
                  <div
</> className="font-medium">
                    ${selectedProperty.predictedValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div><>

                  <span className="text-xs text-muted-foreground mr-1">Change:</span>
                  <Badge
</>
                    variant={selectedProperty.changePercent > 0 ? 'default' : 'destructive'}
                    className={`text-xs ${selectedProperty.changePercent > 0 ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  >
                    {selectedProperty.changePercent > 0 ? '+' : ''}
                    {selectedProperty.changePercent}%
                  </Badge>
                </div>

                <div><>

                  <span className="text-xs text-muted-foreground mr-1">Confidence:</span>
                  <Badge
</> variant="outline" className="text-xs">
                    {selectedProperty.confidence}%
                  </Badge>
                </div>
              </div>

              {selectedProperty.riskScore !== undefined && (
                <div className="bg-muted p-2 rounded"><>

                  <div className="text-xs text-muted-foreground">Risk Score</div>
                  <div
</> className="w-full bg-background rounded-full h-2 mt-1">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        selectedProperty.riskScore > 75
                          ? 'bg-red-500'
                          : selectedProperty.riskScore > 50
                            ? 'bg-orange-500'
                            : selectedProperty.riskScore > 25
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                      )}
                      style={{ width: `${selectedProperty.riskScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1"><>

                    <span>Low</span>
                    <span
</> className="font-medium">{selectedProperty.riskScore}%</span>
                    <span>High</span>
                  </div>
                </div>
              )}

              {selectedProperty.riskFactors && selectedProperty.riskFactors.length > 0 && (
                <div className="space-y-1"><>

                  <div className="text-xs text-muted-foreground">Risk Factors</div>
                  <div
</> className="flex flex-wrap gap-1">
                    {selectedProperty.riskFactors.map((factor /* , index */) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProperty.developmentPotential && (
                <div className="space-y-1"><>

                  <div className="text-xs text-muted-foreground">Development Potential</div>
                  <Badge
</>
                    variant="outline"
                    className={cn(
                      'text-xs',
                      selectedProperty.developmentPotential === 'high'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedProperty.developmentPotential === 'medium'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                    )}
                  >
                    {selectedProperty.developmentPotential.charAt(0).toUpperCase() +
                      selectedProperty.developmentPotential.slice(1)}
                  </Badge>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedPropertyId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictiveAnalysisLayer;
