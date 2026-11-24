// src/routes/abonos.js
const express = require("express");
const { run, get, all } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/abonos?q=&desde=&hasta=
router.get("/", async (req, res, next) => {
  try {
    const { q = "", desde = "", hasta = "" } = req.query;
    let sql = `
      SELECT a.id, a.deuda_id AS deudaId, c.nombre AS cliente,
             a.valor, a.fecha, a.observacion
      FROM abonos a
      JOIN deudas d ON d.id = a.deuda_id
      JOIN clientes c ON c.id = d.cliente_id
      WHERE a.usuario_id = ? AND c.nombre LIKE ?`;
    const params = [req.session.userId, `%${q}%`];
    if (desde) { sql += " AND a.fecha >= ?"; params.push(desde); }
    if (hasta) { sql += " AND a.fecha <= ?"; params.push(hasta); }
    sql += " ORDER BY a.fecha DESC, a.id DESC";
    res.json(await all(sql, params));
  } catch (err) { next(err); }
});

// POST /api/abonos
router.post("/", async (req, res, next) => {
  try {
    const { deudaId, valor, fecha, observacion } = req.body;
    if (!deudaId || !valor || !fecha)
      return res.status(400).json({ message: "deudaId, valor y fecha son obligatorios." });
    if (Number(valor) <= 0)
      return res.status(400).json({ message: "El valor del abono debe ser mayor a 0." });

    const deuda = await get("SELECT * FROM deudas WHERE id = ? AND usuario_id = ?", [deudaId, req.session.userId]);
    if (!deuda) return res.status(404).json({ message: "Deuda no encontrada." });
    if (deuda.estado === "pagada") return res.status(409).json({ message: "La deuda ya está pagada." });
    if (Number(valor) > deuda.saldo_pendiente)
      return res.status(400).json({ message: `El abono supera el saldo pendiente ($${deuda.saldo_pendiente}).` });

    // Crear abono y actualizar deuda
    const { lastInsertRowid } = await run(
      "INSERT INTO abonos (usuario_id, deuda_id, valor, fecha, observacion) VALUES (?, ?, ?, ?, ?)",
      [req.session.userId, deudaId, Number(valor), fecha, observacion || null]
    );

    const nuevoTotal = deuda.total_abonado + Number(valor);
    const nuevoSaldo = deuda.saldo_pendiente - Number(valor);
    const nuevoEstado = nuevoSaldo <= 0 ? "pagada" : nuevoTotal > 0 ? "parcial" : "pendiente";
    await run(
      "UPDATE deudas SET total_abonado = ?, saldo_pendiente = ?, estado = ? WHERE id = ?",
      [nuevoTotal, nuevoSaldo, nuevoEstado, deudaId]
    );

    const abono = await get(
      `SELECT a.id, a.deuda_id AS deudaId, c.nombre AS cliente, a.valor, a.fecha, a.observacion
       FROM abonos a JOIN deudas d ON d.id = a.deuda_id JOIN clientes c ON c.id = d.cliente_id
       WHERE a.id = ?`,
      [lastInsertRowid]
    );
    res.status(201).json(abono);
  } catch (err) { next(err); }
});

module.exports = router;
