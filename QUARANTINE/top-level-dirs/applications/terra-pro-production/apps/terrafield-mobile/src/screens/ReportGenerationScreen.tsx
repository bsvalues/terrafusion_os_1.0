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
  FlatList,
  Modal,
  Switch,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Picker } from "@react-native-picker/picker";
import * as MediaLibrary from "expo-media-library";
import SignatureScreen from "react-native-signature-canvas";

import {
  ReportGenerationService,
  TemplateType,
  ReportFormat,
  ReportStatus,
  ReportTemplate,
  AppraisalReport,
  ReportGenerationOptions,
} from "../services/ReportGenerationService";

/**
 * ReportGenerationScreen
 *
 * A screen for generating and managing appraisal reports
 */
const ReportGenerationScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId || "property_123";

  // Service
  const reportService = ReportGenerationService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<AppraisalReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedReport, setSelectedReport] = useState<AppraisalReport | null>(null);
  const [generationOptions, setGenerationOptions] = useState<Partial<ReportGenerationOptions>>({
    propertyId,
    formats: [ReportFormat.PDF],
    includePhotos: true,
    includeSketches: true,
    includeMaps: true,
    includeAddenda: true,
    compressOutput: true,
    includeDigitalSignature: false,
  });

  // Modal visibility state
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);

  // Signature state
  const [signatureData, setSignatureData] = useState<string>("");

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load templates and reports
        const loadedTemplates = await reportService.getTemplates();
        const loadedReports = await reportService.getReports(propertyId);

        setTemplates(loadedTemplates);
        setReports(loadedReports);

        // Set default template
        const urarTemplate = loadedTemplates.find((t) => t.type === TemplateType.URAR);
        if (urarTemplate) {
          setSelectedTemplate(urarTemplate);
          setGenerationOptions((prev) => ({
            ...prev,
            templateIdOrType: urarTemplate.id,
          }));
        }
      } catch (error) {
        console.error("Error loading report data:", error);
        Alert.alert("Error", "Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [propertyId]);

  // Handle template selection
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerationOptions((prev) => ({
      ...prev,
      templateIdOrType: template.id,
    }));
    setShowTemplateModal(false);
  };

  // Handle option change
  const handleOptionChange = (key: keyof ReportGenerationOptions, value: any) => {
    setGenerationOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle format toggle
  const handleFormatToggle = (format: ReportFormat) => {
    setGenerationOptions((prev) => {
      const currentFormats = prev.formats || [];
      const newFormats = currentFormats.includes(format)
        ? currentFormats.filter((f) => f !== format)
        : [...currentFormats, format];

      return {
        ...prev,
        formats: newFormats.length > 0 ? newFormats : [ReportFormat.PDF],
      };
    });
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    try {
      if (!selectedTemplate) {
        Alert.alert("Error", "Please select a template");
        return;
      }

      setIsGenerating(true);

      // Generate report
      const result = await reportService.generateReport(generationOptions);

      if (result.success) {
        // Reload reports
        const loadedReports = await reportService.getReports(propertyId);
        setReports(loadedReports);

        // Show success message
        Alert.alert(
          "Success",
          `Report generated successfully${result.generatedLocally ? " (offline mode)" : ""}`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      Alert.alert("Error", "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle view report
  const handleViewReport = async (report: AppraisalReport) => {
    setSelectedReport(report);
    setShowReportDetailModal(true);
  };

  // Handle delete report
  const handleDeleteReport = async () => {
    try {
      if (!selectedReport) return;

      setShowDeleteConfirmModal(false);
      setShowReportDetailModal(false);
      setIsLoading(true);

      const success = await reportService.deleteReport(selectedReport.id);

      if (success) {
        // Reload reports
        const loadedReports = await reportService.getReports(propertyId);
        setReports(loadedReports);
        setSelectedReport(null);

        // Show success message
        Alert.alert("Success", "Report deleted successfully");
      } else {
        Alert.alert("Error", "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      Alert.alert("Error", "Failed to delete report");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share report
  const handleShareReport = async () => {
    try {
      if (!selectedReport) return;

      // Get PDF file
      const pdfFile = selectedReport.files?.find((f) => f.format === ReportFormat.PDF);

      if (!pdfFile) {
        Alert.alert("Error", "No PDF file found for this report");
        return;
      }

      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(pdfFile.url);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      Alert.alert("Error", "Failed to share report");
    }
  };

  // Handle sign report
  const handleSignReport = () => {
    if (!selectedReport) return;

    setShowSignatureModal(true);
  };

  // Handle signature complete
  const handleSignatureComplete = async (signature: string) => {
    try {
      if (!selectedReport) return;

      setShowSignatureModal(false);
      setIsLoading(true);

      // Save signature as image
      const signatureBase64 = signature.split(",")[1];
      const signatureFileName = `signature_${selectedReport.id}_${Date.now()}.png`;
      const signatureFilePath = `${FileSystem.documentDirectory}${signatureFileName}`;

      await FileSystem.writeAsStringAsync(signatureFilePath, signatureBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Sign report
      const success = await reportService.signReport(selectedReport.id, signatureFilePath);

      if (success) {
        // Reload report
        const report = await reportService.getReport(selectedReport.id);
        if (report) {
          setSelectedReport(report);
        }

        // Show success message
        Alert.alert("Success", "Report signed successfully");
      } else {
        Alert.alert("Error", "Failed to sign report");
      }
    } catch (error) {
      console.error("Error signing report:", error);
      Alert.alert("Error", "Failed to sign report");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update report status
  const handleUpdateStatus = async (status: ReportStatus) => {
    try {
      if (!selectedReport) return;

      setIsLoading(true);

      const success = await reportService.updateReportStatus(selectedReport.id, status);

      if (success) {
        // Reload report
        const report = await reportService.getReport(selectedReport.id);
        if (report) {
          setSelectedReport(report);
        }

        // Reload reports
        const loadedReports = await reportService.getReports(propertyId);
        setReports(loadedReports);

        // Show success message
        Alert.alert("Success", "Report status updated successfully");
      } else {
        Alert.alert("Error", "Failed to update report status");
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      Alert.alert("Error", "Failed to update report status");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case ReportStatus.DRAFT:
        return "#f39c12";
      case ReportStatus.IN_PROGRESS:
        return "#3498db";
      case ReportStatus.COMPLETE:
        return "#2ecc71";
      case ReportStatus.SUBMITTED:
        return "#9b59b6";
      case ReportStatus.REVIEWED:
        return "#1abc9c";
      case ReportStatus.APPROVED:
        return "#27ae60";
      case ReportStatus.REJECTED:
        return "#e74c3c";
      default:
        return "#7f8c8d";
    }
  };

  // Render header
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><>

          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text
</> style={styles.headerTitle}>Report Generation</Text>

        <TouchableOpacity style={styles.optionsButton} onPress={() => setShowOptionsModal(true)}>
          <MaterialCommunityIcons name="cog" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render template section
  const renderTemplateSection = () => {
    return (
      <View style={styles.section}><>

        <Text style={styles.sectionTitle}>Report Template</Text>

        <TouchableOpacity
</>
          style={styles.templateSelector}
          onPress={() => setShowTemplateModal(true)}
        >
          <View style={styles.selectedTemplate}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#3498db" />
            <Text style={styles.selectedTemplateName}>
              {selectedTemplate ? selectedTemplate.name : "Select a template"}
            </Text>
          </View><>

          <MaterialCommunityIcons name="chevron-right" size={24} color="#7f8c8d" />
        </TouchableOpacity>

        <Text
</> style={styles.templateDescription}>
          {selectedTemplate ? selectedTemplate.description : "Please select a template to continue"}
        </Text>
      </View>
    );
  };

  // Render options section
  const renderOptionsSection = () => {
    return (
      <View style={styles.section}><>

        <Text style={styles.sectionTitle}>Report Options</Text>

        <View
</> style={styles.optionItem}><>

          <Text style={styles.optionLabel}>Include Photos</Text>
          <Switch
</>
            value={generationOptions.includePhotos ?? true}
            onValueChange={(value) => handleOptionChange("includePhotos", value)}
            trackColor={{ false: "#bdc3c7", true: "#3498db" }}
            thumbColor={generationOptions.includePhotos ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.optionItem}><>

          <Text style={styles.optionLabel}>Include Sketches</Text>
          <Switch
</>
            value={generationOptions.includeSketches ?? true}
            onValueChange={(value) => handleOptionChange("includeSketches", value)}
            trackColor={{ false: "#bdc3c7", true: "#3498db" }}
            thumbColor={generationOptions.includeSketches ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.optionItem}><>

          <Text style={styles.optionLabel}>Include Maps</Text>
          <Switch
</>
            value={generationOptions.includeMaps ?? true}
            onValueChange={(value) => handleOptionChange("includeMaps", value)}
            trackColor={{ false: "#bdc3c7", true: "#3498db" }}
            thumbColor={generationOptions.includeMaps ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.optionItem}><>

          <Text style={styles.optionLabel}>Include Addenda</Text>
          <Switch
</>
            value={generationOptions.includeAddenda ?? true}
            onValueChange={(value) => handleOptionChange("includeAddenda", value)}
            trackColor={{ false: "#bdc3c7", true: "#3498db" }}
            thumbColor={generationOptions.includeAddenda ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.formatOptionsTitle}>
          <Text style={styles.formatOptionsTitleText}>Output Formats:</Text>
        </View>

        <View style={styles.formatOptions}>
          <TouchableOpacity
            style={[
              styles.formatOption,
              generationOptions.formats?.includes(ReportFormat.PDF) && styles.formatOptionSelected,
            ]}
            onPress={() => handleFormatToggle(ReportFormat.PDF)}
          >
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={24}
              color={generationOptions.formats?.includes(ReportFormat.PDF) ? "#fff" : "#3498db"}
            />
            <Text
              style={[
                styles.formatOptionText,
                generationOptions.formats?.includes(ReportFormat.PDF) &&
                  styles.formatOptionTextSelected,
              ]}
            >
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.formatOption,
              generationOptions.formats?.includes(ReportFormat.DOCX) && styles.formatOptionSelected,
            ]}
            onPress={() => handleFormatToggle(ReportFormat.DOCX)}
          >
            <MaterialCommunityIcons
              name="file-word-box"
              size={24}
              color={generationOptions.formats?.includes(ReportFormat.DOCX) ? "#fff" : "#3498db"}
            />
            <Text
              style={[
                styles.formatOptionText,
                generationOptions.formats?.includes(ReportFormat.DOCX) &&
                  styles.formatOptionTextSelected,
              ]}
            >
              DOCX
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.formatOption,
              generationOptions.formats?.includes(ReportFormat.XML) && styles.formatOptionSelected,
            ]}
            onPress={() => handleFormatToggle(ReportFormat.XML)}
          >
            <MaterialCommunityIcons
              name="file-xml-box"
              size={24}
              color={generationOptions.formats?.includes(ReportFormat.XML) ? "#fff" : "#3498db"}
            />
            <Text
              style={[
                styles.formatOptionText,
                generationOptions.formats?.includes(ReportFormat.XML) &&
                  styles.formatOptionTextSelected,
              ]}
            >
              XML
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render generate button
  const renderGenerateButton = () => {
    return (
      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={handleGenerateReport}
        disabled={isGenerating || !selectedTemplate}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.generateButtonText}>Generating...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="file-document-plus" size={24} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Report</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render reports list
  const renderReportsList = () => {
    if (reports.length === 0) {
      return (
        <View style={styles.emptyReportsContainer}>
          <MaterialCommunityIcons name="file-document" size={48} color="#bdc3c7" /><>

          <Text style={styles.emptyReportsText}>No reports generated yet</Text>
          <Text
</> style={styles.emptyReportsSubtext}>
            Select a template and options above, then press Generate Report
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.reportItem} onPress={() => handleViewReport(item)}>
            <View style={styles.reportIconContainer}>
              <MaterialCommunityIcons name="file-document" size={32} color="#3498db" /><>

              <View
                style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}
              />
            </View>

            <View
</> style={styles.reportInfo}><>

              <Text style={styles.reportTitle}>{item.title}</Text>
              <Text
</> style={styles.reportDate}>
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <View style={styles.reportMeta}><>

                <Text style={styles.reportTemplate}>{item.templateType}</Text>
                <Text
</> style={styles.reportStatus}>{item.status}</Text>
              </View>
              <View style={styles.reportProgress}>
                <View style={styles.progressBar}><>

                  <View style={[styles.progressFill, { width: `${item.completionPercentage}%` }]} />
                </View>
                <Text
</> style={styles.progressText}>{item.completionPercentage}%</Text>
              </View>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color="#bdc3c7" />
          </TouchableOpacity>
        )}
        style={styles.reportsList}
        contentContainerStyle={styles.reportsListContent}
      />
    );
  };

  // Render template modal
  const renderTemplateModal = () => {
    return (
      <Modal
        visible={showTemplateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Select Template</Text>
              <TouchableOpacity
</> onPress={() => setShowTemplateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.templateItem,
                    selectedTemplate?.id === item.id && styles.templateItemSelected,
                  ]}
                  onPress={() => handleSelectTemplate(item)}
                >
                  <View style={styles.templateItemIconContainer}><>

                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={24}
                      color={selectedTemplate?.id === item.id ? "#fff" : "#3498db"}
                    />
                  </View>
                  <View
</> style={styles.templateItemInfo}><>

                    <Text
                      style={[
                        styles.templateItemName,
                        selectedTemplate?.id === item.id && styles.templateItemNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
</>
                      style={[
                        styles.templateItemDescription,
                        selectedTemplate?.id === item.id && styles.templateItemDescriptionSelected,
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>
                  {selectedTemplate?.id === item.id && (
                    <MaterialCommunityIcons name="check" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.templatesList}
              contentContainerStyle={styles.templatesListContent}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTemplateModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render options modal
  const renderOptionsModal = () => {
    return (
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Advanced Options</Text>
              <TouchableOpacity
</> onPress={() => setShowOptionsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsScrollView}>
              <View style={styles.optionSection}><>

                <Text style={styles.optionSectionTitle}>Output Options</Text>

                <View
</> style={styles.advancedOptionItem}><>

                  <Text style={styles.advancedOptionLabel}>Compress Output</Text>
                  <Switch
</>
                    value={generationOptions.compressOutput ?? true}
                    onValueChange={(value) => handleOptionChange("compressOutput", value)}
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={generationOptions.compressOutput ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.advancedOptionItem}><>

                  <Text style={styles.advancedOptionLabel}>Include Digital Signature</Text>
                  <Switch
</>
                    value={generationOptions.includeDigitalSignature ?? false}
                    onValueChange={(value) => handleOptionChange("includeDigitalSignature", value)}
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={generationOptions.includeDigitalSignature ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>

              <View style={styles.optionSection}><>

                <Text style={styles.optionSectionTitle}>Additional Sections</Text>

                <View
</> style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      const newSections = generationOptions.additionalSections?.includes(
                        "market_analysis"
                      )
                        ? generationOptions.additionalSections.filter(
                            (s) => s !== "market_analysis"
                          )
                        : [...(generationOptions.additionalSections || []), "market_analysis"];

                      handleOptionChange("additionalSections", newSections);
                    }}
                  >
                    <View style={styles.checkboxInner}>
                      {generationOptions.additionalSections?.includes("market_analysis") && (<>

                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <Text
</> style={styles.checkboxLabel}>Market Analysis</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      const newSections = generationOptions.additionalSections?.includes(
                        "neighborhood_data"
                      )
                        ? generationOptions.additionalSections.filter(
                            (s) => s !== "neighborhood_data"
                          )
                        : [...(generationOptions.additionalSections || []), "neighborhood_data"];

                      handleOptionChange("additionalSections", newSections);
                    }}
                  >
                    <View style={styles.checkboxInner}>
                      {generationOptions.additionalSections?.includes("neighborhood_data") && (<>

                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <Text
</> style={styles.checkboxLabel}>Neighborhood Data</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      const newSections = generationOptions.additionalSections?.includes(
                        "flood_data"
                      )
                        ? generationOptions.additionalSections.filter((s) => s !== "flood_data")
                        : [...(generationOptions.additionalSections || []), "flood_data"];

                      handleOptionChange("additionalSections", newSections);
                    }}
                  >
                    <View style={styles.checkboxInner}>
                      {generationOptions.additionalSections?.includes("flood_data") && (<>

                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <Text
</> style={styles.checkboxLabel}>Flood Data</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      const newSections = generationOptions.additionalSections?.includes(
                        "environmental"
                      )
                        ? generationOptions.additionalSections.filter((s) => s !== "environmental")
                        : [...(generationOptions.additionalSections || []), "environmental"];

                      handleOptionChange("additionalSections", newSections);
                    }}
                  >
                    <View style={styles.checkboxInner}>
                      {generationOptions.additionalSections?.includes("environmental") && (<>

                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <Text
</> style={styles.checkboxLabel}>Environmental Factors</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowOptionsModal(false)}>
              <Text style={styles.modalButtonText}>Save Options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render report detail modal
  const renderReportDetailModal = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        visible={showReportDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportDetailModal}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity
</> onPress={() => setShowReportDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reportDetailScrollView}>
              <View style={styles.reportDetailSection}><>

                <Text style={styles.reportDetailTitle}>{selectedReport.title}</Text>

                <View
</>
                  style={[
                    styles.reportDetailStatus,
                    { backgroundColor: getStatusColor(selectedReport.status) },
                  ]}
                >
                  <Text style={styles.reportDetailStatusText}>{selectedReport.status}</Text>
                </View>

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Property ID:</Text>
                  <Text
</> style={styles.reportDetailValue}>{selectedReport.propertyId}</Text>
                </View>

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Template:</Text>
                  <Text
</> style={styles.reportDetailValue}>{selectedReport.templateType}</Text>
                </View>

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Created:</Text>
                  <Text
</> style={styles.reportDetailValue}>
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Updated:</Text>
                  <Text
</> style={styles.reportDetailValue}>
                    {new Date(selectedReport.updatedAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Appraiser:</Text>
                  <Text
</> style={styles.reportDetailValue}>{selectedReport.appraiserName}</Text>
                </View>

                {selectedReport.clientName && (
                  <View style={styles.reportDetailItem}><>

                    <Text style={styles.reportDetailLabel}>Client:</Text>
                    <Text
</> style={styles.reportDetailValue}>{selectedReport.clientName}</Text>
                  </View>
                )}

                {selectedReport.lenderName && (
                  <View style={styles.reportDetailItem}><>

                    <Text style={styles.reportDetailLabel}>Lender:</Text>
                    <Text
</> style={styles.reportDetailValue}>{selectedReport.lenderName}</Text>
                  </View>
                )}

                <View style={styles.reportDetailItem}><>

                  <Text style={styles.reportDetailLabel}>Completion:</Text>
                  <View
</> style={styles.reportDetailProgressContainer}>
                    <View style={styles.reportDetailProgressBar}><>

                      <View
                        style={[
                          styles.reportDetailProgressFill,
                          { width: `${selectedReport.completionPercentage}%` },
                        ]}
                      />
                    </View>
                    <Text
</> style={styles.reportDetailProgressText}>
                      {selectedReport.completionPercentage}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reportDetailSection}>
                <Text style={styles.reportDetailSectionTitle}>Available Files</Text>

                {selectedReport.files && selectedReport.files.length > 0 ? (
                  selectedReport.files.map((file /* , index */) => (
                    <View key={index} style={styles.reportFileItem}>
                      <View style={styles.reportFileIcon}><>

                        <MaterialCommunityIcons
                          name={
                            file.format === "pdf"
                              ? "file-pdf-box"
                              : file.format === "docx"
                                ? "file-word-box"
                                : file.format === "xml"
                                  ? "file-xml-box"
                                  : "file-document"
                          }
                          size={32}
                          color="#3498db"
                        />
                      </View>
                      <View
</> style={styles.reportFileInfo}><>

                        <Text style={styles.reportFileName}>
                          {file.format.toUpperCase()} Document
                        </Text>
                        <Text
</> style={styles.reportFileSize}>
                          {(file.size / 1024).toFixed(1)} KB •
                          {new Date(file.generatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.reportNoFiles}>No files available</Text>
                )}
              </View>

              {selectedReport.signature && (
                <View style={styles.reportDetailSection}><>

                  <Text style={styles.reportDetailSectionTitle}>Signature</Text>
                  <Image
</>
                    source={{ uri: selectedReport.signature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.reportDetailActions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={styles.reportDetailAction} onPress={handleShareReport}>
                  <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
                  <Text style={styles.reportDetailActionText}>Share</Text>
                </TouchableOpacity>

                {!selectedReport.signature && (
                  <TouchableOpacity style={styles.reportDetailAction} onPress={handleSignReport}>
                    <MaterialCommunityIcons name="draw-pen" size={20} color="#fff" />
                    <Text style={styles.reportDetailActionText}>Sign</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.reportDetailAction, { backgroundColor: "#3498db" }]}
                  onPress={() => setShowDeleteConfirmModal(true)}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.reportDetailActionText}>Delete</Text>
                </TouchableOpacity>

                {selectedReport.status !== ReportStatus.COMPLETE && (
                  <TouchableOpacity
                    style={[styles.reportDetailAction, { backgroundColor: "#2ecc71" }]}
                    onPress={() => handleUpdateStatus(ReportStatus.COMPLETE)}
                  >
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={styles.reportDetailActionText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}

                {selectedReport.status !== ReportStatus.SUBMITTED &&
                  selectedReport.status === ReportStatus.COMPLETE && (
                    <TouchableOpacity
                      style={[styles.reportDetailAction, { backgroundColor: "#9b59b6" }]}
                      onPress={() => handleUpdateStatus(ReportStatus.SUBMITTED)}
                    >
                      <MaterialCommunityIcons name="send" size={20} color="#fff" />
                      <Text style={styles.reportDetailActionText}>Submit</Text>
                    </TouchableOpacity>
                  )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render delete confirm modal
  const renderDeleteConfirmModal = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}><>

              <MaterialCommunityIcons name="alert" size={48} color="#e74c3c" />
            </View>

            <Text
</> style={styles.confirmTitle}>Delete Report</Text><>

            <Text style={styles.confirmText}>
              Are you sure you want to delete this report? This action cannot be undone.
            </Text>

            <View
</> style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmDeleteButton} onPress={handleDeleteReport}>
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render signature modal
  const renderSignatureModal = () => {
    return (
      <Modal
        visible={showSignatureModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <SafeAreaView style={styles.signatureContainer}>
          <View style={styles.signatureHeader}>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)}><>

              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text
</> style={styles.signatureTitle}>Sign Report</Text><>

            <View style={{ width: 24 }} />
          </View>

          <Text
</> style={styles.signatureInstructions}>Please sign in the area below</Text>

          <View style={styles.signatureWrapper}><>

            <SignatureScreen
              onOK={handleSignatureComplete}
              onEmpty={() => Alert.alert("Error", "Please provide a signature")}
              descriptionText=""
              clearText="Clear"
              confirmText="Save"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: 1px solid #e6e6e6;
                }
                .m-signature-pad--body {
                  border: none;
                }
                .m-signature-pad--footer {
                  display: none;
                }
              `}
            />
          </View>

          <View
</> style={styles.signatureActions}>
            <TouchableOpacity
              style={styles.signatureAction}
              onPress={() => setShowSignatureModal(false)}
            >
              <Text style={styles.signatureActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderTemplateSection()}
        {renderOptionsSection()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Reports</Text>
          {renderReportsList()}
        </View>
      </ScrollView>

      {/* Generate button */}
      {renderGenerateButton()}

      {/* Modals */}
      {renderTemplateModal()}
      {renderOptionsModal()}
      {renderReportDetailModal()}
      {renderDeleteConfirmModal()}
      {renderSignatureModal()}
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
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 16,
  },
  optionsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  templateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedTemplate: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedTemplateName: {
    marginLeft: 12,
    fontSize: 16,
  },
  templateDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionLabel: {
    fontSize: 16,
  },
  formatOptionsTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  formatOptionsTitleText: {
    fontSize: 16,
    fontWeight: "500",
  },
  formatOptions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  formatOptionSelected: {
    backgroundColor: "#3498db",
  },
  formatOptionText: {
    marginLeft: 8,
    color: "#3498db",
  },
  formatOptionTextSelected: {
    color: "#fff",
  },
  generateButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyReportsContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyReportsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: "#7f8c8d",
  },
  emptyReportsSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
  },
  reportsList: {
    marginTop: 8,
  },
  reportsListContent: {
    paddingBottom: 8,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  reportIconContainer: {
    position: "relative",
    marginRight: 12,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reportTemplate: {
    fontSize: 12,
    color: "#3498db",
    backgroundColor: "#ebf5fb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  reportStatus: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#f39c12",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportProgress: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#ecf0f1",
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2ecc71",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#7f8c8d",
    width: 36,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "80%",
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  templatesList: {
    maxHeight: 400,
  },
  templatesListContent: {
    padding: 16,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  templateItemSelected: {
    backgroundColor: "#3498db",
  },
  templateItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginRight: 12,
  },
  templateItemInfo: {
    flex: 1,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  templateItemNameSelected: {
    color: "#fff",
  },
  templateItemDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  templateItemDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  modalButton: {
    backgroundColor: "#3498db",
    padding: 16,
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  optionsScrollView: {
    maxHeight: 400,
    padding: 16,
  },
  optionSection: {
    marginBottom: 24,
  },
  optionSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  advancedOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  advancedOptionLabel: {
    fontSize: 16,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3498db",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  reportDetailModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportDetailScrollView: {
    maxHeight: 500,
  },
  reportDetailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reportDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  reportDetailStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  reportDetailStatusText: {
    color: "#fff",
    fontWeight: "500",
  },
  reportDetailItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reportDetailLabel: {
    width: 100,
    fontSize: 14,
    color: "#7f8c8d",
  },
  reportDetailValue: {
    flex: 1,
    fontSize: 14,
  },
  reportDetailProgressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  reportDetailProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    marginRight: 8,
  },
  reportDetailProgressFill: {
    height: "100%",
    backgroundColor: "#2ecc71",
    borderRadius: 4,
  },
  reportDetailProgressText: {
    width: 40,
    fontSize: 14,
    textAlign: "right",
  },
  reportDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reportFileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reportFileIcon: {
    marginRight: 12,
  },
  reportFileInfo: {
    flex: 1,
  },
  reportFileName: {
    fontSize: 16,
    marginBottom: 4,
  },
  reportFileSize: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  reportNoFiles: {
    fontSize: 14,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  reportDetailActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reportDetailAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  reportDetailActionText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  confirmModalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  confirmCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginRight: 16,
  },
  confirmCancelText: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  confirmDeleteButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmDeleteText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  signatureTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  signatureInstructions: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  signatureWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    margin: 16,
  },
  signatureActions: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
  },
  signatureAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signatureActionText: {
    fontSize: 16,
    color: "#3498db",
  },
  signatureImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
});

export default ReportGenerationScreen;
