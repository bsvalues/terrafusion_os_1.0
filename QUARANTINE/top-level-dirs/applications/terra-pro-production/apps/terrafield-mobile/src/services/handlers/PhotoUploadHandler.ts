import { OperationHandler, OperationResult } from "../OfflineQueueService";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

// For now we'll use a constant API URL, but this would typically come from a config file
const API_URL = "https://appraisalcore.replit.app";

/**
 * Handler for uploading photos when offline
 * This handler gets registered with the OfflineQueueService to process
 * photo upload operations that were queued while offline
 */
export const photoUploadHandler: OperationHandler = async (operation) => {
  try {
    console.log(`Processing photo upload for ${operation.data.photoId}`);

    // The operation.data should contain:
    // - photoId: string
    // - localUri: string
    // - propertyId?: string
    // - photoType: string (e.g., 'exterior', 'interior', 'damage', etc.)
    // - metadata?: object

    const { photoId, localUri, propertyId, photoType, metadata } = operation.data;

    // Check if the local file exists
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error(`Photo file not found at ${localUri}`);
    }

    // Create a multipart form data request
    const formData = new FormData();

    // Add the image file
    const fileType = localUri.split(".").pop() || "jpg";
    const fileName = `photo_${photoId}.${fileType}`;

    formData.append("photo", {
      uri: Platform.OS === "android" ? localUri : localUri.replace("file://", ""),
      name: fileName,
      type: `image/${fileType}`,
    } as any);

    // Add other data
    formData.append("photoId", photoId);
    if (propertyId) formData.append("propertyId", propertyId);
    formData.append("photoType", photoType);
    if (metadata) formData.append("metadata", JSON.stringify(metadata));

    // Upload the photo
    const response = await fetch(`${API_URL}/api/photos/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log(`Successfully uploaded photo ${photoId}`);

    // Check if this photo should be enhanced
    if (operation.data.requestEnhancement) {
      // Return success but also additional data to potentially trigger another operation
      return {
        success: true,
        data: {
          ...result,
          shouldEnhance: true,
          photoId,
          remoteUrl: result.url,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Photo upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
