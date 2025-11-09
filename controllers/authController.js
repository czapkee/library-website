const authService = require('../services/authService');
const { UserRepository } = require('../repositories');

const authController = {
    async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            const user = await authService.register({
                username,
                email,
                password,
                role
            });


            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                display_name: user.display_name || user.username,
                avatar_url: user.avatar_url || '',
                bio: user.bio || ''
            };

            res.json({
                success: true,
                message: 'Registration successful',
                user: req.session.user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await authService.login({
                username,
                password
            });


            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                display_name: user.display_name || user.username,
                avatar_url: user.avatar_url || '',
                bio: user.bio || ''
            };
            res.json({
                success: true,
                message: 'Login successful',
                user: req.session.user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await authService.login({
                username,
                password
            });
            req.session.user = user;

            res.json({
                success: true,
                message: 'Login successful',
                user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: 'Logout failed'
                });
            }
            res.json({
                success: true,
                message: 'Logout successful'
            });
        });
    },

    getCurrentUser(req, res) {
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
    }
};

module.exports = authController;
