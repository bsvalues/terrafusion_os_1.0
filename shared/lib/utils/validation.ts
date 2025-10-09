/**
 * TerraFusion OS - Validation Utilities
 * 
 * Comprehensive validation functions for data integrity, type checking,
 * form validation, and business rule enforcement in property assessment systems.
 * 
 * @module validation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * A single validation rule
 */
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * Schema property definition for complex object validation
 */
export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'null';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  enum?: any[];
  custom?: (value: any) => boolean;
  errorMessage?: string;
}

/**
 * Schema definition for object validation
 */
export interface Schema {
  type: 'object' | 'array';
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

// ============================================================================
// Validator Class - Composable Validation Rules
// ============================================================================

/**
 * Validator class for building composable validation rules
 * 
 * @example
 * ```typescript
 * const validator = new Validator<string>()
 *   .addRule(StringValidators.required('Email is required'))
 *   .addRule(StringValidators.email('Invalid email format'))
 *   .custom((email) => !email.includes('spam'), 'Spam domains not allowed');
 * 
 * const result = validator.validate('user@example.com');
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];

  /**
   * Add a validation rule to the chain
   */
  public addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Add a custom validation function
   */
  public custom(validate: (value: T) => boolean, message: string): this {
    this.rules.push({ validate, message });
    return this;
  }

  /**
   * Validate a value against all rules
   * Returns a ValidationResult with all errors found
   */
  public validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate multiple values at once
   */
  public validateAll(values: T[]): ValidationResult[] {
    return values.map((value) => this.validate(value));
  }
}

// ============================================================================
// String Validators
// ============================================================================

export const StringValidators = {
  /**
   * Check if string is not empty
   */
  required: (message = 'Value is required'): ValidationRule<string> => ({
    validate: (value: string) => 
      value !== null && value !== undefined && value.trim().length > 0,
    message,
  }),

  /**
   * Check minimum string length
   */
  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length >= min,
    message: message || `Minimum length is ${min} characters`,
  }),

  /**
   * Check maximum string length
   */
  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length <= max,
    message: message || `Maximum length is ${max} characters`,
  }),

  /**
   * Check exact string length
   */
  exactLength: (length: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length === length,
    message: message || `Must be exactly ${length} characters`,
  }),

  /**
   * Check pattern match using regex
   */
  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  /**
   * Check if value is in enum
   */
  enum: (values: string[], message?: string): ValidationRule<string> => ({
    validate: (value: string) => values.includes(value),
    message: message || `Value must be one of: ${values.join(', ')}`,
  }),

  /**
   * Validate email format
   */
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  /**
   * Validate URL format
   */
  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  /**
   * Validate US phone number format
   */
  phone: (message = 'Invalid phone number'): ValidationRule<string> => ({
    validate: (value: string) => 
      /^(\+1)?[\s.-]?\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/.test(value),
    message,
  }),

  /**
   * Validate alphanumeric (letters and numbers only)
   */
  alphanumeric: (message = 'Must contain only letters and numbers'): ValidationRule<string> => ({
    validate: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message,
  }),

  /**
   * Validate alphanumeric with hyphens and underscores
   */
  slug: (message = 'Must contain only letters, numbers, hyphens, and underscores'): ValidationRule<string> => ({
    validate: (value: string) => /^[a-zA-Z0-9_-]+$/.test(value),
    message,
  }),

  /**
   * Validate no whitespace
   */
  noWhitespace: (message = 'Must not contain whitespace'): ValidationRule<string> => ({
    validate: (value: string) => !/\s/.test(value),
    message,
  }),

  /**
   * Validate starts with specific string
   */
  startsWith: (prefix: string, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.startsWith(prefix),
    message: message || `Must start with '${prefix}'`,
  }),

  /**
   * Validate ends with specific string
   */
  endsWith: (suffix: string, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.endsWith(suffix),
    message: message || `Must end with '${suffix}'`,
  }),
};

// ============================================================================
// Number Validators
// ============================================================================

export const NumberValidators = {
  /**
   * Check if number is required (not null/undefined/NaN)
   */
  required: (message = 'Value is required'): ValidationRule<number> => ({
    validate: (value: number) => 
      value !== null && value !== undefined && !isNaN(value),
    message,
  }),

  /**
   * Check if number is positive
   */
  positive: (message = 'Value must be positive'): ValidationRule<number> => ({
    validate: (value: number) => value > 0,
    message,
  }),

  /**
   * Check if number is non-negative (>= 0)
   */
  nonNegative: (message = 'Value must be non-negative'): ValidationRule<number> => ({
    validate: (value: number) => value >= 0,
    message,
  }),

  /**
   * Check if number is negative
   */
  negative: (message = 'Value must be negative'): ValidationRule<number> => ({
    validate: (value: number) => value < 0,
    message,
  }),

  /**
   * Check minimum value
   */
  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `Value must be at least ${min}`,
  }),

  /**
   * Check maximum value
   */
  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message: message || `Value must be at most ${max}`,
  }),

  /**
   * Check if number is within range (inclusive)
   */
  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min && value <= max,
    message: message || `Value must be between ${min} and ${max}`,
  }),

  /**
   * Check if number is an integer
   */
  integer: (message = 'Value must be an integer'): ValidationRule<number> => ({
    validate: (value: number) => Number.isInteger(value),
    message,
  }),

  /**
   * Check if number is a multiple of another number
   */
  multipleOf: (divisor: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value % divisor === 0,
    message: message || `Value must be a multiple of ${divisor}`,
  }),

  /**
   * Check if number has maximum decimal places
   */
  maxDecimals: (decimals: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => {
      const parts = value.toString().split('.');
      return parts.length === 1 || parts[1].length <= decimals;
    },
    message: message || `Value must have at most ${decimals} decimal places`,
  }),
};

// ============================================================================
// Date Validators
// ============================================================================

export const DateValidators = {
  /**
   * Check if date is required
   */
  required: (message = 'Date is required'): ValidationRule<Date> => ({
    validate: (value: Date) => value !== null && value !== undefined && !isNaN(value.getTime()),
    message,
  }),

  /**
   * Check if date is in the past
   */
  past: (message = 'Date must be in the past'): ValidationRule<Date> => ({
    validate: (value: Date) => value < new Date(),
    message,
  }),

  /**
   * Check if date is in the future
   */
  future: (message = 'Date must be in the future'): ValidationRule<Date> => ({
    validate: (value: Date) => value > new Date(),
    message,
  }),

  /**
   * Check if date is after another date
   */
  after: (compareDate: Date, message?: string): ValidationRule<Date> => ({
    validate: (value: Date) => value > compareDate,
    message: message || `Date must be after ${compareDate.toLocaleDateString()}`,
  }),

  /**
   * Check if date is before another date
   */
  before: (compareDate: Date, message?: string): ValidationRule<Date> => ({
    validate: (value: Date) => value < compareDate,
    message: message || `Date must be before ${compareDate.toLocaleDateString()}`,
  }),

  /**
   * Check if date is within a range
   */
  between: (startDate: Date, endDate: Date, message?: string): ValidationRule<Date> => ({
    validate: (value: Date) => value >= startDate && value <= endDate,
    message: message || `Date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`,
  }),

  /**
   * Check if date is within the last N days
   */
  withinLastDays: (days: number, message?: string): ValidationRule<Date> => ({
    validate: (value: Date) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return value >= cutoff;
    },
    message: message || `Date must be within the last ${days} days`,
  }),

  /**
   * Check if date is a valid year
   */
  validYear: (minYear: number, maxYear: number, message?: string): ValidationRule<Date> => ({
    validate: (value: Date) => {
      const year = value.getFullYear();
      return year >= minYear && year <= maxYear;
    },
    message: message || `Year must be between ${minYear} and ${maxYear}`,
  }),
};

// ============================================================================
// Array Validators
// ============================================================================

export const ArrayValidators = {
  /**
   * Check if array is not empty
   */
  required: (message = 'At least one item is required'): ValidationRule<any[]> => ({
    validate: (value: any[]) => Array.isArray(value) && value.length > 0,
    message,
  }),

  /**
   * Check minimum array length
   */
  minLength: (min: number, message?: string): ValidationRule<any[]> => ({
    validate: (value: any[]) => value.length >= min,
    message: message || `Must have at least ${min} items`,
  }),

  /**
   * Check maximum array length
   */
  maxLength: (max: number, message?: string): ValidationRule<any[]> => ({
    validate: (value: any[]) => value.length <= max,
    message: message || `Must have at most ${max} items`,
  }),

  /**
   * Check exact array length
   */
  exactLength: (length: number, message?: string): ValidationRule<any[]> => ({
    validate: (value: any[]) => value.length === length,
    message: message || `Must have exactly ${length} items`,
  }),

  /**
   * Check if all items are unique
   */
  unique: (message = 'All items must be unique'): ValidationRule<any[]> => ({
    validate: (value: any[]) => new Set(value).size === value.length,
    message,
  }),

  /**
   * Check if all items pass a validation function
   */
  every: (validateItem: (item: any) => boolean, message = 'Some items are invalid'): ValidationRule<any[]> => ({
    validate: (value: any[]) => value.every(validateItem),
    message,
  }),

  /**
   * Check if at least one item passes a validation function
   */
  some: (validateItem: (item: any) => boolean, message = 'No valid items found'): ValidationRule<any[]> => ({
    validate: (value: any[]) => value.some(validateItem),
    message,
  }),
};

// ============================================================================
// Property Assessment Domain Validators
// ============================================================================

export const PropertyValidators = {
  /**
   * Validate parcel ID format (6-20 alphanumeric with hyphens)
   */
  parcelId: (message = 'Invalid parcel ID format'): ValidationRule<string> => ({
    validate: (value: string) => 
      /^[A-Za-z0-9\-]{6,20}$/.test(value),
    message,
  }),

  /**
   * Validate AIN (Assessor Identification Number) - typically 10 digits
   */
  ain: (message = 'Invalid AIN format (must be 10 digits)'): ValidationRule<string> => ({
    validate: (value: string) => /^\d{10}$/.test(value),
    message,
  }),

  /**
   * Validate property address (basic format check)
   */
  address: (message = 'Invalid address format'): ValidationRule<string> => ({
    validate: (value: string) => {
      const trimmed = value.trim();
      return trimmed.length >= 5 && /\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
    },
    message,
  }),

  /**
   * Validate ZIP code (US format: 5 digits or 5+4 digits)
   */
  zipCode: (message = 'Invalid ZIP code'): ValidationRule<string> => ({
    validate: (value: string) => /^\d{5}(-\d{4})?$/.test(value),
    message,
  }),

  /**
   * Validate assessed value (positive number, reasonable range)
   */
  assessedValue: (message = 'Invalid assessed value'): ValidationRule<number> => ({
    validate: (value: number) => 
      value > 0 && value < 1000000000, // $1B max
    message,
  }),

  /**
   * Validate tax amount (non-negative, reasonable range)
   */
  taxAmount: (message = 'Invalid tax amount'): ValidationRule<number> => ({
    validate: (value: number) => 
      value >= 0 && value < 10000000, // $10M max
    message,
  }),

  /**
   * Validate tax rate (percentage, 0-100)
   */
  taxRate: (message = 'Invalid tax rate (must be between 0 and 100)'): ValidationRule<number> => ({
    validate: (value: number) => value >= 0 && value <= 100,
    message,
  }),

  /**
   * Validate levy code (alphanumeric, 2-10 characters)
   */
  levyCode: (message = 'Invalid levy code format'): ValidationRule<string> => ({
    validate: (value: string) => /^[A-Za-z0-9]{2,10}$/.test(value),
    message,
  }),

  /**
   * Validate fiscal year (4-digit year, reasonable range)
   */
  fiscalYear: (message = 'Invalid fiscal year'): ValidationRule<number> => ({
    validate: (value: number) => {
      const currentYear = new Date().getFullYear();
      return value >= 1900 && value <= currentYear + 10;
    },
    message,
  }),

  /**
   * Validate property type enum
   */
  propertyType: (message = 'Invalid property type'): ValidationRule<string> => ({
    validate: (value: string) => 
      ['residential', 'commercial', 'industrial', 'agricultural', 'vacant', 'mixed'].includes(value.toLowerCase()),
    message,
  }),

  /**
   * Validate square footage (positive number, reasonable range)
   */
  squareFeet: (message = 'Invalid square footage'): ValidationRule<number> => ({
    validate: (value: number) => 
      value > 0 && value < 10000000, // 10M sq ft max
    message,
  }),

  /**
   * Validate lot size (positive number in acres, reasonable range)
   */
  lotSize: (message = 'Invalid lot size'): ValidationRule<number> => ({
    validate: (value: number) => 
      value > 0 && value < 100000, // 100K acres max
    message,
  }),

  /**
   * Validate year built (4-digit year, reasonable range)
   */
  yearBuilt: (message = 'Invalid year built'): ValidationRule<number> => ({
    validate: (value: number) => {
      const currentYear = new Date().getFullYear();
      return value >= 1700 && value <= currentYear;
    },
    message,
  }),

  /**
   * Validate number of bedrooms (positive integer, reasonable range)
   */
  bedrooms: (message = 'Invalid number of bedrooms'): ValidationRule<number> => ({
    validate: (value: number) => 
      Number.isInteger(value) && value >= 0 && value <= 50,
    message,
  }),

  /**
   * Validate number of bathrooms (positive number, reasonable range)
   */
  bathrooms: (message = 'Invalid number of bathrooms'): ValidationRule<number> => ({
    validate: (value: number) => 
      value >= 0 && value <= 50 && (value % 0.5 === 0), // Allow half baths
    message,
  }),

  /**
   * Validate legal description (minimum length, contains required elements)
   */
  legalDescription: (message = 'Invalid legal description'): ValidationRule<string> => ({
    validate: (value: string) => {
      const trimmed = value.trim();
      return trimmed.length >= 10 && /[a-zA-Z]/.test(trimmed) && /[0-9]/.test(trimmed);
    },
    message,
  }),

  /**
   * Validate owner name (basic format check)
   */
  ownerName: (message = 'Invalid owner name'): ValidationRule<string> => ({
    validate: (value: string) => {
      const trimmed = value.trim();
      return trimmed.length >= 2 && /[a-zA-Z]/.test(trimmed);
    },
    message,
  }),
};

// ============================================================================
// Schema Validator for Complex Objects
// ============================================================================

/**
 * Schema validator for validating complex objects against a schema
 * 
 * @example
 * ```typescript
 * const schema: Schema = {
 *   type: 'object',
 *   properties: {
 *     parcelId: { type: 'string', required: true, minLength: 6, maxLength: 20 },
 *     assessedValue: { type: 'number', required: true, min: 0 },
 *     propertyType: { type: 'string', enum: ['residential', 'commercial'] }
 *   },
 *   required: ['parcelId', 'assessedValue']
 * };
 * 
 * const validator = new SchemaValidator();
 * const result = validator.validate(propertyData, schema);
 * ```
 */
export class SchemaValidator {
  /**
   * Validate an object against a schema
   */
  public validate(value: any, schema: Schema): ValidationResult {
    const errors: string[] = [];

    if (schema.type === 'object') {
      // Check required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (value[requiredProp] === undefined || value[requiredProp] === null) {
            errors.push(`Required property '${requiredProp}' is missing`);
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (value[propName] !== undefined && value[propName] !== null) {
            const propErrors = this.validateProperty(value[propName], propSchema, propName);
            errors.push(...propErrors);
          }
        }
      }

      // Check for additional properties
      if (schema.additionalProperties === false && schema.properties) {
        const allowedProps = Object.keys(schema.properties);
        for (const key of Object.keys(value)) {
          if (!allowedProps.includes(key)) {
            errors.push(`Additional property '${key}' is not allowed`);
          }
        }
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push('Value must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single property against its schema
   */
  private validateProperty(value: any, schema: SchemaProperty, propName: string): string[] {
    const errors: string[] = [];

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (schema.type === 'date') {
      if (!(value instanceof Date) && isNaN(Date.parse(value))) {
        errors.push(`Property '${propName}': must be a valid date`);
      }
    } else if (actualType !== schema.type && value !== null) {
      errors.push(`Property '${propName}': expected ${schema.type}, got ${actualType}`);
    }

    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Property '${propName}': minimum length is ${schema.minLength}`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Property '${propName}': maximum length is ${schema.maxLength}`);
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        errors.push(`Property '${propName}': does not match required pattern`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Property '${propName}': must be one of ${schema.enum.join(', ')}`);
      }
    }

    // Number validations
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`Property '${propName}': minimum value is ${schema.min}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`Property '${propName}': maximum value is ${schema.max}`);
      }
    }

    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Property '${propName}': minimum length is ${schema.minLength}`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Property '${propName}': maximum length is ${schema.maxLength}`);
      }
      if (schema.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateProperty(item, schema.items!, `${propName}[${index}]`);
          errors.push(...itemErrors);
        });
      }
    }

    // Object validations
    if (schema.type === 'object' && typeof value === 'object' && schema.properties) {
      for (const [nestedPropName, nestedPropSchema] of Object.entries(schema.properties)) {
        if (value[nestedPropName] !== undefined && value[nestedPropName] !== null) {
          const nestedErrors = this.validateProperty(
            value[nestedPropName],
            nestedPropSchema,
            `${propName}.${nestedPropName}`
          );
          errors.push(...nestedErrors);
        }
      }
    }

    // Custom validation
    if (schema.custom && !schema.custom(value)) {
      errors.push(schema.errorMessage || `Property '${propName}': custom validation failed`);
    }

    return errors;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Check if a value is a valid US phone number
 */
export function isValidPhone(value: string): boolean {
  return /^(\+1)?[\s.-]?\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/.test(value);
}

/**
 * Check if a value is a valid URL
 */
export function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid GUID/UUID
 */
export function isValidGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Check if a date string is valid
 */
export function isValidDate(value: string | Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Sanitize string by removing HTML tags
 */
export function sanitizeString(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/**
 * Normalize whitespace in string (collapse multiple spaces to one)
 */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Create a new validator instance
 */
export function createValidator<T = any>(): Validator<T> {
  return new Validator<T>();
}

/**
 * Create a new schema validator instance
 */
export function createSchemaValidator(): SchemaValidator {
  return new SchemaValidator();
}

/**
 * Quick validation helper - validate a single value with a rule
 */
export function validate<T>(value: T, rule: ValidationRule<T>): boolean {
  return rule.validate(value);
}

/**
 * Quick validation helper - validate multiple values with a rule
 */
export function validateAll<T>(values: T[], rule: ValidationRule<T>): boolean {
  return values.every((value) => rule.validate(value));
}
