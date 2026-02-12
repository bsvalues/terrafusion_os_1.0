import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Slider } from "@rneui/themed";
import * as Location from "expo-location";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { PropertyData, ComparableData } from "../services/types";

// Screen width for responsive sizing
const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * Adjustment types for comparable properties
 */
export enum AdjustmentType {
  LOCATION = "location",
  SIZE = "size",
  CONDITION = "condition",
  AGE = "age",
  QUALITY = "quality",
  FEATURES = "features",
}

/**
 * Adjustment factor structure
 */
export interface AdjustmentFactor {
  type: AdjustmentType;
  amount: number; // Percentage adjustment
  reason: string;
}

/**
 * Enhanced comparable with adjustments
 */
export interface EnhancedComparable extends ComparableData {
  distance?: number; // Distance from subject property in miles
  adjustments: AdjustmentFactor[];
  totalAdjustment: number; // Total percentage adjustment
  adjustedPrice: number;
  photos?: string[]; // Photo URLs
}

/**
 * Props for the property comparison component
 */
interface PropertyComparisonProps {
  subjectProperty: PropertyData;
  comparables: ComparableData[];
  onComparablesUpdate: (comparables: EnhancedComparable[]) => void;
  onComparableSelect?: (comparable: EnhancedComparable) => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  maxDistance?: number; // Maximum distance in miles
  radius?: number; // Search radius in miles
  fetchNearbyComparables?: (lat: number, lng: number, radius: number) => Promise<ComparableData[]>;
}

/**
 * Calculate distance between two coordinates in miles
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get appropriate map deltas based on radius
 */
const getRegionForRadius = (
  latitude: number,
  longitude: number,
  radiusMiles: number
): { latitudeDelta: number; longitudeDelta: number } => {
  const oneDegreeOfLatitudeInMiles = 69;
  const latitudeDelta = radiusMiles / oneDegreeOfLatitudeInMiles;
  const longitudeDelta = latitudeDelta * 1.5; // Adjust for aspect ratio

  return {
    latitudeDelta,
    longitudeDelta,
  };
};

/**
 * PropertyComparisonTool component
 * A specialized tool for comparing properties in the field
 */
export const PropertyComparisonTool: React.FC<PropertyComparisonProps> = ({
  subjectProperty,
  comparables,
  onComparablesUpdate,
  onComparableSelect,
  containerStyle,
  labelStyle,
  disabled = false,
  maxDistance = 10, // Default 10 miles
  radius = 5, // Default 5 miles
  fetchNearbyComparables,
}) => {
  // State
  const [enhancedComparables, setEnhancedComparables] = useState<EnhancedComparable[]>([]);
  const [selectedComparable, setSelectedComparable] = useState<string | null>(null);
  const [mapView, setMapView] = useState<boolean>(true);
  const [searchRadius, setSearchRadius] = useState<number>(radius);
  const [loading, setLoading] = useState<boolean>(false);

  // Get subject property coordinates
  const subjectLat = subjectProperty.latitude || 0;
  const subjectLng = subjectProperty.longitude || 0;

  // Initial map region
  const mapRegion = {
    latitude: subjectLat,
    longitude: subjectLng,
    ...getRegionForRadius(subjectLat, subjectLng, searchRadius),
  };

  // Enhance comparables with distance and adjustments
  useEffect(() => {
    if (!subjectProperty || !comparables.length) return;

    // Calculate distance and add default adjustments
    const enhanced = comparables.map((comp) => {
      // Calculate distance if coordinates are available
      let distance;
      if (subjectLat && subjectLng && comp.latitude && comp.longitude) {
        distance = calculateDistance(subjectLat, subjectLng, comp.latitude, comp.longitude);
      }

      // Calculate default adjustments
      const adjustments: AdjustmentFactor[] = [];

      // Location adjustment based on distance
      if (distance !== undefined) {
        const locationAdjustment = distance > 2 ? Math.min(distance * 0.5, 10) : 0; // 0.5% per mile up to 10%

        adjustments.push({
          type: AdjustmentType.LOCATION,
          amount: locationAdjustment,
          reason: `${distance.toFixed(2)} miles from subject property`,
        });
      }

      // Size adjustment
      if (subjectProperty.squareFeet && comp.squareFeet) {
        const sizeDiff =
          (comp.squareFeet - subjectProperty.squareFeet) / subjectProperty.squareFeet;
        const sizeAdjustment = -1 * sizeDiff * 100; // Negative if comp is larger

        adjustments.push({
          type: AdjustmentType.SIZE,
          amount: sizeAdjustment,
          reason: `Size difference of ${(sizeDiff * 100).toFixed(2)}%`,
        });
      }

      // Age adjustment
      if (subjectProperty.yearBuilt && comp.yearBuilt) {
        const ageDiff = subjectProperty.yearBuilt - comp.yearBuilt;
        const ageAdjustment = ageDiff * 0.5; // 0.5% per year

        adjustments.push({
          type: AdjustmentType.AGE,
          amount: ageAdjustment,
          reason: `Age difference of ${Math.abs(ageDiff)} years`,
        });
      }

      // Calculate total adjustment and adjusted price
      const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
      const adjustedPrice = comp.salePrice ? comp.salePrice * (1 + totalAdjustment / 100) : 0;

      return {
        ...comp,
        distance,
        adjustments,
        totalAdjustment,
        adjustedPrice,
      };
    });

    // Sort by distance
    enhanced.sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });

    // Filter by max distance if needed
    const filtered = maxDistance
      ? enhanced.filter((comp) => comp.distance === undefined || comp.distance <= maxDistance)
      : enhanced;

    setEnhancedComparables(filtered);
    onComparablesUpdate(filtered);

    // Select first comparable
    if (filtered.length > 0 && !selectedComparable) {
      setSelectedComparable(filtered[0].id);
      onComparableSelect && onComparableSelect(filtered[0]);
    }
  }, [subjectProperty, comparables]);

  // Handle comparable selection
  const handleSelectComparable = (id: string) => {
    if (disabled) return;

    setSelectedComparable(id);
    const selected = enhancedComparables.find((comp) => comp.id === id);
    if (selected && onComparableSelect) {
      onComparableSelect(selected);
    }
  };

  // Toggle view mode
  const toggleView = () => {
    if (disabled) return;
    setMapView(!mapView);
  };

  // Update adjustment for a comparable
  const updateAdjustment = (
    comparableId: string,
    adjustmentType: AdjustmentType,
    amount: number,
    reason?: string
  ) => {
    if (disabled) return;

    const updated = enhancedComparables.map((comp) => {
      if (comp.id !== comparableId) return comp;

      // Update or add adjustment
      const existingIndex = comp.adjustments.findIndex((adj) => adj.type === adjustmentType);
      const updatedAdjustments = [...comp.adjustments];

      if (existingIndex >= 0) {
        updatedAdjustments[existingIndex] = {
          ...updatedAdjustments[existingIndex],
          amount,
          reason: reason || updatedAdjustments[existingIndex].reason,
        };
      } else {
        updatedAdjustments.push({
          type: adjustmentType,
          amount,
          reason: reason || `Manual adjustment`,
        });
      }

      // Recalculate total adjustment and price
      const totalAdjustment = updatedAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
      const adjustedPrice = comp.salePrice ? comp.salePrice * (1 + totalAdjustment / 100) : 0;

      return {
        ...comp,
        adjustments: updatedAdjustments,
        totalAdjustment,
        adjustedPrice,
      };
    });

    setEnhancedComparables(updated);
    onComparablesUpdate(updated);
  };

  // Fetch nearby comparables
  const handleFetchNearbyComparables = async () => {
    if (disabled || !fetchNearbyComparables) return;

    try {
      setLoading(true);

      const nearbyComps = await fetchNearbyComparables(subjectLat, subjectLng, searchRadius);

      if (nearbyComps.length === 0) {
        Alert.alert(
          "No Comparables Found",
          `No comparable properties found within ${searchRadius} miles.`
        );
      } else {
        Alert.alert(
          "Comparables Found",
          `Found ${nearbyComps.length} comparable properties within ${searchRadius} miles.`
        );
      }
    } catch (error) {
      console.error("Error fetching nearby comparables:", error);
      Alert.alert("Error", "Failed to fetch nearby comparables. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render map view
  const renderMapView = () => {
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
        >
          {/* Subject property marker */}
          <Marker
            coordinate={{
              latitude: subjectLat,
              longitude: subjectLng,
            }}
            title="Subject Property"
            description={subjectProperty.address}
            pinColor="blue"
          />

          {/* Radius circle */}
          <Circle
            center={{
              latitude: subjectLat,
              longitude: subjectLng,
            }}
            radius={searchRadius * 1609.34} // Convert miles to meters
            fillColor="rgba(52, 152, 219, 0.15)"
            strokeColor="rgba(52, 152, 219, 0.5)"
          />

          {/* Comparable markers */}
          {enhancedComparables.map((comp) => {
            if (!comp.latitude || !comp.longitude) return null;

            return (
              <Marker
                key={comp.id}
                coordinate={{
                  latitude: comp.latitude,
                  longitude: comp.longitude,
                }}
                title={comp.address}
                description={`$${comp.salePrice?.toLocaleString()}`}
                pinColor={selectedComparable === comp.id ? "green" : "red"}
                onPress={() => handleSelectComparable(comp.id)}
              />
            );
          })}
        </MapView>

        {/* Search radius control */}
        <View style={styles.radiusControl}><>

          <Text style={styles.radiusLabel}>Search Radius: {searchRadius} miles</Text>
          <Slider
</>
            value={searchRadius}
            onValueChange={(value) => setSearchRadius(value)}
            minimumValue={1}
            maximumValue={20}
            step={1}
            thumbStyle={{ backgroundColor: "#3498db" }}
            disabled={disabled}
            style={styles.radiusSlider}
          />
          {fetchNearbyComparables && (
            <TouchableOpacity
              style={[styles.fetchButton, disabled && styles.disabledButton]}
              onPress={handleFetchNearbyComparables}
              disabled={disabled || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="magnify" size={18} color="#fff" />
                  <Text style={styles.fetchButtonText}>Find Comparables</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <ScrollView style={styles.listContainer}>
        {enhancedComparables.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="home-search" size={32} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No comparable properties available</Text>
            {fetchNearbyComparables && (
              <TouchableOpacity
                style={[
                  styles.fetchButton,
                  styles.emptyFetchButton,
                  disabled && styles.disabledButton,
                ]}
                onPress={handleFetchNearbyComparables}
                disabled={disabled || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="magnify" size={18} color="#fff" />
                    <Text style={styles.fetchButtonText}>Find Comparables</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          enhancedComparables.map((comp) => (
            <TouchableOpacity
              key={comp.id}
              style={[
                styles.comparableItem,
                selectedComparable === comp.id && styles.selectedComparable,
                disabled && styles.disabledItem,
              ]}
              onPress={() => handleSelectComparable(comp.id)}
              disabled={disabled}
            >
              <View style={styles.comparableHeader}>
                <View style={styles.comparableInfo}><>

                  <Text style={styles.comparableAddress} numberOfLines={1}>
                    {comp.address}
                  </Text>
                  <Text
</> style={styles.comparableSubInfo}>
                    {comp.city}, {comp.state} {comp.zipCode}
                  </Text>
                  {comp.distance !== undefined && (
                    <View style={styles.distanceBadge}>
                      <MaterialCommunityIcons name="map-marker-distance" size={14} color="#fff" />
                      <Text style={styles.distanceText}>{comp.distance.toFixed(2)} mi</Text>
                    </View>
                  )}
                </View>

                <View style={styles.pricingContainer}><>

                  <Text style={styles.salePrice}>${comp.salePrice?.toLocaleString() || "N/A"}</Text>
                  <Text
</>
                    style={[
                      styles.adjustedPrice,
                      comp.totalAdjustment > 0
                        ? styles.positiveAdjustment
                        : styles.negativeAdjustment,
                    ]}
                  >
                    {comp.totalAdjustment > 0 ? "+" : ""}
                    {comp.totalAdjustment.toFixed(2)}%
                  </Text>
                  <Text style={styles.adjustedPriceValue}>
                    ${comp.adjustedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              <View style={styles.comparableDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="home-floor-0" size={16} color="#7f8c8d" />
                  <Text style={styles.detailText}>
                    {comp.squareFeet?.toLocaleString() || "N/A"} sq ft
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="bed" size={16} color="#7f8c8d" />
                  <Text style={styles.detailText}>{comp.bedrooms || "N/A"} beds</Text>
                </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="shower" size={16} color="#7f8c8d" />
                  <Text style={styles.detailText}>{comp.bathrooms || "N/A"} baths</Text>
                </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="calendar" size={16} color="#7f8c8d" />
                  <Text style={styles.detailText}>Built {comp.yearBuilt || "N/A"}</Text>
                </View>
              </View>

              {selectedComparable === comp.id && (
                <View style={styles.adjustmentsContainer}>
                  <Text style={styles.adjustmentsTitle}>Adjustments:</Text>

                  {comp.adjustments.map((adjustment /* , index */) => (
                    <View key={index} style={styles.adjustmentItem}>
                      <View style={styles.adjustmentHeader}><>

                        <Text style={styles.adjustmentType}>
                          {adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)}:
                        </Text>
                        <View
</> style={styles.adjustmentValueContainer}><>

                          <Text
                            style={[
                              styles.adjustmentValue,
                              adjustment.amount > 0
                                ? styles.positiveAdjustment
                                : styles.negativeAdjustment,
                            ]}
                          >
                            {adjustment.amount > 0 ? "+" : ""}
                            {adjustment.amount.toFixed(2)}%
                          </Text>
                          <Slider
</>
                            value={adjustment.amount}
                            onValueChange={(value) =>
                              updateAdjustment(comp.id, adjustment.type, value)
                            }
                            minimumValue={-50}
                            maximumValue={50}
                            step={0.5}
                            thumbStyle={{ backgroundColor: "#3498db" }}
                            minimumTrackTintColor="#e74c3c"
                            maximumTrackTintColor="#2ecc71"
                            disabled={disabled}
                            style={styles.adjustmentSlider}
                          />
                        </View>
                      </View>
                      <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>
                    </View>
                  ))}

                  {/* Add custom adjustment */}
                  <TouchableOpacity
                    style={[styles.addAdjustmentButton, disabled && styles.disabledButton]}
                    onPress={() => {
                      if (disabled) return;

                      // Check if we have a quality adjustment already
                      const hasQuality = comp.adjustments.some(
                        (adj) => adj.type === AdjustmentType.QUALITY
                      );

                      if (!hasQuality) {
                        updateAdjustment(comp.id, AdjustmentType.QUALITY, 0, "Quality adjustment");
                      }

                      // Check if we have a features adjustment already
                      const hasFeatures = comp.adjustments.some(
                        (adj) => adj.type === AdjustmentType.FEATURES
                      );

                      if (!hasFeatures) {
                        updateAdjustment(
                          comp.id,
                          AdjustmentType.FEATURES,
                          0,
                          "Features adjustment"
                        );
                      }
                    }}
                    disabled={disabled || comp.adjustments.length >= 6}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                    <Text style={styles.addAdjustmentText}>Add Adjustment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}><>

        <Text style={[styles.headerTitle, labelStyle]}>Property Comparison</Text>

        <TouchableOpacity
</>
          style={[styles.viewToggle, disabled && styles.disabledButton]}
          onPress={toggleView}
          disabled={disabled}
        >
          <MaterialCommunityIcons
            name={mapView ? "format-list-bulleted" : "map"}
            size={20}
            color="#fff"
          />
          <Text style={styles.viewToggleText}>{mapView ? "List View" : "Map View"}</Text>
        </TouchableOpacity>
      </View>

      {/* Subject property summary */}
      <View style={styles.subjectProperty}>
        <View style={styles.subjectPropertyInfo}><>

          <Text style={styles.subjectPropertyTitle}>Subject Property:</Text>
          <Text
</> style={styles.subjectPropertyAddress}>{subjectProperty.address}</Text>
          <Text style={styles.subjectPropertyDetails}>
            {subjectProperty.squareFeet?.toLocaleString() || "N/A"} sq ft •
            {subjectProperty.bedrooms || "N/A"} beds •{subjectProperty.bathrooms || "N/A"} baths •
            Built {subjectProperty.yearBuilt || "N/A"}
          </Text>
        </View>
      </View>

      {/* View content */}
      <View style={styles.content}>{mapView ? renderMapView() : renderListView()}</View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Comparables Summary ({enhancedComparables.length})</Text>

        {enhancedComparables.length > 0 && (
          <View style={styles.summaryValues}>
            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Avg. Distance:</Text>
              <Text
</> style={styles.summaryValue}>
                {enhancedComparables.reduce((sum, comp) => sum + (comp.distance || 0), 0) /
                  enhancedComparables.length}
                miles
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Avg. Price:</Text>
              <Text
</> style={styles.summaryValue}>
                $
                {(
                  enhancedComparables.reduce((sum, comp) => sum + (comp.salePrice || 0), 0) /
                  enhancedComparables.length
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>

            <View style={styles.summaryItem}><>

              <Text style={styles.summaryLabel}>Avg. Adjusted:</Text>
              <Text
</> style={styles.summaryValue}>
                $
                {(
                  enhancedComparables.reduce((sum, comp) => sum + (comp.adjustedPrice || 0), 0) /
                  enhancedComparables.length
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#3498db",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  viewToggleText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
  },
  subjectProperty: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  subjectPropertyInfo: {
    flex: 1,
  },
  subjectPropertyTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  subjectPropertyAddress: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  subjectPropertyDetails: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  mapContainer: {
    height: 400,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  radiusControl: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  radiusSlider: {
    marginBottom: 12,
  },
  fetchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fetchButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
  },
  listContainer: {
    maxHeight: 460,
    padding: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginVertical: 12,
  },
  emptyFetchButton: {
    marginTop: 16,
  },
  comparableItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedComparable: {
    borderColor: "#3498db",
    borderWidth: 2,
  },
  comparableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  comparableInfo: {
    flex: 1,
    marginRight: 8,
  },
  comparableAddress: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  comparableSubInfo: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  distanceText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 2,
  },
  pricingContainer: {
    alignItems: "flex-end",
  },
  salePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  adjustedPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  positiveAdjustment: {
    color: "#e74c3c",
  },
  negativeAdjustment: {
    color: "#2ecc71",
  },
  adjustedPriceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
  },
  comparableDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  adjustmentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  adjustmentsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  adjustmentItem: {
    marginBottom: 10,
  },
  adjustmentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  adjustmentType: {
    fontSize: 14,
    color: "#333",
    width: 80,
  },
  adjustmentValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  adjustmentValue: {
    fontSize: 14,
    width: 60,
    textAlign: "right",
    marginRight: 8,
  },
  adjustmentSlider: {
    flex: 1,
    height: 30,
  },
  adjustmentReason: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
    marginLeft: 80,
  },
  addAdjustmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9b59b6",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  addAdjustmentText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  summary: {
    padding: 12,
    backgroundColor: "#f7f9fa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  summaryValues: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    marginRight: 16,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledItem: {
    opacity: 0.7,
  },
});
