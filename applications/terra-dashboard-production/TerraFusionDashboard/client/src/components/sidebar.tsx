import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
      </svg>
    ),
  },
  {
    name: "Benton County Properties",
    href: "/properties",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
      </svg>
    ),
    badge: "50",
  },
  {
    name: "County Workflow",
    href: "/county-workflow",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    ),
    badge: "91.8K",
  },
  {
    name: "AI Agents",
    href: "/agents",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    badge: "8",
  },
  {
    name: "Playground IDE",
    href: "/ide",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
    ),
  },
  {
    name: "Task Orchestrator",
    href: "/orchestrator",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    badge: "Live",
  },
  {
    name: "ParcelWorkbench",
    href: "/parcel-workbench",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM9 10a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z"/>
      </svg>
    ),
    badge: "Demo",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    badge: "New",
  },

];

const counties = [
  { name: "Benton County", status: "active" },
  { name: "Yakima County", status: "setup" },
  { name: "King County", status: "inactive" },
];

const systemHealth = [
  { name: "Monitoring", href: "/monitoring" },
  { name: "Data Sync", href: "/sync" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-tf-dark border-r border-tf-accent/20 flex flex-col shadow-xl tf-glass-panel">
      {/* Logo */}
      <div className="p-6 border-b border-tf-accent/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00e5ff] to-[#00b8d4] rounded-lg flex items-center justify-center">
            <span className="text-tf-dark font-bold text-sm">TF</span>
          </div>
          <div>
<>
            <h1 className="tf-h5 text-tf-primary">Terrafusion</h1>
            <p
</> className="tf-caption text-tf-secondary">AI That Understands Land</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 tf-body-small font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-tf-accent/10 text-tf-accent border-l-4 border-tf-accent tf-glow-pulse"
                    : "text-tf-secondary hover:bg-tf-medium/30 hover:text-tf-primary"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto tf-caption font-medium px-2 py-0.5 rounded-full",
                    isActive 
                      ? "bg-tf-accent text-tf-dark" 
                      : "bg-tf-medium text-tf-secondary"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-tf-accent/20">
<>
          <p className="px-3 tf-caption font-semibold text-tf-secondary uppercase tracking-wider">
            County Systems
          </p>
          <div
</> className="mt-2 space-y-1">
            {counties.map((county) => (
              <a
                key={county.name}
                href="#"
                className="flex items-center px-3 py-2 tf-body-small font-medium text-tf-primary rounded-lg hover:bg-tf-medium/30"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mr-3",
                    county.status === "active"
                      ? "bg-tf-success"
                      : county.status === "setup"
                      ? "bg-tf-warning"
                      : "bg-tf-muted"
                  )}
                />
                {county.name}
              </a>
            ))}
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-tf-accent/20">
<>
          <p className="px-3 tf-caption font-semibold text-tf-secondary uppercase tracking-wider">
            System Health
          </p>
          <div
</> className="mt-2 space-y-1">
            {systemHealth.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 tf-body-small font-medium text-tf-secondary rounded-lg hover:bg-tf-medium/30 hover:text-tf-accent"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Version Information */}
      <div className="mt-auto p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
<>
            <span>Terrafusion Platform</span>
            <Badge
</> variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              v2.0 Production
            </Badge>
          </div>
          <div className="text-gray-400">Enterprise AI Assessment</div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">JA</span>
          </div>
          <div className="flex-1 min-w-0">
<>
            <p className="text-sm font-medium text-gray-900 truncate">County Administrator</p>
            <p
</> className="text-xs text-gray-500 truncate">Terrafusion v2.0 User</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
