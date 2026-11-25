const express = require('express');
const pool = require('./db');

const router = express.Router();
const FIELDS = ['nim', 'nama', 'alamat', 'tgl_lahir', 'jurusan'];

// Cek kelengkapan data. Mengembalikan pesan error, atau null jika valid.
function validate(body) {
  const missing = FIELDS.filter((f) => !String(body[f] ?? '').trim());
  if (missing.length) return `Field wajib diisi: ${missing.join(', ')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.tgl_lahir)) {
    return 'Format tgl_lahir harus YYYY-MM-DD';
  }
  return null;
}

// READ: semua mahasiswa
router.get('/mahasiswa', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mahasiswa ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// READ: satu mahasiswa berdasarkan id
router.get('/mahasiswa/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mahasiswa WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// CREATE: tambah mahasiswa
router.post('/mahasiswa', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });

  const { nim, nama, alamat, tgl_lahir, jurusan } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO mahasiswa (nim, nama, alamat, tgl_lahir, jurusan) VALUES (?, ?, ?, ?, ?)',
      [nim.trim(), nama.trim(), alamat.trim(), tgl_lahir, jurusan.trim()]
    );
    res.status(201).json({
      message: 'Mahasiswa berhasil ditambahkan',
      id: result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: `NIM ${nim} sudah terdaftar` });
    }
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// UPDATE: ubah data mahasiswa berdasarkan id
router.put('/mahasiswa/:id', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });

  const { nim, nama, alamat, tgl_lahir, jurusan } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE mahasiswa SET nim = ?, nama = ?, alamat = ?, tgl_lahir = ?, jurusan = ? WHERE id = ?',
      [nim.trim(), nama.trim(), alamat.trim(), tgl_lahir, jurusan.trim(), req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
    }
    res.json({ message: 'Data mahasiswa berhasil diperbarui' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: `NIM ${nim} sudah dipakai mahasiswa lain` });
    }
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// DELETE: hapus mahasiswa berdasarkan id
router.delete('/mahasiswa/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM mahasiswa WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
    }
    res.json({ message: 'Mahasiswa berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// CREATE: tambah banyak mahasiswa sekaligus (body berupa array)
router.post('/mahasiswa/bulk', async (req, res) => {
  const list = req.body;

  if (!Array.isArray(list) || list.length === 0) {
    return res.status(400).json({ message: 'Body harus berupa array yang tidak kosong' });
  }

  // Validasi tiap data, sebutkan urutan data yang bermasalah
  for (let i = 0; i < list.length; i++) {
    const error = validate(list[i]);
    if (error) {
      return res.status(400).json({ message: `Data ke-${i + 1}: ${error}` });
    }
  }

  // Cek NIM kembar di dalam kiriman itu sendiri
  const nims = list.map((m) => m.nim.trim());
  if (new Set(nims).size !== nims.length) {
    return res.status(400).json({ message: 'Ada NIM yang kembar di dalam data yang dikirim' });
  }

  const values = list.map((m) => [
    m.nim.trim(), m.nama.trim(), m.alamat.trim(), m.tgl_lahir, m.jurusan.trim()
  ]);

  try {
    const [result] = await pool.query(
      'INSERT INTO mahasiswa (nim, nama, alamat, tgl_lahir, jurusan) VALUES ?',
      [values]
    );
    res.status(201).json({
      message: `${result.affectedRows} mahasiswa berhasil ditambahkan`
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ada NIM yang sudah terdaftar. Tidak ada data yang disimpan.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;