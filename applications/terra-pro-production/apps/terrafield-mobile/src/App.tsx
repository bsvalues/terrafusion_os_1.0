import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";

// Navigation
import AppNavigator from "./navigation/AppNavigator";

// Context Providers
import { AuthProvider } from "./hooks/useAuth";

// Services
import { ApiService } from "./services/ApiService";
import { NotificationService } from "./services/NotificationService";
import { DataSyncService } from "./services/DataSyncService";

// Constants
import * as Colors from "./constants/Colors";

// Prevent native splash screen from autohiding
SplashScreen.preventAutoHideAsync();

const App = () => {
  const [isReady, setIsReady] = useState(false);

  // Initialize App
  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize services
        ApiService.getInstance();
        NotificationService.getInstance();
        DataSyncService.getInstance();

        // Setup network connectivity listener
        const unsubscribe = NetInfo.addEventListener((state) => {
          ApiService.getInstance().setConnectivity(state.isConnected || false);
        });

        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          "Roboto-Regular": require("./assets/fonts/Roboto-Regular.ttf"),
          "Roboto-Medium": require("./assets/fonts/Roboto-Medium.ttf"),
          "Roboto-Bold": require("./assets/fonts/Roboto-Bold.ttf"),
        });

        // Wait for a second to simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn("Error initializing app:", error);
      } finally {
        setIsReady(true);

        // Hide splash screen
        SplashScreen.hideAsync();
      }
    };

    prepare();

    // Return cleanup function
    return () => {
      // Clean up any resources
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent={false} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
