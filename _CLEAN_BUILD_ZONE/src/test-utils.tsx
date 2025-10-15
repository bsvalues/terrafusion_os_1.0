// Test utilities for consistent testing across the application
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add provider options here as needed
  // Example: initialState?: Partial<RootState>
}

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test-utils';
 * 
 * test('renders button', () => {
 *   const { getByRole } = renderWithProviders(<Button>Click me</Button>);
 *   expect(getByRole('button')).toHaveTextContent('Click me');
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  // Wrapper component with all necessary providers
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <>
        {/* Add providers here as needed */}
        {/* Example: <ThemeProvider> */}
        {/* Example: <QueryClientProvider> */}
        {/* Example: <Router> */}
        {children}
      </>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Wait for an element to be removed from the DOM
 * Useful for testing loading states and transitions
 */
export { waitForElementToBeRemoved } from '@testing-library/react';

/**
 * Custom matchers and utilities
 */

// Helper to create mock functions with TypeScript support
export function createMockFn<T extends (...args: any[]) => any>(): jest.MockedFunction<T> {
  return jest.fn() as jest.MockedFunction<T>;
}

// Helper to wait for a specific amount of time
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get computed styles of an element
export function getComputedStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

// Helper to simulate keyboard events
export async function pressKey(key: string) {
  const userEvent = (await import('@testing-library/user-event')).default;
  return userEvent.keyboard(`{${key}}`);
}

// Helper to check if element has specific class
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}
