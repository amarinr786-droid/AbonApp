// src/sessionStore.js — Almacén de sesiones en SQLite
//
// express-session usa MemoryStore por defecto: las sesiones viven en RAM y se
// pierden en cada reinicio o deploy de PM2, sacando a todos los usuarios.
// Este store guarda la sesión en la misma base SQLite de la aplicación.
const session = require("express-session");
const { run, get } = require("./db");

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días, igual que la cookie

class SqliteSessionStore extends session.Store {
  constructor({ ttlMs = DEFAULT_TTL_MS } = {}) {
    super();
    this.ttlMs = ttlMs;

    // Limpia sesiones vencidas al arrancar. No bloquea el inicio si falla.
    run("DELETE FROM sesiones WHERE expires <= ?", [Date.now()]).catch((err) =>
      console.error("No se pudieron limpiar las sesiones vencidas:", err.message)
    );
  }

  get(sid, callback) {
    get("SELECT sess, expires FROM sesiones WHERE sid = ?", [sid])
      .then((row) => {
        if (!row) return callback(null, null);

        if (row.expires <= Date.now()) {
          return run("DELETE FROM sesiones WHERE sid = ?", [sid])
            .then(() => callback(null, null))
            .catch(callback);
        }

        let data;
        try {
          data = JSON.parse(row.sess);
        } catch {
          // Sesión corrupta: se descarta para que el usuario vuelva a iniciar sesión.
          return run("DELETE FROM sesiones WHERE sid = ?", [sid])
            .then(() => callback(null, null))
            .catch(callback);
        }

        callback(null, data);
      })
      .catch(callback);
  }

  set(sid, sess, callback) {
    const expires = this.#expiresOf(sess);

    run(
      `INSERT INTO sesiones (sid, sess, expires) VALUES (?, ?, ?)
       ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires`,
      [sid, JSON.stringify(sess), expires]
    )
      .then(() => callback?.(null))
      .catch((err) => callback?.(err));
  }

  touch(sid, sess, callback) {
    run("UPDATE sesiones SET expires = ? WHERE sid = ?", [this.#expiresOf(sess), sid])
      .then(() => callback?.(null))
      .catch((err) => callback?.(err));
  }

  destroy(sid, callback) {
    run("DELETE FROM sesiones WHERE sid = ?", [sid])
      .then(() => callback?.(null))
      .catch((err) => callback?.(err));
  }

  #expiresOf(sess) {
    const expires = sess?.cookie?.expires;
    return expires ? new Date(expires).getTime() : Date.now() + this.ttlMs;
  }
}

module.exports = SqliteSessionStore;
