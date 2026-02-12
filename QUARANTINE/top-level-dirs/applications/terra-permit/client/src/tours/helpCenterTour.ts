import { Step } from 'react-joyride';

const helpCenterTourSteps: Step[] = [
  {
    target: '[data-tour="help-center-panel"]',
    content: 'Welcome to the Help Center! Here you can find answers to your questions and learn how to use the application effectively.',
    disableBeacon: true,
    title: 'Help Center',
  },
  {
    target: '[data-tour="help-search"]',
    content: 'Quickly find help articles by searching for keywords or phrases related to your question.',
    title: 'Search for Help',
  },
  {
    target: '[data-tour="help-categories"]',
    content: 'Browse help content by categories to find information on specific features or workflows.',
    title: 'Help Categories',
  },
  {
    target: '[data-tour="help-quick-start"]',
    content: 'New to the application? Start here for a quick introduction to the most essential features.',
    title: 'Quick Start Guides',
  },
  {
    target: '[data-tour="help-tutorials"]',
    content: 'Step-by-step tutorials guide you through common tasks and workflows.',
    title: 'Tutorials',
  },
  {
    target: '[data-tour="help-faq"]',
    content: 'Find answers to frequently asked questions about the application.',
    title: 'FAQs',
  },
  {
    target: '[data-tour="help-glossary"]',
    content: 'Look up definitions for terminology used throughout the application.',
    title: 'Glossary',
  },
  {
    target: '[data-tour="help-videos"]',
    content: 'Watch video demonstrations of key features and workflows.',
    title: 'Video Guides',
  },
  {
    target: '[data-tour="help-contact"]',
    content: 'Can\'t find what you\'re looking for? Contact our support team for personalized assistance.',
    title: 'Contact Support',
  },
  {
    target: '[data-tour="help-tours"]',
    content: 'Start interactive tours to learn about specific features as you use them.',
    title: 'Interactive Tours',
  },
];

export default helpCenterTourSteps;