import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import {
  PropertyInspectionWorkflow,
  PropertyInspectionData,
  createDefaultInspectionData,
  InspectionStep,
} from "../components/PropertyInspectionWorkflow";
import { PropertyComparisonTool, EnhancedComparable } from "../components/PropertyComparisonTool";
import { DataSyncService } from "../services/DataSyncService";
import { OfflineQueueService, OperationType } from "../services/OfflineQueueService";
import { PropertyData, ComparableData } from "../services/types";

/**
 * Field Inspection tabs
 */
enum FieldInspectionTab {
  INSPECTION = "inspection",
  COMPARABLES = "comparables",
}

/**
 * FieldInspectionScreen component
 *
 * This screen combines:
 * 1. The property inspection workflow
 * 2. The property comparables tool
 *
 * It provides a comprehensive interface for field appraisers to gather
 * property data and compare with similar properties, all in a unified workflow.
 */
const FieldInspectionScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get propertyId from route params if any
  const propertyId = route.params?.propertyId;

  // State
  const [activeTab, setActiveTab] = useState<FieldInspectionTab>(FieldInspectionTab.INSPECTION);
  const [inspectionData, setInspectionData] = useState<PropertyInspectionData | null>(null);
  const [comparables, setComparables] = useState<ComparableData[]>([]);
  const [enhancedComparables, setEnhancedComparables] = useState<EnhancedComparable[]>([]);
  const [selectedComparable, setSelectedComparable] = useState<EnhancedComparable | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Get services
  const dataSyncService = DataSyncService.getInstance();
  const offlineQueueService = OfflineQueueService.getInstance();

  // Load or create inspection data
  useEffect(() => {
    const loadInspection = async () => {
      try {
        setIsLoading(true);

        // Try to load existing inspection from storage
        const storedInspection = await AsyncStorage.getItem(
          `@terrafield:inspection:${propertyId || "new"}`
        );

        if (storedInspection) {
          // Parse the stored inspection
          const parsedInspection = JSON.parse(storedInspection);

          // Convert string dates back to Date objects
          parsedInspection.startTime = new Date(parsedInspection.startTime);
          if (parsedInspection.endTime) {
            parsedInspection.endTime = new Date(parsedInspection.endTime);
          }

          setInspectionData(parsedInspection);

          // Load property data
          if (propertyId) {
            const property = dataSyncService.getProperty(propertyId);
            if (property) {
              setInspectionData((prevData) => {
                if (!prevData) return null;
                return {
                  ...prevData,
                  property: {
                    ...prevData.property,
                    ...property,
                  },
                };
              });
            }
          }
        } else {
          // Create a new inspection
          const newInspection = createDefaultInspectionData(propertyId);

          // If propertyId is provided, try to load property data
          if (propertyId) {
            const property = dataSyncService.getProperty(propertyId);
            if (property) {
              newInspection.property = {
                ...newInspection.property,
                ...property,
              };
            }
          }

          setInspectionData(newInspection);

          // Save the new inspection to storage
          await AsyncStorage.setItem(
            `@terrafield:inspection:${propertyId || "new"}`,
            JSON.stringify(newInspection)
          );
        }

        // Load comparable properties
        await loadComparables();
      } catch (error) {
        console.error("Error loading inspection:", error);
        Alert.alert("Error", "Failed to load inspection data. Please try again.", [{ text: "OK" }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInspection();

    // Handle back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [propertyId]);

  // Auto-save inspection data when it changes
  useEffect(() => {
    if (!inspectionData) return;

    const saveInspection = async () => {
      try {
        setIsSaving(true);

        // Save inspection data to local storage
        await AsyncStorage.setItem(
          `@terrafield:inspection:${propertyId || "new"}`,
          JSON.stringify(inspectionData)
        );

        // If property has an ID, queue it for sync
        if (inspectionData.property.id) {
          await offlineQueueService.enqueue(
            OperationType.UPDATE_PROPERTY,
            inspectionData.property,
            1 // Medium priority
          );
        }
      } catch (error) {
        console.error("Error saving inspection:", error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce save to avoid too many operations
    const timeoutId = setTimeout(saveInspection, 2000);

    return () => clearTimeout(timeoutId);
  }, [inspectionData]);

  // Handle back button press
  const handleBackPress = () => {
    if (!inspectionData?.completed) {
      Alert.alert("Exit Inspection", "Do you want to save your progress and exit?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Exit",
          onPress: () => navigation.goBack(),
        },
      ]);
      return true; // Prevent default back behavior
    }

    return false; // Allow default back behavior
  };

  // Load comparable properties
  const loadComparables = async () => {
    try {
      // This would typically fetch comparables from the server
      // For now, we'll create some mock data
      const mockComparables: ComparableData[] = [];

      // Set comparables
      setComparables(mockComparables);
    } catch (error) {
      console.error("Error loading comparables:", error);
    }
  };

  // Fetch nearby comparables
  const fetchNearbyComparables = async (
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<ComparableData[]> => {
    try {
      // This would typically make a network request to fetch nearby comparables
      // For now, we'll simulate this with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demonstration, we'll create some mock data
      const mockComparables: ComparableData[] = [];

      // Add mock comparables to the list
      setComparables((prevComparables) => [...prevComparables, ...mockComparables]);

      return mockComparables;
    } catch (error) {
      console.error("Error fetching nearby comparables:", error);
      throw error;
    }
  };

  // Handle inspection update
  const handleInspectionUpdate = (data: PropertyInspectionData) => {
    setInspectionData(data);
  };

  // Handle inspection complete
  const handleInspectionComplete = (data: PropertyInspectionData) => {
    // Update state
    setInspectionData(data);

    // Navigate to a success screen or back to the previous screen
    Alert.alert(
      "Inspection Completed",
      "The property inspection has been completed successfully.",
      [
        {
          text: "Exit",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Handle comparable update
  const handleComparablesUpdate = (enhanced: EnhancedComparable[]) => {
    setEnhancedComparables(enhanced);
  };

  // Handle comparable selection
  const handleComparableSelect = (comparable: EnhancedComparable) => {
    setSelectedComparable(comparable);
  };

  // Render tabs
  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === FieldInspectionTab.INSPECTION && styles.activeTab]}
          onPress={() => setActiveTab(FieldInspectionTab.INSPECTION)}
        >
          <MaterialCommunityIcons
            name="clipboard-check"
            size={24}
            color={activeTab === FieldInspectionTab.INSPECTION ? "#3498db" : "#7f8c8d"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === FieldInspectionTab.INSPECTION && styles.activeTabText,
            ]}
          >
            Inspection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === FieldInspectionTab.COMPARABLES && styles.activeTab]}
          onPress={() => setActiveTab(FieldInspectionTab.COMPARABLES)}
        >
          <MaterialCommunityIcons
            name="home-search"
            size={24}
            color={activeTab === FieldInspectionTab.COMPARABLES ? "#3498db" : "#7f8c8d"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === FieldInspectionTab.COMPARABLES && styles.activeTabText,
            ]}
          >
            Comparables
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render loading state
  if (isLoading || !inspectionData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading inspection data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>
          {inspectionData.property.address || "New Property Inspection"}
        </Text>

        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === FieldInspectionTab.INSPECTION && (
          <PropertyInspectionWorkflow
            inspectionData={inspectionData}
            onUpdate={handleInspectionUpdate}
            onComplete={handleInspectionComplete}
          />
        )}

        {activeTab === FieldInspectionTab.COMPARABLES && (
          <PropertyComparisonTool
            subjectProperty={inspectionData.property}
            comparables={comparables}
            onComparablesUpdate={handleComparablesUpdate}
            onComparableSelect={handleComparableSelect}
            fetchNearbyComparables={fetchNearbyComparables}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#3498db",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginLeft: 12,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  savingText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3498db",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
    marginLeft: 8,
  },
  activeTabText: {
    color: "#3498db",
  },
  content: {
    flex: 1,
  },
});

export default FieldInspectionScreen;
