/**
 * Report Generator Service
 *
 * This service generates formatted reports for various GIS operations
 * and analysis results. It supports multiple export formats including
 * PDF, GeoJSON, and CSV.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import PDFDocument from 'pdfkit';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import {
  GeospatialOperationType,
  MeasurementUnit,
  GeospatialAnalysisResult,
} from './geospatial-analysis';

// Available report formats
export enum ReportFormat {
  PDF = 'pdf',
  GEOJSON = 'geojson',
  CSV = 'csv',
  SHAPEFILE = 'shapefile',
}

// Report generation options
export interface ReportOptions {
  format: ReportFormat;
  title?: string;
  fileName?: string;
  includeMetadata?: boolean;
  includeMap?: boolean;
  includeTimestamp?: boolean;
  includeLegend?: boolean;
  outputPath?: string;
}

// Map of operation types to human-readable titles
const operationTitles: Record<GeospatialOperationType, string> = {
  [GeospatialOperationType.BUFFER]: 'Buffer Analysis',
  [GeospatialOperationType.INTERSECTION]: 'Intersection Analysis',
  [GeospatialOperationType.UNION]: 'Union Analysis',
  [GeospatialOperationType.DIFFERENCE]: 'Difference Analysis',
  [GeospatialOperationType.AREA]: 'Area Calculation',
  [GeospatialOperationType.CENTROID]: 'Centroid Analysis',
  [GeospatialOperationType.DISTANCE]: 'Distance Measurement',
  [GeospatialOperationType.MERGE]: 'Parcel Merge Analysis',
  [GeospatialOperationType.SPLIT]: 'Parcel Split Analysis',
  [GeospatialOperationType.SIMPLIFY]: 'Geometry Simplification',
};

// Unit formatting
const unitLabels: Record<MeasurementUnit, string> = {
  [MeasurementUnit.METERS]: 'meters',
  [MeasurementUnit.KILOMETERS]: 'kilometers',
  [MeasurementUnit.FEET]: 'feet',
  [MeasurementUnit.YARDS]: 'yards',
  [MeasurementUnit.MILES]: 'miles',
  [MeasurementUnit.ACRES]: 'acres',
  [MeasurementUnit.HECTARES]: 'hectares',
  [MeasurementUnit.SQUARE_FEET]: 'sq. feet',
  [MeasurementUnit.SQUARE_MILES]: 'sq. miles',
};

/**
 * Format a value with the appropriate unit label
 */
function formatWithUnit(value: number, unit?: MeasurementUnit): string {
  if (!unit) return value.toFixed(2);

  return `${value.toFixed(2)} ${unitLabels[unit] || ''}`;
}

/**
 * Generate a formatted timestamp for reports
 */
function getFormattedTimestamp(): string {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

/**
 * Generate a report filename with timestamp if not provided
 */
function generateFilename(options: ReportOptions, result: GeospatialAnalysisResult): string {
  if (options.fileName) return options.fileName;

  const opType = result.type.toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${opType}_report_${timestamp}`;
}

/**
 * Extract feature properties as a flat object
 */
function extractFeatureProperties(feature: Feature | null): Record<string, any> {
  if (!feature || !feature.properties) return {};
  return feature.properties;
}

/**
 * Generate a PDF report for geospatial analysis
 */
async function generatePDFReport(
  result: GeospatialAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${generateFilename(options, result)}.pdf`;
  const outputPath = options.outputPath || path.join(tempDir, fileName);

  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Add title
      const title = options.title || operationTitles[result.type] || 'Geospatial Analysis Report';
      doc.fontSize(25).font('Helvetica-Bold').text(title, { align: 'center' });

      // Add timestamp if requested
      if (options.includeTimestamp !== false) {
        doc
          .moveDown()
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated on: ${getFormattedTimestamp()}`, { align: 'center' });
      }

      // Add operation description
      doc.moveDown(2).fontSize(14).font('Helvetica-Bold').text('Operation Summary');

      doc.moveDown().fontSize(12).font('Helvetica').text(`Operation Type: ${result.type}`);

      // Add metadata if available and requested
      if (result.metadata && options.includeMetadata !== false) {
        doc.moveDown(2).fontSize(14).font('Helvetica-Bold').text('Calculation Results');

        doc.moveDown().fontSize(12).font('Helvetica');

        // Add each metadata property
        for (const [key, value] of Object.entries(result.metadata)) {
          if (key === 'unit') continue; // Skip the unit, we'll format with the values

          let displayValue = value;

          // Format numeric values with units where appropriate
          if (typeof value === 'number') {
            const unit = result.metadata.unit as MeasurementUnit;
            if (key === 'area' || key === 'originalArea') {
              displayValue = formatWithUnit(value, unit || MeasurementUnit.ACRES);
            } else if (key === 'distance' || key === 'length') {
              displayValue = formatWithUnit(value, unit || MeasurementUnit.FEET);
            } else if (key === 'computationTimeMs') {
              displayValue = `${value} ms`;
            }
          }

          // Format the key name for better readability
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/([a-z])([A-Z])/g, '$1 $2');

          doc.text(`${formattedKey}: ${displayValue}`);
        }
      }

      // If result is a feature or feature collection, add properties
      if (result.result && typeof result.result === 'object' && result.result !== null) {
        doc.moveDown(2).fontSize(14).font('Helvetica-Bold').text('Feature Properties');

        doc.moveDown().fontSize(12).font('Helvetica');

        if (
          'type' in result.result &&
          result.result.type === 'FeatureCollection' &&
          'features' in result.result
        ) {
          // It's a feature collection
          const featureCollection = result.result as FeatureCollection;

          doc.text(`Total Features: ${featureCollection.features.length}`);
          doc.moveDown();

          // Add properties for each feature (limited to first few to avoid huge reports)
          const maxFeatures = 5;
          featureCollection.features.slice(0, maxFeatures).forEach((feature /* , index */) => {
            doc
              .font('Helvetica-Bold')
              .text(`Feature ${index + 1}:`)
              .font('Helvetica');

            // Add feature properties
            if (feature.properties) {
              Object.entries(feature.properties).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`);
              });
            } else {
              doc.text('No properties');
            }

            doc.moveDown();
          });

          // If there are more features than we displayed
          if (featureCollection.features.length > maxFeatures) {
            doc.text(`...and ${featureCollection.features.length - maxFeatures} more features`);
          }
        } else if ('type' in result.result && result.result.type === 'Feature') {
          // It's a single feature
          const feature = result.result as Feature;

          // Add feature properties
          if (feature.properties) {
            Object.entries(feature.properties).forEach(([key, value]) => {
              doc.text(`${key}: ${value}`);
            });
          } else {
            doc.text('No properties');
          }
        }
      } else if (typeof result.result === 'number') {
        // It's a numeric result (like area or distance)
        doc.moveDown(2).fontSize(14).font('Helvetica-Bold').text('Analysis Result');

        doc
          .moveDown()
          .fontSize(20)
          .font('Helvetica')
          .text(formatWithUnit(result.result, result.metadata?.unit as MeasurementUnit), {
            align: 'center',
          });
      }

      // Add footer
      doc
        .moveDown(4)
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text("Generated by Benton County Assessor's Office GIS System", { align: 'center' });

      // Finalize the PDF
      doc.end();

      // When the stream is done, resolve with the file path
      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', err => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate a GeoJSON file from the analysis result
 */
async function generateGeoJSONReport(
  result: GeospatialAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${generateFilename(options, result)}.geojson`;
  const outputPath = options.outputPath || path.join(tempDir, fileName);

  try {
    let geojsonData: any;

    if (typeof result.result === 'number') {
      // If the result is a number, create a GeoJSON with the value in properties
      geojsonData = {
        type: 'FeatureCollection',
        features: [],
        analysisResult: {
          type: result.type,
          value: result.result,
          unit: result.metadata?.unit,
          metadata: result.metadata,
        },
      };
    } else if (result.result === null) {
      // Empty result
      geojsonData = {
        type: 'FeatureCollection',
        features: [],
        analysisResult: {
          type: result.type,
          metadata: result.metadata,
          error: result.error,
        },
      };
    } else if ('type' in result.result && result.result.type === 'FeatureCollection') {
      // It's already a FeatureCollection
      geojsonData = {
        ...result.result,
        analysisResult: {
          type: result.type,
          metadata: result.metadata,
        },
      };
    } else if ('type' in result.result && result.result.type === 'Feature') {
      // It's a single feature, wrap in a FeatureCollection
      geojsonData = {
        type: 'FeatureCollection',
        features: [result.result],
        analysisResult: {
          type: result.type,
          metadata: result.metadata,
        },
      };
    } else {
      throw new Error('Unsupported result type for GeoJSON export');
    }

    // Add metadata and timestamp
    geojsonData.timestamp = getFormattedTimestamp();
    geojsonData.title = options.title || operationTitles[result.type] || 'Geospatial Analysis';

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(geojsonData, null, 2));

    return outputPath;
  } catch (err) {
    throw new Error(
      `Failed to generate GeoJSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Generate a CSV report from the analysis result
 */
async function generateCSVReport(
  result: GeospatialAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${generateFilename(options, result)}.csv`;
  const outputPath = options.outputPath || path.join(tempDir, fileName);

  try {
    let csvRows: string[] = [];

    // Add title and timestamp as comments
    const title = options.title || operationTitles[result.type] || 'Geospatial Analysis';
    csvRows.push(`# ${title}`);

    if (options.includeTimestamp !== false) {
      csvRows.push(`# Generated: ${getFormattedTimestamp()}`);
    }

    csvRows.push(`# Operation: ${result.type}`);
    csvRows.push('');

    // Add metadata if available
    if (result.metadata) {
      csvRows.push('# Metadata');
      csvRows.push('Key,Value');

      for (const [key, value] of Object.entries(result.metadata)) {
        csvRows.push(`${key},${value}`);
      }

      csvRows.push('');
    }

    // Add feature properties if available
    if (result.result && typeof result.result === 'object' && result.result !== null) {
      if (
        'type' in result.result &&
        result.result.type === 'FeatureCollection' &&
        'features' in result.result
      ) {
        // Feature collection
        const featureCollection = result.result as FeatureCollection;

        if (featureCollection.features.length > 0) {
          csvRows.push('# Features');

          // Get all unique property keys across all features
          const allKeys = new Set<string>();
          featureCollection.features.forEach(feature => {
            if (feature.properties) {
              Object.keys(feature.properties).forEach(key => allKeys.add(key));
            }
          });

          // Add feature ID and coordinates columns
          const headerKeys = ['Feature ID', 'Type', ...Array.from(allKeys)];
          csvRows.push(headerKeys.join(','));

          // Add data for each feature
          featureCollection.features.forEach((feature /* , index */) => {
            const rowData: string[] = [`Feature_${index + 1}`, feature.geometry.type];

            // Add each property value or empty string if not present
            Array.from(allKeys).forEach(key => {
              const value = feature.properties?.[key] ?? '';
              // Escape commas and quotes in CSV
              const escapedValue = String(value).replace(/"/g, '""');
              rowData.push(`"${escapedValue}"`);
            });

            csvRows.push(rowData.join(','));
          });
        }
      } else if ('type' in result.result && result.result.type === 'Feature') {
        // Single feature
        const feature = result.result as Feature;

        csvRows.push('# Feature Properties');

        if (feature.properties) {
          csvRows.push('Key,Value');

          for (const [key, value] of Object.entries(feature.properties)) {
            // Escape commas and quotes in CSV
            const escapedValue = String(value).replace(/"/g, '""');
            csvRows.push(`${key},"${escapedValue}"`);
          }
        } else {
          csvRows.push('No properties available');
        }
      }
    } else if (typeof result.result === 'number') {
      // It's a numeric result
      csvRows.push('# Result');
      csvRows.push('Value,Unit');
      csvRows.push(`${result.result},${result.metadata?.unit || ''}`);
    }

    // Write to file
    fs.writeFileSync(outputPath, csvRows.join('\n'));

    return outputPath;
  } catch (err) {
    throw new Error(`Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Generate a report for a geospatial analysis result
 */
export async function generateReport(
  result: GeospatialAnalysisResult,
  options: ReportOptions
): Promise<string> {
  try {
    switch (options.format) {
      case ReportFormat.PDF:
        return await generatePDFReport(result, options);

      case ReportFormat.GEOJSON:
        return await generateGeoJSONReport(result, options);

      case ReportFormat.CSV:
        return await generateCSVReport(result, options);

      case ReportFormat.SHAPEFILE:
        // This would be implemented with a more complex shapefile generator library
        throw new Error('Shapefile format is not yet supported');

      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to generate report: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Get supported export formats with their descriptions
 */
export function getSupportedFormats(): Array<{
  id: ReportFormat;
  label: string;
  description: string;
}> {
  return [
    {
      id: ReportFormat.PDF,
      label: 'PDF Report',
      description: 'Comprehensive document with result details and metadata',
    },
    {
      id: ReportFormat.GEOJSON,
      label: 'GeoJSON',
      description: 'Standard geospatial data format for use in GIS software',
    },
    {
      id: ReportFormat.CSV,
      label: 'CSV',
      description: 'Tabular data for spreadsheet applications',
    },
    {
      id: ReportFormat.SHAPEFILE,
      label: 'Shapefile',
      description: 'ESRI Shapefile format (coming soon)',
    },
  ];
}
