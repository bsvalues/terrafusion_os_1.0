#!/usr/bin/env node

/**
 * Demo Agent Activity Publisher
 * Publishes test agent actions to demonstrate transparency engine
 */

const { DefaultTransparencyBus } = require('./dist/index.js');

const services = ['dotnet-backend', 'rust-ide', 'portal-ui', 'tdc-cli'];
const workspaces = ['backend', 'frontend', 'portal', 'tdc'];
const phases = ['planning', 'executing', 'waiting', 'complete', 'error'];
const agentRoles = [
  'Backend Architect',
  'Frontend UX Specialist',
  'System Navigator',
  'AI Coordinator',
  'Performance Monitor',
  'Security Validator',
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAction() {
  const service = randomElement(services);
  const workspace = randomElement(workspaces);
  const phase = randomElement(phases);
  const role = randomElement(agentRoles);

  const summaries = [
    `Analyzing ${workspace} codebase for optimization opportunities`,
    `Running health checks on ${service}`,
    `Deploying updates to ${workspace} workspace`,
    `Validating security compliance for ${service}`,
    `Coordinating AI swarm for ${workspace}`,
    `Monitoring performance metrics`,
    `Building ${workspace} components`,
    `Testing ${service} integration`,
    `Optimizing database queries for ${workspace}`,
    `Updating documentation for ${service}`,
  ];

  return {
    timestamp: new Date().toISOString(),
    agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
    agentRole: role,
    workspace,
    service,
    phase,
    summary: randomElement(summaries),
    details: {
      priority: Math.random() > 0.7 ? 'high' : 'normal',
      progress: Math.floor(Math.random() * 100),
    },
  };
}

console.log('🤖 Starting Demo Agent Activity Publisher\n');
console.log('Publishing agent actions every 2 seconds...');
console.log('Press Ctrl+C to stop\n');

let count = 0;

const interval = setInterval(() => {
  const action = generateAction();
  DefaultTransparencyBus.publish(action);
  count++;

  const phaseEmoji = {
    planning: '📋',
    executing: '⚡',
    waiting: '⏳',
    complete: '✅',
    error: '❌',
  };

  console.log(`${phaseEmoji[action.phase]} [${count}] ${action.agentRole} - ${action.summary}`);
}, 2000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log(`\n\n✅ Published ${count} agent actions`);
  clearInterval(interval);
  process.exit(0);
});
