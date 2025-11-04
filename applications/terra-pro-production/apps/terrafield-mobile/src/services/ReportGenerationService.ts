import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";

/**
 * Report template type
 */
export enum TemplateType {
  URAR = "urar", // Uniform Residential Appraisal Report
  CONDO = "condo", // Individual Condominium Unit Appraisal Report
  LAND = "land", // Land Appraisal Report
  INCOME = "income", // Small Residential Income Property Appraisal Report
  FARM = "farm", // Agricultural Property Report
  FHA = "fha", // FHA/VA Residential Appraisal Report
  COMMERCIAL = "commercial", // Commercial Appraisal Report
  CUSTOM = "custom", // Custom Template
}

/**
 * Report format type
 */
export enum ReportFormat {
  PDF = "pdf",
  DOCX = "docx",
  XML = "xml",
  JSON = "json",
  MISMO = "mismo", // Mortgage Industry Standards Maintenance Organization format
}

/**
 * Report status type
 */
export enum ReportStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  COMPLETE = "complete",
  SUBMITTED = "submitted",
  REVIEWED = "reviewed",
  APPROVED = "approved",
  REJECTED = "rejected",
}

/**
 * Report template interface
 */
export interface ReportTemplate {
  /**
   * Template ID
   */
  id: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Template type
   */
  type: TemplateType;

  /**
   * Template description
   */
  description: string;

  /**
   * Template version
   */
  version: string;

  /**
   * Template content (HTML or JSON structure)
   */
  content: string;

  /**
   * Template CSS styles
   */
  styles?: string;

  /**
   * Template scripts
   */
  scripts?: string;

  /**
   * Template metadata
   */
  metadata?: Record<string, any>;

  /**
   * Template created timestamp
   */
  createdAt: number;

  /**
   * Template updated timestamp
   */
  updatedAt: number;

  /**
   * Creator user ID
   */
  createdBy?: string;

  /**
   * Whether template is pre-loaded
   */
  preloaded: boolean;

  /**
   * Whether template is organization-specific
   */
  organizationSpecific: boolean;
}

/**
 * Report section interface
 */
export interface ReportSection {
  /**
   * Section ID
   */
  id: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Section type
   */
  type: string;

  /**
   * Section content
   */
  content: any;

  /**
   * Section order
   */
  order: number;

  /**
   * Whether section is required
   */
  required: boolean;

  /**
   * Whether section is completed
   */
  completed: boolean;

  /**
   * Parent section ID
   */
  parentId?: string;

  /**
   * Section metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Appraisal report interface
 */
export interface AppraisalReport {
  /**
   * Report ID
   */
  id: string;

  /**
   * Property ID
   */
  propertyId: string;

  /**
   * Template ID
   */
  templateId: string;

  /**
   * Template type
   */
  templateType: TemplateType;

  /**
   * Report title
   */
  title: string;

  /**
   * Report status
   */
  status: ReportStatus;

  /**
   * Report sections
   */
  sections: ReportSection[];

  /**
   * Report data (key-value pairs)
   */
  data: Record<string, any>;

  /**
   * Completion percentage
   */
  completionPercentage: number;

  /**
   * Validation issues
   */
  validationIssues?: {
    sectionId: string;
    issues: string[];
  }[];

  /**
   * Report created timestamp
   */
  createdAt: number;

  /**
   * Report updated timestamp
   */
  updatedAt: number;

  /**
   * Creator user ID
   */
  createdBy: string;

  /**
   * Appraiser's name
   */
  appraiserName: string;

  /**
   * Appraiser's license number
   */
  appraiserLicenseNumber?: string;

  /**
   * Client name
   */
  clientName?: string;

  /**
   * Lender name
   */
  lenderName?: string;

  /**
   * Intended use
   */
  intendedUse?: string;

  /**
   * Effective date
   */
  effectiveDate?: string;

  /**
   * Report date
   */
  reportDate?: string;

  /**
   * File number
   */
  fileNumber?: string;

  /**
   * Case number
   */
  caseNumber?: string;

  /**
   * Signature URL/data
   */
  signature?: string;

  /**
   * Digital signature/certification
   */
  digitalSignature?: {
    signedBy: string;
    timestamp: number;
    certificate: string;
  };

  /**
   * Generated file URLs
   */
  files?: {
    format: ReportFormat;
    url: string;
    size: number;
    generatedAt: number;
  }[];
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  /**
   * Template ID or type
   */
  templateIdOrType: string;

  /**
   * Property ID
   */
  propertyId: string;

  /**
   * Output formats
   */
  formats: ReportFormat[];

  /**
   * Whether to include photos
   */
  includePhotos: boolean;

  /**
   * Whether to include sketches
   */
  includeSketches: boolean;

  /**
   * Whether to include maps
   */
  includeMaps: boolean;

  /**
   * Whether to include addenda
   */
  includeAddenda: boolean;

  /**
   * Whether to compress the output
   */
  compressOutput: boolean;

  /**
   * Whether to include digital signature
   */
  includeDigitalSignature: boolean;

  /**
   * Additional sections to include
   */
  additionalSections?: string[];

  /**
   * Report metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Default report generation options
 */
const DEFAULT_OPTIONS: ReportGenerationOptions = {
  templateIdOrType: TemplateType.URAR,
  propertyId: "",
  formats: [ReportFormat.PDF],
  includePhotos: true,
  includeSketches: true,
  includeMaps: true,
  includeAddenda: true,
  compressOutput: true,
  includeDigitalSignature: false,
  additionalSections: [],
};

/**
 * Report generation result interface
 */
export interface ReportGenerationResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * Generated report ID
   */
  reportId: string;

  /**
   * Generated files
   */
  files: {
    format: ReportFormat;
    url: string;
    size: number;
  }[];

  /**
   * Generation timestamp
   */
  timestamp: number;

  /**
   * Processing time in milliseconds
   */
  processingTime?: number;

  /**
   * Whether the report was generated locally
   */
  generatedLocally: boolean;

  /**
   * Completion percentage
   */
  completionPercentage: number;

  /**
   * Validation issues
   */
  validationIssues?: {
    sectionId: string;
    issues: string[];
  }[];
}

/**
 * ReportGenerationService
 *
 * Service for generating appraisal reports
 */
export class ReportGenerationService {
  private static instance: ReportGenerationService;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;
  private offlineQueueService: OfflineQueueService;

  // Template and report caches
  private templateCache: Map<string, ReportTemplate> = new Map();
  private reportCache: Map<string, AppraisalReport> = new Map();

  // Directories
  private readonly REPORTS_DIRECTORY = `${FileSystem.documentDirectory}reports/`;
  private readonly TEMPLATES_DIRECTORY = `${FileSystem.documentDirectory}templates/`;

  // API endpoints
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/reports";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();

    // Ensure directories exist
    this.ensureDirectories();

    // Load templates and report cache
    this.loadTemplatesCache();
    this.loadReportsCache();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ReportGenerationService {
    if (!ReportGenerationService.instance) {
      ReportGenerationService.instance = new ReportGenerationService();
    }
    return ReportGenerationService.instance;
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      // Check if reports directory exists
      const reportsDirInfo = await FileSystem.getInfoAsync(this.REPORTS_DIRECTORY);
      if (!reportsDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.REPORTS_DIRECTORY, { intermediates: true });
      }

      // Check if templates directory exists
      const templatesDirInfo = await FileSystem.getInfoAsync(this.TEMPLATES_DIRECTORY);
      if (!templatesDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.TEMPLATES_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error("Error ensuring directories:", error);
    }
  }

  /**
   * Load templates cache
   */
  private async loadTemplatesCache(): Promise<void> {
    try {
      // Load templates from secure storage
      const templates = await this.secureStorageService.getData<ReportTemplate[]>(
        "terrafield:report:templates",
        [],
        SecurityLevel.MEDIUM
      );

      // Populate cache
      for (const template of templates) {
        this.templateCache.set(template.id, template);
      }

      // Load preloaded templates if cache is empty
      if (this.templateCache.size === 0) {
        await this.loadPreloadedTemplates();
      }
    } catch (error) {
      console.error("Error loading templates cache:", error);
    }
  }

  /**
   * Load reports cache
   */
  private async loadReportsCache(): Promise<void> {
    try {
      // Load reports from secure storage
      const reports = await this.secureStorageService.getData<AppraisalReport[]>(
        "terrafield:report:reports",
        [],
        SecurityLevel.MEDIUM
      );

      // Populate cache
      for (const report of reports) {
        this.reportCache.set(report.id, report);
      }
    } catch (error) {
      console.error("Error loading reports cache:", error);
    }
  }

  /**
   * Load preloaded templates
   */
  private async loadPreloadedTemplates(): Promise<void> {
    try {
      // Default templates
      const defaultTemplates: ReportTemplate[] = [
        {
          id: "template_urar",
          name: "Uniform Residential Appraisal Report",
          type: TemplateType.URAR,
          description: "Standard URAR form for single-family residential properties",
          version: "1.0.0",
          content: "", // Template content would be loaded from a file
          preloaded: true,
          organizationSpecific: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "template_condo",
          name: "Individual Condominium Unit Appraisal Report",
          type: TemplateType.CONDO,
          description: "Standard form for condominium unit appraisals",
          version: "1.0.0",
          content: "", // Template content would be loaded from a file
          preloaded: true,
          organizationSpecific: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "template_land",
          name: "Land Appraisal Report",
          type: TemplateType.LAND,
          description: "Standard form for vacant land appraisals",
          version: "1.0.0",
          content: "", // Template content would be loaded from a file
          preloaded: true,
          organizationSpecific: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Add to cache
      for (const template of defaultTemplates) {
        this.templateCache.set(template.id, template);
      }

      // Save to secure storage
      await this.secureStorageService.saveData(
        "terrafield:report:templates",
        Array.from(this.templateCache.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error loading preloaded templates:", error);
    }
  }

  /**
   * Save templates cache
   */
  private async saveTemplatesCache(): Promise<void> {
    try {
      await this.secureStorageService.saveData(
        "terrafield:report:templates",
        Array.from(this.templateCache.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving templates cache:", error);
    }
  }

  /**
   * Save reports cache
   */
  private async saveReportsCache(): Promise<void> {
    try {
      await this.secureStorageService.saveData(
        "terrafield:report:reports",
        Array.from(this.reportCache.values()),
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving reports cache:", error);
    }
  }

  /**
   * Generate report
   */
  public async generateReport(
    options: Partial<ReportGenerationOptions> = {}
  ): Promise<ReportGenerationResult> {
    try {
      const startTime = Date.now();

      // Merge options with defaults
      const mergedOptions: ReportGenerationOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Validate options
      if (!mergedOptions.propertyId) {
        throw new Error("Property ID is required");
      }

      // Check network availability
      const networkInfo = await NetInfo.fetch();
      const isOnline = networkInfo.isConnected;

      // Use online generation if available
      if (isOnline) {
        try {
          return await this.generateReportOnline(mergedOptions, startTime);
        } catch (error) {
          console.warn("Online report generation failed, falling back to offline:", error);
          // Fall back to offline generation
        }
      }

      // Offline generation
      return await this.generateReportOffline(mergedOptions, startTime);
    } catch (error) {
      console.error("Error generating report:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error generating report",
        reportId: "",
        files: [],
        timestamp: Date.now(),
        generatedLocally: true,
        completionPercentage: 0,
      };
    }
  }

  /**
   * Generate report online
   */
  private async generateReportOnline(
    options: ReportGenerationOptions,
    startTime: number
  ): Promise<ReportGenerationResult> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required for online report generation");
      }

      // Get report data
      const reportData = await this.getReportData(options.propertyId);

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...options,
          reportData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate report online");
      }

      // Get report generation result
      const responseData = await response.json();

      // Get files
      const files = [];
      for (const file of responseData.files) {
        // Download file
        const fileExt = file.format.toLowerCase();
        const fileName = `report_${responseData.reportId}_${Date.now()}.${fileExt}`;
        const localUri = `${this.REPORTS_DIRECTORY}${fileName}`;

        await FileSystem.downloadAsync(file.url, localUri);

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(localUri, { size: true });

        files.push({
          format: file.format,
          url: localUri,
          size: fileInfo.size || 0,
        });
      }

      // Create report object
      const report: AppraisalReport = {
        id: responseData.reportId,
        propertyId: options.propertyId,
        templateId:
          typeof options.templateIdOrType === "string"
            ? options.templateIdOrType
            : `template_${options.templateIdOrType}`,
        templateType:
          typeof options.templateIdOrType === "string"
            ? this.templateCache.get(options.templateIdOrType)?.type || TemplateType.URAR
            : (options.templateIdOrType as TemplateType),
        title: reportData.propertyAddress || "Appraisal Report",
        status: ReportStatus.COMPLETE,
        sections: responseData.sections || [],
        data: reportData,
        completionPercentage: 100,
        validationIssues: responseData.validationIssues,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: (await this.authService.getUserId()) || "unknown",
        appraiserName: (await this.authService.getUserDisplayName()) || "Unknown Appraiser",
        appraiserLicenseNumber: reportData.appraiserLicenseNumber,
        clientName: reportData.clientName,
        lenderName: reportData.lenderName,
        intendedUse: reportData.intendedUse,
        effectiveDate: reportData.effectiveDate,
        reportDate: new Date().toISOString().split("T")[0],
        fileNumber: reportData.fileNumber,
        caseNumber: reportData.caseNumber,
        files: files.map((file) => ({
          format: file.format,
          url: file.url,
          size: file.size,
          generatedAt: Date.now(),
        })),
      };

      // Save to cache
      this.reportCache.set(report.id, report);
      await this.saveReportsCache();

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        reportId: report.id,
        files,
        timestamp: Date.now(),
        processingTime,
        generatedLocally: false,
        completionPercentage: 100,
        validationIssues: responseData.validationIssues,
      };
    } catch (error) {
      console.error("Error generating report online:", error);
      throw error;
    }
  }

  /**
   * Generate report offline
   */
  private async generateReportOffline(
    options: ReportGenerationOptions,
    startTime: number
  ): Promise<ReportGenerationResult> {
    try {
      // Get template
      let template: ReportTemplate | undefined;

      if (
        typeof options.templateIdOrType === "string" &&
        options.templateIdOrType.startsWith("template_")
      ) {
        // Get by ID
        template = this.templateCache.get(options.templateIdOrType);
      } else {
        // Get by type
        const templateType = options.templateIdOrType as TemplateType;
        template = Array.from(this.templateCache.values()).find((t) => t.type === templateType);
      }

      if (!template) {
        throw new Error("Template not found");
      }

      // Get report data
      const reportData = await this.getReportData(options.propertyId);

      // Generate report ID
      const reportId = `report_${uuidv4()}`;

      // Create report file paths
      const files = [];

      for (const format of options.formats) {
        const fileExt = format.toLowerCase();
        const fileName = `report_${reportId}_${Date.now()}.${fileExt}`;
        const filePath = `${this.REPORTS_DIRECTORY}${fileName}`;

        // For offline generation, create a simple placeholder file
        // In a real implementation, this would use a PDF generation library
        // or other document generation logic
        const placeholderContent = `
          OFFLINE GENERATED APPRAISAL REPORT
          
          Property ID: ${options.propertyId}
          Template: ${template.name}
          Date: ${new Date().toLocaleString()}
          
          This report was generated offline and will be fully processed when online.
        `;

        await FileSystem.writeAsStringAsync(filePath, placeholderContent);

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });

        files.push({
          format,
          url: filePath,
          size: fileInfo.size || 0,
        });
      }

      // Create report object
      const report: AppraisalReport = {
        id: reportId,
        propertyId: options.propertyId,
        templateId: template.id,
        templateType: template.type,
        title: reportData.propertyAddress || "Appraisal Report",
        status: ReportStatus.DRAFT,
        sections: [],
        data: reportData,
        completionPercentage: 50, // Partial completion for offline generation
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: (await this.authService.getUserId()) || "unknown",
        appraiserName: (await this.authService.getUserDisplayName()) || "Unknown Appraiser",
        appraiserLicenseNumber: reportData.appraiserLicenseNumber,
        clientName: reportData.clientName,
        lenderName: reportData.lenderName,
        intendedUse: reportData.intendedUse,
        effectiveDate: reportData.effectiveDate,
        reportDate: new Date().toISOString().split("T")[0],
        fileNumber: reportData.fileNumber,
        caseNumber: reportData.caseNumber,
        files: files.map((file) => ({
          format: file.format,
          url: file.url,
          size: file.size,
          generatedAt: Date.now(),
        })),
      };

      // Save to cache
      this.reportCache.set(report.id, report);
      await this.saveReportsCache();

      // Queue for online generation when network is available
      await this.offlineQueueService.enqueue(
        OperationType.GENERATE_REPORT,
        {
          reportId,
          options,
        },
        2 // Medium priority
      );

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        reportId,
        files,
        timestamp: Date.now(),
        processingTime,
        generatedLocally: true,
        completionPercentage: 50,
      };
    } catch (error) {
      console.error("Error generating report offline:", error);
      throw error;
    }
  }

  /**
   * Get report data based on property ID
   */
  private async getReportData(propertyId: string): Promise<Record<string, any>> {
    try {
      // In a real app, this would fetch property data, photos, comparable sales, etc.
      // For this example, we'll use placeholder data
      return {
        propertyId,
        propertyAddress: "123 Main St",
        propertyCity: "Anytown",
        propertyState: "CA",
        propertyZip: "90210",
        propertyType: "Single Family",
        squareFootage: 2000,
        lotSize: 5000,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2000,
        appraiserName: (await this.authService.getUserDisplayName()) || "Unknown Appraiser",
        appraiserLicenseNumber: "ABC12345",
        clientName: "Sample Client",
        lenderName: "Sample Lender",
        intendedUse: "Purchase Financing",
        effectiveDate: new Date().toISOString().split("T")[0],
        fileNumber: `FILE-${Date.now().toString().slice(-6)}`,
        caseNumber: `CASE-${Date.now().toString().slice(-6)}`,
      };
    } catch (error) {
      console.error("Error getting report data:", error);
      return { propertyId };
    }
  }

  /**
   * Get templates
   */
  public async getTemplates(): Promise<ReportTemplate[]> {
    try {
      // Refresh templates from server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.fetchTemplatesFromServer();
        } catch (error) {
          console.warn("Failed to fetch templates from server:", error);
        }
      }

      return Array.from(this.templateCache.values());
    } catch (error) {
      console.error("Error getting templates:", error);
      return Array.from(this.templateCache.values());
    }
  }

  /**
   * Fetch templates from server
   */
  private async fetchTemplatesFromServer(): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to fetch templates");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/templates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch templates");
      }

      // Get templates
      const responseData = await response.json();
      const templates: ReportTemplate[] = responseData.templates || [];

      // Update cache
      for (const template of templates) {
        this.templateCache.set(template.id, template);
      }

      // Save to secure storage
      await this.saveTemplatesCache();
    } catch (error) {
      console.error("Error fetching templates from server:", error);
      throw error;
    }
  }

  /**
   * Get reports
   */
  public async getReports(propertyId?: string): Promise<AppraisalReport[]> {
    try {
      const reports = Array.from(this.reportCache.values());

      if (propertyId) {
        return reports.filter((report) => report.propertyId === propertyId);
      }

      return reports;
    } catch (error) {
      console.error("Error getting reports:", error);
      return [];
    }
  }

  /**
   * Get report by ID
   */
  public async getReport(reportId: string): Promise<AppraisalReport | null> {
    try {
      return this.reportCache.get(reportId) || null;
    } catch (error) {
      console.error("Error getting report:", error);
      return null;
    }
  }

  /**
   * Delete report
   */
  public async deleteReport(reportId: string): Promise<boolean> {
    try {
      const report = this.reportCache.get(reportId);

      if (!report) {
        return false;
      }

      // Delete report files
      if (report.files) {
        for (const file of report.files) {
          try {
            await FileSystem.deleteAsync(file.url, { idempotent: true });
          } catch (error) {
            console.warn(`Error deleting report file ${file.url}:`, error);
          }
        }
      }

      // Remove from cache
      this.reportCache.delete(reportId);
      await this.saveReportsCache();

      // Delete from server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.deleteReportFromServer(reportId);
        } catch (error) {
          console.warn("Failed to delete report from server:", error);
        }
      } else {
        // Queue for deletion when online
        await this.offlineQueueService.enqueue(
          OperationType.DELETE_REPORT,
          { reportId },
          1 // Low priority
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting report:", error);
      return false;
    }
  }

  /**
   * Delete report from server
   */
  private async deleteReportFromServer(reportId: string): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to delete report");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report from server:", error);
      throw error;
    }
  }

  /**
   * Update report status
   */
  public async updateReportStatus(reportId: string, status: ReportStatus): Promise<boolean> {
    try {
      const report = this.reportCache.get(reportId);

      if (!report) {
        return false;
      }

      // Update status
      report.status = status;
      report.updatedAt = Date.now();

      // Save to cache
      this.reportCache.set(reportId, report);
      await this.saveReportsCache();

      // Update on server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.updateReportOnServer(reportId, { status });
        } catch (error) {
          console.warn("Failed to update report status on server:", error);
        }
      } else {
        // Queue for update when online
        await this.offlineQueueService.enqueue(
          OperationType.UPDATE_REPORT,
          { reportId, updates: { status } },
          2 // Medium priority
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating report status:", error);
      return false;
    }
  }

  /**
   * Update report on server
   */
  private async updateReportOnServer(
    reportId: string,
    updates: Partial<AppraisalReport>
  ): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to update report");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/${reportId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update report");
      }
    } catch (error) {
      console.error("Error updating report on server:", error);
      throw error;
    }
  }

  /**
   * Sign report
   */
  public async signReport(reportId: string, signatureData: string): Promise<boolean> {
    try {
      const report = this.reportCache.get(reportId);

      if (!report) {
        return false;
      }

      // Update signature
      report.signature = signatureData;
      report.updatedAt = Date.now();

      // Add digital signature if supported
      if (await this.authService.hasDigitalSignatureSupport()) {
        try {
          const digitalSignature = await this.authService.createDigitalSignature(reportId);

          if (digitalSignature) {
            report.digitalSignature = {
              signedBy: (await this.authService.getUserDisplayName()) || "Unknown",
              timestamp: Date.now(),
              certificate: digitalSignature,
            };
          }
        } catch (error) {
          console.warn("Failed to create digital signature:", error);
        }
      }

      // Save to cache
      this.reportCache.set(reportId, report);
      await this.saveReportsCache();

      // Update on server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.updateReportOnServer(reportId, {
            signature: report.signature,
            digitalSignature: report.digitalSignature,
          });
        } catch (error) {
          console.warn("Failed to update report signature on server:", error);
        }
      } else {
        // Queue for update when online
        await this.offlineQueueService.enqueue(
          OperationType.UPDATE_REPORT,
          {
            reportId,
            updates: {
              signature: report.signature,
              digitalSignature: report.digitalSignature,
            },
          },
          2 // Medium priority
        );
      }

      return true;
    } catch (error) {
      console.error("Error signing report:", error);
      return false;
    }
  }

  /**
   * Share report
   */
  public async shareReport(
    reportId: string,
    format: ReportFormat = ReportFormat.PDF
  ): Promise<string> {
    try {
      const report = this.reportCache.get(reportId);

      if (!report || !report.files) {
        throw new Error("Report not found or has no files");
      }

      // Find file with matching format
      const file = report.files.find((f) => f.format === format);

      if (!file) {
        throw new Error(`Report file with format ${format} not found`);
      }

      return file.url;
    } catch (error) {
      console.error("Error sharing report:", error);
      throw error;
    }
  }

  /**
   * Validate report data
   */
  public async validateReportData(
    reportId: string
  ): Promise<{ valid: boolean; issues: { sectionId: string; issues: string[] }[] }> {
    try {
      const report = this.reportCache.get(reportId);

      if (!report) {
        throw new Error("Report not found");
      }

      // Perform validation
      const validationIssues: { sectionId: string; issues: string[] }[] = [];

      // In a real implementation, this would validate the report data against requirements
      // For this example, we'll return a success

      // Update report
      report.validationIssues = validationIssues;
      this.reportCache.set(reportId, report);
      await this.saveReportsCache();

      return {
        valid: validationIssues.length === 0,
        issues: validationIssues,
      };
    } catch (error) {
      console.error("Error validating report data:", error);
      return {
        valid: false,
        issues: [{ sectionId: "validation", issues: ["Error validating report data"] }],
      };
    }
  }

  /**
   * Create template
   */
  public async createTemplate(
    template: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt" | "preloaded">
  ): Promise<ReportTemplate> {
    try {
      // Generate template ID
      const templateId = `template_${uuidv4()}`;

      // Create template object
      const newTemplate: ReportTemplate = {
        ...template,
        id: templateId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preloaded: false,
        organizationSpecific: template.organizationSpecific || false,
      };

      // Save to cache
      this.templateCache.set(templateId, newTemplate);
      await this.saveTemplatesCache();

      // Upload to server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.uploadTemplateToServer(newTemplate);
        } catch (error) {
          console.warn("Failed to upload template to server:", error);
        }
      } else {
        // Queue for upload when online
        await this.offlineQueueService.enqueue(
          OperationType.UPLOAD_TEMPLATE,
          { templateId },
          1 // Low priority
        );
      }

      return newTemplate;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }

  /**
   * Upload template to server
   */
  private async uploadTemplateToServer(template: ReportTemplate): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to upload template");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload template");
      }
    } catch (error) {
      console.error("Error uploading template to server:", error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  public async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const template = this.templateCache.get(templateId);

      if (!template) {
        return false;
      }

      // Can't delete preloaded templates
      if (template.preloaded) {
        throw new Error("Cannot delete preloaded templates");
      }

      // Remove from cache
      this.templateCache.delete(templateId);
      await this.saveTemplatesCache();

      // Delete from server if online
      const networkInfo = await NetInfo.fetch();

      if (networkInfo.isConnected) {
        try {
          await this.deleteTemplateFromServer(templateId);
        } catch (error) {
          console.warn("Failed to delete template from server:", error);
        }
      } else {
        // Queue for deletion when online
        await this.offlineQueueService.enqueue(
          OperationType.DELETE_TEMPLATE,
          { templateId },
          1 // Low priority
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      return false;
    }
  }

  /**
   * Delete template from server
   */
  private async deleteTemplateFromServer(templateId: string): Promise<void> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required to delete template");
      }

      // Make API request
      const response = await fetch(`${this.API_ENDPOINT}/templates/${templateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template from server:", error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  public async cleanupTemporaryFiles(): Promise<number> {
    try {
      // Get all files in reports directory
      const files = await FileSystem.readDirectoryAsync(this.REPORTS_DIRECTORY);

      // Get all report files from cache
      const reportFiles = new Set<string>();

      for (const report of this.reportCache.values()) {
        if (report.files) {
          for (const file of report.files) {
            // Extract filename from path
            const filenameParts = file.url.split("/");
            const filename = filenameParts[filenameParts.length - 1];
            reportFiles.add(filename);
          }
        }
      }

      // Delete files not in report files
      let deletedCount = 0;

      for (const file of files) {
        if (!reportFiles.has(file)) {
          await FileSystem.deleteAsync(`${this.REPORTS_DIRECTORY}${file}`, { idempotent: true });
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up temporary files:", error);
      return 0;
    }
  }
}
