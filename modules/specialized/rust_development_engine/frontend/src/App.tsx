import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import ProjectManager from './components/ProjectManager'
import BuildManager from './components/BuildManager'
import CodeEditor from './components/CodeEditor'
import DeploymentManager from './components/DeploymentManager'
import LogViewer from './components/LogViewer'
import './App.css'

interface BuildStatus {
  id: string
  project: string
  status: 'building' | 'success' | 'failed' | 'pending'
  timestamp: string
  duration?: number
  output?: string
}

interface Project {
  id: string
  name: string
  path: string
  rust_version: string
  last_build: string
  status: 'active' | 'inactive' | 'error'
  dependencies: number
  tests_passed: number
  coverage: number
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'builds' | 'editor' | 'deploy' | 'logs'>('dashboard')
  const [builds, setBuilds] = useState<BuildStatus[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate connection to Rust backend
    const checkConnection = () => {
      // In real implementation, this would check the actual Rust service
      setIsConnected(Math.random() > 0.2) // 80% chance connected
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)

    // Mock data for development
    setProjects([
      {
        id: '1',
        name: 'terrafusion-core',
        path: '/workspace/terrafusion-core',
        rust_version: '1.75.0',
        last_build: '2024-01-15T10:30:00Z',
        status: 'active',
        dependencies: 45,
        tests_passed: 127,
        coverage: 89.5
      },
      {
        id: '2',
        name: 'county-data-processor',
        path: '/workspace/county-data-processor',
        rust_version: '1.75.0',
        last_build: '2024-01-15T09:15:00Z',
        status: 'active',
        dependencies: 23,
        tests_passed: 89,
        coverage: 92.3
      },
      {
        id: '3',
        name: 'api-gateway-rust',
        path: '/workspace/api-gateway-rust',
        rust_version: '1.74.0',
        last_build: '2024-01-14T16:45:00Z',
        status: 'error',
        dependencies: 67,
        tests_passed: 145,
        coverage: 76.8
      }
    ])

    setBuilds([
      {
        id: '1',
        project: 'terrafusion-core',
        status: 'success',
        timestamp: '2024-01-15T10:30:00Z',
        duration: 45.2
      },
      {
        id: '2',
        project: 'county-data-processor',
        status: 'building',
        timestamp: '2024-01-15T11:00:00Z'
      },
      {
        id: '3',
        project: 'api-gateway-rust',
        status: 'failed',
        timestamp: '2024-01-15T10:45:00Z',
        duration: 23.8,
        output: 'error[E0308]: mismatched types\n --> src/main.rs:15:5'
      }
    ])

    return () => clearInterval(interval)
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard projects={projects} builds={builds} isConnected={isConnected} />
      case 'projects':
        return <ProjectManager projects={projects} setProjects={setProjects} />
      case 'builds':
        return <BuildManager builds={builds} setBuilds={setBuilds} />
      case 'editor':
        return <CodeEditor />
      case 'deploy':
        return <DeploymentManager />
      case 'logs':
        return <LogViewer />
      default:
        return <Dashboard projects={projects} builds={builds} isConnected={isConnected} />
    }
  }

  return (
    <div className="app">
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        isConnected={isConnected}
      />
      
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  )
}

export default App