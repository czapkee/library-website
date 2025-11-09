const { UserRepository } = require('../repositories/');
const bcrypt = require('bcrypt');

const userRepository = new UserRepository();

const authService = {
    async register({ username, email, password, role }) {

        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
            throw new Error('User with this email already exists');
        }

        const existingUsername = await userRepository.findByUsername(username);
        if (existingUsername) {
            throw new Error('Username already taken');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userRepository.create({
            username,
            email,
            password_hash: hashedPassword,
            role: role || 'reader',
            display_name: username,
            bio: '',
            avatar_url: ''
        });

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    async login({ username, password }) {
        const user = await userRepository.findByUsername(username);

        if (!user) {
            throw new Error('Invalid username or password');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid username or password');
        }

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};

module.exports = authService;
