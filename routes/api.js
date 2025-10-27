const express = require('express');
const router = express.Router();

const booksRouter = require('./books');

router.use('/books', booksRouter);

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API библиотеки работает!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

