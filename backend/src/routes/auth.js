// src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { run, get } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, email, password, plan = "gratuito" } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    if (password.length < 6)
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });

    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid } = await run(
      "INSERT INTO usuarios (nombre, email, password, plan) VALUES (?, ?, ?, ?)",
      [nombre, email.toLowerCase().trim(), hash, plan]
    );
    const user = await get("SELECT id, nombre, email, plan FROM usuarios WHERE id = ?", [lastInsertRowid]);
    req.session.userId = user.id;
    res.status(201).json(user);
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ message: "Ya existe una cuenta con ese correo." });
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });

    const user = await get("SELECT * FROM usuarios WHERE email = ?", [email.toLowerCase().trim()]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });

    req.session.userId = user.id;
    res.json({ id: user.id, nombre: user.nombre, email: user.email, plan: user.plan });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await get("SELECT id, nombre, email, plan FROM usuarios WHERE id = ?", [req.session.userId]);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/auth/perfil
router.put("/perfil", requireAuth, async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ message: "Nombre y correo son obligatorios." });

    await run("UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?",
      [nombre, email.toLowerCase().trim(), req.session.userId]);
    const user = await get("SELECT id, nombre, email, plan FROM usuarios WHERE id = ?", [req.session.userId]);
    res.json(user);
  } catch (err) {
    if (err.message?.includes("UNIQUE")) return res.status(409).json({ message: "Ese correo ya está en uso." });
    next(err);
  }
});

// PUT /api/auth/password
router.put("/password", requireAuth, async (req, res, next) => {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) return res.status(400).json({ message: "Ambas contraseñas son obligatorias." });
    if (nueva.length < 6) return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres." });

    const user = await get("SELECT * FROM usuarios WHERE id = ?", [req.session.userId]);
    if (!bcrypt.compareSync(actual, user.password))
      return res.status(401).json({ message: "La contraseña actual es incorrecta." });

    const hash = bcrypt.hashSync(nueva, 10);
    await run("UPDATE usuarios SET password = ? WHERE id = ?", [hash, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
