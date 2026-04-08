/**
 * Database Conversion Schema Updates
 * 
 * This script adds the necessary tables to the database schema
 * for tracking database conversion projects.
 */

const fs = require('fs').promises;
const path = require('path');

async function updateSchema() {
  try {
    console.log('Updating schema with database conversion tables...');
    
    // Path to schema file
    const schemaFilePath = path.join(__dirname, '../../../shared/schema.ts');
    
    // Read the current schema file
    const schemaContent = await fs.readFile(schemaFilePath, 'utf-8');
    
    // Check if the conversion project table already exists
    if (schemaContent.includes('export const conversionProjects =')) {
      console.log('Conversion project table already exists in schema. No update needed.');
      return;
    }
    
    // New table definitions to add
    const newTables = `
// =================== Database Conversion Tables ===================

/**
 * Table for tracking database conversion projects
 */
export const conversionProjects = pgTable("conversion_projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sourceConfig: jsonb("source_config").notNull(),
  targetConfig: jsonb("target_config").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").default(0),
  currentStage: text("current_stage"),
  schemaAnalysis: jsonb("schema_analysis"),
  migrationPlan: jsonb("migration_plan"),
  migrationResult: jsonb("migration_result"),
  compatibilityResult: jsonb("compatibility_result"),
  validationResult: jsonb("validation_result"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: jsonb("metadata")
});

export const insertConversionProjectSchema = createInsertSchema(conversionProjects);
export type ConversionProject = typeof conversionProjects.$inferSelect;
export type InsertConversionProject = z.infer<typeof insertConversionProjectSchema>;

/**
 * Table for tracking database conversion logs
 */
export const conversionLogs = pgTable("conversion_logs", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => conversionProjects.id, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  details: jsonb("details")
});

export const insertConversionLogSchema = createInsertSchema(conversionLogs);
export type ConversionLog = typeof conversionLogs.$inferSelect;
export type InsertConversionLog = z.infer<typeof insertConversionLogSchema>;

/**
 * Table for storing database connection templates
 */
export const connectionTemplates = pgTable("connection_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  databaseType: text("database_type").notNull(),
  connectionConfig: jsonb("connection_config").notNull(),
  isPublic: boolean("is_public").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertConnectionTemplateSchema = createInsertSchema(connectionTemplates);
export type ConnectionTemplate = typeof connectionTemplates.$inferSelect;
export type InsertConnectionTemplate = z.infer<typeof insertConnectionTemplateSchema>;
`;
    
    // Find the position to insert the new tables (before the last export statement)
    const lastExportIndex = schemaContent.lastIndexOf('export ');
    if (lastExportIndex === -1) {
      throw new Error('Could not find a suitable position to insert new tables');
    }
    
    // Find the start of the line containing the last export
    let insertPosition = schemaContent.lastIndexOf('\n', lastExportIndex);
    if (insertPosition === -1) {
      insertPosition = 0;
    }
    
    // Insert the new tables
    const updatedContent = 
      schemaContent.slice(0, insertPosition) + 
      newTables + 
      schemaContent.slice(insertPosition);
    
    // Write the updated schema back to the file
    await fs.writeFile(schemaFilePath, updatedContent, 'utf-8');
    
    console.log('Schema updated successfully with database conversion tables.');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

// Run the update
updateSchema();