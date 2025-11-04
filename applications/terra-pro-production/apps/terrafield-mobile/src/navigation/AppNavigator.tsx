import React, { useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, View, TouchableOpacity } from "react-native";

// Screens
import HomeScreen from "../screens/HomeScreen";
import PropertyDetailsScreen from "../screens/PropertyDetailsScreen";
import FieldNotesScreen from "../screens/FieldNotesScreen";
import PropertyComparisonDashboard from "../screens/PropertyComparisonDashboard";
import PhotoEnhancementScreen from "../screens/PhotoEnhancementScreen";
import ARMeasurementScreen from "../screens/ARMeasurementScreen";
import ReportGenerationScreen from "../screens/ReportGenerationScreen";
import PropertyShareScreen from "../screens/PropertyShareScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Constants
import * as Colors from "../constants/Colors";

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom tab bar button
const TabBarCustomButton = ({ children, onPress }: any) => {
  return (
    <TouchableOpacity
      style={{
        top: -20,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Colors.primary,
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

// Auth Navigator (Login, Signup)
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Properties") {
            iconName = focused ? "business" : "business-outline";
          } else if (route.name === "Add") {
            iconName = "add";
            return <Ionicons name={iconName} size={30} color={Colors.white} />;
          } else if (route.name === "Reports") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          height: 70,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Properties" component={PropertiesNavigator} />
      <Tab.Screen
        name="Add"
        component={AddPropertyNavigator}
        options={{
          tabBarButton: (props) => <TabBarCustomButton {...props} />,
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen name="Reports" component={ReportsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

// Home Stack Navigator
const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen
        name="PropertyDetailsScreen"
        component={PropertyDetailsScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="FieldNotesScreen"
        component={FieldNotesScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="PropertyComparisonDashboard"
        component={PropertyComparisonDashboard}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="PhotoEnhancementScreen"
        component={PhotoEnhancementScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

// Properties Stack Navigator
const PropertiesNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="PropertiesScreen" component={HomeScreen} />
      <Stack.Screen
        name="PropertyDetailsScreen"
        component={PropertyDetailsScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="FieldNotesScreen"
        component={FieldNotesScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="PropertyShareScreen"
        component={PropertyShareScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

// Add Property Stack Navigator
const AddPropertyNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="AddPropertyScreen" component={HomeScreen} />
      <Stack.Screen
        name="ARMeasurementScreen"
        component={ARMeasurementScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

// Reports Stack Navigator
const ReportsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="ReportsScreen" component={HomeScreen} />
      <Stack.Screen
        name="ReportGenerationScreen"
        component={ReportGenerationScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <Text style={{ color: Colors.primary, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.background },
        }}
      >
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
