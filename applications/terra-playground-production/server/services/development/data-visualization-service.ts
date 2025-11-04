/**
 * Data Visualization Service
 *
 * This service manages data visualizations for the Data Visualization Workshop.
 * It provides functionality for creating, retrieving, updating, and deleting visualizations,
 * as well as executing queries and preparing data for visualization.
 */

import { IStorage } from '../../storage';
import { eq, and, like, ilike } from 'drizzle-orm';
import { DataVisualization, InsertDataVisualization, VisualizationType } from '@shared/schema';
import { db } from '../../db';
import { PlandexAIService } from '../plandex-ai-service';
import { getPlandexAIService } from '../plandex-ai-factory';

interface QueryResult {
  data: any[];
  columnNames: string[];
}

export class DataVisualizationService {
  private storage: IStorage;
  private plandexAI: PlandexAIService | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;

    // Try to initialize PlandexAI for visualization recommendations
    try {
      this.plandexAI = getPlandexAIService();
    } catch (error) {
      console.warn('PlandexAI service not available for visualization recommendations:', error);
    }
  }

  /**
   * Get all data visualizations with optional filtering
   */
  async getAllVisualizations(
    options: {
      createdBy?: number;
      visualizationType?: VisualizationType;
      isPublic?: boolean;
      searchQuery?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DataVisualization[]> {
    try {
      return await this.storage.getDataVisualizations(options);
    } catch (error) {
      console.error('Error getting data visualizations:', error);
      throw new Error('Failed to get data visualizations');
    }
  }

  /**
   * Get a specific data visualization by ID
   */
  async getVisualizationById(id: number): Promise<DataVisualization | undefined> {
    try {
      const visualization = await this.storage.getDataVisualizationById(id);
      if (visualization) {
        // Update view count
        await this.incrementViewCount(id);
      }
      return visualization;
    } catch (error) {
      console.error(`Error getting data visualization with ID ${id}:`, error);
      throw new Error(`Failed to get data visualization with ID ${id}`);
    }
  }

  /**
   * Create a new data visualization
   */
  async createVisualization(visualization: InsertDataVisualization): Promise<DataVisualization> {
    try {
      return await this.storage.createDataVisualization(visualization);
    } catch (error) {
      console.error('Error creating data visualization:', error);
      throw new Error('Failed to create data visualization');
    }
  }

  /**
   * Update an existing data visualization
   */
  async updateVisualization(
    id: number,
    visualization: Partial<InsertDataVisualization>
  ): Promise<DataVisualization | undefined> {
    try {
      return await this.storage.updateDataVisualization(id, visualization);
    } catch (error) {
      console.error(`Error updating data visualization with ID ${id}:`, error);
      throw new Error(`Failed to update data visualization with ID ${id}`);
    }
  }

  /**
   * Delete a data visualization
   */
  async deleteVisualization(id: number): Promise<boolean> {
    try {
      return await this.storage.deleteDataVisualization(id);
    } catch (error) {
      console.error(`Error deleting data visualization with ID ${id}:`, error);
      throw new Error(`Failed to delete data visualization with ID ${id}`);
    }
  }

  /**
   * Increment the view count of a visualization
   */
  private async incrementViewCount(id: number): Promise<void> {
    try {
      const visualization = await this.storage.getDataVisualizationById(id);
      if (visualization) {
        await this.storage.updateDataVisualization(id, {
          viewCount: (visualization.viewCount || 0) + 1,
          lastViewed: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error incrementing view count for visualization ${id}:`, error);
    }
  }

  /**
   * Execute a query and return the results for visualization
   */
  async executeQuery(query: string): Promise<QueryResult> {
    try {
      // Basic SQL injection prevention (very limited, real implementation would be more robust)
      if (
        query.toLowerCase().includes('drop') ||
        query.toLowerCase().includes('delete') ||
        query.toLowerCase().includes('update') ||
        query.toLowerCase().includes('insert')
      ) {
        throw new Error('Invalid query: Only SELECT statements are allowed');
      }

      // Execute the query
      const result = await db.execute(query);

      // Extract column names
      const columnNames = result[0] ? Object.keys(result[0]) : [];

      return {
        data: result,
        columnNames,
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw new Error(
        `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Recommend the best visualization type for a given dataset
   */
  async recommendVisualizationType(
    data: any[],
    columnNames: string[]
  ): Promise<{
    recommendedType: VisualizationType;
    reason: string;
  }> {
    if (!this.plandexAI) {
      // Simple builtin recommendation logic as fallback
      return this.basicVisualizationRecommendation(data, columnNames);
    }

    try {
      // Convert a sample of the data to a string for the AI
      const sampleData = data.slice(0, 5);
      const dataContext = `
        Data columns: ${columnNames.join(', ')}
        Sample data: ${JSON.stringify(sampleData, null, 2)}
      `;

      const analysis = await this.plandexAI.analyzeData({
        data: dataContext,
        analysisType: 'visualization_recommendation',
        prompt: 'What type of visualization would best represent this data and why?',
      });

      if (analysis && analysis.result) {
        const result = JSON.parse(analysis.result);
        return {
          recommendedType: result.visualizationType as VisualizationType,
          reason: result.reason,
        };
      }

      // Fallback to basic recommendation if AI response is invalid
      return this.basicVisualizationRecommendation(data, columnNames);
    } catch (error) {
      console.error('Error getting visualization recommendation from AI:', error);
      return this.basicVisualizationRecommendation(data, columnNames);
    }
  }

  /**
   * Basic algorithm to recommend visualization type based on data characteristics
   */
  private basicVisualizationRecommendation(
    data: any[],
    columnNames: string[]
  ): {
    recommendedType: VisualizationType;
    reason: string;
  } {
    // Check for geospatial data
    const hasGeospatialData = columnNames.some(
      col =>
        col.toLowerCase().includes('lat') ||
        col.toLowerCase().includes('lon') ||
        col.toLowerCase().includes('geom') ||
        col.toLowerCase().includes('location')
    );

    if (hasGeospatialData) {
      return {
        recommendedType: VisualizationType.MAP,
        reason: 'The data contains geospatial information, making a map visualization ideal.',
      };
    }

    // Check for time series data
    const hasTimeData = columnNames.some(
      col =>
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('time') ||
        col.toLowerCase().includes('year') ||
        col.toLowerCase().includes('month')
    );

    if (hasTimeData) {
      return {
        recommendedType: VisualizationType.LINE_CHART,
        reason:
          'The data contains time-based information, making a line chart ideal for showing trends over time.',
      };
    }

    // Check for categorical data
    const categoricalColumns = columnNames.filter(col => {
      // Sample the data to see if this column has mostly text values
      const sampleSize = Math.min(data.length, 10);
      let textCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        if (data[i] && typeof data[i][col] === 'string' && isNaN(Number(data[i][col]))) {
          textCount++;
        }
      }

      return textCount / sampleSize > 0.5; // If more than 50% are text, consider it categorical
    });

    if (categoricalColumns.length > 0) {
      if (data.length <= 10) {
        return {
          recommendedType: VisualizationType.PIE_CHART,
          reason:
            'The data contains a small number of categorical values, making a pie chart appropriate.',
        };
      } else {
        return {
          recommendedType: VisualizationType.BAR_CHART,
          reason:
            'The data contains categorical information, making a bar chart ideal for comparison.',
        };
      }
    }

    // Check for correlation between numerical columns
    const numericalColumns = columnNames.filter(col => {
      // Sample the data to see if this column has mostly numerical values
      const sampleSize = Math.min(data.length, 10);
      let numCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        if ((data[i] && typeof data[i][col] === 'number') || !isNaN(Number(data[i][col]))) {
          numCount++;
        }
      }

      return numCount / sampleSize > 0.5; // If more than 50% are numbers, consider it numerical
    });

    if (numericalColumns.length >= 2) {
      return {
        recommendedType: VisualizationType.SCATTER_PLOT,
        reason:
          'The data contains multiple numerical columns, making a scatter plot useful for identifying correlations.',
      };
    }

    // Default recommendation
    return {
      recommendedType: VisualizationType.TABLE,
      reason: 'Based on the data structure, a table view provides the clearest representation.',
    };
  }

  /**
   * Generate visualization configuration based on data and visualization type
   */
  async generateVisualizationConfig(
    data: any[],
    columnNames: string[],
    visualizationType: VisualizationType
  ): Promise<any> {
    // Create a basic configuration based on the visualization type
    const config: any = {
      type: visualizationType,
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };

    // Configure based on visualization type
    switch (visualizationType) {
      case VisualizationType.BAR_CHART:
        return this.configureBarChart(data, columnNames, config);

      case VisualizationType.LINE_CHART:
        return this.configureLineChart(data, columnNames, config);

      case VisualizationType.PIE_CHART:
        return this.configurePieChart(data, columnNames, config);

      case VisualizationType.SCATTER_PLOT:
        return this.configureScatterPlot(data, columnNames, config);

      case VisualizationType.HEATMAP:
        return this.configureHeatmap(data, columnNames, config);

      case VisualizationType.MAP:
        return this.configureMap(data, columnNames, config);

      case VisualizationType.TABLE:
        return this.configureTable(data, columnNames, config);

      default:
        return config;
    }
  }

  private configureBarChart(data: any[], columnNames: string[], config: any): any {
    // Find likely category and value columns
    const categoryCol = this.findCategoryColumn(columnNames, data);
    const valueCol = this.findValueColumn(columnNames, data, categoryCol);

    if (categoryCol && valueCol) {
      config.data.labels = data.map(row => row[categoryCol]);
      config.data.datasets = [
        {
          label: valueCol,
          data: data.map(row => row[valueCol]),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ];
    }

    return config;
  }

  private configureLineChart(data: any[], columnNames: string[], config: any): any {
    // Find likely time/date and value columns
    const timeCol = this.findTimeColumn(columnNames);
    const valueCol = this.findValueColumn(columnNames, data, timeCol);

    if (timeCol && valueCol) {
      // Sort data by time if possible
      try {
        data.sort((a, b) => new Date(a[timeCol]).getTime() - new Date(b[timeCol]).getTime());
      } catch (e) {
        // If dates can't be parsed, use the original order
      }

      config.data.labels = data.map(row => row[timeCol]);
      config.data.datasets = [
        {
          label: valueCol,
          data: data.map(row => row[valueCol]),
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1,
          fill: false,
        },
      ];
    }

    return config;
  }

  private configurePieChart(data: any[], columnNames: string[], config: any): any {
    // Find likely category and value columns
    const categoryCol = this.findCategoryColumn(columnNames, data);
    const valueCol = this.findValueColumn(columnNames, data, categoryCol);

    if (categoryCol && valueCol) {
      // Generate some nice colors
      const colors = this.generateColors(data.length);

      config.data.labels = data.map(row => row[categoryCol]);
      config.data.datasets = [
        {
          data: data.map(row => row[valueCol]),
          backgroundColor: colors,
        },
      ];
    }

    return config;
  }

  private configureScatterPlot(data: any[], columnNames: string[], config: any): any {
    // Find two numerical columns
    const numericalColumns = this.findNumericalColumns(columnNames, data);

    if (numericalColumns.length >= 2) {
      config.data.datasets = [
        {
          label: `${numericalColumns[0]} vs ${numericalColumns[1]}`,
          data: data.map(row => ({
            x: row[numericalColumns[0]],
            y: row[numericalColumns[1]],
          })),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ];
    }

    return config;
  }

  private configureHeatmap(data: any[], columnNames: string[], config: any): any {
    // This is a simplified version; a real heatmap would need more configuration
    // Find columns for x-axis, y-axis, and value
    const categoryColumns = this.findCategoryColumns(columnNames, data, 2);
    const valueCol = this.findValueColumn(
      columnNames,
      data,
      categoryColumns[0],
      categoryColumns[1]
    );

    if (categoryColumns.length >= 2 && valueCol) {
      // Get unique values for each category to form x and y axes
      const xValues = [...new Set(data.map(row => row[categoryColumns[0]]))];
      const yValues = [...new Set(data.map(row => row[categoryColumns[1]]))];

      // Create a data matrix
      const matrix: number[][] = [];
      for (let i = 0; i < yValues.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < xValues.length; j++) {
          // Find the corresponding data point
          const point = data.find(
            row => row[categoryColumns[0]] === xValues[j] && row[categoryColumns[1]] === yValues[i]
          );
          matrix[i][j] = point ? point[valueCol] : 0;
        }
      }

      config.data = {
        labels: xValues,
        yLabels: yValues,
        datasets: [
          {
            data: matrix,
            label: valueCol,
          },
        ],
      };
    }

    return config;
  }

  private configureMap(data: any[], columnNames: string[], config: any): any {
    // Look for latitude and longitude columns
    const latCol = columnNames.find(
      col => col.toLowerCase().includes('lat') || col.toLowerCase().includes('latitude')
    );

    const lonCol = columnNames.find(
      col =>
        col.toLowerCase().includes('lon') ||
        col.toLowerCase().includes('lng') ||
        col.toLowerCase().includes('longitude')
    );

    if (latCol && lonCol) {
      config.type = 'map';
      config.data = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.map(row => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [row[lonCol], row[latCol]],
            },
            properties: row,
          })),
        },
      };
    }

    return config;
  }

  private configureTable(data: any[], columnNames: string[], config: any): any {
    config.type = 'table';
    config.data = {
      columns: columnNames.map(col => ({ header: col, accessor: col })),
      data: data,
    };

    return config;
  }

  // Helper methods for configuration

  private findCategoryColumn(columnNames: string[], data: any[]): string | undefined {
    // Look for common category column names
    for (const col of columnNames) {
      if (
        col.toLowerCase().includes('category') ||
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('region') ||
        col.toLowerCase().includes('area')
      ) {
        return col;
      }
    }

    // Otherwise find the column with the most text values
    let bestCol = undefined;
    let maxTextRatio = 0;

    for (const col of columnNames) {
      let textCount = 0;

      for (const row of data) {
        if (typeof row[col] === 'string' && isNaN(Number(row[col]))) {
          textCount++;
        }
      }

      const textRatio = textCount / data.length;
      if (textRatio > maxTextRatio) {
        maxTextRatio = textRatio;
        bestCol = col;
      }
    }

    return bestCol;
  }

  private findValueColumn(
    columnNames: string[],
    data: any[],
    excludeCol1?: string,
    excludeCol2?: string
  ): string | undefined {
    // Look for common value column names
    for (const col of columnNames) {
      if (
        col !== excludeCol1 &&
        col !== excludeCol2 &&
        (col.toLowerCase().includes('value') ||
          col.toLowerCase().includes('amount') ||
          col.toLowerCase().includes('count') ||
          col.toLowerCase().includes('total') ||
          col.toLowerCase().includes('sum'))
      ) {
        return col;
      }
    }

    // Otherwise find the first mostly-numeric column
    for (const col of columnNames) {
      if (col !== excludeCol1 && col !== excludeCol2) {
        let numCount = 0;

        for (const row of data) {
          if (typeof row[col] === 'number' || !isNaN(Number(row[col]))) {
            numCount++;
          }
        }

        if (numCount / data.length > 0.8) {
          return col;
        }
      }
    }

    // If no good value column, return the first column that's not the category
    return columnNames.find(col => col !== excludeCol1 && col !== excludeCol2);
  }

  private findTimeColumn(columnNames: string[]): string | undefined {
    // Look for common time column names
    for (const col of columnNames) {
      if (
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('time') ||
        col.toLowerCase().includes('year') ||
        col.toLowerCase().includes('month')
      ) {
        return col;
      }
    }
    return undefined;
  }

  private findNumericalColumns(columnNames: string[], data: any[]): string[] {
    const numericalCols: string[] = [];

    for (const col of columnNames) {
      let numCount = 0;

      for (const row of data) {
        if (typeof row[col] === 'number' || !isNaN(Number(row[col]))) {
          numCount++;
        }
      }

      if (numCount / data.length > 0.8) {
        numericalCols.push(col);
      }
    }

    return numericalCols;
  }

  private findCategoryColumns(columnNames: string[], data: any[], count: number): string[] {
    const categoryColumns: string[] = [];

    // First, look for named categories
    for (const col of columnNames) {
      if (
        col.toLowerCase().includes('category') ||
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('group') ||
        col.toLowerCase().includes('class')
      ) {
        categoryColumns.push(col);
        if (categoryColumns.length >= count) {
          return categoryColumns;
        }
      }
    }

    // Then look for columns with mostly text values
    const colTextRatios: { col: string; ratio: number }[] = [];

    for (const col of columnNames) {
      if (!categoryColumns.includes(col)) {
        let textCount = 0;

        for (const row of data) {
          if (typeof row[col] === 'string' && isNaN(Number(row[col]))) {
            textCount++;
          }
        }

        colTextRatios.push({
          col,
          ratio: textCount / data.length,
        });
      }
    }

    // Sort by text ratio descending
    colTextRatios.sort((a, b) => b.ratio - a.ratio);

    // Add top columns to the result
    for (const item of colTextRatios) {
      if (item.ratio > 0.5) {
        // Only if mostly text
        categoryColumns.push(item.col);
        if (categoryColumns.length >= count) {
          break;
        }
      }
    }

    return categoryColumns;
  }

  private generateColors(count: number): string[] {
    const colors: string[] = [];
    const baseColors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(40, 159, 64, 0.8)',
      'rgba(210, 199, 199, 0.8)',
    ];

    // If we need more colors than we have in the base set, generate them
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Add all base colors
    colors.push(...baseColors);

    // Generate additional colors
    for (let i = baseColors.length; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
    }

    return colors;
  }
}
