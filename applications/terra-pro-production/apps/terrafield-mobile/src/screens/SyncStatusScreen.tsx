import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import {
  OfflineQueueService,
  QueuedOperation,
  OperationStatus,
  OperationType,
} from "../services/OfflineQueueService";
import {
  ConflictResolutionService,
  DataConflict,
  ConflictStatus,
  DataType,
} from "../services/ConflictResolutionService";

/**
 * Map operation types to icons and colors
 */
const getOperationMeta = (type: OperationType) => {
  switch (type) {
    case OperationType.CREATE_PROPERTY:
      return { icon: "home-plus", color: "#3498db" };
    case OperationType.UPDATE_PROPERTY:
      return { icon: "home-edit", color: "#2980b9" };
    case OperationType.CREATE_REPORT:
      return { icon: "file-document-plus", color: "#9b59b6" };
    case OperationType.UPDATE_REPORT:
      return { icon: "file-document-edit", color: "#8e44ad" };
    case OperationType.UPLOAD_PHOTO:
      return { icon: "image-plus", color: "#27ae60" };
    case OperationType.ENHANCE_PHOTO:
      return { icon: "image-edit", color: "#16a085" };
    case OperationType.UPDATE_PARCEL_NOTES:
      return { icon: "note-edit", color: "#f39c12" };
    case OperationType.SYNC_PARCEL_DATA:
      return { icon: "sync", color: "#e67e22" };
    default:
      return { icon: "circle", color: "#7f8c8d" };
  }
};

/**
 * Map operation status to icons and colors
 */
const getStatusMeta = (status: OperationStatus) => {
  switch (status) {
    case OperationStatus.PENDING:
      return { icon: "clock-outline", color: "#3498db" };
    case OperationStatus.IN_PROGRESS:
      return { icon: "progress-clock", color: "#f39c12" };
    case OperationStatus.COMPLETED:
      return { icon: "check-circle", color: "#2ecc71" };
    case OperationStatus.FAILED:
      return { icon: "alert-circle", color: "#e74c3c" };
    case OperationStatus.RETRYING:
      return { icon: "reload", color: "#9b59b6" };
    default:
      return { icon: "help-circle", color: "#7f8c8d" };
  }
};

/**
 * Map conflict status to icons and colors
 */
const getConflictStatusMeta = (status: ConflictStatus) => {
  switch (status) {
    case ConflictStatus.DETECTED:
      return { icon: "alert", color: "#f39c12" };
    case ConflictStatus.RESOLVED:
      return { icon: "check-circle", color: "#2ecc71" };
    case ConflictStatus.PENDING_MANUAL_RESOLUTION:
      return { icon: "account-alert", color: "#e74c3c" };
    case ConflictStatus.FAILED:
      return { icon: "alert-circle", color: "#c0392b" };
    default:
      return { icon: "help-circle", color: "#7f8c8d" };
  }
};

/**
 * Format date in a readable way
 */
const formatDate = (date: Date) => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Render a single operation item
 */
const OperationItem = ({
  operation,
  onRetry,
}: {
  operation: QueuedOperation;
  onRetry: (id: string) => void;
}) => {
  const { icon, color } = getOperationMeta(operation.type);
  const { icon: statusIcon, color: statusColor } = getStatusMeta(operation.status);

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}><>

        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>

      <View
</> style={styles.contentContainer}><>

        <Text style={styles.itemTitle}>{operation.type}</Text>
        <Text
</> style={styles.itemSubtitle}>
          Created: {formatDate(new Date(operation.createdAt))}
        </Text>
        <Text style={styles.itemSubtitle}>
          Updated: {formatDate(new Date(operation.updatedAt))}
        </Text>

        {operation.errors && operation.errors.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Latest error: {operation.errors[operation.errors.length - 1]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <MaterialCommunityIcons name={statusIcon} size={24} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{operation.status}</Text>

        {(operation.status === OperationStatus.FAILED ||
          operation.status === OperationStatus.RETRYING) && (
          <TouchableOpacity style={styles.retryButton} onPress={() => onRetry(operation.id)}>
            <MaterialCommunityIcons name="reload" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Render a single conflict item
 */
const ConflictItem = ({
  conflict,
  onResolve,
}: {
  conflict: DataConflict;
  onResolve: (id: string) => void;
}) => {
  const { icon, color: statusColor } = getConflictStatusMeta(conflict.status);

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: "#e74c3c" }]}><>

        <MaterialCommunityIcons name="sync-alert" size={24} color="white" />
      </View>

      <View
</> style={styles.contentContainer}><>

        <Text style={styles.itemTitle}>{conflict.dataType} Conflict</Text>
        <Text
</> style={styles.itemSubtitle}>Resource ID: {conflict.resourceId}</Text>
        <Text style={styles.itemSubtitle}>
          Detected: {formatDate(new Date(conflict.detectedAt))}
        </Text>

        {conflict.resolvedAt && (
          <Text style={styles.itemSubtitle}>
            Resolved: {formatDate(new Date(conflict.resolvedAt))}
          </Text>
        )}

        {conflict.strategy && (
          <Text style={styles.itemSubtitle}>Strategy: {conflict.strategy}</Text>
        )}
      </View>

      <View style={styles.statusContainer}>
        <MaterialCommunityIcons name={icon} size={24} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{conflict.status}</Text>

        {conflict.status === ConflictStatus.PENDING_MANUAL_RESOLUTION && (
          <TouchableOpacity style={styles.resolveButton} onPress={() => onResolve(conflict.id)}>
            <MaterialCommunityIcons name="account-edit" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Main SyncStatusScreen component
 */
const SyncStatusScreen = () => {
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState("operations");

  const navigation = useNavigation();
  const queueService = OfflineQueueService.getInstance();
  const conflictService = ConflictResolutionService.getInstance();

  // Load data
  const loadData = useCallback(() => {
    setOperations(queueService.getQueue());
    setConflicts(conflictService.getAllConflicts());
    setRefreshing(false);
  }, [queueService, conflictService]);

  // Initial load
  useEffect(() => {
    loadData();

    // Monitor network state
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Handle sync now
  const handleSyncNow = useCallback(async () => {
    if (!isOnline) {
      // TODO: Show toast or alert about being offline
      return;
    }

    setSyncInProgress(true);

    try {
      await queueService.processQueue();
    } finally {
      setSyncInProgress(false);
      loadData();
    }
  }, [isOnline, queueService, loadData]);

  // Handle retry operation
  const handleRetryOperation = useCallback(
    async (id: string) => {
      await queueService.retryOperation(id);
      loadData();
    },
    [queueService, loadData]
  );

  // Handle retry all failed operations
  const handleRetryAllFailed = useCallback(async () => {
    const count = await queueService.retryAllFailedOperations();
    loadData();

    // TODO: Show toast with count of operations retried
  }, [queueService, loadData]);

  // Handle clear completed operations
  const handleClearCompleted = useCallback(async () => {
    const count = await queueService.clearCompletedOperations();
    loadData();

    // TODO: Show toast with count of operations cleared
  }, [queueService, loadData]);

  // Handle resolve conflict
  const handleResolveConflict = useCallback(
    (id: string) => {
      // Navigate to conflict resolution screen
      navigation.navigate("ConflictResolution", { conflictId: id });
    },
    [navigation]
  );

  // Handle clear resolved conflicts
  const handleClearResolvedConflicts = useCallback(async () => {
    const count = await conflictService.clearResolvedConflicts();
    loadData();

    // TODO: Show toast with count of conflicts cleared
  }, [conflictService, loadData]);

  // Get counts for tabs
  const pendingCount = operations.filter((op) => op.status === OperationStatus.PENDING).length;
  const failedCount = operations.filter((op) => op.status === OperationStatus.FAILED).length;
  const conflictCount = conflicts.filter((c) => c.status !== ConflictStatus.RESOLVED).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}><>

        <Text style={styles.headerTitle}>Sync Status</Text>
        <View
</> style={styles.networkStatus}>
          <View
            style={[styles.statusIndicator, { backgroundColor: isOnline ? "#2ecc71" : "#e74c3c" }]}
          />
          <Text style={styles.networkText}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "operations" && styles.activeTab]}
          onPress={() => setActiveTab("operations")}
        >
          <Text style={[styles.tabText, activeTab === "operations" && styles.activeTabText]}>
            Operations {pendingCount + failedCount > 0 && `(${pendingCount + failedCount})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "conflicts" && styles.activeTab]}
          onPress={() => setActiveTab("conflicts")}
        >
          <Text style={[styles.tabText, activeTab === "conflicts" && styles.activeTabText]}>
            Conflicts {conflictCount > 0 && `(${conflictCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, (!isOnline || syncInProgress) && styles.disabledButton]}
          onPress={handleSyncNow}
          disabled={!isOnline || syncInProgress}
        >
          {syncInProgress ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="sync" size={20} color="white" />
          )}
          <Text style={styles.actionButtonText}>Sync Now</Text>
        </TouchableOpacity>

        {activeTab === "operations" && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, failedCount === 0 && styles.disabledButton]}
              onPress={handleRetryAllFailed}
              disabled={failedCount === 0}
            >
              <MaterialCommunityIcons name="reload" size={20} color="white" />
              <Text style={styles.actionButtonText}>Retry Failed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleClearCompleted}>
              <MaterialCommunityIcons name="broom" size={20} color="white" />
              <Text style={styles.actionButtonText}>Clear Completed</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "conflicts" && (
          <TouchableOpacity style={styles.actionButton} onPress={handleClearResolvedConflicts}>
            <MaterialCommunityIcons name="broom" size={20} color="white" />
            <Text style={styles.actionButtonText}>Clear Resolved</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3498db"]} />
        }
      >
        {activeTab === "operations" && (
          <>
            {operations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="check-circle" size={60} color="#bdc3c7" /><>

                <Text style={styles.emptyText}>No pending operations</Text>
                <Text
</> style={styles.emptySubtext}>All changes have been synchronized</Text>
              </View>
            ) : (
              operations.map((operation) => (
                <OperationItem
                  key={operation.id}
                  operation={operation}
                  onRetry={handleRetryOperation}
                />
              ))
            )}
          </>
        )}

        {activeTab === "conflicts" && (
          <>
            {conflicts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="check-circle" size={60} color="#bdc3c7" /><>

                <Text style={styles.emptyText}>No conflicts detected</Text>
                <Text
</> style={styles.emptySubtext}>Data is synchronized correctly</Text>
              </View>
            ) : (
              conflicts.map((conflict) => (
                <ConflictItem
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={handleResolveConflict}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  networkStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  networkText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3498db",
  },
  tabText: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  actionButtonText: {
    color: "white",
    marginLeft: 4,
    fontWeight: "500",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  errorContainer: {
    backgroundColor: "#ffecec",
    padding: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
  },
  statusContainer: {
    alignItems: "center",
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: "#3498db",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  resolveButton: {
    backgroundColor: "#e67e22",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 8,
    textAlign: "center",
  },
});

export default SyncStatusScreen;
