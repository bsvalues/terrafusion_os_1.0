/**
 * Progress Component Stories - TerraFusion Design System
 * Week 2, Day 6 - Achieving 100% Shadcn Coverage
 * 
 * Purpose: Comprehensive documentation of Progress component
 * - Determinate progress (known completion percentage)
 * - Indeterminate progress (loading without percentage)
 * - Various sizes and colors
 * - With labels and percentages
 * - Real-world loading patterns
 * - File upload progress
 * 
 * Architecture: Built on Radix UI Progress primitive
 * - ARIA progressbar attributes
 * - Smooth animations
 * - Responsive sizing
 * - Customizable colors
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';
import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { CheckCircle2, FileText, Upload, Download } from 'lucide-react';

const meta = {
  title: 'Design System/Components/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Progress Component

An accessible progress indicator for showing task completion or loading states.

## Features
- ✅ Determinate progress (known percentage)
- ✅ Indeterminate loading states
- ✅ Smooth animations
- ✅ ARIA progressbar attributes
- ✅ Customizable sizes and colors
- ✅ Built on Radix UI primitives
- ✅ TypeScript support

## When to Use
- File uploads/downloads
- Multi-step forms
- Data loading states
- Task completion tracking
- Installation/setup wizards

## Accessibility
- Uses \`role="progressbar"\`
- Includes \`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\`
- Screen reader announcements for progress changes
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress value (0-100)',
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 1. DEFAULT PROGRESS BAR
 * Basic progress bar at 50% completion
 */
export const Default: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div>
        <div className="mb-2 text-sm font-medium">Loading...</div>
        <Progress value={50} />
      </div>
    </div>
  ),
};

/**
 * 2. DETERMINATE PROGRESS WITH PERCENTAGES
 * Progress bars showing various completion levels with percentage labels
 */
export const DeterminateProgress: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      {/* 0% - Not started */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Not Started</span>
          <span className="text-muted-foreground">0%</span>
        </div>
        <Progress value={0} />
      </div>

      {/* 25% - Just started */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Just Started</span>
          <span className="text-muted-foreground">25%</span>
        </div>
        <Progress value={25} />
      </div>

      {/* 50% - Half way */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Half Way</span>
          <span className="text-muted-foreground">50%</span>
        </div>
        <Progress value={50} />
      </div>

      {/* 75% - Almost done */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Almost Done</span>
          <span className="text-muted-foreground">75%</span>
        </div>
        <Progress value={75} />
      </div>

      {/* 100% - Complete */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-green-600 dark:text-green-400">Complete</span>
          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            100%
          </span>
        </div>
        <Progress value={100} className="bg-green-100 dark:bg-green-900/20">
          <div className="h-full w-full flex-1 bg-green-600 transition-all" />
        </Progress>
      </div>
    </div>
  ),
};

/**
 * 3. ANIMATED PROGRESS
 * Progress bar that automatically increments to demonstrate animation
 */
export const AnimatedProgress: Story = {
  render: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0; // Reset to loop animation
          }
          return prev + 1;
        });
      }, 100);

      return () => clearInterval(timer);
    }, []);

    return (
      <div className="w-full max-w-md space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Processing...</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <p className="text-xs text-muted-foreground">
          This progress bar automatically increments to demonstrate smooth animations.
        </p>
      </div>
    );
  },
};

/**
 * 4. SIZES AND VARIANTS
 * Progress bars in different sizes and visual styles
 */
export const SizesAndVariants: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-8">
      {/* Extra Small - 1px height */}
      <div>
        <div className="mb-2 text-sm font-medium">Extra Small (1px)</div>
        <Progress value={60} className="h-1" />
        <p className="mt-1 text-xs text-muted-foreground">Subtle progress indicator</p>
      </div>

      {/* Small - 2px height (default) */}
      <div>
        <div className="mb-2 text-sm font-medium">Small - 2px (Default)</div>
        <Progress value={60} className="h-2" />
        <p className="mt-1 text-xs text-muted-foreground">Standard progress bar</p>
      </div>

      {/* Medium - 3px height */}
      <div>
        <div className="mb-2 text-sm font-medium">Medium (3px)</div>
        <Progress value={60} className="h-3" />
        <p className="mt-1 text-xs text-muted-foreground">More prominent indicator</p>
      </div>

      {/* Large - 4px height */}
      <div>
        <div className="mb-2 text-sm font-medium">Large (4px)</div>
        <Progress value={60} className="h-4" />
        <p className="mt-1 text-xs text-muted-foreground">High visibility progress</p>
      </div>

      {/* Rounded variations */}
      <div>
        <div className="mb-2 text-sm font-medium">Square (no rounding)</div>
        <Progress value={60} className="h-3 rounded-none" />
        <p className="mt-1 text-xs text-muted-foreground">No border radius</p>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Slightly Rounded</div>
        <Progress value={60} className="h-3 rounded-sm" />
        <p className="mt-1 text-xs text-muted-foreground">Small border radius</p>
      </div>
    </div>
  ),
};

/**
 * 5. FILE UPLOAD PROGRESS
 * Real-world file upload scenario with multiple files
 */
export const FileUploadProgress: Story = {
  render: () => {
    const [files, setFiles] = useState([
      { id: 1, name: 'design-mockups.fig', size: '2.4 MB', progress: 100, status: 'complete' },
      { id: 2, name: 'user-research.pdf', size: '1.8 MB', progress: 67, status: 'uploading' },
      { id: 3, name: 'wireframes.sketch', size: '3.2 MB', progress: 23, status: 'uploading' },
      { id: 4, name: 'assets.zip', size: '15.7 MB', progress: 0, status: 'pending' },
    ]);

    const startUpload = () => {
      const interval = setInterval(() => {
        setFiles((currentFiles) => {
          const updated = currentFiles.map((file) => {
            if (file.status === 'uploading' && file.progress < 100) {
              const newProgress = Math.min(file.progress + Math.random() * 10, 100);
              return {
                ...file,
                progress: Math.round(newProgress),
                status: newProgress >= 100 ? 'complete' : 'uploading',
              };
            }
            if (file.status === 'pending') {
              const prevFile = currentFiles[currentFiles.indexOf(file) - 1];
              if (prevFile && prevFile.progress >= 100) {
                return { ...file, progress: 5, status: 'uploading' };
              }
            }
            return file;
          });

          if (updated.every((f) => f.status === 'complete')) {
            clearInterval(interval);
          }

          return updated;
        });
      }, 500);
    };

    return (
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upload Files</h3>
            <Button onClick={startUpload} size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Start Upload
            </Button>
          </div>

          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{file.size}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.status === 'complete' && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </span>
                    )}
                    {file.status === 'uploading' && `${file.progress}%`}
                    {file.status === 'pending' && 'Pending...'}
                  </div>
                </div>
                <Progress
                  value={file.progress}
                  className={
                    file.status === 'complete'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : ''
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              {files.filter((f) => f.status === 'complete').length} of {files.length} files uploaded
            </div>
          </div>
        </Card>
      </div>
    );
  },
};

/**
 * 6. MULTI-STEP FORM PROGRESS
 * Progress indicator for multi-step processes
 */
export const MultiStepProgress: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;

    const steps = [
      { number: 1, title: 'Account Details', description: 'Basic information' },
      { number: 2, title: 'Personal Info', description: 'Name and contact' },
      { number: 3, title: 'Preferences', description: 'Customize your experience' },
      { number: 4, title: 'Review', description: 'Confirm and submit' },
    ];

    return (
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex items-center gap-3 ${
                  step.number === currentStep
                    ? 'text-foreground'
                    : step.number < currentStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    step.number === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.number < currentStep
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === totalSteps}
              className="flex-1"
            >
              {currentStep === totalSteps ? 'Complete' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    );
  },
};

/**
 * 7. USAGE GUIDELINES
 * Best practices for using Progress components
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Progress Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for implementing progress indicators in your application.
        </p>
      </div>

      {/* Do's */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-green-600 dark:text-green-400">
          ✅ Do's
        </h3>
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/10">
          <div>
            <strong className="text-sm">Show percentage labels for determinate progress</strong>
            <p className="text-sm text-muted-foreground">
              Users should know exactly how much progress has been made
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>Uploading file...</span>
              <span>67%</span>
            </div>
            <Progress value={67} className="mt-1" />
          </div>

          <div>
            <strong className="text-sm">Use descriptive labels</strong>
            <p className="text-sm text-muted-foreground">
              Tell users what's happening, not just that something is loading
            </p>
            <div className="mt-2 text-xs">Processing payment...</div>
            <Progress value={45} className="mt-1" />
          </div>

          <div>
            <strong className="text-sm">Indicate completion clearly</strong>
            <p className="text-sm text-muted-foreground">
              Use color changes or icons to show successful completion
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete!
              </span>
              <span>100%</span>
            </div>
            <Progress value={100} className="mt-1 bg-green-100 dark:bg-green-900/20" />
          </div>

          <div>
            <strong className="text-sm">Choose appropriate sizing</strong>
            <p className="text-sm text-muted-foreground">
              Use subtle progress bars for secondary tasks, larger for primary actions
            </p>
            <div className="mt-2 space-y-2">
              <div className="text-xs">Subtle: Background sync</div>
              <Progress value={60} className="h-1" />
              <div className="text-xs">Prominent: File upload</div>
              <Progress value={60} className="h-3" />
            </div>
          </div>

          <div>
            <strong className="text-sm">Update smoothly</strong>
            <p className="text-sm text-muted-foreground">
              Progress should animate smoothly, not jump between values
            </p>
          </div>
        </div>
      </div>

      {/* Don'ts */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-red-600 dark:text-red-400">
          ❌ Don'ts
        </h3>
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <div>
            <strong className="text-sm">Don't use for unknown durations</strong>
            <p className="text-sm text-muted-foreground">
              If you don't know how long something will take, use a spinner or indeterminate loader
            </p>
          </div>

          <div>
            <strong className="text-sm">Don't show progress without context</strong>
            <p className="text-sm text-muted-foreground">
              A progress bar alone doesn't tell users what's happening
            </p>
          </div>

          <div>
            <strong className="text-sm">Don't let progress bars get stuck</strong>
            <p className="text-sm text-muted-foreground">
              If progress stops, explain why and provide options to proceed
            </p>
          </div>

          <div>
            <strong className="text-sm">Don't use for instant operations</strong>
            <p className="text-sm text-muted-foreground">
              Operations under 1 second don't need progress indicators
            </p>
          </div>
        </div>
      </div>

      {/* When to Use */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">When to Use Progress Bars</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <strong className="text-sm">File Operations</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Uploads, downloads, or large file processing where progress can be tracked
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <strong className="text-sm">Multi-Step Forms</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Show users how far they are through a wizard or onboarding flow
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <strong className="text-sm">Data Processing</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Batch operations, imports, or data transformations with known item counts
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <strong className="text-sm">Installation/Setup</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Software installations or setup wizards with sequential steps
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Accessibility Considerations</h3>
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm">
            <strong>ARIA Attributes:</strong> Progress component includes{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">role="progressbar"</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-valuenow</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-valuemin</code>, and{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-valuemax</code>
          </p>
          <p className="text-sm">
            <strong>Screen Readers:</strong> Always include descriptive text labels that screen
            readers can announce
          </p>
          <p className="text-sm">
            <strong>Visual Indicators:</strong> Don't rely on color alone—use text, icons, or
            position to convey meaning
          </p>
        </div>
      </div>

      {/* Code Example */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Code Example</h3>
        <div className="rounded-lg border bg-muted p-4">
          <pre className="text-xs">
            {`// Basic usage
<Progress value={60} />

// With label and percentage
<div>
  <div className="flex justify-between text-sm mb-2">
    <span>Uploading...</span>
    <span>60%</span>
  </div>
  <Progress value={60} />
</div>

// Custom size and styling
<Progress 
  value={75} 
  className="h-3 bg-blue-100"
/>

// Animated progress
const [progress, setProgress] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setProgress(prev => Math.min(prev + 10, 100));
  }, 500);
  return () => clearInterval(timer);
}, []);

<Progress value={progress} />`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
