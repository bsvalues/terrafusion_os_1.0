import { faker } from '@faker-js/faker';
import { storage } from './storage';
import { InsertAudit, InsertAuditEvent, InsertUser, InsertDocument } from '@shared/schema';

// Property types matching schema enum
const PROPERTY_TYPES = ['residential', 'commercial', 'agricultural', 'industrial'] as const;

// Audit types matching schema enum
const AUDIT_TYPES = [
  'standard',
  'complex',
  'commercial',
  'residential',
  'agriculture',
  'appeal',
  'correction',
] as const;

// Statuses matching schema enum
const AUDIT_STATUSES = [
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'needs_info',
  'under_review',
] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

const EVENT_TYPES = [
  'created',
  'assigned',
  'status_changed',
  'comment_added',
  'document_uploaded',
  'value_updated',
  'inspection_scheduled',
  'inspection_completed',
  'approved',
  'rejected',
] as const;

// Generate realistic county addresses
function generateCountyAddress(): string {
  const streetNumbers = [
    faker.number.int({ min: 100, max: 9999 }),
    faker.number.int({ min: 10, max: 999 }) + faker.helpers.arrayElement(['A', 'B', 'C', '']),
  ];

  const streetNames = [
    'Main',
    'Oak',
    'Elm',
    'Maple',
    'Pine',
    'Cedar',
    'Park',
    'Church',
    'School',
    'Washington',
    'Lincoln',
    'Jefferson',
    'Madison',
    'Franklin',
    'Jackson',
    'River',
    'Hill',
    'Valley',
    'Ridge',
    'Creek',
    'Lake',
    'Forest',
  ];

  const streetTypes = ['St', 'Ave', 'Rd', 'Dr', 'Ln', 'Ct', 'Pl', 'Way', 'Blvd'];

  return `${faker.helpers.arrayElement(streetNumbers)} ${faker.helpers.arrayElement(streetNames)} ${faker.helpers.arrayElement(streetTypes)}`;
}

// Generate realistic assessment values
function generateAssessmentValue(propertyType: string): number {
  const baseValues = {
    'Single Family Residence': { min: 150000, max: 800000 },
    'Commercial Office Building': { min: 500000, max: 5000000 },
    'Industrial Warehouse': { min: 300000, max: 2000000 },
    'Retail Shopping Center': { min: 1000000, max: 10000000 },
    'Multi-Family Apartment': { min: 400000, max: 3000000 },
    'Vacant Land': { min: 25000, max: 500000 },
    'Agricultural Property': { min: 50000, max: 1000000 },
    'Mixed-Use Development': { min: 800000, max: 8000000 },
    'Mobile Home Park': { min: 200000, max: 1500000 },
    'Government Building': { min: 1000000, max: 15000000 },
  };

  const range = baseValues[propertyType as keyof typeof baseValues] || {
    min: 100000,
    max: 1000000,
  };
  return faker.number.int({ min: range.min, max: range.max });
}

// Generate realistic audit issues and notes
function generateAuditIssues(): string[] {
  const commonIssues = [
    'Property assessment appears 15% above market comparables',
    'Missing square footage documentation for recent addition',
    'Zoning classification needs verification',
    'Property improvements not reflected in current assessment',
    'Discrepancy between GIS data and field measurements',
    'Commercial property tax exemption status requires review',
    'Agricultural land use classification under review',
    'Building permit records show unreported modifications',
    'Comparable sales analysis indicates potential overvaluation',
    'Environmental impact study pending for industrial classification',
    'Historic preservation status affects assessment methodology',
    'Multi-unit property rental income verification needed',
  ];

  return faker.helpers.arrayElements(commonIssues, { min: 1, max: 3 });
}

// Generate realistic comments for audit events
function generateEventComment(eventType: string): string {
  const commentTemplates = {
    created: [
      'Initial audit request submitted for property assessment review',
      'New audit case opened based on taxpayer appeal',
      'Assessment discrepancy identified during routine review',
    ],
    assigned: [
      'Audit assigned to senior assessor for detailed review',
      'Case forwarded to specialist team for complex property evaluation',
      'Audit reassigned due to workload balancing',
    ],
    status_changed: [
      'Status updated following field inspection completion',
      'Moving to next phase of assessment review process',
      'Case status changed pending additional documentation',
    ],
    comment_added: [
      'Additional notes added following taxpayer meeting',
      'Assessor observations recorded after site visit',
      'Stakeholder feedback incorporated into case file',
    ],
    document_uploaded: [
      'Property deed and survey documents uploaded to case file',
      'Building permit records added for compliance verification',
      'Comparative market analysis attached to support findings',
    ],
    value_updated: [
      'Assessment value adjusted based on new evidence',
      'Property valuation updated following appeals board decision',
      'Assessment corrected to reflect current market conditions',
    ],
    approved: [
      'Audit completed successfully with no adjustments required',
      'Assessment confirmed accurate based on comprehensive review',
      'Property valuation approved following thorough analysis',
    ],
    rejected: [
      'Assessment appeal rejected - current valuation upheld',
      'Audit findings do not support requested value adjustment',
      'Insufficient evidence provided to justify assessment change',
    ],
  };

  const templates = commentTemplates[eventType as keyof typeof commentTemplates];
  return templates
    ? faker.helpers.arrayElement(templates)
    : 'Standard audit process step completed';
}

export class TestDataGenerator {
  async generateRealisticUsers(count: number = 10): Promise<void> {
    const users: InsertUser[] = [];
    const roles = ['admin', 'supervisor', 'auditor', 'analyst'];

    // Create a predictable admin user for testing
    users.push({
      username: 'admin',
      email: 'admin@county.gov',
      password: 'admin123', // This will be hashed by the storage layer
      role: 'admin',
      firstName: 'County',
      lastName: 'Administrator',
    });

    // Generate additional realistic users
    for (let i = 0; i < count - 1; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      users.push({
        username: faker.internet.username({ firstName, lastName }).toLowerCase(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@county.gov`,
        password: faker.internet.password({ length: 12 }),
        role: faker.helpers.arrayElement(roles),
        firstName,
        lastName,
      });
    }

    // Create users in database
    for (const user of users) {
      try {
        await storage.createUser(user);
        console.log(`Created user: ${user.username} (${user.role})`);
      } catch (error) {
        console.log(`User ${user.username} may already exist, skipping...`);
      }
    }
  }

  async generateRealisticAudits(count: number = 50): Promise<void> {
    const audits: InsertAudit[] = [];

    for (let i = 0; i < count; i++) {
      const propertyType = faker.helpers.arrayElement(PROPERTY_TYPES);
      const assessmentValue = generateAssessmentValue(propertyType);
      const issues = generateAuditIssues();

      // Generate realistic audit numbers
      const auditNumber = `A-${new Date().getFullYear()}-${(1000 + i).toString()}`;

      // Generate realistic dates (last 6 months)
      const createdDate = faker.date.recent({ days: 180 });
      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 14, max: 90 }));

      audits.push({
        auditNumber,
        title: `${propertyType} Assessment Review - ${generateCountyAddress()}`,
        description: `Assessment audit for ${propertyType.toLowerCase()} property. Issues identified: ${issues.join('; ')}. Current assessed value: $${assessmentValue.toLocaleString()}.`,
        propertyType,
        propertyAddress: generateCountyAddress(),
        assessedValue: assessmentValue,
        status: faker.helpers.arrayElement(AUDIT_STATUSES),
        priority: faker.helpers.arrayElement(PRIORITIES),
        assignedUserId: faker.number.int({ min: 1, max: 10 }), // Assuming 10 users exist
        createdById: faker.number.int({ min: 1, max: 10 }),
        dueDate,
        createdAt: createdDate,
        updatedAt: faker.date.between({ from: createdDate, to: new Date() }),
      });
    }

    // Create audits in database
    for (const audit of audits) {
      try {
        const createdAudit = await storage.createAudit(audit);
        console.log(`Created audit: ${audit.auditNumber} - ${audit.propertyType}`);

        // Generate realistic audit events for each audit
        await this.generateAuditEvents(createdAudit.id, audit.createdAt!);
      } catch (error) {
        console.error(`Failed to create audit ${audit.auditNumber}:`, error);
      }
    }
  }

  async generateAuditEvents(auditId: number, auditCreatedDate: Date): Promise<void> {
    const eventCount = faker.number.int({ min: 2, max: 8 });
    const events: InsertAuditEvent[] = [];

    let currentDate = new Date(auditCreatedDate);

    // Always start with creation event
    events.push({
      auditId,
      userId: faker.number.int({ min: 1, max: 10 }),
      eventType: 'created',
      description: generateEventComment('created'),
      createdAt: currentDate,
    });

    // Generate additional events in chronological order
    for (let i = 1; i < eventCount; i++) {
      // Advance time by 1-14 days
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + faker.number.int({ min: 1, max: 14 }));

      const eventType = faker.helpers.arrayElement(EVENT_TYPES.slice(1)); // Skip 'created'

      events.push({
        auditId,
        userId: faker.number.int({ min: 1, max: 10 }),
        eventType,
        description: generateEventComment(eventType),
        metadata:
          eventType === 'value_updated'
            ? {
                oldValue: faker.number.int({ min: 100000, max: 1000000 }),
                newValue: faker.number.int({ min: 100000, max: 1000000 }),
                reason: 'Based on new comparable sales data',
              }
            : undefined,
        createdAt: currentDate,
      });
    }

    // Create events in database
    for (const event of events) {
      try {
        await storage.createAuditEvent(event);
      } catch (error) {
        console.error(`Failed to create event for audit ${auditId}:`, error);
      }
    }
  }

  async generateSampleDocuments(auditCount: number = 20): Promise<void> {
    const documentTypes = [
      'Property Deed',
      'Survey Report',
      'Building Permit',
      'Inspection Report',
      'Tax Assessment',
      'Market Analysis',
      'Appeal Letter',
      'Photo Documentation',
      'Zoning Certificate',
      'Environmental Report',
    ];

    // Generate 1-4 documents per audit for the first 20 audits
    for (let auditId = 1; auditId <= auditCount; auditId++) {
      const docCount = faker.number.int({ min: 1, max: 4 });

      for (let i = 0; i < docCount; i++) {
        const docType = faker.helpers.arrayElement(documentTypes);
        const fileName = `${docType.replace(/\s+/g, '_').toLowerCase()}_${auditId}_${i + 1}.pdf`;

        const document: InsertDocument = {
          auditId,
          fileName,
          originalName: `${docType} - Property ${auditId}.pdf`,
          mimeType: 'application/pdf',
          fileSize: faker.number.int({ min: 50000, max: 5000000 }), // 50KB to 5MB
          uploadedById: faker.number.int({ min: 1, max: 10 }),
          uploadedAt: faker.date.recent({ days: 30 }),
        };

        try {
          await storage.createDocument(document);
        } catch (error) {
          console.error(`Failed to create document for audit ${auditId}:`, error);
        }
      }
    }
  }

  async generateCompleteTestSuite(): Promise<void> {
    console.log('🚀 Starting comprehensive test data generation...');

    try {
      console.log('👥 Generating realistic users...');
      await this.generateRealisticUsers(12);

      console.log('📋 Generating realistic audits...');
      await this.generateRealisticAudits(75);

      console.log('📄 Generating sample documents...');
      await this.generateSampleDocuments(25);

      console.log('✅ Test data generation completed successfully!');
      console.log('📊 Generated:');
      console.log('   • 12 realistic county staff users');
      console.log('   • 75 property assessment audits');
      console.log('   • 300+ audit events and status changes');
      console.log('   • 50+ document attachments');
      console.log('💡 You can now log in with username: admin, password: admin123');
    } catch (error) {
      console.error('❌ Test data generation failed:', error);
      throw error;
    }
  }
}

export const testDataGenerator = new TestDataGenerator();
