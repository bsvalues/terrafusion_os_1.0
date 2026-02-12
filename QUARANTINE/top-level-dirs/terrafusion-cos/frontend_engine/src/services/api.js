/**
 * Base API Configuration
 * Central configuration for all API requests
 * 
 * CRITICAL: Uses environment variables - DO NOT HARDCODE PORTS!
 * Configure via .env file: REACT_APP_API_URL, REACT_APP_WS_URL
 */

// Load from environment or use dynamic defaults from TF_API_PORT
const DEFAULT_PORT = process.env.TF_API_PORT || process.env.COS_API_PORT || '8090';
const API_BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${DEFAULT_PORT}/api`;
const WS_BASE_URL = process.env.REACT_APP_WS_URL || `ws://localhost:${DEFAULT_PORT}/ws`;

/**
 * API Request wrapper with error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add authentication token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API Request Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * WebSocket connection wrapper
 */
export class WebSocketClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    try {
      this.ws = new WebSocket(`${WS_BASE_URL}${this.endpoint}`);

      this.ws.onopen = () => {
        console.log(`WebSocket connected: ${this.endpoint}`);
        this.reconnectAttempts = 0;
        this.notifyListeners('open', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners('message', data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', error);
      };

      this.ws.onclose = () => {
        console.log(`WebSocket closed: ${this.endpoint}`);
        this.notifyListeners('close', { connected: false });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Emergency Management
  EMERGENCY: {
    INCIDENTS: '/emergency/incidents',
    RESOURCES: '/emergency/resources',
    ALERTS: '/emergency/alerts',
    MAP_DATA: '/emergency/map',
  },
  
  // Transportation
  TRANSPORTATION: {
    TRAFFIC: '/transportation/traffic',
    TRANSIT: '/transportation/transit',
    PARKING: '/transportation/parking',
    ANALYTICS: '/transportation/analytics',
  },
  
  // Parks & Recreation
  PARKS: {
    FACILITIES: '/parks/facilities',
    RESERVATIONS: '/parks/reservations',
    MAINTENANCE: '/parks/maintenance',
    EVENTS: '/parks/events',
  },
  
  // Education
  EDUCATION: {
    STUDENTS: '/education/students',
    CLASSES: '/education/classes',
    ATTENDANCE: '/education/attendance',
    GRADES: '/education/grades',
    REPORTS: '/education/reports',
  },
};

/**
 * WebSocket Endpoints
 */
export const WS_ENDPOINTS = {
  EMERGENCY_INCIDENTS: '/emergency/incidents',
  TRAFFIC_FLOW: '/transportation/traffic',
  TRANSIT_TRACKING: '/transportation/transit',
  PARKING_OCCUPANCY: '/transportation/parking',
};

export default {
  apiRequest,
  WebSocketClient,
  API_ENDPOINTS,
  WS_ENDPOINTS,
};
