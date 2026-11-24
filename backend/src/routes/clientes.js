// src/routes/clientes.js
const express = require("express");
const { run, get, all } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const SELECT = `SELECT id, nombre, identificacion, telefono, email, creado_en AS creadoEn FROM clientes`;

// GET /api/clientes?q=
router.get("/", async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const rows = await all(
      `${SELECT} WHERE usuario_id = ? AND nombre LIKE ? ORDER BY nombre`,
      [req.session.userId, `%${q}%`]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/clientes/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await get(`${SELECT} WHERE id = ? AND usuario_id = ?`, [req.params.id, req.session.userId]);
    if (!row) return res.status(404).json({ message: "Cliente no encontrado." });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/clientes
router.post("/", async (req, res, next) => {
  try {
    const { nombre, identificacion, telefono = "", email = "" } = req.body;
    if (!nombre || !identificacion)
      return res.status(400).json({ message: "Nombre e identificación son obligatorios." });

    const { lastInsertRowid } = await run(
      "INSERT INTO clientes (usuario_id, nombre, identificacion, telefono, email) VALUES (?, ?, ?, ?, ?)",
      [req.session.userId, nombre, identificacion, telefono, email]
    );
    res.status(201).json(await get(`${SELECT} WHERE id = ?`, [lastInsertRowid]));
  } catch (err) { next(err); }
});

// PUT /api/clientes/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { nombre, identificacion, telefono = "", email = "" } = req.body;
    if (!nombre || !identificacion)
      return res.status(400).json({ message: "Nombre e identificación son obligatorios." });

    const existing = await get("SELECT id FROM clientes WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    if (!existing) return res.status(404).json({ message: "Cliente no encontrado." });

    await run(
      "UPDATE clientes SET nombre = ?, identificacion = ?, telefono = ?, email = ? WHERE id = ? AND usuario_id = ?",
      [nombre, identificacion, telefono, email, req.params.id, req.session.userId]
    );
    res.json(await get(`${SELECT} WHERE id = ?`, [req.params.id]));
  } catch (err) { next(err); }
});

// DELETE /api/clientes/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await get("SELECT id FROM clientes WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    if (!existing) return res.status(404).json({ message: "Cliente no encontrado." });

    const conDeuda = await get("SELECT id FROM deudas WHERE cliente_id = ?", [req.params.id]);
    if (conDeuda) return res.status(409).json({ message: "No se puede eliminar un cliente con deudas asociadas." });

    await run("DELETE FROM clientes WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
