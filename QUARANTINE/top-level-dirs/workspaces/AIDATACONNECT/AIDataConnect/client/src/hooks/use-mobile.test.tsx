import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile Hook', () => {
  // Store the original window.matchMedia
  const originalMatchMedia = window.matchMedia;
  
  beforeEach(() => {
    // Cleanup between tests
    vi.resetAllMocks();
    
    // Mock window.matchMedia
    window.matchMedia = vi.fn();
  });
  
  afterAll(() => {
    // Restore original window.matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it('should return true for mobile screen width', () => {
    // Mock matchMedia to simulate a mobile screen width
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
  });

  it('should return false for desktop screen width', () => {
    // Mock matchMedia to simulate a desktop screen width
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // Doesn't match mobile media query
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
  });

  it('should update value when screen width changes', () => {
    // Start with desktop width
    let mediaQueryList = {
      matches: false,
      media: '(max-width: 768px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    
    window.matchMedia = vi.fn().mockImplementation(() => mediaQueryList);
    
    // Capture the event listener
    let eventListener: (e: MediaQueryListEvent) => void;
    mediaQueryList.addEventListener = vi.fn().mockImplementation((event, listener) => {
      if (event === 'change') {
        eventListener = listener;
      }
    });
    
    const { result } = renderHook(() => useIsMobile());
    
    // Initial value should be false (desktop)
    expect(result.current).toBe(false);
    
    // Simulate screen resize to mobile width
    act(() => {
      eventListener({ matches: true } as MediaQueryListEvent);
    });
    
    // Value should update to true (mobile)
    expect(result.current).toBe(true);
    
    // Simulate screen resize back to desktop width
    act(() => {
      eventListener({ matches: false } as MediaQueryListEvent);
    });
    
    // Value should update back to false (desktop)
    expect(result.current).toBe(false);
  });

  it('should clean up event listener on unmount', () => {
    // Mock matchMedia
    const removeEventListener = vi.fn();
    const addEventListener = vi.fn();
    
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '(max-width: 768px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(),
    }));
    
    const { unmount } = renderHook(() => useIsMobile());
    
    // Check addEventListener was called
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    // Unmount the hook
    unmount();
    
    // Check removeEventListener was called with the same event name
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});