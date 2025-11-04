// UAD Form constants and types for the appraisal form

// UAD Form 1004 sections
export enum UADFormSection {
  SUBJECT_PROPERTY = "subject_property",
  CONTRACT = "contract",
  NEIGHBORHOOD = "neighborhood",
  SITE = "site",
  IMPROVEMENTS = "improvements",
  SALES_COMPARISON = "sales_comparison",
  RECONCILIATION = "reconciliation",
  COST_APPROACH = "cost_approach",
  INCOME_APPROACH = "income_approach",
  PUD = "pud",
  ADDITIONAL_COMMENTS = "additional_comments",
}

// Property View types for UAD
export enum UADPropertyView {
  N = "N", // Neutral
  B = "B", // Beneficial
  A = "A", // Adverse
}

// Property Condition for UAD
export enum UADConditionRating {
  C1 = "C1", // No deferred maintenance, little or no physical depreciation, and requires no repairs
  C2 = "C2", // No deferred maintenance, repairs completed, shows only minor wear and tear
  C3 = "C3", // Well maintained, normal wear and tear, some minor repairs needed
  C4 = "C4", // Deferred maintenance, needs updating, shows signs of physical depreciation
  C5 = "C5", // Obvious deferred maintenance, significant repairs needed
  C6 = "C6", // Substantial damage, severe deferred maintenance
}

// Property Quality Rating for UAD
export enum UADQualityRating {
  Q1 = "Q1", // Exceptional quality
  Q2 = "Q2", // Superior quality
  Q3 = "Q3", // Good quality
  Q4 = "Q4", // Average quality
  Q5 = "Q5", // Fair quality
  Q6 = "Q6", // Basic quality
}

// Location Rating for UAD
export enum UADLocationRating {
  N = "N", // Neutral
  B = "B", // Beneficial
  A = "A", // Adverse
}

// UAD Field Type
export enum UADFieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  CHECKBOX = "checkbox",
  RADIO = "radio",
  SELECT = "select",
  TEXTAREA = "textarea",
  CURRENCY = "currency",
  MEASUREMENT = "measurement",
}

// UAD Field definition
export interface UADField {
  id: string;
  label: string;
  type: UADFieldType;
  required?: boolean;
  options?: string[] | { value: string; label: string }[];
  section: UADFormSection;
  subsection?: string;
  uadCode?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  description?: string;
  placeholder?: string;
  unitType?: string; // e.g., sq ft, acres, etc.
}

// Standard UAD form fields
export const UAD_FORM_FIELDS: UADField[] = [
  // Subject Property Section
  {
    id: "property_address",
    label: "Property Address",
    type: UADFieldType.TEXT,
    required: true,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "city",
    label: "City",
    type: UADFieldType.TEXT,
    required: true,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "state",
    label: "State",
    type: UADFieldType.TEXT,
    required: true,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "zip_code",
    label: "Zip Code",
    type: UADFieldType.TEXT,
    required: true,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "borrower",
    label: "Borrower",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "owner_of_public_record",
    label: "Owner of Public Record",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "county",
    label: "County",
    type: UADFieldType.TEXT,
    required: true,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "legal_description",
    label: "Legal Description",
    type: UADFieldType.TEXTAREA,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "assessors_parcel",
    label: "Assessor's Parcel #",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "tax_year",
    label: "Tax Year",
    type: UADFieldType.NUMBER,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "r_e_taxes",
    label: "R.E. Taxes $",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "neighborhood_name",
    label: "Neighborhood Name",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "census_tract",
    label: "Census Tract",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "map_reference",
    label: "Map Reference",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "occupant",
    label: "Occupant",
    type: UADFieldType.RADIO,
    options: ["Owner", "Tenant", "Vacant"],
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "assignment_type",
    label: "Assignment Type",
    type: UADFieldType.RADIO,
    options: ["Purchase Transaction", "Refinance Transaction", "Other"],
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "lender_client",
    label: "Lender/Client",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "lender_address",
    label: "Lender/Client Address",
    type: UADFieldType.TEXT,
    section: UADFormSection.SUBJECT_PROPERTY,
  },
  {
    id: "is_currently_offered_for_sale",
    label:
      "Is the subject property currently offered for sale or has it been offered for sale in the twelve months prior to the effective date of this appraisal?",
    type: UADFieldType.RADIO,
    options: ["Yes", "No"],
    section: UADFormSection.SUBJECT_PROPERTY,
  },

  // Site Section
  {
    id: "site_area",
    label: "Area",
    type: UADFieldType.MEASUREMENT,
    unitType: "acres",
    section: UADFormSection.SITE,
  },
  {
    id: "site_shape",
    label: "Shape",
    type: UADFieldType.SELECT,
    options: ["Regular", "Irregular"],
    section: UADFormSection.SITE,
  },
  {
    id: "site_view",
    label: "View",
    type: UADFieldType.SELECT,
    options: [
      { value: UADPropertyView.N, label: "Neutral" },
      { value: UADPropertyView.B, label: "Beneficial" },
      { value: UADPropertyView.A, label: "Adverse" },
    ],
    uadCode: "UAD_VIEW",
    section: UADFormSection.SITE,
  },

  // Improvements Section
  {
    id: "year_built",
    label: "Year Built",
    type: UADFieldType.NUMBER,
    required: true,
    section: UADFormSection.IMPROVEMENTS,
  },
  {
    id: "effective_age",
    label: "Effective Age (Yrs.)",
    type: UADFieldType.NUMBER,
    section: UADFormSection.IMPROVEMENTS,
  },
  {
    id: "condition",
    label: "Condition",
    type: UADFieldType.SELECT,
    options: [
      { value: UADConditionRating.C1, label: "C1 - No deferred maintenance" },
      { value: UADConditionRating.C2, label: "C2 - Well maintained, no repairs needed" },
      { value: UADConditionRating.C3, label: "C3 - Well maintained, minor repairs" },
      { value: UADConditionRating.C4, label: "C4 - Some deferred maintenance" },
      { value: UADConditionRating.C5, label: "C5 - Major deferred maintenance" },
      { value: UADConditionRating.C6, label: "C6 - Substantial damage/disrepair" },
    ],
    uadCode: "UAD_CONDITION",
    section: UADFormSection.IMPROVEMENTS,
  },
  {
    id: "quality",
    label: "Quality of Construction",
    type: UADFieldType.SELECT,
    options: [
      { value: UADQualityRating.Q1, label: "Q1 - Exceptional quality" },
      { value: UADQualityRating.Q2, label: "Q2 - Superior quality" },
      { value: UADQualityRating.Q3, label: "Q3 - Good quality" },
      { value: UADQualityRating.Q4, label: "Q4 - Average quality" },
      { value: UADQualityRating.Q5, label: "Q5 - Fair quality" },
      { value: UADQualityRating.Q6, label: "Q6 - Basic quality" },
    ],
    uadCode: "UAD_QUALITY",
    section: UADFormSection.IMPROVEMENTS,
  },
  {
    id: "gross_living_area",
    label: "Gross Living Area",
    type: UADFieldType.MEASUREMENT,
    unitType: "sq ft",
    required: true,
    section: UADFormSection.IMPROVEMENTS,
  },
  {
    id: "basement_area",
    label: "Basement Area",
    type: UADFieldType.MEASUREMENT,
    unitType: "sq ft",
    section: UADFormSection.IMPROVEMENTS,
    subsection: "basement",
  },
  {
    id: "basement_finish",
    label: "Basement Finish",
    type: UADFieldType.SELECT,
    options: ["None", "Partial", "Full"],
    section: UADFormSection.IMPROVEMENTS,
    subsection: "basement",
  },
  {
    id: "bedrooms",
    label: "Bedrooms",
    type: UADFieldType.NUMBER,
    required: true,
    section: UADFormSection.IMPROVEMENTS,
    subsection: "rooms",
  },
  {
    id: "bathrooms",
    label: "Bathrooms",
    type: UADFieldType.NUMBER,
    required: true,
    section: UADFormSection.IMPROVEMENTS,
    subsection: "rooms",
  },

  // Sales Comparison Section (Only subject property columns for now)
  {
    id: "subject_sales_price",
    label: "Sales Price",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.SALES_COMPARISON,
    subsection: "subject",
  },
  {
    id: "subject_price_per_sqft",
    label: "Price/Gross Liv. Area",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.SALES_COMPARISON,
    subsection: "subject",
  },
  {
    id: "subject_date_of_sale",
    label: "Date of Sale/Time",
    type: UADFieldType.DATE,
    section: UADFormSection.SALES_COMPARISON,
    subsection: "subject",
  },

  // Reconciliation Section
  {
    id: "indicated_value_by_sales_comparison",
    label: "Indicated Value by Sales Comparison Approach",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.RECONCILIATION,
  },
  {
    id: "indicated_value_by_cost_approach",
    label: "Indicated Value by Cost Approach",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.RECONCILIATION,
  },
  {
    id: "indicated_value_by_income_approach",
    label: "Indicated Value by Income Approach",
    type: UADFieldType.CURRENCY,
    section: UADFormSection.RECONCILIATION,
  },
  {
    id: "final_reconciliation",
    label: "Final Reconciliation",
    type: UADFieldType.TEXTAREA,
    section: UADFormSection.RECONCILIATION,
  },
  {
    id: "final_value_opinion",
    label: "Final Value Opinion",
    type: UADFieldType.CURRENCY,
    required: true,
    section: UADFormSection.RECONCILIATION,
  },
];

// Function to get fields by section
export function getFieldsBySection(section: UADFormSection): UADField[] {
  return UAD_FORM_FIELDS.filter((field) => field.section === section);
}

// Function to get fields by section and subsection
export function getFieldsBySubsection(section: UADFormSection, subsection?: string): UADField[] {
  return UAD_FORM_FIELDS.filter(
    (field) => field.section === section && (!subsection || field.subsection === subsection)
  );
}
