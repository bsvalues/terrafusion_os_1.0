/**
 * Terrafusion Platform Configuration
 * Shared between frontend and backend
 */

const config = {
  // Demo mode configuration
  demoMode: {
    enabled: true,
    showDemoLabel: true,
    demoLabelText: "DEMO MODE",
  },

  // PDF export settings
  pdfExport: {
    enableAIAnnotations: true,
    addWatermark: true,
    watermarkText: "Terrafusion - SAMPLE REPORT",
    defaultOptionsIncludeCover: true,
    defaultOptionsIncludePhotos: true,
    defaultOptionsIncludeAdjustments: true,
  },

  // ZIP export settings
  zipExport: {
    includeMetadata: true,
    metadataFormat: "json", // json or csv
    addIndexFile: true,
  },

  // AI integration settings
  aiIntegration: {
    enabled: true,
    confidenceLevelsEnabled: true,
    suggestAdjustments: true,
  },

  // Reviewer mode settings
  reviewerMode: {
    enabled: true,
    trackChanges: true,
    requireApproval: false,
  },
};

export default config;
