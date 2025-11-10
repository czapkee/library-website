console.log('Catalog loader initialized');

window.showBookDetails = async function(bookId) {
    console.log('🔄 Fetching details for book:', bookId);
    try {
        const response = await fetch(`/api/book-with-status/${bookId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('📖 Book details response:', result);

        if (result.success) {
            showBookModal(result.data);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error fetching book details:', error);
        alert('Error loading book details: ' + error.message);
    }
};

window.setAsReserved = async function(bookId) {
    if (!confirm('Are you sure you want to reserve this book?')) return;

    try {
        const response = await fetch(`/api/books/${bookId}/reserve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('🔖 Set as reserved response:', result);

        if (result.success) {
            alert('✅ ' + result.message);
            window.closeModal();
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error setting book as reserved:', error);
        alert('Error setting book as reserved: ' + error.message);
    }
};

window.borrowBook = async function(bookId) {
    if (!confirm('Are you sure you want to borrow this book?')) return;

    try {
        const response = await fetch(`/api/books/${bookId}/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📚 Borrow response:', result);

        if (result.success) {
            alert('✅ ' + result.message);
            window.closeModal();
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error borrowing book:', error);
        alert('Error borrowing book: ' + error.message);
    }
};

window.returnBook = async function(bookId) {
    if (!confirm('Are you sure you want to return this book?')) return;

    try {
        const response = await fetch(`/api/books/${bookId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('🔄 Return response:', result);

        if (result.success) {
            alert('✅ ' + result.message);
            window.closeModal();
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error returning book:', error);
        alert('Error returning book: ' + error.message);
    }
};

window.cancelReservation = async function(bookId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
        const response = await fetch(`/api/books/${bookId}/cancel-reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('❌ Cancel reservation response:', result);

        if (result.success) {
            alert('✅ ' + result.message);
            window.closeModal();
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error canceling reservation:', error);
        alert('Error canceling reservation: ' + error.message);
    }
};

window.closeModal = function() {
    const modal = document.querySelector('.book-status-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
        console.log('✅ Modal closed');
    }
};

function getStatusClass(status) {
    const statusClasses = {
        'available': 'status-available',
        'borrowed': 'status-borrowed',
        'reserved': 'status-reserved'
    };
    return statusClasses[status] || 'status-available';
}

function getStatusText(status) {
    const statusTexts = {
        'available': '📗 Available',
        'borrowed': '📕 Borrowed',
        'reserved': '📙 Reserved'
    };
    return statusTexts[status] || '📗 Available';
}

function showBookModal(book) {
    console.log('🎪 Showing modal for book:', book);

    window.closeModal();

    const modal = document.createElement('div');
    modal.className = 'book-status-modal';

    let actionButtons = '';
    const currentStatus = book.status || 'available';

    if (currentStatus === 'available') {
        actionButtons = `
            <button class="borrow-btn" onclick="window.borrowBook(${book.id})">
                📚 Borrow This Book
            </button>
            <button class="reserve-btn" onclick="window.setAsReserved(${book.id})">
                🔖 Reserve This Book
            </button>
        `;
    } else if (currentStatus === 'borrowed') {
        actionButtons = `
            <button class="return-btn" onclick="window.returnBook(${book.id})">
                🔄 Return This Book
            </button>
        `;
    } else if (currentStatus === 'reserved') {
        actionButtons = `
            <button class="cancel-reserve-btn" onclick="window.cancelReservation(${book.id})">
                ❌ Cancel Reservation
            </button>
        `;
    }

    modal.innerHTML = `
        <div class="modal-overlay" onclick="window.closeModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${book.title}</h3>
                <button class="close-btn" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="book-cover-large">
                    ${book.cover_image_url ?
        `<img src="${book.cover_image_url}" alt="${book.title}">` :
        '<div class="book-cover-placeholder-large">📚</div>'
    }
                </div>
                
                <div class="book-info">
                    <p><strong>Author:</strong> ${book.author_name}</p>
                    <p><strong>Category:</strong> ${book.category_name}</p>
                    <p><strong>Year:</strong> ${book.publication_year || 'N/A'}</p>
                    <p><strong>Pages:</strong> ${book.page_count || 'N/A'}</p>
                    <p><strong>Language:</strong> ${book.language || 'English'}</p>
                </div>
                
                <div class="status-section">
                    <h4>Current Status:</h4>
                    <div class="current-status ${getStatusClass(currentStatus)}">
                        ${getStatusText(currentStatus)}
                    </div>
                </div>
                
                ${book.description ? `
                    <div class="description-section">
                        <h4>Description:</h4>
                        <p>${book.description}</p>
                    </div>
                ` : ''}
                
                <div class="action-buttons">
                    ${actionButtons}
                    <button class="cancel-btn" onclick="window.closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    console.log('✅ Modal displayed successfully');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing catalog...');

    const contentContainer = document.getElementById('content-container');
    const categoryButtons = document.querySelectorAll('.hero__menu-button');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    if (!contentContainer) {
        console.error('❌ Content container not found!');
        return;
    }

    console.log('✅ All required elements found');

    let currentView = 'all';
    let currentCategory = 'all';
    let currentSort = 'newest';
    let currentSearch = '';

    initializeCatalog();

    function initializeCatalog() {
        console.log('🔄 Initializing catalog functionality...');

        setupEventListeners();

        loadCategories();
        loadContent();
    }

    function setupEventListeners() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('📝 Category button clicked:', this.dataset.category);
                setActiveButton(this);
                currentView = this.dataset.category;
                currentSearch = '';
                if (searchInput) searchInput.value = '';
                loadContent();
            });
        });

        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                console.log('📝 Category filter changed:', this.value);
                currentCategory = this.value;
                loadContent();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', function() {
                console.log('📝 Sort filter changed:', this.value);
                currentSort = this.value;
                loadContent();
            });
        }

        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                currentSearch = searchInput.value.trim();
                console.log('🔍 Search submitted:', currentSearch);
                currentView = 'all';
                const allButton = document.querySelector('[data-category="all"]');
                if (allButton) setActiveButton(allButton);
                loadContent();
            });
        }
    }

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
            console.log('📚 Loading categories...');
            const response = await fetch('/api/categories');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const categories = await response.json();
            console.log('✅ Categories loaded:', categories.length);

            if (categoryFilter) {
                const firstOption = categoryFilter.querySelector('option');
                categoryFilter.innerHTML = firstOption ? firstOption.outerHTML : '<option value="all">All Categories</option>';

                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = `${category.name} (${category.book_count})`;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('❌ Error loading categories:', error);
        }
    }

    async function loadContent() {
        console.log('🔄 Loading book content...');
        showLoading();

        try {
            let url;
            const params = new URLSearchParams();

            console.log('📊 Current filters:', {
                view: currentView,
                category: currentCategory,
                sort: currentSort,
                search: currentSearch
            });

            if (currentSearch) {
                url = '/api/books/search';
                params.append('q', currentSearch);
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
            console.log('🌐 Fetching from:', fullUrl);

            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 API response received');

            if (result.success) {
                console.log(`✅ Successfully loaded ${result.data.length} books`);
                displayBooks(result.data);
            } else {
                throw new Error(result.error || 'Unknown API error');
            }
        } catch (error) {
            console.error('❌ Error loading content:', error);
            showError('Error loading books: ' + error.message);
        }
    }

    function displayBooks(books) {
        console.log('🎨 Displaying books:', books?.length);

        if (!books || books.length === 0) {
            contentContainer.innerHTML = `
                <div class="no-results">
                    <h3>No books found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        contentContainer.innerHTML = books.map(book => {
            const status = book.status || 'available';
            const statusClass = getStatusClass(status);
            const statusText = getStatusText(status);

            return `
                <div class="book-card" data-book-id="${book.id}">
                    <div class="book-cover">
                        ${book.cover_image_url ?
                `<img src="${book.cover_image_url}" alt="${book.title}" 
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
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
                        
                        <div class="book-status ${statusClass}">
                            ${statusText}
                        </div>
                        
                        <div class="book-meta">
                            <span>Year: ${book.publication_year || 'N/A'}</span>
                            ${book.page_count ? `<span>Pages: ${book.page_count}</span>` : ''}
                            <span>${book.language || 'English'}</span>
                        </div>
                        
                        ${book.description ? `
                            <p class="book-description">${book.description.substring(0, 150)}${book.description.length > 150 ? '...' : ''}</p>
                        ` : ''}
                        
                        <div class="book-actions">
                            ${book.source_url ? `
                                <button class="read-btn" onclick="window.open('${book.source_url}', '_blank')">
                                    Read Online
                                </button>
                            ` : ''}
                            <button class="details-btn" onclick="window.showBookDetails(${book.id})">
                                Details & Status
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Books displayed successfully');
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