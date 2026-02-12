# Terrafusion Multi-County Configuration System

## Overview
Terrafusion's county configuration system enables dynamic branding and feature customization for multiple county assessor offices. Each county maintains its own visual identity, contact information, and feature set while sharing the core Terrafusion platform.

## Current County Support

### Benton County, Washington
- **Primary Color**: #0f1c2e (Dark Teal)
- **Accent Color**: #00bcd4 (Cyan)
- **Contact**: (360) 679-7350
- **Email**: assessor@co.benton.wa.us
- **Features**: Full suite (exemptions, appeals, payments, documents)
- **Timezone**: America/Los_Angeles

### Escambia County, Florida
- **Primary Color**: #1e3a8a (Deep Blue)
- **Accent Color**: #fbbf24 (Golden Yellow)
- **Contact**: (850) 595-4910
- **Email**: assessor@myescambia.com
- **Features**: Core suite (exemptions, appeals, documents)
- **Timezone**: America/Chicago

## Implementation Architecture

### County Context Provider
The `useCounty` hook provides:
- Current county configuration
- Available counties list
- County switching functionality
- Dynamic theme application
- Error handling and loading states

### Dynamic Branding System
CSS variables are automatically updated when switching counties:
- `--county-primary`: Main background color
- `--county-secondary`: Secondary backgrounds
- `--county-accent`: Interactive elements
- `--county-background`: Page background

### County Selector Component
Interactive dropdown that enables:
- Visual county identification
- Contact information display
- Feature availability indicators
- Smooth transitions between configurations

## Configuration Structure

Each county configuration includes:

```typescript
interface CountyConfig {
  id: string;
  name: string;
  state: string;
  branding: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    logo?: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    website?: string;
  };
  features: {
    exemptions: boolean;
    appeals: boolean;
    payments: boolean;
    documents: boolean;
  };
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    taxYear: number;
  };
}
```

## Adding New Counties

### 1. Server Configuration
Add county data to the counties endpoint in `server/routes.ts`:

```javascript
{
  id: 'new_county',
  name: 'New County',
  state: 'State',
  branding: {
    primary: '#primary_color',
    secondary: '#secondary_color',
    accent: '#accent_color',
    background: '#background_color'
  },
  contact: {
    phone: '(xxx) xxx-xxxx',
    email: 'assessor@county.gov',
    address: 'County Address',
    website: 'https://county.gov'
  },
  features: {
    exemptions: true,
    appeals: true,
    payments: true,
    documents: true
  },
  settings: {
    timezone: 'America/Timezone',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    taxYear: 2024
  }
}
```

### 2. Database Migration
Add county record to the counties table:

```sql
INSERT INTO counties (id, name, state, status) 
VALUES ('new_county', 'New County', 'State', 'active');
```

### 3. Asset Management
Add county-specific assets:
- Logo: `/assets/new_county-logo.png`
- Favicon: `/assets/new_county-favicon.ico`

## County-Specific Features

### Feature Flags
Each county can enable/disable specific features:
- **Exemptions**: Tax exemption processing
- **Appeals**: Property value appeals system
- **Payments**: Online payment integration
- **Documents**: Document management system

### Timezone Handling
Automatic timezone conversion for:
- Property assessment dates
- Appeal deadlines
- Payment due dates
- System timestamps

### Contact Integration
County contact information appears in:
- Footer sections
- Help dialogs
- Error pages
- Support notifications

## Production Deployment

### Environment Variables
Set county-specific configurations:
```bash
DEFAULT_COUNTY=benton
COUNTY_SWITCHING_ENABLED=true
MULTI_TENANT_MODE=true
```

### Brand Asset Optimization
- Optimize logos for web (SVG preferred)
- Ensure proper color contrast ratios
- Test themes across all components
- Validate accessibility compliance

### Performance Considerations
- County configurations are cached client-side
- Theme changes apply instantly without page reload
- Minimal network requests for county switching
- Fallback to default configuration on errors

## Testing Multi-County Setup

### Functional Tests
1. Switch between counties using the selector
2. Verify color themes update immediately
3. Confirm contact information displays correctly
4. Test feature availability per county
5. Validate timezone handling

### Visual Tests
1. Check logo placement and sizing
2. Verify color contrast compliance
3. Test responsive design across breakpoints
4. Confirm accessibility standards
5. Validate print stylesheets

### Integration Tests
1. Test county data persistence
2. Verify API endpoint responses
3. Check error handling for missing counties
4. Test fallback mechanisms
5. Validate performance metrics

## Security Considerations

### Data Isolation
- County data remains logically separated
- User permissions respect county boundaries
- API access controlled by county context
- Audit logging includes county identification

### Cross-County Prevention
- Users cannot access other counties' data
- Session management respects county boundaries
- File uploads tagged with county context
- Export functions limited to county scope

## Maintenance Procedures

### Regular Updates
- Quarterly review of county contact information
- Annual validation of feature requirements
- Ongoing accessibility compliance checks
- Performance monitoring per county

### Emergency Procedures
- Fallback to default county configuration
- Emergency contact information updates
- System-wide messaging capabilities
- Rollback procedures for configuration changes

This multi-county system ensures Terrafusion can serve multiple jurisdictions while maintaining their unique identities and requirements.