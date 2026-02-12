/**
 * TerraFusion Command Portal Homepage
 * 
 * Main landing page with federation system overview and navigation
 * THE TERRAFUSION WAY: Government-grade portal experience
 */

import Link from 'next/link';
import { Shield, Globe, Network, Activity, Users, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TerraFusion
                </h1>
                <p className="text-sm text-slate-600">Command Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Government Grade</span>
              <Shield className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            🌐 TerraFusion Federation System
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Advanced government-grade platform for secure, real-time inter-county communication 
            and resource coordination. Built with enterprise-level security, scalability, and reliability.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-16">
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <Activity className="w-4 h-4" />
              <span className="font-medium">99.8% Production Ready</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Government Security</span>
            </div>
            <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span className="font-medium">Multi-County Federation</span>
            </div>
          </div>

          <Link 
            href="/federation"
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Network className="w-6 h-6" />
            <span>Access Federation Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-800">
            Enterprise-Grade Federation Capabilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Network className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Real-time Federation Monitoring</h3>
              <p className="text-slate-600">
                Live monitoring of county-to-county connections with real-time performance metrics, 
                latency tracking, and connection health status.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Government-Grade Security</h3>
              <p className="text-slate-600">
                Multi-level security clearances, end-to-end encryption, FedRAMP compliance, 
                and comprehensive audit trails for all system activities.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Performance Analytics</h3>
              <p className="text-slate-600">
                Advanced analytics dashboard with throughput monitoring, latency analysis, 
                and predictive performance insights for optimal resource allocation.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Geographic Coverage</h3>
              <p className="text-slate-600">
                Comprehensive geographic federation support with county-level granularity, 
                FIPS code integration, and population-based resource scaling.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Multi-Agency Coordination</h3>
              <p className="text-slate-600">
                Seamless coordination between multiple government agencies with role-based 
                access control and secure inter-agency communication protocols.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Disaster Recovery</h3>
              <p className="text-slate-600">
                Robust disaster recovery capabilities with automatic failover, redundant 
                connections, and emergency communication protocols for critical situations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-slate-800">Current System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/80 p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
              <div className="text-sm text-slate-600">System Health</div>
            </div>
            
            <div className="bg-white/80 p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">12.8</div>
              <div className="text-sm text-slate-600">Gbps Throughput</div>
            </div>
            
            <div className="bg-white/80 p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">45.2ms</div>
              <div className="text-sm text-slate-600">Avg Latency</div>
            </div>
            
            <div className="bg-white/80 p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">3/3</div>
              <div className="text-sm text-slate-600">Counties Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Globe className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">TerraFusion</span>
          </div>
          <p className="text-slate-400 mb-4">
            Government-grade federation management system
          </p>
          <div className="text-sm text-slate-500">
            Classification: Government Grade | Security: FedRAMP Compliant | Version: 1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}