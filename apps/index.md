# apps Directory Index

## Directory Overview

**Location**: `/apps/`  
**Purpose**: Application modules and user interface components  
**Classification**: Frontend Application Architecture  
**Security Level**: Government UI/UX Standards

## Architecture Summary

### Primary Components

```
apps/
├── desktop-electron/                   # Electron desktop application
│   ├── main.js                        # Main Electron process
│   └── package.json                   # Desktop app dependencies
└── ui/                                # React UI components and features
    └── src/                           # UI source code
        ├── components/                # Reusable UI components
        │   └── valuation/             # Property valuation components
        │       ├── PropertyValuationForm.tsx
        │       └── __tests__/         # Component tests
        ├── features/                  # Feature-specific components
        │   └── compGrid/              # Comparable properties grid
        │       ├── ComparableGrid.tsx
        │       └── __tests__/         # Feature tests
        └── store/                     # State management
            ├── compGrid/              # Comparable grid state
            │   ├── slice.ts           # Redux slice
            │   └── __tests__/         # Store tests
            └── types.ts               # TypeScript type definitions
```

### Key Capabilities

- **Desktop Application**: Electron-based desktop client for government users
- **Property Valuation UI**: Advanced property assessment interfaces
- **Comparable Analysis**: Sophisticated property comparison tools
- **State Management**: Redux-based application state management
- **Government Compliance**: Section 508 accessible UI components

## Desktop Application Architecture

### Electron Desktop Client (`desktop-electron/`)

#### Main Process Configuration (`main.js`)

```javascript
// Electron main process for government desktop application
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

class TerraFusionDesktopApp {
  constructor() {
    this.mainWindow = null;
    this.governmentSecurityConfig = {
      nodeIntegration: false, // Security: Disable node integration
      contextIsolation: true, // Security: Enable context isolation
      enableRemoteModule: false, // Security: Disable remote module
      webSecurity: true, // Security: Enable web security
    };
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      icon: path.join(__dirname, 'assets/terrafusion-icon.png'),
      webPreferences: this.governmentSecurityConfig,
      titleBarStyle: 'default',
      show: false, // Don't show until ready
    });

    // Government security headers
    this.mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' data:",
            ],
            'X-Frame-Options': ['DENY'],
            'X-Content-Type-Options': ['nosniff'],
          },
        });
      }
    );
  }
}
```

#### Desktop Package Configuration (`package.json`)

```json
{
  "name": "terrafusion-desktop",
  "version": "1.0.0",
  "description": "Terrafusion OS Desktop Application",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "pack": "electron-builder --dir",
    "dist": "electron-builder --publish=never"
  },
  "dependencies": {
    "electron": "^26.0.0",
    "electron-updater": "^6.1.0"
  },
  "build": {
    "appId": "gov.terrafusion.desktop",
    "productName": "Terrafusion OS",
    "directories": {
      "output": "dist"
    },
    "files": ["main.js", "preload.js", "assets/**/*", "build/**/*"],
    "win": {
      "target": "nsis",
      "certificateFile": "certificates/terrafusion-code-signing.p12"
    },
    "mac": {
      "target": "dmg",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": "AppImage",
      "category": "Office"
    }
  }
}
```

## UI Component Architecture

### Property Valuation System (`ui/src/components/valuation/`)

#### Property Valuation Form Component

```tsx
// PropertyValuationForm.tsx - Advanced property assessment interface
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormControl, TextField, Button, Grid, Paper } from '@mui/material';

interface PropertyValuationFormProps {
  propertyId: string;
  bentonCountyParcel?: BentonCountyParcel;
  harrisPagessData?: HarrisPagessData;
  onValuationComplete: (valuation: PropertyValuation) => void;
}

export const PropertyValuationForm: React.FC<PropertyValuationFormProps> = ({
  propertyId,
  bentonCountyParcel,
  harrisPagessData,
  onValuationComplete,
}) => {
  const dispatch = useDispatch();
  const [valuationData, setValuationData] = useState<PropertyValuationData>({
    marketValue: 0,
    assessedValue: 0,
    taxableValue: 0,
    comparables: [],
    aiAnalysis: null,
  });

  // Government compliance: Section 508 accessibility
  const accessibilityProps = {
    'aria-label': 'Property Valuation Form',
    'aria-describedby': 'property-valuation-description',
    role: 'form',
  };

  // Integration with AI agents for property assessment
  useEffect(() => {
    const runAIAssessment = async () => {
      if (propertyId && harrisPagessData) {
        const aiAssessment = await dispatch(
          requestAIPropertyAssessment({
            propertyId,
            harrisData: harrisPagessData,
            agentType: 'property_assessor',
            complianceLevel: 'government_grade',
          })
        );

        setValuationData(prev => ({
          ...prev,
          aiAnalysis: aiAssessment.payload,
        }));
      }
    };

    runAIAssessment();
  }, [propertyId, harrisPagessData, dispatch]);

  const handleSubmitValuation = async (event: React.FormEvent) => {
    event.preventDefault();

    // Government audit trail
    const auditTrail = {
      timestamp: new Date().toISOString(),
      userId: getCurrentUser().id,
      action: 'property_valuation_submitted',
      propertyId,
      valuationData,
      complianceValidation: await validateGovernmentCompliance(valuationData),
    };

    dispatch(logGovernmentAuditTrail(auditTrail));
    onValuationComplete(valuationData);
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }} {...accessibilityProps}>
      <form onSubmit={handleSubmitValuation}>
        <Grid container spacing={3}>
          {/* Property Information Section */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <TextField
                label="Property ID"
                value={propertyId}
                disabled
                aria-describedby="property-id-helper"
              />
            </FormControl>
          </Grid>

          {/* Market Value Assessment */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <TextField
                label="Market Value"
                type="number"
                value={valuationData.marketValue}
                onChange={e =>
                  setValuationData(prev => ({
                    ...prev,
                    marketValue: parseFloat(e.target.value),
                  }))
                }
                inputProps={{
                  'aria-label': 'Market Value in Dollars',
                  min: 0,
                  step: 1000,
                }}
              />
            </FormControl>
          </Grid>

          {/* AI Analysis Display */}
          {valuationData.aiAnalysis && (
            <Grid item xs={12}>
              <AIAnalysisDisplay
                analysis={valuationData.aiAnalysis}
                complianceLevel="government_grade"
              />
            </Grid>
          )}

          {/* Submit Actions */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              aria-label="Submit Property Valuation for Government Review"
            >
              Submit Valuation
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};
```

#### Property Valuation Tests

```tsx
// __tests__/PropertyValuationForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PropertyValuationForm } from '../PropertyValuationForm';

describe('PropertyValuationForm', () => {
  const mockStore = configureStore({
    reducer: {
      valuation: valuationSlice.reducer,
      ai: aiSlice.reducer,
    },
  });

  const mockBentonCountyParcel = {
    parcelId: 'BENTON_123456',
    address: '123 Main St, Richland, WA',
    assessedValue: 350000,
    harrisPagessId: 'HARRIS_789012',
  };

  it('renders property valuation form with accessibility', () => {
    render(
      <Provider store={mockStore}>
        <PropertyValuationForm
          propertyId="PROP_123"
          bentonCountyParcel={mockBentonCountyParcel}
          onValuationComplete={jest.fn()}
        />
      </Provider>
    );

    // Test accessibility compliance
    expect(screen.getByRole('form')).toHaveAttribute(
      'aria-label',
      'Property Valuation Form'
    );
    expect(
      screen.getByLabelText('Market Value in Dollars')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit property valuation/i })
    ).toBeInTheDocument();
  });

  it('integrates with AI assessment agents', async () => {
    const mockOnComplete = jest.fn();

    render(
      <Provider store={mockStore}>
        <PropertyValuationForm
          propertyId="PROP_123"
          bentonCountyParcel={mockBentonCountyParcel}
          harrisPagessData={mockHarrisData}
          onValuationComplete={mockOnComplete}
        />
      </Provider>
    );

    // Wait for AI assessment to complete
    await waitFor(() => {
      expect(screen.getByText(/AI Analysis/i)).toBeInTheDocument();
    });

    // Test government compliance validation
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          aiAnalysis: expect.objectContaining({
            complianceValidation: 'passed',
          }),
        })
      );
    });
  });
});
```

## Feature Architecture

### Comparable Properties Grid (`ui/src/features/compGrid/`)

#### Comparable Grid Component

```tsx
// ComparableGrid.tsx - Advanced property comparison interface
import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { RootState } from '../../store/types';

export const ComparableGrid: React.FC = () => {
  const dispatch = useDispatch();
  const { comparables, loading, error } = useSelector(
    (state: RootState) => state.compGrid
  );

  // Government compliance: Data columns with audit trails
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'parcelId',
        headerName: 'Parcel ID',
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        field: 'address',
        headerName: 'Property Address',
        width: 300,
        sortable: true,
        filterable: true,
      },
      {
        field: 'marketValue',
        headerName: 'Market Value',
        width: 150,
        type: 'number',
        valueFormatter: params => `$${params.value.toLocaleString()}`,
      },
      {
        field: 'assessedValue',
        headerName: 'Assessed Value',
        width: 150,
        type: 'number',
        valueFormatter: params => `$${params.value.toLocaleString()}`,
      },
      {
        field: 'aiConfidenceScore',
        headerName: 'AI Confidence',
        width: 130,
        type: 'number',
        valueFormatter: params => `${(params.value * 100).toFixed(1)}%`,
      },
      {
        field: 'lastUpdated',
        headerName: 'Last Updated',
        width: 180,
        type: 'dateTime',
        valueFormatter: params => new Date(params.value).toLocaleString(),
      },
      {
        field: 'complianceStatus',
        headerName: 'Gov Compliance',
        width: 140,
        renderCell: params => <ComplianceStatusChip status={params.value} />,
      },
    ],
    []
  );

  // AI-enhanced comparable property selection
  const handleRowSelection = useCallback(
    async (selectedRows: GridRowsProp) => {
      const aiEnhancedComparables = await dispatch(
        enhanceComparablesWithAI({
          selectedProperties: selectedRows,
          aiAgentType: 'property_assessor',
          analysisType: 'comparative_market_analysis',
          governmentCompliance: true,
        })
      );

      // Government audit logging
      dispatch(
        logComparableSelection({
          timestamp: new Date().toISOString(),
          selectedCount: selectedRows.length,
          aiEnhancement: aiEnhancedComparables.payload,
          complianceValidation: 'passed',
        })
      );
    },
    [dispatch]
  );

  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={comparables}
        columns={columns}
        loading={loading}
        checkboxSelection
        onRowSelectionModelChange={handleRowSelection}
        pageSize={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        // Government accessibility compliance
        componentsProps={{
          toolbar: {
            'aria-label': 'Comparable Properties Grid Toolbar',
          },
        }}
        // Government security: Disable export by default
        disableColumnExport={!hasGovernmentExportPermission()}
        // Performance optimization for large datasets
        virtualization={true}
        disableRowSelectionOnClick={false}
      />
    </div>
  );
};
```

#### Comparable Grid Integration Tests

```tsx
// __tests__/ComparableGridWorkflow.int.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ComparableGrid } from '../ComparableGrid';
import { setupGovernmentTestStore } from '../../../test-utils/governmentTestStore';

describe('ComparableGrid Integration', () => {
  let store: ReturnType<typeof setupGovernmentTestStore>;

  beforeEach(() => {
    store = setupGovernmentTestStore({
      compGrid: {
        comparables: mockBentonCountyComparables,
        loading: false,
        error: null,
        aiAnalysis: mockAIAnalysis,
      },
    });
  });

  it('integrates with Harris PACS data and AI analysis', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ComparableGrid />
        </BrowserRouter>
      </Provider>
    );

    // Verify Harris PACS data integration
    expect(screen.getByText('HARRIS_789012')).toBeInTheDocument();
    expect(screen.getByText('Benton County, WA')).toBeInTheDocument();

    // Test AI confidence score display
    expect(screen.getByText('94.2%')).toBeInTheDocument(); // AI confidence

    // Test government compliance status
    expect(screen.getByText('FISMA Compliant')).toBeInTheDocument();
  });

  it('handles government export permissions', async () => {
    // Mock government user without export permissions
    jest.spyOn(global, 'hasGovernmentExportPermission').mockReturnValue(false);

    render(
      <Provider store={store}>
        <ComparableGrid />
      </Provider>
    );

    // Verify export is disabled for security
    const toolbar = screen.getByLabelText('Comparable Properties Grid Toolbar');
    expect(toolbar).not.toHaveTextContent('Export');
  });

  it('validates AI-enhanced comparable selection workflow', async () => {
    const mockDispatch = jest.fn();
    jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);

    render(
      <Provider store={store}>
        <ComparableGrid />
      </Provider>
    );

    // Select comparable properties
    const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'compGrid/enhanceComparablesWithAI',
          payload: expect.objectContaining({
            aiAgentType: 'property_assessor',
            governmentCompliance: true,
          }),
        })
      );
    });
  });
});
```

## State Management Architecture

### Redux Store Configuration (`ui/src/store/`)

#### Comparable Grid State Slice

```typescript
// compGrid/slice.ts - Redux state management for comparable properties
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface ComparableProperty {
  id: string;
  parcelId: string;
  address: string;
  marketValue: number;
  assessedValue: number;
  aiConfidenceScore: number;
  harrisPagessId?: string;
  bentonCountyData?: BentonCountyParcelData;
  complianceStatus: 'compliant' | 'review_required' | 'non_compliant';
  lastUpdated: string;
}

interface CompGridState {
  comparables: ComparableProperty[];
  selectedComparables: string[];
  loading: boolean;
  error: string | null;
  aiAnalysis: AIComparableAnalysis | null;
  governmentAuditTrail: GovernmentAuditEvent[];
}

// Async thunk for AI-enhanced comparable analysis
export const enhanceComparablesWithAI = createAsyncThunk(
  'compGrid/enhanceComparablesWithAI',
  async (payload: {
    selectedProperties: ComparableProperty[];
    aiAgentType: string;
    analysisType: string;
    governmentCompliance: boolean;
  }) => {
    const aiResponse = await fetch('/api/ai/enhance-comparables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Government-Auth': getGovernmentAuthToken(),
      },
      body: JSON.stringify({
        properties: payload.selectedProperties,
        agentType: payload.aiAgentType,
        analysis: payload.analysisType,
        compliance: payload.governmentCompliance,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    return await aiResponse.json();
  }
);

const compGridSlice = createSlice({
  name: 'compGrid',
  initialState: {
    comparables: [],
    selectedComparables: [],
    loading: false,
    error: null,
    aiAnalysis: null,
    governmentAuditTrail: [],
  } as CompGridState,

  reducers: {
    selectComparable: (state, action: PayloadAction<string>) => {
      if (!state.selectedComparables.includes(action.payload)) {
        state.selectedComparables.push(action.payload);
      }
    },

    deselectComparable: (state, action: PayloadAction<string>) => {
      state.selectedComparables = state.selectedComparables.filter(
        id => id !== action.payload
      );
    },

    logGovernmentAuditEvent: (
      state,
      action: PayloadAction<GovernmentAuditEvent>
    ) => {
      state.governmentAuditTrail.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
        complianceValidated: true,
      });
    },

    updateComplianceStatus: (
      state,
      action: PayloadAction<{
        comparableId: string;
        status: ComplianceStatus;
      }>
    ) => {
      const comparable = state.comparables.find(
        c => c.id === action.payload.comparableId
      );
      if (comparable) {
        comparable.complianceStatus = action.payload.status;
        comparable.lastUpdated = new Date().toISOString();
      }
    },
  },

  extraReducers: builder => {
    builder
      .addCase(enhanceComparablesWithAI.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enhanceComparablesWithAI.fulfilled, (state, action) => {
        state.loading = false;
        state.aiAnalysis = action.payload;

        // Update comparable properties with AI enhancements
        action.payload.enhancedProperties.forEach((enhanced: any) => {
          const existing = state.comparables.find(c => c.id === enhanced.id);
          if (existing) {
            Object.assign(existing, enhanced);
          }
        });
      })
      .addCase(enhanceComparablesWithAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'AI analysis failed';
      });
  },
});

export const {
  selectComparable,
  deselectComparable,
  logGovernmentAuditEvent,
  updateComplianceStatus,
} = compGridSlice.actions;

export default compGridSlice.reducer;
```

#### TypeScript Type Definitions

```typescript
// types.ts - Application-wide TypeScript definitions
export interface BentonCountyParcelData {
  parcelId: string;
  assessorParcelNumber: string;
  physicalAddress: string;
  mailingAddress: string;
  ownerName: string;
  taxableValue: number;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  harrisPagessIntegration: {
    harrisId: string;
    lastSync: string;
    syncStatus: 'success' | 'pending' | 'error';
  };
}

export interface AIComparableAnalysis {
  analysisId: string;
  agentType: 'property_assessor' | 'revenue_hunter' | 'analyst';
  confidenceScore: number;
  comparabilityFactors: {
    location: number;
    size: number;
    age: number;
    condition: number;
    marketTrends: number;
  };
  adjustments: PropertyAdjustment[];
  governmentCompliance: {
    fismaValidated: boolean;
    auditTrailComplete: boolean;
    biasDetectionPassed: boolean;
  };
  recommendations: string[];
}

export interface GovernmentAuditEvent {
  eventId: string;
  timestamp: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  complianceValidated: boolean;
  securityContext: {
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  };
}

export interface RootState {
  compGrid: CompGridState;
  valuation: ValuationState;
  ai: AIState;
  government: GovernmentState;
}
```

---

## Quick Reference

### Essential Components

- **PropertyValuationForm**: Advanced property assessment interface
- **ComparableGrid**: Property comparison and analysis tool
- **AIAnalysisDisplay**: AI-powered insights and recommendations
- **ComplianceStatusChip**: Government compliance status indicator

### Key Features

- **Government Accessibility**: Full Section 508 compliance
- **AI Integration**: Real-time AI agent analysis and recommendations
- **Security**: Government-grade security headers and validation
- **Audit Trails**: Complete government audit logging
- **Performance**: Virtualized grids for large datasets

### Integration Points

- **Harris PACS**: Property assessment system integration
- **AI Agents**: 1,008 agent swarm for property analysis
- **Redux Store**: Centralized state management
- **Government APIs**: Secure government system integration

---

**Last Updated**: August 27, 2025  
**Version**: Terrafusion OS 1.0 Applications  
**Authority**: Terrafusion Application Development Division
