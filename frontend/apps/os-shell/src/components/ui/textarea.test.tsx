import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { vi } from 'vitest';
import { Textarea } from './textarea';

expect.extend(toHaveNoViolations);

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders textarea element', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('applies default styling', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(
        'min-h-[60px]',
        'w-full',
        'rounded-md',
        'border',
        'border-input'
      );
    });

    it('renders with custom className', () => {
      render(<Textarea className='custom-textarea' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('custom-textarea');
    });

    it('renders with placeholder', () => {
      render(<Textarea placeholder='Enter your message...' />);
      const textarea = screen.getByPlaceholderText('Enter your message...');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Value and Input', () => {
    it('renders with initial value', () => {
      render(<Textarea value='Initial text' onChange={() => {}} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial text');
    });

    it('renders with defaultValue', () => {
      render(<Textarea defaultValue='Default text' />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Default text');
    });

    it('handles user input', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Hello world');
      expect(textarea).toHaveValue('Hello world');
    });

    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles multiline text', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled textarea', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Test');
      expect(textarea).toHaveValue('');
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Textarea disabled onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Read-only State', () => {
    it('renders read-only textarea', () => {
      render(<Textarea readOnly value='Read-only text' />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('readonly');
      expect(textarea.value).toBe('Read-only text');
    });

    it('does not accept input when read-only', async () => {
      const user = userEvent.setup();
      render(<Textarea readOnly defaultValue='Initial' />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'New text');
      expect(textarea).toHaveValue('Initial');
    });
  });

  describe('Required State', () => {
    it('renders required textarea', () => {
      render(<Textarea required />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeRequired();
    });

    it('applies required attribute', () => {
      render(<Textarea required />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('required');
    });
  });

  describe('Rows and Cols', () => {
    it('applies rows attribute', () => {
      render(<Textarea rows={5} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('applies cols attribute', () => {
      render(<Textarea cols={50} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('applies both rows and cols', () => {
      render(<Textarea rows={10} cols={80} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
      expect(textarea).toHaveAttribute('cols', '80');
    });
  });

  describe('Max Length', () => {
    it('applies maxLength attribute', () => {
      render(<Textarea maxLength={100} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxlength', '100');
    });

    it('enforces maxLength limit', async () => {
      const user = userEvent.setup();
      render(<Textarea maxLength={10} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'This is a very long text that exceeds the limit');
      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Focus Behavior', () => {
    it('can be focused', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.click(textarea);
      expect(textarea).toHaveFocus();
    });

    it('can be focused programmatically', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('applies focus-visible styles', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1');
    });
  });

  describe('HTML Attributes', () => {
    it('applies id attribute', () => {
      render(<Textarea id='message' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'message');
    });

    it('applies name attribute', () => {
      render(<Textarea name='comment' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('name', 'comment');
    });

    it('applies data attributes', () => {
      render(<Textarea data-testid='custom-textarea' data-value='test' />);
      const textarea = screen.getByTestId('custom-textarea');
      expect(textarea).toHaveAttribute('data-value', 'test');
    });

    it('applies aria-label', () => {
      render(<Textarea aria-label='Message input' />);
      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toBeInTheDocument();
    });

    it('applies aria-describedby', () => {
      render(
        <div>
          <Textarea aria-describedby='helper-text' />
          <div id='helper-text'>Helper text here</div>
        </div>
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('applies aria-invalid', () => {
      render(<Textarea aria-invalid='true' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Textarea aria-label='Message' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with label', async () => {
      const { container } = render(
        <div>
          <label htmlFor='message'>Message</label>
          <Textarea id='message' />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when disabled', async () => {
      const { container } = render(<Textarea disabled aria-label='Message' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when required', async () => {
      const { container } = render(
        <div>
          <label htmlFor='required-message'>Message *</label>
          <Textarea id='required-message' required />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with error state', async () => {
      const { container } = render(
        <div>
          <label htmlFor='error-message'>Message</label>
          <Textarea id='error-message' aria-invalid='true' aria-describedby='error-text' />
          <div id='error-text'>This field is required</div>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom height', () => {
      render(<Textarea className='min-h-[120px]' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[120px]');
    });

    it('applies custom width', () => {
      render(<Textarea className='w-1/2' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('w-1/2');
    });

    it('applies custom border styling', () => {
      render(<Textarea className='border-2 border-blue-500' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-2', 'border-blue-500');
    });

    it('applies custom padding', () => {
      render(<Textarea className='p-4' />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('p-4');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders as comment field', () => {
      render(
        <div>
          <label htmlFor='comment'>Leave a comment</label>
          <Textarea id='comment' placeholder='Write your comment here...' />
        </div>
      );
      const textarea = screen.getByPlaceholderText('Write your comment here...');
      expect(textarea).toBeInTheDocument();
    });

    it('renders as message field with character limit', () => {
      render(
        <div>
          <label htmlFor='message'>Message (max 280 characters)</label>
          <Textarea id='message' maxLength={280} placeholder="What's on your mind?" />
        </div>
      );
      const textarea = screen.getByPlaceholderText("What's on your mind?");
      expect(textarea).toHaveAttribute('maxlength', '280');
    });

    it('renders as description field', () => {
      render(
        <div>
          <label htmlFor='description'>Product Description</label>
          <Textarea id='description' rows={5} placeholder='Describe your product in detail...' />
        </div>
      );
      const textarea = screen.getByPlaceholderText('Describe your product in detail...');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('renders as feedback form', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <label htmlFor='feedback'>Your Feedback</label>
          <Textarea id='feedback' required placeholder='Tell us what you think...' />
          <button type='submit'>Submit</button>
        </form>
      );

      const textarea = screen.getByPlaceholderText('Tell us what you think...');
      await user.type(textarea, 'Great product!');

      const button = screen.getByRole('button', { name: /submit/i });
      await user.click(button);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(<Textarea value='' onChange={() => {}} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles very long text', async () => {
      const longText = 'A'.repeat(1000);
      render(<Textarea defaultValue={longText} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value.length).toBe(1000);
    });

    it('handles special characters', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '<script>alert("XSS")</script>');
      expect(textarea).toHaveValue('<script>alert("XSS")</script>');
    });

    it('handles emoji and unicode', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '🎉 Hello 世界! 🌍');
      expect(textarea).toHaveValue('🎉 Hello 世界! 🌍');
    });

    it('handles whitespace and newlines', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, '  Line with spaces  {Enter}{Enter}Another line  ');
      expect(textarea).toHaveValue('  Line with spaces  \n\nAnother line  ');
    });
  });

  describe('Form Integration', () => {
    it('submits value in form', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        return formData.get('message');
      });

      render(
        <form onSubmit={handleSubmit}>
          <Textarea name='message' defaultValue='Test message' />
          <button type='submit'>Submit</button>
        </form>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('validates required field', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Textarea name='message' required />
          <button type='submit'>Submit</button>
        </form>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeRequired();
    });
  });
});
