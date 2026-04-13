/**
 * Sidebar — OS-style vertical side taskbar.
 *
 * Three modes:
 *   compact  — narrow icon rail (DEFAULT, acts like OS taskbar)
 *   expanded — icon rail + label panel slides out
 *   hidden   — completely gone; thin edge strip on left lets you bring it back
 *
 * Mode persists to localStorage via SidebarContext.
 */
import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Home,
  Calculator,
  BrainCircuit,
  Building2,
  FileBarChart,
  Zap,
  Map,
  FlaskConical,
  Bot,
  TrendingUp,
  Network,
  SlidersHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Nav data ─────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  title: string;
  icon: React.ReactNode;
}

const NAV_SECTIONS: { key: string; title: string; icon: React.ReactNode; items: NavItem[] }[] = [
  {
    key: "workspace",
    title: "Workspace",
    icon: <Home className="h-4 w-4" />,
    items: [
      { href: "/dashboard",  title: "Dashboard",      icon: <Home className="h-[18px] w-[18px]" /> },
      { href: "/properties", title: "Properties",     icon: <Building2 className="h-[18px] w-[18px]" /> },
      { href: "/calculator", title: "Cost Estimator", icon: <Calculator className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    key: "analysis",
    title: "Analysis",
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      { href: "/analytics",                title: "Analytics",          icon: <BarChart3 className="h-[18px] w-[18px]" /> },
      { href: "/benchmarking",             title: "Benchmarking",       icon: <TrendingUp className="h-[18px] w-[18px]" /> },
      { href: "/what-if-scenarios",        title: "What-If Scenarios",  icon: <FlaskConical className="h-[18px] w-[18px]" /> },
      { href: "/regional-cost-comparison", title: "Reval Area Costs",   icon: <Map className="h-[18px] w-[18px]" /> },
      { href: "/calibration",             title: "Calibration",         icon: <SlidersHorizontal className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    key: "ai",
    title: "AI & Agents",
    icon: <Bot className="h-4 w-4" />,
    items: [
      { href: "/ai-tools",       title: "AI Tools",       icon: <Zap className="h-[18px] w-[18px]" /> },
      { href: "/ai-cost-wizard", title: "AI Cost Wizard", icon: <BrainCircuit className="h-[18px] w-[18px]" /> },
      { href: "/ai-swarm",       title: "AI Swarm",       icon: <Network className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    key: "reports",
    title: "Reports",
    icon: <FileBarChart className="h-4 w-4" />,
    items: [
      { href: "/reports", title: "Reports", icon: <FileBarChart className="h-[18px] w-[18px]" /> },
    ],
  },
];

// ─── TaskbarItem ──────────────────────────────────────────────────────────────
// Single icon button with active indicator, shown in the icon rail.

function TaskbarItem({ href, title, icon, showLabel }: NavItem & { showLabel?: boolean }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  if (showLabel) {
    // Expanded mode: icon + label row
    return (
      <Link href={href}>
        <button
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 text-left",
            isActive
              ? "bg-accent/15 text-accent font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span className={cn("flex-none", isActive ? "text-accent" : "text-muted-foreground")}>
            {icon}
          </span>
          <span className="truncate">{title}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent flex-none" />
          )}
        </button>
      </Link>
    );
  }

  // Compact mode: icon-only with left active bar
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <Link href={href}>
            <button
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all mx-auto mb-1",
                isActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {/* Active indicator — left bar */}
              {isActive && (
                <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent" />
              )}
              {icon}
            </button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ title, showLabel }: { title: string; showLabel?: boolean }) {
  if (showLabel) {
    return (
      <div className="flex items-center gap-2 px-3 pt-4 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>
    );
  }
  // Compact: just a subtle separator line
  return <div className="mx-auto w-5 h-px bg-border/50 my-2" />;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const TASKBAR_W = 52;   // px — compact icon rail width
const LABEL_W   = 172;  // px — label panel width (added to taskbar)

export default function Sidebar({ className }: { className?: string }) {
  const { mode, setMode, cycleMode } = useSidebar();

  // ── Hidden mode: edge strip only ──────────────────────────────────────────
  if (mode === "hidden") {
    return (
      <div className="relative flex-none" style={{ width: 0 }}>
        <TooltipProvider>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMode("compact")}
                aria-label="Show sidebar"
                className={cn(
                  "absolute left-0 top-0 h-full z-30",
                  "w-1.5 bg-border/30 hover:bg-accent/50 transition-colors",
                  "flex flex-col items-center justify-center"
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Show taskbar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  const isExpanded = mode === "expanded";
  const totalWidth = isExpanded ? TASKBAR_W + LABEL_W : TASKBAR_W;

  return (
    <div
      className={cn(
        "flex-none flex flex-row transition-all duration-200 relative z-20",
        className
      )}
      style={{ width: totalWidth }}
    >
      {/* ── Icon rail (always present in compact + expanded) ──────────────── */}
      <div
        className="flex flex-col border-r bg-card"
        style={{
          width: TASKBAR_W,
          minWidth: TASKBAR_W,
          boxShadow: "1px 0 0 hsl(var(--border))",
        }}
      >
        {/* Top: logo / branding mark */}
        <div className="flex items-center justify-center h-12 border-b flex-none">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={cycleMode}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-accent hover:bg-accent/10 transition-colors font-bold text-xs tracking-tight"
                  aria-label="Toggle sidebar mode"
                >
                  CF
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {mode === "compact" ? "Expand labels" : "Collapse labels"} · hold to hide
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Nav icons */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="py-3 px-1.5">
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.key}>
                {i > 0 && <SectionDivider title={section.title} showLabel={false} />}
                {section.items.map((item) => (
                  <TaskbarItem key={item.href} {...item} showLabel={false} />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom tray */}
        <div className="flex-none border-t p-1.5 flex flex-col gap-1 items-center">
          {/* Expand/collapse toggle */}
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => setMode(isExpanded ? "compact" : "expanded")}
                >
                  {isExpanded
                    ? <ChevronsLeft className="h-4 w-4" />
                    : <ChevronsRight className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {isExpanded ? "Collapse labels" : "Show labels"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Hide sidebar */}
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => setMode("hidden")}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Hide taskbar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Label panel (expanded mode only) ─────────────────────────────── */}
      {isExpanded && (
        <div
          className="flex flex-col bg-card/80 backdrop-blur-sm border-r overflow-hidden"
          style={{ width: LABEL_W }}
        >
          <div className="h-12 border-b flex items-center px-3 flex-none">
            <span className="text-sm font-semibold text-foreground">CostForge</span>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="py-3 px-2">
              {NAV_SECTIONS.map((section, i) => (
                <div key={section.key}>
                  <SectionDivider title={section.title} showLabel={true} />
                  {section.items.map((item) => (
                    <TaskbarItem key={item.href} {...item} showLabel={true} />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex-none border-t h-[52px]" />
        </div>
      )}
    </div>
  );
}
