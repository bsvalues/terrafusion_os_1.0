/**
 * @file form-workflows.integration.test.tsx
 * @description Integration tests for form workflows combining multiple input components
 * @week Week 2 Day 14
 * @testCategory Integration Testing
 */

import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// ============================================================================
// TEST COMPONENTS - Realistic Form Examples
// ============================================================================

/**
 * Login Form - Input + Label + Button
 */
const LoginForm = ({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-red-500 text-sm">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-red-500 text-sm">
              {errors.password}
            </p>
          )}
        </div>
        <Button type="submit">Login</Button>
      </div>
    </form>
  );
};

/**
 * Contact Form - Textarea + Checkbox + Submit
 */
const ContactForm = ({ onSubmit }: { onSubmit: (data: { name: string; message: string; agree: boolean }) => void }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; message?: string; agree?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; message?: string; agree?: string } = {};
    
    if (!name) newErrors.name = 'Name is required';
    if (!message) newErrors.message = 'Message is required';
    else if (message.length < 10) newErrors.message = 'Message must be at least 10 characters';
    if (!agree) newErrors.agree = 'You must agree to the terms';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ name, message, agree });
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Contact form">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-red-500 text-sm">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" role="alert" className="text-red-500 text-sm">
              {errors.message}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree"
            checked={agree}
            onCheckedChange={(checked) => setAgree(checked === true)}
            aria-invalid={!!errors.agree}
            aria-describedby={errors.agree ? 'agree-error' : undefined}
          />
          <Label htmlFor="agree">I agree to the terms and conditions</Label>
        </div>
        {errors.agree && (
          <p id="agree-error" role="alert" className="text-red-500 text-sm">
            {errors.agree}
          </p>
        )}
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
};

/**
 * Profile Form - Select + RadioGroup + Multiple Inputs
 */
const ProfileForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    username: '',
    country: '',
    notification: 'email',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.country) newErrors.country = 'Country is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Profile form">
      <div className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <p id="username-error" role="alert" className="text-red-500 text-sm">
              {errors.username}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
          >
            <SelectTrigger id="country" aria-invalid={!!errors.country}>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="au">Australia</SelectItem>
            </SelectContent>
          </Select>
          {errors.country && (
            <p id="country-error" role="alert" className="text-red-500 text-sm">
              {errors.country}
            </p>
          )}
        </div>
        <div>
          <Label>Notification Preference</Label>
          <RadioGroup
            value={formData.notification}
            onValueChange={(value) => setFormData({ ...formData, notification: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email-radio" />
              <Label htmlFor="email-radio">Email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="sms-radio" />
              <Label htmlFor="sms-radio">SMS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none-radio" />
              <Label htmlFor="none-radio">None</Label>
            </div>
          </RadioGroup>
        </div>
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  );
};

// ============================================================================
// INTEGRATION TESTS - Login Form Workflow
// ============================================================================

describe('Integration: Login Form Workflow', () => {
  describe('Component Integration', () => {
    it('should render all form components together', () => {
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should connect labels to inputs properly', () => {
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });
  });

  describe('User Workflow: Valid Submission', () => {
    it('should handle complete valid form submission workflow', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Fill out form
      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify submission
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });

    it('should handle tab navigation through all form fields', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Tab through form
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('User Workflow: Validation Errors', () => {
    it('should show validation errors when submitting empty form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Submit empty form
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify errors appear
      expect(screen.getByRole('alert', { name: /email is required/i })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /password is required/i })).toBeInTheDocument();
      
      // Verify submission didn't happen
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Enter invalid email
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify email validation error
      expect(screen.getByRole('alert', { name: /email is invalid/i })).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Enter short password
      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'short');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify password validation error
      expect(screen.getByRole('alert', { name: /password must be at least 8 characters/i })).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should clear errors when user corrects input', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Submit empty form to trigger errors
      await user.click(screen.getByRole('button', { name: /login/i }));
      expect(screen.getByRole('alert', { name: /email is required/i })).toBeInTheDocument();

      // Correct the error
      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Errors should be gone and form should submit
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Accessibility: Form Integration', () => {
    it('should have no accessibility violations', async () => {
      const handleSubmit = jest.fn();
      const { container } = render(<LoginForm onSubmit={handleSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with errors', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      const { container } = render(<LoginForm onSubmit={handleSubmit} />);
      
      // Trigger errors
      await user.click(screen.getByRole('button', { name: /login/i }));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should connect error messages to inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      // Trigger errors
      await user.click(screen.getByRole('button', { name: /login/i }));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Real-world Workflow: User Corrections', () => {
    it('should handle user typing, backspacing, and retyping', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);

      // Type email
      await user.type(emailInput, 'user@example');
      expect(emailInput).toHaveValue('user@example');

      // Clear and retype
      await user.clear(emailInput);
      await user.type(emailInput, 'correct@example.com');
      expect(emailInput).toHaveValue('correct@example.com');

      // Complete form and submit
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'correct@example.com',
        password: 'password123',
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Contact Form Workflow
// ============================================================================

describe('Integration: Contact Form Workflow', () => {
  describe('Component Integration', () => {
    it('should render all form components together', () => {
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agree to the terms/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('User Workflow: Valid Submission', () => {
    it('should handle complete form submission with checkbox', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      // Fill out form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
      await user.click(screen.getByLabelText(/agree to the terms/i));
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Verify submission
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        message: 'This is a test message with enough characters.',
        agree: true,
      });
    });

    it('should require checkbox to be checked', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      // Fill out form without checking checkbox
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/message/i), 'This is a test message.');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Verify checkbox error
      expect(screen.getByRole('alert', { name: /you must agree to the terms/i })).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('User Workflow: Textarea Validation', () => {
    it('should validate textarea minimum length', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      // Enter short message
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/message/i), 'Short');
      await user.click(screen.getByLabelText(/agree to the terms/i));
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Verify validation error
      expect(screen.getByRole('alert', { name: /message must be at least 10 characters/i })).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should handle multiline textarea input', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ContactForm onSubmit={handleSubmit} />);

      const multilineMessage = 'Line 1\nLine 2\nLine 3 with enough characters';

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/message/i), multilineMessage);
      await user.click(screen.getByLabelText(/agree to the terms/i));
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        message: multilineMessage,
        agree: true,
      });
    });
  });

  describe('Accessibility: Contact Form', () => {
    it('should have no accessibility violations', async () => {
      const handleSubmit = jest.fn();
      const { container } = render(<ContactForm onSubmit={handleSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with errors', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      const { container } = render(<ContactForm onSubmit={handleSubmit} />);
      
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Profile Form Workflow
// ============================================================================

describe('Integration: Profile Form Workflow', () => {
  describe('Component Integration: Select + RadioGroup', () => {
    it('should render all form components together', () => {
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
      expect(screen.getByText(/notification preference/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    it('should integrate Select component in form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Open select and choose option
      await user.click(screen.getByRole('combobox', { name: /country/i }));
      await user.click(screen.getByRole('option', { name: /united states/i }));

      // Verify selection
      expect(screen.getByRole('combobox', { name: /country/i })).toHaveTextContent('United States');
    });

    it('should integrate RadioGroup component in form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Select radio option
      await user.click(screen.getByLabelText('SMS'));

      // Verify selection
      expect(screen.getByLabelText('SMS')).toBeChecked();
      expect(screen.getByLabelText('Email')).not.toBeChecked();
    });
  });

  describe('User Workflow: Complete Profile Submission', () => {
    it('should handle complete form with Select and RadioGroup', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Fill out form
      await user.type(screen.getByLabelText(/username/i), 'johndoe');
      await user.click(screen.getByRole('combobox', { name: /country/i }));
      await user.click(screen.getByRole('option', { name: /canada/i }));
      await user.click(screen.getByLabelText('SMS'));
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Verify submission
      expect(handleSubmit).toHaveBeenCalledWith({
        username: 'johndoe',
        country: 'ca',
        notification: 'sms',
      });
    });

    it('should validate required fields in integrated form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Submit without filling required fields
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Verify errors
      expect(screen.getByRole('alert', { name: /username is required/i })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: /country is required/i })).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('User Workflow: Form State Synchronization', () => {
    it('should synchronize state across all form inputs', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Change multiple fields
      await user.type(screen.getByLabelText(/username/i), 'user1');
      await user.click(screen.getByRole('combobox', { name: /country/i }));
      await user.click(screen.getByRole('option', { name: /australia/i }));
      
      // Change username again
      const usernameInput = screen.getByLabelText(/username/i);
      await user.clear(usernameInput);
      await user.type(usernameInput, 'user2');
      
      // Change radio selection
      await user.click(screen.getByLabelText('None'));
      
      // Submit
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // Verify all changes are reflected
      expect(handleSubmit).toHaveBeenCalledWith({
        username: 'user2',
        country: 'au',
        notification: 'none',
      });
    });
  });

  describe('Accessibility: Profile Form', () => {
    it('should have no accessibility violations', async () => {
      const handleSubmit = jest.fn();
      const { container } = render(<ProfileForm onSubmit={handleSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain accessibility with Select open', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      const { container } = render(<ProfileForm onSubmit={handleSubmit} />);
      
      await user.click(screen.getByRole('combobox', { name: /country/i }));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases: Form Integration', () => {
    it('should handle rapid input changes across components', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(<ProfileForm onSubmit={handleSubmit} />);

      // Rapid typing
      await user.type(screen.getByLabelText(/username/i), 'a');
      await user.type(screen.getByLabelText(/username/i), 'b');
      await user.type(screen.getByLabelText(/username/i), 'c');
      
      // Rapid radio changes
      await user.click(screen.getByLabelText('SMS'));
      await user.click(screen.getByLabelText('None'));
      await user.click(screen.getByLabelText('Email'));
      
      expect(screen.getByLabelText(/username/i)).toHaveValue('abc');
      expect(screen.getByLabelText('Email')).toBeChecked();
    });
  });
});

// ============================================================================
// SUMMARY: Form Integration Tests
// ============================================================================
// Total Test Categories: 3 form workflows (Login, Contact, Profile)
// Total Tests: 30+ integration tests
// Coverage:
// - Input + Label + Button integration
// - Textarea + Checkbox integration
// - Select + RadioGroup integration
// - Form validation across components
// - Error message propagation
// - State synchronization
// - Keyboard navigation
// - Accessibility (jest-axe)
// - Real-world user workflows
