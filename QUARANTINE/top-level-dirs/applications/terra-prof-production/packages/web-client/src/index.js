/**
 * Simple client-side application for TerraFusionPro
 */
console.log('TerraFusionPro Web Client loaded');

// Fetch services status
async function fetchServices() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) {
      throw new Error('Failed to fetch service status');
    }
    
    const data = await response.json();
    updateServicesGrid(data.services);
  } catch (error) {
    console.error('Error fetching services:', error);
    showError('Unable to load services status. Please try again later.');
  }
}

function updateServicesGrid(services) {
  const servicesGrid = document.getElementById('services-grid');
  
  if (!services || services.length === 0) {
    servicesGrid.innerHTML = '<p>No services data available</p>';
    return;
  }
  
  let html = '';
  
  services.forEach(service => {
    const statusClass = service.status === 'active' ? 'status-active' : 'status-inactive';
    const statusText = service.status === 'active' ? 'Active' : 'Inactive';
    
    html += `<div class="service-card">
              <div class="service-name">${service.name}</div>
              <div class="service-port">Port: ${service.port || 'N/A'}</div>
              <div class="service-status ${statusClass}">${statusText}</div>
            </div>`;
  });
  
  servicesGrid.innerHTML = html;
}

function showError(message) {
  const servicesGrid = document.getElementById('services-grid');
  
  servicesGrid.innerHTML = `<div class="error-message">
                            <p>${message}</p>
                            <button class="button" onclick="fetchServices()">Try Again</button>
                          </div>`;
}

// Fetch property data
async function fetchProperties() {
  const propertiesContainer = document.getElementById('properties-container');
  
  // Show loading spinner
  propertiesContainer.innerHTML = `<div style="text-align: center;">
                                    <div class="spinner"></div>
                                    <p>Loading property data...</p>
                                  </div>`;
  
  try {
    const response = await fetch('/api/properties');
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    const data = await response.json();
    
    if (data.properties && data.properties.length > 0) {
      // Create property cards
      let propertiesHtml = `<p class="data-source">Data source: ${data.source || 'API'} 
                          | Updated: ${new Date(data.timestamp).toLocaleString()}</p>
                          <div class="property-grid">`;
      
      data.properties.forEach(property => {
        propertiesHtml += `<div class="property-card">
                            <h3>${property.address}</h3>
                            <p><strong>Location:</strong> ${property.city}, ${property.state}</p>`;
        
        if (property.zipCode) {
          propertiesHtml += `<p><strong>Zip:</strong> ${property.zipCode}</p>`;
        }
        
        if (property.propertyType) {
          propertiesHtml += `<p><strong>Type:</strong> ${property.propertyType}</p>`;
        }
        
        if (property.yearBuilt) {
          propertiesHtml += `<p><strong>Year Built:</strong> ${property.yearBuilt}</p>`;
        }
        
        if (property.bedrooms) {
          propertiesHtml += `<p><strong>Beds:</strong> ${property.bedrooms}</p>`;
        }
        
        if (property.bathrooms) {
          propertiesHtml += `<p><strong>Baths:</strong> ${property.bathrooms}</p>`;
        }
        
        propertiesHtml += `<button class="button" onclick="showPropertyDetails('${property.id}')">View Details</button>
                          </div>`;
      });
      
      propertiesHtml += '</div>';
      propertiesContainer.innerHTML = propertiesHtml;
    } else {
      propertiesContainer.innerHTML = '<p>No properties found</p>';
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
    propertiesContainer.innerHTML = `<div class="error-message">
                                      <p>Error loading properties: ${error.message}</p>
                                      <button class="button" onclick="fetchProperties()">Try Again</button>
                                    </div>`;
  }
}

function showPropertyDetails(id) {
  alert('Property ID: ' + id);
}

// Fetch user data
async function fetchUsers() {
  const usersContainer = document.getElementById('users-container');
  
  // Show loading spinner
  usersContainer.innerHTML = `<div style="text-align: center;">
                              <div class="spinner"></div>
                              <p>Loading user data...</p>
                            </div>`;
  
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    
    if (data.users && data.users.length > 0) {
      // Create user table
      let usersHtml = `<p class="data-source">Data source: ${data.source || 'API'} 
                      | Updated: ${new Date(data.timestamp).toLocaleString()}</p>
                      <table class="users-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Company</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>`;
      
      data.users.forEach(user => {
        usersHtml += `<tr>
                      <td>${user.firstName} ${user.lastName}</td>
                      <td>${user.email}</td>
                      <td>${user.role || 'N/A'}</td>
                      <td>${user.company || 'N/A'}</td>
                      <td>
                        <button class="button small" onclick="showUserProfile('${user.id}')">Profile</button>
                      </td>
                    </tr>`;
      });
      
      usersHtml += '</tbody></table>';
      
      usersContainer.innerHTML = usersHtml;
    } else {
      usersContainer.innerHTML = '<p>No users found</p>';
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    usersContainer.innerHTML = `<div class="error-message">
                                <p>Error loading users: ${error.message}</p>
                                <button class="button" onclick="fetchUsers()">Try Again</button>
                              </div>`;
  }
}

function showUserProfile(id) {
  alert('User ID: ' + id);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Fetch service status
  fetchServices();
  
  // Also fetch properties and users
  fetchProperties();
  fetchUsers();
  
  // Login button click
  document.getElementById('login-button').addEventListener('click', function() {
    alert('This is a demonstration of the platform architecture. Full authentication would be implemented in the production version.');
  });
  
  // Property refresh button
  document.getElementById('load-properties-button').addEventListener('click', function() {
    fetchProperties();
  });
  
  // Users refresh button
  document.getElementById('load-users-button').addEventListener('click', function() {
    fetchUsers();
  });
});

// Expose functions to global scope for button handlers
window.fetchServices = fetchServices;
window.fetchProperties = fetchProperties;
window.fetchUsers = fetchUsers;
window.showPropertyDetails = showPropertyDetails;
window.showUserProfile = showUserProfile;