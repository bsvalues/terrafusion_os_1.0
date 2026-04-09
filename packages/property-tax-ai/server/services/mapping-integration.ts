/**
 * Mapping Integration Service
 * 
 * This service provides integration with mapping services for property visualization
 * based on the configurations in the Benton County system. It supports ESRI, Google Maps,
 * and Pictometry integration.
 */

import { z } from "zod";

// Configuration schema for ESRI Map settings
const esriMapConfigSchema = z.object({
  baseLayers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    visible: z.boolean().optional()
  })),
  viewableLayers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    visible: z.boolean().optional()
  })),
  geometryServer: z.object({
    url: z.string()
  }),
  mapExtent: z.object({
    xmin: z.number(),
    ymin: z.number(),
    xmax: z.number(),
    ymax: z.number(),
    wkid: z.number()
  }),
  defaultSymbols: z.object({
    point: z.object({
      color: z.array(z.number()),
      size: z.number(),
      type: z.string()
    }),
    polygon: z.object({
      outline: z.object({
        color: z.array(z.number()),
        width: z.number()
      }),
      fill: z.object({
        color: z.array(z.number())
      })
    })
  })
});

type EsriMapConfig = z.infer<typeof esriMapConfigSchema>;

// Configuration schema for Google Map settings
const googleMapConfigSchema = z.object({
  apiKey: z.string(),
  defaultCenter: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  defaultZoom: z.number()
});

type GoogleMapConfig = z.infer<typeof googleMapConfigSchema>;

// Configuration schema for Pictometry settings
const pictometryConfigSchema = z.object({
  interfaceTemplateURL: z.string(),
  apiKey: z.string().optional(),
  defaultView: z.string().optional()
});

type PictometryConfig = z.infer<typeof pictometryConfigSchema>;

/**
 * Main class for mapping integrations
 */
export class MappingIntegration {
  private esriMapConfig: EsriMapConfig = {
    baseLayers: [
      {
        id: "imagery",
        name: "Imagery",
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        type: "ESRITiledLayer",
        visible: true
      },
      {
        id: "street",
        name: "Street Map",
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
        type: "ESRITiledLayer",
        visible: false
      },
      {
        id: "topo",
        name: "Topo",
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
        type: "ESRITiledLayer",
        visible: false
      },
      {
        id: "fema",
        name: "FEMA Flood",
        url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer",
        type: "ESRIDynamicLayer",
        visible: false
      },
      {
        id: "usgs",
        name: "USGS Imagery",
        url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
        type: "ESRITiledLayer",
        visible: false
      }
    ],
    viewableLayers: [
      {
        id: "parcels",
        name: "Parcels",
        url: "https://gis.bentoncountywa.gov/arcgis/rest/services/AssessorParcels/FeatureServer/0",
        type: "ESRIFeatureLayer",
        visible: true
      },
      {
        id: "plats",
        name: "Plats",
        url: "https://gis.bentoncountywa.gov/arcgis/rest/services/Plats/FeatureServer/0",
        type: "ESRIFeatureLayer",
        visible: false
      },
      {
        id: "floodZones",
        name: "Flood Zones",
        url: "https://gis.bentoncountywa.gov/arcgis/rest/services/FloodZones/FeatureServer/0",
        type: "ESRIFeatureLayer",
        visible: false
      },
      {
        id: "zoning",
        name: "Zoning",
        url: "https://gis.bentoncountywa.gov/arcgis/rest/services/Zoning/FeatureServer/0",
        type: "ESRIFeatureLayer",
        visible: false
      }
    ],
    geometryServer: {
      url: "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
    },
    mapExtent: {
      xmin: -119.8,
      ymin: 46.0,
      xmax: -119.0,
      ymax: 46.4,
      wkid: 4326
    },
    defaultSymbols: {
      point: {
        color: [0, 0, 255, 255],
        size: 10,
        type: "simpleMarker"
      },
      polygon: {
        outline: {
          color: [0, 0, 255, 255],
          width: 2
        },
        fill: {
          color: [0, 0, 255, 100]
        }
      }
    }
  };
  
  private googleMapConfig: GoogleMapConfig = {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    defaultCenter: {
      lat: 46.2,
      lng: -119.4
    },
    defaultZoom: 11
  };
  
  private pictometryConfig: PictometryConfig = {
    interfaceTemplateURL: "https://pol.pictometry.com/go/?&s=true&p=GO&fs=true",
    apiKey: process.env.PICTOMETRY_API_KEY,
    defaultView: "north"
  };
  
  /**
   * Get ESRI map configuration
   */
  getEsriMapConfig(): EsriMapConfig {
    return this.esriMapConfig;
  }
  
  /**
   * Get Google Maps configuration
   */
  getGoogleMapConfig(): GoogleMapConfig {
    return this.googleMapConfig;
  }
  
  /**
   * Get Pictometry configuration
   */
  getPictometryConfig(): PictometryConfig {
    return this.pictometryConfig;
  }
  
  /**
   * Generate ESRI map URL for a specific property
   */
  generateEsriMapUrl(propertyId: string, parcelNumber: string): string {
    // This would typically call the ESRI API to generate a URL
    // For now, we'll create a simulated URL
    const baseUrl = "https://gis.bentoncountywa.gov/arcgis/rest/services/AssessorParcels/MapServer";
    return `${baseUrl}?f=json&where=propertyid='${propertyId}'&parcelNumber='${parcelNumber}'`;
  }
  
  /**
   * Generate Google Maps URL for a specific address
   */
  generateGoogleMapsUrl(address: string): string {
    // Create a Google Maps URL for the property
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }
  
  /**
   * Generate Pictometry URL for a specific property
   */
  generatePictometryUrl(lat: number, lng: number): string {
    // Create a Pictometry URL for the property
    return `${this.pictometryConfig.interfaceTemplateURL}&lat=${lat}&lon=${lng}`;
  }
  
  /**
   * Find parcel by property ID
   */
  async findParcelByPropertyId(propertyId: string) {
    // This would typically call the ESRI API to find a parcel
    // For now, return mock structure of what would be returned
    return {
      success: true,
      propertyId,
      coordinates: {
        lat: 46.2,
        lng: -119.4
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-119.41, 46.21],
            [-119.40, 46.21],
            [-119.40, 46.20],
            [-119.41, 46.20],
            [-119.41, 46.21]
          ]
        ]
      }
    };
  }
  
  /**
   * Get base layers information
   */
  getBaseLayers() {
    return this.esriMapConfig.baseLayers;
  }
  
  /**
   * Get viewable layers information
   */
  getViewableLayers() {
    return this.esriMapConfig.viewableLayers;
  }
  
  /**
   * Get map extent information
   */
  getMapExtent() {
    return this.esriMapConfig.mapExtent;
  }
}

export const mappingIntegration = new MappingIntegration();