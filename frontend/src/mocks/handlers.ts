// TerraFusion OS - MSW Mock Handlers
// Government Data Structures & API Endpoints
// Government. Transcended.

import { http, HttpResponse } from 'msw';

// Government parcel data structure
interface GovernmentParcel {
  id: string;
  pin: string;
  address: string;
  owner: string;
  assessedValue: number;
  taxYear: number;
  county: 'Benton' | 'Yakima';
  zoning: string;
  acreage: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// AI Agent communication structure
interface AIAgentStatus {
  agentId: string;
  name: string;
  type: 'Supreme Commander' | 'Field General' | 'Operational Force';
  status: 'active' | 'idle' | 'processing' | 'error';
  currentTask?: string;
  performance: {
    responseTime: number;
    successRate: number;
    tasksCompleted: number;
  };
  county?: 'Benton' | 'Yakima';
}

// Sample data for development
const sampleParcels: GovernmentParcel[] = [
  {
    id: 'BN-001-2024',
    pin: '117100000100',
    address: '123 Government Way, Kennewick, WA',
    owner: 'Smith, John & Jane',
    assessedValue: 450000,
    taxYear: 2024,
    county: 'Benton',
    zoning: 'R-1',
    acreage: 0.25,
    coordinates: { lat: 46.2112, lng: -119.1372 }
  },
  {
    id: 'YK-001-2024',
    pin: '217100000100',
    address: '456 County Drive, Yakima, WA',
    owner: 'Johnson, Robert & Mary',
    assessedValue: 380000,
    taxYear: 2024,
    county: 'Yakima',
    zoning: 'R-2',
    acreage: 0.33,
    coordinates: { lat: 46.6021, lng: -120.5059 }
  }
];

const sampleAgents: AIAgentStatus[] = [
  {
    agentId: 'supreme-claude',
    name: 'Supreme Commander Claude',
    type: 'Supreme Commander',
    status: 'active',
    currentTask: 'Orchestrating 50,000+ agent coordination',
    performance: {
      responseTime: 6.7,
      successRate: 99.97,
      tasksCompleted: 2847291
    }
  },
  {
    agentId: 'field-general-001',
    name: 'Field General Alpha',
    type: 'Field General',
    status: 'processing',
    currentTask: 'County data synchronization',
    performance: {
      responseTime: 12.3,
      successRate: 99.92,
      tasksCompleted: 18429
    },
    county: 'Benton'
  },
  {
    agentId: 'operational-001',
    name: 'Parcel Processor Agent',
    type: 'Operational Force',
    status: 'active',
    currentTask: 'Processing property assessments',
    performance: {
      responseTime: 8.9,
      successRate: 99.89,
      tasksCompleted: 892
    },
    county: 'Benton'
  }
];

export const handlers = [
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '1.0.0',
      system: 'TerraFusion OS',
      tagline: 'Government. Transcended.',
      timestamp: new Date().toISOString(),
      uptime: '99.99%'
    });
  }),

  // County theme endpoint
  http.get('/api/county/:countyName/theme', ({ params }) => {
    const county = params.countyName as string;
    
    const themes = {
      'benton': {
        name: 'Benton',
        displayName: 'Benton County',
        colors: {
          primary: '#00B3A4',
          hero: '#0A1E2E',
          light: '#33C7BB',
          dark: '#008A7D'
        }
      },
      'yakima': {
        name: 'Yakima',
        displayName: 'Yakima County',
        colors: {
          primary: '#2FB3FF',
          hero: '#0D1A26',
          light: '#5FC5FF',
          dark: '#1A8ACC'
        }
      }
    };

    return HttpResponse.json(themes[county as keyof typeof themes] || null);
  }),

  // Government parcels endpoint
  http.get('/api/parcels', ({ request }) => {
    const url = new URL(request.url);
    const county = url.searchParams.get('county');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');

    let filteredParcels = sampleParcels;
    if (county) {
      filteredParcels = sampleParcels.filter(p => 
        p.county.toLowerCase() === county.toLowerCase()
      );
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedParcels = filteredParcels.slice(startIndex, endIndex);

    return HttpResponse.json({
      data: paginatedParcels,
      pagination: {
        page,
        limit,
        total: filteredParcels.length,
        totalPages: Math.ceil(filteredParcels.length / limit)
      },
      metadata: {
        county: county || 'all',
        generated: new Date().toISOString(),
        source: 'TerraFusion OS Mock Data'
      }
    });
  }),

  // Individual parcel endpoint
  http.get('/api/parcels/:parcelId', ({ params }) => {
    const parcel = sampleParcels.find(p => p.id === params.parcelId);
    
    if (!parcel) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(parcel);
  }),

  // AI Agent status endpoint
  http.get('/api/agents/status', ({ request }) => {
    const url = new URL(request.url);
    const county = url.searchParams.get('county');

    let filteredAgents = sampleAgents;
    if (county) {
      filteredAgents = sampleAgents.filter(a => 
        !a.county || a.county.toLowerCase() === county.toLowerCase()
      );
    }

    return HttpResponse.json({
      agents: filteredAgents,
      summary: {
        total: filteredAgents.length,
        active: filteredAgents.filter(a => a.status === 'active').length,
        processing: filteredAgents.filter(a => a.status === 'processing').length,
        avgResponseTime: filteredAgents.reduce((acc, a) => acc + a.performance.responseTime, 0) / filteredAgents.length,
        totalTasksCompleted: filteredAgents.reduce((acc, a) => acc + a.performance.tasksCompleted, 0)
      },
      government: {
        compliance: 'FISMA, NIST-800-53, Section508',
        security: 'Zero-trust, mTLS everywhere',
        availability: '99.99%'
      }
    });
  }),

  // Real-time updates endpoint
  http.get('/api/realtime/updates', () => {
    return HttpResponse.json({
      updates: [
        {
          id: 'update-001',
          type: 'parcel_updated',
          message: 'Property assessment updated for PIN 117100000100',
          timestamp: new Date().toISOString(),
          county: 'Benton'
        },
        {
          id: 'update-002',
          type: 'agent_status',
          message: 'AI Agent performance optimization completed',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          agentId: 'field-general-001'
        },
        {
          id: 'update-003',
          type: 'system_health',
          message: 'Infrastructure scaling completed - 99.99% uptime maintained',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ],
      systemStatus: {
        status: 'operational',
        uptime: '99.99%',
        activeConnections: 1847,
        processingQueue: 23
      }
    });
  }),

  // Government permits endpoint
  http.get('/api/permits', ({ request }) => {
    const url = new URL(request.url);
    const county = url.searchParams.get('county');

    return HttpResponse.json({
      permits: [
        {
          id: 'PERMIT-BN-2024-001',
          type: 'Building',
          description: 'Single Family Residence',
          status: 'Approved',
          applicant: 'Smith Construction LLC',
          address: '789 New Development Ave, Kennewick, WA',
          county: 'Benton',
          submittedDate: '2024-08-15',
          approvedDate: '2024-09-10',
          value: 850000
        }
      ],
      processingTime: {
        average: '18 days',
        target: '21 days',
        compliance: 'Within government standards'
      }
    });
  }),

  // Government analytics endpoint
  http.get('/api/analytics/dashboard', ({ request }) => {
    const url = new URL(request.url);
    const county = url.searchParams.get('county');

    return HttpResponse.json({
      county: county || 'Combined',
      metrics: {
        totalParcels: 89247,
        totalAssessedValue: 24700000000,
        averageProcessingTime: '6.7ms',
        systemUptime: '99.99%',
        agentPerformance: 'Optimal',
        citizenSatisfaction: '98.7%'
      },
      government: {
        tagline: 'Government. Transcended.',
        motto: 'Infrastructure Intelligence, Infinite Scale',
        compliance: ['FISMA', 'NIST-800-53', 'Section508', 'WCAG2.1', 'SOC2']
      }
    });
  })
];

// Export MSW configuration for README
export const mswConfig = {
  name: 'TerraFusion OS MSW Development Infrastructure',
  description: 'Mock Service Worker for offline government data development',
  endpoints: handlers.length,
  features: [
    'Government parcel data simulation',
    'AI agent status monitoring',
    'Real-time update streaming',
    'County-specific data filtering',
    'Government permit processing',
    'Analytics dashboard data',
    'Health check endpoints'
  ],
  compliance: ['FISMA', 'NIST-800-53', 'Section508', 'WCAG2.1', 'SOC2']
};