// src/index.js — Punto de entrada del servidor Express
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const clientesRoutes = require("./routes/clientes");
const deudasRoutes = require("./routes/deudas");
const abonosRoutes = require("./routes/abonos");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────────────────────

// Permite peticiones desde el frontend (localhost:3001 en dev, o el dominio real en producción)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true,  // necesario para que las cookies de sesión viajen
}));

app.use(express.json());

app.set("trust proxy", 1);

// Sesión basada en cookie httpOnly (nunca expone el token al JS del browser)
app.use(session({
  secret: process.env.SESSION_SECRET || "abonapp-secret-dev-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SECURE === "true" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  },
}));

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/deudas", deudasRoutes);
app.use("/api/abonos", abonosRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check para AWS
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Manejo de errores global
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor." });
});

// Solo abre el puerto cuando se ejecuta directamente (no al importarlo en pruebas).
if (require.main === module) {
  app.listen(PORT, () => console.log(`AbonApp backend escuchando en http://localhost:${PORT}`));
}

module.exports = app;
