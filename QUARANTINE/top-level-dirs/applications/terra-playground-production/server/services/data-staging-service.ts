/**
 * Data Staging Service
 *
 * This service handles the staging and committing of property data
 * before it's imported into the production database.
 */

import { randomUUID } from 'crypto';
import { IStorage } from '../storage';
import { InsertProperty, StagedProperty } from '../../shared/schema';

export class DataStagingService {
  constructor(private storage: IStorage) {}

  /**
   * Stage a property for review before committing to the database
   * @param property Property to stage
   * @param source Source of the data (e.g., 'csv-import', 'api', 'manual')
   * @returns The staged property with its staging ID
   */
  async stageProperty(property: InsertProperty, source: string): Promise<StagedProperty> {
    try {
      const stagingId = randomUUID();
      const timestamp = new Date();

      // Create the insert object with proper typing
      const stagedPropertyInsert = {
        stagingId,
        propertyData: property as any, // Cast to any to satisfy Json type
        source,
        status: 'pending',
        validationErrors: [] as any, // Cast empty array to Json
      };

      // Validate the property data
      const validationResult = this.validateProperty(property);
      if (!validationResult.isValid) {
        stagedPropertyInsert.status = 'invalid';
        stagedPropertyInsert.validationErrors = (validationResult.errors as any) || ([] as any);
      }

      // Store in staging table
      const createdStagedProperty = await this.storage.createStagedProperty(stagedPropertyInsert);

      return createdStagedProperty;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to stage property: ${errorMessage}`);
    }
  }

  /**
   * Get all staged properties
   * @returns Array of staged properties
   */
  async getAllStagedProperties(): Promise<StagedProperty[]> {
    try {
      return await this.storage.getAllStagedProperties();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get staged properties: ${errorMessage}`);
    }
  }

  /**
   * Get a staged property by its staging ID
   * @param stagingId The staging ID
   * @returns The staged property
   */
  async getStagedPropertyById(stagingId: string): Promise<StagedProperty | null> {
    try {
      return await this.storage.getStagedPropertyById(stagingId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get staged property: ${errorMessage}`);
    }
  }

  /**
   * Update a staged property
   * @param stagingId The staging ID
   * @param updates The updates to apply
   * @returns The updated staged property
   */
  async updateStagedProperty(
    stagingId: string,
    updates: Partial<StagedProperty>
  ): Promise<StagedProperty | null> {
    try {
      // Don't allow updating the stagingId
      if (updates.stagingId) {
        delete updates.stagingId;
      }

      // Update the updatedAt timestamp
      updates.updatedAt = new Date();

      return await this.storage.updateStagedProperty(stagingId, updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update staged property: ${errorMessage}`);
    }
  }

  /**
   * Delete a staged property
   * @param stagingId The staging ID
   * @returns True if deleted, false otherwise
   */
  async deleteStagedProperty(stagingId: string): Promise<boolean> {
    try {
      return await this.storage.deleteStagedProperty(stagingId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete staged property: ${errorMessage}`);
    }
  }

  /**
   * Commit a staged property to the database
   * @param stagingId The staging ID
   * @returns The committed property
   */
  async commitStagedProperty(stagingId: string): Promise<any> {
    try {
      // Get the staged property
      const stagedProperty = await this.storage.getStagedPropertyById(stagingId);

      if (!stagedProperty) {
        throw new Error(`Staged property with ID ${stagingId} not found`);
      }

      // Check if the property is valid
      if (stagedProperty.status === 'invalid') {
        // Handle the case where validationErrors might be null or not an array
        const errors = Array.isArray(stagedProperty.validationErrors)
          ? stagedProperty.validationErrors.join(', ')
          : 'Unknown validation errors';
        throw new Error(`Cannot commit invalid property: ${errors}`);
      }

      // Insert the property into the database
      const property = await this.storage.createProperty(
        stagedProperty.propertyData as InsertProperty
      );

      // Update the staged property status
      await this.storage.updateStagedProperty(stagingId, {
        status: 'committed',
        updatedAt: new Date(),
      });

      return property;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to commit staged property: ${errorMessage}`);
    }
  }

  /**
   * Commit multiple staged properties to the database
   * @param stagingIds Array of staging IDs
   * @returns Result of the bulk commit operation
   */
  async commitStagedProperties(stagingIds: string[]): Promise<{
    total: number;
    committed: number;
    failed: number;
    errors: Array<{ stagingId: string; error: string }>;
  }> {
    const result = {
      total: stagingIds.length,
      committed: 0,
      failed: 0,
      errors: [] as Array<{ stagingId: string; error: string }>,
    };

    for (const stagingId of stagingIds) {
      try {
        await this.commitStagedProperty(stagingId);
        result.committed++;
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({
          stagingId,
          error: errorMessage,
        });
      }
    }

    return result;
  }

  /**
   * Validate a property
   * @param property Property to validate
   * @returns Validation result
   */
  private validateProperty(property: InsertProperty): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!property.propertyId) {
      errors.push('Missing required field: propertyId');
    }
    if (!property.address) {
      errors.push('Missing required field: address');
    }
    if (!property.parcelNumber) {
      errors.push('Missing required field: parcelNumber');
    }
    if (!property.propertyType) {
      errors.push('Missing required field: propertyType');
    }

    // Validate propertyId format
    if (property.propertyId && !/^[A-Za-z0-9-_]+$/.test(property.propertyId)) {
      errors.push(
        'Property ID must contain only alphanumeric characters, hyphens, and underscores'
      );
    }

    // Validate numeric fields
    if (
      property.acres !== null &&
      property.acres !== undefined &&
      typeof property.acres !== 'number'
    ) {
      errors.push('Acres must be a number');
    }

    if (
      property.value !== null &&
      property.value !== undefined &&
      typeof property.value !== 'number'
    ) {
      errors.push('Value must be a number');
    }

    // The following fields are optional and may be in the propertyData but not in the InsertProperty type
    // We'll access them safely via the "as any" type assertion
    const propertyAny = property as any;

    if (
      propertyAny.squareFeet !== null &&
      propertyAny.squareFeet !== undefined &&
      typeof propertyAny.squareFeet !== 'number'
    ) {
      errors.push('Square feet must be a number');
    }

    if (
      propertyAny.bedrooms !== null &&
      propertyAny.bedrooms !== undefined &&
      typeof propertyAny.bedrooms !== 'number'
    ) {
      errors.push('Bedrooms must be a number');
    }

    if (
      propertyAny.bathrooms !== null &&
      propertyAny.bathrooms !== undefined &&
      typeof propertyAny.bathrooms !== 'number'
    ) {
      errors.push('Bathrooms must be a number');
    }

    if (
      propertyAny.yearBuilt !== null &&
      propertyAny.yearBuilt !== undefined &&
      typeof propertyAny.yearBuilt !== 'number'
    ) {
      errors.push('Year built must be a number');
    }

    // Validate status
    if (
      property.status &&
      !['active', 'pending', 'sold', 'inactive'].includes(property.status.toLowerCase())
    ) {
      errors.push('Status must be one of: active, pending, sold, inactive');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
