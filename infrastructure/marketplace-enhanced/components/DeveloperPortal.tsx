/**
 * Terrafusion Developer Portal
 * Comprehensive dashboard for plugin developers
 */

import React, { useState, useEffect } from 'react';
import { Code, Package, TrendingUp, Users, DollarSign, Star,
  Download, Activity, AlertCircle, CheckCircle, Clock,
  Plus, Settings, Upload, Eye, Edit, Trash2, ExternalLink,
  BarChart3, PieChart, Calendar, MessageSquare, Book,
  Shield, Award, Zap, GitBranch, Terminal, FileText
 } from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'published' | 'draft' | 'review' | 'rejected';
  downloads: number;
  rating: number;
  reviews: number;
  revenue: number;
  last_updated: string;
  tier: 'foundation' | 'professional' | 'enterprise';
  category: string;
  compliance_score: number;
  security_score: number;
}

interface DeveloperStats {
  total_plugins: number;
  total_downloads: number;
  total_revenue: number;
  avg_rating: number;
  active_installations: number;
  monthly_growth: number;
  certification_level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface DeveloperPortalProps {
  developerId: string;
  onPluginCreate?: () => void;
  onPluginEdit?: (pluginId: string) => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  developerId,
  onPluginCreate,
  onPluginEdit
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plugins' | 'analytics' | 'community' | 'resources'>('overview');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeveloperData();
  }, [developerId]);

  const loadDeveloperData = async () => {
    setLoading(true);
    try {
      // Mock data - would be API calls in production
      const mockPlugins: Plugin[] = [
        {
          id: 'property-analyzer',
          name: 'Property Analyzer Pro',
          version: '2.1.0',
          description: 'Advanced property analysis and valuation tool',
          status: 'published',
          downloads: 1247,
          rating: 4.8,
          reviews: 23,
          revenue: 12450,
          last_updated: '2025-07-28',
          tier: 'professional',
          category: 'Assessment & Valuation',
          compliance_score: 96,
          security_score: 94
        },
        {
          id: 'budget-tracker',
          name: 'County Budget Tracker',
          version: '1.0.3',
          description: 'Real-time budget monitoring and alerts',
          status: 'published',
          downloads: 892,
          rating: 4.6,
          reviews: 18,
          revenue: 0,
          last_updated: '2025-07-25',
          tier: 'foundation',
          category: 'Financial Management',
          compliance_score: 92,
          security_score: 89
        }
      ];

      const mockStats: DeveloperStats = {
        total_plugins: 3,
        total_downloads: 2139,
        total_revenue: 12450,
        avg_rating: 4.7,
        active_installations: 1847,
        monthly_growth: 23.5,
        certification_level: 'gold'
      };

      setPlugins(mockPlugins);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load developer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64"><>

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span
</>
className="ml-2 text-gray-600">Loading developer portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center"><>

                  <Code className="w-5 h-5 text-white" />
                </div>
                <h1
</>
className="text-xl font-bold text-gray-900">Developer Portal</h1>
              </div>
              
              {/* Certification Badge */}
              {stats && (
                <div className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                  stats.certification_level === 'platinum' ? 'bg-purple-100 text-purple-800' :
                  stats.certification_level === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                  stats.certification_level === 'silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  <Award className="w-3 h-3" />
                  <span>{stats.certification_level.charAt(0).toUpperCase() + stats.certification_level.slice(1)} Developer</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onPluginCreate}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Plugin</span>
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'plugins', label: 'My Plugins', icon: Package },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
              { key: 'community', label: 'Community', icon: MessageSquare },
              { key: 'resources', label: 'Resources', icon: Book }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && stats && (
          <OverviewTab stats={stats} plugins={plugins} />
        )}

        {activeTab === 'plugins' && (
          <PluginsTab plugins={plugins} onEdit={onPluginEdit} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab plugins={plugins} stats={stats} />
        )}

        {activeTab === 'community' && (
          <CommunityTab />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab />
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ stats: DeveloperStats; plugins: Plugin[] }> = ({ stats, plugins }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Downloads"
        value={stats.total_downloads.toLocaleString()}
        change="+23.5%"
        icon={<Download className="w-6 h-6 text-indigo-600" />}
        trend="up"
      />
      <StatCard
        title="Revenue"
        value={`$${(stats.total_revenue / 1000).toFixed(1)}k`}
        change="+18.2%"
        icon={<DollarSign className="w-6 h-6 text-green-600" />}
        trend="up"
      />
      <StatCard
        title="Average Rating"
        value={stats.avg_rating.toFixed(1)}
        change="+0.3"
        icon={<Star className="w-6 h-6 text-yellow-500" />}
        trend="up"
      />
      <StatCard
        title="Active Installs"
        value={stats.active_installations.toLocaleString()}
        change="+15.7%"
        icon={<Activity className="w-6 h-6 text-purple-600" />}
        trend="up"
      />
    </div>

    {/* Recent Activity and Performance */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6"><>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div
</>
className="space-y-4">
          <ActivityItem
            icon={<Download className="w-4 h-4 text-green-600" />}
            title="Property Analyzer Pro downloaded"
            description="Downloaded by King County"
            timestamp="2 hours ago"
          />
          <ActivityItem
            icon={<Star className="w-4 h-4 text-yellow-500" />}
            title="New 5-star review"
            description="Budget Tracker received excellent feedback"
            timestamp="5 hours ago"
          />
          <ActivityItem
            icon={<CheckCircle className="w-4 h-4 text-blue-600" />}
            title="Plugin approved"
            description="Smart Workflow Engine passed security review"
            timestamp="1 day ago"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6"><>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plugin Performance</h3>
        <div
</>
className="space-y-4">
          {plugins.slice(0, 3).map(plugin => (
            <div key={plugin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><>

                <p className="font-medium text-gray-900">{plugin.name}</p>
                <p
</>
className="text-sm text-gray-600">{plugin.downloads} downloads</p>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">{plugin.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Plugins Tab Component  
const PluginsTab: React.FC<{ plugins: Plugin[]; onEdit?: (pluginId: string) => void }> = ({ plugins, onEdit }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between"><>

      <h2 className="text-2xl font-bold text-gray-900">My Plugins</h2>
      <div
</>
className="flex items-center space-x-4">
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"><>

          <option>All Status</option>
          <option
</>
</>>Published</option><>

          <option>Draft</option>
          <option
</>
</>>Under Review</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {plugins.map(plugin => (
        <PluginCard key={plugin.id} plugin={plugin} onEdit={onEdit} />
      ))}
    </div>
  </div>
);

// Analytics Tab Component
const AnalyticsTab: React.FC<{ plugins: Plugin[]; stats: DeveloperStats | null }> = ({ plugins, stats }) => (
  <div className="space-y-6"><>

    <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>

    <div
</>
className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6"><>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Trends</h3>
        <div
</>
className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Chart visualization</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6"><>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h3>
        <div
</>
className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Revenue chart</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Community Tab Component
const CommunityTab: React.FC = () => (
  <div className="space-y-6"><>

    <h2 className="text-2xl font-bold text-gray-900">Developer Community</h2>
    
    <div
</>
className="bg-white rounded-lg border border-gray-200 p-6"><>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Forum Activity</h3>
      <div
</>
className="space-y-4">
        <ForumPost
          title="Best practices for county data security"
          author="john_dev"
          replies={12}
          timestamp="2 hours ago"
          tags={['security', 'best-practices']}
        />
        <ForumPost
          title="New Terrafusion SDK features in v3.1"
          author="terrafusion_team"
          replies={28}
          timestamp="5 hours ago"
          tags={['sdk', 'announcement']}
        />
      </div>
    </div>
  </div>
);

// Resources Tab Component
const ResourcesTab: React.FC = () => (
  <div className="space-y-6"><>

    <h2 className="text-2xl font-bold text-gray-900">Developer Resources</h2>

    <div
</>
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ResourceCard
        icon={<Book className="w-8 h-8 text-blue-600" />}
        title="Documentation"
        description="Complete API reference and guides"
        link="/docs"
      />
      <ResourceCard
        icon={<Code className="w-8 h-8 text-green-600" />}
        title="Code Samples"
        description="Ready-to-use plugin examples"
        link="/samples"
      />
      <ResourceCard
        icon={<Terminal className="w-8 h-8 text-purple-600" />}
        title="CLI Tools"
        description="Command-line development tools"
        link="/cli"
      />
    </div>
  </div>
);

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon, trend }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div><>

        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p
</>
className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="mt-4"><>

      <span className={`text-sm font-medium ${
        trend === 'up' ? 'text-green-600' : 
        trend === 'down' ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {change}
      </span>
      <span
</>
className="text-sm text-gray-500 ml-2">vs last period</span>
    </div>
  </div>
);

const ActivityItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
}> = ({ icon, title, description, timestamp }) => (
  <div className="flex items-start space-x-3"><>

    <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
      {icon}
    </div>
    <div
</>
className="flex-1 min-w-0"><>

      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p
</>
className="text-sm text-gray-600">{description}</p>
    </div>
    <div className="flex-shrink-0">
      <span className="text-xs text-gray-500">{timestamp}</span>
    </div>
  </div>
);

const PluginCard: React.FC<{ plugin: Plugin; onEdit?: (pluginId: string) => void }> = ({ plugin, onEdit }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4"><>

      <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
      <span
</>
className={`px-2 py-1 text-xs font-medium rounded-full ${
        plugin.status === 'published' ? 'bg-green-100 text-green-800' :
        plugin.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
        plugin.status === 'draft' ? 'bg-gray-100 text-gray-800' :
        'bg-red-100 text-red-800'
      }`}>
        {plugin.status}
      </span>
    </div><>

    <p className="text-gray-600 text-sm mb-4">{plugin.description}</p>
    
    <div
</>
className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
      <div className="flex items-center space-x-1">
        <Download className="w-4 h-4" />
        <span>{plugin.downloads}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span>{plugin.rating}</span>
      </div>
      <div className="flex items-center space-x-1">
        <DollarSign className="w-4 h-4" />
        <span>${plugin.revenue}</span>
      </div>
    </div>

    <div className="flex space-x-2"><>

      <button
        onClick={() => onEdit?.(plugin.id)}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Edit
      </button>
      <button
</>
className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
        View
      </button>
    </div>
  </div>
);

const ForumPost: React.FC<{
  title: string;
  author: string;
  replies: number;
  timestamp: string;
  tags: string[];
}> = ({ title, author, replies, timestamp, tags }) => (
  <div className="border-b border-gray-100 pb-4"><>

    <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
    <div
</>
className="flex items-center space-x-4 text-sm text-gray-600"><>

      <span>by {author}</span>
      <span
</>
</>>{replies} replies</span>
      <span>{timestamp}</span>
    </div>
    <div className="flex space-x-2 mt-2">
      {tags.map(tag => (
        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const ResourceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}> = ({ icon, title, description, link }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer">
    <div className="flex items-center space-x-3 mb-3">
      {icon}
      <h4 className="font-medium text-gray-900">{title}</h4>
    </div><>

    <p className="text-sm text-gray-600 mb-3">{description}</p>
    <a
</>
href={link} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center space-x-1"><>

      <span>Learn more</span>
      <ExternalLink
</>
className="w-3 h-3" />
    </a>
  </div>
);
