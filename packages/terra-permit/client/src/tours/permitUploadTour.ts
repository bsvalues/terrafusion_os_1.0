import { Step } from 'react-joyride';

const permitUploadTourSteps: Step[] = [
  {
    target: '[data-tour="permit-upload-page"]',
    content: 'This is where you can upload your permit data files for processing.',
    disableBeacon: true,
    title: 'Permit Upload',
  },
  {
    target: '[data-tour="file-upload-zone"]',
    content: 'Drag and drop your permit spreadsheets or documents here, or click to browse your files.',
    title: 'Upload Zone',
  },
  {
    target: '[data-tour="file-type-selector"]',
    content: 'Select the type of file you are uploading to ensure proper processing.',
    title: 'File Type Selection',
  },
  {
    target: '[data-tour="upload-history"]',
    content: 'View your previous uploads, including status and processing results.',
    title: 'Upload History',
  },
  {
    target: '[data-tour="template-download"]',
    content: 'Download template files to ensure your data is properly formatted before uploading.',
    title: 'Download Templates',
  },
  {
    target: '[data-tour="upload-settings"]',
    content: 'Configure upload settings such as automatic processing, validation rules, and notifications.',
    title: 'Upload Settings',
  },
];

export default permitUploadTourSteps;