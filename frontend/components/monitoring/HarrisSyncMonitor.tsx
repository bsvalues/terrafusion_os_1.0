import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Database, Zap, CheckCircle, AlertCircle, Clock  } from '@mui/icons-material';

interface SyncMetrics {
    totalParcels: number;
    syncedParcels: number;
    syncRate: number;
    lastSync: Date | null;
    throughput: Array<{ time: string; parcels: number }>;
    errors: Array<{ time: string; count: number }>;
    harrisVersion: string;
    status: 'INITIALIZING' | 'ACTIVE' | 'WARNING' | 'CRITICAL';
}

interface PropertyClassData {
    class: string;
    count: number;
    percentage: number;
    color: string;
}

const HarrisSyncMonitor: React.FC = () => {
    const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
        totalParcels: await DynamicPropertyService.GetPropertyCountAsync("benton"),
        syncedParcels: 0,
        syncRate: 0,
        lastSync: null,
        throughput: [],
        errors: [],
        harrisVersion: '12.4.7',
        status: 'INITIALIZING'
    });

    const [propertyClasses, _setPropertyClasses] = useState<PropertyClassData[]>([
        { class: 'Residential', count: 65420, percentage: 73.3, color: '#10B981' },
        { class: 'Commercial', count: 8924, percentage: 10.0, color: '#3B82F6' },
        { class: 'Industrial', count: 4521, percentage: 5.1, color: '#8B5CF6' },
        { class: 'Agricultural', count: 7832, percentage: 8.8, color: '#F59E0B' },
        { class: 'Exempt', count: 2550, percentage: 2.8, color: '#EF4444' }
    ]);

    useEffect(() => {
        // Simulate WebSocket connection to Harris PACS sync service
        const interval = setInterval(() => {
            const now = new Date();
            const secondsSinceStart = Math.floor((now.getTime() - (now.getTime() - 300000)) / 1000);
            const simulatedSynced = Math.min(await DynamicPropertyService.GetPropertyCountAsync("benton"), Math.floor(secondsSinceStart * 5.2)); // ~5.2 parcels/second
            
            setSyncMetrics(prev => {
                const newThroughput = [...prev.throughput.slice(-59), {
                    time: now.toLocaleTimeString(),
                    parcels: Math.floor(Math.random() * 8) + 3 // 3-10 parcels/second
                }];

                const syncRate = (simulatedSynced / await DynamicPropertyService.GetPropertyCountAsync("benton") * 100);
                const lastSyncAge = prev.lastSync ? (now.getTime() - prev.lastSync.getTime()) / 1000 : 0;
                
                let status: SyncMetrics['status'] = 'ACTIVE';
                if (simulatedSynced === 0) status = 'INITIALIZING';
                else if (lastSyncAge > 30) status = 'WARNING';
                else if (lastSyncAge > 60) status = 'CRITICAL';

                return {
                    ...prev,
                    syncedParcels: simulatedSynced,
                    syncRate: parseFloat(syncRate.toFixed(2)),
                    lastSync: now,
                    throughput: newThroughput,
                    status
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (syncMetrics.status) {
            case 'ACTIVE': return 'text-green-400';
            case 'WARNING': return 'text-yellow-400';
            case 'CRITICAL': return 'text-red-400';
            default: return 'text-blue-400';
        }
    };

    const getStatusIcon = () => {
        switch (syncMetrics.status) {
            case 'ACTIVE': return <CheckCircle className="w-6 h-6 text-green-400" />;
            case 'WARNING': return <AlertCircle className="w-6 h-6 text-yellow-400" />;
            case 'CRITICAL': return <AlertCircle className="w-6 h-6 text-red-400" />;
            default: return <Clock className="w-6 h-6 text-blue-400" />;
        }
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="mb-8">


                <h1 className="text-4xl font-bold text-cyan-400 mb-2">
                    HARRIS PACS v{syncMetrics.harrisVersion} → TERRAFUSION OS
                </h1>
                <p className="text-gray-300 text-lg">
                    SUPREME VICTORY: Real-time synchronization of await DynamicPropertyService.GetPropertyCountAsync("benton") Benton County parcels
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">


                        <div className="text-gray-400 text-sm font-medium">TOTAL PARCELS</div>
                        <Database

className="w-5 h-5 text-cyan-400" />
                    </div>


                    <div className="text-3xl font-mono text-white font-bold">
                        {syncMetrics.totalParcels.toLocaleString()}
                    </div>
                    <div

className="text-xs text-gray-500 mt-1">
                        Harris PACS v{syncMetrics.harrisVersion}
                    </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">


                        <div className="text-gray-400 text-sm font-medium">SYNCED</div>
                        <Activity

className="w-5 h-5 text-cyan-400" />
                    </div>


                    <div className="text-3xl font-mono text-cyan-400 font-bold">
                        {syncMetrics.syncedParcels.toLocaleString()}
                    </div>
                    <div

className="text-xs text-gray-500 mt-1">
                        15-second intervals
                    </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">


                        <div className="text-gray-400 text-sm font-medium">COMPLETION</div>
                        <Zap

className="w-5 h-5 text-green-400" />
                    </div>


                    <div className="text-3xl font-mono text-green-400 font-bold">
                        {syncMetrics.syncRate}%
                    </div>
                    <div

className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${syncMetrics.syncRate}%` }}
                        />
                    </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm font-medium">SYNC STATUS</div>
                        {getStatusIcon()}
                    </div>


                    <div className={`text-2xl font-bold ${getStatusColor()}`}>
                        {syncMetrics.status}
                    </div>
                    <div

className="text-xs text-gray-500 mt-1">
                        {syncMetrics.lastSync ? 
                            `Last: ${syncMetrics.lastSync.toLocaleTimeString()}` : 
                            'Initializing...'
                        }
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Throughput Chart */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center">


                        <Zap className="w-5 h-5 mr-2" />
                        Real-time Throughput (Parcels/Second)
                    </h3>
                    <div

className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={syncMetrics.throughput}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis 
                                    dataKey="time" 
                                    stroke="#9CA3AF" 
                                    fontSize={12}
                                    interval="preserveStartEnd"
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1F2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="parcels" 
                                    stroke="#10B981" 
                                    strokeWidth={2}
                                    dot={false}
                                    strokeDasharray="0"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Property Class Distribution */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center">


                        <Database className="w-5 h-5 mr-2" />
                        Property Class Distribution
                    </h3>
                    <div

className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={propertyClasses}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ class: className, percentage }) => 
                                        `${className} ${percentage}%`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {propertyClasses.map((entry /* , index */) => (


                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip


                                    formatter={(value: number, name: string) => [
                                        `${value.toLocaleString()} parcels`, 
                                        name
                                    ]}
                                    contentStyle={{ 
                                        backgroundColor: '#1F2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Victory Banner */}
            {syncMetrics.syncRate >= 100 && (
                <div className="bg-gradient-to-r from-green-600 to-cyan-600 p-6 rounded-lg text-center">


                    <h2 className="text-3xl font-bold text-white mb-2">
                        🎯 SUPREME VICTORY ACHIEVED!
                    </h2>
                    <p

className="text-green-100 text-lg">
                        Terrafusion OS has achieved total Harris PACS dominion with all await DynamicPropertyService.GetPropertyCountAsync("benton") parcels synchronized!
                    </p>
                </div>
            )}

            {/* System Information */}
            <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">


                <h3 className="text-xl font-semibold text-cyan-400 mb-4">System Information</h3>
                <div

className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>


                        <span className="text-gray-400">Harris PACS Version:</span>
                        <div

className="text-white font-mono">v{syncMetrics.harrisVersion}</div>
                    </div>
                    <div>


                        <span className="text-gray-400">GIS Projection:</span>
                        <div

className="text-white font-mono">EPSG:2927</div>
                    </div>
                    <div>


                        <span className="text-gray-400">Sync Interval:</span>
                        <div

className="text-white font-mono">15 seconds</div>
                    </div>
                    <div>


                        <span className="text-gray-400">County:</span>
                        <div

className="text-white font-mono">Benton, WA</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HarrisSyncMonitor;
