// TerraFusion OS — Data Lineage Viewer
// Static 3-column visualization of a parcel's value chain:
//   Data Sources → Transformations → Outputs
// Mined from terra-forge-rebuild src/components/workbench/DataLineageViewer.tsx
// Adapted: material-bento → border/card. tf-* / suite-* tokens → CSS vars.

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GitBranch, ArrowRight, Database, Hammer, Globe, Building2, FolderOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LineageNode {
  id: string;
  label: string;
  suite: "os" | "forge" | "atlas" | "dais" | "dossier" | "trace";
  type: "source" | "transform" | "output";
  description: string;
}

const SUITE_UI: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  os:      { icon: Database,   colorClass: "text-primary",                                bgClass: "bg-primary/20" },
  forge:   { icon: Hammer,     colorClass: "text-[hsl(var(--suite-forge,25_100%_60%))]",  bgClass: "bg-[hsl(var(--suite-forge,25_100%_60%)/0.15)]" },
  atlas:   { icon: Globe,      colorClass: "text-[hsl(var(--suite-atlas,142_71%_45%))]",  bgClass: "bg-[hsl(var(--suite-atlas,142_71%_45%)/0.15)]" },
  dais:    { icon: Building2,  colorClass: "text-[hsl(var(--suite-dais,210_100%_56%))]",  bgClass: "bg-[hsl(var(--suite-dais,210_100%_56%)/0.15)]" },
  dossier: { icon: FolderOpen, colorClass: "text-[hsl(var(--suite-dossier,270_90%_65%))]",bgClass: "bg-[hsl(var(--suite-dossier,270_90%_65%)/0.15)]" },
  trace:   { icon: Shield,     colorClass: "text-chart-2",                                bgClass: "bg-chart-2/20" },
};

const LINEAGE_NODES: LineageNode[] = [
  { id: "cama",        label: "CAMA Import",        suite: "os",      type: "source",    description: "Property characteristics synced from county CAMA system" },
  { id: "sales",       label: "Sales Data",          suite: "os",      type: "source",    description: "Arms-length qualified sales from MLS and deed records" },
  { id: "gis",         label: "GIS Boundaries",      suite: "atlas",   type: "source",    description: "Parcel geometry, neighborhood polygons, flood zones" },
  { id: "calibration", label: "Model Calibration",   suite: "forge",   type: "transform", description: "Regression coefficients fitted per neighborhood" },
  { id: "cost-sched",  label: "Cost Schedules",      suite: "forge",   type: "transform", description: "RCN rates by property class, quality, and year" },
  { id: "assessment",  label: "Assessment Value",    suite: "forge",   type: "transform", description: "Final assessed value from reconciled approaches" },
  { id: "equity-check",label: "Equity Analysis",     suite: "forge",   type: "transform", description: "COD/PRD/median ratio verification per IAAO standards" },
  { id: "notice",      label: "Value Notice",        suite: "dais",    type: "output",    description: "Official notice of assessed value sent to property owner" },
  { id: "appeal",      label: "Appeal Record",       suite: "dais",    type: "output",    description: "Owner's formal appeal of assessed value" },
  { id: "dossier",     label: "Evidence Packet",     suite: "dossier", type: "output",    description: "Assembled BOE defense packet with narratives and comps" },
  { id: "trace",       label: "Audit Trail",         suite: "trace",   type: "output",    description: "Immutable record of all value changes and decisions" },
];

export function DataLineageViewer() {
  const columns = useMemo(() => ({
    source:    LINEAGE_NODES.filter((n) => n.type === "source"),
    transform: LINEAGE_NODES.filter((n) => n.type === "transform"),
    output:    LINEAGE_NODES.filter((n) => n.type === "output"),
  }), []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Data Lineage</h3>
        <span className="text-[10px] border border-border/50 rounded px-1.5 py-0.5 text-muted-foreground">Parcel Value Chain</span>
      </div>
      <p className="text-xs" style={{ color: 'hsl(var(--tf-text) / 0.78)' }}>
        Traces how a parcel's assessed value flows from raw data sources through valuation models to official outputs.
      </p>

      {/* 3-column flow */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-1">
            <Database className="w-3 h-3" /> Data Sources
          </div>
          {columns.source.map((node, i) => <LineageNodeCard key={node.id} node={node} delay={i * 0.05} />)}
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> Transformations
          </div>
          {columns.transform.map((node, i) => <LineageNodeCard key={node.id} node={node} delay={0.15 + i * 0.05} />)}
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> Outputs
          </div>
          {columns.output.map((node, i) => <LineageNodeCard key={node.id} node={node} delay={0.3 + i * 0.05} />)}
        </div>
      </div>
    </div>
  );
}

function LineageNodeCard({ node, delay }: { node: LineageNode; delay: number }) {
  const suite = SUITE_UI[node.suite];
  const Icon = suite.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="rounded-lg p-3 space-y-1"
      style={{
        border: '1px solid hsl(var(--tf-border) / 0.75)',
        background: 'hsl(var(--tf-surface) / 0.9)',
      }}
    >
      <div className="flex items-center gap-2">
        <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", suite.bgClass)}>
          <Icon className={cn("w-3.5 h-3.5", suite.colorClass)} />
        </div>
        <span className="text-xs font-semibold text-foreground">{node.label}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--tf-text) / 0.72)' }}>{node.description}</p>
    </motion.div>
  );
}
