// Pruebas de integración de la API con node:test (sin dependencias externas).
// Usan una base SQLite temporal para no tocar backend/abonapp.db.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "abonapp-test-"));
process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret";
process.env.COOKIE_SECURE = "false";

const app = require("../src/index");
const { db } = require("../src/db");

let server;
let base;
let cookie = "";

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function call(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  }
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test("health responde ok", async () => {
  const { status, data } = await call("GET", "/api/health");
  assert.equal(status, 200);
  assert.deepEqual(data, { status: "ok" });
});

test("registro, sesión y /me", async () => {
  const email = `test-${Date.now()}@abonapp.test`;
  const register = await call("POST", "/api/auth/register", {
    nombre: "Usuario de prueba",
    email,
    password: "secreto123",
  });
  assert.equal(register.status, 201);
  assert.equal(register.data.email, email);

  const me = await call("GET", "/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.data.nombre, "Usuario de prueba");
});

test("flujo cliente -> deuda -> abonos y recálculo de saldo", async () => {
  const cliente = await call("POST", "/api/clientes", {
    nombre: "Cliente Prueba",
    identificacion: "123456",
    telefono: "3000000000",
    email: "cliente@abonapp.test",
  });
  assert.equal(cliente.status, 201);

  const deuda = await call("POST", "/api/deudas", {
    clienteId: cliente.data.id,
    descripcion: "Préstamo de prueba",
    valorInicial: 100000,
  });
  assert.equal(deuda.status, 201);
  assert.equal(deuda.data.saldoPendiente, 100000);
  assert.equal(deuda.data.estado, "pendiente");

  const abono1 = await call("POST", "/api/abonos", {
    deudaId: deuda.data.id,
    valor: 40000,
    fecha: "2026-11-25",
  });
  assert.equal(abono1.status, 201);

  const parcial = await call("GET", `/api/deudas/${deuda.data.id}`);
  assert.equal(parcial.data.totalAbonado, 40000);
  assert.equal(parcial.data.saldoPendiente, 60000);
  assert.equal(parcial.data.estado, "parcial");

  const exceso = await call("POST", "/api/abonos", {
    deudaId: deuda.data.id,
    valor: 90000,
    fecha: "2026-11-25",
  });
  assert.equal(exceso.status, 400);

  const abono2 = await call("POST", "/api/abonos", {
    deudaId: deuda.data.id,
    valor: 60000,
    fecha: "2026-11-25",
  });
  assert.equal(abono2.status, 201);

  const pagada = await call("GET", `/api/deudas/${deuda.data.id}`);
  assert.equal(pagada.data.saldoPendiente, 0);
  assert.equal(pagada.data.estado, "pagada");

  const borrarCliente = await call("DELETE", `/api/clientes/${cliente.data.id}`);
  assert.equal(borrarCliente.status, 409);

  const borrarDeuda = await call("DELETE", `/api/deudas/${deuda.data.id}`);
  assert.equal(borrarDeuda.status, 409);
});
