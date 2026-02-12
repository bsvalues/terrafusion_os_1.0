/**
 * Terrafusion SyncService
 * Main JavaScript file for the application
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check SyncService status
  checkSyncServiceStatus();
  
  // Set up regular status checks
  setInterval(checkSyncServiceStatus, 30000); // Every 30 seconds
});

/**
 * Check the SyncService status and update UI accordingly
 */
function checkSyncServiceStatus() {
  // Make an API call to check the status
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      // Update service status indicators
      updateServiceStatus(data);
    })
    .catch(error => {
      console.error('Error checking service status:', error);
      // Show error state in the UI
      const serviceStatusElement = document.querySelector('.service-status');
      if (serviceStatusElement) {
        serviceStatusElement.textContent = 'Error checking status';
        serviceStatusElement.className = 'service-status text-danger';
      }
    });
}

/**
 * Update the service status indicators in the UI
 */
function updateServiceStatus(statusData) {
  // Update the service status badge
  const serviceStatusElement = document.querySelector('.service-status');
  if (serviceStatusElement) {
    const syncServiceStatus = statusData.components.sync_service === 'online';
    
    serviceStatusElement.textContent = syncServiceStatus ? 'Online' : 'Offline';
    serviceStatusElement.className = `service-status badge ${syncServiceStatus ? 'bg-success' : 'bg-danger'}`;
  }
}

/**
 * Initialize tooltips and popovers
 */
function initializeComponents() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
}

/**
 * Handle sync pair selection
 */
function handleSyncPairSelection() {
  const syncPairItems = document.querySelectorAll('.sync-pair-item');
  
  syncPairItems.forEach(item => {
    item.addEventListener('click', function(event) {
      // Remove active class from all items
      syncPairItems.forEach(item => item.classList.remove('active'));
      
      // Add active class to the clicked item
      this.classList.add('active');
      
      // Get the pair ID
      const pairId = this.getAttribute('data-pair-id');
      
      // Update the sync operations table or details
      loadSyncOperations(pairId);
    });
  });
}

/**
 * Load sync operations for a specific pair
 */
function loadSyncOperations(pairId) {
  fetch(`/api/sync-operations?pair_id=${pairId}`)
    .then(response => response.json())
    .then(data => {
      // Update the operations table
      updateOperationsTable(data);
    })
    .catch(error => {
      console.error('Error loading sync operations:', error);
    });
}

/**
 * Update the operations table with data
 */
function updateOperationsTable(operations) {
  const tableBody = document.querySelector('#operations-table tbody');
  
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  if (operations.length === 0) {
    // If no operations, show a message
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6" class="text-center">No operations found</td>`;
    tableBody.appendChild(row);
    return;
  }
  
  // Add rows for each operation
  operations.forEach(op => {
    const row = document.createElement('tr');
    
    // Format status badge
    let statusBadgeClass = 'bg-secondary';
    if (op.status === 'completed') statusBadgeClass = 'bg-success';
    if (op.status === 'failed') statusBadgeClass = 'bg-danger';
    if (op.status === 'running') statusBadgeClass = 'bg-warning';
    
    row.innerHTML = `
      <td>${op.id}</td>
      <td>${op.type}</td>
      <td><span class="badge ${statusBadgeClass}">${op.status}</span></td>
      <td>${new Date(op.started_at).toLocaleString()}</td>
      <td>${op.records_processed || 0}/${op.total_records || 0}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary view-details" data-op-id="${op.id}">
          Details
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners to the new buttons
  document.querySelectorAll('.view-details').forEach(button => {
    button.addEventListener('click', function() {
      const opId = this.getAttribute('data-op-id');
      showOperationDetails(opId);
    });
  });
}