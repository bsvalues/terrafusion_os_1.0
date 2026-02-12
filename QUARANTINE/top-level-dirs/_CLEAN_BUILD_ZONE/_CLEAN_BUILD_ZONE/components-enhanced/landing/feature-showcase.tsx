import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator,
  FileText,
  MapPin,
  Users,
  Shield,
  Zap,
  Brain,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Database,
  Globe,
 } from '@mui/icons-material'

const modules = [
  {
    name: "CostForge AI",
    icon: Calculator,
    description: "AI-powered property valuations with 94% accuracy",
    badge: "AI-Powered",
    color: "tf-accent",
  },
  {
    name: "PermitFlow",
    icon: FileText,
    description: "Streamlined permit processing and approval workflows",
    badge: "Workflow",
    color: "tf-primary",
  },
  {
    name: "GeoIntel",
    icon: MapPin,
    description: "Intelligent mapping and geographic information systems",
    badge: "Mapping",
    color: "tf-transcend",
  },
  {
    name: "CitizenConnect",
    icon: Users,
    description: "Unified citizen portal for all county services",
    badge: "Portal",
    color: "tf-success",
  },
  {
    name: "SecureCore",
    icon: Shield,
    description: "Enterprise security with SOC 2 Type II compliance",
    badge: "Security",
    color: "tf-error",
  },
  {
    name: "FlashProcess",
    icon: Zap,
    description: "Lightning-fast document processing and automation",
    badge: "Speed",
    color: "tf-warning",
  },
  {
    name: "IntelliBoard",
    icon: Brain,
    description: "AI-driven analytics and decision support dashboard",
    badge: "Analytics",
    color: "tf-primary",
  },
  {
    name: "AssetTrack",
    icon: Building,
    description: "Comprehensive asset and property management",
    badge: "Management",
    color: "tf-accent",
  },
  {
    name: "RevenueMax",
    icon: DollarSign,
    description: "Revenue optimization and financial planning tools",
    badge: "Finance",
    color: "tf-success",
  },
  {
    name: "TimeSync",
    icon: Clock,
    description: "Synchronized scheduling and resource allocation",
    badge: "Scheduling",
    color: "tf-transcend",
  },
  {
    name: "ComplianceCheck",
    icon: CheckCircle,
    description: "Automated compliance monitoring and reporting",
    badge: "Compliance",
    color: "tf-primary",
  },
  {
    name: "TrendScope",
    icon: TrendingUp,
    description: "Predictive analytics for county planning",
    badge: "Predictive",
    color: "tf-accent",
  },
  {
    name: "DataVault",
    icon: Database,
    description: "Secure, centralized data management platform",
    badge: "Data",
    color: "tf-error",
  },
  {
    name: "PublicLink",
    icon: Globe,
    description: "Public-facing services and transparency portal",
    badge: "Public",
    color: "tf-success",
  },
]

export function FeatureShowcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-tf-clarity/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            <span className="text-tf-primary">14 Modules.</span> One Vision.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every aspect of county government, transcended. Each module designed to work in perfect harmony, creating a
            unified platform that transforms complexity into clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module /* , index */) => {
            const Icon = module.icon
            return (
              <Card key={index} className="transcend-glow hover:scale-105 transition-transform duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-${module.color}/10 border border-${module.color}/20`}><>

                      <Icon className={`w-5 h-5 text-${module.color}`} />
                    </div>
                    <Badge
</>
variant="secondary" className="text-xs">
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-heading">{module.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-tf-primary font-medium">
            "Every module, every feature, every interaction: designed for transcendence."
          </p>
        </div>
      </div>
    </section>
  )
}
