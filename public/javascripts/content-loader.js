
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.hero__menu-button');
    const contentContainer = document.getElementById('content-container');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    let currentCategory = 'all';
    let currentSort = 'relevance';
    let currentSearch = '';

    loadCategories();
    loadContent('all', 'relevance', '');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            setActiveButton(this);
            currentCategory = this.dataset.category;
            loadContent(currentCategory, currentSort, currentSearch);
        });
    });

    categoryFilter.addEventListener('change', function() {
        loadContent(currentCategory, currentSort, currentSearch);
    });

    sortFilter.addEventListener('change', function() {
        currentSort = this.value;
        loadContent(currentCategory, currentSort, currentSearch);
    });

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        currentSearch = searchInput.value.trim();
        loadContent(currentCategory, currentSort, currentSearch);
    });

    function setActiveButton(activeButton) {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();

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

    async function loadContent(category, sort, search) {
        contentContainer.innerHTML = '<div class="loading">Loading books...</div>';

        try {
            let url = '/api/books/search?';
            const params = new URLSearchParams();

            if (search) params.append('q', search);
            if (category !== 'all') params.append('category', category);
            if (sort !== 'relevance') params.append('sort', sort);

            const response = await fetch(url + params.toString());
            const result = await response.json();

            if (result.success) {
                displayBooks(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading content:', error);
            contentContainer.innerHTML = `
                <div class="error">
                    <p>Error loading books</p>
                    <button onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }

    function displayBooks(books) {
        if (books.length === 0) {
            contentContainer.innerHTML = `
                <div class="no-results">
                    <h3>No books found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        contentContainer.innerHTML = books.map(book => `
            <div class="book-card">
                <div class="book-cover">
                    ${book.cover_image_url ?
            `<img src="${book.cover_image_url}" alt="${book.title}">` :
            `<div class="book-cover-placeholder">📚</div>`
        }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author_name}</p>
                    <p class="book-category">${book.category_name}</p>
                    <div class="book-meta">
                        <span>${book.publication_year || 'N/A'}</span>
                        <span>${book.page_count ? book.page_count + ' pages' : ''}</span>
                        <span>👁️ ${book.views || 0}</span>
                    </div>
                    ${book.description ? `<p class="book-description">${book.description}</p>` : ''}
                    <div class="book-actions">
                        ${book.source_url ? `
                            <button class="read-btn" onclick="window.open('${book.source_url}', '_blank')">
                                Read Online
                            </button>
                        ` : ''}
                        <button class="details-btn" onclick="showBookDetails(${book.id})">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
});