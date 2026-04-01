/**
 * Adapt Schema to Database Script
 * 
 * Instead of changing the database to match the schema,
 * this script updates the schema in shared/schema.ts to match the
 * existing database structure.
 * 
 * Usage: node scripts/adapt-schema-to-database.js
 */

import fs from 'fs';
import path from 'path';

async function adaptSchemaToDB() {
  try {
    console.log('Starting to adapt schema to match database...');
    
    const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      return;
    }
    
    // Read the current schema
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Replace development_projects table with dev_projects
    let updatedContent = schemaContent.replace(
      /export const developmentProjects = pgTable\('development_projects',/g,
      "export const developmentProjects = pgTable('dev_projects',"
    );
    
    // Change primary key from 'id' to 'project_id'
    updatedContent = updatedContent.replace(
      /id: serial\('id'\)\.primaryKey\(\),/g,
      "project_id: text('project_id').primaryKey(),"
    );
    
    // Remove id field from the development projects insert schema if it exists
    updatedContent = updatedContent.replace(
      /export const insertDevProjectSchema = createInsertSchema\(developmentProjects\).*?\.omit\(\{.*?id.*?\}\);/gs,
      "export const insertDevProjectSchema = createInsertSchema(developmentProjects).omit({ project_id: true });"
    );
    
    // Write the updated schema back to the file
    fs.writeFileSync(schemaPath, updatedContent);
    
    console.log('Successfully updated schema to match database structure');
    console.log('Changes made:');
    console.log('1. Changed table name from "development_projects" to "dev_projects"');
    console.log('2. Changed primary key from "id" to "project_id"');
    console.log('3. Updated insert schema to omit project_id instead of id');
  } catch (error) {
    console.error('Error adapting schema to database:', error);
    throw error;
  }
}

// Run the function
adaptSchemaToDB()
  .then(() => {
    console.log('Schema adaptation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to adapt schema to database:', error);
    process.exit(1);
  });

export { adaptSchemaToDB };