import { Step } from 'react-joyride';

const permitProcessingTourSteps: Step[] = [
  {
    target: '[data-tour="permit-processing-overview"]',
    content: 'Welcome to the Permit Processing interface. Here you can manage the entire permit processing workflow.',
    disableBeacon: true,
    title: 'Permit Processing Overview',
  },
  {
    target: '[data-tour="upload-tab"]',
    content: 'Use this tab to upload new permit spreadsheets, documents, or data files.',
    title: 'Upload Permits',
  },
  {
    target: '[data-tour="processing-tab"]',
    content: 'Once uploaded, you can process and validate permits in this tab. Review data, add notes, and update status.',
    title: 'Process Permits',
  },
  {
    target: '[data-tour="export-tab"]',
    content: 'After processing, you can export permit data in various formats for your records or external systems.',
    title: 'Export Processed Permits',
  },
  {
    target: '[data-tour="permit-upload-area"]',
    content: 'Drag and drop your permit files here, or click to browse your computer.',
    title: 'File Upload Area',
  },
  {
    target: '[data-tour="permit-mapping"]',
    content: 'Map columns from your spreadsheet to the required permit fields. AI can help with automatic mapping.',
    title: 'Field Mapping',
  },
  {
    target: '[data-tour="permit-validation"]',
    content: 'The system automatically validates permit data and highlights potential errors or discrepancies.',
    title: 'Data Validation',
  },
  {
    target: '[data-tour="permit-review"]',
    content: 'Review each permit before final approval. You can add comments, flag issues, or request changes.',
    title: 'Permit Review',
  },
  {
    target: '[data-tour="ai-analysis"]',
    content: 'Our AI can analyze your permits to detect patterns, suggest improvements, and ensure consistency.',
    title: 'AI Analysis',
  },
  {
    target: '[data-tour="batch-processing"]',
    content: 'Process multiple permits at once with batch operations for efficiency.',
    title: 'Batch Processing',
  },
  {
    target: '[data-tour="export-options"]',
    content: 'Choose from multiple export formats including Excel, CSV, PDF, or direct integration with other systems.',
    title: 'Export Options',
  },
  {
    target: '[data-tour="processing-history"]',
    content: 'Track the complete history of each permit, including who made changes and when.',
    title: 'Processing History',
  },
];

export default permitProcessingTourSteps;