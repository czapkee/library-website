const BookRepository = require('./bookRepository');
const UserRepository = require('./userRepository');

const bookRepository = new BookRepository();
const userRepository = new UserRepository();

module.exports = {
    BookRepository,
    UserRepository
};
