/* ============================================
   controllers/bookController.js
   Full CRUD for Books (Admin only)
   ============================================ */
const Book = require('../models/Book');

/* ── GET /api/books?search=&category=&page=&limit= ── */
exports.getAllBooks = async(req, res) => {
    try {
        const { search = '', category = '', page = 1, limit = 20 } = req.query;

        const query = {};

        // Full-text search on name and author
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by category
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Book.countDocuments(query);
        const books = await Book.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            books,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ── GET /api/books/:id ── */
exports.getBookById = async(req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
        res.json({ success: true, book });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ── POST /api/books ── (Admin) */
exports.addBook = async(req, res) => {
    try {
        const { name, author, category, quantity } = req.body;

        if (!name || !author || !category || !quantity) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive number.' });
        }

        const book = await Book.create({
            name,
            author,
            category,
            quantity: qty,
            availableQuantity: qty,
        });

        res.status(201).json({ success: true, message: 'Book added successfully.', book });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ── PUT /api/books/:id ── (Admin) */
exports.updateBook = async(req, res) => {
    try {
        const { name, author, category, quantity } = req.body;

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

        const newQty = parseInt(quantity) || book.quantity;
        const issuedQty = book.quantity - book.availableQuantity; // copies currently out
        const newAvailable = Math.max(0, newQty - issuedQty);

        const updated = await Book.findByIdAndUpdate(
            req.params.id, {
                name: name || book.name,
                author: author || book.author,
                category: category || book.category,
                quantity: newQty,
                availableQuantity: newAvailable,
            }, { new: true, runValidators: true }
        );

        res.json({ success: true, message: 'Book updated successfully.', book: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ── POST /api/books/bulk ── (Admin: import many books at once) */
exports.bulkImportBooks = async(req, res) => {
    try {
        const { books } = req.body;

        if (!Array.isArray(books) || books.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide a non-empty "books" array.' });
        }

        const results = { inserted: 0, skipped: 0, errors: [] };
        const inserted = [];

        for (const book of books) {
            try {
                const { name, author, category, quantity } = book;

                if (!name || !author || !category || !quantity) {
                    results.skipped++;
                    results.errors.push(`Skipped "${name || 'unnamed'}": missing required fields.`);
                    continue;
                }

                const qty = parseInt(quantity);
                const existing = await Book.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
                if (existing) {
                    results.skipped++;
                    results.errors.push(`Skipped "${name}": already exists.`);
                    continue;
                }

                const newBook = await Book.create({
                    name,
                    author,
                    category,
                    quantity: qty,
                    availableQuantity: qty,
                });

                inserted.push(newBook);
                results.inserted++;
            } catch (err) {
                results.skipped++;
                results.errors.push(`Error on "${book.name}": ${err.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk import done. ${results.inserted} inserted, ${results.skipped} skipped.`,
            results,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ── DELETE /api/books/:id ── (Admin) */
exports.deleteBook = async(req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

        // Prevent deletion if copies are currently issued
        if (book.availableQuantity < book.quantity) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete book — some copies are currently issued to students.',
            });
        }

        await book.deleteOne();
        res.json({ success: true, message: 'Book deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};