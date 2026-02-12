import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Home,
  FileText,
  BarChart3,
  Refresh,
  Settings,
  Zap,
  TrendingUp,
  MapPin,
  Users,
  Shield,
  Bot,
  Sparkles,
  Database,
 } from '@mui/icons-material';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | number;
  isActive?: boolean;
}

export function Sidebar() {
  const [location] = useLocation();

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
      isActive: location === "/",
    },
    {
      icon: Database,
      label: "Legacy Importer",
      href: "/legacy-importer",
      badge: "NEW",
      isActive: location.startsWith("/legacy-importer"),
    },
    {
      icon: FileText,
      label: "Orders",
      href: "/orders",
      badge: "3",
      isActive: location.startsWith("/orders"),
    },
    {
      icon: TrendingUp,
      label: "Valuations",
      href: "/valuations",
      isActive: location.startsWith("/valuations"),
    },
    {
      icon: Refresh,
      label: "Conversion Center",
      href: "/conversion",
      isActive: location.startsWith("/conversion"),
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/analytics",
      isActive: location.startsWith("/analytics"),
    },
    {
      icon: MapPin,
      label: "Property Search",
      href: "/properties",
      isActive: location.startsWith("/properties"),
    },
    {
      icon: Users,
      label: "Team",
      href: "/team",
      isActive: location.startsWith("/team"),
    },
    {
      icon: Shield,
      label: "Compliance",
      href: "/compliance",
      badge: "QC",
      isActive: location.startsWith("/compliance"),
    },
    {
      icon: FileText,
      label: "Form Engine",
      href: "/form-engine",
      badge: "AI",
      isActive: location.startsWith("/form-engine"),
    },
    {
      icon: Sparkles,
      label: "Infiniform Engine",
      href: "/infiniform",
      badge: "NEW",
      isActive: location.startsWith("/infiniform"),
    },
    {
      icon: Shield,
      label: "Public Ledger",
      href: "/ledger",
      badge: "LIVE",
      isActive: location.startsWith("/ledger"),
    },
    {
      icon: MapPin,
      label: "Zoning AI Map",
      href: "/zoning-map",
      badge: "AI",
      isActive: location.startsWith("/zoning-map"),
    },
    {
      icon: Users,
      label: "WA County Portal",
      href: "/wa-counties",
      badge: "WA",
      isActive: location.startsWith("/wa-counties"),
    },
    {
      icon: MapPin,
      label: "Tri-Cities Regional",
      href: "/tri-cities",
      badge: "TC",
      isActive: location.startsWith("/tri-cities"),
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      icon: Bot,
      label: "AI Agent Status",
      href: "/agent-status",
      badge: "●",
      isActive: location.startsWith("/agent-status"),
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      isActive: location.startsWith("/settings"),
    },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><>

            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div
</>><>

            <h2 className="text-lg font-bold text-foreground">Terrafusion</h2>
            <p
</> className="text-xs text-muted-foreground">AI Appraisal Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={item.isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-3",
                item.isActive && "bg-primary text-primary-foreground shadow-sm"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge
                  variant={item.isActive ? "secondary" : "outline"}
                  className={cn(
                    "ml-auto text-xs",
                    item.badge === "●" && "bg-green-500 text-white border-green-500",
                    item.badge === "QC" && "bg-orange-500 text-white border-orange-500"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border space-y-2">
        <Separator className="mb-4" />
        {bottomNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={item.isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-3",
                item.isActive && "bg-primary text-primary-foreground shadow-sm"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge
                  variant={item.isActive ? "secondary" : "outline"}
                  className={cn(
                    "ml-auto text-xs",
                    item.badge === "●" && "bg-green-500 text-white border-green-500"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
