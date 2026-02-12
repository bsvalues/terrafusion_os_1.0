import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CollaborativeFieldNotes from "../components/CollaborativeFieldNotes";
import { useAuth } from "../hooks/useAuth";
import { ApiService } from "../services/ApiService";
import { NotificationService } from "../services/NotificationService";
import * as Colors from "../constants/Colors";

// Define the route params type
interface FieldNotesRouteParams {
  propertyId: string;
  parcelId: string;
  propertyAddress?: string;
  propertyType?: string;
}

const FieldNotesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();

  // Get route params
  const { propertyId, parcelId, propertyAddress, propertyType } =
    route.params as FieldNotesRouteParams;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  // Services
  const apiService = ApiService.getInstance();
  const notificationService = NotificationService.getInstance();

  // Load property details
  useEffect(() => {
    const loadPropertyDetails = async () => {
      setIsLoading(true);

      try {
        // Check if we are online
        const online = apiService.isConnected();
        setIsOffline(!online);

        // If we're online, try to load from API
        if (online) {
          try {
            const details = await apiService.get(`/api/properties/${propertyId}`);
            setPropertyDetails(details);

            // Cache property details for offline use
            await AsyncStorage.setItem(
              `terrafield_property_${propertyId}`,
              JSON.stringify(details)
            );
          } catch (apiError) {
            console.error("Error fetching property details from API:", apiError);
            await loadFromCache();
          }
        } else {
          // If offline, load from cache
          await loadFromCache();
        }
      } catch (error) {
        console.error("Error loading property details:", error);
        Alert.alert("Error", "Failed to load property details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Load property details from cache
    const loadFromCache = async () => {
      try {
        const cachedDetailsJson = await AsyncStorage.getItem(`terrafield_property_${propertyId}`);

        if (cachedDetailsJson) {
          const cachedDetails = JSON.parse(cachedDetailsJson);
          setPropertyDetails(cachedDetails);
        } else {
          // If no cached data, create a minimal property object with the info we have
          setPropertyDetails({
            id: propertyId,
            parcelId: parcelId,
            address: propertyAddress || "Unknown Address",
            propertyType: propertyType || "Unknown Type",
          });
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);

        // Create a minimal property object with the info we have
        setPropertyDetails({
          id: propertyId,
          parcelId: parcelId,
          address: propertyAddress || "Unknown Address",
          propertyType: propertyType || "Unknown Type",
        });
      }
    };

    loadPropertyDetails();

    // Set up connection status change listener
    const connectionStatusListener = () => {
      const isConnected = apiService.isConnected();
      setIsOffline(!isConnected);
    };

    // Check connection status periodically
    const interval = setInterval(connectionStatusListener, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [propertyId, parcelId, propertyAddress, propertyType]);

  // Handle sync status change
  const handleSyncStatusChange = (isSyncing: boolean) => {
    setIsSyncing(isSyncing);
    if (!isSyncing) {
      // Update sync count when sync completes
      setSyncCount((prev) => prev + 1);
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}><>

          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View
</> style={styles.titleContainer}>
          <Text style={styles.title}>Field Notes</Text>
        </View>
        {isOffline ? (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={16} color={Colors.white} />
          </View>
        ) : (
          <View style={styles.onlineIndicator}>
            <Ionicons name="cloud-done" size={16} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Property details card */}
      <View style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          <View style={styles.propertyIconContainer}><>

            <Ionicons
              name={
                propertyDetails?.propertyType?.toLowerCase().includes("residential")
                  ? "home"
                  : propertyDetails?.propertyType?.toLowerCase().includes("commercial")
                    ? "business"
                    : propertyDetails?.propertyType?.toLowerCase().includes("land")
                      ? "leaf"
                      : "location"
              }
              size={28}
              color={Colors.white}
            />
          </View>
          <View
</> style={styles.propertyInfo}><>

            <Text style={styles.propertyAddress} numberOfLines={1}>
              {propertyDetails?.address || "Unknown Address"}
            </Text>
            <Text
</> style={styles.propertyType}>
              {propertyDetails?.propertyType || "Unknown Type"}
            </Text>
          </View>
        </View>
        <View style={styles.propertySeparator} />
        <View style={styles.propertyDetails}>
          <View style={styles.propertyDetailItem}><>

            <Text style={styles.propertyDetailLabel}>Parcel ID</Text>
            <Text
</> style={styles.propertyDetailValue}>{parcelId}</Text>
          </View>
          <View style={styles.propertyDetailItem}><>

            <Text style={styles.propertyDetailLabel}>Property ID</Text>
            <Text
</> style={styles.propertyDetailValue}>{propertyId}</Text>
          </View>
          {propertyDetails?.lastUpdated && (
            <View style={styles.propertyDetailItem}><>

              <Text style={styles.propertyDetailLabel}>Last Updated</Text>
              <Text
</> style={styles.propertyDetailValue}>
                {formatDate(propertyDetails.lastUpdated)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Collaborative field notes */}
      <View style={styles.notesContainer}>
        {user && (
          <CollaborativeFieldNotes
            propertyId={propertyId}
            parcelId={parcelId}
            userId={user.id}
            userName={user.fullName || user.username}
            onSyncStatusChange={handleSyncStatusChange}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textLight,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  offlineIndicator: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  onlineIndicator: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  propertyCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  propertyHeader: {
    flexDirection: "row",
    padding: 16,
  },
  propertyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
    justifyContent: "center",
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: Colors.textLight,
  },
  propertySeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  propertyDetails: {
    padding: 16,
  },
  propertyDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  propertyDetailLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  propertyDetailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  notesContainer: {
    flex: 1,
    marginTop: 8,
  },
});

export default FieldNotesScreen;
