import { db, findPropertyByAnyIdentifier } from "../db";
import { sql, or, eq } from "drizzle-orm";
import * as schema from "../../shared/schema";

/**
 * A utility class to handle flexible property identifiers
 * This helps maintain backward compatibility with existing code while
 * adding support for flexible property identifier lookups
 */
export class PropertyIdentifierService {
  /**
   * Find a property by any identifier type
   * This is a more robust version that handles different ID formats
   *
   * @param identifier The identifier to search for
   * @returns The property or null if not found
   */
  static async findProperty(identifier: string) {
    return findPropertyByAnyIdentifier(identifier);
  }

  /**
   * Extract identifiers from an order payload
   * This helps normalize different property identifier formats
   *
   * @param orderPayload The order data payload
   * @returns An object with extracted identifiers
   */
  static extractIdentifiersFromOrder(orderPayload: any) {
    // Handle different property identifier formats
    return {
      // Try to get parcel_id from various fields
      parcelId:
        orderPayload.parcel_id ||
        orderPayload.parcelId ||
        orderPayload.tax_parcel_id ||
        orderPayload.taxParcelId ||
        null,

      // Get property address if available
      address: orderPayload.address || orderPayload.property_address || null,

      // Get any other identifiers that might be used
      propertyIdentifier:
        orderPayload.property_identifier ||
        orderPayload.propertyIdentifier ||
        orderPayload.property_id ||
        orderPayload.propertyId ||
        null,
    };
  }

  /**
   * Process a property order with flexible identifier handling
   *
   * @param orderPayload The order data payload
   * @returns Object with the found property and status information
   */
  static async processPropertyOrder(orderPayload: any) {
    try {
      const identifiers = this.extractIdentifiersFromOrder(orderPayload);

      // Try to find the property using all available identifiers
      let property = null;

      // First, try the primary identifiers
      if (identifiers.parcelId) {
        property = await this.findProperty(identifiers.parcelId);
      }

      // If not found, try the address
      if (!property && identifiers.address) {
        property = await this.findProperty(identifiers.address);
      }

      // Finally, try the propertyIdentifier
      if (!property && identifiers.propertyIdentifier) {
        property = await this.findProperty(identifiers.propertyIdentifier);
      }

      if (property) {
        return {
          success: true,
          property,
          message: "Property found",
        };
      } else {
        return {
          success: false,
          property: null,
          message: "Property not found with the provided identifiers",
        };
      }
    } catch (error) {
      console.error("Error processing property order:", error);

      // Provide detailed error information for debugging
      let errorMessage = "An error occurred while processing the property order";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide helpful context for column errors
        if (error.message.includes("column") && error.message.includes("does not exist")) {
          const columnMatch = error.message.match(/column "(.*?)" of relation/);
          const columnName = columnMatch ? columnMatch[1] : "unknown";

          errorMessage = `Database schema error: Column "${columnName}" not found. This might be due to a mismatch between the code schema and database schema.`;
        }
      }

      return {
        success: false,
        property: null,
        message: errorMessage,
        error,
      };
    }
  }
}
