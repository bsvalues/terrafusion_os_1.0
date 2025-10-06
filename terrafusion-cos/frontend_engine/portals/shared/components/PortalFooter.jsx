/**
 * PortalFooter - Footer bar with copyright and links
 */

import './PortalFooter.css';

const PortalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="portal-footer">
      <div className="portal-footer-content">
        <p className="portal-footer-copyright">
          © {currentYear} TerraFusion OS - Benton County. All rights reserved.
        </p>
        
        <div className="portal-footer-links">
          <a href="/help" className="portal-footer-link">Help</a>
          <a href="/privacy" className="portal-footer-link">Privacy</a>
          <a href="/terms" className="portal-footer-link">Terms</a>
          <a href="/contact" className="portal-footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
