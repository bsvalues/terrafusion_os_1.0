import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from '../src/Card';
import { Button } from '../src/Button';
import { Badge } from '../src/Badge';

const meta: Meta<typeof Card> = {
  title: 'TerraFusion/Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TerraFusion Card Component Suite

The TerraFusion Card components provide a flexible, accessible container system for organizing content in TerraFusion applications. Built with the TerraFusion design system featuring glass morphism effects and consistent styling.

## Components

- **Card** - Main container with TerraFusion styling
- **CardHeader** - Header section for titles and actions  
- **CardBody** - Main content area
- **CardFooter** - Footer section for actions and metadata

## Features

- 🎨 **TerraFusion Design System** - Official colors and glass morphism effects
- 🏗️ **Flexible Structure** - Use components together or independently
- 📱 **Responsive Design** - Works on all screen sizes
- ♿ **Accessibility** - Semantic HTML and ARIA support
- 🎯 **Government Ready** - Perfect for property records, assessments, permits

## Government Module Use Cases

Ideal for displaying property information, assessment records, permit applications, and administrative data in TerraFusion government systems.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardBody>
        Default card with just body content
      </CardBody>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3>Card Title</h3>
      </CardHeader>
      <CardBody>
        Card content goes here. This is the main body section.
      </CardBody>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h3>Card with Footer</h3>
      </CardHeader>
      <CardBody>
        This card includes a footer section with actions.
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="small">Action</Button>
        <Button variant="ghost" size="small">Cancel</Button>
      </CardFooter>
    </Card>
  ),
};

export const CompleteCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="header-flex">
          <h3>Complete Card Example</h3>
          <Badge variant="success">Active</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <p>This is a complete card example with header, body, and footer sections.</p>
        <p>Perfect for displaying comprehensive information in TerraFusion applications.</p>
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="small">Edit</Button>
        <Button variant="outline" size="small">View Details</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete card structure with all sections and TerraFusion components.',
      },
    },
  },
};

// Property Assessment Card Example
export const PropertyCard: Story = {
  render: () => (
    <Card className="property-card">
      <CardHeader>
        <div className="header-flex">
          <h3>123 Main Street</h3>
          <Badge variant="info">Under Review</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="property-details">
          <p><strong>Parcel ID:</strong> 12-34-567-890</p>
          <p><strong>Owner:</strong> John & Jane Smith</p>
          <p><strong>Assessed Value:</strong> $245,000</p>
          <p><strong>Property Type:</strong> Residential</p>
          <p><strong>Last Assessment:</strong> March 15, 2024</p>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="small" icon={<span>📋</span>}>
          Start Assessment
        </Button>
        <Button variant="outline" size="small" icon={<span>👁️</span>}>
          View History
        </Button>
        <Button variant="ghost" size="small" icon={<span>📍</span>}>
          Map View
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Property assessment card example for TerraFusion government modules.',
      },
    },
  },
};

// Module Card Example
export const ModuleCard: Story = {
  render: () => (
    <Card className="module-card">
      <CardHeader>
        <div className="header-flex">
          <div className="module-icon">🏛️</div>
          <div>
            <h3>Assessment Module</h3>
            <Badge variant="success" size="small">Running</Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <p>Property assessment and valuation tools for county assessors.</p>
        <div className="module-stats">
          <span>📊 1,247 Properties</span>
          <span>⏱️ Last updated: 2 min ago</span>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="small">Launch Module</Button>
        <Button variant="ghost" size="small">Configure</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Module card example for TerraFusion dashboard and module launcher.',
      },
    },
  },
};

// Alert Card Example  
export const AlertCard: Story = {
  render: () => (
    <Card className="alert-card">
      <CardHeader>
        <div className="header-flex">
          <h3>⚠️ Assessment Deadline</h3>
          <Badge variant="warning">Urgent</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <p>Tax roll deadline is approaching in 5 days.</p>
        <p><strong>Pending assessments:</strong> 23 properties</p>
        <p><strong>Estimated completion time:</strong> 3 days</p>
      </CardBody>
      <CardFooter>
        <Button variant="warning" size="small">Review Pending</Button>
        <Button variant="outline" size="small">Extend Deadline</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert card for urgent notifications in government workflows.',
      },
    },
  },
};

// Glass Morphism Effect
export const GlassMorphism: Story = {
  render: () => (
    <div className="glass-demo-background">
      <Card className="glass-morphism">
        <CardHeader>
          <h3>Glass Morphism Card</h3>
        </CardHeader>
        <CardBody>
          <p>This card demonstrates the TerraFusion glass morphism effect.</p>
          <p>Perfect for overlay content and modern interfaces.</p>
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="small">Explore</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with TerraFusion glass morphism effect for modern interfaces.',
      },
    },
  },
};

// Transcend Glow Effect
export const TranscendGlow: Story = {
  render: () => (
    <Card className="transcend-glow">
      <CardHeader>
        <h3>Transcend Glow Effect</h3>
      </CardHeader>
      <CardBody>
        <p>This card features the signature TerraFusion transcend glow effect.</p>
        <p>Creates an elevated, premium appearance for important content.</p>
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="small">Experience</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with TerraFusion transcend glow effect for premium interfaces.',
      },
    },
  },
};

// Card Grid Layout
export const CardGrid: Story = {
  render: () => (
    <div className="card-grid">
      <Card>
        <CardHeader><h4>Assessments</h4></CardHeader>
        <CardBody>
          <p>1,247 total</p>
          <Badge variant="success">+12 today</Badge>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader><h4>Permits</h4></CardHeader>
        <CardBody>
          <p>89 pending</p>
          <Badge variant="warning">5 urgent</Badge>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader><h4>Appeals</h4></CardHeader>
        <CardBody>
          <p>23 active</p>
          <Badge variant="info">3 new</Badge>
        </CardBody>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple cards in a grid layout for dashboard displays.',
      },
    },
  },
};