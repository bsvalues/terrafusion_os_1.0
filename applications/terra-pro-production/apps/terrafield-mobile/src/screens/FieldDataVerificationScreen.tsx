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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import {
  FieldDataVerificationService,
  VerificationRule,
  VerificationRuleType,
  VerificationSeverity,
  VerificationBatch,
  VerificationResult,
  VerificationOptions,
} from "../services/FieldDataVerificationService";

/**
 * Mock property entity for demo
 */
const MOCK_PROPERTY = {
  id: "property_123",
  address: "123 Main St",
  city: "Anytown",
  state: "CA",
  postalCode: "90210",
  country: "USA",
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 2000,
  lotSize: 5000,
  yearBuilt: 2000,
  price: 500000,
};

/**
 * FieldDataVerificationScreen
 *
 * A screen for verifying field data for consistency and quality
 */
const FieldDataVerificationScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Get property ID from route params
  const propertyId = route.params?.propertyId || "property_123";

  // Service
  const verificationService = FieldDataVerificationService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [property, setProperty] = useState<any>(MOCK_PROPERTY);
  const [rules, setRules] = useState<VerificationRule[]>([]);
  const [results, setResults] = useState<VerificationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<VerificationBatch | null>(null);
  const [selectedRule, setSelectedRule] = useState<VerificationRule | null>(null);
  const [verificationOptions, setVerificationOptions] = useState<VerificationOptions>({
    stopOnFirstError: false,
    includeSystemRules: true,
    includeUserRules: true,
    minimumSeverity: VerificationSeverity.WARNING,
    saveResults: true,
  });

  // Modal visibility state
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [showResultDetailModal, setShowResultDetailModal] = useState<boolean>(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState<boolean>(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState<boolean>(false);

  // New rule state
  const [newRule, setNewRule] = useState<Partial<VerificationRule>>({
    name: "",
    description: "",
    type: VerificationRuleType.REQUIRED_FIELD,
    entityType: "property",
    fieldPath: "",
    parameters: {},
    errorMessage: "",
    severity: VerificationSeverity.WARNING,
    enabled: true,
    tags: [],
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load rules
        const loadedRules = await verificationService.getRules("property");
        setRules(loadedRules);

        // Load results
        const loadedResults = await verificationService.getResults(propertyId, "property");
        setResults(loadedResults);

        // In a real app, you would fetch the property details from a service
        // For this example, we use mock data
        setProperty(MOCK_PROPERTY);
      } catch (error) {
        console.error("Error loading verification data:", error);
        Alert.alert("Error", "Failed to load verification data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [propertyId]);

  // Handle verify property
  const handleVerifyProperty = async () => {
    try {
      setIsVerifying(true);

      // Verify property
      const batch = await verificationService.verifyEntity(
        property,
        "property",
        verificationOptions
      );

      // Update results
      const updatedResults = await verificationService.getResults(propertyId, "property");
      setResults(updatedResults);

      // Select the new batch
      setSelectedBatch(batch);
      setShowResultDetailModal(true);
    } catch (error) {
      console.error("Error verifying property:", error);
      Alert.alert("Error", "Failed to verify property");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle create rule
  const handleCreateRule = async () => {
    try {
      // Validate rule
      if (!newRule.name || !newRule.description || !newRule.fieldPath || !newRule.errorMessage) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Create rule
      await verificationService.createRule(
        newRule as Omit<VerificationRule, "id" | "createdAt" | "updatedAt" | "isSystemRule">
      );

      // Reload rules
      const loadedRules = await verificationService.getRules("property");
      setRules(loadedRules);

      // Reset new rule state
      setNewRule({
        name: "",
        description: "",
        type: VerificationRuleType.REQUIRED_FIELD,
        entityType: "property",
        fieldPath: "",
        parameters: {},
        errorMessage: "",
        severity: VerificationSeverity.WARNING,
        enabled: true,
        tags: [],
      });

      // Close modal
      setShowCreateRuleModal(false);

      // Show success message
      Alert.alert("Success", "Rule created successfully");
    } catch (error) {
      console.error("Error creating rule:", error);
      Alert.alert("Error", "Failed to create rule");
    }
  };

  // Handle update rule
  const handleUpdateRule = async () => {
    try {
      if (!selectedRule) return;

      // Validate rule
      if (!newRule.name || !newRule.description || !newRule.fieldPath || !newRule.errorMessage) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Update rule
      await verificationService.updateRule(selectedRule.id, newRule);

      // Reload rules
      const loadedRules = await verificationService.getRules("property");
      setRules(loadedRules);

      // Reset selected rule
      setSelectedRule(null);

      // Close modal
      setShowEditRuleModal(false);

      // Show success message
      Alert.alert("Success", "Rule updated successfully");
    } catch (error) {
      console.error("Error updating rule:", error);
      Alert.alert("Error", "Failed to update rule");
    }
  };

  // Handle delete rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      // Confirm deletion
      Alert.alert("Confirm Deletion", "Are you sure you want to delete this rule?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete rule
            const success = await verificationService.deleteRule(ruleId);

            if (success) {
              // Reload rules
              const loadedRules = await verificationService.getRules("property");
              setRules(loadedRules);

              // Show success message
              Alert.alert("Success", "Rule deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete rule");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting rule:", error);
      Alert.alert("Error", "Failed to delete rule");
    }
  };

  // Handle acknowledge issue
  const handleAcknowledgeIssue = async (batchId: string, resultId: string) => {
    try {
      // Prompt for notes
      Alert.prompt(
        "Acknowledge Issue",
        "Please enter any notes about this acknowledgment:",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Acknowledge",
            onPress: async (notes) => {
              // Acknowledge issue
              const success = await verificationService.acknowledgeResult(
                batchId,
                resultId,
                notes || ""
              );

              if (success) {
                // Reload results
                const updatedResults = await verificationService.getResults(propertyId, "property");
                setResults(updatedResults);

                // Update selected batch if needed
                if (selectedBatch && selectedBatch.id === batchId) {
                  const updatedBatch = updatedResults.find((batch) => batch.id === batchId);
                  if (updatedBatch) {
                    setSelectedBatch(updatedBatch);
                  }
                }

                // Show success message
                Alert.alert("Success", "Issue acknowledged");
              } else {
                Alert.alert("Error", "Failed to acknowledge issue");
              }
            },
          },
        ],
        "plain-text"
      );
    } catch (error) {
      console.error("Error acknowledging issue:", error);
      Alert.alert("Error", "Failed to acknowledge issue");
    }
  };

  // Handle delete result
  const handleDeleteResult = async (batchId: string) => {
    try {
      // Confirm deletion
      Alert.alert("Confirm Deletion", "Are you sure you want to delete this verification result?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete result
            const success = await verificationService.deleteResult(batchId);

            if (success) {
              // Reload results
              const updatedResults = await verificationService.getResults(propertyId, "property");
              setResults(updatedResults);

              // Close detail modal if needed
              if (selectedBatch && selectedBatch.id === batchId) {
                setSelectedBatch(null);
                setShowResultDetailModal(false);
              }

              // Show success message
              Alert.alert("Success", "Result deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete result");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting result:", error);
      Alert.alert("Error", "Failed to delete result");
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
</> style={styles.headerTitle}>Field Data Verification</Text>

        <TouchableOpacity style={styles.optionsButton} onPress={() => setShowOptionsModal(true)}>
          <MaterialCommunityIcons name="cog" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render property section
  const renderPropertySection = () => {
    return (
      <View style={styles.section}><>

        <Text style={styles.sectionTitle}>Property Information</Text>

        <View
</> style={styles.propertyInfo}><>

          <Text style={styles.propertyAddress}>{property.address}</Text>
          <Text
</> style={styles.propertyLocation}>
            {property.city}, {property.state} {property.postalCode}
          </Text>

          <View style={styles.propertySpecs}>
            <View style={styles.propertySpec}>
              <MaterialCommunityIcons name="home-floor-0" size={16} color="#3498db" />
              <Text style={styles.propertySpecText}>
                {property.squareFootage.toLocaleString()} sq ft
              </Text>
            </View>

            <View style={styles.propertySpec}>
              <MaterialCommunityIcons name="bed" size={16} color="#3498db" />
              <Text style={styles.propertySpecText}>
                {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
              </Text>
            </View>

            <View style={styles.propertySpec}>
              <MaterialCommunityIcons name="shower" size={16} color="#3498db" />
              <Text style={styles.propertySpecText}>
                {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
              </Text>
            </View>
          </View>

          <View style={styles.propertySpecs}>
            <View style={styles.propertySpec}>
              <MaterialCommunityIcons name="calendar" size={16} color="#3498db" />
              <Text style={styles.propertySpecText}>Built {property.yearBuilt}</Text>
            </View>

            <View style={styles.propertySpec}>
              <MaterialCommunityIcons name="home" size={16} color="#3498db" />
              <Text style={styles.propertySpecText}>{property.propertyType}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render rules section
  const renderRulesSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}><>

          <Text style={styles.sectionTitle}>Verification Rules</Text>

          <View
</> style={styles.ruleActions}>
            <TouchableOpacity
              style={styles.viewRulesButton}
              onPress={() => setShowRulesModal(true)}
            >
              <MaterialCommunityIcons name="eye" size={16} color="#3498db" />
              <Text style={styles.viewRulesText}>View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createRuleButton}
              onPress={() => setShowCreateRuleModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.createRuleText}>Create Rule</Text>
            </TouchableOpacity>
          </View>
        </View><>


        <Text style={styles.ruleSummary}>
          {rules.length} rules available ({rules.filter((r) => r.enabled).length} enabled)
        </Text>

        <View
</> style={styles.ruleCategoriesContainer}><>

          <Text style={styles.ruleCategoriesTitle}>Rule Categories:</Text>
          <View
</> style={styles.ruleCategories}>
            {Array.from(new Set(rules.flatMap((rule) => rule.tags)))
              .slice(0, 5)
              .map((tag /* , index */) => (
                <View key={index} style={styles.ruleCategory}>
                  <Text style={styles.ruleCategoryText}>{tag}</Text>
                </View>
              ))}
            {Array.from(new Set(rules.flatMap((rule) => rule.tags))).length > 5 && (
              <View style={styles.ruleCategory}>
                <Text style={styles.ruleCategoryText}>
                  +{Array.from(new Set(rules.flatMap((rule) => rule.tags))).length - 5} more
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render verification button
  const renderVerificationButton = () => {
    return (
      <TouchableOpacity
        style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
        onPress={handleVerifyProperty}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.verifyButtonText}>Verifying...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.verifyButtonText}>Verify Property Data</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render results section
  const renderResultsSection = () => {
    if (results.length === 0) {
      return (
        <View style={styles.section}><>

          <Text style={styles.sectionTitle}>Verification Results</Text>

          <View
</> style={styles.emptyResultsContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={48} color="#bdc3c7" /><>

            <Text style={styles.emptyResultsText}>No verification results yet</Text>
            <Text
</> style={styles.emptyResultsSubtext}>
              Click the Verify button to run verification checks
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}><>

        <Text style={styles.sectionTitle}>Verification Results</Text>

        <FlatList
</>
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => {
                setSelectedBatch(item);
                setShowResultDetailModal(true);
              }}
            >
              <View style={styles.resultHeader}>
                <View
                  style={[
                    styles.resultStatusBadge,
                    {
                      backgroundColor:
                        item.status === "passed"
                          ? "#2ecc71"
                          : item.status === "warning"
                            ? "#f39c12"
                            : "#e74c3c",
                    },
                  ]}
                >
                  <Text style={styles.resultStatusText}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.resultTimestamp}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.resultSummary}>
                <View style={styles.resultSummaryItem}><>

                  <Text style={styles.resultSummaryLabel}>Critical</Text>
                  <Text
</>
                    style={[
                      styles.resultSummaryValue,
                      { color: item.issueCount.critical > 0 ? "#e74c3c" : "#2ecc71" },
                    ]}
                  >
                    {item.issueCount.critical}
                  </Text>
                </View>

                <View style={styles.resultSummaryItem}><>

                  <Text style={styles.resultSummaryLabel}>Errors</Text>
                  <Text
</>
                    style={[
                      styles.resultSummaryValue,
                      { color: item.issueCount.error > 0 ? "#e74c3c" : "#2ecc71" },
                    ]}
                  >
                    {item.issueCount.error}
                  </Text>
                </View>

                <View style={styles.resultSummaryItem}><>

                  <Text style={styles.resultSummaryLabel}>Warnings</Text>
                  <Text
</>
                    style={[
                      styles.resultSummaryValue,
                      { color: item.issueCount.warning > 0 ? "#f39c12" : "#2ecc71" },
                    ]}
                  >
                    {item.issueCount.warning}
                  </Text>
                </View>

                <View style={styles.resultSummaryItem}><>

                  <Text style={styles.resultSummaryLabel}>Info</Text>
                  <Text
</>
                    style={[
                      styles.resultSummaryValue,
                      { color: item.issueCount.info > 0 ? "#3498db" : "#2ecc71" },
                    ]}
                  >
                    {item.issueCount.info}
                  </Text>
                </View>
              </View>

              <View style={styles.resultIssues}><>

                <Text style={styles.resultIssuesText}>
                  {item.results.filter((r) => !r.passed).length} issues found
                </Text>
                <MaterialCommunityIcons
</> name="chevron-right" size={20} color="#7f8c8d" />
              </View>
            </TouchableOpacity>
          )}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsListContent}
        />
      </View>
    );
  };

  // Render rules modal
  const renderRulesModal = () => {
    return (
      <Modal
        visible={showRulesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Verification Rules</Text>
              <TouchableOpacity
</> onPress={() => setShowRulesModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={rules}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.ruleItem}>
                  <View style={styles.ruleHeader}><>

                    <Text style={styles.ruleName}>{item.name}</Text>
                    <Switch
</>
                      value={item.enabled}
                      onValueChange={async (value) => {
                        try {
                          // Only allow editing of user-defined rules
                          if (item.isSystemRule) {
                            Alert.alert(
                              "System Rule",
                              "System rules cannot be modified. You can create a custom rule instead."
                            );
                            return;
                          }

                          await verificationService.updateRule(item.id, { enabled: value });

                          // Reload rules
                          const loadedRules = await verificationService.getRules("property");
                          setRules(loadedRules);
                        } catch (error) {
                          console.error("Error updating rule:", error);
                          Alert.alert("Error", "Failed to update rule");
                        }
                      }}
                      trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                      thumbColor={item.enabled ? "#fff" : "#f4f3f4"}
                      disabled={item.isSystemRule}
                    />
                  </View><>


                  <Text style={styles.ruleDescription}>{item.description}</Text>

                  <View
</> style={styles.ruleDetails}>
                    <View style={styles.ruleDetail}><>

                      <Text style={styles.ruleDetailLabel}>Type:</Text>
                      <Text
</> style={styles.ruleDetailValue}>{item.type}</Text>
                    </View>

                    <View style={styles.ruleDetail}><>

                      <Text style={styles.ruleDetailLabel}>Field:</Text>
                      <Text
</> style={styles.ruleDetailValue}>{item.fieldPath}</Text>
                    </View>

                    <View style={styles.ruleDetail}><>

                      <Text style={styles.ruleDetailLabel}>Severity:</Text>
                      <View
</>
                        style={[
                          styles.ruleSeverity,
                          {
                            backgroundColor:
                              item.severity === VerificationSeverity.INFO
                                ? "#3498db"
                                : item.severity === VerificationSeverity.WARNING
                                  ? "#f39c12"
                                  : item.severity === VerificationSeverity.ERROR
                                    ? "#e74c3c"
                                    : "#c0392b",
                          },
                        ]}
                      >
                        <Text style={styles.ruleSeverityText}>{item.severity}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.ruleTags}>
                    {item.tags.map((tag /* , index */) => (
                      <View key={index} style={styles.ruleTag}>
                        <Text style={styles.ruleTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {!item.isSystemRule && (
                    <View style={styles.ruleActions}>
                      <TouchableOpacity
                        style={styles.editRuleButton}
                        onPress={() => {
                          setSelectedRule(item);
                          setNewRule({
                            name: item.name,
                            description: item.description,
                            type: item.type,
                            entityType: item.entityType,
                            fieldPath: item.fieldPath,
                            parameters: item.parameters,
                            validationFunction: item.validationFunction,
                            errorMessage: item.errorMessage,
                            severity: item.severity,
                            enabled: item.enabled,
                            tags: item.tags,
                          });
                          setShowRulesModal(false);
                          setShowEditRuleModal(true);
                        }}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                        <Text style={styles.editRuleText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteRuleButton}
                        onPress={() => handleDeleteRule(item.id)}
                      >
                        <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                        <Text style={styles.deleteRuleText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              style={styles.rulesList}
              contentContainerStyle={styles.rulesListContent}
            />

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowRulesModal(false)}>
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

              <Text style={styles.modalTitle}>Verification Options</Text>
              <TouchableOpacity
</> onPress={() => setShowOptionsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsScrollView}>
              <View style={styles.optionItem}><>

                <Text style={styles.optionLabel}>Stop on First Error</Text>
                <Switch
</>
                  value={verificationOptions.stopOnFirstError}
                  onValueChange={(value) =>
                    setVerificationOptions((prev) => ({ ...prev, stopOnFirstError: value }))
                  }
                  trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                  thumbColor={verificationOptions.stopOnFirstError ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.optionItem}><>

                <Text style={styles.optionLabel}>Include System Rules</Text>
                <Switch
</>
                  value={verificationOptions.includeSystemRules}
                  onValueChange={(value) =>
                    setVerificationOptions((prev) => ({ ...prev, includeSystemRules: value }))
                  }
                  trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                  thumbColor={verificationOptions.includeSystemRules ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.optionItem}><>

                <Text style={styles.optionLabel}>Include User Rules</Text>
                <Switch
</>
                  value={verificationOptions.includeUserRules}
                  onValueChange={(value) =>
                    setVerificationOptions((prev) => ({ ...prev, includeUserRules: value }))
                  }
                  trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                  thumbColor={verificationOptions.includeUserRules ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.optionItem}><>

                <Text style={styles.optionLabel}>Save Results</Text>
                <Switch
</>
                  value={verificationOptions.saveResults}
                  onValueChange={(value) =>
                    setVerificationOptions((prev) => ({ ...prev, saveResults: value }))
                  }
                  trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                  thumbColor={verificationOptions.saveResults ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.optionSection}><>

                <Text style={styles.optionSectionTitle}>Minimum Severity</Text>

                <View
</> style={styles.severityOptions}>
                  {Object.values(VerificationSeverity).map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.severityOption,
                        verificationOptions.minimumSeverity === severity && styles.selectedSeverity,
                      ]}
                      onPress={() =>
                        setVerificationOptions((prev) => ({ ...prev, minimumSeverity: severity }))
                      }
                    >
                      <View
                        style={[
                          styles.severityIndicator,
                          {
                            backgroundColor:
                              severity === VerificationSeverity.INFO
                                ? "#3498db"
                                : severity === VerificationSeverity.WARNING
                                  ? "#f39c12"
                                  : severity === VerificationSeverity.ERROR
                                    ? "#e74c3c"
                                    : "#c0392b",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.severityText,
                          verificationOptions.minimumSeverity === severity &&
                            styles.selectedSeverityText,
                        ]}
                      >
                        {severity}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

  // Render result detail modal
  const renderResultDetailModal = () => {
    if (!selectedBatch) return null;

    return (
      <Modal
        visible={showResultDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultDetailModal}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Verification Results</Text>
              <TouchableOpacity
</> onPress={() => setShowResultDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.resultDetailHeader}>
              <View
                style={[
                  styles.resultDetailStatus,
                  {
                    backgroundColor:
                      selectedBatch.status === "passed"
                        ? "#2ecc71"
                        : selectedBatch.status === "warning"
                          ? "#f39c12"
                          : "#e74c3c",
                  },
                ]}
              >
                <Text style={styles.resultDetailStatusText}>
                  {selectedBatch.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.resultDetailTimestamp}>
                {new Date(selectedBatch.timestamp).toLocaleString()}
              </Text>
            </View>

            <View style={styles.resultDetailSummary}>
              <View style={styles.resultDetailSummaryItem}><>

                <Text style={styles.resultDetailSummaryLabel}>Critical</Text>
                <Text
</>
                  style={[
                    styles.resultDetailSummaryValue,
                    { color: selectedBatch.issueCount.critical > 0 ? "#e74c3c" : "#2ecc71" },
                  ]}
                >
                  {selectedBatch.issueCount.critical}
                </Text>
              </View>

              <View style={styles.resultDetailSummaryItem}><>

                <Text style={styles.resultDetailSummaryLabel}>Errors</Text>
                <Text
</>
                  style={[
                    styles.resultDetailSummaryValue,
                    { color: selectedBatch.issueCount.error > 0 ? "#e74c3c" : "#2ecc71" },
                  ]}
                >
                  {selectedBatch.issueCount.error}
                </Text>
              </View>

              <View style={styles.resultDetailSummaryItem}><>

                <Text style={styles.resultDetailSummaryLabel}>Warnings</Text>
                <Text
</>
                  style={[
                    styles.resultDetailSummaryValue,
                    { color: selectedBatch.issueCount.warning > 0 ? "#f39c12" : "#2ecc71" },
                  ]}
                >
                  {selectedBatch.issueCount.warning}
                </Text>
              </View>

              <View style={styles.resultDetailSummaryItem}><>

                <Text style={styles.resultDetailSummaryLabel}>Info</Text>
                <Text
</>
                  style={[
                    styles.resultDetailSummaryValue,
                    { color: selectedBatch.issueCount.info > 0 ? "#3498db" : "#2ecc71" },
                  ]}
                >
                  {selectedBatch.issueCount.info}
                </Text>
              </View>
            </View><>


            <Text style={styles.resultDetailIssuesTitle}>Issues Found</Text>

            <FlatList
</>
              data={selectedBatch.results.filter((result) => !result.passed)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const rule = rules.find((r) => r.id === item.ruleId);

                return (
                  <View style={styles.issueItem}>
                    <View style={styles.issueHeader}>
                      <View
                        style={[
                          styles.issueSeverity,
                          {
                            backgroundColor:
                              item.severity === VerificationSeverity.INFO
                                ? "#3498db"
                                : item.severity === VerificationSeverity.WARNING
                                  ? "#f39c12"
                                  : item.severity === VerificationSeverity.ERROR
                                    ? "#e74c3c"
                                    : "#c0392b",
                          },
                        ]}
                      >
                        <Text style={styles.issueSeverityText}>{item.severity}</Text>
                      </View>

                      {item.acknowledged && (
                        <View style={styles.acknowledgedBadge}>
                          <MaterialCommunityIcons name="check" size={12} color="#fff" />
                          <Text style={styles.acknowledgedText}>Acknowledged</Text>
                        </View>
                      )}
                    </View><>


                    <Text style={styles.issueMessage}>{item.message}</Text>

                    <View
</> style={styles.issueDetails}>
                      <View style={styles.issueDetail}><>

                        <Text style={styles.issueDetailLabel}>Field:</Text>
                        <Text
</> style={styles.issueDetailValue}>{item.fieldPath}</Text>
                      </View>

                      <View style={styles.issueDetail}><>

                        <Text style={styles.issueDetailLabel}>Value:</Text>
                        <Text
</> style={styles.issueDetailValue}>
                          {item.fieldValue !== null && item.fieldValue !== undefined
                            ? String(item.fieldValue)
                            : "(empty)"}
                        </Text>
                      </View>

                      <View style={styles.issueDetail}><>

                        <Text style={styles.issueDetailLabel}>Rule:</Text>
                        <Text
</> style={styles.issueDetailValue}>{rule?.name || "Unknown"}</Text>
                      </View>
                    </View>

                    {item.acknowledged && item.acknowledgmentNotes && (
                      <View style={styles.acknowledgmentNotes}><>

                        <Text style={styles.acknowledgmentNotesLabel}>Notes:</Text>
                        <Text
</> style={styles.acknowledgmentNotesText}>
                          {item.acknowledgmentNotes}
                        </Text>
                      </View>
                    )}

                    {!item.acknowledged && (
                      <TouchableOpacity
                        style={styles.acknowledgeButton}
                        onPress={() => handleAcknowledgeIssue(selectedBatch.id, item.id)}
                      >
                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                        <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <View style={styles.emptyIssuesContainer}>
                  <MaterialCommunityIcons name="check-circle" size={48} color="#2ecc71" /><>

                  <Text style={styles.emptyIssuesText}>No issues found</Text>
                  <Text
</> style={styles.emptyIssuesSubtext}>
                    All verification checks passed successfully
                  </Text>
                </View>
              )}
              style={styles.issuesList}
              contentContainerStyle={
                selectedBatch.results.filter((result) => !result.passed).length === 0
                  ? { flex: 1, justifyContent: "center" }
                  : { paddingBottom: 16 }
              }
            />

            <View style={styles.resultDetailActions}>
              <TouchableOpacity
                style={styles.deleteResultButton}
                onPress={() => handleDeleteResult(selectedBatch.id)}
              >
                <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                <Text style={styles.deleteResultText}>Delete Result</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeResultButton}
                onPress={() => setShowResultDetailModal(false)}
              >
                <Text style={styles.closeResultText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render create rule modal
  const renderCreateRuleModal = () => {
    return (
      <Modal
        visible={showCreateRuleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateRuleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.ruleFormModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Create Rule</Text>
                <TouchableOpacity
</> onPress={() => setShowCreateRuleModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.ruleFormScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Rule Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.name}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter rule name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.description}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, description: text }))}
                    placeholder="Enter rule description"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Rule Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newRule.type}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, type: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(VerificationRuleType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newRule.type}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, type: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(VerificationRuleType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Field Path</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.fieldPath}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, fieldPath: text }))}
                    placeholder="Enter field path (e.g., bedrooms)"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Error Message</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.errorMessage}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, errorMessage: text }))}
                    placeholder="Enter error message"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Severity</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newRule.severity}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, severity: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(VerificationSeverity).map((severity) => (
                            <Picker.Item key={severity} label={severity} value={severity} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newRule.severity}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, severity: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(VerificationSeverity).map((severity) => (
                            <Picker.Item key={severity} label={severity} value={severity} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Tags (comma separated)</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.tags?.join(", ")}
                    onChangeText={(text) =>
                      setNewRule((prev) => ({
                        ...prev,
                        tags: text
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="Enter tags (e.g., required, property)"
                  />
                </View>

                {/* Additional fields based on rule type */}
                {newRule.type === VerificationRuleType.RANGE_CHECK && (
                  <>
                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Minimum Value</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={String(newRule.parameters?.min || "")}
                        onChangeText={(text) =>
                          setNewRule((prev) => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              min: text ? Number(text) : undefined,
                            },
                          }))
                        }
                        keyboardType="numeric"
                        placeholder="Enter minimum value"
                      />
                    </View>

                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Maximum Value</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={String(newRule.parameters?.max || "")}
                        onChangeText={(text) =>
                          setNewRule((prev) => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              max: text ? Number(text) : undefined,
                            },
                          }))
                        }
                        keyboardType="numeric"
                        placeholder="Enter maximum value"
                      />
                    </View>
                  </>
                )}

                {newRule.type === VerificationRuleType.FORMAT_CHECK && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Regex Pattern</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newRule.parameters?.pattern || ""}
                      onChangeText={(text) =>
                        setNewRule((prev) => ({
                          ...prev,
                          parameters: { ...prev.parameters, pattern: text },
                        }))
                      }
                      placeholder="Enter regex pattern"
                    />
                  </View>
                )}

                {newRule.type === VerificationRuleType.CROSS_REFERENCE ||
                newRule.type === VerificationRuleType.ANOMALY_DETECTION ||
                newRule.type === VerificationRuleType.LOGICAL_VALIDATION ? (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Validation Function</Text>
                    <TextInput
</>
                      style={[styles.formInput, styles.formTextarea]}
                      value={newRule.validationFunction || ""}
                      onChangeText={(text) =>
                        setNewRule((prev) => ({ ...prev, validationFunction: text }))
                      }
                      placeholder="Enter validation function (e.g., return entity.value > 0;)"
                      multiline
                      numberOfLines={4}
                    />
                    <Text style={styles.formHelperText}>
                      Function should return true if validation passes, false otherwise. Available
                      variables: entity, params
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateRuleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateRule}>
                  <Text style={styles.createButtonText}>Create Rule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render edit rule modal
  const renderEditRuleModal = () => {
    if (!selectedRule) return null;

    return (
      <Modal
        visible={showEditRuleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditRuleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.ruleFormModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Edit Rule</Text>
                <TouchableOpacity
</> onPress={() => setShowEditRuleModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.ruleFormScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Rule Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.name}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter rule name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.description}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, description: text }))}
                    placeholder="Enter rule description"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Rule Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newRule.type}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, type: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(VerificationRuleType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newRule.type}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, type: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(VerificationRuleType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Field Path</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.fieldPath}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, fieldPath: text }))}
                    placeholder="Enter field path (e.g., bedrooms)"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Error Message</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.errorMessage}
                    onChangeText={(text) => setNewRule((prev) => ({ ...prev, errorMessage: text }))}
                    placeholder="Enter error message"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Severity</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newRule.severity}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, severity: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(VerificationSeverity).map((severity) => (
                            <Picker.Item key={severity} label={severity} value={severity} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newRule.severity}
                          onValueChange={(value) =>
                            setNewRule((prev) => ({ ...prev, severity: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(VerificationSeverity).map((severity) => (
                            <Picker.Item key={severity} label={severity} value={severity} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Tags (comma separated)</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newRule.tags?.join(", ")}
                    onChangeText={(text) =>
                      setNewRule((prev) => ({
                        ...prev,
                        tags: text
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="Enter tags (e.g., required, property)"
                  />
                </View>

                {/* Additional fields based on rule type */}
                {newRule.type === VerificationRuleType.RANGE_CHECK && (
                  <>
                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Minimum Value</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={String(newRule.parameters?.min || "")}
                        onChangeText={(text) =>
                          setNewRule((prev) => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              min: text ? Number(text) : undefined,
                            },
                          }))
                        }
                        keyboardType="numeric"
                        placeholder="Enter minimum value"
                      />
                    </View>

                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Maximum Value</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={String(newRule.parameters?.max || "")}
                        onChangeText={(text) =>
                          setNewRule((prev) => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              max: text ? Number(text) : undefined,
                            },
                          }))
                        }
                        keyboardType="numeric"
                        placeholder="Enter maximum value"
                      />
                    </View>
                  </>
                )}

                {newRule.type === VerificationRuleType.FORMAT_CHECK && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Regex Pattern</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newRule.parameters?.pattern || ""}
                      onChangeText={(text) =>
                        setNewRule((prev) => ({
                          ...prev,
                          parameters: { ...prev.parameters, pattern: text },
                        }))
                      }
                      placeholder="Enter regex pattern"
                    />
                  </View>
                )}

                {newRule.type === VerificationRuleType.CROSS_REFERENCE ||
                newRule.type === VerificationRuleType.ANOMALY_DETECTION ||
                newRule.type === VerificationRuleType.LOGICAL_VALIDATION ? (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Validation Function</Text>
                    <TextInput
</>
                      style={[styles.formInput, styles.formTextarea]}
                      value={newRule.validationFunction || ""}
                      onChangeText={(text) =>
                        setNewRule((prev) => ({ ...prev, validationFunction: text }))
                      }
                      placeholder="Enter validation function (e.g., return entity.value > 0;)"
                      multiline
                      numberOfLines={4}
                    />
                    <Text style={styles.formHelperText}>
                      Function should return true if validation passes, false otherwise. Available
                      variables: entity, params
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditRuleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleUpdateRule}>
                  <Text style={styles.createButtonText}>Update Rule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading verification data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderPropertySection()}
        {renderRulesSection()}
        {renderResultsSection()}
      </ScrollView>

      {/* Verification button */}
      {renderVerificationButton()}

      {/* Modals */}
      {renderRulesModal()}
      {renderOptionsModal()}
      {renderResultDetailModal()}
      {renderCreateRuleModal()}
      {renderEditRuleModal()}
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
    padding: 16,
  },
  section: {
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  propertyInfo: {
    marginTop: 8,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  propertySpecs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  propertySpec: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  propertySpecText: {
    fontSize: 14,
    marginLeft: 6,
  },
  ruleActions: {
    flexDirection: "row",
  },
  viewRulesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  viewRulesText: {
    color: "#3498db",
    marginLeft: 4,
  },
  createRuleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createRuleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  ruleSummary: {
    marginBottom: 12,
    color: "#7f8c8d",
  },
  ruleCategoriesContainer: {
    marginTop: 8,
  },
  ruleCategoriesTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  ruleCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ruleCategory: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  ruleCategoryText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  verifyButton: {
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
    shadowRadius: 2,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyResultsContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyResultsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: "#7f8c8d",
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
  },
  resultsList: {
    marginTop: 8,
  },
  resultsListContent: {
    paddingBottom: 8,
  },
  resultItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  resultTimestamp: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  resultSummary: {
    flexDirection: "row",
    marginBottom: 8,
  },
  resultSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  resultSummaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  resultSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultIssues: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  resultIssuesText: {
    fontSize: 14,
    color: "#7f8c8d",
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
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rulesList: {
    maxHeight: 500,
  },
  rulesListContent: {
    padding: 16,
  },
  ruleItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  ruleDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  ruleDetails: {
    marginBottom: 8,
  },
  ruleDetail: {
    flexDirection: "row",
    marginBottom: 4,
  },
  ruleDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
    width: 60,
  },
  ruleDetailValue: {
    fontSize: 14,
  },
  ruleSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ruleSeverityText: {
    fontSize: 12,
    color: "#fff",
  },
  ruleTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  ruleTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  ruleTagText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  ruleActions: {
    flexDirection: "row",
  },
  editRuleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  editRuleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  deleteRuleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteRuleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  modalButton: {
    backgroundColor: "#3498db",
    padding: 16,
    alignItems: "center",
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
  optionSection: {
    marginTop: 24,
  },
  optionSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  severityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  severityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSeverity: {
    backgroundColor: "#3498db",
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityText: {
    fontSize: 14,
  },
  selectedSeverityText: {
    color: "#fff",
  },
  resultDetailModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  resultDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultDetailStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resultDetailStatusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  resultDetailTimestamp: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  resultDetailSummary: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultDetailSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  resultDetailSummaryLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  resultDetailSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultDetailIssuesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  issuesList: {
    maxHeight: 300,
  },
  issueItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  issueSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  issueSeverityText: {
    fontSize: 12,
    color: "#fff",
  },
  acknowledgedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  acknowledgedText: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 2,
  },
  issueMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  issueDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  issueDetail: {
    flexDirection: "row",
    marginBottom: 4,
  },
  issueDetailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    width: 50,
  },
  issueDetailValue: {
    fontSize: 12,
    flex: 1,
  },
  acknowledgmentNotes: {
    backgroundColor: "#ebf5fb",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  acknowledgmentNotesLabel: {
    fontSize: 12,
    color: "#3498db",
    marginBottom: 4,
  },
  acknowledgmentNotesText: {
    fontSize: 12,
  },
  acknowledgeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 8,
    borderRadius: 4,
  },
  acknowledgeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyIssuesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIssuesText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: "#2ecc71",
  },
  emptyIssuesSubtext: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 8,
  },
  resultDetailActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
  },
  deleteResultButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteResultText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  closeResultButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 10,
    borderRadius: 4,
  },
  closeResultText: {
    color: "#fff",
    fontWeight: "500",
  },
  ruleFormModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  ruleFormScrollView: {
    maxHeight: 500,
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  formHelperText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  formSelect: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
  },
  formSelectAndroid: {
    width: "100%",
  },
  formSelectIOS: {
    width: "100%",
  },
  formActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  cancelButtonText: {
    color: "#7f8c8d",
  },
  createButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default FieldDataVerificationScreen;
