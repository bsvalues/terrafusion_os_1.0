// TerraFusion OS — DCF Income Approach Panel
// Full interactive Discounted Cash Flow engine with sensitivity matrix.
// Mined from bsvalues/TerraFusion-Valuator-Pro-Studio components/dcf-income-approach.tsx
// Adapted: hardcoded dark tokens → CSS vars; raw inputs kept for appraisal editing UX;
//          removed "use client" (Vite/React SPA); no Supabase deps.

import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Building2, Calculator, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tenant {
  id: string;
  name: string;
  suite: string;
  sqft: number;
  leaseStart: string;
  leaseEnd: string;
  currentRent: number;       // $/sf/year
  annualEscalation: number;  // %
  renewalProbability: number;// %
  renewalTerm: number;       // years
  renewalRentAdj: number;    // % change at renewal
  tenantImprovements: number;// $/sf at renewal
  leasingCommission: number; // % of new rent
  creditRating: "A" | "B" | "C" | "D";
}

interface DCFInputs {
  totalSqft: number;
  propertyType: string;
  marketRentPsf: number;
  marketVacancyRate: number;
  rentGrowthRate: number;
  expenseGrowthRate: number;
  operatingExpenses: number;
  managementFee: number;
  insurancePsf: number;
  realEstateTaxPsf: number;
  maintenancePsf: number;
  reservesPsf: number;
  discountRate: number;
  terminalCapRate: number;
  holdingPeriod: number;
  acquisitionCosts: number;
  dispositionCosts: number;
  tenants: Tenant[];
}

interface YearlyProjection {
  year: number;
  pgi: number;
  vacancy: number;
  egi: number;
  opex: number;
  noi: number;
  capex: number;
  ncf: number;
  dcf: number;
  cumDcf: number;
}

// ---------------------------------------------------------------------------
// DCF Engine (self-contained)
// ---------------------------------------------------------------------------

function calculateDCF(inputs: DCFInputs) {
  const {
    totalSqft, marketRentPsf, marketVacancyRate, rentGrowthRate, expenseGrowthRate,
    operatingExpenses, managementFee, insurancePsf, realEstateTaxPsf, maintenancePsf,
    reservesPsf, discountRate, terminalCapRate, holdingPeriod, dispositionCosts, tenants,
  } = inputs;

  const dr = discountRate / 100;
  const rg = rentGrowthRate / 100;
  const eg = expenseGrowthRate / 100;
  const vac = marketVacancyRate / 100;

  const projections: YearlyProjection[] = [];
  let cumDcf = 0;

  for (let yr = 1; yr <= holdingPeriod; yr++) {
    let tenantIncome = 0;
    let leasedSqft = 0;

    for (const t of tenants) {
      const leaseEndYear = new Date(t.leaseEnd).getFullYear();
      const currentYear = new Date().getFullYear() + yr - 1;
      if (leaseEndYear >= currentYear) {
        const contractRent = t.currentRent * Math.pow(1 + t.annualEscalation / 100, yr - 1);
        tenantIncome += contractRent * t.sqft;
        leasedSqft += t.sqft;
      } else {
        const renewProb = t.renewalProbability / 100;
        const renewRent = marketRentPsf * Math.pow(1 + rg, yr - 1) * (1 + t.renewalRentAdj / 100);
        tenantIncome += renewProb * renewRent * t.sqft;
        leasedSqft += renewProb * t.sqft;
      }
    }

    const remainingSqft = Math.max(0, totalSqft - leasedSqft);
    const marketIncome = remainingSqft * marketRentPsf * Math.pow(1 + rg, yr - 1);
    const pgi = tenantIncome + marketIncome;
    const vacancyLoss = pgi * vac;
    const egi = pgi - vacancyLoss;
    const baseOpex = (operatingExpenses + insurancePsf + realEstateTaxPsf + maintenancePsf) * totalSqft;
    const mgmtFee = (managementFee / 100) * egi;
    const reserves = reservesPsf * totalSqft;
    const totalOpex = (baseOpex + mgmtFee + reserves) * Math.pow(1 + eg, yr - 1);
    const noi = egi - totalOpex;

    let capex = 0;
    for (const t of tenants) {
      const leaseEndYear = new Date(t.leaseEnd).getFullYear();
      const currentYear = new Date().getFullYear() + yr - 1;
      if (leaseEndYear === currentYear) {
        const renewRent = marketRentPsf * Math.pow(1 + rg, yr - 1);
        capex += t.tenantImprovements * t.sqft * (t.renewalProbability / 100);
        capex += (t.leasingCommission / 100) * renewRent * t.sqft * (1 - t.renewalProbability / 100);
      }
    }

    const ncf = noi - capex;
    const dcf = ncf / Math.pow(1 + dr, yr);
    cumDcf += dcf;
    projections.push({ year: yr, pgi, vacancy: vacancyLoss, egi, opex: totalOpex, noi, capex, ncf, dcf, cumDcf });
  }

  const terminalNOI = projections[projections.length - 1].noi * (1 + rg);
  const grossTerminalValue = terminalNOI / (terminalCapRate / 100);
  const dispositionCost = grossTerminalValue * (dispositionCosts / 100);
  const netTerminalValue = grossTerminalValue - dispositionCost;
  const presentValueReversion = netTerminalValue / Math.pow(1 + dr, holdingPeriod);
  const presentValueNOI = cumDcf;
  const indicatedValue = presentValueNOI + presentValueReversion;

  const yr1Noi = projections[0]?.noi || 0;
  const directCapValue = yr1Noi / (terminalCapRate / 100);
  const yr1CapRate = (yr1Noi / indicatedValue) * 100;
  const avgNoi = projections.reduce((s, p) => s + p.noi, 0) / projections.length;

  // Newton-Raphson IRR
  const cashFlows = [-indicatedValue, ...projections.map((p) => p.ncf), netTerminalValue];
  let irr = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + irr, i);
      dnpv -= i * cashFlows[i] / Math.pow(1 + irr, i + 1);
    }
    const delta = npv / dnpv;
    irr -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }

  const equityMultiple = (projections.reduce((s, p) => s + p.ncf, 0) + netTerminalValue) / indicatedValue;

  return { projections, terminalValue: netTerminalValue, presentValueNOI, presentValueReversion, indicatedValue, irr: irr * 100, equityMultiple, directCapValue, yr1CapRate, yr1Noi, avgNoi };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_TENANT: Tenant = {
  id: "T1", name: "Anchor Tenant LLC", suite: "100", sqft: 5000,
  leaseStart: "2023-01-01", leaseEnd: "2027-12-31",
  currentRent: 28, annualEscalation: 3, renewalProbability: 75,
  renewalTerm: 5, renewalRentAdj: 5, tenantImprovements: 25, leasingCommission: 4, creditRating: "A",
};

const DEFAULT_INPUTS: DCFInputs = {
  totalSqft: 20000, propertyType: "Office",
  marketRentPsf: 30, marketVacancyRate: 8, rentGrowthRate: 3, expenseGrowthRate: 2.5,
  operatingExpenses: 8, managementFee: 4, insurancePsf: 0.5, realEstateTaxPsf: 2.5,
  maintenancePsf: 1.5, reservesPsf: 0.25, discountRate: 8.5, terminalCapRate: 7.0,
  holdingPeriod: 10, acquisitionCosts: 1.5, dispositionCosts: 2.0, tenants: [DEFAULT_TENANT],
};

// ---------------------------------------------------------------------------
// Shared input style (appraisal terminal aesthetic, kept intentional)
// ---------------------------------------------------------------------------
const INPUT_CLS =
  "w-20 bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-mono text-right focus:border-primary outline-none";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DcfPanelProps {
  initialSqft?: number;
  initialPropertyType?: string;
  onValueChange?: (value: number) => void;
}

export function DcfPanel({ initialSqft = 20000, initialPropertyType = "Office", onValueChange }: DcfPanelProps) {
  const [inputs, setInputs] = useState<DCFInputs>({ ...DEFAULT_INPUTS, totalSqft: initialSqft, propertyType: initialPropertyType });
  const [showTenants, setShowTenants] = useState(true);
  const [activeView, setActiveView] = useState<"projections" | "sensitivity" | "assumptions">("projections");

  const results = useMemo(() => {
    const r = calculateDCF(inputs);
    onValueChange?.(r.indicatedValue);
    return r;
  }, [inputs, onValueChange]);

  const upd = (field: keyof DCFInputs, value: unknown) => setInputs((p) => ({ ...p, [field]: value }));

  const addTenant = () => {
    const newTenant: Tenant = { ...DEFAULT_TENANT, id: `T${Date.now()}`, name: `Tenant ${inputs.tenants.length + 1}`, suite: `${(inputs.tenants.length + 1) * 100}` };
    upd("tenants", [...inputs.tenants, newTenant]);
  };

  const removeTenant = (id: string) => upd("tenants", inputs.tenants.filter((t) => t.id !== id));

  const updateTenant = (id: string, field: keyof Tenant, value: unknown) =>
    upd("tenants", inputs.tenants.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;
  const fmtPsf = (n: number) => `$${n.toFixed(2)}/sf`;

  const leasedSqft = inputs.tenants.reduce((s, t) => s + t.sqft, 0);
  const occupancy = Math.min(100, (leasedSqft / inputs.totalSqft) * 100);

  // 7×7 sensitivity
  const sensitivityData = useMemo(() => {
    const drRange = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
    const crRange = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
    return drRange.map((drDelta) =>
      crRange.map((crDelta) => calculateDCF({ ...inputs, discountRate: inputs.discountRate + drDelta, terminalCapRate: inputs.terminalCapRate + crDelta }).indicatedValue)
    );
  }, [inputs]);

  const baseValue = results.indicatedValue;

  const ROWS = [
    { key: "pgi",     label: "Potential Gross Income",       color: "text-foreground",         bold: false, neg: false },
    { key: "vacancy", label: "Less: Vacancy & Credit Loss",  color: "text-destructive",        bold: false, neg: true  },
    { key: "egi",     label: "Effective Gross Income",       color: "text-primary",            bold: true,  neg: false },
    { key: "opex",    label: "Less: Operating Expenses",     color: "text-destructive",        bold: false, neg: true  },
    { key: "noi",     label: "Net Operating Income",         color: "text-chart-2",            bold: true,  neg: false },
    { key: "capex",   label: "Less: Capital Expenditures",   color: "text-destructive",        bold: false, neg: true  },
    { key: "ncf",     label: "Net Cash Flow",                color: "text-chart-4",            bold: true,  neg: false },
    { key: "dcf",     label: "Discounted Cash Flow (PV)",    color: "text-chart-5",            bold: false, neg: false },
    { key: "cumDcf",  label: "Cumulative PV of NOI",         color: "text-muted-foreground",   bold: false, neg: false },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-chart-2 tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            INCOME CAPITALIZATION APPROACH — DCF MODEL
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            USPAP SR 1-4(b) · {inputs.holdingPeriod}-Year Discounted Cash Flow with Reversion
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">INDICATED VALUE</div>
          <div className="text-2xl font-bold text-chart-2 font-mono">{fmt(results.indicatedValue)}</div>
          <div className="text-xs text-muted-foreground font-mono">
            IRR: {fmtPct(results.irr)} · EM: {results.equityMultiple.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: "Yr 1 NOI",     value: fmt(results.yr1Noi),          sub: fmtPsf(results.yr1Noi / inputs.totalSqft) },
          { label: "Avg NOI",      value: fmt(results.avgNoi),           sub: `${inputs.holdingPeriod}-yr avg` },
          { label: "Going-In Cap", value: fmtPct(results.yr1CapRate),    sub: "Yr 1 NOI / Value" },
          { label: "Terminal Cap", value: fmtPct(inputs.terminalCapRate),sub: "Exit cap rate" },
          { label: "IRR",          value: fmtPct(results.irr),           sub: "Levered" },
          { label: "Direct Cap",   value: fmt(results.directCapValue),   sub: `@ ${inputs.terminalCapRate}%` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg border border-border/30 p-2.5">
            <div className="text-[10px] text-muted-foreground font-mono">{label}</div>
            <div className="text-sm font-bold text-foreground font-mono mt-0.5">{value}</div>
            <div className="text-[10px] text-muted-foreground/60">{sub}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["projections", "sensitivity", "assumptions"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={cn(
              "px-4 py-2 text-xs font-mono font-bold border-b-2 transition-colors",
              activeView === v ? "border-chart-2 text-chart-2" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {v === "projections" ? "10-YEAR PROJECTIONS" : v === "sensitivity" ? "SENSITIVITY MATRIX" : "ASSUMPTIONS"}
          </button>
        ))}
      </div>

      {/* Projections Table */}
      {activeView === "projections" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-normal">METRIC</th>
                {results.projections.map((p) => (
                  <th key={p.year} className="text-right py-2 px-2 text-muted-foreground font-normal">YR {p.year}</th>
                ))}
                <th className="text-right py-2 px-2 text-muted-foreground font-normal">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label, color, bold, neg }) => {
                const total = results.projections.reduce((s, p) => s + (p[key as keyof YearlyProjection] as number), 0);
                return (
                  <tr key={key} className="border-b border-border/40 hover:bg-muted/30">
                    <td className={cn("py-1.5 px-2", color, bold && "font-bold")}>{label}</td>
                    {results.projections.map((p) => {
                      const val = p[key as keyof YearlyProjection] as number;
                      return (
                        <td key={p.year} className={cn("text-right py-1.5 px-2", color, bold && "font-bold")}>
                          {neg && val > 0 ? `(${fmt(val)})` : fmt(val)}
                        </td>
                      );
                    })}
                    <td className={cn("text-right py-1.5 px-2 border-l border-border", color, bold && "font-bold")}>
                      {key === "cumDcf" ? fmt(results.projections[results.projections.length - 1].cumDcf) : neg && total > 0 ? `(${fmt(total)})` : fmt(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Reversion summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/30 p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">PV OF NOI CASH FLOWS</div>
              <div className="text-lg font-bold text-primary font-mono">{fmt(results.presentValueNOI)}</div>
              <div className="text-[10px] text-muted-foreground/60">{((results.presentValueNOI / results.indicatedValue) * 100).toFixed(1)}% of total value</div>
            </div>
            <div className="rounded-lg border border-border/30 p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">PV OF REVERSION</div>
              <div className="text-lg font-bold text-chart-5 font-mono">{fmt(results.presentValueReversion)}</div>
              <div className="text-[10px] text-muted-foreground/60">
                Terminal NOI: {fmt(results.projections[results.projections.length - 1].noi * (1 + inputs.rentGrowthRate / 100))} ÷ {inputs.terminalCapRate}%
              </div>
            </div>
            <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">INDICATED VALUE (DCF)</div>
              <div className="text-lg font-bold text-chart-2 font-mono">{fmt(results.indicatedValue)}</div>
              <div className="text-[10px] text-muted-foreground/60">${(results.indicatedValue / inputs.totalSqft).toFixed(0)}/sf overall</div>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity Matrix */}
      {activeView === "sensitivity" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground font-mono">
            Indicated value sensitivity to Discount Rate (rows) vs Terminal Cap Rate (columns). Base case highlighted.
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-muted-foreground text-left">DR \ Cap Rate</th>
                  {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((d) => (
                    <th key={d} className={cn("px-3 py-2 text-right", d === 0 ? "text-chart-2" : "text-muted-foreground")}>
                      {(inputs.terminalCapRate + d).toFixed(1)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((drDelta, ri) => (
                  <tr key={drDelta} className="border-t border-border/40">
                    <td className={cn("px-3 py-2", drDelta === 0 ? "text-chart-2 font-bold" : "text-muted-foreground")}>
                      {(inputs.discountRate + drDelta).toFixed(1)}%
                    </td>
                    {sensitivityData[ri].map((val, ci) => {
                      const pct = ((val - baseValue) / baseValue) * 100;
                      const isBase = drDelta === 0 && ci === 3;
                      return (
                        <td
                          key={ci}
                          className={cn(
                            "px-3 py-2 text-right border border-border/40",
                            isBase ? "bg-chart-2/20 text-chart-2 font-bold" :
                            pct > 10  ? "bg-primary/10 text-primary" :
                            pct < -10 ? "bg-destructive/10 text-destructive" :
                            "text-foreground"
                          )}
                        >
                          <div>{fmt(val)}</div>
                          {!isBase && (
                            <div className={cn("text-[10px]", pct >= 0 ? "text-chart-2" : "text-destructive")}>
                              {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {activeView === "assumptions" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-chart-2 uppercase tracking-wider">Market & Income Assumptions</h4>
            {([
              { label: "Total Rentable Area", field: "totalSqft",        suffix: "sf",     step: 500 },
              { label: "Market Rent ($/sf/yr)",field: "marketRentPsf",   suffix: "$/sf/yr",step: 0.5 },
              { label: "Market Vacancy Rate",  field: "marketVacancyRate",suffix: "%",     step: 0.5 },
              { label: "Rent Growth Rate",     field: "rentGrowthRate",  suffix: "%/yr",   step: 0.25 },
              { label: "Expense Growth Rate",  field: "expenseGrowthRate",suffix: "%/yr",  step: 0.25 },
            ] as { label: string; field: keyof DCFInputs; suffix: string; step: number }[]).map(({ label, field, suffix, step }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">{label}</label>
                <div className="flex items-center gap-1">
                  <input type="number" step={step} className={INPUT_CLS} value={inputs[field] as number} onChange={(e) => upd(field, parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground/60 w-12">{suffix}</span>
                </div>
              </div>
            ))}
            <h4 className="text-xs font-mono text-chart-2 uppercase tracking-wider mt-4">Operating Expenses</h4>
            {([
              { label: "Base OpEx ($/sf/yr)",     field: "operatingExpenses", suffix: "$/sf",  step: 0.25 },
              { label: "Management Fee",           field: "managementFee",     suffix: "% EGI", step: 0.5 },
              { label: "Insurance ($/sf/yr)",      field: "insurancePsf",      suffix: "$/sf",  step: 0.1 },
              { label: "Real Estate Tax ($/sf/yr)",field: "realEstateTaxPsf",  suffix: "$/sf",  step: 0.1 },
              { label: "Maintenance ($/sf/yr)",    field: "maintenancePsf",    suffix: "$/sf",  step: 0.1 },
              { label: "Reserves ($/sf/yr)",       field: "reservesPsf",       suffix: "$/sf",  step: 0.05 },
            ] as { label: string; field: keyof DCFInputs; suffix: string; step: number }[]).map(({ label, field, suffix, step }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">{label}</label>
                <div className="flex items-center gap-1">
                  <input type="number" step={step} className={INPUT_CLS} value={inputs[field] as number} onChange={(e) => upd(field, parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground/60 w-12">{suffix}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono text-chart-2 uppercase tracking-wider">Valuation Parameters</h4>
            {([
              { label: "Discount Rate (WACC)", field: "discountRate",    suffix: "%",     step: 0.25 },
              { label: "Terminal Cap Rate",    field: "terminalCapRate", suffix: "%",     step: 0.25 },
              { label: "Holding Period",       field: "holdingPeriod",   suffix: "years", step: 1 },
              { label: "Acquisition Costs",    field: "acquisitionCosts",suffix: "%",     step: 0.25 },
              { label: "Disposition Costs",    field: "dispositionCosts",suffix: "%",     step: 0.25 },
            ] as { label: string; field: keyof DCFInputs; suffix: string; step: number }[]).map(({ label, field, suffix, step }) => (
              <div key={field} className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">{label}</label>
                <div className="flex items-center gap-1">
                  <input type="number" step={step} className={INPUT_CLS} value={inputs[field] as number} onChange={(e) => upd(field, parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground/60 w-12">{suffix}</span>
                </div>
              </div>
            ))}
            {/* Value reconciliation box */}
            <div className="rounded-lg border border-chart-2/30 bg-chart-2/5 p-3 mt-4 space-y-2">
              <div className="text-xs font-mono text-chart-2 font-bold">VALUE RECONCILIATION</div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Direct Capitalization</span>
                <span className="text-foreground font-mono">{fmt(results.directCapValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">DCF — PV of NOI</span>
                <span className="text-foreground font-mono">{fmt(results.presentValueNOI)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">DCF — PV of Reversion</span>
                <span className="text-foreground font-mono">{fmt(results.presentValueReversion)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                <span className="text-chart-2">Indicated Value (DCF)</span>
                <span className="text-chart-2 font-mono">{fmt(results.indicatedValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Per Square Foot</span>
                <span className="text-muted-foreground font-mono">${(results.indicatedValue / inputs.totalSqft).toFixed(0)}/sf</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Roll */}
      <div className="rounded-lg border border-border">
        <button
          onClick={() => setShowTenants(!showTenants)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono font-bold text-chart-2 hover:bg-muted/30"
        >
          <span className="flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            TENANT ROLL SCHEDULE ({inputs.tenants.length} tenants · {occupancy.toFixed(0)}% occupied · {leasedSqft.toLocaleString()} sf leased)
          </span>
          {showTenants ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTenants && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={addTenant} className="text-xs font-mono text-chart-2 border border-chart-2/50 rounded px-3 py-1 hover:bg-chart-2/10">
                + ADD TENANT
              </button>
            </div>

            {inputs.tenants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs font-mono">
                No tenants added. Click "+ ADD TENANT" to add lease information.
              </div>
            ) : (
              inputs.tenants.map((tenant) => {
                const creditColors: Record<Tenant["creditRating"], string> = {
                  A: "bg-chart-2/20 text-chart-2",
                  B: "bg-primary/20 text-primary",
                  C: "bg-chart-4/20 text-chart-4",
                  D: "bg-destructive/20 text-destructive",
                };
                const expired = new Date(tenant.leaseEnd) < new Date();
                return (
                  <div key={tenant.id} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-mono font-bold", creditColors[tenant.creditRating])}>
                          {tenant.creditRating}
                        </span>
                        <input
                          className="bg-transparent text-sm text-foreground font-mono font-bold focus:outline-none border-b border-transparent focus:border-border"
                          value={tenant.name}
                          onChange={(e) => updateTenant(tenant.id, "name", e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeTenant(tenant.id)} className="text-xs text-destructive hover:text-destructive/80 font-mono">
                        REMOVE
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      {[
                        { lbl: "SUITE",           field: "suite",              type: "text" as const },
                        { lbl: "SQFT",            field: "sqft",               type: "number" as const, step: 100 },
                        { lbl: "LEASE START",     field: "leaseStart",         type: "date" as const },
                        { lbl: "LEASE END",       field: "leaseEnd",           type: "date" as const },
                        { lbl: "RENT ($/SF/YR)",  field: "currentRent",        type: "number" as const, step: 0.5 },
                        { lbl: "ESCALATION %/YR", field: "annualEscalation",   type: "number" as const, step: 0.25 },
                        { lbl: "RENEWAL PROB %",  field: "renewalProbability", type: "number" as const, step: 5 },
                        { lbl: "TI AT RENEWAL ($/SF)", field: "tenantImprovements", type: "number" as const, step: 1 },
                        { lbl: "LEASING COMM %",  field: "leasingCommission",  type: "number" as const, step: 0.5 },
                      ].map(({ lbl, field, type, step }) => (
                        <div key={field}>
                          <label className="block text-muted-foreground/70 mb-1">{lbl}</label>
                          <input
                            type={type}
                            step={step}
                            className="w-full bg-background border border-border rounded px-2 py-1 text-foreground font-mono focus:border-primary outline-none text-xs"
                            value={tenant[field as keyof Tenant] as string | number}
                            onChange={(e) => updateTenant(tenant.id, field as keyof Tenant, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-muted-foreground/70 mb-1">CREDIT RATING</label>
                        <select
                          className="w-full bg-background border border-border rounded px-2 py-1 text-foreground font-mono focus:border-primary outline-none text-xs"
                          value={tenant.creditRating}
                          onChange={(e) => updateTenant(tenant.id, "creditRating", e.target.value as Tenant["creditRating"])}
                        >
                          <option value="A">A — Investment Grade</option>
                          <option value="B">B — Good Credit</option>
                          <option value="C">C — Speculative</option>
                          <option value="D">D — High Risk</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex items-end">
                        <div className="w-full bg-muted/30 border border-border rounded px-3 py-1.5 text-xs text-muted-foreground font-mono">
                          Annual Rent: {fmt(tenant.currentRent * tenant.sqft)} · Expires:{" "}
                          {expired ? <span className="text-destructive">EXPIRED</span> : tenant.leaseEnd}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
