/**
 * 🔌 SPECIALIZED - Command Portal API Client
 * REST client for communicating with Command Portal backend
 */

const axios = require('axios');

class CommandPortalAPIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || process.env.COMMAND_PORTAL_URL || 'http://localhost:3000/api';
    this.token = options.token || process.env.PORTAL_TOKEN;
    this.workspace = 'specialized';
    this.timeout = options.timeout || 30000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  /**
   * 📊 Post metrics to portal
   */
  async postMetrics(metrics) {
    try {
      const response = await this.client.post('/metrics/workspace', {
        workspace: this.workspace,
        timestamp: new Date().toISOString(),
        metrics: metrics
      });
      return response.data;
    } catch (error) {
      this.handleError('postMetrics', error);
      throw error;
    }
  }

  /**
   * 📈 Get workspace dashboard data
   */
  async getDashboardData() {
    try {
      const response = await this.client.get(`/dashboard/workspace/${this.workspace}`);
      return response.data;
    } catch (error) {
      this.handleError('getDashboardData', error);
      throw error;
    }
  }

  /**
   * 🔔 Get active alerts
   */
  async getAlerts(filters = {}) {
    try {
      const response = await this.client.get('/alerts', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError('getAlerts', error);
      throw error;
    }
  }

  /**
   * 📢 Report alert
   */
  async reportAlert(alert) {
    try {
      const response = await this.client.post('/alerts/report', {
        workspace: this.workspace,
        alert: alert,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      this.handleError('reportAlert', error);
      throw error;
    }
  }

  /**
   * ✅ Acknowledge alert
   */
  async acknowledgeAlert(alertId) {
    try {
      const response = await this.client.put(`/alerts/${alertId}/acknowledge`, {
        workspace: this.workspace,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      this.handleError('acknowledgeAlert', error);
      throw error;
    }
  }

  /**
   * 🎯 Get SLA status
   */
  async getSLAStatus() {
    try {
      const response = await this.client.get(`/sla/workspace/${this.workspace}`);
      return response.data;
    } catch (error) {
      this.handleError('getSLAStatus', error);
      throw error;
    }
  }

  /**
   * 🔧 Get optimization recommendations
   */
  async getOptimizationRecommendations() {
    try {
      const response = await this.client.get(`/optimization/recommendations/${this.workspace}`);
      return response.data;
    } catch (error) {
      this.handleError('getOptimizationRecommendations', error);
      throw error;
    }
  }

  /**
   * 📋 Get compliance status
   */
  async getComplianceStatus() {
    try {
      const response = await this.client.get(`/compliance/workspace/${this.workspace}`);
      return response.data;
    } catch (error) {
      this.handleError('getComplianceStatus', error);
      throw error;
    }
  }

  /**
   * 🛡️ Report security event
   */
  async reportSecurityEvent(event) {
    try {
      const response = await this.client.post('/security/events', {
        workspace: this.workspace,
        event: event,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      this.handleError('reportSecurityEvent', error);
      throw error;
    }
  }

  /**
   * 🧠 Get AI insights
   */
  async getAIInsights() {
    try {
      const response = await this.client.get(`/ai/insights/${this.workspace}`);
      return response.data;
    } catch (error) {
      this.handleError('getAIInsights', error);
      throw error;
    }
  }

  /**
   * 💥 Error handler
   */
  handleError(method, error) {
    if (error.response) {
      console.error(`[${method}] API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error(`[${method}] No response from server`);
    } else {
      console.error(`[${method}] Error: ${error.message}`);
    }
  }
}

module.exports = CommandPortalAPIClient;
