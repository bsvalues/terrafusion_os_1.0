import * as FileSystem from "expo-file-system";
import { Platform, Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { PropertyData } from "./types";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";
import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";

/**
 * Document template type
 */
export enum DocumentTemplateType {
  URAR = "urar", // Uniform Residential Appraisal Report
  LAND = "land", // Land Appraisal Report
  CONDO = "condo", // Individual Condominium Unit Appraisal Report
  MULTI_FAMILY = "multi_family", // Small Residential Income Property Appraisal Report
  MANUFACTURED = "manufactured", // Manufactured Home Appraisal Report
  FHA = "fha", // FHA Single Family Appraisal
  VA = "va", // VA Loan Guaranty Appraisal
  FNMA = "fnma", // Fannie Mae Form 1004
  FHLMC = "fhlmc", // Freddie Mac Form 70
  CUSTOM = "custom", // Custom template
}

/**
 * Document format type
 */
export enum DocumentFormatType {
  PDF = "pdf",
  DOCX = "docx",
  XML = "xml",
  JSON = "json",
}

/**
 * Compliance organization
 */
export enum ComplianceOrganization {
  FHA = "fha", // Federal Housing Administration
  VA = "va", // Veterans Affairs
  FNMA = "fnma", // Fannie Mae
  FHLMC = "fhlmc", // Freddie Mac
  USPAP = "uspap", // Uniform Standards of Professional Appraisal Practice
  STATE = "state", // State-specific requirements
  CUSTOM = "custom", // Custom compliance requirements
}

/**
 * Document generation options
 */
export interface DocumentGenerationOptions {
  /**
   * Template type to use
   */
  templateType: DocumentTemplateType;

  /**
   * Document format to generate
   */
  formatType: DocumentFormatType;

  /**
   * Compliance organizations to include
   */
  complianceOrganizations: ComplianceOrganization[];

  /**
   * Whether to include property photos
   */
  includePhotos: boolean;

  /**
   * Whether to include property sketches
   */
  includeSketches: boolean;

  /**
   * Whether to include maps and location data
   */
  includeMaps: boolean;

  /**
   * Whether to include comparable properties
   */
  includeComparables: boolean;

  /**
   * Whether to include market analysis
   */
  includeMarketAnalysis: boolean;

  /**
   * Whether to include digital signature
   */
  includeDigitalSignature: boolean;

  /**
   * Custom template URL or ID (for CUSTOM template type)
   */
  customTemplateId?: string;

  /**
   * Custom compliance requirements (for CUSTOM compliance organization)
   */
  customComplianceRequirements?: Record<string, any>;

  /**
   * Additional metadata to include in the document
   */
  metadata?: Record<string, any>;
}

/**
 * Default document generation options
 */
const DEFAULT_OPTIONS: DocumentGenerationOptions = {
  templateType: DocumentTemplateType.URAR,
  formatType: DocumentFormatType.PDF,
  complianceOrganizations: [ComplianceOrganization.USPAP],
  includePhotos: true,
  includeSketches: true,
  includeMaps: true,
  includeComparables: true,
  includeMarketAnalysis: true,
  includeDigitalSignature: false,
};

/**
 * Document generation result
 */
export interface DocumentGenerationResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message, if any
   */
  error?: string;

  /**
   * URI to the generated document
   */
  documentUri?: string;

  /**
   * File name of the generated document
   */
  fileName?: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Document format
   */
  format?: DocumentFormatType;

  /**
   * Generation timestamp
   */
  timestamp: number;

  /**
   * Whether the document was generated offline
   */
  generatedOffline: boolean;
}

/**
 * ComplianceDocumentService
 *
 * Provides functionality for generating compliance documents
 * from property data according to various standards.
 */
export class ComplianceDocumentService {
  private static instance: ComplianceDocumentService;
  private offlineQueueService: OfflineQueueService;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;

  /**
   * Document templates storage directory
   */
  private readonly TEMPLATES_DIRECTORY = `${FileSystem.documentDirectory}document_templates/`;

  /**
   * Generated documents storage directory
   */
  private readonly DOCUMENTS_DIRECTORY = `${FileSystem.documentDirectory}generated_documents/`;

  /**
   * Template cache storage key
   */
  private readonly TEMPLATES_CACHE_KEY = "terrafield:documents:templates_cache";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.offlineQueueService = OfflineQueueService.getInstance();
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();

    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ComplianceDocumentService {
    if (!ComplianceDocumentService.instance) {
      ComplianceDocumentService.instance = new ComplianceDocumentService();
    }
    return ComplianceDocumentService.instance;
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      // Ensure templates directory exists
      const templatesInfo = await FileSystem.getInfoAsync(this.TEMPLATES_DIRECTORY);
      if (!templatesInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.TEMPLATES_DIRECTORY, { intermediates: true });
      }

      // Ensure documents directory exists
      const documentsInfo = await FileSystem.getInfoAsync(this.DOCUMENTS_DIRECTORY);
      if (!documentsInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DOCUMENTS_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error("Error ensuring directories exist:", error);
    }
  }

  /**
   * Generate a compliance document for a property
   */
  public async generateDocument(
    property: PropertyData,
    options: Partial<DocumentGenerationOptions> = {}
  ): Promise<DocumentGenerationResult> {
    try {
      // Merge options with defaults
      const mergedOptions: DocumentGenerationOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // Check network connectivity
      const networkInfo = await FileSystem.getInfoAsync("https://api.appraisalcore.replit.app");
      const isOnline = networkInfo.exists;

      if (isOnline) {
        // Online generation (server-side)
        return await this.generateDocumentOnline(property, mergedOptions);
      } else {
        // Offline generation (client-side)
        return await this.generateDocumentOffline(property, mergedOptions);
      }
    } catch (error) {
      console.error("Error generating document:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: Date.now(),
        generatedOffline: true,
      };
    }
  }

  /**
   * Generate a document online (server-side)
   */
  private async generateDocumentOnline(
    property: PropertyData,
    options: DocumentGenerationOptions
  ): Promise<DocumentGenerationResult> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error("Authentication required");
      }

      // Prepare request data
      const requestData = {
        property,
        options,
      };

      // Make API request to generate document
      const response = await fetch("https://api.appraisalcore.replit.app/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate document");
      }

      // Get document data
      const documentData = await response.json();

      // Download the document
      const fileName =
        documentData.fileName ||
        `property_${property.id}_${Date.now()}.${options.formatType.toLowerCase()}`;
      const documentUri = `${this.DOCUMENTS_DIRECTORY}${fileName}`;

      await FileSystem.downloadAsync(documentData.documentUrl, documentUri);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(documentUri, { size: true });

      return {
        success: true,
        documentUri,
        fileName,
        fileSize: fileInfo.size,
        format: options.formatType,
        timestamp: Date.now(),
        generatedOffline: false,
      };
    } catch (error) {
      console.error("Error generating document online:", error);

      // Try offline generation as fallback
      return this.generateDocumentOffline(property, options);
    }
  }

  /**
   * Generate a document offline (client-side)
   */
  private async generateDocumentOffline(
    property: PropertyData,
    options: DocumentGenerationOptions
  ): Promise<DocumentGenerationResult> {
    try {
      // Load template
      const template = await this.loadTemplate(options.templateType);

      if (!template) {
        throw new Error("Template not found");
      }

      // Generate file name
      const fileName = `property_${property.id}_${Date.now()}.${options.formatType.toLowerCase()}`;
      const documentUri = `${this.DOCUMENTS_DIRECTORY}${fileName}`;

      // Get compliance requirements
      const complianceRequirements = await this.getComplianceRequirements(
        options.complianceOrganizations
      );

      // Build document content
      const documentContent = await this.buildDocumentContent(
        property,
        template,
        complianceRequirements,
        options
      );

      // Write document to file
      await FileSystem.writeAsStringAsync(documentUri, documentContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(documentUri, { size: true });

      // Queue for sync when online
      await this.offlineQueueService.enqueue(
        OperationType.SYNC_DOCUMENT,
        {
          propertyId: property.id,
          documentUri,
          fileName,
          options,
        },
        2 // Medium priority
      );

      return {
        success: true,
        documentUri,
        fileName,
        fileSize: fileInfo.size,
        format: options.formatType,
        timestamp: Date.now(),
        generatedOffline: true,
      };
    } catch (error) {
      console.error("Error generating document offline:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        timestamp: Date.now(),
        generatedOffline: true,
      };
    }
  }

  /**
   * Load a document template
   */
  private async loadTemplate(templateType: DocumentTemplateType): Promise<string | null> {
    try {
      // Try to load from cache first
      const templates = await this.secureStorageService.getData<Record<string, string>>(
        this.TEMPLATES_CACHE_KEY,
        {}
      );

      if (templates && templates[templateType]) {
        return templates[templateType];
      }

      // Try to load from file system
      const templatePath = `${this.TEMPLATES_DIRECTORY}${templateType}.template`;
      const templateInfo = await FileSystem.getInfoAsync(templatePath);

      if (templateInfo.exists) {
        const template = await FileSystem.readAsStringAsync(templatePath);

        // Update cache
        await this.secureStorageService.storeData(
          this.TEMPLATES_CACHE_KEY,
          {
            ...templates,
            [templateType]: template,
          },
          {
            securityLevel: SecurityLevel.NORMAL,
          }
        );

        return template;
      }

      // Template not found, use default template
      return this.getDefaultTemplate(templateType);
    } catch (error) {
      console.error("Error loading template:", error);
      return this.getDefaultTemplate(templateType);
    }
  }

  /**
   * Get compliance requirements
   */
  private async getComplianceRequirements(
    organizations: ComplianceOrganization[]
  ): Promise<Record<ComplianceOrganization, any>> {
    try {
      // Try to load from cache
      const cachedRequirements = await this.secureStorageService.getData<
        Record<ComplianceOrganization, any>
      >("terrafield:documents:compliance_requirements", {});

      const requirements: Record<ComplianceOrganization, any> = {};

      // Build requirements object
      for (const org of organizations) {
        if (cachedRequirements[org]) {
          requirements[org] = cachedRequirements[org];
        } else {
          // Use default requirements
          requirements[org] = this.getDefaultComplianceRequirements(org);
        }
      }

      return requirements;
    } catch (error) {
      console.error("Error getting compliance requirements:", error);

      // Return default requirements
      const requirements: Record<ComplianceOrganization, any> = {};

      for (const org of organizations) {
        requirements[org] = this.getDefaultComplianceRequirements(org);
      }

      return requirements;
    }
  }

  /**
   * Build document content
   */
  private async buildDocumentContent(
    property: PropertyData,
    template: string,
    complianceRequirements: Record<ComplianceOrganization, any>,
    options: DocumentGenerationOptions
  ): Promise<string> {
    try {
      // Basic content with property information
      let content = template;

      // Replace variables in template
      content = content
        .replace(/\${property\.id}/g, property.id || "")
        .replace(/\${property\.address}/g, property.address || "")
        .replace(/\${property\.city}/g, property.city || "")
        .replace(/\${property\.state}/g, property.state || "")
        .replace(/\${property\.zipCode}/g, property.zipCode || "")
        .replace(/\${property\.propertyType}/g, property.propertyType || "")
        .replace(/\${property\.yearBuilt}/g, property.yearBuilt?.toString() || "")
        .replace(/\${property\.squareFeet}/g, property.squareFeet?.toString() || "")
        .replace(/\${property\.bedrooms}/g, property.bedrooms?.toString() || "")
        .replace(/\${property\.bathrooms}/g, property.bathrooms?.toString() || "")
        .replace(/\${property\.lotSize}/g, property.lotSize?.toString() || "")
        .replace(/\${property\.hasGarage}/g, property.hasGarage ? "Yes" : "No")
        .replace(/\${property\.hasPool}/g, property.hasPool ? "Yes" : "No")
        .replace(/\${date\.now}/g, new Date().toLocaleDateString())
        .replace(/\${appraiser\.name}/g, this.authService.getCurrentUser()?.fullName || "Appraiser")
        .replace(/\${appraiser\.license}/g, "License #");

      // Include compliance requirements
      const complianceSection = Object.entries(complianceRequirements)
        .map(([org, requirements]) => {
          return `<h2>${this.getComplianceOrganizationName(org as ComplianceOrganization)} Requirements</h2>
${requirements}`;
        })
        .join("\n\n");

      content = content.replace(/\${compliance\.requirements}/g, complianceSection);

      // Convert to appropriate format
      switch (options.formatType) {
        case DocumentFormatType.XML:
          return this.convertToXML(content, property);

        case DocumentFormatType.JSON:
          return this.convertToJSON(content, property);

        case DocumentFormatType.DOCX:
          // For simplicity, we'll just use HTML for now
          // In a real app, this would convert to DOCX format
          return content;

        case DocumentFormatType.PDF:
        default:
          // For simplicity, we'll just use HTML for now
          // In a real app, this would convert to PDF format
          return content;
      }
    } catch (error) {
      console.error("Error building document content:", error);
      throw error;
    }
  }

  /**
   * Convert content to XML format
   */
  private convertToXML(content: string, property: PropertyData): string {
    // Simple XML conversion for demonstration
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<appraisal>
  <property><>

    <id>${property.id}</id>
    <address
</>>${property.address}</address><>

    <city>${property.city}</city>
    <state
</>>${property.state}</state><>

    <zipCode>${property.zipCode}</zipCode>
    <propertyType
</>>${property.propertyType}</propertyType><>

    <yearBuilt>${property.yearBuilt}</yearBuilt>
    <squareFeet
</>>${property.squareFeet}</squareFeet><>

    <bedrooms>${property.bedrooms}</bedrooms>
    <bathrooms
</>>${property.bathrooms}</bathrooms><>

    <lotSize>${property.lotSize}</lotSize>
    <hasGarage
</>>${property.hasGarage}</hasGarage>
    <hasPool>${property.hasPool}</hasPool>
  </property>
  <content><![CDATA[${content}]]></content>
  <generated>${new Date().toISOString()}</generated>
</appraisal>`;

    return xmlContent;
  }

  /**
   * Convert content to JSON format
   */
  private convertToJSON(content: string, property: PropertyData): string {
    // JSON conversion
    const jsonContent = {
      property: {
        id: property.id,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        propertyType: property.propertyType,
        yearBuilt: property.yearBuilt,
        squareFeet: property.squareFeet,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        lotSize: property.lotSize,
        hasGarage: property.hasGarage,
        hasPool: property.hasPool,
      },
      content: content,
      generated: new Date().toISOString(),
    };

    return JSON.stringify(jsonContent, null, 2);
  }

  /**
   * Get default template for a template type
   */
  private getDefaultTemplate(templateType: DocumentTemplateType): string {
    // Basic HTML template with placeholders
    switch (templateType) {
      case DocumentTemplateType.URAR:
        return `<!DOCTYPE html>
<html>
<head><>

  <title>Uniform Residential Appraisal Report</title>
  <style
</>>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #2c3e50; }
    h2 { color: #3498db; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body><>

  <h1>Uniform Residential Appraisal Report</h1>
  
  <div
</> style="text-align: right; margin-bottom: 20px;">
    <p>Report Date: \${date.now}</p>
  </div><>

  
  <h2>Subject Property</h2>
  <table
</>>
    <tr><>

      <th>Address</th>
      <td
</>>\${property.address}, \${property.city}, \${property.state} \${property.zipCode}</td>
    </tr>
    <tr><>

      <th>Property Type</th>
      <td
</>>\${property.propertyType}</td>
    </tr>
    <tr><>

      <th>Year Built</th>
      <td
</>>\${property.yearBuilt}</td>
    </tr>
    <tr><>

      <th>Size</th>
      <td
</>>\${property.squareFeet} sq ft</td>
    </tr>
    <tr><>

      <th>Bedrooms/Bathrooms</th>
      <td
</>>\${property.bedrooms} beds, \${property.bathrooms} baths</td>
    </tr>
    <tr><>

      <th>Lot Size</th>
      <td
</>>\${property.lotSize} acres</td>
    </tr>
    <tr><>

      <th>Garage</th>
      <td
</>>\${property.hasGarage}</td>
    </tr>
    <tr><>

      <th>Pool</th>
      <td
</>>\${property.hasPool}</td>
    </tr>
  </table><>

  
  <h2>Neighborhood Characteristics</h2>
  <table
</>>
    <tr><>

      <th>Location</th>
      <td
</>>Urban</td>
    </tr>
    <tr><>

      <th>Built-Up</th>
      <td
</>>Over 75%</td>
    </tr>
    <tr><>

      <th>Growth Rate</th>
      <td
</>>Stable</td>
    </tr>
    <tr><>

      <th>Property Values</th>
      <td
</>>Stable</td>
    </tr>
    <tr><>

      <th>Demand/Supply</th>
      <td
</>>In Balance</td>
    </tr>
    <tr><>

      <th>Marketing Time</th>
      <td
</>>3-6 Months</td>
    </tr>
  </table>
  
  \${compliance.requirements}<>

  
  <h2>Certification</h2>
  <p
</>>I certify that, to the best of my knowledge and belief:</p>
  <ol><>

    <li>The statements of fact contained in this report are true and correct.</li>
                            <li
</>>The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.</li>
    <li>I have no (or the specified) present or prospective interest in the property that is the subject of this report and no (or the specified) personal interest with respect to the parties involved.</li>
  </ol>
  
  <div style="margin-top: 50px;"><>

    <p>Appraiser: \${appraiser.name}</p>
    <p
</>>License: \${appraiser.license}</p>
    <p>Date: \${date.now}</p>
  </div>
</body>
</html>`;

      case DocumentTemplateType.LAND:
        return `<!DOCTYPE html>
<html>
<head><>

  <title>Land Appraisal Report</title>
  <style
</>>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #2c3e50; }
    h2 { color: #3498db; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body><>

  <h1>Land Appraisal Report</h1>
  
  <div
</> style="text-align: right; margin-bottom: 20px;">
    <p>Report Date: \${date.now}</p>
  </div><>

  
  <h2>Subject Property</h2>
  <table
</>>
    <tr><>

      <th>Address</th>
      <td
</>>\${property.address}, \${property.city}, \${property.state} \${property.zipCode}</td>
    </tr>
    <tr><>

      <th>Property Type</th>
      <td
</>>\${property.propertyType}</td>
    </tr>
    <tr><>

      <th>Lot Size</th>
      <td
</>>\${property.lotSize} acres</td>
    </tr>
  </table><>

  
  <h2>Land Characteristics</h2>
  <table
</>>
    <tr><>

      <th>Topography</th>
      <td
</>>Level</td>
    </tr>
    <tr><>

      <th>Shape</th>
      <td
</>>Rectangular</td>
    </tr>
    <tr><>

      <th>Drainage</th>
      <td
</>>Appears Adequate</td>
    </tr>
    <tr><>

      <th>Utilities</th>
      <td
</>>All Public</td>
    </tr>
  </table>
  
  \${compliance.requirements}<>

  
  <h2>Certification</h2>
  <p
</>>I certify that, to the best of my knowledge and belief:</p>
  <ol><>

    <li>The statements of fact contained in this report are true and correct.</li>
                            <li
</>>The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.</li>
    <li>I have no (or the specified) present or prospective interest in the property that is the subject of this report and no (or the specified) personal interest with respect to the parties involved.</li>
  </ol>
  
  <div style="margin-top: 50px;"><>

    <p>Appraiser: \${appraiser.name}</p>
    <p
</>>License: \${appraiser.license}</p>
    <p>Date: \${date.now}</p>
  </div>
</body>
</html>`;

      default:
        return `<!DOCTYPE html>
<html>
<head><>

  <title>Property Appraisal Report</title>
  <style
</>>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #2c3e50; }
    h2 { color: #3498db; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body><>

  <h1>Property Appraisal Report</h1>
  
  <div
</> style="text-align: right; margin-bottom: 20px;">
    <p>Report Date: \${date.now}</p>
  </div><>

  
  <h2>Subject Property</h2>
  <table
</>>
    <tr><>

      <th>Address</th>
      <td
</>>\${property.address}, \${property.city}, \${property.state} \${property.zipCode}</td>
    </tr>
    <tr><>

      <th>Property Type</th>
      <td
</>>\${property.propertyType}</td>
    </tr>
    <tr><>

      <th>Year Built</th>
      <td
</>>\${property.yearBuilt}</td>
    </tr>
    <tr><>

      <th>Size</th>
      <td
</>>\${property.squareFeet} sq ft</td>
    </tr>
    <tr><>

      <th>Bedrooms/Bathrooms</th>
      <td
</>>\${property.bedrooms} beds, \${property.bathrooms} baths</td>
    </tr>
    <tr><>

      <th>Lot Size</th>
      <td
</>>\${property.lotSize} acres</td>
    </tr>
    <tr><>

      <th>Garage</th>
      <td
</>>\${property.hasGarage}</td>
    </tr>
    <tr><>

      <th>Pool</th>
      <td
</>>\${property.hasPool}</td>
    </tr>
  </table>
  
  \${compliance.requirements}<>

  
  <h2>Certification</h2>
  <p
</>>I certify that, to the best of my knowledge and belief:</p>
  <ol><>

    <li>The statements of fact contained in this report are true and correct.</li>
                            <li
</>>The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.</li>
    <li>I have no (or the specified) present or prospective interest in the property that is the subject of this report and no (or the specified) personal interest with respect to the parties involved.</li>
  </ol>
  
  <div style="margin-top: 50px;"><>

    <p>Appraiser: \${appraiser.name}</p>
    <p
</>>License: \${appraiser.license}</p>
    <p>Date: \${date.now}</p>
  </div>
</body>
</html>`;
    }
  }

  /**
   * Get default compliance requirements for an organization
   */
  private getDefaultComplianceRequirements(organization: ComplianceOrganization): string {
    switch (organization) {
      case ComplianceOrganization.USPAP:
        return `<ul><>

  <li>This appraisal report complies with the Uniform Standards of Professional Appraisal Practice (USPAP).</li>
                            <li
</>>The appraiser has personally inspected the subject property and all comparable properties listed in this report.</li><>

  <li>The appraiser has analyzed and reported the appropriate market data to support the opinion of value.</li>
                            <li
</>>The appraiser has no current or prospective interest in the subject property or parties involved.</li>
</ul>`;

      case ComplianceOrganization.FHA:
        return `<ul><>

  <li>This appraisal report complies with FHA/HUD requirements.</li>
                            <li
</>>The subject property meets FHA's Minimum Property Requirements (MPR).</li><>

  <li>Any observed health and safety issues have been reported and assessed.</li>
                            <li
</>>All utilities were operational at the time of inspection.</li>
</ul>`;

      case ComplianceOrganization.VA:
        return `<ul><>

  <li>This appraisal report complies with Department of Veterans Affairs requirements.</li>
                            <li
</>>The subject property meets VA's Minimum Property Requirements (MPR).</li><>

  <li>The property meets VA's criteria for acceptable construction, general marketability, and sound value.</li>
                            <li
</>>The property is free of significant hazards, defects, deterioration, and deferred maintenance.</li>
</ul>`;

      case ComplianceOrganization.FNMA:
        return `<ul><>

  <li>This appraisal report complies with Fannie Mae requirements.</li>
                            <li
</>>The subject property meets Fannie Mae's property eligibility requirements.</li><>

  <li>The appraisal includes at least three comparable sales that closed within the past 12 months.</li>
                            <li
</>>The subject property conforms to the neighborhood in terms of age, size, and amenities.</li>
</ul>`;

      case ComplianceOrganization.FHLMC:
        return `<ul><>

  <li>This appraisal report complies with Freddie Mac requirements.</li>
                            <li
</>>The subject property meets Freddie Mac's property eligibility requirements.</li><>

  <li>The appraisal includes at least three comparable sales that closed within the past 12 months.</li>
                            <li
</>>The subject property conforms to the neighborhood in terms of age, size, and amenities.</li>
</ul>`;

      case ComplianceOrganization.STATE:
        return `<ul><>

  <li>This appraisal report complies with state-specific requirements.</li>
                            <li
</>>The appraiser holds a valid license in the state where the subject property is located.</li><>

  <li>The appraisal meets all state-mandated disclosure requirements.</li>
                            <li
</>>State-specific property condition disclosures have been considered in the valuation.</li>
</ul>`;

      case ComplianceOrganization.CUSTOM:
        return `<p>Custom compliance requirements as specified by the client.</p>`;

      default:
        return `<p>Standard compliance requirements apply to this appraisal report.</p>`;
    }
  }

  /**
   * Get human-readable name for a compliance organization
   */
  private getComplianceOrganizationName(organization: ComplianceOrganization): string {
    switch (organization) {
      case ComplianceOrganization.USPAP:
        return "USPAP";
      case ComplianceOrganization.FHA:
        return "FHA";
      case ComplianceOrganization.VA:
        return "VA";
      case ComplianceOrganization.FNMA:
        return "Fannie Mae";
      case ComplianceOrganization.FHLMC:
        return "Freddie Mac";
      case ComplianceOrganization.STATE:
        return "State";
      case ComplianceOrganization.CUSTOM:
        return "Custom";
      default:
        return organization;
    }
  }

  /**
   * Share a generated document
   */
  public async shareDocument(documentUri: string, documentName?: string): Promise<boolean> {
    try {
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert("Sharing Not Available", "Document sharing is not available on this device.");
        return false;
      }

      // Share the document
      await Sharing.shareAsync(documentUri, {
        dialogTitle: "Share Appraisal Document",
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        filename: documentName || "appraisal_document.pdf",
      });

      return true;
    } catch (error) {
      console.error("Error sharing document:", error);

      Alert.alert(
        "Sharing Error",
        "An error occurred while sharing the document. Please try again."
      );

      return false;
    }
  }

  /**
   * Get all generated documents
   */
  public async getGeneratedDocuments(): Promise<string[]> {
    try {
      // Get all files in documents directory
      const files = await FileSystem.readDirectoryAsync(this.DOCUMENTS_DIRECTORY);

      // Return full paths
      return files.map((file) => `${this.DOCUMENTS_DIRECTORY}${file}`);
    } catch (error) {
      console.error("Error getting generated documents:", error);
      return [];
    }
  }

  /**
   * Delete a generated document
   */
  public async deleteDocument(documentUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(documentUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(documentUri);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }
}
