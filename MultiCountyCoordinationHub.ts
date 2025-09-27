/**
 * Multi-County Coordination Hub
 * 
 * Advanced inter-county collaboration system for Washington State counties
 * Features: Resource sharing, data synchronization, collaborative governance,
 * cross-county emergency response, shared services coordination
 * 
 * TerraFusion OS - Government Edition
 * Security Level: Government Grade (FISMA Moderate)
 */

export interface CountyProfile {
  id: string;
  name: string;
  state: string;
  population: number;
  area_sq_miles: number;
  budget_annual: number;
  parcels_count: number;
  government_type: string;
  elected_officials: ElectedOfficial[];
  departments: CountyDepartment[];
  contact_info: ContactInfo;
  capabilities: CountyCapability[];
  resources: CountyResource[];
  emergency_contacts: EmergencyContact[];
  coordination_level: CoordinationLevel;
  data_sharing_agreements: DataSharingAgreement[];
}

export interface ElectedOfficial {
  position: string;
  name: string;
  term_start: string;
  term_end: string;
  contact_email: string;
  district?: string;
}

export interface CountyDepartment {
  id: string;
  name: string;
  type: 'assessor' | 'planning' | 'public_works' | 'emergency' | 'health' | 'sheriff' | 'other';
  head_official: string;
  budget: number;
  staff_count: number;
  services: string[];
  shared_services_eligible: boolean;
  coordination_priority: number;
}

export interface ContactInfo {
  main_phone: string;
  main_email: string;
  website: string;
  physical_address: string;
  mailing_address: string;
  emergency_hotline: string;
  coordination_contact: string;
}

export interface CountyCapability {
  id: string;
  name: string;
  category: 'technical' | 'administrative' | 'emergency' | 'specialized';
  description: string;
  capacity_level: 'low' | 'medium' | 'high' | 'expert';
  shareable: boolean;
  required_clearance?: string;
  cost_per_hour?: number;
  availability_hours: string;
}

export interface CountyResource {
  id: string;
  name: string;
  type: 'equipment' | 'facility' | 'vehicle' | 'software' | 'expertise' | 'data';
  description: string;
  availability_status: 'available' | 'in_use' | 'maintenance' | 'reserved';
  location: string;
  capacity: number;
  cost_per_use: number;
  sharing_restrictions: string[];
  maintenance_schedule: string;
  last_inspection: string;
}

export interface EmergencyContact {
  role: string;
  name: string;
  primary_phone: string;
  backup_phone: string;
  email: string;
  authority_level: string;
  available_24_7: boolean;
}

export enum CoordinationLevel {
  BASIC = 'basic',
  STANDARD = 'standard', 
  ENHANCED = 'enhanced',
  FULL_INTEGRATION = 'full_integration'
}

export interface DataSharingAgreement {
  id: string;
  with_county: string;
  agreement_type: 'bilateral' | 'multilateral' | 'regional';
  data_categories: string[];
  effective_date: string;
  expiration_date: string;
  compliance_requirements: string[];
  access_restrictions: string[];
  audit_requirements: string[];
}

export interface ResourceRequest {
  id: string;
  requesting_county: string;
  requested_from_county: string;
  resource_type: string;
  resource_id: string;
  request_reason: string;
  urgency_level: 'routine' | 'urgent' | 'emergency' | 'critical';
  requested_start: string;
  requested_duration: string;
  estimated_cost: number;
  approval_required: boolean;
  status: ResourceRequestStatus;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  completion_notes?: string;
}

export enum ResourceRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  participating_counties: string[];
  project_lead_county: string;
  project_manager: string;
  start_date: string;
  target_completion: string;
  budget_total: number;
  budget_by_county: Record<string, number>;
  objectives: string[];
  milestones: ProjectMilestone[];
  shared_resources: string[];
  compliance_requirements: string[];
  status: ProjectStatus;
  progress_percentage: number;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  target_date: string;
  responsible_county: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  completion_date?: string;
  dependencies: string[];
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CoordinationEvent {
  id: string;
  type: 'meeting' | 'training' | 'emergency_drill' | 'conference' | 'workshop';
  title: string;
  description: string;
  organizer_county: string;
  participating_counties: string[];
  date_time: string;
  duration_hours: number;
  location: string;
  virtual_meeting_link?: string;
  agenda: string[];
  required_attendance: boolean;
  registration_deadline?: string;
  contact_person: string;
  materials_needed: string[];
}

export interface EmergencyCoordination {
  id: string;
  incident_type: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  affected_counties: string[];
  lead_county: string;
  incident_commander: string;
  start_time: string;
  status: 'active' | 'monitoring' | 'resolved' | 'escalated';
  resource_requests: string[];
  mutual_aid_activated: boolean;
  coordination_center: string;
  communication_channels: string[];
  situation_updates: SituationUpdate[];
}

export interface SituationUpdate {
  timestamp: string;
  update_by: string;
  county: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent' | 'critical';
  attachments?: string[];
}

export class MultiCountyCoordinationHub {
  private counties: Map<string, CountyProfile> = new Map();
  private resourceRequests: Map<string, ResourceRequest> = new Map();
  private collaborationProjects: Map<string, CollaborationProject> = new Map();
  private coordinationEvents: Map<string, CoordinationEvent> = new Map();
  private emergencyCoordinations: Map<string, EmergencyCoordination> = new Map();
  private dataSharingMatrix: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeWashingtonCounties();
    this.setupDefaultDataSharingAgreements();
    this.initializeResourceSharingNetwork();
  }

  /**
   * Initialize Washington State counties with comprehensive profiles
   */
  private initializeWashingtonCounties(): void {
    const washingtonCounties = [
      'Adams County', 'Asotin County', 'Benton County', 'Chelan County', 'Clallam County',
      'Clark County', 'Columbia County', 'Cowlitz County', 'Douglas County', 'Ferry County',
      'Franklin County', 'Garfield County', 'Grant County', 'Grays Harbor County', 'Island County',
      'Jefferson County', 'King County', 'Kitsap County', 'Kittitas County', 'Klickitat County',
      'Lewis County', 'Lincoln County', 'Mason County', 'Okanogan County', 'Pacific County',
      'Pend Oreille County', 'Pierce County', 'San Juan County', 'Skagit County', 'Skamania County',
      'Snohomish County', 'Spokane County', 'Stevens County', 'Thurston County', 'Wahkiakum County',
      'Walla Walla County', 'Whatcom County', 'Whitman County', 'Yakima County'
    ];

    washingtonCounties.forEach((countyName, index) => {
      const profile = this.generateCountyProfile(countyName, index);
      this.counties.set(profile.id, profile);
    });
  }

  /**
   * Generate comprehensive county profile
   */
  private generateCountyProfile(name: string, index: number): CountyProfile {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const population = 50000 + (index * 25000) + Math.floor(Math.random() * 100000);
    
    return {
      id,
      name,
      state: 'Washington',
      population,
      area_sq_miles: 500 + Math.floor(Math.random() * 2000),
      budget_annual: population * 2500 + Math.floor(Math.random() * 50000000),
      parcels_count: Math.floor(population * 0.4),
      government_type: 'County Commission',
      elected_officials: this.generateElectedOfficials(),
      departments: this.generateCountyDepartments(),
      contact_info: this.generateContactInfo(name),
      capabilities: this.generateCountyCapabilities(),
      resources: this.generateCountyResources(),
      emergency_contacts: this.generateEmergencyContacts(),
      coordination_level: this.determineCoordinationLevel(population),
      data_sharing_agreements: []
    };
  }

  private generateElectedOfficials(): ElectedOfficial[] {
    return [
      {
        position: 'County Commissioner - District 1',
        name: this.generatePersonName(),
        term_start: '2022-01-01',
        term_end: '2026-01-01',
        contact_email: 'commissioner1@county.wa.gov',
        district: 'District 1'
      },
      {
        position: 'County Commissioner - District 2', 
        name: this.generatePersonName(),
        term_start: '2022-01-01',
        term_end: '2026-01-01',
        contact_email: 'commissioner2@county.wa.gov',
        district: 'District 2'
      },
      {
        position: 'County Assessor',
        name: this.generatePersonName(),
        term_start: '2023-01-01',
        term_end: '2027-01-01',
        contact_email: 'assessor@county.wa.gov'
      },
      {
        position: 'Sheriff',
        name: this.generatePersonName(),
        term_start: '2022-01-01',
        term_end: '2026-01-01',
        contact_email: 'sheriff@county.wa.gov'
      }
    ];
  }

  private generateCountyDepartments(): CountyDepartment[] {
    return [
      {
        id: 'assessor',
        name: 'Assessor Office',
        type: 'assessor',
        head_official: this.generatePersonName(),
        budget: 2500000 + Math.floor(Math.random() * 1000000),
        staff_count: 15 + Math.floor(Math.random() * 25),
        services: ['Property Assessment', 'Tax Roll Maintenance', 'Appeals Processing'],
        shared_services_eligible: true,
        coordination_priority: 1
      },
      {
        id: 'planning',
        name: 'Planning & Development',
        type: 'planning',
        head_official: this.generatePersonName(),
        budget: 1800000 + Math.floor(Math.random() * 800000),
        staff_count: 12 + Math.floor(Math.random() * 18),
        services: ['Land Use Planning', 'Building Permits', 'Code Enforcement'],
        shared_services_eligible: true,
        coordination_priority: 2
      },
      {
        id: 'emergency',
        name: 'Emergency Management',
        type: 'emergency',
        head_official: this.generatePersonName(),
        budget: 1200000 + Math.floor(Math.random() * 600000),
        staff_count: 8 + Math.floor(Math.random() * 12),
        services: ['Emergency Response', 'Disaster Planning', 'Public Safety Coordination'],
        shared_services_eligible: true,
        coordination_priority: 1
      },
      {
        id: 'sheriff',
        name: 'Sheriff Department',
        type: 'sheriff',
        head_official: this.generatePersonName(),
        budget: 15000000 + Math.floor(Math.random() * 10000000),
        staff_count: 80 + Math.floor(Math.random() * 120),
        services: ['Law Enforcement', 'Jail Operations', 'Court Security'],
        shared_services_eligible: true,
        coordination_priority: 1
      }
    ];
  }

  private generateContactInfo(countyName: string): ContactInfo {
    const domainName = countyName.toLowerCase().replace(/[^a-z]/g, '');
    return {
      main_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      main_email: `info@${domainName}county.wa.gov`,
      website: `https://www.${domainName}county.wa.gov`,
      physical_address: `${Math.floor(Math.random() * 9000 + 1000)} Government Way, ${countyName.split(' ')[0]}, WA ${Math.floor(Math.random() * 90000 + 10000)}`,
      mailing_address: `PO Box ${Math.floor(Math.random() * 9000 + 1000)}, ${countyName.split(' ')[0]}, WA ${Math.floor(Math.random() * 90000 + 10000)}`,
      emergency_hotline: '911',
      coordination_contact: `coordination@${domainName}county.wa.gov`
    };
  }

  private generateCountyCapabilities(): CountyCapability[] {
    return [
      {
        id: 'gis_services',
        name: 'GIS & Mapping Services',
        category: 'technical',
        description: 'Geographic Information Systems analysis and mapping services',
        capacity_level: Math.random() > 0.5 ? 'high' : 'medium',
        shareable: true,
        cost_per_hour: 125,
        availability_hours: 'Business Hours'
      },
      {
        id: 'emergency_response',
        name: 'Emergency Response Coordination',
        category: 'emergency',
        description: 'Multi-agency emergency response coordination and management',
        capacity_level: Math.random() > 0.3 ? 'high' : 'medium',
        shareable: true,
        required_clearance: 'Emergency Management',
        availability_hours: '24/7'
      },
      {
        id: 'legal_services',
        name: 'Legal & Compliance Services',
        category: 'administrative',
        description: 'Legal review, compliance assistance, and regulatory guidance',
        capacity_level: Math.random() > 0.7 ? 'expert' : 'high',
        shareable: true,
        cost_per_hour: 200,
        availability_hours: 'Business Hours'
      },
      {
        id: 'it_services',
        name: 'IT Infrastructure & Support',
        category: 'technical',
        description: 'IT infrastructure, cybersecurity, and technical support services',
        capacity_level: Math.random() > 0.6 ? 'high' : 'medium',
        shareable: true,
        required_clearance: 'IT Security',
        cost_per_hour: 150,
        availability_hours: 'Extended Hours'
      }
    ];
  }

  private generateCountyResources(): CountyResource[] {
    return [
      {
        id: 'mobile_command_center',
        name: 'Mobile Emergency Command Center',
        type: 'vehicle',
        description: 'Fully equipped mobile command center for emergency response',
        availability_status: Math.random() > 0.8 ? 'in_use' : 'available',
        location: 'County Emergency Services Building',
        capacity: 1,
        cost_per_use: 2500,
        sharing_restrictions: ['Emergency Use Only', 'Trained Operator Required'],
        maintenance_schedule: 'Monthly',
        last_inspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'gis_server_cluster',
        name: 'High-Performance GIS Server Cluster',
        type: 'equipment',
        description: 'Dedicated server cluster for intensive GIS processing and analysis',
        availability_status: 'available',
        location: 'County IT Data Center',
        capacity: 100,
        cost_per_use: 50,
        sharing_restrictions: ['Data Security Agreement Required'],
        maintenance_schedule: 'Weekly',
        last_inspection: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'conference_facility',
        name: 'Multi-County Conference Facility',
        type: 'facility',
        description: 'Large conference facility with video conferencing capabilities',
        availability_status: 'available',
        location: 'County Administration Building',
        capacity: 150,
        cost_per_use: 800,
        sharing_restrictions: ['Government Use Only', '48 Hour Notice Required'],
        maintenance_schedule: 'As Needed',
        last_inspection: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private generateEmergencyContacts(): EmergencyContact[] {
    return [
      {
        role: 'Emergency Management Director',
        name: this.generatePersonName(),
        primary_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        backup_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        email: 'emergency.director@county.wa.gov',
        authority_level: 'Incident Command Authority',
        available_24_7: true
      },
      {
        role: 'Sheriff',
        name: this.generatePersonName(),
        primary_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        backup_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        email: 'sheriff@county.wa.gov',
        authority_level: 'Law Enforcement Authority',
        available_24_7: true
      },
      {
        role: 'County Administrator',
        name: this.generatePersonName(),
        primary_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        backup_phone: `(509) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        email: 'administrator@county.wa.gov',
        authority_level: 'Administrative Authority',
        available_24_7: false
      }
    ];
  }

  private determineCoordinationLevel(population: number): CoordinationLevel {
    if (population > 500000) return CoordinationLevel.FULL_INTEGRATION;
    if (population > 200000) return CoordinationLevel.ENHANCED;
    if (population > 75000) return CoordinationLevel.STANDARD;
    return CoordinationLevel.BASIC;
  }

  private generatePersonName(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Mary', 'James', 'Patricia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  /**
   * Setup default data sharing agreements between counties
   */
  private setupDefaultDataSharingAgreements(): void {
    const counties = Array.from(this.counties.values());
    
    // Regional data sharing agreements (neighboring counties)
    counties.forEach(county => {
      const nearbyCounties = this.findNearbyCounties(county.id);
      nearbyCounties.forEach(nearbyCountyId => {
        this.createDataSharingAgreement(county.id, nearbyCountyId, 'bilateral');
      });
    });

    // Statewide emergency data sharing
    this.createMultilateralDataSharingAgreement(
      counties.map(c => c.id),
      'emergency_management',
      ['Emergency Response Data', 'Resource Availability', 'Contact Information']
    );
  }

  /**
   * Initialize resource sharing network
   */
  private initializeResourceSharingNetwork(): void {
    // Create sample resource requests
    this.createSampleResourceRequests();
    
    // Create sample collaboration projects
    this.createSampleCollaborationProjects();
    
    // Create sample coordination events
    this.createSampleCoordinationEvents();
  }

  /**
   * Find nearby counties for regional coordination
   */
  private findNearbyCounties(countyId: string): string[] {
    // Simplified logic - in production this would use geographic data
    const allCounties = Array.from(this.counties.keys());
    const county = this.counties.get(countyId);
    if (!county) return [];
    
    // Return 2-4 random counties as "neighbors"
    const neighborCount = 2 + Math.floor(Math.random() * 3);
    const neighbors = allCounties
      .filter(id => id !== countyId)
      .sort(() => Math.random() - 0.5)
      .slice(0, neighborCount);
      
    return neighbors;
  }

  /**
   * Create bilateral data sharing agreement
   */
  private createDataSharingAgreement(
    county1: string, 
    county2: string, 
    type: 'bilateral' | 'multilateral'
  ): void {
    const agreementId = `dsa-${county1}-${county2}-${Date.now()}`;
    const agreement: DataSharingAgreement = {
      id: agreementId,
      with_county: county2,
      agreement_type: type,
      data_categories: ['Public Records', 'Property Information', 'Geographic Data'],
      effective_date: '2024-01-01',
      expiration_date: '2029-01-01',
      compliance_requirements: ['FISMA Moderate', 'State Records Retention'],
      access_restrictions: ['Government Personnel Only', 'Audit Trail Required'],
      audit_requirements: ['Annual Review', 'Quarterly Usage Reports']
    };

    const county1Profile = this.counties.get(county1);
    if (county1Profile) {
      county1Profile.data_sharing_agreements.push(agreement);
    }

    // Track sharing relationships
    if (!this.dataSharingMatrix.has(county1)) {
      this.dataSharingMatrix.set(county1, new Set());
    }
    this.dataSharingMatrix.get(county1)?.add(county2);
  }

  /**
   * Create multilateral data sharing agreement
   */
  private createMultilateralDataSharingAgreement(
    counties: string[],
    agreementType: string,
    dataCategories: string[]
  ): void {
    counties.forEach(countyId => {
      const agreementId = `msa-${agreementType}-${Date.now()}`;
      const agreement: DataSharingAgreement = {
        id: agreementId,
        with_county: 'ALL_WASHINGTON_COUNTIES',
        agreement_type: 'multilateral',
        data_categories: dataCategories,
        effective_date: '2024-01-01',
        expiration_date: '2029-01-01',
        compliance_requirements: ['FISMA High', 'Emergency Management Standards'],
        access_restrictions: ['Emergency Personnel Only', 'Incident-Based Access'],
        audit_requirements: ['Continuous Monitoring', 'Incident Reports']
      };

      const countyProfile = this.counties.get(countyId);
      if (countyProfile) {
        countyProfile.data_sharing_agreements.push(agreement);
      }
    });
  }

  /**
   * Create sample resource requests
   */
  private createSampleResourceRequests(): void {
    const sampleRequests = [
      {
        requesting: 'bentoncounty',
        requested_from: 'franklincounty',
        resource_type: 'vehicle',
        resource_id: 'mobile_command_center',
        reason: 'Multi-county emergency drill coordination',
        urgency: 'routine' as const
      },
      {
        requesting: 'yakimacounty',
        requested_from: 'bentoncounty',
        resource_type: 'equipment',
        resource_id: 'gis_server_cluster',
        reason: 'Large-scale agricultural mapping project',
        urgency: 'urgent' as const
      },
      {
        requesting: 'franklincounty',
        requested_from: 'yakimacounty',
        resource_type: 'expertise',
        resource_id: 'legal_services',
        reason: 'Complex zoning dispute resolution',
        urgency: 'routine' as const
      }
    ];

    sampleRequests.forEach((request, index) => {
      const resourceRequest: ResourceRequest = {
        id: `req-${Date.now()}-${index}`,
        requesting_county: request.requesting,
        requested_from_county: request.requested_from,
        resource_type: request.resource_type,
        resource_id: request.resource_id,
        request_reason: request.reason,
        urgency_level: request.urgency,
        requested_start: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        requested_duration: '3 days',
        estimated_cost: 1500 + (index * 500),
        approval_required: true,
        status: index === 0 ? ResourceRequestStatus.APPROVED : 
                index === 1 ? ResourceRequestStatus.PENDING :
                ResourceRequestStatus.IN_PROGRESS,
        created_at: new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
      this.resourceRequests.set(resourceRequest.id, resourceRequest);
    });
  }

  /**
   * Create sample collaboration projects
   */
  private createSampleCollaborationProjects(): void {
    const project: CollaborationProject = {
      id: `proj-regional-gis-${Date.now()}`,
      name: 'Regional GIS Data Standardization Initiative',
      description: 'Multi-county effort to standardize GIS data formats and sharing protocols',
      participating_counties: ['bentoncounty', 'franklincounty', 'yakimacounty', 'wallawallacounty'],
      project_lead_county: 'bentoncounty',
      project_manager: 'Sarah Johnson',
      start_date: '2024-01-15',
      target_completion: '2024-12-31',
      budget_total: 850000,
      budget_by_county: {
        'bentoncounty': 300000,
        'franklincounty': 200000,
        'yakimacounty': 250000,
        'wallawallacounty': 100000
      },
      objectives: [
        'Standardize GIS data formats across participating counties',
        'Implement real-time data sharing protocols',
        'Establish common mapping standards and symbology',
        'Create unified property assessment data model'
      ],
      milestones: [
        {
          id: 'milestone-1',
          name: 'Data Format Analysis Complete',
          description: 'Complete analysis of current data formats and standardization requirements',
          target_date: '2024-03-31',
          responsible_county: 'bentoncounty',
          status: 'completed',
          completion_date: '2024-03-28',
          dependencies: []
        },
        {
          id: 'milestone-2',
          name: 'Standard Data Model Approved',
          description: 'Finalize and approve unified data model for all participating counties',
          target_date: '2024-06-30',
          responsible_county: 'yakimacounty',
          status: 'in_progress',
          dependencies: ['milestone-1']
        },
        {
          id: 'milestone-3',
          name: 'Implementation Phase 1',
          description: 'Begin implementation of standardized formats in pilot counties',
          target_date: '2024-09-30',
          responsible_county: 'franklincounty',
          status: 'not_started',
          dependencies: ['milestone-2']
        }
      ],
      shared_resources: ['gis_server_cluster', 'gis_services', 'it_services'],
      compliance_requirements: ['FISMA Moderate', 'State GIS Standards', 'Data Retention Policies'],
      status: ProjectStatus.ACTIVE,
      progress_percentage: 35
    };

    this.collaborationProjects.set(project.id, project);
  }

  /**
   * Create sample coordination events
   */
  private createSampleCoordinationEvents(): void {
    const events = [
      {
        type: 'meeting' as const,
        title: 'Quarterly Inter-County Coordination Meeting',
        description: 'Regular coordination meeting for Washington State counties',
        organizer: 'bentoncounty',
        participants: ['bentoncounty', 'franklincounty', 'yakimacounty', 'wallawallacounty'],
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 4
      },
      {
        type: 'training' as const,
        title: 'Emergency Response Coordination Training',
        description: 'Multi-county emergency response coordination training exercise',
        organizer: 'yakimacounty',
        participants: ['yakimacounty', 'bentoncounty', 'franklincounty'],
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 8
      },
      {
        type: 'conference' as const,
        title: 'Washington Counties Technology Summit',
        description: 'Annual technology summit for county IT departments',
        organizer: 'kingcounty',
        participants: Array.from(this.counties.keys()).slice(0, 15),
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 16
      }
    ];

    events.forEach((event, index) => {
      const coordinationEvent: CoordinationEvent = {
        id: `event-${Date.now()}-${index}`,
        type: event.type,
        title: event.title,
        description: event.description,
        organizer_county: event.organizer,
        participating_counties: event.participants,
        date_time: event.date,
        duration_hours: event.duration,
        location: 'Multi-County Conference Center',
        virtual_meeting_link: 'https://meet.terrafusion.gov/county-coordination',
        agenda: [
          'Welcome and Introductions',
          'Resource Sharing Updates',
          'Collaboration Project Status',
          'Emergency Preparedness Review',
          'Technology Updates',
          'Next Steps and Action Items'
        ],
        required_attendance: event.type === 'training',
        registration_deadline: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        contact_person: 'County Coordination Office',
        materials_needed: ['Laptop', 'County Data Reports', 'Emergency Contact Lists']
      };

      this.coordinationEvents.set(coordinationEvent.id, coordinationEvent);
    });
  }

  // Public API Methods

  /**
   * Get all counties with their profiles
   */
  public getAllCounties(): CountyProfile[] {
    return Array.from(this.counties.values());
  }

  /**
   * Get specific county profile
   */
  public getCountyProfile(countyId: string): CountyProfile | null {
    return this.counties.get(countyId) || null;
  }

  /**
   * Submit resource request
   */
  public submitResourceRequest(request: Omit<ResourceRequest, 'id' | 'status' | 'created_at'>): string {
    const resourceRequest: ResourceRequest = {
      ...request,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: ResourceRequestStatus.PENDING,
      created_at: new Date().toISOString()
    };

    this.resourceRequests.set(resourceRequest.id, resourceRequest);
    return resourceRequest.id;
  }

  /**
   * Get resource requests for a county
   */
  public getResourceRequests(countyId?: string): ResourceRequest[] {
    const requests = Array.from(this.resourceRequests.values());
    if (!countyId) return requests;
    
    return requests.filter(req => 
      req.requesting_county === countyId || req.requested_from_county === countyId
    );
  }

  /**
   * Approve or reject resource request
   */
  public updateResourceRequestStatus(
    requestId: string,
    status: ResourceRequestStatus,
    approvedBy?: string,
    notes?: string
  ): boolean {
    const request = this.resourceRequests.get(requestId);
    if (!request) return false;

    request.status = status;
    if (status === ResourceRequestStatus.APPROVED && approvedBy) {
      request.approved_by = approvedBy;
      request.approved_at = new Date().toISOString();
    }
    if (notes) {
      request.completion_notes = notes;
    }

    return true;
  }

  /**
   * Get available resources across all counties
   */
  public getAvailableResources(resourceType?: string): Array<{county: string, resource: CountyResource}> {
    const availableResources: Array<{county: string, resource: CountyResource}> = [];
    
    for (const [countyId, county] of this.counties) {
      county.resources
        .filter(resource => 
          resource.availability_status === 'available' &&
          (!resourceType || resource.type === resourceType)
        )
        .forEach(resource => {
          availableResources.push({ county: countyId, resource });
        });
    }

    return availableResources;
  }

  /**
   * Get collaboration projects
   */
  public getCollaborationProjects(countyId?: string): CollaborationProject[] {
    const projects = Array.from(this.collaborationProjects.values());
    if (!countyId) return projects;
    
    return projects.filter(project => 
      project.participating_counties.includes(countyId) ||
      project.project_lead_county === countyId
    );
  }

  /**
   * Create new collaboration project
   */
  public createCollaborationProject(project: Omit<CollaborationProject, 'id'>): string {
    const collaborationProject: CollaborationProject = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.collaborationProjects.set(collaborationProject.id, collaborationProject);
    return collaborationProject.id;
  }

  /**
   * Get coordination events
   */
  public getCoordinationEvents(countyId?: string): CoordinationEvent[] {
    const events = Array.from(this.coordinationEvents.values());
    if (!countyId) return events;
    
    return events.filter(event => 
      event.participating_counties.includes(countyId) ||
      event.organizer_county === countyId
    );
  }

  /**
   * Create coordination event
   */
  public createCoordinationEvent(event: Omit<CoordinationEvent, 'id'>): string {
    const coordinationEvent: CoordinationEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.coordinationEvents.set(coordinationEvent.id, coordinationEvent);
    return coordinationEvent.id;
  }

  /**
   * Get emergency coordination status
   */
  public getEmergencyCoordinations(): EmergencyCoordination[] {
    return Array.from(this.emergencyCoordinations.values());
  }

  /**
   * Activate emergency coordination
   */
  public activateEmergencyCoordination(
    incidentType: string,
    severityLevel: 'low' | 'medium' | 'high' | 'critical',
    affectedCounties: string[],
    leadCounty: string,
    incidentCommander: string
  ): string {
    const emergencyCoordination: EmergencyCoordination = {
      id: `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incident_type: incidentType,
      severity_level: severityLevel,
      affected_counties: affectedCounties,
      lead_county: leadCounty,
      incident_commander: incidentCommander,
      start_time: new Date().toISOString(),
      status: 'active',
      resource_requests: [],
      mutual_aid_activated: severityLevel === 'high' || severityLevel === 'critical',
      coordination_center: `${leadCounty} Emergency Operations Center`,
      communication_channels: ['Emergency Radio Net', 'Secure Web Portal', 'Satellite Communication'],
      situation_updates: []
    };

    this.emergencyCoordinations.set(emergencyCoordination.id, emergencyCoordination);
    return emergencyCoordination.id;
  }

  /**
   * Add situation update to emergency coordination
   */
  public addSituationUpdate(
    emergencyId: string,
    updateBy: string,
    county: string,
    message: string,
    priority: 'info' | 'warning' | 'urgent' | 'critical'
  ): boolean {
    const emergency = this.emergencyCoordinations.get(emergencyId);
    if (!emergency) return false;

    const update: SituationUpdate = {
      timestamp: new Date().toISOString(),
      update_by: updateBy,
      county,
      message,
      priority
    };

    emergency.situation_updates.push(update);
    return true;
  }

  /**
   * Get coordination statistics
   */
  public getCoordinationStatistics(): any {
    return {
      total_counties: this.counties.size,
      active_resource_requests: Array.from(this.resourceRequests.values())
        .filter(req => req.status === ResourceRequestStatus.PENDING || req.status === ResourceRequestStatus.IN_PROGRESS).length,
      active_projects: Array.from(this.collaborationProjects.values())
        .filter(proj => proj.status === ProjectStatus.ACTIVE).length,
      upcoming_events: Array.from(this.coordinationEvents.values())
        .filter(event => new Date(event.date_time) > new Date()).length,
      data_sharing_agreements: Array.from(this.counties.values())
        .reduce((total, county) => total + county.data_sharing_agreements.length, 0),
      emergency_coordinations_active: Array.from(this.emergencyCoordinations.values())
        .filter(emergency => emergency.status === 'active').length
    };
  }
}

// Export singleton instance
export const coordinationHub = new MultiCountyCoordinationHub();