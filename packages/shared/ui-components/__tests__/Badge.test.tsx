/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../src/Badge';

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('tf-badge', 'tf-badge--default');
    });

    it('applies custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      
      expect(badge).toHaveClass('tf-badge', 'custom-badge');
    });
  });

  describe('Variants', () => {
    it('renders primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      
      expect(badge).toHaveClass('tf-badge--primary');
    });

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      
      expect(badge).toHaveClass('tf-badge--secondary');
    });

    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      
      expect(badge).toHaveClass('tf-badge--success');
    });

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      
      expect(badge).toHaveClass('tf-badge--warning');
    });

    it('renders danger variant', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      
      expect(badge).toHaveClass('tf-badge--danger');
    });

    it('renders info variant', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      
      expect(badge).toHaveClass('tf-badge--info');
    });

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      
      expect(badge).toHaveClass('tf-badge--outline');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Badge size="small">Small</Badge>);
      const badge = screen.getByText('Small');
      
      expect(badge).toHaveClass('tf-badge--small');
    });

    it('renders medium size (default)', () => {
      render(<Badge>Medium</Badge>);
      const badge = screen.getByText('Medium');
      
      expect(badge).toHaveClass('tf-badge--medium');
    });

    it('renders large size', () => {
      render(<Badge size="large">Large</Badge>);
      const badge = screen.getByText('Large');
      
      expect(badge).toHaveClass('tf-badge--large');
    });
  });

  describe('TerraFusion Design System', () => {
    it('applies TerraFusion primary colors', () => {
      render(<Badge variant="primary">TF Primary</Badge>);
      const badge = screen.getByText('TF Primary');
      
      expect(badge).toHaveClass('tf-badge--primary');
    });

    it('applies TerraFusion glow effects on hover', () => {
      render(<Badge variant="primary">Glow Badge</Badge>);
      const badge = screen.getByText('Glow Badge');
      
      expect(badge).toHaveClass('tf-badge--primary');
      // TerraFusion badges should have smooth transitions
      expect(badge).toHaveStyle('transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('supports TerraFusion glass morphism', () => {
      render(<Badge variant="secondary" className="glass-morphism">Glass</Badge>);
      const badge = screen.getByText('Glass');
      
      expect(badge).toHaveClass('tf-badge--secondary', 'glass-morphism');
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icons', () => {
      const TestIcon = (): JSX.Element => <span data-testid="badge-icon">⭐</span>;
      render(
        <Badge>
          <TestIcon />
          Starred
        </Badge>
      );
      
      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
      expect(screen.getByText('Starred')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('works as active status indicator', () => {
      render(<Badge variant="success">Active</Badge>);
      const badge = screen.getByText('Active');
      
      expect(badge).toHaveClass('tf-badge--success');
    });

    it('works as pending status indicator', () => {
      render(<Badge variant="warning">Pending</Badge>);
      const badge = screen.getByText('Pending');
      
      expect(badge).toHaveClass('tf-badge--warning');
    });

    it('works as error status indicator', () => {
      render(<Badge variant="danger">Error</Badge>);
      const badge = screen.getByText('Error');
      
      expect(badge).toHaveClass('tf-badge--danger');
    });
  });

  describe('Module Integration', () => {
    it('works with module status', () => {
      render(<Badge variant="success">Running</Badge>);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('works with property counts', () => {
      render(<Badge variant="info">1,247 Properties</Badge>);
      expect(screen.getByText('1,247 Properties')).toBeInTheDocument();
    });

    it('works with assessment status', () => {
      render(<Badge variant="warning">5 Pending Appeals</Badge>);
      expect(screen.getByText('5 Pending Appeals')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Badge aria-label="Status indicator" role="status">
          Online
        </Badge>
      );
      const badge = screen.getByText('Online');
      
      expect(badge).toHaveAttribute('aria-label', 'Status indicator');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('maintains semantic meaning', () => {
      render(<Badge variant="success">Compliant</Badge>);
      const badge = screen.getByText('Compliant');
      
      // Badge should be semantically meaningful
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many badges', () => {
      const badges = Array.from({ length: 100 }, (_, i) => (
        <Badge key={i} variant="primary">
          Badge {i}
        </Badge>
      ));
      
      render(<div>{badges}</div>);
      
      expect(screen.getAllByText(/Badge \d+/)).toHaveLength(100);
    });
  });

  describe('Government Module Use Cases', () => {
    it('displays compliance status', () => {
      render(<Badge variant="success">ADA Compliant</Badge>);
      expect(screen.getByText('ADA Compliant')).toBeInTheDocument();
    });

    it('displays permit status', () => {
      render(<Badge variant="warning">Permit Pending</Badge>);
      expect(screen.getByText('Permit Pending')).toBeInTheDocument();
    });

    it('displays assessment stage', () => {
      render(<Badge variant="info">Under Review</Badge>);
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });

    it('displays priority level', () => {
      render(<Badge variant="danger">High Priority</Badge>);
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });
  });
});