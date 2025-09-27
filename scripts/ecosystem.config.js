// NO HARDCODED PORTS! Use environment variables.
# TerraFusion OS - PM2 Process Management Configuration
# Production-grade process management for Node.js services

module.exports = {
  apps: [
    {
      name: 'terrafusion-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        VITE_API_URL: 'http://localhost:${TF_STATIC_PORT:-8080}',
        TRUST_FABRIC_DID: 'did:tf:service:frontend:prod'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        VITE_API_URL: 'http://localhost:${TF_STATIC_PORT:-8080}',
        TRUST_FABRIC_DID: 'did:tf:service:frontend:dev'
      },
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'trust-fabric-attestation',
      script: './trust-fabric/attestation-service.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 7000,
        FABRIC_MODE: 'attestation',
        TRUST_FABRIC_DID: 'did:tf:service:attestation:prod'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 7000,
        FABRIC_MODE: 'attestation',
        TRUST_FABRIC_DID: 'did:tf:service:attestation:dev'
      },
      log_file: './logs/trust-fabric-combined.log',
      out_file: './logs/trust-fabric-out.log',
      error_file: './logs/trust-fabric-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'ai-orchestration',
      script: './scripts/ai-orchestration-layer-11.mjs',
      args: 'daemon',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        AI_MODE: 'production',
        TRUST_FABRIC_DID: 'did:tf:service:ai-orchestration:prod'
      },
      env_development: {
        NODE_ENV: 'development',
        AI_MODE: 'development',
        TRUST_FABRIC_DID: 'did:tf:service:ai-orchestration:dev'
      },
      log_file: './logs/ai-orchestration-combined.log',
      out_file: './logs/ai-orchestration-out.log',
      error_file: './logs/ai-orchestration-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'terrafusion',
      host: 'production-server',
      ref: 'origin/main',
      repo: 'https://github.com/bsvalues/terrafusion_os_1.0.git',
      path: '/var/www/terrafusion',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
