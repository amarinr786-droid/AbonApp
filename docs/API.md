# Referencia de la API

API REST de AbonApp construida con Express. Todas las respuestas son JSON.

- **Producción:** `https://abonapp.tech/api`
- **Local:** `http://localhost:3000/api`

## Autenticación

La sesión viaja en una cookie `httpOnly` emitida por `express-session` al registrarse o iniciar sesión. El navegador la envía automáticamente; desde `fetch` hay que usar `credentials: "include"` (ya configurado en `abonapp/lib/api.ts`).

Las rutas marcadas con 🔒 requieren sesión activa. Si no la hay, responden `401`.

## Formato de error

```json
{ "message": "Descripción legible del problema" }
```

| Código | Significado |
|---|---|
| `400` | Datos faltantes o inválidos. |
| `401` | Sin sesión o credenciales incorrectas. |
| `404` | El recurso no existe o no pertenece al usuario. |
| `409` | Conflicto (correo duplicado, cliente con deudas, deuda con abonos). |
| `500` | Error inesperado del servidor. |

---

## Salud

### `GET /health`

```json
{ "status": "ok" }
```

---

## Autenticación

### `POST /auth/register`

Crea la cuenta e inicia sesión automáticamente.

```json
{ "nombre": "Ana Pérez", "email": "ana@example.com", "password": "secreto123" }
```

- `201` → `{ "id": 1, "nombre": "Ana Pérez", "email": "ana@example.com", "plan": "gratuito" }`
- `400` si falta un campo o la contraseña tiene menos de 6 caracteres.
- `409` si el correo ya existe.

### `POST /auth/login`

```json
{ "email": "ana@example.com", "password": "secreto123" }
```

- `200` → datos del usuario.
- `401` si el correo o la contraseña no coinciden.

### `POST /auth/logout`

Destruye la sesión. → `{ "ok": true }`

### 🔒 `GET /auth/me`

Devuelve el usuario de la sesión actual. → `{ "id", "nombre", "email", "plan" }`

### 🔒 `PUT /auth/perfil`

```json
{ "nombre": "Ana Gómez", "email": "ana.gomez@example.com" }
```

- `200` → usuario actualizado.
- `409` si el correo ya está en uso.

### 🔒 `PUT /auth/password`

```json
{ "actual": "secreto123", "nueva": "nuevaClave456" }
```

- `200` → `{ "ok": true }`
- `401` si la contraseña actual es incorrecta.

---

## Clientes

Todas requieren sesión. Cada usuario solo ve sus propios clientes.

### 🔒 `GET /clientes?q=`

`q` filtra por nombre (búsqueda parcial). → arreglo de clientes:

```json
[
  {
    "id": 1,
    "nombre": "María Gómez",
    "identificacion": "10203040",
    "telefono": "3001234567",
    "email": "maria@example.com",
    "creadoEn": "2026-11-20 10:15:00"
  }
]
```

### 🔒 `GET /clientes/:id`

→ cliente o `404`.

### 🔒 `POST /clientes`

```json
{ "nombre": "María Gómez", "identificacion": "10203040", "telefono": "3001234567", "email": "maria@example.com" }
```

`nombre` e `identificacion` son obligatorios. → `201` con el cliente creado.

### 🔒 `PUT /clientes/:id`

Mismos campos que la creación. → `200` con el cliente actualizado.

### 🔒 `DELETE /clientes/:id`

→ `{ "ok": true }`. Responde `409` si el cliente tiene deudas asociadas.

---

## Deudas

### 🔒 `GET /deudas?q=&estado=`

- `q`: filtra por nombre del cliente.
- `estado`: `pendiente`, `parcial` o `pagada`.

```json
[
  {
    "id": 3,
    "clienteId": 1,
    "cliente": "María Gómez",
    "descripcion": "Compra de contado",
    "valorInicial": 500000,
    "totalAbonado": 200000,
    "saldoPendiente": 300000,
    "estado": "parcial",
    "fechaLimite": "2026-12-15",
    "creadoEn": "2026-11-20 10:20:00"
  }
]
```

### 🔒 `GET /deudas/:id`

→ deuda con su historial de abonos:

```json
{ "id": 3, "...": "resto de campos", "abonos": [{ "id": 1, "deudaId": 3, "valor": 200000, "fecha": "2026-11-21", "observacion": "Transferencia" }] }
```

### 🔒 `POST /deudas`

```json
{ "clienteId": 1, "descripcion": "Compra de contado", "valorInicial": 500000, "fechaLimite": "2026-12-15" }
```

- `valorInicial` debe ser mayor a 0.
- El cliente debe pertenecer al usuario (`404` si no).
- → `201` con la deuda creada.

### 🔒 `PUT /deudas/:id`

```json
{ "descripcion": "Compra de contado (actualizada)", "fechaLimite": "2026-12-20" }
```

No permite modificar el valor inicial. → `200`.

### 🔒 `DELETE /deudas/:id`

Anula la deuda. → `{ "ok": true }`. Responde `409` si ya tiene abonos registrados.

---

## Abonos

### 🔒 `GET /abonos?q=&desde=&hasta=`

- `q`: filtra por nombre del cliente.
- `desde` / `hasta`: rango de fechas (`YYYY-MM-DD`).

```json
[
  { "id": 1, "deudaId": 3, "cliente": "María Gómez", "valor": 200000, "fecha": "2026-11-21", "observacion": "Transferencia" }
]
```

### 🔒 `POST /abonos`

```json
{ "deudaId": 3, "valor": 200000, "fecha": "2026-11-21", "observacion": "Transferencia" }
```

Al registrar el abono, el servidor recalcula en la misma operación:

- `total_abonado` → suma de abonos.
- `saldo_pendiente` → valor inicial − total abonado.
- `estado` → `pagada` si el saldo llega a 0, `parcial` si hay abonos, `pendiente` si no.

Reglas:

- `400` si `valor` es menor o igual a 0, o si **supera el saldo pendiente**.
- `404` si la deuda no existe o no pertenece al usuario.
- `409` si la deuda ya está pagada.

→ `201` con el abono creado.

---

## Dashboard

### 🔒 `GET /dashboard/resumen`

```json
{
  "clientes": 3,
  "totalDeudas": 1500000,
  "totalAbonado": 450000,
  "saldoPendiente": 1050000,
  "ultimasDeudas": [{ "id": 3, "cliente": "María Gómez", "saldoPendiente": 300000, "estado": "parcial" }],
  "ultimosAbonos": [{ "id": 1, "cliente": "María Gómez", "valor": 200000, "fecha": "2026-11-21" }]
}
```

`ultimasDeudas` y `ultimosAbonos` devuelven máximo 5 registros.

---

## Ejemplo con curl

```bash
# 1. Iniciar sesión y guardar la cookie
curl -c cookies.txt -X POST https://abonapp.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"secreto123"}'

# 2. Consultar el resumen usando la cookie
curl -b cookies.txt https://abonapp.tech/api/dashboard/resumen
```

## Códigos de estado usados por el frontend

El cliente de `abonapp/lib/api.ts` envía `credentials: "include"` y convierte cualquier respuesta no exitosa en un `ApiError` con su código HTTP. La protección de rutas la aplica `abonapp/app/dashboard/layout.tsx`, que redirige a `/login` cuando `AuthContext` no tiene usuario.
