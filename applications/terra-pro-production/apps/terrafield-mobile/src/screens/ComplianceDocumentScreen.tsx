import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";

import {
  ComplianceDocumentService,
  DocumentTemplateType,
  DocumentFormatType,
  ComplianceOrganization,
  DocumentGenerationOptions,
  DocumentGenerationResult,
} from "../services/ComplianceDocumentService";
import { PropertyData } from "../services/types";
import { DataSyncService } from "../services/DataSyncService";
import { SelectField } from "../components/ui/FormComponents";

/**
 * ComplianceDocumentScreen
 *
 * This screen allows users to generate compliance documents
 * from property data with a single click or customize options.
 */
const ComplianceDocumentScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId;

  // Services
  const documentService = ComplianceDocumentService.getInstance();
  const dataService = DataSyncService.getInstance();

  // State
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<DocumentGenerationResult[]>([]);

  // Document options state
  const [documentOptions, setDocumentOptions] = useState<DocumentGenerationOptions>({
    templateType: DocumentTemplateType.URAR,
    formatType: DocumentFormatType.PDF,
    complianceOrganizations: [ComplianceOrganization.USPAP],
    includePhotos: true,
    includeSketches: true,
    includeMaps: true,
    includeComparables: true,
    includeMarketAnalysis: true,
    includeDigitalSignature: false,
  });

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      try {
        setIsLoading(true);

        if (propertyId) {
          // Load property from data service
          const loadedProperty = dataService.getProperty(propertyId);

          if (loadedProperty) {
            setProperty(loadedProperty);
          } else {
            Alert.alert("Error", "Property not found. Please select a valid property.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          }
        } else {
          Alert.alert("Error", "No property selected. Please select a property to continue.", [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
        }

        // Load previously generated documents
        await loadGeneratedDocuments();
      } catch (error) {
        console.error("Error loading property:", error);
        Alert.alert("Error", "Failed to load property data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId]);

  // Load previously generated documents
  const loadGeneratedDocuments = async () => {
    try {
      // Get all document files
      const documentUris = await documentService.getGeneratedDocuments();

      // Filter documents for this property
      const propertyDocuments = documentUris.filter((uri) => uri.includes(propertyId));

      // Create result objects
      const results: DocumentGenerationResult[] = [];

      for (const uri of propertyDocuments) {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });

        if (fileInfo.exists) {
          // Extract file name and format
          const fileName = uri.split("/").pop() || "";
          const format = fileName.split(".").pop()?.toUpperCase() as DocumentFormatType;
          const timestamp = Number(fileName.split("_").pop()?.split(".")[0] || Date.now());

          results.push({
            success: true,
            documentUri: uri,
            fileName,
            fileSize: fileInfo.size,
            format: format as DocumentFormatType,
            timestamp,
            generatedOffline: true, // Assumption since we don't store this info
          });
        }
      }

      // Sort by timestamp (newest first)
      results.sort((a, b) => b.timestamp - a.timestamp);

      setGeneratedDocuments(results);
    } catch (error) {
      console.error("Error loading generated documents:", error);
    }
  };

  // Handle generate document with one click
  const handleOneClickGenerate = async () => {
    if (!property) return;

    try {
      setIsGenerating(true);

      // Use default options
      const result = await documentService.generateDocument(property);

      if (result.success) {
        // Add to generated documents
        setGeneratedDocuments((prevDocs) => [result, ...prevDocs]);

        Alert.alert(
          "Document Generated",
          "The compliance document has been generated successfully.",
          [
            {
              text: "View",
              onPress: () => handleViewDocument(result),
            },
            {
              text: "Share",
              onPress: () => handleShareDocument(result),
            },
            {
              text: "OK",
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate document");
      }
    } catch (error) {
      console.error("Error generating document:", error);
      Alert.alert("Error", "An unexpected error occurred while generating the document");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generate document with custom options
  const handleCustomGenerate = async () => {
    if (!property) return;

    try {
      setIsGenerating(true);

      // Use custom options
      const result = await documentService.generateDocument(property, documentOptions);

      if (result.success) {
        // Add to generated documents
        setGeneratedDocuments((prevDocs) => [result, ...prevDocs]);

        Alert.alert(
          "Document Generated",
          "The compliance document has been generated successfully.",
          [
            {
              text: "View",
              onPress: () => handleViewDocument(result),
            },
            {
              text: "Share",
              onPress: () => handleShareDocument(result),
            },
            {
              text: "OK",
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate document");
      }
    } catch (error) {
      console.error("Error generating document:", error);
      Alert.alert("Error", "An unexpected error occurred while generating the document");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle view document
  const handleViewDocument = (document: DocumentGenerationResult) => {
    if (!document.documentUri) return;

    // In a real app, this would open the document in a viewer
    Alert.alert("View Document", "Document viewer not implemented in this prototype.", [
      {
        text: "OK",
      },
    ]);
  };

  // Handle share document
  const handleShareDocument = async (document: DocumentGenerationResult) => {
    if (!document.documentUri) return;

    try {
      await documentService.shareDocument(document.documentUri, document.fileName);
    } catch (error) {
      console.error("Error sharing document:", error);
      Alert.alert("Error", "Failed to share document");
    }
  };

  // Handle delete document
  const handleDeleteDocument = async (document: DocumentGenerationResult) => {
    if (!document.documentUri) return;

    Alert.alert("Delete Document", "Are you sure you want to delete this document?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await documentService.deleteDocument(document.documentUri!);

            if (success) {
              // Remove from list
              setGeneratedDocuments((prevDocs) =>
                prevDocs.filter((doc) => doc.documentUri !== document.documentUri)
              );
            } else {
              Alert.alert("Error", "Failed to delete document");
            }
          } catch (error) {
            console.error("Error deleting document:", error);
            Alert.alert("Error", "Failed to delete document");
          }
        },
      },
    ]);
  };

  // Update document option
  const updateDocumentOption = <K extends keyof DocumentGenerationOptions>(
    key: K,
    value: DocumentGenerationOptions[K]
  ) => {
    setDocumentOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Toggle compliance organization
  const toggleComplianceOrganization = (org: ComplianceOrganization) => {
    setDocumentOptions((prev) => {
      const orgs = [...prev.complianceOrganizations];

      if (orgs.includes(org)) {
        // Remove if already included
        return {
          ...prev,
          complianceOrganizations: orgs.filter((o) => o !== org),
        };
      } else {
        // Add if not included
        return {
          ...prev,
          complianceOrganizations: [...orgs, org],
        };
      }
    });
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

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get icon for document format
  const getFormatIcon = (format?: DocumentFormatType): string => {
    switch (format) {
      case DocumentFormatType.PDF:
        return "file-pdf-box";
      case DocumentFormatType.DOCX:
        return "file-word-box";
      case DocumentFormatType.XML:
        return "file-xml-box";
      case DocumentFormatType.JSON:
        return "file-code-outline";
      default:
        return "file-document-outline";
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

  // Render document template options
  const renderTemplateOptions = () => {
    const templates = [
      { label: "Uniform Residential Appraisal Report (URAR)", value: DocumentTemplateType.URAR },
      { label: "Land Appraisal Report", value: DocumentTemplateType.LAND },
      { label: "Condominium Appraisal Report", value: DocumentTemplateType.CONDO },
      { label: "Multi-Family Appraisal Report", value: DocumentTemplateType.MULTI_FAMILY },
      { label: "Manufactured Home Appraisal Report", value: DocumentTemplateType.MANUFACTURED },
      { label: "FHA Single Family Appraisal", value: DocumentTemplateType.FHA },
      { label: "VA Loan Guaranty Appraisal", value: DocumentTemplateType.VA },
      { label: "Fannie Mae Form 1004", value: DocumentTemplateType.FNMA },
      { label: "Freddie Mac Form 70", value: DocumentTemplateType.FHLMC },
    ];

    return (
      <View style={styles.optionSection}><>

        <Text style={styles.optionTitle}>Document Template</Text>
        <SelectField
</>
          label="Template Type"
          value={documentOptions.templateType}
          options={templates}
          onSelect={(value) => updateDocumentOption("templateType", value as DocumentTemplateType)}
        />
      </View>
    );
  };

  // Render document format options
  const renderFormatOptions = () => {
    const formats = [
      { label: "PDF Document", value: DocumentFormatType.PDF },
      { label: "Word Document (DOCX)", value: DocumentFormatType.DOCX },
      { label: "XML Data", value: DocumentFormatType.XML },
      { label: "JSON Data", value: DocumentFormatType.JSON },
    ];

    return (
      <View style={styles.optionSection}><>

        <Text style={styles.optionTitle}>Document Format</Text>
        <SelectField
</>
          label="Format Type"
          value={documentOptions.formatType}
          options={formats}
          onSelect={(value) => updateDocumentOption("formatType", value as DocumentFormatType)}
        />
      </View>
    );
  };

  // Render compliance organization options
  const renderComplianceOptions = () => {
    const organizations = [
      { key: ComplianceOrganization.USPAP, label: "USPAP" },
      { key: ComplianceOrganization.FHA, label: "FHA" },
      { key: ComplianceOrganization.VA, label: "VA" },
      { key: ComplianceOrganization.FNMA, label: "Fannie Mae" },
      { key: ComplianceOrganization.FHLMC, label: "Freddie Mac" },
      { key: ComplianceOrganization.STATE, label: "State Requirements" },
    ];

    return (
      <View style={styles.optionSection}>
        <Text style={styles.optionTitle}>Compliance Requirements</Text>

        {organizations.map((org) => (
          <View key={org.key} style={styles.switchOption}><>

            <Text style={styles.switchLabel}>{org.label}</Text>
            <Switch
</>
              value={documentOptions.complianceOrganizations.includes(org.key)}
              onValueChange={() => toggleComplianceOrganization(org.key)}
              trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
              thumbColor={
                documentOptions.complianceOrganizations.includes(org.key) ? "#3498db" : "#f4f4f4"
              }
            />
          </View>
        ))}
      </View>
    );
  };

  // Render content options
  const renderContentOptions = () => {
    return (
      <View style={styles.optionSection}><>

        <Text style={styles.optionTitle}>Content Options</Text>

        <View
</> style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Photos</Text>
          <Switch
</>
            value={documentOptions.includePhotos}
            onValueChange={(value) => updateDocumentOption("includePhotos", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includePhotos ? "#3498db" : "#f4f4f4"}
          />
        </View>

        <View style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Sketches</Text>
          <Switch
</>
            value={documentOptions.includeSketches}
            onValueChange={(value) => updateDocumentOption("includeSketches", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includeSketches ? "#3498db" : "#f4f4f4"}
          />
        </View>

        <View style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Maps</Text>
          <Switch
</>
            value={documentOptions.includeMaps}
            onValueChange={(value) => updateDocumentOption("includeMaps", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includeMaps ? "#3498db" : "#f4f4f4"}
          />
        </View>

        <View style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Comparables</Text>
          <Switch
</>
            value={documentOptions.includeComparables}
            onValueChange={(value) => updateDocumentOption("includeComparables", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includeComparables ? "#3498db" : "#f4f4f4"}
          />
        </View>

        <View style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Market Analysis</Text>
          <Switch
</>
            value={documentOptions.includeMarketAnalysis}
            onValueChange={(value) => updateDocumentOption("includeMarketAnalysis", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includeMarketAnalysis ? "#3498db" : "#f4f4f4"}
          />
        </View>

        <View style={styles.switchOption}><>

          <Text style={styles.switchLabel}>Include Digital Signature</Text>
          <Switch
</>
            value={documentOptions.includeDigitalSignature}
            onValueChange={(value) => updateDocumentOption("includeDigitalSignature", value)}
            trackColor={{ false: "#d0d0d0", true: "#a0cfff" }}
            thumbColor={documentOptions.includeDigitalSignature ? "#3498db" : "#f4f4f4"}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>Compliance Documents</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Property Info */}
        {property && (
          <View style={styles.propertyCard}><>

            <Text style={styles.propertyAddress}>{property.address}</Text>
            <Text
</> style={styles.propertyDetails}>
              {property.city}, {property.state} {property.zipCode}
            </Text>
            <Text style={styles.propertyType}>
              {property.propertyType} • {property.bedrooms} beds • {property.bathrooms} baths •{" "}
              {property.squareFeet} sq ft
            </Text>
          </View>
        )}

        {/* One-Click Generate */}
        <View style={styles.generateSection}><>

          <Text style={styles.sectionTitle}>One-Click Compliance Document</Text>
          <Text
</> style={styles.sectionDescription}>
            Generate a standard compliance document for this property with a single click. The
            default template uses the Uniform Residential Appraisal Report format.
          </Text>

          <TouchableOpacity
            style={styles.oneClickButton}
            onPress={handleOneClickGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-document-outline" size={24} color="#fff" />
                <Text style={styles.oneClickButtonText}>Generate Standard Document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Advanced Options */}
        <View style={styles.advancedSection}>
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
          ><>

            <Text style={styles.advancedToggleText}>
              {showAdvancedOptions ? "Hide Advanced Options" : "Show Advanced Options"}
            </Text>
            <MaterialCommunityIcons
</>
              name={showAdvancedOptions ? "chevron-up" : "chevron-down"}
              size={24}
              color="#3498db"
            />
          </TouchableOpacity>

          {showAdvancedOptions && (
            <View style={styles.advancedOptions}>
              {renderTemplateOptions()}
              {renderFormatOptions()}
              {renderComplianceOptions()}
              {renderContentOptions()}

              <TouchableOpacity
                style={styles.customGenerateButton}
                onPress={handleCustomGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cog" size={24} color="#fff" />
                    <Text style={styles.customGenerateButtonText}>Generate Custom Document</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Generated Documents */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Generated Documents</Text>

          {generatedDocuments.length === 0 ? (
            <View style={styles.emptyDocuments}>
              <MaterialCommunityIcons name="file-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyDocumentsText}>No documents generated yet</Text>
            </View>
          ) : (
            <FlatList
              data={generatedDocuments}
              keyExtractor={(item /* , index */) => item.documentUri || `document-${index}`}
              renderItem={({ item }) => (
                <View style={styles.documentItem}>
                  <View style={styles.documentIconContainer}><>

                    <MaterialCommunityIcons
                      name={getFormatIcon(item.format)}
                      size={36}
                      color="#3498db"
                    />
                  </View>

                  <View
</> style={styles.documentInfo}><>

                    <Text style={styles.documentName} numberOfLines={1}>
                      {item.fileName || "Untitled Document"}
                    </Text>
                    <Text
</> style={styles.documentMeta}>
                      {formatDate(item.timestamp)} • {formatFileSize(item.fileSize)}
                    </Text>
                    {item.generatedOffline && (
                      <View style={styles.offlineBadge}>
                        <Text style={styles.offlineBadgeText}>Offline</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={styles.documentAction}
                      onPress={() => handleViewDocument(item)}
                    ><>

                      <MaterialCommunityIcons name="eye" size={24} color="#7f8c8d" />
                    </TouchableOpacity>

                    <TouchableOpacity
</>
                      style={styles.documentAction}
                      onPress={() => handleShareDocument(item)}
                    ><>

                      <MaterialCommunityIcons name="share-variant" size={24} color="#7f8c8d" />
                    </TouchableOpacity>

                    <TouchableOpacity
</>
                      style={styles.documentAction}
                      onPress={() => handleDeleteDocument(item)}
                    >
                      <MaterialCommunityIcons name="delete" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              style={styles.documentsList}
              scrollEnabled={false}
            />
          )}
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
    color: "#7f8c8d",
    fontSize: 16,
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
  propertyCard: {
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
  propertyAddress: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  generateSection: {
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 16,
    lineHeight: 20,
  },
  oneClickButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  oneClickButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  advancedSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
  },
  advancedOptions: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  optionSection: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  switchOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  switchLabel: {
    fontSize: 14,
  },
  customGenerateButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  customGenerateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  documentsSection: {
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
  emptyDocuments: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyDocumentsText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 8,
  },
  documentsList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "500",
  },
  documentMeta: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: "#f39c12",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  offlineBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  documentActions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  documentAction: {
    padding: 8,
  },
});

export default ComplianceDocumentScreen;
