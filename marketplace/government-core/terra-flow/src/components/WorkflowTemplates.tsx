import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter,
  Star,
  Clock,
  Users,
  ArrowRight,
  X,
  Play,
  Download,
  Tag,
  Zap,
  Settings,
  ChevronRight,
  Grid,
  List,
  BookOpen,
  Rocket
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  usageCount: number;
  rating: number;
  author: string;
  version: string;
  thumbnail: string;
  steps: TemplateStep[];
  isPopular: boolean;
  isPremium: boolean;
}

interface TemplateStep {
  id: string;
  type: string;
  name: string;
  description: string;
  config: any;
}

interface WorkflowTemplatesProps {
  className?: string;
  onTemplateSelect?: (template: WorkflowTemplate) => void;
  onCreateFromTemplate?: (template: WorkflowTemplate) => void;
}

const categories = [
  'All',
  'Data Processing',
  'Automation',
  'Notifications',
  'Integrations',
  'Analytics',
  'DevOps',
  'Marketing',
  'Finance',
  'HR'
];

const mockTemplates: WorkflowTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Daily Data Backup',
    description: 'Automatically backup database and files to cloud storage with email notifications',
    category: 'Data Processing',
    tags: ['backup', 'database', 'cloud', 'scheduled'],
    difficulty: 'Beginner',
    estimatedTime: '15 minutes',
    usageCount: 1250,
    rating: 4.8,
    author: 'TerraFusion Team',
    version: '2.1.0',
    thumbnail: 'backup.jpg',
    isPopular: true,
    isPremium: false,
    steps: [
      { id: 'step-1', type: 'database', name: 'Export Database', description: 'Create database dump', config: {} },
      { id: 'step-2', type: 'cloud', name: 'Upload to Cloud', description: 'Upload files to storage', config: {} },
      { id: 'step-3', type: 'notification', name: 'Send Notification', description: 'Email backup status', config: {} }
    ]
  },
  {
    id: 'tmpl-2',
    name: 'Customer Onboarding Flow',
    description: 'Complete customer onboarding with account creation, welcome emails, and team assignments',
    category: 'Automation',
    tags: ['customer', 'onboarding', 'email', 'crm'],
    difficulty: 'Intermediate',
    estimatedTime: '30 minutes',
    usageCount: 890,
    rating: 4.9,
    author: 'Alex Chen',
    version: '1.8.3',
    thumbnail: 'onboarding.jpg',
    isPopular: true,
    isPremium: true,
    steps: [
      { id: 'step-1', type: 'form', name: 'Account Creation', description: 'Create customer account', config: {} },
      { id: 'step-2', type: 'email', name: 'Welcome Email', description: 'Send welcome message', config: {} },
      { id: 'step-3', type: 'crm', name: 'CRM Integration', description: 'Add to CRM system', config: {} },
      { id: 'step-4', type: 'assignment', name: 'Team Assignment', description: 'Assign to team', config: {} }
    ]
  },
  {
    id: 'tmpl-3',
    name: 'Social Media Posting',
    description: 'Schedule and publish content across multiple social media platforms automatically',
    category: 'Marketing',
    tags: ['social', 'content', 'scheduling', 'marketing'],
    difficulty: 'Beginner',
    estimatedTime: '20 minutes',
    usageCount: 650,
    rating: 4.6,
    author: 'Marketing Pro',
    version: '3.2.1',
    thumbnail: 'social.jpg',
    isPopular: false,
    isPremium: false,
    steps: [
      { id: 'step-1', type: 'content', name: 'Content Preparation', description: 'Format content for platforms', config: {} },
      { id: 'step-2', type: 'scheduling', name: 'Schedule Posts', description: 'Set publishing times', config: {} },
      { id: 'step-3', type: 'publish', name: 'Publish Content', description: 'Post to platforms', config: {} }
    ]
  },
  {
    id: 'tmpl-4',
    name: 'Invoice Processing',
    description: 'Automated invoice generation, approval workflow, and payment tracking system',
    category: 'Finance',
    tags: ['invoice', 'finance', 'approval', 'payment'],
    difficulty: 'Advanced',
    estimatedTime: '45 minutes',
    usageCount: 420,
    rating: 4.7,
    author: 'FinTech Solutions',
    version: '2.5.0',
    thumbnail: 'invoice.jpg',
    isPopular: false,
    isPremium: true,
    steps: [
      { id: 'step-1', type: 'generation', name: 'Generate Invoice', description: 'Create invoice from data', config: {} },
      { id: 'step-2', type: 'approval', name: 'Approval Flow', description: 'Route for approval', config: {} },
      { id: 'step-3', type: 'payment', name: 'Payment Tracking', description: 'Track payment status', config: {} },
      { id: 'step-4', type: 'notification', name: 'Status Updates', description: 'Notify stakeholders', config: {} }
    ]
  },
  {
    id: 'tmpl-5',
    name: 'Deployment Pipeline',
    description: 'CI/CD pipeline with testing, building, and deployment to multiple environments',
    category: 'DevOps',
    tags: ['deployment', 'ci/cd', 'testing', 'automation'],
    difficulty: 'Advanced',
    estimatedTime: '60 minutes',
    usageCount: 380,
    rating: 4.9,
    author: 'DevOps Team',
    version: '4.1.2',
    thumbnail: 'deployment.jpg',
    isPopular: true,
    isPremium: false,
    steps: [
      { id: 'step-1', type: 'testing', name: 'Run Tests', description: 'Execute test suites', config: {} },
      { id: 'step-2', type: 'build', name: 'Build Application', description: 'Compile and package', config: {} },
      { id: 'step-3', type: 'deploy', name: 'Deploy to Staging', description: 'Deploy to staging environment', config: {} },
      { id: 'step-4', type: 'deploy', name: 'Deploy to Production', description: 'Deploy to production', config: {} }
    ]
  },
  {
    id: 'tmpl-6',
    name: 'Lead Qualification',
    description: 'Score and qualify leads based on engagement, demographics, and behavior patterns',
    category: 'Analytics',
    tags: ['leads', 'scoring', 'analytics', 'qualification'],
    difficulty: 'Intermediate',
    estimatedTime: '25 minutes',
    usageCount: 720,
    rating: 4.5,
    author: 'Sales Analytics',
    version: '1.9.1',
    thumbnail: 'leads.jpg',
    isPopular: false,
    isPremium: true,
    steps: [
      { id: 'step-1', type: 'data', name: 'Collect Data', description: 'Gather lead information', config: {} },
      { id: 'step-2', type: 'scoring', name: 'Score Lead', description: 'Calculate lead score', config: {} },
      { id: 'step-3', type: 'qualification', name: 'Qualify Lead', description: 'Determine qualification', config: {} }
    ]
  }
];

export const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  className,
  onTemplateSelect,
  onCreateFromTemplate
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(mockTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'rating' | 'recent'>('usage');

  useEffect(() => {
    let filtered = templates;

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return a.name.localeCompare(b.name); // Mock recent sort
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, sortBy]);

  const handleTemplateClick = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDetails(true);
    onTemplateSelect?.(template);
  };

  const handleCreateFromTemplate = (template: WorkflowTemplate) => {
    onCreateFromTemplate?.(template);
    setShowTemplateDetails(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className={`workflow-templates h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Workflow Templates</h1>
          </div>
          <p className="text-blue-100 text-lg">Choose from pre-built automation workflows</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="usage">Most Used</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name</option>
              <option value="recent">Recently Added</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <BookOpen className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                    viewMode === 'list' ? 'p-6' : 'p-4'
                  }`}
                  onClick={() => handleTemplateClick(template)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {template.isPopular && (
                              <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                                Popular
                              </div>
                            )}
                            {template.isPremium && (
                              <div className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                                Premium
                              </div>
                            )}
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Star className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>

                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                            {template.difficulty}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {template.estimatedTime}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {formatUsageCount(template.usageCount)} uses
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                            {template.rating}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateClick(template);
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-3 h-3" />
                          Use
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <div className="flex items-center gap-2">
                              {template.isPopular && (
                                <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                                  Popular
                                </div>
                              )}
                              {template.isPremium && (
                                <div className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                                  Premium
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{template.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </span>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {template.estimatedTime}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {formatUsageCount(template.usageCount)} uses
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1 fill-current text-yellow-400" />
                              {template.rating}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTemplateClick(template);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Use Template
                          </motion.button>
                          <button className="text-gray-400 hover:text-gray-600 p-2">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Details Modal */}
      <AnimatePresence>
        {showTemplateDetails && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => setShowTemplateDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Difficulty</h4>
                    <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                      {selectedTemplate.difficulty}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Estimated Time</h4>
                    <p className="text-gray-600">{selectedTemplate.estimatedTime}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Usage Count</h4>
                    <p className="text-gray-600">{selectedTemplate.usageCount.toLocaleString()} times</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Workflow Steps</h4>
                  <div className="space-y-3">
                    {selectedTemplate.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{step.name}</h5>
                          <p className="text-gray-600 text-sm">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTemplateDetails(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleCreateFromTemplate(selectedTemplate);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Create Workflow
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowTemplates;
