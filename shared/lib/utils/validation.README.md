# Validation Utilities

Comprehensive validation functions for data integrity, type checking, form validation, and business rule enforcement in property assessment systems.

## Features

- ✅ **Composable Validators** - Chain multiple validation rules
- ✅ **Type-Specific Validators** - String, number, date, array validation
- ✅ **Property Assessment Validators** - Parcel IDs, AIN, addresses, tax amounts, fiscal years
- ✅ **Schema Validation** - Validate complex objects against schemas
- ✅ **Custom Validators** - Easy to create custom validation logic
- ✅ **TypeScript** - Full type safety with generics
- ✅ **Zero Dependencies** - Pure JavaScript/TypeScript
- ✅ **Form Integration** - Works seamlessly with Day 6 Form Management

## Installation

```typescript
import {
  Validator,
  StringValidators,
  NumberValidators,
  DateValidators,
  ArrayValidators,
  PropertyValidators,
  SchemaValidator,
  isValidEmail,
  isValidPhone,
} from './utils/validation';
```

## Real-World Examples

### 1. Property Assessment Form Validation

Validate property assessment input data:

```typescript
import { Validator, StringValidators, NumberValidators, PropertyValidators } from './utils/validation';

interface PropertyAssessmentData {
  parcelId: string;
  address: string;
  ownerName: string;
  propertyType: string;
  assessedValue: number;
  yearBuilt: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
}

// Create validators for each field
const validators = {
  parcelId: new Validator<string>()
    .addRule(StringValidators.required('Parcel ID is required'))
    .addRule(PropertyValidators.parcelId('Invalid parcel ID format')),
  
  address: new Validator<string>()
    .addRule(StringValidators.required('Address is required'))
    .addRule(PropertyValidators.address('Invalid address format')),
  
  ownerName: new Validator<string>()
    .addRule(StringValidators.required('Owner name is required'))
    .addRule(PropertyValidators.ownerName('Invalid owner name')),
  
  propertyType: new Validator<string>()
    .addRule(StringValidators.required('Property type is required'))
    .addRule(PropertyValidators.propertyType('Invalid property type')),
  
  assessedValue: new Validator<number>()
    .addRule(NumberValidators.required('Assessed value is required'))
    .addRule(PropertyValidators.assessedValue('Invalid assessed value')),
  
  yearBuilt: new Validator<number>()
    .addRule(NumberValidators.required('Year built is required'))
    .addRule(PropertyValidators.yearBuilt('Invalid year built')),
  
  squareFeet: new Validator<number>()
    .addRule(NumberValidators.positive('Square footage must be positive'))
    .addRule(PropertyValidators.squareFeet('Invalid square footage')),
  
  bedrooms: new Validator<number>()
    .addRule(NumberValidators.nonNegative('Bedrooms must be non-negative'))
    .addRule(PropertyValidators.bedrooms('Invalid number of bedrooms')),
  
  bathrooms: new Validator<number>()
    .addRule(NumberValidators.nonNegative('Bathrooms must be non-negative'))
    .addRule(PropertyValidators.bathrooms('Invalid number of bathrooms')),
};

// Validate the data
function validatePropertyData(data: PropertyAssessmentData): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  for (const [field, validator] of Object.entries(validators)) {
    const result = validator.validate(data[field as keyof PropertyAssessmentData]);
    if (!result.valid) {
      errors[field] = result.errors;
    }
  }
  
  return errors;
}

// Example usage
const propertyData: PropertyAssessmentData = {
  parcelId: 'ABC123',
  address: '123 Main St, Anytown, CA 12345',
  ownerName: 'John Doe',
  propertyType: 'residential',
  assessedValue: 450000,
  yearBuilt: 1995,
  squareFeet: 2400,
  bedrooms: 3,
  bathrooms: 2.5,
};

const validationErrors = validatePropertyData(propertyData);

if (Object.keys(validationErrors).length > 0) {
  console.error('Validation errors:', validationErrors);
} else {
  console.log('✅ Property data is valid');
}
```

### 2. Tax Levy Validation

Validate tax levy and tax rate data:

```typescript
import { Validator, StringValidators, NumberValidators, PropertyValidators } from './utils/validation';

interface TaxLevyData {
  levyCode: string;
  fiscalYear: number;
  taxRate: number;
  taxAmount: number;
  parcelId: string;
}

const levyCodeValidator = new Validator<string>()
  .addRule(StringValidators.required('Levy code is required'))
  .addRule(PropertyValidators.levyCode('Invalid levy code format'))
  .custom(
    (code) => !code.toLowerCase().includes('test'),
    'Test levy codes not allowed in production'
  );

const fiscalYearValidator = new Validator<number>()
  .addRule(NumberValidators.required('Fiscal year is required'))
  .addRule(PropertyValidators.fiscalYear('Invalid fiscal year'));

const taxRateValidator = new Validator<number>()
  .addRule(NumberValidators.required('Tax rate is required'))
  .addRule(PropertyValidators.taxRate('Invalid tax rate'))
  .addRule(NumberValidators.maxDecimals(4, 'Tax rate must have at most 4 decimal places'));

const taxAmountValidator = new Validator<number>()
  .addRule(NumberValidators.required('Tax amount is required'))
  .addRule(PropertyValidators.taxAmount('Invalid tax amount'));

// Validate tax levy
function validateTaxLevy(data: TaxLevyData): boolean {
  const results = [
    levyCodeValidator.validate(data.levyCode),
    fiscalYearValidator.validate(data.fiscalYear),
    taxRateValidator.validate(data.taxRate),
    taxAmountValidator.validate(data.taxAmount),
  ];
  
  const allErrors = results.flatMap(r => r.errors);
  
  if (allErrors.length > 0) {
    console.error('Tax levy validation errors:', allErrors);
    return false;
  }
  
  return true;
}

// Example usage
const taxLevy: TaxLevyData = {
  levyCode: 'COUNTY01',
  fiscalYear: 2024,
  taxRate: 1.2345,
  taxAmount: 5500.00,
  parcelId: 'ABC123-456',
};

if (validateTaxLevy(taxLevy)) {
  console.log('✅ Tax levy is valid');
}
```

### 3. Schema Validation for Complex Objects

Validate entire property records using schemas:

```typescript
import { SchemaValidator, Schema } from './utils/validation';

const propertyRecordSchema: Schema = {
  type: 'object',
  required: ['parcelId', 'address', 'assessedValue', 'propertyType'],
  properties: {
    parcelId: {
      type: 'string',
      required: true,
      minLength: 6,
      maxLength: 20,
      pattern: /^[A-Za-z0-9\-]+$/,
      errorMessage: 'Invalid parcel ID format'
    },
    address: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 200,
    },
    ownerName: {
      type: 'string',
      required: false,
      minLength: 2,
      maxLength: 100,
    },
    propertyType: {
      type: 'string',
      required: true,
      enum: ['residential', 'commercial', 'industrial', 'agricultural', 'vacant', 'mixed'],
    },
    assessedValue: {
      type: 'number',
      required: true,
      min: 0,
      max: 1000000000,
    },
    yearBuilt: {
      type: 'number',
      required: false,
      min: 1700,
      max: new Date().getFullYear(),
    },
    squareFeet: {
      type: 'number',
      required: false,
      min: 0,
      max: 10000000,
    },
    taxHistory: {
      type: 'array',
      required: false,
      minLength: 0,
      maxLength: 50,
      items: {
        type: 'object',
        properties: {
          year: { type: 'number', required: true },
          amount: { type: 'number', required: true, min: 0 },
        },
      },
    },
  },
  additionalProperties: false,
};

const schemaValidator = new SchemaValidator();

const propertyRecord = {
  parcelId: 'ABC123-456',
  address: '123 Main St, Anytown, CA 12345',
  ownerName: 'John Doe',
  propertyType: 'residential',
  assessedValue: 450000,
  yearBuilt: 1995,
  squareFeet: 2400,
  taxHistory: [
    { year: 2023, amount: 5200 },
    { year: 2024, amount: 5500 },
  ],
};

const result = schemaValidator.validate(propertyRecord, propertyRecordSchema);

if (!result.valid) {
  console.error('Schema validation errors:', result.errors);
} else {
  console.log('✅ Property record is valid');
}
```

### 4. Email and Contact Validation

Validate contact information:

```typescript
import { Validator, StringValidators, isValidEmail, isValidPhone } from './utils/validation';

interface ContactInfo {
  email: string;
  phone: string;
  alternateEmail?: string;
  alternatePhone?: string;
}

const emailValidator = new Validator<string>()
  .addRule(StringValidators.required('Email is required'))
  .addRule(StringValidators.email('Invalid email format'))
  .custom(
    (email) => !email.endsWith('@tempmail.com'),
    'Temporary email addresses not allowed'
  );

const phoneValidator = new Validator<string>()
  .addRule(StringValidators.required('Phone number is required'))
  .addRule(StringValidators.phone('Invalid phone number format'));

// Validate contact information
function validateContact(contact: ContactInfo): boolean {
  const errors: string[] = [];
  
  // Primary email
  const emailResult = emailValidator.validate(contact.email);
  if (!emailResult.valid) {
    errors.push(...emailResult.errors);
  }
  
  // Primary phone
  const phoneResult = phoneValidator.validate(contact.phone);
  if (!phoneResult.valid) {
    errors.push(...phoneResult.errors);
  }
  
  // Alternate email (optional, but must be valid if provided)
  if (contact.alternateEmail && !isValidEmail(contact.alternateEmail)) {
    errors.push('Invalid alternate email format');
  }
  
  // Alternate phone (optional, but must be valid if provided)
  if (contact.alternatePhone && !isValidPhone(contact.alternatePhone)) {
    errors.push('Invalid alternate phone format');
  }
  
  if (errors.length > 0) {
    console.error('Contact validation errors:', errors);
    return false;
  }
  
  return true;
}

// Example usage
const contact: ContactInfo = {
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  alternateEmail: 'johndoe@gmail.com',
  alternatePhone: '+1-555-987-6543',
};

if (validateContact(contact)) {
  console.log('✅ Contact information is valid');
}
```

### 5. Date Range Validation for Appeals

Validate appeal submission dates and deadlines:

```typescript
import { Validator, DateValidators } from './utils/validation';

interface AppealSubmission {
  propertyId: string;
  submissionDate: Date;
  taxYear: number;
  hearingDate?: Date;
}

// Appeals must be submitted between Jan 1 and April 30
const appealDeadline = new Date(new Date().getFullYear(), 3, 30); // April 30
const appealStart = new Date(new Date().getFullYear(), 0, 1); // January 1

const submissionDateValidator = new Validator<Date>()
  .addRule(DateValidators.required('Submission date is required'))
  .addRule(DateValidators.between(appealStart, appealDeadline, 'Appeals must be submitted between Jan 1 and April 30'))
  .addRule(DateValidators.past('Submission date cannot be in the future'));

// Hearing date must be after submission, within 120 days
function validateAppealDates(appeal: AppealSubmission): boolean {
  const errors: string[] = [];
  
  // Validate submission date
  const submissionResult = submissionDateValidator.validate(appeal.submissionDate);
  if (!submissionResult.valid) {
    errors.push(...submissionResult.errors);
  }
  
  // Validate hearing date if provided
  if (appeal.hearingDate) {
    const maxHearingDate = new Date(appeal.submissionDate);
    maxHearingDate.setDate(maxHearingDate.getDate() + 120); // 120 days after submission
    
    const hearingValidator = new Validator<Date>()
      .addRule(DateValidators.after(appeal.submissionDate, 'Hearing must be after submission'))
      .addRule(DateValidators.before(maxHearingDate, 'Hearing must be within 120 days of submission'));
    
    const hearingResult = hearingValidator.validate(appeal.hearingDate);
    if (!hearingResult.valid) {
      errors.push(...hearingResult.errors);
    }
  }
  
  if (errors.length > 0) {
    console.error('Appeal date validation errors:', errors);
    return false;
  }
  
  return true;
}

// Example usage
const appeal: AppealSubmission = {
  propertyId: 'ABC123',
  submissionDate: new Date('2024-03-15'),
  taxYear: 2024,
  hearingDate: new Date('2024-05-20'),
};

if (validateAppealDates(appeal)) {
  console.log('✅ Appeal dates are valid');
}
```

### 6. Array Validation for Comparable Properties

Validate comparable property selections for CMA:

```typescript
import { Validator, ArrayValidators } from './utils/validation';

interface ComparableProperty {
  parcelId: string;
  salePrice: number;
  saleDate: Date;
  squareFeet: number;
  distance: number; // miles from subject property
}

const comparablesValidator = new Validator<ComparableProperty[]>()
  .addRule(ArrayValidators.required('At least one comparable property is required'))
  .addRule(ArrayValidators.minLength(3, 'Minimum 3 comparable properties required'))
  .addRule(ArrayValidators.maxLength(10, 'Maximum 10 comparable properties allowed'))
  .addRule(ArrayValidators.unique('Comparable properties must be unique'))
  .addRule(ArrayValidators.every(
    (comp) => comp.distance <= 2.0,
    'All comparables must be within 2 miles'
  ))
  .addRule(ArrayValidators.every(
    (comp) => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return comp.saleDate >= sixMonthsAgo;
    },
    'All comparables must have sold within the last 6 months'
  ));

// Example usage
const comparables: ComparableProperty[] = [
  { parcelId: 'COMP1', salePrice: 440000, saleDate: new Date('2024-08-15'), squareFeet: 2350, distance: 0.5 },
  { parcelId: 'COMP2', salePrice: 455000, saleDate: new Date('2024-09-01'), squareFeet: 2400, distance: 1.2 },
  { parcelId: 'COMP3', salePrice: 460000, saleDate: new Date('2024-09-20'), squareFeet: 2500, distance: 1.8 },
];

const result = comparablesValidator.validate(comparables);

if (!result.valid) {
  console.error('Comparable properties validation errors:', result.errors);
} else {
  console.log('✅ Comparable properties are valid');
}
```

### 7. Custom Business Rule Validation

Create custom validators for complex business rules:

```typescript
import { Validator, NumberValidators } from './utils/validation';

interface PropertyValuation {
  marketValue: number;
  assessedValue: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
}

// Assessment ratio should be close to 100% for most counties
const assessedValueValidator = new Validator<PropertyValuation>()
  .custom(
    (valuation) => {
      const ratio = (valuation.assessedValue / valuation.marketValue) * 100;
      return ratio >= 80 && ratio <= 120;
    },
    'Assessed value must be within 80-120% of market value'
  )
  .custom(
    (valuation) => {
      if (!valuation.lastSalePrice) return true;
      const variance = Math.abs(valuation.marketValue - valuation.lastSalePrice) / valuation.lastSalePrice;
      return variance <= 0.5; // 50% variance threshold
    },
    'Market value should not deviate more than 50% from last sale price'
  )
  .custom(
    (valuation) => {
      if (!valuation.lastSaleDate) return true;
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      return valuation.lastSaleDate >= threeYearsAgo;
    },
    'Sale price comparison only valid if sale was within last 3 years'
  );

// Example usage
const valuation: PropertyValuation = {
  marketValue: 450000,
  assessedValue: 445000, // 98.9% ratio
  lastSalePrice: 430000,
  lastSaleDate: new Date('2022-06-15'),
};

const result = assessedValueValidator.validate(valuation);

if (!result.valid) {
  console.error('Valuation validation errors:', result.errors);
} else {
  console.log('✅ Valuation is valid');
}
```

### 8. Form Integration with Day 6 Form Management

Integrate validation with React forms:

```typescript
import { useForm, validators as formValidators } from './hooks/form-management';
import { PropertyValidators, StringValidators, NumberValidators } from './utils/validation';

interface PropertyFormData {
  parcelId: string;
  address: string;
  assessedValue: number;
  yearBuilt: number;
}

function PropertyForm() {
  const { formData, errors, handleChange, handleSubmit, isValid } = useForm<PropertyFormData>({
    initialValues: {
      parcelId: '',
      address: '',
      assessedValue: 0,
      yearBuilt: 0,
    },
    validators: {
      parcelId: [
        formValidators.required('Parcel ID is required'),
        (value: string) => {
          // Use our validation utility
          const validator = new Validator<string>()
            .addRule(PropertyValidators.parcelId('Invalid parcel ID format'));
          const result = validator.validate(value);
          return result.valid ? undefined : result.errors[0];
        },
      ],
      address: [
        formValidators.required('Address is required'),
        formValidators.minLength(5, 'Address must be at least 5 characters'),
      ],
      assessedValue: [
        formValidators.required('Assessed value is required'),
        (value: number) => {
          const validator = new Validator<number>()
            .addRule(PropertyValidators.assessedValue('Invalid assessed value'));
          const result = validator.validate(value);
          return result.valid ? undefined : result.errors[0];
        },
      ],
      yearBuilt: [
        formValidators.required('Year built is required'),
        (value: number) => {
          const validator = new Validator<number>()
            .addRule(PropertyValidators.yearBuilt('Invalid year built'));
          const result = validator.validate(value);
          return result.valid ? undefined : result.errors[0];
        },
      ],
    },
    onSubmit: async (values) => {
      console.log('Submitting property:', values);
      // API call here
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Parcel ID</label>
        <input
          type="text"
          name="parcelId"
          value={formData.parcelId}
          onChange={handleChange}
        />
        {errors.parcelId && <span className="error">{errors.parcelId}</span>}
      </div>
      
      <div>
        <label>Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
        {errors.address && <span className="error">{errors.address}</span>}
      </div>
      
      <div>
        <label>Assessed Value</label>
        <input
          type="number"
          name="assessedValue"
          value={formData.assessedValue}
          onChange={handleChange}
        />
        {errors.assessedValue && <span className="error">{errors.assessedValue}</span>}
      </div>
      
      <div>
        <label>Year Built</label>
        <input
          type="number"
          name="yearBuilt"
          value={formData.yearBuilt}
          onChange={handleChange}
        />
        {errors.yearBuilt && <span className="error">{errors.yearBuilt}</span>}
      </div>
      
      <button type="submit" disabled={!isValid}>
        Submit Property Assessment
      </button>
    </form>
  );
}
```

## API Reference

### Validator Class

**Constructor**: `new Validator<T>()`

**Methods**:
- `addRule(rule: ValidationRule<T>): this` - Add a validation rule
- `custom(validate: (value: T) => boolean, message: string): this` - Add custom validator
- `validate(value: T): ValidationResult` - Validate a value
- `validateAll(values: T[]): ValidationResult[]` - Validate multiple values

### String Validators

- `required(message?)` - Value must not be empty
- `minLength(min, message?)` - Minimum string length
- `maxLength(max, message?)` - Maximum string length
- `exactLength(length, message?)` - Exact string length
- `pattern(regex, message?)` - Regex pattern match
- `enum(values, message?)` - Value must be in enum
- `email(message?)` - Valid email format
- `url(message?)` - Valid URL format
- `phone(message?)` - Valid US phone number
- `alphanumeric(message?)` - Letters and numbers only
- `slug(message?)` - Letters, numbers, hyphens, underscores
- `noWhitespace(message?)` - No whitespace allowed
- `startsWith(prefix, message?)` - Must start with prefix
- `endsWith(suffix, message?)` - Must end with suffix

### Number Validators

- `required(message?)` - Value must not be null/undefined/NaN
- `positive(message?)` - Value must be > 0
- `nonNegative(message?)` - Value must be >= 0
- `negative(message?)` - Value must be < 0
- `min(min, message?)` - Minimum value
- `max(max, message?)` - Maximum value
- `range(min, max, message?)` - Value within range (inclusive)
- `integer(message?)` - Value must be integer
- `multipleOf(divisor, message?)` - Value must be multiple of divisor
- `maxDecimals(decimals, message?)` - Maximum decimal places

### Date Validators

- `required(message?)` - Date must be valid
- `past(message?)` - Date must be in the past
- `future(message?)` - Date must be in the future
- `after(compareDate, message?)` - Date must be after another date
- `before(compareDate, message?)` - Date must be before another date
- `between(startDate, endDate, message?)` - Date within range
- `withinLastDays(days, message?)` - Date within last N days
- `validYear(minYear, maxYear, message?)` - Year within range

### Array Validators

- `required(message?)` - Array must not be empty
- `minLength(min, message?)` - Minimum array length
- `maxLength(max, message?)` - Maximum array length
- `exactLength(length, message?)` - Exact array length
- `unique(message?)` - All items must be unique
- `every(validateItem, message?)` - All items must pass validation
- `some(validateItem, message?)` - At least one item must pass validation

### Property Assessment Validators

- `parcelId(message?)` - Valid parcel ID (6-20 alphanumeric with hyphens)
- `ain(message?)` - Valid AIN (10 digits)
- `address(message?)` - Valid property address
- `zipCode(message?)` - Valid US ZIP code (5 or 5+4 digits)
- `assessedValue(message?)` - Valid assessed value (positive, < $1B)
- `taxAmount(message?)` - Valid tax amount (non-negative, < $10M)
- `taxRate(message?)` - Valid tax rate (0-100%)
- `levyCode(message?)` - Valid levy code (2-10 alphanumeric)
- `fiscalYear(message?)` - Valid fiscal year (1900 to current+10)
- `propertyType(message?)` - Valid property type enum
- `squareFeet(message?)` - Valid square footage (positive, < 10M)
- `lotSize(message?)` - Valid lot size in acres (positive, < 100K)
- `yearBuilt(message?)` - Valid year built (1700 to current year)
- `bedrooms(message?)` - Valid number of bedrooms (0-50 integer)
- `bathrooms(message?)` - Valid number of bathrooms (0-50, allows 0.5 increments)
- `legalDescription(message?)` - Valid legal description
- `ownerName(message?)` - Valid owner name

### Schema Validator

**Constructor**: `new SchemaValidator()`

**Methods**:
- `validate(value: any, schema: Schema): ValidationResult` - Validate object against schema

### Utility Functions

- `isEmpty(value): boolean` - Check if value is empty
- `isValidEmail(value): boolean` - Check if valid email
- `isValidPhone(value): boolean` - Check if valid US phone
- `isValidURL(value): boolean` - Check if valid URL
- `isValidGuid(value): boolean` - Check if valid GUID/UUID
- `isValidDate(value): boolean` - Check if valid date
- `sanitizeString(value): string` - Remove HTML tags
- `normalizeWhitespace(value): string` - Collapse whitespace
- `createValidator<T>(): Validator<T>` - Create validator instance
- `createSchemaValidator(): SchemaValidator` - Create schema validator

## TypeScript Support

Full TypeScript support with generics:

```typescript
// Type-safe validators
const stringValidator = new Validator<string>()
  .addRule(StringValidators.required());

const numberValidator = new Validator<number>()
  .addRule(NumberValidators.positive());

// Type-safe custom validators
interface CustomType {
  id: string;
  value: number;
}

const customValidator = new Validator<CustomType>()
  .custom((obj) => obj.value > 0, 'Value must be positive')
  .custom((obj) => obj.id.length > 0, 'ID must not be empty');
```

## Testing

```typescript
import { Validator, StringValidators, PropertyValidators } from './validation';

describe('Validation', () => {
  it('should validate parcel IDs', () => {
    const validator = new Validator<string>()
      .addRule(PropertyValidators.parcelId());
    
    expect(validator.validate('ABC123-456').valid).toBe(true);
    expect(validator.validate('A').valid).toBe(false); // Too short
    expect(validator.validate('ABC@123').valid).toBe(false); // Invalid chars
  });

  it('should validate email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });

  it('should chain multiple validation rules', () => {
    const validator = new Validator<string>()
      .addRule(StringValidators.required())
      .addRule(StringValidators.minLength(5))
      .addRule(StringValidators.email());
    
    const result = validator.validate('user@example.com');
    expect(result.valid).toBe(true);
  });
});
```

## Performance Considerations

- **Validation Rules**: O(n) where n is the number of rules
- **Schema Validation**: O(n × m) where n is properties and m is rules per property
- **Array Validation**: O(n) for most operations, O(n²) for uniqueness check
- **Regex Patterns**: Pre-compiled patterns for optimal performance
- **Memory**: Minimal allocations, reuses validator instances

## Related Utilities

- `form-management.ts` - Form validation integration (Day 6)
- `format.ts` - Data formatting utilities (Day 2)
- `data-viz.ts` - Data visualization for validation results (Day 11)

---

**THE TERRAFUSION WAY™** - Data quality through comprehensive validation! ✅🔒
