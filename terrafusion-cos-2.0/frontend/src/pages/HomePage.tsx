/**
 * TerraFusion cOS 2.0 - Home Page
 * Vendor substrate platform landing
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TerraFusionLogo from '../components/TerraFusionLogo';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI Swarm Orchestration',
      description: '50,000+ government-trained AI agents at your command',
      value: '50K+ Agents',
    },
    {
      icon: '🔄',
      title: 'Real-Time Sync',
      description: 'Sub-second data synchronization across all systems',
      value: '<1s Latency',
    },
    {
      icon: '💰',
      title: 'Financial Intelligence',
      description: 'AI-powered budget optimization and revenue modeling',
      value: '40%+ Savings',
    },
    {
      icon: '🛡️',
      title: 'Compliance Automation',
      description: 'FISMA, NIST, Section 508 built into every API call',
      value: '100% Compliant',
    },
  ];

  const vendors = [
    { name: 'Harris', logo: 'H', status: 'Partner' },
    { name: 'Tyler', logo: 'T', status: 'Integration' },
    { name: 'Esri', logo: 'E', status: 'Ready' },
    { name: 'Woolpert', logo: 'W', status: 'Coming Soon' },
  ];

  return (
    <div className="tf-home">
      {/* Hero Section */}
      <section className="tf-hero">
        <div className="tf-container">
          <motion.div
            className="tf-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="tf-display-large tf-mb-4">
              The Infrastructure That Powers
              <span className="tf-text-transcend"> Government Technology</span>
            </h1>
            
            <p className="tf-body-large tf-text-muted tf-mb-6" style={{ maxWidth: '600px' }}>
              TerraFusion cOS is the vendor substrate platform that transforms government 
              software with AI orchestration, real-time sync, and compliance automation.
            </p>
            
            <div className="tf-flex tf-gap-3">
              <Link to="/vendor-portal" className="tf-btn tf-btn-primary">
                Explore Platform
              </Link>
              <button className="tf-btn tf-btn-secondary">
                View Documentation
              </button>
            </div>
          </motion.div>
          
          <motion.div
            className="tf-hero-visual"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="tf-swarm-viz" style={{ height: '500px' }}>
              {/* Animated nodes representing AI swarm */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`tf-swarm-node ${
                    i === 0 ? 'commander' : i < 5 ? 'general' : ''
                  }`}
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${Math.random() * 90 + 5}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 50 - 25, 0],
                    y: [0, Math.random() * 50 - 25, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="tf-features tf-mt-16">
        <div className="tf-container">
          <motion.h2
            className="tf-display tf-text-center tf-mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Enterprise-Grade Infrastructure
          </motion.h2>
          
          <div className="tf-dashboard-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="tf-metric-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="tf-text-6xl tf-mb-3">{feature.icon}</div>
                <h3 className="tf-h2">{feature.title}</h3>
                <p className="tf-text-muted tf-mb-4">{feature.description}</p>
                <div className="tf-metric-value">{feature.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Partners */}
      <section className="tf-vendors tf-mt-16 tf-mb-16">
        <div className="tf-container">
          <motion.h2
            className="tf-display tf-text-center tf-mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Powering Leading Vendors
          </motion.h2>
          
          <div className="tf-vendor-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--tf-space-4)'
          }}>
            {vendors.map((vendor, index) => (
              <motion.div
                key={vendor.name}
                className="tf-vendor-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="tf-vendor-icon">{vendor.logo}</div>
                <h3 className="tf-h2">{vendor.name}</h3>
                <div className={`tf-badge tf-badge-${
                  vendor.status === 'Partner' ? 'success' : 
                  vendor.status === 'Integration' ? 'trust' : 
                  vendor.status === 'Ready' ? 'trust' :
                  'alert'
                } tf-mt-2`}>
                  {vendor.status}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="tf-cta tf-py-16">
        <div className="tf-container tf-text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="tf-display tf-mb-4">
              Ready to Transform Your Platform?
            </h2>
            <p className="tf-body-large tf-text-muted tf-mb-6">
              Join the vendors leveraging TerraFusion cOS to deliver next-generation government solutions.
            </p>
            <Link to="/vendor-portal" className="tf-btn tf-btn-transcend">
              Start Integration
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
