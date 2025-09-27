import React, { useState, useEffect, useRef } from 'react'
import './LogViewer.css'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
}

interface LogViewerProps {
  logs: LogEntry[]
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const logLevels = ['all', 'info', 'warning', 'error', 'debug']
  const sources = ['all', ...Array.from(new Set(logs.map(log => log.source)))]

  useEffect(() => {
    let filtered = logs

    // Filter by level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel)
    }

    // Filter by source
    if (filterSource !== 'all') {
      filtered = filtered.filter(log => log.source === filterSource)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower)
      )
    }

    setFilteredLogs(filtered)
  }, [logs, filterLevel, filterSource, searchTerm])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredLogs, autoScroll])

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'var(--tf-danger)'
      case 'warning': return 'var(--tf-warning)'
      case 'info': return 'var(--tf-success)'
      case 'debug': return 'var(--tf-secondary)'
      default: return 'var(--tf-light)'
    }
  }

  const getLevelIcon = (level: string): string => {
    switch (level) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'debug': return '🔍'
      default: return '📝'
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const clearLogs = () => {
    // This would typically call a parent function to clear logs
    console.log('Clear logs requested')
  }

  const exportLogs = () => {
    const logData = filteredLogs.map(log => 
      `${log.timestamp} [${log.level.toUpperCase()}] ${log.source}: ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terrafusion-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="log-viewer">
      <div className="log-header">
        <h2>📄 System Log Viewer</h2>
        <div className="log-stats">
          <div className="stat-item error">
            <span className="stat-count">{levelCounts.error || 0}</span>
            <span className="stat-label">Errors</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-count">{levelCounts.warning || 0}</span>
            <span className="stat-label">Warnings</span>
          </div>
          <div className="stat-item info">
            <span className="stat-count">{levelCounts.info || 0}</span>
            <span className="stat-label">Info</span>
          </div>
          <div className="stat-item debug">
            <span className="stat-count">{levelCounts.debug || 0}</span>
            <span className="stat-label">Debug</span>
          </div>
        </div>
      </div>

      <div className="log-controls">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="level-filter">Level:</label>
            <select
              id="level-filter"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="filter-select"
            >
              {logLevels.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="source-filter">Source:</label>
            <select
              id="source-filter"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="filter-select"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search-filter">Search:</label>
            <input
              id="search-filter"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="search-input"
            />
          </div>
        </div>

        <div className="action-controls">
          <button
            className={`control-btn auto-scroll ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle Auto Scroll"
          >
            📜 Auto Scroll
          </button>
          
          <button
            className="control-btn export"
            onClick={exportLogs}
            title="Export Logs"
          >
            📤 Export
          </button>
          
          <button
            className="control-btn clear"
            onClick={clearLogs}
            title="Clear Logs"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="log-container">
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            <div className="no-logs-icon">📝</div>
            <h3>No Logs Available</h3>
            <p>
              {logs.length === 0 
                ? 'System logs will appear here when available'
                : 'No logs match the current filters'
              }
            </p>
          </div>
        ) : (
          <div className="log-entries">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`log-entry ${log.level}`}>
                <div className="log-timestamp">
                  {formatTimestamp(log.timestamp)}
                </div>
                <div className="log-level">
                  <span className="level-icon">{getLevelIcon(log.level)}</span>
                  <span 
                    className="level-text"
                    style={{ color: getLevelColor(log.level) }}
                  >
                    {log.level.toUpperCase()}
                  </span>
                </div>
                <div className="log-source">
                  {log.source}
                </div>
                <div className="log-message">
                  {log.message}
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="log-footer">
        <div className="log-info">
          Showing {filteredLogs.length} of {logs.length} log entries
        </div>
        <div className="log-connection">
          <span className="connection-indicator online">
            <span className="indicator-dot"></span>
            Live Feed Active
          </span>
        </div>
      </div>
    </div>
  )
}

export default LogViewer