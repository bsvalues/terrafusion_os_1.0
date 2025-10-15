import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Alert, AlertTitle, AlertDescription } from './alert';

expect.extend(toHaveNoViolations);

describe('Alert', () => {
  describe('Rendering Variants', () => {
    it('renders with default variant', () => {
      render(
        <Alert>
          <AlertTitle>Test Title</AlertTitle>
          <AlertDescription>Test Description</AlertDescription>
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders with destructive variant', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(
        <Alert>
          <AlertDescription>Just a description</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Just a description')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders without description', () => {
      render(
        <Alert>
          <AlertTitle>Just a title</AlertTitle>
        </Alert>
      );

      expect(screen.getByText('Just a title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Alert className="custom-alert-class">
          <AlertDescription>Content</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert-class');
    });

    it('renders with both title and description', () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>Please read this carefully.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Important Notice')).toBeInTheDocument();
      expect(screen.getByText('Please read this carefully.')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('renders with icon', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <AlertTitle>With Icon</AlertTitle>
          <AlertDescription>This alert has an icon</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders icon before content', () => {
      const { container } = render(
        <Alert>
          <svg data-testid="alert-icon" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );

      const alert = container.querySelector('[role="alert"]');
      const icon = screen.getByTestId('alert-icon');
      const title = screen.getByText('Title');

      // Icon should come before title in DOM order
      expect(alert?.contains(icon)).toBe(true);
      expect(alert?.contains(title)).toBe(true);
    });

    it('renders multiple icons if provided', () => {
      render(
        <Alert>
          <svg data-testid="icon-1" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <svg data-testid="icon-2" width="16" height="16">
            <rect width="20" height="20" />
          </svg>
          <AlertDescription>Multiple icons</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('renders AlertTitle as h5 element', () => {
      render(
        <Alert>
          <AlertTitle>Heading Title</AlertTitle>
        </Alert>
      );

      const title = screen.getByText('Heading Title');
      expect(title.tagName).toBe('H5');
    });

    it('renders AlertDescription as div element', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Description text</AlertDescription>
        </Alert>
      );

      const description = screen.getByText('Description text');
      expect(description.tagName).toBe('DIV');
    });

    it('renders complex content in description', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <a href="#">Link</a>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });

    it('applies custom className to AlertTitle', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title">Title</AlertTitle>
        </Alert>
      );

      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('applies custom className to AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription className="custom-description">
            Description
          </AlertDescription>
        </Alert>
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-description');
    });
  });

  describe('Action Buttons', () => {
    it('renders with action button', () => {
      render(
        <Alert>
          <AlertTitle>Update Available</AlertTitle>
          <AlertDescription>A new version is available.</AlertDescription>
          <button>Update Now</button>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Update Now' })).toBeInTheDocument();
    });

    it('renders with multiple action buttons', () => {
      render(
        <Alert>
          <AlertTitle>Confirmation</AlertTitle>
          <AlertDescription>Do you want to continue?</AlertDescription>
          <button>Yes</button>
          <button>No</button>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    });

    it('renders dismiss button', () => {
      const handleDismiss = jest.fn();
      render(
        <Alert>
          <AlertDescription>Dismissible alert</AlertDescription>
          <button onClick={handleDismiss}>Dismiss</button>
        </Alert>
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Variant Styling', () => {
    it('applies default variant styles', () => {
      render(
        <Alert variant="default">
          <AlertDescription>Default alert</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // Check that base classes are applied
      expect(alert.className).toContain('relative');
      expect(alert.className).toContain('rounded-lg');
    });

    it('applies destructive variant styles', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>Destructive alert</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has border styling', () => {
      render(
        <Alert>
          <AlertDescription>Alert with border</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('border');
    });

    it('has padding styling', () => {
      render(
        <Alert>
          <AlertDescription>Alert with padding</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('p-4');
    });

    it('has full width styling', () => {
      render(
        <Alert>
          <AlertDescription>Full width alert</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('w-full');
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has role="alert"', () => {
      render(
        <Alert>
          <AlertDescription>Alert content</AlertDescription>
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('is announced to screen readers', () => {
      render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>This is important information</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAccessibleName();
    });

    it('supports aria-label', () => {
      render(
        <Alert aria-label="Custom alert label">
          <AlertDescription>Content</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom alert label');
    });

    it('supports aria-labelledby', () => {
      render(
        <Alert aria-labelledby="alert-title">
          <AlertTitle id="alert-title">Alert Title</AlertTitle>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-labelledby', 'alert-title');
    });

    it('supports aria-describedby', () => {
      render(
        <Alert aria-describedby="alert-desc">
          <AlertTitle>Title</AlertTitle>
          <AlertDescription id="alert-desc">Description</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-describedby', 'alert-desc');
    });

    it('has no accessibility violations (default variant)', async () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (destructive variant)', async () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (with icon)', async () => {
      const { container } = render(
        <Alert>
          <svg aria-hidden="true" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <AlertTitle>Alert with Icon</AlertTitle>
          <AlertDescription>This alert includes an icon</AlertDescription>
        </Alert>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (with button)', async () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Update Required</AlertTitle>
          <AlertDescription>
            A new version is available. Click to update.
          </AlertDescription>
          <button type="button">Update Now</button>
        </Alert>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (description only)', async () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Simple alert without title</AlertDescription>
        </Alert>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('renders empty alert', () => {
      const { container } = render(<Alert />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('handles undefined variant gracefully', () => {
      render(
        <Alert variant={undefined}>
          <AlertDescription>Content</AlertDescription>
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with data attributes', () => {
      render(
        <Alert data-testid="custom-alert" data-state="open">
          <AlertDescription>Content</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-testid', 'custom-alert');
      expect(alert).toHaveAttribute('data-state', 'open');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Alert ref={ref}>
          <AlertDescription>Content</AlertDescription>
        </Alert>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('role', 'alert');
    });

    it('handles very long content', () => {
      const longContent = 'A'.repeat(1000);
      render(
        <Alert>
          <AlertDescription>{longContent}</AlertDescription>
        </Alert>
      );

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });
});
