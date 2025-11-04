import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import VoiceInput from "../components/ui/VoiceInput";
import { TextField, NumberField, SelectField } from "../components/ui/FormComponents";
import { VoiceRecognitionService, RecognitionLanguage } from "../services/VoiceRecognitionService";
import { DataSyncService } from "../services/DataSyncService";
import { OfflineQueueService, OperationType } from "../services/OfflineQueueService";
import { PropertyData } from "../services/types";

/**
 * Property form mode
 */
enum FormMode {
  CREATE = "create",
  EDIT = "edit",
}

/**
 * Language options for voice recognition
 */
const LANGUAGE_OPTIONS = [
  { label: "English (US)", value: RecognitionLanguage.ENGLISH_US },
  { label: "English (UK)", value: RecognitionLanguage.ENGLISH_UK },
  { label: "Spanish", value: RecognitionLanguage.SPANISH },
  { label: "French", value: RecognitionLanguage.FRENCH },
  { label: "German", value: RecognitionLanguage.GERMAN },
  { label: "Chinese", value: RecognitionLanguage.CHINESE },
  { label: "Japanese", value: RecognitionLanguage.JAPANESE },
];

/**
 * Property type options
 */
const PROPERTY_TYPE_OPTIONS = [
  { label: "Single Family", value: "single_family" },
  { label: "Condo", value: "condo" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Multi-Family", value: "multi_family" },
  { label: "Vacant Land", value: "vacant_land" },
  { label: "Commercial", value: "commercial" },
];

/**
 * VoicePropertyFormScreen
 *
 * A screen for creating or editing property data using voice input.
 */
const VoicePropertyFormScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID and mode from route params
  const propertyId = route.params?.propertyId;
  const mode = propertyId ? FormMode.EDIT : FormMode.CREATE;

  // Services
  const voiceRecognitionService = VoiceRecognitionService.getInstance();
  const dataService = DataSyncService.getInstance();
  const offlineQueueService = OfflineQueueService.getInstance();

  // Get field help examples
  const fieldHelpExamples = voiceRecognitionService.getFieldHelpExamples();

  // State
  const [property, setProperty] = useState<PropertyData>({
    id: propertyId || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "",
    yearBuilt: null,
    squareFeet: null,
    bedrooms: null,
    bathrooms: null,
    lotSize: null,
    hasGarage: false,
    hasPool: false,
    additionalFeatures: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(mode === FormMode.EDIT);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [useVoiceInput, setUseVoiceInput] = useState<boolean>(true);
  const [language, setLanguage] = useState<RecognitionLanguage>(RecognitionLanguage.ENGLISH_US);

  // Load property data if in edit mode
  useEffect(() => {
    const loadProperty = async () => {
      if (mode === FormMode.EDIT && propertyId) {
        try {
          setIsLoading(true);

          // Load property from data service
          const loadedProperty = dataService.getProperty(propertyId);

          if (loadedProperty) {
            setProperty(loadedProperty);
          } else {
            Alert.alert("Error", "Property not found. Please try again.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          }
        } catch (error) {
          console.error("Error loading property:", error);

          Alert.alert("Error", "Failed to load property data. Please try again.", [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProperty();
  }, [mode, propertyId]);

  // Update property field
  const updateField = <K extends keyof PropertyData>(field: K, value: PropertyData[K]) => {
    setProperty((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle one-click voice input
  const handleOneClickVoiceInput = async () => {
    try {
      // Show alert with instructions
      Alert.alert(
        "Voice Property Data Entry",
        "You will be prompted to describe the property. Speak clearly and include details such as address, property type, size, bedrooms, etc.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Start",
            onPress: async () => {
              try {
                // Record property data
                const result = await voiceRecognitionService.recordPropertyData({
                  language,
                });

                // Update property with extracted data
                if (Object.keys(result.propertyData).length > 0) {
                  setProperty((prev) => ({
                    ...prev,
                    ...result.propertyData,
                  }));

                  Alert.alert(
                    "Data Extracted",
                    `Successfully extracted ${Object.keys(result.propertyData).length} property fields.`,
                    [{ text: "OK" }]
                  );
                } else {
                  Alert.alert(
                    "No Data Extracted",
                    "Could not extract any property data from your description. Try specifying fields more clearly or use the form to enter data manually.",
                    [{ text: "OK" }]
                  );
                }
              } catch (error) {
                console.error("Error in one-click voice input:", error);

                Alert.alert(
                  "Error",
                  "An error occurred during voice input. Please try again or use manual input.",
                  [{ text: "OK" }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in one-click voice input:", error);

      Alert.alert("Error", "An error occurred. Please try again or use manual input.", [
        { text: "OK" },
      ]);
    }
  };

  // Handle extracted data
  const handleExtractedData = (field: keyof PropertyData, data: Record<string, any>) => {
    if (data[field] !== undefined) {
      updateField(field, data[field]);
    }
  };

  // Save property
  const saveProperty = async () => {
    try {
      // Validate required fields
      if (!property.address || !property.city || !property.state || !property.zipCode) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields (address, city, state, zip code).",
          [{ text: "OK" }]
        );
        return;
      }

      setIsSaving(true);

      if (mode === FormMode.CREATE) {
        // Generate a temporary ID if not provided
        if (!property.id) {
          // In a real app, this would be handled by the server
          const tempId = `temp_${Date.now()}`;

          setProperty((prev) => ({
            ...prev,
            id: tempId,
          }));

          // Queue create operation
          await offlineQueueService.enqueue(
            OperationType.CREATE_PROPERTY,
            {
              ...property,
              id: tempId,
            },
            2 // Medium priority
          );
        }

        Alert.alert(
          "Property Created",
          "The property has been created successfully and will be synchronized when online.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Queue update operation
        await offlineQueueService.enqueue(
          OperationType.UPDATE_PROPERTY,
          property,
          2 // Medium priority
        );

        Alert.alert(
          "Property Updated",
          "The property has been updated successfully and will be synchronized when online.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error saving property:", error);

      Alert.alert("Error", "Failed to save property data. Please try again.", [{ text: "OK" }]);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading property data...</Text>
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
</> style={styles.headerTitle}>
          {mode === FormMode.CREATE ? "Add Property" : "Edit Property"}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Form Settings */}
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}><>

            <Text style={styles.settingLabel}>Use Voice Input</Text>
            <Switch
</>
              value={useVoiceInput}
              onValueChange={setUseVoiceInput}
              trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
              thumbColor={useVoiceInput ? "#3498db" : "#f4f4f4"}
            />
          </View>

          <View style={styles.settingItem}><>

            <Text style={styles.settingLabel}>Recognition Language</Text>
            <View
</> style={styles.languageSelector}>
              <SelectField
                label=""
                value={language}
                options={LANGUAGE_OPTIONS}
                onSelect={(value) => setLanguage(value as RecognitionLanguage)}
                style={styles.languageSelectField}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.oneClickButton} onPress={handleOneClickVoiceInput}>
            <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
            <Text style={styles.oneClickButtonText}>One-Click Property Data Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Property Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          {/* Address */}
          {useVoiceInput ? (
            <VoiceInput
              label="Address *"
              value={property.address}
              onChangeText={(text) => updateField("address", text)}
              placeholder="Enter property address"
              extractData={true}
              allowedFields={["address"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("address", data)}
            />
          ) : (
            <TextField
              label="Address *"
              value={property.address}
              onChangeText={(text) => updateField("address", text)}
              placeholder="Enter property address"
            />
          )}

          {/* City */}
          {useVoiceInput ? (
            <VoiceInput
              label="City *"
              value={property.city}
              onChangeText={(text) => updateField("city", text)}
              placeholder="Enter city"
              extractData={true}
              allowedFields={["city"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("city", data)}
            />
          ) : (
            <TextField
              label="City *"
              value={property.city}
              onChangeText={(text) => updateField("city", text)}
              placeholder="Enter city"
            />
          )}

          {/* State */}
          {useVoiceInput ? (
            <VoiceInput
              label="State *"
              value={property.state}
              onChangeText={(text) => updateField("state", text)}
              placeholder="Enter state"
              extractData={true}
              allowedFields={["state"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("state", data)}
            />
          ) : (
            <TextField
              label="State *"
              value={property.state}
              onChangeText={(text) => updateField("state", text)}
              placeholder="Enter state"
            />
          )}

          {/* Zip Code */}
          {useVoiceInput ? (
            <VoiceInput
              label="ZIP Code *"
              value={property.zipCode}
              onChangeText={(text) => updateField("zipCode", text)}
              placeholder="Enter ZIP code"
              extractData={true}
              allowedFields={["zipCode"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("zipCode", data)}
            />
          ) : (
            <TextField
              label="ZIP Code *"
              value={property.zipCode}
              onChangeText={(text) => updateField("zipCode", text)}
              placeholder="Enter ZIP code"
            />
          )}

          {/* Property Type */}<>

          <SelectField
            label="Property Type"
            value={property.propertyType}
            options={PROPERTY_TYPE_OPTIONS}
            onSelect={(value) => updateField("propertyType", value as string)}
          />
        </View>

        <View
</> style={styles.formCard}>
          <Text style={styles.sectionTitle}>Property Characteristics</Text>

          {/* Year Built */}
          {useVoiceInput ? (
            <VoiceInput
              label="Year Built"
              value={property.yearBuilt?.toString() || ""}
              onChangeText={(text) => updateField("yearBuilt", text ? parseInt(text) : null)}
              placeholder="Enter year built"
              extractData={true}
              allowedFields={["yearBuilt"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("yearBuilt", data)}
            />
          ) : (
            <NumberField
              label="Year Built"
              value={property.yearBuilt}
              onChangeValue={(value) => updateField("yearBuilt", value)}
              placeholder="Enter year built"
              min={1800}
              max={new Date().getFullYear()}
            />
          )}

          {/* Square Feet */}
          {useVoiceInput ? (
            <VoiceInput
              label="Square Feet"
              value={property.squareFeet?.toString() || ""}
              onChangeText={(text) => updateField("squareFeet", text ? parseInt(text) : null)}
              placeholder="Enter square feet"
              extractData={true}
              allowedFields={["squareFeet"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("squareFeet", data)}
            />
          ) : (
            <NumberField
              label="Square Feet"
              value={property.squareFeet}
              onChangeValue={(value) => updateField("squareFeet", value)}
              placeholder="Enter square feet"
              min={0}
              suffix="sq ft"
            />
          )}

          {/* Bedrooms */}
          {useVoiceInput ? (
            <VoiceInput
              label="Bedrooms"
              value={property.bedrooms?.toString() || ""}
              onChangeText={(text) => updateField("bedrooms", text ? parseInt(text) : null)}
              placeholder="Enter number of bedrooms"
              extractData={true}
              allowedFields={["bedrooms"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("bedrooms", data)}
            />
          ) : (
            <NumberField
              label="Bedrooms"
              value={property.bedrooms}
              onChangeValue={(value) => updateField("bedrooms", value)}
              placeholder="Enter number of bedrooms"
              min={0}
              step={1}
            />
          )}

          {/* Bathrooms */}
          {useVoiceInput ? (
            <VoiceInput
              label="Bathrooms"
              value={property.bathrooms?.toString() || ""}
              onChangeText={(text) => updateField("bathrooms", text ? parseFloat(text) : null)}
              placeholder="Enter number of bathrooms"
              extractData={true}
              allowedFields={["bathrooms"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("bathrooms", data)}
            />
          ) : (
            <NumberField
              label="Bathrooms"
              value={property.bathrooms}
              onChangeValue={(value) => updateField("bathrooms", value)}
              placeholder="Enter number of bathrooms"
              min={0}
              step={0.5}
              fractionDigits={1}
            />
          )}

          {/* Lot Size */}
          {useVoiceInput ? (
            <VoiceInput
              label="Lot Size"
              value={property.lotSize?.toString() || ""}
              onChangeText={(text) => updateField("lotSize", text ? parseFloat(text) : null)}
              placeholder="Enter lot size in acres"
              extractData={true}
              allowedFields={["lotSize"]}
              helpExamples={fieldHelpExamples}
              language={language}
              onDataExtracted={(data) => handleExtractedData("lotSize", data)}
            />
          ) : (
            <NumberField
              label="Lot Size"
              value={property.lotSize}
              onChangeValue={(value) => updateField("lotSize", value)}
              placeholder="Enter lot size in acres"
              min={0}
              suffix="acres"
              fractionDigits={2}
            />
          )}

          {/* Features */}
          <View style={styles.featuresContainer}><>

            <Text style={styles.featuresTitle}>Features</Text>

            <View
</> style={styles.featureItem}><>

              <Text style={styles.featureLabel}>Garage</Text>
              <Switch
</>
                value={property.hasGarage}
                onValueChange={(value) => updateField("hasGarage", value)}
                trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
                thumbColor={property.hasGarage ? "#3498db" : "#f4f4f4"}
              />
            </View>

            <View style={styles.featureItem}><>

              <Text style={styles.featureLabel}>Pool</Text>
              <Switch
</>
                value={property.hasPool}
                onValueChange={(value) => updateField("hasPool", value)}
                trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
                thumbColor={property.hasPool ? "#3498db" : "#f4f4f4"}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveProperty} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {mode === FormMode.CREATE ? "Create Property" : "Save Changes"}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  languageSelector: {
    flex: 1,
    maxWidth: 180,
  },
  languageSelectField: {
    marginBottom: 0,
  },
  oneClickButton: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  oneClickButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  featuresContainer: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  featureLabel: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default VoicePropertyFormScreen;
