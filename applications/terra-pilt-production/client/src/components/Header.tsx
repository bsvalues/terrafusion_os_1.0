import React from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, 
  Activity, 
  Upload, 
  Home, 
  Zap,
  Target,
  TrendingUp
 } from '@mui/icons-material';

const Header: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/analytics", label: "Analytics", icon: BarChart3, badge: "AI" },
    { path: "/monitor", label: "Monitor", icon: Activity, badge: "Live" },
    { path: "/bulk-import", label: "Import", icon: Upload }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center"><>

                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div
</>><>

                <h1 className="text-xl font-bold text-gray-900">TerraFusionPilt</h1>
                <p
</> className="text-xs text-gray-600">V2.0.0 - Advanced PILT Management</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={`ml-1 text-xs ${
                          item.badge === "AI" 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><>

              <Zap className="w-3 h-3 mr-1" />
              PACS Connected
            </Badge>
            <Badge
</> variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Target className="w-3 h-3 mr-1" />
              Production Ready
            </Badge>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={`ml-auto text-xs ${
                          item.badge === "AI" 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
