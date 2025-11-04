import { db } from "../../../../packages/core/src/database";
import { properties, Property, propertyTypeEnum } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * GraphQL Schema for Property Records
 */
export const propertySchema = `
  type Property {
    id: ID!
    parcelId: String!
    address: String!
    city: String!
    state: String!
    zipCode: String!
    county: String!
    legalDescription: String
    propertyType: PropertyType!
    acreage: Float
    yearBuilt: Int
    squareFeet: Int
    bedrooms: Int
    bathrooms: Float
    lastSaleDate: String
    lastSaleAmount: Float
    latitude: Float
    longitude: Float
    createdAt: String!
    updatedAt: String!
  }
  
  enum PropertyType {
    RESIDENTIAL
    COMMERCIAL
    INDUSTRIAL
    AGRICULTURAL
    VACANT
    EXEMPT
  }
  
  input PropertyInput {
    parcelId: String!
    address: String!
    city: String!
    state: String!
    zipCode: String!
    county: String!
    legalDescription: String
    propertyType: PropertyType!
    acreage: Float
    yearBuilt: Int
    squareFeet: Int
    bedrooms: Int
    bathrooms: Float
    lastSaleDate: String
    lastSaleAmount: Float
    latitude: Float
    longitude: Float
  }
  
  input PropertyUpdateInput {
    address: String
    city: String
    state: String
    zipCode: String
    county: String
    legalDescription: String
    propertyType: PropertyType
    acreage: Float
    yearBuilt: Int
    squareFeet: Int
    bedrooms: Int
    bathrooms: Float
    lastSaleDate: String
    lastSaleAmount: Float
    latitude: Float
    longitude: Float
  }
  
  extend type Query {
    property(id: ID!): Property
    properties(offset: Int, limit: Int): [Property!]!
    propertiesByCounty(county: String!, offset: Int, limit: Int): [Property!]!
    searchProperties(query: String!, offset: Int, limit: Int): [Property!]!
  }
  
  extend type Mutation {
    createProperty(input: PropertyInput!): Property!
    updateProperty(id: ID!, input: PropertyUpdateInput!): Property!
    deleteProperty(id: ID!): Boolean!
  }
`;

/**
 * GraphQL Resolvers for Property Records
 */
export const propertyResolvers = {
  Query: {
    property: async (_: any, { id }: { id: string }) => {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, parseInt(id)));
      return property;
    },

    properties: async (_: any, { offset = 0, limit = 10 }: { offset: number; limit: number }) => {
      return db.select().from(properties).limit(limit).offset(offset);
    },

    propertiesByCounty: async (
      _: any,
      { county, offset = 0, limit = 10 }: { county: string; offset: number; limit: number }
    ) => {
      return db
        .select()
        .from(properties)
        .where(eq(properties.county, county))
        .limit(limit)
        .offset(offset);
    },

    searchProperties: async (
      _: any,
      { query, offset = 0, limit = 10 }: { query: string; offset: number; limit: number }
    ) => {
      // This is a simplified search - in production we would use full-text search
      // or a dedicated search service
      const lowerQuery = query.toLowerCase();

      const allProperties = await db.select().from(properties);

      const filtered = allProperties.filter(
        (property) =>
          property.address.toLowerCase().includes(lowerQuery) ||
          property.city.toLowerCase().includes(lowerQuery) ||
          property.county.toLowerCase().includes(lowerQuery) ||
          property.parcelId.toLowerCase().includes(lowerQuery)
      );

      return filtered.slice(offset, offset + limit);
    },
  },

  Mutation: {
    createProperty: async (_: any, { input }: { input: any }) => {
      // Convert enum from GraphQL format (UPPERCASE) to database format (lowercase)
      const propertyType = input.propertyType.toLowerCase() as any;

      // Convert lastSaleDate from string to Date if provided
      const lastSaleDate = input.lastSaleDate ? new Date(input.lastSaleDate) : undefined;

      const [newProperty] = await db
        .insert(properties)
        .values({
          ...input,
          propertyType,
          lastSaleDate,
        })
        .returning();

      return newProperty;
    },

    updateProperty: async (_: any, { id, input }: { id: string; input: any }) => {
      // Convert enum from GraphQL format (UPPERCASE) to database format (lowercase) if provided
      const propertyType = input.propertyType
        ? (input.propertyType.toLowerCase() as any)
        : undefined;

      // Convert lastSaleDate from string to Date if provided
      const lastSaleDate = input.lastSaleDate ? new Date(input.lastSaleDate) : undefined;

      const [updatedProperty] = await db
        .update(properties)
        .set({
          ...input,
          propertyType,
          lastSaleDate,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, parseInt(id)))
        .returning();

      return updatedProperty;
    },

    deleteProperty: async (_: any, { id }: { id: string }) => {
      await db.delete(properties).where(eq(properties.id, parseInt(id)));
      return true;
    },
  },

  // Map database property types to GraphQL enum values
  Property: {
    propertyType: (property: Property) => {
      // Convert from database format (lowercase) to GraphQL format (UPPERCASE)
      return property.propertyType.toUpperCase();
    },
  },
};
