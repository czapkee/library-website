const express = require('express');
const router = express.Router();
const Book = require('../models/Book');


router.get('/search', async (req, res) => {
    try {
        const { q, category, author, language, yearFrom, yearTo, pageFrom, pageTo, page = 1 } = req.query;

        const limit = 10;
        const offset = (page - 1) * limit;

        const filters = {
            categoryId: category,
            authorId: author,
            language: language,
            yearFrom: yearFrom ? parseInt(yearFrom) : null,
            yearTo: yearTo ? parseInt(yearTo) : null,
            pageCountFrom: pageFrom ? parseInt(pageFrom) : null,
            pageCountTo: pageTo ? parseInt(pageTo) : null,
            limit,
            offset
        };

        const books = await Book.searchBooks(q);

        res.json({
            success: true,
            data: books,
            pagination: {
                page: parseInt(page),
                limit,
                hasMore: books.length === limit
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при поиске книг'
        });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const book = await Book.getBookById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Книга не найдена'
            });
        }

        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении книги'
        });
    }
});

module.exports = router;