import { db } from './db';
import { UserRole } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function initDatabase() {
  console.log('Initializing database with test data...');
  
  try {
    // Check if test user exists
    const usersResult = await db.execute(sql`SELECT * FROM users WHERE username = 'testuser'`);
    const existingUser = usersResult.rows.length > 0 ? usersResult.rows[0] : null;
    
    console.log('Test user found:', existingUser);
    
    // Check if test organization exists
    const orgsResult = await db.execute(sql`SELECT * FROM organizations WHERE slug = 'test-org'`);
    const existingOrg = orgsResult.rows.length > 0 ? orgsResult.rows[0] : null;
    
    let orgId;
    
    if (existingOrg) {
      console.log('Test organization already exists:', existingOrg.id);
      orgId = existingOrg.id;
    } else {
      // Create test organization with raw SQL to match the actual schema
      const newOrgResult = await db.execute(
        sql`INSERT INTO organizations (name, slug, description) 
            VALUES ('Test Organization', 'test-org', 'This is a test organization') 
            RETURNING *`
      );
      
      const newOrg = newOrgResult.rows[0];
      console.log('Created test organization:', newOrg);
      orgId = newOrg.id;
    }
    
    // Check if user is already a member of the organization
    if (existingUser) {
      const orgMemberResult = await db.execute(
        sql`SELECT * FROM organization_members 
            WHERE "userId" = ${existingUser.id} AND "organizationId" = ${orgId}`
      );
      
      if (orgMemberResult.rows.length === 0) {
        // Add test user to organization
        await db.execute(
          sql`INSERT INTO organization_members ("userId", "organizationId", role)
              VALUES (${existingUser.id}, ${orgId}, ${UserRole.ADMIN})`
        );
        
        console.log('Added test user to organization with role: admin');
      } else {
        console.log('User is already a member of the organization');
      }
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Run the initialization function
initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during initialization:', error);
    process.exit(1);
  });