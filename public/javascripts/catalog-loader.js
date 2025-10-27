
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.hero__menu-button');
    const contentContainer = document.getElementById('content-container');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    let currentView = 'all'; // all, new, popular
    let currentCategory = 'all';
    let currentSort = 'newest';
    let currentSearch = '';


    loadCategories();
    loadContent();

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            setActiveButton(this);
            currentView = this.dataset.category;
            currentSearch = '';
            searchInput.value = '';
            loadContent();
        });
    });

    categoryFilter.addEventListener('change', function() {
        currentCategory = this.value;
        loadContent();
    });

    sortFilter.addEventListener('change', function() {
        currentSort = this.value;
        console.log('Sort changed to:', currentSort);
        loadContent();
    });

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        currentSearch = searchInput.value.trim();
        currentView = 'all';
        setActiveButton(document.querySelector('[data-category="all"]'));
        loadContent();
    });

    function setActiveButton(activeButton) {
        categoryButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.backgroundColor = '';
            btn.style.color = '';
        });
        activeButton.classList.add('active');
        activeButton.style.backgroundColor = '#DDB892';
        activeButton.style.color = 'white';
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();

            while (categoryFilter.children.length > 1) {
                categoryFilter.removeChild(categoryFilter.lastChild);
            }

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = `${category.name} (${category.book_count})`;
                categoryFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async function loadContent() {
        showLoading();

        try {
            let url;
            const params = new URLSearchParams();

            console.log('Loading content with:', {
                view: currentView,
                category: currentCategory,
                sort: currentSort,
                search: currentSearch
            });

            if (currentSearch) {
                url = '/api/books/search';
                if (currentSearch) params.append('q', currentSearch);
                if (currentCategory !== 'all') params.append('category', currentCategory);
                if (currentSort !== 'newest') params.append('sort', currentSort);
            } else if (currentView === 'new') {
                url = '/api/books/new';
            } else if (currentView === 'popular') {
                url = '/api/books/popular';
            } else {
                url = '/api/books/search';
                if (currentCategory !== 'all') params.append('category', currentCategory);
                if (currentSort !== 'newest') params.append('sort', currentSort);
            }

            const fullUrl = url + (params.toString() ? '?' + params.toString() : '');
            console.log('Fetching URL:', fullUrl);

            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Loaded ${result.data.length} books with sort: ${currentSort}`);
                displayBooks(result.data);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error loading content:', error);
            showError('Error loading books: ' + error.message);
        }
    }

    function displayBooks(books) {
        if (!books || books.length === 0) {
            contentContainer.innerHTML = `
            <div class="no-results">
                <h3>No books found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
            return;
        }

        contentContainer.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-cover">
                ${book.cover_image_url ?
            `<img src="${book.cover_image_url}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            ''
        }
                <div class="book-cover-placeholder" style="${book.cover_image_url ? 'display: none;' : ''}">
                    📚
                </div>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author_name}</p>
                <p class="book-category">${book.category_name}</p>
                <div class="book-meta">
                    <span>Year: ${book.publication_year || 'N/A'}</span>
                    ${book.page_count ? `<span>Pages: ${book.page_count}</span>` : ''}
                    <span>${book.language || 'English'}</span>
                </div>
                ${book.description ? `
                    <p class="book-description">${book.description.substring(0, 150)}${book.description.length > 150 ? '...' : ''}</p>
                ` : ''}
                <div class="sources-section">
                    <div class="sources-header">
                        <span class="sources-title">Available Sources:</span>
                        ${book.sources_count > 0 ?
            `<span class="sources-count">${book.sources_count} source${book.sources_count > 1 ? 's' : ''}</span>` :
            ''
        }
                    </div>
                    <div class="sources-list" id="sources-${book.id}" style="display: none;">
                        <div class="loading-sources">Loading sources...</div>
                    </div>
                </div>
                
                <div class="book-actions">
                    ${book.source_url ? `
                        <button class="read-btn" onclick="window.open('${book.source_url}', '_blank')">
                            Read Online
                        </button>
                    ` : ''}
                    <button class="details-btn" onclick="showBookDetails(${book.id})">
                        Details
                    </button>
                    <button class="sources-btn" onclick="toggleSources(${book.id})" id="sources-btn-${book.id}">
                        Show Sources
                    </button>
                </div>
            </div>
        </div>
    `).join('');

        books.forEach(book => {
            loadBookSources(book.id);
        });
    }

    function showLoading() {
        contentContainer.innerHTML = '<div class="loading">Loading books...</div>';
    }

    function showError(message) {
        contentContainer.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    }
});

async function loadBookSources(bookId) {
    try {
        console.log(`Loading sources for book ${bookId}...`);
        const response = await fetch(`/api/book/${bookId}/sources`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sources = await response.json();
        console.log(`Sources for book ${bookId}:`, sources);

        const sourcesContainer = document.getElementById(`sources-${bookId}`);
        if (sourcesContainer) {
            if (sources && sources.length > 0) {
                sourcesContainer.innerHTML = sources.map(source => `
                    <div class="source-item ${source.is_free ? 'free' : 'paid'}">
                        <span class="source-name">${source.source_name}</span>
                        ${source.is_free ? '<span class="free-badge">FREE</span>' : ''}
                        <button class="source-link-btn" onclick="window.open('${source.source_url}', '_blank')">
                            Read
                        </button>
                    </div>
                `).join('');
            } else {
                sourcesContainer.innerHTML = '<div class="no-sources">No sources available</div>';
            }
        }
    } catch (error) {
        console.error(`Error loading sources for book ${bookId}:`, error);
        const sourcesContainer = document.getElementById(`sources-${bookId}`);
        if (sourcesContainer) {
            sourcesContainer.innerHTML = '<div class="sources-error">Error loading sources</div>';
        }
    }
}

function toggleSources(bookId) {
    const sourcesContainer = document.getElementById(`sources-${bookId}`);
    const sourcesBtn = document.getElementById(`sources-btn-${bookId}`);

    if (sourcesContainer) {
        const isVisible = sourcesContainer.style.display !== 'none';
        sourcesContainer.style.display = isVisible ? 'none' : 'block';
        sourcesBtn.textContent = isVisible ? 'Show Sources' : 'Hide Sources';
    }
}

function showBookDetails(bookId) {
    fetch(`/api/book/${bookId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const book = result.data;
                let sourcesText = '';

                if (book.sources && book.sources.length > 0) {
                    sourcesText = '\n\nAvailable Sources:\n' +
                        book.sources.map(source =>
                            `• ${source.source_name}${source.is_free ? ' (FREE)' : ''} - ${source.source_url}`
                        ).join('\n');
                }

                alert(`Book Details:\n\nTitle: ${book.title}\nAuthor: ${book.author_name}\nCategory: ${book.category_name}\nYear: ${book.publication_year || 'N/A'}\nPages: ${book.page_count || 'N/A'}\n\nDescription: ${book.description || 'No description available'}${sourcesText}`);
            }
        })
        .catch(error => {
            console.error('Error fetching book details:', error);
            alert('Error loading book details');
        });
}
