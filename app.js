// app.js - полная исправленная версия
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const pool = require('./config/db');
const session = require('express-session');

// Подключаем BookRepository (ОДИН РАЗ!)
const BookRepository = require('./repositories/bookRepository');
const bookRepository = new BookRepository();

var usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');

var app = express();

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

var PORT = process.env.PORT;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/entrance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'entrance.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});
app.get('/user-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user-page.html'));
});


app.get('/api/books/search', async (req, res) => {
    try {
        const { q, category, sort } = req.query;
        console.log('Search request:', { q, category, sort });

        const books = await bookRepository.searchBooks(q, category, sort, 20);

        res.json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search books'
        });
    }
});

app.get('/api/books/new', async (req, res) => {
    try {
        const books = await bookRepository.getNewBooks(20);
        res.json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error('New books error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get new books'
        });
    }
});

app.get('/api/books/popular', async (req, res) => {
    try {
        const books = await bookRepository.getPopularBooks(20);
        res.json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error('Popular books error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get popular books'
        });
    }
});

app.get('/api/books/category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const books = await bookRepository.getBooksByCategory(categoryId);

        res.json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error('Category books error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get category books'
        });
    }
});

app.get('/api/book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await bookRepository.getBookDetails(bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        const sources = await bookRepository.getBookSources(bookId);

        res.json({
            success: true,
            data: {
                ...book,
                sources: sources
            }
        });
    } catch (error) {
        console.error('Book details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get book details'
        });
    }
});

app.get('/api/search', async (req, res) => {
    const searchTerm = req.query.q;

    try {
        const query = `
            SELECT
                b.title,
                u.username as author,
                b.publication_year,
                b.language,
                c.name as category_name
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.title ILIKE $1
               OR u.username ILIKE $1
               OR c.name ILIKE $1
                LIMIT 10
        `;

        const result = await pool.query(query, [`%${searchTerm}%`]);
        res.json(result.rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await bookRepository.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/books/category/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        const books = await bookRepository.getBooksByCategory(categoryId);
        res.json(books);
    } catch (error) {
        console.error('Books by category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/books/categories', async (req, res) => {
    const categoryIds = req.query.category_ids;

    if (!categoryIds) {
        return res.status(400).json({ error: 'Category IDs are required' });
    }

    try {
        const idsArray = categoryIds.split(',').map(id => parseInt(id));
        const placeholders = idsArray.map((_, index) => `$${index + 1}`).join(',');

        const query = `
            SELECT
                b.id,
                b.title,
                b.description,
                u.username as author,
                b.publication_year,
                b.language,
                b.page_count,
                b.source_url,
                b.cover_image_url,
                b.isbn,
                c.name as category_name,
                c.id as category_id
            FROM books b
            JOIN users u ON b.author_id = u.id
            JOIN categories c ON b.category_id = c.id
            WHERE b.category_id IN (${placeholders}) AND b.is_published = true
            ORDER BY c.name, b.title
        `;

        const result = await pool.query(query, idsArray);
        res.json(result.rows);
    } catch (error) {
        console.error('Books by multiple categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/books', async (req, res) => {
    const genreId = req.query.genre_id;

    try {
        const query = `
            SELECT
                b.id,
                b.title,
                b.description,
                u.username as author,
                b.publication_year,
                b.language,
                b.page_count,
                b.source_url,
                b.cover_image_url,
                c.name as category_name
            FROM books b
                     JOIN users u ON b.author_id = u.id
                     LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.category_id = $1 AND b.is_published = true
            ORDER BY b.title
        `;

        const result = await pool.query(query, [genreId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Books by genre error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/book/:id/sources', async (req, res) => {
    const bookId = req.params.id;

    try {
        const sources = await bookRepository.getBookSources(bookId);
        res.json(sources);
    } catch (error) {
        console.error('Sources error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('/users', usersRouter);
app.use('/books', booksRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connected to the database:', res.rows[0].now);
    } catch (err) {
        console.error('❌ Error connecting to the database:', err.message);
    }
}

testConnection();

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:3000`);
});

module.exports = app;
