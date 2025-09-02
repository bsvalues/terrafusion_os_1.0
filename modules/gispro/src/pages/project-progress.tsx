import React from 'react';
import { ProjectTracker, ProjectFeature } from '@/components/project-tracker';
import { useTitle } from '@/hooks/use-title';

export default function ProjectProgressPage() {
  useTitle('Project Progress - BentonGeoPro');
  
  // Define project features with their status and progress
  const projectFeatures: ProjectFeature[] = [
    // Mapping Features
    {
      id: 'map-integration',
      name: 'Mapbox GL JS Integration',
      description: 'Integration of Mapbox GL JS for high-performance rendering and interactive maps',
      status: 'completed',
      progress: 100,
      category: 'mapping',
      priority: 'high',
      startDate: '2025-02-15',
      endDate: '2025-03-01'
    },
    {
      id: 'drawing-tools',
      name: 'Map Drawing Tools',
      description: 'Implementation of drawing and editing tools for creating geometric shapes on maps',
      status: 'completed',
      progress: 100,
      category: 'mapping',
      priority: 'high',
      startDate: '2025-03-01',
      endDate: '2025-03-10'
    },
    {
      id: 'measurement-tools',
      name: 'Measurement Tools',
      description: 'Tools for measuring distances, areas, and angles on maps',
      status: 'completed',
      progress: 100,
      category: 'mapping',
      priority: 'medium',
      startDate: '2025-03-05',
      endDate: '2025-03-15'
    },
    {
      id: 'snap-to-feature',
      name: 'Snap-to-Feature Functionality',
      description: 'Enables snapping to existing map features during drawing and editing',
      status: 'in-progress',
      progress: 80,
      category: 'mapping',
      priority: 'medium',
      startDate: '2025-03-12'
    },
    {
      id: 'layer-management',
      name: 'Map Layer Management',
      description: 'Interface for controlling layer visibility, order, and styling',
      status: 'in-progress',
      progress: 75,
      category: 'mapping',
      priority: 'medium',
      startDate: '2025-03-15'
    },
    {
      id: 'tile-server-integration',
      name: 'Custom Tile Server Integration',
      description: 'Support for custom GIS tile servers and layer sources',
      status: 'planned',
      progress: 20,
      category: 'mapping',
      priority: 'low'
    },
    
    // Document Management
    {
      id: 'document-classification',
      name: 'Document Classification System',
      description: 'Automatic classification and tagging of uploaded documents by type and content',
      status: 'completed',
      progress: 100,
      category: 'document-management',
      priority: 'high',
      startDate: '2025-02-20',
      endDate: '2025-03-05'
    },
    {
      id: 'document-storage',
      name: 'Document Storage and Retrieval',
      description: 'Secure storage, versioning, and retrieval of documents with metadata',
      status: 'completed',
      progress: 100,
      category: 'document-management',
      priority: 'high',
      startDate: '2025-02-25',
      endDate: '2025-03-10'
    },
    {
      id: 'document-parcel-linking',
      name: 'Document-Parcel Relationship Management',
      description: 'Linking documents to related land parcels with type classification',
      status: 'completed',
      progress: 100,
      category: 'document-management',
      priority: 'high',
      startDate: '2025-03-08',
      endDate: '2025-03-20'
    },
    {
      id: 'legal-description-parser',
      name: 'Legal Description Parser',
      description: 'Parsing and interpretation of legal property descriptions with visualization',
      status: 'completed',
      progress: 100,
      category: 'document-management',
      priority: 'high',
      startDate: '2025-03-10',
      endDate: '2025-03-25'
    },
    {
      id: 'document-search',
      name: 'Advanced Document Search',
      description: 'Full-text and metadata search capabilities across document collections',
      status: 'in-progress',
      progress: 70,
      category: 'document-management',
      priority: 'medium',
      startDate: '2025-03-18'
    },
    {
      id: 'document-workflow',
      name: 'Document Workflow Automation',
      description: 'Workflow automation for document processing, review, and approval',
      status: 'planned',
      progress: 15,
      category: 'document-management',
      priority: 'medium'
    },
    
    // Collaboration Features
    {
      id: 'websocket-infrastructure',
      name: 'WebSocket Infrastructure',
      description: 'Real-time communication infrastructure with connection management and message routing',
      status: 'completed',
      progress: 100,
      category: 'collaboration',
      priority: 'high',
      startDate: '2025-03-01',
      endDate: '2025-03-15'
    },
    {
      id: 'collaborative-map-editing',
      name: 'Collaborative Map Editing',
      description: 'Real-time synchronized map editing between multiple users',
      status: 'completed',
      progress: 100,
      category: 'collaboration',
      priority: 'high',
      startDate: '2025-03-10',
      endDate: '2025-03-25'
    },
    {
      id: 'collaborative-annotations',
      name: 'Collaborative Annotations',
      description: 'Shared annotation and commenting on maps and documents',
      status: 'in-progress',
      progress: 85,
      category: 'collaboration',
      priority: 'medium',
      startDate: '2025-03-20'
    },
    {
      id: 'user-presence',
      name: 'User Presence Indicators',
      description: 'Visual indicators of current users and their activities',
      status: 'in-progress',
      progress: 90,
      category: 'collaboration',
      priority: 'medium',
      startDate: '2025-03-15'
    },
    {
      id: 'change-tracking',
      name: 'Change Tracking and History',
      description: 'Tracking and visualization of changes with history playback',
      status: 'planned',
      progress: 10,
      category: 'collaboration',
      priority: 'low'
    },
    
    // Interface Components
    {
      id: 'responsive-design',
      name: 'Responsive UI Design',
      description: 'Fully responsive interface design for desktop and mobile devices',
      status: 'completed',
      progress: 100,
      category: 'interface',
      priority: 'high',
      startDate: '2025-02-15',
      endDate: '2025-03-01'
    },
    {
      id: 'accessibility',
      name: 'Accessibility Compliance',
      description: 'WCAG 2.1 AA compliance for all interface components',
      status: 'in-progress',
      progress: 80,
      category: 'interface',
      priority: 'medium',
      startDate: '2025-03-10'
    },
    {
      id: 'interactive-dashboard',
      name: 'Interactive Dashboard',
      description: 'Customizable dashboard with status cards and activity feeds',
      status: 'in-progress',
      progress: 65,
      category: 'interface',
      priority: 'medium',
      startDate: '2025-03-25'
    },
    
    // Core System Components
    {
      id: 'authentication',
      name: 'User Authentication System',
      description: 'Secure user authentication and authorization with role-based access control',
      status: 'completed',
      progress: 100,
      category: 'core',
      priority: 'high',
      startDate: '2025-02-10',
      endDate: '2025-02-25'
    },
    {
      id: 'database-integration',
      name: 'PostgreSQL Database Integration',
      description: 'Integration with PostgreSQL database for data persistence and querying',
      status: 'completed',
      progress: 100,
      category: 'core',
      priority: 'high',
      startDate: '2025-02-15',
      endDate: '2025-03-01'
    },
    {
      id: 'api-structure',
      name: 'RESTful API Structure',
      description: 'Structured API design with standard endpoints and error handling',
      status: 'completed',
      progress: 100,
      category: 'core',
      priority: 'high',
      startDate: '2025-02-20',
      endDate: '2025-03-05'
    },
    {
      id: 'error-handling',
      name: 'Comprehensive Error Handling',
      description: 'Robust error handling and reporting system for both frontend and backend',
      status: 'in-progress',
      progress: 85,
      category: 'core',
      priority: 'medium',
      startDate: '2025-03-10'
    },
    
    // Analytics Features
    {
      id: 'usage-analytics',
      name: 'Usage Analytics',
      description: 'Tracking and analysis of system usage patterns and user activities',
      status: 'in-progress',
      progress: 60,
      category: 'analytics',
      priority: 'medium',
      startDate: '2025-03-20'
    },
    {
      id: 'report-generation',
      name: 'Report Generation',
      description: 'Generation of customizable reports from system data and activities',
      status: 'planned',
      progress: 30,
      category: 'analytics',
      priority: 'low'
    },
    {
      id: 'data-export',
      name: 'Data Export Capabilities',
      description: 'Export functionality for maps, documents, and data in various formats',
      status: 'planned',
      progress: 20,
      category: 'analytics',
      priority: 'low'
    },
    {
      id: 'geospatial-analysis',
      name: 'Geospatial Analysis Tools',
      description: 'Tools for analyzing spatial relationships and patterns in map data',
      status: 'planned',
      progress: 10,
      category: 'analytics',
      priority: 'low'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2"><>

        <h1 className="text-3xl font-bold tracking-tight">Project Progress Tracker</h1>
        <p
</> className="text-muted-foreground">
          Track the development progress of the BentonGeoPro GIS Workflow Solution.
        </p>
      </div>
      
      <ProjectTracker 
        projectName="BentonGeoPro GIS Workflow Solution" 
        projectDescription="A cutting-edge Geographic Information System (GIS) workflow solution for the Benton County Assessor's Office, delivering advanced geospatial data processing with intelligent document management and robust collaborative features."
        features={projectFeatures}
      />
    </div>
  );
}