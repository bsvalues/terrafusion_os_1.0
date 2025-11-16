import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  Share,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

import {
  PhotoEnhancementService,
  EnhancementType,
  EnhancementResult,
  EnhancementOptions,
} from "../../services/PhotoEnhancementService";

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Photo width calculation
const PHOTO_WIDTH = SCREEN_WIDTH - 32;
const THUMBNAIL_SIZE = 80;

/**
 * Photo item in gallery
 */
interface PhotoItem {
  /**
   * Original photo URI
   */
  originalUri: string;

  /**
   * Enhanced photo URI (if enhanced)
   */
  enhancedUri?: string;

  /**
   * Photo label/description
   */
  label?: string;

  /**
   * Category
   */
  category?: string;

  /**
   * Whether the photo is being enhanced
   */
  enhancing?: boolean;

  /**
   * Enhancement error
   */
  error?: string;

  /**
   * Enhancement result
   */
  enhancementResult?: EnhancementResult;
}

/**
 * Props for EnhancedPhotoGallery
 */
interface EnhancedPhotoGalleryProps {
  /**
   * Photos to display
   */
  photos: PhotoItem[];

  /**
   * Callback when photos change
   */
  onPhotosChange?: (photos: PhotoItem[]) => void;

  /**
   * Whether the gallery is read-only
   */
  readOnly?: boolean;

  /**
   * Default enhancement type
   */
  defaultEnhancementType?: EnhancementType;

  /**
   * Photo categories to organize photos
   */
  categories?: string[];

  /**
   * Whether to show thumbnails
   */
  showThumbnails?: boolean;

  /**
   * Whether to automatically enhance all photos
   */
  autoEnhance?: boolean;

  /**
   * Enhancement intensity (0-1)
   */
  enhancementIntensity?: number;
}

/**
 * EnhancedPhotoGallery Component
 *
 * Displays a gallery of photos with before/after comparison and enhancement capabilities.
 */
const EnhancedPhotoGallery: React.FC<EnhancedPhotoGalleryProps> = ({
  photos,
  onPhotosChange,
  readOnly = false,
  defaultEnhancementType = EnhancementType.BASIC,
  categories = [],
  showThumbnails = true,
  autoEnhance = false,
  enhancementIntensity = 0.5,
}) => {
  // State
  const [localPhotos, setLocalPhotos] = useState<PhotoItem[]>(photos);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>(defaultEnhancementType);
  const [enhancementOptionsVisible, setEnhancementOptionsVisible] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<number>(enhancementIntensity);
  const [batchEnhancing, setBatchEnhancing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const comparePosition = useRef(new Animated.Value(PHOTO_WIDTH / 2)).current;

  // Service
  const photoEnhancementService = PhotoEnhancementService.getInstance();

  // Sync local photos with props
  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  // Auto enhance photos if enabled
  useEffect(() => {
    if (autoEnhance) {
      handleBatchEnhance();
    }
  }, [autoEnhance]);

  // Pan responder for compare slider
  const panResponder = React.useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position
        const newPosition = Math.max(0, Math.min(PHOTO_WIDTH, gestureState.moveX - 16));
        comparePosition.setValue(newPosition);
      },
      onPanResponderRelease: () => {
        // Animation finished
      },
    });
  }, [comparePosition]);

  // Update local photos and notify parent
  const updatePhotos = (updatedPhotos: PhotoItem[]) => {
    setLocalPhotos(updatedPhotos);

    if (onPhotosChange) {
      onPhotosChange(updatedPhotos);
    }
  };

  // Filter photos by category
  const filteredPhotos = React.useMemo(() => {
    if (!activeCategory) {
      return localPhotos;
    }

    return localPhotos.filter((photo) => photo.category === activeCategory);
  }, [localPhotos, activeCategory]);

  // Handle photo selection
  const handleSelectPhoto = (index: number) => {
    setSelectedIndex(index);
    scrollToPhoto(index);
  };

  // Scroll to selected photo
  const scrollToPhoto = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * PHOTO_WIDTH,
        animated: true,
      });
    }
  };

  // Handle scroll end
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / PHOTO_WIDTH);
    setSelectedIndex(index);
  };

  // Handle enhance photo
  const handleEnhancePhoto = async (index: number) => {
    try {
      // Get photo
      const photo = filteredPhotos[index];

      if (!photo || !photo.originalUri) {
        Alert.alert("Error", "Cannot enhance photo: Original not found");
        return;
      }

      // Update photo enhancing state
      const updatedPhotos = [...localPhotos];
      const globalIndex = localPhotos.findIndex((p) => p.originalUri === photo.originalUri);

      if (globalIndex === -1) {
        return;
      }

      updatedPhotos[globalIndex].enhancing = true;
      updatedPhotos[globalIndex].error = undefined;
      updatePhotos(updatedPhotos);

      // Enhance photo
      const options: EnhancementOptions = {
        enhancementType,
        intensity,
        preserveMetadata: true,
        compressOutput: true,
        saveToPhotoLibrary: false,
      };

      const result = await photoEnhancementService.enhancePhoto(photo.originalUri, options);

      // Update photo with enhanced version
      updatedPhotos[globalIndex].enhancing = false;
      updatedPhotos[globalIndex].enhancedUri = result.enhancedUri;
      updatedPhotos[globalIndex].enhancementResult = result;

      if (!result.success) {
        updatedPhotos[globalIndex].error = result.error;
      }

      updatePhotos(updatedPhotos);

      // Show compare mode
      if (result.success) {
        setCompareMode(true);
      }
    } catch (error) {
      console.error("Error enhancing photo:", error);

      // Update photo with error
      const updatedPhotos = [...localPhotos];
      const photo = filteredPhotos[index];
      const globalIndex = localPhotos.findIndex((p) => p.originalUri === photo.originalUri);

      if (globalIndex !== -1) {
        updatedPhotos[globalIndex].enhancing = false;
        updatedPhotos[globalIndex].error = error instanceof Error ? error.message : "Unknown error";
        updatePhotos(updatedPhotos);
      }

      Alert.alert("Error", "Failed to enhance photo. Please try again.");
    }
  };

  // Handle batch enhance
  const handleBatchEnhance = async () => {
    try {
      // Get photos that need enhancement
      const photosToEnhance = filteredPhotos
        .filter((photo) => !photo.enhancedUri && !photo.enhancing)
        .map((photo) => photo.originalUri);

      if (photosToEnhance.length === 0) {
        Alert.alert("Info", "No photos need enhancement");
        return;
      }

      // Confirm batch enhancement
      Alert.alert(
        "Batch Enhance",
        `Enhance ${photosToEnhance.length} photos with ${enhancementType} enhancement?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Enhance",
            onPress: async () => {
              try {
                setBatchEnhancing(true);

                // Update photos enhancing state
                const updatedPhotos = [...localPhotos];

                for (const uri of photosToEnhance) {
                  const index = updatedPhotos.findIndex((p) => p.originalUri === uri);

                  if (index !== -1) {
                    updatedPhotos[index].enhancing = true;
                    updatedPhotos[index].error = undefined;
                  }
                }

                updatePhotos(updatedPhotos);

                // Enhance photos
                const options: EnhancementOptions = {
                  enhancementType,
                  intensity,
                  preserveMetadata: true,
                  compressOutput: true,
                  saveToPhotoLibrary: false,
                };

                const results = await photoEnhancementService.batchEnhancePhotos(
                  photosToEnhance,
                  options
                );

                // Update photos with enhanced versions
                const finalUpdatedPhotos = [...updatedPhotos];

                for (let i = 0; i < results.length; i++) {
                  const result = results[i];
                  const originalUri = photosToEnhance[i];
                  const index = finalUpdatedPhotos.findIndex((p) => p.originalUri === originalUri);

                  if (index !== -1) {
                    finalUpdatedPhotos[index].enhancing = false;

                    if (result.success) {
                      finalUpdatedPhotos[index].enhancedUri = result.enhancedUri;
                      finalUpdatedPhotos[index].enhancementResult = result;
                    } else {
                      finalUpdatedPhotos[index].error = result.error;
                    }
                  }
                }

                updatePhotos(finalUpdatedPhotos);

                Alert.alert(
                  "Batch Enhancement Complete",
                  `Successfully enhanced ${results.filter((r) => r.success).length} of ${results.length} photos.`
                );
              } catch (error) {
                console.error("Error batch enhancing photos:", error);
                Alert.alert("Error", "Failed to batch enhance photos");
              } finally {
                setBatchEnhancing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error batch enhancing photos:", error);
      Alert.alert("Error", "Failed to prepare batch enhancement");
      setBatchEnhancing(false);
    }
  };

  // Handle save enhanced photo
  const handleSavePhoto = async (index: number) => {
    try {
      const photo = filteredPhotos[index];

      if (!photo || !photo.enhancedUri) {
        Alert.alert("Error", "No enhanced photo to save");
        return;
      }

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Error", "Permission to access photo library was denied");
        return;
      }

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(photo.enhancedUri);

      // Create album if it doesn't exist
      const albums = await MediaLibrary.getAlbumsAsync();
      const terraFieldAlbum = albums.find((album) => album.title === "TerraField");

      if (terraFieldAlbum) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], terraFieldAlbum, false);
      } else {
        await MediaLibrary.createAlbumAsync("TerraField", asset, false);
      }

      Alert.alert("Success", "Photo saved to gallery");
    } catch (error) {
      console.error("Error saving photo:", error);
      Alert.alert("Error", "Failed to save photo to gallery");
    }
  };

  // Handle share photo
  const handleSharePhoto = async (index: number) => {
    try {
      const photo = filteredPhotos[index];

      if (!photo || !photo.enhancedUri) {
        Alert.alert("Error", "No enhanced photo to share");
        return;
      }

      await Share.share({
        url: photo.enhancedUri,
        title: "Enhanced Property Photo",
      });
    } catch (error) {
      console.error("Error sharing photo:", error);
      Alert.alert("Error", "Failed to share photo");
    }
  };

  // Handle reset enhancement
  const handleResetEnhancement = (index: number) => {
    const photo = filteredPhotos[index];

    if (!photo) return;

    Alert.alert("Reset Enhancement", "Remove the enhanced version of this photo?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          const updatedPhotos = [...localPhotos];
          const globalIndex = localPhotos.findIndex((p) => p.originalUri === photo.originalUri);

          if (globalIndex !== -1) {
            updatedPhotos[globalIndex].enhancedUri = undefined;
            updatedPhotos[globalIndex].enhancementResult = undefined;
            updatedPhotos[globalIndex].error = undefined;
            updatePhotos(updatedPhotos);
            setCompareMode(false);
          }
        },
      },
    ]);
  };

  // Render photo thumbnails
  const renderThumbnails = () => {
    if (!showThumbnails || filteredPhotos.length <= 1) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailsContainer}
        contentContainerStyle={styles.thumbnailsContent}
      >
        {filteredPhotos.map((photo /* , index */) => (
          <TouchableOpacity
            key={photo.originalUri}
            style={[styles.thumbnailContainer, selectedIndex === index && styles.selectedThumbnail]}
            onPress={() => handleSelectPhoto(index)}
          >
            <Image
              source={{ uri: photo.originalUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {photo.enhancedUri && (
              <View style={styles.enhancedBadge}>
                <MaterialCommunityIcons name="check" size={12} color="#fff" />
              </View>
            )}
            {photo.enhancing && (
              <View style={styles.enhancingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render category tabs
  const renderCategoryTabs = () => {
    if (categories.length === 0) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryTab, activeCategory === null && styles.activeCategoryTab]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.categoryText, activeCategory === null && styles.activeCategoryText]}>
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryTab, activeCategory === category && styles.activeCategoryTab]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render actions
  const renderActions = () => {
    const currentPhoto = filteredPhotos[selectedIndex];

    if (!currentPhoto) return null;

    return (
      <View style={styles.actionsContainer}>
        {!readOnly && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEnhancePhoto(selectedIndex)}
            disabled={currentPhoto.enhancing || batchEnhancing}
          >
            <MaterialCommunityIcons
              name="image-filter"
              size={24}
              color={currentPhoto.enhancing || batchEnhancing ? "#bdc3c7" : "#3498db"}
            />
            <Text style={styles.actionText}>
              {currentPhoto.enhancedUri ? "Re-enhance" : "Enhance"}
            </Text>
          </TouchableOpacity>
        )}

        {currentPhoto.enhancedUri && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setCompareMode(!compareMode)}
            >
              <MaterialCommunityIcons name="compare" size={24} color="#3498db" />
              <Text style={styles.actionText}>{compareMode ? "View Enhanced" : "Compare"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSavePhoto(selectedIndex)}
            >
              <MaterialCommunityIcons name="content-save" size={24} color="#3498db" />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSharePhoto(selectedIndex)}
            >
              <MaterialCommunityIcons name="share-variant" size={24} color="#3498db" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </>
        )}

        {!readOnly && filteredPhotos.length > 1 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBatchEnhance}
            disabled={batchEnhancing}
          >
            <MaterialCommunityIcons
              name="image-multiple"
              size={24}
              color={batchEnhancing ? "#bdc3c7" : "#3498db"}
            />
            <Text style={styles.actionText}>{batchEnhancing ? "Enhancing..." : "Batch"}</Text>
          </TouchableOpacity>
        )}

        {!readOnly && currentPhoto.enhancedUri && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleResetEnhancement(selectedIndex)}
          >
            <MaterialCommunityIcons name="restore" size={24} color="#e74c3c" />
            <Text style={[styles.actionText, { color: "#e74c3c" }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render enhancement options
  const renderEnhancementOptions = () => {
    return (
      <View style={styles.enhancementOptionsContainer}>
        <View style={styles.enhancementOptionsHeader}><>

          <Text style={styles.enhancementOptionsTitle}>Enhancement Options</Text>
          <TouchableOpacity
</> onPress={() => setEnhancementOptionsVisible(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View><>


        <Text style={styles.optionLabel}>Enhancement Type</Text>
        <ScrollView
</>
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.enhancementTypesContainer}
        >
          {Object.values(EnhancementType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.enhancementTypeButton,
                enhancementType === type && styles.selectedEnhancementType,
              ]}
              onPress={() => setEnhancementType(type)}
            >
              <Text
                style={[
                  styles.enhancementTypeText,
                  enhancementType === type && styles.selectedEnhancementTypeText,
                ]}
              >
                {type
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView><>


        <Text style={styles.optionLabel}>Intensity: {Math.round(intensity * 100)}%</Text>
        <View
</> style={styles.intensitySlider}>
          <TouchableOpacity onPress={() => setIntensity(Math.max(0.1, intensity - 0.1))}><>

            <MaterialCommunityIcons name="minus" size={24} color="#3498db" />
          </TouchableOpacity>

          <View
</> style={styles.sliderTrack}><>

            <View style={[styles.sliderFill, { width: `${intensity * 100}%` }]} />
          </View>

          <TouchableOpacity
</> onPress={() => setIntensity(Math.min(1.0, intensity + 0.1))}>
            <MaterialCommunityIcons name="plus" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render photos
  const renderPhotos = () => {
    if (filteredPhotos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="image-off" size={48} color="#bdc3c7" />
          <Text style={styles.emptyText}>No photos available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.photosContainer}
        contentContainerStyle={styles.photosContent}
      >
        {filteredPhotos.map((photo /* , index */) => (
          <View key={photo.originalUri} style={styles.photoContainer}>
            {compareMode && photo.enhancedUri ? (
              <View style={styles.compareContainer}>
                <Image
                  source={{ uri: photo.enhancedUri }}
                  style={styles.photo}
                  resizeMode="contain"
                />

                <View style={styles.originalOverlay}><>

                  <Image
                    source={{ uri: photo.originalUri }}
                    style={[styles.photo, { width: comparePosition }]}
                    resizeMode="contain"
                  />
                </View>

                <Animated
</>.View
                  style={[styles.compareDivider, { left: comparePosition }]}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.compareDividerLine} />
                  <View style={styles.compareDividerHandle} />
                </Animated.View>

                <View style={styles.compareLabels}>
                  <View style={styles.compareLabel}>
                    <Text style={styles.compareLabelText}>Original</Text>
                  </View>
                  <View style={styles.compareLabel}>
                    <Text style={styles.compareLabelText}>Enhanced</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: photo.enhancedUri || photo.originalUri }}
                style={styles.photo}
                resizeMode="contain"
              />
            )}

            {photo.enhancing && (
              <View style={styles.enhancingOverlayFull}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.enhancingText}>Enhancing photo...</Text>
              </View>
            )}

            {photo.error && (
              <View style={styles.errorOverlay}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#e74c3c" />
                <Text style={styles.errorText}>{photo.error}</Text>
              </View>
            )}

            {photo.label && (
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{photo.label}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render enhancement stats
  const renderEnhancementStats = () => {
    const currentPhoto = filteredPhotos[selectedIndex];

    if (!currentPhoto || !currentPhoto.enhancementResult || !currentPhoto.enhancedUri) {
      return null;
    }

    const result = currentPhoto.enhancementResult;

    if (!result.enhancedSize || !result.originalSize) {
      return null;
    }

    const compressionRatio = result.originalSize / result.enhancedSize;
    const compressionPercentage = Math.round((1 - result.enhancedSize / result.originalSize) * 100);

    return (
      <View style={styles.statsContainer}><>

        <Text style={styles.statsTitle}>Enhancement Details</Text>

        <View
</> style={styles.statsRow}><>

          <Text style={styles.statsLabel}>Size:</Text>
          <Text
</> style={styles.statsValue}>
            {formatFileSize(result.originalSize)} → {formatFileSize(result.enhancedSize)}
            {compressionPercentage > 0 && ` (${compressionPercentage}% reduced)`}
            {compressionPercentage < 0 && ` (${Math.abs(compressionPercentage)}% increased)`}
          </Text>
        </View>

        {result.originalDimensions && result.enhancedDimensions && (
          <View style={styles.statsRow}><>

            <Text style={styles.statsLabel}>Dimensions:</Text>
            <Text
</> style={styles.statsValue}>
              {result.originalDimensions.width}x{result.originalDimensions.height} →
              {result.enhancedDimensions.width}x{result.enhancedDimensions.height}
            </Text>
          </View>
        )}

        <View style={styles.statsRow}><>

          <Text style={styles.statsLabel}>Enhancement:</Text>
          <Text
</> style={styles.statsValue}>
            {result.enhancementType
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>
        </View>

        {result.processingTime && (
          <View style={styles.statsRow}><>

            <Text style={styles.statsLabel}>Processing Time:</Text>
            <Text
</> style={styles.statsValue}>
              {(result.processingTime / 1000).toFixed(2)} seconds
            </Text>
          </View>
        )}

        <View style={styles.statsRow}><>

          <Text style={styles.statsLabel}>Processed:</Text>
          <Text
</> style={styles.statsValue}>
            {result.processedLocally ? "Locally on Device" : "Online with AI"}
          </Text>
        </View>
      </View>
    );
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <View style={styles.container}>
      {/* Options button */}
      {!readOnly && (
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setEnhancementOptionsVisible(true)}
        >
          <MaterialCommunityIcons name="tune" size={24} color="#3498db" />
        </TouchableOpacity>
      )}

      {/* Category tabs */}
      {renderCategoryTabs()}

      {/* Photos */}
      {renderPhotos()}

      {/* Actions */}
      {renderActions()}

      {/* Thumbnails */}
      {renderThumbnails()}

      {/* Enhancement stats */}
      {renderEnhancementStats()}

      {/* Enhancement options modal */}
      <Modal
        visible={enhancementOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEnhancementOptionsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>{renderEnhancementOptions()}</View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  optionsButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 100,
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoriesContainer: {
    maxHeight: 44,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoriesContent: {
    paddingHorizontal: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeCategoryTab: {
    borderBottomColor: "#3498db",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  activeCategoryText: {
    color: "#3498db",
  },
  photosContainer: {
    flex: 1,
  },
  photosContent: {
    flexGrow: 1,
  },
  photoContainer: {
    width: PHOTO_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  photo: {
    width: PHOTO_WIDTH,
    height: "100%",
  },
  labelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
  },
  labelText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  enhancingOverlayFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  enhancingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
    color: "#3498db",
  },
  thumbnailsContainer: {
    maxHeight: THUMBNAIL_SIZE + 20,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  thumbnailsContent: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedThumbnail: {
    borderColor: "#3498db",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  enhancedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#2ecc71",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  enhancingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    flex: 1,
  },
  statsValue: {
    fontSize: 12,
    flex: 2,
  },
  compareContainer: {
    width: PHOTO_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  originalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  compareDivider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  compareDividerLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  compareDividerHandle: {
    position: "absolute",
    top: "50%",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
    transform: [{ translateY: -15 }],
  },
  compareLabels: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  compareLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  compareLabelText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  enhancementOptionsContainer: {
    padding: 16,
  },
  enhancementOptionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  enhancementOptionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  optionLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  enhancementTypesContainer: {
    maxHeight: 44,
  },
  enhancementTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    marginRight: 8,
  },
  selectedEnhancementType: {
    backgroundColor: "#3498db",
  },
  enhancementTypeText: {
    fontSize: 14,
    color: "#333",
  },
  selectedEnhancementTypeText: {
    color: "#fff",
    fontWeight: "500",
  },
  intensitySlider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 4,
  },
});

export default EnhancedPhotoGallery;
