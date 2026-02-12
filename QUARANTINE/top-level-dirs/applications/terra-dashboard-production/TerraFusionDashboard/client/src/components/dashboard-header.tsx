import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  isConnected?: boolean;
  title?: string;
  subtitle?: string;
}

export default function DashboardHeader({ isConnected, title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="tf-nav bg-tf-dark border-b border-tf-accent/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
<>
            <h1 className="tf-h2 text-tf-primary">{title || "Terrafusion Platform Dashboard"}</h1>
            <Badge
</> variant="outline" className="bg-tf-success/10 text-tf-success border-tf-success/30 font-semibold">
              v2.0 Production Enterprise
            </Badge>
          </div>
          <p className="tf-body-small text-tf-secondary">{subtitle || "Benton County Washington - Enterprise AI Assessment Platform with Production Deployment"}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tf-success' : 'bg-tf-error'}`} />
            <span className="tf-body-small text-tf-secondary">
              {isConnected ? 'All Systems Operational' : 'Connection Issues'}
            </span>
          </div>
          
          {/* Notification Bell */}
          <button className="relative p-2 text-tf-secondary hover:text-tf-accent rounded-lg hover:bg-tf-medium/30 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span
</> className="absolute top-1 right-1 w-2 h-2 bg-tf-accent rounded-full tf-glow-pulse" />
          </button>
          
          {/* Deploy Button */}
          <Button className="tf-button-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
            Deploy County System
          </Button>
        </div>
      </div>
    </header>
  );
}
