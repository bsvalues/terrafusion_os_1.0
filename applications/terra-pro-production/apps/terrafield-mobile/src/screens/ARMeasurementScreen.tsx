import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Image,
  Modal,
  Switch,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";

import {
  ARMeasurementService,
  MeasurementType,
  MeasurementUnit,
  MeasurementResult,
  RoomBoundary,
  Point,
} from "../services/ARMeasurementService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * ARMeasurementScreen
 *
 * A screen for measuring real-world dimensions using augmented reality
 */
const ARMeasurementScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId;

  // Services
  const arService = ARMeasurementService.getInstance();

  // Refs
  const arViewRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isARSessionActive, setIsARSessionActive] = useState<boolean>(false);
  const [currentMeasurementType, setCurrentMeasurementType] = useState<MeasurementType>(
    MeasurementType.DISTANCE
  );
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([]);
  const [roomBoundary, setRoomBoundary] = useState<RoomBoundary | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [unitSystem, setUnitSystem] = useState<MeasurementUnit>(MeasurementUnit.IMPERIAL);
  const [captureImage, setCaptureImage] = useState<boolean>(true);
  const [showMeasurementDetails, setShowMeasurementDetails] = useState<boolean>(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementResult | null>(null);
  const [arReady, setARReady] = useState<boolean>(false);
  const [showRoomDetails, setShowRoomDetails] = useState<boolean>(false);

  // Load data and start AR session
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Load previous measurements
        const savedMeasurements = await arService.loadMeasurements();
        setMeasurements(savedMeasurements);

        // Simulate AR initialization
        setTimeout(() => {
          setARReady(true);
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error("Error initializing AR:", error);
        Alert.alert("Error", "Failed to initialize AR features");
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (isARSessionActive) {
        arService.stopARSession();
      }
    };
  }, []);

  // Start AR session
  const handleStartARSession = async () => {
    try {
      const started = await arService.startARSession({
        unitSystem,
        captureImage,
        saveMeasurements: true,
        confidenceThreshold: 0.7,
        continuousMeasurement: false,
        detectSurfaces: true,
      });

      if (started) {
        setIsARSessionActive(true);
        // Reset state
        setPoints([]);
        setRoomBoundary(null);
      } else {
        Alert.alert("Error", "Failed to start AR session");
      }
    } catch (error) {
      console.error("Error starting AR session:", error);
      Alert.alert("Error", "Failed to start AR session");
    }
  };

  // Stop AR session
  const handleStopARSession = () => {
    if (isARSessionActive) {
      arService.stopARSession();
      setIsARSessionActive(false);

      // Refresh measurements
      setMeasurements(arService.getMeasurements());
    }
  };

  // Handle measurement type change
  const handleChangeMeasurementType = (type: MeasurementType) => {
    setCurrentMeasurementType(type);
    // Reset points when changing measurement type
    setPoints([]);
  };

  // Handle adding a point
  const handleAddPoint = () => {
    if (!isARSessionActive) {
      return;
    }

    // In a real app, this would get a point from the AR session
    // For this demo, generate a random point
    const newPoint: Point = {
      x: Math.random() * 5 - 2.5,
      y: Math.random() * 2,
      z: Math.random() * 5 - 2.5,
      confidence: 0.8 + Math.random() * 0.2,
    };

    setPoints([...points, newPoint]);

    // If we have enough points for the current measurement type, create measurement
    if (
      (currentMeasurementType === MeasurementType.DISTANCE && points.length === 1) ||
      (currentMeasurementType === MeasurementType.AREA && points.length >= 2)
    ) {
      createMeasurement([...points, newPoint]);
    }
  };

  // Create measurement
  const createMeasurement = async (pointsToUse: Point[]) => {
    try {
      let result: MeasurementResult;

      if (currentMeasurementType === MeasurementType.DISTANCE && pointsToUse.length === 2) {
        result = await arService.measureDistance(
          pointsToUse[0],
          pointsToUse[1],
          "Distance Measurement"
        );
      } else if (currentMeasurementType === MeasurementType.AREA && pointsToUse.length >= 3) {
        result = await arService.measureArea(pointsToUse, "Area Measurement");
      } else {
        return;
      }

      // Add to measurements
      setMeasurements([...measurements, result]);

      // Show result
      setSelectedMeasurement(result);
      setShowMeasurementDetails(true);

      // Reset points
      setPoints([]);
    } catch (error) {
      console.error("Error creating measurement:", error);
      Alert.alert("Error", "Failed to create measurement");
    }
  };

  // Handle room detection
  const handleDetectRoom = async () => {
    if (!isARSessionActive) {
      return;
    }

    try {
      setIsLoading(true);

      const boundary = await arService.detectRoomBoundaries();
      setRoomBoundary(boundary);
      setShowRoomDetails(true);

      setIsLoading(false);
    } catch (error) {
      console.error("Error detecting room boundaries:", error);
      Alert.alert("Error", "Failed to detect room boundaries");
      setIsLoading(false);
    }
  };

  // Render measurement tools
  const renderMeasurementTools = () => {
    return (
      <View style={styles.toolsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentMeasurementType === MeasurementType.DISTANCE && styles.activeToolButton,
            ]}
            onPress={() => handleChangeMeasurementType(MeasurementType.DISTANCE)}
          >
            <MaterialCommunityIcons
              name="ruler"
              size={24}
              color={currentMeasurementType === MeasurementType.DISTANCE ? "#fff" : "#333"}
            />
            <Text
              style={[
                styles.toolText,
                currentMeasurementType === MeasurementType.DISTANCE && styles.activeToolText,
              ]}
            >
              Distance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              currentMeasurementType === MeasurementType.AREA && styles.activeToolButton,
            ]}
            onPress={() => handleChangeMeasurementType(MeasurementType.AREA)}
          >
            <MaterialCommunityIcons
              name="vector-square"
              size={24}
              color={currentMeasurementType === MeasurementType.AREA ? "#fff" : "#333"}
            />
            <Text
              style={[
                styles.toolText,
                currentMeasurementType === MeasurementType.AREA && styles.activeToolText,
              ]}
            >
              Area
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleDetectRoom}>
            <MaterialCommunityIcons name="floor-plan" size={24} color="#333" />
            <Text style={styles.toolText}>Room</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={() => setShowSettings(true)}>
            <MaterialCommunityIcons name="cog" size={24} color="#333" />
            <Text style={styles.toolText}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // Render AR view
  const renderARView = () => {
    if (!arReady) {
      return (
        <View style={styles.arLoadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.arLoadingText}>Initializing AR...</Text>
        </View>
      );
    }

    return (
      <View style={styles.arViewContainer} ref={arViewRef}>
        {/* Simulated AR View */}
        <View style={styles.simulatedARView}>
          <Text style={styles.simulatedARText}>Simulated AR View</Text>

          {isARSessionActive ? (
            <>
              <Text style={styles.arInstructionText}>
                {currentMeasurementType === MeasurementType.DISTANCE &&
                  (points.length === 0 ? "Tap to place first point" : "Tap to place second point")}
                {currentMeasurementType === MeasurementType.AREA &&
                  (points.length === 0
                    ? "Tap to place first point"
                    : points.length < 3
                      ? "Tap to place more points (min 3)"
                      : "Tap to add more points or complete area")}
              </Text>

              {/* Display points */}
              {points.map((point /* , index */) => (
                <View
                  key={index}
                  style={[
                    styles.arPoint,
                    {
                      left: `${(50 + point.x * 10 + point.z * 5) % 80}%`,
                      top: `${(50 - point.y * 10 - point.z * 5) % 80}%`,
                    },
                  ]}
                >
                  <Text style={styles.arPointLabel}>{index + 1}</Text>
                </View>
              ))}

              {/* Add point button */}
              <TouchableOpacity style={styles.addPointButton} onPress={handleAddPoint}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Complete measurement button (for Area) */}
              {currentMeasurementType === MeasurementType.AREA && points.length >= 3 && (
                <TouchableOpacity
                  style={styles.completeMeasurementButton}
                  onPress={() => createMeasurement(points)}
                >
                  <MaterialCommunityIcons name="check" size={24} color="#fff" />
                  <Text style={styles.completeMeasurementText}>Complete</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity style={styles.startARButton} onPress={handleStartARSession}>
              <MaterialCommunityIcons name="play" size={24} color="#fff" />
              <Text style={styles.startARText}>Start AR Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AR Session Controls */}
        {isARSessionActive && (
          <TouchableOpacity style={styles.stopARButton} onPress={handleStopARSession}>
            <MaterialCommunityIcons name="stop" size={24} color="#fff" />
            <Text style={styles.stopARText}>Stop AR</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render measurement list
  const renderMeasurementList = () => {
    if (measurements.length === 0) {
      return (
        <View style={styles.emptyMeasurements}>
          <MaterialCommunityIcons name="ruler" size={48} color="#bdc3c7" />
          <Text style={styles.emptyMeasurementsText}>No measurements yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={measurements}
        keyExtractor={(item) => item.timestamp.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.measurementItem}
            onPress={() => {
              setSelectedMeasurement(item);
              setShowMeasurementDetails(true);
            }}
          >
            <View style={styles.measurementIcon}><>

              <MaterialCommunityIcons
                name={
                  item.type === MeasurementType.DISTANCE
                    ? "ruler"
                    : item.type === MeasurementType.AREA
                      ? "vector-square"
                      : "ruler"
                }
                size={24}
                color="#3498db"
              />
            </View>
            <View
</> style={styles.measurementInfo}><>

              <Text style={styles.measurementLabel}>
                {item.label ||
                  `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Measurement`}
              </Text>
              <Text
</> style={styles.measurementValue}>{arService.formatMeasurement(item)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#bdc3c7" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.measurementListContent}
      />
    );
  };

  // Render settings modal
  const renderSettingsModal = () => {
    return (
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Measurement Settings</Text>
              <TouchableOpacity
</> onPress={() => setShowSettings(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}><>

              <Text style={styles.settingLabel}>Unit System</Text>
              <View
</> style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    unitSystem === MeasurementUnit.METRIC && styles.activeSegment,
                  ]}
                  onPress={() => setUnitSystem(MeasurementUnit.METRIC)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      unitSystem === MeasurementUnit.METRIC && styles.activeSegmentText,
                    ]}
                  >
                    Metric
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    unitSystem === MeasurementUnit.IMPERIAL && styles.activeSegment,
                  ]}
                  onPress={() => setUnitSystem(MeasurementUnit.IMPERIAL)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      unitSystem === MeasurementUnit.IMPERIAL && styles.activeSegmentText,
                    ]}
                  >
                    Imperial
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}><>

              <Text style={styles.settingLabel}>Capture Images</Text>
              <Switch
</>
                value={captureImage}
                onValueChange={setCaptureImage}
                trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                thumbColor={captureImage ? "#fff" : "#f4f3f4"}
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.modalButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render measurement details modal
  const renderMeasurementDetailsModal = () => {
    if (!selectedMeasurement) return null;

    return (
      <Modal
        visible={showMeasurementDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMeasurementDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>
                {selectedMeasurement.label ||
                  `${selectedMeasurement.type.charAt(0).toUpperCase() + selectedMeasurement.type.slice(1)} Measurement`}
              </Text>
              <TouchableOpacity
</> onPress={() => setShowMeasurementDetails(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.measurementDetailsContainer}>
              <View style={styles.measurementDetailItem}><>

                <Text style={styles.measurementDetailLabel}>Type:</Text>
                <Text
</> style={styles.measurementDetailValue}>
                  {selectedMeasurement.type.charAt(0).toUpperCase() +
                    selectedMeasurement.type.slice(1)}
                </Text>
              </View>

              <View style={styles.measurementDetailItem}><>

                <Text style={styles.measurementDetailLabel}>Value:</Text>
                <Text
</> style={styles.measurementDetailValue}>
                  {arService.formatMeasurement(selectedMeasurement)}
                </Text>
              </View>

              <View style={styles.measurementDetailItem}><>

                <Text style={styles.measurementDetailLabel}>Confidence:</Text>
                <Text
</> style={styles.measurementDetailValue}>
                  {(selectedMeasurement.confidence * 100).toFixed(1)}%
                </Text>
              </View>

              <View style={styles.measurementDetailItem}><>

                <Text style={styles.measurementDetailLabel}>Date:</Text>
                <Text
</> style={styles.measurementDetailValue}>
                  {new Date(selectedMeasurement.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.measurementDetailItem}><>

                <Text style={styles.measurementDetailLabel}>Points:</Text>
                <Text
</> style={styles.measurementDetailValue}>
                  {selectedMeasurement.points.length}
                </Text>
              </View>
            </View>

            {selectedMeasurement.imageUri && (
              <View style={styles.measurementImageContainer}><>

                <Text style={styles.measurementImageLabel}>Measurement Image:</Text>
                <Image
</>
                  source={{ uri: selectedMeasurement.imageUri }}
                  style={styles.measurementImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowMeasurementDetails(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render room details modal
  const renderRoomDetailsModal = () => {
    if (!roomBoundary) return null;

    return (
      <Modal
        visible={showRoomDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoomDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Room Measurements</Text>
              <TouchableOpacity
</> onPress={() => setShowRoomDetails(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.roomDetailsScrollView}>
              <View style={styles.roomDetailsContainer}>
                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Floor Area:</Text>
                  <Text
</> style={styles.roomDetailValue}>
                    {unitSystem === MeasurementUnit.METRIC
                      ? `${roomBoundary.floorArea.toFixed(2)} m²`
                      : `${(roomBoundary.floorArea * 10.7639).toFixed(2)} ft²`}
                  </Text>
                </View>

                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Ceiling Height:</Text>
                  <Text
</> style={styles.roomDetailValue}>
                    {unitSystem === MeasurementUnit.METRIC
                      ? `${roomBoundary.ceilingHeight.toFixed(2)} m`
                      : `${(roomBoundary.ceilingHeight * 3.28084).toFixed(2)} ft`}
                  </Text>
                </View>

                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Volume:</Text>
                  <Text
</> style={styles.roomDetailValue}>
                    {unitSystem === MeasurementUnit.METRIC
                      ? `${roomBoundary.volume.toFixed(2)} m³`
                      : `${(roomBoundary.volume * 35.3147).toFixed(2)} ft³`}
                  </Text>
                </View>

                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Number of Walls:</Text>
                  <Text
</> style={styles.roomDetailValue}>{roomBoundary.walls.length}</Text>
                </View>

                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Openings:</Text>
                  <Text
</> style={styles.roomDetailValue}>
                    {roomBoundary.openings.filter((o) => o.type === "door").length} Doors,
                    {roomBoundary.openings.filter((o) => o.type === "window").length} Windows
                  </Text>
                </View>

                <View style={styles.roomDetailItem}><>

                  <Text style={styles.roomDetailLabel}>Confidence:</Text>
                  <Text
</> style={styles.roomDetailValue}>
                    {(roomBoundary.confidence * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.wallDetailsContainer}>
                  <Text style={styles.wallDetailsSectionTitle}>Wall Surfaces:</Text>

                  {roomBoundary.walls.map((wall /* , index */) => {
                    // Calculate wall dimensions
                    const width = Math.sqrt(
                      Math.pow(wall[1].x - wall[0].x, 2) + Math.pow(wall[1].z - wall[0].z, 2)
                    );
                    const height = wall[2].y - wall[1].y;
                    const area = width * height;

                    return (
                      <View key={index} style={styles.wallDetailItem}><>

                        <Text style={styles.wallDetailTitle}>Wall {index + 1}:</Text>
                        <Text
</> style={styles.wallDetailText}>
                          Width:{" "}
                          {unitSystem === MeasurementUnit.METRIC
                            ? `${width.toFixed(2)} m`
                            : `${(width * 3.28084).toFixed(2)} ft`}
                        </Text><>

                        <Text style={styles.wallDetailText}>
                          Height:{" "}
                          {unitSystem === MeasurementUnit.METRIC
                            ? `${height.toFixed(2)} m`
                            : `${(height * 3.28084).toFixed(2)} ft`}
                        </Text>
                        <Text
</> style={styles.wallDetailText}>
                          Area:{" "}
                          {unitSystem === MeasurementUnit.METRIC
                            ? `${area.toFixed(2)} m²`
                            : `${(area * 10.7639).toFixed(2)} ft²`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowRoomDetails(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Initializing AR features...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>AR Measurements</Text>
      </View>

      {/* Measurement Tools */}
      {renderMeasurementTools()}

      {/* Main Content */}
      <View style={styles.content}>
        {/* AR View */}
        {renderARView()}

        {/* Measurement List */}
        <View style={styles.measurementListContainer}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          {renderMeasurementList()}
        </View>
      </View>

      {/* Modals */}
      {renderSettingsModal()}
      {renderMeasurementDetailsModal()}
      {renderRoomDetailsModal()}
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
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
  },
  toolsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  toolsScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  toolButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  activeToolButton: {
    backgroundColor: "#3498db",
  },
  toolText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  activeToolText: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  arViewContainer: {
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#000",
    position: "relative",
  },
  simulatedARView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3e50",
  },
  simulatedARText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    position: "absolute",
    top: 16,
    left: 16,
  },
  arInstructionText: {
    position: "absolute",
    top: 16,
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
  },
  arPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3498db",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  arPointLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  startARButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  startARText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  stopARButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  stopARText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  addPointButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  completeMeasurementButton: {
    position: "absolute",
    bottom: 16,
    left: 84,
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  completeMeasurementText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  arLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3e50",
  },
  arLoadingText: {
    color: "#fff",
    marginTop: 16,
  },
  measurementListContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emptyMeasurements: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyMeasurementsText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  measurementListContent: {
    flexGrow: 1,
  },
  measurementItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  measurementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  measurementInfo: {
    flex: 1,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 6,
    overflow: "hidden",
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeSegment: {
    backgroundColor: "#3498db",
  },
  segmentText: {
    color: "#3498db",
    fontSize: 14,
  },
  activeSegmentText: {
    color: "#fff",
  },
  measurementDetailsContainer: {
    marginTop: 16,
  },
  measurementDetailItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  measurementDetailLabel: {
    width: 100,
    fontSize: 16,
    color: "#7f8c8d",
  },
  measurementDetailValue: {
    flex: 1,
    fontSize: 16,
  },
  measurementImageContainer: {
    marginTop: 16,
  },
  measurementImageLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  measurementImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  roomDetailsScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  roomDetailsContainer: {
    marginTop: 16,
  },
  roomDetailItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  roomDetailLabel: {
    width: 120,
    fontSize: 16,
    color: "#7f8c8d",
  },
  roomDetailValue: {
    flex: 1,
    fontSize: 16,
  },
  wallDetailsContainer: {
    marginTop: 24,
  },
  wallDetailsSectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
  },
  wallDetailItem: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  wallDetailTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  wallDetailText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default ARMeasurementScreen;
