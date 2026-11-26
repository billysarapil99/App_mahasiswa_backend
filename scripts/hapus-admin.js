require('dotenv').config();
const readline = require('readline');
const pool = require('../src/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const tanya = (pertanyaan) => new Promise((resolve) => rl.question(pertanyaan, resolve));

(async () => {
  try {
    const [daftar] = await pool.query('SELECT id, username FROM admin ORDER BY id');
    if (daftar.length === 0) {
      console.log('Belum ada admin.');
      rl.close();
      return await pool.end();
    }

    console.log('Daftar admin:');
    daftar.forEach((a) => console.log(`  ${a.id}. ${a.username}`));

    if (daftar.length === 1) {
      console.error('\nIni satu-satunya admin. Buat admin pengganti dulu agar tidak terkunci.');
      rl.close();
      return await pool.end();
    }

    const username = (await tanya('\nUsername yang dihapus: ')).trim();
    const yakin = (await tanya(`Ketik "hapus" untuk menghapus "${username}": `)).trim();
    rl.close();

    if (yakin !== 'hapus') {
      console.log('Dibatalkan.');
      return await pool.end();
    }

    const [result] = await pool.query('DELETE FROM admin WHERE username = ?', [username]);
    console.log(
      result.affectedRows ? `Admin "${username}" dihapus.` : 'Username tidak ditemukan.'
    );
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
  await pool.end();
})();