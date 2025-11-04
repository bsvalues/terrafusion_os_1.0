import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

import EnhancedPhotoGallery from "../components/photo/EnhancedPhotoGallery";
import {
  PhotoEnhancementService,
  EnhancementType,
  EnhancementResult,
} from "../services/PhotoEnhancementService";
import { ImageCompressionService, CompressionQuality } from "../services/ImageCompressionService";

/**
 * Photo categories
 */
const PHOTO_CATEGORIES = ["Exterior", "Interior", "Rooms", "Damage", "Features", "View", "Other"];

/**
 * PhotoEnhancementScreen
 *
 * A screen for enhancing property photos with AI.
 */
const PhotoEnhancementScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId;
  const initialPhotos = route.params?.photos || [];

  // Services
  const photoEnhancementService = PhotoEnhancementService.getInstance();
  const imageCompressionService = ImageCompressionService.getInstance();

  // State
  const [photos, setPhotos] = useState<any[]>(initialPhotos);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [qualityCheckResults, setQualityCheckResults] = useState<Record<string, any>>({});
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [currentPhotoForQuality, setCurrentPhotoForQuality] = useState<string | null>(null);

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setIsLoading(true);

        // If photos were passed in route params, use those
        if (initialPhotos && initialPhotos.length > 0) {
          setPhotos(initialPhotos);
          setIsLoading(false);
          return;
        }

        // Otherwise, load from storage
        if (propertyId) {
          // In a real app, we would load photos for this property from storage
          const storedPhotos = await loadPhotosFromStorage(propertyId);
          setPhotos(storedPhotos);
        }
      } catch (error) {
        console.error("Error loading photos:", error);
        Alert.alert("Error", "Failed to load photos");
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [propertyId, initialPhotos]);

  // Load photos from storage (simulated)
  const loadPhotosFromStorage = async (propertyId: string): Promise<any[]> => {
    // In a real app, we would load photos from a database or file storage
    // For now, return an empty array
    return [];
  };

  // Handle capture photo
  const handleCapturePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Error", "Camera permission is required to capture photos");
        return;
      }

      setIsCapturing(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      // Check image quality
      await checkPhotoQuality(asset.uri);

      // Add photo to list
      const newPhoto = {
        originalUri: asset.uri,
        category: "Exterior", // Default category
      };

      setPhotos((prevPhotos) => [...prevPhotos, newPhoto]);

      // Save photo to storage
      await savePhotoToStorage(asset.uri, propertyId);
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle select photos from library
  const handleSelectPhotos = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Error", "Media library permission is required to select photos");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsLoading(true);

      // Process each selected image
      const newPhotos = [];

      for (const asset of result.assets) {
        // Compress image if needed
        const compressedImage = await imageCompressionService.compressImage(asset.uri, {
          quality: CompressionQuality.HIGH,
        });

        // Check image quality
        await checkPhotoQuality(compressedImage.uri);

        // Add photo to list
        newPhotos.push({
          originalUri: compressedImage.uri,
          category: "Exterior", // Default category
        });

        // Save photo to storage
        await savePhotoToStorage(compressedImage.uri, propertyId);
      }

      // Update photos state
      setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
    } catch (error) {
      console.error("Error selecting photos:", error);
      Alert.alert("Error", "Failed to select photos");
    } finally {
      setIsLoading(false);
    }
  };

  // Save photo to storage
  const savePhotoToStorage = async (uri: string, propertyId?: string): Promise<void> => {
    try {
      // In a real app, we would save the photo to a database or file storage
      // For this example, we'll save it to the media library

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      // Save to media library
      await MediaLibrary.createAssetAsync(uri);
    } catch (error) {
      console.error("Error saving photo to storage:", error);
    }
  };

  // Check photo quality
  const checkPhotoQuality = async (uri: string): Promise<void> => {
    try {
      // Check image quality
      const qualityResult = await photoEnhancementService.detectQualityIssues(uri);

      // Store quality check results
      setQualityCheckResults((prev) => ({
        ...prev,
        [uri]: qualityResult,
      }));

      // Show quality improvement recommendation if issues found
      if (qualityResult.hasIssues) {
        setCurrentPhotoForQuality(uri);
        setShowQualityModal(true);
      }
    } catch (error) {
      console.error("Error checking photo quality:", error);
    }
  };

  // Handle enhance all photos
  const handleEnhanceAll = () => {
    if (photos.length === 0) {
      Alert.alert("Info", "No photos to enhance");
      return;
    }

    const photosToEnhance = photos.filter((photo) => !photo.enhancedUri);

    if (photosToEnhance.length === 0) {
      Alert.alert("Info", "All photos are already enhanced");
      return;
    }

    // Show confirmation
    Alert.alert(
      "Enhance All Photos",
      `Enhance ${photosToEnhance.length} photos with AI for better quality and appearance?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Enhance",
          onPress: () => {
            const updatedPhotos = [...photos];

            for (const photo of updatedPhotos) {
              if (!photo.enhancedUri) {
                photo.enhancing = true;
              }
            }

            setPhotos(updatedPhotos);
          },
        },
      ]
    );
  };

  // Handle photo change
  const handlePhotosChange = (updatedPhotos: any[]) => {
    setPhotos(updatedPhotos);
  };

  // Close quality modal and enhance photo
  const handleEnhanceRecommended = async () => {
    if (!currentPhotoForQuality) {
      setShowQualityModal(false);
      return;
    }

    try {
      setShowQualityModal(false);

      const qualityResult = qualityCheckResults[currentPhotoForQuality];

      if (!qualityResult || !qualityResult.suggestedEnhancement) {
        return;
      }

      // Find the photo in the list
      const updatedPhotos = [...photos];
      const photoIndex = updatedPhotos.findIndex((p) => p.originalUri === currentPhotoForQuality);

      if (photoIndex === -1) {
        return;
      }

      // Set enhancing flag
      updatedPhotos[photoIndex].enhancing = true;
      setPhotos(updatedPhotos);

      // Enhance the photo
      const enhancementResult = await photoEnhancementService.enhancePhoto(currentPhotoForQuality, {
        enhancementType: qualityResult.suggestedEnhancement,
        intensity: 0.7,
      });

      // Update the photo with the enhanced version
      updatedPhotos[photoIndex].enhancing = false;

      if (enhancementResult.success && enhancementResult.enhancedUri) {
        updatedPhotos[photoIndex].enhancedUri = enhancementResult.enhancedUri;
        updatedPhotos[photoIndex].enhancementResult = enhancementResult;
      } else {
        updatedPhotos[photoIndex].error = enhancementResult.error;
      }

      setPhotos(updatedPhotos);
    } catch (error) {
      console.error("Error enhancing recommended photo:", error);

      // Reset enhancing flag
      const updatedPhotos = [...photos];
      const photoIndex = updatedPhotos.findIndex((p) => p.originalUri === currentPhotoForQuality);

      if (photoIndex !== -1) {
        updatedPhotos[photoIndex].enhancing = false;
        updatedPhotos[photoIndex].error = "Failed to enhance photo";
        setPhotos(updatedPhotos);
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading photos...</Text>
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
</> style={styles.headerTitle}>Photo Enhancement</Text>

        <TouchableOpacity style={styles.enhanceAllButton} onPress={handleEnhanceAll}>
          <MaterialCommunityIcons name="image-multiple" size={20} color="#fff" />
          <Text style={styles.enhanceAllText}>Enhance All</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCapturePhoto}
          disabled={isCapturing}
        >
          <MaterialCommunityIcons
            name="camera"
            size={24}
            color={isCapturing ? "#bdc3c7" : "#3498db"}
          />
          <Text style={styles.actionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSelectPhotos}>
          <MaterialCommunityIcons name="image-multiple" size={24} color="#3498db" />
          <Text style={styles.actionText}>Select Photos</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <EnhancedPhotoGallery
          photos={photos}
          onPhotosChange={handlePhotosChange}
          categories={PHOTO_CATEGORIES}
          showThumbnails={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="image-off" size={64} color="#bdc3c7" /><>

          <Text style={styles.emptyText}>No photos available</Text>
          <Text
</> style={styles.emptySubtext}>
            Take photos or select from your gallery to get started
          </Text>
        </View>
      )}

      {/* Quality Check Modal */}
      <Modal
        visible={showQualityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="image-filter-center-focus" size={28} color="#e67e22" />
              <Text style={styles.modalTitle}>Photo Quality Check</Text>
            </View>

            {currentPhotoForQuality && qualityCheckResults[currentPhotoForQuality] && (
              <View style={styles.modalBody}><>

                <Text style={styles.modalText}>
                  We detected some quality issues with your photo:
                </Text>

                <View
</> style={styles.issuesList}>
                  {qualityCheckResults[currentPhotoForQuality].issues.map(
                    (issue: string /* , index */: number) => (
                      <View key={index} style={styles.issueItem}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color="#e74c3c" />
                        <Text style={styles.issueText}>{issue}</Text>
                      </View>
                    )
                  )}
                </View>

                <Text style={styles.modalText}>
                  Would you like to enhance this photo for better quality?
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowQualityModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleEnhanceRecommended}
              >
                <Text style={styles.modalPrimaryButtonText}>Enhance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
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
    flex: 1,
    marginLeft: 12,
  },
  enhanceAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  enhanceAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#3498db",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#7f8c8d",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  issuesList: {
    marginVertical: 12,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  issueText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 12,
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  modalPrimaryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});

export default PhotoEnhancementScreen;
