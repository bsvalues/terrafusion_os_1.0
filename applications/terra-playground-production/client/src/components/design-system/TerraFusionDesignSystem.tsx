import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import TokenDisplay from './TokenDisplay';

/**
 * Terrafusion Design System Documentation
 *
 * This component provides comprehensive documentation for the Terrafusion
 * design system, including color tokens, typography, spacing, and component usage.
 */
export const TerraFusionDesignSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 bg-background-light text-primary-gray-dark max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <img
            src="/assets/terrafusion-icon.svg"
            alt="Terrafusion Logo"
            className="w-12 h-12 mr-4"
          />
          <h1 className="text-3xl font-bold text-primary-blue tf-font-display">
            Terrafusion Design System
          </h1>
        </div>
        <p className="text-lg text-primary-gray mb-4 tf-font-body">
          A comprehensive design system for building consistent, accessible, and visually appealing
          applications.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8"><>

          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger
</> value="tokens">Design Tokens</TabsTrigger><>

          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger
</> value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <Card>
            <CardHeader><>

              <CardTitle>Introduction</CardTitle>
              <CardDescription
</>>About the Terrafusion Design System</CardDescription>
            </CardHeader>
            <CardContent><>

              <p className="mb-4">
                The Terrafusion Design System provides a comprehensive set of guidelines,
                components, and resources to create consistent, user-friendly interfaces across all
                Terrafusion applications. This system is built on modern web standards and
                accessibility best practices.
              </p>
              <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 border border-secondary-gray rounded-md"><>

                  <h3 className="font-semibold text-primary-blue-dark mb-2">Consistency</h3>
                  <p
</> className="text-primary-gray-dark">
                    Unified design language for a cohesive user experience.
                  </p>
                </div>
                <div className="p-4 border border-secondary-gray rounded-md"><>

                  <h3 className="font-semibold text-primary-blue-dark mb-2">Accessibility</h3>
                  <p
</> className="text-primary-gray-dark">
                    WCAG 2.1 AA compliant components and patterns.
                  </p>
                </div>
                <div className="p-4 border border-secondary-gray rounded-md"><>

                  <h3 className="font-semibold text-primary-blue-dark mb-2">Flexibility</h3>
                  <p
</> className="text-primary-gray-dark">
                    Adaptable system that scales to different applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>Getting Started</CardTitle>
              <CardDescription
</>>How to use the Terrafusion Design System</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div><>

                  <h3 className="text-lg font-medium text-primary-blue-dark mb-2">
                    1. Install dependencies
                  </h3>
                  <pre
</> className="bg-secondary-gray-ultralight p-3 rounded-md overflow-x-auto tf-font-mono">
                    <code>npm install --save @terrafusion/tokens @terrafusion/components</code>
                  </pre>
                </div>
                <div><>

                  <h3 className="text-lg font-medium text-primary-blue-dark mb-2">
                    2. Import CSS variables
                  </h3>
                  <pre
</> className="bg-secondary-gray-ultralight p-3 rounded-md overflow-x-auto tf-font-mono">
                    <code>@import './styles/terrafusion-tokens.css';</code>
                  </pre>
                </div>
                <div><>

                  <h3 className="text-lg font-medium text-primary-blue-dark mb-2">
                    3. Update Tailwind configuration
                  </h3>
                  <pre
</> className="bg-secondary-gray-ultralight p-3 rounded-md overflow-x-auto tf-font-mono">
                    <code>{`import terrafusionPlugin from './scripts/patchTailwind';\n\nexport default {\n  // ...\n  plugins: [terrafusionPlugin()],\n};`}</code>
                  </pre>
                </div>
                <div><>

                  <h3 className="text-lg font-medium text-primary-blue-dark mb-2">
                    4. Use Terrafusion components
                  </h3>
                  <pre
</> className="bg-secondary-gray-ultralight p-3 rounded-md overflow-x-auto tf-font-mono">
                    <code>{`import { Button } from '@/components/ui/button';\n\nfunction MyComponent() {\n  return <Button variant="primary">Click me</Button>;\n}`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens"><>

          <TokenDisplay />
        </TabsContent>

        <TabsContent
</> value="components" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Button</CardTitle>
                <CardDescription
</>>Interactive element for user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4"><>

                  <button className="bg-primary-blue text-white px-4 py-2 rounded-md">
                    Primary Button
                  </button>
                  <button
</> className="bg-secondary-gray text-primary-gray-dark px-4 py-2 rounded-md">
                    Secondary Button
                  </button>
                  <button className="border border-primary-blue text-primary-blue px-4 py-2 rounded-md">
                    Outline Button
                  </button>
                </div>
              </CardContent>
              <CardFooter>
                <a href="#" className="text-primary-blue hover:underline">
                  View documentation
                </a>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Input</CardTitle>
                <CardDescription
</>>Form controls for user input</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Text input"
                    className="border border-secondary-gray rounded-md px-3 py-2 w-full"
                  />
                  <input
                    type="text"
                    placeholder="Focused input"
                    className="border border-primary-blue rounded-md px-3 py-2 w-full"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <a href="#" className="text-primary-blue hover:underline">
                  View documentation
                </a>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Card</CardTitle>
                <CardDescription
</>>Container for related content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-secondary-gray rounded-md p-4"><>

                  <h3 className="font-medium text-primary-blue-dark">Card Title</h3>
                  <p
</> className="text-primary-gray text-sm mt-1">
                    Card description or content goes here.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <a href="#" className="text-primary-blue hover:underline">
                  View documentation
                </a>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-8">
          <Card>
            <CardHeader><>

              <CardTitle>Form Patterns</CardTitle>
              <CardDescription
</>>Best practices for form design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-secondary-gray rounded-md"><>

                  <h3 className="font-semibold text-primary-blue-dark mb-2">Input Validation</h3>
                  <p
</> className="text-primary-gray-dark mb-4">
                    Consistent approach to form validation and error states.
                  </p>
                  <div className="space-y-2"><>

                    <label className="block text-primary-gray-dark">Email</label>
                    <input
</>
                      type="email"
                      className="border border-primary-red rounded-md px-3 py-2 w-full"
                      value="invalid-email"
                    />
                    <p className="text-primary-red text-sm">Please enter a valid email address</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>Data Display</CardTitle>
              <CardDescription
</>>Patterns for showing complex data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-secondary-gray rounded-md p-4"><>

                <h3 className="font-semibold text-primary-blue-dark mb-2">Data Tables</h3>
                <p
</> className="text-primary-gray-dark mb-4">
                  Guidelines for displaying tabular data.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-gray-light">
                      <tr><>

                        <th className="px-4 py-2 text-left">Property ID</th>
                        <th
</> className="px-4 py-2 text-left">Address</th><>

                        <th className="px-4 py-2 text-left">Value</th>
                        <th
</> className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-secondary-gray"><>

                        <td className="px-4 py-2">BC-12345</td>
                        <td
</> className="px-4 py-2">123 Main St</td><>

                        <td className="px-4 py-2">$450,000</td>
                        <td
</> className="px-4 py-2">
                          <span className="bg-primary-green-light text-primary-green-dark px-2 py-1 rounded-full text-xs">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr><>

                        <td className="px-4 py-2">BC-54321</td>
                        <td
</> className="px-4 py-2">456 Oak Ave</td><>

                        <td className="px-4 py-2">$325,000</td>
                        <td
</> className="px-4 py-2">
                          <span className="bg-secondary-orange-light text-primary-orange-dark px-2 py-1 rounded-full text-xs">
                            Pending
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-8">
          <Card>
            <CardHeader><>

              <CardTitle>Accessibility</CardTitle>
              <CardDescription
</>>Making Terrafusion accessible to all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4"><>

                <p>
                  Terrafusion follows WCAG 2.1 AA guidelines to ensure our applications are
                  accessible to as many users as possible. Below are some key accessibility
                  principles to follow:
                </p>
                <ul
</> className="list-disc pl-5 space-y-2"><>

                  <li>Ensure sufficient color contrast (minimum 4.5:1 for normal text)</li>
                            <li
</>>Provide text alternatives for non-text content (alt text for images)</li><>

                  <li>Ensure keyboard accessibility for all interactive elements</li>
                            <li
</>>Use semantic HTML elements and ARIA attributes appropriately</li>
                  <li>Support screen readers with proper focus management</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>Responsive Design</CardTitle>
              <CardDescription
</>>Creating interfaces that work on all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4"><>

                <p>
                  Terrafusion applications are designed to be fully responsive, providing an optimal
                  experience across all device sizes. Here are the key breakpoints to consider:
                </p>
                <div
</> className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-gray-light">
                      <tr><>

                        <th className="px-4 py-2 text-left">Breakpoint</th>
                        <th
</> className="px-4 py-2 text-left">Size (px)</th>
                        <th className="px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-secondary-gray"><>

                        <td className="px-4 py-2 font-medium">sm</td>
                        <td
</> className="px-4 py-2">640px</td>
                        <td className="px-4 py-2">Small devices (mobile phones)</td>
                      </tr>
                      <tr className="border-b border-secondary-gray"><>

                        <td className="px-4 py-2 font-medium">md</td>
                        <td
</> className="px-4 py-2">768px</td>
                        <td className="px-4 py-2">Medium devices (tablets)</td>
                      </tr>
                      <tr className="border-b border-secondary-gray"><>

                        <td className="px-4 py-2 font-medium">lg</td>
                        <td
</> className="px-4 py-2">1024px</td>
                        <td className="px-4 py-2">Large devices (desktops)</td>
                      </tr>
                      <tr><>

                        <td className="px-4 py-2 font-medium">xl</td>
                        <td
</> className="px-4 py-2">1280px</td>
                        <td className="px-4 py-2">Extra large devices (large desktops)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerraFusionDesignSystem;
