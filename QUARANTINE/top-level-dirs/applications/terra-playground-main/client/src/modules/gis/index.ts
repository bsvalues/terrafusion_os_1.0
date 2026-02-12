/**
 * GIS Module
 *
 * This module provides comprehensive GIS functionality:
 * - 3D Terrain Visualization
 * - Advanced Clustering
 * - Viewshed Analysis
 * - Property Extrusion
 * - QGIS Integration
 *
 * The module is designed to be self-contained with its own components,
 * contexts, utilities, and pages.
 */

// Export pages
export { default as GISHub } from './pages/GISHub';
export { default as Terrain3DDemo } from './pages/Terrain3DDemo';

// Export components
export { default as TerrainVisualization3D } from './components/TerrainVisualization3D';
export { default as GeospatialExportWizard } from './components/GeospatialExportWizard';
export { default as GeospatialStorytellingWizard } from './components/GeospatialStorytellingWizard';

// Export contexts
export { useGIS, GISProvider } from './contexts/GISContext';

// Export utilities
export * from './utils/ol-ext-utils';

// Export services
export { MapProviderService } from './services/MapProviderService';
