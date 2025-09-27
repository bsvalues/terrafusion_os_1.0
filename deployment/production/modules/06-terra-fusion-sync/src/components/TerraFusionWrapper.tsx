/**
 * TERRAFUSION BRAND WRAPPER
 * This component wraps EVERY app to ensure consistent branding
 * whether running standalone or as part of the OS
 */

import React, {useEffect} from 'react';
import '../terrafusion-unified.css';

interface TerraFusionWrapperProps {children: React.ReactNode;
  appName: string;
  appIcon?: string;
  appVersion?: string;
  standalone?: boolean;}

export const TerraFusionWrapper: React.FC<TerraFusionWrapperProps>= ({children,
  appName,
  appIcon = '🌍',
  appVersion = '1.0.0',
  standalone = false}) => {
  useEffect(() => {
    // Inject brand CSS variables
    document.documentElement.style.setProperty('--app-name', appName);
    
    // Add Terrafusion class to body
    document.body.classList.add('terrafusion-branded');
    
    // Set page title
    document.title = `${appName} | Terrafusion County OS`;
    
    return () => {document.body.classList.remove('terrafusion-branded');};
  }, [appName]);

  // If running standalone, show the header
  if (standalone) {
    return (<div className="terrafusion-standalone-app"><header className="terrafusion-app-header"><div className="terrafusion-app-header-content"><div className="terrafusion-app-brand"><><span className="app-icon">{appIcon}</span><div
</>

className="app-info"><><h1 className="app-name">{appName}</h1><div
</>

className="app-tagline">Powered by Terrafusion • Government. Transcended.</div></div></div><div className="app-status"><><span className="status-badge">v{appVersion}</span><span
</>

className="status-badge championship">Championship Edition</span></div></div></header><><main className="terrafusion-app-content">{children}</main><footer
</>

className="terrafusion-app-footer"><div className="footer-content"><><span>© 2025 Terrafusion</span><span
</>

className="separator">•</span><><span>379M× Faster Than Legacy Systems</span><span
</>

className="separator">•</span><span>We do it right the first time.</span></div></footer></div>);
  }

  // If running inside the OS, just wrap with consistent styling
  return (<div className="terrafusion-module-content">{children}</div>
  );
};

// Additional style injection for standalone apps
const standaloneStyles = `
.terrafusion-standalone-app {min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--terra-gradient-dark);}

.terrafusion-app-header {background: var(--terra-void);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  padding: 1rem 1.5rem;}

.terrafusion-app-header-content {max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;}

.terrafusion-app-brand {display: flex;
  align-items: center;
  gap: 1rem;}

.app-icon {font-size: 2rem;
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));}

.app-info h1 {margin: 0;
  font-size: 1.5rem;
  color: var(--terra-white);
  font-weight: 700;}

.app-tagline {font-size: 0.875rem;
  color: var(--terra-fusion);
  margin-top: 0.25rem;}

.app-status {display: flex;
  gap: 1rem;
  align-items: center;}

.status-badge {padding: 0.25rem 0.75rem;
  background: rgba(0, 212, 255, 0.1);
  color: var(--terra-fusion);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(0, 212, 255, 0.2);}

.status-badge.championship {background: var(--terra-gradient-empire);
  color: var(--terra-white);
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;}

.terrafusion-app-content {flex: 1;
  background: var(--terra-white);
  margin: 1.5rem;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);}

.terrafusion-app-footer {background: var(--terra-void);
  padding: 1rem;
  border-top: 1px solid rgba(0, 212, 255, 0.1);}

.footer-content {text-align: center;
  color: var(--terra-silver);
  font-size: 0.875rem;}

.separator {margin: 0 0.5rem;
  opacity: 0.5;}

/* Ensure all child components inherit the branding */
.terrafusion-branded * {font-family: var(--terra-font-body) !important;}

.terrafusion-branded h1,
.terrafusion-branded h2,
.terrafusion-branded h3,
.terrafusion-branded h4,
.terrafusion-branded h5,
.terrafusion-branded h6 {font-family: var(--terra-font-display) !important;
  color: var(--terra-void);}

.terrafusion-branded button {font-family: var(--terra-font-body) !important;
  transition: all var(--terra-transition-smooth) !important;}

.terrafusion-branded input,
.terrafusion-branded select,
.terrafusion-branded textarea {font-family: var(--terra-font-body) !important;
  border-color: var(--terra-silver) !important;}

.terrafusion-branded input:focus,
.terrafusion-branded select:focus,
.terrafusion-branded textarea:focus {border-color: var(--terra-fusion) !important;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1) !important;}
`;

// Inject styles if not already present
if (!document.getElementById('terrafusion-standalone-styles')) {const styleElement = document.createElement('style');
  styleElement.id = 'terrafusion-standalone-styles';
  styleElement.textContent = standaloneStyles;
  document.head.appendChild(styleElement);}

export default TerraFusionWrapper;