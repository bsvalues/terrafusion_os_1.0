import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/data/constants";
import { useAuth } from "@/hooks/use-auth";
import BentonBranding, { BentonColors } from '@/components/BentonBranding';
import {
  BarChart3,
  Home,
  Calculator,
  Users,
  Settings,
  BrainCircuit,
  Glasses,
  Database,
  Building2,
  FileBarChart,
  HelpCircle,
  Zap,
  Activity,
  BarChart2,
  LineChart,
  BookOpen,
  Share2,
  UsersRound,
  Map,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  ExternalLink,
  Maximize2,
  MinusSquare,
  RefreshCw
} from "lucide-react";
import { useSidebar } from '@/contexts/SidebarContext';
import { useWindow } from '@/contexts/WindowContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  className?: string;
}

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  collapsed?: boolean;
}

function SidebarItem({ href, title, icon, badge, badgeColor = "bg-muted text-muted-foreground", collapsed }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = location === href;
  const { detachWindow, isDetached } = useWindow();
  
  // Check if this route is currently detached
  const detached = isDetached(`window-${href.replace(/\//g, '')}`);

  const handleDetach = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a simple representation of the content
    detachWindow({
      id: `window-${href.replace(/\//g, '')}`,
      title: title,
      route: href,
      content: `<div style="text-align: center; padding: 20px;">
        <h3>${title} content is loading...</h3>
        <p>This window will show ${title} content.</p>
      </div>`
    });
  };

  if (collapsed) {
    return (
      <div className={cn(
        "flex items-center space-x-2 rounded-lg px-2 py-1.5", 
        isActive ? "bg-accent/10 text-accent" : "text-muted-foreground"
      )}>
        {React.cloneElement(icon as React.ReactElement, {
          className: cn("h-4 w-4", isActive ? "text-accent" : "text-muted-foreground"),
        })}
        <span>{title}</span>
        {badge && (
          <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link href={href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1 border-l-2 border-transparent rounded-r-md rounded-l-none transition-all",
            isActive
              ? "bg-accent/10 text-accent border-l-accent font-medium shadow-md transform hover:translate-x-0.5"
              : "text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:shadow-sm hover:translate-x-0.5"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.2s ease',
          }}
        >
          <div className={cn(
            "absolute inset-0 rounded-r-md opacity-0 transition-opacity",
            isActive ? "bg-gradient-to-r from-transparent via-accent/10 to-transparent opacity-100" : ""
          )}></div>
          {React.cloneElement(icon as React.ReactElement, {
            className: cn(
              "mr-2 h-4 w-4 transition-transform", 
              isActive ? "text-accent scale-110" : "text-muted-foreground"
            ),
            style: { transform: isActive ? 'translateZ(3px)' : 'translateZ(0)' },
          })}
          <span style={{ transform: isActive ? 'translateZ(2px)' : 'translateZ(0)' }}>
            {title}
          </span>
          {badge && (
            <span 
              className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeColor}`}
              style={{ transform: 'translateZ(4px)' }}
            >
              {badge}
            </span>
          )}
        </Button>
      </Link>
      
      {/* Pop-out/tear-away button */}
      <div className={cn(
        "absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity",
        "group-hover:opacity-100",
        detached ? "opacity-100" : ""
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full bg-muted hover:bg-muted-foreground/20"
                onClick={handleDetach}
                style={{ transform: 'translateZ(5px)' }}
              >
                {detached ? (
                  <MinusSquare className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{detached ? 'Already in separate window' : 'Open in new window'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isCollapsed?: boolean;
}

function SidebarSection({ title, children, icon, isCollapsed }: SidebarSectionProps) {
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="mb-4 mt-4 flex justify-center">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shadow-sm"
                style={{ transform: 'translateZ(3px)' }}>
                {icon || <FileBarChart className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="min-w-[160px]">
            <p className="font-medium">{title}</p>
            <div className="mt-2 space-y-1">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child, { collapsed: true } as any);
                }
                return child;
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="mb-5">
      <div className="flex items-center px-4 mb-2">
        {icon && React.cloneElement(icon as React.ReactElement, {
          className: "h-4 w-4 text-muted-foreground mr-2",
        })}
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { isExpanded, isPinned, toggleExpanded, togglePinned, expandSidebar, collapseSidebar } = useSidebar();
  const [autoHideEnabled, setAutoHideEnabled] = useState(true);
  
  const handleMouseEnter = () => {
    expandSidebar();
  };
  
  const handleMouseLeave = () => {
    if (!isPinned) {
      collapseSidebar();
    }
  };
  
  // Functions to match the old API
  const toggleSidebar = () => toggleExpanded();
  const pinSidebar = (pinned: boolean) => {
    if (pinned !== isPinned) {
      togglePinned();
    }
  };
  const toggleAutoHide = (enabled: boolean) => {
    setAutoHideEnabled(enabled);
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 relative z-20",
        isExpanded ? "w-56" : "w-16",
        "border-r overflow-hidden",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 3D styled toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-3 right-3 z-50 h-6 w-6 rounded-full shadow-md transition-all border",
          "hover:bg-primary/10 hover:border-accent/30",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-0",
          "text-muted-foreground",
          isPinned ? "opacity-100" : "opacity-70 hover:opacity-100"
        )}
        onClick={toggleExpanded}
        style={{
          transform: 'translateZ(5px)',
          boxShadow: '0 2px 8px -4px rgba(0, 0, 0, 0.15)',
        }}
      >
        {isExpanded ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Pin/Auto-hide controls */}
      {isExpanded && (
        <div className="absolute top-14 right-3 z-50 flex flex-col space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full shadow-sm transition-all border",
                    isPinned
                      ? "bg-accent/10 text-accent border-accent/30"
                      : "text-muted-foreground border-border opacity-70 hover:opacity-100"
                  )}
                  onClick={togglePinned}
                  style={{
                    transform: 'translateZ(5px)',
                  }}
                >
                  {isPinned ? (
                    <Pin className="h-3.5 w-3.5" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isPinned ? 'Unpin sidebar' : 'Pin sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Auto-hide toggle in sidebar footer */}
      {isExpanded && (
        <div className="absolute bottom-4 left-0 right-0 px-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-hide" className="text-xs text-muted-foreground">Auto-hide</Label>
            <Switch
              id="auto-hide"
              checked={autoHideEnabled}
              onCheckedChange={setAutoHideEnabled}
              className="scale-75 data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="py-4">
          <div className="mt-2">
            {/* ── 1. WORKSPACE ─────────────────────────────── */}
            <SidebarSection
              title="Workspace"
              icon={<Home className="h-4 w-4" />}
              isCollapsed={!isExpanded}
            >
              <SidebarItem href="/dashboard" title="Dashboard" icon={<Home />} />
              <SidebarItem href="/calculator" title="Cost Estimator" icon={<Calculator />} />
            </SidebarSection>
            
            {/* ── 2. COST ANALYTICS ────────────────────────── */}
            {/* v1: analytics pages use fabricated demo data.                */}
            {/* Removed from primary nav to prevent assessor confusion.      */}
            {/* Routes still exist for dev access — sidebar links return     */}
            {/* when pages wire to real CostForge analytics endpoints (v1.2).*/}

            {/* ── 4. REPORTS ───────────────────────────────── */}
            <SidebarSection
              title="Reports"
              icon={<FileBarChart className="h-4 w-4" />}
              isCollapsed={!isExpanded}
            >
              <SidebarItem href="/reports" title="Reports" icon={<FileBarChart />} />
              <SidebarItem href="/data-import" title="Data Import / Export" icon={<Database />} />
            </SidebarSection>
            
            {/* ── 5. ADMIN / INTEGRATIONS ──────────────────── */}
            <SidebarSection
              title="Admin / Integrations"
              icon={<Settings className="h-4 w-4" />}
              isCollapsed={!isExpanded}
            >
              <SidebarItem href="/settings/ftp-sync" title="Settings" icon={<Settings />} />
              <SidebarItem href="/mcp-overview" title="Integrations" icon={<Share2 />} />
              <SidebarItem href="/mcp-dashboard" title="Integration Health" icon={<Activity />} />
              {isAdmin && (
                <SidebarItem href="/users" title="User Management" icon={<Users />} />
              )}
            </SidebarSection>
          </div>
        </div>
      </ScrollArea>
      
      {/* Bottom empty space for auto-hide toggle */}
      <div className="h-14"></div>
    </div>
  );
}
