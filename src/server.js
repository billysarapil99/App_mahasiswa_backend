require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');        // <-- BARIS 1 (tambahan)

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Route cek server
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);                   // <-- BARIS 2 (tambahan)

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});