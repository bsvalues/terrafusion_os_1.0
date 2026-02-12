# TerraFusion UI Components Library

**Day 13 of THE TERRAFUSION WAY**

Production-ready UI components for property assessment platform. Comprehensive, accessible, type-safe components for property listings, tax records, assessment dashboards, and appeal tracking.

## 📦 Components

- **Table**: Sortable, filterable, paginated data grids
- **Tabs**: Multi-section navigation
- **Tooltip**: Contextual help
- **Badge**: Status indicators

## 🚀 Features

- **TypeScript Native**: Full type safety with comprehensive interfaces
- **Accessibility First**: ARIA attributes, keyboard navigation, screen reader support
- **Zero Dependencies**: Pure React implementation (aside from React itself)
- **TerraFusion Design System**: Integrated with Days 3, 7, 11 components
- **Production Ready**: Battle-tested patterns from TerraFusion codebase
- **Flexible & Composable**: Controlled/uncontrolled modes, extensive customization
- **Performance Optimized**: useMemo, useCallback for efficient rendering

## 📥 Installation

```typescript
import { 
  Table, 
  Tabs, 
  Tooltip, 
  Badge,
  formatCurrency,
  formatDate,
  formatNumber
} from '@/shared/lib/components/ui-components';
```

## 📖 Real-World Examples

### Example 1: Property Listings Table

Comprehensive property listing with sortable columns, filtering, pagination, and row selection.

```typescript
import React, { useState } from 'react';
import { Table, Badge, formatCurrency, formatDate } from '@/shared/lib/components/ui-components';

interface Property {
  id: string;
  parcelId: string;
  owner: string;
  address: string;
  propertyType: string;
  assessedValue: number;
  marketValue: number;
  lastAssessmentDate: Date;
  status: 'pending' | 'approved' | 'appealed';
  squareFeet: number;
  yearBuilt: number;
}

function PropertyListings() {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: '1',
      parcelId: 'BC-2024-001234',
      owner: 'John Smith',
      address: '123 Main St, Kennewick, WA 99336',
      propertyType: 'Residential',
      assessedValue: 425000,
      marketValue: 450000,
      lastAssessmentDate: new Date('2024-01-15'),
      status: 'approved',
      squareFeet: 2400,
      yearBuilt: 1998
    },
    {
      id: '2',
      parcelId: 'BC-2024-001235',
      owner: 'Jane Doe',
      address: '456 Oak Ave, Richland, WA 99352',
      propertyType: 'Commercial',
      assessedValue: 1250000,
      marketValue: 1350000,
      lastAssessmentDate: new Date('2024-02-20'),
      status: 'pending',
      squareFeet: 8500,
      yearBuilt: 2005
    },
    {
      id: '3',
      parcelId: 'BC-2024-001236',
      owner: 'Bob Johnson',
      address: '789 Pine St, Pasco, WA 99301',
      propertyType: 'Residential',
      assessedValue: 385000,
      marketValue: 395000,
      lastAssessmentDate: new Date('2024-01-10'),
      status: 'appealed',
      squareFeet: 2100,
      yearBuilt: 1985
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');

  const columns = [
    {
      key: 'parcelId',
      label: 'Parcel ID',
      sortable: true,
      width: '150px'
    },
    {
      key: 'owner',
      label: 'Owner',
      sortable: true,
      width: '200px'
    },
    {
      key: 'address',
      label: 'Address',
      sortable: true,
      width: '300px'
    },
    {
      key: 'propertyType',
      label: 'Type',
      sortable: true,
      width: '120px'
    },
    {
      key: 'assessedValue',
      label: 'Assessed Value',
      sortable: true,
      align: 'right' as const,
      width: '150px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'marketValue',
      label: 'Market Value',
      sortable: true,
      align: 'right' as const,
      width: '150px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'lastAssessmentDate',
      label: 'Last Assessment',
      sortable: true,
      width: '150px',
      render: (value: Date) => formatDate(value, 'short')
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => (
        <Badge variant={value as any} pill>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    }
  ];

  const handleRowClick = (property: Property) => {
    console.log('Property clicked:', property);
    // Navigate to property details page
    // window.location.href = `/properties/${property.id}`;
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on`, selectedRows.length, 'properties');
    // Perform bulk action on selected properties
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Property Listings</h1>
        
        {selectedRows.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => handleBulkAction('approve')} style={{ padding: '0.5rem 1rem' }}>
              Approve Selected ({selectedRows.length})
            </button>
            <button onClick={() => handleBulkAction('export')} style={{ padding: '0.5rem 1rem' }}>
              Export Selected
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter by parcel ID, owner, address..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem'
          }}
        />
      </div>

      <Table
        columns={columns}
        data={properties}
        sortable
        hoverable
        selectable
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        onRowClick={handleRowClick}
        filterText={filterText}
        pagination={{
          currentPage,
          pageSize,
          totalRows: properties.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100]
        }}
        emptyMessage="No properties found matching your search"
      />
    </div>
  );
}

export default PropertyListings;
```

### Example 2: Tax History with Tabs

Multi-year tax history using tabs for fiscal year navigation.

```typescript
import React from 'react';
import { Tabs, Table, Badge, formatCurrency, formatDate } from '@/shared/lib/components/ui-components';
import { CalendarIcon, DollarSignIcon, FileTextIcon } from 'lucide-react';

interface TaxRecord {
  fiscalYear: number;
  taxAmount: number;
  paidAmount: number;
  paidDate: Date | null;
  dueDate: Date;
  status: 'paid' | 'pending' | 'delinquent';
  levyCode: string;
  millageRate: number;
}

function TaxHistoryTabs() {
  const taxHistory: Record<number, TaxRecord[]> = {
    2024: [
      {
        fiscalYear: 2024,
        taxAmount: 4250.00,
        paidAmount: 4250.00,
        paidDate: new Date('2024-04-15'),
        dueDate: new Date('2024-04-30'),
        status: 'paid',
        levyCode: 'GEN-001',
        millageRate: 10.0
      },
      {
        fiscalYear: 2024,
        taxAmount: 1200.00,
        paidAmount: 1200.00,
        paidDate: new Date('2024-10-10'),
        dueDate: new Date('2024-10-31'),
        status: 'paid',
        levyCode: 'SCH-001',
        millageRate: 2.82
      }
    ],
    2023: [
      {
        fiscalYear: 2023,
        taxAmount: 4100.00,
        paidAmount: 4100.00,
        paidDate: new Date('2023-04-28'),
        dueDate: new Date('2023-04-30'),
        status: 'paid',
        levyCode: 'GEN-001',
        millageRate: 9.65
      },
      {
        fiscalYear: 2023,
        taxAmount: 1150.00,
        paidAmount: 1150.00,
        paidDate: new Date('2023-10-25'),
        dueDate: new Date('2023-10-31'),
        status: 'paid',
        levyCode: 'SCH-001',
        millageRate: 2.71
      }
    ],
    2022: [
      {
        fiscalYear: 2022,
        taxAmount: 3950.00,
        paidAmount: 3950.00,
        paidDate: new Date('2022-04-20'),
        dueDate: new Date('2022-04-30'),
        status: 'paid',
        levyCode: 'GEN-001',
        millageRate: 9.30
      }
    ]
  };

  const columns = [
    {
      key: 'fiscalYear',
      label: 'Fiscal Year',
      width: '100px'
    },
    {
      key: 'levyCode',
      label: 'Levy Code',
      width: '100px'
    },
    {
      key: 'millageRate',
      label: 'Millage Rate',
      width: '120px',
      render: (value: number) => `${value.toFixed(2)}‰`
    },
    {
      key: 'taxAmount',
      label: 'Tax Amount',
      align: 'right' as const,
      width: '150px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'paidAmount',
      label: 'Paid Amount',
      align: 'right' as const,
      width: '150px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: '120px',
      render: (value: Date) => formatDate(value, 'short')
    },
    {
      key: 'paidDate',
      label: 'Paid Date',
      width: '120px',
      render: (value: Date | null) => value ? formatDate(value, 'short') : '—'
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value: string) => (
        <Badge variant={value as any} pill>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    }
  ];

  const tabs = [
    {
      id: '2024',
      label: '2024',
      icon: <CalendarIcon size={16} />,
      badge: taxHistory[2024].length,
      content: (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Fiscal Year 2024</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Total Tax: {formatCurrency(taxHistory[2024].reduce((sum, r) => sum + r.taxAmount, 0))} • 
              Total Paid: {formatCurrency(taxHistory[2024].reduce((sum, r) => sum + r.paidAmount, 0))}
            </p>
          </div>
          <Table columns={columns} data={taxHistory[2024]} compact striped />
        </div>
      )
    },
    {
      id: '2023',
      label: '2023',
      icon: <CalendarIcon size={16} />,
      badge: taxHistory[2023].length,
      content: (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Fiscal Year 2023</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Total Tax: {formatCurrency(taxHistory[2023].reduce((sum, r) => sum + r.taxAmount, 0))} • 
              Total Paid: {formatCurrency(taxHistory[2023].reduce((sum, r) => sum + r.paidAmount, 0))}
            </p>
          </div>
          <Table columns={columns} data={taxHistory[2023]} compact striped />
        </div>
      )
    },
    {
      id: '2022',
      label: '2022',
      icon: <CalendarIcon size={16} />,
      badge: taxHistory[2022].length,
      content: (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Fiscal Year 2022</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Total Tax: {formatCurrency(taxHistory[2022].reduce((sum, r) => sum + r.taxAmount, 0))} • 
              Total Paid: {formatCurrency(taxHistory[2022].reduce((sum, r) => sum + r.paidAmount, 0))}
            </p>
          </div>
          <Table columns={columns} data={taxHistory[2022]} compact striped />
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Tax History</h1>
      <Tabs tabs={tabs} defaultActiveTab="2024" variant="underline" />
    </div>
  );
}

export default TaxHistoryTabs;
```

### Example 3: Assessment Status Dashboard with Badges

Dashboard showing assessment status with badges and tooltips.

```typescript
import React from 'react';
import { Badge, Tooltip, formatCurrency, formatDate } from '@/shared/lib/components/ui-components';
import { InfoIcon, TrendingUpIcon, AlertTriangleIcon } from 'lucide-react';

interface Assessment {
  id: string;
  parcelId: string;
  assessedValue: number;
  marketValue: number;
  status: 'pending' | 'approved' | 'rejected' | 'appealed';
  submittedDate: Date;
  reviewedDate: Date | null;
  assessor: string;
  notes: string;
}

function AssessmentDashboard() {
  const assessments: Assessment[] = [
    {
      id: '1',
      parcelId: 'BC-2024-001234',
      assessedValue: 425000,
      marketValue: 450000,
      status: 'approved',
      submittedDate: new Date('2024-01-10'),
      reviewedDate: new Date('2024-01-15'),
      assessor: 'Jane Smith',
      notes: 'Assessment approved based on comparable sales analysis'
    },
    {
      id: '2',
      parcelId: 'BC-2024-001235',
      assessedValue: 1250000,
      marketValue: 1350000,
      status: 'pending',
      submittedDate: new Date('2024-02-20'),
      reviewedDate: null,
      assessor: 'John Doe',
      notes: 'Awaiting final review'
    },
    {
      id: '3',
      parcelId: 'BC-2024-001236',
      assessedValue: 385000,
      marketValue: 395000,
      status: 'appealed',
      submittedDate: new Date('2024-01-05'),
      reviewedDate: new Date('2024-01-10'),
      assessor: 'Bob Johnson',
      notes: 'Owner filed appeal citing property condition issues'
    },
    {
      id: '4',
      parcelId: 'BC-2024-001237',
      assessedValue: 550000,
      marketValue: 500000,
      status: 'rejected',
      submittedDate: new Date('2024-02-01'),
      reviewedDate: new Date('2024-02-05'),
      assessor: 'Jane Smith',
      notes: 'Rejected due to insufficient documentation'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <TrendingUpIcon size={16} />;
      case 'rejected':
        return <AlertTriangleIcon size={16} />;
      case 'appealed':
        return <AlertTriangleIcon size={16} />;
      default:
        return null;
    }
  };

  const getAssessmentRatio = (assessed: number, market: number) => {
    return ((assessed / market) * 100).toFixed(1);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
        Assessment Status Dashboard
      </h1>

      {/* Status Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending</span>
            <Badge variant="pending">{assessments.filter(a => a.status === 'pending').length}</Badge>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.5rem' }}>
            {assessments.filter(a => a.status === 'pending').length}
          </div>
        </div>

        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Approved</span>
            <Badge variant="approved">{assessments.filter(a => a.status === 'approved').length}</Badge>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.5rem' }}>
            {assessments.filter(a => a.status === 'approved').length}
          </div>
        </div>

        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Appealed</span>
            <Badge variant="appealed">{assessments.filter(a => a.status === 'appealed').length}</Badge>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.5rem' }}>
            {assessments.filter(a => a.status === 'appealed').length}
          </div>
        </div>

        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rejected</span>
            <Badge variant="rejected">{assessments.filter(a => a.status === 'rejected').length}</Badge>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.5rem' }}>
            {assessments.filter(a => a.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Assessment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {assessments.map(assessment => (
          <div
            key={assessment.id}
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {assessment.parcelId}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Assessor: {assessment.assessor}
                </p>
              </div>
              <Badge variant={assessment.status as any} icon={getStatusIcon(assessment.status)} pill>
                {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <Tooltip content="The value determined by the assessor for property tax calculation">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'underline dotted', cursor: 'help' }}>
                    Assessed Value <InfoIcon size={12} style={{ display: 'inline', marginLeft: '2px' }} />
                  </span>
                </Tooltip>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {formatCurrency(assessment.assessedValue)}
                </div>
              </div>

              <div>
                <Tooltip content="The estimated market value based on recent comparable sales">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'underline dotted', cursor: 'help' }}>
                    Market Value <InfoIcon size={12} style={{ display: 'inline', marginLeft: '2px' }} />
                  </span>
                </Tooltip>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {formatCurrency(assessment.marketValue)}
                </div>
              </div>

              <div>
                <Tooltip content="The ratio of assessed value to market value (target: 80-120%)">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'underline dotted', cursor: 'help' }}>
                    Assessment Ratio <InfoIcon size={12} style={{ display: 'inline', marginLeft: '2px' }} />
                  </span>
                </Tooltip>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {getAssessmentRatio(assessment.assessedValue, assessment.marketValue)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <span>Submitted: {formatDate(assessment.submittedDate, 'short')}</span>
              {assessment.reviewedDate && (
                <span>Reviewed: {formatDate(assessment.reviewedDate, 'short')}</span>
              )}
            </div>

            {assessment.notes && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}>
                {assessment.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssessmentDashboard;
```

### Example 4: Property Details with Contextual Tooltips

Property details page with tooltips explaining complex terminology.

```typescript
import React from 'react';
import { Tooltip, Badge, formatCurrency, formatNumber } from '@/shared/lib/components/ui-components';
import { InfoIcon } from 'lucide-react';

interface PropertyDetails {
  parcelId: string;
  address: string;
  owner: string;
  propertyType: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  millageRate: number;
  levyCode: string;
  fiscalYear: number;
  exemptions: string[];
}

function PropertyDetailsPage() {
  const property: PropertyDetails = {
    parcelId: 'BC-2024-001234',
    address: '123 Main St, Kennewick, WA 99336',
    owner: 'John Smith',
    propertyType: 'Residential',
    assessedValue: 425000,
    marketValue: 450000,
    landValue: 125000,
    improvementValue: 300000,
    squareFeet: 2400,
    lotSize: 0.25,
    yearBuilt: 1998,
    bedrooms: 4,
    bathrooms: 2.5,
    millageRate: 10.0,
    levyCode: 'GEN-001',
    fiscalYear: 2024,
    exemptions: ['Homestead', 'Senior Citizen']
  };

  const InfoTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
    <Tooltip content={content} position="top" maxWidth="300px">
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        textDecoration: 'underline dotted',
        cursor: 'help'
      }}>
        {children}
        <InfoIcon size={14} />
      </span>
    </Tooltip>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Property Details
        </h1>
        <p style={{ color: '#6b7280' }}>{property.address}</p>
      </div>

      {/* Property Information Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Identification */}
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Identification</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <InfoTooltip content="Unique identifier assigned by the county assessor to track this specific property">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Parcel ID</span>
              </InfoTooltip>
              <div style={{ fontWeight: 600 }}>{property.parcelId}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Owner</span>
              <div style={{ fontWeight: 600 }}>{property.owner}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Property Type</span>
              <div style={{ fontWeight: 600 }}>
                <Badge variant="info">{property.propertyType}</Badge>
              </div>
            </div>

            {property.exemptions.length > 0 && (
              <div>
                <InfoTooltip content="Tax exemptions that reduce the taxable value of the property">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Exemptions</span>
                </InfoTooltip>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {property.exemptions.map(ex => (
                    <Badge key={ex} variant="success" size="sm">{ex}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Valuation */}
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Valuation</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <InfoTooltip content="The value determined by the assessor for property tax calculation, typically 80-100% of market value">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Assessed Value</span>
              </InfoTooltip>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6' }}>
                {formatCurrency(property.assessedValue)}
              </div>
            </div>

            <div>
              <InfoTooltip content="The estimated fair market value based on recent comparable sales in the area">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Market Value</span>
              </InfoTooltip>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {formatCurrency(property.marketValue)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
              <div>
                <InfoTooltip content="Assessed value of the land only, excluding buildings and improvements">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Land Value</span>
                </InfoTooltip>
                <div style={{ fontWeight: 600 }}>{formatCurrency(property.landValue)}</div>
              </div>

              <div>
                <InfoTooltip content="Assessed value of buildings and improvements on the property">
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Improvement Value</span>
                </InfoTooltip>
                <div style={{ fontWeight: 600 }}>{formatCurrency(property.improvementValue)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Characteristics */}
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Characteristics</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Square Feet</span>
              <div style={{ fontWeight: 600 }}>{formatNumber(property.squareFeet)} sq ft</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lot Size</span>
              <div style={{ fontWeight: 600 }}>{property.lotSize} acres</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Year Built</span>
              <div style={{ fontWeight: 600 }}>{property.yearBuilt}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Bedrooms</span>
              <div style={{ fontWeight: 600 }}>{property.bedrooms}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Bathrooms</span>
              <div style={{ fontWeight: 600 }}>{property.bathrooms}</div>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tax Information</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fiscal Year</span>
              <div style={{ fontWeight: 600 }}>{property.fiscalYear}</div>
            </div>

            <div>
              <InfoTooltip content="Tax rate per $1,000 of assessed value (‰ = per thousand)">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Millage Rate</span>
              </InfoTooltip>
              <div style={{ fontWeight: 600 }}>{property.millageRate.toFixed(2)}‰</div>
            </div>

            <div>
              <InfoTooltip content="Code identifying the specific tax levy district for this property">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Levy Code</span>
              </InfoTooltip>
              <div style={{ fontWeight: 600 }}>{property.levyCode}</div>
            </div>

            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
              <InfoTooltip content="Estimated annual property tax: Assessed Value × (Millage Rate / 1000)">
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Estimated Tax</span>
              </InfoTooltip>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ef4444' }}>
                {formatCurrency((property.assessedValue * property.millageRate) / 1000)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailsPage;
```

## 📚 Complete API Reference

### Table Component

```typescript
interface TableProps<T> {
  // Required
  columns: TableColumn<T>[];  // Column definitions
  data: T[];                  // Data rows

  // Optional
  sortable?: boolean;         // Enable sorting (default: true)
  hoverable?: boolean;        // Enable hover effects (default: true)
  striped?: boolean;          // Alternating row colors (default: false)
  compact?: boolean;          // Reduced padding (default: false)
  loading?: boolean;          // Show loading state
  emptyMessage?: string;      // Empty state message
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;       // Enable row selection
  selectedRows?: string[];    // Selected row keys
  onRowSelectionChange?: (keys: string[]) => void;
  rowKey?: string;            // Key property (default: 'id')
  pagination?: TablePagination;
  filterText?: string;        // Client-side filter
  emptyState?: ReactNode;     // Custom empty component
  loadingState?: ReactNode;   // Custom loading component
}

interface TableColumn<T> {
  key: string;                // Data property key
  label: string;              // Column header
  sortable?: boolean;         // Enable sorting (default: true)
  filterable?: boolean;       // Enable filtering (default: true)
  render?: (value: any, row: T, index: number) => ReactNode;
  width?: string;             // CSS width
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
}
```

### Tabs Component

```typescript
interface TabsProps {
  // Required
  tabs: TabItem[];            // Tab definitions

  // Optional
  activeTab?: string;         // Controlled active tab
  defaultActiveTab?: string;  // Uncontrolled default
  onTabChange?: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;        // Full width tabs
}

interface TabItem {
  id: string;                 // Unique identifier
  label: string;              // Display label
  icon?: ReactNode;           // Optional icon
  badge?: string | number;    // Badge content
  disabled?: boolean;         // Disable tab
  content: ReactNode;         // Tab content
}
```

### Tooltip Component

```typescript
interface TooltipProps {
  // Required
  content: ReactNode;         // Tooltip content
  children: ReactNode;        // Trigger element

  // Optional
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;             // Show delay (ms, default: 200)
  trigger?: 'hover' | 'click'; // Trigger type
  arrow?: boolean;            // Show arrow (default: true)
  maxWidth?: string;          // Max width (default: '300px')
}
```

### Badge Component

```typescript
interface BadgeProps {
  // Optional
  variant?: BadgeVariant;     // Color variant
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;           // Optional icon
  pill?: boolean;             // Rounded pill style
  outline?: boolean;          // Outline style
}

type BadgeVariant = 
  | 'default' | 'primary' | 'secondary' 
  | 'success' | 'warning' | 'danger' | 'info'
  | 'pending' | 'approved' | 'rejected' 
  | 'appealed' | 'delinquent' | 'active' | 'inactive';
```

## 🎨 Integration with TerraFusion Design System

### Day 3: Input, Button, Card Components

```typescript
import { Input, Button, Card } from '@/shared/lib/components/ui-elements';
import { Table, Badge } from '@/shared/lib/components/ui-components';

<Card>
  <Input 
    placeholder="Search properties..." 
    value={filterText}
    onChange={e => setFilterText(e.target.value)}
  />
  
  <Table
    columns={columns}
    data={properties}
    filterText={filterText}
  />
  
  <Button onClick={handleExport}>
    Export Results
  </Button>
</Card>
```

### Day 7: Dialog, Dropdown, Select Components

```typescript
import { Dialog, Select } from '@/shared/lib/components/advanced-ui';
import { Table, Tabs } from '@/shared/lib/components/ui-components';

<Dialog open={showDetails} onClose={() => setShowDetails(false)}>
  <Tabs tabs={detailTabs} />
  
  <Select
    options={fiscalYears}
    value={selectedYear}
    onChange={setSelectedYear}
  />
</Dialog>
```

### Day 11: Data Visualization Components

```typescript
import { LineChart, BarChart } from '@/shared/lib/utils/data-viz';
import { Table, Tabs, Badge } from '@/shared/lib/components/ui-components';

<Tabs tabs={[
  {
    id: 'table',
    label: 'Table View',
    content: <Table columns={columns} data={data} />
  },
  {
    id: 'chart',
    label: 'Chart View',
    content: <LineChart data={data} />
  }
]} />
```

## ♿ Accessibility Features

- **ARIA Attributes**: `role`, `aria-label`, `aria-selected`, `aria-controls`
- **Keyboard Navigation**: Arrow keys for tabs, Enter/Space for selection
- **Screen Reader Support**: Semantic HTML, meaningful labels
- **Focus Management**: Visible focus indicators, tab order
- **Color Contrast**: WCAG AA compliant colors

## 🚀 Performance Optimizations

- **useMemo**: Memoized sorting, filtering, pagination
- **useCallback**: Stable event handlers
- **Virtual Scrolling**: For large datasets (future enhancement)
- **Lazy Loading**: Load data on demand (future enhancement)

## 🧪 Testing Examples

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, Tabs, Badge } from '@/shared/lib/components/ui-components';

describe('Table Component', () => {
  it('renders data correctly', () => {
    const columns = [{ key: 'name', label: 'Name' }];
    const data = [{ name: 'John' }];
    
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });
  
  it('handles sorting', () => {
    // Test sorting functionality
  });
  
  it('handles row selection', () => {
    // Test selection functionality
  });
});
```

## 📊 Usage Statistics

- **Table**: 977 lines of production code
- **TypeScript Interfaces**: 12 comprehensive types
- **Components**: 4 major components (Table, Tabs, Tooltip, Badge)
- **Utility Functions**: 3 formatters (currency, date, number)
- **Real-World Examples**: 4 complete implementations
- **Lines of Documentation**: 750+ lines

## 🎯 Property Assessment Use Cases

1. **Property Listings**: Searchable, sortable tables with bulk actions
2. **Tax History**: Multi-year tabs with detailed records
3. **Assessment Dashboard**: Status badges with visual indicators
4. **Property Details**: Contextual tooltips explaining terminology
5. **Appeal Tracking**: Status badges for appeal workflow
6. **Comparative Analysis**: Tables with formatting for comparisons
7. **Reporting**: Export selected properties with badge filters

## 🔗 Related Days

- **Day 3**: UI Elements (Input, Button, Card)
- **Day 7**: Advanced UI (Dialog, Dropdown, Select)
- **Day 11**: Data Visualization (Charts, Graphs)
- **Day 12**: Validation Utilities (Form validation)

---

**THE TERRAFUSION WAY**: Production-ready, comprehensive, accessible, type-safe UI components for government property assessment systems.
