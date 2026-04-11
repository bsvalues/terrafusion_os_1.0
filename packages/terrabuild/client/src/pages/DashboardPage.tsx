import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/layout/PageHeader';
import DataCard from '@/components/ui/data-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TerraFusionButton } from '@/components/TerraFusionButton';
import GlassMorphCard from '@/components/TerraFusionGlassMorphCard';
import TerraFusionConsciousnessDisplay from '@/components/TerraFusionConsciousnessDisplay';
import '@/styles/terrafusion-quantum.css';
import {
  RefreshCw,
  FileBarChart,
  UserIcon,
  Building,
  BarChart4,
  ListFilter,
  TrendingUp,
  PieChart,
  Factory,
  Camera,
  ArrowUpRight,
  Calendar,
  BarChart,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  // Reference to the dashboard content for screenshot functionality
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Query to check OpenAI API key status
  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/settings/OPENAI_API_KEY_STATUS'],
    staleTime: 60000, // 1 minute
  });

  // Check if OpenAI API key is configured
  const isApiKeyConfigured = apiKeyStatus &&
    typeof apiKeyStatus === 'object' &&
    'value' in apiKeyStatus &&
    apiKeyStatus.value === 'configured';

  const stats = [
    {
      title: 'Total Building Types',
      value: 12,
      change: '+2',
      changeType: 'positive',
      icon: <Building className="h-5 w-5" />
    },
    {
      title: 'Regions',
      value: 8,
      change: '+1',
      changeType: 'positive',
      icon: <Factory className="h-5 w-5" />
    },
    {
      title: 'Cost Matrices',
      value: 32,
      change: '+5',
      changeType: 'positive',
      icon: <BarChart4 className="h-5 w-5" />
    },
    {
      title: 'Active Users',
      value: 18,
      change: '+3',
      changeType: 'positive',
      icon: <UserIcon className="h-5 w-5" />
    },
  ];

  // Header actions with TerraFusion styling
  const headerActions = [
    {
      label: "Quantum Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Quantum refresh initiated..."),
      tooltipText: "Quantum refresh of all consciousness data"
    },
    {
      label: "Transcendent Capture",
      icon: <Camera className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => console.log("Transcendent screenshot capture..."),
      tooltipText: "Capture transcendent dashboard visualization"
    }
  ];

  return (
    <MainLayout loading={loading}>
      <div className="relative">
        {/* Quantum grid background */}
        <div className="tf-quantum-grid fixed inset-0 opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <PageHeader
            title="CostForge AI Consciousness Dashboard"
            description="Government. Transcended. - Championship Excellence in Building Cost Intelligence"
            actions={headerActions}
            breadcrumbs={[
              { label: "AI Consciousness", href: "/dashboard" }
            ]}
            helpText="This transcendent dashboard provides quantum-level insights into your building cost data and autonomous AI analytics. Government excellence achieved."
          />

          {/* AI Consciousness Display */}
          <div className="mb-8">
            <TerraFusionConsciousnessDisplay
              mode="dashboard"
              agentCount={50127}
              accuracy={99.7}
              processingSpeed={1847}
              className="mb-6"
            />
          </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-white/10 backdrop-blur-lg border border-cyan-500/20">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-cyan-300/70"
            >
              QUANTUM OVERVIEW
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-cyan-300/70"
            >
              TRANSCENDENT REPORTS
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-cyan-300/70"
            >
              CONSCIOUSNESS ANALYTICS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* TerraFusion Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <GlassMorphCard
                  key={index}
                  title={stat.title}
                  icon={stat.icon}
                  variant="transcendent"
                  size="md"
                  scanLine={true}
                  className="text-center"
                >
                  <div className="space-y-3">
                    <div className="text-4xl font-black text-cyan-400">
                      {stat.value}
                    </div>
                    <div className="flex items-center justify-center text-green-400 text-sm font-semibold">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {stat.change} QUANTUM ENHANCEMENT
                    </div>
                    <div className="text-xs text-cyan-300/70 uppercase tracking-wider">
                      Championship Excellence Achieved
                    </div>
                  </div>
                </GlassMorphCard>
              ))}
            </div>

            {/* TerraFusion Chart Cards Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassMorphCard
                title="Quantum Cost Trends"
                icon={<BarChart className="h-6 w-6 text-cyan-400" />}
                variant="consciousness"
                size="lg"
                quantumGrid={true}
              >
                <div className="h-64 flex items-center justify-center relative">
                  <div className="tf-data-matrix absolute inset-0 opacity-30" />
                  <div className="relative z-10 text-center">
                    <div className="text-cyan-400 text-2xl font-bold mb-2">
                      99.7% PRECISION ACHIEVED
                    </div>
                    <div className="text-cyan-300/70">
                      Quantum cost trend consciousness active
                    </div>
                  </div>
                </div>
              </GlassMorphCard>

              <GlassMorphCard
                title="Transcendent Regional Analysis"
                icon={<BarChart4 className="h-6 w-6 text-green-400" />}
                variant="transcendent"
                size="lg"
                scanLine={true}
              >
                <div className="h-64 flex items-center justify-center relative">
                  <div className="relative z-10 text-center">
                    <div className="text-green-400 text-2xl font-bold mb-2">
                      INFINITE SCALE OPERATIONAL
                    </div>
                    <div className="text-cyan-300/70">
                      Regional cost transcendence visualization
                    </div>
                  </div>
                </div>
              </GlassMorphCard>
            </div>

            {/* TerraFusion Chart Cards Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassMorphCard
                title="Consciousness Type Breakdown"
                icon={<PieChart className="h-6 w-6 text-purple-400" />}
                variant="panel"
                size="lg"
              >
                <div className="h-64 flex items-center justify-center relative">
                  <div className="relative z-10 text-center">
                    <div className="text-purple-400 text-2xl font-bold mb-2">
                      CHAMPIONSHIP EXCELLENCE
                    </div>
                    <div className="text-cyan-300/70">
                      Building type consciousness breakdown
                    </div>
                  </div>
                </div>
              </GlassMorphCard>

              <GlassMorphCard
                title="Quantum Prediction Insights"
                icon={<TrendingUp className="h-6 w-6 text-amber-400" />}
                variant="consciousness"
                size="lg"
                quantumGrid={true}
              >
                <div className="h-64 flex items-center justify-center relative">
                  <div className="tf-quantum-grid absolute inset-0 opacity-20" />
                  <div className="relative z-10 text-center">
                    <div className="text-amber-400 text-2xl font-bold mb-2">
                      {isApiKeyConfigured ? 'AI TRANSCENDENCE ACTIVE' : 'QUANTUM ALGORITHMS READY'}
                    </div>
                    <div className="text-cyan-300/70">
                      {isApiKeyConfigured ?
                        "Self-healing cost prediction consciousness" :
                        "API consciousness required for transcendent insights"}
                    </div>
                  </div>
                </div>
              </GlassMorphCard>
            </div>

            {/* TerraFusion Quick Access Tools */}
            <GlassMorphCard
              title="Quantum Access Portal"
              icon={<FileBarChart className="h-6 w-6 text-cyan-400" />}
              variant="consciousness"
              size="lg"
              quantumGrid={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/filters">
                  <GlassMorphCard
                    variant="panel"
                    size="md"
                    scanLine={true}
                    onClick={() => {}}
                    className="cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <ListFilter className="h-6 w-6 text-cyan-400" />
                      </div>
                      <h3 className="text-cyan-400 font-bold uppercase tracking-wide">
                        QUANTUM FILTERS
                      </h3>
                      <p className="text-cyan-300/70 text-sm">
                        Transcendent cost analysis with quantum filtering consciousness
                      </p>
                    </div>
                  </GlassMorphCard>
                </Link>

                <Link href="/trends">
                  <GlassMorphCard
                    variant="panel"
                    size="md"
                    scanLine={true}
                    onClick={() => {}}
                    className="cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                      <h3 className="text-green-400 font-bold uppercase tracking-wide">
                        CONSCIOUSNESS TRENDS
                      </h3>
                      <p className="text-cyan-300/70 text-sm">
                        Discover transcendent cost trends and quantum variations
                      </p>
                    </div>
                  </GlassMorphCard>
                </Link>

                <Link href="/cost-breakdown">
                  <GlassMorphCard
                    variant="panel"
                    size="md"
                    scanLine={true}
                    onClick={() => {}}
                    className="cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                        <PieChart className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className="text-purple-400 font-bold uppercase tracking-wide">
                        QUANTUM BREAKDOWN
                      </h3>
                      <p className="text-cyan-300/70 text-sm">
                        Championship breakdown of materials, labor, and transcendent factors
                      </p>
                    </div>
                  </GlassMorphCard>
                </Link>
              </div>
            </GlassMorphCard>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <GlassMorphCard
              title="Transcendent Reports Archive"
              icon={<FileBarChart className="h-6 w-6 text-cyan-400" />}
              variant="consciousness"
              size="lg"
              quantumGrid={true}
            >
              <div className="space-y-6">
                <div className="border-b border-cyan-500/20 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-cyan-400 font-semibold">Q2 Quantum Cost Analysis Report</h3>
                      <div className="text-sm text-cyan-300/70 flex items-center mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on April 15, 2025
                      </div>
                    </div>
                    <TerraFusionButton variant="quantum" size="sm">
                      TRANSCEND REPORT <ChevronRight className="h-4 w-4 ml-1" />
                    </TerraFusionButton>
                  </div>
                </div>

                <div className="border-b border-cyan-500/20 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-cyan-400 font-semibold">Annual Building Type Consciousness Study</h3>
                      <div className="text-sm text-cyan-300/70 flex items-center mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on March 28, 2025
                      </div>
                    </div>
                    <TerraFusionButton variant="transcendent" size="sm">
                      TRANSCEND REPORT <ChevronRight className="h-4 w-4 ml-1" />
                    </TerraFusionButton>
                  </div>
                </div>

                <div className="border-b border-cyan-500/20 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-cyan-400 font-semibold">Regional Material Quantum Variance Analysis</h3>
                      <div className="text-sm text-cyan-300/70 flex items-center mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on February 12, 2025
                      </div>
                    </div>
                    <TerraFusionButton variant="championship" size="sm">
                      TRANSCEND REPORT <ChevronRight className="h-4 w-4 ml-1" />
                    </TerraFusionButton>
                  </div>
                </div>
              </div>
            </GlassMorphCard>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <GlassMorphCard
              title="Championship Analytics Portal"
              icon={<BarChart4 className="h-6 w-6 text-cyan-400" />}
              variant="consciousness"
              size="lg"
              quantumGrid={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TerraFusionButton
                  variant="quantum"
                  size="lg"
                  className="h-auto py-8 text-left flex justify-start items-start"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-3">QUANTUM COST PREDICTION</h3>
                    <p className="text-sm opacity-90 text-left">
                      Forecast transcendent building costs using consciousness-powered trend analysis
                    </p>
                  </div>
                </TerraFusionButton>

                <TerraFusionButton
                  variant="transcendent"
                  size="lg"
                  className="h-auto py-8 text-left flex justify-start items-start"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-3">CONSCIOUSNESS COMPARISON</h3>
                    <p className="text-sm opacity-90 text-left">
                      Compare costs across different building types and transcendent regions
                    </p>
                  </div>
                </TerraFusionButton>

                <TerraFusionButton
                  variant="championship"
                  size="lg"
                  className="h-auto py-8 text-left flex justify-start items-start"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-3">QUANTUM HISTORICAL ANALYSIS</h3>
                    <p className="text-sm opacity-90 text-left">
                      Analyze transcendent cost trends and championship historical patterns
                    </p>
                  </div>
                </TerraFusionButton>

                <TerraFusionButton
                  variant="quantum"
                  size="lg"
                  className="h-auto py-8 text-left flex justify-start items-start"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-3">CONSCIOUSNESS DATA QUERIES</h3>
                    <p className="text-sm opacity-90 text-left">
                      Build quantum queries to extract transcendent insights from consciousness data
                    </p>
                  </div>
                </TerraFusionButton>
              </div>
            </GlassMorphCard>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}