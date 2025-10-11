# TerraFusion UI Components API Documentation

## 🎯 Overview

The TerraFusion UI Components library provides a comprehensive set of accessible, performant, and beautifully designed React components built specifically for TerraFusion applications. All components follow the TerraFusion design system with official colors, glass morphism effects, and championship gradients.

## 📦 Installation & Setup

```bash
# Install the shared package
npm install @terrafusion/shared

# Import components in your application
import { Button, Card, Badge, Alert } from '@terrafusion/shared';
```

## 🧩 Component Reference

### Button Component

A comprehensive button component with multiple variants, states, and TerraFusion styling.

#### Props

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconAfter?: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  [key: string]: any; // Additional HTML button attributes
}
```

#### Usage Examples

```tsx
// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="primary" size="large">
  Primary Action
</Button>

// With loading state
<Button loading>
  Processing...
</Button>

// With icons
<Button 
  icon={<SearchIcon />} 
  iconAfter={<ArrowIcon />}
>
  Search Properties
</Button>

// Government module example
<Button 
  variant="success" 
  icon={<CheckIcon />}
  onClick={handleApproval}
>
  Approve Assessment
</Button>
```

#### Variants

- **primary** - Main action button with TerraFusion primary gradient
- **secondary** - Secondary actions with subtle styling  
- **success** - Positive actions (approvals, confirmations)
- **danger** - Destructive actions (deletions, rejections)
- **ghost** - Minimal styling for subtle actions
- **outline** - Outlined style for secondary prominence

#### Accessibility

- Full keyboard navigation support
- ARIA attributes for screen readers
- Focus management and visual indicators
- Loading state announcements

---

### Card Component Suite

A flexible container system for organizing content with TerraFusion styling.

#### Card Props

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // Additional HTML div attributes
}
```

#### CardHeader Props

```typescript
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}
```

#### CardBody Props

```typescript
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}
```

#### CardFooter Props

```typescript
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}
```

#### Usage Examples

```tsx
// Basic card
<Card>
  <CardBody>
    Simple card content
  </CardBody>
</Card>

// Complete card structure
<Card>
  <CardHeader>
    <h3>Property Assessment</h3>
    <Badge variant="info">Under Review</Badge>
  </CardHeader>
  <CardBody>
    <p>123 Main Street, Anytown USA</p>
    <p>Assessed Value: $245,000</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary" size="small">Edit</Button>
    <Button variant="ghost" size="small">View</Button>
  </CardFooter>
</Card>

// With TerraFusion effects
<Card className="transcend-glow">
  <CardHeader>
    <h3>Premium Content</h3>
  </CardHeader>
  <CardBody>
    Card with TerraFusion glow effect
  </CardBody>
</Card>
```

#### Design System Integration

- **transcend-glow** - Signature TerraFusion glow effect
- **glass-morphism** - Modern glass effect for overlays
- **tf-primary** - Primary color theme
- **hover:shadow-lg** - Interactive shadow effects

---

### Badge Component

Status indicators and labels with TerraFusion styling and multiple variants.

#### Props

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  [key: string]: any; // Additional HTML span attributes
}
```

#### Usage Examples

```tsx
// Basic badge
<Badge>Default</Badge>

// Status indicators
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>

// Different sizes
<Badge size="small">Small</Badge>
<Badge size="large">Large Status</Badge>

// Government module examples
<Badge variant="info">1,247 Properties</Badge>
<Badge variant="warning">5 Pending Appeals</Badge>
<Badge variant="success">ADA Compliant</Badge>
```

#### Variants

- **default** - Neutral gray styling
- **primary** - TerraFusion primary colors
- **secondary** - Subtle secondary styling
- **success** - Green for positive status
- **warning** - Orange/yellow for caution
- **danger** - Red for errors/critical
- **info** - Blue for informational
- **outline** - Bordered style

---

### Alert Component

Notification and alert messages with TerraFusion styling.

#### Props

```typescript
interface AlertProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  [key: string]: any;
}
```

#### Usage Examples

```tsx
// Basic alert
<Alert type="info">
  Information message
</Alert>

// Dismissible alert
<Alert 
  type="warning" 
  dismissible 
  onDismiss={handleDismiss}
>
  Warning: Assessment deadline approaching
</Alert>

// Government workflow alerts
<Alert type="success">
  Property assessment completed successfully
</Alert>

<Alert type="error">
  Failed to save permit application
</Alert>
```

## 🎨 TerraFusion Design System

### Colors

The components use the official TerraFusion color palette:

```css
/* Primary Colors */
--tf-primary: #667eea;
--tf-primary-dark: #5a67d8;
--tf-primary-light: #7c3aed;

/* Status Colors */
--tf-success: #48bb78;
--tf-warning: #ed8936;
--tf-danger: #f56565;
--tf-info: #4299e1;

/* Neutral Colors */
--tf-gray-50: #f7fafc;
--tf-gray-900: #1a202c;
```

### Effects

#### Transcend Glow
```css
.transcend-glow {
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.2);
}
```

#### Glass Morphism
```css
.glass-morphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## ♿ Accessibility

All TerraFusion components are built with accessibility in mind:

- **Keyboard Navigation** - Full support for keyboard-only users
- **Screen Readers** - Proper ARIA labels and descriptions
- **Focus Management** - Clear focus indicators and logical tab order
- **Color Contrast** - WCAG AA compliant color combinations
- **Semantic HTML** - Proper heading hierarchy and landmarks

## 🎯 Government Module Integration

### Property Assessment Example

```tsx
function PropertyAssessmentCard({ property }) {
  return (
    <Card className="transcend-glow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3>{property.address}</h3>
          <Badge 
            variant={property.status === 'completed' ? 'success' : 'warning'}
          >
            {property.status}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <p><strong>Parcel ID:</strong> {property.parcelId}</p>
        <p><strong>Assessed Value:</strong> ${property.assessedValue.toLocaleString()}</p>
        <p><strong>Owner:</strong> {property.owner}</p>
      </CardBody>
      <CardFooter>
        <Button 
          variant="primary" 
          size="small"
          icon={<AssessmentIcon />}
          onClick={() => startAssessment(property.id)}
        >
          Start Assessment
        </Button>
        <Button 
          variant="outline" 
          size="small"
          icon={<ViewIcon />}
          onClick={() => viewDetails(property.id)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Module Dashboard Example

```tsx
function ModuleDashboard({ modules }) {
  return (
    <div className="module-grid">
      {modules.map(module => (
        <Card key={module.id} className="hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="module-icon">{module.icon}</div>
              <div>
                <h3>{module.name}</h3>
                <Badge 
                  variant={module.status === 'running' ? 'success' : 'secondary'}
                  size="small"
                >
                  {module.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p>{module.description}</p>
            <div className="module-stats">
              <Badge variant="info" size="small">
                {module.activeUsers} users
              </Badge>
            </div>
          </CardBody>
          <CardFooter>
            <Button 
              variant="primary" 
              size="small"
              onClick={() => launchModule(module.id)}
            >
              Launch
            </Button>
            <Button 
              variant="ghost" 
              size="small"
              onClick={() => configureModule(module.id)}
            >
              Configure
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

## 🚀 Performance

### Optimization Features

- **Tree Shaking** - Import only the components you use
- **React.memo** - Optimized re-rendering
- **CSS-in-JS** - Scoped styles with optimal loading
- **TypeScript** - Compile-time optimization

### Bundle Size

| Component | Gzipped Size |
|-----------|--------------|
| Button    | 2.1 KB       |
| Card      | 1.8 KB       |
| Badge     | 1.2 KB       |
| Alert     | 1.5 KB       |

## 🔧 Development & Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Storybook Development

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

### Component Development Guidelines

1. **Follow TerraFusion design system** - Use official colors and effects
2. **Ensure accessibility** - Test with keyboard and screen readers
3. **Write comprehensive tests** - Cover all variants and states
4. **Document thoroughly** - Include usage examples and props
5. **Optimize performance** - Use React.memo and efficient renders

## 📚 Additional Resources

- [TerraFusion Design System](./design-system.md)
- [Component Testing Guide](./testing.md)
- [Government Module Integration](./government-modules.md)
- [Accessibility Guidelines](./accessibility.md)
- [Performance Best Practices](./performance.md)

---

**Built with ❤️ for TerraFusion - Transcending boundaries in government technology.**