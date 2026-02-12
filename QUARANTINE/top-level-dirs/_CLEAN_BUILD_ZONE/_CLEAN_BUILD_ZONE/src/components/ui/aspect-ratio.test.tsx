import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AspectRatio } from './aspect-ratio';
expect.extend(toHaveNoViolations);
describe('AspectRatio', () => {
  describe('Ratio Preservation', () => {
    it('renders with 16:9 ratio', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div data-testid="content">16:9 content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with 4:3 ratio', () => {
      render(<AspectRatio ratio={4 / 3}>
          <div data-testid="content">4:3 content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with 1:1 square ratio', () => {
      render(<AspectRatio ratio={1}>
          <div data-testid="content">Square content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with 21:9 ultrawide ratio', () => {
      render(<AspectRatio ratio={21 / 9}>
          <div data-testid="content">Ultrawide content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with custom ratio', () => {
      render(<AspectRatio ratio={1.618}>
          <div data-testid="content">Golden ratio content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with vertical 9:16 ratio', () => {
      render(<AspectRatio ratio={9 / 16}>
          <div data-testid="content">Vertical content</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
  describe('Content Rendering', () => {
    it('renders image content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <img src="/test.jpg" alt="Test image" />
        </AspectRatio>);
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });
    it('renders video content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <video data-testid="video" src="/test.mp4" />
        </AspectRatio>);
      expect(screen.getByTestId('video')).toBeInTheDocument();
    });
    it('renders iframe content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <iframe title="Embedded content" src="https://example.com" data-testid="iframe" />
        </AspectRatio>);
      expect(screen.getByTestId('iframe')).toBeInTheDocument();
    });
    it('renders div with text content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div>Text content inside aspect ratio</div>
        </AspectRatio>);
      expect(screen.getByText('Text content inside aspect ratio')).toBeInTheDocument();
    });
    it('renders complex nested content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div>
            <img src="/test.jpg" alt="Image" />
            <div data-testid="overlay">
              <h3>Title</h3>
              <p>Description</p>
            </div>
          </div>
        </AspectRatio>);
      expect(screen.getByAltText('Image')).toBeInTheDocument();
      expect(screen.getByTestId('overlay')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
    it('renders multiple children', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </AspectRatio>);
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });
  describe('Custom Ratios', () => {
    it('handles decimal ratios', () => {
      render(<AspectRatio ratio={1.5}>
          <div data-testid="content">3:2 ratio</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('handles very wide ratios', () => {
      render(<AspectRatio ratio={3}>
          <div data-testid="content">Very wide</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('handles very tall ratios', () => {
      render(<AspectRatio ratio={0.5}>
          <div data-testid="content">Very tall</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('handles golden ratio (1.618)', () => {
      render(<AspectRatio ratio={1.618}>
          <div data-testid="content">Golden ratio</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
  describe('Container Interactions', () => {
    it('applies custom className', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9} className="custom-aspect-ratio">
          <div>Content</div>
        </AspectRatio>);
      const aspectRatioElement = container.firstChild;
      expect(aspectRatioElement).toHaveClass('custom-aspect-ratio');
    });
    it('applies custom styles', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9} style={{
        border: '1px solid red'
      }}>
          <div>Content</div>
        </AspectRatio>);
      const aspectRatioElement = container.firstChild as HTMLElement;
      expect(aspectRatioElement.style.border).toBe('1px solid red');
    });
    it('forwards data attributes', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9} data-testid="custom-aspect" data-state="loaded">
          <div>Content</div>
        </AspectRatio>);
      const aspectRatioElement = container.firstChild;
      expect(aspectRatioElement).toHaveAttribute('data-testid', 'custom-aspect');
      expect(aspectRatioElement).toHaveAttribute('data-state', 'loaded');
    });
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<AspectRatio ratio={16 / 9} ref={ref}>
          <div>Content</div>
        </AspectRatio>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
    it('renders with additional props', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9} id="aspect-container" role="img" aria-label="Image container">
          <div>Content</div>
        </AspectRatio>);
      const aspectRatioElement = container.firstChild;
      expect(aspectRatioElement).toHaveAttribute('id', 'aspect-container');
      expect(aspectRatioElement).toHaveAttribute('role', 'img');
      expect(aspectRatioElement).toHaveAttribute('aria-label', 'Image container');
    });
  });
  describe('Responsive Behavior', () => {
    it('maintains aspect ratio with image', () => {
      render(<AspectRatio ratio={16 / 9}>
          <img src="/test.jpg" alt="Responsive image" className="w-full" />
        </AspectRatio>);
      const image = screen.getByAltText('Responsive image');
      expect(image).toHaveStyle({
        width: '100%',
        height: '100%'
      });
    });
    it('works with percentage widths', () => {
      const {
        container
      } = render(<div style={{
        width: '80%'
      }}>
          <AspectRatio ratio={16 / 9}>
            <div data-testid="content">Content</div>
          </AspectRatio>
        </div>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('works with fixed widths', () => {
      const {
        container
      } = render(<div style={{
        width: '400px'
      }}>
          <AspectRatio ratio={16 / 9}>
            <div data-testid="content">Content</div>
          </AspectRatio>
        </div>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('works with max-width constraints', () => {
      const {
        container
      } = render(<div style={{
        maxWidth: '600px'
      }}>
          <AspectRatio ratio={16 / 9}>
            <div data-testid="content">Content</div>
          </AspectRatio>
        </div>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
  describe('ARIA and Accessibility', () => {
    it('allows accessible content within', () => {
      render(<AspectRatio ratio={16 / 9}>
          <img src="/test.jpg" alt="Descriptive alt text" />
        </AspectRatio>);
      const image = screen.getByAltText('Descriptive alt text');
      expect(image).toBeInTheDocument();
    });
    it('supports aria-label on child content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div aria-label="Video player">
            <video data-testid="video" src="/test.mp4" />
          </div>
        </AspectRatio>);
      expect(screen.getByLabelText('Video player')).toBeInTheDocument();
    });
    it('supports aria-labelledby on child content', () => {
      render(<AspectRatio ratio={16 / 9}>
          <div>
            <h3 id="video-title">Video Title</h3>
            <video aria-labelledby="video-title" data-testid="video" src="/test.mp4" />
          </div>
        </AspectRatio>);
      expect(screen.getByTestId('video')).toHaveAttribute('aria-labelledby', 'video-title');
    });
    it('has no accessibility violations with image', async () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          <img src="/test.jpg" alt="Test image" />
        </AspectRatio>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations with video', async () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          <video aria-label="Test video" src="/test.mp4" data-testid="video" />
        </AspectRatio>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations with iframe', async () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          <iframe title="Embedded content" src="https://example.com" />
        </AspectRatio>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations with text content', async () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          <div>Text content with proper structure</div>
        </AspectRatio>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  describe('Edge Cases', () => {
    it('renders with ratio of 0 (edge case)', () => {
      render(<AspectRatio ratio={0}>
          <div data-testid="content">Zero ratio</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('handles empty children gracefully', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          {null}
        </AspectRatio>);
      expect(container.firstChild).toBeInTheDocument();
    });
    it('handles undefined children', () => {
      const {
        container
      } = render(<AspectRatio ratio={16 / 9}>
          {undefined}
        </AspectRatio>);
      expect(container.firstChild).toBeInTheDocument();
    });
    it('renders with very large ratio', () => {
      render(<AspectRatio ratio={100}>
          <div data-testid="content">Very wide</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('renders with very small ratio', () => {
      render(<AspectRatio ratio={0.01}>
          <div data-testid="content">Very tall</div>
        </AspectRatio>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});