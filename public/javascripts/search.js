
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search__input');

    if (searchInput) {
        searchInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();

                if (!searchTerm) {
                    alert('Enter search term');
                    return;
                }

                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const books = await response.json();

                    if (books.length > 0) {
                        let message = `Found books: ${books.length}\n\n`;
                        books.forEach((book, index) => {
                            message += `${index + 1}. "${book.title}"\n`;
                            message += `   Author: ${book.author_name || 'Unknown'}\n`;
                            message += `   Year: ${book.publication_year || 'N/A'}\n`;
                            message += `   Language: ${book.language || 'Unknown'}\n`;
                            message += `   Category: ${book.category_name || 'Uncategorized'}\n\n`;
                        });
                        alert(message);
                    } else {
                        alert('No books found for your search');
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    alert('Error searching books. Check server connection.');
                }
            }
        });
    }
});