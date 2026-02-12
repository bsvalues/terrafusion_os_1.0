/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="Default text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Default text');
    });

    it('renders with specific type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('Input Types', () => {
    it('renders text input', () => {
      render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(<Input type="email" data-testid="email-input" />);
      expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input type="password" data-testid="password-input" />);
      expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input type="number" data-testid="number-input" />);
      expect(screen.getByTestId('number-input')).toHaveAttribute('type', 'number');
    });

    it('renders search input', () => {
      render(<Input type="search" role="searchbox" />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('renders file input', () => {
      render(<Input type="file" data-testid="file-input" />);
      expect(screen.getByTestId('file-input')).toHaveAttribute('type', 'file');
    });
  });

  describe('States', () => {
    it('renders disabled input', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('renders readonly input', () => {
      render(<Input readOnly value="Read only" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('cannot type in disabled input', async () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'test');
      
      expect(input).toHaveValue('');
    });

    it('cannot type in readonly input', async () => {
      render(<Input readOnly value="Original" />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'test');
      
      expect(input).toHaveValue('Original');
    });
  });

  describe('Interactions', () => {
    it('allows typing text', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('clears text on clear', async () => {
      render(<Input defaultValue="Initial text" />);
      const input = screen.getByRole('textbox');
      
      await userEvent.clear(input);
      
      expect(input).toHaveValue('');
    });

    it('triggers onChange handler', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await userEvent.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // Called for each character
    });

    it('triggers onFocus handler', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await userEvent.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('triggers onBlur handler', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await userEvent.click(input);
      await userEvent.tab(); // Move focus away
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('can be focused with Tab key', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await userEvent.tab();
      
      expect(input).toHaveFocus();
    });
  });

  describe('Validation', () => {
    it('accepts required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('accepts maxLength attribute', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
    });

    it('accepts minLength attribute', () => {
      render(<Input minLength={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '5');
    });

    it('accepts pattern attribute', () => {
      render(<Input pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('respects maxLength constraint', async () => {
      render(<Input maxLength={5} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      await userEvent.type(input, '1234567890');
      
      // Should only accept 5 characters
      expect(input.value.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('accepts aria-label', () => {
      render(<Input aria-label="Username" />);
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('accepts aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <div id="helper-text">Enter your username</div>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('accepts data attributes', () => {
      render(<Input data-testid="custom-input" data-custom="value" />);
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('data-custom', 'value');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref as any} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Accessibility', () => {
    it('has textbox role by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await userEvent.tab();
      expect(input).toHaveFocus();
      
      await userEvent.keyboard('test');
      expect(input).toHaveValue('test');
    });

    it('announces required state', () => {
      render(<Input required aria-label="Required field" />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('announces disabled state', () => {
      render(<Input disabled aria-label="Disabled field" />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('supports aria-invalid for errors', () => {
      render(<Input aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Form Integration', () => {
    it('can be submitted in a form', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'testuser');
      
      const submitButton = screen.getByRole('button');
      await userEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('includes value in form data', async () => {
      let formData: FormData | null = null;
      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        formData = new FormData(e.currentTarget);
      };

      render(
        <form onSubmit={handleSubmit}>
          <Input name="email" defaultValue="test@example.com" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button');
      await userEvent.click(submitButton);
      
      expect(formData?.get('email')).toBe('test@example.com');
    });
  });
});
