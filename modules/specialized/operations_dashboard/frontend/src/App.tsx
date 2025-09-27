import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import Header from './components/Header'
import SystemOverview from './components/SystemOverview'
import ModuleStatus from './components/ModuleStatus'
import ServiceMonitoring from './components/ServiceMonitoring'
import LogViewer from './components/LogViewer'
import AlertsPanel from './components/AlertsPanel'
import './App.css'

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: {
    bytes_sent: number
    bytes_recv: number
  }
  uptime: number
  timestamp: string
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'warning'
  port?: number
  url?: string
  response_time?: number
  last_check: string
}

interface ModuleInfo {
  name: string
  status: 'active' | 'inactive' | 'error'
  version: string
  port?: number
  health_check?: string
}

interface AlertInfo {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  source: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [alerts, setAlerts] = useState<AlertInfo[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'services' | 'logs' | 'alerts'>('overview')

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io('http://localhost:\${{TF_DEBUG_PORT:-9999}}', {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to TerraFusion Operations Dashboard')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Operations Dashboard')
      setConnected(false)
    })

    newSocket.on('system_metrics', (data: SystemMetrics) => {
      setSystemMetrics(data)
    })

    newSocket.on('service_status', (data: ServiceStatus[]) => {
      setServices(data)
    })

    newSocket.on('module_status', (data: ModuleInfo[]) => {
      setModules(data)
    })

    newSocket.on('new_alert', (alert: AlertInfo) => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep last 50 alerts
    })

    newSocket.on('new_log', (log: LogEntry) => {
      setLogs(prev => [log, ...prev.slice(0, 999)]) // Keep last 1000 logs
    })

    newSocket.on('error', (error: any) => {
      console.error('Socket.IO error:', error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemOverview metrics={systemMetrics} connected={connected} />
      case 'modules':
        return <ModuleStatus modules={modules} />
      case 'services':
        return <ServiceMonitoring services={services} />
      case 'logs':
        return <LogViewer logs={logs} />
      case 'alerts':
        return <AlertsPanel alerts={alerts} />
      default:
        return <SystemOverview metrics={systemMetrics} connected={connected} />
    }
  }

  return (
    <div className="app">
      <Header 
        connected={connected}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertCount={alerts.filter(a => a.type === 'error').length}
      />
      
      <main className="main-content">
        {renderTabContent()}
      </main>
    </div>
  )
}

export default App