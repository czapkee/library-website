const pool = require('../config/db');

class Book {
    static async searchBooks(filters = {}) {
        const {
            searchTerm,
            categoryId,
            authorId,
            language,
            yearFrom,
            yearTo,
            pageCountFrom,
            pageCountTo,
            limit = 10,
            offset = 0
        } = filters;

        let query = `
            SELECT
                b.*,
                u.username as author_name,
                c.name as category_name,

                CASE
                    WHEN b.title ILIKE $1 THEN 3
                    WHEN b.description ILIKE $1 THEN 2
                    ELSE 1
                    END as relevance
            FROM books b
                     LEFT JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.is_published = true
        `;

        const params = [`%${searchTerm}%`];
        let paramCount = 1;
        const conditions = [];

        if (searchTerm) {
            conditions.push(`(b.title ILIKE $1 OR b.description ILIKE $1)`);
        }

        const filterConditions = [
            { value: categoryId, field: 'category_id' },
            { value: authorId, field: 'author_id' },
            { value: language, field: 'language' },
            { value: yearFrom, field: 'publication_year', operator: '>=' },
            { value: yearTo, field: 'publication_year', operator: '<=' },
            { value: pageCountFrom, field: 'page_count', operator: '>=' },
            { value: pageCountTo, field: 'page_count', operator: '<=' }
        ];

        filterConditions.forEach(filter => {
            if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                paramCount++;
                const operator = filter.operator || '=';
                conditions.push(`b.${filter.field} ${operator} $${paramCount}`);
                params.push(filter.value);
            }
        });

        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY relevance DESC, b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        try {
            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Database search error:', error);
            throw error;
        }
    }
}

module.exports = Book;