# Bitácora de la entrega final

Registro del trabajo realizado para cerrar el Corte 3 de AbonApp. Sirve como soporte para el documento APA y para la sustentación: explica **qué se cambió, por qué y cómo se verificó**.

**Fecha de cierre técnico:** 25 de noviembre de 2026
**Repositorio:** <https://github.com/amarinr786-droid/AbonApp>
**Producción:** <https://abonapp.tech>

---

## 1. Punto de partida

Al iniciar el cierre, el repositorio tenía la aplicación funcionando en local, pero con problemas que impedían entregarla:

- El `README.md` contenía **marcadores de conflicto de Git** (`<<<<<<<`, `=======`, `>>>>>>>`) y no documentaba la arquitectura, el despliegue ni las capturas exigidas.
- El **dashboard mostraba "Ocurrió un error inesperado"** al iniciar sesión.
- Las **fechas se mostraban un día antes** de la registrada.
- No existían **pruebas automatizadas** ni **workflows de CI/CD**.
- No había una guía reproducible de despliegue en AWS.
- El despliegue anterior apuntaba a `http://34.228.142.100:3000/api`, una IP que ya no respondía, y servía el frontend desde un endpoint por defecto de S3 (HTTP, sin dominio propio).

---

## 2. Correcciones funcionales

### 2.1 Dashboard roto

El frontend llamaba a `GET /api/dashboard`, pero el backend expone `GET /api/dashboard/resumen`. La petición devolvía 404 y la interfaz mostraba el mensaje genérico de error.

- **Archivo:** `abonapp/lib/services/dashboardService.ts`
- **Cambio:** se corrigió la ruta a `/dashboard/resumen`.
- **Verificación:** el dashboard carga los indicadores (clientes, deudas, abonado, saldo) con los datos de ejemplo.

### 2.2 Fechas con un día de diferencia

`new Date("2026-11-20")` interpreta la cadena como UTC; al formatearla en zona horaria de Colombia (UTC-5) se mostraba el día anterior.

- **Archivo:** `abonapp/lib/format.ts`
- **Cambio:** se parsean los componentes `año-mes-día` como fecha local.
- **Verificación:** una deuda con fecha `2026-11-20` se muestra como **20 de nov**, no como 19.

---

## 3. Pruebas automatizadas

Se agregaron pruebas de API con el runner nativo `node:test`, sin dependencias adicionales, usando una base SQLite temporal por ejecución (`DB_PATH`).

- **Archivo:** `backend/tests/api.test.js`
- **Casos:**
  1. `GET /api/health` responde `{"status":"ok"}`.
  2. Registro, inicio de sesión y `GET /api/auth/me` con cookie de sesión.
  3. Flujo completo: crear cliente → crear deuda → registrar abonos → recálculo de `total_abonado`, `saldo_pendiente` y `estado`.

Para que las pruebas no abrieran un puerto real, `backend/src/index.js` ahora **exporta `app`** y solo ejecuta `listen()` cuando se arranca directamente. `backend/src/db.js` acepta `DB_PATH` y exporta la conexión.

Resultado: **3 pruebas, 3 correctas**.

---

## 4. Integración y despliegue continuo

### `.github/workflows/ci.yml`

Se ejecuta en `push` y `pull_request` sobre `main` y `dev`.

| Job | Qué valida |
|---|---|
| `frontend` | `npm ci`, `npm run lint`, build estático con `NEXT_PUBLIC_API_URL=/api` y publicación de `out/` como artefacto. |
| `backend` | `npm ci` y `npm test` sobre Node 24. |

### `.github/workflows/deploy.yml`

Se ejecuta al hacer `push` a `main` o manualmente.

| Job | Qué hace |
|---|---|
| `check-secrets` | Comprueba que exista `EC2_HOST`; si no, omite el despliegue con un aviso en lugar de fallar. |
| `deploy-frontend` | Compila con `/api`, copia `out/` por `scp`, publica con `rsync` en `/var/www/html`, recarga Apache y verifica `/api/health`. |
| `deploy-backend` | Entra por SSH, hace `git pull`, `npm ci --omit=dev`, `pm2 startOrReload` y verifica el puerto 3000. |

---

## 5. Infraestructura desplegada

La arquitectura final prioriza **un solo origen** para que la cookie de sesión funcione sin bloqueos del navegador:

```text
https://abonapp.tech
        │  HTTPS (Certbot / Let's Encrypt)
        ▼
Apache 2.4 · EC2 Ubuntu 24.04 · 13.223.119.131 (Elastic IP)
   ├── /*      → /var/www/html (export estático de Next.js)
   └── /api/*  → 127.0.0.1:3000 (Express + PM2)
                        └── SQLite (EBS)
```

Pasos ejecutados:

1. **Elastic IP** asociada a la instancia para que la IP pública no cambie al reiniciar el laboratorio.
2. **Security Group**: 22 restringido, 80 y 443 abiertos, 3000 cerrado al público.
3. **Node 24** y **PM2** con `backend/ecosystem.config.js` (`abonapp-api`).
4. **Apache** con `docs/apache-abonapp.conf`: `DocumentRoot /var/www/html`, `DirectoryIndex index.html`, `ErrorDocument 404 /404.html` y `ProxyPass /api`.
5. **DNS en Name.com**: `A @` y `A www` hacia la Elastic IP.
6. **Certbot**: certificado para `abonapp.tech` y `www.abonapp.tech`, con redirección HTTP → HTTPS.
7. `FRONTEND_URL=https://abonapp.tech` y `COOKIE_SECURE=true` en `backend/.env`.

Verificación externa:

```text
https://abonapp.tech/            → 200
https://www.abonapp.tech/        → 200
https://abonapp.tech/api/health  → 200 {"status":"ok"}
http://abonapp.tech/             → 301 → https://abonapp.tech/
Server: Apache/2.4.58 (Ubuntu)
```

---

## 6. Documentación

- **`README.md`** reescrito: descripción, flujo y control de acceso, arquitectura con diagrama Mermaid, tecnologías, estructura, Getting Started, build y despliegue, explicación de cada job de CI/CD, dominio/DNS/HTTPS, capturas y justificación de los servicios AWS.
- **`docs/DEPLOY.md`**: guía reproducible (EC2, Elastic IP, Security Group, Node, PM2, Apache, DNS, Certbot, secretos y solución de problemas).
- **`docs/apache-abonapp.conf`**: VirtualHost real usado en producción.
- **`docs/landing.png`, `docs/login.png`, `docs/dashboard.png`**: capturas reales de la aplicación.
- **`.env.example`** de frontend y backend actualizados; **`.nvmrc`** y `engines` fijan Node 24.

---

## 7. Commits principales

| Commit | Descripción |
|---|---|
| `b37a573` | Preparación de la entrega: CI/CD, pruebas, documentación y correcciones. |
| `e6b2100` | El despliegue se omite mientras no existan los secretos de AWS. |
| `a37422d` | Alineación de README, guía y workflow con la arquitectura Apache + EC2. |

---

## 8. Pendientes fuera del código

- Documento APA (entrega separada).
- README del perfil personal de GitHub.
- Completar el mínimo de PRs aprobados por integrante y los commits del tercer integrante.
- Configurar los secretos `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR` y `WEB_ROOT` para habilitar el despliegue automático.
