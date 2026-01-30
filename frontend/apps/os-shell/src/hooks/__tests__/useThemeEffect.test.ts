import { renderHook } from '@testing-library/react';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeEffect } from '../useThemeEffect';

describe('useThemeEffect', () => {
  let originalMatchMedia: any;
  let mediaQueryList: any;

  beforeEach(() => {
    useThemeStore.getState().reset();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';

    // Mock matchMedia
    mediaQueryList = {
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue(mediaQueryList);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('applies dark theme', () => {
    useThemeStore.getState().setTheme('dark');
    renderHook(() => useThemeEffect());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light theme', () => {
    useThemeStore.getState().setTheme('light');
    renderHook(() => useThemeEffect());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies system theme (dark)', () => {
    mediaQueryList.matches = true; // prefers-color-scheme: dark
    useThemeStore.getState().setTheme('system');
    renderHook(() => useThemeEffect());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies high contrast', () => {
    useThemeStore.getState().toggleHighContrast();
    renderHook(() => useThemeEffect());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('applies font size', () => {
    useThemeStore.getState().setFontSize(150);
    renderHook(() => useThemeEffect());
    expect(document.documentElement.style.fontSize).toBe('150%');
  });
});
