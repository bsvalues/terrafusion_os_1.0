const statusElements = {
    TerraAgent: document.getElementById('terraAgentStatus'),
    TerraFlow: document.getElementById('terraFlowStatus'),
    TerraLevy: document.getElementById('terraLevyStatus'),
};

const launchButtons = {
    TerraAgent: document.querySelector('[onclick="launchApp(\'TerraAgent\')"]'),
    TerraFlow: document.querySelector('[onclick="launchApp(\'TerraFlow\')"]'),
    TerraLevy: document.querySelector('[onclick="launchApp(\'TerraLevy\')"]'),
};

async function launchApp(appName) {
    statusElements[appName].textContent = `Status: Launching ${appName}...`;
    launchButtons[appName].disabled = true; // Disable button while launching
    try {
        const response = await fetch(`/api/launch/${appName}`);
        const data = await response.json();
        if (data.status === 'success') {
            statusElements[appName].textContent = `Status: ${data.message} (Port: ${data.port})`;
        } else {
            statusElements[appName].textContent = `Status: Error - ${data.message}`;
            launchButtons[appName].disabled = false; // Re-enable on error
        }
    } catch (error) {
        console.error(`Error launching ${appName}:`, error);
        statusElements[appName].textContent = `Status: Network Error - Could not connect to launcher backend.`;
        launchButtons[appName].disabled = false; // Re-enable on error
    }
}

async function updateAppStatus(appName) {
    try {
        const response = await fetch(`/api/status/${appName}`);
        const data = await response.json();
        const currentStatusText = statusElements[appName].textContent;

        if (data.status === 'running') {
            // Update only if status changed or port is new
            if (!currentStatusText.includes("running") || !currentStatusText.includes(`(Port: ${data.port})`)) {
                statusElements[appName].textContent = `Status: Running (Port: ${data.port})`;
            }
            launchButtons[appName].disabled = true; // Keep disabled if running
        } else if (data.status === 'exited') {
            statusElements[appName].textContent = `Status: Exited (Code: ${data.exit_code || 'N/A'})`;
            launchButtons[appName].disabled = false; // Enable button once exited
        } else if (data.status === 'not_launched') {
            statusElements[appName].textContent = `Status: Not Launched`;
            launchButtons[appName].disabled = false; // Enable if not launched
        }
    } catch (error) {
        console.error(`Error fetching status for ${appName}:`, error);
        // Do not change status text on network error to avoid flickering
        launchButtons[appName].disabled = false; // Enable in case of backend issues
    }
}

// Periodically update statuses
setInterval(() => {
    updateAppStatus('TerraAgent');
    updateAppStatus('TerraFlow');
    updateAppStatus('TerraLevy');
}, 2000); // Update every 2 seconds 