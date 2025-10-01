import React from 'react';
import { Scale, FileText, Calendar, Users, Phone, MapPin, Globe, Mail } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="portal-header">
      <div className="header-container">
        {/* Logo and Title Section */}
        <div className="header-brand">
          <div className="logo-container">
            <Scale size={32} className="logo-icon" />
            <div className="logo-text">
              <h1>TerraFusion Legal & Judicial</h1>
              <p>Benton County Superior Court System</p>
            </div>
          </div>
        </div>

        {/* Court Information */}
        <div className="court-info">
          <div className="court-details">
            <div className="detail-item">
              <MapPin size={16} />
              <span>7122 W Okanogan Pl, Kennewick, WA 99336</span>
            </div>
            <div className="detail-item">
              <Phone size={16} />
              <span>(509) 736-3071</span>
            </div>
            <div className="detail-item">
              <Globe size={16} />
              <span>www.co.benton.wa.us</span>
            </div>
          </div>
          <div className="court-hours">
            <strong>Court Hours:</strong>
            <span>8:00 AM - 5:00 PM</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="header-actions">
          <button className="action-btn emergency">
            <FileText size={16} />
            <span>Emergency Filing</span>
          </button>
          <button className="action-btn">
            <Calendar size={16} />
            <span>Schedule Hearing</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;