// src/routes/dashboard.js
const express = require("express");
const { get, all } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/resumen
router.get("/resumen", async (req, res, next) => {
  try {
    const uid = req.session.userId;

    const { n: clientes } = await get("SELECT COUNT(*) AS n FROM clientes WHERE usuario_id = ?", [uid]);
    const deudas = await get(
      "SELECT SUM(valor_inicial) AS td, SUM(total_abonado) AS ta, SUM(saldo_pendiente) AS sp FROM deudas WHERE usuario_id = ?",
      [uid]
    );
    const ultimasDeudas = await all(
      `SELECT d.id, c.nombre AS cliente, d.saldo_pendiente AS saldoPendiente, d.estado
       FROM deudas d JOIN clientes c ON c.id = d.cliente_id
       WHERE d.usuario_id = ? ORDER BY d.creado_en DESC LIMIT 5`,
      [uid]
    );
    const ultimosAbonos = await all(
      `SELECT a.id, c.nombre AS cliente, a.valor, a.fecha
       FROM abonos a JOIN deudas d ON d.id = a.deuda_id JOIN clientes c ON c.id = d.cliente_id
       WHERE a.usuario_id = ? ORDER BY a.fecha DESC, a.id DESC LIMIT 5`,
      [uid]
    );

    res.json({
      clientes,
      totalDeudas: deudas.td ?? 0,
      totalAbonado: deudas.ta ?? 0,
      saldoPendiente: deudas.sp ?? 0,
      ultimasDeudas,
      ultimosAbonos,
    });
  } catch (err) { next(err); }
});

module.exports = router;
