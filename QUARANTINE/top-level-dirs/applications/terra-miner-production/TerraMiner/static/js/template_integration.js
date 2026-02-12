/**
 * Template Integration Utilities
 * 
 * This script provides helper functions to integrate the new UI components
 * across the application and ensure consistent user experiences during the
 * transition to the improved UI.
 */

// Feature detection for advanced UI components
const AdvancedUIFeatures = {
    // Check if unified error handling is available
    hasErrorHandling: typeof ErrorHandler !== 'undefined',
    
    // Check if UI utilities are available
    hasUIUtilities: typeof createChart !== 'undefined',
    
    // Check if we're using the new templates
    isUsingUnifiedTemplates: document.querySelector('html[data-template="unified"]') !== null
};

/**
 * Initialize loading states based on application stage
 * @param {string} containerId - The container to initialize loading state for
 * @param {boolean} isLoading - Whether the container should start in loading state
 * @param {string} loadingText - Optional text to display during loading
 */
function initLoadingState(containerId, isLoading = true, loadingText = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create loading overlay if it doesn't exist
    let loadingOverlay = container.querySelector('.loading-overlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">${loadingText}</p>
            </div>
        `;
        container.style.position = 'relative';
        container.appendChild(loadingOverlay);
    }
    
    // Set initial state
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    
    // Add data handling methods to the container
    container.showLoading = function(customText) {
        const textElement = loadingOverlay.querySelector('p');
        if (textElement && customText) {
            textElement.textContent = customText;
        }
        loadingOverlay.style.display = 'flex';
    };
    
    container.hideLoading = function() {
        loadingOverlay.style.display = 'none';
    };
    
    return {
        show: container.showLoading,
        hide: container.hideLoading
    };
}

/**
 * Create an empty state placeholder
 * @param {string} containerId - Container to add empty state to
 * @param {Object} options - Configuration options
 */
function createEmptyState(containerId, options = {}) {
    const defaults = {
        title: 'No Data Available',
        message: 'There is no data to display at this time.',
        icon: 'inbox',
        actionText: null,
        actionUrl: null,
        actionFunction: null
    };
    
    const config = { ...defaults, ...options };
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state text-center py-5';
    
    emptyState.innerHTML = `
        <div class="empty-state-icon mb-3">
            <i class="bi bi-${config.icon} text-muted" style="font-size: 3rem; opacity: 0.5;"></i>
        </div>
        <h5 class="empty-state-title mb-2">${config.title}</h5>
        <p class="empty-state-message text-muted mb-4">${config.message}</p>
    `;
    
    if (config.actionText) {
        const actionButton = document.createElement(config.actionUrl ? 'a' : 'button');
        actionButton.className = 'btn btn-outline-primary';
        actionButton.textContent = config.actionText;
        
        if (config.actionUrl) {
            actionButton.href = config.actionUrl;
        } else if (config.actionFunction) {
            actionButton.type = 'button';
            actionButton.addEventListener('click', config.actionFunction);
        }
        
        emptyState.appendChild(actionButton);
    }
    
    // Clear existing content and append empty state
    container.innerHTML = '';
    container.appendChild(emptyState);
    
    return emptyState;
}

/**
 * Create an error state
 * @param {string} containerId - Container to add error state to
 * @param {Object} options - Configuration options
 */
function createErrorState(containerId, options = {}) {
    const defaults = {
        title: 'Error',
        message: 'An unexpected error occurred.',
        icon: 'exclamation-triangle',
        actionText: 'Try Again',
        actionFunction: null,
        errorDetails: null
    };
    
    const config = { ...defaults, ...options };
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const errorState = document.createElement('div');
    errorState.className = 'error-container text-center py-4';
    
    let errorContent = `
        <div class="error-icon mb-3">
            <i class="bi bi-${config.icon} text-danger" style="font-size: 3rem;"></i>
        </div>
        <h4 class="error-title mb-2">${config.title}</h4>
        <p class="error-message text-muted mb-3">${config.message}</p>
    `;
    
    if (config.errorDetails) {
        const detailsId = `${containerId}-details`;
        errorContent += `
            <div class="error-details mb-4">
                <div class="d-grid gap-2 col-md-6 mx-auto">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" 
                           data-bs-target="#${detailsId}" aria-expanded="false">
                        Show Technical Details
                    </button>
                </div>
                <div class="collapse mt-2" id="${detailsId}">
                    <div class="card card-body text-start bg-dark">
                        <pre class="mb-0 text-danger"><code>${config.errorDetails}</code></pre>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (config.actionText && config.actionFunction) {
        errorContent += `
            <button type="button" class="btn btn-primary retry-button">${config.actionText}</button>
        `;
    }
    
    errorState.innerHTML = errorContent;
    
    // Add event listener to retry button
    const retryButton = errorState.querySelector('.retry-button');
    if (retryButton && config.actionFunction) {
        retryButton.addEventListener('click', config.actionFunction);
    }
    
    // Clear existing content and append error state
    container.innerHTML = '';
    container.appendChild(errorState);
    
    return errorState;
}

/**
 * Create a default tabbed interface
 * @param {string} containerId - Container to add tabs to
 * @param {Array} tabs - Array of tab objects with name, id, and content
 */
function createTabInterface(containerId, tabs) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create tab navigation
    const tabNav = document.createElement('ul');
    tabNav.className = 'nav nav-tabs mb-3';
    tabNav.setAttribute('role', 'tablist');
    
    // Create tab content container
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Add tabs
    tabs.forEach((tab /* , index */) => {
        // Create tab nav item
        const tabNavItem = document.createElement('li');
        tabNavItem.className = 'nav-item';
        tabNavItem.setAttribute('role', 'presentation');
        
        const tabNavLink = document.createElement('button');
        tabNavLink.className = `nav-link ${index === 0 ? 'active' : ''}`;
        tabNavLink.id = `${tab.id}-tab`;
        tabNavLink.setAttribute('data-bs-toggle', 'tab');
        tabNavLink.setAttribute('data-bs-target', `#${tab.id}`);
        tabNavLink.setAttribute('type', 'button');
        tabNavLink.setAttribute('role', 'tab');
        tabNavLink.setAttribute('aria-controls', tab.id);
        tabNavLink.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tabNavLink.textContent = tab.name;
        
        tabNavItem.appendChild(tabNavLink);
        tabNav.appendChild(tabNavItem);
        
        // Create tab content pane
        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        tabPane.id = tab.id;
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `${tab.id}-tab`);
        
        if (typeof tab.content === 'string') {
            tabPane.innerHTML = tab.content;
        } else if (tab.content instanceof HTMLElement) {
            tabPane.appendChild(tab.content);
        }
        
        tabContent.appendChild(tabPane);
    });
    
    // Clear container and add tab components
    container.innerHTML = '';
    container.appendChild(tabNav);
    container.appendChild(tabContent);
    
    return {
        nav: tabNav,
        content: tabContent
    };
}

/**
 * Enhance an existing table with sorting, filtering, and pagination
 * @param {string} tableId - Table ID to enhance
 * @param {Object} options - Configuration options
 */
function enhanceTable(tableId, options = {}) {
    const defaults = {
        perPage: 10,
        searchable: true,
        sortable: true,
        paginated: true,
        filterable: false,
        filterColumns: []
    };
    
    const config = { ...defaults, ...options };
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tableContainer = table.parentElement;
    
    // Add a wrapper if needed
    let wrapper = tableContainer.classList.contains('table-wrapper') 
        ? tableContainer 
        : document.createElement('div');
        
    if (!tableContainer.classList.contains('table-wrapper')) {
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }
    
    // Add search functionality
    if (config.searchable) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'table-search-container mb-3';
        
        searchContainer.innerHTML = `
            <div class="input-group">
                <span class="input-group-text">
                    <i class="bi bi-search"></i>
                </span>
                <input type="text" class="form-control table-search-input" placeholder="Search...">
            </div>
        `;
        
        wrapper.insertBefore(searchContainer, table);
        
        // Add search functionality
        const searchInput = searchContainer.querySelector('.table-search-input');
        searchInput.addEventListener('keyup', function() {
            const searchValue = this.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchValue) ? '' : 'none';
            });
            
            // Update pagination if enabled
            if (config.paginated) {
                updatePagination();
            }
        });
    }
    
    // Add column filters
    if (config.filterable && config.filterColumns.length > 0) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'table-filter-container mb-3';
        
        // Create filters for each specified column
        config.filterColumns.forEach(column => {
            // Get all unique values for this column
            const headerCells = table.querySelectorAll('thead th');
            let columnIndex = -1;
            
            // Find the column index
            headerCells.forEach((cell /* , index */) => {
                if (cell.textContent.trim() === column.name) {
                    columnIndex = index;
                }
            });
            
            if (columnIndex === -1) return;
            
            // Create filter dropdown
            const filterDropdown = document.createElement('div');
            filterDropdown.className = 'form-group me-2 d-inline-block';
            
            filterDropdown.innerHTML = `
                <label class="form-label small">${column.name}</label>
                <select class="form-select form-select-sm" data-filter-column="${columnIndex}">
                    <option value="all">All ${column.name}</option>
                </select>
            `;
            
            filterContainer.appendChild(filterDropdown);
        });
        
        wrapper.insertBefore(filterContainer, table);
        
        // Initialize filter functionality
        initializeTableFilters(table);
    }
    
    // Add pagination
    if (config.paginated) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'table-pagination-container mt-3';
        paginationContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="pagination-info">
                    Showing <span class="pagination-start">1</span> to 
                    <span class="pagination-end">${config.perPage}</span> of 
                    <span class="pagination-total">0</span> entries
                </div>
                <nav aria-label="Table pagination">
                    <ul class="pagination pagination-sm mb-0"></ul>
                </nav>
            </div>
        `;
        
        wrapper.appendChild(paginationContainer);
        
        // Initialize pagination
        initializeTablePagination(table, config.perPage);
    }
    
    // Add sorting functionality
    if (config.sortable) {
        const headerCells = table.querySelectorAll('thead th');
        
        headerCells.forEach((headerCell /* , index */) => {
            // Skip columns marked as non-sortable
            if (headerCell.hasAttribute('data-no-sort')) return;
            
            headerCell.classList.add('sortable');
            headerCell.style.cursor = 'pointer';
            headerCell.innerHTML = `
                ${headerCell.textContent}
                <span class="sort-icon ms-1">
                    <i class="bi bi-chevron-expand"></i>
                </span>
            `;
            
            headerCell.addEventListener('click', () => {
                // Clear other sort icons
                headerCells.forEach(otherHeader => {
                    if (otherHeader !== headerCell) {
                        const icon = otherHeader.querySelector('.sort-icon');
                        if (icon) icon.innerHTML = '<i class="bi bi-chevron-expand"></i>';
                        otherHeader.setAttribute('data-sort', '');
                    }
                });
                
                // Determine sort direction
                const currentSort = headerCell.getAttribute('data-sort') || '';
                let newSort = 'asc';
                
                if (currentSort === 'asc') {
                    newSort = 'desc';
                    headerCell.querySelector('.sort-icon').innerHTML = '<i class="bi bi-chevron-down"></i>';
                } else {
                    headerCell.querySelector('.sort-icon').innerHTML = '<i class="bi bi-chevron-up"></i>';
                }
                
                headerCell.setAttribute('data-sort', newSort);
                
                // Sort the table
                sortTable(table, index, newSort);
                
                // Update pagination if enabled
                if (config.paginated) {
                    updatePagination();
                }
            });
        });
    }
    
    // Helper functions
    function sortTable(table, columnIndex, direction) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const multiplier = direction === 'asc' ? 1 : -1;
        
        rows.sort((rowA, rowB) => {
            const cellA = rowA.querySelectorAll('td')[columnIndex].textContent.trim();
            const cellB = rowB.querySelectorAll('td')[columnIndex].textContent.trim();
            
            // Try to convert to numbers for numeric comparison
            const numA = parseFloat(cellA);
            const numB = parseFloat(cellB);
            
            if (!isNaN(numA) && !isNaN(numB)) {
                return (numA - numB) * multiplier;
            }
            
            return cellA.localeCompare(cellB) * multiplier;
        });
        
        // Reorder rows in the table
        const tbody = table.querySelector('tbody');
        rows.forEach(row => tbody.appendChild(row));
    }
    
    function initializeTablePagination(table, perPage) {
        const rows = table.querySelectorAll('tbody tr');
        const totalRows = rows.length;
        const pageCount = Math.ceil(totalRows / perPage);
        
        const paginationElement = wrapper.querySelector('.pagination');
        const startElement = wrapper.querySelector('.pagination-start');
        const endElement = wrapper.querySelector('.pagination-end');
        const totalElement = wrapper.querySelector('.pagination-total');
        
        if (totalElement) totalElement.textContent = totalRows;
        
        // Create pagination links
        if (paginationElement) {
            paginationElement.innerHTML = '';
            
            // Previous button
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item disabled';
            prevLi.innerHTML = '<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>';
            paginationElement.appendChild(prevLi);
            
            // Page numbers
            for (let i = 1; i <= pageCount; i++) {
                const pageLi = document.createElement('li');
                pageLi.className = `page-item ${i === 1 ? 'active' : ''}`;
                pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                
                pageLi.addEventListener('click', function(e) {
                    e.preventDefault();
                    goToPage(i);
                });
                
                paginationElement.appendChild(pageLi);
            }
            
            // Next button
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            nextLi.innerHTML = '<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>';
            paginationElement.appendChild(nextLi);
            
            // Add event listeners for prev/next
            prevLi.addEventListener('click', function(e) {
                e.preventDefault();
                const activePage = parseInt(paginationElement.querySelector('.active').textContent);
                if (activePage > 1) {
                    goToPage(activePage - 1);
                }
            });
            
            nextLi.addEventListener('click', function(e) {
                e.preventDefault();
                const activePage = parseInt(paginationElement.querySelector('.active').textContent);
                if (activePage < pageCount) {
                    goToPage(activePage + 1);
                }
            });
        }
        
        // Initial pagination
        goToPage(1);
        
        // Pagination function
        function goToPage(page) {
            const start = (page - 1) * perPage;
            const end = start + perPage;
            
            // Update rows visibility
            rows.forEach((row /* , index */) => {
                row.style.display = (index >= start && index < end) ? '' : 'none';
            });
            
            // Update pagination UI
            if (paginationElement) {
                const paginationItems = paginationElement.querySelectorAll('.page-item');
                paginationItems.forEach((item /* , index */) => {
                    // Skip first and last items (prev/next buttons)
                    if (index === 0) {
                        item.classList.toggle('disabled', page === 1);
                    } else if (index === paginationItems.length - 1) {
                        item.classList.toggle('disabled', page === pageCount);
                    } else if (index === page) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // Update info text
            if (startElement) startElement.textContent = Math.min(start + 1, totalRows);
            if (endElement) endElement.textContent = Math.min(end, totalRows);
        }
        
        // Expose updatePagination globally
        window.updatePagination = function() {
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
            const newTotalRows = visibleRows.length;
            const newPageCount = Math.ceil(newTotalRows / perPage);
            
            if (totalElement) totalElement.textContent = newTotalRows;
            
            // Rebuild pagination
            if (paginationElement) {
                // Save current page number
                const currentActivePage = parseInt(paginationElement.querySelector('.active')?.textContent) || 1;
                
                // Clear pagination
                paginationElement.innerHTML = '';
                
                // Previous button
                const prevLi = document.createElement('li');
                prevLi.className = `page-item ${currentActivePage === 1 ? 'disabled' : ''}`;
                prevLi.innerHTML = '<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>';
                paginationElement.appendChild(prevLi);
                
                // Page numbers
                for (let i = 1; i <= newPageCount; i++) {
                    const pageLi = document.createElement('li');
                    pageLi.className = `page-item ${i === currentActivePage ? 'active' : ''}`;
                    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                    
                    pageLi.addEventListener('click', function(e) {
                        e.preventDefault();
                        goToPage(i);
                    });
                    
                    paginationElement.appendChild(pageLi);
                }
                
                // Next button
                const nextLi = document.createElement('li');
                nextLi.className = `page-item ${currentActivePage === newPageCount ? 'disabled' : ''}`;
                nextLi.innerHTML = '<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>';
                paginationElement.appendChild(nextLi);
                
                // Add event listeners for prev/next
                prevLi.addEventListener('click', function(e) {
                    e.preventDefault();
                    const activePage = parseInt(paginationElement.querySelector('.active').textContent);
                    if (activePage > 1) {
                        goToPage(activePage - 1);
                    }
                });
                
                nextLi.addEventListener('click', function(e) {
                    e.preventDefault();
                    const activePage = parseInt(paginationElement.querySelector('.active').textContent);
                    if (activePage < newPageCount) {
                        goToPage(activePage + 1);
                    }
                });
            }
            
            // Go to first page
            goToPage(1);
        };
    }
    
    function initializeTableFilters(table) {
        const filterSelects = wrapper.querySelectorAll('select[data-filter-column]');
        
        filterSelects.forEach(select => {
            const columnIndex = parseInt(select.getAttribute('data-filter-column'));
            const rows = table.querySelectorAll('tbody tr');
            
            // Populate filter options
            const values = new Set();
            rows.forEach(row => {
                const cell = row.querySelectorAll('td')[columnIndex];
                if (cell) {
                    values.add(cell.textContent.trim());
                }
            });
            
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            
            // Add filter event listener
            select.addEventListener('change', function() {
                const value = this.value;
                
                rows.forEach(row => {
                    const cell = row.querySelectorAll('td')[columnIndex];
                    
                    if (value === 'all' || (cell && cell.textContent.trim() === value)) {
                        // Show row, but respect other filters
                        row.setAttribute('data-filter-match-' + columnIndex, 'true');
                    } else {
                        // Hide row
                        row.setAttribute('data-filter-match-' + columnIndex, 'false');
                    }
                    
                    // Check if row passes all filters
                    const matches = Array.from(filterSelects).every(otherSelect => {
                        const otherColumnIndex = parseInt(otherSelect.getAttribute('data-filter-column'));
                        const match = row.getAttribute('data-filter-match-' + otherColumnIndex);
                        return match === 'true' || otherSelect.value === 'all';
                    });
                    
                    row.style.display = matches ? '' : 'none';
                });
                
                // Update pagination if enabled
                if (config.paginated) {
                    updatePagination();
                }
            });
        });
    }
    
    return {
        wrapper,
        updatePagination: window.updatePagination
    };
}

// Export utilities
window.TemplateUtils = {
    AdvancedUIFeatures,
    initLoadingState,
    createEmptyState,
    createErrorState,
    createTabInterface,
    enhanceTable
};