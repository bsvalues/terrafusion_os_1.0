/**
 * IncomeForge - standalone income approach module.
 *
 * Consumes the existing CostForge income-approach API endpoints and presents a
 * production window for cap rates, market data, expense ratios, location
 * premiums, and backend valuation math.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncomeForgeStore, type IncomeExpenses } from './incomeForgeStore';

type IncomeTab = 'valuation' | 'cap-rates' | 'market' | 'expenses' | 'locations';

const TABS: { id: IncomeTab; label: string }[] = [
  { id: 'valuation', label: 'Valuation' },
  { id: 'cap-rates', label: 'Cap Rates' },
  { id: 'market', label: 'Market Data' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'locations', label: 'Locations' },
];

const DEFAULT_EXPENSES: IncomeExpenses = {
  propertyTaxes: 12000,
  insurance: 6500,
  utilities: 0,
  maintenance: 9000,
  managementFees: 7200,
  replacementReserves: 4500,
  otherExpenses: 0,
};

const fmtCurrency = (value: number | undefined | null) =>
  value == null || !Number.isFinite(value)
    ? '-'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

const fmtNumber = (value: number | undefined | null, digits = 0) =>
  value == null || !Number.isFinite(value) ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: digits });

const fmtPct = (value: number | undefined | null, digits = 2) =>
  value == null || !Number.isFinite(value) ? '-' : `${value.toFixed(digits)}%`;

function StatsRail() {
  const stats = useIncomeForgeStore((s) => s.stats);
  const items = [
    { label: 'Property Types', value: fmtNumber(stats.propertyTypes) },
    { label: 'Locations', value: fmtNumber(stats.locations) },
    { label: 'Market Cap Rate', value: fmtPct(stats.marketCapRate) },
    { label: 'Median Home', value: fmtCurrency(stats.medianHomePrice) },
    { label: 'Median Income', value: fmtCurrency(stats.medianIncome) },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border bg-background/70 px-3 py-2">
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function ValuationTab() {
  const valuationResult = useIncomeForgeStore((s) => s.valuationResult);
  const loading = useIncomeForgeStore((s) => s.valuationLoading);
  const error = useIncomeForgeStore((s) => s.valuationError);
  const calculateValuation = useIncomeForgeStore((s) => s.calculateValuation);
  const stats = useIncomeForgeStore((s) => s.stats);
  const locationPremiums = useIncomeForgeStore((s) => s.locationPremiums);
  const [annualRentalIncome, setAnnualRentalIncome] = useState(120000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [otherIncome, setOtherIncome] = useState(5000);
  const [capRate, setCapRate] = useState(5.5);
  const [propertyType, setPropertyType] = useState('commercial');
  const [location, setLocation] = useState('Richland');
  const [expenses, setExpenses] = useState<IncomeExpenses>(DEFAULT_EXPENSES);

  useEffect(() => {
    if (stats.marketCapRate > 0) {
      setCapRate(stats.marketCapRate);
    }
  }, [stats.marketCapRate]);

  const totalExpenses = useMemo(
    () => Object.values(expenses).reduce((sum, value) => sum + value, 0),
    [expenses]
  );

  const runValuation = () => {
    void calculateValuation({
      annualRentalIncome,
      vacancyRate,
      otherIncome,
      capRate,
      propertyType,
      location,
      expenses,
    });
  };

  const updateExpense = (field: keyof IncomeExpenses, value: number) => {
    setExpenses((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(360px,520px)_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Income & Vacancy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Annual Rental Income</span>
              <input className="w-full rounded border px-2 py-1.5" type="number" value={annualRentalIncome} onChange={(event) => setAnnualRentalIncome(Number(event.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Other Income</span>
              <input className="w-full rounded border px-2 py-1.5" type="number" value={otherIncome} onChange={(event) => setOtherIncome(Number(event.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Vacancy Rate (%)</span>
              <input className="w-full rounded border px-2 py-1.5" type="number" min={0} max={100} step={0.25} value={vacancyRate} onChange={(event) => setVacancyRate(Number(event.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Cap Rate (%)</span>
              <input className="w-full rounded border px-2 py-1.5" type="number" min={0.1} max={25} step={0.05} value={capRate} onChange={(event) => setCapRate(Number(event.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Property Type</span>
              <select className="w-full rounded border px-2 py-1.5" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
                <option value="multi-family">Multi-Family</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="residential">Residential Income</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Location</span>
              <select className="w-full rounded border px-2 py-1.5" value={location} onChange={(event) => setLocation(event.target.value)}>
                {(locationPremiums.length ? locationPremiums : [{ location: 'Richland', multiplier: 1, note: '' }]).map((entry) => (
                  <option key={entry.location} value={entry.location}>{entry.location}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Operating Expenses</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(expenses) as Array<keyof IncomeExpenses>).map((field) => (
                <label key={field} className="space-y-1 text-sm">
                  <span className="text-xs text-muted-foreground">{field}</span>
                  <input className="w-full rounded border px-2 py-1.5" type="number" value={expenses[field]} onChange={(event) => updateExpense(field, Number(event.target.value))} />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded border bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total Expenses</span>
            <span className="font-semibold">{fmtCurrency(totalExpenses)}</span>
          </div>

          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" type="button" onClick={runValuation} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Valuation'}
          </button>
          {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Backend Valuation Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!valuationResult && !error && (
            <div className="text-sm text-muted-foreground">Run the valuation to calculate NOI, risk, and indicated value.</div>
          )}
          {valuationResult && (
            <div className="grid gap-3 sm:grid-cols-2">
              <ResultMetric label="Adjusted Value" value={fmtCurrency(valuationResult.adjustedValuation)} strong />
              <ResultMetric label="Raw Value" value={fmtCurrency(valuationResult.rawValuation)} />
              <ResultMetric label="NOI" value={fmtCurrency(valuationResult.netOperatingIncome)} />
              <ResultMetric label="Cap Rate" value={fmtPct(valuationResult.capRate)} />
              <ResultMetric label="Location Multiplier" value={`${valuationResult.locationMultiplier.toFixed(2)}x`} />
              <ResultMetric label="Gross Income Multiplier" value={valuationResult.grossIncomeMultiplier.toFixed(2)} />
              <ResultMetric label="Cash-on-Cash" value={fmtPct(valuationResult.cashOnCashReturn)} />
              <ResultMetric label="Risk" value={valuationResult.riskClassification} />
              <div className="sm:col-span-2 rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Source: {valuationResult.source}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? 'text-xl font-semibold' : 'text-base font-medium'}>{value}</div>
    </div>
  );
}

function CapRatesTab() {
  const capRates = useIncomeForgeStore((s) => s.capRates);
  const loading = useIncomeForgeStore((s) => s.capRatesLoading);
  const error = useIncomeForgeStore((s) => s.capRatesError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading cap rates...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3">Property Type</th>
            <th className="py-2 pr-3">Label</th>
            <th className="py-2 pr-3 text-right">Min</th>
            <th className="py-2 pr-3 text-right">Typical</th>
            <th className="py-2 text-right">Max</th>
          </tr>
        </thead>
        <tbody>
          {capRates.map((entry) => (
            <tr key={entry.propertyType} className="border-b last:border-0">
              <td className="py-2 pr-3 font-mono text-xs">{entry.propertyType}</td>
              <td className="py-2 pr-3">{entry.label}</td>
              <td className="py-2 pr-3 text-right">{fmtPct(entry.min)}</td>
              <td className="py-2 pr-3 text-right font-semibold">{fmtPct(entry.typical)}</td>
              <td className="py-2 text-right">{fmtPct(entry.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarketDataTab() {
  const marketData = useIncomeForgeStore((s) => s.marketData);
  const loading = useIncomeForgeStore((s) => s.marketLoading);
  const error = useIncomeForgeStore((s) => s.marketError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading market data...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!marketData) return <div className="text-sm text-muted-foreground">No market data loaded.</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">County Indicators</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <ResultMetric label="Median Household Income" value={fmtCurrency(marketData.medianHouseholdIncome)} />
          <ResultMetric label="Unemployment" value={fmtPct(marketData.unemploymentRate, 1)} />
          <ResultMetric label="Population Growth" value={fmtPct(marketData.populationGrowthRate, 1)} />
          <ResultMetric label="Median Home Price" value={fmtCurrency(marketData.medianHomePrice)} />
          <ResultMetric label="Median Price / Sqft" value={fmtCurrency(marketData.medianPricePerSqft)} />
          <ResultMetric label="Months Inventory" value={fmtNumber(marketData.monthsOfInventory, 1)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Employment Sectors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {marketData.employmentSectors.map((sector) => (
            <div key={sector.sector} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>{sector.sector}</span>
              <span className="font-semibold">{fmtPct(sector.percentOfTotal, 1)}</span>
            </div>
          ))}
          <div className="pt-2 text-xs text-muted-foreground">Source: {marketData.source}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpensesTab() {
  const ratios = useIncomeForgeStore((s) => s.expenseRatios);
  const categories = useIncomeForgeStore((s) => s.expenseCategories);
  const loading = useIncomeForgeStore((s) => s.expensesLoading);
  const error = useIncomeForgeStore((s) => s.expensesError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading expense ratios...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">Property Type</th>
              <th className="py-2 pr-3">Label</th>
              <th className="py-2 pr-3 text-right">Low</th>
              <th className="py-2 pr-3 text-right">Typical</th>
              <th className="py-2 text-right">High</th>
            </tr>
          </thead>
          <tbody>
            {ratios.map((entry) => (
              <tr key={entry.propertyType} className="border-b last:border-0">
                <td className="py-2 pr-3 font-mono text-xs">{entry.propertyType}</td>
                <td className="py-2 pr-3">{entry.label}</td>
                <td className="py-2 pr-3 text-right">{fmtPct(entry.lowPct, 1)}</td>
                <td className="py-2 pr-3 text-right font-semibold">{fmtPct(entry.typicalPct, 1)}</td>
                <td className="py-2 text-right">{fmtPct(entry.highPct, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Expense Categories</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="outline">{category}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LocationsTab() {
  const premiums = useIncomeForgeStore((s) => s.locationPremiums);
  const loading = useIncomeForgeStore((s) => s.locationsLoading);
  const error = useIncomeForgeStore((s) => s.locationsError);

  if (loading) return <div className="text-sm text-muted-foreground">Loading locations...</div>;
  if (error) return <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {premiums.map((premium) => (
        <Card key={premium.location}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{premium.location}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{premium.multiplier.toFixed(2)}x</div>
            <div className="mt-1 text-sm text-muted-foreground">{premium.note}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export interface IncomeForgeProps {
  metadata?: Record<string, unknown>;
}

export default function IncomeForge(_props: IncomeForgeProps = {}) {
  const [activeTab, setActiveTab] = useState<IncomeTab>('valuation');
  const fetchReferenceData = useIncomeForgeStore((s) => s.fetchReferenceData);
  const calculateValuation = useIncomeForgeStore((s) => s.calculateValuation);
  const referenceSource = useIncomeForgeStore((s) => s.referenceSource);
  const countyScope = useIncomeForgeStore((s) => s.countyScope);

  useEffect(() => {
    void fetchReferenceData();
    void calculateValuation({
      annualRentalIncome: 120000,
      vacancyRate: 5,
      otherIncome: 5000,
      capRate: 5.5,
      propertyType: 'commercial',
      location: 'Richland',
      expenses: DEFAULT_EXPENSES,
    });
  }, [calculateValuation, fetchReferenceData]);

  return (
    <div data-testid="income-forge" className="h-full overflow-auto bg-background p-5 text-foreground">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TerraForge · Income Approach</p>
          <h1 className="text-2xl font-semibold">IncomeForge</h1>
          <p className="text-sm text-muted-foreground">Cap rates, NOI modeling, expense standards, and location-adjusted valuation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Live API</Badge>
          <Badge variant="outline">CostForge income endpoints</Badge>
        </div>
      </header>

      {!countyScope.supported && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900">Benton-certified data required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            {countyScope.message}
            {countyScope.countyId && <span> Active county: {countyScope.countyId}.</span>}
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <StatsRail />
      </div>

      {referenceSource && (
        <div className="mb-4 rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Source: {referenceSource}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded border px-3 py-1.5 text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-background hover:bg-muted'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'valuation' && <ValuationTab />}
      {activeTab === 'cap-rates' && <CapRatesTab />}
      {activeTab === 'market' && <MarketDataTab />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'locations' && <LocationsTab />}
    </div>
  );
}
