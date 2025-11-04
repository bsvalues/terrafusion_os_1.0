import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Label } from './label';

expect.extend(toHaveNoViolations);

describe('Label', () => {
  describe('Rendering', () => {
    it('renders label with text', () => {
      render(<Label>Username</Label>);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('renders as label element', () => {
      render(<Label>Email</Label>);
      const label = screen.getByText('Email');
      expect(label.tagName).toBe('LABEL');
    });

    it('applies default styling', () => {
      render(<Label>Label Text</Label>);
      const label = screen.getByText('Label Text');
      expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none');
    });

    it('renders with custom className', () => {
      render(<Label className='custom-label'>Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label).toHaveClass('custom-label');
    });
  });

  describe('htmlFor Association', () => {
    it('associates with input using htmlFor', () => {
      render(
        <div>
          <Label htmlFor='username'>Username</Label>
          <input id='username' type='text' />
        </div>
      );

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('clicking label focuses associated input', () => {
      render(
        <div>
          <Label htmlFor='email'>Email</Label>
          <input id='email' type='email' />
        </div>
      );

      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');

      label.click();
      expect(input).toHaveFocus();
    });

    it('associates with checkbox', () => {
      render(
        <div>
          <Label htmlFor='terms'>Accept Terms</Label>
          <input id='terms' type='checkbox' />
        </div>
      );

      const label = screen.getByText('Accept Terms');
      const checkbox = screen.getByRole('checkbox');

      expect(label).toHaveAttribute('for', 'terms');
      expect(checkbox).toHaveAttribute('id', 'terms');
    });

    it('associates with radio button', () => {
      render(
        <div>
          <Label htmlFor='option1'>Option 1</Label>
          <input id='option1' type='radio' name='options' />
        </div>
      );

      const label = screen.getByText('Option 1');
      const radio = screen.getByRole('radio');

      expect(label).toHaveAttribute('for', 'option1');
      expect(radio).toHaveAttribute('id', 'option1');
    });

    it('associates with textarea', () => {
      render(
        <div>
          <Label htmlFor='message'>Message</Label>
          <textarea id='message' />
        </div>
      );

      const label = screen.getByText('Message');
      const textarea = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'message');
      expect(textarea).toHaveAttribute('id', 'message');
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Label>Text Label</Label>);
      expect(screen.getByText('Text Label')).toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(
        <Label>
          Email <span className='text-destructive'>*</span>
        </Label>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const Icon = () => <svg data-testid='label-icon' />;
      render(
        <Label>
          <Icon />
          <span>With Icon</span>
        </Label>
      );
      expect(screen.getByTestId('label-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders with nested elements', () => {
      render(
        <Label>
          Username
          <span className='text-xs text-muted-foreground'> (optional)</span>
        </Label>
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('(optional)', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Disabled State Styling', () => {
    it('applies peer-disabled styles when used with disabled input', () => {
      render(
        <div>
          <Label htmlFor='disabled-input' className='peer-disabled:opacity-70'>
            Disabled Field
          </Label>
          <input id='disabled-input' disabled className='peer' />
        </div>
      );

      const label = screen.getByText('Disabled Field');
      expect(label).toHaveClass('peer-disabled:opacity-70');
    });

    it('has cursor-not-allowed style for disabled inputs', () => {
      render(<Label>Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
    });
  });

  describe('HTML Attributes', () => {
    it('applies id attribute', () => {
      render(<Label id='my-label'>Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('id', 'my-label');
    });

    it('applies data attributes', () => {
      render(<Label data-testid='custom-label'>Label</Label>);
      const label = screen.getByTestId('custom-label');
      expect(label).toBeInTheDocument();
    });

    it('applies aria attributes', () => {
      render(<Label aria-label='Form field label'>Field</Label>);
      const label = screen.getByText('Field');
      expect(label).toHaveAttribute('aria-label', 'Form field label');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with basic label', async () => {
      const { container } = render(<Label>Label Text</Label>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with associated input', async () => {
      const { container } = render(
        <div>
          <Label htmlFor='test-input'>Test Input</Label>
          <input id='test-input' type='text' />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with required indicator', async () => {
      const { container } = render(
        <div>
          <Label htmlFor='required-input'>
            Email <span className='text-destructive'>*</span>
          </Label>
          <input id='required-input' type='email' required />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with disabled input', async () => {
      const { container } = render(
        <div>
          <Label htmlFor='disabled-field'>Disabled Field</Label>
          <input id='disabled-field' type='text' disabled />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders form field label', () => {
      render(
        <div>
          <Label htmlFor='email'>Email address</Label>
          <input id='email' type='email' />
        </div>
      );
      expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders checkbox label', () => {
      render(
        <div className='flex items-center space-x-2'>
          <input id='terms' type='checkbox' />
          <Label htmlFor='terms'>I agree to the terms and conditions</Label>
        </div>
      );
      expect(screen.getByText('I agree to the terms and conditions')).toBeInTheDocument();
    });

    it('renders radio button group labels', () => {
      render(
        <div>
          <Label htmlFor='option-a'>Option A</Label>
          <input id='option-a' type='radio' name='group' />
          <Label htmlFor='option-b'>Option B</Label>
          <input id='option-b' type='radio' name='group' />
        </div>
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(
        <div>
          <Label htmlFor='password'>
            Password
            <span className='block text-xs font-normal text-muted-foreground'>
              Must be at least 8 characters
            </span>
          </Label>
          <input id='password' type='password' />
        </div>
      );
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders without htmlFor attribute', () => {
      render(<Label>Standalone Label</Label>);
      expect(screen.getByText('Standalone Label')).toBeInTheDocument();
    });

    it('handles empty content', () => {
      const { container } = render(<Label />);
      const label = container.querySelector('label');
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it('handles long label text', () => {
      const longText =
        'This is a very long label text that might wrap to multiple lines in a narrow container';
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters', () => {
      render(<Label>Email / Username (required)</Label>);
      expect(screen.getByText('Email / Username (required)')).toBeInTheDocument();
    });
  });
});
