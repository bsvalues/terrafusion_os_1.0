import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Bus, 
  MapPin, 
  Zap, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Navigation, 
  Clock, 
  Gauge,
  Activity,
  Eye,
  Battery,
  Percent,
  Timer
} from 'lucide-react';

interface TrafficSegment {
  segment_id: string;
  segment_name: string;
  current_speed_kmh: number;
  speed_limit_kmh: number;
  traffic_state: string;
  congestion_level: number;
  vehicle_count: number;
  incident_detected: boolean;
  road_type: string;
}

interface TrafficSignal {
  signal_id: string;
  intersection_name: string;
  current_phase: string;
  phase_remaining_seconds: number;
  cycle_time_seconds: number;
  coordination_group: string;
  adaptive_timing: boolean;
  emergency_override: boolean;
}

interface TransitVehicle {
  vehicle_id: string;
  route_name: string;
  vehicle_type: string;
  current_speed_kmh: number;
  passenger_count: number;
  capacity: number;
  occupancy_rate: number;
  on_schedule: boolean;
  delay_minutes: number;
  destination: string;
  fuel_level_percent: number;
}

interface ParkingFacility {
  facility_id: string;
  facility_name: string;
  total_spaces: number;
  available_spaces: number;
  occupancy_rate: number;
  hourly_rate_usd: number;
  facility_type: string;
  ev_charging_spaces: number;
}

interface TransportationStatus {
  monitored_segments: number;
  active_signals: number;
  transit_vehicles: number;
  parking_facilities: number;
  average_speed_kmh: number;
  congestion_level: number;
  incidents_detected: number;
  signals_optimized: number;
  ev_charging_utilization: number;
}

const TransportationDashboard: React.FC = () => {
  const [status, setStatus] = useState<TransportationStatus | null>(null);
  const [trafficSegments, setTrafficSegments] = useState<TrafficSegment[]>([]);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [transitVehicles, setTransitVehicles] = useState<TransitVehicle[]>([]);
  const [parkingFacilities, setParkingFacilities] = useState<ParkingFacility[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transportation service status
        const statusResponse = await fetch('http://localhost:\${{TF_PORT_5210:-5210}}/api/transport/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus(statusData);
        }

        // Fetch traffic segments
        const trafficResponse = await fetch('http://localhost:\${{TF_PORT_5210:-5210}}/api/transport/traffic');
        if (trafficResponse.ok) {
          const trafficData = await trafficResponse.json();
          setTrafficSegments(trafficData.traffic_segments || []);
        }

        // Fetch traffic signals
        const signalsResponse = await fetch('http://localhost:\${{TF_PORT_5210:-5210}}/api/transport/signals');
        if (signalsResponse.ok) {
          const signalsData = await signalsResponse.json();
          setTrafficSignals(signalsData.traffic_signals || []);
        }

        // Fetch transit vehicles
        const transitResponse = await fetch('http://localhost:\${{TF_PORT_5210:-5210}}/api/transport/transit');
        if (transitResponse.ok) {
          const transitData = await transitResponse.json();
          setTransitVehicles(transitData.transit_vehicles || []);
        }

        // Fetch parking facilities
        const parkingResponse = await fetch('http://localhost:\${{TF_PORT_5210:-5210}}/api/transport/parking');
        if (parkingResponse.ok) {
          const parkingData = await parkingResponse.json();
          setParkingFacilities(parkingData.parking_facilities || []);
        }
      } catch (error) {
        console.error('Error fetching transportation data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getTrafficStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'free_flow': return 'traffic-free';
      case 'light_congestion': return 'traffic-light';
      case 'moderate_congestion': return 'traffic-moderate';
      case 'heavy_congestion': return 'traffic-heavy';
      case 'stop_and_go': return 'traffic-stop';
      case 'incident': return 'traffic-incident';
      default: return 'traffic-unknown';
    }
  };

  const getSignalPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'green': return 'signal-green';
      case 'yellow': return 'signal-yellow';
      case 'red': return 'signal-red';
      case 'flashing_red': return 'signal-flashing-red';
      case 'flashing_yellow': return 'signal-flashing-yellow';
      default: return 'signal-unknown';
    }
  };

  const formatCongestionLevel = (level: number) => {
    if (level < 0.3) return 'Low';
    if (level < 0.6) return 'Moderate';
    if (level < 0.8) return 'High';
    return 'Severe';
  };

  return (
    <div className="transportation-dashboard">
      {/* Real-time Transportation Overview */}
      <div className="dashboard-overview">
        <div className="overview-header">
          <h2>Benton County Transportation Intelligence Dashboard</h2>
          <p>Real-time traffic monitoring, signal optimization, and transit coordination</p>
        </div>

        {status && (
          <div className="performance-metrics">
            <div className="metric-card primary">
              <div className="metric-icon">
                <Activity className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.monitored_segments}</span>
                <span className="metric-label">Traffic Segments</span>
                <span className="metric-status">Real-time Monitoring</span>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">
                <Gauge className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.average_speed_kmh.toFixed(1)}</span>
                <span className="metric-label">Avg Speed (km/h)</span>
                <span className="metric-status">Network Average</span>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon">
                <Percent className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{(status.congestion_level * 100).toFixed(1)}%</span>
                <span className="metric-label">Congestion Level</span>
                <span className="metric-status">{formatCongestionLevel(status.congestion_level)}</span>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">
                <AlertTriangle className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.incidents_detected}</span>
                <span className="metric-label">Active Incidents</span>
                <span className="metric-status">Under Management</span>
              </div>
            </div>

            <div className="metric-card secondary">
              <div className="metric-icon">
                <Zap className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{status.signals_optimized}</span>
                <span className="metric-label">Signals Optimized</span>
                <span className="metric-status">AI-Coordinated</span>
              </div>
            </div>

            <div className="metric-card electric">
              <div className="metric-icon">
                <Battery className="metric-symbol" size={24} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{(status.ev_charging_utilization * 100).toFixed(1)}%</span>
                <span className="metric-label">EV Charging</span>
                <span className="metric-status">Utilization Rate</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Traffic Flow Monitoring */}
      <div className="traffic-monitoring-section">
        <div className="section-header">
          <h3>Real-time Traffic Flow - Benton County Major Corridors</h3>
          <div className="monitoring-stats">
            <span className="stat-chip">
              <Eye size={16} />
              {trafficSegments.length} Segments Monitored
            </span>
            <span className="stat-chip incident">
              <AlertTriangle size={16} />
              {trafficSegments.filter(s => s.incident_detected).length} Incidents Active
            </span>
          </div>
        </div>

        <div className="traffic-segments-grid">
          {trafficSegments.slice(0, 8).map((segment) => (
            <div key={segment.segment_id} className={`traffic-segment-card ${getTrafficStateColor(segment.traffic_state)}`}>
              <div className="segment-header">
                <h4 className="segment-name">{segment.segment_name}</h4>
                <div className="segment-type-badge">{segment.road_type}</div>
              </div>
              
              <div className="segment-metrics">
                <div className="speed-display">
                  <span className="current-speed">{segment.current_speed_kmh.toFixed(0)}</span>
                  <span className="speed-unit">km/h</span>
                  <span className="speed-limit">/ {segment.speed_limit_kmh}</span>
                </div>
                
                <div className="traffic-indicators">
                  <div className="traffic-state">
                    <span className="state-label">Status:</span>
                    <span className="state-value">{segment.traffic_state.replace('_', ' ')}</span>
                  </div>
                  <div className="congestion-meter">
                    <span className="congestion-label">Congestion:</span>
                    <div className="congestion-bar">
                      <div 
                        className="congestion-fill"
                        style={{ width: `${segment.congestion_level * 100}%` }}
                      ></div>
                    </div>
                    <span className="congestion-percent">{(segment.congestion_level * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="segment-details">
                  <div className="detail-item">
                    <Car size={14} />
                    <span>{segment.vehicle_count} vehicles</span>
                  </div>
                  {segment.incident_detected && (
                    <div className="detail-item incident">
                      <AlertTriangle size={14} />
                      <span>INCIDENT DETECTED</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Traffic Signal Coordination */}
      <div className="signals-section">
        <div className="section-header">
          <h3>Smart Traffic Signal Network</h3>
          <div className="signals-stats">
            <span className="stat-chip">
              <Zap size={16} />
              {trafficSignals.length} Active Signals
            </span>
            <span className="stat-chip adaptive">
              <Activity size={16} />
              {trafficSignals.filter(s => s.adaptive_timing).length} Adaptive
            </span>
            <span className="stat-chip emergency">
              <AlertTriangle size={16} />
              {trafficSignals.filter(s => s.emergency_override).length} Emergency Override
            </span>
          </div>
        </div>

        <div className="signals-grid">
          {trafficSignals.slice(0, 6).map((signal) => (
            <div key={signal.signal_id} className="signal-card">
              <div className="signal-header">
                <h4 className="intersection-name">{signal.intersection_name}</h4>
                <div className="signal-group-badge">{signal.coordination_group}</div>
              </div>
              
              <div className="signal-status">
                <div className={`signal-light ${getSignalPhaseColor(signal.current_phase)}`}>
                  <div className="light-indicator"></div>
                  <span className="phase-name">{signal.current_phase.toUpperCase()}</span>
                </div>
                
                <div className="timing-info">
                  <div className="remaining-time">
                    <Timer size={16} />
                    <span>{signal.phase_remaining_seconds}s remaining</span>
                  </div>
                  <div className="cycle-time">
                    <Clock size={16} />
                    <span>{signal.cycle_time_seconds}s cycle</span>
                  </div>
                </div>
              </div>
              
              <div className="signal-features">
                {signal.adaptive_timing && (
                  <div className="feature-badge adaptive">
                    <Activity size={12} />
                    <span>Adaptive</span>
                  </div>
                )}
                {signal.emergency_override && (
                  <div className="feature-badge emergency">
                    <AlertTriangle size={12} />
                    <span>Emergency</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ben Franklin Transit Real-time Tracking */}
      <div className="transit-section">
        <div className="section-header">
          <h3>Ben Franklin Transit - Real-time Fleet Tracking</h3>
          <div className="transit-stats">
            <span className="stat-chip">
              <Bus size={16} />
              {transitVehicles.length} Active Vehicles
            </span>
            <span className="stat-chip on-time">
              <Clock size={16} />
              {transitVehicles.filter(v => v.on_schedule).length} On Schedule
            </span>
            <span className="stat-chip capacity">
              <Users size={16} />
              {(transitVehicles.reduce((sum, v) => sum + v.occupancy_rate, 0) / transitVehicles.length * 100 || 0).toFixed(0)}% Avg Occupancy
            </span>
          </div>
        </div>

        <div className="transit-vehicles-grid">
          {transitVehicles.slice(0, 6).map((vehicle) => (
            <div key={vehicle.vehicle_id} className="transit-vehicle-card">
              <div className="vehicle-header">
                <div className="route-info">
                  <h4 className="route-name">{vehicle.route_name}</h4>
                  <span className="vehicle-type">{vehicle.vehicle_type}</span>
                </div>
                <div className={`schedule-status ${vehicle.on_schedule ? 'on-time' : 'delayed'}`}>
                  {vehicle.on_schedule ? '✓ On Time' : `${vehicle.delay_minutes}m Delay`}
                </div>
              </div>
              
              <div className="vehicle-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <Gauge size={14} />
                    <span>{vehicle.current_speed_kmh.toFixed(0)} km/h</span>
                  </div>
                  <div className="metric-item">
                    <Battery size={14} />
                    <span>{vehicle.fuel_level_percent.toFixed(0)}% Fuel</span>
                  </div>
                </div>
                
                <div className="passenger-info">
                  <div className="occupancy-bar">
                    <div 
                      className="occupancy-fill"
                      style={{ width: `${vehicle.occupancy_rate * 100}%` }}
                    ></div>
                  </div>
                  <span className="passenger-count">
                    {vehicle.passenger_count}/{vehicle.capacity} passengers ({(vehicle.occupancy_rate * 100).toFixed(0)}%)
                  </span>
                </div>
                
                <div className="destination-info">
                  <Navigation size={14} />
                  <span>To: {vehicle.destination}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Parking Management */}
      <div className="parking-section">
        <div className="section-header">
          <h3>Smart Parking Management</h3>
          <div className="parking-stats">
            <span className="stat-chip">
              <Users size={16} />
              {parkingFacilities.length} Facilities
            </span>
            <span className="stat-chip available">
              <MapPin size={16} />
              {parkingFacilities.reduce((sum, f) => sum + f.available_spaces, 0)} Available Spaces
            </span>
            <span className="stat-chip electric">
              <Zap size={16} />
              {parkingFacilities.reduce((sum, f) => sum + f.ev_charging_spaces, 0)} EV Charging
            </span>
          </div>
        </div>

        <div className="parking-facilities-grid">
          {parkingFacilities.slice(0, 6).map((facility) => (
            <div key={facility.facility_id} className="parking-facility-card">
              <div className="facility-header">
                <h4 className="facility-name">{facility.facility_name}</h4>
                <div className="facility-type-badge">{facility.facility_type}</div>
              </div>
              
              <div className="availability-display">
                <div className="availability-circle">
                  <div 
                    className="availability-arc"
                    style={{ 
                      background: `conic-gradient(
                        var(--success-color) 0deg ${(1 - facility.occupancy_rate) * 360}deg,
                        var(--warning-color) ${(1 - facility.occupancy_rate) * 360}deg 360deg
                      )`
                    }}
                  ></div>
                  <div className="availability-text">
                    <span className="available-count">{facility.available_spaces}</span>
                    <span className="available-label">available</span>
                  </div>
                </div>
                
                <div className="facility-details">
                  <div className="detail-row">
                    <span>Total: {facility.total_spaces} spaces</span>
                  </div>
                  <div className="detail-row">
                    <span>Rate: ${facility.hourly_rate_usd}/hour</span>
                  </div>
                  <div className="detail-row">
                    <span>Occupancy: {(facility.occupancy_rate * 100).toFixed(0)}%</span>
                  </div>
                  {facility.ev_charging_spaces > 0 && (
                    <div className="detail-row ev">
                      <Zap size={12} />
                      <span>{facility.ev_charging_spaces} EV Charging</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transportation Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h3>Transportation Management Controls</h3>
        </div>
        
        <div className="quick-actions-grid">
          <button className="action-btn signal-optimization">
            <Zap size={20} />
            <span>Optimize Signals</span>
          </button>
          <button className="action-btn incident-response">
            <AlertTriangle size={20} />
            <span>Incident Response</span>
          </button>
          <button className="action-btn transit-coordination">
            <Bus size={20} />
            <span>Transit Coordination</span>
          </button>
          <button className="action-btn traffic-analysis">
            <TrendingUp size={20} />
            <span>Traffic Analysis</span>
          </button>
          <button className="action-btn parking-management">
            <Users size={20} />
            <span>Parking Management</span>
          </button>
          <button className="action-btn route-planning">
            <Navigation size={20} />
            <span>Route Planning</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransportationDashboard;