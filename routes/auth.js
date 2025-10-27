const express = require('express');
const path = require('path');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/entrance.html'));
});

router.get('/entrance', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

module.exports = router;
