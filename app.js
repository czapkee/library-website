var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const pool = require('./config/db');
const session = require('express-session');

const BookRepository = require('./repositories/bookRepository');
const bookRepository = new BookRepository();

var usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');

var app = express();

const authenticateUser = (req, res, next) => {
    if (req.session.user) {
        req.userId = req.session.user.id;
        next();
    } else {
        res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
};

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(function(req, res, next) {
    res.locals.user = req.session.user || null;
    next();
});

var PORT = process.env.PORT || 3001;

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
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'user-page.html'));
});

app.get('/api/books/search', async (req, res) => {
    try {
        const { q, category, sort } = req.query;
        const books = await bookRepository.searchBooks(q, category, sort, 20);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Failed to search books' });
    }
});

app.get('/api/books/new', async (req, res) => {
    try {
        const books = await bookRepository.getNewBooks(20);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('New books error:', error);
        res.status(500).json({ success: false, error: 'Failed to get new books' });
    }
});

app.get('/api/books/popular', async (req, res) => {
    try {
        const books = await bookRepository.getPopularBooks(20);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Popular books error:', error);
        res.status(500).json({ success: false, error: 'Failed to get popular books' });
    }
});

app.get('/api/books/category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const books = await bookRepository.getBooksByCategory(categoryId);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Category books error:', error);
        res.status(500).json({ success: false, error: 'Failed to get category books' });
    }
});

app.get('/api/book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await bookRepository.getBookDetails(bookId);
        if (!book) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }
        const sources = await bookRepository.getBookSources(bookId);
        res.json({ success: true, data: { ...book, sources: sources } });
    } catch (error) {
        console.error('Book details error:', error);
        res.status(500).json({ success: false, error: 'Failed to get book details' });
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

app.get('/api/search', async (req, res) => {
    const searchTerm = req.query.q;
    console.log('Search request received:', searchTerm);

    try {
        const books = await bookRepository.searchBooks(searchTerm, 'all', 'relevance', 10);
        res.json(books);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/auth/me', (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: false,
            user: null
        });
    }
});

app.use('/users', usersRouter);
app.use('/books', booksRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

app.get('/api/user/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const userQuery = `
            SELECT id, username, email, role, display_name, bio, avatar_url, created_at
            FROM users WHERE id = $1
        `;

        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        const reservedBooksQuery = `
            SELECT b.id, b.title, b.author_id, u.username as author_name,
                   b.cover_image_url, b.description, bs.status,
                   bs.created_at as reserved_date
            FROM book_status bs
                     JOIN books b ON bs.book_id = b.id
                     JOIN users u ON b.author_id = u.id
            WHERE bs.borrower_id = $1 AND bs.status = 'reserved'
            ORDER BY bs.created_at DESC
        `;

        const userBooksQuery = `
            SELECT id, title, description, cover_image_url, is_published, created_at
            FROM books
            WHERE author_id = $1
            ORDER BY created_at DESC
        `;

        const [reservedBooksResult, userBooksResult] = await Promise.all([
            pool.query(reservedBooksQuery, [userId]),
            pool.query(userBooksQuery, [userId])
        ]);

        res.json({
            success: true,
            data: {
                user: userResult.rows[0],
                reservedBooks: reservedBooksResult.rows,
                userBooks: userResult.rows[0].role === 'author' ? userBooksResult.rows : []
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении профиля'
        });
    }
});

app.put('/api/user/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const { display_name, bio, avatar_url } = req.body;

        const updateQuery = `
            UPDATE users
            SET display_name = $1, bio = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, username, email, role, display_name, bio, avatar_url, created_at
        `;

        const result = await pool.query(updateQuery, [
            display_name, bio, avatar_url, userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        const updatedUser = result.rows[0];

        if (req.session.user) {
            req.session.user.display_name = updatedUser.display_name;
            req.session.user.bio = updatedUser.bio;
            req.session.user.avatar_url = updatedUser.avatar_url;
        }

        res.json({
            success: true,
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении профиля'
        });
    }
});

app.post('/api/books/:id/reserve', authenticateUser, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.userId;

        const bookCheck = await pool.query(
            'SELECT id FROM books WHERE id = $1 AND is_published = true',
            [bookId]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        const statusCheck = await pool.query(
            'SELECT status FROM book_status WHERE book_id = $1',
            [bookId]
        );

        if (statusCheck.rows.length > 0 && statusCheck.rows[0].status !== 'available') {
            return res.status(400).json({
                success: false,
                error: 'Book is not available for reservation'
            });
        }

        if (statusCheck.rows.length > 0) {
            await pool.query(
                'UPDATE book_status SET status = $1, borrower_id = $2, updated_at = CURRENT_TIMESTAMP WHERE book_id = $3',
                ['reserved', userId, bookId]
            );
        } else {
            await pool.query(
                'INSERT INTO book_status (book_id, status, borrower_id, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                [bookId, 'reserved', userId]
            );
        }

        res.json({
            success: true,
            message: 'Book reserved successfully!'
        });

    } catch (error) {
        console.error('Reserve book error:', error);
        res.status(500).json({ success: false, error: 'Failed to reserve book' });
    }
});

app.post('/api/books/:id/cancel-reservation', authenticateUser, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.userId;

        const result = await pool.query(
            'DELETE FROM book_status WHERE book_id = $1 AND borrower_id = $2 AND status = $3',
            [bookId, userId, 'reserved']
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            message: 'Reservation cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel reservation'
        });
    }
});

app.post('/api/books', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const userCheck = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'author') {
            return res.status(403).json({
                success: false,
                error: 'Только авторы могут создавать книги'
            });
        }

        const {
            title, description, category_id, cover_image_url,
            publication_year, isbn, language, page_count, source_url
        } = req.body;

        if (!title || !category_id) {
            return res.status(400).json({
                success: false,
                error: 'Title and category are required'
            });
        }

        const insertQuery = `
            INSERT INTO books (
                title, description, author_id, category_id, cover_image_url,
                publication_year, isbn, language, page_count, source_url, is_published
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await pool.query(insertQuery, [
            title,
            description || null,
            userId,
            category_id,
            cover_image_url || null,
            publication_year || null,
            isbn || null,
            language || 'English',
            page_count || null,
            source_url || null,
            true
        ]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Book created successfully'
        });

    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при создании книги: ' + error.message
        });
    }
});

app.get('/api/book-with-status/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const bookData = await bookRepository.getBookDetailsWithStatus(bookId);

        if (!bookData) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        const sources = await bookRepository.getBookSources(bookId);

        res.json({
            success: true,
            data: {
                ...bookData,
                sources: sources,
                can_borrow: bookData.status === 'available',
                can_reserve: bookData.status === 'available'
            }
        });
    } catch (error) {
        console.error('Book details with status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get book details' });
    }
});

app.post('/api/books/:id/borrow', authenticateUser, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.userId;

        const bookData = await bookRepository.getBookDetailsWithStatus(bookId);
        if (!bookData) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        if (bookData.status !== 'available') {
            return res.status(400).json({
                success: false,
                error: 'Book is not available for borrowing'
            });
        }

        await bookRepository.updateBookStatus(bookId, 'borrowed', userId);

        res.json({
            success: true,
            message: 'Book borrowed successfully!'
        });

    } catch (error) {
        console.error('Borrow book error:', error);
        res.status(500).json({ success: false, error: 'Failed to borrow book' });
    }
});

app.post('/api/books/:id/return', authenticateUser, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.userId;

        const bookData = await bookRepository.getBookDetailsWithStatus(bookId);
        if (!bookData) {
            return res.status(404).json({ success: false, error: 'Book not found' });
        }

        if (bookData.status !== 'borrowed' || bookData.borrower_id !== userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot return this book'
            });
        }

        await bookRepository.updateBookStatus(bookId, 'available', null);

        res.json({
            success: true,
            message: 'Book returned successfully!'
        });

    } catch (error) {
        console.error('Return book error:', error);
        res.status(500).json({ success: false, error: 'Failed to return book' });
    }
});

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
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

module.exports = app;