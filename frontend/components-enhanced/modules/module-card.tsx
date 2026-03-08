"use client"

import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "../../apps/os-shell/src/components/ui/card"
import { Badge } from "../../apps/os-shell/src/components/ui/badge"
import { Button } from "../../apps/os-shell/src/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { TerraFusionModule } from "@/lib/modules"
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

const iconMap = {
  Calculator,
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
}

interface ModuleCardProps {
  module: TerraFusionModule
  onToggle?: (id: string) => void
  onConfigure?: (id: string) => void
  onLaunch?: (id: string) => void
  showControls?: boolean
}

export function ModuleCard({ module, onToggle, onConfigure, onLaunch, showControls = true }: ModuleCardProps) {
  const Icon = iconMap[module.icon as keyof typeof iconMap] || Calculator

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "tf-success"
      case "inactive":
        return "tf-gray"
      case "updating":
        return "tf-warning"
      case "error":
        return "tf-error"
      case "maintenance":
        return "tf-warning"
      default:
        return "tf-gray"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "assessment":
        return "tf-accent"
      case "permits":
        return "tf-primary"
      case "planning":
        return "tf-transcend"
      case "finance":
        return "tf-success"
      case "citizen-services":
        return "tf-warning"
      case "administration":
        return "tf-primary"
      case "analytics":
        return "tf-accent"
      case "security":
        return "tf-error"
      default:
        return "tf-primary"
    }
  }

  return (
    <Card className="transcend-glow hover:scale-105 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-${getCategoryColor(module.category)}/10 border border-${getCategoryColor(module.category)}/20`}
            >
<>

              <Icon className={`w-5 h-5 text-${getCategoryColor(module.category)}`} />
            </div>
            <div
</>
</>>
<>

              <CardTitle className="text-lg font-heading">{module.name}</CardTitle>
              <div
</>
className="flex items-center gap-2 mt-1">
<>

                <Badge
                  variant="secondary"
                  className={`text-xs bg-${getStatusColor(module.status)}/10 text-${getStatusColor(module.status)} border-${getStatusColor(module.status)}/20`}
                >
                  {module.status}
                </Badge>
                <span
</>
className="text-xs text-muted-foreground">v{module.version}</span>
              </div>
            </div>
          </div>

          {showControls && (
            <Switch
              checked={module.config.enabled}
              onCheckedChange={() => onToggle?.(module.id)}
              className="data-[state=checked]:bg-tf-primary"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>

        {module.dependencies.length > 0 && (
          <div className="space-y-2">
<>

            <p className="text-xs font-medium text-muted-foreground">Dependencies:</p>
            <div
</>
className="flex flex-wrap gap-1">
              {module.dependencies.map((depId) => (
                <Badge key={depId} variant="outline" className="text-xs">
                  {depId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showControls && module.config.enabled && module.status === "active" && (
          <div className="flex gap-2 pt-2">
<>

            <Button
              size="sm"
              onClick={() => onLaunch?.(module.id)}
              className="flex-1 bg-tf-primary hover:bg-tf-primary-dark text-white"
            >
              Launch
            </Button>
            <Button
</>

              size="sm"
              variant="outline"
              onClick={() => onConfigure?.(module.id)}
              className="border-tf-primary text-tf-primary hover:bg-tf-primary/10"
            >
              Configure
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
