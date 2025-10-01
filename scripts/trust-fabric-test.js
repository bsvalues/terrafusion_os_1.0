// Test script to check if trust fabric adapter is loaded
try {
    // Check if adapter is available
    const adapterScript = document.querySelector('script[src*="trust-fabric-adapter"]');
    console.log('Trust Fabric Script:', adapterScript ? 'Found' : 'Not found');
    
    // Check if fetch is intercepted
    const originalFetch = window.fetch;
    console.log('Fetch interception:', originalFetch.toString().includes('trust') ? 'Likely intercepted' : 'Original');
    
    // Make a test fetch call
    fetch('/api/test', { method: 'GET' })
        .then(() => console.log('Fetch call completed through trust fabric'))
        .catch(e => console.log('Fetch test:', e.message));
        
} catch (error) {
    console.log('Trust fabric test error:', error);
}
