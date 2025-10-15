"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { terraFusionBrand } from "@/lib/brand"
import { BookOpen,
  Rocket,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Warning,
  Info,
  ExternalLink,
  Copy,
  Download,
 } from '@mui/icons-material'

interface DocsContentProps {
  slug?: string
}

export function DocsContent({ slug }: DocsContentProps) {
  // This would normally fetch content based on the slug
  // For now, we'll show the main documentation page

  if (!slug) {
    return <MainDocsContent />
  }

  return <div>Content for: {slug}</div>
}

function MainDocsContent() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl clarity-gradient flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold">
          Terrafusion OS <span className="text-tf-primary">Documentation</span>
        </h1><>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Complete guides and API reference for building with Terrafusion OS. {terraFusionBrand.slogan}
        </p>
        <div
</>
className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-tf-primary hover:bg-tf-primary-dark text-white"><>

            <Rocket className="w-5 h-5 mr-2" />
            Quick Start Guide
          </Button>
          <Button
</>

            variant="outline"
            size="lg"
            className="border-tf-primary text-tf-primary hover:bg-tf-primary/10 bg-transparent"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Live Demo
          </Button>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="transcend-glow hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-tf-primary/10 border border-tf-primary/20"><>

                <Rocket className="w-5 h-5 text-tf-primary" />
              </div>
              <CardTitle
</>
className="text-lg">Getting Started</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3"><>

            <p className="text-sm text-muted-foreground">
              Learn the basics of Terrafusion OS and get your first module running in minutes.
            </p>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-primary hover:bg-tf-primary/10">
              Installation Guide<>

              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-primary hover:bg-tf-primary/10">
              Configuration<>

              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-primary hover:bg-tf-primary/10">
              First Module
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        <Card className="transcend-glow hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-tf-accent/10 border border-tf-accent/20"><>

                <Users className="w-5 h-5 text-tf-accent" />
              </div>
              <CardTitle
</>
className="text-lg">Core Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3"><>

            <p className="text-sm text-muted-foreground">
              Explore the 14 government modules that power county operations and citizen services.
            </p>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-accent hover:bg-tf-accent/10">
              CostForge AI
              <Badge variant="secondary" className="ml-auto text-xs">
                AI
              </Badge>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-tf-accent hover:bg-tf-accent/10">
              PermitFlow
              <Badge variant="secondary" className="ml-auto text-xs">
                Workflow
              </Badge>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-tf-accent hover:bg-tf-accent/10">
              CitizenConnect
              <Badge variant="secondary" className="ml-auto text-xs">
                Portal
              </Badge>
            </Button>
          </CardContent>
        </Card>

        <Card className="transcend-glow hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-tf-success/10 border border-tf-success/20"><>

                <Shield className="w-5 h-5 text-tf-success" />
              </div>
              <CardTitle
</>
className="text-lg">Security & Compliance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3"><>

            <p className="text-sm text-muted-foreground">
              SOC 2 Type II compliant platform with enterprise-grade security and audit capabilities.
            </p>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-success hover:bg-tf-success/10">
              Security Setup<>

              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-success hover:bg-tf-success/10">
              Compliance Guide<>

              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button
</>
variant="ghost" size="sm" className="w-full justify-start text-tf-success hover:bg-tf-success/10">
              Audit Logs
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* System Requirements */}
      <div className="space-y-6"><>

        <h2 className="text-2xl font-heading font-bold">System Requirements</h2>

        <div
</>
className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-tf-success" />
                Minimum Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2"><>

                <p className="font-medium">Operating System</p>
                <p
</>
className="text-sm text-muted-foreground">Windows 10/11, Windows Server 2019+</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Runtime</p>
                <p
</>
className="text-sm text-muted-foreground">.NET 8.0 Runtime</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Memory</p>
                <p
</>
className="text-sm text-muted-foreground">4 GB RAM minimum, 8 GB recommended</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Storage</p>
                <p
</>
className="text-sm text-muted-foreground">2 GB available space</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-tf-warning" />
                Recommended Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2"><>

                <p className="font-medium">Processor</p>
                <p
</>
className="text-sm text-muted-foreground">Intel i5 or AMD Ryzen 5 equivalent</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Memory</p>
                <p
</>
className="text-sm text-muted-foreground">16 GB RAM for optimal performance</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Network</p>
                <p
</>
className="text-sm text-muted-foreground">Gigabit Ethernet connection</p>
              </div>
              <div className="space-y-2"><>

                <p className="font-medium">Database</p>
                <p
</>
className="text-sm text-muted-foreground">SQL Server 2019+ or PostgreSQL 13+</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Installation Steps */}
      <div className="space-y-6"><>

        <h2 className="text-2xl font-heading font-bold">Quick Installation</h2>

        <div
</>
className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card"><>

            <div className="w-8 h-8 rounded-full bg-tf-primary text-white flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div
</>
className="flex-1"><>

              <h3 className="font-semibold mb-2">Download Terrafusion OS</h3>
              <p
</>
className="text-sm text-muted-foreground mb-3">
                Download the latest release from our secure distribution portal.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="bg-tf-primary hover:bg-tf-primary-dark text-white"><>

                  <Download className="w-4 h-4 mr-2" />
                  Download v2.1.0
                </Button>
                <Button
</>
variant="outline" size="sm">
                  Release Notes
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card"><>

            <div className="w-8 h-8 rounded-full bg-tf-accent text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div
</>
className="flex-1"><>

              <h3 className="font-semibold mb-2">Run Installation Script</h3>
              <p
</>
className="text-sm text-muted-foreground mb-3">
                Execute the automated installation script with administrator privileges.
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <div className="flex items-center justify-between"><>

                  <span>.\install-terrafusion.ps1 -Environment Production</span>
                  <Button
</>
variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card"><>

            <div className="w-8 h-8 rounded-full bg-tf-success text-white flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div
</>
className="flex-1"><>

              <h3 className="font-semibold mb-2">Configure & Launch</h3>
              <p
</>
className="text-sm text-muted-foreground mb-3">
                Complete the initial configuration and launch your first module.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-tf-success text-tf-success hover:bg-tf-success/10 bg-transparent"
              >
                Configuration Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Important Notes */}
      <div className="space-y-4"><>

        <h2 className="text-2xl font-heading font-bold">Important Notes</h2>

        <div
</>
className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-tf-warning/20 bg-tf-warning/5">
            <Warning className="w-5 h-5 text-tf-warning mt-0.5" />
            <div><>

              <p className="font-medium text-tf-warning">Administrator Rights Required</p>
              <p
</>
className="text-sm text-muted-foreground">
                Terrafusion OS requires administrator privileges for initial installation and some module operations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-tf-primary/20 bg-tf-primary/5">
            <Info className="w-5 h-5 text-tf-primary mt-0.5" />
            <div><>

              <p className="font-medium text-tf-primary">Network Configuration</p>
              <p
</>
className="text-sm text-muted-foreground">
                Ensure ports 8080-8090 are available for the local API server and module communication.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border border-tf-success/20 bg-tf-success/5">
            <CheckCircle className="w-5 h-5 text-tf-success mt-0.5" />
            <div><>

              <p className="font-medium text-tf-success">SOC 2 Compliance</p>
              <p
</>
className="text-sm text-muted-foreground">
                All data processing and storage meets SOC 2 Type II compliance standards with full audit trails.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t"><>

        <p className="text-muted-foreground">Need help? Contact our support team or join the community forum.</p>
        <div
</>
className="flex justify-center gap-4 mt-4"><>

          <Button variant="outline" size="sm">
            Support Portal
          </Button>
          <Button
</>
variant="outline" size="sm">
            Community Forum
          </Button>
          <Button variant="outline" size="sm">
            API Reference
          </Button>
        </div>
      </div>
    </div>
  )
}
