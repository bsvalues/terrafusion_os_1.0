import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

/**
 * The Card component is a versatile container for grouping related content.
 * It consists of multiple sub-components that work together to create structured layouts.
 * 
 * ## Features
 * - Flexible composition with CardHeader, CardContent, CardFooter
 * - CardTitle and CardDescription for consistent typography
 * - Built-in shadow and border styling
 * - Fully responsive and accessible
 * - Can be used standalone or composed with other components
 * 
 * ## Usage
 * ```tsx
 * import { 
 *   Card, 
 *   CardHeader, 
 *   CardTitle, 
 *   CardDescription, 
 *   CardContent,
 *   CardFooter 
 * } from '@/components/ui/card';
 * 
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 *   <CardFooter>Footer content</CardFooter>
 * </Card>
 * ```
 * 
 * ## Accessibility
 * - Semantic HTML structure
 * - Proper heading hierarchy with CardTitle
 * - Screen reader friendly
 * - Keyboard navigable when interactive
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card component for grouping related content with optional header, content, and footer sections.'
      }
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with all sections: header, content, and footer
 */
export const Default: Story = {
  render: () => <Card style={{
    maxWidth: '400px'
  }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here. This provides context about the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card. You can place any content here including text, images, forms, or other components.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Cancel</Button>
        <Button style={{
        marginLeft: '8px'
      }}>Confirm</Button>
      </CardFooter>
    </Card>
};

/**
 * Card with only content - minimal structure
 */
export const SimpleCard: Story = {
  render: () => <Card style={{
    maxWidth: '400px',
    padding: '24px'
  }}>
      <p>Simple card with just content. No header or footer needed.</p>
    </Card>
};

/**
 * Card with header only - good for section titles
 */
export const WithHeaderOnly: Story = {
  render: () => <Card style={{
    maxWidth: '400px'
  }}>
      <CardHeader>
        <CardTitle>Section Title</CardTitle>
        <CardDescription>This card only has a header section.</CardDescription>
      </CardHeader>
    </Card>
};

/**
 * Multiple cards in a grid layout - common pattern
 */
export const CardGrid: Story = {
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
    padding: '24px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px'
  }}>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
            12,543
          </div>
          <p style={{
          fontSize: '14px',
          color: '#888'
        }}>Total page views</p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm">View Details</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Active users this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
            2,847
          </div>
          <p style={{
          fontSize: '14px',
          color: '#888'
        }}>+12% from last month</p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm">View Details</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Monthly revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
            $45,231
          </div>
          <p style={{
          fontSize: '14px',
          color: '#888'
        }}>+8% from last month</p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm">View Details</Button>
        </CardFooter>
      </Card>
    </div>
};

/**
 * Card with form - common use case
 */
export const CardWithForm: Story = {
  render: () => <Card style={{
    maxWidth: '500px'
  }}>
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex">
          <div>
            <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}>
              Name
            </label>
            <input type="text" placeholder="Project name" className="w-full" />
          </div>
          
          <div>
            <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}>
              Description
            </label>
            <textarea placeholder="Project description" rows={3} className="w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter style={{
      justifyContent: 'flex-end',
      gap: '12px'
    }}>
        <Button variant="ghost">Cancel</Button>
        <Button>Create Project</Button>
      </CardFooter>
    </Card>
};

/**
 * Interactive card - clickable/hoverable
 */
export const InteractiveCard: Story = {
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    padding: '24px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px'
  }}>
      <Card style={{
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}>
        <CardHeader>
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <CardTitle style={{
          fontSize: '18px'
        }}>Dashboard</CardTitle>
          <CardDescription>View your metrics and analytics</CardDescription>
        </CardHeader>
      </Card>

      <Card style={{
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}>
        <CardHeader>
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <CardTitle style={{
          fontSize: '18px'
        }}>Billing</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
      </Card>

      <Card style={{
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}>
        <CardHeader>
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <CardTitle style={{
          fontSize: '18px'
        }}>Settings</CardTitle>
          <CardDescription>Configure your preferences</CardDescription>
        </CardHeader>
      </Card>
    </div>
};

/**
 * Real-world example - user profile card
 */
export const RealWorldExample: Story = {
  render: () => <div className="flex">
      {/* Profile Card */}
      <Card style={{
      width: '350px'
    }}>
        <CardHeader>
          <div className="flex items-center">
            <div className="flex items-center">
              JD
            </div>
            <div>
              <CardTitle style={{
              fontSize: '20px',
              marginBottom: '4px'
            }}>John Doe</CardTitle>
              <CardDescription>Software Engineer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <div className="flex justify-between">
              <span style={{
              color: '#888'
            }}>Email:</span>
              <span>john.doe@example.com</span>
            </div>
            <div className="flex justify-between">
              <span style={{
              color: '#888'
            }}>Location:</span>
              <span>San Francisco, CA</span>
            </div>
            <div className="flex justify-between">
              <span style={{
              color: '#888'
            }}>Member since:</span>
              <span>Jan 2024</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm">Message</Button>
          <Button size="sm">View Profile</Button>
        </CardFooter>
      </Card>

      {/* Stats Card */}
      <Card style={{
      width: '350px'
    }}>
        <CardHeader>
          <CardTitle>Project Statistics</CardTitle>
          <CardDescription>Overview of your recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
            <div className="text-center">
              <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>24</div>
              <div style={{
              fontSize: '12px',
              color: '#888'
            }}>Projects</div>
            </div>
            <div className="text-center">
              <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>156</div>
              <div style={{
              fontSize: '12px',
              color: '#888'
            }}>Commits</div>
            </div>
            <div className="text-center">
              <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>89</div>
              <div style={{
              fontSize: '12px',
              color: '#888'
            }}>Pull Requests</div>
            </div>
            <div className="text-center">
              <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>12</div>
              <div style={{
              fontSize: '12px',
              color: '#888'
            }}>Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => <div style={{
    maxWidth: '900px',
    padding: '24px'
  }}>
      <h3 className="font-semibold">
        Card Usage Guidelines
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
            }}>Use for grouping related content</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Cards are perfect for containing forms, user profiles, or statistics
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
            }}>Keep consistent spacing</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Use consistent gaps between cards in grids (16px-24px recommended)
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
            }}>Use CardHeader for titles</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                CardTitle and CardDescription provide consistent typography
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
            }}>Make interactive cards obvious</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Add hover states and cursor: pointer for clickable cards
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
            }}>Overuse cards</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Not every piece of content needs a card - avoid visual clutter
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
            }}>Nest cards deeply</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Avoid cards within cards - it creates confusing hierarchy
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
            }}>Make cards too wide</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Cards lose readability when wider than 600px - use max-width
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
            }}>Skip semantic structure</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Always use CardHeader, CardContent, CardFooter for proper structure
              </p>
            </li>
          </ul>
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
          {`// Complete card structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Simple card
<Card className="p-6">
  <p>Simple content</p>
</Card>

// Interactive card with hover effect
<Card 
  className="cursor-pointer transition-all hover:shadow-lg"
  onClick={() => handleClick()}
>
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
</Card>

// Card grid
<div className="grid grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>`}
          </pre>
        </div>
      </div>
    </div>
};