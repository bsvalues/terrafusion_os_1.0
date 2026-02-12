import { useEffect, useRef, useState } from 'react';
import { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Cluster } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Fill, Stroke, Text, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import type { StyleFunction } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../../utils/string-utils'; // Import string hashCode extension

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Animation constants
const ANIMATION_DURATION = 500;

// Easing function for animations
const easeOut = (t: number): number => {
  return t * (2 - t);
};

// Interface for property data
interface DataPoint {
  id: string;
  position: [number, number]; // [longitude, latitude]
  properties: {
    [key: string]: any;
    type?: string; // Property type for categorization
    status?: string; // Property status
    value?: number; // Property value
  };
}

// Interface for cluster style options
interface ClusterStyleOptions {
  showPieCharts: boolean;
  pieChartAttribute: 'type' | 'status' | 'value';
  minSizeForPieChart: number;
  maxPieChartSize: number;
  valueRanges?: number[];
  colorScheme: Record<string, string>;
  defaultColors: string[];
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// Props for the component
interface PieClusterLayerProps {
  className?: string;
  map?: Map;
  data: DataPoint[];
  distance?: number; // Clustering distance in pixels
  minDistance?: number; // Minimum distance between clusters
  maxZoom?: number; // Maximum zoom level for clustering
  initialOpacity?: number;
  clusterStyleOptions?: Partial<ClusterStyleOptions>;
  animationEnabled?: boolean;
  onClusterClick?: (features: Feature[], coordinate: number[], metadata: any) => void;
  onClusterHover?: (features: Feature[] | null, coordinate: number[] | null, metadata: any) => void;
}

/**
 * Pie Chart Cluster Layer Component
 *
 * Enhanced version of AnimatedClusterLayer that shows pie charts for cluster contents
 * - Shows distribution of property types or status within each cluster
 * - Animates cluster formation and splitting when zooming in/out
 * - Provides hover information and click interaction
 * - Highly customizable styling options
 */
const PieClusterLayer = ({
  map: externalMap,
  data = [],
  distance = 40,
  minDistance = 20,
  maxZoom = 19,
  initialOpacity = 1,
  clusterStyleOptions = {},
  animationEnabled = true,
  onClusterClick,
  onClusterHover,
}: PieClusterLayerProps) => {
  // Default style options
  const defaultStyleOptions: ClusterStyleOptions = {
    showPieCharts: true,
    pieChartAttribute: 'type',
    minSizeForPieChart: 3,
    maxPieChartSize: 35,
    colorScheme: {
      // Property type colors
      residential: '#4285F4',
      commercial: '#34A853',
      industrial: '#FBBC05',
      agricultural: '#EA4335',
      vacant: '#673AB7',
      'mixed-use': '#3F51B5',
      // Property status colors
      active: '#4CAF50',
      pending: '#FFC107',
      sold: '#F44336',
      foreclosure: '#9C27B0',
      'off-market': '#607D8B',
    },
    defaultColors: [
      '#4285F4',
      '#34A853',
      '#FBBC05',
      '#EA4335',
      '#673AB7',
      '#3F51B5',
      '#2196F3',
      '#009688',
      '#FF5722',
      '#795548',
      '#9E9E9E',
    ],
    textColor: '#ffffff',
    strokeColor: '#ffffff',
    strokeWidth: 2,
  };

  // Merge default options with provided options
  const styleOptions: ClusterStyleOptions = {
    ...defaultStyleOptions,
    ...clusterStyleOptions,
  };

  // State and refs
  const [opacity, setOpacity] = useState(initialOpacity);
  const vectorLayerRef = useRef<VectorLayer<VectorSource>>();
  const clusterSourceRef = useRef<Cluster>();
  const animatingRef = useRef(false);
  const animationFrameRef = useRef<number>();
  // Using a simple JS Map object for canvas caching
  const pieChartCanvasCache = useRef<Record<string, HTMLCanvasElement>>({});

  // Use externally provided map instance
  const activeMap = externalMap;

  // Function to generate a Canvas element with a pie chart
  const generatePieChartCanvas = (
    categories: Record<string, number>,
    size: number
  ): HTMLCanvasElement => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = size * 2; // Double size for better resolution
    canvas.height = size * 2;

    // Prepare data for chart.js
    const labels = Object.keys(categories);
    const data = Object.values(categories);

    // Generate colors for each category
    const colors = labels.map(label => {
      const hash = Math.abs(String(label).hashCode()) % styleOptions.defaultColors.length;
      return styleOptions.colorScheme[label] || styleOptions.defaultColors[hash];
    });

    // Create chart
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: styleOptions.strokeColor,
            borderWidth: 1,
            hoverOffset: 0,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        animation: false,
        elements: {
          arc: {
            borderWidth: 1,
          },
        },
        layout: {
          padding: 0,
        },
      },
    });

    return canvas;
  };

  // Convert data points to features
  const createFeatures = (dataPoints: DataPoint[]) => {
    return dataPoints.map(point => {
      const { id, position, properties } = point;

      // Create feature with Point geometry
      const feature = new Feature({
        geometry: new Point(fromLonLat(position)),
        originalCoordinates: position,
        properties: properties,
      });

      // Set feature ID
      feature.setId(id);

      return feature;
    });
  };

  // Create cluster style function
  const createClusterStyleFunction = (): StyleFunction => {
    return (feature: FeatureLike): Style => {
      const features = feature.get('features') as Feature[];
      const size = features?.length || 1;

      if (size === 1) {
        // Style for individual points - simple circle
        return new Style({
          image: new Icon({
            src:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="5" fill="${styleOptions.colorScheme[features[0].get('properties')?.type] || styleOptions.defaultColors[0]}" stroke="${styleOptions.strokeColor}" stroke-width="1" />
              </svg>
            `),
            scale: 1,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          }),
        });
      }

      // For clusters, decide whether to use pie chart or simple circle
      if (size >= styleOptions.minSizeForPieChart && styleOptions.showPieCharts) {
        // Count categories within cluster
        const categoryCount: Record<string, number> = {};
        features.forEach(f => {
          const props = f.get('properties') || {};
          const category = props[styleOptions.pieChartAttribute] || 'unknown';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        // Generate a unique key for this distribution
        const cacheKey =
          Object.entries(categoryCount)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => `${k}:${v}`)
            .join('|') + `|${size}`;

        // Calculate radius based on cluster size (min 15, max from options)
        const radius = Math.min(Math.max(15, Math.sqrt(size) * 3), styleOptions.maxPieChartSize);

        // Check if we have this chart cached
        let canvas = pieChartCanvasCache.current[cacheKey];
        if (!canvas) {
          canvas = generatePieChartCanvas(categoryCount, radius * 2);
          pieChartCanvasCache.current[cacheKey] = canvas;
        }

        // Store metadata for hover/click events
        if (feature instanceof Feature) {
          feature.set('pieChartData', {
            categoryCount,
            totalItems: size,
          });
        }

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Create style with the pie chart as icon
        return new Style({
          image: new Icon({
            src: dataUrl,
            scale: 1,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: styleOptions.textColor,
            }),
            font: 'bold 12px Arial',
            offsetY: 1,
          }),
        });
      } else {
        // For smaller clusters, use a simple circle
        // Calculate radius based on cluster size
        const radius = Math.min(Math.max(10, Math.sqrt(size) * 3.5), 30);

        // Get dominant category if available
        let dominantCategory = 'unknown';
        let categoryCounts: Record<string, number> = {};

        if (features.length > 0) {
          categoryCounts = {};
          features.forEach(f => {
            const props = f.get('properties') || {};
            const category = props[styleOptions.pieChartAttribute] || 'unknown';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });

          let maxCount = 0;
          Object.entries(categoryCounts).forEach(([category, count]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantCategory = category;
            }
          });
        }

        // Use color of dominant category or default
        const fillColor =
          styleOptions.colorScheme[dominantCategory] || styleOptions.defaultColors[0];

        // Store metadata for hover/click events
        if (feature instanceof Feature) {
          feature.set('pieChartData', {
            categoryCount: categoryCounts,
            dominantCategory,
            totalItems: size,
          });
        }

        // Create style with circle and text
        return new Style({
          image: new Icon({
            src:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">
                <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="${fillColor}" stroke="${styleOptions.strokeColor}" stroke-width="${styleOptions.strokeWidth}" />
              </svg>
            `),
            scale: 1,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: styleOptions.textColor,
            }),
            font: 'bold 12px Arial',
            offsetY: 1,
          }),
        });
      }
    };
  };

  // Initialize vector layer with clustering
  useEffect(() => {
    if (!activeMap) return;

    // Convert data to features
    const features = createFeatures(data);

    // Create vector source
    const source = new VectorSource({
      features: features,
    });

    // Create cluster source
    const clusterSource = new Cluster({
      distance: distance,
      minDistance: minDistance,
      source: source,
    });

    clusterSourceRef.current = clusterSource;

    // Create vector layer with clustering
    const vectorLayer = new VectorLayer({
      source: clusterSource,
      style: createClusterStyleFunction(),
      opacity: opacity,
      zIndex: 10,
    });

    // Set layer reference
    vectorLayerRef.current = vectorLayer;

    // Add layer to map
    activeMap.addLayer(vectorLayer);

    let clickHandlerRef: ((event: any) => void) | null = null;
    let moveHandlerRef: ((event: any) => void) | null = null;

    // Handle click events on clusters
    if (onClusterClick) {
      const clickHandler = (event: any) => {
        activeMap.forEachFeatureAtPixel(event.pixel, (clickedFeature: FeatureLike) => {
          // We need to handle both Feature and RenderFeature types
          const features = clickedFeature.get('features');
          if (features && features.length > 0) {
            const geometry = clickedFeature.getGeometry();
            if (geometry) {
              // Type assertion for Point geometry which has getCoordinates
              const coordinate = (geometry as Point).getCoordinates();
              const metadata = clickedFeature.get('pieChartData') || {};
              onClusterClick(features, coordinate, metadata);
              return true;
            }
          }
          return false;
        });
      };

      activeMap.on('click', clickHandler);
      clickHandlerRef = clickHandler;
    }

    // Handle hover events on clusters
    if (onClusterHover) {
      const moveHandler = (event: any) => {
        let foundFeature = false;

        activeMap.forEachFeatureAtPixel(event.pixel, (hoveredFeature: FeatureLike) => {
          // Only process if we haven't found a feature yet
          if (!foundFeature) {
            const features = hoveredFeature.get('features');
            if (features && features.length > 0) {
              const geometry = hoveredFeature.getGeometry();
              if (geometry) {
                const coordinate = (geometry as Point).getCoordinates();
                const metadata = hoveredFeature.get('pieChartData') || {};
                onClusterHover(features, coordinate, metadata);
                foundFeature = true;
                return true;
              }
            }
          }
          return false;
        });

        // If no feature found, call with null to clear hover state
        if (!foundFeature) {
          onClusterHover(null, null, null);
        }
      };

      activeMap.on('pointermove', moveHandler);
      moveHandlerRef = moveHandler;
    }

    // Cleanup function
    return () => {
      if (clickHandlerRef) {
        activeMap.un('click', clickHandlerRef);
      }

      if (moveHandlerRef) {
        activeMap.un('pointermove', moveHandlerRef);
      }

      if (vectorLayerRef.current) {
        activeMap.removeLayer(vectorLayerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeMap, data, distance, minDistance, onClusterClick, onClusterHover]);

  // Update opacity when prop changes
  useEffect(() => {
    if (vectorLayerRef.current) {
      vectorLayerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  // Setup animation for clusters when map view changes
  useEffect(() => {
    if (!activeMap || !animationEnabled) return;

    const handleMoveEnd = () => {
      if (animatingRef.current || !clusterSourceRef.current) return;

      const clusterSource = clusterSourceRef.current;

      // Get current features in the cluster
      const features = clusterSource.getFeatures();

      // Record current positions as a Record/dictionary
      const previousPositions: Record<string, number[]> = {};
      features.forEach(feature => {
        const geometry = feature.getGeometry();
        if (geometry) {
          // Type assertion to Point which has getCoordinates
          const center = (geometry as Point).getCoordinates();
          const featureId = String(feature.getId() || Math.random().toString(36).substring(2, 9));
          previousPositions[featureId] = center;
        }
      });

      // Force re-clustering
      clusterSource.refresh();

      // Setup animation from previous positions to new ones
      animatingRef.current = true;
      let start = Date.now();

      // Animation function
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const frameProgress = easeOut(progress);

        // Apply the animation to each cluster
        features.forEach(feature => {
          const featureId = String(feature.getId() || '');
          const prevCoords = previousPositions[featureId];
          if (!prevCoords) return;

          const geometry = feature.getGeometry();
          if (!geometry) return;

          // Only animate if feature still exists
          const isPoint = geometry instanceof Point;
          if (!isPoint) return;

          // Get current coordinates
          const currentCoords = geometry.getCoordinates();

          // Skip if no change
          if (prevCoords[0] === currentCoords[0] && prevCoords[1] === currentCoords[1]) return;

          // Calculate interpolated position
          const x = prevCoords[0] + (currentCoords[0] - prevCoords[0]) * frameProgress;
          const y = prevCoords[1] + (currentCoords[1] - prevCoords[1]) * frameProgress;

          // Create a new point geometry for the interpolated position
          const animGeom = new Point([x, y]);
          (feature as Feature).setGeometry(animGeom);
        });

        // Request next frame if not complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animatingRef.current = false;
          // Apply final positions
          vectorLayerRef.current?.changed();
        }
      };

      // Start animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Add event listener
    activeMap.on('moveend', handleMoveEnd);

    // Cleanup
    return () => {
      activeMap.un('moveend', handleMoveEnd);
    };
  }, [activeMap, animationEnabled]);

  return null; // The layer is added directly to the map
};

export default PieClusterLayer;
