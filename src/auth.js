const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

// Hash palsu: bcrypt tetap dijalankan walau username tidak ada,
// supaya waktu respons tidak membocorkan username mana yang terdaftar.
const HASH_PALSU = bcrypt.hashSync('tidak-dipakai', 10);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM admin WHERE username = ?',
      [username.trim()]
    );
    const admin = rows[0];

    const cocok = await bcrypt.compare(password, admin ? admin.password_hash : HASH_PALSU);
    if (!admin || !cocok) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;