// Benton County GIS Search Component
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const searchResults = document.getElementById('search-results');
    const searchSpinner = document.getElementById('search-spinner');
    const recentQueries = document.getElementById('recent-queries');
    const clearSearchBtn = document.getElementById('clear-search');
    
    // Keep track of recent searches
    let recentSearches = [];
    
    // Initialize from localStorage if available
    if (localStorage.getItem('recentGisSearches')) {
        try {
            recentSearches = JSON.parse(localStorage.getItem('recentGisSearches'));
            updateRecentSearches();
        } catch (e) {
            console.error('Error loading recent searches:', e);
            localStorage.removeItem('recentGisSearches');
        }
    }
    
    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const query = searchInput.value.trim();
            if (!query) return;
            
            // Show loading spinner
            searchSpinner.classList.remove('d-none');
            searchResults.innerHTML = '';
            
            // Save to recent searches
            addToRecentSearches(query);
            
            // Perform search
            performSearch(query);
        });
    }
    
    // Clear search
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchResults.innerHTML = '';
        });
    }
    
    // Add query to recent searches
    function addToRecentSearches(query) {
        // Remove if already exists
        recentSearches = recentSearches.filter(item => item !== query);
        
        // Add to beginning of array
        recentSearches.unshift(query);
        
        // Keep only the most recent 5
        if (recentSearches.length > 5) {
            recentSearches.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('recentGisSearches', JSON.stringify(recentSearches));
        
        // Update display
        updateRecentSearches();
    }
    
    // Update recent searches display
    function updateRecentSearches() {
        if (!recentQueries) return;
        
        if (recentSearches.length === 0) {
            recentQueries.innerHTML = '<p class="text-muted">No recent searches</p>';
            return;
        }
        
        recentQueries.innerHTML = '';
        
        recentSearches.forEach(query => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm btn-outline-secondary me-2 mb-2';
            button.textContent = query;
            button.addEventListener('click', () => {
                searchInput.value = query;
                searchForm.dispatchEvent(new Event('submit'));
            });
            recentQueries.appendChild(button);
        });
    }
    
    // Perform search using the RAG API
    function performSearch(query) {
        fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Search request failed');
            }
            return response.json();
        })
        .then(data => {
            displaySearchResults(data, query);
        })
        .catch(error => {
            console.error('Search error:', error);
            searchResults.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error performing search. Please try again.
                </div>
            `;
        })
        .finally(() => {
            searchSpinner.classList.add('d-none');
        });
    }
    
    // Display search results
    function displaySearchResults(data, query) {
        searchResults.innerHTML = '';
        
        // Create result container
        const resultBox = document.createElement('div');
        resultBox.className = 'search-result-box p-3 border rounded bg-light';
        
        // Add answer
        const answerElement = document.createElement('div');
        answerElement.className = 'search-answer mb-3';
        answerElement.innerHTML = `
            <h5>Results for: "${query}"</h5>
            <div class="answer-content">${formatAnswer(data.answer)}</div>
            <div class="text-muted small mt-2">
                <i class="fas fa-clock me-1"></i> Processed in ${data.processing_time}s
            </div>
        `;
        resultBox.appendChild(answerElement);
        
        // Add related files if any
        if (data.files && data.files.length > 0) {
            const filesElement = document.createElement('div');
            filesElement.className = 'related-files mt-4';
            filesElement.innerHTML = `<h6>Related Files:</h6>`;
            
            const filesList = document.createElement('ul');
            filesList.className = 'list-group';
            
            data.files.forEach(file => {
                const fileItem = document.createElement('li');
                fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                fileItem.innerHTML = `
                    <div>
                        <strong>${file.filename}</strong>
                        ${file.description ? `<div class="text-muted small">${file.description}</div>` : ''}
                    </div>
                    <div>
                        <a href="/download/${file.id}" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-download me-1"></i> Download
                        </a>
                    </div>
                `;
                filesList.appendChild(fileItem);
            });
            
            filesElement.appendChild(filesList);
            resultBox.appendChild(filesElement);
        }
        
        searchResults.appendChild(resultBox);
    }
    
    // Format the answer with Markdown-like enhancements
    function formatAnswer(text) {
        if (!text) return '';
        
        // Convert line breaks to paragraphs
        let formatted = text.split('\n\n').map(para => {
            if (para.trim()) {
                return `<p>${para}</p>`;
            }
            return '';
        }).join('');
        
        // Bold text between ** markers
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text between * markers
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Simple handling for code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        return formatted;
    }
});
