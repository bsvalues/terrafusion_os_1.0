import { Step } from 'react-joyride';

const reportsTourSteps: Step[] = [
  {
    target: '[data-tour="reports-dashboard"]',
    content: 'The Reports section allows you to generate and customize detailed reports about your permit processing activities.',
    disableBeacon: true,
    title: 'Reports Dashboard',
  },
  {
    target: '[data-tour="report-templates"]',
    content: 'Choose from pre-built report templates for common reporting needs.',
    title: 'Report Templates',
  },
  {
    target: '[data-tour="custom-reports"]',
    content: 'Build your own custom reports by selecting the specific data points and metrics you need.',
    title: 'Custom Reports',
  },
  {
    target: '[data-tour="report-filters"]',
    content: 'Filter your reports by date range, permit type, status, and other criteria.',
    title: 'Report Filters',
  },
  {
    target: '[data-tour="report-visualizations"]',
    content: 'Choose from various visualization options to present your data effectively.',
    title: 'Visualizations',
  },
  {
    target: '[data-tour="scheduled-reports"]',
    content: 'Set up recurring reports to be automatically generated and sent to stakeholders.',
    title: 'Scheduled Reports',
  },
  {
    target: '[data-tour="export-reports"]',
    content: 'Export your reports in multiple formats including PDF, Excel, CSV, or as interactive dashboards.',
    title: 'Export Options',
  },
  {
    target: '[data-tour="report-sharing"]',
    content: 'Share reports with team members or external stakeholders with customizable access permissions.',
    title: 'Report Sharing',
  },
];

export default reportsTourSteps;