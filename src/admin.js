const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const router = express.Router();

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};

// GET /api/admin : daftar admin (tanpa password)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, created_at FROM admin ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /api/admin : tambah admin baru
router.post('/', async (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  const nama = username.trim();
  if (!/^[A-Za-z0-9_.-]{3,50}$/.test(nama)) {
    return res.status(400).json({
      message: 'Username 3-50 karakter: huruf, angka, titik, garis bawah, atau strip'
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password minimal 8 karakter' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admin (username, password_hash) VALUES (?, ?)',
      [nama, hash]
    );
    res.status(201).json({
      message: `Admin "${nama}" berhasil ditambahkan`,
      id: result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: `Username "${nama}" sudah dipakai` });
    }
    serverError(res, err);
  }
});

// DELETE /api/admin/:id : hapus admin
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (id === req.admin.id) {
    return res.status(400).json({ message: 'Anda tidak bisa menghapus akun Anda sendiri' });
  }

  try {
    const [result] = await pool.query('DELETE FROM admin WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin tidak ditemukan' });
    }
    res.json({ message: 'Admin berhasil dihapus' });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;