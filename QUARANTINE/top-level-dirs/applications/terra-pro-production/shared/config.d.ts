/**
 * TypeScript Declaration for TerraFusionPlatform Configuration
 */

interface PdfExportConfig {
  enableAIAnnotations: boolean;
  addWatermark: boolean;
  watermarkText: string;
  defaultOptionsIncludeCover: boolean;
  defaultOptionsIncludePhotos: boolean;
  defaultOptionsIncludeAdjustments: boolean;
}

interface ZipExportConfig {
  includeMetadata: boolean;
  metadataFormat: "json" | "csv";
  addIndexFile: boolean;
}

interface AiIntegrationConfig {
  enabled: boolean;
  confidenceLevelsEnabled: boolean;
  suggestAdjustments: boolean;
}

interface DemoModeConfig {
  enabled: boolean;
  showDemoLabel: boolean;
  demoLabelText: string;
}

interface ReviewerModeConfig {
  enabled: boolean;
  trackChanges: boolean;
  requireApproval: boolean;
}

interface TerraFusionConfig {
  demoMode: DemoModeConfig;
  pdfExport: PdfExportConfig;
  zipExport: ZipExportConfig;
  aiIntegration: AiIntegrationConfig;
  reviewerMode: ReviewerModeConfig;
}

declare const config: TerraFusionConfig;

export default config;
