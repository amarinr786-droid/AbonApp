// src/middleware/auth.js — Verifica que haya una sesión activa
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "No autenticado. Inicia sesión." });
  }
  next();
}

module.exports = { requireAuth };
