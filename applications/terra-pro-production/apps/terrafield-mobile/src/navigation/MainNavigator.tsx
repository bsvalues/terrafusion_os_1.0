import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  RootStackParamList,
  MainTabParamList,
  PropertiesStackParamList,
  InspectionStackParamList,
  ReportsStackParamList,
  SettingsStackParamList,
  DashboardStackParamList,
} from "./types";

// Mock screen components for demonstration purposes
// In a real app, these would be imported from the actual screens
import LoginScreen from "../screens/LoginScreen";
import DashboardHomeScreen from "../screens/DashboardHomeScreen";
import PropertiesListScreen from "../screens/PropertiesListScreen";
import PropertyDetailScreen from "../screens/PropertyDetailScreen";
import PropertyEditScreen from "../screens/PropertyEditScreen";
import AddPropertyScreen from "../screens/AddPropertyScreen";
import PropertySearchScreen from "../screens/PropertySearchScreen";
import PropertyMapViewScreen from "../screens/PropertyMapViewScreen";
import ComparableSearchScreen from "../screens/ComparableSearchScreen";
import PropertyComparisonDashboard from "../screens/PropertyComparisonDashboard";
import InspectionListScreen from "../screens/InspectionListScreen";
import InspectionDetailScreen from "../screens/InspectionDetailScreen";
import PhotoCaptureScreen from "../screens/PhotoCaptureScreen";
import ARMeasurementScreen from "../screens/ARMeasurementScreen";
import VoiceNotesScreen from "../screens/VoiceNotesScreen";
import SketchPadScreen from "../screens/SketchPadScreen";
import FieldDataVerificationScreen from "../screens/FieldDataVerificationScreen";
import ReportsListScreen from "../screens/ReportsListScreen";
import ReportDetailScreen from "../screens/ReportDetailScreen";
import ReportGenerationScreen from "../screens/ReportGenerationScreen";
import ComplianceDocumentsScreen from "../screens/ComplianceDocumentsScreen";
import SettingsHomeScreen from "../screens/SettingsHomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
import AppSettingsScreen from "../screens/AppSettingsScreen";
import OfflineScreen from "../screens/OfflineScreen";
import CollaborationScreen from "../screens/CollaborationScreen";
import ExternalDataScreen from "../screens/ExternalDataScreen";
import SupportScreen from "../screens/SupportScreen";

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const PropertiesStack = createStackNavigator<PropertiesStackParamList>();
const InspectionStack = createStackNavigator<InspectionStackParamList>();
const ReportsStack = createStackNavigator<ReportsStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Dashboard stack navigator
const DashboardStackNavigator = () => {
  return (
    <DashboardStack.Navigator
      initialRouteName="DashboardHome"
      screenOptions={{ headerShown: false }}
    >
      <DashboardStack.Screen name="DashboardHome" component={DashboardHomeScreen} />
      <DashboardStack.Screen name="Notifications" component={DashboardHomeScreen} />
      <DashboardStack.Screen name="Tasks" component={DashboardHomeScreen} />
    </DashboardStack.Navigator>
  );
};

// Properties stack navigator
const PropertiesStackNavigator = () => {
  return (
    <PropertiesStack.Navigator
      initialRouteName="PropertiesList"
      screenOptions={{ headerShown: false }}
    >
      <PropertiesStack.Screen name="PropertiesList" component={PropertiesListScreen} />
      <PropertiesStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <PropertiesStack.Screen name="PropertyEdit" component={PropertyEditScreen} />
      <PropertiesStack.Screen name="AddProperty" component={AddPropertyScreen} />
      <PropertiesStack.Screen name="PropertySearch" component={PropertySearchScreen} />
      <PropertiesStack.Screen name="ComparableSearch" component={ComparableSearchScreen} />
      <PropertiesStack.Screen name="PropertyMapView" component={PropertyMapViewScreen} />
      <PropertiesStack.Screen
        name="PropertyComparisonDashboard"
        component={PropertyComparisonDashboard}
      />
    </PropertiesStack.Navigator>
  );
};

// Inspection stack navigator
const InspectionStackNavigator = () => {
  return (
    <InspectionStack.Navigator
      initialRouteName="InspectionList"
      screenOptions={{ headerShown: false }}
    >
      <InspectionStack.Screen name="InspectionList" component={InspectionListScreen} />
      <InspectionStack.Screen name="InspectionDetail" component={InspectionDetailScreen} />
      <InspectionStack.Screen name="PhotoCapture" component={PhotoCaptureScreen} />
      <InspectionStack.Screen name="ARMeasurement" component={ARMeasurementScreen} />
      <InspectionStack.Screen name="VoiceNotes" component={VoiceNotesScreen} />
      <InspectionStack.Screen name="SketchPad" component={SketchPadScreen} />
      <InspectionStack.Screen
        name="FieldDataVerification"
        component={FieldDataVerificationScreen}
      />
    </InspectionStack.Navigator>
  );
};

// Reports stack navigator
const ReportsStackNavigator = () => {
  return (
    <ReportsStack.Navigator initialRouteName="ReportsList" screenOptions={{ headerShown: false }}>
      <ReportsStack.Screen name="ReportsList" component={ReportsListScreen} />
      <ReportsStack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <ReportsStack.Screen name="ReportGeneration" component={ReportGenerationScreen} />
      <ReportsStack.Screen name="ComplianceDocuments" component={ComplianceDocumentsScreen} />
    </ReportsStack.Navigator>
  );
};

// Settings stack navigator
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator initialRouteName="SettingsHome" screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <SettingsStack.Screen name="Profile" component={ProfileScreen} />
      <SettingsStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <SettingsStack.Screen name="AppSettings" component={AppSettingsScreen} />
      <SettingsStack.Screen name="Offline" component={OfflineScreen} />
      <SettingsStack.Screen name="Collaboration" component={CollaborationScreen} />
      <SettingsStack.Screen name="ExternalData" component={ExternalDataScreen} />
      <SettingsStack.Screen name="Support" component={SupportScreen} />
    </SettingsStack.Navigator>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = "home";

          if (route.name === "Dashboard") {
            iconName = focused ? "view-dashboard" : "view-dashboard-outline";
          } else if (route.name === "Properties") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Reports") {
            iconName = focused ? "file-document" : "file-document-outline";
          } else if (route.name === "Inspection") {
            iconName = focused ? "clipboard-check" : "clipboard-check-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "cog" : "cog-outline";
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
        },
      })}
    >
      <MainTab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <MainTab.Screen name="Properties" component={PropertiesStackNavigator} />
      <MainTab.Screen name="Inspection" component={InspectionStackNavigator} />
      <MainTab.Screen name="Reports" component={ReportsStackNavigator} />
      <MainTab.Screen name="Settings" component={SettingsStackNavigator} />
    </MainTab.Navigator>
  );
};

// Root stack navigator
const RootStackNavigator = () => {
  return (
    <RootStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Main" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
};

export default RootStackNavigator;
