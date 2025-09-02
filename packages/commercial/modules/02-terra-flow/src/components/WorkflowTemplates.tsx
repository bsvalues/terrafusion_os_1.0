import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText,
  Database,
  Calculator,
  BarChart,
  Users,
  Clock,
  Zap,
  Copy,
  Play,
  Star,
  Tag,
  Search,
  Filter
 } from '@mui/icons-material';

// Workflow template definitions
export const WORKFLOW_TEMPLATES = [
  {
    id: 'data-sync-pipeline',
    name: 'Multi-App Data Synchronization',
    description: 'Automatically sync data between Terrafusion apps when changes occur',
    category: 'data',
    complexity: 'intermediate',
    estimatedTime: '15 min',
    icon: Database,
    color: 'from-blue-500 to-cyan-600',
    tags: ['sync', 'database', 'automation'],
    apps: ['terra-agent', 'costforge-ai', 'gispro', 'terra-insight'],
    steps: 8,
    template: {
      name: 'Multi-App Data Synchronization',
      description: 'Sync property data across all Terrafusion applications',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: 'Database Change Trigger',
          description: 'Monitors property database for changes',
          position: { x: 100, y: 100 },
          config: { table: 'properties', events: ['insert', 'update'] }
        },
        {
          id: 'action_1',
          type: 'action',
          name: 'Data Validation',
          description: 'Validate incoming property data',
          position: { x: 350, y: 100 },
          config: { rules: ['required_fields', 'data_types'] }
        },
        {
          id: 'action_2',
          type: 'action',
          name: 'Update CostForge AI',
          description: 'Push data to cost analysis system',
          position: { x: 600, y: 50 },
          config: { endpoint: '/api/properties', method: 'POST' }
        },
        {
          id: 'action_3',
          type: 'action',
          name: 'Update GIS Pro',
          description: 'Update GIS mapping data',
          position: { x: 600, y: 150 },
          config: { endpoint: '/api/gis/properties', method: 'PUT' }
        },
        {
          id: 'action_4',
          type: 'action',
          name: 'Notify Stakeholders',
          description: 'Send email notifications',
          position: { x: 850, y: 100 },
          config: { recipients: ['admin@terrafusion.com'], template: 'property_update' }
        }
      ]
    }
  },
  {
    id: 'automated-reporting',
    name: 'Automated Report Generation',
    description: 'Generate and distribute comprehensive reports across all Terrafusion modules',
    category: 'reporting',
    complexity: 'advanced',
    estimatedTime: '20 min',
    icon: FileText,
    color: 'from-green-500 to-emerald-600',
    tags: ['reports', 'automation', 'scheduling'],
    apps: ['terra-insight', 'costforge-ai', 'gispro', 'marketplace'],
    steps: 12,
    template: {
      name: 'Automated Report Generation',
      description: 'Weekly comprehensive property analysis report',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: 'Weekly Schedule',
          description: 'Runs every Monday at 9 AM',
          position: { x: 100, y: 100 },
          config: { cron: '0 9 * * 1', timezone: 'America/New_York' }
        },
        {
          id: 'action_1',
          type: 'action',
          name: 'Collect Property Data',
          description: 'Gather data from all modules',
          position: { x: 350, y: 100 },
          config: { sources: ['properties', 'valuations', 'market_data'] }
        },
        {
          id: 'action_2',
          type: 'action',
          name: 'Generate Analytics',
          description: 'Run cost and market analysis',
          position: { x: 600, y: 100 },
          config: { analysis_types: ['cost_trends', 'market_comparison', 'roi_analysis'] }
        },
        {
          id: 'action_3',
          type: 'action',
          name: 'Create PDF Report',
          description: 'Generate formatted PDF report',
          position: { x: 850, y: 100 },
          config: { template: 'weekly_analysis', include_charts: true }
        },
        {
          id: 'action_4',
          type: 'action',
          name: 'Distribute Report',
          description: 'Email report to stakeholders',
          position: { x: 1100, y: 100 },
          config: { distribution_list: 'weekly_reports', attach_data: true }
        }
      ]
    }
  },
  {
    id: 'property-valuation-automation',
    name: 'Smart Property Valuation Pipeline',
    description: 'Automatically assess and update property valuations using AI and market data',
    category: 'valuation',
    complexity: 'advanced',
    estimatedTime: '25 min',
    icon: Calculator,
    color: 'from-purple-500 to-violet-600',
    tags: ['ai', 'valuation', 'market-analysis'],
    apps: ['costforge-ai', 'terra-assessor', 'marketplace', 'gispro'],
    steps: 15,
    template: {
      name: 'Smart Property Valuation Pipeline',
      description: 'AI-powered property valuation with market analysis',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: 'New Property Added',
          description: 'Triggered when new property is added',
          position: { x: 100, y: 100 },
          config: { table: 'properties', event: 'insert' }
        },
        {
          id: 'action_1',
          type: 'action',
          name: 'Gather Property Details',
          description: 'Collect comprehensive property information',
          position: { x: 350, y: 100 },
          config: { fields: ['location', 'size', 'type', 'age', 'condition'] }
        },
        {
          id: 'action_2',
          type: 'action',
          name: 'GIS Analysis',
          description: 'Perform geographic and location analysis',
          position: { x: 600, y: 50 },
          config: { analysis: ['proximity', 'zoning', 'environmental_factors'] }
        },
        {
          id: 'action_3',
          type: 'action',
          name: 'Market Comparison',
          description: 'Compare with similar properties',
          position: { x: 600, y: 150 },
          config: { radius: '2_miles', similarity_threshold: 0.8 }
        },
        {
          id: 'action_4',
          type: 'action',
          name: 'AI Valuation Model',
          description: 'Run AI-powered valuation',
          position: { x: 850, y: 100 },
          config: { model: 'terrafusion_v3', confidence_threshold: 0.85 }
        },
        {
          id: 'action_5',
          type: 'action',
          name: 'Update Property Record',
          description: 'Save valuation to database',
          position: { x: 1100, y: 100 },
          config: { table: 'property_valuations', include_metadata: true }
        }
      ]
    }
  },
  {
    id: 'compliance-monitoring',
    name: 'Regulatory Compliance Monitor',
    description: 'Monitor and ensure compliance across all Terrafusion operations',
    category: 'compliance',
    complexity: 'intermediate',
    estimatedTime: '18 min',
    icon: Users,
    color: 'from-orange-500 to-red-600',
    tags: ['compliance', 'monitoring', 'alerts'],
    apps: ['web-audit-tracker', 'terra-agent', 'terra-assessor'],
    steps: 10,
    template: {
      name: 'Regulatory Compliance Monitor',
      description: 'Continuous compliance monitoring and alerting',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: 'Daily Compliance Check',
          description: 'Run compliance checks every day',
          position: { x: 100, y: 100 },
          config: { cron: '0 8 * * *', timezone: 'UTC' }
        },
        {
          id: 'action_1',
          type: 'action',
          name: 'Audit Data Quality',
          description: 'Check data integrity and completeness',
          position: { x: 350, y: 100 },
          config: { checks: ['completeness', 'accuracy', 'consistency'] }
        },
        {
          id: 'condition_1',
          type: 'condition',
          name: 'Compliance Status',
          description: 'Check if all standards are met',
          position: { x: 600, y: 100 },
          config: { threshold: 0.95, action_on_fail: 'alert' }
        },
        {
          id: 'action_2',
          type: 'action',
          name: 'Generate Compliance Report',
          description: 'Create detailed compliance report',
          position: { x: 850, y: 50 },
          config: { format: 'pdf', include_recommendations: true }
        },
        {
          id: 'action_3',
          type: 'action',
          name: 'Send Alert',
          description: 'Alert compliance team of issues',
          position: { x: 850, y: 150 },
          config: { severity: 'high', recipients: ['compliance@terrafusion.com'] }
        }
      ]
    }
  },
  {
    id: 'market-analysis-pipeline',
    name: 'Real Estate Market Analysis',
    description: 'Comprehensive market trend analysis and forecasting pipeline',
    category: 'analytics',
    complexity: 'advanced',
    estimatedTime: '30 min',
    icon: BarChart,
    color: 'from-teal-500 to-cyan-600',
    tags: ['market-analysis', 'forecasting', 'trends'],
    apps: ['marketplace', 'terra-insight', 'costforge-ai', 'gispro'],
    steps: 18,
    template: {
      name: 'Real Estate Market Analysis',
      description: 'Automated market trend analysis and forecasting',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: 'Market Data Update',
          description: 'Triggered when new market data arrives',
          position: { x: 100, y: 100 },
          config: { sources: ['mls', 'public_records', 'economic_indicators'] }
        },
        {
          id: 'action_1',
          type: 'action',
          name: 'Data Aggregation',
          description: 'Collect and normalize market data',
          position: { x: 350, y: 100 },
          config: { time_period: '12_months', regions: 'all_active' }
        },
        {
          id: 'action_2',
          type: 'action',
          name: 'Trend Analysis',
          description: 'Identify market trends and patterns',
          position: { x: 600, y: 100 },
          config: { algorithms: ['time_series', 'regression', 'seasonal_decomposition'] }
        },
        {
          id: 'action_3',
          type: 'action',
          name: 'Generate Forecasts',
          description: 'Create market predictions',
          position: { x: 850, y: 100 },
          config: { horizon: '6_months', confidence_interval: 0.95 }
        },
        {
          id: 'action_4',
          type: 'action',
          name: 'Update Dashboards',
          description: 'Refresh all market dashboards',
          position: { x: 1100, y: 100 },
          config: { dashboards: ['executive', 'operational', 'public'] }
        }
      ]
    }
  }
];

// Template categories for filtering
export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Star },
  { id: 'data', name: 'Data & Sync', icon: Database },
  { id: 'reporting', name: 'Reporting', icon: FileText },
  { id: 'valuation', name: 'Valuation', icon: Calculator },
  { id: 'compliance', name: 'Compliance', icon: Users },
  { id: 'analytics', name: 'Analytics', icon: BarChart }
];

// Complexity levels
export const COMPLEXITY_LEVELS = {
  beginner: { color: 'text-green-600 bg-green-100', label: 'Beginner' },
  intermediate: { color: 'text-yellow-600 bg-yellow-100', label: 'Intermediate' },
  advanced: { color: 'text-red-600 bg-red-100', label: 'Advanced' }
};

interface WorkflowTemplatesProps {
  onSelectTemplate: (template: any) => void;
  onClose: () => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] mx-4 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div><>

              <h2 className="text-2xl font-bold">Workflow Templates</h2>
              <p
</> className="text-blue-100 mt-1">Choose from pre-built automation workflows</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-8rem)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <h3 className="font-medium text-gray-700 mb-3">Categories</h3>
              {TEMPLATE_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4"><>

                  <Filter className="w-16 h-16 mx-auto" />
                </div>
                <h3
</> className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTemplates.map(template => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${template.color} text-white`}><>

                          <template.icon className="w-6 h-6" />
                        </div>
                        <div
</>><>

                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <div
</> className="flex items-center space-x-2 mt-1"><>

                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              COMPLEXITY_LEVELS[template.complexity as keyof typeof COMPLEXITY_LEVELS].color
                            }`}>
                              {COMPLEXITY_LEVELS[template.complexity as keyof typeof COMPLEXITY_LEVELS].label}
                            </span>
                            <span
</> className="text-xs text-gray-500">
                              <Clock className="w-3 h-3 inline-block mr-1" />
                              {template.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div><>


                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

                    <div
</> className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3 inline-block mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between"><>

                      <div className="text-sm text-gray-500">
                        {template.steps} steps • {template.apps.length} apps
                      </div>
                      <div
</> className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><>

                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                        <motion
</>.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTemplate(template.template);
                            onClose();
                          }}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
                        >
                          <Play className="w-3 h-3" />
                          <span>Use</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Detail Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedTemplate.color} text-white`}><>

                      <selectedTemplate.icon className="w-6 h-6" />
                    </div>
                    <div
</>><>

                      <h3 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h3>
                      <p
</> className="text-gray-600">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg"><>

                      <h4 className="font-medium text-gray-900 mb-2">Complexity</h4>
                      <span
</> className={`px-3 py-1 rounded-full text-sm font-medium ${
                        COMPLEXITY_LEVELS[selectedTemplate.complexity as keyof typeof COMPLEXITY_LEVELS].color
                      }`}>
                        {COMPLEXITY_LEVELS[selectedTemplate.complexity as keyof typeof COMPLEXITY_LEVELS].label}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg"><>

                      <h4 className="font-medium text-gray-900 mb-2">Setup Time</h4>
                      <p
</> className="text-gray-600">{selectedTemplate.estimatedTime}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg"><>

                    <h4 className="font-medium text-gray-900 mb-2">Connected Apps</h4>
                    <div
</> className="flex flex-wrap gap-2">
                      {selectedTemplate.apps.map((app: string) => (
                        <span
                          key={app}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        >
                          {app.replace('-', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg"><>

                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div
</> className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3"><>

                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <motion
</>.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectTemplate(selectedTemplate.template);
                      setSelectedTemplate(null);
                      onClose();
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Create Workflow</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default WorkflowTemplates;