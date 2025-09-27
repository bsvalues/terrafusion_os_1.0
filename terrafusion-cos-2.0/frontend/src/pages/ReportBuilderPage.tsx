import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaChartBar, FaDownload, FaEye, FaPlus, FaCog, FaShieldAlt, FaBrain } from 'react-icons/fa';
import '../styles/app.css'; // Ensure TerraFusion brand styles are imported

const ReportBuilderPage: React.FC = () => {
  const [reportBuilder, setReportBuilder] = useState({
    name: "TerraFusion Report Builder",
    version: "2.0.0",
    capabilities: [
      "Real-time data visualization",
      "AI-powered insights",
      "Government compliance reporting",
      "Multi-source data integration",
      "Automated report generation",
      "Custom dashboard creation"
    ],
    templates: [
      "Financial Analysis Report",
      "Compliance Audit Report", 
      "Performance Metrics Dashboard",
      "Vendor Integration Report",
      "AI Swarm Analytics Report"
    ],
    active_reports: 12,
    generated_today: 45
  });

  const [templates, setTemplates] = useState([
    {
      id: "financial_analysis",
      name: "Financial Analysis Report",
      description: "Comprehensive financial analysis with AI insights",
      category: "financial",
      compliance: ["FISMA", "NIST_800_53"],
      last_used: "2024-01-15T14:30:00Z"
    },
    {
      id: "compliance_audit",
      name: "Compliance Audit Report",
      description: "Automated compliance validation and reporting",
      category: "compliance",
      compliance: ["FISMA", "NIST_800_53", "Section_508"],
      last_used: "2024-01-15T14:25:00Z"
    },
    {
      id: "performance_metrics",
      name: "Performance Metrics Dashboard",
      description: "Real-time system performance and analytics",
      category: "performance",
      compliance: ["FISMA"],
      last_used: "2024-01-15T14:20:00Z"
    },
    {
      id: "vendor_integration",
      name: "Vendor Integration Report",
      description: "Vendor partnership and integration status",
      category: "vendor",
      compliance: ["FISMA", "NIST_800_53"],
      last_used: "2024-01-15T14:15:00Z"
    },
    {
      id: "ai_swarm_analytics",
      name: "AI Swarm Analytics Report",
      description: "AI agent performance and coordination metrics",
      category: "ai",
      compliance: ["FISMA", "NIST_800_53"],
      last_used: "2024-01-15T14:10:00Z"
    }
  ]);

  const [recentReports, setRecentReports] = useState([
    {
      id: "rpt-001",
      name: "Harris PACS Financial Analysis Q3",
      template: "Financial Analysis Report",
      status: "completed",
      generated_at: "2024-01-15T14:30:00Z",
      size: "2.3 MB"
    },
    {
      id: "rpt-002", 
      name: "Tyler Courts Compliance Audit",
      template: "Compliance Audit Report",
      status: "completed",
      generated_at: "2024-01-15T14:25:00Z",
      size: "1.8 MB"
    },
    {
      id: "rpt-003",
      name: "AI Swarm Performance Metrics",
      template: "AI Swarm Analytics Report",
      status: "generating",
      generated_at: "2024-01-15T14:35:00Z",
      size: "0.0 MB"
    }
  ]);

  useEffect(() => {
    // In a real application, you would fetch this data from your API Gateway
    // For now, we'll simulate real-time updates
    const interval = setInterval(() => {
      setReportBuilder(prevBuilder => ({
        ...prevBuilder,
        generated_today: prevBuilder.generated_today + Math.floor(Math.random() * 3)
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tf-page-container tf-report-builder-page">
      <header className="tf-page-header">
        <h1 className="tf-page-title">
          <FaFileAlt className="tf-icon-large tf-gradient-text" /> TerraFusion Report Builder
        </h1>
        <p className="tf-page-subtitle">AI-powered analytics and compliance reporting for government operations.</p>
      </header>

      <section className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-4 tf-gap-6 tf-mb-8">
        <div className="tf-card tf-card-gradient-blue">
          <div className="tf-card-header">
            <FaFileAlt className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Active Reports</h3>
          </div>
          <p className="tf-card-value tf-text-white">{reportBuilder.active_reports}</p>
          <p className="tf-card-description tf-text-white">Currently active report configurations.</p>
        </div>

        <div className="tf-card tf-card-gradient-green">
          <div className="tf-card-header">
            <FaChartBar className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Generated Today</h3>
          </div>
          <p className="tf-card-value tf-text-white">{reportBuilder.generated_today}</p>
          <p className="tf-card-description tf-text-white">Reports generated in the last 24 hours.</p>
        </div>

        <div className="tf-card tf-card-gradient-purple">
          <div className="tf-card-header">
            <FaBrain className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">AI Templates</h3>
          </div>
          <p className="tf-card-value tf-text-white">{templates.length}</p>
          <p className="tf-card-description tf-text-white">Pre-built AI-powered report templates.</p>
        </div>

        <div className="tf-card tf-card-gradient-orange">
          <div className="tf-card-header">
            <FaShieldAlt className="tf-icon tf-text-white" />
            <h3 className="tf-card-title tf-text-white">Compliance Ready</h3>
          </div>
          <p className="tf-card-value tf-text-white">100%</p>
          <p className="tf-card-description tf-text-white">All reports meet government standards.</p>
        </div>
      </section>

      <section className="tf-section-card">
        <h2 className="tf-section-title">Report Templates</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-3 tf-gap-6">
          {templates.map((template) => (
            <div key={template.id} className="tf-card tf-card-hover">
              <div className="tf-card-header">
                <FaFileAlt className="tf-icon tf-text-blue-600" />
                <h3 className="tf-card-title">{template.name}</h3>
              </div>
              <p className="tf-card-description tf-mb-4">{template.description}</p>
              <div className="tf-mb-4">
                <span className="tf-badge tf-badge-blue tf-mr-2">{template.category}</span>
                {template.compliance.map((comp, index) => (
                  <span key={index} className="tf-badge tf-badge-green tf-mr-1">{comp}</span>
                ))}
              </div>
              <div className="tf-flex tf-justify-between tf-items-center">
                <span className="tf-text-sm tf-text-gray-500">
                  Last used: {new Date(template.last_used).toLocaleDateString()}
                </span>
                <div className="tf-flex tf-space-x-2">
                  <button className="tf-button tf-button-sm tf-button-primary">
                    <FaEye className="tf-mr-1" /> Preview
                  </button>
                  <button className="tf-button tf-button-sm tf-button-secondary">
                    <FaPlus className="tf-mr-1" /> Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Recent Reports</h2>
        <div className="tf-overflow-x-auto">
          <table className="tf-table-auto tf-w-full tf-text-left tf-whitespace-no-wrap">
            <thead>
              <tr className="tf-bg-gray-100 tf-text-gray-600 tf-uppercase tf-text-sm tf-leading-normal">
                <th className="tf-py-3 tf-px-6">Report Name</th>
                <th className="tf-py-3 tf-px-6">Template</th>
                <th className="tf-py-3 tf-px-6">Status</th>
                <th className="tf-py-3 tf-px-6">Size</th>
                <th className="tf-py-3 tf-px-6">Generated</th>
                <th className="tf-py-3 tf-px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="tf-text-gray-700 tf-text-sm tf-font-light">
              {recentReports.map((report) => (
                <tr key={report.id} className="tf-border-b tf-border-gray-200 tf-hover:tf-bg-gray-50">
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap tf-font-medium">{report.name}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{report.template}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">
                    <span className={`tf-px-3 tf-py-1 tf-rounded-full tf-text-xs ${
                      report.status === 'completed' ? 'tf-bg-green-200 tf-text-green-800' : 'tf-bg-yellow-200 tf-text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{report.size}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">{new Date(report.generated_at).toLocaleString()}</td>
                  <td className="tf-py-3 tf-px-6 tf-whitespace-no-wrap">
                    <div className="tf-flex tf-space-x-2">
                      <button className="tf-button tf-button-xs tf-button-primary">
                        <FaEye className="tf-mr-1" />
                      </button>
                      <button className="tf-button tf-button-xs tf-button-secondary">
                        <FaDownload className="tf-mr-1" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Report Builder Capabilities</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 tf-gap-4">
          {reportBuilder.capabilities.map((capability, index) => (
            <div key={index} className="tf-flex tf-items-center tf-p-3 tf-bg-gray-50 tf-rounded-lg">
              <FaCog className="tf-mr-3 tf-text-blue-600" />
              <span className="tf-text-gray-700">{capability}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tf-section-card tf-mt-8">
        <h2 className="tf-section-title">Quick Actions</h2>
        <div className="tf-grid tf-grid-cols-1 md:tf-grid-cols-2 lg:tf-grid-cols-4 tf-gap-4">
          <Link to="/reports/new" className="tf-button tf-button-primary">
            <FaPlus className="tf-mr-2" /> Create New Report
          </Link>
          <Link to="/reports/templates" className="tf-button tf-button-secondary">
            <FaFileAlt className="tf-mr-2" /> Browse Templates
          </Link>
          <Link to="/reports/scheduled" className="tf-button tf-button-tertiary">
            <FaCog className="tf-mr-2" /> Scheduled Reports
          </Link>
          <Link to="/reports/analytics" className="tf-button tf-button-quaternary">
            <FaChartBar className="tf-mr-2" /> Report Analytics
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ReportBuilderPage;
