// BAGIAN 1: baca file .env
require('dotenv').config();

// BAGIAN 2: impor mysql2
const mysql = require('mysql2/promise');

// BAGIAN 3: buat pool dan isi pengaturannya
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true
});

// BAGIAN 4: ekspor supaya bisa dipakai file lain
module.exports = pool;