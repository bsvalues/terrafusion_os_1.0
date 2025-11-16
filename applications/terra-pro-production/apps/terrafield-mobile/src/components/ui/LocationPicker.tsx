import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

/**
 * Location coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Location address
 */
export interface LocationAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

/**
 * Complete location data
 */
export interface LocationData {
  coordinates: Coordinates;
  address?: LocationAddress;
  timestamp: number;
}

/**
 * Props for the location picker component
 */
interface LocationPickerProps {
  label: string;
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  geocodeAddress?: boolean;
  showMap?: boolean;
  mapHeight?: number;
  disableEditing?: boolean;
}

/**
 * LocationPicker component
 * A specialized input for capturing GPS coordinates
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  value,
  onChange,
  helperText,
  error,
  required = false,
  containerStyle,
  labelStyle,
  disabled = false,
  geocodeAddress = true,
  showMap = true,
  mapHeight = 200,
  disableEditing = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  // Request location permissions
  useEffect(() => {
    const getLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to capture property coordinates.",
          [{ text: "OK" }]
        );
      }
    };

    getLocationPermission();
  }, []);

  // Get current location
  const getCurrentLocation = async () => {
    if (disabled || disableEditing) return;

    try {
      setLoading(true);

      // Check permissions
      if (permissionStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required for this feature.", [
            { text: "OK" },
          ]);
          setLoading(false);
          return;
        }
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      // Geocode location to get address if enabled
      let address: LocationAddress | undefined;

      if (geocodeAddress) {
        try {
          const geocodeResult = await Location.reverseGeocodeAsync({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          });

          if (geocodeResult && geocodeResult.length > 0) {
            const geocode = geocodeResult[0];
            address = {
              street: geocode.street,
              city: geocode.city,
              region: geocode.region,
              postalCode: geocode.postalCode,
              country: geocode.country,
              formattedAddress: [
                geocode.street,
                geocode.city,
                geocode.region,
                geocode.postalCode,
                geocode.country,
              ]
                .filter(Boolean)
                .join(", "),
            };
          }
        } catch (error) {
          console.warn("Error geocoding location:", error);
        }
      }

      // Create location data
      const locationData: LocationData = {
        coordinates,
        address,
        timestamp: Date.now(),
      };

      onChange(locationData);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Unable to get current location. Please try again.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  // Clear location
  const clearLocation = () => {
    if (disabled || disableEditing) return;
    onChange(null);
  };

  // Move marker on map
  const onMapMarkerDragEnd = (e: any) => {
    if (disabled || disableEditing) return;

    const coordinates: Coordinates = {
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
    };

    // Update location with new coordinates
    const locationData: LocationData = {
      coordinates,
      address: value?.address, // Keep existing address
      timestamp: Date.now(),
    };

    onChange(locationData);

    // Geocode new location if enabled
    if (geocodeAddress) {
      (async () => {
        try {
          const geocodeResult = await Location.reverseGeocodeAsync({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          });

          if (geocodeResult && geocodeResult.length > 0) {
            const geocode = geocodeResult[0];
            const address: LocationAddress = {
              street: geocode.street,
              city: geocode.city,
              region: geocode.region,
              postalCode: geocode.postalCode,
              country: geocode.country,
              formattedAddress: [
                geocode.street,
                geocode.city,
                geocode.region,
                geocode.postalCode,
                geocode.country,
              ]
                .filter(Boolean)
                .join(", "),
            };

            // Update with new address
            const updatedLocationData: LocationData = {
              coordinates,
              address,
              timestamp: Date.now(),
            };

            onChange(updatedLocationData);
          }
        } catch (error) {
          console.warn("Error geocoding location:", error);
        }
      })();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        {/* Location Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              loading && styles.loadingButton,
              (disabled || disableEditing) && styles.disabledButton,
            ]}
            onPress={getCurrentLocation}
            disabled={loading || disabled || disableEditing}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {loading ? "Getting Location..." : "Get Current Location"}
            </Text>
          </TouchableOpacity>

          {value && (
            <TouchableOpacity
              style={[styles.clearButton, (disabled || disableEditing) && styles.disabledButton]}
              onPress={clearLocation}
              disabled={disabled || disableEditing}
            >
              <MaterialCommunityIcons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Display */}
        {value && (
          <View style={styles.locationInfoContainer}>
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateItem}><>

                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text
</> style={styles.coordinateValue}>{value.coordinates.latitude.toFixed(6)}</Text>
              </View>

              <View style={styles.coordinateItem}><>

                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text
</> style={styles.coordinateValue}>{value.coordinates.longitude.toFixed(6)}</Text>
              </View>

              {value.coordinates.accuracy && (
                <View style={styles.coordinateItem}><>

                  <Text style={styles.coordinateLabel}>Accuracy</Text>
                  <Text
</> style={styles.coordinateValue}>
                    {value.coordinates.accuracy.toFixed(1)} m
                  </Text>
                </View>
              )}
            </View>

            {value.address && (
              <View style={styles.addressContainer}><>

                <Text style={styles.addressLabel}>Address</Text>
                <Text
</> style={styles.addressValue}>
                  {value.address.formattedAddress || "Address not available"}
                </Text>
              </View>
            )}

            {/* Map View */}
            {showMap && (
              <View style={[styles.mapContainer, { height: mapHeight }]}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: value.coordinates.latitude,
                    longitude: value.coordinates.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  region={{
                    latitude: value.coordinates.latitude,
                    longitude: value.coordinates.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: value.coordinates.latitude,
                      longitude: value.coordinates.longitude,
                    }}
                    draggable={!disabled && !disableEditing}
                    onDragEnd={onMapMarkerDragEnd}
                    title="Property Location"
                    description={value.address?.formattedAddress}
                  />
                </MapView>

                {!disabled && !disableEditing && (
                  <View style={styles.mapInstructions}>
                    <Text style={styles.mapInstructionsText}>Drag the pin to adjust location</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!value && !loading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-off" size={32} color="#bdc3c7" /><>

            <Text style={styles.emptyStateText}>No location captured</Text>
            <Text
</> style={styles.emptyStateSubtext}>
              Tap "Get Current Location" to capture property coordinates
            </Text>
          </View>
        )}
      </View>

      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  required: {
    color: "#e74c3c",
  },
  locationContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    padding: 12,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  loadingButton: {
    backgroundColor: "#7f8c8d",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  clearButton: {
    backgroundColor: "#e74c3c",
    width: 42,
    height: 42,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfoContainer: {
    marginBottom: 8,
  },
  coordinatesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  coordinateItem: {
    width: "33%",
    marginBottom: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  addressContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  addressLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    color: "#333",
  },
  mapContainer: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapInstructions: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mapInstructionsText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 4,
    textAlign: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
  },
});
