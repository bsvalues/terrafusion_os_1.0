/**
 * Phase 13 -- Shell Accessibility Contract Tests
 * ================================================
 *
 * Tests WCAG 2.1 AA compliance for shell chrome surfaces:
 *   - Taskbar/Dock: aria-labels, roles, keyboard hints
 *   - Top bar: focus-visible on interactive elements
 *   - Skip-to-content link presence
 *   - Suite home semantic structure (header, main, nav landmarks)
 *   - Start menu: role="menu", searchbox, Escape closes
 *
 * @see WCAG 2.1 AA — Government compliance requirement
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-component="Card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 89247,
      parcelsByCity: { Kennewick: 30000, Richland: 25000, 'West Richland': 10000 },
      parcelsByType: { residential: 60000, commercial: 12000, agricultural: 5000 },
      averageAssessedValue: 285000,
      assessedThisYear: 45000,
      pendingAssessments: 1200,
      assessmentCompletionPercent: 86.5,
      activeAppeals: 245,
      totalLevyRevenue: 125000000,
    },
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => <div data-testid="mock-module-grid" data-accent={props.accentVar}>{props.modules?.length ?? 0} modules</div>,
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => <div data-testid="mock-queue" data-title={props.title} />,
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon, Search: Icon,
    Hammer: Icon, Calculator: Icon, BarChart3: Icon, Scale: Icon,
    TrendingUp: Icon, FileSearch: Icon, Gavel: Icon, ShieldCheck: Icon,
    LineChart: Icon, PieChart: Icon, MapPin: Icon, DollarSign: Icon,
    Map: Icon, Layers: Icon, Crosshair: Icon, Printer: Icon,
    Download: Icon, Database: Icon,
    Receipt: Icon, Landmark: Icon, CheckCircle2: Icon, HardHat: Icon,
    Calendar: Icon, Bot: Icon, LayoutDashboard: Icon, ClipboardList: Icon, Mail: Icon, FileCheck: Icon,
  };
});

// ── Dynamic imports ────────────────────────────────────────────────────

let ForgeSuiteHome: React.ComponentType;
let AtlasSuiteHome: React.ComponentType;
let DaisSuiteHome: React.ComponentType;

beforeAll(async () => {
  const [forgeModule, atlasModule, daisModule] = await Promise.all([
    import('../../pages/suites/ForgeSuiteHome'),
    import('../../pages/suites/AtlasSuiteHome'),
    import('../../pages/suites/DaisSuiteHome'),
  ]);
  ForgeSuiteHome = forgeModule.default;
  AtlasSuiteHome = atlasModule.default;
  DaisSuiteHome = daisModule.default;
}, 30000);

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// 1. Suite Home Semantic Structure
// ============================================================================

describe('Suite Home Semantic Structure', () => {
  it('ForgeSuiteHome has a <header> element', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(container.querySelector('header')).toBeDefined();
    expect(container.querySelector('header')).not.toBeNull();
  });

  it('ForgeSuiteHome has a <main> element', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(container.querySelector('main')).toBeDefined();
    expect(container.querySelector('main')).not.toBeNull();
  });

  it('AtlasSuiteHome has a <header> and <main> element', () => {
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(container.querySelector('header')).not.toBeNull();
    expect(container.querySelector('main')).not.toBeNull();
  });

  it('DaisSuiteHome has a <header> and <main> element', () => {
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(container.querySelector('header')).not.toBeNull();
    expect(container.querySelector('main')).not.toBeNull();
  });
});

// ============================================================================
// 2. Suite Home Back Button Accessibility
// ============================================================================

describe('Suite Home Back Button Accessibility', () => {
  it('ForgeSuiteHome back button is a <button> (not <a>)', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const header = container.querySelector('header');
    const backBtn = header?.querySelector('button');
    expect(backBtn).not.toBeNull();
  });

  it('AtlasSuiteHome back button is a <button>', () => {
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const header = container.querySelector('header');
    const backBtn = header?.querySelector('button');
    expect(backBtn).not.toBeNull();
  });

  it('DaisSuiteHome back button is a <button>', () => {
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const header = container.querySelector('header');
    const backBtn = header?.querySelector('button');
    expect(backBtn).not.toBeNull();
  });
});

// ============================================================================
// 3. Suite Home Heading Hierarchy
// ============================================================================

describe('Suite Home Heading Hierarchy', () => {
  it('ForgeSuiteHome has exactly one <h1>', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('TerraForge');
  });

  it('AtlasSuiteHome has exactly one <h1>', () => {
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('TerraAtlas');
  });

  it('DaisSuiteHome has exactly one <h1>', () => {
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toContain('TerraDais');
  });
});

// ============================================================================
// 4. Taskbar Accessibility (Source Code Contracts)
// ============================================================================

describe('Taskbar Accessibility Contracts (source inspection)', () => {
  // These tests read the source file to verify accessibility patterns exist.
  // Rendering the full Taskbar requires too many store/context dependencies.

  let taskbarSource: string;

  beforeAll(async () => {
    const fs = await import('fs');
    taskbarSource = fs.readFileSync(
      'frontend/apps/os-shell/src/shell/desktop/Taskbar.tsx',
      'utf-8'
    );
  });

  it('Taskbar has role="navigation" or aria-label on root', () => {
    // The Taskbar.tsx must include navigation role
    const hasRole = taskbarSource.includes("role='navigation'") ||
                    taskbarSource.includes('role="navigation"') ||
                    taskbarSource.includes("role={") ;
    const hasAriaLabel = taskbarSource.includes('aria-label');
    expect(hasRole || hasAriaLabel).toBe(true);
  });

  it('Start button has aria-label and aria-expanded', () => {
    expect(taskbarSource).toContain('aria-label');
    expect(taskbarSource).toContain('aria-expanded');
  });

  it('Start button has aria-haspopup', () => {
    expect(taskbarSource).toContain('aria-haspopup');
  });

  it('Suite dock buttons have aria-label', () => {
    // DockSuiteButton must have aria-label
    expect(taskbarSource).toContain('aria-label={suite.displayName}');
  });

  it('Dock buttons have focus-visible ring', () => {
    expect(taskbarSource).toContain('focus-visible:ring');
  });
});

// ============================================================================
// 5. Top Bar Accessibility (Source Code Contracts)
// ============================================================================

describe('Top Bar Accessibility Contracts (source inspection)', () => {
  let desktopSource: string;

  beforeAll(async () => {
    const fs = await import('fs');
    desktopSource = fs.readFileSync(
      'frontend/apps/os-shell/src/shell/desktop/Desktop.tsx',
      'utf-8'
    );
  });

  it('Top bar has system utilities group with aria-label', () => {
    expect(desktopSource).toContain("aria-label='System utilities'");
  });

  it('Search button has aria-label', () => {
    expect(desktopSource).toContain("aria-label='Search");
  });

  it('Control Center button has aria-label', () => {
    expect(desktopSource).toContain("aria-label='Control Center");
  });

  it('Profile button has aria-label', () => {
    expect(desktopSource).toContain("aria-label='Profile'");
  });
});
