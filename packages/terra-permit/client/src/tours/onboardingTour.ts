import { Step } from 'react-joyride';

const onboardingTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to PermitsBS! This tour will guide you through the main features of the application.',
    disableBeacon: true,
    placement: 'center',
    title: 'Welcome to PermitsBS',
  },
  {
    target: '[data-tour="dashboard-nav"]',
    content: 'This is your dashboard where you can view an overview of your permits and processing status.',
    title: 'Dashboard',
  },
  {
    target: '[data-tour="permits-nav"]',
    content: 'Here you can manage all your permits, upload new ones, and process existing permits.',
    title: 'Permit Management',
  },
  {
    target: '[data-tour="analytics-nav"]',
    content: 'View detailed analytics and reports about your permit processing workflow.',
    title: 'Analytics',
  },
  {
    target: '[data-tour="help-center"]',
    content: 'Need help? Our help center provides guides, tutorials, and contextual help for all features.',
    title: 'Help Center',
  },
  {
    target: '[data-tour="user-settings"]',
    content: 'Configure your account settings, notifications, and preferences here.',
    title: 'User Settings',
  },
  {
    target: 'body',
    content: 'That\'s it for now! Feel free to explore the application and start by uploading your first permit.',
    placement: 'center',
    title: 'Get Started',
  },
];

export default onboardingTourSteps;