// src/db.js — Inicializa SQLite usando el módulo nativo node:sqlite (Node >= 22.5 / 24)
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "abonapp.db");
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// ── Helpers compatibles con async/await ─────────────────────────────────────

/** Ejecutar sentencias sin retorno (INSERT, UPDATE, DELETE) */
async function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return {
    lastInsertRowid: Number(info.lastInsertRowid),
    changes: Number(info.changes),
  };
}

/** Obtener una fila */
async function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params) ?? null;
}

/** Obtener múltiples filas */
async function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params) ?? [];
}

// ── Crear tablas ─────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre    TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    plan      TEXT NOT NULL DEFAULT 'gratuito',
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre         TEXT NOT NULL,
    identificacion TEXT NOT NULL,
    telefono       TEXT NOT NULL DEFAULT '',
    email          TEXT NOT NULL DEFAULT '',
    creado_en      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS deudas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
    descripcion     TEXT NOT NULL,
    valor_inicial   REAL NOT NULL,
    total_abonado   REAL NOT NULL DEFAULT 0,
    saldo_pendiente REAL NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'pendiente',
    fecha_limite    TEXT,
    creado_en       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS abonos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    deuda_id    INTEGER NOT NULL REFERENCES deudas(id),
    valor       REAL NOT NULL,
    fecha       TEXT NOT NULL DEFAULT (date('now')),
    observacion TEXT
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    sid     TEXT PRIMARY KEY,
    sess    TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
`);

console.log("✅ Base de datos lista:", DB_PATH);

module.exports = { run, get, all, db };
