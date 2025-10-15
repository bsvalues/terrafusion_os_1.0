import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Sparkles, Database, Map, Shield, FileText, BarChart3, Package } from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'backend' | 'frontend' | 'fullstack';
  technologies: string[];
  files: {
    path: string;
    content: string;
  }[];
  dependencies: {
    [key: string]: string;
  };
}

export const ProjectTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const templates: ProjectTemplate[] = [
    {
      id: 'property-service-api',
      name: 'Property Service API',
      description: 'RESTful API for property management with database integration, authentication, and CRUD operations',
      icon: <Database className="w-6 h-6" />,
      category: 'backend',
      technologies: ['ASP.NET Core', 'Entity Framework', 'SQLite', 'JWT Auth'],
      dependencies: {
        'Microsoft.AspNetCore.App': '8.0.0',
        'Microsoft.EntityFrameworkCore.Sqlite': '8.0.0',
        'Microsoft.AspNetCore.Authentication.JwtBearer': '8.0.0',
        'Serilog.AspNetCore': '8.0.0'
      },
      files: [
        {
          path: 'Program.cs',
          content: `using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/property-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddDbContext<PropertyDbContext>(options =>
    options.UseSqlite("Data Source=properties.db"));
builder.Services.AddControllers();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();`
        },
        {
          path: 'Models/Property.cs',
          content: `namespace PropertyService.Models;

public class Property
{
    public int Id { get; set; }
    public string ParcelId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public int TaxYear { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}`
        }
      ]
    },
    {
      id: 'levy-calculation-engine',
      name: 'Levy Calculation Engine',
      description: 'Government tax levy calculation system with rate tables, exemptions, and payment scheduling',
      icon: <BarChart3 className="w-6 h-6" />,
      category: 'backend',
      technologies: ['TypeScript', 'Node.js', 'Express', 'SQLite'],
      dependencies: {
        'express': '^4.18.2',
        'sqlite3': '^5.1.6',
        'decimal.js': '^10.4.3',
        'date-fns': '^2.30.0',
        'typescript': '^5.2.2'
      },
      files: [
        {
          path: 'src/levyCalculator.ts',
          content: `import Decimal from 'decimal.js';

export interface LevyCalculation {
  parcelId: string;
  assessedValue: Decimal;
  taxRate: Decimal;
  exemptions: Decimal;
  levyAmount: Decimal;
  dueDate: Date;
}

export class LevyCalculator {
  /**
   * Calculate property tax levy
   * @param assessedValue - Property assessed value
   * @param taxRate - Tax rate per $1000 of assessed value
   * @param exemptions - Total exemptions amount
   * @returns Levy calculation result
   */
  calculateLevy(
    parcelId: string,
    assessedValue: number,
    taxRate: number,
    exemptions: number = 0
  ): LevyCalculation {
    const value = new Decimal(assessedValue);
    const rate = new Decimal(taxRate);
    const exempt = new Decimal(exemptions);
    
    // Calculate taxable value
    const taxableValue = value.minus(exempt);
    
    // Calculate levy: (taxableValue / 1000) * rate
    const levyAmount = taxableValue.dividedBy(1000).times(rate);
    
    // Due date: April 30th of current year
    const dueDate = new Date(new Date().getFullYear(), 3, 30);
    
    return {
      parcelId,
      assessedValue: value,
      taxRate: rate,
      exemptions: exempt,
      levyAmount,
      dueDate
    };
  }
}`
        }
      ]
    },
    {
      id: 'gis-viewer-app',
      name: 'GIS Viewer Application',
      description: 'Interactive map viewer with parcel layers, property search, and spatial analysis tools',
      icon: <Map className="w-6 h-6" />,
      category: 'frontend',
      technologies: ['React', 'TypeScript', 'Leaflet', 'Tailwind CSS'],
      dependencies: {
        'react': '^18.2.0',
        'react-leaflet': '^4.2.1',
        'leaflet': '^1.9.4',
        'lucide-react': '^0.294.0',
        'tailwindcss': '^3.3.5'
      },
      files: [
        {
          path: 'src/components/MapViewer.tsx',
          content: `import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Parcel {
  id: string;
  address: string;
  lat: number;
  lng: number;
  value: number;
}

export const MapViewer: React.FC = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const center: [number, number] = [46.2396, -119.1006];
  
  return (
    <div className="h-screen">
      <MapContainer center={center} zoom={11} className="h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {parcels.map(parcel => (
          <Marker key={parcel.id} position={[parcel.lat, parcel.lng]}>
            <Popup>
              <div>
                <h3 className="font-bold">{parcel.address}</h3>
                <p>Value: \${parcel.value.toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};`
        }
      ]
    },
    {
      id: 'compliance-reporting',
      name: 'Compliance Reporting Tool',
      description: 'Generate FISMA, NIST 800-53, and Section 508 compliance reports with automated checks',
      icon: <Shield className="w-6 h-6" />,
      category: 'fullstack',
      technologies: ['React', 'TypeScript', 'Node.js', 'PDF Generation'],
      dependencies: {
        'react': '^18.2.0',
        'express': '^4.18.2',
        'pdfkit': '^0.13.0',
        'axios': '^1.6.0'
      },
      files: [
        {
          path: 'src/compliance/nistChecker.ts',
          content: `export interface ComplianceControl {
  id: string;
  family: string;
  title: string;
  implemented: boolean;
  evidence: string;
}

export class NISTComplianceChecker {
  private controls: Map<string, ComplianceControl> = new Map();
  
  /**
   * Check NIST 800-53 control implementation
   */
  checkControl(controlId: string): ComplianceControl | undefined {
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
}`
        }
      ]
    },
    {
      id: 'data-migration',
      name: 'Data Migration Script',
      description: 'Safe database migration tool with rollback support, validation, and progress tracking',
      icon: <FileText className="w-6 h-6" />,
      category: 'backend',
      technologies: ['Python', 'SQLAlchemy', 'Alembic', 'Click'],
      dependencies: {
        'sqlalchemy': '^2.0.0',
        'alembic': '^1.12.0',
        'click': '^8.1.7',
        'python-dotenv': '^1.0.0'
      },
      files: [
        {
          path: 'migrate.py',
          content: `#!/usr/bin/env python3
"""
Data Migration Script
Safe database migration with validation and rollback support
"""

import click
from sqlalchemy import create_engine, text
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataMigration:
    def __init__(self, source_db: str, target_db: str):
        self.source = create_engine(source_db)
        self.target = create_engine(target_db)
    
    def migrate_table(self, table_name: str, batch_size: int = 1000):
        """Migrate data from source to target table"""
        logger.info(f"Starting migration of {table_name}")
        
        with self.source.connect() as source_conn:
            # Get total rows
            count_query = text(f"SELECT COUNT(*) FROM {table_name}")
            total_rows = source_conn.execute(count_query).scalar()
            
            logger.info(f"Total rows to migrate: {total_rows}")
            
            # Migrate in batches
            offset = 0
            while offset < total_rows:
                # Fetch batch from source
                query = text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset")
                rows = source_conn.execute(
                    query, 
                    {"limit": batch_size, "offset": offset}
                ).fetchall()
                
                # Insert into target
                with self.target.connect() as target_conn:
                    # Insert logic here
                    pass
                
                offset += batch_size
                progress = min(100, (offset / total_rows) * 100)
                logger.info(f"Progress: {progress:.1f}%")
        
        logger.info(f"Migration of {table_name} complete")

@click.command()
@click.option('--source', required=True, help='Source database URL')
@click.option('--target', required=True, help='Target database URL')
@click.option('--table', required=True, help='Table name to migrate')
def main(source: str, target: str, table: str):
    """Run data migration"""
    migration = DataMigration(source, target)
    migration.migrate_table(table)

if __name__ == '__main__':
    main()`
        }
      ]
    },
    {
      id: 'government-dashboard',
      name: 'Government Dashboard',
      description: 'Real-time analytics dashboard for government operations with KPIs, charts, and alerts',
      icon: <Package className="w-6 h-6" />,
      category: 'fullstack',
      technologies: ['React', 'TypeScript', 'Chart.js', 'WebSocket'],
      dependencies: {
        'react': '^18.2.0',
        'chart.js': '^4.4.0',
        'react-chartjs-2': '^5.2.0',
        'socket.io-client': '^4.7.0'
      },
      files: [
        {
          path: 'src/components/Dashboard.tsx',
          content: `import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardMetrics {
  totalProperties: number;
  totalRevenue: number;
  activeUsers: number;
  complianceScore: number;
}

export const GovernmentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProperties: 0,
    totalRevenue: 0,
    activeUsers: 0,
    complianceScore: 0
  });
  
  useEffect(() => {
    // Fetch real-time metrics
    const fetchMetrics = async () => {
      // API call here
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">
        Government Operations Dashboard
      </h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Properties</h3>
          <p className="text-2xl font-bold text-white">
            {metrics.totalProperties.toLocaleString()}
          </p>
        </div>
        {/* More KPI cards... */}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue trend, property distribution, etc. */}
      </div>
    </div>
  );
};`
        }
      ]
    }
  ];

  const handleCopyFile = (filePath: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filePath);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleGenerateProject = () => {
    if (!selectedTemplate || !projectName) return;
    
    // In a real implementation, this would:
    // 1. Create project directory structure
    // 2. Generate all files with proper content
    // 3. Install dependencies
    // 4. Initialize git repository
    alert(`Project "${projectName}" would be generated using template "${selectedTemplate.name}"`);
  };

  return (
    <div className="h-full flex bg-gray-900 text-white overflow-hidden">
      {/* Templates Sidebar */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Project Templates</h2>
          </div>
          <p className="text-sm text-gray-400">
            Government-optimized project scaffolds
          </p>
        </div>

        <div className="p-4 space-y-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedTemplate?.id === template.id
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded ${
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-700'
                    : 'bg-gray-600'
                }`}>
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-300 mb-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.technologies.slice(0, 3).map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-800 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Template Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <div className="p-6 bg-gray-800 border-b border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
                  <p className="text-gray-400">{selectedTemplate.description}</p>
                </div>
                <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                  {selectedTemplate.category}
                </span>
              </div>

              {/* Technologies */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-700 rounded-lg text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Name Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleGenerateProject}
                  disabled={!projectName}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Generate Project
                </button>
              </div>
            </div>

            {/* Files Preview */}
            <div className="flex-1 overflow-auto p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                Template Files
              </h3>

              <div className="space-y-4">
                {selectedTemplate.files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-gray-750 border-b border-gray-700">
                      <span className="font-mono text-sm text-blue-400">
                        {file.path}
                      </span>
                      <button
                        onClick={() => handleCopyFile(file.path, file.content)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                      >
                        {copiedFile === file.path ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm bg-gray-900">
                      <code className="text-gray-300">{file.content}</code>
                    </pre>
                  </div>
                ))}
              </div>

              {/* Dependencies */}
              <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  Dependencies
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedTemplate.dependencies).map(([pkg, version]) => (
                    <div
                      key={pkg}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm"
                    >
                      <span className="font-mono">{pkg}</span>
                      <span className="text-gray-400">{version}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a template to get started</p>
              <p className="text-sm mt-2">Choose from 6 government-optimized project scaffolds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTemplates;
