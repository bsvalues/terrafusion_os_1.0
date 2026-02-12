import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ComplianceDocumentService } from "../services/ComplianceDocumentService";
import { PropertyData } from "../services/types";

interface ComplianceDocumentButtonProps {
  property: PropertyData;
  style?: any;
  iconSize?: number;
  label?: string;
  showOneClick?: boolean;
}

/**
 * ComplianceDocumentButton
 *
 * A button that allows users to quickly navigate to the compliance document
 * generator or generate a document with one click.
 */
const ComplianceDocumentButton: React.FC<ComplianceDocumentButtonProps> = ({
  property,
  style,
  iconSize = 24,
  label = "Compliance Documents",
  showOneClick = true,
}) => {
  // Navigation
  const navigation = useNavigation();

  // State
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);

  // Service
  const documentService = ComplianceDocumentService.getInstance();

  // Handle navigate to document screen
  const handleNavigateToDocuments = () => {
    navigation.navigate("ComplianceDocument", { propertyId: property.id });
  };

  // Handle one-click generate
  const handleOneClickGenerate = async () => {
    try {
      setIsGenerating(true);

      // Generate document with default options
      const result = await documentService.generateDocument(property);

      if (result.success) {
        Alert.alert(
          "Document Generated",
          "The compliance document has been generated successfully.",
          [
            {
              text: "View",
              onPress: () => {
                // In a real app, this would open the document in a viewer
                Alert.alert("View Document", "Document viewer not implemented in this prototype.");
              },
            },
            {
              text: "Share",
              onPress: async () => {
                if (result.documentUri) {
                  await documentService.shareDocument(result.documentUri, result.fileName);
                }
              },
            },
            {
              text: "See All Documents",
              onPress: handleNavigateToDocuments,
            },
            {
              text: "OK",
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate document", [
          {
            text: "Try Advanced Options",
            onPress: handleNavigateToDocuments,
          },
          {
            text: "OK",
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating document:", error);

      Alert.alert("Error", "An unexpected error occurred while generating the document", [
        {
          text: "Try Advanced Options",
          onPress: handleNavigateToDocuments,
        },
        {
          text: "OK",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showOneClick && (
        <TouchableOpacity
          style={styles.oneClickButton}
          onPress={handleOneClickGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="file-document-edit" size={iconSize} color="#fff" />
          )}
          <Text style={styles.oneClickButtonText}>Generate</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleNavigateToDocuments}>
        <MaterialCommunityIcons name="file-document-multiple" size={iconSize} color="#fff" />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  button: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  oneClickButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  oneClickButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ComplianceDocumentButton;
