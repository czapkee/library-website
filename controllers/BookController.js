
const BaseRepository = require('./baseRepository');

class BookRepository extends BaseRepository {
    constructor() {
        super();
    }

    async getNewBooks(limit = 10) {
        const query = `
            SELECT 
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.views,
                u.username as author_name,
                c.name as category_name
            FROM books b
            JOIN users u ON b.author_id = u.id
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.is_published = true
            ORDER BY b.created_at DESC
            LIMIT $1
        `;
        return await this.query(query, [limit]);
    }

    async getBooksByCategory(categoryId, limit = 20) {
        const query = `
            SELECT 
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.views,
                u.username as author_name,
                c.name as category_name
            FROM books b
            JOIN users u ON b.author_id = u.id
            JOIN categories c ON b.category_id = c.id
            WHERE b.category_id = $1 AND b.is_published = true
            ORDER BY b.views DESC
            LIMIT $2
        `;
        return await this.query(query, [categoryId, limit]);
    }

    async searchBooks(query, category = 'all', sort = 'relevance', limit = 20) {
        let conditions = ['b.is_published = true'];
        let params = [];
        let paramCount = 0;

        if (query) {
            paramCount++;
            conditions.push(`(
                b.title ILIKE $${paramCount} OR
                u.username ILIKE $${paramCount} OR
                c.name ILIKE $${paramCount} OR
                b.description ILIKE $${paramCount}
            )`);
            params.push(`%${query}%`);
        }

        if (category !== 'all') {
            paramCount++;
            conditions.push(`c.name = $${paramCount}`);
            params.push(category);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const orderBy = this.buildOrderBy(sort, paramCount);

        paramCount++;
        params.push(limit);

        const searchQuery = `
            SELECT 
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.views,
                u.username as author_name,
                c.name as category_name
            FROM books b
            JOIN users u ON b.author_id = u.id
            LEFT JOIN categories c ON b.category_id = c.id
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${paramCount}
        `;

        return await this.query(searchQuery, params);
    }

    buildOrderBy(sort, searchParamIndex) {
        switch (sort) {
            case 'views':
                return 'b.views DESC';
            case 'newest':
                return 'b.created_at DESC';
            case 'oldest':
                return 'b.created_at ASC';
            case 'title':
                return 'b.title ASC';
            default:
                return 'b.views DESC';
        }
    }

    async getAllCategories() {
        const query = `
            SELECT 
                c.id, c.name, c.description,
                COUNT(b.id) as book_count
            FROM categories c
            LEFT JOIN books b ON c.id = b.category_id AND b.is_published = true
            GROUP BY c.id, c.name, c.description
            ORDER BY c.name
        `;
        return await this.query(query);
    }
}

module.exports = BookRepository;