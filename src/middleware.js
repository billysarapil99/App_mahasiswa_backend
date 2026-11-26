const jwt = require('jsonwebtoken');

// Memeriksa header: Authorization: Bearer <token>
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipe, token] = header.split(' ');

  if (tipe !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Sesi berakhir, silakan login lagi'
        : 'Token tidak valid';
    res.status(401).json({ message });
  }
};