import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';

interface AccessibilitySettings {highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusVisible: boolean;
  screenReaderAnnouncements: boolean;}

interface AccessibilityContextType {settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultSettings: AccessibilitySettings = {highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  focusVisible: true,
  screenReaderAnnouncements: true,};

export function AccessibilityProvider({children}: {children: React.ReactNode}) {const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage or use system preferences
    const saved = localStorage.getItem('terrafusion-accessibility');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved)};
      } catch {return defaultSettings;}
    }

    // Check system preferences
    const systemPreferences = {...defaultSettings,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,};

    return systemPreferences;
  });

  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {// Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'accessibility-announcer';
    document.body.appendChild(liveRegion);
    setAnnouncer(liveRegion);

    return () => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);}
    };
  }, []);

  useEffect(() => {// Apply accessibility classes to document
    const root = document.documentElement;

    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('focus-visible', settings.focusVisible);
    root.setAttribute('data-font-size', settings.fontSize);

    // Save to localStorage
    localStorage.setItem('terrafusion-accessibility', JSON.stringify(settings));}, [settings]);

  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) =>{setSettings(prev => ({ ...prev, ...updates}));
  }, []);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {if (!settings.screenReaderAnnouncements || !announcer) return;

      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';}, 1000);
    },
    [announcer, settings.screenReaderAnnouncements]
  );

  const value: AccessibilityContextType = {settings,
    updateSettings,
    announce,
    isHighContrast: settings.highContrast,
    isReducedMotion: settings.reducedMotion,};

  return<AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');}
  return context;
}

// Skip to content link component
export function SkipToContent() {return (
    <a
      href="#main-content"
      className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-terrafusion-cyan focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-white"
    >Skip to main content</a>);}

// Accessible heading component that maintains heading hierarchy
interface AccessibleHeadingProps {level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;}

export function AccessibleHeading({level, children, className = '', id}: AccessibleHeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (<Tag className={className} id={id}>{children}</Tag>
  );
}

// Focus trap component for modals and dialogs
export function FocusTrap({children, active}: {children: React.ReactNode; active: boolean}) {const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() =>{
    if (!active || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();}
        } else {if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();}
        }
      }

      if (e.key === 'Escape') {// Allow parent components to handle escape
        const escapeEvent = new CustomEvent('escape-focus-trap');
        trapRef.current?.dispatchEvent(escapeEvent);}
    };

    if (active) {firstElement?.focus();
      document.addEventListener('keydown', handleKeyDown);}

    return () => {document.removeEventListener('keydown', handleKeyDown);};
  }, [active]);

  if (!active) return<>{children}</>;

  return (
    <div ref={trapRef} className="focus-trap">{children}</div>
  );
}
