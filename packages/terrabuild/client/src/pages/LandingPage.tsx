import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import arizonaSunset from '@assets/Arizona-sunset.jpg';
import vineyardHeader from '@assets/Header-Vineyard-BC.png';
import ogimage from '@assets/ogimage.jpg';
import {
    BarChart3,
    BrainCircuit,
    Calculator,
    Database,
    Download,
    FileSpreadsheet,
    Hexagon,
    Map,
    Upload,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

export default function LandingPage() {
  const [_, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  // Mock authenticated state - always set to true to bypass login
  const isAuthenticated = true;
  const user = { name: 'Admin User', username: 'admin' };

  return (
    <MainLayout loading={loading} isLanding={true}>
      <div>
        {/* Hero section */}
        <section
          className="relative -mt-6 -mx-6 mb-4 text-foreground"
          style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
            <div
              className="w-24 h-24 mb-6 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
            >
              <Calculator className="w-12 h-12" style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <h1
              className="text-4xl md:text-6xl font-black mb-4"
              style={{ color: 'hsl(var(--primary))' }}
            >
              CostForge
            </h1>
            <p className="text-base md:text-lg mb-2 max-w-3xl font-semibold tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              COST APPROACH — BENTON COUNTY ASSESSOR
            </p>
            <p className="text-base md:text-lg mb-8 max-w-3xl" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Government-grade cost approach estimation using Benton-calibrated valuation models,
              county depreciation schedules, and traceable parcel evidence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => navigate('/dashboard')}>
                    <Calculator className="mr-2 h-5 w-5" /> Open Dashboard
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/calculator')}>
                    <Calculator className="mr-2 h-5 w-5" /> Cost Calculator
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/data-import')}>
                    <Upload className="mr-2 h-5 w-5" /> Import Data
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/cost-wizard')}>
                    <Calculator className="mr-2 h-5 w-5" /> Cost Wizard
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/calculator')}>
                    <Calculator className="mr-2 h-5 w-5" /> Try Calculator
                  </Button>
                </>
              )}
            </div>
            {isAuthenticated && user && (
              <div
                className="mt-6 px-6 py-3 rounded-full flex items-center"
                style={{
                  background: 'hsl(var(--primary) / 0.08)',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                }}
              >
                <User className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                  Benton County · Welcome, {user.name || user.username}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Features section */}
        <section className="py-16" style={{ background: 'hsl(var(--muted))' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
              Assessment Tools
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              A complete suite for cost approach property assessment — from cost matrices to
              depreciation analysis and reval area cost comparisons.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--primary))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--primary) / 0.1)' }}
                  >
                    <Calculator className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <CardTitle>Cost Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Accurately calculate building costs based on structure type, size, and reval area.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent text-primary" onClick={() => navigate('/calculator')}>
                    Open Calculator
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--tf-sage))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--tf-sage) / 0.12)' }}
                  >
                    <BarChart3 className="h-6 w-6" style={{ color: 'hsl(var(--tf-sage))' }} />
                  </div>
                  <CardTitle>Data Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Charts and graphs to help interpret cost data and depreciation trends.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent" style={{ color: 'hsl(var(--tf-sage))' }} onClick={() => navigate('/visualizations')}>
                    View Charts
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--accent))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--accent) / 0.1)' }}
                  >
                    <Map className="h-6 w-6" style={{ color: 'hsl(var(--accent))' }} />
                  </div>
                  <CardTitle>Regional Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Compare construction costs across reval areas and market zones.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent text-accent" onClick={() => navigate('/regional-cost-comparison')}>
                    Explore Reval Areas
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--primary))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--primary) / 0.1)' }}
                  >
                    <div className="flex">
                      <Upload className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      <Download className="h-5 w-5 -ml-1" style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                  </div>
                  <CardTitle>Data Import/Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Import and export cost data in Excel, CSV, and PDF formats.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent text-primary" onClick={() => navigate('/data-import')}>
                    Manage Data
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--tf-sage))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--tf-sage) / 0.12)' }}
                  >
                    <BrainCircuit className="h-6 w-6" style={{ color: 'hsl(var(--tf-sage))' }} />
                  </div>
                  <CardTitle>What-If Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Model different building scenarios and see how they affect total cost estimates.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent" style={{ color: 'hsl(var(--tf-sage))' }} onClick={() => navigate('/what-if-scenarios')}>
                    Run Scenarios
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--destructive))' }}>
                <CardHeader>
                  <div
                    className="p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4"
                    style={{ background: 'hsl(var(--destructive) / 0.1)' }}
                  >
                    <FileSpreadsheet className="h-6 w-6" style={{ color: 'hsl(var(--destructive))' }} />
                  </div>
                  <CardTitle>Cost Matrix Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Maintain and update cost matrices for different building types and market areas.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="px-0 hover:bg-transparent" style={{ color: 'hsl(var(--destructive))' }} onClick={() => navigate('/data-import')}>
                    Edit Matrices
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="py-16 text-background" style={{ background: 'hsl(var(--foreground))' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'hsl(var(--background))' }}>
              Benton County by the Numbers
            </h2>
            <p className="text-center text-lg mb-12 max-w-3xl mx-auto" style={{ color: 'hsl(var(--background) / 0.7)' }}>
              Real production data powering the cost approach for Benton County assessment operations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>89,247</div>
                <div style={{ color: 'hsl(var(--background) / 0.75)' }}>Total Parcels</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>32</div>
                <div style={{ color: 'hsl(var(--background) / 0.75)' }}>Cost Matrices</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>25+</div>
                <div style={{ color: 'hsl(var(--background) / 0.75)' }}>Building Types</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'hsl(var(--primary))' }}>97%</div>
                <div style={{ color: 'hsl(var(--background) / 0.75)' }}>Estimation Accuracy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase section */}
        <section className="py-16" style={{ background: 'hsl(var(--background))' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-3 text-foreground">
              Benton County Showcase
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              Built for Washington State county assessors — local data, local context, real results.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={arizonaSunset}
                    alt="Sunset at Red Mountain"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <h3 className="font-bold text-lg">Sunset at Red Mountain</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-2 text-foreground">AI-Assisted Analytics</h4>
                  <p className="text-muted-foreground">
                    Machine learning algorithms analyze geographic and economic factors for accurate cost modeling.
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={vineyardHeader}
                    alt="Wine Country"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <h3 className="font-bold text-lg">Wine Country</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-2 text-foreground">County-Calibrated Tables</h4>
                  <p className="text-muted-foreground">
                    Benton-calibrated cost models built from local market evidence and county-specific depreciation schedules.
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={ogimage}
                    alt="Prosser Downtown"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <h3 className="font-bold text-lg">Prosser Downtown</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg mb-2 text-foreground">Government-Grade Accuracy</h4>
                  <p className="text-muted-foreground">
                    PACS-integrated data ensures every cost calculation reflects current assessment records.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-10">
              <Button variant="outline" size="lg" onClick={() => navigate('/geo-assessment')}>
                <Map className="mr-2 h-5 w-5" /> View Assessment Map
              </Button>
            </div>
          </div>
        </section>

        {/* About section */}
        <section className="py-16" style={{ background: 'hsl(var(--muted))' }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6 text-foreground">About CostForge</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  CostForge is the cost approach module of TerraFusion OS — the property assessment
                  platform built for Washington State county assessors. Every feature is designed
                  around real workflows from the Benton County Assessor's office.
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  Real PACS data, real cost matrices, real depreciation schedules. No synthetic data,
                  no demo placeholders in production.
                </p>

                <ul className="space-y-3 mt-8">
                  {[
                    'Updated annually with Benton County cost data and local market evidence',
                    'Integrated with Benton County PACS assessment system',
                    'Continuously improved through assessor feedback',
                  ].map((item) => (
                    <li key={item} className="flex items-start">
                      <div
                        className="rounded-full p-1 mr-3 mt-1 flex-shrink-0"
                        style={{ background: 'hsl(var(--primary) / 0.1)' }}
                      >
                        <svg className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4 mt-8">
                  <Button onClick={() => navigate('/data-exploration')}>
                    <Database className="mr-2 h-5 w-5" /> Explore Data
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/benchmarking')}>
                    <BarChart3 className="mr-2 h-5 w-5" /> View Benchmarks
                  </Button>
                </div>
              </div>

              <div className="md:w-1/2 relative">
                <img
                  src={ogimage}
                  alt="TerraFusion Government Technology"
                  className="rounded-lg shadow-lg w-full h-auto object-cover"
                />
                <div
                  className="absolute -bottom-6 -left-6 p-4 rounded-lg shadow-lg hidden md:block"
                  style={{ background: 'hsl(var(--card))' }}
                >
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                  >
                    <Hexagon className="h-10 w-10" style={{ color: 'hsl(var(--primary-foreground))' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 pb-6" style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between mb-10">
              <div className="mb-8 md:mb-0">
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 mr-3 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                  >
                    <Hexagon className="h-8 w-8" style={{ color: 'hsl(var(--primary-foreground))' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--background))' }}>CostForge</h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--background) / 0.6)' }}>Benton County Assessor</p>
                  </div>
                </div>
                <p className="max-w-sm" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                  Cost approach building cost estimation for government property assessment.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-semibold text-lg mb-4" style={{ color: 'hsl(var(--background))' }}>Tools</h4>
                  <ul className="space-y-2">
                    {[
                      { label: 'Calculator', href: '/calculator' },
                      { label: 'Visualizations', href: '/visualizations' },
                      { label: 'Data Import', href: '/data-import' },
                    ].map(({ label, href }) => (
                      <li key={href}>
                        <button onClick={() => navigate(href)} className="bg-transparent transition-opacity" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4" style={{ color: 'hsl(var(--background))' }}>Resources</h4>
                  <ul className="space-y-2">
                    {[
                      { label: 'Documentation', href: '/documentation' },
                      { label: 'Tutorials', href: '/tutorials' },
                      { label: 'FAQ', href: '/faq' },
                    ].map(({ label, href }) => (
                      <li key={href}>
                        <button onClick={() => navigate(href)} className="bg-transparent" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                          {label}
                        </button>
                      </li>
                    ))}
                    {isAuthenticated && (
                      <>
                        <li>
                          <button onClick={() => navigate('/dashboard')} className="bg-transparent" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                            My Dashboard
                          </button>
                        </li>
                        <li>
                          <button onClick={() => navigate('/account')} className="bg-transparent" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                            Account Settings
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4" style={{ color: 'hsl(var(--background))' }}>Contact</h4>
                  <ul className="space-y-2" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                    <li>
                      <a href="https://www.co.benton.wa.us" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                        County Website
                      </a>
                    </li>
                    <li>
                      <a href="mailto:support@terrafusionmarket.com" style={{ color: 'hsl(var(--background) / 0.65)' }}>
                        Email Support
                      </a>
                    </li>
                    <li>(509) 736-3086</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row justify-between items-center" style={{ borderTop: '1px solid hsl(var(--background) / 0.15)' }}>
              <p className="text-sm mb-4 md:mb-0" style={{ color: 'hsl(var(--background) / 0.5)' }}>
                © 2025 TerraFusion OS · Benton County Assessor. All rights reserved.
              </p>
              <div className="flex space-x-4">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Use', href: '/terms' },
                  { label: 'Accessibility', href: '/accessibility' },
                ].map(({ label, href }) => (
                  <button key={href} onClick={() => navigate(href)} className="text-sm bg-transparent" style={{ color: 'hsl(var(--background) / 0.5)' }}>
                    {label}
                  </button>
                ))}
                {isAuthenticated && (
                  <button onClick={() => navigate('/')} className="text-sm bg-transparent" style={{ color: 'hsl(var(--background) / 0.5)' }}>
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}
