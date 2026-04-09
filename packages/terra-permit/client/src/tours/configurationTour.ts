import { Step } from 'react-joyride';

const configurationTourSteps: Step[] = [
  {
    target: '[data-tour="configuration-panel"]',
    content: 'The Configuration panel allows you to customize the application to meet your specific needs.',
    disableBeacon: true,
    title: 'System Configuration',
  },
  {
    target: '[data-tour="user-settings"]',
    content: 'Manage your user profile, password, notification preferences, and account details.',
    title: 'User Settings',
  },
  {
    target: '[data-tour="organization-settings"]',
    content: 'Configure organization-wide settings including branding, default templates, and policies.',
    title: 'Organization Settings',
  },
  {
    target: '[data-tour="team-management"]',
    content: 'Manage team members, roles, permissions, and access control for the application.',
    title: 'Team Management',
  },
  {
    target: '[data-tour="workflow-config"]',
    content: 'Customize permit processing workflows, approval chains, and validation rules.',
    title: 'Workflow Configuration',
  },
  {
    target: '[data-tour="integration-settings"]',
    content: 'Set up integrations with external systems, APIs, and services.',
    title: 'Integrations',
  },
  {
    target: '[data-tour="notification-config"]',
    content: 'Configure automated notifications, alerts, and reminders for users and teams.',
    title: 'Notification Settings',
  },
  {
    target: '[data-tour="data-retention"]',
    content: 'Set data retention policies, backup schedules, and compliance configurations.',
    title: 'Data Retention',
  },
  {
    target: '[data-tour="api-keys"]',
    content: 'Manage API keys and credentials for external service connections, including AI services.',
    title: 'API Configuration',
  },
  {
    target: '[data-tour="audit-logs"]',
    content: 'View detailed audit logs of system activities for security and compliance purposes.',
    title: 'Audit Logs',
  },
];

export default configurationTourSteps;