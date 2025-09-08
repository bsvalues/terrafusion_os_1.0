import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronRight, 
  ChevronLeft, 
  FileText, 
  Folder, 
  LayoutGrid, 
  GanttChart, 
  Map as MapIcon, 
  FileInput, 
  History, 
  ListFilter, 
  Settings,
  BarChart
 } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div 
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="self-end p-2 text-gray-500 hover:text-gray-700 mt-2 mr-2"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      
      {/* Main sidebar content */}
      <div className="flex flex-col space-y-6 px-3 py-4 flex-1">
        {/* Workflows section */}
        <div>
          <div className={cn(
            "flex items-center mb-2",
            collapsed ? "justify-center" : "px-2"
          )}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Workflows
              </h3>
            )}
          </div>
          
          <nav>
            <ul className="space-y-1">
              <SidebarItem 
                href="/workflow/long_plat"
                icon={<LayoutGrid size={20} />}
                label="Long Plat"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/workflow/bla"
                icon={<FileText size={20} />}
                label="BLA"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/workflow/merge_split"
                icon={<FileInput size={20} />}
                label="Merge/Split"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/workflow/sm00_report"
                icon={<BarChart size={20} />}
                label="SM00 Report"
                collapsed={collapsed}
              />
            </ul>
          </nav>
        </div>
        
        {/* Tools section */}
        <div>
          <div className={cn(
            "flex items-center mb-2",
            collapsed ? "justify-center" : "px-2"
          )}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tools
              </h3>
            )}
          </div>
          
          <nav>
            <ul className="space-y-1">
              <SidebarItem 
                href="/map-viewer"
                icon={<MapIcon size={20} />}
                label="Map Viewer"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/property-search"
                icon={<ListFilter size={20} />}
                label="Property Search"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/parcel-generator"
                icon={<Folder size={20} />}
                label="Parcel Generator"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/geospatial-analysis"
                icon={<GanttChart size={20} />}
                label="Geospatial Analysis"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/document-classification"
                icon={<FileText size={20} />}
                label="Document Classification"
                collapsed={collapsed}
              />
              <SidebarItem 
                href="/report"
                icon={<BarChart size={20} />}
                label="Reports"
                collapsed={collapsed}
              />
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200">
        <nav>
          <ul className="space-y-1">
            <SidebarItem 
              href="/history"
              icon={<History size={20} />}
              label="History"
              collapsed={collapsed}
            />
            <SidebarItem 
              href="/settings"
              icon={<Settings size={20} />}
              label="Settings"
              collapsed={collapsed}
            />
          </ul>
        </nav>
      </div>
    </div>
  );
}

// Sidebar item component
interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function SidebarItem({ href, icon, label, collapsed }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(`${href}/`);
  
  const linkContent = (
    <div
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary-50 text-primary-700" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );
  
  // If sidebar is collapsed, wrap with tooltip
  if (collapsed) {
    return (
      <li>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={href}>
                {linkContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="z-50">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  }
  
  return (
    <li>
      <Link href={href}>
        {linkContent}
      </Link>
    </li>
  );
}