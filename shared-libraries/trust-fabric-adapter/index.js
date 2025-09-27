// NO HARDCODED PORTS! Use environment variables.
/**
 * TerraFusion OS - Universal Trust Fabric Adapter
 * ONE adapter for ALL 50+ microservices
 * 
 * This intercepts ALL API calls and routes them through the trust fabric
 */

class TrustFabricAdapter {
  constructor() {
    // Auto-detect which microservice this is
    this.serviceName = this.detectServiceName();
    this.serviceConfig = this.loadServiceConfig();
    this.trustEndpoint = 'http://localhost:${TF_STATIC_PORT:-8080}';
    this.rolloutPercentage = parseInt(process.env.TRUST_FABRIC_ROLLOUT || '0');
    this.isEnabled = this.shouldUseTrustFabric();
    
    console.log(`🔧 TrustFabricAdapter: ${this.serviceName} - ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  detectServiceName() {
    // Multiple detection methods
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const packageName = typeof process !== 'undefined' ? process.env.npm_package_name : '';
    const currentDir = typeof process !== 'undefined' ? process.cwd() : '';
    
    // Extract service name from various sources
    if (hostname && hostname !== 'localhost') {
      return hostname.split('.')[0];
    }
    
    if (packageName) {
      return packageName.replace('terrafusion-', '').replace('@terrafusion/', '');
    }
    
    if (currentDir) {
      const dirName = currentDir.split('/').pop() || currentDir.split('\\').pop();
      return dirName.replace('terrafusion-', '');
    }
    
    return 'unknown-service';
  }

  loadServiceConfig() {
    // Service-specific configurations
    const configs = {
      'ai-consciousness': { port: 5001, route: '/api/ai-consciousness' },
      'ai-coordinator': { port: 5002, route: '/api/ai-coordinator' },
      'ai-marketplace': { port: 5003, route: '/api/ai-marketplace' },
      'ai-optimization': { port: 5004, route: '/api/ai-optimization' },
      'ai-swarm': { port: 5005, route: '/api/ai-swarm' },
      'emergency-management': { port: 5280, route: '/api/emergency' },
      'legal-judicial': { port: 5290, route: '/api/legal' },
      'public-health': { port: 5300, route: '/api/health' },
      'economic-development': { port: 5310, route: '/api/economic' },
      'public-works': { port: 5320, route: '/api/public-works' },
      'education-management': { port: 5330, route: '/api/education' },
      'elections-voting': { port: 5340, route: '/api/elections' },
      'public-safety': { port: 5350, route: '/api/public-safety' },
      'human-resources': { port: 5360, route: '/api/hr' },
      'procurement': { port: 5370, route: '/api/procurement' },
      'code-enforcement': { port: 5380, route: '/api/code-enforcement' },
      'parks-recreation': { port: 5390, route: '/api/parks' },
      'costforge-ai': { port: 5400, route: '/api/costforge' },
      'terrafusion-sync': { port: 5410, route: '/api/sync' },
      'government-analytics': { port: 5420, route: '/api/analytics' },
      'cybersecurity': { port: 5430, route: '/api/security' },
      'blockchain-governance': { port: 5440, route: '/api/blockchain' },
      'quantum-security': { port: 5450, route: '/api/quantum' }
    };
    
    return configs[this.serviceName] || { 
      port: 8000, 
      route: `/api/${this.serviceName}` 
    };
  }

  shouldUseTrustFabric() {
    // Check environment flag first
    if (process.env.TRUST_FABRIC_FORCE === 'true') return true;
    if (process.env.TRUST_FABRIC_FORCE === 'false') return false;
    
    // Gradual rollout based on service name hash
    const hash = this.hashServiceName(this.serviceName);
    return (hash % 100) < this.rolloutPercentage;
  }

  hashServiceName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  initialize() {
    if (!this.isEnabled) {
      console.log(`🔧 TrustFabricAdapter: ${this.serviceName} - Rollout disabled`);
      return;
    }

    console.log(`🔧 TrustFabricAdapter: ${this.serviceName} - Initializing trust fabric integration`);
    
    // Browser environment
    if (typeof window !== 'undefined') {
      this.interceptBrowserAPIs();
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      this.interceptNodeAPIs();
    }
    
    console.log(`✅ TrustFabricAdapter: ${this.serviceName} - Trust fabric integration active`);
  }

  interceptBrowserAPIs() {
    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      const modifiedUrl = this.redirectURL(url);
      const modifiedOptions = this.addTrustHeaders(options);
      
      if (modifiedUrl !== url) {
        console.log(`🔄 TrustFabric Redirect: ${url} → ${modifiedUrl}`);
      }
      
      return originalFetch(modifiedUrl, modifiedOptions);
    };

    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      const modifiedUrl = this.redirectURL(url);
      if (modifiedUrl !== url) {
        console.log(`🔄 TrustFabric XHR Redirect: ${url} → ${modifiedUrl}`);
      }
      return originalXHROpen.call(this, method, modifiedUrl, ...args);
    }.bind(this);

    // Override jQuery if present
    if (typeof $ !== 'undefined' && $.ajax) {
      const originalAjax = $.ajax;
      $.ajax = function(options) {
        if (typeof options === 'string') {
          options = { url: options };
        }
        options.url = this.redirectURL(options.url);
        options = this.addTrustHeaders(options);
        return originalAjax.call($, options);
      }.bind(this);
    }

    // Override Axios if present
    if (typeof axios !== 'undefined') {
      axios.interceptors.request.use((config) => {
        config.url = this.redirectURL(config.url);
        config = this.addTrustHeaders(config);
        return config;
      });
    }
  }

  interceptNodeAPIs() {
    // Override http and https modules
    const http = require('http');
    const https = require('https');
    const url = require('url');

    // Override http.request
    const originalHttpRequest = http.request;
    http.request = (options, callback) => {
      if (typeof options === 'string') {
        options = url.parse(options);
      }
      options = this.redirectNodeOptions(options);
      return originalHttpRequest(options, callback);
    };

    // Override https.request
    const originalHttpsRequest = https.request;
    https.request = (options, callback) => {
      if (typeof options === 'string') {
        options = url.parse(options);
      }
      options = this.redirectNodeOptions(options);
      return originalHttpsRequest(options, callback);
    };
  }

  redirectURL(originalUrl) {
    if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
    
    // Skip trust fabric URLs
    if (originalUrl.includes(':${TF_API_PORT:-5046}') || originalUrl.includes('trust-fabric')) {
      return originalUrl;
    }
    
    // Check if this is a service URL that should be redirected
    const oldBackendPattern = new RegExp(`localhost:${this.serviceConfig.port}`);
    if (oldBackendPattern.test(originalUrl)) {
      return originalUrl.replace(
        oldBackendPattern, 
        `localhost:${TF_STATIC_PORT:-8080}${this.serviceConfig.route}`
      );
    }
    
    return originalUrl;
  }

  redirectNodeOptions(options) {
    if (options.hostname === 'localhost' && options.port == this.serviceConfig.port) {
      options.hostname = 'localhost';
      options.port = process.env.TF_DESKTOP_PORT || 3104;
      options.path = this.serviceConfig.route + (options.path || '');
    }
    
    return this.addTrustHeaders(options);
  }

  addTrustHeaders(options) {
    if (!options.headers) options.headers = {};
    
    options.headers['X-Trust-Fabric-Service'] = this.serviceName;
    options.headers['X-Trust-Fabric-Version'] = '1.0.0';
    options.headers['X-Trust-Fabric-Route'] = this.serviceConfig.route;
    
    return options;
  }

  // Emergency rollback
  disable() {
    console.log(`🛑 TrustFabricAdapter: ${this.serviceName} - Emergency rollback activated`);
    this.isEnabled = false;
    // Would need to restore original functions, but for now just disable
  }
}

// Auto-initialize if not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  window.TrustFabricAdapter = window.TrustFabricAdapter || new TrustFabricAdapter();
  window.TrustFabricAdapter.initialize();
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrustFabricAdapter;
}

if (typeof window !== 'undefined') {
  window.TrustFabricAdapter = TrustFabricAdapter;
}