/**
 * Data Transformation Service
 *
 * This service is responsible for transforming data during database conversion.
 * It handles data type conversions, formatting, and complex transformations
 * between different database systems.
 */

import { IStorage } from '../../storage';
import { LLMService } from '../llm-service';
import { DatabaseType, FieldType } from './types';

// Interface for transformation options
export interface TransformationOptions {
  targetType: DatabaseType;
  transformations?: DataTransformation[];
  customScripts?: Record<string, string>;
  useAI?: boolean;
  batchSize?: number;
}

// Interface for data transformation
export interface DataTransformation {
  field: string;
  targetField?: string;
  transformationType: TransformationType;
  parameters?: Record<string, any>;
}

// Enum for transformation types
export enum TransformationType {
  TypeConversion = 'type_conversion',
  Format = 'format',
  Combine = 'combine',
  Split = 'split',
  Lookup = 'lookup',
  Math = 'math',
  Conditional = 'conditional',
  Custom = 'custom',
  AIAssisted = 'ai_assisted',
}

export class DataTransformationService {
  private storage: IStorage;
  private llmService?: LLMService;

  // Mapping of data type conversions between different databases
  private dataTypeConversionMap: Record<
    DatabaseType,
    Record<DatabaseType, Record<string, string>>
  > = {
    [DatabaseType.PostgreSQL]: {
      [DatabaseType.MySQL]: {
        text: 'TEXT',
        varchar: 'VARCHAR',
        char: 'CHAR',
        integer: 'INT',
        smallint: 'SMALLINT',
        bigint: 'BIGINT',
        decimal: 'DECIMAL',
        numeric: 'DECIMAL',
        real: 'FLOAT',
        'double precision': 'DOUBLE',
        boolean: 'TINYINT(1)',
        date: 'DATE',
        time: 'TIME',
        timestamp: 'DATETIME',
        timestamptz: 'DATETIME',
        interval: 'VARCHAR(255)',
        json: 'JSON',
        jsonb: 'JSON',
        uuid: 'CHAR(36)',
        bytea: 'BLOB',
        array: 'JSON',
      },
      [DatabaseType.SQLite]: {
        text: 'TEXT',
        varchar: 'TEXT',
        char: 'TEXT',
        integer: 'INTEGER',
        smallint: 'INTEGER',
        bigint: 'INTEGER',
        decimal: 'REAL',
        numeric: 'REAL',
        real: 'REAL',
        'double precision': 'REAL',
        boolean: 'INTEGER',
        date: 'TEXT',
        time: 'TEXT',
        timestamp: 'TEXT',
        timestamptz: 'TEXT',
        interval: 'TEXT',
        json: 'TEXT',
        jsonb: 'TEXT',
        uuid: 'TEXT',
        bytea: 'BLOB',
        array: 'TEXT',
      },
      [DatabaseType.SQLServer]: {
        text: 'NVARCHAR(MAX)',
        varchar: 'VARCHAR',
        char: 'CHAR',
        integer: 'INT',
        smallint: 'SMALLINT',
        bigint: 'BIGINT',
        decimal: 'DECIMAL',
        numeric: 'DECIMAL',
        real: 'FLOAT',
        'double precision': 'FLOAT',
        boolean: 'BIT',
        date: 'DATE',
        time: 'TIME',
        timestamp: 'DATETIME2',
        timestamptz: 'DATETIMEOFFSET',
        interval: 'VARCHAR(255)',
        json: 'NVARCHAR(MAX)',
        jsonb: 'NVARCHAR(MAX)',
        uuid: 'UNIQUEIDENTIFIER',
        bytea: 'VARBINARY(MAX)',
        array: 'NVARCHAR(MAX)',
      },
      [DatabaseType.MongoDB]: {
        text: 'String',
        varchar: 'String',
        char: 'String',
        integer: 'Number',
        smallint: 'Number',
        bigint: 'Number',
        decimal: 'Number',
        numeric: 'Number',
        real: 'Number',
        'double precision': 'Number',
        boolean: 'Boolean',
        date: 'Date',
        time: 'Date',
        timestamp: 'Date',
        timestamptz: 'Date',
        interval: 'String',
        json: 'Object',
        jsonb: 'Object',
        uuid: 'String',
        bytea: 'Buffer',
        array: 'Array',
      },
    },
    [DatabaseType.MySQL]: {
      [DatabaseType.PostgreSQL]: {
        TEXT: 'text',
        VARCHAR: 'varchar',
        CHAR: 'char',
        INT: 'integer',
        SMALLINT: 'smallint',
        BIGINT: 'bigint',
        DECIMAL: 'numeric',
        FLOAT: 'real',
        DOUBLE: 'double precision',
        'TINYINT(1)': 'boolean',
        DATE: 'date',
        TIME: 'time',
        DATETIME: 'timestamp',
        JSON: 'jsonb',
        BLOB: 'bytea',
        ENUM: 'text',
      },
      // Add other databases...
      [DatabaseType.SQLite]: {
        /* mapping */
      },
      [DatabaseType.SQLServer]: {
        /* mapping */
      },
      [DatabaseType.MongoDB]: {
        /* mapping */
      },
    },
    // Add other source database types...
    [DatabaseType.SQLite]: {
      [DatabaseType.PostgreSQL]: {
        /* mapping */
      },
      [DatabaseType.MySQL]: {
        /* mapping */
      },
      [DatabaseType.SQLServer]: {
        /* mapping */
      },
      [DatabaseType.MongoDB]: {
        /* mapping */
      },
    },
    [DatabaseType.SQLServer]: {
      [DatabaseType.PostgreSQL]: {
        /* mapping */
      },
      [DatabaseType.MySQL]: {
        /* mapping */
      },
      [DatabaseType.SQLite]: {
        /* mapping */
      },
      [DatabaseType.MongoDB]: {
        /* mapping */
      },
    },
    [DatabaseType.Oracle]: {
      [DatabaseType.PostgreSQL]: {
        /* mapping */
      },
      [DatabaseType.MySQL]: {
        /* mapping */
      },
      [DatabaseType.SQLite]: {
        /* mapping */
      },
      [DatabaseType.SQLServer]: {
        /* mapping */
      },
      [DatabaseType.MongoDB]: {
        /* mapping */
      },
    },
    [DatabaseType.MongoDB]: {
      [DatabaseType.PostgreSQL]: {
        /* mapping */
      },
      [DatabaseType.MySQL]: {
        /* mapping */
      },
      [DatabaseType.SQLite]: {
        /* mapping */
      },
      [DatabaseType.SQLServer]: {
        /* mapping */
      },
    },
    // Other database types would be added here
    [DatabaseType.DynamoDB]: {},
    [DatabaseType.Cassandra]: {},
    [DatabaseType.Redis]: {},
    [DatabaseType.ElasticSearch]: {},
    [DatabaseType.Neo4j]: {},
    [DatabaseType.Firestore]: {},
    [DatabaseType.CosmosDB]: {},
    [DatabaseType.Unknown]: {},
  };

  constructor(storage: IStorage, llmService?: LLMService) {
    this.storage = storage;
    this.llmService = llmService;
  }

  /**
   * Transform data
   */
  public async transformData(
    data: any[],
    sourceType: DatabaseType,
    targetType: DatabaseType,
    options: TransformationOptions = { targetType }
  ): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }

    try {
      // Log the transformation start
      await this.logTransformation(
        options.customScripts?.projectId || 'unknown',
        'info',
        'transform_start',
        `Starting transformation of ${data.length} records from ${sourceType} to ${targetType}`
      );

      // Apply transformations to each record
      const transformedData = await Promise.all(
        data.map(async record => this.transformRecord(record, sourceType, targetType, options))
      );

      // Log the transformation completion
      await this.logTransformation(
        options.customScripts?.projectId || 'unknown',
        'info',
        'transform_complete',
        `Completed transformation of ${data.length} records`
      );

      return transformedData;
    } catch (error) {
      // Log the error
      await this.logTransformation(
        options.customScripts?.projectId || 'unknown',
        'error',
        'transform_error',
        `Error during transformation: ${error.message}`,
        { error: error.stack }
      );

      throw error;
    }
  }

  /**
   * Transform a single record
   */
  private async transformRecord(
    record: any,
    sourceType: DatabaseType,
    targetType: DatabaseType,
    options: TransformationOptions
  ): Promise<any> {
    // Create a new record for the transformation
    const transformedRecord: Record<string, any> = {};

    // Get fields to transform
    const fields = Object.keys(record);

    // Process each field
    for (const field of fields) {
      let targetField = field;
      let value = record[field];

      // Check if there's a specific transformation for this field
      const fieldTransformation = options.transformations?.find(t => t.field === field);

      if (fieldTransformation) {
        // Use the target field name if specified
        if (fieldTransformation.targetField) {
          targetField = fieldTransformation.targetField;
        }

        // Apply the transformation
        value = await this.applyTransformation(
          field,
          value,
          record,
          fieldTransformation,
          sourceType,
          targetType,
          options
        );
      } else {
        // Apply default type conversion
        value = this.convertDataType(field, value, sourceType, targetType);
      }

      // Add the transformed field to the new record
      transformedRecord[targetField] = value;
    }

    return transformedRecord;
  }

  /**
   * Apply a transformation to a field value
   */
  private async applyTransformation(
    field: string,
    value: any,
    record: any,
    transformation: DataTransformation,
    sourceType: DatabaseType,
    targetType: DatabaseType,
    options: TransformationOptions
  ): Promise<any> {
    switch (transformation.transformationType) {
      case TransformationType.TypeConversion:
        return this.convertExplicitType(
          value,
          transformation.parameters?.fromType,
          transformation.parameters?.toType
        );

      case TransformationType.Format:
        return this.formatValue(value, transformation.parameters?.format);

      case TransformationType.Combine:
        return this.combineFields(
          record,
          transformation.parameters?.fields,
          transformation.parameters?.separator
        );

      case TransformationType.Split:
        return this.splitField(
          value,
          transformation.parameters?.separator,
          transformation.parameters?.index
        );

      case TransformationType.Lookup:
        return this.lookupValue(
          value,
          transformation.parameters?.lookupTable,
          transformation.parameters?.lookupField,
          transformation.parameters?.resultField
        );

      case TransformationType.Math:
        return this.calculateValue(
          value,
          transformation.parameters?.operation,
          transformation.parameters?.operand
        );

      case TransformationType.Conditional:
        return this.conditionalTransform(
          value,
          transformation.parameters?.condition,
          transformation.parameters?.trueValue,
          transformation.parameters?.falseValue
        );

      case TransformationType.Custom:
        return this.customTransform(
          value,
          record,
          field,
          transformation.parameters?.scriptName,
          options.customScripts
        );

      case TransformationType.AIAssisted:
        return this.aiAssistedTransform(
          value,
          field,
          record,
          sourceType,
          targetType,
          transformation.parameters
        );

      default:
        // Default to basic type conversion
        return this.convertDataType(field, value, sourceType, targetType);
    }
  }

  /**
   * Convert data type based on source and target database
   */
  private convertDataType(
    field: string,
    value: any,
    sourceType: DatabaseType,
    targetType: DatabaseType
  ): any {
    // If value is null or undefined, return as is
    if (value === null || value === undefined) {
      return value;
    }

    // Infer source data type if not provided
    const sourceDataType = this.inferDataType(value);

    // Convert based on inferred type
    switch (sourceDataType) {
      case FieldType.String:
        return value.toString();

      case FieldType.Integer:
        return parseInt(value, 10);

      case FieldType.Float:
        return parseFloat(value);

      case FieldType.Boolean:
        if (typeof value === 'string') {
          return ['true', 't', 'yes', 'y', '1'].includes(value.toLowerCase());
        }
        if (typeof value === 'number') {
          return value !== 0;
        }
        return Boolean(value);

      case FieldType.Date:
      case FieldType.DateTime:
        // Handle date/time conversion
        if (targetType === DatabaseType.MongoDB) {
          return new Date(value);
        }
        if (typeof value === 'string') {
          return value;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;

      case FieldType.JSON:
      case FieldType.Object:
        // Convert objects based on target database
        if (targetType === DatabaseType.MongoDB) {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } else if (targetType === DatabaseType.PostgreSQL) {
          return typeof value === 'string' ? value : JSON.stringify(value);
        } else {
          return JSON.stringify(value);
        }

      case FieldType.Array:
        // Convert arrays based on target database
        if (targetType === DatabaseType.MongoDB) {
          return Array.isArray(value) ? value : JSON.parse(value);
        } else if (targetType === DatabaseType.PostgreSQL) {
          return Array.isArray(value) ? JSON.stringify(value) : value;
        } else {
          return JSON.stringify(value);
        }

      case FieldType.Binary:
        // Handle binary data
        if (targetType === DatabaseType.MongoDB) {
          return Buffer.from(value);
        }
        return value;

      default:
        // For unknown types, just return the value as is
        return value;
    }
  }

  /**
   * Infer the data type of a value
   */
  private inferDataType(value: any): FieldType {
    if (value === null || value === undefined) {
      return FieldType.Unknown;
    }

    if (typeof value === 'string') {
      // Check if it's a date string
      if (!isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return FieldType.DateTime;
      }

      // Check if it's a date only string
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return FieldType.Date;
      }

      // Check if it's a JSON string
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object') {
          return Array.isArray(parsed) ? FieldType.Array : FieldType.JSON;
        }
      } catch (e) {
        // Not a JSON string
      }

      return FieldType.String;
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? FieldType.Integer : FieldType.Float;
    }

    if (typeof value === 'boolean') {
      return FieldType.Boolean;
    }

    if (value instanceof Date) {
      return FieldType.DateTime;
    }

    if (Array.isArray(value)) {
      return FieldType.Array;
    }

    if (typeof value === 'object') {
      if (value instanceof Buffer || value instanceof Uint8Array) {
        return FieldType.Binary;
      }
      return FieldType.Object;
    }

    return FieldType.Unknown;
  }

  /**
   * Convert value to an explicit type
   */
  private convertExplicitType(value: any, fromType?: string, toType?: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    // If no toType is specified, return value as is
    if (!toType) {
      return value;
    }

    // Convert to the specified type
    switch (toType.toLowerCase()) {
      case 'string':
        return String(value);

      case 'integer':
      case 'int':
        return parseInt(value, 10);

      case 'float':
      case 'number':
      case 'decimal':
        return parseFloat(value);

      case 'boolean':
      case 'bool':
        if (typeof value === 'string') {
          return ['true', 't', 'yes', 'y', '1'].includes(value.toLowerCase());
        }
        if (typeof value === 'number') {
          return value !== 0;
        }
        return Boolean(value);

      case 'date':
        return new Date(value);

      case 'json':
      case 'object':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (error) {
            return value; // Return as string if parsing fails
          }
        } else {
          return value;
        }

      case 'array':
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (error) {
            return [value]; // Return as single-item array if parsing fails
          }
        } else if (Array.isArray(value)) {
          return value;
        } else {
          return [value];
        }

      default:
        return value;
    }
  }

  /**
   * Format a value according to a format string
   */
  private formatValue(value: any, format?: string): any {
    if (!format || value === null || value === undefined) {
      return value;
    }

    try {
      // Handle different types of formatting
      if (value instanceof Date || !isNaN(Date.parse(value))) {
        // Date formatting
        const date = value instanceof Date ? value : new Date(value);
        return this.formatDate(date, format);
      } else if (typeof value === 'number') {
        // Number formatting
        return this.formatNumber(value, format);
      } else if (typeof value === 'string') {
        // String formatting
        return this.formatString(value, format);
      }

      // Default case: return the value as is
      return value;
    } catch (error) {
      console.error(`Error formatting value '${value}' with format '${format}':`, error);
      return value;
    }
  }

  /**
   * Format a date value
   */
  private formatDate(date: Date, format: string): string {
    // Simple date formatting implementation
    // In a real implementation, you would use a library like date-fns or moment.js

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Simple format substitutions
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Format a number value
   */
  private formatNumber(num: number, format: string): string {
    // Simple number formatting implementation
    // In a real implementation, you would use a library like numeral.js

    if (format.includes('%')) {
      // Percentage formatting
      const percentage = num * 100;
      return `${percentage.toFixed(2)}%`;
    } else if (format.includes('$')) {
      // Currency formatting
      return `$${num.toFixed(2)}`;
    } else if (format.includes('.')) {
      // Decimal precision
      const precision = format.split('.')[1].length;
      return num.toFixed(precision);
    }

    // Default case: return as string
    return num.toString();
  }

  /**
   * Format a string value
   */
  private formatString(str: string, format: string): string {
    // Simple string formatting implementation

    if (format === 'uppercase') {
      return str.toUpperCase();
    } else if (format === 'lowercase') {
      return str.toLowerCase();
    } else if (format === 'capitalize') {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else if (format.startsWith('truncate:')) {
      const length = parseInt(format.split(':')[1], 10);
      return str.length > length ? str.substring(0, length) + '...' : str;
    }

    // Default case: return the string as is
    return str;
  }

  /**
   * Combine multiple fields
   */
  private combineFields(record: any, fields?: string[], separator: string = ' '): string {
    if (!fields || !Array.isArray(fields)) {
      return '';
    }

    // Get values from each field, filtering out nulls and undefineds
    const values = fields
      .map(field => record[field])
      .filter(value => value !== null && value !== undefined);

    // Join the values with the separator
    return values.join(separator);
  }

  /**
   * Split a field value
   */
  private splitField(value: any, separator: string = ',', index?: number): any {
    if (typeof value !== 'string') {
      return value;
    }

    const parts = value.split(separator);

    // If index is provided, return just that part
    if (index !== undefined && index >= 0 && index < parts.length) {
      return parts[index];
    }

    // Otherwise return the array of parts
    return parts;
  }

  /**
   * Look up a value in a lookup table
   */
  private async lookupValue(
    value: any,
    lookupTable?: string,
    lookupField?: string,
    resultField?: string
  ): Promise<any> {
    if (!lookupTable || !lookupField || !resultField || value === null || value === undefined) {
      return value;
    }

    try {
      // In a real implementation, this would query the database
      // For now, we'll use an in-memory lookup
      const lookupData = await this.storage.getLookupData(lookupTable);
      if (!lookupData) {
        return value;
      }

      // Find the matching record
      const matchingRecord = lookupData.find(record => record[lookupField] === value);

      // Return the looked-up value or the original value if not found
      return matchingRecord ? matchingRecord[resultField] : value;
    } catch (error) {
      console.error(`Error looking up value '${value}' in table '${lookupTable}':`, error);
      return value;
    }
  }

  /**
   * Calculate a value using a mathematical operation
   */
  private calculateValue(value: any, operation?: string, operand?: any): any {
    if (value === null || value === undefined || !operation) {
      return value;
    }

    // Parse value and operand as numbers
    const num = parseFloat(value);
    const op = parseFloat(operand);

    if (isNaN(num)) {
      return value;
    }

    // Perform the operation
    switch (operation) {
      case 'add':
        return num + (isNaN(op) ? 0 : op);

      case 'subtract':
        return num - (isNaN(op) ? 0 : op);

      case 'multiply':
        return num * (isNaN(op) ? 1 : op);

      case 'divide':
        if (isNaN(op) || op === 0) {
          return value; // Avoid division by zero
        }
        return num / op;

      case 'round':
        return Math.round(num);

      case 'floor':
        return Math.floor(num);

      case 'ceil':
        return Math.ceil(num);

      default:
        return value;
    }
  }

  /**
   * Transform a value conditionally
   */
  private conditionalTransform(
    value: any,
    condition?: string,
    trueValue?: any,
    falseValue?: any
  ): any {
    if (!condition) {
      return value;
    }

    try {
      // Evaluate the condition
      // For security reasons, this is a very simple implementation
      // In a real application, you would use a proper expression evaluator
      let result: boolean;

      if (condition === 'isNull') {
        result = value === null || value === undefined;
      } else if (condition === 'isNotNull') {
        result = value !== null && value !== undefined;
      } else if (condition === 'isEmpty') {
        result =
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && Object.keys(value).length === 0);
      } else if (condition === 'isNotEmpty') {
        result =
          value !== null &&
          value !== undefined &&
          value !== '' &&
          (!Array.isArray(value) || value.length > 0) &&
          (typeof value !== 'object' || Object.keys(value).length > 0);
      } else if (condition.includes('==')) {
        const [left, right] = condition.split('==').map(s => s.trim());
        result = value == right; // Non-strict comparison
      } else if (condition.includes('!=')) {
        const [left, right] = condition.split('!=').map(s => s.trim());
        result = value != right; // Non-strict comparison
      } else if (condition.includes('>')) {
        const [left, right] = condition.split('>').map(s => s.trim());
        result = parseFloat(value) > parseFloat(right);
      } else if (condition.includes('<')) {
        const [left, right] = condition.split('<').map(s => s.trim());
        result = parseFloat(value) < parseFloat(right);
      } else if (condition.includes('>=')) {
        const [left, right] = condition.split('>=').map(s => s.trim());
        result = parseFloat(value) >= parseFloat(right);
      } else if (condition.includes('<=')) {
        const [left, right] = condition.split('<=').map(s => s.trim());
        result = parseFloat(value) <= parseFloat(right);
      } else if (condition.includes('contains')) {
        const [left, right] = condition.split('contains').map(s => s.trim());
        const rightValue = right.replace(/"/g, '').replace(/'/g, '');
        result = typeof value === 'string' && value.includes(rightValue);
      } else if (condition.includes('startsWith')) {
        const [left, right] = condition.split('startsWith').map(s => s.trim());
        const rightValue = right.replace(/"/g, '').replace(/'/g, '');
        result = typeof value === 'string' && value.startsWith(rightValue);
      } else if (condition.includes('endsWith')) {
        const [left, right] = condition.split('endsWith').map(s => s.trim());
        const rightValue = right.replace(/"/g, '').replace(/'/g, '');
        result = typeof value === 'string' && value.endsWith(rightValue);
      } else {
        // Unknown condition, return the original value
        return value;
      }

      // Return the appropriate value based on the condition result
      return result
        ? trueValue !== undefined
          ? trueValue
          : value
        : falseValue !== undefined
          ? falseValue
          : value;
    } catch (error) {
      console.error(`Error evaluating condition '${condition}' for value '${value}':`, error);
      return value;
    }
  }

  /**
   * Apply a custom transformation script
   */
  private customTransform(
    value: any,
    record: any,
    field: string,
    scriptName?: string,
    customScripts?: Record<string, string>
  ): any {
    if (!scriptName || !customScripts || !customScripts[scriptName]) {
      return value;
    }

    try {
      // Get the script code
      const scriptCode = customScripts[scriptName];

      // Execute the script in a safe context
      // In a real implementation, you would use a sandboxed evaluation like vm2
      const transform = new Function('value', 'record', 'field', scriptCode);

      return transform(value, record, field);
    } catch (error) {
      console.error(`Error executing custom transformation script '${scriptName}':`, error);
      return value;
    }
  }

  /**
   * Apply an AI-assisted transformation
   */
  private async aiAssistedTransform(
    value: any,
    field: string,
    record: any,
    sourceType: DatabaseType,
    targetType: DatabaseType,
    parameters?: Record<string, any>
  ): Promise<any> {
    if (!this.llmService || value === null || value === undefined) {
      return value;
    }

    try {
      // Create a prompt for the AI service
      const prompt = `
Transform the following data field:
- Field name: ${field}
- Current value: ${JSON.stringify(value)}
- Source database type: ${sourceType}
- Target database type: ${targetType}
- Additional context: ${JSON.stringify(parameters || {})}
- Full record context: ${JSON.stringify(record)}

Please output only the transformed value in a format appropriate for ${targetType}.
`;

      // Call the LLM service
      const response = await this.llmService.generateContent(prompt, {
        temperature: 0.2,
        model: 'gpt-4o', // Use the latest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      });

      // Parse the response
      let transformedValue;
      try {
        // Attempt to parse the response as JSON
        transformedValue = JSON.parse(response);
      } catch (parseError) {
        // If parsing fails, use the string response
        transformedValue = response.trim();
      }

      return transformedValue;
    } catch (error) {
      console.error(`Error applying AI-assisted transformation to field '${field}':`, error);
      return value;
    }
  }

  /**
   * Log a transformation event
   */
  private async logTransformation(
    projectId: string,
    level: string,
    stage: string,
    message: string,
    details?: any
  ): Promise<void> {
    try {
      await this.storage.createDatabaseConversionLog({
        projectId,
        level,
        stage,
        message,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging transformation:', error);
      // Continue execution even if logging fails
    }
  }
}
