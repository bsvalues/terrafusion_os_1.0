import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Avatar } from './avatar';

expect.extend(toHaveNoViolations);

describe('Avatar', () => {
  describe('Rendering', () => {
    it('renders avatar container', () => {
      const { container } = render(<Avatar fallback='JD' />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<Avatar className='custom-avatar' fallback='JD' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('applies default size classes (md)', () => {
      const { container } = render(<Avatar fallback='JD' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-10', 'w-10', 'rounded-full');
    });

    it('applies default fallback character when none provided', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Image Rendering', () => {
    it('renders image when src is provided', () => {
      render(<Avatar src='https://example.com/avatar.jpg' fallback='JD' />);
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('image has correct aspect ratio classes', () => {
      render(<Avatar src='https://example.com/avatar.jpg' />);
      const image = screen.getByRole('img');
      expect(image).toHaveClass('aspect-square', 'h-full', 'w-full', 'object-cover');
    });

    it('image has default alt text', () => {
      render(<Avatar src='https://example.com/avatar.jpg' />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Avatar');
    });
  });

  describe('Fallback Rendering', () => {
    it('renders fallback text when no src', () => {
      render(<Avatar fallback='JD' />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders single letter fallback', () => {
      render(<Avatar fallback='J' />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders two letter fallback (initials)', () => {
      render(<Avatar fallback='JD' />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders default ? when fallback is undefined', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('shows fallback instead of image when src is not provided', () => {
      render(<Avatar fallback='U' />);
      expect(screen.getByText('U')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size (sm)', () => {
      const { container } = render(<Avatar size='sm' fallback='SM' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-8', 'w-8', 'text-xs');
    });

    it('renders medium size (md) - default', () => {
      const { container } = render(<Avatar size='md' fallback='MD' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-10', 'w-10', 'text-sm');
    });

    it('renders large size (lg)', () => {
      const { container } = render(<Avatar size='lg' fallback='LG' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-12', 'w-12', 'text-base');
    });

    it('renders extra large size (xl)', () => {
      const { container } = render(<Avatar size='xl' fallback='XL' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-16', 'w-16', 'text-lg');
    });
  });

  describe('Glow Effect', () => {
    it('applies glow classes when glow is true', () => {
      const { container } = render(<Avatar glow fallback='GL' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('ring-2');
    });

    it('does not apply glow classes when glow is false', () => {
      const { container } = render(<Avatar glow={false} fallback='NG' />);
      const avatar = container.firstChild;
      expect(avatar).not.toHaveClass('ring-2');
    });

    it('does not apply glow classes by default', () => {
      const { container } = render(<Avatar fallback='DF' />);
      const avatar = container.firstChild;
      expect(avatar).not.toHaveClass('ring-2');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with fallback only', async () => {
      const { container } = render(<Avatar fallback='JD' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with image', async () => {
      const { container } = render(<Avatar src='https://example.com/avatar.jpg' fallback='JD' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with glow effect', async () => {
      const { container } = render(<Avatar glow fallback='GL' />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('renders without crashing when no props provided', () => {
      const { container } = render(<Avatar />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty string fallback', () => {
      render(<Avatar fallback='' />);
      // Empty string is falsy, so default '?' should show
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('handles long fallback text', () => {
      render(<Avatar fallback='LONGTEXT' />);
      expect(screen.getByText('LONGTEXT')).toBeInTheDocument();
    });

    it('custom className does not override core styles', () => {
      const { container } = render(<Avatar className='custom-class' fallback='JD' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('rounded-full', 'overflow-hidden', 'custom-class');
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders user profile avatar', () => {
      render(<Avatar src='https://example.com/john.jpg' size='lg' />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/john.jpg');
    });

    it('renders initials when user has no profile picture', () => {
      render(<Avatar fallback='JD' size='md' />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders with glow for online status indicator', () => {
      const { container } = render(<Avatar src='https://example.com/user.jpg' glow size='sm' />);
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('ring-2');
    });
  });
});
