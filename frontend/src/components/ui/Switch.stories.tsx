/**
 * Switch Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Switch component
 * - Toggle on/off states
 * - Immediate action vs form submission
 * - Settings and preferences patterns
 * - Accessibility with keyboard support
 * 
 * Architecture: Built on Radix UI Switch primitive
 * - Toggle control for binary states
 * - Smooth animations
 * - Focus ring for accessibility
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'Design System/Atoms/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Switch Component

A toggle control for binary on/off states with immediate effect.

## Features
- ✅ Keyboard navigation (Space/Enter to toggle)
- ✅ ARIA attributes for screen readers
- ✅ Checked and unchecked states
- ✅ Disabled state
- ✅ Smooth sliding animation
- ✅ Focus ring for accessibility
- ✅ Dark mode support
- ✅ Immediate state changes

## Usage
\`\`\`tsx
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
\`\`\`

## When to Use Switch vs Checkbox
- **Switch**: Immediate effect (e.g., "Enable notifications" takes effect immediately)
- **Checkbox**: Part of a form (e.g., "Accept terms" requires form submission)

## Accessibility
- Built on Radix UI Switch primitive
- Space/Enter keys toggle the switch
- Screen reader announces on/off state
- Focus visible ring for keyboard navigation
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Switch
 * Basic switch with label
 */
export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="default" />
      <Label htmlFor="default">Enable notifications</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default switch with label for proper accessibility.',
      },
    },
  },
};

/**
 * Story 2: All States
 * Showing on, off, and disabled states
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="flex items-center justify-between">
        <Label htmlFor="state-off">Off State</Label>
        <Switch id="state-off" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="state-on">On State</Label>
        <Switch id="state-on" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="state-disabled-off" className="text-muted-foreground">
          Disabled (Off)
        </Label>
        <Switch id="state-disabled-off" disabled />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="state-disabled-on" className="text-muted-foreground">
          Disabled (On)
        </Label>
        <Switch id="state-disabled-on" defaultChecked disabled />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All switch states: off, on, disabled off, and disabled on.',
      },
    },
  },
};

/**
 * Story 3: With Descriptions
 * Switches with additional explanatory text
 */
export const WithDescriptions: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div className="flex items-center justify-between space-x-4">
        <div className="space-y-1 flex-1">
          <Label htmlFor="desc-marketing">Marketing Emails</Label>
          <p className="text-sm text-muted-foreground">
            Receive emails about new features, updates, and promotions.
          </p>
        </div>
        <Switch id="desc-marketing" />
      </div>
      
      <div className="flex items-center justify-between space-x-4">
        <div className="space-y-1 flex-1">
          <Label htmlFor="desc-security">Security Alerts</Label>
          <p className="text-sm text-muted-foreground">
            Get notified about security updates and suspicious activity.
          </p>
        </div>
        <Switch id="desc-security" defaultChecked />
      </div>
      
      <div className="flex items-center justify-between space-x-4">
        <div className="space-y-1 flex-1">
          <Label htmlFor="desc-newsletter">Weekly Newsletter</Label>
          <p className="text-sm text-muted-foreground">
            Subscribe to our weekly digest of articles and tutorials.
          </p>
        </div>
        <Switch id="desc-newsletter" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with descriptions explaining what each toggle controls.',
      },
    },
  },
};

/**
 * Story 4: Settings Panel
 * Common pattern for application settings
 */
export const SettingsPanel: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Appearance</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-dark">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Use dark theme throughout the application
            </p>
          </div>
          <Switch id="settings-dark" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-compact">Compact View</Label>
            <p className="text-sm text-muted-foreground">
              Reduce spacing for a denser layout
            </p>
          </div>
          <Switch id="settings-compact" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Privacy</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-profile">Public Profile</Label>
            <p className="text-sm text-muted-foreground">
              Make your profile visible to other users
            </p>
          </div>
          <Switch id="settings-profile" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-activity">Show Activity Status</Label>
            <p className="text-sm text-muted-foreground">
              Let others see when you're online
            </p>
          </div>
          <Switch id="settings-activity" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-analytics">Usage Analytics</Label>
            <p className="text-sm text-muted-foreground">
              Help improve the app by sharing usage data
            </p>
          </div>
          <Switch id="settings-analytics" defaultChecked />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-push">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications on this device
            </p>
          </div>
          <Switch id="settings-push" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="settings-sound">Sound Effects</Label>
            <p className="text-sm text-muted-foreground">
              Play sounds for notifications and alerts
            </p>
          </div>
          <Switch id="settings-sound" defaultChecked />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete settings panel with grouped switches for different categories.',
      },
    },
  },
};

/**
 * Story 5: Interactive Examples
 * Controlled switches with state management
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);
    const [smsNotif, setSmsNotif] = useState(false);
    
    return (
      <div className="space-y-6 w-[500px]">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="master-notif" className="font-semibold">
                Enable All Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Master toggle for all notification types
              </p>
            </div>
            <Switch
              id="master-notif"
              checked={notifications}
              onCheckedChange={(checked) => {
                setNotifications(checked);
                if (!checked) {
                  setEmailNotif(false);
                  setPushNotif(false);
                  setSmsNotif(false);
                }
              }}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notif">Email Notifications</Label>
            <Switch
              id="email-notif"
              checked={emailNotif}
              onCheckedChange={setEmailNotif}
              disabled={!notifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notif">Push Notifications</Label>
            <Switch
              id="push-notif"
              checked={pushNotif}
              onCheckedChange={setPushNotif}
              disabled={!notifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notif">SMS Notifications</Label>
            <Switch
              id="sms-notif"
              checked={smsNotif}
              onCheckedChange={setSmsNotif}
              disabled={!notifications}
            />
          </div>
        </div>
        
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="font-medium">Active Notifications:</p>
          {!notifications && (
            <p className="text-sm text-muted-foreground">All notifications disabled</p>
          )}
          {notifications && (
            <div className="text-sm space-y-1">
              {emailNotif && <p>✓ Email notifications enabled</p>}
              {pushNotif && <p>✓ Push notifications enabled</p>}
              {smsNotif && <p>✓ SMS notifications enabled</p>}
              {!emailNotif && !pushNotif && !smsNotif && (
                <p className="text-muted-foreground">
                  Master toggle on, but no specific channels enabled
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled switches with master toggle and dependent state management.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common switch patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      {/* Account Settings */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Account Settings</h3>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-2fa">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch id="real-2fa" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-remember">Remember Me</Label>
            <p className="text-sm text-muted-foreground">
              Stay logged in on this device
            </p>
          </div>
          <Switch id="real-remember" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between py-3">
          <div className="space-y-1">
            <Label htmlFor="real-autosave">Auto-Save Drafts</Label>
            <p className="text-sm text-muted-foreground">
              Automatically save your work every 30 seconds
            </p>
          </div>
          <Switch id="real-autosave" defaultChecked />
        </div>
      </div>
      
      {/* Device Features */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Device Features</h3>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-bluetooth">Bluetooth</Label>
            <p className="text-sm text-muted-foreground">
              Connect to nearby devices
            </p>
          </div>
          <Switch id="real-bluetooth" />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-wifi">Wi-Fi</Label>
            <p className="text-sm text-muted-foreground">
              Connect to wireless networks
            </p>
          </div>
          <Switch id="real-wifi" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-location">Location Services</Label>
            <p className="text-sm text-muted-foreground">
              Allow apps to access your location
            </p>
          </div>
          <Switch id="real-location" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between py-3">
          <div className="space-y-1">
            <Label htmlFor="real-airplane">Airplane Mode</Label>
            <p className="text-sm text-muted-foreground">
              Disable all wireless connections
            </p>
          </div>
          <Switch id="real-airplane" />
        </div>
      </div>
      
      {/* Content Preferences */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Content Preferences</h3>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-autoplay">Autoplay Videos</Label>
            <p className="text-sm text-muted-foreground">
              Automatically play videos when you scroll
            </p>
          </div>
          <Switch id="real-autoplay" />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-hd">High Quality Images</Label>
            <p className="text-sm text-muted-foreground">
              Load images in HD (uses more data)
            </p>
          </div>
          <Switch id="real-hd" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between py-3">
          <div className="space-y-1">
            <Label htmlFor="real-captions">Show Captions</Label>
            <p className="text-sm text-muted-foreground">
              Display captions on videos by default
            </p>
          </div>
          <Switch id="real-captions" />
        </div>
      </div>
      
      {/* Accessibility */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Accessibility</h3>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-reduce-motion">Reduce Motion</Label>
            <p className="text-sm text-muted-foreground">
              Minimize animations and transitions
            </p>
          </div>
          <Switch id="real-reduce-motion" />
        </div>
        
        <div className="flex items-center justify-between py-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="real-large-text">Large Text</Label>
            <p className="text-sm text-muted-foreground">
              Increase font size throughout the app
            </p>
          </div>
          <Switch id="real-large-text" />
        </div>
        
        <div className="flex items-center justify-between py-3">
          <div className="space-y-1">
            <Label htmlFor="real-contrast">High Contrast</Label>
            <p className="text-sm text-muted-foreground">
              Increase contrast for better visibility
            </p>
          </div>
          <Switch id="real-contrast" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world switch patterns: account settings, device features, preferences, and accessibility.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Best practices and when to use switches
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Switch Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using switches in your applications.
        </p>
      </div>
      
      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for immediate actions</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="do-1">Enable notifications</Label>
              <Switch id="do-1" defaultChecked />
            </div>
            <p className="text-sm text-muted-foreground">
              Switch takes effect immediately
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use clear, action-oriented labels</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="do-2">Dark mode</Label>
              <Switch id="do-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              Label describes what the switch controls
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Add descriptions for complex settings</p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="do-3">Analytics</Label>
                <p className="text-xs text-muted-foreground">Help improve the app</p>
              </div>
              <Switch id="do-3" />
            </div>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Group related switches</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Notifications:</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="do-4a">Email</Label>
                <Switch id="do-4a" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="do-4b">Push</Label>
                <Switch id="do-4b" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use in forms</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="dont-1">Accept terms</Label>
              <Switch id="dont-1" />
            </div>
            <p className="text-sm text-muted-foreground">
              Use checkbox for form submissions
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use vague labels</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="dont-2">Option 1</Label>
              <Switch id="dont-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              Label should describe the feature
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for multi-select</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dont-3a">Item A</Label>
                <Switch id="dont-3a" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dont-3b">Item B</Label>
                <Switch id="dont-3b" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Use checkboxes for selecting items
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't require confirmation</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="dont-4">Delete account</Label>
              <Switch id="dont-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              Use button + dialog for destructive actions
            </p>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Switch</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Controlled Switch</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [enabled, setEnabled] = useState(false);

<Switch
  id="notifications"
  checked={enabled}
  onCheckedChange={setEnabled}
/>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Switch with Description</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<div className="flex items-center justify-between">
  <div className="space-y-1">
    <Label htmlFor="marketing">Marketing Emails</Label>
    <p className="text-sm text-muted-foreground">
      Receive promotional emails
    </p>
  </div>
  <Switch id="marketing" />
</div>`}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Accessibility */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Checklist</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Built on Radix UI Switch - fully accessible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Space/Enter keys toggle the switch</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Always pair with Label using htmlFor/id</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen readers announce on/off state</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus visible ring for keyboard navigation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Disabled state properly communicated</span>
          </li>
        </ul>
      </div>
      
      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Switch vs Checkbox Decision Tree</h3>
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">✓ Use Switch when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Action takes effect immediately (no form submit)</li>
              <li>• Controlling a setting or preference</li>
              <li>• Enabling/disabling a feature</li>
              <li>• Binary state (on/off, enabled/disabled)</li>
              <li>• Example: "Enable dark mode", "Turn on notifications"</li>
            </ul>
          </div>
          
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">Use Checkbox when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Part of a form that requires submission</li>
              <li>• Selecting multiple items from a list</li>
              <li>• Agreeing to terms or policies</li>
              <li>• No immediate action (changes saved on submit)</li>
              <li>• Example: "I accept the terms", "Select items to delete"</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Best Practices */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">UX Best Practices</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <div>
              <p className="font-medium">Provide immediate feedback</p>
              <p className="text-muted-foreground">
                When a switch is toggled, show the result immediately (e.g., theme changes instantly)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <div>
              <p className="font-medium">Make labels self-explanatory</p>
              <p className="text-muted-foreground">
                Label should make it clear what "on" means (e.g., "Dark Mode" not "Mode Toggle")
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <div>
              <p className="font-medium">Consider default state carefully</p>
              <p className="text-muted-foreground">
                Choose defaults that work for most users and are safe/privacy-conscious
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <div>
              <p className="font-medium">Add descriptions for complex settings</p>
              <p className="text-muted-foreground">
                Help users understand what enabling/disabling will do
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">5.</span>
            <div>
              <p className="font-medium">Avoid confirmation dialogs</p>
              <p className="text-muted-foreground">
                Since switches are easy to toggle back, don't ask "Are you sure?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Comprehensive guidelines with best practices, code examples, and accessibility.',
      },
    },
  },
};
