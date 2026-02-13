"use client";

import React, { Suspense } from "react";
import { TerraSphere } from "@/components/terrasphere";
import { useTerraSphereData, useHealthStatus, usePerformanceMetrics } from "@/lib/api/hooks";

// Enhanced Telemetry Hook with Real Backend Data
function useTelemetryData() {
  const { health, performance, isLoading, error } = useTerraSphereData();
  const healthQuery = useHealthStatus({ refetchInterval: 15000 });
  const performanceQuery = usePerformanceMetrics(undefined, { refetchInterval: 5000 });

  // Combine real backend data with fallback values
  const realTimeData = React.useMemo(() => {
    if (isLoading || error) {
      // Fallback to animated mock data while loading or on error
      return {
        systemLoad: Math.sin(Date.now() / 5000) * 0.3 + 0.7,
        networkActivity: Math.random() * 0.5 + 0.3,
        temperature: 0.75,
        pressure: 0.6,
        isReal: false,
        connectionStatus: isLoading ? 'connecting' : 'error',
      };
    }

    // Use real backend performance data
    const perfData = performanceQuery.data || performance;
    const healthData = healthQuery.data || health;

    return {
      systemLoad: perfData?.cpu_usage ? perfData.cpu_usage / 100 : Math.sin(Date.now() / 5000) * 0.3 + 0.7,
      networkActivity: perfData?.network_throughput ? Math.min(perfData.network_throughput / 1000, 1) : Math.random() * 0.5 + 0.3,
      temperature: perfData?.memory_usage ? Math.min(perfData.memory_usage / 8, 1) : 0.75, // Normalize memory as temperature
      pressure: healthData?.workspaces_healthy ? healthData.workspaces_healthy / 10 : 0.6, // Health as pressure
      responseTime: perfData?.response_time || 0,
      activeConnections: perfData?.active_connections || 0,
      healthyWorkspaces: healthData?.workspaces_healthy || 0,
      warnings: healthData?.warnings || 0,
      critical: healthData?.critical || 0,
      isReal: true,
      connectionStatus: 'connected',
    };
  }, [health, performance, isLoading, error, healthQuery.data, performanceQuery.data]);

  return realTimeData;
}

// TerraSphere Loading Component
function TerraSphereLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full opacity-70 animate-pulse"></div>
        </div>
      </div>
      <div className="ml-4 text-blue-600 font-medium">
        Initializing TerraSphere Engine...
      </div>
    </div>
  );
}

// Error Boundary for TerraSphere
class TerraSphereErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              TerraSphere Fallback Mode
            </h3>
            <p className="text-blue-600 text-sm">
              3D engine loading... Displaying static visualization
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main TerraSphere Container Component
export function TerraSphereContainer() {
  const telemetryData = useTelemetryData();

  return (
    <TerraSphereErrorBoundary>
      <div className="relative w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg overflow-hidden">
        <Suspense fallback={<TerraSphereLoader />}>
          <TerraSphere
            size={1.5}
            enableControls={true}
            telemetryData={telemetryData}
            className="terrasphere-canvas"
          />
        </Suspense>

        {/* Enhanced TerraSphere HUD Overlay with Real Backend Data */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white text-xs min-w-48">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-200">CPU Load:</span>
              <span className="font-mono">{(telemetryData.systemLoad * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Network:</span>
              <span className="font-mono">{(telemetryData.networkActivity * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-200">Memory:</span>
              <span className="font-mono">{(telemetryData.temperature * 100).toFixed(0)}%</span>
            </div>
            {telemetryData.isReal && (
              <>
                <div className="flex justify-between">
                  <span className="text-purple-200">Response:</span>
                  <span className="font-mono">{telemetryData.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200">Healthy:</span>
                  <span className="font-mono">{telemetryData.healthyWorkspaces}</span>
                </div>
                {(telemetryData.warnings || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-yellow-200">Warnings:</span>
                    <span className="font-mono text-yellow-300">{telemetryData.warnings}</span>
                  </div>
                )}
                {(telemetryData.critical || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-200">Critical:</span>
                    <span className="font-mono text-red-300">{telemetryData.critical}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Enhanced TerraSphere Status Indicator */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full animate-pulse ${
              telemetryData.connectionStatus === 'connected' 
                ? 'bg-green-400' 
                : telemetryData.connectionStatus === 'connecting'
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
          ></div>
          <span className="text-white/80 text-xs font-medium">
            {telemetryData.connectionStatus === 'connected' 
              ? `TerraSphere Live ${telemetryData.isReal ? '(Backend Connected)' : '(Demo Mode)'}`
              : telemetryData.connectionStatus === 'connecting'
              ? 'Connecting to Backend...'
              : 'Backend Connection Error'
            }
          </span>
        </div>
      </div>
    </TerraSphereErrorBoundary>
  );
}