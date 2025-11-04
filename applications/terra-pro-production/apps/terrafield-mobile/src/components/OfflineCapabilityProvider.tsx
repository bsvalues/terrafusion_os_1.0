import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { OfflineServiceInitializer } from "../services/OfflineServiceInitializer";
import NetInfo from "@react-native-community/netinfo";

interface OfflineCapabilityProviderProps {
  children: React.ReactNode;
}

/**
 * This component initializes all offline capabilities and
 * provides connectivity status to the rest of the app
 */
export const OfflineCapabilityProvider: React.FC<OfflineCapabilityProviderProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize offline services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize offline services
        OfflineServiceInitializer.initialize();

        // Monitor network connectivity
        const unsubscribe = NetInfo.addEventListener((state) => {
          setIsOnline(state.isConnected ?? false);
        });

        setIsInitialized(true);
        setIsInitializing(false);

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing offline services:", error);
        setIsInitializing(false);
      }
    };

    initializeServices();
  }, []);

  // Show loading indicator while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Initializing offline capabilities...</Text>
      </View>
    );
  }

  // Show error if initialization failed
  if (!isInitialized && !isInitializing) {
    return (
      <View style={styles.errorContainer}><>

        <Text style={styles.errorText}>
          There was a problem initializing the app's offline capabilities.
        </Text>
        <Text
</> style={styles.errorSubtext}>Please restart the app and try again.</Text>
      </View>
    );
  }

  // Render children with connectivity status indicator
  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You are currently offline. Changes will be synchronized when connection is restored.
          </Text>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  offlineBanner: {
    backgroundColor: "#e74c3c",
    padding: 8,
    alignItems: "center",
  },
  offlineText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
});
