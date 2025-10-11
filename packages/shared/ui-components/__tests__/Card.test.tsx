/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../src/Card';

describe('Card Component Suite', () => {
  describe('Card Base Component', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('tf-card');
      expect(card).toHaveTextContent('Card Content');
    });

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toHaveClass('tf-card', 'custom-card');
    });

    it('applies TerraFusion styling', () => {
      render(<Card data-testid="card">TerraFusion Card</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toHaveClass('tf-card');
      // Verify TerraFusion design system classes are applied
      const styles = getComputedStyle(card);
      expect(card).toHaveStyle('border-radius: 12px');
    });

    it('supports transcend glow effect', () => {
      render(<Card className="transcend-glow" data-testid="card">Glowing Card</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toHaveClass('tf-card', 'transcend-glow');
    });
  });

  describe('CardHeader Component', () => {
    it('renders header content', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <h2>Card Title</h2>
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('tf-card__header');
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('applies custom className to header', () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="header">
            Header Content
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('tf-card__header', 'custom-header');
    });
  });

  describe('CardBody Component', () => {
    it('renders body content', () => {
      render(
        <Card>
          <CardBody data-testid="body">
            <p>This is the card body content</p>
          </CardBody>
        </Card>
      );
      
      const body = screen.getByTestId('body');
      expect(body).toBeInTheDocument();
      expect(body).toHaveClass('tf-card__body');
      expect(screen.getByText('This is the card body content')).toBeInTheDocument();
    });

    it('applies custom className to body', () => {
      render(
        <Card>
          <CardBody className="custom-body" data-testid="body">
            Body Content
          </CardBody>
        </Card>
      );
      
      const body = screen.getByTestId('body');
      expect(body).toHaveClass('tf-card__body', 'custom-body');
    });
  });

  describe('CardFooter Component', () => {
    it('renders footer content', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('tf-card__footer');
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('applies custom className to footer', () => {
      render(
        <Card>
          <CardFooter className="custom-footer" data-testid="footer">
            Footer Content
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('tf-card__footer', 'custom-footer');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all sections', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <h2>Property Details</h2>
          </CardHeader>
          <CardBody data-testid="body">
            <p>123 Main Street</p>
            <p>Assessed Value: $250,000</p>
          </CardBody>
          <CardFooter data-testid="footer">
            <button>View Details</button>
            <button>Edit</button>
          </CardFooter>
        </Card>
      );
      
      // Verify all sections are present
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('body')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      
      // Verify content
      expect(screen.getByText('Property Details')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('Assessed Value: $250,000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });

  describe('TerraFusion Design Integration', () => {
    it('applies TerraFusion color scheme', () => {
      render(
        <Card className="tf-primary" data-testid="card">
          TerraFusion Primary Card
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('tf-card', 'tf-primary');
    });

    it('supports glass morphism effects', () => {
      render(
        <Card className="glass-morphism" data-testid="card">
          Glass Effect Card
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('tf-card', 'glass-morphism');
    });

    it('supports hover effects', () => {
      render(
        <Card className="hover:shadow-lg transition-all" data-testid="card">
          Interactive Card
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('tf-card', 'hover:shadow-lg', 'transition-all');
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Card role="article" aria-labelledby="card-title" data-testid="card">
          <CardHeader>
            <h2 id="card-title">Accessible Card</h2>
          </CardHeader>
          <CardBody>Content</CardBody>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('maintains semantic structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <h2>Semantic Card</h2>
          </CardHeader>
          <CardBody>
            <p>Well-structured content</p>
          </CardBody>
        </Card>
      );
      
      // Verify semantic HTML structure
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Module Integration', () => {
    it('works with TerraFusion module components', () => {
      render(
        <Card data-testid="module-card">
          <CardHeader>
            <h3>Assessment Module</h3>
          </CardHeader>
          <CardBody>
            <p>Property assessment tools and analytics</p>
          </CardBody>
          <CardFooter>
            <button>Launch Module</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Assessment Module')).toBeInTheDocument();
      expect(screen.getByText('Property assessment tools and analytics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Launch Module' })).toBeInTheDocument();
    });
  });
});