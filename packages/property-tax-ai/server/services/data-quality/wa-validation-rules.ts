/**
 * Washington State Property Validation Rules
 * 
 * This module defines validation rules specific to Washington State property assessment
 * requirements and regulations, including:
 * 
 * - RCW 84.40: Property listing and valuation
 * - RCW 84.41: Revaluation of property
 * - RCW 84.48: Equalization of assessments
 * - WAC 458-07: Valuation and revaluation
 * - WAC 458-53: Property tax annual ratio study
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ValidationRule, 
  RuleCategory, 
  RuleLevel, 
  EntityType, 
  IssueStatus 
} from '../../../shared/schema';

/**
 * Washington State validation rule set with references to specific regulations
 */
export const createWashingtonValidationRules = (createdBy?: number): Omit<ValidationRule, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return [
    // RCW 84.40.020 - Annual Listing
    {
      ruleId: 'wa_rcw_84_40_020_annual_listing',
      name: 'RCW 84.40.020 Annual Listing',
      description: 'Property must have been assessed or updated within the last assessment cycle',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.WARNING,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          fieldValues: [
            {
              field: 'lastUpdated',
              operator: 'gt',
              value: new Date(new Date().getFullYear() - 1, 0, 1).toISOString()
            }
          ]
        },
        message: 'Property has not been assessed within the current assessment cycle (RCW 84.40.020)'
      }),
      reference: 'RCW 84.40.020',
      isActive: true,
      createdBy
    },
    
    // RCW 84.40.030 - Market Value Basis
    {
      ruleId: 'wa_rcw_84_40_030_market_value',
      name: 'RCW 84.40.030 Market Value Basis',
      description: 'All property must be valued according to its true and fair value in money (market value)',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['value', 'extraFields.assessmentMethod'],
          fieldValues: [
            {
              field: 'value',
              operator: 'gt',
              value: 0
            }
          ]
        },
        message: 'Property must have a positive assessed value based on market value (RCW 84.40.030)'
      }),
      reference: 'RCW 84.40.030',
      isActive: true,
      createdBy
    },
    
    // RCW 84.40.040 - Time and manner of listing
    {
      ruleId: 'wa_rcw_84_40_040_listing_date',
      name: 'RCW 84.40.040 Listing Timestamp',
      description: 'Property listing must include a proper timestamp for the assessment date',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['extraFields.assessmentDate'],
          patterns: [
            {
              field: 'extraFields.assessmentDate',
              regex: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$' // ISO date format
            }
          ]
        },
        message: 'Property must have a valid assessment date (RCW 84.40.040)'
      }),
      reference: 'RCW 84.40.040',
      isActive: true,
      createdBy
    },
    
    // RCW 84.41.030 - Cyclical Revaluation
    {
      ruleId: 'wa_rcw_84_41_030_cyclical',
      name: 'RCW 84.41.030 Cyclical Revaluation',
      description: 'Properties must be physically inspected at least once every 6 years',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['extraFields.lastPhysicalInspection'],
          fieldValues: [
            {
              field: 'extraFields.lastPhysicalInspection',
              operator: 'gt',
              value: new Date(new Date().getFullYear() - 6, 0, 1).toISOString()
            }
          ]
        },
        message: 'Property has not been physically inspected within the required 6-year cycle (RCW 84.41.030)'
      }),
      reference: 'RCW 84.41.030',
      isActive: true,
      createdBy
    },
    
    // WAC 458-07-015 - Revaluation process
    {
      ruleId: 'wa_wac_458_07_015_revaluation',
      name: 'WAC 458-07-015 Revaluation Process',
      description: 'Documentation of revaluation process must be maintained',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.WARNING,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['extraFields.revaluationCycle', 'extraFields.revaluationArea']
        },
        message: 'Property is missing revaluation cycle information (WAC 458-07-015)'
      }),
      reference: 'WAC 458-07-015',
      isActive: true,
      createdBy
    },
    
    // WAC 458-07-025 - Property class definitions
    {
      ruleId: 'wa_wac_458_07_025_property_class',
      name: 'WAC 458-07-025 Property Class Definition',
      description: 'Property must have a valid Washington property class code',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['extraFields.propertyClass'],
          valueList: {
            field: 'extraFields.propertyClass',
            allowedValues: [
              'R', 'C', 'I', 'A', 'F', 'O', 'M'
            ]
          }
        },
        message: 'Property has an invalid Washington property class code (WAC 458-07-025)'
      }),
      reference: 'WAC 458-07-025',
      isActive: true,
      createdBy
    },
    
    // Washington Parcel Number Format
    {
      ruleId: 'wa_data_quality_parcel_format',
      name: 'Washington Parcel Number Format',
      description: 'Parcel number must match the Washington standard format',
      category: RuleCategory.DATA_QUALITY,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          patterns: [
            {
              field: 'parcelNumber',
              regex: '^\\d{2}\\-\\d{2}\\-\\d{5}\\-\\d{3}\\-\\d{4}$'
            }
          ]
        },
        message: 'Parcel number does not match the required Washington format (XX-XX-XXXXX-XXX-XXXX)'
      }),
      isActive: true,
      createdBy
    },
    
    // Land Use Code Validation
    {
      ruleId: 'wa_dor_valid_use_code',
      name: 'Washington DOR Valid Use Code',
      description: 'Property use code must be a valid Washington DOR code',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['extraFields'],
          patterns: [
            {
              field: 'extraFields.useCode',
              regex: '^\\d{3}$' // 3-digit code format
            }
          ]
        },
        message: 'Property use code must be a valid 3-digit Washington DOR code'
      }),
      reference: 'Washington DOR Property Tax Division',
      isActive: true,
      createdBy
    },
    
    // RCW 84.40.170 - Public Lands Exempt
    {
      ruleId: 'wa_rcw_84_40_170_public_lands',
      name: 'RCW 84.40.170 Public Lands Exemption',
      description: 'Public lands that qualify for exemption must be marked as exempt',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.ERROR,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          fieldConditions: [
            {
              if: {
                field: 'extraFields.ownerType',
                value: 'government'
              },
              then: {
                field: 'extraFields.taxExempt',
                value: true
              }
            }
          ]
        },
        message: 'Government-owned property should be marked as tax exempt (RCW 84.40.170)'
      }),
      reference: 'RCW 84.40.170',
      isActive: true,
      createdBy
    },
    
    // WAC 458-53 - Ratio Requirements
    {
      ruleId: 'wa_wac_458_53_ratio',
      name: 'WAC 458-53 Assessment Ratio',
      description: 'Property assessment ratio should be within standards',
      category: RuleCategory.COMPLIANCE,
      level: RuleLevel.WARNING,
      entityType: EntityType.PROPERTY,
      implementation: JSON.stringify({
        conditions: {
          requiredFields: ['value', 'extraFields.marketValue'],
          customValidator: 'assessmentRatioValidator'
        },
        message: 'Property assessment ratio is outside of acceptable range (WAC 458-53)'
      }),
      reference: 'WAC 458-53',
      isActive: true,
      createdBy
    }
  ];
};

/**
 * Assessment ratio validator function
 * Checks if the ratio of assessed value to market value is within acceptable range
 */
export function assessmentRatioValidator(property: any): boolean {
  if (!property.value || !property.extraFields?.marketValue) {
    return false;
  }
  
  const assessedValue = Number(property.value);
  const marketValue = Number(property.extraFields.marketValue);
  
  if (isNaN(assessedValue) || isNaN(marketValue) || marketValue === 0) {
    return false;
  }
  
  const ratio = assessedValue / marketValue;
  
  // Washington requires ratio between 0.9 and 1.1 for most properties
  return ratio >= 0.9 && ratio <= 1.1;
}