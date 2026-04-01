/**
 * Team Agent Service
 *
 * This service manages AI-powered team members that collaborate on property assessment tasks.
 * It provides abilities to create, manage, and orchestrate virtual team members with different roles,
 * such as Frontend Developer, Backend Developer, Designer, QA Tester, and County Assessor.
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../storage';
import { LLMService } from './llm-service';
import { MCPService } from './mcp-service';
import { AgentSystem } from './agent-system';
import { notificationService } from './notification-service';

import {
  TeamAgentRole as TeamMemberRole,
  TeamAgentStatus as TeamMemberStatus,
  TaskPriority,
  TaskStatus,
  TeamAgent as TeamMember,
  Task as TeamTask,
  TeamCollaborationSession,
  // TeamFeedback,
  // TeamKnowledgeBaseItem,
  // InsertTeamMember,
  // InsertTask
} from '../../shared/team-agent-types';

/**
 * Type definitions for team agent capabilities
 */
interface TeamAgentCapability {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
  }[];
  execute: (params: any) => Promise<any>;
}

/**
 * Team agent configuration
 */
interface TeamAgentConfig {
  name: string;
  role: TeamMemberRole;
  capabilities: {
    skills: string[];
    expertiseLevel: 'junior' | 'mid' | 'senior' | 'expert';
    toolsAndFrameworks: string[];
    availability: {
      hoursPerWeek: number;
      preferredWorkingHours: {
        start: string;
        end: string;
      };
      timeZone: string;
    };
  };
  email: string;
  avatar?: string;
}

/**
 * Default team agent configurations
 */
const DEFAULT_TEAM_AGENTS: TeamAgentConfig[] = [
  {
    name: 'Alex Turner',
    role: TeamMemberRole.FRONTEND_DEVELOPER,
    capabilities: {
      skills: ['React', 'TypeScript', 'HTML/CSS', 'UI/UX', 'Responsive Design', 'SPA Development'],
      expertiseLevel: 'senior',
      toolsAndFrameworks: ['React', 'TypeScript', 'TailwindCSS', 'Shadcn UI', 'Vite', 'Wouter'],
      availability: {
        hoursPerWeek: 40,
        preferredWorkingHours: {
          start: '09:00',
          end: '17:00'
        },
        timeZone: 'America/Los_Angeles'
      }
    },
    email: 'alex.turner@example.com'
  },
  {
    name: 'Morgan Chen',
    role: TeamMemberRole.BACKEND_DEVELOPER,
    capabilities: {
      skills: ['Node.js', 'Express', 'Database Design', 'API Development', 'Authentication', 'Security'],
      expertiseLevel: 'senior',
      toolsAndFrameworks: ['Node.js', 'Express', 'PostgreSQL', 'Drizzle ORM', 'JWT', 'RESTful APIs'],
      availability: {
        hoursPerWeek: 40,
        preferredWorkingHours: {
          start: '08:00',
          end: '16:00'
        },
        timeZone: 'America/New_York'
      }
    },
    email: 'morgan.chen@example.com'
  },
  {
    name: 'Sam Rivera',
    role: TeamMemberRole.DESIGNER,
    capabilities: {
      skills: ['UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Visual Design', 'Design Systems'],
      expertiseLevel: 'expert',
      toolsAndFrameworks: ['Figma', 'Adobe CC', 'Sketch', 'Design Systems', 'Accessibility Standards'],
      availability: {
        hoursPerWeek: 20, // Part-time
        preferredWorkingHours: {
          start: '10:00',
          end: '15:00'
        },
        timeZone: 'America/Chicago'
      }
    },
    email: 'sam.rivera@example.com'
  },
  {
    name: 'Jordan Smith',
    role: TeamMemberRole.QA_TESTER,
    capabilities: {
      skills: ['Manual Testing', 'Automated Testing', 'Test Planning', 'Bug Tracking', 'Performance Testing'],
      expertiseLevel: 'mid',
      toolsAndFrameworks: ['Jest', 'Testing Library', 'Cypress', 'Playwright', 'Test Documentation'],
      availability: {
        hoursPerWeek: 20, // Part-time
        preferredWorkingHours: {
          start: '13:00',
          end: '18:00'
        },
        timeZone: 'America/Denver'
      }
    },
    email: 'jordan.smith@example.com'
  },
  {
    name: 'Taylor Washington',
    role: TeamMemberRole.COUNTY_ASSESSOR,
    capabilities: {
      skills: ['Property Assessment', 'Tax Valuation', 'Regulatory Compliance', 'Geographic Information Systems'],
      expertiseLevel: 'expert',
      toolsAndFrameworks: ['CAMA Systems', 'GIS Tools', 'Assessment Methodologies', 'Regulatory Frameworks'],
      availability: {
        hoursPerWeek: 8, // Available for weekly feedback
        preferredWorkingHours: {
          start: '09:00',
          end: '11:00'
        },
        timeZone: 'America/Los_Angeles'
      }
    },
    email: 'taylor.washington@example.com'
  }
];

/**
 * Team Agent Service class
 */
export class TeamAgentService {
  private storage: IStorage;
  private llmService: LLMService;
  private mcpService: MCPService;
  private agentSystem: AgentSystem;
  private teamAgentCapabilities: Map<TeamMemberRole, TeamAgentCapability[]> = new Map();
  private initialized: boolean = false;
  
  /**
   * Constructor
   */
  constructor(
    storage: IStorage,
    llmService: LLMService,
    mcpService: MCPService,
    agentSystem: AgentSystem
  ) {
    this.storage = storage;
    this.llmService = llmService;
    this.mcpService = mcpService;
    this.agentSystem = agentSystem;
    
    // Initialize capabilities for each role
    this.initializeCapabilities();
  }
  
  /**
   * Initialize the team agent service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Check if we already have team members in the database
      const existingMembers = await this.storage.getAllTeamMembers();
      
      // If no team members exist, create default ones
      if (!existingMembers || existingMembers.length === 0) {
        await this.createDefaultTeamMembers();
      }
      
      this.initialized = true;
      console.log('Team Agent Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Team Agent Service:', error);
      throw error;
    }
  }
  
  /**
   * Create default team members
   */
  private async createDefaultTeamMembers(): Promise<void> {
    try {
      for (const agentConfig of DEFAULT_TEAM_AGENTS) {
        const insertData: InsertTeamMember = {
          name: agentConfig.name,
          role: agentConfig.role,
          status: TeamMemberStatus.AVAILABLE,
          capabilities: agentConfig.capabilities,
          email: agentConfig.email,
          avatar: agentConfig.avatar
        };
        
        await this.storage.createTeamMember(insertData);
      }
      
      console.log('Default team members created successfully');
    } catch (error) {
      console.error('Failed to create default team members:', error);
      throw error;
    }
  }
  
  /**
   * Initialize capabilities for each role
   */
  private initializeCapabilities(): void {
    // Frontend Developer capabilities
    this.teamAgentCapabilities.set(TeamMemberRole.FRONTEND_DEVELOPER, [
      {
        name: 'create_ui_component',
        description: 'Create a new UI component for the frontend',
        parameters: [
          {
            name: 'componentName',
            type: 'string',
            description: 'Name of the component to create',
            required: true
          },
          {
            name: 'componentType',
            type: 'string',
            description: 'Type of component (page, form, table, card, etc.)',
            required: true
          },
          {
            name: 'requirements',
            type: 'string',
            description: 'Detailed requirements for the component',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for creating UI component
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert frontend developer specializing in React, TypeScript, and modern UI libraries. Your task is to create high-quality, accessible, and performant UI components following best practices.`
              },
              {
                role: 'user',
                content: `Please create a ${params.componentType} component named ${params.componentName} with the following requirements:\n\n${params.requirements}\n\nProvide the complete TypeScript/React code, including imports, types, and any necessary CSS or styling.`
              }
            ]
          });
          
          return {
            componentName: params.componentName,
            componentType: params.componentType,
            code: response.content,
            suggestedFiles: this.extractSuggestedFiles(response.content, params.componentName)
          };
        }
      },
      {
        name: 'review_ui_code',
        description: 'Review frontend code for best practices and improvements',
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Code to review',
            required: true
          },
          {
            name: 'focusAreas',
            type: 'array',
            description: 'Areas to focus on during review (e.g., performance, accessibility, etc.)',
            required: false,
            default: ['performance', 'accessibility', 'best practices']
          }
        ],
        execute: async (params) => {
          // Implementation for code review
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert frontend code reviewer specializing in React, TypeScript, and modern UI libraries. Your task is to provide detailed, actionable feedback on code quality, architecture, and best practices.`
              },
              {
                role: 'user',
                content: `Please review the following code focusing on these areas: ${params.focusAreas.join(', ')}.\n\n${params.code}\n\nProvide specific recommendations for improvements, potential bugs, and adherence to best practices.`
              }
            ]
          });
          
          return {
            feedback: response.content,
            improvedCode: this.extractImprovedCode(response.content)
          };
        }
      },
      {
        name: 'implement_feature',
        description: 'Implement a new frontend feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature to implement',
            required: true
          },
          {
            name: 'featureDescription',
            type: 'string',
            description: 'Detailed description of the feature',
            required: true
          },
          {
            name: 'existingComponents',
            type: 'array',
            description: 'List of existing components that may be relevant',
            required: false,
            default: []
          }
        ],
        execute: async (params) => {
          // Implementation for feature implementation
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert frontend developer specializing in implementing complex features using React, TypeScript, and modern state management. Your task is to develop complete feature implementations that integrate well with existing codebases.`
              },
              {
                role: 'user',
                content: `Please implement the following feature: ${params.featureName}\n\nDescription: ${params.featureDescription}\n\nRelevant existing components: ${params.existingComponents.join(', ')}\n\nProvide a complete implementation including all necessary files, components, hooks, and tests.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            implementation: response.content,
            files: this.extractFiles(response.content)
          };
        }
      }
    ]);
    
    // Backend Developer capabilities
    this.teamAgentCapabilities.set(TeamMemberRole.BACKEND_DEVELOPER, [
      {
        name: 'create_api_endpoint',
        description: 'Create a new API endpoint',
        parameters: [
          {
            name: 'endpointPath',
            type: 'string',
            description: 'Path of the endpoint (e.g., /api/properties)',
            required: true
          },
          {
            name: 'method',
            type: 'string',
            description: 'HTTP method (GET, POST, PUT, DELETE)',
            required: true
          },
          {
            name: 'requirements',
            type: 'string',
            description: 'Detailed requirements for the endpoint',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for creating API endpoint
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert backend developer specializing in Node.js, Express, and RESTful API design. Your task is to create secure, performant, and well-documented API endpoints following best practices.`
              },
              {
                role: 'user',
                content: `Please create a ${params.method} endpoint at ${params.endpointPath} with the following requirements:\n\n${params.requirements}\n\nProvide the complete TypeScript code for the endpoint, including route definition, controller logic, validation, error handling, and any necessary middleware.`
              }
            ]
          });
          
          return {
            endpointPath: params.endpointPath,
            method: params.method,
            code: response.content,
            suggestedFiles: this.extractSuggestedFiles(response.content, params.endpointPath)
          };
        }
      },
      {
        name: 'design_database_schema',
        description: 'Design database schema for a feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature requiring a database schema',
            required: true
          },
          {
            name: 'requirements',
            type: 'string',
            description: 'Detailed requirements for the database schema',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for designing database schema
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert database designer specializing in PostgreSQL, data modeling, and ORM integration. Your task is to create efficient, normalized, and scalable database schemas following best practices.`
              },
              {
                role: 'user',
                content: `Please design a database schema for the "${params.featureName}" feature with the following requirements:\n\n${params.requirements}\n\nProvide the complete schema definition using Drizzle ORM, including tables, columns, relationships, indexes, and any necessary constraints. Also include explanations of your design choices.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            schema: response.content,
            suggestedTables: this.extractSuggestedTables(response.content)
          };
        }
      },
      {
        name: 'optimize_query',
        description: 'Optimize a database query for performance',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'The query to optimize',
            required: true
          },
          {
            name: 'context',
            type: 'string',
            description: 'Additional context about the query and its usage',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for query optimization
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert in database performance optimization specializing in PostgreSQL, query tuning, and index optimization. Your task is to analyze and improve query performance while maintaining correct behavior.`
              },
              {
                role: 'user',
                content: `Please optimize the following query for better performance:\n\n${params.query}\n\nContext: ${params.context}\n\nProvide the optimized query along with an explanation of your changes, expected performance improvements, and any suggested indexes or schema changes.`
              }
            ]
          });
          
          return {
            originalQuery: params.query,
            optimizedQuery: this.extractOptimizedQuery(response.content),
            explanation: response.content
          };
        }
      }
    ]);
    
    // Designer capabilities
    this.teamAgentCapabilities.set(TeamMemberRole.DESIGNER, [
      {
        name: 'design_ui_mockup',
        description: 'Create a UI mockup for a feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature requiring a mockup',
            required: true
          },
          {
            name: 'requirements',
            type: 'string',
            description: 'Detailed requirements for the mockup',
            required: true
          },
          {
            name: 'style',
            type: 'string',
            description: 'Style guidelines to follow',
            required: false,
            default: 'Modern, clean, professional interface using system design tokens'
          }
        ],
        execute: async (params) => {
          // Implementation for creating UI mockup
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert UI designer specializing in creating clean, accessible, and user-friendly interfaces. Your task is to create detailed mockups that balance aesthetics with usability.`
              },
              {
                role: 'user',
                content: `Please create a UI mockup for the "${params.featureName}" feature with the following requirements:\n\n${params.requirements}\n\nStyle guidelines: ${params.style}\n\nProvide a detailed description of the mockup, including layout, components, color scheme, typography, and interactions. Include any ASCII art or diagrams that would help illustrate the design.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            mockupDescription: response.content,
            suggestedComponents: this.extractSuggestedComponents(response.content)
          };
        }
      },
      {
        name: 'review_ui_design',
        description: 'Review a UI design for usability and aesthetics',
        parameters: [
          {
            name: 'design',
            type: 'string',
            description: 'Description of the design to review',
            required: true
          },
          {
            name: 'focusAreas',
            type: 'array',
            description: 'Areas to focus on during review (e.g., accessibility, visual hierarchy, etc.)',
            required: false,
            default: ['accessibility', 'visual hierarchy', 'consistency', 'usability']
          }
        ],
        execute: async (params) => {
          // Implementation for design review
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert UI/UX design reviewer specializing in usability, accessibility, and visual design. Your task is to provide detailed, actionable feedback to improve designs.`
              },
              {
                role: 'user',
                content: `Please review the following UI design focusing on these areas: ${params.focusAreas.join(', ')}.\n\n${params.design}\n\nProvide specific recommendations for improvements, potential usability issues, and adherence to best practices.`
              }
            ]
          });
          
          return {
            feedback: response.content,
            improvementSuggestions: this.extractImprovementSuggestions(response.content)
          };
        }
      },
      {
        name: 'create_design_system_component',
        description: 'Create a new component for the design system',
        parameters: [
          {
            name: 'componentName',
            type: 'string',
            description: 'Name of the component to create',
            required: true
          },
          {
            name: 'requirements',
            type: 'string',
            description: 'Detailed requirements for the component',
            required: true
          },
          {
            name: 'variants',
            type: 'array',
            description: 'Variants of the component to create',
            required: false,
            default: ['default', 'hover', 'active', 'disabled']
          }
        ],
        execute: async (params) => {
          // Implementation for creating design system component
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert UI designer specializing in design systems. Your task is to create consistent, reusable, and accessible components that follow design system principles.`
              },
              {
                role: 'user',
                content: `Please create a design system component named "${params.componentName}" with the following requirements:\n\n${params.requirements}\n\nVariants: ${params.variants.join(', ')}\n\nProvide a detailed specification including visual design, behavior, accessibility considerations, and code implementation suggestions.`
              }
            ]
          });
          
          return {
            componentName: params.componentName,
            specification: response.content,
            suggestedVariants: this.extractComponentVariants(response.content, params.variants)
          };
        }
      }
    ]);
    
    // QA Tester capabilities
    this.teamAgentCapabilities.set(TeamMemberRole.QA_TESTER, [
      {
        name: 'create_test_plan',
        description: 'Create a test plan for a feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature to test',
            required: true
          },
          {
            name: 'featureDescription',
            type: 'string',
            description: 'Detailed description of the feature',
            required: true
          },
          {
            name: 'testTypes',
            type: 'array',
            description: 'Types of tests to include (e.g., functional, performance, etc.)',
            required: false,
            default: ['functional', 'integration', 'edge cases', 'accessibility']
          }
        ],
        execute: async (params) => {
          // Implementation for creating test plan
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert QA tester specializing in comprehensive test planning. Your task is to create detailed test plans that cover all aspects of functionality and edge cases.`
              },
              {
                role: 'user',
                content: `Please create a test plan for the "${params.featureName}" feature with the following description:\n\n${params.featureDescription}\n\nTest types to include: ${params.testTypes.join(', ')}\n\nProvide a comprehensive test plan including test scenarios, test cases, expected results, and any prerequisites or test data required.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            testPlan: response.content,
            testCases: this.extractTestCases(response.content)
          };
        }
      },
      {
        name: 'perform_functionality_test',
        description: 'Perform a functionality test on a feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature to test',
            required: true
          },
          {
            name: 'featureDescription',
            type: 'string',
            description: 'Detailed description of the feature',
            required: true
          },
          {
            name: 'testScenario',
            type: 'string',
            description: 'Specific test scenario to execute',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for performing functionality test
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert QA tester specializing in functionality testing. Your task is to thoroughly test features against requirements and identify any issues or edge cases.`
              },
              {
                role: 'user',
                content: `Please perform a functionality test for the "${params.featureName}" feature with the following description:\n\n${params.featureDescription}\n\nTest scenario: ${params.testScenario}\n\nProvide a detailed test report including test steps, expected vs. actual results, any bugs or issues found, and suggestions for improvement.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            testScenario: params.testScenario,
            testReport: response.content,
            issues: this.extractIssues(response.content)
          };
        }
      },
      {
        name: 'write_automated_tests',
        description: 'Write automated tests for a feature',
        parameters: [
          {
            name: 'featureName',
            type: 'string',
            description: 'Name of the feature to test',
            required: true
          },
          {
            name: 'codeToTest',
            type: 'string',
            description: 'Code to write tests for',
            required: true
          },
          {
            name: 'testFramework',
            type: 'string',
            description: 'Testing framework to use',
            required: false,
            default: 'Jest'
          }
        ],
        execute: async (params) => {
          // Implementation for writing automated tests
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert in automated testing specializing in ${params.testFramework} and test-driven development. Your task is to write comprehensive, maintainable tests that ensure code quality and prevent regressions.`
              },
              {
                role: 'user',
                content: `Please write automated tests for the "${params.featureName}" feature using ${params.testFramework}. Here is the code to test:\n\n${params.codeToTest}\n\nProvide complete test code with appropriate test cases, mocks/stubs where needed, and clear assertions. Include both happy path and error handling tests.`
              }
            ]
          });
          
          return {
            featureName: params.featureName,
            testFramework: params.testFramework,
            testCode: response.content,
            testCoverage: this.extractTestCoverage(response.content)
          };
        }
      }
    ]);
    
    // County Assessor capabilities
    this.teamAgentCapabilities.set(TeamMemberRole.COUNTY_ASSESSOR, [
      {
        name: 'review_property_assessment',
        description: 'Review a property assessment for accuracy and compliance',
        parameters: [
          {
            name: 'propertyId',
            type: 'string',
            description: 'ID of the property to review',
            required: true
          },
          {
            name: 'assessmentData',
            type: 'string',
            description: 'Assessment data to review',
            required: true
          }
        ],
        execute: async (params) => {
          // Implementation for reviewing property assessment
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert property assessor with deep knowledge of assessment methodologies, valuation techniques, and regulatory compliance. Your task is to review property assessments for accuracy, consistency, and adherence to standards.`
              },
              {
                role: 'user',
                content: `Please review the assessment for property ID ${params.propertyId} with the following assessment data:\n\n${params.assessmentData}\n\nProvide a detailed review including any issues with the assessment methodology, data accuracy, compliance with regulations, and recommendations for improvement.`
              }
            ]
          });
          
          return {
            propertyId: params.propertyId,
            review: response.content,
            issues: this.extractAssessmentIssues(response.content),
            recommendations: this.extractRecommendations(response.content)
          };
        }
      },
      {
        name: 'validate_assessment_methodology',
        description: 'Validate an assessment methodology for compliance',
        parameters: [
          {
            name: 'methodologyName',
            type: 'string',
            description: 'Name of the methodology to validate',
            required: true
          },
          {
            name: 'methodologyDescription',
            type: 'string',
            description: 'Detailed description of the methodology',
            required: true
          },
          {
            name: 'regulations',
            type: 'array',
            description: 'Applicable regulations to validate against',
            required: false,
            default: ['Standard Assessment Practices', 'State Tax Code', 'Local Ordinances']
          }
        ],
        execute: async (params) => {
          // Implementation for validating assessment methodology
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are an expert in property assessment methodology and regulatory compliance. Your task is to validate that assessment methodologies comply with all applicable regulations and standards.`
              },
              {
                role: 'user',
                content: `Please validate the "${params.methodologyName}" assessment methodology against the following regulations: ${params.regulations.join(', ')}.\n\nMethodology description:\n\n${params.methodologyDescription}\n\nProvide a detailed validation report including compliance status, any areas of concern, and recommendations for adjustment if needed.`
              }
            ]
          });
          
          return {
            methodologyName: params.methodologyName,
            validationReport: response.content,
            complianceStatus: this.extractComplianceStatus(response.content),
            recommendations: this.extractRecommendations(response.content)
          };
        }
      },
      {
        name: 'weekly_feedback_session',
        description: 'Provide feedback on development progress',
        parameters: [
          {
            name: 'sprintSummary',
            type: 'string',
            description: 'Summary of development progress for the week',
            required: true
          },
          {
            name: 'focusAreas',
            type: 'array',
            description: 'Areas to focus feedback on',
            required: false,
            default: ['Accuracy', 'Usability', 'Regulatory Compliance', 'Performance']
          }
        ],
        execute: async (params) => {
          // Implementation for weekly feedback session
          const response = await this.llmService.generateContent({
            messages: [
              {
                role: 'system',
                content: `You are a County Assessor providing expert feedback on property assessment software development. Your task is to evaluate development progress from the perspective of an assessor's office, focusing on accuracy, compliance, and usability.`
              },
              {
                role: 'user',
                content: `Please provide feedback on the following development progress summary, focusing on these areas: ${params.focusAreas.join(', ')}.\n\nSprint summary:\n\n${params.sprintSummary}\n\nProvide detailed feedback including what's working well, areas for improvement, and any specific requests or concerns from an assessor's perspective.`
              }
            ]
          });
          
          return {
            feedback: response.content,
            strengths: this.extractStrengths(response.content),
            areasForImprovement: this.extractAreasForImprovement(response.content),
            requests: this.extractRequests(response.content)
          };
        }
      }
    ]);
  }
  
  /**
   * Get all team members
   */
  public async getAllTeamMembers(): Promise<TeamMember[]> {
    return await this.storage.getAllTeamMembers();
  }
  
  /**
   * Get team member by ID
   */
  public async getTeamMemberById(id: number): Promise<TeamMember | null> {
    return await this.storage.getTeamMemberById(id);
  }
  
  /**
   * Get team members by role
   */
  public async getTeamMembersByRole(role: TeamMemberRole): Promise<TeamMember[]> {
    return await this.storage.getTeamMembersByRole(role);
  }
  
  /**
   * Update team member status
   */
  public async updateTeamMemberStatus(id: number, status: TeamMemberStatus): Promise<TeamMember> {
    return await this.storage.updateTeamMemberStatus(id, status);
  }
  
  /**
   * Create a new task
   */
  public async createTask(taskData: InsertTeamTask): Promise<TeamTask> {
    const task = await this.storage.createTeamTask(taskData);
    
    // Notify assigned team member if specified
    if (task.assignedTo) {
      const teamMember = await this.storage.getTeamMemberById(task.assignedTo);
      if (teamMember) {
        await this.notifyTeamMember(
          teamMember.id,
          'New Task Assigned',
          `You've been assigned a new task: ${task.title}`
        );
      }
    }
    
    return task;
  }
  
  /**
   * Get all tasks
   */
  public async getAllTasks(): Promise<TeamTask[]> {
    return await this.storage.getAllTeamTasks();
  }
  
  /**
   * Get task by ID
   */
  public async getTaskById(id: string): Promise<TeamTask | null> {
    return await this.storage.getTeamTaskById(id);
  }
  
  /**
   * Get tasks by assignee
   */
  public async getTasksByAssignee(assigneeId: number): Promise<TeamTask[]> {
    return await this.storage.getTeamTasksByAssignee(assigneeId);
  }
  
  /**
   * Update task status
   */
  public async updateTaskStatus(id: string, status: TaskStatus): Promise<TeamTask> {
    const task = await this.storage.updateTeamTaskStatus(id, status);
    
    // Notify task creator about status change
    const creator = await this.storage.getTeamMemberById(task.createdBy);
    if (creator) {
      await this.notifyTeamMember(
        creator.id,
        'Task Status Updated',
        `Task "${task.title}" status changed to ${status}`
      );
    }
    
    return task;
  }
  
  /**
   * Assign task to team member
   */
  public async assignTaskToTeamMember(taskId: string, teamMemberId: number): Promise<TeamTask> {
    const task = await this.storage.assignTeamTask(taskId, teamMemberId);
    
    // Notify the team member about the assignment
    await this.notifyTeamMember(
      teamMemberId,
      'Task Assigned',
      `You've been assigned to task "${task.title}"`
    );
    
    return task;
  }
  
  /**
   * Create a new collaboration session
   */
  public async createCollaborationSession(sessionData: any): Promise<TeamCollaborationSession> {
    const session = await this.storage.createTeamCollaborationSession(sessionData);
    
    // Notify all participants
    for (const participantId of session.participants) {
      await this.notifyTeamMember(
        participantId,
        'New Collaboration Session',
        `You've been invited to collaborate on "${session.title}"`
      );
    }
    
    return session;
  }
  
  /**
   * Execute a team agent capability
   */
  public async executeCapability(
    teamMemberId: number, 
    capabilityName: string, 
    parameters: any
  ): Promise<any> {
    try {
      // Get the team member
      const teamMember = await this.storage.getTeamMemberById(teamMemberId);
      if (!teamMember) {
        throw new Error(`Team member with ID ${teamMemberId} not found`);
      }
      
      // Check if the team member is available
      if (teamMember.status !== TeamMemberStatus.AVAILABLE) {
        throw new Error(`Team member ${teamMember.name} is currently ${teamMember.status} and cannot execute capabilities`);
      }
      
      // Get the capability
      const capabilities = this.teamAgentCapabilities.get(teamMember.role as TeamMemberRole);
      if (!capabilities) {
        throw new Error(`No capabilities found for role ${teamMember.role}`);
      }
      
      const capability = capabilities.find(c => c.name === capabilityName);
      if (!capability) {
        throw new Error(`Capability ${capabilityName} not found for role ${teamMember.role}`);
      }
      
      // Update team member status to busy
      await this.storage.updateTeamMemberStatus(teamMemberId, TeamMemberStatus.BUSY);
      
      // Log activity
      console.log(`Team member ${teamMember.name} executing capability ${capabilityName}`);
      
      try {
        // Execute the capability
        const result = await capability.execute(parameters);
        
        // Update team member status back to available
        await this.storage.updateTeamMemberStatus(teamMemberId, TeamMemberStatus.AVAILABLE);
        
        // Log activity completion
        console.log(`Team member ${teamMember.name} completed capability ${capabilityName}`);
        
        return result;
      } catch (error) {
        // Update team member status back to available
        await this.storage.updateTeamMemberStatus(teamMemberId, TeamMemberStatus.AVAILABLE);
        
        // Log error
        console.error(`Error executing capability ${capabilityName}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in executeCapability:`, error);
      throw error;
    }
  }
  
  /**
   * Get capabilities for a team member
   */
  public getCapabilitiesForTeamMember(teamMember: TeamMember): any[] {
    const capabilities = this.teamAgentCapabilities.get(teamMember.role as TeamMemberRole) || [];
    return capabilities.map(c => ({
      name: c.name,
      description: c.description,
      parameters: c.parameters
    }));
  }
  
  /**
   * Schedule a collaboration session with the County Assessor
   */
  public async scheduleAssessorFeedbackSession(
    title: string,
    description: string,
    startTime: Date,
    participantIds: number[]
  ): Promise<TeamCollaborationSession> {
    try {
      // Get the assessor team member
      const assessors = await this.storage.getTeamMembersByRole(TeamMemberRole.COUNTY_ASSESSOR);
      if (!assessors || assessors.length === 0) {
        throw new Error('No County Assessor team member found');
      }
      
      const assessor = assessors[0];
      
      // Include the assessor in participants if not already included
      if (!participantIds.includes(assessor.id)) {
        participantIds.push(assessor.id);
      }
      
      // Create session data
      const sessionData = {
        title,
        description,
        startTime,
        status: 'scheduled',
        participants: participantIds,
        organizer: assessor.id,
        agenda: ['Project progress review', 'Feedback on current features', 'Discussion of regulatory requirements']
      };
      
      // Create the session
      const session = await this.storage.createTeamCollaborationSession(sessionData);
      
      // Notify all participants
      for (const participantId of session.participants) {
        await this.notifyTeamMember(
          participantId,
          'County Assessor Feedback Session Scheduled',
          `Weekly feedback session with County Assessor scheduled: "${session.title}"`
        );
      }
      
      return session;
    } catch (error) {
      console.error('Error scheduling assessor feedback session:', error);
      throw error;
    }
  }
  
  /**
   * Notify a team member
   */
  private async notifyTeamMember(teamMemberId: number, title: string, message: string): Promise<void> {
    try {
      const teamMember = await this.storage.getTeamMemberById(teamMemberId);
      if (!teamMember) {
        console.warn(`Cannot notify non-existent team member with ID ${teamMemberId}`);
        return;
      }
      
      // Use the notification service to send a notification
      await notificationService.sendNotification({
        userId: teamMemberId,
        title,
        message,
        type: 'team_notification',
        metadata: {
          teamMemberName: teamMember.name,
          teamMemberRole: teamMember.role
        }
      });
      
      console.log(`Notification sent to team member ${teamMember.name}: ${title}`);
    } catch (error) {
      console.error('Error sending team member notification:', error);
    }
  }
  
  /**
   * Helper: Extract suggested files from LLM response
   */
  private extractSuggestedFiles(content: string, baseName: string): string[] {
    // Simple extraction of file names from markdown code blocks or explicit file mentions
    const filePattern = /`([^`]+\.(tsx?|jsx?|css|scss))`|File:\s*([^`]+\.(tsx?|jsx?|css|scss))/g;
    const files = [];
    let match;
    
    while ((match = filePattern.exec(content)) !== null) {
      const fileName = match[1] || match[3];
      if (fileName && !files.includes(fileName)) {
        files.push(fileName);
      }
    }
    
    // If no files were found, suggest a default file name
    if (files.length === 0) {
      const normalized = baseName
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      files.push(`${normalized}.tsx`);
    }
    
    return files;
  }
  
  /**
   * Helper: Extract improved code from LLM response
   */
  private extractImprovedCode(content: string): string {
    // Extract code blocks from markdown
    const codeBlockPattern = /```(?:tsx?|jsx?|javascript|typescript)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockPattern.exec(content)) !== null) {
      if (match[1]) {
        codeBlocks.push(match[1]);
      }
    }
    
    // If there are code blocks, join them with newlines
    if (codeBlocks.length > 0) {
      return codeBlocks.join('\n\n');
    }
    
    // If no code blocks found, return empty string
    return '';
  }
  
  /**
   * Helper: Extract files from LLM response
   */
  private extractFiles(content: string): { name: string, content: string }[] {
    const filePattern = /File:\s*`([^`]+)`\s*```(?:tsx?|jsx?|javascript|typescript)?\n([\s\S]*?)```/g;
    const files = [];
    let match;
    
    while ((match = filePattern.exec(content)) !== null) {
      if (match[1] && match[2]) {
        files.push({
          name: match[1],
          content: match[2]
        });
      }
    }
    
    return files;
  }
  
  /**
   * Helper: Extract suggested tables from LLM response
   */
  private extractSuggestedTables(content: string): string[] {
    const tablePattern = /`([^`]+)`\s*table|Table:\s*`([^`]+)`/g;
    const tables = [];
    let match;
    
    while ((match = tablePattern.exec(content)) !== null) {
      const tableName = match[1] || match[2];
      if (tableName && !tables.includes(tableName)) {
        tables.push(tableName);
      }
    }
    
    return tables;
  }
  
  /**
   * Helper: Extract optimized query from LLM response
   */
  private extractOptimizedQuery(content: string): string {
    const queryPattern = /```(?:sql)?\n([\s\S]*?)```/g;
    const match = queryPattern.exec(content);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return '';
  }
  
  /**
   * Helper: Extract suggested components from LLM response
   */
  private extractSuggestedComponents(content: string): string[] {
    const componentPattern = /Component:\s*`([^`]+)`|`([^`]+)`\s*component/g;
    const components = [];
    let match;
    
    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1] || match[2];
      if (componentName && !components.includes(componentName)) {
        components.push(componentName);
      }
    }
    
    return components;
  }
  
  /**
   * Helper: Extract improvement suggestions from LLM response
   */
  private extractImprovementSuggestions(content: string): { category: string, suggestion: string }[] {
    // Look for patterns like "Improvement: [Category] - [Suggestion]" or "* [Category]: [Suggestion]"
    const improvementPattern = /Improvement:\s*([^-]+)\s*-\s*([^\n]+)|\*\s*([^:]+):\s*([^\n]+)/g;
    const improvements = [];
    let match;
    
    while ((match = improvementPattern.exec(content)) !== null) {
      const category = (match[1] || match[3]).trim();
      const suggestion = (match[2] || match[4]).trim();
      
      if (category && suggestion) {
        improvements.push({ category, suggestion });
      }
    }
    
    return improvements;
  }
  
  /**
   * Helper: Extract component variants from LLM response
   */
  private extractComponentVariants(content: string, defaultVariants: string[]): { name: string, description: string }[] {
    const variantPattern = /Variant:\s*`([^`]+)`\s*-\s*([^\n]+)|`([^`]+)`\s*variant\s*-\s*([^\n]+)/g;
    const variants = [];
    let match;
    
    while ((match = variantPattern.exec(content)) !== null) {
      const name = (match[1] || match[3]).trim();
      const description = (match[2] || match[4]).trim();
      
      if (name && description) {
        variants.push({ name, description });
      }
    }
    
    // If no variants found, use the default variants
    if (variants.length === 0) {
      return defaultVariants.map(name => ({
        name,
        description: `${name.charAt(0).toUpperCase() + name.slice(1)} state of the component`
      }));
    }
    
    return variants;
  }
  
  /**
   * Helper: Extract test cases from LLM response
   */
  private extractTestCases(content: string): { description: string, steps: string[] }[] {
    const testCasePattern = /Test Case:\s*([^\n]+)\s*Steps:\s*([\s\S]*?)(?=Test Case:|$)/g;
    const testCases = [];
    let match;
    
    while ((match = testCasePattern.exec(content)) !== null) {
      if (match[1] && match[2]) {
        const description = match[1].trim();
        const stepsText = match[2].trim();
        const steps = stepsText
          .split(/\d+\.\s*/)
          .filter(step => step.trim().length > 0)
          .map(step => step.trim());
        
        testCases.push({ description, steps });
      }
    }
    
    return testCases;
  }
  
  /**
   * Helper: Extract issues from LLM response
   */
  private extractIssues(content: string): { severity: string, description: string }[] {
    const issuePattern = /Issue:\s*\[([^\]]+)\]\s*([^\n]+)|\[([^\]]+)\]\s*Issue:\s*([^\n]+)/g;
    const issues = [];
    let match;
    
    while ((match = issuePattern.exec(content)) !== null) {
      const severity = (match[1] || match[3]).trim();
      const description = (match[2] || match[4]).trim();
      
      if (severity && description) {
        issues.push({ severity, description });
      }
    }
    
    return issues;
  }
  
  /**
   * Helper: Extract test coverage from LLM response
   */
  private extractTestCoverage(content: string): { type: string, coverage: number }[] {
    const coveragePattern = /Coverage:\s*([^:]+):\s*(\d+)%|(\d+)%\s*coverage\s*for\s*([^:]+)/g;
    const coverage = [];
    let match;
    
    while ((match = coveragePattern.exec(content)) !== null) {
      const type = (match[1] || match[4]).trim();
      const percentage = parseInt(match[2] || match[3], 10);
      
      if (type && !isNaN(percentage)) {
        coverage.push({ type, coverage: percentage });
      }
    }
    
    return coverage;
  }
  
  /**
   * Helper: Extract assessment issues from LLM response
   */
  private extractAssessmentIssues(content: string): { category: string, description: string, severity: string }[] {
    const issuePattern = /Issue:\s*\[([^\]]+)\]\s*([^:]+):\s*([^\n]+)/g;
    const issues = [];
    let match;
    
    while ((match = issuePattern.exec(content)) !== null) {
      const severity = match[1].trim();
      const category = match[2].trim();
      const description = match[3].trim();
      
      if (severity && category && description) {
        issues.push({ category, description, severity });
      }
    }
    
    return issues;
  }
  
  /**
   * Helper: Extract recommendations from LLM response
   */
  private extractRecommendations(content: string): string[] {
    const recommendationPattern = /Recommendation:\s*([^\n]+)/g;
    const recommendations = [];
    let match;
    
    while ((match = recommendationPattern.exec(content)) !== null) {
      if (match[1]) {
        recommendations.push(match[1].trim());
      }
    }
    
    return recommendations;
  }
  
  /**
   * Helper: Extract compliance status from LLM response
   */
  private extractComplianceStatus(content: string): { compliant: boolean, details: string } {
    const compliancePattern = /Compliance Status:\s*([^\n]+)/i;
    const match = compliancePattern.exec(content);
    
    if (match && match[1]) {
      const status = match[1].trim().toLowerCase();
      const compliant = status.includes('compliant') && !status.includes('non-compliant') && !status.includes('not compliant');
      
      return {
        compliant,
        details: match[1].trim()
      };
    }
    
    return {
      compliant: false,
      details: 'Compliance status not found in response'
    };
  }
  
  /**
   * Helper: Extract strengths from LLM response
   */
  private extractStrengths(content: string): string[] {
    const strengthPattern = /Strength(?:s)?:\s*([^\n]+)|What's working well:\s*([^\n]+)/g;
    const strengths = [];
    let match;
    
    while ((match = strengthPattern.exec(content)) !== null) {
      const strength = (match[1] || match[2]).trim();
      if (strength) {
        strengths.push(strength);
      }
    }
    
    return strengths;
  }
  
  /**
   * Helper: Extract areas for improvement from LLM response
   */
  private extractAreasForImprovement(content: string): string[] {
    const areaPattern = /Areas? for improvement:\s*([^\n]+)|Improvement(?:s)?:\s*([^\n]+)/g;
    const areas = [];
    let match;
    
    while ((match = areaPattern.exec(content)) !== null) {
      const area = (match[1] || match[2]).trim();
      if (area) {
        areas.push(area);
      }
    }
    
    return areas;
  }
  
  /**
   * Helper: Extract requests from LLM response
   */
  private extractRequests(content: string): string[] {
    const requestPattern = /Request(?:s)?:\s*([^\n]+)|Specific request(?:s)?:\s*([^\n]+)/g;
    const requests = [];
    let match;
    
    while ((match = requestPattern.exec(content)) !== null) {
      const request = (match[1] || match[2]).trim();
      if (request) {
        requests.push(request);
      }
    }
    
    return requests;
  }
}

// Create and export the singleton instance
let teamAgentService: TeamAgentService | null = null;

export function initializeTeamAgentService(
  storage: IStorage,
  llmService: LLMService,
  mcpService: MCPService,
  agentSystem: AgentSystem
): void {
  if (!teamAgentService) {
    teamAgentService = new TeamAgentService(storage, llmService, mcpService, agentSystem);
  }
}

export function getTeamAgentService(): TeamAgentService {
  if (!teamAgentService) {
    throw new Error('Team Agent Service not initialized. Call initializeTeamAgentService first.');
  }
  return teamAgentService;
}