# CLAUDE Frontend Development Guide

This file provides detailed guidance for frontend development in the TerraFusion TerraBuild Modernization platform.

## Frontend Architecture

### Client Structure (`client/src/`)

```
client/src/
├── App.tsx                     # Root application component
├── main.tsx                    # Application entry point
├── index.css                   # Global styles with Tailwind
│
├── components/                 # React components organized by domain
│   ├── ai/                     # AI-powered components
│   │   ├── AICalculationExplainer.tsx
│   │   ├── AICostPredictor.tsx
│   │   ├── AIMatrixAnalyzer.tsx
│   │   └── CostPredictionWizard.tsx
│   │
│   ├── dashboard/              # Dashboard widgets (20+ components)
│   │   ├── BuildingCostCalculator.tsx
│   │   ├── CostMatrixManager.tsx
│   │   ├── CalculationHistory.tsx
│   │   ├── CostTrendChart.tsx
│   │   └── RegionalCostComparison.tsx
│   │
│   ├── data-connectors/        # Data integration UI
│   │   ├── FTPManagement.tsx
│   │   ├── FTPConnectionStatus.tsx
│   │   ├── FTPFilePreview.tsx
│   │   └── DataConnectionTester.tsx
│   │
│   ├── collaboration/          # Project collaboration
│   │   ├── ProjectSharingControls.tsx
│   │   ├── CommentSection.tsx
│   │   ├── ProjectMembersTable.tsx
│   │   └── ActivityTrendChart.tsx
│   │
│   ├── visualizations/         # Data visualization
│   │   ├── RegionalCostHeatmap.tsx
│   │   ├── CostTrendAnalysis.tsx
│   │   ├── HierarchicalCostVisualization.tsx
│   │   └── DrilldownBarChart.tsx
│   │
│   ├── layout/                 # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── TopNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── ui/                     # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── [50+ shadcn components]
│   │
│   ├── auth/                   # Authentication components
│   │   ├── protected-route.tsx
│   │   ├── county-network-auth.tsx
│   │   └── auth-error-boundary.tsx
│   │
│   ├── swarm/                  # AI swarm UI
│   │   ├── SwarmDashboard.tsx
│   │   ├── SwarmAgentStatus.tsx
│   │   └── SwarmTaskRunner.tsx
│   │
│   └── common/                 # Shared components
│       ├── ErrorBoundary.tsx
│       ├── FileUploader.tsx
│       └── QueryErrorBoundary.tsx
│
├── pages/                      # Route-level page components (40+ pages)
│   ├── Dashboard.tsx
│   ├── CalculatorPage.tsx
│   ├── PropertyBrowserPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── AIToolsPage.tsx
│   ├── SharedProjectsPage.tsx
│   └── login-page.tsx
│
├── contexts/                   # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── ProjectContext.tsx
│   ├── CollaborationContext.tsx
│   └── DataFlowContext.tsx
│
├── hooks/                      # Custom React hooks
│   ├── use-auth.ts
│   ├── use-cost-matrix.ts
│   ├── use-building-costs.ts
│   ├── use-calculation-history.ts
│   ├── use-toast.ts
│   └── use-mobile.tsx
│
├── lib/                        # Utilities and helpers
│   ├── utils.ts                # General utilities (cn, formatters)
│   ├── queryClient.ts          # TanStack Query configuration
│   ├── formatters.ts           # Data formatters
│   ├── pdf-export.ts           # PDF generation
│   └── visualization-utils.ts  # Chart utilities
│
└── types/                      # TypeScript type definitions
    ├── ar-libraries.d.ts
    ├── jspdf.d.ts
    └── orbit-controls.d.ts
```

## Component Development Patterns

### Basic Component Structure

```typescript
// client/src/components/dashboard/YourComponent.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface YourComponentProps {
  propertyId: string;
  onUpdate?: (data: any) => void;
}

export function YourComponent({ propertyId, onUpdate }: YourComponentProps) {
  const [localState, setLocalState] = useState<string>('');

  // Fetch data with TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['your-data', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/your-endpoint/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    enabled: !!propertyId,  // Only run if propertyId exists
  });

  // Handle side effects
  useEffect(() => {
    if (data) {
      onUpdate?.(data);
    }
  }, [data, onUpdate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Component</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Component content */}
          <p>{data?.value}</p>

          <Button onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Form Component with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define validation schema
const formSchema = z.object({
  parcelId: z.string().min(1, 'Parcel ID is required'),
  squareFootage: z.number().min(1).max(100000),
  buildingType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']),
});

type FormValues = z.infer<typeof formSchema>;

export function PropertyForm() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parcelId: '',
      squareFootage: 0,
      buildingType: 'RESIDENTIAL',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create property');
      }

      toast({
        title: 'Success',
        description: 'Property created successfully',
      });

      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="parcelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel ID</FormLabel>
              <FormControl>
                <Input placeholder="BEN-123-456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="squareFootage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Square Footage</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Property</Button>
      </form>
    </Form>
  );
}
```

## Data Fetching with TanStack Query

### Query Client Setup

```typescript
// client/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 10,     // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Using Queries

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// GET request
const { data, isLoading, error } = useQuery({
  queryKey: ['properties', filters],
  queryFn: async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/properties?${params}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
});

// POST request with mutation
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: async (newProperty: PropertyData) => {
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProperty),
    });
    if (!response.ok) throw new Error('Failed to create');
    return response.json();
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  },
});

// Usage
createMutation.mutate(propertyData);
```

### Custom Query Hook

```typescript
// client/src/hooks/use-building-costs.ts
import { useQuery } from '@tanstack/react-query';

export interface BuildingCostParams {
  region: string;
  buildingType: string;
  squareFootage: number;
}

export function useBuildingCosts(params: BuildingCostParams) {
  return useQuery({
    queryKey: ['building-costs', params],
    queryFn: async () => {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Cost calculation failed');
      }

      return response.json();
    },
    enabled: !!params.region && !!params.buildingType && params.squareFootage > 0,
  });
}

// Usage in component
function CostCalculator() {
  const [params, setParams] = useState<BuildingCostParams>({
    region: 'RICHLAND',
    buildingType: 'RESIDENTIAL',
    squareFootage: 2000,
  });

  const { data, isLoading } = useBuildingCosts(params);

  return (
    <div>
      {isLoading ? 'Calculating...' : `Total: $${data?.totalCost}`}
    </div>
  );
}
```

## State Management

### React Context Pattern

```typescript
// client/src/contexts/ProjectContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface Project {
  id: string;
  name: string;
  parcelId: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  addProject: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        projects,
        addProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
```

### Usage in Component

```typescript
import { useProject } from '@/contexts/ProjectContext';

function ProjectSelector() {
  const { currentProject, setCurrentProject, projects } = useProject();

  return (
    <select
      value={currentProject?.id || ''}
      onChange={(e) => {
        const project = projects.find((p) => p.id === e.target.value);
        setCurrentProject(project || null);
      }}
    >
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
```

## Routing with Wouter

```typescript
// client/src/App.tsx
import { Route, Switch } from 'wouter';
import { Dashboard } from '@/pages/Dashboard';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { PropertyBrowserPage } from '@/pages/PropertyBrowserPage';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />

      <Route path="/calculator">
        <CalculatorPage />
      </Route>

      <Route path="/properties">
        <ProtectedRoute>
          <PropertyBrowserPage />
        </ProtectedRoute>
      </Route>

      <Route path="/properties/:id">
        {(params) => <PropertyDetailsPage id={params.id} />}
      </Route>

      {/* 404 */}
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}
```

## Styling with Tailwind CSS

### Utility Classes

```typescript
// Basic styling
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <Button className="ml-auto">Action</Button>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// Hover and focus states
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
  Click me
</button>

// Dark mode support (if enabled)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>
```

### Using cn() Utility

```typescript
import { cn } from '@/lib/utils';

// Combine class names conditionally
<div
  className={cn(
    'px-4 py-2 rounded',
    isActive && 'bg-blue-500 text-white',
    isDisabled && 'opacity-50 cursor-not-allowed',
    className  // Allow prop override
  )}
>
  Content
</div>
```

## Visualization Components

### Chart with Recharts

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CostTrendData {
  month: string;
  cost: number;
}

export function CostTrendChart({ data }: { data: CostTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3D Visualization with Three.js

```typescript
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Building3DVisualization({ buildingData }: { buildingData: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // Create geometry
    const geometry = new THREE.BoxGeometry(
      buildingData.width,
      buildingData.height,
      buildingData.depth
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [buildingData]);

  return <div ref={containerRef} className="w-full h-[400px]" />;
}
```

## File Upload Component

```typescript
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
}

export function FileUploader({
  onUpload,
  accept = '.csv,.xlsx,.xls',
  maxSize = 10485760,  // 10MB
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'p-8 border-2 border-dashed cursor-pointer transition',
        isDragActive && 'border-blue-500 bg-blue-50'
      )}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag files here or click to browse</p>
        )}
      </div>
    </Card>
  );
}
```

## Error Boundaries

```typescript
// client/src/components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-lg font-semibold text-red-900">
              Something went wrong
            </h2>
            <p className="text-red-700">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memo component to prevent unnecessary re-renders
export const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  // Expensive computation
  const processedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      computed: expensiveCalculation(item),
    }));
  }, [data]);

  // Memoized callback
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return (
    <div>
      {processedData.map((item) => (
        <div key={item.id} onClick={handleClick}>
          {item.computed}
        </div>
      ))}
    </div>
  );
});
```

## Testing Frontend Components

### Component Test with Testing Library

```typescript
// client/src/components/YourComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { YourComponent } from './YourComponent';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />, { wrapper: Wrapper });
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<YourComponent />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## Accessibility (a11y)

```typescript
// Semantic HTML
<button onClick={handleClick}>Submit</button>  // ✓
<div onClick={handleClick}>Submit</div>        // ✗

// ARIA labels
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

// Focus management
import { useRef, useEffect } from 'react';

function Dialog({ isOpen }: { isOpen: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef}>Close</button>
    </div>
  );
}

// Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clickable div
</div>
```

---

**Last Updated**: October 2025
**Related**: CLAUDE.md, CLAUDE-BACKEND.md
**UI Library**: shadcn/ui with Radix UI primitives
**Styling**: Tailwind CSS 3.4
**State**: TanStack Query + React Context
