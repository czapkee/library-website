-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('author', 'reader')) NOT NULL DEFAULT 'reader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    cover_image_url VARCHAR(500),
    file_url VARCHAR(500),
    publication_year INTEGER,
    isbn VARCHAR(20),
    language VARCHAR(50) DEFAULT 'English',
    page_count INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    source_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create favorite books table
CREATE TABLE favorite_books (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Create reading history table
CREATE TABLE reading_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    last_read_page INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Create book sources table
CREATE TABLE book_sources (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу для хранения статусов книг
CREATE TABLE IF NOT EXISTS book_status (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed')),
    borrower_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id)
);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_book_status_book_id ON book_status(book_id);
CREATE INDEX IF NOT EXISTS idx_book_status_status ON book_status(status);

-- Insert users
INSERT INTO users (username, email, password_hash, role) VALUES
('tolstoy', 'leo@tolstoy.com', 'hash1', 'author'),
('dostoevsky', 'fyodor@dostoevsky.com', 'hash2', 'author'),
('orwell', 'george@orwell.com', 'hash3', 'author'),
('rowling', 'jk@rowling.com', 'hash4', 'author'),
('martin', 'george@martin.com', 'hash5', 'author'),
('hemingway', 'ernest@hemingway.com', 'hash6', 'author'),
('fitzgerald', 'scott@fitzgerald.com', 'hash7', 'author'),
('austen', 'jane@austen.com', 'hash8', 'author'),
('dickens', 'charles@dickens.com', 'hash9', 'author'),
('king', 'stephen@king.com', 'hash10', 'author'),
('tolkien', 'john@tolkien.com', 'hash11', 'author'),
('asimov', 'isaac@asimov.com', 'hash12', 'author'),
('christie', 'agatha@christie.com', 'hash13', 'author'),
('brown', 'dan@brown.com', 'hash14', 'author'),
('murakami', 'haruki@murakami.com', 'hash15', 'author'),
('reader1', 'john@reader.com', 'hash16', 'reader'),
('reader2', 'sarah@reader.com', 'hash17', 'reader'),
('booklover', 'emma@booklover.com', 'hash18', 'reader');


-- Insert categories
INSERT INTO categories (name, description) VALUES
('Classic Literature', 'Timeless literary works from master authors'),
('Science Fiction', 'Futuristic worlds and advanced technology'),
('Fantasy', 'Magical worlds and mythical creatures'),
('Mystery & Thriller', 'Suspenseful stories with puzzles and danger'),
('Romance', 'Stories of love and relationships'),
('Historical Fiction', 'Fictional stories set in historical contexts'),
('Horror', 'Terrifying and suspenseful stories'),
('Biography', 'Accounts of real people''s lives'),
('Adventure', 'Exciting journeys and explorations'),
('Young Adult', 'Books for teenage and young adult readers'),
('Philosophical', 'Works exploring deep philosophical ideas'),
('Satire', 'Humorous criticism of society'),
('Dystopian', 'Dark visions of future societies'),
('Crime', 'Stories centered around criminal activities'),
('Drama', 'Emotional and character-driven stories'),
('Short Stories', 'Collections of short fictional works'),
('Poetry', 'Verse and poetic compositions'),
('Self-Help', 'Books for personal development'),
('Science & Nature', 'Books about science and natural world'),
('Travel', 'Books about journeys and destinations');

-- Insert books
INSERT INTO books (title, description, author_id, category_id, publication_year, isbn, language, page_count, is_published, source_url) VALUES
-- Leo Tolstoy
('War and Peace', 'Epic novel about Russian society during Napoleonic wars', 1, 1, 1869, '978-0140447934', 'English', 1392, TRUE, 'https://example.com/war-and-peace'),
('Anna Karenina', 'Tragic story of love and society in imperial Russia', 1, 1, 1877, '978-0143035008', 'English', 864, TRUE, 'https://example.com/anna-karenina'),

-- Fyodor Dostoevsky
('Crime and Punishment', 'Psychological drama about a student who commits murder', 2, 11, 1866, '978-0143058144', 'English', 545, TRUE, 'https://example.com/crime-punishment'),
('The Brothers Karamazov', 'Philosophical novel about faith, family, and morality', 2, 11, 1880, '978-0374528379', 'English', 824, TRUE, 'https://example.com/brothers-karamazov'),

-- George Orwell
('1984', 'Dystopian novel about totalitarian surveillance state', 3, 13, 1949, '978-0451524935', 'English', 328, TRUE, 'https://example.com/1984'),
('Animal Farm', 'Political satire about revolution and power', 3, 12, 1945, '978-0451526342', 'English', 112, TRUE, 'https://example.com/animal-farm'),

-- J.K. Rowling
('Harry Potter and the Philosopher''s Stone', 'First book about young wizard Harry Potter', 4, 3, 1997, '978-0439708180', 'English', 320, TRUE, 'https://example.com/harry-potter-1'),
('Harry Potter and the Prisoner of Azkaban', 'Third book in the Harry Potter series', 4, 3, 1999, '978-0439136358', 'English', 448, TRUE, 'https://example.com/harry-potter-3'),

-- George R.R. Martin
('A Game of Thrones', 'First book in A Song of Ice and Fire series', 5, 3, 1996, '978-0553103540', 'English', 694, TRUE, 'https://example.com/game-of-thrones'),
('A Clash of Kings', 'Second book in the epic fantasy series', 5, 3, 1998, '978-0553108033', 'English', 768, TRUE, 'https://example.com/clash-of-kings'),

-- Ernest Hemingway
('The Old Man and the Sea', 'Story of an old fisherman''s struggle with a giant marlin', 6, 1, 1952, '978-0684801223', 'English', 127, TRUE, 'https://example.com/old-man-sea'),
('A Farewell to Arms', 'Love story set during World War I', 6, 5, 1929, '978-0684801469', 'English', 332, TRUE, 'https://example.com/farewell-arms'),

-- F. Scott Fitzgerald
('The Great Gatsby', 'Story of wealth, love, and the American Dream in the 1920s', 7, 1, 1925, '978-0743273565', 'English', 180, TRUE, 'https://example.com/great-gatsby'),
('Tender Is the Night', 'Story of American expatriates in the French Riviera', 7, 15, 1934, '978-0684801544', 'English', 315, TRUE, 'https://example.com/tender-night'),

-- Jane Austen
('Pride and Prejudice', 'Classic romance between Elizabeth Bennet and Mr. Darcy', 8, 5, 1813, '978-0141439518', 'English', 432, TRUE, 'https://example.com/pride-prejudice'),
('Sense and Sensibility', 'Story of the Dashwood sisters and their romantic pursuits', 8, 5, 1811, '978-0141439662', 'English', 409, TRUE, 'https://example.com/sense-sensibility'),

-- Charles Dickens
('Great Expectations', 'Coming-of-age story of orphan Pip', 9, 1, 1861, '978-0141439563', 'English', 544, TRUE, 'https://example.com/great-expectations'),
('A Tale of Two Cities', 'Historical novel set in London and Paris during revolution', 9, 6, 1859, '978-0141439600', 'English', 489, TRUE, 'https://example.com/tale-two-cities'),

-- Stephen King
('The Shining', 'Horror story about a family in an isolated hotel', 10, 7, 1977, '978-0307743657', 'English', 447, TRUE, 'https://example.com/the-shining'),
('It', 'Story about a shape-shifting monster terrorizing children', 10, 7, 1986, '978-1501142970', 'English', 1138, TRUE, 'https://example.com/it-novel'),

-- J.R.R. Tolkien
('The Lord of the Rings: Fellowship of the Ring', 'First volume of the epic fantasy trilogy', 11, 3, 1954, '978-0547928210', 'English', 423, TRUE, 'https://example.com/fellowship-ring'),
('The Hobbit', 'Fantasy adventure of Bilbo Baggins', 11, 3, 1937, '978-0547928227', 'English', 300, TRUE, 'https://example.com/the-hobbit'),

-- Isaac Asimov
('Foundation', 'Science fiction about the fall of a galactic empire', 12, 2, 1951, '978-0553293357', 'English', 255, TRUE, 'https://example.com/foundation'),
('I, Robot', 'Collection of stories about robots and AI', 12, 2, 1950, '978-0553382563', 'English', 253, TRUE, 'https://example.com/i-robot'),

-- Agatha Christie
('Murder on the Orient Express', 'Famous detective Hercule Poirot solves a murder', 13, 4, 1934, '978-0062693662', 'English', 274, TRUE, 'https://example.com/orient-express'),
('And Then There Were None', 'Mystery about guests dying one by one on an island', 13, 4, 1939, '978-0062073488', 'English', 272, TRUE, 'https://example.com/there-were-none'),

-- Dan Brown
('The Da Vinci Code', 'Thriller about a religious mystery and conspiracy', 14, 4, 2003, '978-0307474278', 'English', 489, TRUE, 'https://example.com/da-vinci-code'),
('Angels & Demons', 'Adventure involving the Illuminati and Vatican', 14, 4, 2000, '978-1416524793', 'English', 496, TRUE, 'https://example.com/angels-demons'),

-- Haruki Murakami
('Norwegian Wood', 'Story of love, loss, and mental health in 1960s Japan', 15, 15, 1987, '978-0375704024', 'English', 296, TRUE, 'https://example.com/norwegian-wood'),
('Kafka on the Shore', 'Surreal story blending fantasy and reality', 15, 3, 2002, '978-1400079278', 'English', 505, TRUE, 'https://example.com/kafka-shore');

-- Insert favorite books
INSERT INTO favorite_books (user_id, book_id) VALUES
(16, 1), (16, 3), (16, 7), (16, 15), (16, 19),
(17, 2), (17, 8), (17, 12), (17, 18), (17, 22),
(18, 5), (18, 9), (18, 14), (18, 20), (18, 25),
(1, 3), (2, 1), (3, 2), (4, 11), (5, 8);

-- Insert reading history
INSERT INTO reading_history (user_id, book_id, last_read_page, progress_percentage) VALUES
(16, 1, 245, 17.6), (16, 7, 150, 46.9), (16, 15, 89, 70.1),
(17, 2, 400, 46.3), (17, 8, 220, 68.8), (17, 18, 150, 55.6),
(18, 5, 280, 85.4), (18, 9, 180, 40.2), (18, 20, 95, 31.7);

-- Insert book sources
INSERT INTO book_sources (book_id, source_name, source_url, is_free) VALUES
(1, 'Amazon Kindle', 'https://amazon.com/war-and-peace', FALSE),
(1, 'Project Gutenberg', 'https://gutenberg.org/war-and-peace', TRUE),
(5, 'Amazon Kindle', 'https://amazon.com/1984', FALSE),
(5, 'Project Gutenberg', 'https://gutenberg.org/1984', TRUE),
(7, 'Amazon Kindle', 'https://amazon.com/harry-potter-1', FALSE),
(8, 'Amazon Kindle', 'https://amazon.com/harry-potter-3', FALSE),
(15, 'Amazon Kindle', 'https://amazon.com/great-gatsby', FALSE),
(15, 'Project Gutenberg', 'https://gutenberg.org/great-gatsby', TRUE),
(19, 'Amazon Kindle', 'https://amazon.com/game-of-thrones', FALSE),
(20, 'Amazon Kindle', 'https://amazon.com/clash-of-kings', FALSE);
