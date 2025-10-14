import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
import { Info, HelpCircle, Settings, FileText, ChevronRight } from 'lucide-react';

/**
 * The Accordion component allows users to toggle display of sections of content.
 * Built on Radix UI primitives for robust accessibility.
 * 
 * ## Features
 * - Single or multiple items expanded at once
 * - Smooth animations on expand/collapse
 * - Keyboard navigation support (arrows, Home, End, Space, Enter)
 * - Full ARIA accordion pattern compliance
 * - Collapsible for all items to be closed
 * - Built-in chevron icon that rotates on state change
 * 
 * ## Usage
 * ```tsx
 * import {
 *   Accordion,
 *   AccordionItem,
 *   AccordionTrigger,
 *   AccordionContent,
 * } from '@/components/ui/accordion';
 * 
 * // Single item open at a time
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *     <AccordionContent>
 *       Yes. It adheres to the WAI-ARIA design pattern.
 *     </AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * 
 * // Multiple items open simultaneously
 * <Accordion type="multiple">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Question 1</AccordionTrigger>
 *     <AccordionContent>Answer 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Question 2</AccordionTrigger>
 *     <AccordionContent>Answer 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 * 
 * ## Accessibility
 * - Follows WAI-ARIA Accordion Pattern
 * - Keyboard navigation: arrows, Home/End, Space/Enter
 * - Proper aria-expanded, aria-controls, aria-labelledby
 * - Screen reader friendly with role="region"
 * - Focus management between items
 */
const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'An accessible accordion component for toggling sections of content with smooth animations and keyboard navigation.'
      }
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default single-expandable accordion (only one item open at a time)
 */
export const Default: Story = {
  render: () => <Accordion type="single" collapsible style={{
    maxWidth: '600px'
  }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern with full keyboard
          navigation support and proper ARIA attributes.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that you can customize with className
          or by modifying the component file.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer by
          removing the animation classes.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
};

/**
 * Multiple items can be expanded simultaneously
 */
export const MultipleOpen: Story = {
  render: () => <Accordion type="multiple" style={{
    maxWidth: '600px'
  }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Features</AccordionTrigger>
        <AccordionContent>
          <ul style={{
          margin: 0,
          paddingLeft: '20px',
          lineHeight: '1.8'
        }}>
            <li>Full keyboard navigation</li>
            <li>Smooth animations</li>
            <li>ARIA compliant</li>
            <li>Customizable styling</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Installation</AccordionTrigger>
        <AccordionContent>
          <p style={{
          margin: '0 0 12px 0'
        }}>Install via the Shadcn CLI:</p>
          <code style={{
          display: 'block',
          padding: '12px',
          backgroundColor: '#1a1a1a',
          borderRadius: '6px',
          fontFamily: 'monospace'
        }}>
            npx shadcn@latest add accordion
          </code>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Documentation</AccordionTrigger>
        <AccordionContent>
          Read the full documentation at{' '}
          <a href="https://ui.shadcn.com/docs/components/accordion" style={{
          color: '#0099ff',
          textDecoration: 'underline'
        }}>
            Shadcn UI Accordion Docs
          </a>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
};

/**
 * Accordion with icons for better visual communication
 */
export const WithIcons: Story = {
  render: () => <Accordion type="single" collapsible style={{
    maxWidth: '600px'
  }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center">
            <Info className="h-4 w-4" style={{
            color: '#0099ff'
          }} />
            <span>General Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          This accordion uses Lucide icons to provide visual context for each
          section. Icons help users quickly identify content types.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex items-center">
            <HelpCircle className="h-4 w-4" style={{
            color: '#f59e0b'
          }} />
            <span>Help & Support</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Need help? Check our documentation, contact support, or visit our
          community forums for assistance from other users.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <div className="flex items-center">
            <Settings className="h-4 w-4" style={{
            color: '#8b5cf6'
          }} />
            <span>Settings</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Customize your experience with various settings including theme,
          notifications, privacy controls, and account preferences.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>
          <div className="flex items-center">
            <FileText className="h-4 w-4" style={{
            color: '#22c55e'
          }} />
            <span>Documentation</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Comprehensive guides, API references, code examples, and best practices
          for using the component library in your projects.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
};

/**
 * Nested accordions for complex hierarchical content
 */
export const Nested: Story = {
  render: () => <Accordion type="single" collapsible style={{
    maxWidth: '700px'
  }}>
      <AccordionItem value="level-1-a">
        <AccordionTrigger>Frontend Development</AccordionTrigger>
        <AccordionContent>
          <p style={{
          marginBottom: '16px'
        }}>
            Building user interfaces with modern frameworks and libraries.
          </p>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="level-2-a">
              <AccordionTrigger>React</AccordionTrigger>
              <AccordionContent>
                A JavaScript library for building user interfaces. Features
                component-based architecture, virtual DOM, and hooks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="level-2-b">
              <AccordionTrigger>Vue.js</AccordionTrigger>
              <AccordionContent>
                Progressive framework for building UIs. Reactive data binding,
                component system, and easy integration.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="level-2-c">
              <AccordionTrigger>Angular</AccordionTrigger>
              <AccordionContent>
                Full-featured framework with TypeScript support, dependency
                injection, and comprehensive tooling.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="level-1-b">
        <AccordionTrigger>Backend Development</AccordionTrigger>
        <AccordionContent>
          <p style={{
          marginBottom: '16px'
        }}>
            Server-side programming, databases, and API development.
          </p>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="level-2-d">
              <AccordionTrigger>Node.js</AccordionTrigger>
              <AccordionContent>
                JavaScript runtime built on Chrome's V8 engine. Non-blocking I/O,
                event-driven architecture, NPM ecosystem.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="level-2-e">
              <AccordionTrigger>Python/Django</AccordionTrigger>
              <AccordionContent>
                High-level Python web framework. Batteries-included, ORM, admin
                interface, security features.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="level-2-f">
              <AccordionTrigger>Go</AccordionTrigger>
              <AccordionContent>
                Statically typed, compiled language. Fast compilation, built-in
                concurrency, excellent standard library.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="level-1-c">
        <AccordionTrigger>DevOps</AccordionTrigger>
        <AccordionContent>
          <p style={{
          marginBottom: '16px'
        }}>
            Infrastructure, deployment, and continuous integration.
          </p>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="level-2-g">
              <AccordionTrigger>Docker</AccordionTrigger>
              <AccordionContent>
                Containerization platform. Consistent environments, easy
                deployment, microservices architecture.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="level-2-h">
              <AccordionTrigger>Kubernetes</AccordionTrigger>
              <AccordionContent>
                Container orchestration system. Auto-scaling, self-healing, load
                balancing, rolling updates.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
};

/**
 * Controlled accordion with default open items
 */
export const ControlledState: Story = {
  render: () => <Accordion type="single" defaultValue="item-2" collapsible style={{
    maxWidth: '600px'
  }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Step 1: Setup</AccordionTrigger>
        <AccordionContent>
          Install the necessary dependencies and configure your project. This
          includes setting up your package.json and installing Node modules.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Step 2: Configuration (Default Open)</AccordionTrigger>
        <AccordionContent>
          Configure your environment variables, API endpoints, and application
          settings. This step is crucial for proper functionality.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Step 3: Deployment</AccordionTrigger>
        <AccordionContent>
          Deploy your application to production using your preferred hosting
          platform. Don't forget to run tests before deploying!
        </AccordionContent>
      </AccordionItem>
    </Accordion>
};

/**
 * Real-world FAQ section example
 */
export const FAQExample: Story = {
  render: () => <div style={{
    maxWidth: '800px',
    padding: '32px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px'
  }}>
      <h2 style={{
      fontSize: '32px',
      fontWeight: 700,
      marginBottom: '12px',
      background: 'linear-gradient(135deg, #0099ff, #00ccff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}>
        Frequently Asked Questions
      </h2>
      <p style={{
      fontSize: '16px',
      color: '#888',
      marginBottom: '32px'
    }}>
        Find answers to common questions about our service.
      </p>

      <Accordion type="single" collapsible>
        <AccordionItem value="faq-1">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                What payment methods do you accept?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            We accept all major credit cards (Visa, MasterCard, American Express),
            PayPal, and bank transfers for enterprise customers. All payments are
            securely processed through industry-standard encryption.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-2">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                Can I cancel my subscription anytime?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            Yes! You can cancel your subscription at any time from your account
            settings. You'll continue to have access to your plan until the end of
            your billing period. No hidden fees or cancellation charges.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-3">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                Do you offer a free trial?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            Absolutely! We offer a 14-day free trial with full access to all
            premium features. No credit card required to start. Simply sign up and
            start exploring everything our platform has to offer.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-4">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                What kind of support do you provide?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            We provide 24/7 email support for all customers. Premium and Enterprise
            plans include priority support, live chat, and dedicated account
            managers. Our average response time is under 2 hours.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-5">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                Is my data secure?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            Security is our top priority. We use enterprise-grade encryption (AES
            256-bit), regular security audits, GDPR compliance, and SOC 2 Type II
            certification. Your data is backed up daily and stored in multiple
            redundant locations.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-6">
          <AccordionTrigger>
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5" style={{
              color: '#0099ff'
            }} />
              <span style={{
              fontSize: '16px',
              fontWeight: 500
            }}>
                Can I upgrade or downgrade my plan?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent style={{
          fontSize: '15px',
          lineHeight: '1.7'
        }}>
            Yes, you can change your plan at any time. Upgrades take effect
            immediately, and you'll be charged the prorated difference. Downgrades
            take effect at the start of your next billing cycle to ensure you get
            full value from your current plan.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div style={{
      marginTop: '32px',
      padding: '24px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      borderLeft: '4px solid #0099ff'
    }}>
        <p style={{
        fontSize: '14px',
        color: '#ccc',
        margin: 0
      }}>
          Still have questions? Contact our support team at{' '}
          <a href="mailto:support@example.com" style={{
          color: '#0099ff',
          textDecoration: 'none'
        }}>
            support@example.com
          </a>{' '}
          or visit our{' '}
          <a href="#" style={{
          color: '#0099ff',
          textDecoration: 'none'
        }}>
            Help Center
          </a>
          .
        </p>
      </div>
    </div>
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => <div style={{
    maxWidth: '1000px',
    padding: '24px'
  }}>
      <h3 className="font-semibold">
        Accordion Usage Guidelines
      </h3>

      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px'
    }}>
        {/* DO Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✓</span> Do
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use for related content
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Group similar information together in logical sections (FAQs, settings,
                documentation)
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Keep content scannable
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Write clear, concise trigger labels so users can quickly find what they
                need
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Add icons for clarity
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Icons help users quickly identify section types and improve visual
                hierarchy
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use controlled state when needed
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Set defaultValue to open important sections by default or control state
                programmatically
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✗</span> Don't
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Nest too deeply
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                More than 2 levels of nesting can confuse users - consider alternative
                navigation
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Hide critical actions
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Don't hide primary actions or navigation in accordions - keep them
                visible
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Use for short content
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                If all content is brief, just display it - accordions add unnecessary
                interaction
              </p>
            </li>

            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>
                Make labels too long
              </strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Keep trigger text concise - long labels defeat the purpose of progressive
                disclosure
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Keyboard Navigation */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          Keyboard Navigation
        </h4>
        <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #2a2a2a'
      }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <th className="text-left font-semibold">
                  Key
                </th>
                <th className="text-left font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    Space / Enter
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Expand/collapse focused item
                </td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    Tab
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to next trigger
                </td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    Shift + Tab
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to previous trigger
                </td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    ArrowDown
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to next trigger (when focused on accordion)
                </td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    ArrowUp
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to previous trigger
                </td>
              </tr>
              <tr style={{
              borderBottom: '1px solid #2a2a2a'
            }}>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    Home
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to first trigger
                </td>
              </tr>
              <tr>
                <td style={{
                padding: '12px'
              }}>
                  <code style={{
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '4px'
                }}>
                    End
                  </code>
                </td>
                <td style={{
                padding: '12px'
              }}>
                  Move focus to last trigger
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Examples */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          Code Examples
        </h4>
        <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: '"Fira Code", monospace',
        fontSize: '13px',
        overflow: 'auto',
        border: '1px solid #2a2a2a'
      }}>
          <pre style={{
          margin: 0,
          lineHeight: '1.6'
        }}>
            {`// Single item open (collapsible)
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to WAI-ARIA.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple items open
<Accordion type="multiple">
  <AccordionItem value="item-1">
    <AccordionTrigger>Item 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Item 2</AccordionTrigger>
    <AccordionContent>Content 2</AccordionContent>
  </AccordionItem>
</Accordion>

// Default open item
<Accordion type="single" defaultValue="item-2" collapsible>
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>

// With icons
<AccordionTrigger>
  <div style={{ display: 'flex', gap: '12px' }}>
    <Icon />
    <span>Label</span>
  </div>
</AccordionTrigger>`}
          </pre>
        </div>
      </div>
    </div>
};