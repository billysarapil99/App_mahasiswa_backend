require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./auth');
const adminRoutes = require('./admin'); // BARU
const requireAuth = require('./middleware');
const routes = require('./routes');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET belum diisi di file .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Publik: cek server dan login
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);

// Dilindungi: kelola admin (harus di atas /api)
app.use('/api/admin', requireAuth, adminRoutes); // BARU

// Dilindungi: semua endpoint mahasiswa wajib token
app.use('/api', requireAuth, routes);

// Endpoint tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Penanganan error (termasuk JSON yang rusak)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON tidak valid' });
  }
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error('Server gagal berjalan:', err.message);
    process.exit(1);
  }
  console.log(`Server berjalan di http://localhost:${PORT}`);
});