// Benton County GIS File Manager
document.addEventListener('DOMContentLoaded', () => {
    // File upload form handling
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadBtn = document.getElementById('upload-btn');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressContainer = document.getElementById('upload-progress');
    
    // File filter and search
    const searchInput = document.getElementById('file-search');
    const fileTypeFilter = document.getElementById('file-type-filter');
    const fileCards = document.querySelectorAll('.file-card');
    
    // Initialize file upload form
    if (uploadForm) {
        // Update file name display when a file is selected
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileNameDisplay.textContent = fileInput.files[0].name;
                uploadBtn.disabled = false;
            } else {
                fileNameDisplay.textContent = 'No file selected';
                uploadBtn.disabled = true;
            }
        });
        
        // Handle file upload
        uploadForm.addEventListener('submit', (e) => {
            // Show progress bar
            progressContainer.classList.remove('d-none');
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            
            // Simulate upload progress
            // In a real implementation, this would use XHR or Fetch API to track actual progress
            const simulateProgress = () => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 5;
                    progressBar.style.width = `${progress}%`;
                    progressBar.textContent = `${progress}%`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                }, 200);
            };
            
            simulateProgress();
            
            // Let the form submit normally
        });
    }
    
    // Initialize search and filter functionality
    if (searchInput) {
        searchInput.addEventListener('input', filterFiles);
    }
    
    if (fileTypeFilter) {
        fileTypeFilter.addEventListener('change', filterFiles);
    }
    
    // File filtering function
    function filterFiles() {
        const searchTerm = searchInput.value.toLowerCase();
        const fileType = fileTypeFilter.value;
        
        fileCards.forEach(card => {
            const fileName = card.querySelector('.file-name').textContent.toLowerCase();
            const fileTypeText = card.querySelector('.file-type').textContent.toLowerCase();
            
            // Check if file matches search term
            const matchesSearch = fileName.includes(searchTerm);
            
            // Check if file matches type filter
            let matchesType = fileType === 'all' || fileTypeText.includes(fileType);
            
            // Special case for geodatabases (gdb, sdf, sqlite, db)
            if (fileType === 'gdb' && (
                fileName.endsWith('.gdb') || 
                fileName.endsWith('.mdb') || 
                fileName.endsWith('.sdf') || 
                fileName.endsWith('.sqlite') || 
                fileName.endsWith('.db')
            )) {
                matchesType = true;
            }
            
            // Show or hide card based on filters
            if (matchesSearch && matchesType) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update count of displayed files
        updateFileCount();
    }
    
    // Update file count display
    function updateFileCount() {
        const visibleFiles = document.querySelectorAll('.file-card[style="display: block;"]').length;
        const totalFiles = fileCards.length;
        
        document.getElementById('file-count').textContent = `${visibleFiles} of ${totalFiles} files`;
    }
    
    // Initialize file count
    if (document.getElementById('file-count')) {
        updateFileCount();
    }
    
    // Confirm file deletion
    const deleteButtons = document.querySelectorAll('.delete-file-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    // File metadata viewer
    const metadataButtons = document.querySelectorAll('.view-metadata-btn');
    metadataButtons.forEach(button => {
        button.addEventListener('click', () => {
            const metadata = JSON.parse(button.getAttribute('data-metadata'));
            
            // Populate modal with metadata
            const metadataContainer = document.getElementById('file-metadata-content');
            metadataContainer.innerHTML = formatMetadata(metadata);
            
            // Show modal
            const metadataModal = new bootstrap.Modal(document.getElementById('metadata-modal'));
            metadataModal.show();
        });
    });
    
    // Format metadata as HTML
    function formatMetadata(metadata) {
        if (!metadata) {
            return '<p class="text-muted">No metadata available for this file.</p>';
        }
        
        let html = '<table class="table table-sm">';
        
        // Iterate through metadata properties
        for (const key in metadata) {
            if (metadata.hasOwnProperty(key)) {
                let value = metadata[key];
                
                // Skip file_path for security reasons
                if (key === 'file_path') {
                    continue;
                }
                
                // Special handling for certain types of metadata
                if (key === 'layer_details' && Array.isArray(value)) {
                    // Create a more user-friendly display for layer details
                    value = formatLayerDetails(value);
                } else if (key === 'tables' && Array.isArray(value)) {
                    // Format table names
                    value = `<ul class="mb-0">
                        ${value.map(table => `<li>${table}</li>`).join('')}
                    </ul>`;
                } else if (key === 'table_schemas' && typeof value === 'object') {
                    // Format table schemas
                    value = formatTableSchemas(value);
                } else if (typeof value === 'object' && value !== null) {
                    // Default formatting for other objects
                    value = `<pre class="mb-0"><code>${JSON.stringify(value, null, 2)}</code></pre>`;
                }
                
                html += `
                <tr>
                    <th>${formatKeyName(key)}</th>
                    <td>${value}</td>
                </tr>`;
            }
        }
        
        html += '</table>';
        return html;
    }
    
    // Format layer details in a more readable way
    function formatLayerDetails(layers) {
        if (!layers || layers.length === 0) {
            return '<p class="text-muted">No layer details available.</p>';
        }
        
        let html = '<div class="accordion" id="layerAccordion">';
        
        layers.forEach((layer /* , index */) => {
            const layerId = `layer-${index}`;
            html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${layerId}">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse-${layerId}" 
                            aria-expanded="false" aria-controls="collapse-${layerId}">
                        ${layer.name || `Layer ${index + 1}`}
                        ${layer.feature_count ? ` (${layer.feature_count} features)` : ''}
                    </button>
                </h2>
                <div id="collapse-${layerId}" class="accordion-collapse collapse" 
                     aria-labelledby="heading-${layerId}" data-bs-parent="#layerAccordion">
                    <div class="accordion-body">
                        <table class="table table-sm">`;
            
            // Layer properties
            for (const key in layer) {
                if (layer.hasOwnProperty(key) && key !== 'name') {
                    let value = layer[key];
                    
                    if (typeof value === 'object' && value !== null) {
                        value = `<pre class="mb-0"><code>${JSON.stringify(value, null, 2)}</code></pre>`;
                    }
                    
                    html += `
                    <tr>
                        <th>${formatKeyName(key)}</th>
                        <td>${value}</td>
                    </tr>`;
                }
            }
            
            html += `
                        </table>
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div>';
        return html;
    }
    
    // Format table schemas in a readable way
    function formatTableSchemas(schemas) {
        if (!schemas || Object.keys(schemas).length === 0) {
            return '<p class="text-muted">No schema information available.</p>';
        }
        
        let html = '<div class="accordion" id="schemaAccordion">';
        
        Object.keys(schemas).forEach((tableName /* , index */) => {
            const tableId = `table-${index}`;
            const columns = schemas[tableName];
            
            html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${tableId}">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse-${tableId}" 
                            aria-expanded="false" aria-controls="collapse-${tableId}">
                        ${tableName} (${columns.length} columns)
                    </button>
                </h2>
                <div id="collapse-${tableId}" class="accordion-collapse collapse" 
                     aria-labelledby="heading-${tableId}" data-bs-parent="#schemaAccordion">
                    <div class="accordion-body">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Column</th>
                                    <th>Type</th>
                                    <th>Constraints</th>
                                </tr>
                            </thead>
                            <tbody>`;
            
            columns.forEach(column => {
                let constraints = [];
                if (column.pk) constraints.push('Primary Key');
                if (column.notnull) constraints.push('Not Null');
                
                html += `
                <tr>
                    <td>${column.name}</td>
                    <td>${column.type}</td>
                    <td>${constraints.join(', ') || '-'}</td>
                </tr>`;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div>';
        return html;
    }
    
    // Format the key name to be more readable
    function formatKeyName(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
});
