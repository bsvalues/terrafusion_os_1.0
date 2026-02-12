/**
 * TerraFusionPro Field App
 * 
 * Mobile-friendly application for field data collection, property inspection,
 * and on-site appraisal activities.
 */

import http from 'http';

const PORT = process.env.FIELD_APP_PORT || 5001;

// HTML content to serve
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusionPro Field App</title>
  <style>
    :root {
      --primary-color: #10b981;
      --primary-dark: #059669;
      --secondary-color: #4b5563;
      --light-gray: #f3f4f6;
      --medium-gray: #e5e7eb;
      --dark-gray: #1f2937;
      --white: #ffffff;
      --border-radius: 0.5rem;
      --box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--light-gray);
      color: var(--dark-gray);
      line-height: 1.6;
    }
    
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .header {
      background-color: var(--primary-color);
      color: var(--white);
      padding: 1rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }
    
    .logo {
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
    }
    
    .logo-icon {
      margin-right: 0.5rem;
    }
    
    .user-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--white);
      font-size: 1.25rem;
    }
    
    .main-content {
      flex: 1;
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }
    
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem;
    }
    
    .card {
      background-color: var(--white);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .assignments-list {
      list-style: none;
    }
    
    .assignment-item {
      padding: 1rem;
      border-bottom: 1px solid var(--medium-gray);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }
    
    .assignment-item:last-child {
      border-bottom: none;
    }
    
    .assignment-details {
      flex: 1;
    }
    
    .assignment-address {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .assignment-meta {
      font-size: 0.875rem;
      color: var(--secondary-color);
      display: flex;
      align-items: center;
    }
    
    .assignment-icon {
      margin-right: 0.5rem;
    }
    
    .assignment-arrow {
      color: var(--secondary-color);
    }
    
    .status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      text-transform: uppercase;
      font-weight: 500;
    }
    
    .status-pending {
      background-color: #FEF3C7;
      color: #92400E;
    }
    
    .status-in-progress {
      background-color: #DBEAFE;
      color: #1E40AF;
    }
    
    .status-completed {
      background-color: #D1FAE5;
      color: #065F46;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
    }
    
    .action-button {
      background-color: var(--white);
      border: 1px solid var(--medium-gray);
      border-radius: var(--border-radius);
      padding: 1rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .action-button:hover {
      background-color: var(--light-gray);
    }
    
    .action-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }
    
    .action-label {
      font-size: 0.75rem;
      text-align: center;
    }
    
    .floating-button {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      border: none;
      z-index: 5;
      transition: background-color 0.2s;
    }
    
    .floating-button:hover {
      background-color: var(--primary-dark);
    }
    
    .bottom-nav {
      background-color: var(--white);
      border-top: 1px solid var(--medium-gray);
      display: flex;
      justify-content: space-around;
      padding: 0.75rem 0;
    }
    
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--secondary-color);
      text-decoration: none;
      font-size: 0.75rem;
    }
    
    .nav-item.active {
      color: var(--primary-color);
    }
    
    .nav-icon {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }
    
    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--secondary-color);
    }
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: var(--medium-gray);
    }
    
    .empty-message {
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    
    .empty-button {
      background-color: var(--primary-color);
      color: var(--white);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
    }
    
    @media (max-width: 480px) {
      .quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">📱</span>
          Terrafusion<span style="font-weight: 400;">Pro Field</span>
        </div>
        <button class="user-button">👤</button>
      </div>
    </header>
    
    <main class="main-content">
      <h2 class="section-title">Today's Assignments</h2>
      
      <div class="card">
        <ul class="assignments-list">
          <li class="assignment-item">
            <div class="assignment-details">
              <div class="assignment-address">123 Main Street, Cityville</div>
              <div class="assignment-meta">
                <span class="assignment-icon">🏠</span>
                <span>Residential Inspection</span>
              </div>
            </div>
            <span class="status status-pending">Pending</span>
            <span class="assignment-arrow">›</span>
          </li>
          <li class="assignment-item">
            <div class="assignment-details">
              <div class="assignment-address">456 Oak Avenue, Townsburg</div>
              <div class="assignment-meta">
                <span class="assignment-icon">🏢</span>
                <span>Commercial Appraisal</span>
              </div>
            </div>
            <span class="status status-in-progress">In Progress</span>
            <span class="assignment-arrow">›</span>
          </li>
          <li class="assignment-item">
            <div class="assignment-details">
              <div class="assignment-address">789 Pine Lane, Villageton</div>
              <div class="assignment-meta">
                <span class="assignment-icon">🏘️</span>
                <span>Multi-Family Inspection</span>
              </div>
            </div>
            <span class="status status-completed">Completed</span>
            <span class="assignment-arrow">›</span>
          </li>
        </ul>
      </div>
      
      <h2 class="section-title">Quick Actions</h2>
      
      <div class="quick-actions">
        <button class="action-button">
          <span class="action-icon">📷</span>
          <span class="action-label">Take Photos</span>
        </button>
        <button class="action-button">
          <span class="action-icon">📝</span>
          <span class="action-label">Fill Form</span>
        </button>
        <button class="action-button">
          <span class="action-icon">📊</span>
          <span class="action-label">Measurements</span>
        </button>
        <button class="action-button">
          <span class="action-icon">📍</span>
          <span class="action-label">Map View</span>
        </button>
        <button class="action-button">
          <span class="action-icon">📤</span>
          <span class="action-label">Upload</span>
        </button>
        <button class="action-button">
          <span class="action-icon">✓</span>
          <span class="action-label">Checklist</span>
        </button>
      </div>
      
      <h2 class="section-title">Recent Activity</h2>
      
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <div class="empty-message">No recent activity</div>
        <button class="empty-button">Sync Now</button>
      </div>
      
      <button class="floating-button">+</button>
    </main>
    
    <nav class="bottom-nav">
      <a href="#" class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span>Home</span>
      </a>
      <a href="#" class="nav-item">
        <span class="nav-icon">📋</span>
        <span>Assignments</span>
      </a>
      <a href="#" class="nav-item">
        <span class="nav-icon">📁</span>
        <span>Forms</span>
      </a>
      <a href="#" class="nav-item">
        <span class="nav-icon">⚙️</span>
        <span>Settings</span>
      </a>
    </nav>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('TerraFusionPro Field App initialized');
      
      // Handle assignment items click
      const assignmentItems = document.querySelectorAll('.assignment-item');
      assignmentItems.forEach(item => {
        item.addEventListener('click', function() {
          const address = this.querySelector('.assignment-address').textContent;
          alert('Opening assignment: ' + address);
        });
      });
      
      // Handle quick action buttons
      const actionButtons = document.querySelectorAll('.action-button');
      actionButtons.forEach(button => {
        button.addEventListener('click', function() {
          const action = this.querySelector('.action-label').textContent;
          alert('Starting action: ' + action);
        });
      });
      
      // Handle floating button
      const floatingButton = document.querySelector('.floating-button');
      floatingButton.addEventListener('click', function() {
        alert('Creating new inspection');
      });
      
      // Handle bottom navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', function(e) {
          e.preventDefault();
          navItems.forEach(nav => nav.classList.remove('active'));
          this.classList.add('active');
          
          const section = this.querySelector('span:last-child').textContent;
          console.log('Navigated to ' + section);
        });
      });
      
      // Handle empty state button
      const emptyButton = document.querySelector('.empty-button');
      emptyButton.addEventListener('click', function() {
        alert('Syncing data with server...');
      });
    });
  </script>
</body>
</html>
`;

// Basic JSON response for API endpoints
const apiInfoResponse = JSON.stringify({
  name: 'TerraFusionPro Field App',
  version: '1.0.0',
  status: 'healthy',
  timestamp: new Date().toISOString()
});

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle API request
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(apiInfoResponse);
    return;
  }
  
  // Serve HTML for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Field app server running on port ${PORT}`);
});

export default server;