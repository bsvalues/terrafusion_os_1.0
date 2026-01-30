import { Step as JoyrideStep } from 'react-joyride';
import { TourType } from '../types/tour';

// Re-export TourType to avoid breaking changes in imports
export { TourType };

// Tour steps for each tour
export const onboardingTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="welcome"]',
    content: 'Welcome to PermitsBS! This tour will guide you through the basics of our application.',
    disableBeacon: true,
    placement: 'center',
  },
  {
    target: '[data-tour="navigation"]',
    content: 'Use the navigation menu to access different sections of the application.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: 'Access your profile, organization settings, and logout from here.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="help-center"]',
    content: 'Click here to open the Help Center for tutorials, tours, and support.',
    disableBeacon: true,
  },
];

export const dashboardTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="dashboard-overview"]',
    content: 'This is your dashboard, where you can see an overview of your permits and recent activity.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-uploads"]',
    content: 'View your recent uploads and their processing status here.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="permits-summary"]',
    content: 'Here you can see a summary of your permits by status and type.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-actions"]',
    content: 'Use these quick action buttons to upload permits, start processing, or create reports.',
    disableBeacon: true,
  },
];

export const permitProcessingTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="permit-processing-overview"]',
    content: 'Welcome to the Permit Processing interface. Here you can manage the entire permit processing workflow.',
    disableBeacon: true,
    placement: 'bottom',
    title: 'Permit Processing Overview',
  },
  {
    target: '[data-tour="upload-tab"]',
    content: 'Use this tab to upload new permit data from Excel or CSV files.',
    disableBeacon: true,
    title: 'Upload Permits',
  },
  {
    target: '[data-tour="permit-upload-area"]',
    content: 'Drag and drop your permit files here, or click to select files for upload.',
    disableBeacon: true,
    title: 'File Upload Area',
  },
  {
    target: '[data-tour="process-tab"]',
    content: 'After uploading, switch to this tab to process and validate your permits.',
    disableBeacon: true,
    title: 'Process Permits',
  },
  {
    target: '[data-tour="ai-analysis"]',
    content: 'Use our AI-powered analysis to automatically check for inconsistencies or issues in your permit data.',
    disableBeacon: true,
    title: 'AI Analysis',
  },
  {
    target: '[data-tour="export-tab"]',
    content: 'When your permits are processed, use this tab to export the data in various formats.',
    disableBeacon: true,
    title: 'Export Data',
  },
];

export const aiFeaturesTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="ai-dashboard"]',
    content: 'This is the AI Dashboard where you can access intelligent features for permit analysis.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="ai-summary"]',
    content: 'Get an AI-generated summary of your uploaded permit batches here.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ai-consistency"]',
    content: 'Check for inconsistencies across your permits with AI-powered analysis.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ai-chat"]',
    content: 'Ask questions about your permits and get intelligent answers from our AI assistant.',
    disableBeacon: true,
  },
];

export const collaborationTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="collaboration"]',
    content: 'This area allows you to collaborate with team members on permit processing.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="active-sessions"]',
    content: 'See active collaboration sessions and join them to work together in real-time.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-session"]',
    content: 'Create a new collaboration session to invite team members to work on permits together.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="comments"]',
    content: 'Add comments to permits for team discussion and tracking changes.',
    disableBeacon: true,
  },
];

export const helpCenterTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="help-center-icon"]',
    content: 'Click this icon to open the Help Center.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="help-guides-tab"]',
    content: 'Browse through guides and tutorials to learn how to use the application effectively.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="help-tours-tab"]',
    content: 'Access interactive tours for different features of the application.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="help-contact-tab"]',
    content: 'Contact our support team if you need assistance or have questions.',
    disableBeacon: true,
  },
];

export const batchProcessingTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="batch-processing"]',
    content: 'This is where you can process multiple permits at once in batch mode.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="batch-select"]',
    content: 'Select which permits to include in your batch operation.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="batch-actions"]',
    content: 'Choose an action to apply to all selected permits.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="batch-execute"]',
    content: 'Execute the batch operation with this button.',
    disableBeacon: true,
  },
];

export const dataExportTourSteps: JoyrideStep[] = [
  {
    target: '[data-tour="export-options"]',
    content: 'This area allows you to export your processed permit data in various formats.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="export-format"]',
    content: 'Select your desired export format (Excel, CSV, PDF, etc.).',
    disableBeacon: true,
  },
  {
    target: '[data-tour="export-filters"]',
    content: 'Apply filters to export only specific permit data.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="export-button"]',
    content: 'Click here to generate and download your export file.',
    disableBeacon: true,
  },
];