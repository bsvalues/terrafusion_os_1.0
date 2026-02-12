import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map,
  Layers,
  BarChart4,
  Box,
  Mountain,
  Compass,
  PieChart,
  LineChart,
  Home,
  Boxes,
  TrendingUp,
  Eye,
  GitFork,
 } from '@mui/icons-material';

/**
 * GIS Hub Page
 *
 * Central page for accessing all GIS-related features and demos:
 * - Advanced clustering
 * - 3D terrain visualization
 * - Predictive analysis
 * - Data exploration tools
 */
export default function GISHub() {
  return (
    <>
      <Helmet>
        <title>GIS Hub | Terrafusion</title>
      </Helmet>

      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
<>
              <Map className="h-8 w-8 mr-3 text-primary" />
              GIS Analysis Hub
            </h1>

            <p
</> className="text-muted-foreground">
              Advanced geospatial intelligence tools for comprehensive visualization and analysis
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 3D Terrain Visualization */}
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center">
<>
                  <Box className="h-5 w-5 mr-2 text-primary" />
                  3D Terrain Visualization
                </CardTitle>
                <Badge
</> variant="outline" className="bg-primary/10">
                  New
                </Badge>
              </div>

              <CardDescription>
                Advanced 3D terrain rendering with property extrusion
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Mountain className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Explore property data in true 3D with dynamic terrain rendering, property
                  extrusion, and interactive viewshed analysis.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    3D Terrain
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Viewshed Analysis
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Dynamic Lighting
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/gis/terrain-3d">
                  <Mountain className="h-4 w-4 mr-2" />
                  Explore Terrain 3D
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Advanced Clustering */}
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Boxes className="h-5 w-5 mr-2 text-primary" />
                  Advanced Clustering
                </CardTitle>
              </div>

              <CardDescription>
                Enhanced property clustering with data visualization
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <PieChart className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Visualize property distribution using advanced clustering algorithms with dynamic
                  pie charts showing property type distribution.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    Pie Charts
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Animated Clusters
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Interactive Controls
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/gis/advanced-clustering">
                  <Boxes className="h-4 w-4 mr-2" />
                  View Advanced Clustering
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Basic Clustering Demo */}
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center">
<>
                <Layers className="h-5 w-5 mr-2 text-primary" />
                Basic Clustering Demo
              </CardTitle>

              <CardDescription
</>>Animated clustering with interactive controls</CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Layers className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Basic demonstration of dynamic clustering capabilities with animated transitions
                  and interactive data refresh.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    Simple Clustering
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Animations
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Data Refresh
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/gis/clustering-demo">
                  <Layers className="h-4 w-4 mr-2" />
                  View Clustering Demo
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Upcoming: Predictive Analysis Module */}
          <Card className="group hover:shadow-lg transition-shadow opacity-80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center">
<>
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Predictive Analysis
                </CardTitle>
                <Badge
</> variant="outline">Coming Soon</Badge>
              </div>

              <CardDescription>AI-powered predictive property analysis</CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <TrendingUp className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Analyze property trends with AI-powered predictive models that forecast future
                  property values and market trends.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    AI Prediction
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Market Trends
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Value Forecasting
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button disabled className="w-full" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardFooter>
          </Card>

          {/* Upcoming: Viewshed Analysis */}
          <Card className="group hover:shadow-lg transition-shadow opacity-80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center">
<>
                  <Eye className="h-5 w-5 mr-2 text-primary" />
                  Viewshed Analysis
                </CardTitle>
                <Badge
</> variant="outline">Coming Soon</Badge>
              </div>

              <CardDescription>Advanced visibility and viewshed calculations</CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Eye className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Calculate and visualize what's visible from any point on the terrain, taking into
                  account elevation, buildings, and natural obstructions.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    Visibility Analysis
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Line of Sight
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Impact Assessment
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button disabled className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardFooter>
          </Card>

          {/* Upcoming: Workflow Automation */}
          <Card className="group hover:shadow-lg transition-shadow opacity-80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center">
<>
                  <GitFork className="h-5 w-5 mr-2 text-primary" />
                  GIS Workflows
                </CardTitle>
                <Badge
</> variant="outline">Coming Soon</Badge>
              </div>

              <CardDescription>Automated geospatial analysis workflows</CardDescription>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <GitFork className="h-16 w-16 text-primary/40" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
<>
                <p className="text-sm text-muted-foreground">
                  Create and run automated geospatial analysis workflows combining multiple analysis
                  tools in sequence with visual workflow designer.
                </p>

                <div
</> className="flex flex-wrap gap-2">
<>
                  <Badge variant="secondary" className="text-xs">
                    Workflow Designer
                  </Badge>
                  <Badge
</> variant="secondary" className="text-xs">
                    Batch Processing
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Scheduled Analysis
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button disabled className="w-full" variant="outline">
                <GitFork className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Resources Section */}
        <div className="mt-12">
<>
          <h2 className="text-2xl font-bold mb-4">GIS Resources</h2>

          <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Documentation</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access comprehensive documentation on using the Terrafusion GIS platform.
                </p>
              </CardContent>

              <CardFooter>
                <Button variant="ghost" className="w-full" disabled>
                  View Documentation
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Data Import Guides</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how to import and use your own GIS data within the Terrafusion platform.
                </p>
              </CardContent>

              <CardFooter>
                <Button variant="ghost" className="w-full" disabled>
                  View Guides
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">QGIS Integration</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore resources for integrating with the powerful open-source QGIS software.
                </p>
              </CardContent>

              <CardFooter>
                <Button variant="ghost" className="w-full" disabled>
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
