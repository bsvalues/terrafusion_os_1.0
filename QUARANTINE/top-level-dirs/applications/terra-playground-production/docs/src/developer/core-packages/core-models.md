---
title: Core Models
sidebar_position: 1
---

# Core Models Package

The `core-models` package defines the shared data models and schema definitions used throughout the Terrafusion platform. This package ensures consistency in data structures across all components of the application.

## Package Structure

```
packages/core-models/
├── src/
│   ├── index.ts              # Main export file
│   ├── repository-schema.ts  # Repository data models
│   ├── property-models.ts    # Property assessment models
│   ├── user-models.ts        # User and permission models
│   ├── geo-models.ts         # Geospatial data models
│   └── plugin-models.ts      # Plugin system models
├── tests/                    # Unit tests
├── package.json
└── tsconfig.json
```

## Key Models

### Repository Schema

The repository schema defines the core data structures for the system:

```typescript
// From repository-schema.ts
export interface Repository {
  id: string;
  name: string;
  description: string;
  owner: User;
  collaborators: User[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Property Models

Property models define the structures for property assessment data:

```typescript
// From property-models.ts
export interface Property {
  id: string;
  parcelId: string;
  address: Address;
  owner: PropertyOwner;
  valuation: PropertyValuation;
  landDetails: LandDetails;
  improvements: Improvement[];
  taxInfo: TaxInformation;
  geometry: GeoJSON.Feature;
}
```

### User Models

User models define authentication and authorization structures:

```typescript
// From user-models.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  ASSESSOR = 'assessor',
  VIEWER = 'viewer',
}
```

## Usage

To use the core models in other packages:

```typescript
import { Repository, User, Property } from '@terrafusion/core-models';

// Create a new repository
const repo: Repository = {
  id: 'repo-123',
  name: 'County Properties',
  description: 'Repository for county property data',
  owner: currentUser,
  collaborators: [],
  isPrivate: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Validation

The core models package also includes validation utilities using Zod:

```typescript
import { repositorySchema } from '@terrafusion/core-models';

// Validate repository data
const validationResult = repositorySchema.safeParse(repoData);
if (!validationResult.success) {
  console.error('Invalid repository data:', validationResult.error);
}
```

## Best Practices

When working with core models:

1. **Never modify models directly** in application code - treat them as immutable
2. **Create derived interfaces** when you need specialized versions of a model
3. **Use type guards** when working with model subtypes
4. **Include validation** when processing user input that will be stored in these models

## Extending Models

To extend the core models for a plugin:

```typescript
import { Property } from '@terrafusion/core-models';

// Extend the Property interface for a custom plugin
export interface EnhancedProperty extends Property {
  customField: string;
  analysisResults: {
    score: number;
    factors: string[];
  };
}
```
