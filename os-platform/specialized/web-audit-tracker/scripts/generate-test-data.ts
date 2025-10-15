import { faker } from '@faker-js/faker';
import { storage } from '../server/storage';

async function generateTestData() {
  console.log('🚀 Generating comprehensive test data...');

  try {
    // Create test users
    const testUsers = [
      {
        username: 'admin',
        password: 'admin123',
        fullName: 'County Administrator',
        email: 'admin@county.gov',
        role: 'admin',
      },
      {
        username: 'supervisor1',
        password: 'super123',
        fullName: 'Jane Supervisor',
        email: 'jane.supervisor@county.gov',
        role: 'supervisor',
      },
      {
        username: 'auditor1',
        password: 'audit123',
        fullName: 'John Auditor',
        email: 'john.auditor@county.gov',
        role: 'auditor',
      },
      {
        username: 'auditor2',
        password: 'audit123',
        fullName: 'Sarah Smith',
        email: 'sarah.smith@county.gov',
        role: 'auditor',
      },
      {
        username: 'analyst1',
        password: 'analyst123',
        fullName: 'Mike Analyst',
        email: 'mike.analyst@county.gov',
        role: 'auditor',
      },
    ];

    for (const user of testUsers) {
      try {
        await storage.createUser(user);
        console.log(`✓ Created user: ${user.username}`);
      } catch (error) {
        console.log(`User ${user.username} already exists, skipping...`);
      }
    }

    // Generate realistic audits
    const propertyTypes = ['residential', 'commercial', 'agricultural', 'industrial'];
    const auditTypes = ['standard', 'complex', 'appeal', 'correction'];
    const statuses = ['pending', 'in_progress', 'approved', 'rejected', 'needs_info'];
    const priorities = ['low', 'normal', 'high', 'urgent'];

    for (let i = 1; i <= 30; i++) {
      const propertyType = faker.helpers.arrayElement(propertyTypes);
      const auditType = faker.helpers.arrayElement(auditTypes);
      const status = faker.helpers.arrayElement(statuses);
      const priority = faker.helpers.arrayElement(priorities);

      const currentAssessment = faker.number.int({ min: 50000, max: 2000000 });
      const proposedAssessment = Math.round(
        currentAssessment * faker.number.float({ min: 0.8, max: 1.3 })
      );

      const audit = {
        auditNumber: `A-2025-${(1000 + i).toString()}`,
        title: `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Property Assessment`,
        description: `Assessment review for ${propertyType} property requiring ${auditType} evaluation process.`,
        propertyId: `PROP-${faker.number.int({ min: 100000, max: 999999 })}`,
        address: `${faker.number.int({ min: 100, max: 9999 })} ${faker.location.streetAddress()}`,
        currentAssessment,
        proposedAssessment,
        taxImpact: Math.round((proposedAssessment - currentAssessment) * 0.012), // Approximate tax rate
        reason: faker.helpers.arrayElement([
          'Market value adjustment based on recent sales',
          'Property improvement assessment update',
          'Taxpayer appeal review',
          'Routine assessment verification',
          'Zoning classification update',
        ]),
        status: status as any,
        priority: priority as any,
        auditType: auditType as any,
        propertyType: propertyType as any,
        submittedById: faker.number.int({ min: 1, max: 5 }),
        dueDate: faker.date.future({ years: 0.5 }),
        assignedToId: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), {
          probability: 0.8,
        }),
      };

      try {
        const createdAudit = await storage.createAudit(audit);
        console.log(`✓ Created audit: ${audit.auditNumber}`);

        // Add some audit events
        const eventTypes = ['created', 'assigned', 'status_changed', 'comment_added'];
        const eventCount = faker.number.int({ min: 1, max: 4 });

        for (let j = 0; j < eventCount; j++) {
          const event = {
            auditId: createdAudit.id,
            userId: faker.number.int({ min: 1, max: 5 }),
            eventType: faker.helpers.arrayElement(eventTypes),
            comment: faker.helpers.arrayElement([
              'Initial audit review started',
              'Property documentation received',
              'Field inspection scheduled',
              'Assessment calculation completed',
              'Review findings documented',
            ]),
          };

          await storage.createAuditEvent(event);
        }
      } catch (error) {
        console.error(`Failed to create audit ${audit.auditNumber}:`, error);
      }
    }

    console.log('✅ Test data generation completed!');
    console.log('📊 Generated: 5 users, 30 audits, and multiple audit events');
    console.log('🔐 Login with: admin / admin123');
  } catch (error) {
    console.error('❌ Test data generation failed:', error);
    throw error;
  }
}

// Run if called directly (ES module compatible)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the main module
if (process.argv[1] === __filename) {
  generateTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { generateTestData };
