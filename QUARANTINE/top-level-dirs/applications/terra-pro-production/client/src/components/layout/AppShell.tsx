import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home,
  FileText,
  Search,
  Camera,
  PencilRuler,
  BarChart3,
  Settings,
  Upload,
  Brain,
  Database,
  Bell,
  User,
  Building2,
  MapPin,
  Folder,
  CheckSquare,
  TrendingUp,
  Shuffle,
 } from '@mui/icons-material';

interface AppShellProps {
  children: React.ReactNode;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Database, label: "Legacy Importer", path: "/legacy-import" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Upload, label: "Orders", path: "/orders" },
  { icon: Building2, label: "Properties", path: "/properties" },
  { icon: Search, label: "Comparables", path: "/comps" },
  { icon: Camera, label: "Photos", path: "/photos" },
  { icon: PencilRuler, label: "Sketches", path: "/sketches" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Brain, label: "AI Assistant", path: "/ai" },
  { icon: Shuffle, label: "Conversion", path: "/conversion" },
  { icon: CheckSquare, label: "Compliance", path: "/compliance" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppShell({ children }: AppShellProps) {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200"><>

          <h1 className="text-xl font-bold text-slate-900">Terrafusion</h1>
          <p
</> className="text-sm text-slate-500">AI Property Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1"><>

              <p className="text-sm font-medium text-slate-900">John Doe</p>
              <p
</> className="text-xs text-slate-500">Licensed Appraiser</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search properties, reports..." className="pl-10" />
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                AI Active
              </Badge>

              <Button variant="outline" size="sm"><>

                <Upload className="h-4 w-4 mr-2" />
                Quick Upload
              </Button>

              <Button
</> variant="outline" size="icon"><>

                <Bell className="h-4 w-4" />
              </Button>

              <Button
</> variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
