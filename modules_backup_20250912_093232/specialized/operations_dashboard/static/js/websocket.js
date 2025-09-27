// Terrafusion Operations Dashboard - WebSocket Module

let socket = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

// Initialize WebSocket connection
function initWebSocket() {
  console.log('Initializing WebSocket connection...');

  // Connect to Socket.IO server
  socket = io({
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection event handlers
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);

  // Data event handlers
  socket.on('metrics_update', handleMetricsUpdate);
  socket.on('critical_alert', handleCriticalAlert);
  socket.on('service_action', handleServiceAction);
  socket.on('subscribed', handleSubscribed);

  // Subscribe to updates
  subscribeToUpdates();
}

// Handle successful connection
function handleConnect() {
  console.log('WebSocket connected');
  reconnectAttempts = 0;

  // Update UI to show connected status
  showConnectionStatus('connected');

  // Clear any reconnect intervals
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

// Handle disconnection
function handleDisconnect(reason) {
  console.log('WebSocket disconnected:', reason);
  showConnectionStatus('disconnected');

  // Socket.IO will handle reconnection automatically
}

// Handle connection errors
function handleConnectError(error) {
  console.error('WebSocket connection error:', error);
  reconnectAttempts++;

  if (reconnectAttempts >= maxReconnectAttempts) {
    showConnectionStatus('error');
    showAlert('Unable to establish real-time connection. Dashboard will use polling.', 'warning');
  }
}

// Subscribe to metric updates
function subscribeToUpdates() {
  if (socket && socket.connected) {
    socket.emit('subscribe', {
      metrics: ['system', 'services', 'alerts'],
    });
  }
}

// Handle subscription confirmation
function handleSubscribed(data) {
  console.log('Subscribed to updates:', data.metrics);
}

// Handle metrics update
function handleMetricsUpdate(data) {
  // console.log('Received metrics update:', data);

  // Update metrics summary
  if (data) {
    updateMetricsSummary(data);

    // Dispatch custom event for charts
    window.dispatchEvent(new CustomEvent('metricsUpdate', { detail: data }));
  }
}

// Handle critical alerts
function handleCriticalAlert(data) {
  console.log('Critical alert received:', data);

  if (data.alerts && data.alerts.length > 0) {
    data.alerts.forEach(alert => {
      showAlert(`CRITICAL: ${alert.message}`, 'danger');
    });

    // Update alerts display
    updateAlerts({ alerts: data.alerts });

    // Flash the alert count
    $('#alerts-value').addClass('animate__animated animate__flash');
    setTimeout(() => {
      $('#alerts-value').removeClass('animate__animated animate__flash');
    }, 1000);
  }
}

// Handle service actions
function handleServiceAction(data) {
  console.log('Service action:', data);

  // Show notification
  showAlert(`${data.action} performed on ${data.service}`, 'info');

  // Reload service data after a delay
  setTimeout(() => {
    loadDashboardData();
  }, 2000);
}

// Show connection status
function showConnectionStatus(status) {
  const indicator = $('#connection-indicator');

  if (!indicator.length) {
    // Create connection indicator if it doesn't exist
    $('body').append(`
            <div id="connection-indicator" class="position-fixed bottom-0 end-0 m-3">
                <small class="text-muted"></small>
            </div>
        `);
  }

  const $indicator = $('#connection-indicator small');

  switch (status) {
    case 'connected':
      $indicator.html('<i class="fas fa-circle text-success me-1"></i>Real-time connected');
      setTimeout(() => $indicator.fadeOut(), 3000);
      break;
    case 'disconnected':
      $indicator.html('<i class="fas fa-circle text-warning me-1"></i>Reconnecting...');
      $indicator.fadeIn();
      break;
    case 'error':
      $indicator.html('<i class="fas fa-circle text-danger me-1"></i>Connection error');
      $indicator.fadeIn();
      break;
  }
}

// Send action via WebSocket
function sendAction(action, data) {
  if (socket && socket.connected) {
    socket.emit(action, data);
  } else {
    console.warn('WebSocket not connected, action not sent:', action);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
  if (socket) {
    socket.disconnect();
  }
});
