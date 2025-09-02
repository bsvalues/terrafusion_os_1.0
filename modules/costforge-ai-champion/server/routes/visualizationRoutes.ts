/**
 * Visualization Routes for CostForge AI Champion
 * 
 * Handles 3D visualization, AR/VR content generation,
 * and advanced data visualization services.
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== 3D VISUALIZATION ====================

/**
 * Generate 3D building model data for visualization
 */
router.post('/3d/building-model', async (req: Request, res: Response) => {
  try {
    const {
      buildingType,
      squareFootage,
      floors,
      height,
      width,
      length,
      features,
      style
    } = req.body;

    if (!buildingType || !squareFootage) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['buildingType', 'squareFootage']
      });
    }

    // Calculate building dimensions if not provided
    const calculatedDimensions = {
      floors: floors || 1,
      height: height || (floors || 1) * 10, // 10 feet per floor
      width: width || Math.sqrt(Number(squareFootage) / (floors || 1)),
      length: length || Math.sqrt(Number(squareFootage) / (floors || 1))
    };

    // Generate basic 3D model structure
    const model3D = {
      type: 'building',
      buildingType,
      dimensions: calculatedDimensions,
      geometry: {
        vertices: generateBuildingVertices(calculatedDimensions),
        faces: generateBuildingFaces(calculatedDimensions),
        materials: generateMaterialMapping(buildingType, features || [])
      },
      components: generateBuildingComponents(buildingType, calculatedDimensions, features || []),
      metadata: {
        squareFootage: Number(squareFootage),
        volume: calculatedDimensions.width * calculatedDimensions.length * calculatedDimensions.height,
        style: style || 'modern'
      }
    };

    res.json({
      success: true,
      model3D,
      renderingHints: {
        camera: {
          position: [calculatedDimensions.width * 1.5, calculatedDimensions.height, calculatedDimensions.length * 1.5],
          target: [calculatedDimensions.width / 2, 0, calculatedDimensions.length / 2]
        },
        lighting: [
          { type: 'directional', position: [100, 100, 50], intensity: 1.0 },
          { type: 'ambient', intensity: 0.3 }
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating 3D building model:', error);
    res.status(500).json({
      error: '3D model generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate AR markers and content for building visualization
 */
router.post('/ar/generate-content', async (req: Request, res: Response) => {
  try {
    const {
      buildingData,
      costData,
      markerType,
      targetPlatform
    } = req.body;

    if (!buildingData) {
      return res.status(400).json({
        error: 'Building data is required for AR content generation'
      });
    }

    // Generate AR content structure
    const arContent = {
      scene: {
        type: 'ar-scene',
        markers: [{
          type: markerType || 'hiro',
          pattern: '/public/ar-marker-instructions.svg',
          size: 1
        }],
        models: [{
          id: 'building-model',
          type: 'gltf',
          src: '#building-geometry',
          position: '0 0 0',
          scale: '0.5 0.5 0.5',
          animation: 'property: rotation; to: 0 360 0; loop: true; dur: 10000'
        }],
        ui: {
          info: {
            buildingType: buildingData.buildingType,
            squareFootage: buildingData.squareFootage,
            estimatedCost: costData?.totalCost || 'Not calculated',
            position: '0 2 -5'
          },
          controls: {
            rotate: true,
            scale: true,
            info: true
          }
        }
      },
      assets: {
        geometry: generateARGeometry(buildingData),
        materials: generateARMaterials(buildingData.buildingType),
        textures: generateARTextures(buildingData.buildingType)
      },
      interactions: [
        {
          trigger: 'click',
          target: 'building-model',
          action: 'toggle-info'
        },
        {
          trigger: 'hover',
          target: 'building-model',
          action: 'highlight'
        }
      ],
      platform: targetPlatform || 'web'
    };

    res.json({
      success: true,
      arContent,
      instructions: {
        setup: 'Print the marker pattern and point your device camera at it',
        interaction: 'Touch the building model to view cost information',
        requirements: 'WebXR compatible browser or AR.js support'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating AR content:', error);
    res.status(500).json({
      error: 'AR content generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== DATA VISUALIZATION ====================

/**
 * Generate chart data for cost analysis visualization
 */
router.post('/charts/cost-breakdown', async (req: Request, res: Response) => {
  try {
    const { costData, chartType, options } = req.body;

    if (!costData) {
      return res.status(400).json({
        error: 'Cost data is required for chart generation'
      });
    }

    let chartData;

    switch (chartType) {
      case 'pie':
        chartData = generatePieChartData(costData);
        break;
      case 'bar':
        chartData = generateBarChartData(costData);
        break;
      case 'line':
        chartData = generateLineChartData(costData);
        break;
      case 'area':
        chartData = generateAreaChartData(costData);
        break;
      default:
        chartData = generatePieChartData(costData); // Default to pie chart
    }

    res.json({
      success: true,
      chartType: chartType || 'pie',
      chartData,
      config: {
        responsive: true,
        animation: options?.animation !== false,
        colors: generateColorPalette(Object.keys(chartData.datasets?.[0]?.data || chartData.data || {})),
        ...options
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating chart data:', error);
    res.status(500).json({
      error: 'Chart generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate interactive data exploration configurations
 */
router.post('/interactive/data-explorer', async (req: Request, res: Response) => {
  try {
    const { dataSet, explorationConfig } = req.body;

    if (!dataSet || !Array.isArray(dataSet)) {
      return res.status(400).json({
        error: 'DataSet array is required for interactive exploration'
      });
    }

    // Analyze data structure
    const dataAnalysis = analyzeDataStructure(dataSet);
    
    // Generate interactive configuration
    const interactiveConfig = {
      dimensions: dataAnalysis.dimensions,
      metrics: dataAnalysis.metrics,
      filters: generateFilterConfig(dataAnalysis),
      visualizations: [
        {
          type: 'scatter',
          x: dataAnalysis.metrics[0]?.field || 'squareFootage',
          y: dataAnalysis.metrics[1]?.field || 'totalCost',
          color: dataAnalysis.dimensions[0]?.field || 'buildingType'
        },
        {
          type: 'histogram',
          field: dataAnalysis.metrics[0]?.field || 'totalCost',
          bins: 20
        },
        {
          type: 'boxplot',
          field: dataAnalysis.metrics[0]?.field || 'totalCost',
          groupBy: dataAnalysis.dimensions[0]?.field || 'buildingType'
        }
      ],
      interactions: {
        brush: true,
        zoom: true,
        hover: true,
        click: true
      }
    };

    res.json({
      success: true,
      dataAnalysis,
      interactiveConfig,
      sampleData: dataSet.slice(0, 5), // First 5 records for preview
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating interactive data explorer:', error);
    res.status(500).json({
      error: 'Interactive data explorer generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== UTILITY FUNCTIONS ====================

function generateBuildingVertices(dimensions: any) {
  const { width, length, height } = dimensions;
  return [
    // Base vertices
    [0, 0, 0], [width, 0, 0], [width, 0, length], [0, 0, length],
    // Top vertices
    [0, height, 0], [width, height, 0], [width, height, length], [0, height, length]
  ];
}

function generateBuildingFaces(dimensions: any) {
  return [
    // Base
    [0, 1, 2, 3],
    // Top
    [4, 7, 6, 5],
    // Sides
    [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]
  ];
}

function generateMaterialMapping(buildingType: string, features: string[]) {
  const baseMaterials = {
    'Residential': { wall: 'brick', roof: 'shingle', foundation: 'concrete' },
    'Commercial': { wall: 'glass', roof: 'metal', foundation: 'concrete' },
    'Industrial': { wall: 'metal', roof: 'metal', foundation: 'concrete' },
    'Agricultural': { wall: 'wood', roof: 'metal', foundation: 'concrete' }
  };

  return baseMaterials[buildingType as keyof typeof baseMaterials] || baseMaterials['Residential'];
}

function generateBuildingComponents(buildingType: string, dimensions: any, features: string[]) {
  const components = ['foundation', 'walls', 'roof'];
  
  if (features.includes('windows')) components.push('windows');
  if (features.includes('doors')) components.push('doors');
  if (buildingType === 'Commercial' && features.includes('elevator')) components.push('elevator');

  return components.map(component => ({
    type: component,
    material: 'default',
    visible: true
  }));
}

function generateARGeometry(buildingData: any) {
  return `
    <a-box 
      id="building-geometry" 
      width="${Math.sqrt(buildingData.squareFootage) / 100}" 
      height="${(buildingData.floors || 1) / 10}" 
      depth="${Math.sqrt(buildingData.squareFootage) / 100}"
      material="color: #4CC3D9"
    ></a-box>
  `;
}

function generateARMaterials(buildingType: string) {
  const materials = {
    'Residential': '#8B4513',
    'Commercial': '#4169E1', 
    'Industrial': '#696969',
    'Agricultural': '#228B22'
  };
  return materials[buildingType as keyof typeof materials] || materials['Residential'];
}

function generateARTextures(buildingType: string) {
  return [`texture-${buildingType.toLowerCase()}.jpg`];
}

function generatePieChartData(costData: any) {
  const breakdown = costData.breakdown || {};
  return {
    labels: Object.keys(breakdown),
    data: Object.values(breakdown),
    backgroundColor: generateColorPalette(Object.keys(breakdown))
  };
}

function generateBarChartData(costData: any) {
  const breakdown = costData.breakdown || {};
  return {
    labels: Object.keys(breakdown),
    datasets: [{
      label: 'Cost ($)',
      data: Object.values(breakdown),
      backgroundColor: generateColorPalette(Object.keys(breakdown))
    }]
  };
}

function generateLineChartData(costData: any) {
  // For line charts, we'd typically need time series data
  // This is a simplified example
  const breakdown = costData.breakdown || {};
  return {
    labels: Object.keys(breakdown),
    datasets: [{
      label: 'Cost Trend',
      data: Object.values(breakdown),
      borderColor: '#4CC3D9',
      fill: false
    }]
  };
}

function generateAreaChartData(costData: any) {
  const breakdown = costData.breakdown || {};
  return {
    labels: Object.keys(breakdown),
    datasets: [{
      label: 'Cost Distribution',
      data: Object.values(breakdown),
      backgroundColor: '#4CC3D9',
      borderColor: '#4CC3D9',
      fill: true
    }]
  };
}

function generateColorPalette(labels: string[]) {
  const colors = [
    '#4CC3D9', '#7BC8A4', '#F16745', '#FFC65D', '#93648D',
    '#404040', '#F7931E', '#FFD23F', '#EE4C2C', '#2E8B57'
  ];
  return labels.map((_ /* , index */) => colors[index % colors.length]);
}

function analyzeDataStructure(dataSet: any[]) {
  if (dataSet.length === 0) {
    return { dimensions: [], metrics: [] };
  }

  const sampleRecord = dataSet[0];
  const dimensions = [];
  const metrics = [];

  for (const [key, value] of Object.entries(sampleRecord)) {
    if (typeof value === 'string') {
      dimensions.push({ field: key, type: 'categorical' });
    } else if (typeof value === 'number') {
      metrics.push({ field: key, type: 'quantitative' });
    } else if (typeof value === 'boolean') {
      dimensions.push({ field: key, type: 'boolean' });
    }
  }

  return { dimensions, metrics };
}

function generateFilterConfig(dataAnalysis: any) {
  return {
    categorical: dataAnalysis.dimensions
      .filter((d: any) => d.type === 'categorical')
      .map((d: any) => ({ field: d.field, type: 'select' })),
    numerical: dataAnalysis.metrics
      .map((m: any) => ({ field: m.field, type: 'range' })),
    boolean: dataAnalysis.dimensions
      .filter((d: any) => d.type === 'boolean')
      .map((d: any) => ({ field: d.field, type: 'checkbox' }))
  };
}

export { router as visualizationRoutes };