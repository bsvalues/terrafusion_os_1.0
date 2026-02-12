import { OperationHandler } from "../OfflineQueueService";
import {
  ConflictResolutionService,
  DataType,
  ConflictStrategy,
} from "../ConflictResolutionService";
import { PropertyData } from "../types";

// For now we'll use a constant API URL, but this would typically come from a config file
const API_URL = "https://appraisalcore.replit.app";

/**
 * Handler for updating property data when offline
 * This handler gets registered with the OfflineQueueService to process
 * property update operations that were queued while offline
 */
export const propertyUpdateHandler: OperationHandler = async (operation) => {
  try {
    console.log(`Processing property update for ${operation.data.id}`);

    const propertyData = operation.data as PropertyData;
    const propertyId = propertyData.id;

    // First, fetch the current server version of this property
    // to check for potential conflicts
    const serverResponse = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!serverResponse.ok) {
      // If property doesn't exist on server (404) or other issues,
      // attempt to create it instead
      if (serverResponse.status === 404) {
        return await createPropertyOnServer(propertyData);
      }

      const errorText = await serverResponse.text();
      throw new Error(
        `Fetching property failed with status ${serverResponse.status}: ${errorText}`
      );
    }

    // We have the server version, check for conflicts
    const serverData = await serverResponse.json();

    // Initialize conflict resolution service
    const conflictService = ConflictResolutionService.getInstance();

    // Detect conflict between local and server versions
    const conflict = await conflictService.detectConflict(
      DataType.PROPERTY,
      propertyId,
      propertyData,
      serverData
    );

    // If there's a conflict, resolve it automatically using the default strategy
    if (conflict) {
      console.log(`Conflict detected for property ${propertyId}, resolving...`);

      const resolvedData = await conflictService.autoResolveConflict(conflict);

      // If resolved automatically, use the resolved data for the update
      // If not (requires manual resolution), we'll fail this operation
      if (resolvedData) {
        // Update the server with the resolved data
        return await updatePropertyOnServer(resolvedData);
      } else {
        // Conflict requires manual resolution, fail the operation
        return {
          success: false,
          error: `Property update requires manual conflict resolution. Check the conflicts tab.`,
          data: { conflictId: conflict.id },
        };
      }
    }

    // No conflict, proceed with update
    return await updatePropertyOnServer(propertyData);
  } catch (error) {
    console.error("Property update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Helper function to create a property on the server
 */
async function createPropertyOnServer(propertyData: PropertyData) {
  try {
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Property creation failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Successfully created property ${propertyData.id}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Property creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to update a property on the server
 */
async function updatePropertyOnServer(propertyData: PropertyData) {
  try {
    const response = await fetch(`${API_URL}/api/properties/${propertyData.id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Property update failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Successfully updated property ${propertyData.id}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Property update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
