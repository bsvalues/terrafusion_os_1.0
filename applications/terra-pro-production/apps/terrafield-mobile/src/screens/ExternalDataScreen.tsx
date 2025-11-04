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
import { Picker } from "@react-native-picker/picker";

import {
  ExternalDataService,
  DataConnectorConfig,
  ExternalDataSourceType,
  DataIntegrationMode,
  ConnectionStatus,
  DataMapping,
  DataConflict,
} from "../services/ExternalDataService";

/**
 * ExternalDataScreen
 *
 * A screen for managing external data integrations and synchronization
 */
const ExternalDataScreen: React.FC = () => {
  // Get route and navigation
  const route = useRoute();
  const navigation = useNavigation();

  // Service
  const externalDataService = ExternalDataService.getInstance();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [connectors, setConnectors] = useState<DataConnectorConfig[]>([]);
  const [mappings, setMappings] = useState<DataMapping[]>([]);
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<DataConnectorConfig | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<DataMapping | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null);

  // New connector state
  const [newConnector, setNewConnector] = useState<Partial<DataConnectorConfig>>({
    name: "",
    sourceType: ExternalDataSourceType.MLS,
    integrationMode: DataIntegrationMode.READ_ONLY,
    endpoint: "",
    authType: "api_key",
    credentials: {},
    headers: {},
    queryParams: {},
    timeout: 30000,
    cacheResponses: true,
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
    enabled: true,
  });

  // New mapping state
  const [newMapping, setNewMapping] = useState<Partial<DataMapping>>({
    name: "",
    sourceType: ExternalDataSourceType.MLS,
    entityType: "property",
    fields: [
      {
        local: "",
        external: "",
        required: false,
        direction: "import",
      },
    ],
  });

  // Modal state
  const [showConnectorModal, setShowConnectorModal] = useState<boolean>(false);
  const [showCreateConnectorModal, setShowCreateConnectorModal] = useState<boolean>(false);
  const [showEditConnectorModal, setShowEditConnectorModal] = useState<boolean>(false);
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);
  const [showCreateMappingModal, setShowCreateMappingModal] = useState<boolean>(false);
  const [showEditMappingModal, setShowEditMappingModal] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Initialize service options
        externalDataService.initialize({
          maxCacheSize: 100 * 1024 * 1024, // 100 MB
          defaultCacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
          offlineMode: true,
          defaultTimeout: 30000, // 30 seconds
          connectionRetries: 3,
          encryptCache: true,
          securityLevel: 2, // HIGH
          autoResolveStrategy: "none",
        });

        // Load connectors
        const loadedConnectors = await externalDataService.getConnectors();
        setConnectors(loadedConnectors);

        // Load mappings
        const loadedMappings = await externalDataService.getMappings();
        setMappings(loadedMappings);

        // Load conflicts
        const loadedConflicts = await externalDataService.getConflicts();
        setConflicts(loadedConflicts);
      } catch (error) {
        console.error("Error initializing external data:", error);
        Alert.alert("Error", "Failed to initialize external data services");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Handle test connection
  const handleTestConnection = async (connectorId: string) => {
    try {
      setIsTesting(true);

      const status = await externalDataService.testConnection(connectorId);

      // Get status message
      let message: string;
      let type: "success" | "error" = "error";

      switch (status) {
        case ConnectionStatus.CONNECTED:
          message = "Successfully connected to external service";
          type = "success";
          break;
        case ConnectionStatus.UNAUTHORIZED:
          message = "Authentication failed. Please check your credentials";
          break;
        case ConnectionStatus.RATE_LIMITED:
          message = "Rate limit reached. Please try again later";
          break;
        case ConnectionStatus.MAINTENANCE:
          message = "External service is in maintenance mode";
          break;
        case ConnectionStatus.ERROR:
          message = "Error connecting to external service";
          break;
        case ConnectionStatus.DISCONNECTED:
          message = "No network connection available";
          break;
        default:
          message = "Unknown connection status";
      }

      // Show alert
      Alert.alert(type === "success" ? "Success" : "Connection Error", message);

      // Reload connectors to update status
      const loadedConnectors = await externalDataService.getConnectors();
      setConnectors(loadedConnectors);

      // Update selected connector if needed
      if (selectedConnector && selectedConnector.id === connectorId) {
        const updatedConnector = loadedConnectors.find((c) => c.id === connectorId);
        if (updatedConnector) {
          setSelectedConnector(updatedConnector);
        }
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      Alert.alert("Error", "Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  // Handle create connector
  const handleCreateConnector = async () => {
    try {
      // Validate connector
      if (!newConnector.name || !newConnector.endpoint) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Create connector
      const connector = await externalDataService.createConnector(
        newConnector as Omit<DataConnectorConfig, "id" | "createdAt" | "updatedAt" | "createdBy">
      );

      // Reload connectors
      const loadedConnectors = await externalDataService.getConnectors();
      setConnectors(loadedConnectors);

      // Reset form
      setNewConnector({
        name: "",
        sourceType: ExternalDataSourceType.MLS,
        integrationMode: DataIntegrationMode.READ_ONLY,
        endpoint: "",
        authType: "api_key",
        credentials: {},
        headers: {},
        queryParams: {},
        timeout: 30000,
        cacheResponses: true,
        cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
        enabled: true,
      });

      // Close modal
      setShowCreateConnectorModal(false);

      // Show success message
      Alert.alert("Success", "Connector created successfully");

      // Test connection
      handleTestConnection(connector.id);
    } catch (error) {
      console.error("Error creating connector:", error);
      Alert.alert("Error", "Failed to create connector");
    }
  };

  // Handle update connector
  const handleUpdateConnector = async () => {
    try {
      if (!selectedConnector) return;

      // Validate connector
      if (!newConnector.name || !newConnector.endpoint) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Update connector
      const connector = await externalDataService.updateConnector(
        selectedConnector.id,
        newConnector
      );

      // Reload connectors
      const loadedConnectors = await externalDataService.getConnectors();
      setConnectors(loadedConnectors);

      // Update selected connector
      setSelectedConnector(connector);

      // Close modal
      setShowEditConnectorModal(false);

      // Show success message
      Alert.alert("Success", "Connector updated successfully");
    } catch (error) {
      console.error("Error updating connector:", error);
      Alert.alert("Error", "Failed to update connector");
    }
  };

  // Handle delete connector
  const handleDeleteConnector = async (connectorId: string) => {
    try {
      // Confirm deletion
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this connector? This will also remove all related mappings.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              // Delete connector
              const success = await externalDataService.deleteConnector(connectorId);

              if (success) {
                // Reload connectors
                const loadedConnectors = await externalDataService.getConnectors();
                setConnectors(loadedConnectors);

                // Reload mappings
                const loadedMappings = await externalDataService.getMappings();
                setMappings(loadedMappings);

                // Clear selected connector if needed
                if (selectedConnector && selectedConnector.id === connectorId) {
                  setSelectedConnector(null);
                  setShowConnectorModal(false);
                }

                // Show success message
                Alert.alert("Success", "Connector deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete connector");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting connector:", error);
      Alert.alert("Error", "Failed to delete connector");
    }
  };

  // Handle create mapping
  const handleCreateMapping = async () => {
    try {
      // Validate mapping
      if (!newMapping.name || !newMapping.entityType) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Validate fields
      for (const field of newMapping.fields || []) {
        if (!field.local || !field.external) {
          Alert.alert("Error", "Please fill in all field mappings");
          return;
        }
      }

      // Create mapping
      const mapping = await externalDataService.createMapping(
        newMapping as Omit<DataMapping, "id" | "createdAt" | "updatedAt">
      );

      // Reload mappings
      const loadedMappings = await externalDataService.getMappings();
      setMappings(loadedMappings);

      // Reset form
      setNewMapping({
        name: "",
        sourceType: ExternalDataSourceType.MLS,
        entityType: "property",
        fields: [
          {
            local: "",
            external: "",
            required: false,
            direction: "import",
          },
        ],
      });

      // Close modal
      setShowCreateMappingModal(false);

      // Show success message
      Alert.alert("Success", "Mapping created successfully");
    } catch (error) {
      console.error("Error creating mapping:", error);
      Alert.alert("Error", "Failed to create mapping");
    }
  };

  // Handle update mapping
  const handleUpdateMapping = async () => {
    try {
      if (!selectedMapping) return;

      // Validate mapping
      if (!newMapping.name || !newMapping.entityType) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      // Validate fields
      for (const field of newMapping.fields || []) {
        if (!field.local || !field.external) {
          Alert.alert("Error", "Please fill in all field mappings");
          return;
        }
      }

      // Update mapping
      const mapping = await externalDataService.updateMapping(selectedMapping.id, newMapping);

      // Reload mappings
      const loadedMappings = await externalDataService.getMappings();
      setMappings(loadedMappings);

      // Update selected mapping
      setSelectedMapping(mapping);

      // Close modal
      setShowEditMappingModal(false);

      // Show success message
      Alert.alert("Success", "Mapping updated successfully");
    } catch (error) {
      console.error("Error updating mapping:", error);
      Alert.alert("Error", "Failed to update mapping");
    }
  };

  // Handle delete mapping
  const handleDeleteMapping = async (mappingId: string) => {
    try {
      // Confirm deletion
      Alert.alert("Confirm Deletion", "Are you sure you want to delete this mapping?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete mapping
            const success = await externalDataService.deleteMapping(mappingId);

            if (success) {
              // Reload mappings
              const loadedMappings = await externalDataService.getMappings();
              setMappings(loadedMappings);

              // Clear selected mapping if needed
              if (selectedMapping && selectedMapping.id === mappingId) {
                setSelectedMapping(null);
                setShowMappingModal(false);
              }

              // Show success message
              Alert.alert("Success", "Mapping deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete mapping");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting mapping:", error);
      Alert.alert("Error", "Failed to delete mapping");
    }
  };

  // Handle add field to mapping
  const handleAddMappingField = () => {
    setNewMapping((prev) => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        {
          local: "",
          external: "",
          required: false,
          direction: "import",
        },
      ],
    }));
  };

  // Handle remove field from mapping
  const handleRemoveMappingField = (index: number) => {
    setNewMapping((prev) => ({
      ...prev,
      fields: (prev.fields || []).filter((_, i) => i !== index),
    }));
  };

  // Handle update mapping field
  const handleUpdateMappingField = (index: number, updates: Partial<DataMapping["fields"][0]>) => {
    setNewMapping((prev) => {
      const fields = [...(prev.fields || [])];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, fields };
    });
  };

  // Handle import data
  const handleImportData = async (connectorId: string) => {
    try {
      // Get connector
      const connector = connectors.find((c) => c.id === connectorId);

      if (!connector) {
        Alert.alert("Error", "Connector not found");
        return;
      }

      // Find applicable mappings
      const applicableMappings = mappings.filter((m) => m.sourceType === connector.sourceType);

      if (applicableMappings.length === 0) {
        Alert.alert(
          "No Mappings Found",
          "No data mappings found for this source type. Please create a mapping first."
        );
        return;
      }

      // Prompt user to select entity type
      Alert.alert(
        "Select Entity Type",
        "What data would you like to import?",
        applicableMappings.map((mapping) => ({
          text: `${mapping.entityType} (${mapping.name})`,
          onPress: async () => {
            setIsLoading(true);

            try {
              // Import data
              const result = await externalDataService.importData(connectorId, mapping.entityType, {
                mapping: mapping.id,
              });

              if (result.success) {
                Alert.alert(
                  "Import Successful",
                  `Successfully imported ${result.data.length} items.`
                );
              } else {
                Alert.alert("Import Failed", `Failed to import data: ${result.errors.join(", ")}`);
              }
            } catch (error) {
              console.error("Error importing data:", error);
              Alert.alert("Error", "Failed to import data");
            } finally {
              setIsLoading(false);
            }
          },
        }))
      );
    } catch (error) {
      console.error("Error initiating import:", error);
      Alert.alert("Error", "Failed to initiate import");
    }
  };

  // Handle synchronize data
  const handleSynchronizeData = async (connectorId: string) => {
    try {
      // Get connector
      const connector = connectors.find((c) => c.id === connectorId);

      if (!connector) {
        Alert.alert("Error", "Connector not found");
        return;
      }

      // Check if connector mode supports sync
      if (
        connector.integrationMode !== DataIntegrationMode.SYNCHRONIZE &&
        connector.integrationMode !== DataIntegrationMode.READ_WRITE
      ) {
        Alert.alert(
          "Integration Mode Error",
          "This connector is not configured for synchronization. Please update the integration mode."
        );
        return;
      }

      // Find applicable mappings
      const applicableMappings = mappings.filter((m) => m.sourceType === connector.sourceType);

      if (applicableMappings.length === 0) {
        Alert.alert(
          "No Mappings Found",
          "No data mappings found for this source type. Please create a mapping first."
        );
        return;
      }

      // Prompt user to select entity type
      Alert.alert(
        "Select Entity Type",
        "What data would you like to synchronize?",
        applicableMappings.map((mapping) => ({
          text: `${mapping.entityType} (${mapping.name})`,
          onPress: async () => {
            setIsLoading(true);

            try {
              // For demo, we'll use an empty local data array
              // In a real app, this would come from a local database
              const localData: any[] = [];

              // Synchronize data
              const result = await externalDataService.synchronizeData(
                connectorId,
                mapping.entityType,
                localData,
                { mapping: mapping.id }
              );

              // Reload conflicts if any were created
              if (result.conflicts > 0) {
                const loadedConflicts = await externalDataService.getConflicts();
                setConflicts(loadedConflicts);
              }

              if (result.success) {
                Alert.alert(
                  "Synchronization Successful",
                  `Successfully synchronized data:\n` +
                    `- ${result.updated} items updated\n` +
                    `- ${result.created} items created\n` +
                    `- ${result.deleted} items deleted\n` +
                    `- ${result.conflicts} conflicts found`
                );
              } else {
                Alert.alert(
                  "Synchronization Failed",
                  `Failed to synchronize data: ${result.errors.join(", ")}`
                );
              }
            } catch (error) {
              console.error("Error synchronizing data:", error);
              Alert.alert("Error", "Failed to synchronize data");
            } finally {
              setIsLoading(false);
            }
          },
        }))
      );
    } catch (error) {
      console.error("Error initiating synchronization:", error);
      Alert.alert("Error", "Failed to initiate synchronization");
    }
  };

  // Handle resolve conflict
  const handleResolveConflict = async (
    conflictId: string,
    resolution: "local" | "external" | "custom"
  ) => {
    try {
      if (!selectedConflict) return;

      // Resolve conflict
      const success = await externalDataService.resolveConflict(
        conflictId,
        resolution,
        resolution === "custom" ? selectedConflict.localValue : undefined,
        "Manually resolved by user"
      );

      if (success) {
        // Reload conflicts
        const loadedConflicts = await externalDataService.getConflicts();
        setConflicts(loadedConflicts);

        // Close modal
        setShowConflictModal(false);

        // Show success message
        Alert.alert("Success", "Conflict resolved successfully");
      } else {
        Alert.alert("Error", "Failed to resolve conflict");
      }
    } catch (error) {
      console.error("Error resolving conflict:", error);
      Alert.alert("Error", "Failed to resolve conflict");
    }
  };

  // Handle delete conflict
  const handleDeleteConflict = async (conflictId: string) => {
    try {
      // Confirm deletion
      Alert.alert("Confirm Deletion", "Are you sure you want to delete this conflict?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Delete conflict
            const success = await externalDataService.deleteConflict(conflictId);

            if (success) {
              // Reload conflicts
              const loadedConflicts = await externalDataService.getConflicts();
              setConflicts(loadedConflicts);

              // Clear selected conflict if needed
              if (selectedConflict && selectedConflict.id === conflictId) {
                setSelectedConflict(null);
                setShowConflictModal(false);
              }

              // Show success message
              Alert.alert("Success", "Conflict deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete conflict");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error deleting conflict:", error);
      Alert.alert("Error", "Failed to delete conflict");
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
</> style={styles.headerTitle}>External Data Integration</Text>
      </View>
    );
  };

  // Render connectors section
  const renderConnectorsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}><>

          <Text style={styles.sectionTitle}>Data Connectors</Text>

          <TouchableOpacity
</>
            style={styles.addButton}
            onPress={() => setShowCreateConnectorModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add Connector</Text>
          </TouchableOpacity>
        </View>

        {connectors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="database-off" size={48} color="#bdc3c7" /><>

            <Text style={styles.emptyText}>No connectors configured</Text>
            <Text
</> style={styles.emptySubtext}>
              Add a connector to start integrating with external data sources
            </Text>
          </View>
        ) : (
          <FlatList
            data={connectors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.connectorItem}
                onPress={() => {
                  setSelectedConnector(item);
                  setShowConnectorModal(true);
                }}
              >
                <View style={styles.connectorHeader}><>

                  <Text style={styles.connectorName}>{item.name}</Text>
                  <View
</>
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor:
                          externalDataService.getConnectionStatus(item.id) ===
                          ConnectionStatus.CONNECTED
                            ? "#2ecc71"
                            : externalDataService.getConnectionStatus(item.id) ===
                                ConnectionStatus.DISCONNECTED
                              ? "#e74c3c"
                              : "#f39c12",
                      },
                    ]}
                  />
                </View>

                <View style={styles.connectorDetails}>
                  <View style={styles.connectorDetail}>
                    <MaterialCommunityIcons name="database" size={16} color="#3498db" />
                    <Text style={styles.connectorDetailText}>{item.sourceType}</Text>
                  </View>

                  <View style={styles.connectorDetail}>
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#3498db" />
                    <Text style={styles.connectorDetailText}>{item.integrationMode}</Text>
                  </View>
                </View>

                <View style={styles.connectorEndpoint}>
                  <Text style={styles.connectorEndpointText} numberOfLines={1}>
                    {item.endpoint}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.connectorsList}
            contentContainerStyle={styles.connectorsListContent}
          />
        )}
      </View>
    );
  };

  // Render mappings section
  const renderMappingsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}><>

          <Text style={styles.sectionTitle}>Data Mappings</Text>

          <TouchableOpacity
</>
            style={styles.addButton}
            onPress={() => setShowCreateMappingModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add Mapping</Text>
          </TouchableOpacity>
        </View>

        {mappings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={48} color="#bdc3c7" /><>

            <Text style={styles.emptyText}>No mappings configured</Text>
            <Text
</> style={styles.emptySubtext}>
              Add a mapping to define how external data maps to your local data
            </Text>
          </View>
        ) : (
          <FlatList
            data={mappings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.mappingItem}
                onPress={() => {
                  setSelectedMapping(item);
                  setShowMappingModal(true);
                }}
              >
                <View style={styles.mappingHeader}>
                  <Text style={styles.mappingName}>{item.name}</Text>
                </View>

                <View style={styles.mappingDetails}>
                  <View style={styles.mappingDetail}>
                    <MaterialCommunityIcons name="database" size={16} color="#3498db" />
                    <Text style={styles.mappingDetailText}>{item.sourceType}</Text>
                  </View>

                  <View style={styles.mappingDetail}>
                    <MaterialCommunityIcons name="folder" size={16} color="#3498db" />
                    <Text style={styles.mappingDetailText}>{item.entityType}</Text>
                  </View>
                </View>

                <View style={styles.mappingFields}>
                  <Text style={styles.mappingFieldsText}>{item.fields.length} field mappings</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.mappingsList}
            contentContainerStyle={styles.mappingsListContent}
          />
        )}
      </View>
    );
  };

  // Render conflicts section
  const renderConflictsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Conflicts</Text>

        {conflicts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#2ecc71" /><>

            <Text style={styles.emptyText}>No data conflicts</Text>
            <Text
</> style={styles.emptySubtext}>All data is synchronized properly</Text>
          </View>
        ) : (
          <FlatList
            data={conflicts.filter((c) => !c.resolved)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conflictItem}
                onPress={() => {
                  setSelectedConflict(item);
                  setShowConflictModal(true);
                }}
              >
                <View style={styles.conflictHeader}><>

                  <Text style={styles.conflictType}>{item.entityType}</Text>
                  <Text
</> style={styles.conflictTimestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.conflictDetails}><>

                  <Text style={styles.conflictEntity}>Entity ID: {item.entityId}</Text>
                  <Text
</> style={styles.conflictField}>Field: {item.fieldPath}</Text>
                </View>

                <View style={styles.conflictValues}>
                  <View style={styles.conflictValue}><>

                    <Text style={styles.conflictValueLabel}>Local:</Text>
                    <Text
</> style={styles.conflictValueText} numberOfLines={1}>
                      {typeof item.localValue === "object"
                        ? JSON.stringify(item.localValue).substring(0, 30) + "..."
                        : String(item.localValue).substring(0, 30) +
                          (String(item.localValue).length > 30 ? "..." : "")}
                    </Text>
                  </View>

                  <View style={styles.conflictValue}><>

                    <Text style={styles.conflictValueLabel}>External:</Text>
                    <Text
</> style={styles.conflictValueText} numberOfLines={1}>
                      {typeof item.externalValue === "object"
                        ? JSON.stringify(item.externalValue).substring(0, 30) + "..."
                        : String(item.externalValue).substring(0, 30) +
                          (String(item.externalValue).length > 30 ? "..." : "")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            style={styles.conflictsList}
            contentContainerStyle={styles.conflictsListContent}
            ListEmptyComponent={
              conflicts.length > 0 ? (
                <View style={styles.resolvedConflictsContainer}><>

                  <Text style={styles.resolvedConflictsText}>All conflicts have been resolved</Text>
                  <Text
</> style={styles.resolvedConflictsSubtext}>
                    {conflicts.length} resolved conflicts
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    );
  };

  // Render connector modal
  const renderConnectorModal = () => {
    if (!selectedConnector) return null;

    return (
      <Modal
        visible={showConnectorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConnectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Connector Details</Text>
              <TouchableOpacity
</> onPress={() => setShowConnectorModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.connectorDetailHeader}><>

                <Text style={styles.connectorDetailName}>{selectedConnector.name}</Text>
                <View
</>
                  style={[
                    styles.connectorDetailStatus,
                    {
                      backgroundColor:
                        externalDataService.getConnectionStatus(selectedConnector.id) ===
                        ConnectionStatus.CONNECTED
                          ? "#2ecc71"
                          : externalDataService.getConnectionStatus(selectedConnector.id) ===
                              ConnectionStatus.DISCONNECTED
                            ? "#e74c3c"
                            : "#f39c12",
                    },
                  ]}
                >
                  <Text style={styles.connectorDetailStatusText}>
                    {externalDataService.getConnectionStatus(selectedConnector.id)}
                  </Text>
                </View>
              </View>

              <View style={styles.connectorDetailSection}><>

                <Text style={styles.connectorDetailSectionTitle}>Configuration</Text>

                <View
</> style={styles.connectorDetailItem}><>

                  <Text style={styles.connectorDetailLabel}>Source Type:</Text>
                  <Text
</> style={styles.connectorDetailValue}>{selectedConnector.sourceType}</Text>
                </View>

                <View style={styles.connectorDetailItem}><>

                  <Text style={styles.connectorDetailLabel}>Integration Mode:</Text>
                  <Text
</> style={styles.connectorDetailValue}>
                    {selectedConnector.integrationMode}
                  </Text>
                </View>

                <View style={styles.connectorDetailItem}><>

                  <Text style={styles.connectorDetailLabel}>Endpoint:</Text>
                  <Text
</> style={styles.connectorDetailValue}>{selectedConnector.endpoint}</Text>
                </View>

                <View style={styles.connectorDetailItem}><>

                  <Text style={styles.connectorDetailLabel}>Auth Type:</Text>
                  <Text
</> style={styles.connectorDetailValue}>{selectedConnector.authType}</Text>
                </View>
              </View>

              <View style={styles.connectorDetailControls}>
                <TouchableOpacity
                  style={styles.connectorDetailControl}
                  onPress={() => handleTestConnection(selectedConnector.id)}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="connection" size={16} color="#fff" />
                  )}
                  <Text style={styles.connectorDetailControlText}>
                    {isTesting ? "Testing..." : "Test Connection"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.connectorDetailControl}
                  onPress={() => {
                    setShowConnectorModal(false);

                    // Populate form with current values
                    setNewConnector({
                      name: selectedConnector.name,
                      sourceType: selectedConnector.sourceType,
                      integrationMode: selectedConnector.integrationMode,
                      endpoint: selectedConnector.endpoint,
                      authType: selectedConnector.authType,
                      credentials: selectedConnector.credentials,
                      headers: selectedConnector.headers,
                      queryParams: selectedConnector.queryParams,
                      timeout: selectedConnector.timeout,
                      cacheResponses: selectedConnector.cacheResponses,
                      cacheExpiration: selectedConnector.cacheExpiration,
                      enabled: selectedConnector.enabled,
                    });

                    setShowEditConnectorModal(true);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                  <Text style={styles.connectorDetailControlText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.connectorDetailControl, { backgroundColor: "#e74c3c" }]}
                  onPress={() => {
                    setShowConnectorModal(false);
                    handleDeleteConnector(selectedConnector.id);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                  <Text style={styles.connectorDetailControlText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.connectorDetailSection}><>

                <Text style={styles.connectorDetailSectionTitle}>Data Operations</Text>

                <TouchableOpacity
</>
                  style={styles.dataOperationButton}
                  onPress={() => {
                    setShowConnectorModal(false);
                    handleImportData(selectedConnector.id);
                  }}
                >
                  <MaterialCommunityIcons name="database-import" size={20} color="#fff" />
                  <Text style={styles.dataOperationButtonText}>Import Data</Text>
                </TouchableOpacity>

                {(selectedConnector.integrationMode === DataIntegrationMode.SYNCHRONIZE ||
                  selectedConnector.integrationMode === DataIntegrationMode.READ_WRITE) && (
                  <TouchableOpacity
                    style={styles.dataOperationButton}
                    onPress={() => {
                      setShowConnectorModal(false);
                      handleSynchronizeData(selectedConnector.id);
                    }}
                  >
                    <MaterialCommunityIcons name="sync" size={20} color="#fff" />
                    <Text style={styles.dataOperationButtonText}>Synchronize Data</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowConnectorModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render create connector modal
  const renderCreateConnectorModal = () => {
    return (
      <Modal
        visible={showCreateConnectorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateConnectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.formModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Create Connector</Text>
                <TouchableOpacity
</> onPress={() => setShowCreateConnectorModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Connector Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newConnector.name}
                    onChangeText={(text) => setNewConnector((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter connector name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Source Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.sourceType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.sourceType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Integration Mode</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.integrationMode}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, integrationMode: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(DataIntegrationMode).map((mode) => (
                            <Picker.Item key={mode} label={mode} value={mode} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.integrationMode}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, integrationMode: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(DataIntegrationMode).map((mode) => (
                            <Picker.Item key={mode} label={mode} value={mode} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Endpoint URL</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newConnector.endpoint}
                    onChangeText={(text) =>
                      setNewConnector((prev) => ({ ...prev, endpoint: text }))
                    }
                    placeholder="Enter endpoint URL"
                    keyboardType="url"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Authentication Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.authType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, authType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          <Picker.Item label="API Key" value="api_key" />
                          <Picker.Item label="OAuth" value="oauth" />
                          <Picker.Item label="Basic" value="basic" />
                          <Picker.Item label="Token" value="token" />
                          <Picker.Item label="None" value="none" />
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.authType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, authType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          <Picker.Item label="API Key" value="api_key" />
                          <Picker.Item label="OAuth" value="oauth" />
                          <Picker.Item label="Basic" value="basic" />
                          <Picker.Item label="Token" value="token" />
                          <Picker.Item label="None" value="none" />
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                {newConnector.authType === "api_key" && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>API Key</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newConnector.credentials?.apiKey || ""}
                      onChangeText={(text) =>
                        setNewConnector((prev) => ({
                          ...prev,
                          credentials: { ...prev.credentials, apiKey: text },
                        }))
                      }
                      placeholder="Enter API key"
                      secureTextEntry={true}
                    />
                  </View>
                )}

                {newConnector.authType === "basic" && (
                  <>
                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Username</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={newConnector.credentials?.username || ""}
                        onChangeText={(text) =>
                          setNewConnector((prev) => ({
                            ...prev,
                            credentials: { ...prev.credentials, username: text },
                          }))
                        }
                        placeholder="Enter username"
                      />
                    </View>

                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Password</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={newConnector.credentials?.password || ""}
                        onChangeText={(text) =>
                          setNewConnector((prev) => ({
                            ...prev,
                            credentials: { ...prev.credentials, password: text },
                          }))
                        }
                        placeholder="Enter password"
                        secureTextEntry={true}
                      />
                    </View>
                  </>
                )}

                {newConnector.authType === "token" && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Token</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newConnector.credentials?.token || ""}
                      onChangeText={(text) =>
                        setNewConnector((prev) => ({
                          ...prev,
                          credentials: { ...prev.credentials, token: text },
                        }))
                      }
                      placeholder="Enter token"
                      secureTextEntry={true}
                    />
                  </View>
                )}

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Cache Responses</Text>
                  <Switch
</>
                    value={newConnector.cacheResponses}
                    onValueChange={(value) =>
                      setNewConnector((prev) => ({ ...prev, cacheResponses: value }))
                    }
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={newConnector.cacheResponses ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Enabled</Text>
                  <Switch
</>
                    value={newConnector.enabled}
                    onValueChange={(value) =>
                      setNewConnector((prev) => ({ ...prev, enabled: value }))
                    }
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={newConnector.enabled ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateConnectorModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateConnector}>
                  <Text style={styles.createButtonText}>Create Connector</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render edit connector modal
  const renderEditConnectorModal = () => {
    if (!selectedConnector) return null;

    return (
      <Modal
        visible={showEditConnectorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditConnectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.formModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Edit Connector</Text>
                <TouchableOpacity
</> onPress={() => setShowEditConnectorModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Connector Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newConnector.name}
                    onChangeText={(text) => setNewConnector((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter connector name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Source Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.sourceType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.sourceType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Integration Mode</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.integrationMode}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, integrationMode: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(DataIntegrationMode).map((mode) => (
                            <Picker.Item key={mode} label={mode} value={mode} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.integrationMode}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, integrationMode: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(DataIntegrationMode).map((mode) => (
                            <Picker.Item key={mode} label={mode} value={mode} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Endpoint URL</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newConnector.endpoint}
                    onChangeText={(text) =>
                      setNewConnector((prev) => ({ ...prev, endpoint: text }))
                    }
                    placeholder="Enter endpoint URL"
                    keyboardType="url"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Authentication Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newConnector.authType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, authType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          <Picker.Item label="API Key" value="api_key" />
                          <Picker.Item label="OAuth" value="oauth" />
                          <Picker.Item label="Basic" value="basic" />
                          <Picker.Item label="Token" value="token" />
                          <Picker.Item label="None" value="none" />
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newConnector.authType}
                          onValueChange={(value) =>
                            setNewConnector((prev) => ({ ...prev, authType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          <Picker.Item label="API Key" value="api_key" />
                          <Picker.Item label="OAuth" value="oauth" />
                          <Picker.Item label="Basic" value="basic" />
                          <Picker.Item label="Token" value="token" />
                          <Picker.Item label="None" value="none" />
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                {newConnector.authType === "api_key" && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>API Key</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newConnector.credentials?.apiKey || ""}
                      onChangeText={(text) =>
                        setNewConnector((prev) => ({
                          ...prev,
                          credentials: { ...prev.credentials, apiKey: text },
                        }))
                      }
                      placeholder="Enter API key"
                      secureTextEntry={true}
                    />
                  </View>
                )}

                {newConnector.authType === "basic" && (
                  <>
                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Username</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={newConnector.credentials?.username || ""}
                        onChangeText={(text) =>
                          setNewConnector((prev) => ({
                            ...prev,
                            credentials: { ...prev.credentials, username: text },
                          }))
                        }
                        placeholder="Enter username"
                      />
                    </View>

                    <View style={styles.formField}><>

                      <Text style={styles.formLabel}>Password</Text>
                      <TextInput
</>
                        style={styles.formInput}
                        value={newConnector.credentials?.password || ""}
                        onChangeText={(text) =>
                          setNewConnector((prev) => ({
                            ...prev,
                            credentials: { ...prev.credentials, password: text },
                          }))
                        }
                        placeholder="Enter password"
                        secureTextEntry={true}
                      />
                    </View>
                  </>
                )}

                {newConnector.authType === "token" && (
                  <View style={styles.formField}><>

                    <Text style={styles.formLabel}>Token</Text>
                    <TextInput
</>
                      style={styles.formInput}
                      value={newConnector.credentials?.token || ""}
                      onChangeText={(text) =>
                        setNewConnector((prev) => ({
                          ...prev,
                          credentials: { ...prev.credentials, token: text },
                        }))
                      }
                      placeholder="Enter token"
                      secureTextEntry={true}
                    />
                  </View>
                )}

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Cache Responses</Text>
                  <Switch
</>
                    value={newConnector.cacheResponses}
                    onValueChange={(value) =>
                      setNewConnector((prev) => ({ ...prev, cacheResponses: value }))
                    }
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={newConnector.cacheResponses ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Enabled</Text>
                  <Switch
</>
                    value={newConnector.enabled}
                    onValueChange={(value) =>
                      setNewConnector((prev) => ({ ...prev, enabled: value }))
                    }
                    trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                    thumbColor={newConnector.enabled ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditConnectorModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleUpdateConnector}>
                  <Text style={styles.createButtonText}>Update Connector</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render mapping modal
  const renderMappingModal = () => {
    if (!selectedMapping) return null;

    return (
      <Modal
        visible={showMappingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMappingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Mapping Details</Text>
              <TouchableOpacity
</> onPress={() => setShowMappingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.mappingDetailHeader}>
                <Text style={styles.mappingDetailName}>{selectedMapping.name}</Text>
              </View>

              <View style={styles.mappingDetailSection}><>

                <Text style={styles.mappingDetailSectionTitle}>Configuration</Text>

                <View
</> style={styles.mappingDetailItem}><>

                  <Text style={styles.mappingDetailLabel}>Source Type:</Text>
                  <Text
</> style={styles.mappingDetailValue}>{selectedMapping.sourceType}</Text>
                </View>

                <View style={styles.mappingDetailItem}><>

                  <Text style={styles.mappingDetailLabel}>Entity Type:</Text>
                  <Text
</> style={styles.mappingDetailValue}>{selectedMapping.entityType}</Text>
                </View>
              </View>

              <View style={styles.mappingDetailSection}>
                <Text style={styles.mappingDetailSectionTitle}>Field Mappings</Text>

                {selectedMapping.fields.length === 0 ? (
                  <Text style={styles.mappingNoFields}>No field mappings defined</Text>
                ) : (
                  selectedMapping.fields.map((field /* , index */) => (
                    <View key={index} style={styles.mappingFieldItem}>
                      <View style={styles.mappingFieldHeader}>
                        <Text style={styles.mappingFieldDirection}>
                          {field.direction === "import"
                            ? "Import"
                            : field.direction === "export"
                              ? "Export"
                              : "Bidirectional"}
                        </Text>
                        {field.required && (
                          <View style={styles.mappingFieldRequired}>
                            <Text style={styles.mappingFieldRequiredText}>Required</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.mappingFieldPath}><>

                        <Text style={styles.mappingFieldLocal}>{field.local}</Text>
                        <MaterialCommunityIcons
</> name="arrow-left-right" size={16} color="#7f8c8d" />
                        <Text style={styles.mappingFieldExternal}>{field.external}</Text>
                      </View>

                      {field.transform && (
                        <View style={styles.mappingFieldTransform}><>

                          <Text style={styles.mappingFieldTransformLabel}>Transform:</Text>
                          <Text
</> style={styles.mappingFieldTransformText} numberOfLines={1}>
                            {field.transform.length > 30
                              ? field.transform.substring(0, 30) + "..."
                              : field.transform}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>

              <View style={styles.mappingDetailControls}>
                <TouchableOpacity
                  style={styles.mappingDetailControl}
                  onPress={() => {
                    setShowMappingModal(false);

                    // Populate form with current values
                    setNewMapping({
                      name: selectedMapping.name,
                      sourceType: selectedMapping.sourceType,
                      entityType: selectedMapping.entityType,
                      fields: [...selectedMapping.fields],
                    });

                    setShowEditMappingModal(true);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                  <Text style={styles.mappingDetailControlText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mappingDetailControl, { backgroundColor: "#e74c3c" }]}
                  onPress={() => {
                    setShowMappingModal(false);
                    handleDeleteMapping(selectedMapping.id);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                  <Text style={styles.mappingDetailControlText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowMappingModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render create mapping modal
  const renderCreateMappingModal = () => {
    return (
      <Modal
        visible={showCreateMappingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateMappingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.formModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Create Mapping</Text>
                <TouchableOpacity
</> onPress={() => setShowCreateMappingModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Mapping Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newMapping.name}
                    onChangeText={(text) => setNewMapping((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter mapping name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Source Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newMapping.sourceType}
                          onValueChange={(value) =>
                            setNewMapping((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newMapping.sourceType}
                          onValueChange={(value) =>
                            setNewMapping((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Entity Type</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newMapping.entityType}
                    onChangeText={(text) =>
                      setNewMapping((prev) => ({ ...prev, entityType: text }))
                    }
                    placeholder="Enter entity type (e.g., property)"
                  />
                </View>

                <View style={styles.formField}>
                  <View style={styles.fieldMappingHeader}><>

                    <Text style={styles.fieldMappingTitle}>Field Mappings</Text>
                    <TouchableOpacity
</> style={styles.addFieldButton} onPress={handleAddMappingField}>
                      <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                      <Text style={styles.addFieldButtonText}>Add Field</Text>
                    </TouchableOpacity>
                  </View>

                  {(newMapping.fields || []).map((field /* , index */) => (
                    <View key={index} style={styles.fieldMapping}>
                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Local Path:</Text>
                        <TextInput
</>
                          style={styles.fieldMappingInput}
                          value={field.local}
                          onChangeText={(text) => handleUpdateMappingField(index, { local: text })}
                          placeholder="Local field path"
                        />
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>External Path:</Text>
                        <TextInput
</>
                          style={styles.fieldMappingInput}
                          value={field.external}
                          onChangeText={(text) =>
                            handleUpdateMappingField(index, { external: text })
                          }
                          placeholder="External field path"
                        />
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Direction:</Text>
                        <View
</> style={styles.fieldMappingSelect}>
                          {Platform.select({
                            ios: (
                              <Picker
                                selectedValue={field.direction}
                                onValueChange={(value) =>
                                  handleUpdateMappingField(index, { direction: value })
                                }
                                style={styles.fieldMappingSelectIOS}
                              >
                                <Picker.Item label="Import" value="import" />
                                <Picker.Item label="Export" value="export" />
                                <Picker.Item label="Both" value="both" />
                              </Picker>
                            ),
                            android: (
                              <Picker
                                selectedValue={field.direction}
                                onValueChange={(value) =>
                                  handleUpdateMappingField(index, { direction: value })
                                }
                                style={styles.fieldMappingSelectAndroid}
                              >
                                <Picker.Item label="Import" value="import" />
                                <Picker.Item label="Export" value="export" />
                                <Picker.Item label="Both" value="both" />
                              </Picker>
                            ),
                          })}
                        </View>
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Required:</Text>
                        <Switch
</>
                          value={field.required}
                          onValueChange={(value) =>
                            handleUpdateMappingField(index, { required: value })
                          }
                          trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                          thumbColor={field.required ? "#fff" : "#f4f3f4"}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.removeFieldButton}
                        onPress={() => handleRemoveMappingField(index)}
                      >
                        <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                        <Text style={styles.removeFieldButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateMappingModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateMapping}>
                  <Text style={styles.createButtonText}>Create Mapping</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render edit mapping modal
  const renderEditMappingModal = () => {
    if (!selectedMapping) return null;

    return (
      <Modal
        visible={showEditMappingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditMappingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <View style={styles.formModal}>
              <View style={styles.modalHeader}><>

                <Text style={styles.modalTitle}>Edit Mapping</Text>
                <TouchableOpacity
</> onPress={() => setShowEditMappingModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScrollView}>
                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Mapping Name</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newMapping.name}
                    onChangeText={(text) => setNewMapping((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter mapping name"
                  />
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Source Type</Text>
                  <View
</> style={styles.formSelect}>
                    {Platform.select({
                      ios: (
                        <Picker
                          selectedValue={newMapping.sourceType}
                          onValueChange={(value) =>
                            setNewMapping((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectIOS}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                      android: (
                        <Picker
                          selectedValue={newMapping.sourceType}
                          onValueChange={(value) =>
                            setNewMapping((prev) => ({ ...prev, sourceType: value }))
                          }
                          style={styles.formSelectAndroid}
                        >
                          {Object.values(ExternalDataSourceType).map((type) => (
                            <Picker.Item key={type} label={type} value={type} />
                          ))}
                        </Picker>
                      ),
                    })}
                  </View>
                </View>

                <View style={styles.formField}><>

                  <Text style={styles.formLabel}>Entity Type</Text>
                  <TextInput
</>
                    style={styles.formInput}
                    value={newMapping.entityType}
                    onChangeText={(text) =>
                      setNewMapping((prev) => ({ ...prev, entityType: text }))
                    }
                    placeholder="Enter entity type (e.g., property)"
                  />
                </View>

                <View style={styles.formField}>
                  <View style={styles.fieldMappingHeader}><>

                    <Text style={styles.fieldMappingTitle}>Field Mappings</Text>
                    <TouchableOpacity
</> style={styles.addFieldButton} onPress={handleAddMappingField}>
                      <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                      <Text style={styles.addFieldButtonText}>Add Field</Text>
                    </TouchableOpacity>
                  </View>

                  {(newMapping.fields || []).map((field /* , index */) => (
                    <View key={index} style={styles.fieldMapping}>
                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Local Path:</Text>
                        <TextInput
</>
                          style={styles.fieldMappingInput}
                          value={field.local}
                          onChangeText={(text) => handleUpdateMappingField(index, { local: text })}
                          placeholder="Local field path"
                        />
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>External Path:</Text>
                        <TextInput
</>
                          style={styles.fieldMappingInput}
                          value={field.external}
                          onChangeText={(text) =>
                            handleUpdateMappingField(index, { external: text })
                          }
                          placeholder="External field path"
                        />
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Direction:</Text>
                        <View
</> style={styles.fieldMappingSelect}>
                          {Platform.select({
                            ios: (
                              <Picker
                                selectedValue={field.direction}
                                onValueChange={(value) =>
                                  handleUpdateMappingField(index, { direction: value })
                                }
                                style={styles.fieldMappingSelectIOS}
                              >
                                <Picker.Item label="Import" value="import" />
                                <Picker.Item label="Export" value="export" />
                                <Picker.Item label="Both" value="both" />
                              </Picker>
                            ),
                            android: (
                              <Picker
                                selectedValue={field.direction}
                                onValueChange={(value) =>
                                  handleUpdateMappingField(index, { direction: value })
                                }
                                style={styles.fieldMappingSelectAndroid}
                              >
                                <Picker.Item label="Import" value="import" />
                                <Picker.Item label="Export" value="export" />
                                <Picker.Item label="Both" value="both" />
                              </Picker>
                            ),
                          })}
                        </View>
                      </View>

                      <View style={styles.fieldMappingRow}><>

                        <Text style={styles.fieldMappingLabel}>Required:</Text>
                        <Switch
</>
                          value={field.required}
                          onValueChange={(value) =>
                            handleUpdateMappingField(index, { required: value })
                          }
                          trackColor={{ false: "#bdc3c7", true: "#3498db" }}
                          thumbColor={field.required ? "#fff" : "#f4f3f4"}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.removeFieldButton}
                        onPress={() => handleRemoveMappingField(index)}
                      >
                        <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                        <Text style={styles.removeFieldButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditMappingModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleUpdateMapping}>
                  <Text style={styles.createButtonText}>Update Mapping</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  // Render conflict modal
  const renderConflictModal = () => {
    if (!selectedConflict) return null;

    return (
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><>

              <Text style={styles.modalTitle}>Data Conflict</Text>
              <TouchableOpacity
</> onPress={() => setShowConflictModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.conflictDetailHeader}><>

                <Text style={styles.conflictDetailType}>
                  {selectedConflict.entityType} Conflict
                </Text>
                <Text
</> style={styles.conflictDetailTimestamp}>
                  {new Date(selectedConflict.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.conflictDetailSection}><>

                <Text style={styles.conflictDetailSectionTitle}>Conflict Information</Text>

                <View
</> style={styles.conflictDetailItem}><>

                  <Text style={styles.conflictDetailLabel}>Entity ID:</Text>
                  <Text
</> style={styles.conflictDetailValue}>{selectedConflict.entityId}</Text>
                </View>

                <View style={styles.conflictDetailItem}><>

                  <Text style={styles.conflictDetailLabel}>Field Path:</Text>
                  <Text
</> style={styles.conflictDetailValue}>{selectedConflict.fieldPath}</Text>
                </View>

                <View style={styles.conflictDetailItem}><>

                  <Text style={styles.conflictDetailLabel}>Source Type:</Text>
                  <Text
</> style={styles.conflictDetailValue}>{selectedConflict.sourceType}</Text>
                </View>
              </View>

              <View style={styles.conflictDetailSection}><>

                <Text style={styles.conflictDetailSectionTitle}>Conflicting Values</Text>

                <View
</> style={styles.conflictValueSection}><>

                  <Text style={styles.conflictValueTitle}>Local Value:</Text>
                  <View
</> style={styles.conflictValueContainer}>
                    <Text style={styles.conflictValueContent}>
                      {typeof selectedConflict.localValue === "object"
                        ? JSON.stringify(selectedConflict.localValue, null, 2)
                        : String(selectedConflict.localValue)}
                    </Text>
                  </View>
                </View>

                <View style={styles.conflictValueSection}><>

                  <Text style={styles.conflictValueTitle}>External Value:</Text>
                  <View
</> style={styles.conflictValueContainer}>
                    <Text style={styles.conflictValueContent}>
                      {typeof selectedConflict.externalValue === "object"
                        ? JSON.stringify(selectedConflict.externalValue, null, 2)
                        : String(selectedConflict.externalValue)}
                    </Text>
                  </View>
                </View>
              </View>

              {!selectedConflict.resolved ? (
                <View style={styles.conflictResolutionSection}><>

                  <Text style={styles.conflictResolutionTitle}>Resolve Conflict</Text>

                  <TouchableOpacity
</>
                    style={styles.conflictResolutionButton}
                    onPress={() => handleResolveConflict(selectedConflict.id, "local")}
                  >
                    <MaterialCommunityIcons name="database" size={16} color="#fff" />
                    <Text style={styles.conflictResolutionButtonText}>Use Local Value</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.conflictResolutionButton}
                    onPress={() => handleResolveConflict(selectedConflict.id, "external")}
                  >
                    <MaterialCommunityIcons name="cloud" size={16} color="#fff" />
                    <Text style={styles.conflictResolutionButtonText}>Use External Value</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.conflictResolutionButton, { backgroundColor: "#e74c3c" }]}
                    onPress={() => handleDeleteConflict(selectedConflict.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                    <Text style={styles.conflictResolutionButtonText}>Discard Conflict</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.conflictResolutionSection}><>

                  <Text style={styles.conflictResolutionTitle}>Resolution</Text>

                  <View
</> style={styles.conflictDetailItem}><>

                    <Text style={styles.conflictDetailLabel}>Status:</Text>
                    <View
</> style={styles.conflictResolvedBadge}>
                      <MaterialCommunityIcons name="check" size={12} color="#fff" />
                      <Text style={styles.conflictResolvedText}>Resolved</Text>
                    </View>
                  </View>

                  <View style={styles.conflictDetailItem}><>

                    <Text style={styles.conflictDetailLabel}>Resolved At:</Text>
                    <Text
</> style={styles.conflictDetailValue}>
                      {selectedConflict.resolvedAt
                        ? new Date(selectedConflict.resolvedAt).toLocaleString()
                        : "Unknown"}
                    </Text>
                  </View>

                  <View style={styles.conflictDetailItem}><>

                    <Text style={styles.conflictDetailLabel}>Resolution:</Text>
                    <Text
</> style={styles.conflictDetailValue}>
                      {selectedConflict.resolution === "local"
                        ? "Used Local Value"
                        : selectedConflict.resolution === "external"
                          ? "Used External Value"
                          : selectedConflict.resolution === "custom"
                            ? "Used Custom Value"
                            : "Unknown"}
                    </Text>
                  </View>

                  {selectedConflict.notes && (
                    <View style={styles.conflictDetailItem}><>

                      <Text style={styles.conflictDetailLabel}>Notes:</Text>
                      <Text
</> style={styles.conflictDetailValue}>{selectedConflict.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowConflictModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading external data services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderConnectorsSection()}
        {renderMappingsSection()}
        {renderConflictsSection()}
      </ScrollView>

      {/* Modals */}
      {renderConnectorModal()}
      {renderCreateConnectorModal()}
      {renderEditConnectorModal()}
      {renderMappingModal()}
      {renderCreateMappingModal()}
      {renderEditMappingModal()}
      {renderConflictModal()}
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
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    color: "#7f8c8d",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
  },
  connectorsList: {
    marginTop: 8,
  },
  connectorsListContent: {
    paddingBottom: 8,
  },
  connectorItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  connectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  connectorName: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectorDetails: {
    flexDirection: "row",
    marginBottom: 8,
  },
  connectorDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  connectorDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  connectorEndpoint: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  connectorEndpointText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  mappingsList: {
    marginTop: 8,
  },
  mappingsListContent: {
    paddingBottom: 8,
  },
  mappingItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mappingHeader: {
    marginBottom: 8,
  },
  mappingName: {
    fontSize: 16,
    fontWeight: "500",
  },
  mappingDetails: {
    flexDirection: "row",
    marginBottom: 8,
  },
  mappingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  mappingDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  mappingFields: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mappingFieldsText: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  conflictsList: {
    marginTop: 8,
  },
  conflictsListContent: {
    paddingBottom: 8,
  },
  conflictItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  conflictHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: "500",
  },
  conflictTimestamp: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  conflictDetails: {
    marginBottom: 8,
  },
  conflictEntity: {
    fontSize: 14,
    marginBottom: 4,
  },
  conflictField: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  conflictValues: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  conflictValue: {
    marginBottom: 4,
  },
  conflictValueLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  conflictValueText: {
    fontSize: 12,
  },
  resolvedConflictsContainer: {
    alignItems: "center",
    padding: 24,
  },
  resolvedConflictsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  resolvedConflictsSubtext: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 8,
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
  modalScrollView: {
    maxHeight: 400,
    padding: 16,
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
  connectorDetailHeader: {
    marginBottom: 16,
  },
  connectorDetailName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  connectorDetailStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  connectorDetailStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  connectorDetailSection: {
    marginBottom: 16,
  },
  connectorDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  connectorDetailItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  connectorDetailLabel: {
    width: 120,
    fontSize: 14,
    color: "#7f8c8d",
  },
  connectorDetailValue: {
    flex: 1,
    fontSize: 14,
  },
  connectorDetailControls: {
    flexDirection: "row",
    marginBottom: 16,
  },
  connectorDetailControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectorDetailControlText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  dataOperationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  dataOperationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  formModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  formScrollView: {
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
  mappingDetailHeader: {
    marginBottom: 16,
  },
  mappingDetailName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mappingDetailSection: {
    marginBottom: 16,
  },
  mappingDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mappingDetailItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  mappingDetailLabel: {
    width: 120,
    fontSize: 14,
    color: "#7f8c8d",
  },
  mappingDetailValue: {
    flex: 1,
    fontSize: 14,
  },
  mappingNoFields: {
    fontStyle: "italic",
    color: "#7f8c8d",
  },
  mappingFieldItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  mappingFieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mappingFieldDirection: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3498db",
  },
  mappingFieldRequired: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  mappingFieldRequiredText: {
    fontSize: 10,
    color: "#fff",
  },
  mappingFieldPath: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mappingFieldLocal: {
    flex: 1,
    fontSize: 14,
  },
  mappingFieldExternal: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  mappingFieldTransform: {
    marginTop: 4,
  },
  mappingFieldTransformLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  mappingFieldTransformText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mappingDetailControls: {
    flexDirection: "row",
    marginBottom: 16,
  },
  mappingDetailControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  mappingDetailControlText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  fieldMappingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fieldMappingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  addFieldButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addFieldButtonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  fieldMapping: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  fieldMappingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldMappingLabel: {
    width: 100,
    fontSize: 14,
  },
  fieldMappingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
  },
  fieldMappingSelect: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
  },
  fieldMappingSelectAndroid: {
    width: "100%",
  },
  fieldMappingSelectIOS: {
    width: "100%",
  },
  removeFieldButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  removeFieldButtonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  conflictDetailHeader: {
    marginBottom: 16,
  },
  conflictDetailType: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  conflictDetailTimestamp: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  conflictDetailSection: {
    marginBottom: 16,
  },
  conflictDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conflictValueSection: {
    marginBottom: 8,
  },
  conflictValueTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  conflictValueContainer: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    maxHeight: 120,
  },
  conflictValueContent: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  conflictResolutionSection: {
    marginBottom: 16,
  },
  conflictResolutionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conflictResolutionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  conflictResolutionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  conflictResolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conflictResolvedText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 2,
  },
});

export default ExternalDataScreen;
