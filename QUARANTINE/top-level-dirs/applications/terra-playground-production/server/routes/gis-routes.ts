import express from 'express';
import QGISService from '../services/qgis-service';
import { GISExportService } from '../services/gis/gis-export-service';
import fs from 'fs';
import path from 'path';
import { IStorage } from '../storage';
import { createPredictionRoutes } from './prediction-routes';

export function createGisRoutes(storage: IStorage) {
  const router = express.Router();
  const qgisService = new QGISService(storage);
  const gisExportService = new GISExportService(storage);

  // Get all QGIS projects
  router.get('/projects', async (req, res) => {
    try {
      const projects = await qgisService.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching QGIS projects:', error);
      res.status(500).json({ error: 'Failed to fetch QGIS projects' });
    }
  });

  // Get a specific QGIS project
  router.get('/projects/:id', async (req, res) => {
    try {
      const project = await qgisService.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'QGIS project not found' });
      }
      res.json(project);
    } catch (error) {
      console.error('Error fetching QGIS project:', error);
      res.status(500).json({ error: 'Failed to fetch QGIS project' });
    }
  });

  // Get layers for a specific QGIS project
  router.get('/projects/:id/layers', async (req, res) => {
    try {
      const layers = await qgisService.getLayers(req.params.id);
      res.json(layers);
    } catch (error) {
      console.error('Error fetching layers for QGIS project:', error);
      res.status(500).json({ error: 'Failed to fetch layers for QGIS project' });
    }
  });

  // Get property boundaries GeoJSON
  router.get('/property-boundaries', async (req, res) => {
    try {
      const boundaries = await qgisService.getPropertyBoundaries(
        req.query.bbox as string,
        req.query.filter as string
      );
      res.json(boundaries);
    } catch (error) {
      console.error('Error fetching property boundaries:', error);
      res.status(500).json({ error: 'Failed to fetch property boundaries' });
    }
  });

  // Get property details
  router.get('/properties/:id', async (req, res) => {
    try {
      const property = await qgisService.getPropertyDetails(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      console.error('Error fetching property details:', error);
      res.status(500).json({ error: 'Failed to fetch property details' });
    }
  });

  // Search properties by address or ID
  router.get('/properties/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const results = await qgisService.searchProperties(query);
      res.json(results);
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({ error: 'Failed to search properties' });
    }
  });

  // Export map as image
  router.post('/export/image', async (req, res) => {
    try {
      const { bbox, width, height, layers, format } = req.body;

      const imageBuffer = await qgisService.exportMapImage(
        bbox,
        width,
        height,
        layers,
        format || 'png'
      );

      res.set('Content-Type', `image/${format || 'png'}`);
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error exporting map image:', error);
      res.status(500).json({ error: 'Failed to export map image' });
    }
  });

  // Export map as PDF
  router.post('/export/pdf', async (req, res) => {
    try {
      const { bbox, width, height, layers, title, includeAttribution } = req.body;

      // For now, use the existing exportMap method as exportMapPDF is not available
      const projectId = 'property-assessment'; // Default project
      const pdfBuffer = await qgisService.exportMap(
        projectId,
        [bbox[0], bbox[1], bbox[2], bbox[3]],
        width,
        height,
        'pdf'
      );

      if (pdfBuffer) {
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'attachment; filename="map-export.pdf"');
        res.send(pdfBuffer);
      } else {
        res.status(500).json({ error: 'Failed to export map as PDF' });
      }
    } catch (error) {
      console.error('Error exporting map as PDF:', error);
      res.status(500).json({ error: 'Failed to export map as PDF' });
    }
  });

  // Add QGIS info endpoint to highlight open source features
  router.get('/qgis-info', (req, res) => {
    const qgisInfo = qgisService.getQGISInfo();
    res.json(qgisInfo);
  });

  // Get available basemaps
  router.get('/basemaps', async (req, res) => {
    try {
      const basemaps = await qgisService.getBasemaps();
      res.json(basemaps);
    } catch (error) {
      console.error('Error fetching basemaps:', error);
      res.status(500).json({ error: 'Failed to fetch basemaps' });
    }
  });

  // Get all available GIS layers
  router.get('/layers', async (req, res) => {
    try {
      // Sample layers data for now
      const layers = [
        {
          id: 'property-parcels',
          name: 'Property Parcels',
          type: 'vector',
          visible: true,
          description: 'Property boundaries and parcel information',
        },
        {
          id: 'zoning',
          name: 'Zoning Areas',
          type: 'vector',
          visible: false,
          description: 'Zoning designations and regulations',
        },
        {
          id: 'terrain',
          name: 'Terrain Elevation',
          type: 'raster',
          visible: false,
          description: 'Terrain elevation data with hillshading',
        },
        {
          id: 'aerial',
          name: 'Aerial Imagery',
          type: 'raster',
          visible: false,
          description: 'High-resolution aerial photography',
        },
      ];

      res.json(layers);
    } catch (error) {
      console.error('Error fetching GIS layers:', error);
      res.status(500).json({ error: 'Failed to fetch GIS layers' });
    }
  });

  // Mount the prediction routes
  router.use('/', createPredictionRoutes(storage));

  // Get sample data points for clustering demo
  router.get('/clustering-demo/data', async (req, res) => {
    try {
      // Retrieve properties from storage for clustering demo
      const properties = await storage.getAllProperties();

      // Format for clustering demo with coordinates
      const dataPoints = properties.map(property => {
        // Generate coordinates near Benton County if none exist
        const center = [-119.7, 46.2]; // Benton County, WA
        const randomOffset = () => (Math.random() - 0.5) * 0.4; // ~20km radius

        // Use property coordinates from extraFields if available, otherwise generate random ones
        const propertyCoordinates =
          property.extraFields &&
          typeof property.extraFields === 'object' &&
          'coordinates' in property.extraFields
            ? (property.extraFields as any).coordinates
            : null;

        const coordinates = propertyCoordinates || [
          center[0] + randomOffset(),
          center[1] + randomOffset(),
        ];

        return {
          id: property.propertyId,
          position: coordinates,
          properties: {
            address: property.address,
            value: property.value,
            type: property.propertyType,
            status: property.status,
          },
        };
      });

      res.json(dataPoints);
    } catch (error) {
      console.error('Error fetching clustering data:', error);
      res.status(500).json({ error: 'Failed to fetch clustering data' });
    }
  });

  // Geospatial Data Export endpoint
  router.post('/export', async (req, res) => {
    try {
      await gisExportService.exportData(req, res);
    } catch (error) {
      console.error('Error exporting geospatial data:', error);
      res.status(500).json({ error: 'Failed to export geospatial data' });
    }
  });

  return router;
}
