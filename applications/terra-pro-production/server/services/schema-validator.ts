import { TerraFusionComp } from "./rust-importer-bridge";

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  field: string;
  message: string;
  severity: "critical" | "moderate" | "low";
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  issues: ValidationIssue[];
  correctedData?: Partial<TerraFusionComp>;
}

export class SchemaValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      // Critical field validation
      {
        name: "required_fields",
        check: (comp: TerraFusionComp) => {
          const issues: ValidationIssue[] = [];

          if (!comp.address?.trim()) {
            issues.push({
              type: "error",
              field: "address",
              message: "Address is required",
              severity: "critical",
              suggestion: "Provide a valid property address",
            });
          }

          if (!comp.sale_date) {
            issues.push({
              type: "error",
              field: "sale_date",
              message: "Sale date is missing",
              severity: "critical",
              suggestion: "Add sale date in YYYY-MM-DD format",
            });
          }

          return issues;
        },
      },

      // Price validation
      {
        name: "price_validation",
        check: (comp: TerraFusionComp) => {
          const issues: ValidationIssue[] = [];

          if (!comp.sale_price_usd || comp.sale_price_usd <= 0) {
            issues.push({
              type: "error",
              field: "sale_price_usd",
              message: "Invalid sale price",
              severity: "critical",
              suggestion: "Sale price must be greater than $0",
            });
          } else if (comp.sale_price_usd < 5000) {
            issues.push({
              type: "warning",
              field: "sale_price_usd",
              message: "Unusually low sale price",
              severity: "moderate",
              suggestion: "Verify this is not a non-arms length transaction",
            });
          } else if (comp.sale_price_usd > 50000000) {
            issues.push({
              type: "warning",
              field: "sale_price_usd",
              message: "Exceptionally high sale price",
              severity: "moderate",
              suggestion: "Verify accuracy of price data",
            });
          }

          return issues;
        },
      },

      // Square footage validation
      {
        name: "sqft_validation",
        check: (comp: TerraFusionComp) => {
          const issues: ValidationIssue[] = [];

          if (!comp.gla_sqft || comp.gla_sqft <= 0) {
            issues.push({
              type: "error",
              field: "gla_sqft",
              message: "Invalid gross living area",
              severity: "critical",
              suggestion: "GLA must be greater than 0 square feet",
            });
          } else if (comp.gla_sqft < 200) {
            issues.push({
              type: "warning",
              field: "gla_sqft",
              message: "Unusually small living area",
              severity: "moderate",
              suggestion: "Verify GLA measurement accuracy",
            });
          } else if (comp.gla_sqft > 20000) {
            issues.push({
              type: "warning",
              field: "gla_sqft",
              message: "Exceptionally large living area",
              severity: "low",
              suggestion: "Confirm measurement for luxury/estate property",
            });
          }

          return issues;
        },
      },

      // Date validation
      {
        name: "date_validation",
        check: (comp: TerraFusionComp) => {
          const issues: ValidationIssue[] = [];

          if (comp.sale_date) {
            const saleDate = new Date(comp.sale_date);
            const now = new Date();
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            const tenYearsAgo = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);

            if (isNaN(saleDate.getTime())) {
              issues.push({
                type: "error",
                field: "sale_date",
                message: "Invalid date format",
                severity: "critical",
                suggestion: "Use YYYY-MM-DD format",
              });
            } else if (saleDate > now) {
              issues.push({
                type: "warning",
                field: "sale_date",
                message: "Future sale date",
                severity: "moderate",
                suggestion: "Verify sale date accuracy",
              });
            } else if (saleDate < tenYearsAgo) {
              issues.push({
                type: "info",
                field: "sale_date",
                message: "Sale older than 10 years",
                severity: "low",
                suggestion: "Consider data relevance for current analysis",
              });
            } else if (saleDate < oneYearAgo) {
              issues.push({
                type: "info",
                field: "sale_date",
                message: "Sale older than 1 year",
                severity: "low",
                suggestion: "Apply appropriate time adjustments",
              });
            }
          }

          return issues;
        },
      },

      // Logical consistency validation
      {
        name: "consistency_validation",
        check: (comp: TerraFusionComp) => {
          const issues: ValidationIssue[] = [];

          // Price per square foot validation
          if (comp.sale_price_usd && comp.gla_sqft) {
            const pricePerSqft = comp.sale_price_usd / comp.gla_sqft;

            if (pricePerSqft < 10) {
              issues.push({
                type: "warning",
                field: "sale_price_usd",
                message: `Very low price per sqft: $${pricePerSqft.toFixed(2)}`,
                severity: "moderate",
                suggestion: "Verify pricing accuracy or check for distressed sale",
              });
            } else if (pricePerSqft > 2000) {
              issues.push({
                type: "warning",
                field: "sale_price_usd",
                message: `Very high price per sqft: $${pricePerSqft.toFixed(2)}`,
                severity: "moderate",
                suggestion: "Verify pricing for luxury/specialty property",
              });
            }
          }

          // Bedroom/bathroom validation
          if (comp.bedrooms !== undefined && comp.bedrooms < 0) {
            issues.push({
              type: "error",
              field: "bedrooms",
              message: "Invalid bedroom count",
              severity: "critical",
              suggestion: "Bedroom count cannot be negative",
            });
          }

          if (comp.bathrooms !== undefined && comp.bathrooms < 0) {
            issues.push({
              type: "error",
              field: "bathrooms",
              message: "Invalid bathroom count",
              severity: "critical",
              suggestion: "Bathroom count cannot be negative",
            });
          }

          // Year built validation
          if (comp.year_built !== undefined) {
            const currentYear = new Date().getFullYear();
            if (comp.year_built < 1800 || comp.year_built > currentYear + 2) {
              issues.push({
                type: "warning",
                field: "year_built",
                message: "Unusual year built",
                severity: "moderate",
                suggestion: "Verify construction year accuracy",
              });
            }
          }

          return issues;
        },
      },
    ];
  }

  public validate(comp: TerraFusionComp): ValidationResult {
    const allIssues: ValidationIssue[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const ruleIssues = rule.check(comp);
        allIssues.push(...ruleIssues);
      } catch (error) {
        console.error(`Error running validation rule ${rule.name}:`, error);
      }
    }

    // Calculate confidence score
    const criticalIssues = allIssues.filter((i) => i.severity === "critical").length;
    const moderateIssues = allIssues.filter((i) => i.severity === "moderate").length;
    const lowIssues = allIssues.filter((i) => i.severity === "low").length;

    let confidence = 100;
    confidence -= criticalIssues * 30;
    confidence -= moderateIssues * 15;
    confidence -= lowIssues * 5;
    confidence = Math.max(0, confidence);

    const isValid = criticalIssues === 0;

    return {
      isValid,
      confidence,
      issues: allIssues,
      correctedData: this.suggestCorrections(comp, allIssues),
    };
  }

  private suggestCorrections(
    comp: TerraFusionComp,
    issues: ValidationIssue[]
  ): Partial<TerraFusionComp> {
    const corrections: Partial<TerraFusionComp> = {};

    // Auto-correct obvious issues
    for (const issue of issues) {
      switch (issue.field) {
        case "sale_price_usd":
          if (comp.sale_price_usd <= 0) {
            // Don't auto-correct price, flag for manual review
          }
          break;

        case "gla_sqft":
          if (comp.gla_sqft <= 0) {
            // Don't auto-correct square footage, flag for manual review
          }
          break;

        case "address":
          if (!comp.address?.trim()) {
            corrections.address = "[ADDRESS REQUIRED]";
          }
          break;
      }
    }

    return Object.keys(corrections).length > 0 ? corrections : undefined;
  }

  public validateBatch(comps: TerraFusionComp[]): ValidationResult[] {
    return comps.map((comp) => this.validate(comp));
  }

  public getValidationSummary(results: ValidationResult[]): ValidationSummary {
    const totalRecords = results.length;
    const validRecords = results.filter((r) => r.isValid).length;
    const invalidRecords = totalRecords - validRecords;

    const avgConfidence =
      totalRecords > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / totalRecords : 0;

    const issuesByType = results.reduce(
      (acc, result) => {
        for (const issue of result.issues) {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const issuesBySeverity = results.reduce(
      (acc, result) => {
        for (const issue of result.issues) {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      validationRate: totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0,
      averageConfidence: avgConfidence,
      issuesByType,
      issuesBySeverity,
    };
  }
}

interface ValidationRule {
  name: string;
  check: (comp: TerraFusionComp) => ValidationIssue[];
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  validationRate: number;
  averageConfidence: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
}

// Global singleton instance
export const schemaValidator = new SchemaValidator();
