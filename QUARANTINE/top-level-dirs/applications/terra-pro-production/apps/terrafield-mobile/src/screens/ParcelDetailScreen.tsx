import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { PhotoSyncService } from "../services/PhotoSyncService";
import { PhotoMetadata } from "@terrafield/crdt";

type ParcelDetailRouteProp = RouteProp<RootStackParamList, "ParcelDetail">;
type ParcelDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "ParcelDetail">;

const API_BASE_URL = "https://terrafield-api.example.com"; // This would be set in a config file

// Placeholder image for demonstration
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=Property+Image";

export default function ParcelDetailScreen() {
  const route = useRoute<ParcelDetailRouteProp>();
  const navigation = useNavigation<ParcelDetailNavigationProp>();
  const { parcelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [parcelDetails, setParcelDetails] = useState({
    address: "123 Main St, Anytown, USA",
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    yearBuilt: 2005,
    lotSize: "0.25 acres",
  });

  useEffect(() => {
    // Initialize photos from the sync service
    loadPhotos();
  }, [parcelId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const syncService = PhotoSyncService.getInstance(API_BASE_URL);

      // Try to initialize from server first
      try {
        await syncService.initializeFromServer(parcelId);
      } catch (error) {
        console.log("Could not initialize from server, using local data only");
      }

      // Get photos from the local store
      const reportPhotos = syncService.getPhotos(parcelId);
      setPhotos(reportPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
      Alert.alert("Error", "Failed to load photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const syncPhotos = async () => {
    setSyncing(true);
    try {
      const syncService = PhotoSyncService.getInstance(API_BASE_URL);
      await syncService.syncReport(parcelId);

      // Refresh the photos list
      const reportPhotos = syncService.getPhotos(parcelId);
      setPhotos(reportPhotos);

      Alert.alert("Success", "Photos synchronized successfully.");
    } catch (error) {
      console.error("Error syncing photos:", error);
      Alert.alert("Sync Failed", "Failed to synchronize photos. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const addSamplePhoto = () => {
    try {
      const syncService = PhotoSyncService.getInstance(API_BASE_URL);

      // Add a sample photo for demonstration
      const samplePhoto: Omit<PhotoMetadata, "id" | "status"> = {
        reportId: parcelId,
        photoType: "SUBJECT",
        url: "",
        caption: "Sample photo added on mobile",
        dateTaken: new Date().toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        isOffline: true,
        localPath: "/sample/path/photo.jpg",
      };

      const photoId = syncService.addPhoto(samplePhoto);

      // Refresh the photos list
      const reportPhotos = syncService.getPhotos(parcelId);
      setPhotos(reportPhotos);

      Alert.alert("Photo Added", `Sample photo added with ID: ${photoId}`);
    } catch (error) {
      console.error("Error adding photo:", error);
      Alert.alert("Error", "Failed to add sample photo.");
    }
  };

  const renderPhotoCard = (item: PhotoMetadata) => {
    const statusColor =
      item.status === "synced"
        ? "#4CAF50"
        : item.status === "pending"
          ? "#FF9800"
          : item.status === "syncing"
            ? "#2196F3"
            : "#F44336";

    return (
      <View style={styles.photoCard}>
        <Image
          source={{ uri: item.url || PLACEHOLDER_IMAGE }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.photoDetails}><>

          <Text style={styles.photoCaption}>{item.caption}</Text>
          <Text
</> style={styles.photoType}>{item.photoType}</Text><>

          <Text style={[styles.photoStatus, { color: statusColor }]}>Status: {item.status}</Text>
          <Text
</> style={styles.photoDate}>
            Taken: {new Date(item.dateTaken).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><>

        <Text style={styles.title}>Parcel #{parcelId}</Text>
        <Text
</> style={styles.address}>{parcelDetails.address}</Text>
      </View>

      <View style={styles.detailsCard}><>

        <Text style={styles.sectionTitle}>Property Details</Text>
        <View
</> style={styles.detailsGrid}>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Type</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.propertyType}</Text>
          </View>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Year Built</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.yearBuilt}</Text>
          </View>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Bedrooms</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.bedrooms}</Text>
          </View>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Bathrooms</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.bathrooms}</Text>
          </View>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Square Feet</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.sqft}</Text>
          </View>
          <View style={styles.detailItem}><>

            <Text style={styles.detailLabel}>Lot Size</Text>
            <Text
</> style={styles.detailValue}>{parcelDetails.lotSize}</Text>
          </View>
        </View>
      </View>

      <View style={styles.photosContainer}>
        <View style={styles.sectionHeader}><>

          <Text style={styles.sectionTitle}>Property Photos</Text>
          <Text
</> style={styles.photoCount}>{photos.length} Photos</Text>
        </View>

        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.button} onPress={addSamplePhoto}>
            <Text style={styles.buttonText}>Add Sample Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={syncPhotos}
            disabled={syncing}
          >
            <Text style={styles.buttonText}>{syncing ? "Syncing..." : "Sync Photos"}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
        ) : photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderPhotoCard(item)}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}><>

            <Text style={styles.emptyText}>No photos available for this property.</Text>
            <Text
</> style={styles.emptySubtext}>Add photos using the button above.</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.notesButton}
        onPress={() => navigation.navigate("ParcelNote", { parcelId })}
      >
        <Text style={styles.buttonText}>View/Edit Parcel Notes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#0066cc",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  address: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  detailsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  photosContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 14,
    color: "#666",
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  syncButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  photoCard: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginRight: 12,
  },
  photoDetails: {
    flex: 1,
  },
  photoCaption: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  photoType: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  photoStatus: {
    fontSize: 14,
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 12,
    color: "#666",
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  notesButton: {
    margin: 16,
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
});
