import { OfflineQueueService, OperationType } from "./OfflineQueueService";
import { ConflictResolutionService, DataType, ConflictStrategy } from "./ConflictResolutionService";
import { DataSyncService } from "./DataSyncService";
import { photoUploadHandler } from "./handlers/PhotoUploadHandler";
import { photoEnhancementHandler } from "./handlers/PhotoEnhancementHandler";
import { propertyUpdateHandler } from "./handlers/PropertyUpdateHandler";

/**
 * This class handles initializing all offline-related services
 * and setting up the necessary handlers and strategies
 */
export class OfflineServiceInitializer {
  /**
   * Initialize all offline services
   */
  public static initialize(): void {
    console.log("Initializing offline services...");

    // Initialize services
    const queueService = OfflineQueueService.getInstance();
    const conflictService = ConflictResolutionService.getInstance();
    const dataSyncService = DataSyncService.getInstance();

    // Register operation handlers
    OfflineServiceInitializer.registerOperationHandlers(queueService);

    // Register conflict resolvers and strategies
    OfflineServiceInitializer.registerConflictResolvers(conflictService);

    // Start auto-sync for the queue
    queueService.startAutoSync(30000); // 30 seconds

    // Start periodic data sync
    dataSyncService.startPeriodicSync(60000); // 1 minute

    console.log("Offline services initialized successfully");
  }

  /**
   * Register operation handlers with the queue service
   */
  private static registerOperationHandlers(queueService: OfflineQueueService): void {
    // Register photo handlers
    queueService.registerHandler(OperationType.UPLOAD_PHOTO, photoUploadHandler);
    queueService.registerHandler(OperationType.ENHANCE_PHOTO, photoEnhancementHandler);

    // Register property handlers
    queueService.registerHandler(OperationType.CREATE_PROPERTY, propertyUpdateHandler);
    queueService.registerHandler(OperationType.UPDATE_PROPERTY, propertyUpdateHandler);

    // TODO: Register handlers for other operation types
    // queueService.registerHandler(OperationType.CREATE_REPORT, reportUpdateHandler);
    // queueService.registerHandler(OperationType.UPDATE_REPORT, reportUpdateHandler);

    // Set retry strategy
    queueService.setRetryStrategy({
      maxRetries: 5,
      baseDelayMs: 2000, // 2 seconds base delay
      maxDelayMs: 300000, // 5 minutes max delay
    });
  }

  /**
   * Register conflict resolvers and strategies with the conflict service
   */
  private static registerConflictResolvers(conflictService: ConflictResolutionService): void {
    // Set default strategies for different data types
    conflictService.setDefaultStrategy(DataType.PROPERTY, ConflictStrategy.MERGE);
    conflictService.setDefaultStrategy(DataType.APPRAISAL_REPORT, ConflictStrategy.MERGE);
    conflictService.setDefaultStrategy(DataType.COMPARABLE, ConflictStrategy.SERVER_WINS);
    conflictService.setDefaultStrategy(DataType.PHOTO, ConflictStrategy.CLIENT_WINS);
    conflictService.setDefaultStrategy(DataType.SKETCH, ConflictStrategy.CLIENT_WINS);
    conflictService.setDefaultStrategy(DataType.PARCEL_NOTE, ConflictStrategy.LAST_MODIFIED_WINS);
    conflictService.setDefaultStrategy(DataType.USER_PREFERENCE, ConflictStrategy.CLIENT_WINS);

    // Register custom field mergers for intelligent merging of specific fields

    // Example: For property address fields, prefer client version (field appraiser knows best)
    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "address",
      (field, clientValue, serverValue) => clientValue
    );

    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "city",
      (field, clientValue, serverValue) => clientValue
    );

    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "state",
      (field, clientValue, serverValue) => clientValue
    );

    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "zipCode",
      (field, clientValue, serverValue) => clientValue
    );

    // Example: For property structural details, prefer server version (official record)
    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "yearBuilt",
      (field, clientValue, serverValue) => serverValue || clientValue
    );

    conflictService.registerFieldMerger(
      DataType.PROPERTY,
      "squareFeet",
      (field, clientValue, serverValue) => serverValue || clientValue
    );

    // Example: For appraisal values, choose the more recent one
    conflictService.registerFieldMerger(
      DataType.APPRAISAL_REPORT,
      "opinionOfValue",
      (field, clientValue, serverValue, clientData, serverData) => {
        const clientDate = new Date(clientData.lastModified).getTime();
        const serverDate = new Date(serverData.lastModified).getTime();
        return clientDate > serverDate ? clientValue : serverValue;
      }
    );
  }
}
