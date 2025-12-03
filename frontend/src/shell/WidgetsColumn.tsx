/**
 * WidgetsColumn - Right widgets panel with Weather, Calendar, Roll Health
 * Live Activities and context-aware information
 */

import { EliteIcons, EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React, { useEffect, useState } from 'react';

type View = { type: 'desktop' } | { type: 'suite'; id: string } | { type: 'app'; id: string };

interface WidgetsColumnProps {
  view: View;
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event';
}

interface RollHealthData {
  completeness: number;
  accuracy: number;
  timeliness: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface LiveActivity {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  icon: string;
}

export const WidgetsColumn: React.FC<WidgetsColumnProps> = ({ view }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data
  const [weather] = useState<WeatherData>({
    location: 'Benton County, WA',
    temperature: 72,
    condition: 'Partly Cloudy',
    icon: '⛅',
  });

  const [upcomingEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Budget Review',
      time: '2:00 PM',
      type: 'meeting',
    },
    {
      id: '2',
      title: 'DOR Submission',
      time: 'Tomorrow',
      type: 'deadline',
    },
    {
      id: '3',
      title: 'Assessment Appeals',
      time: 'Dec 15',
      type: 'event',
    },
  ]);

  const [rollHealth] = useState<RollHealthData>({
    completeness: 98.7,
    accuracy: 99.2,
    timeliness: 96.8,
    status: 'excellent',
  });

  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([
    {
      id: 'pacs-sync',
      title: 'PACS Sync',
      subtitle: 'Harris integration active',
      progress: 72,
      icon: '🔄',
    },
    {
      id: 'ai-processing',
      title: 'AI Processing',
      subtitle: '3 assessment jobs running',
      progress: 45,
      icon: '🤖',
    },
  ]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update live activities
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveActivities((prev) =>
        prev.map((activity) => ({
          ...activity,
          progress: Math.min(100, activity.progress + Math.random() * 2),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: RollHealthData['status']) => {
    switch (status) {
      case 'excellent':
        return 'tf-health-excellent';
      case 'good':
        return 'tf-health-good';
      case 'warning':
        return 'tf-health-warning';
      case 'critical':
        return 'tf-health-critical';
      default:
        return '';
    }
  };

  const getContextualInfo = () => {
    if (view.type === 'suite') {
      switch (view.id) {
        case 'assessment':
          return {
            title: 'Assessment Context',
            items: [
              'Current Roll: 2025',
              'Parcels: 89,247',
              'Appeals Open: 12',
              'AI Accuracy: 99.7%',
            ],
          };
        case 'levy':
          return {
            title: 'Levy Context',
            items: ['Total Levy: $847.2M', 'Districts: 247', 'DOR Due: Dec 30', 'Status: On Track'],
          };
        case 'gis':
          return {
            title: 'GIS Context',
            items: [
              'Layers Active: 24',
              'Map Cache: 94%',
              'Sync Status: Current',
              'API Calls: 1,247/hr',
            ],
          };
        default:
          return null;
      }
    }
    return null;
  };

  const contextInfo = getContextualInfo();

  return (
    <div className='tf-widgets-column'>
      {/* Weather Widget */}
      <div className='tf-widget tf-weather-widget'>
        <div className='tf-widget-header'>
          <span className='tf-widget-title'>Weather Intelligence</span>
          <EliteIcons.Cloud className='w-4 h-4 text-terra-cyan' />
        </div>
        <div className='tf-weather-content'>
          <div className='tf-weather-temp'>{weather.temperature}°F</div>
          <div className='tf-weather-condition'>{weather.condition}</div>
          <div className='tf-weather-location'>{weather.location}</div>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className='tf-widget tf-calendar-widget'>
        <div className='tf-widget-header'>
          <span className='tf-widget-title'>Calendar Intelligence</span>
          <EliteIcons.Settings className='w-4 h-4 text-terra-cyan' />
        </div>
        <div className='tf-calendar-date'>
          {currentTime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <div className='tf-calendar-events'>
          {upcomingEvents.map((event) => (
            <div key={event.id} className={`tf-calendar-event tf-event-${event.type}`}>
              <div className='tf-event-time'>{event.time}</div>
              <div className='tf-event-title'>{event.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Roll Health Widget */}
      <div className='tf-widget tf-roll-health-widget'>
        <div className='tf-widget-header'>
          <span className='tf-widget-title'>Government Excellence</span>
          <EliteIcons.Gauge className='w-4 h-4 text-terra-cyan' />
        </div>
        <div className='tf-widget-status'>
          <span className={`tf-health-status ${getHealthColor(rollHealth.status)}`}>
            {rollHealth.status}
          </span>
        </div>
        <div className='tf-health-metrics'>
          <div className='tf-health-metric'>
            <div className='tf-health-label'>Completeness</div>
            <div className='tf-health-value'>{rollHealth.completeness.toFixed(1)}%</div>
          </div>
          <div className='tf-health-metric'>
            <div className='tf-health-label'>Accuracy</div>
            <div className='tf-health-value'>{rollHealth.accuracy.toFixed(1)}%</div>
          </div>
          <div className='tf-health-metric'>
            <div className='tf-health-label'>Timeliness</div>
            <div className='tf-health-value'>{rollHealth.timeliness.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Live Activities */}
      {liveActivities.length > 0 && (
        <div className='tf-widget tf-activities-widget'>
          <div className='tf-widget-header'>
            <span className='tf-widget-title'>Infrastructure Intelligence</span>
            <EliteIcons.Network className='w-4 h-4 text-terra-cyan' />
          </div>
          <div className='tf-widget-count'>
            <span className='tf-activities-count'>{liveActivities.length}</span>
          </div>
          <div className='tf-activities-list'>
            {liveActivities.map((activity) => (
              <div key={activity.id} className='tf-activity-item'>
                <div className='tf-activity-icon'>{activity.icon}</div>
                <div className='tf-activity-info'>
                  <div className='tf-activity-title'>{activity.title}</div>
                  <div className='tf-activity-subtitle'>{activity.subtitle}</div>
                  <div className='tf-activity-progress'>
                    <div
                      className='tf-activity-progress-bar'
                      style={{ width: `${activity.progress}%` }}
                    />
                    <span className='tf-activity-percent'>{Math.round(activity.progress)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Information */}
      {contextInfo && (
        <div className='tf-widget tf-context-widget'>
          <div className='tf-widget-header'>
            <span className='tf-widget-title'>{contextInfo.title}</span>
          </div>
          <div className='tf-context-items'>
            {contextInfo.items.map((item, index) => (
              <div key={index} className='tf-context-item'>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className='tf-widget tf-system-widget'>
        <div className='tf-widget-header'>
          <span className='tf-widget-title'>System Status</span>
          <EliteIcons.Monitor className='w-4 h-4 text-terra-cyan' />
        </div>
        <div className='tf-widget-status'>
          <div className='tf-system-status-indicator tf-status-healthy' />
        </div>
        <div className='tf-system-metrics'>
          <div className='tf-system-metric'>
            <span className='tf-metric-label'>Championship Uptime</span>
            <span className='tf-metric-value'>23d 14h</span>
          </div>
          <div className='tf-system-metric'>
            <span className='tf-metric-label'>AI Swarm Intelligence</span>
            <span className='tf-metric-value'>49,847</span>
          </div>
          <div className='tf-system-metric'>
            <span className='tf-metric-label'>Neural Processing</span>
            <span className='tf-metric-value'>4.2GB</span>
          </div>
        </div>
        <div className='tf-system-excellence'>
          <EliteQuantumIcon iconType='Brain' className='w-4 h-4' glowIntensity='medium' />
          <span>Infrastructure Intelligence Active</span>
        </div>
      </div>
    </div>
  );
};
