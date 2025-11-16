/**
 * ServiceHealthStrip Component
 * Display health status of all TerraFusion services
 */

import React from 'react';

interface ServiceStatus {
  api: boolean;
  consciousness: boolean;
  portal: boolean;
  rustIde: boolean;
}

interface ServiceHealthStripProps {
  services: ServiceStatus;
  compact?: boolean;
}

export const ServiceHealthStrip: React.FC<ServiceHealthStripProps> = ({
  services,
  compact = false,
}) => {
  const serviceList = [
    { key: 'api', name: 'API', port: 5000, healthy: services.api },
    { key: 'consciousness', name: 'Consciousness', port: 3004, healthy: services.consciousness },
    { key: 'portal', name: 'Portal', port: 5173, healthy: services.portal },
    { key: 'rustIde', name: 'Rust IDE', port: 8787, healthy: services.rustIde },
  ];

  const healthyCount = serviceList.filter(s => s.healthy).length;
  const totalCount = serviceList.length;

  return (
    <div className={`service-health-strip ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="health-summary">
          <span className="health-icon">{healthyCount === totalCount ? '✅' : '⚠️'}</span>
          <span className="health-text">
            {healthyCount}/{totalCount} Services Online
          </span>
        </div>
      )}

      <div className="service-list">
        {serviceList.map(service => (
          <div
            key={service.key}
            className={`service-item ${service.healthy ? 'healthy' : 'unhealthy'}`}
          >
            <span className="service-status-dot" />
            <div className="service-details">
              <div className="service-name">{service.name}</div>
              {!compact && <div className="service-port">:{service.port}</div>}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .service-health-strip {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .service-health-strip.compact .service-list {
          gap: 0.5rem;
        }

        .health-summary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
          border: 1px solid rgba(0, 255, 255, 0.2);
        }

        .health-icon {
          font-size: 1.25rem;
        }

        .health-text {
          font-weight: 600;
          color: #00ffff;
        }

        .service-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .service-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }

        .service-item.healthy {
          border-left-color: #00ff00;
        }

        .service-item.healthy .service-status-dot {
          background: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .service-item.unhealthy {
          border-left-color: #ff5370;
        }

        .service-item.unhealthy .service-status-dot {
          background: #ff5370;
          box-shadow: 0 0 10px rgba(255, 83, 112, 0.5);
        }

        .service-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .service-details {
          flex: 1;
        }

        .service-name {
          font-weight: 600;
          color: #fff;
          font-size: 0.875rem;
        }

        .service-port {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.125rem;
        }

        .compact .service-item {
          padding: 0.5rem;
        }

        .compact .service-name {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};
