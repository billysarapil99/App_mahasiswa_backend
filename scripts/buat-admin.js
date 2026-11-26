require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const tanya = (pertanyaan) => new Promise((resolve) => rl.question(pertanyaan, resolve));

(async () => {
  try {
    const username = (await tanya('Username admin: ')).trim();
    const password = await tanya('Password admin (minimal 8 karakter): ');
    rl.close();

    if (!username || password.length < 8) {
      console.error('Username wajib diisi dan password minimal 8 karakter.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admin (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );
    console.log(`Admin "${username}" berhasil dibuat.`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('Username itu sudah ada.');
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
  await pool.end();
})();