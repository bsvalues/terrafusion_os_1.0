import { Step } from 'react-joyride';

const aiAnalyticsTourSteps: Step[] = [
  {
    target: '[data-tour="ai-analytics-dashboard"]',
    content: 'Welcome to the AI Analytics dashboard where you can leverage artificial intelligence to gain insights from your permit data.',
    disableBeacon: true,
    title: 'AI Analytics Dashboard',
  },
  {
    target: '[data-tour="ai-insights"]',
    content: 'AI-generated insights highlight patterns, anomalies, and opportunities in your permit processing.',
    title: 'AI Insights',
  },
  {
    target: '[data-tour="consistency-check"]',
    content: 'The AI will automatically check for consistency across permits and highlight potential discrepancies.',
    title: 'Consistency Check',
  },
  {
    target: '[data-tour="permit-classification"]',
    content: 'Permits are automatically classified by type, complexity, and priority to help with processing.',
    title: 'Permit Classification',
  },
  {
    target: '[data-tour="ai-assistant"]',
    content: 'Ask questions about your permits or the application in natural language and get AI-powered answers.',
    title: 'AI Assistant',
  },
  {
    target: '[data-tour="predictive-analytics"]',
    content: 'View predictions about processing times, approval rates, and potential bottlenecks.',
    title: 'Predictive Analytics',
  },
  {
    target: '[data-tour="smart-recommendations"]',
    content: 'Get personalized recommendations to improve your permit processing efficiency.',
    title: 'Smart Recommendations',
  },
  {
    target: '[data-tour="ai-settings"]',
    content: 'Configure AI settings, including model preferences, analysis depth, and privacy controls.',
    title: 'AI Settings',
  },
];

export default aiAnalyticsTourSteps;