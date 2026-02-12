# Workspace Health Schema
- workspace: string
- status: 'healthy' | 'warning' | 'critical'
- checks:
    buildPassing: boolean
    testsPassing: boolean
    noCriticalVulnerabilities: boolean
    dependenciesUpToDate: boolean
    documentationExists: boolean
    hasActiveOwner: boolean
    recentActivity: boolean
- score: 0..100
- recommendations: string[]
