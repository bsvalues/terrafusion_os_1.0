import React, { useState, useEffect } from 'react';

/**
 * DataFlow Component
 * Visualizes data movement between different services or components
 * 
 * @param {Array} nodes - Array of node objects with {id, name, type, position, description}
 * @param {Array} connections - Array of connection objects with {source, target, label, status}
 * @param {string} title - Title of the data flow visualization
 * @param {boolean} animated - Whether to animate the flow
 */
const DataFlow = ({ 
  nodes = [], 
  connections = [], 
  title = 'Data Flow',
  animated = true
}) => {
  const [activeConnection, setActiveConnection] = useState(null);
  
  // Cycle through connections to show animation if enabled
  useEffect(() => {
    if (!animated || connections.length === 0) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      setActiveConnection(connections[currentIndex].id);
      currentIndex = (currentIndex + 1) % connections.length;
    }, 2000);
    
    return () => clearInterval(interval);
  }, [animated, connections]);
  
  // Node type colors and icons
  const nodeTypes = {
    service: {
      color: '#3498db',
      icon: '🔧',
      label: 'Service'
    },
    database: {
      color: '#2ecc71',
      icon: '💾',
      label: 'Database'
    },
    user: {
      color: '#9b59b6',
      icon: '👤',
      label: 'User'
    },
    api: {
      color: '#f1c40f',
      icon: '🔌',
      label: 'API'
    },
    client: {
      color: '#e74c3c',
      icon: '💻',
      label: 'Client'
    },
    external: {
      color: '#95a5a6',
      icon: '🌐',
      label: 'External'
    }
  };
  
  // Connection status styles
  const connectionStatus = {
    active: {
      color: '#2ecc71',
      width: 3,
      animate: true
    },
    inactive: {
      color: '#bdc3c7',
      width: 1.5,
      animate: false
    },
    error: {
      color: '#e74c3c',
      width: 2,
      animate: false
    }
  };
  
  // Simple SVG drawing of connections between nodes
  const renderConnections = () => {
    return connections.map((connection) => {
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const isActive = activeConnection === connection.id;
      const status = isActive ? 'active' : connection.status || 'inactive';
      const style = connectionStatus[status];
      
      // Calculate connection line coordinates
      const x1 = sourceNode.position?.x || 0;
      const y1 = sourceNode.position?.y || 0;
      const x2 = targetNode.position?.x || 0;
      const y2 = targetNode.position?.y || 0;
      
      // Calculate midpoint for label placement
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      return (
        <g key={`${connection.source}-${connection.target}`}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={style.color}
            strokeWidth={style.width}
            strokeDasharray={style.animate ? "5,5" : "none"}
            className={style.animate ? "animated-line" : ""}
          />
          
          {connection.label && (
            <text
              x={midX}
              y={midY}
              dy="-5"
              textAnchor="middle"
              fontSize="10"
              fill="#333"
              className="connection-label"
            >
              {connection.label}
            </text>
          )}
        </g>
      );
    });
  };
  
  // Render nodes
  const renderNodes = () => {
    return nodes.map((node) => {
      const type = nodeTypes[node.type || 'service'];
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      
      return (
        <g key={node.id} className="dataflow-node" transform={`translate(${x}, ${y})`}>
          <circle
            r={20}
            fill={type.color}
            className="node-circle"
          />
          
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dy="5"
            fontSize="16"
            fill="white"
            className="node-icon"
          >
            {type.icon}
          </text>
          
          <text
            x={0}
            y={35}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
            className="node-name"
          >
            {node.name}
          </text>
          
          {node.description && (
            <text
              x={0}
              y={50}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
              className="node-description"
            >
              {node.description}
            </text>
          )}
        </g>
      );
    });
  };
  
  return (
    <div className="dataflow-container">
      <h3 className="dataflow-title">{title}</h3>
      
      <div className="dataflow-diagram">
        <svg width="100%" height="400" viewBox="0 0 800 400">
          <g className="connections">
            {renderConnections()}
          </g>
          <g className="nodes">
            {renderNodes()}
          </g>
        </svg>
      </div>
      
      <div className="dataflow-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          {Object.entries(nodeTypes).map(([key, value]) => (
            <div key={key} className="legend-item">
              <span className="legend-icon" style={{ backgroundColor: value.color }}>{value.icon}</span>
              <span className="legend-label">{value.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataFlow;