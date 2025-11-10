// 1. АБСТРАКЦИЯ (через наследование и полиморфизм)
class BookStatus {
    getStatus() {
        throw new Error("Метод getStatus должен быть реализован");
    }
    canBorrow() {
        throw new Error("Метод canBorrow должен быть реализован");
    }
}

// 2. НАСЛЕДОВАНИЕ
class AvailableStatus extends BookStatus {
    getStatus() {
        return "Available";
    }

    canBorrow() {
        return true;
    }
}

class BorrowedStatus extends BookStatus {
    constructor(borrower) {
        super();
        this._borrower = borrower;
    }

    getStatus() {
        return `Borrowed by ${this._borrower}`;
    }

    canBorrow() {
        return false;
    }
}

class ReservedStatus extends BookStatus {
    getStatus() {
        return "Reserved";
    }

    canBorrow() {
        return false;
    }
}

// 3. ИНКАПСУЛЯЦИЯ
class LibraryBook {
    constructor(bookData) {
        this.id = bookData.id;
        this.title = bookData.title;
        this.author = bookData.author_name;
        this.description = bookData.description;
        this.cover_image_url = bookData.cover_image_url;
        this._status = this.createStatus(bookData.status, bookData.borrower_name);
    }

    createStatus(status, borrowerName) {
        switch (status) {
            case 'available':
                return new AvailableStatus();
            case 'borrowed':
                return new BorrowedStatus(borrowerName);
            case 'reserved':
                return new ReservedStatus();
            default:
                return new AvailableStatus();
        }
    }

    borrow(userName) {
        if (this._status.canBorrow()) {
            this._status = new BorrowedStatus(userName);
            return `Книга '${this.title}' выдана ${userName}`;
        }
        return `Cannot borrow: ${this._status.getStatus()}`;
    }

    returnBook() {
        this._status = new AvailableStatus();
        return `Книга '${this.title}' возвращена`;
    }

    // 4. ПОЛИМОРФИЗМ
    getStatusInfo() {
        return this._status.getStatus();
    }

    canBorrow() {
        return this._status.canBorrow();
    }


    toJSON() {
        return {
            id: this.id,
            title: this.title,
            author_name: this.author,
            description: this.description,
            cover_image_url: this.cover_image_url,
            status: this.getStatusInfo(),
            can_borrow: this.canBorrow()
        };
    }
}

module.exports = { LibraryBook, AvailableStatus, BorrowedStatus, ReservedStatus };