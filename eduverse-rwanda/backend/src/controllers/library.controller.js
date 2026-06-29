const pool = require('../config/database');
const { success, paginate } = require('../utils/response.utils');

const getBooks = async (req, res) => {
  const { page = 1, limit = 20, search, category } = req.query;
  const offset = (page - 1) * limit;
  const params = [req.user.school_id];
  const where = ['school_id=$1'];
  if (search) { params.push(`%${search}%`); where.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length})`); }
  if (category) { params.push(category); where.push(`category=$${params.length}`); }

  const countRes = await pool.query(`SELECT COUNT(*) FROM books WHERE ${where.join(' AND ')}`, params);
  params.push(limit, offset);
  const { rows } = await pool.query(`SELECT * FROM books WHERE ${where.join(' AND ')} ORDER BY title LIMIT $${params.length-1} OFFSET $${params.length}`, params);
  paginate(res, rows, parseInt(countRes.rows[0].count), page, limit);
};

const addBook = async (req, res) => {
  const { title, author, isbn, category, publisher, published_year, total_copies, description, cover_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO books (school_id, title, author, isbn, category, publisher, published_year, total_copies, available_copies, description, cover_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10) RETURNING *`,
    [req.user.school_id, title, author, isbn, category, publisher, published_year, total_copies, description, cover_url]
  );
  success(res, rows[0], 'Book added', 201);
};

const borrowBook = async (req, res) => {
  const { user_id, due_date } = req.body;
  const { rows: [book] } = await pool.query('SELECT * FROM books WHERE id=$1', [req.params.id]);
  if (!book || book.available_copies < 1) return res.status(400).json({ error: 'Book not available' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE books SET available_copies=available_copies-1 WHERE id=$1', [req.params.id]);
    const { rows } = await client.query(
      `INSERT INTO book_borrowings (school_id, book_id, user_id, due_date) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.school_id, req.params.id, user_id, due_date]
    );
    await client.query('COMMIT');
    success(res, rows[0], 'Book borrowed');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const returnBook = async (req, res) => {
  const { rows: [borrow] } = await pool.query('SELECT * FROM book_borrowings WHERE id=$1', [req.params.borrowId]);
  if (!borrow) return res.status(404).json({ error: 'Borrowing record not found' });

  const today = new Date();
  const due = new Date(borrow.due_date);
  const overdueDays = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
  const fine = overdueDays * 100; // 100 RWF per day

  await pool.query(`UPDATE book_borrowings SET returned_date=NOW(), fine_amount=$1, status='returned' WHERE id=$2`, [fine, req.params.borrowId]);
  await pool.query('UPDATE books SET available_copies=available_copies+1 WHERE id=$1', [borrow.book_id]);
  success(res, { fine_amount: fine }, 'Book returned');
};

module.exports = { getBooks, addBook, borrowBook, returnBook };
