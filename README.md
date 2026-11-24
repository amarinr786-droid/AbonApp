# # Tecnologías utilizadas en AbonApp

AbonApp está dividida en dos partes desacopladas: un **frontend estático** (pensado para servirse desde Amazon S3) y un **backend REST** ligero con base de datos embebida (pensado para ejecutarse en Amazon EC2).

---

## 1. Frontend (`abonapp/`)

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| **Next.js** | `16.4.6` | Framework principal con **App Router**, compilador **Turbopack** y exportación estática (`output: "export"`, `trailingSlash: true`) para generar la carpeta `out/`. |
| **React / React DOM** | `19.3.0` | Construcción de interfaces de usuario, formularios, modales y manejo de estado local. |
| **TypeScript** | `^5` | Tipado estático para modelos (`Usuario`, `Cliente`, `Deuda`, `Abono`, `ResumenDashboard`) y servicios de API. |
| **Tailwind CSS** | `4.3.3` | Estilizado responsivo mediante clases utilitarias, integrado con `@tailwindcss/turbopack` (`4.3.3`). |
| **ESLint** | `^9` | Análisis estático y reglas de calidad de código con `eslint-config-next` (`16.4.6`). |
| **React Context API** | Integrado | Gestión global de la sesión del usuario autenticado (`AuthContext`) sin librerías externas. |
| **Fetch API** | Nativo del navegador | Cliente HTTP centralizado en `lib/api.ts` con envío automático de cookies (`credentials: "include"`). |
| **Google Fonts (`Geist`)** | `next/font/google` | Tipografías `Geist` y `Geist_Mono` cargadas de forma optimizada en el layout raíz. |

---

## 2. Backend (`backend/`)

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| **Node.js** | `v24+` | Entorno de ejecución JavaScript del lado del servidor. |
| **Express** | `^4.19.2` | Framework web para definir la API REST (`/api/auth`, `/api/clientes`, `/api/deudas`, `/api/abonos`, `/api/dashboard`, `/api/health`). |
| **SQLite (`node:sqlite`)** | Nativo de Node.js | Base de datos relacional embebida en un único archivo (`abonapp.db`) usando `DatabaseSync`, modo `WAL` y claves foráneas activas (`PRAGMA foreign_keys = ON`). |
| **express-session** | `^1.18.0` | Manejo de sesiones en servidor basadas en cookies `httpOnly` (no expone tokens al JavaScript del navegador). |
| **bcryptjs** | `^2.4.3` | Encriptación (hashing con salt) y verificación segura de contraseñas de usuario. |
| **cors** | `^2.8.5` | Configuración de acceso cruzado para permitir peticiones con credenciales desde el dominio del frontend (`FRONTEND_URL`). |

---

## 3. Infraestructura y Despliegue (AWS)

| Servicio | Rol en la arquitectura |
|---|---|
| **Amazon S3** | Alojamiento del sitio web estático generado en `abonapp/out/` tras ejecutar `npm run build`. |
| **Amazon EC2** | Instancia Linux (Ubuntu) donde corre el servidor Express con **PM2** y persiste el archivo SQLite `abonapp.db`. |
| **Git & GitHub** | Control de versiones y flujo de ramas / Pull Requests (`feature/static-export-s3`). |
