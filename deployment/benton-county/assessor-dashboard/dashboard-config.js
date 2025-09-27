
// Benton County Assessor Dashboard Configuration
// Generated: 2025-09-19T18:14:27.574Z

export const BENTON_COUNTY_DASHBOARD_CONFIG = {
    county: {
        name: "Benton County, Washington",
        assessor: "Benton County Assessor",
        parcels: 89247,
        taxYear: 2025
    },
    branding: {
        logo: "/assets/benton-county-logo.png",
        colors: {
            primary: "#1B365D",
            secondary: "#FFB81C",
            accent: "#8B1538"
        },
        title: "Benton County Assessor - TerraFusion OS"
    },
    features: {
        propertyAssessment: true,
        revenueOptimization: true,
        harrisIntegration: true,
        aiAnalytics: true,
        complianceReporting: true
    },
    api: {
        baseUrl: process.env.REACT_APP_API_URL || `http://localhost:${process.env.TF_API_PORT || 5000}`,
        harrisEndpoint: "/api/harris-pacs",
        assessmentEndpoint: "/api/assessments",
        revenueEndpoint: "/api/revenue"
    }
};
