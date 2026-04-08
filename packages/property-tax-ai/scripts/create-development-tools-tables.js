/**
 * Development Tools Tables Setup Script
 * 
 * This script creates all the required database tables for the TaxI_AI Development Tools Platform.
 * It sets up tables for the UI/UX design tools, business intelligence tools, developer productivity tools,
 * collaboration tools, data integration tools, and experimental features.
 * 
 * Usage: node scripts/create-development-tools-tables.js
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function createDevelopmentToolsTables() {
  console.log('Creating development tools tables...');
  
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });
  
  try {
    // UI/UX Design Tools tables
    await db.execute(schema.developmentProjects.createIfNotExists);
    await db.execute(schema.developmentProjectFiles.createIfNotExists);
    await db.execute(schema.uiComponentTemplates.createIfNotExists);
    await db.execute(schema.designSystems.createIfNotExists);
    
    // Business Intelligence & Visualization tables
    await db.execute(schema.dataVisualizations.createIfNotExists);
    
    // Developer Productivity Tools tables
    await db.execute(schema.codeSnippets.createIfNotExists);
    await db.execute(schema.debuggingSessions.createIfNotExists);
    await db.execute(schema.apiDocumentation.createIfNotExists);
    
    // Collaboration & Knowledge Sharing tables
    await db.execute(schema.teamCollaborationSessions.createIfNotExists);
    await db.execute(schema.learningPaths.createIfNotExists);
    
    // Data Integration & Processing tables
    await db.execute(schema.dataPipelines.createIfNotExists);
    
    // Create indexes for improved performance
    
    // Code Snippets indexes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_code_snippets_language ON code_snippets (language);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_type ON code_snippets (snippet_type);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_created_by ON code_snippets (created_by);
    `);
    
    // Data Visualizations indexes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_data_visualizations_type ON data_visualizations (visualization_type);
      CREATE INDEX IF NOT EXISTS idx_data_visualizations_created_by ON data_visualizations (created_by);
    `);
    
    // UI Component Templates indexes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_ui_component_templates_type ON ui_component_templates (component_type);
      CREATE INDEX IF NOT EXISTS idx_ui_component_templates_framework ON ui_component_templates (framework);
      CREATE INDEX IF NOT EXISTS idx_ui_component_templates_created_by ON ui_component_templates (created_by);
    `);
    
    // Add custom triggers for automated timestamp updates
    await db.execute(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_code_snippets_updated_at ON code_snippets;
      CREATE TRIGGER update_code_snippets_updated_at
      BEFORE UPDATE ON code_snippets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_data_visualizations_updated_at ON data_visualizations;
      CREATE TRIGGER update_data_visualizations_updated_at
      BEFORE UPDATE ON data_visualizations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_ui_component_templates_updated_at ON ui_component_templates;
      CREATE TRIGGER update_ui_component_templates_updated_at
      BEFORE UPDATE ON ui_component_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('Development tools tables and indexes created successfully');
  } catch (error) {
    console.error('Error creating development tools tables:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDevelopmentToolsTables().catch(console.error);