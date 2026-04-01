import { Step } from 'react-joyride';

const dashboardTourSteps: Step[] = [
  {
    target: '[data-tour="dashboard-overview"]',
    content: 'The dashboard provides an overview of your permit processing status and activities.',
    disableBeacon: true,
    title: 'Dashboard Overview',
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: 'Here you can see key metrics about your permits, including processed, pending, and rejected permits.',
    title: 'Key Statistics',
  },
  {
    target: '[data-tour="dashboard-recent-activity"]',
    content: 'This section shows your most recent permit activity, including uploads and status changes.',
    title: 'Recent Activity',
  },
  {
    target: '[data-tour="dashboard-chart"]',
    content: 'Visual charts help you understand permit processing trends and performance over time.',
    title: 'Performance Charts',
  },
  {
    target: '[data-tour="dashboard-notifications"]',
    content: 'Stay informed about important updates, deadlines, and system notifications here.',
    title: 'Notifications',
  },
  {
    target: '[data-tour="dashboard-quick-actions"]',
    content: 'Quickly access common actions like uploading new permits or generating reports.',
    title: 'Quick Actions',
  },
  {
    target: '[data-tour="dashboard-insights"]',
    content: 'AI-powered insights provide recommendations based on your permit processing history.',
    title: 'Smart Insights',
  }
];

export default dashboardTourSteps;