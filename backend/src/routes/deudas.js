// src/routes/deudas.js
const express = require("express");
const { run, get, all } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const SELECT_DEUDA = `
  SELECT d.id, d.cliente_id AS clienteId, c.nombre AS cliente,
         d.descripcion, d.valor_inicial AS valorInicial,
         d.total_abonado AS totalAbonado, d.saldo_pendiente AS saldoPendiente,
         d.estado, d.fecha_limite AS fechaLimite, d.creado_en AS creadoEn
  FROM deudas d JOIN clientes c ON c.id = d.cliente_id`;

// GET /api/deudas?q=&estado=
router.get("/", async (req, res, next) => {
  try {
    const { q = "", estado = "" } = req.query;
    let sql = `${SELECT_DEUDA} WHERE d.usuario_id = ? AND c.nombre LIKE ?`;
    const params = [req.session.userId, `%${q}%`];
    if (estado) { sql += " AND d.estado = ?"; params.push(estado); }
    sql += " ORDER BY d.creado_en DESC";
    res.json(await all(sql, params));
  } catch (err) { next(err); }
});

// GET /api/deudas/:id
router.get("/:id", async (req, res, next) => {
  try {
    const d = await get(`${SELECT_DEUDA} WHERE d.id = ? AND d.usuario_id = ?`, [req.params.id, req.session.userId]);
    if (!d) return res.status(404).json({ message: "Deuda no encontrada." });
    const abonos = await all(
      "SELECT id, deuda_id AS deudaId, valor, fecha, observacion FROM abonos WHERE deuda_id = ? ORDER BY fecha DESC",
      [req.params.id]
    );
    res.json({ ...d, abonos });
  } catch (err) { next(err); }
});

// POST /api/deudas
router.post("/", async (req, res, next) => {
  try {
    const { clienteId, descripcion, valorInicial, fechaLimite } = req.body;
    if (!clienteId || !descripcion || !valorInicial)
      return res.status(400).json({ message: "clienteId, descripcion y valorInicial son obligatorios." });
    if (Number(valorInicial) <= 0)
      return res.status(400).json({ message: "El valor inicial debe ser mayor a 0." });

    const cliente = await get("SELECT id FROM clientes WHERE id = ? AND usuario_id = ?", [clienteId, req.session.userId]);
    if (!cliente) return res.status(404).json({ message: "Cliente no encontrado." });

    const { lastInsertRowid } = await run(
      `INSERT INTO deudas (usuario_id, cliente_id, descripcion, valor_inicial, saldo_pendiente, fecha_limite)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.session.userId, clienteId, descripcion, valorInicial, valorInicial, fechaLimite || null]
    );
    res.status(201).json(await get(`${SELECT_DEUDA} WHERE d.id = ?`, [lastInsertRowid]));
  } catch (err) { next(err); }
});

// PUT /api/deudas/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { descripcion, fechaLimite } = req.body;
    const existing = await get("SELECT id FROM deudas WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    if (!existing) return res.status(404).json({ message: "Deuda no encontrada." });

    await run(
      "UPDATE deudas SET descripcion = COALESCE(?, descripcion), fecha_limite = ? WHERE id = ? AND usuario_id = ?",
      [descripcion || null, fechaLimite || null, req.params.id, req.session.userId]
    );
    res.json(await get(`${SELECT_DEUDA} WHERE d.id = ?`, [req.params.id]));
  } catch (err) { next(err); }
});

// DELETE /api/deudas/:id  (anular — solo si no tiene abonos)
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await get("SELECT id FROM deudas WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    if (!existing) return res.status(404).json({ message: "Deuda no encontrada." });

    const tieneAbonos = await get("SELECT id FROM abonos WHERE deuda_id = ?", [req.params.id]);
    if (tieneAbonos) return res.status(409).json({ message: "No se puede anular una deuda con abonos registrados." });

    await run("DELETE FROM deudas WHERE id = ? AND usuario_id = ?", [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
