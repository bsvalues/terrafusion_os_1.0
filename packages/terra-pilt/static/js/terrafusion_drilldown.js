
// Terrafusion Infinite Drill-Down System
function openDetailModal(category, itemId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px);
        z-index: 9999; display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, rgba(8, 145, 178, 0.95), rgba(0, 210, 255, 0.9));
        border: 2px solid rgba(0, 210, 255, 0.5); border-radius: 20px;
        padding: 3rem; max-width: 80%; max-height: 80%; overflow-y: auto;
        color: white; box-shadow: 0 20px 60px rgba(0, 210, 255, 0.3);
        animation: slideIn 0.3s ease; position: relative;
    `;
    
    content.innerHTML = getDetailedContent(category, itemId);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute; top: 1rem; right: 1rem;
        background: rgba(255, 255, 255, 0.3); border: none; color: white;
        font-size: 2rem; cursor: pointer; width: 40px; height: 40px;
        border-radius: 50%; transition: all 0.3s ease;
    `;
    closeBtn.onclick = () => document.body.removeChild(modal);
    
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    };
}

function openSubDrill(subCategory, value) {
    const subModal = document.createElement('div');
    subModal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(15px);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const subContent = document.createElement('div');
    subContent.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 210, 255, 0.95), rgba(8, 145, 178, 0.95));
        border: 3px solid rgba(0, 210, 255, 0.7); border-radius: 25px;
        padding: 3rem; max-width: 85%; max-height: 85%; overflow-y: auto;
        color: white; box-shadow: 0 30px 80px rgba(0, 210, 255, 0.4);
        animation: slideIn 0.3s ease; position: relative;
    `;
    
    subContent.innerHTML = getSubDrillContent(subCategory, value);
    
    const subCloseBtn = document.createElement('button');
    subCloseBtn.innerHTML = '×';
    subCloseBtn.style.cssText = `
        position: absolute; top: 1rem; right: 1rem;
        background: rgba(255, 255, 255, 0.3); border: none; color: white;
        font-size: 2.5rem; cursor: pointer; width: 50px; height: 50px;
        border-radius: 50%; transition: all 0.3s ease;
    `;
    subCloseBtn.onclick = () => document.body.removeChild(subModal);
    
    subContent.appendChild(subCloseBtn);
    subModal.appendChild(subContent);
    document.body.appendChild(subModal);
    
    subModal.onclick = (e) => {
        if (e.target === subModal) document.body.removeChild(subModal);
    };
}

function getDetailedContent(category, itemId) {
    return `
        <h2><i class="fas fa-search me-3"></i>${category.charAt(0).toUpperCase() + category.slice(1)} Analysis</h2>
        <div class="row mt-4">
            <div class="col-md-6">
                <h4>📊 Details</h4>
                <ul class="list-unstyled">
                    <li><strong>ID:</strong> <span class="drill-link" onclick="openSubDrill('id_analysis', '${itemId}')">${itemId}</span></li>
                    <li><strong>Status:</strong> <span class="drill-link" onclick="openSubDrill('status_analysis', 'active')">Active</span></li>
                    <li><strong>Type:</strong> <span class="drill-link" onclick="openSubDrill('type_analysis', 'standard')">Standard</span></li>
                </ul>
            </div>
            <div class="col-md-6">
                <h4>🎯 Metrics</h4>
                <ul class="list-unstyled">
                    <li><strong>Performance:</strong> <span class="drill-link" onclick="openSubDrill('performance', 'excellent')">Excellent</span></li>
                    <li><strong>Score:</strong> <span class="drill-link" onclick="openSubDrill('score', '94.5')">94.5%</span></li>
                    <li><strong>Trend:</strong> <span class="drill-link" onclick="openSubDrill('trend', 'positive')">Positive</span></li>
                </ul>
            </div>
        </div>
    `;
}

function getSubDrillContent(subCategory, value) {
    const categoryTitle = subCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `
        <h2><i class="fas fa-search me-3"></i>${categoryTitle}</h2>
        <div class="row mt-4">
            <div class="col-md-6">
                <h4>📊 Analysis</h4>
                <ul class="list-unstyled">
                    <li><strong>Value:</strong> ${value}</li>
                    <li><strong>Context:</strong> Above Average</li>
                    <li><strong>Confidence:</strong> 92.3%</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h4>🎯 Insights</h4>
                <ul class="list-unstyled">
                    <li><strong>Performance:</strong> Strong</li>
                    <li><strong>Risk:</strong> Low</li>
                    <li><strong>Recommendation:</strong> Monitor</li>
                </ul>
            </div>
        </div>
        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle me-2"></i>
            Analysis powered by Terrafusion AI
        </div>
    `;
}
        