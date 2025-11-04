import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ConflictResolutionService,
  DataConflict,
  ConflictStatus,
  ConflictStrategy,
} from "../services/ConflictResolutionService";

type ParamList = {
  ConflictResolution: {
    conflictId: string;
  };
};

/**
 * Format JSON for display
 */
const formatJson = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Component to display a specific field value comparison
 */
const FieldComparisonItem = ({
  fieldName,
  clientValue,
  serverValue,
  selectedValues,
  onValueToggle,
}: {
  fieldName: string;
  clientValue: any;
  serverValue: any;
  selectedValues: Record<string, "client" | "server">;
  onValueToggle: (field: string, source: "client" | "server") => void;
}) => {
  const areEqual = JSON.stringify(clientValue) === JSON.stringify(serverValue);
  const selected = selectedValues[fieldName] || "server";

  if (areEqual) {
    return (
      <View style={styles.fieldContainer}><>

        <Text style={styles.fieldName}>{fieldName}</Text>
        <View
</> style={styles.fieldValueContainer}>
          <Text style={styles.fieldValue}>{formatFieldValue(clientValue)}</Text>
        </View>
        <View style={styles.selectedIndicator}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#2ecc71" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldContainer}><>

      <Text style={styles.fieldName}>{fieldName}</Text>

      <View
</> style={styles.fieldComparisonContainer}>
        <TouchableOpacity
          style={[styles.valueContainer, selected === "client" && styles.selectedValueContainer]}
          onPress={() => onValueToggle(fieldName, "client")}
        ><>

          <Text style={styles.sourceLabel}>Client</Text>
          <Text
</> style={styles.fieldValue}>{formatFieldValue(clientValue)}</Text>
          {selected === "client" && (
            <View style={styles.selectedIndicator}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#3498db" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.valueContainer, selected === "server" && styles.selectedValueContainer]}
          onPress={() => onValueToggle(fieldName, "server")}
        ><>

          <Text style={styles.sourceLabel}>Server</Text>
          <Text
</> style={styles.fieldValue}>{formatFieldValue(serverValue)}</Text>
          {selected === "server" && (
            <View style={styles.selectedIndicator}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#3498db" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Format field value for display
 */
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "<empty>";
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Extract all fields from an object (including nested fields)
 */
const extractFields = (obj: any, prefix = ""): string[] => {
  if (!obj || typeof obj !== "object") return [];

  return Object.keys(obj).flatMap((key) => {
    const value = obj[key];
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
      return [...extractFields(value, fieldName)];
    }

    return [fieldName];
  });
};

/**
 * Get value from an object using field path (supports dot notation)
 */
const getFieldValue = (obj: any, fieldPath: string): any => {
  const parts = fieldPath.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
};

/**
 * Set value in an object using field path (supports dot notation)
 */
const setFieldValue = (obj: any, fieldPath: string, value: any): any => {
  const result = { ...obj };
  const parts = fieldPath.split(".");
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return result;
};

/**
 * Main conflict resolution screen
 */
const ConflictResolutionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, "ConflictResolution">>();
  const { conflictId } = route.params;

  const [conflict, setConflict] = useState<DataConflict | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<string, "client" | "server">>({});
  const [fields, setFields] = useState<string[]>([]);
  const [strategyMode, setStrategyMode] = useState<"manual" | "auto">("manual");
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictStrategy>(
    ConflictStrategy.MERGE
  );

  const conflictService = ConflictResolutionService.getInstance();

  // Load conflict data
  useEffect(() => {
    const loadConflict = () => {
      const loadedConflict = conflictService.getAllConflicts().find((c) => c.id === conflictId);
      setConflict(loadedConflict || null);

      if (loadedConflict) {
        // Extract all fields from both versions
        const clientFields = extractFields(loadedConflict.clientVersion);
        const serverFields = extractFields(loadedConflict.serverVersion);
        const allFields = Array.from(new Set([...clientFields, ...serverFields])).sort();
        setFields(allFields);

        // Initialize selected values (default to server values)
        const initialSelections: Record<string, "client" | "server"> = {};
        for (const field of allFields) {
          const clientValue = getFieldValue(loadedConflict.clientVersion, field);
          const serverValue = getFieldValue(loadedConflict.serverVersion, field);

          // If values are equal, it doesn't matter which we choose
          if (JSON.stringify(clientValue) === JSON.stringify(serverValue)) {
            initialSelections[field] = "server";
            continue;
          }

          // For modified dates, prefer the latest
          if (field.toLowerCase().includes("modifi") || field.toLowerCase().includes("updat")) {
            const clientDate = clientValue instanceof Date ? clientValue : new Date(clientValue);
            const serverDate = serverValue instanceof Date ? serverValue : new Date(serverValue);

            initialSelections[field] = clientDate > serverDate ? "client" : "server";
            continue;
          }

          // By default use server values
          initialSelections[field] = "server";
        }

        setSelectedValues(initialSelections);
      }

      setLoading(false);
    };

    loadConflict();
  }, [conflictId, conflictService]);

  // Handle field value toggle
  const handleValueToggle = useCallback((field: string, source: "client" | "server") => {
    setSelectedValues((prev) => ({
      ...prev,
      [field]: source,
    }));
  }, []);

  // Handle auto resolution strategy selection
  const handleStrategyChange = useCallback((strategy: ConflictStrategy) => {
    setSelectedStrategy(strategy);
  }, []);

  // Create merged data from selected values
  const createMergedData = useCallback(() => {
    if (!conflict) return null;

    let result = {};

    for (const field of fields) {
      const source = selectedValues[field] || "server";
      const value =
        source === "client"
          ? getFieldValue(conflict.clientVersion, field)
          : getFieldValue(conflict.serverVersion, field);

      result = setFieldValue(result, field, value);
    }

    return result;
  }, [conflict, fields, selectedValues]);

  // Handle resolve button press
  const handleResolve = useCallback(async () => {
    if (!conflict) return;

    try {
      setResolving(true);

      if (strategyMode === "manual") {
        // Resolve with manually merged data
        const mergedData = createMergedData();
        await conflictService.manuallyResolveConflict(conflict.id, mergedData);
      } else {
        // Resolve with selected strategy
        await conflictService.resolveConflict(conflict, selectedStrategy);
      }

      // Navigate back to sync status screen
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Resolution Failed",
        `Error resolving conflict: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setResolving(false);
    }
  }, [conflict, conflictService, navigation, strategyMode, selectedStrategy, createMergedData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading conflict data...</Text>
      </View>
    );
  }

  if (!conflict) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color="#e74c3c" /><>

        <Text style={styles.errorText}>Conflict not found</Text>
        <TouchableOpacity
</> style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text
</> style={styles.headerTitle}>Resolve Conflict</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Conflict Info */}
      <View style={styles.infoContainer}><>

        <Text style={styles.infoTitle}>{conflict.dataType} Conflict</Text>
        <Text
</> style={styles.infoSubtitle}>Resource ID: {conflict.resourceId}</Text>
        <Text style={styles.infoSubtitle}>
          Detected: {new Date(conflict.detectedAt).toLocaleString()}
        </Text>
      </View>

      {/* Resolution Mode Toggle */}
      <View style={styles.modeContainer}><>

        <Text style={styles.modeTitle}>Resolution Method:</Text>
        <View
</> style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeButton, strategyMode === "manual" && styles.modeButtonActive]}
            onPress={() => setStrategyMode("manual")}
          >
            <Text
              style={[
                styles.modeButtonText,
                strategyMode === "manual" && styles.modeButtonTextActive,
              ]}
            >
              Manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, strategyMode === "auto" && styles.modeButtonActive]}
            onPress={() => setStrategyMode("auto")}
          >
            <Text
              style={[
                styles.modeButtonText,
                strategyMode === "auto" && styles.modeButtonTextActive,
              ]}
            >
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto Resolution Strategies */}
      {strategyMode === "auto" && (
        <View style={styles.strategiesContainer}><>

          <Text style={styles.strategiesTitle}>Select Resolution Strategy:</Text>

          <TouchableOpacity
</>
            style={[
              styles.strategyButton,
              selectedStrategy === ConflictStrategy.CLIENT_WINS && styles.strategyButtonActive,
            ]}
            onPress={() => handleStrategyChange(ConflictStrategy.CLIENT_WINS)}
          >
            <MaterialCommunityIcons
              name={
                selectedStrategy === ConflictStrategy.CLIENT_WINS
                  ? "radiobox-marked"
                  : "radiobox-blank"
              }
              size={24}
              color={selectedStrategy === ConflictStrategy.CLIENT_WINS ? "#3498db" : "#7f8c8d"}
            />
            <View style={styles.strategyTextContainer}><>

              <Text style={styles.strategyButtonText}>Client Wins</Text>
              <Text
</> style={styles.strategyDescription}>Use all values from your device</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.strategyButton,
              selectedStrategy === ConflictStrategy.SERVER_WINS && styles.strategyButtonActive,
            ]}
            onPress={() => handleStrategyChange(ConflictStrategy.SERVER_WINS)}
          >
            <MaterialCommunityIcons
              name={
                selectedStrategy === ConflictStrategy.SERVER_WINS
                  ? "radiobox-marked"
                  : "radiobox-blank"
              }
              size={24}
              color={selectedStrategy === ConflictStrategy.SERVER_WINS ? "#3498db" : "#7f8c8d"}
            />
            <View style={styles.strategyTextContainer}><>

              <Text style={styles.strategyButtonText}>Server Wins</Text>
              <Text
</> style={styles.strategyDescription}>Use all values from the server</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.strategyButton,
              selectedStrategy === ConflictStrategy.LAST_MODIFIED_WINS &&
                styles.strategyButtonActive,
            ]}
            onPress={() => handleStrategyChange(ConflictStrategy.LAST_MODIFIED_WINS)}
          >
            <MaterialCommunityIcons
              name={
                selectedStrategy === ConflictStrategy.LAST_MODIFIED_WINS
                  ? "radiobox-marked"
                  : "radiobox-blank"
              }
              size={24}
              color={
                selectedStrategy === ConflictStrategy.LAST_MODIFIED_WINS ? "#3498db" : "#7f8c8d"
              }
            />
            <View style={styles.strategyTextContainer}><>

              <Text style={styles.strategyButtonText}>Last Modified Wins</Text>
              <Text
</> style={styles.strategyDescription}>Use the most recently modified version</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.strategyButton,
              selectedStrategy === ConflictStrategy.MERGE && styles.strategyButtonActive,
            ]}
            onPress={() => handleStrategyChange(ConflictStrategy.MERGE)}
          >
            <MaterialCommunityIcons
              name={
                selectedStrategy === ConflictStrategy.MERGE ? "radiobox-marked" : "radiobox-blank"
              }
              size={24}
              color={selectedStrategy === ConflictStrategy.MERGE ? "#3498db" : "#7f8c8d"}
            />
            <View style={styles.strategyTextContainer}><>

              <Text style={styles.strategyButtonText}>Smart Merge</Text>
              <Text
</> style={styles.strategyDescription}>
                Automatically merge fields based on best practices
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Resolution Fields */}
      {strategyMode === "manual" && (
        <ScrollView style={styles.fieldsScrollView}>
          <Text style={styles.fieldsTitle}>Select which version to keep for each field:</Text>

          {fields.map((field) => (
            <FieldComparisonItem
              key={field}
              fieldName={field}
              clientValue={getFieldValue(conflict.clientVersion, field)}
              serverValue={getFieldValue(conflict.serverVersion, field)}
              selectedValues={selectedValues}
              onValueToggle={handleValueToggle}
            />
          ))}
        </ScrollView>
      )}

      {/* Resolve Button */}
      <View style={styles.resolveButtonContainer}>
        <TouchableOpacity style={styles.resolveButton} onPress={handleResolve} disabled={resolving}>
          {resolving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
          )}
          <Text style={styles.resolveButtonText}>
            {resolving ? "Resolving..." : "Resolve Conflict"}
          </Text>
        </TouchableOpacity>
      </View>
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
  backButtonSmall: {
    padding: 4,
  },
  infoContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  modeContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f2f6",
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  modeButtonTextActive: {
    color: "#3498db",
  },
  strategiesContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 8,
  },
  strategiesTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  strategyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  strategyButtonActive: {
    backgroundColor: "#f1f9ff",
  },
  strategyTextContainer: {
    marginLeft: 12,
  },
  strategyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  strategyDescription: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  fieldsScrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  fieldsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    margin: 16,
  },
  fieldContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  fieldName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  fieldValueContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  fieldValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  fieldComparisonContainer: {
    flexDirection: "column",
  },
  valueContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedValueContainer: {
    backgroundColor: "#e1f5fe",
    borderWidth: 1,
    borderColor: "#3498db",
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3498db",
    backgroundColor: "#e1f5fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  selectedIndicator: {
    position: "absolute",
    right: 12,
  },
  resolveButtonContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resolveButton: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  resolveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ConflictResolutionScreen;
