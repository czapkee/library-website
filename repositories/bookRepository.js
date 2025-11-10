const pool = require('../config/db');

class BookRepository {
    constructor() {
        this.pool = pool;
    }

    async query(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error(`Database query error:`, error);
            throw error;
        }
    }

    async getNewBooks(limit = 10) {
        const query = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.is_published,
                u.username as author_name,
                c.name as category_name,
                c.id as category_id,
                COALESCE(bs.status, 'available') as status,
                bs.borrower_id,
                borrower.username as borrower_name
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
                     LEFT JOIN book_status bs ON b.id = bs.book_id
                     LEFT JOIN users borrower ON bs.borrower_id = borrower.id
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
                b.isbn, b.created_at, b.is_published,
                u.username as author_name,
                c.name as category_name,
                c.id as category_id,
                COALESCE(bs.status, 'available') as status,
                bs.borrower_id,
                borrower.username as borrower_name
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     JOIN categories c ON b.category_id = c.id
                     LEFT JOIN book_status bs ON b.id = bs.book_id
                     LEFT JOIN users borrower ON bs.borrower_id = borrower.id
            WHERE b.category_id = $1 AND b.is_published = true
            ORDER BY b.created_at DESC
                LIMIT $2
        `;
        return await this.query(query, [categoryId, limit]);
    }

    async searchBooks(query, category = 'all', sort = 'newest', limit = 20) {
        let conditions = ['b.is_published = true'];
        let params = [];
        let paramCount = 1;

        if (query && query.trim() !== '') {
            conditions.push(`(
                b.title ILIKE $${paramCount} OR
                u.username ILIKE $${paramCount} OR
                c.name ILIKE $${paramCount} OR
                b.description ILIKE $${paramCount}
            )`);
            params.push(`%${query}%`);
            paramCount++;
        }

        if (category !== 'all') {
            conditions.push(`c.name = $${paramCount}`);
            params.push(category);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderBy = this.buildOrderBy(sort);
        params.push(limit);

        const searchQuery = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.is_published,
                u.username as author_name,
                c.name as category_name,
                c.id as category_id,
                COALESCE(bs.status, 'available') as status,
                bs.borrower_id,
                borrower.username as borrower_name
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
                     LEFT JOIN book_status bs ON b.id = bs.book_id
                     LEFT JOIN users borrower ON bs.borrower_id = borrower.id
                ${whereClause}
            ORDER BY ${orderBy}
                LIMIT $${paramCount}
        `;

        return await this.query(searchQuery, params);
    }

    buildOrderBy(sort) {
        switch (sort) {
            case 'newest':
                return 'b.created_at DESC';
            case 'oldest':
                return 'b.created_at ASC';
            case 'title':
                return 'b.title ASC';
            case 'title_desc':
                return 'b.title DESC';
            case 'year':
                return 'b.publication_year DESC';
            case 'year_old':
                return 'b.publication_year ASC';
            case 'pages':
                return 'b.page_count DESC';
            case 'pages_asc':
                return 'b.page_count ASC';
            default:
                return 'b.created_at DESC';
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

    async getPopularBooks(limit = 10) {
        const query = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.is_published,
                u.username as author_name,
                c.name as category_name,
                c.id as category_id,
                COALESCE(bs.status, 'available') as status,
                bs.borrower_id,
                borrower.username as borrower_name,
                (SELECT COUNT(*) FROM favorite_books WHERE book_id = b.id) as favorite_count
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
                     LEFT JOIN book_status bs ON b.id = bs.book_id
                     LEFT JOIN users borrower ON bs.borrower_id = borrower.id
            WHERE b.is_published = true
            ORDER BY favorite_count DESC, b.created_at DESC
                LIMIT $1
        `;
        return await this.query(query, [limit]);
    }

    async getBookDetails(bookId) {
        const query = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.is_published,
                u.username as author_name, u.id as author_id,
                c.name as category_name, c.id as category_id,
                (SELECT COUNT(*) FROM favorite_books WHERE book_id = b.id) as favorite_count
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = $1 AND b.is_published = true
        `;
        const result = await this.query(query, [bookId]);
        return result.length > 0 ? result[0] : null;
    }

    async getBookSources(bookId) {
        const query = `
            SELECT source_name, source_url, is_free
            FROM book_sources
            WHERE book_id = $1
            ORDER BY is_free DESC, source_name
        `;
        return await this.query(query, [bookId]);
    }

    async getBookDetailsWithStatus(bookId) {
        const query = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at, b.is_published,
                u.username as author_name, u.id as author_id,
                c.name as category_name, c.id as category_id,
                COALESCE(bs.status, 'available') as status,
                bs.borrower_id,
                borrower.username as borrower_name,
                (SELECT COUNT(*) FROM favorite_books WHERE book_id = b.id) as favorite_count
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
                     LEFT JOIN book_status bs ON b.id = bs.book_id
                     LEFT JOIN users borrower ON bs.borrower_id = borrower.id
            WHERE b.id = $1 AND b.is_published = true
        `;
        const result = await this.query(query, [bookId]);
        return result.length > 0 ? result[0] : null;
    }

    async updateBookStatus(bookId, status, borrowerId = null) {
        const checkQuery = 'SELECT id FROM book_status WHERE book_id = $1';
        const checkResult = await this.query(checkQuery, [bookId]);

        if (checkResult.length > 0) {
            const updateQuery = `
                UPDATE book_status
                SET status = $1, borrower_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE book_id = $3
            `;
            await this.query(updateQuery, [status, borrowerId, bookId]);
        } else {
            const insertQuery = `
                INSERT INTO book_status (book_id, status, borrower_id, created_at, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            await this.query(insertQuery, [bookId, status, borrowerId]);
        }

        console.log(`Book ${bookId} status updated to: ${status}, borrower: ${borrowerId}`);
    }

    async getUserReservedBooks(userId) {
        const query = `
            SELECT
                b.id, b.title, b.description, b.publication_year,
                b.language, b.page_count, b.source_url, b.cover_image_url,
                b.isbn, b.created_at,
                u.username as author_name,
                c.name as category_name,
                bs.status,
                bs.created_at as reserved_date
            FROM book_status bs
            JOIN books b ON bs.book_id = b.id
            JOIN users u ON b.author_id = u.id
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE bs.borrower_id = $1 AND bs.status = 'reserved'
            ORDER BY bs.created_at DESC
        `;
        return await this.query(query, [userId]);
    }
}

module.exports = BookRepository;