import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Property,
  AppraisalReport,
  Comparable,
  Adjustment,
  Photo,
  Sketch,
  ComplianceCheck,
  InsertProperty,
  InsertAppraisalReport,
  InsertComparable,
  InsertAdjustment,
  InsertPhoto,
  InsertSketch,
  InsertComplianceCheck,
} from "@shared/schema";
import { apiRequest } from "../lib/queryClient";

// Define Context types
type SyncStatus = "synced" | "syncing" | "error";

interface AppraisalContextType {
  currentUser: User | null;
  currentReport: AppraisalReport | null;
  currentProperty: Property | null;
  properties: Property[];
  reports: AppraisalReport[];
  comparables: Comparable[];
  adjustments: Adjustment[];
  photos: Photo[];
  sketches: Sketch[];
  complianceChecks: ComplianceCheck[];
  syncStatus: SyncStatus;
  syncError: string | null;

  // Actions
  login: (username: string, password: string) => Promise<User>;
  loadReport: (reportId: number) => Promise<void>;
  createReport: (report: InsertAppraisalReport) => Promise<AppraisalReport>;
  updateReport: (id: number, data: Partial<AppraisalReport>) => Promise<AppraisalReport>;
  createProperty: (property: InsertProperty) => Promise<Property>;
  updateProperty: (id: number, data: Partial<Property>) => Promise<Property>;
  createComparable: (comparable: InsertComparable) => Promise<Comparable>;
  updateComparable: (id: number, data: Partial<Comparable>) => Promise<Comparable>;
  createAdjustment: (adjustment: InsertAdjustment) => Promise<Adjustment>;
  updateAdjustment: (id: number, data: Partial<Adjustment>) => Promise<Adjustment>;
  createPhoto: (photo: InsertPhoto) => Promise<Photo>;
  updatePhoto: (id: number, data: Partial<Photo>) => Promise<Photo>;
  createSketch: (sketch: InsertSketch) => Promise<Sketch>;
  updateSketch: (id: number, data: Partial<Sketch>) => Promise<Sketch>;
  validateCompliance: (reportId: number, ruleTypes?: string[]) => Promise<ComplianceCheck[]>;
  generatePDF: (reportId: number) => Promise<Blob>;
  generateXML: (reportId: number) => Promise<string>;
}

// Create the context
const AppraisalContext = createContext<AppraisalContextType | undefined>(undefined);

// Provide a hook for using the context
export function useAppraisal() {
  const context = useContext(AppraisalContext);
  if (context === undefined) {
    throw new Error("useAppraisal must be used within an AppraisalProvider");
  }
  return context;
}

// Provider component
interface AppraisalProviderProps {
  children: ReactNode;
}

export function AppraisalProvider({ children }: AppraisalProviderProps) {
  const queryClient = useQueryClient();

  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentReport, setCurrentReport] = useState<AppraisalReport | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [syncError, setSyncError] = useState<string | null>(null);

  // For demo purposes, let's set a default user
  useEffect(() => {
    // In a real app, this would come from auth/session
    setCurrentUser({
      id: 1,
      username: "demo",
      password: "password", // NOTE: Don't include password in a real app!
      fullName: "John Appraiser",
      company: "ABC Appraisal",
      licenseNumber: "AP12345",
      email: "john@abcappraisal.com",
      phoneNumber: "555-123-4567",
    });
  }, []);

  // Queries
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await fetch(`/api/properties?userId=${currentUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const { data: reports = [] } = useQuery<AppraisalReport[]>({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await fetch(`/api/reports?userId=${currentUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const { data: comparables = [] } = useQuery<Comparable[]>({
    queryKey: ["/api/comparables"],
    queryFn: async () => {
      if (!currentReport) return [];
      const res = await fetch(`/api/reports/${currentReport.id}/comparables`);
      if (!res.ok) throw new Error("Failed to fetch comparables");
      return res.json();
    },
    enabled: !!currentReport,
  });

  const { data: adjustments = [] } = useQuery<Adjustment[]>({
    queryKey: ["/api/adjustments"],
    queryFn: async () => {
      if (!currentReport || comparables.length === 0) return [];

      // Get adjustments for each comparable
      const allAdjustments: Adjustment[] = [];
      for (const comp of comparables) {
        const res = await fetch(`/api/comparables/${comp.id}/adjustments`);
        if (!res.ok) throw new Error(`Failed to fetch adjustments for comparable ${comp.id}`);
        const compAdjustments = await res.json();
        allAdjustments.push(...compAdjustments);
      }

      return allAdjustments;
    },
    enabled: !!currentReport && comparables.length > 0,
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
    queryFn: async () => {
      if (!currentReport) return [];
      const res = await fetch(`/api/reports/${currentReport.id}/photos`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
    enabled: !!currentReport,
  });

  const { data: sketches = [] } = useQuery<Sketch[]>({
    queryKey: ["/api/sketches"],
    queryFn: async () => {
      if (!currentReport) return [];
      const res = await fetch(`/api/reports/${currentReport.id}/sketches`);
      if (!res.ok) throw new Error("Failed to fetch sketches");
      return res.json();
    },
    enabled: !!currentReport,
  });

  const { data: complianceChecks = [] } = useQuery<ComplianceCheck[]>({
    queryKey: ["/api/compliance"],
    queryFn: async () => {
      if (!currentReport) return [];
      const res = await fetch(`/api/reports/${currentReport.id}/compliance`);
      if (!res.ok) throw new Error("Failed to fetch compliance checks");
      return res.json();
    },
    enabled: !!currentReport,
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return await res.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (property: InsertProperty) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/properties", property);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Property> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/properties/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      if (currentProperty && currentProperty.id === data.id) {
        setCurrentProperty(data);
      }
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: InsertAppraisalReport) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/reports", report);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AppraisalReport> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/reports/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      if (currentReport && currentReport.id === data.id) {
        setCurrentReport(data);
      }
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const createComparableMutation = useMutation({
    mutationFn: async (comparable: InsertComparable) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/comparables", comparable);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/comparables"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updateComparableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Comparable> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/comparables/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comparables"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async (adjustment: InsertAdjustment) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/adjustments", adjustment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustments"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updateAdjustmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Adjustment> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/adjustments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adjustments"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (photo: InsertPhoto) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/photos", photo);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Photo> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/photos/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const createSketchMutation = useMutation({
    mutationFn: async (sketch: InsertSketch) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", "/api/sketches", sketch);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sketches"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const updateSketchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Sketch> }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("PUT", `/api/sketches/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sketches"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  const validateComplianceMutation = useMutation({
    mutationFn: async ({ reportId, ruleTypes }: { reportId: number; ruleTypes?: string[] }) => {
      setSyncStatus("syncing");
      const res = await apiRequest("POST", `/api/reports/${reportId}/validate-compliance`, {
        ruleTypes,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance"] });
      setSyncStatus("synced");
    },
    onError: (error) => {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    },
  });

  // Function to load a specific report and its related data
  async function loadReport(reportId: number) {
    try {
      // Fetch the report
      const reportRes = await fetch(`/api/reports/${reportId}`);
      if (!reportRes.ok) throw new Error("Failed to fetch report");
      const report = await reportRes.json();
      setCurrentReport(report);

      // Fetch the associated property
      const propertyRes = await fetch(`/api/properties/${report.propertyId}`);
      if (!propertyRes.ok) throw new Error("Failed to fetch property");
      const property = await propertyRes.json();
      setCurrentProperty(property);

      // The other related data (comparables, adjustments, etc.)
      // will be fetched automatically via the useQuery hooks
    } catch (error) {
      console.error("Error loading report:", error);
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Function to generate PDF
  async function generatePDF(reportId: number): Promise<Blob> {
    setSyncStatus("syncing");
    try {
      const res = await fetch(`/api/reports/${reportId}/generate-pdf`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      setSyncStatus("synced");
      return blob;
    } catch (error) {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }

  // Function to generate XML
  async function generateXML(reportId: number): Promise<string> {
    setSyncStatus("syncing");
    try {
      const res = await fetch(`/api/reports/${reportId}/generate-xml`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate XML");

      const text = await res.text();
      setSyncStatus("synced");
      return text;
    } catch (error) {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }

  // Context value
  const value: AppraisalContextType = {
    currentUser,
    currentReport,
    currentProperty,
    properties,
    reports,
    comparables,
    adjustments,
    photos,
    sketches,
    complianceChecks,
    syncStatus,
    syncError,

    login: (username, password) => loginMutation.mutateAsync({ username, password }),
    loadReport,
    createProperty: (property) => createPropertyMutation.mutateAsync(property),
    updateProperty: (id, data) => updatePropertyMutation.mutateAsync({ id, data }),
    createReport: (report) => createReportMutation.mutateAsync(report),
    updateReport: (id, data) => updateReportMutation.mutateAsync({ id, data }),
    createComparable: (comparable) => createComparableMutation.mutateAsync(comparable),
    updateComparable: (id, data) => updateComparableMutation.mutateAsync({ id, data }),
    createAdjustment: (adjustment) => createAdjustmentMutation.mutateAsync(adjustment),
    updateAdjustment: (id, data) => updateAdjustmentMutation.mutateAsync({ id, data }),
    createPhoto: (photo) => createPhotoMutation.mutateAsync(photo),
    updatePhoto: (id, data) => updatePhotoMutation.mutateAsync({ id, data }),
    createSketch: (sketch) => createSketchMutation.mutateAsync(sketch),
    updateSketch: (id, data) => updateSketchMutation.mutateAsync({ id, data }),
    validateCompliance: (reportId, ruleTypes) =>
      validateComplianceMutation.mutateAsync({ reportId, ruleTypes }),
    generatePDF,
    generateXML,
  };

  return <AppraisalContext.Provider value={value}>{children}</AppraisalContext.Provider>;
}
