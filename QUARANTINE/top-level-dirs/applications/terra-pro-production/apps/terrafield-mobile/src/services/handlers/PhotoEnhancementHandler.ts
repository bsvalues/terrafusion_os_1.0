import { OperationHandler } from "../OfflineQueueService";
import { NotificationService } from "../NotificationService";
import { NotificationType, PhotoEnhancementRequest } from "../types";

// For now we'll use a constant API URL, but this would typically come from a config file
const API_URL = "https://appraisalcore.replit.app";

/**
 * Handler for photo enhancement requests when offline
 * This handler gets registered with the OfflineQueueService to process
 * photo enhancement operations that were queued while offline
 */
export const photoEnhancementHandler: OperationHandler = async (operation) => {
  try {
    const enhancementRequest = operation.data as PhotoEnhancementRequest;
    console.log(`Processing photo enhancement for ${enhancementRequest.photoId}`);

    // Get notification service
    const notificationService = NotificationService.getInstance();

    // Send a notification that enhancement has started
    notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.PHOTO_ENHANCEMENT_STARTED,
      "Photo Enhancement Started",
      `Your photo is being enhanced using AI. This may take a minute.`,
      { photoId: enhancementRequest.photoId }
    );

    // Make the API request to enhance the photo
    const response = await fetch(`${API_URL}/api/photos/enhance`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(enhancementRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Send failure notification
      notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.PHOTO_ENHANCEMENT_FAILED,
        "Photo Enhancement Failed",
        `There was a problem enhancing your photo.`,
        {
          photoId: enhancementRequest.photoId,
          error: errorText,
        }
      );

      throw new Error(`Enhancement failed with status ${response.status}: ${errorText}`);
    }

    // Get the enhancement result
    const result = await response.json();

    // Send success notification
    notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.PHOTO_ENHANCEMENT_COMPLETED,
      "Photo Enhancement Complete",
      result.detectedFeatures?.length > 0
        ? `Enhancement complete with ${result.detectedFeatures.length} features detected.`
        : `Your photo has been successfully enhanced.`,
      {
        photoId: enhancementRequest.photoId,
        enhancedUrl: result.enhancedUrl,
        detectedFeatures: result.detectedFeatures,
      }
    );

    console.log(`Successfully enhanced photo ${enhancementRequest.photoId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Photo enhancement failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
