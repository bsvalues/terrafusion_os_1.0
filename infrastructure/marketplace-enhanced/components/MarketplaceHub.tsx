/**
 * Terrafusion Marketplace Hub
 * Central integration component bringing together all marketplace features
 */

import React, {useState, useEffect} from 'react';
import {Search, Grid, List, Filter, TrendingUp, Shield, 
  Settings, Bell, User, ChevronDown, Plus, Star,
  Download, Activity, BarChart3, Zap, Refresh} from '@mui/icons-material';

import {EnhancedPluginDiscovery} from './EnhancedPluginDiscovery';
import {MarketplaceDashboard} from './MarketplaceDashboard';
import {MarketplaceAnalytics} from '../services/MarketplaceAnalytics';
import {SecurityScanner} from '../services/SecurityScanner';

// Types
interface Plugin {id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tier: 'Tier1CoreFoundation' | 'Tier2CostForgeProfessional' | 'Tier3EnterpriseSuite';
  tags: string[];
  downloads: number;
  rating: number;
  compliance_score: number;
  status: 'active' | 'beta' | 'deprecated';
  icon?: string;
  featured?: boolean;
  ai_recommended?: boolean;
  last_updated: string;
  target_users: string[];}

interface CountyProfile {id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  type: 'rural' | 'urban' | 'suburban';
  population: number;
  budget: number;
  specialties: string[];
  current_plugins: string[];
  usage_patterns: Record<string, number>;}

interface MarketplaceHubProps {userRole: 'admin' | 'county' | 'developer';
  countyProfile?: CountyProfile;
  onPluginInstall?: (pluginId: string) => void;
  onPluginUninstall?: (pluginId: string) => void;}

export const MarketplaceHub: React.FC<MarketplaceHubProps> = ({userRole,
  countyProfile,
  onPluginInstall,
  onPluginUninstall}) => {const [activeTab, setActiveTab] = useState<'discover' | 'dashboard' | 'installed' | 'security'>('discover');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics] = useState(new MarketplaceAnalytics());
  const [securityScanner] = useState(new SecurityScanner());
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() =>{
    loadMarketplaceData();
    setupRealTimeUpdates();}, []);

  const loadMarketplaceData = async () => {setLoading(true);
    try {
      // Load plugins from manifest
      const manifestResponse = await fetch('/marketplace/manifest.json');
      const manifest = await manifestResponse.json();
      
      // Transform manifest apps to plugin format
      const transformedPlugins: Plugin[] = manifest.apps.map((app: any) => ({
        id: app.name,
        name: app.name,
        version: app.version,
        description: app.description,
        author: app.maintainer,
        category: app.category,
        tier: app.tier,
        tags: app.tags,
        downloads: Math.floor(Math.random() * 10000) + 1000, // Mock data
        rating: 4.0 + Math.random() * 1.0, // Mock rating 4.0-5.0
        compliance_score: app.compliance_score,
        status: app.status,
        featured: Math.random() > 0.7, // 30% chance of being featured
        ai_recommended: Math.random() > 0.8, // 20% chance of AI recommendation
        last_updated: app.registered_at,
        target_users: app.target_users}));

      setPlugins(transformedPlugins);

      // Initialize analytics with plugin data
      for (const plugin of transformedPlugins) {await analytics.addPlugin(plugin);}

      // Add county profile if available
      if (countyProfile) {await analytics.addCounty(countyProfile);}

    } catch (error) {console.error('Failed to load marketplace data:', error);} finally {setLoading(false);}
  };

  const setupRealTimeUpdates = () => {// Set up real-time notifications and updates
    const interval = setInterval(() => {
      // Mock real-time updates
      const mockNotifications = [
        {
          id: Date.now(),
          type: 'plugin_update',
          title: 'CostForgeAI Updated',
          message: 'Version 1.0.1 now available with bug fixes',
          timestamp: new Date(),
          action: 'Update Available'}
      ];
      
      if (Math.random() > 0.95) {// 5% chance every interval
        setNotifications(prev => [...mockNotifications, ...prev].slice(0, 5));}
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  };

  const handlePluginInstall = async (pluginId: string) => {try {
      // Track installation event
      await analytics.trackUsage({
        type: 'install',
        plugin_id: pluginId,
        county_id: countyProfile?.id || 'unknown',
        user_id: 'current_user',
        session_id: 'current_session',
        timestamp: new Date()});

      // Call parent handler
      onPluginInstall?.(pluginId);

      // Show success notification
      setNotifications(prev => [{
        id: Date.now(),
        type: 'success',
        title: 'Plugin Installed',
        message: `${pluginId} has been successfully installed`,
        timestamp: new Date()
      }, ...prev].slice(0, 5));

    } catch (error) {console.error('Plugin installation failed:', error);}
  };

  const handlePluginViewDetails = (pluginId: string) => {// Track view event
    analytics.trackUsage({
      type: 'view',
      plugin_id: pluginId,
      county_id: countyProfile?.id || 'unknown',
      user_id: 'current_user',
      session_id: 'current_session',
      timestamp: new Date()});
  };

  const runSecurityScan = async (pluginId: string) => {
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) return;

      // Mock plugin path - in production this would be the actual plugin directory
      const pluginPath = `/marketplace/plugins/${pluginId}`;
      
      const report = await securityScanner.scanPlugin(pluginPath, pluginId);
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'security',
        title: 'Security Scan Complete',
        message: `${pluginId} scored ${report.overall_score}/100 (${report.risk_level} risk)`,
        timestamp: new Date(),
        data: report
      }, ...prev].slice(0, 5));

    } catch (error) {console.error('Security scan failed:', error);}
  };

  if (loading) {return (<div className="flex items-center justify-center h-64"><Refresh className="w-8 h-8 animate-spin text-indigo-600" /><span className="ml-2 text-gray-600">Loading Terrafusion Marketplace...</span></div>);}

  return (<div className="min-h-screen bg-gray-50">{/* Header */}<header className="bg-white border-b border-gray-200 sticky top-0 z-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16">{/* Logo and Title */}<div className="flex items-center space-x-4"><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center"><><Zap className="w-5 h-5 text-white" /></div><h1
</>
className="text-xl font-bold text-gray-900">Terrafusion Marketplace</h1></div>{/* Role Badge */}<span className={`px-3 py-1 text-xs font-medium rounded-full ${
                userRole === 'admin' ? 'bg-red-100 text-red-800' :
                userRole === 'county' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'}`}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span></div>{/* Navigation Tabs */}<nav className="flex space-x-8"><button
                onClick={() => setActiveTab('discover')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'discover'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              ><><Search className="w-4 h-4 inline mr-2" />Discover</button><button
</>

                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              ><><BarChart3 className="w-4 h-4 inline mr-2" />Dashboard</button><button
</>

                onClick={() => setActiveTab('installed')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'installed'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              ><Download className="w-4 h-4 inline mr-2" />Installed</button>{(userRole === 'admin' || userRole === 'developer') && (<button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                ><Shield className="w-4 h-4 inline mr-2" />Security</button>)}</nav>{/* Actions */}<div className="flex items-center space-x-4">{/* Notifications */}<div className="relative"><button className="p-2 text-gray-400 hover:text-gray-600 relative"><Bell className="w-5 h-5" />{notifications.length > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.length}</span>)}</button>{/* Notification Dropdown */}
                {notifications.length > 0 && (<div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"><div className="p-4 border-b border-gray-200"><h3 className="font-medium text-gray-900">Notifications</h3></div><div className="max-h-64 overflow-y-auto">{notifications.map(notification => (<div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50"><div className="flex items-start space-x-3"><><div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'security' ? 'bg-yellow-500' :
                              'bg-blue-500'}`}></div><div
</>
className="flex-1 min-w-0"><><p className="text-sm font-medium text-gray-900">{notification.title}</p><p
</>
className="text-sm text-gray-600">{notification.message}</p><p className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleTimeString()}</p></div></div></div>))}</div></div>)}</div>{/* User Menu */}<div className="flex items-center space-x-2"><div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"><><User className="w-5 h-5 text-gray-600" /></div><ChevronDown
</>
className="w-4 h-4 text-gray-400" /></div></div></div></div></header>{/* Main Content */}<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{activeTab === 'discover' && (<EnhancedPluginDiscovery
            plugins={plugins}
            onInstall={handlePluginInstall}
            onViewDetails={handlePluginViewDetails}
            countyProfile={countyProfile} />)}

        {activeTab === 'dashboard' && (<MarketplaceDashboard
            analytics={analytics}
            userRole={userRole}
            countyId={countyProfile?.id} />)}

        {activeTab === 'installed' && (<InstalledPluginsView
            plugins={plugins.filter(p =>countyProfile?.current_plugins.includes(p.id) || Math.random() > 0.7)}
            onUninstall={onPluginUninstall}
            onSecurityScan={runSecurityScan}
          />
        )}

        {activeTab === 'security' && (userRole === 'admin' || userRole === 'developer') && (<SecurityOverview
            plugins={plugins}
            securityScanner={securityScanner}
            userRole={userRole} />)}</main>{/* Footer */}<footer className="bg-white border-t border-gray-200 mt-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="grid grid-cols-1 md:grid-cols-4 gap-8"><div><><h3 className="text-sm font-semibold text-gray-900 mb-4">Marketplace</h3><ul
</>
className="space-y-2 text-sm text-gray-600"><li><a href="#" className="hover:text-gray-900">Browse Plugins</a></li><li><a href="#" className="hover:text-gray-900">Featured Apps</a></li><li><a href="#" className="hover:text-gray-900">New Releases</a></li></ul></div><div><><h3 className="text-sm font-semibold text-gray-900 mb-4">Developers</h3><ul
</>
className="space-y-2 text-sm text-gray-600"><li><a href="#" className="hover:text-gray-900">Developer Portal</a></li><li><a href="#" className="hover:text-gray-900">API Documentation</a></li><li><a href="#" className="hover:text-gray-900">Plugin SDK</a></li></ul></div><div><><h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3><ul
</>
className="space-y-2 text-sm text-gray-600"><li><a href="#" className="hover:text-gray-900">Help Center</a></li><li><a href="#" className="hover:text-gray-900">Community Forum</a></li><li><a href="#" className="hover:text-gray-900">Contact Support</a></li></ul></div><div><><h3 className="text-sm font-semibold text-gray-900 mb-4">Terrafusion</h3><ul
</>
className="space-y-2 text-sm text-gray-600"><li><a href="#" className="hover:text-gray-900">About</a></li><li><a href="#" className="hover:text-gray-900">Security</a></li><li><a href="#" className="hover:text-gray-900">Compliance</a></li></ul></div></div><div className="mt-8 pt-8 border-t border-gray-200"><p className="text-sm text-gray-500 text-center">© 2025 Terrafusion County OS. All rights reserved. Powered by quantum-enhanced AI.</p></div></div></footer></div>
  );
};

// Installed Plugins View Component
const InstalledPluginsView: React.FC<{plugins: Plugin[];
  onUninstall?: (pluginId: string) =>void;
  onSecurityScan?: (pluginId: string) => void;}> = ({plugins, onUninstall, onSecurityScan}) => (<div className="space-y-6"><div className="flex items-center justify-between"><><h2 className="text-2xl font-bold text-gray-900">Installed Plugins</h2><span
</>
className="text-sm text-gray-600">{plugins.length} plugins installed</span></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{plugins.map(plugin => (<div key={plugin.id} className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-start justify-between mb-4"><><h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3><span
</>className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Installed</span></div><><p className="text-gray-600 text-sm mb-4">{plugin.description}</p><div
</>
className="flex items-center space-x-4 mb-4 text-sm text-gray-500"><div className="flex items-center space-x-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span>{plugin.rating.toFixed(1)}</span></div><div className="flex items-center space-x-1"><Shield className="w-4 h-4 text-green-500" /><span>{plugin.compliance_score}%</span></div><div className="flex items-center space-x-1"><Activity className="w-4 h-4" /><span>v{plugin.version}</span></div></div><div className="flex space-x-2"><><button
              onClick={() =>onSecurityScan?.(plugin.id)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Security Scan</button><button
</>onClick={() => onUninstall?.(plugin.id)}
              className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Uninstall</button></div></div>))}</div></div>
);

// Security Overview Component
const SecurityOverview: React.FC<{plugins: Plugin[];
  securityScanner: SecurityScanner;
  userRole: string;}>= ({plugins, securityScanner, userRole}) => (<div className="space-y-6"><div className="flex items-center justify-between"><><h2 className="text-2xl font-bold text-gray-900">Security Overview</h2><button
</>className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
        Run Full Scan</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-center space-x-3 mb-4"><Shield className="w-8 h-8 text-green-500" /><div><><h3 className="font-semibold text-gray-900">Security Score</h3><p
</>
className="text-2xl font-bold text-green-600">94.2%</p></div></div><p className="text-sm text-gray-600">Overall marketplace security health</p></div><div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-center space-x-3 mb-4"><TrendingUp className="w-8 h-8 text-blue-500" /><div><><h3 className="font-semibold text-gray-900">Compliance</h3><p
</>
className="text-2xl font-bold text-blue-600">98.7%</p></div></div><p className="text-sm text-gray-600">NIST & FISMA compliance rate</p></div><div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-center space-x-3 mb-4"><Activity className="w-8 h-8 text-purple-500" /><div><><h3 className="font-semibold text-gray-900">Active Scans</h3><p
</>
className="text-2xl font-bold text-purple-600">12</p></div></div><p className="text-sm text-gray-600">Ongoing security assessments</p></div></div><div className="bg-white rounded-lg border border-gray-200 p-6"><><h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Reports</h3><div
</>className="space-y-4">
        {plugins.slice(0, 5).map(plugin => (<div key={plugin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"><div className="flex items-center space-x-3"><><div className={`w-3 h-3 rounded-full ${
                plugin.compliance_score > 90 ? 'bg-green-500' :
                plugin.compliance_score > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div><div
</></>><><p className="font-medium text-gray-900">{plugin.name}</p><p
</>
className="text-sm text-gray-600">Last scanned: 2 hours ago</p></div></div><div className="flex items-center space-x-4"><><span className="text-sm font-medium text-gray-900">{plugin.compliance_score}%</span><button
</>className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View Report</button></div></div>))}</div></div></div>
);
