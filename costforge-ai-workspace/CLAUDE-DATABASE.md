# CLAUDE Database Schema Guide

This file provides comprehensive guidance for working with the database schema in the TerraFusion TerraBuild Modernization platform.

## Database Overview

- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (production) with SQLite support (development fallback)
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migration Strategy**: Schema push via `drizzle-kit push` (no traditional migrations)
- **Naming Convention**: camelCase in TypeScript, snake_case in database

## Schema Structure

The database is organized into logical domains:

### 1. Users & Authentication
- `sessions` - OIDC session storage (Replit Auth)
- `users` - User accounts and profiles
- `userSessions` - Legacy session tracking

### 2. Properties & Improvements
- `properties` - Core property records with geospatial data
- `improvements` - Building improvements linked to properties
- `improvementDetails` - Granular improvement component data
- `landDetails` - Land characteristics and valuations

### 3. Cost Matrix & Factors
- `costMatrix` - Cost calculation matrix (region × building type)
- `buildingTypes` - Building type definitions and base rates
- `regions` - Geographic regions with adjustment multipliers
- `qualityFactors` - Quality grade multipliers
- `conditionFactors` - Condition assessment multipliers
- `ageFactors` - Age-based depreciation factors
- `matrixDetail` - Detailed cost matrix breakdowns

### 4. Calculations & History
- `calculations` (aka `calculation_history`) - User calculation records
- `costFactorPresets` - Saved cost factor combinations
- `whatIfScenarios` - What-if analysis scenarios
- `scenarioItems` - Items within what-if scenarios

### 5. Collaboration & Projects
- `projects` - Collaborative project workspaces
- `projectMembers` - Project membership and roles
- `projectSharedLinks` - Public/private sharing links
- `projectActivities` - Activity logs for projects
- `comments` - User comments on calculations/projects

### 6. Data Management
- `files` - File uploads and attachments
- `ftpConnections` - FTP data source configurations
- `connectionHistory` - FTP connection audit log
- `importJobs` - Data import job tracking
- `dataQualityReports` - Data quality validation reports

### 7. External Integrations
- `externalApis` - External API configurations
- `apiRequests` - API request/response logs
- `supabaseConnections` - Supabase integration configs

### 8. MCP Agents & AI
- `agentStatus` - MCP agent monitoring and status
- `agentEvents` - Inter-agent event log (for replay/audit)

## Key Tables Deep Dive

### Properties Table

Core table for property records:

```typescript
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: uuid('property_id').defaultRandom().notNull().unique(),
  parcelId: text('parcel_id').notNull().unique(),  // County parcel ID
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  county: text('county').notNull().default('Benton'),
  ownerName: text('owner_name'),
  latitude: real('latitude'),      // Geospatial coordinates
  longitude: real('longitude'),
  propertyType: text('property_type').notNull(),  // RESIDENTIAL, COMMERCIAL, etc.
  zoning: text('zoning'),
  acreage: real('acreage'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastAssessment: timestamp('last_assessment'),
  assessedValue: integer('assessed_value'),
  totalValue: integer('total_value'),
  landValue: integer('land_value'),
  metaData: json('meta_data').$type<Record<string, any>>(),
});
```

**Key Patterns**:
- Dual ID system: `id` (serial) for database relations, `propertyId` (UUID) for API/external references
- `parcelId` is unique per county (e.g., "BEN-123-456")
- Geospatial data (`latitude`, `longitude`) for mapping features
- `metaData` JSON field for flexible additional data
- Timestamps track creation and updates

### Improvements Table

Building improvements linked to properties:

```typescript
export const improvements = pgTable('improvements', {
  id: serial('id').primaryKey(),
  improvementId: uuid('improvement_id').defaultRandom().notNull().unique(),
  propertyId: uuid('property_id').notNull()
    .references(() => properties.propertyId, { onDelete: 'cascade' }),
  buildingType: text('building_type').notNull(),
  description: text('description').notNull(),
  yearBuilt: integer('year_built').notNull(),
  quality: text('quality').notNull(),        // LOW, STANDARD, HIGH, LUXURY
  condition: text('condition').notNull(),    // POOR, FAIR, GOOD, EXCELLENT
  squareFeet: integer('square_feet').notNull(),
  stories: integer('stories').notNull().default(1),

  // Building characteristics
  basementType: text('basement_type'),
  basementFinished: boolean('basement_finished').default(false),
  exteriorWall: text('exterior_wall'),
  roofType: text('roof_type'),
  heatingType: text('heating_type'),
  coolingType: text('cooling_type'),
  garageType: text('garage_type'),
  garageSquareFeet: integer('garage_square_feet').default(0),

  // Cost calculations
  costPerSqFt: real('cost_per_sqft'),
  calculatedValue: integer('calculated_value'),
  depreciatedValue: integer('depreciated_value'),

  // Regional adjustments
  region: text('region').notNull().default('BC-CENTRAL'),
  adjustmentFactor: real('adjustment_factor').default(1.0),

  // Documentation
  documentReference: text('document_reference'),
  imageUrls: json('image_urls').$type<string[]>(),
  additionalFeatures: json('additional_features').$type<Record<string, any>>(),

  lastUpdated: timestamp('last_updated').defaultNow(),
});
```

**Key Patterns**:
- Cascade delete: when property is deleted, improvements are automatically deleted
- Rich building characteristics for detailed valuation
- Cost calculations stored for historical tracking
- Regional adjustment factors for Benton County regions
- JSON arrays for flexible image storage

### Cost Matrix Table

Core cost calculation matrix:

```typescript
export const costMatrix = pgTable('cost_matrix', {
  id: serial('id').primaryKey(),
  buildingType: text('building_type').notNull(),  // e.g., 'RESIDENTIAL', 'COMMERCIAL'
  region: text('region').notNull(),                // e.g., 'RICHLAND', 'KENNEWICK'
  year: integer('matrix_year').notNull(),          // Year of cost data
  baseRate: real('base_cost').notNull(),           // Base cost per square foot
  description: text('matrix_description'),

  // Source tracking
  sourceMatrixId: integer('source_matrix_id'),
  buildingTypeDescription: text('building_type_description'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),

  // Factor bases
  complexityFactorBase: real('complexity_factor_base').default(1.0),
  qualityFactorBase: real('quality_factor_base').default(1.0),
  conditionFactorBase: real('condition_factor_base').default(1.0),

  // Statistical data
  dataPoints: integer('data_points'),
  minCost: real('min_cost'),
  maxCost: real('max_cost'),

  // Location
  county: text('county'),
  state: text('state'),
});
```

**Key Patterns**:
- Composite key: `(buildingType, region, year)` uniquely identifies cost data
- `isActive` flag for historical data management
- Factor bases provide baseline multipliers
- Statistical fields track data quality and range
- Benton County specific with county/state tracking

### Users Table

User authentication and profiles:

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),  // Replit Auth ID
  username: text('username').unique().notNull(),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  profileImageUrl: text('profile_image_url'),
  role: text('role').default('user').notNull(),  // 'user', 'admin', 'assessor'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  preferences: json('preferences').$type<{
    theme?: string;
    notifications?: boolean;
  }>(),
});
```

**Key Patterns**:
- Text-based primary key (Replit Auth ID format)
- Role-based access control via `role` field
- JSON preferences for flexible user settings
- `isActive` for soft deletes
- Timestamps for audit trail

## Table Relationships

### Property → Improvements (One-to-Many)

```typescript
export const propertiesRelations = relations(properties, ({ many }) => ({
  improvements: many(improvements),
  landDetails: many(landDetails),
}));

export const improvementsRelations = relations(improvements, ({ one, many }) => ({
  property: one(properties, {
    fields: [improvements.propertyId],
    references: [properties.propertyId],
  }),
  details: many(improvementDetails),
}));
```

**Usage**:
```typescript
// Query property with all improvements
const property = await db.query.properties.findFirst({
  where: eq(properties.parcelId, 'BEN-123-456'),
  with: {
    improvements: true,
    landDetails: true,
  },
});

// Result includes nested improvements and landDetails
```

### User → Calculations (One-to-Many)

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  calculations: many(calculations),
  projects: many(projectMembers),
  comments: many(comments),
}));

export const calculationsRelations = relations(calculations, ({ one }) => ({
  user: one(users, {
    fields: [calculations.userId],
    references: [users.id],
  }),
}));
```

### Project Collaboration Structure

```typescript
// Projects
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  activities: many(projectActivities),
  sharedLinks: many(projectSharedLinks),
}));

// Project Members
export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));
```

## Common Query Patterns

### Inserting Data

```typescript
// Single insert with returning
const [property] = await db.insert(properties)
  .values({
    parcelId: 'BEN-123-456',
    address: '123 Main St',
    city: 'Richland',
    state: 'WA',
    zip: '99352',
    county: 'Benton',
    propertyType: 'RESIDENTIAL',
  })
  .returning();

// Multiple insert
await db.insert(improvements).values([
  { propertyId: property.propertyId, buildingType: 'HOUSE', ... },
  { propertyId: property.propertyId, buildingType: 'GARAGE', ... },
]);

// Insert or ignore duplicate
await db.insert(properties)
  .values(propertyData)
  .onConflictDoNothing({ target: properties.parcelId });

// Upsert (insert or update)
await db.insert(properties)
  .values(propertyData)
  .onConflictDoUpdate({
    target: properties.parcelId,
    set: { updatedAt: new Date() },
  });
```

### Querying Data

```typescript
import { eq, and, or, gt, lt, like, isNull } from 'drizzle-orm';

// Basic query
const property = await db.query.properties.findFirst({
  where: eq(properties.parcelId, 'BEN-123-456'),
});

// Multiple conditions
const results = await db.query.properties.findMany({
  where: and(
    eq(properties.county, 'Benton'),
    eq(properties.propertyType, 'RESIDENTIAL'),
    gt(properties.assessedValue, 200000)
  ),
  limit: 100,
  offset: 0,
});

// OR conditions
const results = await db.query.properties.findMany({
  where: or(
    eq(properties.city, 'Richland'),
    eq(properties.city, 'Kennewick')
  ),
});

// Pattern matching
const results = await db.query.properties.findMany({
  where: like(properties.address, '%Main St%'),
});

// Null checks
const results = await db.query.properties.findMany({
  where: isNull(properties.ownerName),
});

// With relationships
const property = await db.query.properties.findFirst({
  where: eq(properties.id, 1),
  with: {
    improvements: {
      with: {
        details: true,
      },
    },
    landDetails: true,
  },
});

// Ordering
const results = await db.query.properties.findMany({
  orderBy: (properties, { desc, asc }) => [
    desc(properties.assessedValue),
    asc(properties.parcelId),
  ],
});

// Select specific fields
const results = await db.select({
  id: properties.id,
  parcel: properties.parcelId,
  address: properties.address,
}).from(properties);
```

### Updating Data

```typescript
// Update with where clause
await db.update(properties)
  .set({
    assessedValue: 350000,
    updatedAt: new Date(),
  })
  .where(eq(properties.parcelId, 'BEN-123-456'));

// Update multiple rows
await db.update(properties)
  .set({ county: 'Benton' })
  .where(eq(properties.state, 'WA'));

// Update with returning
const [updated] = await db.update(properties)
  .set({ assessedValue: 350000 })
  .where(eq(properties.id, 1))
  .returning();
```

### Deleting Data

```typescript
// Delete with where clause
await db.delete(properties)
  .where(eq(properties.id, 1));

// Cascade deletes happen automatically
// Deleting a property will delete all improvements (due to onDelete: 'cascade')

// Soft delete pattern (set isActive = false)
await db.update(users)
  .set({ isActive: false })
  .where(eq(users.id, userId));
```

### Joins and Complex Queries

```typescript
// Manual join
const results = await db
  .select({
    property: properties,
    improvement: improvements,
  })
  .from(properties)
  .leftJoin(improvements, eq(properties.propertyId, improvements.propertyId))
  .where(eq(properties.county, 'Benton'));

// Aggregations
import { count, sum, avg } from 'drizzle-orm';

const stats = await db
  .select({
    totalProperties: count(),
    totalValue: sum(properties.assessedValue),
    avgValue: avg(properties.assessedValue),
  })
  .from(properties)
  .where(eq(properties.county, 'Benton'));

// Group by
const byCity = await db
  .select({
    city: properties.city,
    count: count(),
    totalValue: sum(properties.assessedValue),
  })
  .from(properties)
  .groupBy(properties.city);
```

### Transactions

```typescript
await db.transaction(async (tx) => {
  // Create property
  const [property] = await tx.insert(properties)
    .values(propertyData)
    .returning();

  // Create improvements
  await tx.insert(improvements)
    .values({
      propertyId: property.propertyId,
      ...improvementData,
    });

  // Create land details
  await tx.insert(landDetails)
    .values({
      propertyId: property.propertyId,
      ...landData,
    });

  // All or nothing - if any operation fails, entire transaction rolls back
});
```

## Type Safety

### Inferring Types from Schema

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { properties, improvements } from '@/shared/schema';

// Type for selecting (reading from database)
type Property = InferSelectModel<typeof properties>;
// {
//   id: number;
//   propertyId: string;
//   parcelId: string;
//   address: string;
//   ... all fields with their TypeScript types
// }

// Type for inserting (writing to database)
type NewProperty = InferInsertModel<typeof properties>;
// Same as Property but with optional auto-generated fields (id, timestamps, etc.)

// Use in functions
async function getProperty(id: number): Promise<Property | undefined> {
  return await db.query.properties.findFirst({
    where: eq(properties.id, id),
  });
}

async function createProperty(data: NewProperty): Promise<Property> {
  const [property] = await db.insert(properties)
    .values(data)
    .returning();
  return property;
}
```

### Validation with Zod

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { properties } from '@/shared/schema';

// Generate Zod schemas from Drizzle tables
const insertPropertySchema = createInsertSchema(properties, {
  // Override/refine specific fields
  parcelId: (schema) => schema.parcelId.regex(/^BEN-\d{3}-\d{3}$/),
  assessedValue: (schema) => schema.assessedValue.min(0),
});

const selectPropertySchema = createSelectSchema(properties);

// Validate data before insert
const validatedData = insertPropertySchema.parse(req.body);
await db.insert(properties).values(validatedData);
```

## Schema Changes and Migrations

### Making Schema Changes

1. **Modify** `shared/schema.ts`:
```typescript
// Add new column
export const properties = pgTable('properties', {
  // ... existing columns
  newField: text('new_field'),  // Add this
});
```

2. **Push to database**:
```bash
npm run db:push
```

This will:
- Analyze the schema changes
- Generate SQL to update the database
- Apply changes immediately
- **WARNING**: This is destructive - be careful with production databases

### Best Practices

1. **Always backup production database before schema changes**
2. **Test schema changes in development first**
3. **Add new columns as nullable or with defaults** to avoid breaking existing data
4. **Use transactions** for complex multi-table operations
5. **Validate data** with Zod schemas before inserting
6. **Use prepared statements** for repeated queries (performance)
7. **Index frequently queried columns** (add indexes via raw SQL if needed)

### Adding Indexes

```typescript
// In schema definition
export const properties = pgTable(
  'properties',
  {
    // column definitions
  },
  (table) => ({
    // Define indexes
    parcelIdIdx: index('parcel_id_idx').on(table.parcelId),
    countyTypeIdx: index('county_type_idx').on(table.county, table.propertyType),
    geoIdx: index('geo_idx').on(table.latitude, table.longitude),
  })
);
```

## Database Connection Management

```typescript
// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not provided");
  }

  // Create connection
  client = postgres(process.env.DATABASE_URL);
  db = drizzle(client, { schema });

  // Test connection
  await client`SELECT 1`;
  console.log("Database connected successfully");

  return true;
}

export { db };

// Cleanup on shutdown
process.on('SIGINT', async () => {
  await client?.end();
  process.exit(0);
});
```

## Performance Tips

1. **Use select() to limit fields**: Don't query unnecessary columns
2. **Add indexes** on frequently queried columns
3. **Use prepared statements** for repeated queries
4. **Batch inserts** instead of individual inserts
5. **Use transactions** for related operations
6. **Cache frequently accessed data** (e.g., cost matrix)
7. **Paginate large result sets** with limit/offset
8. **Use database-level defaults** instead of application-level defaults

---

**Last Updated**: October 2025
**Related**: CLAUDE.md, CLAUDE-BACKEND.md
**ORM**: Drizzle ORM 0.39+
**Database**: PostgreSQL with Drizzle schema push strategy
