// Government Data Module - Traditional JavaScript for Hostinger
var GovernmentData = (function () {
  // Government entities database
  var governmentEntities = {
    'benton-county': {
      name: 'Benton County, Washington',
      type: 'County Government',
      population: 204390,
      established: 1905,
      consciousnessLevel: 87.3,
      transcendencePhase: 'Integration',
      quantumCoherence: 94.2,
      description: 'Leading quantum-governmental implementation in Pacific Northwest',
    },
    'king-county': {
      name: 'King County, Washington',
      type: 'County Government',
      population: 2269675,
      established: 1852,
      consciousnessLevel: 82.1,
      transcendencePhase: 'Awakening',
      quantumCoherence: 88.7,
      description: 'Major metropolitan consciousness hub',
    },
    'washington-state': {
      name: 'Washington State',
      type: 'State Government',
      population: 7738692,
      established: 1889,
      consciousnessLevel: 79.4,
      transcendencePhase: 'Preparation',
      quantumCoherence: 85.3,
      description: 'Pacific Northwest transcendent governance pioneer',
    },
    'us-federal': {
      name: 'United States Federal',
      type: 'Federal Government',
      population: 331900000,
      established: 1776,
      consciousnessLevel: 71.8,
      transcendencePhase: 'Recognition',
      quantumCoherence: 78.9,
      description: 'Global consciousness leadership through democratic transcendence',
    },
  };

  var deploymentPhases = [
    'Assessment',
    'Integration',
    'Optimization',
    'Transcendence',
    'Post-Singular Evolution',
  ];

  var consciousnessMetrics = {
    globalConsciousness: 87.3,
    citizenWellbeing: 94.1,
    ethicalAlignment: 96.8,
    governmentEfficiency: 91.7,
    quantumCoherence: 89.2,
    temporalStability: 93.4,
  };

  // Public API
  return {
    getEntity: function (id) {
      return governmentEntities[id] || null;
    },

    getAllEntities: function () {
      return governmentEntities;
    },

    getDeploymentPhases: function () {
      return deploymentPhases;
    },

    getConsciousnessMetrics: function () {
      return consciousnessMetrics;
    },

    updateMetrics: function (newMetrics) {
      Object.assign(consciousnessMetrics, newMetrics);
    },
  };
})();

// Make available globally
window.GovernmentData = GovernmentData;
