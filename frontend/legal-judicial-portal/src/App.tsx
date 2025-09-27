import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import LegalDashboard from './LegalDashboard';
import CaseManagement from './CaseManagement';
import CourtCalendar from './CourtCalendar';
import JudgeManagement from './JudgeManagement';
import { BarChart3, FileText, Calendar, Users } from 'lucide-react';
import './App.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard', description: 'Legal system overview' },
    { path: '/cases', icon: FileText, label: 'Case Management', description: 'Track and manage legal cases' },
    { path: '/calendar', icon: Calendar, label: 'Court Calendar', description: 'Hearing schedules and courtrooms' },
    { path: '/judges', icon: Users, label: 'Judicial Personnel', description: 'Judge assignments and availability' }
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon">
                <Icon size={20} />
              </div>
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Header />
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LegalDashboard />} />
            <Route path="/cases" element={<CaseManagement />} />
            <Route path="/calendar" element={<CourtCalendar />} />
            <Route path="/judges" element={<JudgeManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;