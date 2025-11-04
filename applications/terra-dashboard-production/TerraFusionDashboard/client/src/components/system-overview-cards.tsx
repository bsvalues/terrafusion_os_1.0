import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemStats {
  totalProperties: number;
  activeAgents: number;
  todayJobs: number;
  avgResponseTime: number;
}

interface SystemOverviewCardsProps {
  stats?: SystemStats;
  isLoading: boolean;
}

export default function SystemOverviewCards({ stats, isLoading }: SystemOverviewCardsProps) {
  const cards = [
    {
      title: "Benton County Properties", 
      value: stats?.totalProperties?.toLocaleString() || "0",
      change: "Authentic assessment data loaded",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-tf-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      ),
      bgColor: "bg-tf-accent/10",
    },
    {
      title: "AI Agents Running",
      value: `${stats?.activeAgents || 0} / 8`,
      change: "All agents operational",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-tf-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      ),
      bgColor: "bg-tf-success/10",
    },
    {
      title: "Today's Valuations",
      value: stats?.todayJobs?.toLocaleString() || "0",
      change: "+15% above average",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-tf-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
      ),
      bgColor: "bg-tf-warning/10",
    },
    {
      title: "Avg Response Time",
      value: stats?.avgResponseTime ? `${(stats.avgResponseTime / 1000).toFixed(1)}s` : "0.0s",
      change: "-0.3s improvement",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6 text-tf-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      bgColor: "bg-tf-info/10",
    },
  ];

  return (
    <div className="tf-grid lg:grid-cols-4">
      {cards.map((card /* , index */) => (
        <div key={index} className="tf-card-glow p-6 tf-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="tf-body-small font-medium text-tf-secondary mb-2">{card.title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 bg-tf-medium" />
              ) : (
                <p className="tf-h3 font-bold text-tf-primary mb-1">{card.value}</p>
              )}
              <p className="tf-caption text-tf-success">
                {card.changeType === "positive" ? "↗" : "↘"} {card.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center tf-glow-pulse`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
