import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import * as Device from "expo-device";
import * as Battery from "expo-battery";
import { OfflineQueueService, OperationType } from "../services/OfflineQueueService";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /**
   * Critical errors that prevent the app from functioning
   */
  CRITICAL = "critical",

  /**
   * Errors that affect functionality but don't crash the app
   */
  ERROR = "error",

  /**
   * Warnings that indicate potential issues
   */
  WARNING = "warning",

  /**
   * Informational messages about unexpected behavior
   */
  INFO = "info",
}

/**
 * Error data structure
 */
export interface ErrorData {
  /**
   * Unique ID for the error
   */
  id: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error stack trace
   */
  stack?: string;

  /**
   * Component where the error occurred
   */
  component?: string;

  /**
   * Additional context about what happened
   */
  context?: Record<string, any>;

  /**
   * Error severity level
   */
  severity: ErrorSeverity;

  /**
   * Timestamp when the error occurred
   */
  timestamp: number;

  /**
   * Device information
   */
  device?: {
    model?: string;
    osName?: string;
    osVersion?: string;
    memoryUsage?: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };

  /**
   * Network information
   */
  network?: {
    isConnected: boolean;
    type?: string;
    isMetered?: boolean;
    details?: any;
  };

  /**
   * Whether the error has been reported to the server
   */
  reported: boolean;

  /**
   * User feedback about the error
   */
  userFeedback?: string;
}

/**
 * Error context data structure for the provider
 */
interface ErrorContextData {
  /**
   * Report an error
   */
  reportError: (
    error: Error | string,
    severity: ErrorSeverity,
    component?: string,
    context?: Record<string, any>
  ) => Promise<void>;

  /**
   * Show the error console
   */
  showErrorConsole: () => void;

  /**
   * Check if there are unreported errors
   */
  hasUnreportedErrors: boolean;

  /**
   * Count of unreported errors
   */
  unreportedErrorCount: number;
}

// Create the context
const ErrorContext = createContext<ErrorContextData | undefined>(undefined);

/**
 * Error provider component
 */
export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [isErrorConsoleVisible, setIsErrorConsoleVisible] = useState<boolean>(false);
  const [hasUnreportedErrors, setHasUnreportedErrors] = useState<boolean>(false);
  const [unreportedErrorCount, setUnreportedErrorCount] = useState<number>(0);

  // Services
  const offlineQueueService = useRef(OfflineQueueService.getInstance()).current;

  // Error log file path
  const errorLogPath = `${FileSystem.documentDirectory}error_log.json`;

  // Load errors on mount
  useEffect(() => {
    loadErrors();
  }, []);

  // Update unreported error count when errors change
  useEffect(() => {
    const unreportedCount = errors.filter((error) => !error.reported).length;
    setHasUnreportedErrors(unreportedCount > 0);
    setUnreportedErrorCount(unreportedCount);
  }, [errors]);

  // Load errors from file system
  const loadErrors = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(errorLogPath);

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(errorLogPath);
        const loadedErrors = JSON.parse(content) as ErrorData[];
        setErrors(loadedErrors);
      }
    } catch (error) {
      console.error("Error loading error log:", error);
    }
  };

  // Save errors to file system
  const saveErrors = async (errorsList: ErrorData[]) => {
    try {
      await FileSystem.writeAsStringAsync(errorLogPath, JSON.stringify(errorsList));
    } catch (error) {
      console.error("Error saving error log:", error);
    }
  };

  // Report an error
  const reportError = async (
    error: Error | string,
    severity: ErrorSeverity,
    component?: string,
    context?: Record<string, any>
  ) => {
    try {
      // Get device information
      const deviceInfo = {
        model: Device.modelName,
        osName: Platform.OS,
        osVersion: Platform.Version.toString(),
        batteryLevel: await Battery.getBatteryLevelAsync(),
        isCharging: (await Battery.getBatteryStateAsync()) === Battery.BatteryState.CHARGING,
      };

      // Get network information
      const networkState = await NetInfo.fetch();

      // Create error data object
      const errorData: ErrorData = {
        id: Date.now().toString(),
        message: typeof error === "string" ? error : error.message,
        stack: typeof error === "string" ? undefined : error.stack,
        component,
        context,
        severity,
        timestamp: Date.now(),
        device: deviceInfo,
        network: {
          isConnected: networkState.isConnected || false,
          type: networkState.type,
          isMetered: networkState.isInternetReachable,
          details: networkState.details,
        },
        reported: false,
      };

      // Add error to list
      const updatedErrors = [...errors, errorData];
      setErrors(updatedErrors);

      // Save errors to file system
      await saveErrors(updatedErrors);

      // For critical errors, show the error console automatically
      if (severity === ErrorSeverity.CRITICAL) {
        setIsErrorConsoleVisible(true);
      }

      // Queue error report for sync
      await offlineQueueService.enqueue(
        OperationType.REPORT_ERROR,
        errorData,
        3 // High priority
      );
    } catch (reportError) {
      console.error("Error reporting error:", reportError);
    }
  };

  // Show error console
  const showErrorConsole = () => {
    setIsErrorConsoleVisible(true);
  };

  // Hide error console
  const hideErrorConsole = () => {
    setIsErrorConsoleVisible(false);
  };

  // Clear all errors
  const clearAllErrors = async () => {
    try {
      // Show confirmation
      Alert.alert(
        "Clear All Errors",
        "Are you sure you want to clear all errors? This cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: async () => {
              setErrors([]);
              await saveErrors([]);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error clearing errors:", error);
    }
  };

  // Submit user feedback for an error
  const submitFeedback = async (errorId: string, feedback: string) => {
    try {
      // Find the error
      const errorIndex = errors.findIndex((error) => error.id === errorId);

      if (errorIndex === -1) {
        throw new Error(`Error with ID ${errorId} not found`);
      }

      // Update the error with user feedback
      const updatedErrors = [...errors];
      updatedErrors[errorIndex] = {
        ...updatedErrors[errorIndex],
        userFeedback: feedback,
      };

      // Update state
      setErrors(updatedErrors);

      // Save to file system
      await saveErrors(updatedErrors);

      // Queue error report for sync
      await offlineQueueService.enqueue(
        OperationType.REPORT_ERROR,
        updatedErrors[errorIndex],
        3 // High priority
      );

      // Show success message
      Alert.alert(
        "Feedback Submitted",
        "Thank you for your feedback. It will help us improve the app.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback");
    }
  };

  // Render error console
  const renderErrorConsole = () => {
    // Group errors by day
    const groupedErrors: Record<string, ErrorData[]> = {};

    errors.forEach((error) => {
      const date = new Date(error.timestamp);
      const dateString = date.toDateString();

      if (!groupedErrors[dateString]) {
        groupedErrors[dateString] = [];
      }

      groupedErrors[dateString].push(error);
    });

    return (
      <Modal visible={isErrorConsoleVisible} animationType="slide" transparent={false}>
        <View style={styles.errorConsole}>
          <View style={styles.errorConsoleHeader}><>

            <Text style={styles.errorConsoleTitle}>Error Console</Text>

            <View
</> style={styles.errorConsoleActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearAllErrors}>
                <MaterialCommunityIcons name="delete" size={20} color="#e74c3c" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={hideErrorConsole}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {errors.length === 0 ? (
            <View style={styles.noErrorsContainer}>
              <MaterialCommunityIcons name="check-circle" size={48} color="#2ecc71" />
              <Text style={styles.noErrorsText}>No errors to display</Text>
            </View>
          ) : (
            <ScrollView style={styles.errorList}>
              {Object.entries(groupedErrors)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, dateErrors]) => (
                  <View key={date} style={styles.errorGroup}>
                    <Text style={styles.errorGroupDate}>{date}</Text>

                    {dateErrors
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((error) => (
                        <ErrorItem key={error.id} error={error} onSubmitFeedback={submitFeedback} />
                      ))}
                  </View>
                ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <ErrorContext.Provider
      value={{
        reportError,
        showErrorConsole,
        hasUnreportedErrors,
        unreportedErrorCount,
      }}
    >
      {children}
      {renderErrorConsole()}
    </ErrorContext.Provider>
  );
};

/**
 * ErrorItem component props
 */
interface ErrorItemProps {
  /**
   * Error data
   */
  error: ErrorData;

  /**
   * Callback for submitting feedback
   */
  onSubmitFeedback: (errorId: string, feedback: string) => Promise<void>;
}

/**
 * ErrorItem component
 */
const ErrorItem: React.FC<ErrorItemProps> = ({ error, onSubmitFeedback }) => {
  // State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get severity icon and color
  const getSeverityData = (severity: ErrorSeverity): { icon: string; color: string } => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return { icon: "alert-circle", color: "#e74c3c" };
      case ErrorSeverity.ERROR:
        return { icon: "alert", color: "#e67e22" };
      case ErrorSeverity.WARNING:
        return { icon: "alert-outline", color: "#f39c12" };
      case ErrorSeverity.INFO:
        return { icon: "information", color: "#3498db" };
      default:
        return { icon: "alert-circle-outline", color: "#7f8c8d" };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert("Error", "Please enter feedback before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitFeedback(error.id, feedback);
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get severity data
  const { icon, color } = getSeverityData(error.severity);

  return (
    <View style={styles.errorItem}>
      <TouchableOpacity style={styles.errorHeader} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.errorHeaderLeft}>
          <MaterialCommunityIcons name={icon} size={24} color={color} style={styles.errorIcon} />

          <View style={styles.errorInfo}><>

            <Text style={styles.errorMessage} numberOfLines={isExpanded ? undefined : 1}>
              {error.message}
            </Text>

            <Text
</> style={styles.errorTimestamp}>
              {formatTimestamp(error.timestamp)}
              {error.component && ` • ${error.component}`}
            </Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#7f8c8d"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.errorDetails}>
          {error.stack && (
            <View style={styles.errorSection}><>

              <Text style={styles.errorSectionTitle}>Stack Trace</Text>
              <ScrollView
</>
                style={styles.stackTrace}
                horizontal
                showsHorizontalScrollIndicator={true}
              >
                <Text style={styles.stackTraceText}>{error.stack}</Text>
              </ScrollView>
            </View>
          )}

          {error.context && Object.keys(error.context).length > 0 && (
            <View style={styles.errorSection}><>

              <Text style={styles.errorSectionTitle}>Context</Text>
              <ScrollView
</> style={styles.contextContainer}>
                {Object.entries(error.context).map(([key, value]) => (
                  <View key={key} style={styles.contextItem}><>

                    <Text style={styles.contextKey}>{key}:</Text>
                    <Text
</> style={styles.contextValue}>
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {error.device && (
            <View style={styles.errorSection}><>

              <Text style={styles.errorSectionTitle}>Device Info</Text>
              <View
</> style={styles.deviceInfo}><>

                <Text style={styles.deviceInfoText}>
                  {error.device.model} • {error.device.osName} {error.device.osVersion}
                </Text>
                <Text
</> style={styles.deviceInfoText}>
                  Battery:{" "}
                  {error.device.batteryLevel !== undefined
                    ? `${Math.round(error.device.batteryLevel * 100)}%`
                    : "Unknown"}
                  {error.device.isCharging !== undefined
                    ? error.device.isCharging
                      ? " (Charging)"
                      : " (Not Charging)"
                    : ""}
                </Text>
              </View>
            </View>
          )}

          {error.network && (
            <View style={styles.errorSection}><>

              <Text style={styles.errorSectionTitle}>Network Info</Text>
              <View
</> style={styles.networkInfo}>
                <Text style={styles.networkInfoText}>
                  {error.network.isConnected ? `Connected (${error.network.type})` : "Disconnected"}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.errorSection}>
            <Text style={styles.errorSectionTitle}>
              {error.userFeedback ? "Your Feedback" : "Provide Feedback"}
            </Text>

            {error.userFeedback ? (
              <Text style={styles.feedbackText}>{error.userFeedback}</Text>
            ) : (
              <View style={styles.feedbackContainer}>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="What were you doing when this error occurred?"
                  multiline
                  numberOfLines={3}
                  value={feedback}
                  onChangeText={setFeedback}
                  editable={!isSubmitting}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitFeedback}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Custom hook to use the error context
 */
export const useErrorReporting = (): ErrorContextData => {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error("useErrorReporting must be used within an ErrorProvider");
  }

  return context;
};

/**
 * ErrorButton component
 * A button that shows the error console and indicates unreported errors
 */
export const ErrorButton: React.FC = () => {
  const { showErrorConsole, hasUnreportedErrors, unreportedErrorCount } = useErrorReporting();

  return (
    <TouchableOpacity style={styles.errorButton} onPress={showErrorConsole}>
      <MaterialCommunityIcons
        name="bug"
        size={24}
        color={hasUnreportedErrors ? "#e74c3c" : "#3498db"}
      />

      {hasUnreportedErrors && (
        <View style={styles.errorBadge}>
          <Text style={styles.errorBadgeText}>
            {unreportedErrorCount > 99 ? "99+" : unreportedErrorCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  errorConsole: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorConsoleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  errorConsoleTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorConsoleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  clearButtonText: {
    color: "#e74c3c",
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  noErrorsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noErrorsText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 16,
  },
  errorList: {
    flex: 1,
  },
  errorGroup: {
    marginBottom: 16,
  },
  errorGroupDate: {
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ecf0f1",
  },
  errorItem: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  errorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  errorHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorInfo: {
    flex: 1,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorTimestamp: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  errorDetails: {
    padding: 12,
    paddingTop: 0,
  },
  errorSection: {
    marginTop: 12,
  },
  errorSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginBottom: 4,
  },
  stackTrace: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    maxHeight: 80,
  },
  stackTraceText: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#e74c3c",
  },
  contextContainer: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    maxHeight: 80,
  },
  contextItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  contextKey: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 4,
  },
  contextValue: {
    fontSize: 12,
  },
  deviceInfo: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
  },
  deviceInfoText: {
    fontSize: 12,
  },
  networkInfo: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
  },
  networkInfoText: {
    fontSize: 12,
  },
  feedbackContainer: {
    marginTop: 4,
  },
  feedbackInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#3498db",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  feedbackText: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    fontStyle: "italic",
  },
  errorButton: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
});
