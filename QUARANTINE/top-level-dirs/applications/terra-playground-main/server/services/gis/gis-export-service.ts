import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { IStorage } from '../../storage';

// Types for the export request
interface ExportOptions {
  includeAttributes: boolean;
  includeGeometry: boolean;
  coordinateSystem: string;
  exportArea: 'visible' | 'selection' | 'all';
  customBoundingBox?: string;
  compression: 'none' | 'zip';
  includeMetadata: boolean;
}

interface ExportRequest {
  layers: string[];
  format: 'geojson' | 'shapefile' | 'kml' | 'csv' | 'xlsx';
  options: ExportOptions;
  filename: string;
}

/**
 * GIS Export Service
 *
 * Handles exporting geospatial data in various formats
 */
export class GISExportService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Export geospatial data in the requested format
   */
  public async exportData(req: Request, res: Response): Promise<void> {
    try {
      const exportRequest: ExportRequest = req.body;
      const { layers, format, options, filename } = exportRequest;

      if (!layers || !layers.length) {
        res.status(400).json({ error: 'No layers specified for export' });
        return;
      }

      // Fetch the data for the requested layers
      const layerData = await this.fetchLayerData(layers, options.exportArea);

      // Process data according to options
      const processedData = this.processData(layerData, options);

      // Generate export in requested format
      switch (format) {
        case 'geojson':
          this.exportAsGeoJSON(processedData, options, res);
          break;
        case 'shapefile':
          this.exportAsShapefile(processedData, filename, options, res);
          break;
        case 'kml':
          this.exportAsKML(processedData, options, res);
          break;
        case 'csv':
          this.exportAsCSV(processedData, options, res);
          break;
        case 'xlsx':
          this.exportAsExcel(processedData, options, res);
          break;
        default:
          res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Error exporting GIS data:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }

  /**
   * Fetch the data for the requested layers
   */
  private async fetchLayerData(layerIds: string[], exportArea: string): Promise<any[]> {
    // Simulate fetching data
    const layerData = [];

    for (const layerId of layerIds) {
      // In a real implementation, this would query the database for the layer data

      // For demo purposes, generate some sample features
      const features = [];

      // Create 5 sample features per layer
      for (let i = 1; i <= 5; i++) {
        features.push({
          id: `${layerId}-feature-${i}`,
          properties: {
            name: `Feature ${i}`,
            value: Math.floor(Math.random() * 1000),
            type: ['residential', 'commercial', 'industrial'][Math.floor(Math.random() * 3)],
            area: Math.floor(Math.random() * 10000) / 100,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-119.7 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
                [-119.7 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
                [-119.7 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
                [-119.7 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
                [-119.7 + Math.random() * 0.1, 46.2 + Math.random() * 0.1],
              ],
            ],
          },
        });
      }

      layerData.push({
        layerId,
        features,
      });
    }

    return layerData;
  }

  /**
   * Process data according to export options
   */
  private processData(layerData: any[], options: ExportOptions): any[] {
    const processedData = [];

    for (const layer of layerData) {
      const processedLayer = { ...layer };

      // Filter attributes if not including them
      if (!options.includeAttributes) {
        processedLayer.features = processedLayer.features.map((feature: any) => {
          const { geometry, id } = feature;
          return { id, geometry };
        });
      }

      // Filter geometry if not including it
      if (!options.includeGeometry) {
        processedLayer.features = processedLayer.features.map((feature: any) => {
          const { properties, id } = feature;
          return { id, properties };
        });
      }

      // Convert coordinate system if needed
      if (options.coordinateSystem !== 'EPSG:4326' && options.includeGeometry) {
        processedLayer.features = processedLayer.features.map((feature: any) => {
          // In a real implementation, this would convert coordinates to the requested CRS
          // For demo purposes, we'll just return the original feature
          return feature;
        });
      }

      processedData.push(processedLayer);
    }

    return processedData;
  }

  /**
   * Export data as GeoJSON
   */
  private exportAsGeoJSON(layerData: any[], options: ExportOptions, res: Response): void {
    // Create a FeatureCollection for each layer
    const geoJSON = layerData.map(layer => {
      return {
        type: 'FeatureCollection',
        features: layer.features.map((feature: any) => ({
          type: 'Feature',
          id: feature.id,
          properties: feature.properties || {},
          geometry: feature.geometry,
        })),
      };
    });

    // If there's only one layer, return just that layer's GeoJSON
    // Otherwise, return an object with each layer
    const response: any =
      geoJSON.length === 1
        ? { ...geoJSON[0] }
        : geoJSON.reduce((acc: Record<string, any>, layer /* , index */) => {
            acc[layerData[index].layerId] = layer;
            return acc;
          }, {});

    // Add metadata if requested
    if (options.includeMetadata) {
      const metadata = {
        exportDate: new Date().toISOString(),
        layerCount: layerData.length,
        featureCount: layerData.reduce((acc, layer) => acc + layer.features.length, 0),
        coordinateSystem: options.coordinateSystem,
        exportArea: options.exportArea,
      };

      if (geoJSON.length === 1) {
        response.metadata = metadata;
      } else {
        response._metadata = metadata;
      }
    }

    res.json(response);
  }

  /**
   * Export data as Shapefile (zipped)
   */
  private exportAsShapefile(
    layerData: any[],
    filename: string,
    options: ExportOptions,
    res: Response
  ): void {
    // In a real implementation, this would convert the data to Shapefile format
    // For demo purposes, we'll just return GeoJSON with shapefile metadata

    // Create a simple shapefile-like structure (as JSON)
    const shapefile: any = {
      type: 'ShapefileExport',
      layers: layerData.map(layer => ({
        name: layer.layerId,
        shapeType: 'polygon',
        features: layer.features,
        recordCount: layer.features.length,
      })),
    };

    // Add metadata if requested
    if (options.includeMetadata) {
      shapefile.metadata = {
        exportDate: new Date().toISOString(),
        layerCount: layerData.length,
        featureCount: layerData.reduce((acc, layer) => acc + layer.features.length, 0),
        coordinateSystem: options.coordinateSystem,
        exportArea: options.exportArea,
      };
    }

    res.json(shapefile);
  }

  /**
   * Export data as KML
   */
  private exportAsKML(layerData: any[], options: ExportOptions, res: Response): void {
    // In a real implementation, this would convert the data to KML format
    // For demo purposes, we'll just return a simple KML-like structure (as JSON)

    const kml: any = {
      type: 'KMLExport',
      document: {
        name: 'Exported Data',
        folders: layerData.map(layer => ({
          name: layer.layerId,
          placemarks: layer.features.map((feature: any) => ({
            name: `Feature ${feature.id}`,
            extendedData: options.includeAttributes ? feature.properties : null,
            geometry: options.includeGeometry ? feature.geometry : null,
          })),
        })),
      },
    };

    // Add metadata if requested
    if (options.includeMetadata) {
      kml.metadata = {
        exportDate: new Date().toISOString(),
        layerCount: layerData.length,
        featureCount: layerData.reduce((acc, layer) => acc + layer.features.length, 0),
        coordinateSystem: options.coordinateSystem,
        exportArea: options.exportArea,
      };
    }

    res.json(kml);
  }

  /**
   * Export data as CSV
   */
  private exportAsCSV(layerData: any[], options: ExportOptions, res: Response): void {
    // In a real implementation, this would convert the data to CSV format
    // For demo purposes, we'll create a CSV-like structure (as JSON)

    const csv: any = {
      type: 'CSVExport',
      data: [] as any[],
    };

    // If we have multiple layers, we'll create a CSV structure for each layer
    if (layerData.length === 1) {
      const layer = layerData[0];

      // Get all unique property keys
      const keys = new Set<string>();
      layer.features.forEach((feature: any) => {
        if (feature.properties) {
          Object.keys(feature.properties).forEach(key => keys.add(key));
        }
      });

      // Add ID column
      const columns = ['id', ...Array.from(keys)];

      // Add geometry columns if including geometry
      if (options.includeGeometry) {
        columns.push('geometry_type', 'geometry_coordinates');
      }

      csv.columns = columns;

      // Add data rows
      csv.data = layer.features.map((feature: any) => {
        const row: any = {
          id: feature.id,
        };

        // Add properties
        if (feature.properties) {
          for (const [key, value] of Object.entries(feature.properties)) {
            row[key] = value;
          }
        }

        // Add geometry if including it
        if (options.includeGeometry && feature.geometry) {
          row.geometry_type = feature.geometry.type;
          row.geometry_coordinates = JSON.stringify(feature.geometry.coordinates);
        }

        return row;
      });
    } else {
      // Multiple layers - create a simple list of features with layer ID
      csv.columns = ['layer_id', 'feature_id', 'properties'];

      // Add data rows
      csv.data = [];

      layerData.forEach(layer => {
        layer.features.forEach((feature: any) => {
          csv.data.push({
            layer_id: layer.layerId,
            feature_id: feature.id,
            properties: options.includeAttributes ? JSON.stringify(feature.properties) : '',
          });
        });
      });
    }

    // Add metadata if requested
    if (options.includeMetadata) {
      csv.metadata = {
        exportDate: new Date().toISOString(),
        layerCount: layerData.length,
        featureCount: layerData.reduce((acc, layer) => acc + layer.features.length, 0),
        coordinateSystem: options.coordinateSystem,
        exportArea: options.exportArea,
      };
    }

    res.json(csv);
  }

  /**
   * Export data as Excel
   */
  private exportAsExcel(layerData: any[], options: ExportOptions, res: Response): void {
    // In a real implementation, this would convert the data to Excel format
    // For demo purposes, we'll just return the same structure as CSV
    this.exportAsCSV(layerData, options, res);
  }
}
