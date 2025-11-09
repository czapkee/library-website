const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super();
        this.tableName = 'users';
    }

    async create({ username, email, password_hash, role }) {
        const query = `
            INSERT INTO users (username, email, password_hash, role, created_at)
            VALUES ($1, $2, $3, $4, NOW())
                RETURNING id, username, email, role, created_at
        `;
        const values = [username, email, password_hash, role];
        const result = await this.query(query, values);
        return result[0];
    }

    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.query(query, [email]);
        return result[0];
    }

    async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await this.query(query, [username]);
        return result[0];
    }

    async findById(id) {
        const query = `
            SELECT id, username, email, role, created_at
            FROM users WHERE id = $1
        `;
        const result = await this.query(query, [id]);
        return result[0];
    }

    async updateProfile(userId, { display_name, bio, avatar_url }) {
        const query = `
            UPDATE users
            SET display_name = $1, bio = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
                RETURNING id, username, email, role, display_name, bio, avatar_url, created_at
        `;
        const values = [display_name, bio, avatar_url, userId];
        const result = await this.query(query, values);
        return result[0];
    }
}

module.exports = UserRepository;