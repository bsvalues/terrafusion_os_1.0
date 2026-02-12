/**
 * Navigation types for the TerraField Mobile app
 */

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Properties: undefined;
  Reports: undefined;
  Inspection: undefined;
  Settings: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Notifications: undefined;
  Tasks: undefined;
};

export type PropertiesStackParamList = {
  PropertiesList: undefined;
  PropertyDetail: { propertyId: string };
  PropertyEdit: { propertyId: string };
  AddProperty: undefined;
  PropertySearch: undefined;
  ComparableSearch: { propertyId: string };
  PropertyMapView: undefined;
  PropertyComparisonDashboard: { propertyId: string };
};

export type InspectionStackParamList = {
  InspectionList: undefined;
  InspectionDetail: { inspectionId: string };
  PhotoCapture: { inspectionId: string };
  ARMeasurement: { inspectionId: string; roomId?: string };
  VoiceNotes: { inspectionId: string };
  SketchPad: { inspectionId: string };
  FieldDataVerification: { propertyId: string };
};

export type ReportsStackParamList = {
  ReportsList: undefined;
  ReportDetail: { reportId: string };
  ReportGeneration: { propertyId: string };
  ComplianceDocuments: { propertyId: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  AccountSettings: undefined;
  AppSettings: undefined;
  Offline: undefined;
  Collaboration: undefined;
  ExternalData: undefined;
  Support: undefined;
};
