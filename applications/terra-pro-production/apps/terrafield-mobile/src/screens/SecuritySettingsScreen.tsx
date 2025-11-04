import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useNavigation } from "@react-navigation/native";

import { AuthService, BiometricPreference } from "../services/AuthService";
import { SecurityLevel, SecureStorageService } from "../services/SecureStorageService";
import { CompressionQuality, ImageCompressionService } from "../services/ImageCompressionService";
import { SelectiveSyncService, SyncCategory, SyncPriority } from "../services/SelectiveSyncService";

/**
 * SecuritySettingsScreen component
 *
 * This screen allows users to configure security settings for the app:
 * - Biometric authentication
 * - Data encryption
 * - Image compression
 * - Selective sync options
 */
const SecuritySettingsScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation();

  // Services
  const authService = AuthService.getInstance();
  const secureStorageService = SecureStorageService.getInstance();
  const imageCompressionService = ImageCompressionService.getInstance();
  const selectiveSyncService = SelectiveSyncService.getInstance();

  // State
  const [biometricType, setBiometricType] = useState<string>("None");
  const [biometricPreference, setBiometricPreference] = useState<BiometricPreference>(
    BiometricPreference.OPTIONAL
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [compression, setCompression] = useState<CompressionQuality>(CompressionQuality.MEDIUM);

  // Sync priorities
  const [syncPriorities, setSyncPriorities] = useState<Record<SyncCategory, SyncPriority>>({
    properties: SyncPriority.HIGH,
    reports: SyncPriority.HIGH,
    photos: SyncPriority.MEDIUM,
    comparables: SyncPriority.MEDIUM,
    sketches: SyncPriority.LOW,
    notes: SyncPriority.LOW,
    user_preferences: SyncPriority.BACKGROUND,
  });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Load biometric settings
        const available = authService.isBiometricsAvailable();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let biometricTypeLabel = "None";

        if (available && types.length > 0) {
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            biometricTypeLabel = "Face ID";
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            biometricTypeLabel = "Fingerprint";
          } else {
            biometricTypeLabel = "Biometric";
          }
        }

        setBiometricType(biometricTypeLabel);
        setBiometricPreference(authService.getBiometricPreference());

        // Load sync priorities
        const syncConfigs = selectiveSyncService.getAllConfigs();
        const priorities: Record<SyncCategory, SyncPriority> = {} as Record<
          SyncCategory,
          SyncPriority
        >;

        Object.entries(syncConfigs).forEach(([category, config]) => {
          priorities[category as SyncCategory] = config.priority;
        });

        setSyncPriorities(priorities);
      } catch (error) {
        console.error("Error loading security settings:", error);
        Alert.alert("Error", "Failed to load security settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle biometric preference change
  const handleBiometricPreferenceChange = async (preference: BiometricPreference) => {
    try {
      // Check if biometrics are available
      if (preference !== BiometricPreference.DISABLED && !authService.isBiometricsAvailable()) {
        Alert.alert(
          "Biometrics Not Available",
          "Your device does not support biometric authentication or does not have biometrics enrolled.",
          [{ text: "OK" }]
        );
        return;
      }

      // If changing to required, verify biometrics work
      if (preference === BiometricPreference.REQUIRED) {
        const authenticated = await authService.authenticateWithBiometrics(
          "Verify biometric authentication"
        );

        if (!authenticated) {
          Alert.alert(
            "Biometric Verification Failed",
            "Failed to verify biometric authentication. Biometric authentication will not be required.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      // Update preference
      await authService.setBiometricPreference(preference);
      setBiometricPreference(preference);

      Alert.alert(
        "Biometric Settings Updated",
        `Biometric authentication has been ${
          preference === BiometricPreference.REQUIRED
            ? "required"
            : preference === BiometricPreference.OPTIONAL
              ? "made optional"
              : "disabled"
        }.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating biometric preference:", error);
      Alert.alert("Error", "Failed to update biometric settings");
    }
  };

  // Handle sync priority change
  const handleSyncPriorityChange = async (category: SyncCategory, priority: SyncPriority) => {
    try {
      await selectiveSyncService.setPriority(category, priority);

      setSyncPriorities((prev) => ({
        ...prev,
        [category]: priority,
      }));
    } catch (error) {
      console.error(`Error updating sync priority for ${category}:`, error);
      Alert.alert("Error", `Failed to update sync priority for ${category}`);
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: SyncPriority): string => {
    switch (priority) {
      case SyncPriority.CRITICAL:
        return "Critical";
      case SyncPriority.HIGH:
        return "High";
      case SyncPriority.MEDIUM:
        return "Medium";
      case SyncPriority.LOW:
        return "Low";
      case SyncPriority.BACKGROUND:
        return "Background";
      default:
        return "Unknown";
    }
  };

  // Get category label
  const getCategoryLabel = (category: SyncCategory): string => {
    switch (category) {
      case SyncCategory.PROPERTIES:
        return "Properties";
      case SyncCategory.REPORTS:
        return "Reports";
      case SyncCategory.PHOTOS:
        return "Photos";
      case SyncCategory.COMPARABLES:
        return "Comparables";
      case SyncCategory.SKETCHES:
        return "Sketches";
      case SyncCategory.NOTES:
        return "Notes";
      case SyncCategory.USER_PREFERENCES:
        return "User Preferences";
      default:
        return "Unknown";
    }
  };

  // Force sync
  const handleForceSync = async () => {
    try {
      // Show confirmation
      Alert.alert(
        "Force Sync",
        "This will immediately sync all data regardless of network condition or battery level. Continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sync",
            onPress: async () => {
              try {
                // Show loading
                setIsLoading(true);

                // Force sync
                const result = await selectiveSyncService.forceSyncAll();

                // Show result
                if (result.success) {
                  Alert.alert(
                    "Sync Complete",
                    `Successfully synced ${result.syncedCategories.length} categories.`,
                    [{ text: "OK" }]
                  );
                } else {
                  Alert.alert(
                    "Sync Incomplete",
                    `Synced ${result.syncedCategories.length} categories, failed ${result.failedCategories.length} categories.`,
                    [{ text: "OK" }]
                  );
                }
              } catch (error) {
                console.error("Error force syncing:", error);
                Alert.alert("Error", "Failed to force sync");
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error initiating force sync:", error);
      Alert.alert("Error", "Failed to initiate force sync");
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading settings...</Text>
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
</> style={styles.headerTitle}>Security & Performance</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Biometric Authentication */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="fingerprint" size={24} color="#3498db" />
            <Text style={styles.sectionTitle}>Biometric Authentication</Text>
          </View>

          <View style={styles.infoRow}><>

            <Text style={styles.infoLabel}>Available Biometrics:</Text>
            <Text
</> style={styles.infoValue}>{biometricType}</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                biometricPreference === BiometricPreference.REQUIRED && styles.selectedOption,
              ]}
              onPress={() => handleBiometricPreferenceChange(BiometricPreference.REQUIRED)}
            >
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color={biometricPreference === BiometricPreference.REQUIRED ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  biometricPreference === BiometricPreference.REQUIRED && styles.selectedOptionText,
                ]}
              >
                Required
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                biometricPreference === BiometricPreference.OPTIONAL && styles.selectedOption,
              ]}
              onPress={() => handleBiometricPreferenceChange(BiometricPreference.OPTIONAL)}
            >
              <MaterialCommunityIcons
                name="lock-open-variant"
                size={20}
                color={biometricPreference === BiometricPreference.OPTIONAL ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  biometricPreference === BiometricPreference.OPTIONAL && styles.selectedOptionText,
                ]}
              >
                Optional
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                biometricPreference === BiometricPreference.DISABLED && styles.selectedOption,
              ]}
              onPress={() => handleBiometricPreferenceChange(BiometricPreference.DISABLED)}
            >
              <MaterialCommunityIcons
                name="lock-off"
                size={20}
                color={biometricPreference === BiometricPreference.DISABLED ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  biometricPreference === BiometricPreference.DISABLED && styles.selectedOptionText,
                ]}
              >
                Disabled
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            {biometricPreference === BiometricPreference.REQUIRED
              ? "Biometric authentication will be required for all sensitive operations."
              : biometricPreference === BiometricPreference.OPTIONAL
                ? "Biometric authentication will be used when available, but can be bypassed."
                : "Biometric authentication is disabled."}
          </Text>
        </View>

        {/* Data Encryption */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-lock" size={24} color="#3498db" />
            <Text style={styles.sectionTitle}>Data Encryption</Text>
          </View><>


          <Text style={styles.sectionDescription}>
            Sensitive property data is automatically encrypted on your device using
            industry-standard encryption.
          </Text>

          <View
</> style={styles.infoRow}><>

            <Text style={styles.infoLabel}>Property Data:</Text>
            <Text
</> style={styles.securityBadge}>Encrypted</Text>
          </View>

          <View style={styles.infoRow}><>

            <Text style={styles.infoLabel}>Photos:</Text>
            <Text
</> style={styles.securityBadge}>Encrypted</Text>
          </View>

          <View style={styles.infoRow}><>

            <Text style={styles.infoLabel}>User Credentials:</Text>
            <Text
</> style={styles.securityBadge}>Encrypted</Text>
          </View>
        </View>

        {/* Image Compression */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="image" size={24} color="#3498db" />
            <Text style={styles.sectionTitle}>Image Compression</Text>
          </View><>


          <Text style={styles.sectionDescription}>
            Control the quality and size of photos taken in the field.
          </Text>

          <View
</> style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                compression === CompressionQuality.LOW && styles.selectedOption,
              ]}
              onPress={() => setCompression(CompressionQuality.LOW)}
            >
              <MaterialCommunityIcons
                name="speedometer-slow"
                size={20}
                color={compression === CompressionQuality.LOW ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  compression === CompressionQuality.LOW && styles.selectedOptionText,
                ]}
              >
                Low Quality
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                compression === CompressionQuality.MEDIUM && styles.selectedOption,
              ]}
              onPress={() => setCompression(CompressionQuality.MEDIUM)}
            >
              <MaterialCommunityIcons
                name="speedometer-medium"
                size={20}
                color={compression === CompressionQuality.MEDIUM ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  compression === CompressionQuality.MEDIUM && styles.selectedOptionText,
                ]}
              >
                Medium Quality
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                compression === CompressionQuality.HIGH && styles.selectedOption,
              ]}
              onPress={() => setCompression(CompressionQuality.HIGH)}
            >
              <MaterialCommunityIcons
                name="speedometer"
                size={20}
                color={compression === CompressionQuality.HIGH ? "#fff" : "#333"}
              />
              <Text
                style={[
                  styles.optionText,
                  compression === CompressionQuality.HIGH && styles.selectedOptionText,
                ]}
              >
                High Quality
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.compressionInfo}>
            <View style={styles.compressionInfoItem}><>

              <Text style={styles.compressionLabel}>File Size</Text>
              <View
</> style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width:
                        compression === CompressionQuality.LOW
                          ? "30%"
                          : compression === CompressionQuality.MEDIUM
                            ? "60%"
                            : "90%",
                      backgroundColor:
                        compression === CompressionQuality.LOW
                          ? "#2ecc71"
                          : compression === CompressionQuality.MEDIUM
                            ? "#f39c12"
                            : "#e74c3c",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.compressionInfoItem}><>

              <Text style={styles.compressionLabel}>Quality</Text>
              <View
</> style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width:
                        compression === CompressionQuality.LOW
                          ? "30%"
                          : compression === CompressionQuality.MEDIUM
                            ? "60%"
                            : "90%",
                      backgroundColor:
                        compression === CompressionQuality.LOW
                          ? "#e74c3c"
                          : compression === CompressionQuality.MEDIUM
                            ? "#f39c12"
                            : "#2ecc71",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.compressionInfoItem}><>

              <Text style={styles.compressionLabel}>Sync Speed</Text>
              <View
</> style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width:
                        compression === CompressionQuality.LOW
                          ? "90%"
                          : compression === CompressionQuality.MEDIUM
                            ? "60%"
                            : "30%",
                      backgroundColor:
                        compression === CompressionQuality.LOW
                          ? "#2ecc71"
                          : compression === CompressionQuality.MEDIUM
                            ? "#f39c12"
                            : "#e74c3c",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Sync Priorities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="sync" size={24} color="#3498db" />
            <Text style={styles.sectionTitle}>Sync Priorities</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Set sync priorities for different types of data to optimize battery and data usage.
          </Text>

          {Object.entries(syncPriorities).map(([category, priority]) => (
            <View key={category} style={styles.syncItem}><>

              <Text style={styles.syncCategory}>{getCategoryLabel(category as SyncCategory)}</Text>

              <TouchableOpacity
</>
                style={styles.priorityButton}
                onPress={() => {
                  // Show priority selection
                  Alert.alert(
                    `Set Priority for ${getCategoryLabel(category as SyncCategory)}`,
                    "Select a sync priority:",
                    [
                      {
                        text: "Critical",
                        onPress: () =>
                          handleSyncPriorityChange(category as SyncCategory, SyncPriority.CRITICAL),
                      },
                      {
                        text: "High",
                        onPress: () =>
                          handleSyncPriorityChange(category as SyncCategory, SyncPriority.HIGH),
                      },
                      {
                        text: "Medium",
                        onPress: () =>
                          handleSyncPriorityChange(category as SyncCategory, SyncPriority.MEDIUM),
                      },
                      {
                        text: "Low",
                        onPress: () =>
                          handleSyncPriorityChange(category as SyncCategory, SyncPriority.LOW),
                      },
                      {
                        text: "Background",
                        onPress: () =>
                          handleSyncPriorityChange(
                            category as SyncCategory,
                            SyncPriority.BACKGROUND
                          ),
                      },
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                    ]
                  );
                }}
              ><>

                <Text style={styles.priorityButtonText}>{getPriorityLabel(priority)}</Text>
                <MaterialCommunityIcons
</> name="chevron-down" size={16} color="#3498db" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.syncNowButton} onPress={handleForceSync}>
            <MaterialCommunityIcons name="sync" size={20} color="#fff" />
            <Text style={styles.syncNowText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  securityBadge: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: "#3498db",
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  selectedOptionText: {
    color: "#fff",
  },
  helperText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 8,
  },
  compressionInfo: {
    marginTop: 16,
  },
  compressionInfoItem: {
    marginBottom: 8,
  },
  compressionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barContainer: {
    height: 8,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
  syncItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  syncCategory: {
    fontSize: 14,
  },
  priorityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  priorityButtonText: {
    fontSize: 12,
    marginRight: 4,
  },
  syncNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  syncNowText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default SecuritySettingsScreen;
