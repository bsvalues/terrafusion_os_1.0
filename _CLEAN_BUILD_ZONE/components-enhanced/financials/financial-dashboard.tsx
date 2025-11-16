import { RevenueOverview } from "./revenue-overview"
import { StateFinancials } from "./state-financials"
import { ROIAnalysis } from "./roi-analysis"
import { RevenueForecasting } from "./revenue-forecasting"
import { FinancialMetrics } from "./financial-metrics"
import { InvestmentTracking } from "./investment-tracking"

export function FinancialDashboard() {
  return (
    <div className="space-y-8">
      <RevenueOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StateFinancials /><>

        <ROIAnalysis />
      </div>
      <RevenueForecasting
</>
/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FinancialMetrics />
        <InvestmentTracking />
      </div>
    </div>
  )
}
