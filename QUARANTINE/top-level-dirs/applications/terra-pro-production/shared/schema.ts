import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  json,
  real,
  uuid,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ======= USERS & AUTH ========

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("appraiser").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  orders: many(orders),
  properties: many(properties),
  valuations: many(valuations),
}));

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

// ======= PROPERTY DATA ========

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  createdById: integer("created_by_id").references(() => users.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  county: text("county"),
  legalDescription: text("legal_description"),
  taxParcelId: text("tax_parcel_id"),
  propertyType: text("property_type").notNull(),
  yearBuilt: integer("year_built"),
  effectiveAge: integer("effective_age"),
  grossLivingArea: real("gross_living_area"),
  lotSize: real("lot_size"),
  bedrooms: real("bedrooms"),
  bathrooms: real("bathrooms"),
  basement: text("basement"),
  garage: text("garage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  parcelId: text("parcel_id"),
  propertyIdentifier: text("property_identifier"),
  acreage: real("acreage"),
  squareFeet: integer("square_feet"),
  lastSaleDate: timestamp("last_sale_date"),
  lastSaleAmount: real("last_sale_amount"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  metadata: json("metadata"),
  enableRLS: boolean("enable_r_l_s"),
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [properties.createdById],
    references: [users.id],
  }),
  orders: many(orders),
  valuations: many(valuations),
  images: many(propertyImages),
  comparables: many(comparableProperties, { relationName: "property" }),
  asComparable: many(comparableProperties, { relationName: "comparable" }),
}));

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  roomType: text("room_type"), // kitchen, bathroom, exterior, etc.
  isPrimary: boolean("is_primary").default(false), // Main property image
  conditionScore: real("condition_score"), // AI-generated score (1-5)
  conditionScoreConfidence: real("condition_score_confidence"), // AI confidence level
  modelVersion: text("model_version"), // AI model version used
  metadata: json("metadata"), // Additional image data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

// ======= VALUATION & ASSESSMENT ========

export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  orderId: integer("order_id").references(() => orders.id),
  appraiserId: integer("appraiser_id").references(() => users.id),
  valuationAmount: integer("valuation_amount").notNull(),
  confidenceScore: real("confidence_score"), // AI confidence (0-1)
  valuationMethod: text("valuation_method").notNull(), // ai, manual, hybrid
  valuationDate: timestamp("valuation_date").defaultNow().notNull(),
  status: text("status").default("draft").notNull(), // draft, complete, reviewed
  aiFactors: json("ai_factors"), // Factors influencing AI valuation
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const valuationsRelations = relations(valuations, ({ one, many }) => ({
  property: one(properties, {
    fields: [valuations.propertyId],
    references: [properties.id],
  }),
  order: one(orders, {
    fields: [valuations.orderId],
    references: [orders.id],
  }),
  appraiser: one(users, {
    fields: [valuations.appraiserId],
    references: [users.id],
  }),
  comparables: many(comparableProperties),
}));

export const comparableProperties = pgTable(
  "comparable_properties",
  {
    id: serial("id").primaryKey(),
    valuationId: integer("valuation_id").references(() => valuations.id),
    propertyId: integer("property_id").references(() => properties.id),
    comparablePropertyId: integer("comparable_property_id").references(() => properties.id),
    adjustedValue: integer("adjusted_value"),
    similarity: real("similarity"), // Similarity score (0-1)
    adjustments: json("adjustments"), // Adjustment details
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      propertyComparableIdx: uniqueIndex("property_comparable_idx").on(
        table.valuationId,
        table.propertyId,
        table.comparablePropertyId
      ),
    };
  }
);

export const comparablePropertiesRelations = relations(comparableProperties, ({ one }) => ({
  valuation: one(valuations, {
    fields: [comparableProperties.valuationId],
    references: [valuations.id],
  }),
  property: one(properties, {
    fields: [comparableProperties.propertyId],
    references: [properties.id],
    relationName: "property",
  }),
  comparable: one(properties, {
    fields: [comparableProperties.comparablePropertyId],
    references: [properties.id],
    relationName: "comparable",
  }),
}));

// ======= ORDERS & WORKFLOW ========

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  propertyId: integer("property_id").references(() => properties.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  orderType: text("order_type").notNull(), // full appraisal, desktop, etc.
  status: text("status").default("new").notNull(), // new, assigned, in_progress, etc.
  dueDate: timestamp("due_date"),
  priorityLevel: text("priority_level").default("normal"), // low, normal, high, rush
  notes: text("notes"),
  fee: integer("fee"), // in cents
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  property: one(properties, {
    fields: [orders.propertyId],
    references: [properties.id],
  }),
  assignedTo: one(users, {
    fields: [orders.assignedToId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [orders.createdById],
    references: [users.id],
  }),
  statusUpdates: many(orderStatusUpdates),
  valuations: many(valuations),
  reports: many(reports),
}));

export const orderStatusUpdates = pgTable("order_status_updates", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  updatedById: integer("updated_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderStatusUpdatesRelations = relations(orderStatusUpdates, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusUpdates.orderId],
    references: [orders.id],
  }),
  updatedBy: one(users, {
    fields: [orderStatusUpdates.updatedById],
    references: [users.id],
  }),
}));

// ======= REPORTS ========

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  valuationId: integer("valuation_id").references(() => valuations.id),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // full, summary, etc.
  status: text("status").default("draft").notNull(), // draft, final
  pdfUrl: text("pdf_url"), // URL to stored PDF
  generatedById: integer("generated_by_id").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  templateId: text("template_id"), // Reference to report template
});

export const reportsRelations = relations(reports, ({ one }) => ({
  order: one(orders, {
    fields: [reports.orderId],
    references: [orders.id],
  }),
  valuation: one(valuations, {
    fields: [reports.valuationId],
    references: [valuations.id],
  }),
  generatedBy: one(users, {
    fields: [reports.generatedById],
    references: [users.id],
  }),
}));

// ======= MODEL TRACKING ========

export const modelInferences = pgTable("model_inferences", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull(), // "valuation", "condition", etc.
  modelVersion: text("model_version").notNull(),
  entityType: text("entity_type").notNull(), // "property", "image", etc.
  entityId: integer("entity_id").notNull(), // ID of related entity
  inputs: json("inputs"), // Data sent to model
  outputs: json("outputs"), // Response from model
  executionTimeMs: integer("execution_time_ms"),
  succeeded: boolean("succeeded").default(true),
  errorMessage: text("error_message"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ======= UNIVERSAL LEGACY IMPORTER ========

export const legacyImportJobs = pgTable("legacy_import_jobs", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, mapping, review, completed, failed
  uploadedFiles: json("uploaded_files").notNull(), // Array of file objects
  detectedFormats: json("detected_formats"), // Auto-detected file types and systems
  extractedData: json("extracted_data"), // Raw extracted data from files
  fieldMappings: json("field_mappings"), // Legacy field to Terrafusion field mappings
  validationErrors: json("validation_errors"), // Data validation issues
  previewData: json("preview_data"), // Sample data for user review
  importSettings: json("import_settings"), // User preferences for import
  processedRecords: integer("processed_records").default(0),
  totalRecords: integer("total_records").default(0),
  errorLogs: json("error_logs"), // Processing errors and warnings
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const legacyImportJobsRelations = relations(legacyImportJobs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [legacyImportJobs.createdById],
    references: [users.id],
  }),
  importedRecords: many(legacyImportRecords),
}));

export const legacyImportRecords = pgTable("legacy_import_records", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .references(() => legacyImportJobs.id)
    .notNull(),
  sourceSystem: text("source_system"), // TOTAL, ClickForms, ACI, DataMaster, etc.
  sourceRecordId: text("source_record_id"), // Original record ID from legacy system
  recordType: text("record_type").notNull(), // property, valuation, order, etc.
  rawData: json("raw_data").notNull(), // Original data from legacy system
  mappedData: json("mapped_data"), // Data mapped to Terrafusion schema
  importStatus: text("import_status").default("pending").notNull(), // pending, imported, failed
  targetEntityId: integer("target_entity_id"), // ID of created Terrafusion entity
  targetEntityType: text("target_entity_type"), // Which table the record was imported to
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  importedAt: timestamp("imported_at"),
});

export const legacyImportRecordsRelations = relations(legacyImportRecords, ({ one }) => ({
  job: one(legacyImportJobs, {
    fields: [legacyImportRecords.jobId],
    references: [legacyImportJobs.id],
  }),
}));

export const legacySystemTemplates = pgTable("legacy_system_templates", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull(),
  systemType: text("system_type").notNull(), // TOTAL, ClickForms, ACI, DataMaster, etc.
  fileFormats: text("file_formats").array(), // [xml, env, sql, csv, pdf]
  fieldMappings: json("field_mappings").notNull(), // Standard field mapping rules
  extractionRules: json("extraction_rules"), // How to extract data from this system
  validationRules: json("validation_rules"), // Data validation specific to this system
  isActive: boolean("is_active").default(true).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const legacySystemTemplatesRelations = relations(legacySystemTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [legacySystemTemplates.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [legacySystemTemplates.createdById],
    references: [users.id],
  }),
}));

// ======= TOOLTIP & TERMINOLOGY ========

export const realEstateTerms = pgTable("real_estate_terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category").notNull(), // financing, appraisal, legal, etc.
  contextualExplanation: text("contextual_explanation"),
  examples: text("examples").array(),
  relatedTerms: text("related_terms").array(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ======= FIELD NOTES ========

export const fieldNotes = pgTable("field_notes", {
  id: text("id").primaryKey(), // UUID string
  parcelId: text("parcel_id").notNull(), // References property by external ID
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"), // User name or identifier
  userId: integer("user_id").references(() => users.id),
});

// ======= APPRAISAL FORMS & DATA ========

export const appraisalForms = pgTable("appraisal_forms", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  formType: text("form_type").notNull(), // urar, commercial, land, etc.
  formData: json("form_data").notNull(), // Complete form field data
  status: text("status").default("draft").notNull(), // draft, in_progress, completed, reviewed
  completionPercentage: integer("completion_percentage").default(0),
  aiSuggestions: json("ai_suggestions"), // AI-generated suggestions for fields
  validationErrors: json("validation_errors"), // Current validation issues
  lastSavedAt: timestamp("last_saved_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appraisalFormsRelations = relations(appraisalForms, ({ one }) => ({
  order: one(orders, {
    fields: [appraisalForms.orderId],
    references: [orders.id],
  }),
  property: one(properties, {
    fields: [appraisalForms.propertyId],
    references: [properties.id],
  }),
  createdBy: one(users, {
    fields: [appraisalForms.createdById],
    references: [users.id],
  }),
}));

export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  formType: text("form_type").notNull(),
  templateData: json("template_data").notNull(), // Template structure and defaults
  isDefault: boolean("is_default").default(false),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const formTemplatesRelations = relations(formTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [formTemplates.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [formTemplates.createdById],
    references: [users.id],
  }),
}));

// ======= MLS INTEGRATION ========

export const mlsSystems = pgTable("mls_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  systemType: text("system_type").notNull(), // rets, web_api, idx, custom
  url: text("url"),
  username: text("username"),
  password: text("password"),
  apiKey: text("api_key"),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  metadata: json("metadata"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mlsFieldMappings = pgTable("mls_field_mappings", {
  id: serial("id").primaryKey(),
  mlsSystemId: integer("mls_system_id")
    .references(() => mlsSystems.id)
    .notNull(),
  mlsFieldName: text("mls_field_name").notNull(),
  appFieldName: text("app_field_name").notNull(),
  dataType: text("data_type").notNull(), // string, number, date, boolean, etc.
  transformationRule: text("transformation_rule"), // Optional rule for transforming the data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mlsPropertyMappings = pgTable("mls_property_mappings", {
  id: serial("id").primaryKey(),
  mlsSystemId: integer("mls_system_id")
    .references(() => mlsSystems.id)
    .notNull(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  mlsNumber: text("mls_number").notNull(),
  mlsStatus: text("mls_status"),
  rawData: json("raw_data"),
  lastSynced: timestamp("last_synced").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comparableSales = pgTable("comparable_sales", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id), // Subject property (optional)
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county"),
  propertyType: text("property_type").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  squareFeet: integer("square_feet"),
  lotSize: real("lot_size"),
  yearBuilt: integer("year_built"),
  saleDate: timestamp("sale_date").notNull(),
  saleAmount: integer("sale_amount").notNull(), // in cents
  sourceType: text("source_type").default("mls"), // mls, public_records, manual, etc.
  sourceId: text("source_id"), // Reference ID from the source
  latitude: real("latitude"),
  longitude: real("longitude"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mlsComparableMappings = pgTable("mls_comparable_mappings", {
  id: serial("id").primaryKey(),
  mlsSystemId: integer("mls_system_id")
    .references(() => mlsSystems.id)
    .notNull(),
  comparableId: integer("comparable_id")
    .references(() => comparableSales.id)
    .notNull(),
  mlsNumber: text("mls_number").notNull(),
  rawData: json("raw_data"),
  lastSynced: timestamp("last_synced").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ======= REVIEW SYSTEM ========

export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  objectType: text("object_type").notNull(), // The type of object being reviewed (e.g. "property", "valuation", "report")
  objectId: integer("object_id").notNull(), // The ID of the object being reviewed
  requesterId: integer("requester_id")
    .references(() => users.id)
    .notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id), // May be null until assigned
  status: text("status").default("pending").notNull(), // pending, in_review, completed, rejected
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  dueDate: timestamp("due_date"),
  title: text("title").notNull(),
  description: text("description"),
  approved: boolean("approved"), // null until review is completed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  objectType: text("object_type").notNull(), // The type of object being commented on
  objectId: integer("object_id").notNull(), // The ID of the object being commented on
  threadId: integer("thread_id"), // ID of parent comment if this is a reply
  text: text("text").notNull(),
  status: text("status").default("active").notNull(), // active, resolved, hidden
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  objectType: text("object_type").notNull(), // The type of object being annotated
  objectId: integer("object_id").notNull(), // The ID of the object being annotated
  type: text("type").notNull(), // highlight, note, drawing, etc.
  content: text("content"),
  metadata: json("metadata"), // For position, size, color, etc.
  page: integer("page"), // For document annotations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const revisionHistory = pgTable("revision_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  objectType: text("object_type").notNull(), // The type of object being revised
  objectId: integer("object_id").notNull(), // The ID of the object being revised
  changeType: text("change_type").notNull(), // created, updated, deleted
  fieldName: text("field_name"), // The field that was changed
  oldValue: text("old_value"), // The previous value
  newValue: text("new_value"), // The new value
  description: text("description"), // Human-readable description of the change
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ======= APPRAISAL REPORTS ========

export const appraisalReports = pgTable("appraisal_reports", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(), // The appraiser who created the report
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // URAR, 1004D, 2055, etc.
  status: text("status").default("draft").notNull(), // draft, in_review, completed, submitted
  effectiveDate: timestamp("effective_date").notNull(),
  signatureDate: timestamp("signature_date"),
  submissionDate: timestamp("submission_date"),
  fileUrl: text("file_url"), // URL to the PDF or final report
  xmlData: json("xml_data"), // MISMO XML data
  formData: json("form_data"), // Form field data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ======= PHOTOS AND SKETCHES ========

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // front, rear, street, kitchen, etc.
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  takenAt: timestamp("taken_at"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sketches = pgTable("sketches", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sketchType: text("sketch_type").notNull(), // floor_plan, site_plan, etc.
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  svgData: text("svg_data"), // SVG data for the sketch
  dimensions: json("dimensions"), // Dimensions data
  area: real("area"), // Calculated area in sq ft
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ======= COMPLIANCE ========

export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .references(() => appraisalReports.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  checkType: text("check_type").notNull(), // uad, fnma, fhlmc, etc.
  status: text("status").default("pending").notNull(), // pending, passed, failed
  results: json("results"), // Detailed check results
  errors: integer("errors").default(0).notNull(),
  warnings: integer("warnings").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ======= CONVERSION CENTER ========

export const conversionHistory = pgTable("conversion_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  templateName: text("template_name").notNull(),
  inputFileName: text("input_file_name").notNull(),
  outputFileName: text("output_file_name"),
  inputRecords: integer("input_records").default(0),
  outputRecords: integer("output_records").default(0),
  mappingData: json("mapping_data"), // Field mapping configuration
  conversionResult: json("conversion_result"), // Complete conversion output
  agentSummary: text("agent_summary"), // AI agent analysis
  warnings: text("warnings").array().default([]),
  status: text("status").default("completed").notNull(), // pending, completed, failed
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversionTemplates = pgTable("conversion_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(), // xml, json, yaml
  templateContent: text("template_content").notNull(),
  fieldMappings: json("field_mappings"), // Default field mappings
  isDefault: boolean("is_default").default(false),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversionHistoryRelations = relations(conversionHistory, ({ one }) => ({
  user: one(users, {
    fields: [conversionHistory.userId],
    references: [users.id],
  }),
}));

export const conversionTemplatesRelations = relations(conversionTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [conversionTemplates.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [conversionTemplates.createdById],
    references: [users.id],
  }),
}));

// ======= SCHEMA TYPES & VALIDATION ========

// User types
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Organization types
export type Organization = typeof organizations.$inferSelect;
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Property types
export type Property = typeof properties.$inferSelect;
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;

// Property Image types
export type PropertyImage = typeof propertyImages.$inferSelect;
export const insertPropertyImageSchema = createInsertSchema(propertyImages).omit({ id: true });
export type InsertPropertyImage = z.infer<typeof insertPropertyImageSchema>;

// Valuation types
export type Valuation = typeof valuations.$inferSelect;
export const insertValuationSchema = createInsertSchema(valuations).omit({ id: true });
export type InsertValuation = z.infer<typeof insertValuationSchema>;

// Comparable Property types
export type ComparableProperty = typeof comparableProperties.$inferSelect;
export const insertComparablePropertySchema = createInsertSchema(comparableProperties).omit({
  id: true,
});
export type InsertComparableProperty = z.infer<typeof insertComparablePropertySchema>;

// Order types
export type Order = typeof orders.$inferSelect;
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Order Status Update types
export type OrderStatusUpdate = typeof orderStatusUpdates.$inferSelect;
export const insertOrderStatusUpdateSchema = createInsertSchema(orderStatusUpdates).omit({
  id: true,
});
export type InsertOrderStatusUpdate = z.infer<typeof insertOrderStatusUpdateSchema>;

// Report types
export type Report = typeof reports.$inferSelect;
export const insertReportSchema = createInsertSchema(reports).omit({ id: true });
export type InsertReport = z.infer<typeof insertReportSchema>;

// Model Inference types
export type ModelInference = typeof modelInferences.$inferSelect;
export const insertModelInferenceSchema = createInsertSchema(modelInferences).omit({ id: true });
export type InsertModelInference = z.infer<typeof insertModelInferenceSchema>;

// Real Estate Term types
export type RealEstateTerm = typeof realEstateTerms.$inferSelect;
export const insertRealEstateTermSchema = createInsertSchema(realEstateTerms).omit({ id: true });
export type InsertRealEstateTerm = z.infer<typeof insertRealEstateTermSchema>;

// Field Note types
export type FieldNote = typeof fieldNotes.$inferSelect;
export const insertFieldNoteSchema = createInsertSchema(fieldNotes);
export type InsertFieldNote = z.infer<typeof insertFieldNoteSchema>;

// Field Note validation schema for client-side
export const fieldNoteSchema = z.object({
  id: z.string().uuid().optional(),
  parcelId: z.string(),
  text: z.string(),
  createdAt: z.string().or(z.date()),
  createdBy: z.string().optional(),
  userId: z.number().optional(),
});

// MLS System types
export type MlsSystem = typeof mlsSystems.$inferSelect;
export const insertMlsSystemSchema = createInsertSchema(mlsSystems).omit({ id: true });
export type InsertMlsSystem = z.infer<typeof insertMlsSystemSchema>;

// MLS Field Mapping types
export type MlsFieldMapping = typeof mlsFieldMappings.$inferSelect;
export const insertMlsFieldMappingSchema = createInsertSchema(mlsFieldMappings).omit({ id: true });
export type InsertMlsFieldMapping = z.infer<typeof insertMlsFieldMappingSchema>;

// MLS Property Mapping types
export type MlsPropertyMapping = typeof mlsPropertyMappings.$inferSelect;
export const insertMlsPropertyMappingSchema = createInsertSchema(mlsPropertyMappings).omit({
  id: true,
});
export type InsertMlsPropertyMapping = z.infer<typeof insertMlsPropertyMappingSchema>;

// Comparable Sale types
export type ComparableSale = typeof comparableSales.$inferSelect;
export const insertComparableSaleSchema = createInsertSchema(comparableSales).omit({ id: true });
export type InsertComparableSale = z.infer<typeof insertComparableSaleSchema>;

// MLS Comparable Mapping types
export type MlsComparableMapping = typeof mlsComparableMappings.$inferSelect;
export const insertMlsComparableMappingSchema = createInsertSchema(mlsComparableMappings).omit({
  id: true,
});
export type InsertMlsComparableMapping = z.infer<typeof insertMlsComparableMappingSchema>;

// Review Request types
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({ id: true });
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;

// Comment types
export type Comment = typeof comments.$inferSelect;
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Annotation types
export type Annotation = typeof annotations.$inferSelect;
export const insertAnnotationSchema = createInsertSchema(annotations).omit({ id: true });
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

// Revision History types
export type RevisionHistory = typeof revisionHistory.$inferSelect;
export const insertRevisionHistorySchema = createInsertSchema(revisionHistory).omit({ id: true });
export type InsertRevisionHistory = z.infer<typeof insertRevisionHistorySchema>;

// Conversion History types
export type ConversionHistory = typeof conversionHistory.$inferSelect;
export const insertConversionHistorySchema = createInsertSchema(conversionHistory).omit({
  id: true,
});
export type InsertConversionHistory = z.infer<typeof insertConversionHistorySchema>;

// Conversion Template types
export type ConversionTemplate = typeof conversionTemplates.$inferSelect;
export const insertConversionTemplateSchema = createInsertSchema(conversionTemplates).omit({
  id: true,
});
export type InsertConversionTemplate = z.infer<typeof insertConversionTemplateSchema>;

// Appraisal Report types
export type AppraisalReport = typeof appraisalReports.$inferSelect;
export const insertAppraisalReportSchema = createInsertSchema(appraisalReports).omit({ id: true });
export type InsertAppraisalReport = z.infer<typeof insertAppraisalReportSchema>;

// Photo types
export type Photo = typeof photos.$inferSelect;
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

// Sketch types
export type Sketch = typeof sketches.$inferSelect;
export const insertSketchSchema = createInsertSchema(sketches).omit({ id: true });
export type InsertSketch = z.infer<typeof insertSketchSchema>;

// Compliance Check types
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({ id: true });
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

// Legacy Import Job types
export type LegacyImportJob = typeof legacyImportJobs.$inferSelect;
export const insertLegacyImportJobSchema = createInsertSchema(legacyImportJobs).omit({ id: true });
export type InsertLegacyImportJob = z.infer<typeof insertLegacyImportJobSchema>;

// Legacy Import Record types
export type LegacyImportRecord = typeof legacyImportRecords.$inferSelect;
export const insertLegacyImportRecordSchema = createInsertSchema(legacyImportRecords).omit({
  id: true,
});
export type InsertLegacyImportRecord = z.infer<typeof insertLegacyImportRecordSchema>;

// Legacy System Template types
export type LegacySystemTemplate = typeof legacySystemTemplates.$inferSelect;
export const insertLegacySystemTemplateSchema = createInsertSchema(legacySystemTemplates).omit({
  id: true,
});
export type InsertLegacySystemTemplate = z.infer<typeof insertLegacySystemTemplateSchema>;
