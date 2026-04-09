/**
 * Team Agent Initialization Script
 * 
 * This script initializes the core team of AI agents with the specified roles and capabilities
 * to support the property assessment platform:
 * - Frontend Developer (Full-time)
 * - Backend Developer (Full-time)
 * - Designer (Part-time)
 * - QA Tester (Part-time)
 * - County Assessor Office (Weekly feedback)
 */

import { storage } from '../storage';
import { 
  TeamAgentRole as TeamMemberRole, 
  TeamAgentStatus as TeamMemberStatus
} from '@shared/team-agent-types';
import { InsertTeamMember } from '@shared/schema';

async function initializeTeamAgents() {
  console.log('Initializing team agents...');
  
  try {
    // Check if agents already exist
    const existingMembers = await storage.getAllTeamMembers();
    if (existingMembers.length > 0) {
      console.log(`Team already initialized with ${existingMembers.length} members.`);
      return;
    }
    
    // Frontend Developer (Full-time)
    const frontendDeveloper: InsertTeamMember = {
      name: 'Frontend Developer Agent',
      role: TeamMemberRole.FRONTEND_DEVELOPER,
      status: TeamMemberStatus.AVAILABLE,
      email: 'frontend.agent@spatialest.com',
      capabilities: {
        skills: [
          'React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'TailwindCSS',
          'UI/UX Implementation', 'Responsive Design', 'Web Accessibility', 
          'Frontend Testing', 'State Management'
        ],
        expertiseLevel: 'senior',
        toolsAndFrameworks: [
          'React', 'TailwindCSS', 'Webpack', 'Vite', 'Jest', 'React Testing Library',
          'ShadCN UI', 'React Query', 'Wouter', 'Redux'
        ],
        availability: {
          hoursPerWeek: 40,
          preferredWorkingHours: {
            start: '09:00',
            end: '17:00'
          },
          timeZone: 'UTC'
        }
      },
      avatar: null
    };
    
    // Backend Developer (Full-time)
    const backendDeveloper: InsertTeamMember = {
      name: 'Backend Developer Agent',
      role: TeamMemberRole.BACKEND_DEVELOPER,
      status: TeamMemberStatus.AVAILABLE,
      email: 'backend.agent@spatialest.com',
      capabilities: {
        skills: [
          'Node.js', 'Express', 'TypeScript', 'JavaScript', 'SQL', 'REST APIs', 
          'Database Design', 'Authentication', 'Authorization', 'WebSockets',
          'API Documentation', 'Performance Optimization'
        ],
        expertiseLevel: 'senior',
        toolsAndFrameworks: [
          'Node.js', 'Express', 'PostgreSQL', 'Drizzle ORM', 'TypeScript', 
          'JWT', 'WebSockets', 'RESTful APIs', 'OpenAPI'
        ],
        availability: {
          hoursPerWeek: 40,
          preferredWorkingHours: {
            start: '09:00',
            end: '17:00'
          },
          timeZone: 'UTC'
        }
      },
      avatar: null
    };
    
    // Designer (Part-time)
    const designer: InsertTeamMember = {
      name: 'UI/UX Designer Agent',
      role: TeamMemberRole.DESIGNER,
      status: TeamMemberStatus.AVAILABLE,
      email: 'designer.agent@spatialest.com',
      capabilities: {
        skills: [
          'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 
          'Visual Design', 'Design Systems', 'Information Architecture',
          'User Research', 'Color Theory', 'Typography'
        ],
        expertiseLevel: 'expert',
        toolsAndFrameworks: [
          'Figma', 'Sketch', 'Adobe XD', 'User Testing', 'Accessibility Standards',
          'Design Systems', 'Responsive Design Patterns'
        ],
        availability: {
          hoursPerWeek: 20,
          preferredWorkingHours: {
            start: '10:00',
            end: '15:00'
          },
          timeZone: 'UTC'
        }
      },
      avatar: null
    };
    
    // QA Tester (Part-time)
    const qaTester: InsertTeamMember = {
      name: 'QA Tester Agent',
      role: TeamMemberRole.QA_TESTER,
      status: TeamMemberStatus.AVAILABLE,
      email: 'qa.agent@spatialest.com',
      capabilities: {
        skills: [
          'Manual Testing', 'Automated Testing', 'Test Case Development',
          'Bug Reporting', 'Regression Testing', 'API Testing',
          'Performance Testing', 'User Acceptance Testing', 'Browser Compatibility Testing'
        ],
        expertiseLevel: 'senior',
        toolsAndFrameworks: [
          'Jest', 'Playwright', 'Cypress', 'Selenium', 'Test Planning',
          'Test Case Management', 'Bug Tracking'
        ],
        availability: {
          hoursPerWeek: 20,
          preferredWorkingHours: {
            start: '13:00',
            end: '18:00'
          },
          timeZone: 'UTC'
        }
      },
      avatar: null
    };
    
    // County Assessor Office (Weekly feedback)
    const countyAssessor: InsertTeamMember = {
      name: 'County Assessor Agent',
      role: TeamMemberRole.COUNTY_ASSESSOR,
      status: TeamMemberStatus.AVAILABLE,
      email: 'assessor.agent@spatialest.com',
      capabilities: {
        skills: [
          'Property Assessment', 'Tax Valuation', 'Regulatory Compliance',
          'Appeals Process', 'Property Classification', 'Appraisal Methods',
          'Property Data Analysis', 'Land Valuation', 'Improvement Valuation'
        ],
        expertiseLevel: 'expert',
        toolsAndFrameworks: [
          'Property Valuation Models', 'GIS Systems', 'Regulatory Frameworks',
          'Assessment Standards', 'Property Classification Guidelines'
        ],
        availability: {
          hoursPerWeek: 8,
          preferredWorkingHours: {
            start: '10:00',
            end: '14:00'
          },
          timeZone: 'UTC'
        }
      },
      avatar: null
    };
    
    // Create the team members
    const createdMembers = [];
    createdMembers.push(await storage.createTeamMember(frontendDeveloper));
    createdMembers.push(await storage.createTeamMember(backendDeveloper));
    createdMembers.push(await storage.createTeamMember(designer));
    createdMembers.push(await storage.createTeamMember(qaTester));
    createdMembers.push(await storage.createTeamMember(countyAssessor));
    
    console.log(`Successfully created ${createdMembers.length} team agents:`);
    createdMembers.forEach(member => {
      console.log(`- ${member.name} (${member.role}): ${member.status}`);
    });
    
    // Create initial collaboration session for team onboarding
    const initialSession = await storage.createTeamCollaborationSession({
      title: 'Team Onboarding Session',
      description: 'Initial team meeting to establish project goals and team member responsibilities',
      startTime: new Date(),
      participants: createdMembers.map(member => member.id),
      organizer: createdMembers[0].id, // Frontend Developer as organizer
      agenda: [
        'Team introductions',
        'Project overview',
        'Role assignments and responsibilities',
        'Communication protocols',
        'Initial task planning'
      ],
      status: 'scheduled',
      taskIds: []
    });
    
    console.log(`Created initial team collaboration session: ${initialSession.title}`);
    
    // Create some initial knowledge base items
    const initialKnowledgeItem = await storage.createTeamKnowledgeBaseItem({
      title: 'Property Assessment Platform Overview',
      content: 'The SpatialEst Property Assessment Platform is a comprehensive system designed to modernize and streamline the property assessment process for county assessor offices. It provides tools for property data management, valuation, appeals processing, and compliance monitoring.',
      category: 'project',
      createdBy: createdMembers[0].id,
      tags: ['overview', 'project-scope', 'introduction']
    });
    
    console.log(`Created initial knowledge base item: ${initialKnowledgeItem.title}`);
    
    console.log('Team agent initialization complete.');
  } catch (error) {
    console.error('Error initializing team agents:', error);
  }
}

// Export the initialization function
export { initializeTeamAgents };

// Note: Direct execution check removed because we're using ES modules
// The file will only be executed directly when explicitly called