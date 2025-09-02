import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, 
  Download, 
  Star, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
 } from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  ratingCount: number;
  price: number;
  isInstalled: boolean;
  isGovernmentCertified: boolean;
}

interface PluginCategory {
  name: string;
  count: number;
  icon: string;
}

interface RevenueData {
  pluginId: string;
  pluginName: string;
  revenue: number;
  installations: number;
  growth: number;
}

export default function PluginMarketplaceLauncher() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      const [pluginsResponse, categoriesResponse, revenueResponse] = await Promise.all([
        fetch('/api/marketplace/plugins'),
        fetch('/api/marketplace/categories'),
        fetch('/api/marketplace/revenue')
      ]);

      if (pluginsResponse.ok) {
        const pluginsData = await pluginsResponse.json();
        setPlugins(pluginsData.plugins || []);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData || []);
      }

      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueData(revenueData || []);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const installPlugin = async (pluginId: string) => {
    try {
      setInstalling(pluginId);
      
      const response = await fetch(`/api/marketplace/plugins/${pluginId}/download`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        setPlugins(prev => prev.map(plugin => 
          plugin.id === pluginId 
            ? { ...plugin, isInstalled: true }
            : plugin
        ));

        // Show success notification
        showNotification('Plugin installed successfully!', 'success');
      } else {
        throw new Error('Failed to install plugin');
      }
    } catch (error) {
      console.error('Error installing plugin:', error);
      showNotification('Failed to install plugin', 'error');
    } finally {
      setInstalling(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Implementation for showing notifications
    console.log(`${type}: ${message}`);
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPlugins = [...filteredPlugins].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      default:
        return b.downloads - a.downloads;
    }
  });

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalInstallations = revenueData.reduce((sum, item) => sum + item.installations, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-gradient">Plugin Marketplace</h1>
          <p
</>
className="text-muted-foreground">Discover and install powerful government plugins</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center"><>

            <Package className="h-4 w-4 mr-1" />
            {plugins.length} Plugins
          </Badge>
          <Badge
</>
variant="outline" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            ${totalRevenue.toLocaleString()}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger
</>
value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1"><>

              <Input
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
</>
value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48"><>

                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent
</>
</>>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40"><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</>
</>><>

                <SelectItem value="downloads">Most Popular</SelectItem>
                <SelectItem
</>
value="rating">Highest Rated</SelectItem><>

                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem
</>
value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlugins.map((plugin) => (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{plugin.name}</span>
                          {plugin.isGovernmentCertified && (<>

                            <Shield className="h-4 w-4 text-green-500" />
                          )}
                        </CardTitle>
                        <p
</>
className="text-sm text-muted-foreground">v{plugin.version}</p>
                      </div>
                      <Badge variant={plugin.isInstalled ? "default" : "secondary"}>
                        {plugin.isInstalled ? "Installed" : `$${plugin.price}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4"><>

                    <p className="text-sm">{plugin.description}</p>
                    
                    <div
</>
className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center"><>

                        <Download className="h-4 w-4 mr-1" />
                        {plugin.downloads.toLocaleString()}
                      </span>
                      <span
</>
className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {plugin.rating} ({plugin.ratingCount})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {plugin.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => installPlugin(plugin.id)}
                      disabled={plugin.isInstalled || installing === plugin.id}
                      className="w-full"
                    >
                      {installing === plugin.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Installing...
                      ) : plugin.isInstalled ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Installed
                      ) : (
                          <Download className="h-4 w-4 mr-2" />
                          Install
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p
</>
className="text-sm text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Total Installations
                </CardTitle>
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">{totalInstallations.toLocaleString()}</div>
                <p
</>
className="text-sm text-muted-foreground">Active installations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold text-green-600">+24%</div>
                <p
</>
className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plugin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.map((item) => (
                  <div key={item.pluginId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div><>

                      <h4 className="font-medium">{item.pluginName}</h4>
                      <p
</>
className="text-sm text-muted-foreground">
                        {item.installations} installations
                      </p>
                    </div>
                    <div className="text-right"><>

                      <div className="font-bold">${item.revenue.toLocaleString()}</div>
                      <div
</>
className="text-sm text-green-600">+{item.growth}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.filter(p => p.isInstalled).map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    {plugin.name}
                  </CardTitle>
                </CardHeader>
                <CardContent><>

                  <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                  <div
</>
className="flex items-center justify-between"><>

                    <Badge variant="outline">v{plugin.version}</Badge>
                    <Button
</>
variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
