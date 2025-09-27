import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCode, FaTerminal, FaDatabase, FaBrain, FaShieldAlt, FaRocket, FaCog, FaFileCode } from 'react-icons/fa';
import '../styles/app.css'; // Ensure TerraFusion brand styles are imported

const IDEPage: React.FC = () => {
  const [ideStatus, setIdeStatus] = useState({
    name: "TerraFusion IDE ULTIMATE",
    version: "2.0.0",
    features: [
      "Monaco Editor (VS Code replacement)",
      "AI Assistant (50,000+ AI agents)",
      "Terminal & Shell Integration",
      "Database Management (PostgreSQL + PostGIS)",
      "Geospatial Tools (LeafScope)",
      "Plugin Development SDK",
      "Government Compliance (FISMA + NIST)",
      "Quantum Performance Engine (379M×)"
    ],
    ai_agents: {
      total: 50000,
      supreme_commander: 1,
      field_generals: 1220,
      operational_forces: 48779
    },
    performance: {
      quantum_multiplier: 379000000,
      compile_time: "<1ms",
      memory_usage: "optimized"
    }
  });

  const [workspace, setWorkspace] = useState({
    projects: [
      {
        name: "Harris PACS Integration",
        type: "government_software",
        status: "active",
        files: 156,
        last_modified: "2024-01-15T14:30:00Z"
      },
      {
        name: "Tyler Courts Enhancement",
        type: "workflow_automation",
        status: "active", 
        files: 89,
        last_modified: "2024-01-15T14:25:00Z"
      }
    ],
    active_project: "Harris PACS Integration",
    ai_assistance: "enabled",
    compliance_mode: "FISMA Level 5"
  });

  useEffect(() => {
    // In a real application, you would fetch this data from your API Gateway
    // For now, we'll simulate real-time updates
    const interval = setInterval(() => {
      setIdeStatus(prevStatus => ({
        ...prevStatus,
        performance: {
          ...prevStatus.performance,
          quantum_multiplier: prevStatus.performance.quantum_multiplier + Math.floor(Math.random() * 1000)
        }
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tf-page-container tf-ide-page">
      <header className="tf-page-header">
        <h1 className="tf-page-title">
          <FaCode className="tf-icon-large tf-gradient-text" /> TerraFusion IDE ULTIMATE
        </h1>
        <p className="tf-page-subtitle">Your Complete Government Technology Development Universe</p>
      </header>

      <section className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-3 tf-gap-6 tf-mb-8">
        <div className="tf-card tf-card-gradient-blue">
          <div className="tf-card-header">
            <FaBrain className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">AI Agents</h3>
          </div>
          <p className="tf-card-value tf-text-white">{ideStatus.ai_agents.total.toLocaleString()}+</p>
          <p className="tf-card-description tf-text-white">
            <span className="tf-font-bold">{ideStatus.ai_agents.supreme_commander}</span> Supreme Commander,{' '}
            <span className="tf-font-bold">{ideStatus.ai_agents.field_generals}</span> Field Generals,{' '}
            <span className="tf-font-bold">{ideStatus.ai_agents.operational_forces}</span> Operational Forces
          </p>
        </div>

        <div className="tf-card tf-card-gradient-purple">
          <div className="tf-card-header">
            <FaRocket className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Quantum Performance</h3>
          </div>
          <p className="tf-card-value tf-text-white">{ideStatus.performance.quantum_multiplier.toLocaleString()}×</p>
          <p className="tf-card-description tf-text-white">Elite Rust Performance Engine optimization.</p>
        </div>

        <div className="tf-card tf-card-gradient-green">
          <div className="tf-card-header">
            <FaFileCode className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Active Projects</h3>
          </div>
          <p className="tf-card-value tf-text-white">{workspace.projects.length}</p>
          <p className="tf-card-description tf-text-white">Government software development projects.</p>
        </div>

        <div className="tf-card tf-card-gradient-orange">
          <div className="tf-card-header">
            <FaShieldAlt className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Compliance Mode</h3>
          </div>
          <p className="tf-card-value tf-text-white">{workspace.compliance_mode}</p>
          <p className="tf-card-description tf-text-white">Government compliance framework active.</p>
        </div>

        <div className="tf-card tf-card-gradient-red">
          <div className="tf-card-header">
            <FaTerminal className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Compile Time</h3>
          </div>
          <p className="tf-card-value tf-text-white">{ideStatus.performance.compile_time}</p>
          <p className="tf-card-description tf-text-white">Ultra-fast compilation with quantum optimization.</p>
        </div>

        <div className="tf-card tf-card-gradient-teal">
          <div className="tf-card-header">
            <FaDatabase className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Database Integration</h3>
          </div>
          <p className="tf-card-value tf-text-white">PostgreSQL + PostGIS</p>
          <p className="tf-card-description tf-text-white">Full geospatial database support.</p>
        </div>
      </section>

      <section className="tf-section-card">
        <h2 className="tf-section-title">IDE Features</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 tf-gap-4">
          {ideStatus.features.map((feature, index) => (
            <div key={index} className="tf-flex tf-items-center tf-p-3 tf-bg-gray-50 tf-rounded-lg">
              <FaCog className="tf-mr-3 tf-text-blue-600" />
              <span className="tf-text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Active Workspace</h2>
        <div className="tf-mb-4">
          <h3 className="tf-text-lg tf-font-semibold tf-text-gray-800 tf-mb-2">
            Current Project: {workspace.active_project}
          </h3>
          <p className="tf-text-gray-600">
            AI Assistance: <span className="tf-font-bold tf-text-green-600">{workspace.ai_assistance}</span> | 
            Compliance: <span className="tf-font-bold tf-text-blue-600">{workspace.compliance_mode}</span>
          </p>
        </div>
        
        <div className="tf-overflow-x-auto">
          <table className="tf-table-auto tf-w-full tf-text-left tf-whitespace-no-wrap">
            <thead>
              <tr className="tf-bg-gray-100 tf-text-gray-600 tf-uppercase tf-text-sm tf-leading-normal">
                <th className="tf-py-3 tf-px-6">Project Name</th>
                <th className="tf-py-3 tf-px-6">Type</th>
                <th className="tf-py-3 tf-px-6">Status</th>
                <th className="tf-py-3 tf-px-6">Files</th>
                <th className="tf-py-3 tf-px-6">Last Modified</th>
              </tr>
            </thead>
            <tbody className="tf-text-gray-700 tf-text-sm tf-font-light">
              {workspace.projects.map((project, index) => (
                <tr key={index} className="tf-border-b tf-border-gray-200 tf-hover:tf-bg-gray-50">
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap tf-font-medium">{project.name}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{project.type.replace('_', ' ')}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">
                    <span className="tf-px-3 tf-py-1 tf-rounded-full tf-text-xs tf-bg-green-200 tf-text-green-800">
                      {project.status}
                    </span>
                  </td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{project.files}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{project.last_modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Quick Actions</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-4 tf-gap-4">
          <Link to="/ide/editor" className="tf-button tf-button-primary">
            <FaCode className="tf-mr-2" /> Open Editor
          </Link>
          <Link to="/ide/terminal" className="tf-button tf-button-secondary">
            <FaTerminal className="tf-mr-2" /> Terminal
          </Link>
          <Link to="/ide/database" className="tf-button tf-button-tertiary">
            <FaDatabase className="tf-mr-2" /> Database Tools
          </Link>
          <Link to="/ide/ai-assistant" className="tf-button tf-button-quaternary">
            <FaBrain className="tf-mr-2" /> AI Assistant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default IDEPage;
