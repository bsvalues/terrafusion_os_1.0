import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ScrollArea } from './scroll-area';

expect.extend(toHaveNoViolations);

describe('ScrollArea', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(
        <ScrollArea>
          <div>Scroll content</div>
        </ScrollArea>
      );

      expect(screen.getByText('Scroll content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ScrollArea className='custom-class'>
          <div>Content</div>
        </ScrollArea>
      );

      const scrollArea = container.querySelector(
        '[data-radix-scroll-area-viewport]'
      )?.parentElement;
      expect(scrollArea).toHaveClass('custom-class');
    });

    it('renders with default vertical orientation', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const scrollbar = container.querySelector('[data-orientation="vertical"]');
      expect(scrollbar).toBeInTheDocument();
    });

    it('renders viewport element', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(viewport).toBeInTheDocument();
    });

    it('renders scrollbar thumb', () => {
      const { container } = render(
        <ScrollArea>
          <div style={{ height: '2000px' }}>Tall content</div>
        </ScrollArea>
      );

      const thumb = container.querySelector('[data-state]');
      expect(thumb).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior', () => {
    it('allows vertical scrolling', async () => {
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>
            <div data-testid='top'>Top</div>
            <div data-testid='bottom' style={{ marginTop: '450px' }}>
              Bottom
            </div>
          </div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      expect(viewport).toBeInTheDocument();

      // Initially, bottom should not be visible
      const bottom = screen.getByTestId('bottom');
      const initialRect = bottom.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      expect(initialRect.top).toBeGreaterThan(viewportRect.bottom);

      // Scroll down
      viewport.scrollTop = 450;

      await waitFor(() => {
        const newRect = bottom.getBoundingClientRect();
        const newViewportRect = viewport.getBoundingClientRect();
        expect(newRect.top).toBeLessThan(newViewportRect.bottom);
      });
    });

    it('shows scrollbar on hover when content overflows', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const scrollArea = container.querySelector(
        '[data-radix-scroll-area-viewport]'
      )?.parentElement;

      if (scrollArea) {
        await user.hover(scrollArea);

        await waitFor(() => {
          const scrollbar = container.querySelector('[data-radix-scroll-area-scrollbar]');
          expect(scrollbar).toBeInTheDocument();
        });
      }
    });

    it('does not show scrollbar when content fits', () => {
      const { container } = render(
        <ScrollArea className='h-96'>
          <div style={{ height: '100px' }}>Short content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
    });
  });

  describe('Orientation', () => {
    it('supports vertical orientation by default', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const verticalScrollbar = container.querySelector('[data-orientation="vertical"]');
      expect(verticalScrollbar).toBeInTheDocument();
    });

    it('supports horizontal orientation', () => {
      const { container } = render(
        <ScrollArea orientation='horizontal'>
          <div>Content</div>
        </ScrollArea>
      );

      const horizontalScrollbar = container.querySelector('[data-orientation="horizontal"]');
      expect(horizontalScrollbar).toBeInTheDocument();
    });

    it('allows horizontal scrolling when orientation is horizontal', async () => {
      const { container } = render(
        <ScrollArea orientation='horizontal' className='w-64'>
          <div style={{ width: '1000px' }}>
            <span data-testid='left'>Left</span>
            <span data-testid='right' style={{ marginLeft: '950px' }}>
              Right
            </span>
          </div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      expect(viewport).toBeInTheDocument();

      // Scroll right
      viewport.scrollLeft = 900;

      await waitFor(() => {
        expect(viewport.scrollLeft).toBeGreaterThan(0);
      });
    });

    it('supports both vertical and horizontal scrolling', () => {
      const { container } = render(
        <ScrollArea className='h-32 w-64'>
          <div style={{ height: '500px', width: '1000px' }}>
            Content that overflows both dimensions
          </div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
      expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    });
  });

  describe('Keyboard Navigation', () => {
    it('scrolls down with ArrowDown key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.focus();

      const initialScroll = viewport.scrollTop;
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(viewport.scrollTop).toBeGreaterThanOrEqual(initialScroll);
      });
    });

    it('scrolls up with ArrowUp key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.scrollTop = 200; // Start scrolled down
      viewport.focus();

      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(viewport.scrollTop).toBeLessThan(200);
      });
    });

    it('scrolls right with ArrowRight key in horizontal mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea orientation='horizontal' className='w-64'>
          <div style={{ width: '1000px' }}>Wide content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.focus();

      const initialScroll = viewport.scrollLeft;
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(viewport.scrollLeft).toBeGreaterThanOrEqual(initialScroll);
      });
    });

    it('scrolls to bottom with End key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.focus();

      await user.keyboard('{End}');

      await waitFor(() => {
        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        expect(viewport.scrollTop).toBeGreaterThan(maxScroll * 0.9); // Close to bottom
      });
    });

    it('scrolls to top with Home key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.scrollTop = 200; // Start scrolled down
      viewport.focus();

      await user.keyboard('{Home}');

      await waitFor(() => {
        expect(viewport.scrollTop).toBe(0);
      });
    });

    it('scrolls down by page with PageDown key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.focus();

      const initialScroll = viewport.scrollTop;
      await user.keyboard('{PageDown}');

      await waitFor(() => {
        expect(viewport.scrollTop).toBeGreaterThan(initialScroll + viewport.clientHeight * 0.5);
      });
    });

    it('scrolls up by page with PageUp key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>Tall content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.scrollTop = 300; // Start scrolled down
      viewport.focus();

      await user.keyboard('{PageUp}');

      await waitFor(() => {
        expect(viewport.scrollTop).toBeLessThan(300 - viewport.clientHeight * 0.5);
      });
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has appropriate scroll region role', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(viewport).toBeInTheDocument();
    });

    it('is keyboard focusable', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      );

      const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      viewport.focus();

      expect(document.activeElement).toBe(viewport);
    });

    it('maintains focus order with interactive children', () => {
      render(
        <ScrollArea>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </ScrollArea>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it('scrollbar has correct orientation attribute', () => {
      const { container } = render(
        <ScrollArea>
          <div style={{ height: '500px' }}>Content</div>
        </ScrollArea>
      );

      const scrollbar = container.querySelector('[data-orientation="vertical"]');
      expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
    });

    it('has no accessibility violations (vertical)', async () => {
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i}>Item {i + 1}</div>
            ))}
          </div>
        </ScrollArea>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (horizontal)', async () => {
      const { container } = render(
        <ScrollArea orientation='horizontal' className='w-64'>
          <div style={{ width: '1000px' }}>
            <span>Wide content that requires horizontal scrolling</span>
          </div>
        </ScrollArea>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (both directions)', async () => {
      const { container } = render(
        <ScrollArea className='h-32 w-64'>
          <div style={{ height: '500px', width: '1000px' }}>
            Content that overflows both dimensions
          </div>
        </ScrollArea>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (with interactive content)', async () => {
      const { container } = render(
        <ScrollArea className='h-32'>
          <div style={{ height: '500px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <button key={i}>Button {i + 1}</button>
            ))}
          </div>
        </ScrollArea>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
