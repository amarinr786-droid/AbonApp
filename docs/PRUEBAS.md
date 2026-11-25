# Guía de pruebas

Cómo verificar que AbonApp funciona, tanto en local como en producción.

---

## 1. Pruebas automatizadas del backend

Se ejecutan con el runner nativo de Node (`node:test`), sin frameworks externos.

```bash
cd backend
npm test
```

Cada ejecución crea una base SQLite temporal (`DB_PATH`), por lo que **no toca** `backend/abonapp.db` ni los datos de producción. Al terminar, la carpeta temporal se elimina.

### Casos cubiertos

| # | Prueba | Qué valida |
|---|---|---|
| 1 | `health responde ok` | `GET /api/health` devuelve `200` y `{"status":"ok"}`. |
| 2 | `registro, sesión y /me` | `POST /api/auth/register` crea el usuario e inicia sesión; `GET /api/auth/me` devuelve el mismo usuario usando la cookie. |
| 3 | `flujo cliente -> deuda -> abonos y recálculo de saldo` | Crea cliente y deuda, registra dos abonos y verifica `total_abonado`, `saldo_pendiente` y `estado` tras cada uno. |

### Salida esperada

```text
✔ health responde ok
✔ registro, sesión y /me
✔ flujo cliente -> deuda -> abonos y recálculo de saldo
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Si una prueba falla, revisa primero que `node -v` sea **v24** (el backend usa `node:sqlite`).

---

## 2. Verificación del build del frontend

```bash
cd abonapp
npm run lint
NEXT_PUBLIC_API_URL=/api npm run build
```

En PowerShell:

```powershell
cd abonapp
$env:NEXT_PUBLIC_API_URL="/api"; npm run build
```

Criterios:

- `npm run lint` termina sin errores.
- El build genera **13 rutas estáticas**.
- Existe `abonapp/out/index.html` y `abonapp/out/404.html`.
- En `out/_next/static/` hay archivos `.js`, `.css` y fuentes.

> La variable `NEXT_PUBLIC_API_URL` queda incrustada en el JavaScript. Si el build se hizo sin ella, la app intentará llamar a `http://localhost:3000/api` y fallará en producción.

---

## 3. Pruebas manuales de la aplicación

Hazlas en una ventana de incógnito para partir sin sesión.

### 3.1 Landing y acceso

- [ ] `/` carga la landing (primera vista pública).
- [ ] Los botones **Iniciar sesión** y **Crear cuenta** llevan a `/login` y `/register`.
- [ ] `/dashboard` sin sesión redirige a `/login`.

### 3.2 Registro y sesión

- [ ] Registro con nombre, correo y contraseña (mínimo 6 caracteres) crea la cuenta y entra al dashboard.
- [ ] Registro con un correo ya existente muestra el mensaje de conflicto.
- [ ] Login con contraseña incorrecta muestra error y no entra.
- [ ] Al recargar el dashboard (**F5**) la sesión se mantiene.
- [ ] **Cerrar sesión** vuelve a la landing o al login y ya no permite entrar a `/dashboard`.

### 3.3 Clientes

- [ ] Crear cliente con nombre e identificación.
- [ ] La búsqueda filtra por nombre.
- [ ] Editar un cliente guarda los cambios.
- [ ] Eliminar un cliente **sin deudas** funciona.
- [ ] Eliminar un cliente **con deudas** se bloquea con un mensaje claro.

### 3.4 Deudas

- [ ] Crear deuda con cliente, descripción y valor mayor a 0.
- [ ] El filtro por estado (`pendiente`, `parcial`, `pagada`) funciona.
- [ ] La fecha límite se muestra en el día correcto (sin desfase de zona horaria).
- [ ] Editar descripción y fecha límite guarda los cambios.
- [ ] Anular una deuda **sin abonos** funciona; **con abonos** se bloquea.

### 3.5 Abonos

- [ ] Registrar un abono actualiza `total abonado`, `saldo pendiente` y el estado a `parcial`.
- [ ] Un abono por el saldo completo deja la deuda en `pagada`.
- [ ] Un abono mayor al saldo pendiente se rechaza.
- [ ] Registrar un abono sobre una deuda pagada se rechaza.
- [ ] Los filtros por cliente y por rango de fechas funcionan.

### 3.6 Dashboard

- [ ] El resumen muestra clientes, total en deudas, total abonado y saldo pendiente.
- [ ] Los últimos movimientos aparecen ordenados por fecha.
- [ ] No aparece el mensaje "Ocurrió un error inesperado".

### 3.7 Plan y configuración

- [ ] `/dashboard/plan` muestra el plan activo.
- [ ] Cambiar nombre y correo en `/dashboard/configuracion` se refleja en la sesión.
- [ ] Cambiar contraseña con la contraseña actual correcta funciona; con la incorrecta se rechaza.

---

## 4. Verificación en producción

Con el dominio desplegado:

```bash
curl -I https://abonapp.tech
curl -s https://abonapp.tech/api/health
curl -I http://abonapp.tech
```

Criterios:

- [ ] `https://abonapp.tech` responde `200` con `Server: Apache`.
- [ ] `https://abonapp.tech/api/health` responde `{"status":"ok"}`.
- [ ] `http://abonapp.tech` responde `301` hacia `https://abonapp.tech`.
- [ ] `https://www.abonapp.tech` también responde `200`.
- [ ] El certificado es válido (candado, sin advertencias).
- [ ] El login funciona y la sesión sobrevive a una recarga.

Si el login falla solo en producción, revisa en la EC2:

```bash
grep -E 'FRONTEND_URL|COOKIE_SECURE' ~/AbonApp/backend/.env
pm2 logs abonapp-api --lines 50
```

`COOKIE_SECURE` debe ser `true` cuando el sitio se sirve por HTTPS.

---

## 5. Pruebas de integración continua

En cada push o pull request, GitHub Actions ejecuta:

- **CI → frontend:** `npm ci`, `npm run lint` y build estático.
- **CI → backend:** `npm ci` y `npm test`.
- **Deploy:** solo si los secretos de EC2 están configurados.

El merge no debe hacerse si **CI** está en rojo.
