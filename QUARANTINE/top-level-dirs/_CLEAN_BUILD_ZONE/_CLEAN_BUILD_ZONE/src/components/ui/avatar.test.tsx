import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

expect.extend(toHaveNoViolations);

describe('Avatar', () => {
  describe('Rendering', () => {
    it('renders avatar container', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByText('JD');
      expect(fallback).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <Avatar className="custom-avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('applies default size classes', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-10', 'w-10', 'rounded-full');
    });
  });

  describe('AvatarImage', () => {
    it('renders image when src is provided', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img', { name: /john doe/i });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders with custom className', () => {
      render(
        <Avatar>
          <AvatarImage
            src="https://example.com/avatar.jpg"
            alt="User"
            className="custom-image"
          />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveClass('custom-image');
    });

    it('has correct aspect ratio classes', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveClass('aspect-square', 'h-full', 'w-full');
    });
  });

  describe('AvatarFallback', () => {
    it('renders fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders fallback with custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">JD</AvatarFallback>
        </Avatar>
      );

      const fallback = screen.getByText('JD');
      expect(fallback).toHaveClass('custom-fallback');
    });

    it('applies default fallback styling', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const fallback = screen.getByText('JD');
      expect(fallback).toHaveClass('rounded-full', 'bg-muted');
    });

    it('shows fallback when image fails to load', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/invalid.jpg" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      );

      // Radix Avatar will show fallback when image fails
      await waitFor(() => {
        expect(screen.getByText('U')).toBeInTheDocument();
      });
    });
  });

  describe('Different Fallback Content', () => {
    it('renders single letter fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>J</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders two letter fallback (initials)', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders icon as fallback', () => {
      const UserIcon = () => <svg data-testid="user-icon" />;
      
      render(
        <Avatar>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      );

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Image and Fallback Combination', () => {
    it('shows image when loaded successfully', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('provides alt text for image', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Profile picture" />
          <AvatarFallback>PP</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img', { name: /profile picture/i });
      expect(image).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with fallback only', async () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with image and alt text', async () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with custom styling', async () => {
      const { container } = render(
        <Avatar className="h-12 w-12">
          <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
          <AvatarFallback className="text-lg">UA</AvatarFallback>
        </Avatar>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides meaningful alt text for images', () => {
      render(
        <Avatar>
          <AvatarImage
            src="https://example.com/avatar.jpg"
            alt="Profile picture of John Doe"
          />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Profile picture of John Doe');
    });
  });

  describe('Custom Sizes', () => {
    it('applies custom size classes', () => {
      const { container } = render(
        <Avatar className="h-20 w-20">
          <AvatarFallback>XL</AvatarFallback>
        </Avatar>
      );

      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-20', 'w-20');
    });

    it('applies small size classes', () => {
      const { container } = render(
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">SM</AvatarFallback>
        </Avatar>
      );

      const avatar = container.firstChild;
      expect(avatar).toHaveClass('h-8', 'w-8');
      
      const fallback = screen.getByText('SM');
      expect(fallback).toHaveClass('text-xs');
    });
  });

  describe('Edge Cases', () => {
    it('renders without crashing when no children provided', () => {
      const { container } = render(<Avatar />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback></AvatarFallback>
        </Avatar>
      );

      const fallback = screen.getByText('', { selector: 'span' });
      expect(fallback).toBeInTheDocument();
    });

    it('handles long fallback text gracefully', () => {
      render(
        <Avatar>
          <AvatarFallback>LONGTEXT</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText('LONGTEXT')).toBeInTheDocument();
    });
  });
});
