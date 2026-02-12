# TerraFusion Navigation & Layout System

**Day 21 Component Library** - Complete Navigation Ecosystem with Property Assessment Integration

A comprehensive, zero-dependency navigation system built for React applications with a focus on property assessment workflows, data visualization integration, and accessibility compliance.

## 🎯 Overview

The Navigation & Layout System provides a complete set of navigation components designed for complex property assessment applications. Built with responsive design principles and WCAG 2.1 AA accessibility standards, it seamlessly integrates with all previous TerraFusion component systems (Days 6-20).

### Key Features

- **Comprehensive Navigation Components**: 8+ specialized navigation patterns
- **Property Assessment Workflows**: Custom navigation for appraisal processes
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility Compliant**: WCAG 2.1 AA standards with full keyboard navigation
- **Zero Dependencies**: Pure React implementation without external libraries
- **State Persistence**: Navigation state maintained across sessions
- **Integration Ready**: Works seamlessly with forms, charts, tables, and modals

## 📦 Components Included

### Core Navigation Components

1. **NavigationProvider**: Context provider for navigation state management
2. **Breadcrumb**: WCAG-compliant breadcrumb navigation with overflow handling
3. **NavigationMenu**: Multi-level menu system with horizontal/vertical variants
4. **Sidebar**: Collapsible sidebar with state persistence and mobile support
5. **TopNav**: Responsive top navigation bar with mobile menu
6. **MegaMenu**: Advanced dropdown with multi-column layouts
7. **NavigationTree**: Hierarchical tree navigation with expand/collapse
8. **MobileNav**: Full-screen mobile navigation overlay

### Layout Components

9. **Layout**: Comprehensive layout wrapper with configurable regions
10. **PropertyNav**: Specialized navigation for property assessment phases
11. **QuickAccessToolbar**: Floating action toolbar with tooltips

## 🚀 Quick Start

### Basic Setup

```tsx
import { 
  NavigationProvider, 
  TopNav, 
  Sidebar, 
  Breadcrumb,
  Layout 
} from './components/navigation';

function App() {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/dashboard' },
    { id: 'properties', label: 'Properties', icon: '🏘️', href: '/properties' },
    { id: 'assessments', label: 'Assessments', icon: '📊', href: '/assessments' },
  ];

  const layoutConfig = {
    header: { show: true, height: 64, sticky: true },
    sidebar: { show: true, width: 256, collapsible: true },
    footer: { show: true, height: 48 },
  };

  return (
    <NavigationProvider>
      <Layout
        config={layoutConfig}
        header={<TopNav items={navItems} brand="TerraFusion" />}
        sidebar={<Sidebar items={navItems} />}
      >
        <Breadcrumb />
        <YourMainContent />
      </Layout>
    </NavigationProvider>
  );
}
```

### Property Assessment Navigation

```tsx
import { PropertyNav, NavigationProvider } from './components/navigation';

function PropertyAssessment({ propertyId }) {
  const [currentPhase, setCurrentPhase] = useState('inspection');

  return (
    <NavigationProvider>
      <PropertyNav
        propertyId={propertyId}
        assessmentPhase={currentPhase}
        onPhaseChange={setCurrentPhase}
      />
      <PropertyAssessmentContent phase={currentPhase} />
    </NavigationProvider>
  );
}
```

## 🎛️ Component APIs

### NavigationProvider

Central state management for all navigation components.

```tsx
interface NavigationProviderProps {
  children: React.ReactNode;
  initialConfig?: NavigationConfig;
}

// Usage
<NavigationProvider initialConfig={{ variant: 'compact', persistState: true }}>
  {children}
</NavigationProvider>
```

### Breadcrumb Component

WCAG-compliant breadcrumb navigation with overflow handling.

```tsx
interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showRoot?: boolean;
  className?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
}

// Example with property assessment context
const breadcrumbs = [
  { id: 'home', label: 'Home', href: '/', icon: '🏠' },
  { id: 'properties', label: 'Properties', href: '/properties' },
  { id: 'property', label: '123 Main St', href: '/property/123' },
  { id: 'inspection', label: 'Inspection', isCurrentPage: true },
];

<Breadcrumb 
  items={breadcrumbs} 
  maxItems={4}
  separator="/"
  onItemClick={(item) => navigate(item.href)} 
/>
```

### NavigationMenu Component

Multi-level navigation menu with various display variants.

```tsx
interface NavigationMenuProps {
  items: NavigationItem[];
  variant?: 'horizontal' | 'vertical' | 'mega';
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
  maxDepth?: number;
}

// Nested navigation structure
const navigationItems = [
  {
    id: 'properties',
    label: 'Properties',
    icon: '🏘️',
    children: [
      { id: 'residential', label: 'Residential', href: '/properties/residential' },
      { id: 'commercial', label: 'Commercial', href: '/properties/commercial' },
      { 
        id: 'specialty', 
        label: 'Specialty Properties',
        children: [
          { id: 'industrial', label: 'Industrial', href: '/properties/industrial' },
          { id: 'agricultural', label: 'Agricultural', href: '/properties/agricultural' },
        ]
      }
    ]
  },
];

<NavigationMenu 
  items={navigationItems} 
  variant="horizontal"
  maxDepth={3}
/>
```

### Sidebar Component

Collapsible sidebar navigation with mobile support.

```tsx
interface SidebarProps {
  items: NavigationItem[];
  width?: number;
  collapsible?: boolean;
  position?: 'left' | 'right';
  overlay?: boolean;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: NavigationItem) => void;
}

// Property assessment sidebar
<Sidebar
  items={assessmentNavItems}
  width={280}
  collapsible={true}
  header={<div>Property Assessment</div>}
  footer={<UserProfile />}
  onItemClick={(item) => handleNavigation(item)}
/>
```

### TopNav Component

Responsive top navigation bar with brand, menu items, and actions.

```tsx
interface TopNavProps {
  brand?: React.ReactNode;
  items?: NavigationItem[];
  actions?: React.ReactNode;
  sticky?: boolean;
  height?: number;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

// Complete top navigation setup
<TopNav
  brand={<TerraFusionLogo />}
  items={mainNavItems}
  actions={
    <div className="flex items-center space-x-4">
      <NotificationBell />
      <UserMenu />
    </div>
  }
  sticky={true}
  height={64}
/>
```

### MegaMenu Component

Advanced dropdown menu with multi-column layouts and rich content.

```tsx
interface MegaMenuProps {
  trigger: React.ReactNode;
  sections: MegaMenuSection[];
  width?: number;
  columns?: number;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

// Property services mega menu
const propertyServicesSections = [
  {
    title: 'Assessment Services',
    items: [
      { id: 'residential-appraisal', label: 'Residential Appraisal', icon: '🏠' },
      { id: 'commercial-valuation', label: 'Commercial Valuation', icon: '🏢' },
      { id: 'land-assessment', label: 'Land Assessment', icon: '🌱' },
    ]
  },
  {
    title: 'Property Analysis',
    items: [
      { id: 'market-analysis', label: 'Market Analysis', icon: '📈' },
      { id: 'comparable-sales', label: 'Comparable Sales', icon: '📊' },
      { id: 'investment-analysis', label: 'Investment Analysis', icon: '💼' },
    ]
  }
];

<MegaMenu
  trigger={<Button>Property Services ▼</Button>}
  sections={propertyServicesSections}
  width={600}
  columns={2}
/>
```

## 📋 Integration Examples

### Integration with Forms (Day 6)

```tsx
import { FormProvider } from './form';
import { NavigationProvider, Breadcrumb } from './navigation';

function PropertyForm({ propertyId }) {
  const { setBreadcrumbs } = useNavigation();
  
  useEffect(() => {
    setBreadcrumbs([
      { id: 'properties', label: 'Properties', href: '/properties' },
      { id: 'edit', label: 'Edit Property', isCurrentPage: true }
    ]);
  }, []);

  return (
    <NavigationProvider>
      <FormProvider>
        <Breadcrumb />
        <PropertyEditForm propertyId={propertyId} />
      </FormProvider>
    </NavigationProvider>
  );
}
```

### Integration with Loading States (Day 15)

```tsx
import { LoadingSpinner } from './loading-states';
import { Sidebar } from './navigation';

function NavigationWithLoading({ items }) {
  const [loading, setLoading] = useState(true);
  
  return (
    <Sidebar
      items={items}
      header={
        loading ? (
          <LoadingSpinner size="sm" text="Loading navigation..." />
        ) : (
          <div>Navigation Ready</div>
        )
      }
    />
  );
}
```

### Integration with Notifications (Day 16)

```tsx
import { useNotification } from './notifications';
import { NavigationMenu } from './navigation';

function NotificationAwareNav() {
  const { showNotification } = useNotification();
  
  const handleNavClick = (item) => {
    showNotification({
      type: 'info',
      title: 'Navigation',
      message: `Navigating to ${item.label}`,
    });
  };

  return (
    <NavigationMenu
      items={navItems}
      onItemClick={handleNavClick}
    />
  );
}
```

### Integration with Modals (Day 17)

```tsx
import { Modal, ModalTrigger } from './modal';
import { QuickAccessToolbar } from './navigation';

function QuickActionsWithModals() {
  const quickActions = [
    {
      id: 'new-property',
      label: 'New Property',
      icon: '➕',
      onClick: () => openModal('new-property'),
    },
    {
      id: 'search',
      label: 'Search Properties',
      icon: '🔍',
      onClick: () => openModal('search'),
    },
  ];

  return (
    <>
      <QuickAccessToolbar items={quickActions} />
      <Modal id="new-property">
        <NewPropertyForm />
      </Modal>
    </>
  );
}
```

### Integration with Tabs (Day 18)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { NavigationTree } from './navigation';

function TabbedNavigation() {
  return (
    <Tabs defaultValue="properties">
      <TabsList>
        <TabsTrigger value="properties">Properties</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      
      <TabsContent value="properties">
        <NavigationTree items={propertyNavItems} />
      </TabsContent>
      
      <TabsContent value="assessments">
        <NavigationTree items={assessmentNavItems} />
      </TabsContent>
    </Tabs>
  );
}
```

### Integration with Tables (Day 19)

```tsx
import { DataTable } from './tables';
import { Breadcrumb, TopNav } from './navigation';

function PropertyTableView() {
  const tableActions = (
    <Button onClick={() => setShowFilters(!showFilters)}>
      Toggle Filters
    </Button>
  );

  return (
    <>
      <TopNav actions={tableActions} />
      <Breadcrumb />
      <DataTable
        data={properties}
        columns={propertyColumns}
        searchable
        sortable
        pagination
      />
    </>
  );
}
```

### Integration with Charts (Day 20)

```tsx
import { LineChart, BarChart } from './charts';
import { NavigationProvider, PropertyNav } from './navigation';

function PropertyAnalyticsDashboard({ propertyId }) {
  const [currentPhase, setCurrentPhase] = useState('analysis');

  return (
    <NavigationProvider>
      <PropertyNav
        propertyId={propertyId}
        assessmentPhase={currentPhase}
        onPhaseChange={setCurrentPhase}
      />
      
      {currentPhase === 'analysis' && (
        <div className="grid grid-cols-2 gap-6">
          <LineChart 
            data={marketTrendData}
            title="Market Trends"
          />
          <BarChart 
            data={comparableSalesData}
            title="Comparable Sales"
          />
        </div>
      )}
    </NavigationProvider>
  );
}
```

## 🎨 Styling & Customization

### CSS Classes

The navigation system uses a consistent class naming convention:

```css
/* Navigation Menu Styles */
.navigation-menu { /* Base menu container */ }
.navigation-menu-horizontal { /* Horizontal menu variant */ }
.navigation-menu-vertical { /* Vertical menu variant */ }
.navigation-item { /* Individual menu item */ }
.navigation-submenu { /* Submenu container */ }

/* Sidebar Styles */
.sidebar-item { /* Sidebar navigation item */ }
.depth-0, .depth-1, .depth-2 { /* Depth-based indentation */ }

/* Tree Navigation */
.navigation-tree { /* Tree container */ }
.tree-item { /* Tree node item */ }
.tree-children { /* Child nodes container */ }

/* Mobile Navigation */
.mobile-nav-item { /* Mobile menu item */ }

/* Layout System */
.layout-container { /* Main layout wrapper */ }
.header-container { /* Header region */ }
.sidebar-container { /* Sidebar region */ }
.content-container { /* Main content area */ }
.footer-container { /* Footer region */ }

/* Quick Access */
.quick-access-toolbar { /* Floating toolbar */ }
```

### Theme Customization

```tsx
// Custom theme configuration
const navigationTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    background: '#FFFFFF',
    hover: '#F3F4F6',
    active: '#EBF8FF',
    border: '#E5E7EB',
  },
  spacing: {
    item: '0.75rem',
    indent: '1.25rem',
    sidebar: '16rem',
  },
  fonts: {
    menu: '0.875rem',
    label: '0.75rem',
  },
};

// Apply theme through CSS variables or styled-components
```

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support with proper tab order
- **Screen Reader Support**: Comprehensive ARIA labels and roles
- **Focus Management**: Visible focus indicators and logical focus flow
- **Color Contrast**: Meets minimum contrast requirements
- **Responsive Design**: Works across all device sizes and orientations

### ARIA Implementation

```tsx
// Breadcrumb ARIA
<nav aria-label="Breadcrumb navigation">
  <ol role="list">
    <li>
      <a href="/properties" aria-current="page">Properties</a>
    </li>
  </ol>
</nav>

// Menu ARIA
<nav role="navigation" aria-label="Main navigation">
  <ul role="menubar">
    <li role="menuitem" aria-expanded="false">
      <a href="#" aria-haspopup="true">Properties</a>
    </li>
  </ul>
</nav>
```

### Keyboard Shortcuts

- **Tab/Shift+Tab**: Navigate between menu items
- **Enter/Space**: Activate menu items
- **Arrow Keys**: Navigate within menus and trees
- **Escape**: Close menus and overlays
- **Home/End**: Jump to first/last items

## 📱 Responsive Behavior

### Breakpoints

- **Mobile**: < 768px - Collapsed sidebar, mobile menu overlay
- **Tablet**: 768px - 1024px - Collapsible sidebar, condensed navigation
- **Desktop**: > 1024px - Full navigation with all features

### Mobile Optimizations

```tsx
// Responsive navigation setup
const isMobile = useMediaQuery('(max-width: 768px)');

<NavigationProvider initialConfig={{
  responsive: true,
  variant: isMobile ? 'minimal' : 'default',
  collapsible: true,
}}>
  {isMobile ? (
    <MobileNav items={navItems} />
  ) : (
    <NavigationMenu items={navItems} variant="horizontal" />
  )}
</NavigationProvider>
```

## 🔧 Advanced Configuration

### State Persistence

```tsx
// Enable navigation state persistence
<NavigationProvider initialConfig={{
  persistState: true,
  // States saved to localStorage:
  // - Expanded menu items
  // - Sidebar collapsed state
  // - Active navigation item
}}>
```

### Custom Navigation Hooks

```tsx
// Create custom navigation hooks
export const usePropertyNavigation = (propertyId: string) => {
  const { setBreadcrumbs, setActiveItem } = useNavigation();
  
  const navigateToProperty = useCallback((section: string) => {
    setBreadcrumbs([
      { id: 'properties', label: 'Properties', href: '/properties' },
      { id: 'property', label: `Property ${propertyId}`, href: `/property/${propertyId}` },
      { id: section, label: section, isCurrentPage: true },
    ]);
    setActiveItem(`property-${section}`);
  }, [propertyId, setBreadcrumbs, setActiveItem]);

  return { navigateToProperty };
};
```

## 🧪 Testing

### Component Testing Examples

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider, NavigationMenu } from './navigation';

describe('NavigationMenu', () => {
  const mockItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'properties', label: 'Properties', href: '/properties' },
  ];

  test('renders navigation items', () => {
    render(
      <NavigationProvider>
        <NavigationMenu items={mockItems} />
      </NavigationProvider>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  test('handles item clicks', () => {
    const onItemClick = jest.fn();
    
    render(
      <NavigationProvider>
        <NavigationMenu items={mockItems} onItemClick={onItemClick} />
      </NavigationProvider>
    );
    
    fireEvent.click(screen.getByText('Properties'));
    expect(onItemClick).toHaveBeenCalledWith(mockItems[1]);
  });
});
```

### Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('navigation is accessible', async () => {
  const { container } = render(
    <NavigationProvider>
      <NavigationMenu items={mockItems} />
    </NavigationProvider>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 📈 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Large navigation trees can be lazy-loaded
2. **Memoization**: Menu items are memoized to prevent unnecessary re-renders
3. **Virtual Scrolling**: For large navigation lists (1000+ items)
4. **State Batching**: Navigation state updates are batched for performance

```tsx
// Optimized navigation for large datasets
const OptimizedNavigation = React.memo(({ items }) => {
  const memoizedItems = useMemo(() => 
    items.map(item => ({ ...item, children: item.children?.slice(0, 50) })),
    [items]
  );

  return <NavigationTree items={memoizedItems} />;
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Navigation state not persisting**: Ensure `persistState: true` in config
2. **Mobile menu not closing**: Check if `onItemClick` calls navigation close
3. **Keyboard navigation not working**: Verify proper ARIA attributes and focus management
4. **Styles not applying**: Check CSS class naming and import order

### Debug Mode

```tsx
// Enable debug mode for development
<NavigationProvider initialConfig={{ debug: true }}>
  {/* Navigation state changes will be logged to console */}
</NavigationProvider>
```

## 📊 Component Metrics

- **Total Lines of Code**: ~1,800 lines
- **Components Included**: 11 navigation components
- **TypeScript Interfaces**: 15+ strongly typed interfaces
- **Accessibility Features**: 20+ WCAG compliance features
- **Integration Points**: 7 component system integrations
- **Test Coverage**: 95%+ coverage target

## 🎯 Property Assessment Integration

### Assessment Phase Navigation

The `PropertyNav` component provides specialized navigation for property assessment workflows:

```tsx
// Complete assessment workflow
const assessmentPhases = [
  { id: 'inspection', label: 'Property Inspection', icon: '🏠' },
  { id: 'analysis', label: 'Data Analysis', icon: '📊' },
  { id: 'valuation', label: 'Valuation', icon: '💰' },
  { id: 'report', label: 'Report Generation', icon: '📄' },
];

<PropertyNav
  propertyId="123"
  assessmentPhase="analysis"
  onPhaseChange={(phase) => {
    // Handle phase transitions
    // Integrate with forms, charts, tables
    handlePhaseChange(phase);
  }}
/>
```

### Workflow Integration

The navigation system integrates seamlessly with property assessment workflows:

- **Form Integration**: Dynamic breadcrumbs update as forms are completed
- **Chart Integration**: Navigation controls data visualization views
- **Table Integration**: Navigation filters and sorts property data
- **Modal Integration**: Quick actions open assessment dialogs

---

## 🎉 Integration Summary

This Navigation & Layout System represents Day 21 of the TerraFusion component library, providing comprehensive navigation solutions that integrate seamlessly with all previous component systems:

- **Days 1-5**: Foundation components (buttons, inputs, cards)
- **Day 6**: Form system integration with navigation breadcrumbs
- **Days 7-14**: Advanced UI components with navigation context
- **Day 15**: Loading states integrated in navigation components
- **Day 16**: Notifications triggered by navigation actions
- **Day 17**: Modal dialogs opened from navigation quick actions
- **Day 18**: Tabbed navigation interfaces
- **Day 19**: Table views with navigation breadcrumbs
- **Day 20**: Chart dashboards with navigation controls
- **Day 21**: Complete navigation ecosystem (current)

The system is production-ready with comprehensive TypeScript support, accessibility compliance, and extensive integration capabilities for property assessment applications.