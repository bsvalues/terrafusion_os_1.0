/**
 * Monaco Editor Code Snippets for TerraFusion IDE
 * Government-optimized snippets for property management, GIS, and compliance
 */

export interface CodeSnippet {
  label: string;
  kind: number; // CompletionItemKind
  insertText: string;
  documentation: string;
  language: string;
}

export const monacoSnippets: CodeSnippet[] = [
  // SQL - Property Queries
  {
    label: 'sql-select-parcels',
    kind: 27, // Snippet
    insertText: `SELECT 
  ParcelID,
  Address,
  Owner,
  AssessedValue,
  LandValue,
  TaxYear,
  PropertyType,
  Latitude,
  Longitude
FROM parcels
WHERE TaxYear = \${1:2024}
  AND PropertyType = '\${2:Residential}'
ORDER BY AssessedValue DESC
LIMIT \${3:100};`,
    documentation: 'Query parcels with common fields and filters',
    language: 'sql'
  },
  {
    label: 'sql-property-by-address',
    kind: 27,
    insertText: `SELECT *
FROM parcels
WHERE Address LIKE '%\${1:street name}%'
  AND TaxYear = \${2:2024};`,
    documentation: 'Find properties by address pattern',
    language: 'sql'
  },
  {
    label: 'sql-property-value-range',
    kind: 27,
    insertText: `SELECT 
  ParcelID,
  Address,
  AssessedValue,
  LandValue
FROM parcels
WHERE AssessedValue BETWEEN \${1:100000} AND \${2:500000}
  AND TaxYear = \${3:2024}
ORDER BY AssessedValue ASC;`,
    documentation: 'Query properties within value range',
    language: 'sql'
  },
  {
    label: 'sql-gis-nearby-parcels',
    kind: 27,
    insertText: `SELECT 
  ParcelID,
  Address,
  Latitude,
  Longitude,
  SQRT(
    POW(69.1 * (Latitude - \${1:46.2396}), 2) +
    POW(69.1 * (\${2:-119.1006} - Longitude) * COS(Latitude / 57.3), 2)
  ) AS distance_miles
FROM parcels
WHERE Latitude IS NOT NULL
  AND Longitude IS NOT NULL
HAVING distance_miles < \${3:1.0}
ORDER BY distance_miles ASC
LIMIT \${4:50};`,
    documentation: 'Find parcels within radius (miles) using Haversine formula',
    language: 'sql'
  },

  // TypeScript - Property Service
  {
    label: 'ts-property-interface',
    kind: 27,
    insertText: `interface Property {
  id: number;
  parcelId: string;
  address: string;
  owner: string;
  assessedValue: number;
  landValue: number;
  taxYear: number;
  propertyType: 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural';
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}`,
    documentation: 'Property data interface',
    language: 'typescript'
  },
  {
    label: 'ts-fetch-properties',
    kind: 27,
    insertText: `async function fetchProperties(
  filters?: {
    taxYear?: number;
    propertyType?: string;
    minValue?: number;
    maxValue?: number;
  }
): Promise<Property[]> {
  const params = new URLSearchParams();
  if (filters?.taxYear) params.set('taxYear', filters.taxYear.toString());
  if (filters?.propertyType) params.set('propertyType', filters.propertyType);
  if (filters?.minValue) params.set('minValue', filters.minValue.toString());
  if (filters?.maxValue) params.set('maxValue', filters.maxValue.toString());
  
  const response = await fetch(\`/api/properties?\${params}\`);
  if (!response.ok) {
    throw new Error(\`Failed to fetch properties: \${response.statusText}\`);
  }
  
  return response.json();
}`,
    documentation: 'Fetch properties with optional filters',
    language: 'typescript'
  },

  // TypeScript - Levy Calculation
  {
    label: 'ts-levy-calculator',
    kind: 27,
    insertText: `class LevyCalculator {
  /**
   * Calculate property tax levy
   * @param assessedValue - Property assessed value
   * @param taxRate - Tax rate per $1000 of assessed value
   * @param exemptions - Total exemptions amount
   * @returns Calculated levy amount
   */
  calculateLevy(
    assessedValue: number,
    taxRate: number,
    exemptions: number = 0
  ): number {
    const taxableValue = Math.max(0, assessedValue - exemptions);
    const levyAmount = (taxableValue / 1000) * taxRate;
    return Math.round(levyAmount * 100) / 100; // Round to 2 decimals
  }
  
  /**
   * Calculate quarterly payment schedule
   */
  getPaymentSchedule(totalLevy: number, dueDate: Date): {
    quarter: number;
    amount: number;
    dueDate: Date;
  }[] {
    const quarterlyAmount = Math.round((totalLevy / 4) * 100) / 100;
    return [
      { quarter: 1, amount: quarterlyAmount, dueDate: new Date(dueDate.getFullYear(), 1, 31) },
      { quarter: 2, amount: quarterlyAmount, dueDate: new Date(dueDate.getFullYear(), 4, 31) },
      { quarter: 3, amount: quarterlyAmount, dueDate: new Date(dueDate.getFullYear(), 7, 31) },
      { quarter: 4, amount: quarterlyAmount, dueDate: new Date(dueDate.getFullYear(), 10, 31) }
    ];
  }
}`,
    documentation: 'Property tax levy calculator with payment schedule',
    language: 'typescript'
  },

  // TypeScript - GIS Operations (Leaflet)
  {
    label: 'ts-leaflet-map-setup',
    kind: 27,
    insertText: `import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapComponent = () => {
  const center: [number, number] = [\${1:46.2396}, \${2:-119.1006}];
  
  return (
    <MapContainer center={center} zoom={\${3:11}} className="h-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* Add markers here */}
    </MapContainer>
  );
};`,
    documentation: 'Basic Leaflet map setup with React',
    language: 'typescript'
  },
  {
    label: 'ts-leaflet-custom-marker',
    kind: 27,
    insertText: `const customIcon = L.icon({
  iconUrl: '\${1:/path/to/icon.png}',
  iconSize: [\${2:25}, \${3:41}],
  iconAnchor: [\${4:12}, \${5:41}],
  popupAnchor: [\${6:1}, \${7:-34}],
  shadowUrl: '\${8:/path/to/shadow.png}',
  shadowSize: [\${9:41}, \${10:41}]
});

<Marker position={[\${11:lat}, \${12:lng}]} icon={customIcon}>
  <Popup>
    \${13:Popup content}
  </Popup>
</Marker>`,
    documentation: 'Create custom Leaflet marker with icon',
    language: 'typescript'
  },

  // SQL - PostGIS Spatial Queries
  {
    label: 'sql-postgis-within-distance',
    kind: 27,
    insertText: `SELECT 
  p1.ParcelID,
  p1.Address,
  ST_Distance(
    p1.geom::geography,
    ST_SetSRID(ST_MakePoint(\${1:-119.1006}, \${2:46.2396}), 4326)::geography
  ) / 1609.34 AS distance_miles
FROM parcels p1
WHERE ST_DWithin(
  p1.geom::geography,
  ST_SetSRID(ST_MakePoint(\${1}, \${2}), 4326)::geography,
  \${3:1609.34} -- meters (1 mile)
)
ORDER BY distance_miles ASC;`,
    documentation: 'PostGIS query for parcels within distance',
    language: 'sql'
  },
  {
    label: 'sql-postgis-intersects',
    kind: 27,
    insertText: `SELECT 
  p.ParcelID,
  p.Address,
  z.ZoneName
FROM parcels p
INNER JOIN zones z ON ST_Intersects(p.geom, z.geom)
WHERE z.ZoneType = '\${1:Residential}'
  AND p.TaxYear = \${2:2024};`,
    documentation: 'Find parcels that intersect with zones',
    language: 'sql'
  },

  // TypeScript - NIST Compliance
  {
    label: 'ts-nist-control-check',
    kind: 27,
    insertText: `interface NISTControl {
  id: string;
  family: string;
  title: string;
  implemented: boolean;
  evidence: string;
  lastAudit: Date;
}

class NISTComplianceChecker {
  private controls: Map<string, NISTControl> = new Map();
  
  /**
   * Check if NIST 800-53 control is implemented
   */
  checkControl(controlId: string): NISTControl | undefined {
    return this.controls.get(controlId);
  }
  
  /**
   * Generate compliance report
   */
  generateReport(): {
    totalControls: number;
    implemented: number;
    score: number;
  } {
    const total = this.controls.size;
    const implemented = Array.from(this.controls.values())
      .filter(c => c.implemented).length;
    
    return {
      totalControls: total,
      implemented,
      score: total > 0 ? (implemented / total) * 100 : 0
    };
  }
}`,
    documentation: 'NIST 800-53 compliance checker',
    language: 'typescript'
  },

  // TypeScript - FISMA Audit Log
  {
    label: 'ts-fisma-audit-log',
    kind: 27,
    insertText: `interface AuditEvent {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  ipAddress: string;
  details?: Record<string, any>;
}

class FISMAAuditLogger {
  /**
   * Log security event for FISMA compliance
   */
  logEvent(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    };
    
    // Write to secure audit log
    console.log('[AUDIT]', JSON.stringify(auditEvent));
    
    // In production: write to immutable audit database
    // this.writeToAuditDB(auditEvent);
  }
  
  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
  }): Promise<AuditEvent[]> {
    // Implementation here
    return [];
  }
}`,
    documentation: 'FISMA-compliant audit logging system',
    language: 'typescript'
  }
];

/**
 * Register snippets with Monaco Editor
 */
export function registerMonacoSnippets(monaco: any) {
  // Group snippets by language
  const snippetsByLanguage = monacoSnippets.reduce((acc, snippet) => {
    if (!acc[snippet.language]) {
      acc[snippet.language] = [];
    }
    acc[snippet.language].push(snippet);
    return acc;
  }, {} as Record<string, CodeSnippet[]>);

  // Register completion providers for each language
  Object.entries(snippetsByLanguage).forEach(([language, snippets]) => {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: () => {
        return {
          suggestions: snippets.map(snippet => ({
            label: snippet.label,
            kind: snippet.kind,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation
          }))
        };
      }
    });
  });

  console.log(`✅ Registered ${monacoSnippets.length} Monaco snippets across ${Object.keys(snippetsByLanguage).length} languages`);
}
