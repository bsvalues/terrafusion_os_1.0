// Power Query JavaScript

// Global variables
let dataSources = [];
let savedQueries = [];
let currentQuery = null;
let currentResults = null;
let currentTransformations = [];
let currentResultId = null;
let currentPage = 1;
let pageSize = 10;
let totalRows = 0;

// DOM elements
const dataSourceList = document.getElementById('data-source-list');
const savedQueryList = document.getElementById('saved-query-list');
const transformationList = document.getElementById('transformation-list');
const resultsTable = document.getElementById('results-table');
const resultsHeader = document.getElementById('results-header');
const resultsBody = document.getElementById('results-body');
const queryInfoAlert = document.getElementById('query-info');

// Initialize the Power Query UI
document.addEventListener('DOMContentLoaded', function() {
    // Load data sources
    loadDataSources();
    
    // Load saved queries
    loadSavedQueries();
    
    // Add event listeners
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Data source modal
    document.getElementById('btn-add-data-source').addEventListener('click', addDataSource);
    
    // Query builder
    document.getElementById('btn-new-query').addEventListener('click', newQuery);
    document.getElementById('btn-save-query').addEventListener('click', openSaveQueryModal);
    document.getElementById('btn-run-query').addEventListener('click', runQuery);
    document.getElementById('btn-show-tables').addEventListener('click', showTables);
    
    // Save query modal
    document.getElementById('btn-save-query-confirm').addEventListener('click', saveQuery);
    
    // Transformations
    document.getElementById('btn-add-transformation').addEventListener('click', openTransformationModal);
    
    // Data source dropdown
    document.getElementById('data-source-select').addEventListener('change', handleDataSourceChange);
    
    // Source type dropdown in add data source modal
    document.getElementById('source-type').addEventListener('change', handleSourceTypeChange);
    document.getElementById('btn-save-transformation').addEventListener('click', addTransformation);
    
    // Export
    document.getElementById('btn-export-csv').addEventListener('click', exportToCsv);
    document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
    
    // Pagination
    document.getElementById('btn-prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('btn-next-page').addEventListener('click', () => changePage(1));
}

// Load data sources from the server
function loadDataSources() {
    // Show loading state
    dataSourceList.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</div>';
    
    // Make AJAX request to the REST API
    fetch('/api/data/sources', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.sources) {
            dataSources = data.sources || [];
            renderDataSources();
            populateDataSourceSelect();
        } else {
            showError('Failed to load data sources');
            dataSourceList.innerHTML = '<div class="alert alert-danger">Failed to load data sources</div>';
        }
    })
    .catch(error => {
        console.error('Error loading data sources:', error);
        dataSourceList.innerHTML = '<div class="alert alert-danger">Error loading data sources</div>';
    });
}

// Render data sources in the sidebar
function renderDataSources() {
    if (dataSources.length === 0) {
        dataSourceList.innerHTML = `
            <div class="text-center py-3 text-muted" id="no-sources-message">
                <i class="fas fa-database fa-2x mb-2"></i>
                <p>No data sources added yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    dataSources.forEach(source => {
        html += `
            <button type="button" class="list-group-item list-group-item-action" 
                    data-name="${source.name}" data-type="${source.type}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${source.name}</h6>
                    <small class="text-muted">${source.type.replace('DataSource', '')}</small>
                </div>
                <small>${source.description || 'No description'}</small>
            </button>
        `;
    });
    
    dataSourceList.innerHTML = html;
    
    // Add click event listeners
    dataSourceList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => selectDataSource(item.dataset.name));
    });
}

// Populate data source dropdown in query builder
function populateDataSourceSelect() {
    const select = document.getElementById('data-source-select');
    select.innerHTML = '<option value="">-- Select Data Source --</option>';
    
    dataSources.forEach(source => {
        const option = document.createElement('option');
        option.value = source.name;
        option.textContent = source.name;
        option.dataset.type = source.type.toLowerCase().replace('datasource', '');
        select.appendChild(option);
    });
}

// Load saved queries from the server
function loadSavedQueries() {
    // Show loading state
    savedQueryList.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</div>';
    
    // Make AJAX request to MCP API
    fetch('/mcp/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: 'power_query',
            task_data: {
                task_type: 'list_queries'
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result && data.result.success) {
            savedQueries = data.result.queries || [];
            renderSavedQueries();
        } else {
            showError('Failed to load saved queries');
            savedQueryList.innerHTML = '<div class="alert alert-danger">Failed to load saved queries</div>';
        }
    })
    .catch(error => {
        console.error('Error loading saved queries:', error);
        savedQueryList.innerHTML = '<div class="alert alert-danger">Error loading saved queries</div>';
    });
}

// Render saved queries in the sidebar
function renderSavedQueries() {
    if (savedQueries.length === 0) {
        savedQueryList.innerHTML = `
            <div class="text-center py-3 text-muted" id="no-queries-message">
                <i class="fas fa-search fa-2x mb-2"></i>
                <p>No saved queries yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    savedQueries.forEach(query => {
        html += `
            <button type="button" class="list-group-item list-group-item-action" data-name="${query.name}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${query.name}</h6>
                    <small class="text-muted">${new Date(query.created).toLocaleDateString()}</small>
                </div>
                <small>${query.description || 'No description'}</small>
            </button>
        `;
    });
    
    savedQueryList.innerHTML = html;
    
    // Add click event listeners
    savedQueryList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => loadSavedQuery(item.dataset.name));
    });
}

// Add a new data source
function addDataSource() {
    const sourceType = document.getElementById('source-type').value;
    const sourceName = document.getElementById('source-name').value;
    const description = document.getElementById('source-description').value;
    
    if (!sourceType || !sourceName) {
        showError('Please select a source type and enter a source name');
        return;
    }
    
    // Build task data based on source type
    let taskData = {
        task_type: 'register_data_source',
        source_type: sourceType,
        source_name: sourceName,
        description: description
    };
    
    // Add source-specific fields
    if (sourceType === 'sql_server') {
        const server = document.getElementById('sql-server').value;
        const database = document.getElementById('sql-database').value;
        const windowsAuth = document.getElementById('sql-windows-auth').checked;
        const username = document.getElementById('sql-username').value;
        const password = document.getElementById('sql-password').value;
        const port = document.getElementById('sql-port').value;
        
        if (!server || !database) {
            showError('Please enter server and database names');
            return;
        }
        
        if (!windowsAuth && (!username || !password)) {
            showError('Please enter username and password or use Windows Authentication');
            return;
        }
        
        Object.assign(taskData, {
            server: server,
            database: database,
            windows_auth: windowsAuth,
            username: windowsAuth ? null : username,
            password: windowsAuth ? null : password,
            port: port ? parseInt(port) : 1433
        });
    } else if (sourceType === 'postgresql') {
        const host = document.getElementById('pg-host').value;
        const database = document.getElementById('pg-database').value;
        const username = document.getElementById('pg-username').value;
        const password = document.getElementById('pg-password').value;
        const port = document.getElementById('pg-port').value;
        
        if (!host || !database || !username || !password) {
            showError('Please fill all required PostgreSQL fields');
            return;
        }
        
        Object.assign(taskData, {
            host: host,
            database: database,
            username: username,
            password: password,
            port: port ? parseInt(port) : 5432
        });
    } else if (sourceType === 'csv') {
        const fileInput = document.getElementById('csv-file');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select a CSV file');
            return;
        }
        
        // Handle file upload
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('source_name', sourceName);
        formData.append('description', description);
        
        // Upload file first, then register data source
        fetch('/upload-power-query-file', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Now register the data source with the uploaded file path
                Object.assign(taskData, {
                    file_path: data.file_path
                });
                registerDataSource(taskData);
            } else {
                showError('Failed to upload CSV file: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error uploading CSV file:', error);
            showError('Error uploading CSV file');
        });
        
        // Return early since we're handling this in the callback
        return;
    } else if (sourceType === 'excel') {
        const fileInput = document.getElementById('excel-file');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select an Excel file');
            return;
        }
        
        // Handle file upload
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('source_name', sourceName);
        formData.append('description', description);
        
        // Upload file first, then register data source
        fetch('/upload-power-query-file', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Now register the data source with the uploaded file path
                Object.assign(taskData, {
                    file_path: data.file_path
                });
                registerDataSource(taskData);
            } else {
                showError('Failed to upload Excel file: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error uploading Excel file:', error);
            showError('Error uploading Excel file');
        });
        
        // Return early since we're handling this in the callback
        return;
    }
    
    // Register the data source
    registerDataSource(taskData);
}

// Register a data source with the Power Query agent
function registerDataSource(taskData) {
    // Make AJAX request to MCP API
    fetch('/mcp/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: 'power_query',
            task_data: taskData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result && data.result.success) {
            // Hide the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDataSourceModal'));
            modal.hide();
            
            // Show success message
            showSuccess('Data source added successfully');
            
            // Reload data sources
            loadDataSources();
        } else {
            showError('Failed to add data source: ' + (data.result?.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error adding data source:', error);
        showError('Error adding data source');
    });
}

// Create a new query
function newQuery() {
    // Reset the query builder
    document.getElementById('query-name').value = '';
    document.getElementById('data-source-select').value = '';
    document.getElementById('sql-query').value = '';
    document.getElementById('transformation-list').innerHTML = `
        <div class="text-center py-3 text-muted" id="no-transformations-message">
            <p>No transformations added yet</p>
        </div>
    `;
    
    // Reset global state
    currentQuery = null;
    currentTransformations = [];
    
    // Hide results
    document.getElementById('results-container').style.display = 'none';
    
    // Hide query-specific UI elements
    document.getElementById('sql-query-container').style.display = 'none';
    document.getElementById('transformations-container').style.display = 'none';
}

// Open the save query modal
function openSaveQueryModal() {
    const queryName = document.getElementById('query-name').value;
    
    // Populate the modal with current query name
    document.getElementById('save-query-name').value = queryName;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('saveQueryModal'));
    modal.show();
}

// Save the current query
function saveQuery() {
    const queryName = document.getElementById('save-query-name').value;
    const description = document.getElementById('save-query-description').value;
    
    if (!queryName) {
        showError('Please enter a query name');
        return;
    }
    
    // Build the query definition
    const dataSourceName = document.getElementById('data-source-select').value;
    const dataSourceType = document.getElementById('data-source-select').selectedOptions[0]?.dataset.type;
    
    if (!dataSourceName) {
        showError('Please select a data source');
        return;
    }
    
    // Build query definition based on data source type
    let queryDefinition = {
        data_source: dataSourceName,
        transformations: currentTransformations
    };
    
    // Add source-specific fields
    if (dataSourceType === 'sql_server' || dataSourceType === 'postgresql') {
        const sqlQuery = document.getElementById('sql-query').value;
        
        if (!sqlQuery) {
            showError('Please enter a SQL query');
            return;
        }
        
        queryDefinition.sql = sqlQuery;
    } else if (dataSourceType === 'excel') {
        // For Excel, we may need to select a sheet
        const dataSource = dataSources.find(source => source.name === dataSourceName);
        if (dataSource && dataSource.sheet_name) {
            queryDefinition.sheet_name = dataSource.sheet_name;
        }
    }
    
    // Make AJAX request to MCP API
    fetch('/mcp/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: 'power_query',
            task_data: {
                task_type: 'save_query',
                query_name: queryName,
                description: description,
                query: queryDefinition
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result && data.result.success) {
            // Hide the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('saveQueryModal'));
            modal.hide();
            
            // Show success message
            showSuccess('Query saved successfully');
            
            // Update the query name in the UI
            document.getElementById('query-name').value = queryName;
            
            // Reload saved queries
            loadSavedQueries();
        } else {
            showError('Failed to save query: ' + (data.result?.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error saving query:', error);
        showError('Error saving query');
    });
}

// Load a saved query
function loadSavedQuery(queryName) {
    // Find the query in the saved queries list
    const query = savedQueries.find(q => q.name === queryName);
    
    if (!query) {
        showError('Query not found');
        return;
    }
    
    // Set current query
    currentQuery = query;
    
    // Populate the query builder
    document.getElementById('query-name').value = query.name;
    
    const queryDef = query.definition;
    if (queryDef.data_source) {
        document.getElementById('data-source-select').value = queryDef.data_source;
        
        // Trigger change event to update UI based on data source type
        const event = new Event('change');
        document.getElementById('data-source-select').dispatchEvent(event);
        
        // Set SQL query if present
        if (queryDef.sql) {
            document.getElementById('sql-query').value = queryDef.sql;
        }
        
        // Set transformations
        currentTransformations = queryDef.transformations || [];
        renderTransformations();
    }
    
    // Hide results
    document.getElementById('results-container').style.display = 'none';
}

// Run the current query
function runQuery() {
    // Build the query definition
    const dataSourceName = document.getElementById('data-source-select').value;
    const dataSourceType = document.getElementById('data-source-select').selectedOptions[0]?.dataset.type;
    
    if (!dataSourceName) {
        showError('Please select a data source');
        return;
    }
    
    // Build query definition based on data source type
    let queryDefinition = {
        data_source: dataSourceName,
        transformations: currentTransformations
    };
    
    // Add source-specific fields
    if (dataSourceType === 'sql_server' || dataSourceType === 'postgresql') {
        const sqlQuery = document.getElementById('sql-query').value;
        
        if (!sqlQuery) {
            showError('Please enter a SQL query');
            return;
        }
        
        queryDefinition.sql = sqlQuery;
    } else if (dataSourceType === 'excel') {
        // For Excel, we may need to select a sheet
        const dataSource = dataSources.find(source => source.name === dataSourceName);
        if (dataSource && dataSource.sheet_name) {
            queryDefinition.sheet_name = dataSource.sheet_name;
        }
    }
    
    // Show loading state in results
    document.getElementById('results-container').style.display = 'block';
    queryInfoAlert.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Running query...';
    resultsHeader.innerHTML = '';
    resultsBody.innerHTML = '';
    
    // Make AJAX request to the REST API
    fetch('/api/data/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'sql',
            source_id: dataSourceName,
            query: queryDefinition.sql || 'SELECT * FROM users LIMIT 5' // Use SQL query or default
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.data && data.columns) {
            // Store results
            currentResults = data;
            currentResultId = Date.now(); // Generate a unique ID for this result set
            totalRows = data.data.length;
            
            // Show results
            queryInfoAlert.innerHTML = `Query executed successfully. ${data.data.length} rows returned.`;
            if (data.truncated) {
                queryInfoAlert.innerHTML += ' (Results truncated, showing first 1000 rows)';
            }
            
            // Render results
            renderResults(data);
        } else {
            showError('Failed to execute query: ' + (data.error || 'Unknown error'));
            queryInfoAlert.innerHTML = `<div class="alert alert-danger">Error: ${data.error || 'Unknown error'}</div>`;
            resultsHeader.innerHTML = '';
            resultsBody.innerHTML = '';
        }
    })
    .catch(error => {
        console.error('Error executing query:', error);
        showError('Error executing query');
        queryInfoAlert.innerHTML = '<div class="alert alert-danger">Error executing query</div>';
        resultsHeader.innerHTML = '';
        resultsBody.innerHTML = '';
    });
}

// Render query results in the table
function renderResults(result) {
    if (!result.data || !result.columns) {
        queryInfoAlert.innerHTML = 'No results returned';
        resultsHeader.innerHTML = '';
        resultsBody.innerHTML = '';
        return;
    }
    
    // Render table headers
    let headerHtml = '<tr>';
    result.columns.forEach(column => {
        headerHtml += `<th>${column}</th>`;
    });
    headerHtml += '</tr>';
    resultsHeader.innerHTML = headerHtml;
    
    // Calculate pagination
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, result.data.length);
    const pagedData = result.data.slice(start, end);
    
    // Render table rows
    let bodyHtml = '';
    pagedData.forEach(row => {
        bodyHtml += '<tr>';
        result.columns.forEach(column => {
            bodyHtml += `<td>${row[column] !== null && row[column] !== undefined ? row[column] : ''}</td>`;
        });
        bodyHtml += '</tr>';
    });
    
    if (bodyHtml === '') {
        bodyHtml = '<tr><td colspan="' + result.columns.length + '" class="text-center">No data</td></tr>';
    }
    
    resultsBody.innerHTML = bodyHtml;
    
    // Update pagination info
    document.getElementById('pagination-info').textContent = `Showing ${start + 1}-${end} of ${result.data.length} results`;
    
    // Update pagination buttons
    document.getElementById('btn-prev-page').disabled = currentPage === 1;
    document.getElementById('btn-next-page').disabled = end >= result.data.length;
}

// Change the current page
function changePage(delta) {
    currentPage += delta;
    
    if (currentPage < 1) {
        currentPage = 1;
    }
    
    if (currentResults) {
        renderResults({
            columns: currentResults.columns,
            data: currentResults.data
        });
    }
}

// Show available tables for the selected data source
function showTables() {
    const dataSourceName = document.getElementById('data-source-select').value;
    
    if (!dataSourceName) {
        showError('Please select a data source');
        return;
    }
    
    // Show loading state
    document.getElementById('tables-list').innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div> Loading tables...
        </div>
    `;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('tablesModal'));
    modal.show();
    
    // Make AJAX request to the REST API
    fetch(`/api/data/sources/${encodeURIComponent(dataSourceName)}/tables`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.tables) {
            const tables = data.tables || [];
            
            if (tables.length === 0) {
                document.getElementById('tables-list').innerHTML = `
                    <div class="text-center py-3 text-muted">
                        <p>No tables found in this database</p>
                    </div>
                `;
                return;
            }
            
            // Render tables list
            let html = '';
            tables.forEach(table => {
                html += `
                    <button type="button" class="list-group-item list-group-item-action table-item" data-table="${table}">
                        ${table}
                    </button>
                `;
            });
            
            document.getElementById('tables-list').innerHTML = html;
            
            // Add click event listeners for tables
            document.querySelectorAll('.table-item').forEach(item => {
                item.addEventListener('click', () => {
                    // Add table to SQL query
                    const sqlQuery = document.getElementById('sql-query');
                    sqlQuery.value = `SELECT * FROM ${item.dataset.table}`;
                    
                    // Hide the modal
                    bootstrap.Modal.getInstance(document.getElementById('tablesModal')).hide();
                });
            });
        } else {
            document.getElementById('tables-list').innerHTML = `
                <div class="alert alert-danger">
                    Failed to get tables: ${data.error || 'Unknown error'}
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error getting tables:', error);
        document.getElementById('tables-list').innerHTML = `
            <div class="alert alert-danger">
                Error getting tables
            </div>
        `;
    });
}

// Open the transformation modal
function openTransformationModal() {
    const transformationType = document.getElementById('transformation-type').value;
    
    if (!transformationType) {
        showError('Please select a transformation type');
        return;
    }
    
    // Set modal title
    document.getElementById('transformationModalLabel').textContent = 
        'Configure ' + transformationType.charAt(0).toUpperCase() + transformationType.slice(1) + ' Transformation';
    
    // Render transformation settings based on type
    const settingsContainer = document.getElementById('transformation-settings');
    
    if (transformationType === 'filter') {
        settingsContainer.innerHTML = renderFilterSettings();
    } else if (transformationType === 'sort') {
        settingsContainer.innerHTML = renderSortSettings();
    } else if (transformationType === 'groupby') {
        settingsContainer.innerHTML = renderGroupBySettings();
    } else if (transformationType === 'pivot') {
        settingsContainer.innerHTML = renderPivotSettings();
    } else {
        settingsContainer.innerHTML = '<div class="alert alert-danger">Unknown transformation type</div>';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('transformationModal'));
    modal.show();
}

// Render settings for filter transformation
function renderFilterSettings() {
    // Get columns from current results or data source
    const columns = getAvailableColumns();
    
    return `
        <div class="mb-3">
            <label for="filter-column" class="form-label">Column</label>
            <select class="form-select" id="filter-column">
                <option value="">-- Select Column --</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
        </div>
        
        <div class="mb-3">
            <label for="filter-operator" class="form-label">Operator</label>
            <select class="form-select" id="filter-operator">
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="greater_than_equals">Greater Than or Equal</option>
                <option value="less_than_equals">Less Than or Equal</option>
                <option value="contains">Contains</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
            </select>
        </div>
        
        <div class="mb-3">
            <label for="filter-value" class="form-label">Value</label>
            <input type="text" class="form-control" id="filter-value" placeholder="Enter value to filter by">
        </div>
    `;
}

// Render settings for sort transformation
function renderSortSettings() {
    // Get columns from current results or data source
    const columns = getAvailableColumns();
    
    return `
        <div class="mb-3">
            <label for="sort-columns" class="form-label">Columns</label>
            <select class="form-select" id="sort-columns" multiple size="5">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <small class="form-text text-muted">Hold Ctrl/Cmd to select multiple columns</small>
        </div>
        
        <div class="mb-3">
            <label for="sort-direction" class="form-label">Direction</label>
            <select class="form-select" id="sort-direction">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
        </div>
    `;
}

// Render settings for group by transformation
function renderGroupBySettings() {
    // Get columns from current results or data source
    const columns = getAvailableColumns();
    
    return `
        <div class="mb-3">
            <label for="groupby-columns" class="form-label">Group By Columns</label>
            <select class="form-select" id="groupby-columns" multiple size="5">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <small class="form-text text-muted">Hold Ctrl/Cmd to select multiple columns</small>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Aggregations</label>
            <div id="aggregation-container">
                <div class="row mb-2 aggregation-row">
                    <div class="col-md-5">
                        <select class="form-select agg-column">
                            <option value="">-- Select Column --</option>
                            ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-5">
                        <select class="form-select agg-function">
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="min">Minimum</option>
                            <option value="max">Maximum</option>
                            <option value="count">Count</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button type="button" class="btn btn-sm btn-outline-danger remove-agg">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <button type="button" class="btn btn-sm btn-outline-secondary mt-2" id="add-aggregation">
                <i class="fas fa-plus"></i> Add Aggregation
            </button>
        </div>
    `;
}

// Render settings for pivot transformation
function renderPivotSettings() {
    // Get columns from current results or data source
    const columns = getAvailableColumns();
    
    return `
        <div class="mb-3">
            <label for="pivot-index" class="form-label">Row</label>
            <select class="form-select" id="pivot-index" multiple size="3">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <small class="form-text text-muted">Column(s) to use as row indices</small>
        </div>
        
        <div class="mb-3">
            <label for="pivot-columns" class="form-label">Column</label>
            <select class="form-select" id="pivot-columns">
                <option value="">-- Select Column --</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <small class="form-text text-muted">Column whose values will become new columns</small>
        </div>
        
        <div class="mb-3">
            <label for="pivot-values" class="form-label">Values</label>
            <select class="form-select" id="pivot-values">
                <option value="">-- Select Column --</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <small class="form-text text-muted">Column whose values will be aggregated</small>
        </div>
        
        <div class="mb-3">
            <label for="pivot-aggfunc" class="form-label">Aggregation Function</label>
            <select class="form-select" id="pivot-aggfunc">
                <option value="sum">Sum</option>
                <option value="mean">Mean</option>
                <option value="count">Count</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
            </select>
        </div>
    `;
}

// Add a transformation to the current query
function addTransformation() {
    const transformationType = document.getElementById('transformation-type').value;
    
    if (!transformationType) {
        showError('Please select a transformation type');
        return;
    }
    
    let transformation = {
        type: transformationType
    };
    
    // Get transformation-specific settings
    if (transformationType === 'filter') {
        const column = document.getElementById('filter-column').value;
        const operator = document.getElementById('filter-operator').value;
        const value = document.getElementById('filter-value').value;
        
        if (!column || !value) {
            showError('Please fill all filter fields');
            return;
        }
        
        transformation.column = column;
        transformation.operator = operator;
        transformation.value = value;
    } else if (transformationType === 'sort') {
        const columnsSelect = document.getElementById('sort-columns');
        const columns = Array.from(columnsSelect.selectedOptions).map(opt => opt.value);
        const direction = document.getElementById('sort-direction').value;
        
        if (columns.length === 0) {
            showError('Please select at least one column to sort by');
            return;
        }
        
        transformation.columns = columns;
        transformation.ascending = direction === 'asc';
    } else if (transformationType === 'groupby') {
        const columnsSelect = document.getElementById('groupby-columns');
        const columns = Array.from(columnsSelect.selectedOptions).map(opt => opt.value);
        
        if (columns.length === 0) {
            showError('Please select at least one column to group by');
            return;
        }
        
        // Get aggregations
        const aggregations = {};
        const aggRows = document.querySelectorAll('.aggregation-row');
        
        for (const row of aggRows) {
            const column = row.querySelector('.agg-column').value;
            const func = row.querySelector('.agg-function').value;
            
            if (column && func) {
                aggregations[column] = func;
            }
        }
        
        if (Object.keys(aggregations).length === 0) {
            showError('Please add at least one aggregation');
            return;
        }
        
        transformation.group_columns = columns;
        transformation.aggregations = aggregations;
    } else if (transformationType === 'pivot') {
        const indexSelect = document.getElementById('pivot-index');
        const index = Array.from(indexSelect.selectedOptions).map(opt => opt.value);
        const columns = document.getElementById('pivot-columns').value;
        const values = document.getElementById('pivot-values').value;
        const aggfunc = document.getElementById('pivot-aggfunc').value;
        
        if (index.length === 0 || !columns || !values) {
            showError('Please fill all pivot fields');
            return;
        }
        
        transformation.index = index;
        transformation.columns = columns;
        transformation.values = values;
        transformation.aggfunc = aggfunc;
    }
    
    // Add transformation to the list
    currentTransformations.push(transformation);
    
    // Render the updated transformation list
    renderTransformations();
    
    // Hide the modal
    bootstrap.Modal.getInstance(document.getElementById('transformationModal')).hide();
}

// Render the current transformations
function renderTransformations() {
    const container = document.getElementById('transformation-list');
    
    if (currentTransformations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3 text-muted" id="no-transformations-message">
                <p>No transformations added yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    currentTransformations.forEach((transform /* , index */) => {
        let description = '';
        
        if (transform.type === 'filter') {
            description = `Filter where ${transform.column} ${transform.operator.replace('_', ' ')} ${transform.value}`;
        } else if (transform.type === 'sort') {
            description = `Sort by ${transform.columns.join(', ')} (${transform.ascending ? 'Ascending' : 'Descending'})`;
        } else if (transform.type === 'groupby') {
            const aggList = Object.entries(transform.aggregations)
                .map(([col, func]) => `${func}(${col})`)
                .join(', ');
            description = `Group by ${transform.group_columns.join(', ')} with ${aggList}`;
        } else if (transform.type === 'pivot') {
            description = `Pivot with ${transform.index.join(', ')} as rows, ${transform.columns} as columns, ${transform.values} as values using ${transform.aggfunc}`;
        }
        
        html += `
            <div class="card mb-2">
                <div class="card-body py-2 px-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary me-2">${transform.type}</span>
                            <small>${description}</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-transformation" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-transformation').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            currentTransformations.splice(index, 1);
            renderTransformations();
        });
    });
}

// Export results to CSV
function exportToCsv() {
    if (!currentResultId) {
        showError('No results to export');
        return;
    }
    
    const fileName = prompt('Enter a file name for the CSV export:', 'query_results.csv');
    
    if (!fileName) {
        return;
    }
    
    // Make AJAX request to MCP API
    fetch('/mcp/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: 'power_query',
            task_data: {
                task_type: 'export_results',
                result_id: currentResultId,
                export_type: 'csv',
                file_path: `/uploads/power_query/${fileName}`
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result && data.result.success) {
            // Show success message
            showSuccess('Results exported to CSV successfully');
            
            // Trigger download
            window.location.href = `/download-power-query-file?file=${encodeURIComponent(fileName)}`;
        } else {
            showError('Failed to export results: ' + (data.result?.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error exporting results:', error);
        showError('Error exporting results');
    });
}

// Export results to Excel
function exportToExcel() {
    if (!currentResultId) {
        showError('No results to export');
        return;
    }
    
    const fileName = prompt('Enter a file name for the Excel export:', 'query_results.xlsx');
    
    if (!fileName) {
        return;
    }
    
    // Make AJAX request to MCP API
    fetch('/mcp/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: 'power_query',
            task_data: {
                task_type: 'export_results',
                result_id: currentResultId,
                export_type: 'excel',
                file_path: `/uploads/power_query/${fileName}`,
                sheet_name: 'Query Results'
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result && data.result.success) {
            // Show success message
            showSuccess('Results exported to Excel successfully');
            
            // Trigger download
            window.location.href = `/download-power-query-file?file=${encodeURIComponent(fileName)}`;
        } else {
            showError('Failed to export results: ' + (data.result?.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error exporting results:', error);
        showError('Error exporting results');
    });
}

// Select a data source in the query builder
function selectDataSource(sourceName) {
    // Set the selected data source in the dropdown
    document.getElementById('data-source-select').value = sourceName;
    
    // Trigger change event to update UI
    const event = new Event('change');
    document.getElementById('data-source-select').dispatchEvent(event);
}

// Handle when data source changes in the dropdown
function handleDataSourceChange() {
    const select = document.getElementById('data-source-select');
    const sourceName = select.value;
    const option = select.selectedOptions[0];
    
    if (!sourceName || !option) {
        // Hide query-specific UI elements if no source selected
        document.getElementById('sql-query-container').style.display = 'none';
        document.getElementById('transformations-container').style.display = 'none';
        return;
    }
    
    // Get the data source type from the dataset
    const dataSourceType = option.dataset.type?.toLowerCase() || '';
    
    // Show/hide UI elements based on data source type
    if (dataSourceType === 'postgresql' || dataSourceType === 'sql_server' || dataSourceType === 'sqlite') {
        // Show SQL query container for database sources
        document.getElementById('sql-query-container').style.display = 'block';
        document.getElementById('transformations-container').style.display = 'block';
        
        // Clear any existing SQL query
        document.getElementById('sql-query').value = '';
        
        // Fetch and show tables for this source
        showTables();
    } else if (dataSourceType === 'csv' || dataSourceType === 'excel') {
        // For CSV/Excel, we don't need SQL query but can use transformations
        document.getElementById('sql-query-container').style.display = 'none';
        document.getElementById('transformations-container').style.display = 'block';
    } else {
        // For unknown source types, hide everything
        document.getElementById('sql-query-container').style.display = 'none';
        document.getElementById('transformations-container').style.display = 'none';
    }
}

// Handle source type changes in the add data source modal
function handleSourceTypeChange() {
    const sourceType = document.getElementById('source-type').value;
    
    // Hide all source-specific fields
    document.getElementById('sql-server-fields').style.display = 'none';
    document.getElementById('postgresql-fields').style.display = 'none';
    document.getElementById('csv-fields').style.display = 'none';
    document.getElementById('excel-fields').style.display = 'none';
    
    // Show the relevant fields based on source type
    if (sourceType === 'sql_server') {
        document.getElementById('sql-server-fields').style.display = 'block';
    } else if (sourceType === 'postgresql') {
        document.getElementById('postgresql-fields').style.display = 'block';
    } else if (sourceType === 'csv') {
        document.getElementById('csv-fields').style.display = 'block';
    } else if (sourceType === 'excel') {
        document.getElementById('excel-fields').style.display = 'block';
    }
}

// Get available columns for transformations
function getAvailableColumns() {
    // If we have current results, use those columns
    if (currentResults && currentResults.columns) {
        return currentResults.columns;
    }
    
    // Otherwise, try to get columns from the selected data source
    // This would need to be implemented based on the backend API
    return [];
}

// Show an error message
function showError(message) {
    const toast = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    showToast(toast);
}

// Show a success message
function showSuccess(message) {
    const toast = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    showToast(toast);
}

// Show a toast message
function showToast(toastHtml) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Add the toast to the container
    toastContainer.innerHTML += toastHtml;
    
    // Initialize and show the toast
    const toastElement = toastContainer.querySelector('.toast:last-child');
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}