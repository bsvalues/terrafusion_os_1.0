
import { PropertyMetrics } from "./PropertyMetrics";
import { CountyStatistics } from "./CountyStatistics";
import { PerformanceKPIs } from "./PerformanceKPIs";

export function AnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <div><>

        <h2 className="text-2xl font-bold text-white mb-2">Property Assessment Analytics</h2>
        <p
</> className="text-slate-300">Real-time insights and performance metrics</p>
      </div>
      
      <PropertyMetrics />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><>

          <CountyStatistics />
        </div>
        <div
</>>
          <PerformanceKPIs />
        </div>
      </div>
    </div>
  );
}
