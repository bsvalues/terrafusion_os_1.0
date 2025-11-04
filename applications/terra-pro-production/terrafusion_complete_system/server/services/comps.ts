/**
 * Comps Service
 *
 * Handles comparable property data management and snapshot functionality
 */
import { v4 as uuidv4 } from "uuid";
import { ComparableSnapshot, SnapshotDifference } from "../../shared/types/comps";
import { db } from "../db";

// In-memory storage for snapshots
// In a production app, these would be stored in a database
const snapshotStore = new Map<string, ComparableSnapshot>();

/**
 * Get all snapshots for a property
 */
export const getSnapshotsByPropertyId = async (
  propertyId: string
): Promise<ComparableSnapshot[]> => {
  // Return snapshots from memory storage
  return [...snapshotStore.values()].filter((snapshot) => snapshot.propertyId === propertyId);
};

/**
 * Get a specific snapshot by ID
 */
export const getSnapshotById = async (
  snapshotId: string
): Promise<ComparableSnapshot | undefined> => {
  return snapshotStore.get(snapshotId);
};

/**
 * Create a new snapshot
 */
export const createSnapshot = async (
  propertyId: string,
  source: string,
  fields: Record<string, any>
): Promise<ComparableSnapshot> => {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const snapshot: ComparableSnapshot = {
    id,
    propertyId,
    source,
    createdAt,
    fields,
  };

  // Store in memory
  snapshotStore.set(id, snapshot);

  return snapshot;
};

/**
 * Compare two snapshots to find field differences
 */
export const compareSnapshots = (
  before: ComparableSnapshot,
  after: ComparableSnapshot
): SnapshotDifference => {
  const beforeFields = Object.keys(before.fields);
  const afterFields = Object.keys(after.fields);

  // Find added fields (in after but not in before)
  const added = afterFields
    .filter((field) => !beforeFields.includes(field))
    .map((field) => ({
      field,
      value: after.fields[field],
    }));

  // Find removed fields (in before but not in after)
  const removed = beforeFields
    .filter((field) => !afterFields.includes(field))
    .map((field) => ({
      field,
      value: before.fields[field],
    }));

  // Find changed fields (in both but with different values)
  const changed = beforeFields
    .filter(
      (field) =>
        afterFields.includes(field) &&
        JSON.stringify(before.fields[field]) !== JSON.stringify(after.fields[field])
    )
    .map((field) => ({
      field,
      fromValue: before.fields[field],
      toValue: after.fields[field],
    }));

  return {
    added,
    removed,
    changed,
  };
};

// Add these sample snapshots for testing purposes
// In a real app, these would come from the database
const initializeSampleSnapshots = () => {
  // Sample property 1
  createSnapshot("property-1", "MLS", {
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    salePrice: 250000,
    saleDate: "2023-01-15T00:00:00.000Z",
    gla: 1850,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1985,
    lotSize: 0.25,
    propertyType: "Single Family",
  });

  // Second snapshot for same property with updates
  createSnapshot("property-1", "Tax Records", {
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    salePrice: 255000, // Updated price
    saleDate: "2023-01-20T00:00:00.000Z", // Updated date
    gla: 1850,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1985,
    lotSize: 0.25,
    propertyType: "Single Family",
    taxAssessment: 232000, // Added field
    taxYear: 2023, // Added field
  });

  // Third snapshot with more changes
  createSnapshot("property-1", "Appraiser Inspection", {
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    salePrice: 255000,
    saleDate: "2023-01-20T00:00:00.000Z",
    gla: 1900, // Updated GLA after measurement
    bedrooms: 4, // Actually 4 bedrooms
    bathrooms: 2.5, // Updated bathroom count
    yearBuilt: 1985,
    lotSize: 0.27, // Updated lot size
    propertyType: "Single Family",
    taxAssessment: 232000,
    taxYear: 2023,
    condition: "Good", // Added field from inspection
    quality: "Average", // Added field from inspection
    garageSpaces: 2, // Added field from inspection
    foundation: "Concrete", // Added field from inspection
    exteriorWalls: "Vinyl Siding", // Added field from inspection
  });

  // Sample property 2
  createSnapshot("property-2", "MLS", {
    address: "456 Oak Ave",
    city: "Springfield",
    state: "IL",
    zipCode: "62702",
    salePrice: 320000,
    saleDate: "2023-02-10T00:00:00.000Z",
    gla: 2200,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 1995,
    lotSize: 0.3,
    propertyType: "Single Family",
  });

  // Another snapshot for property 2
  createSnapshot("property-2", "Appraiser Inspection", {
    address: "456 Oak Ave",
    city: "Springfield",
    state: "IL",
    zipCode: "62702",
    salePrice: 320000,
    saleDate: "2023-02-10T00:00:00.000Z",
    gla: 2200,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 1995,
    lotSize: 0.3,
    propertyType: "Single Family",
    condition: "Very Good",
    quality: "Good",
    garageSpaces: 2,
    foundation: "Concrete",
    exteriorWalls: "Brick",
    roofMaterial: "Asphalt Shingle",
    basement: "Full, Finished",
    heatingCooling: "Central HVAC",
    view: "Average",
  });
};

// Initialize sample data
initializeSampleSnapshots();
