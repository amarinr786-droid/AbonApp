# Guía de despliegue en AWS

Objetivo: publicar AbonApp en `https://abonapp.tu-dominio.com` con el frontend en S3, la API en EC2 y CloudFront uniendo ambos bajo el mismo origen (necesario para que la cookie de sesión funcione).

```text
Navegador
   │ HTTPS
   ▼
CloudFront (ACM + dominio propio)
   ├── /*      → S3 (sitio estático out/)
   └── /api/*  → EC2 :3000 (Express + PM2)
                        │
                        └── SQLite (EBS)
```

> **Requisito de la rúbrica:** la URL final debe ser un dominio propio con DNS configurado. No uses IP, puertos, `localhost` ni dominios por defecto de Netlify/Vercel.

---

## 0. Antes de empezar

- Cuenta de **AWS Academy** con el laboratorio iniciado (las credenciales caducan).
- Dominio adquirido con el GitHub Student Developer Pack (Namecheap, Name.com, `.tech`, etc.).
- Node.js 24 en la instancia EC2.
- Repositorio clonado en EC2 y acceso SSH con el key pair.

---

## 1. S3 para el frontend

1. Crea un bucket, por ejemplo `abonapp-frontend-TU-NOMBRE`, en la región `us-east-1`.
2. Desactiva el bloqueo de acceso público solo si vas a usar el endpoint de sitio web estático:
   - **Properties → Static website hosting → Enable**.
   - Index document: `index.html`.
   - Error document: `404.html`.
3. Añade esta bucket policy (sitio público de solo lectura; no hay secretos en el frontend):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::abonapp-frontend-TU-NOMBRE/*"
  }]
}
```

4. Anota el endpoint de sitio web:
   `http://abonapp-frontend-TU-NOMBRE.s3-website-us-east-1.amazonaws.com`

> Con CloudFront delante, los usuarios nunca ven este endpoint: solo ven tu dominio.

---

## 2. EC2 para el backend

1. Lanza una instancia **Ubuntu 24.04**, tipo `t2.micro` o `t3.micro`.
2. Security Group:
   - SSH (22) desde tu IP.
   - Puerto **3000** desde el prefijo administrado de CloudFront (`com.amazonaws.global.cloudfront.origin-facing`). Si tu cuenta no permite prefijos administrados, limita temporalmente a `0.0.0.0/0` y documenta el riesgo; la API sigue protegida por login.
3. Instala Node 24 y PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
node -v   # debe ser v24.x
```

4. Clona el repositorio y configura el backend:

```bash
git clone https://github.com/amarinr786-droid/AbonApp.git
cd AbonApp/backend
npm ci --omit=dev
cp .env.example .env
nano .env
```

Contenido de `.env` en producción:

```env
PORT=3000
FRONTEND_URL=https://abonapp.tu-dominio.com
SESSION_SECRET=<cadena aleatoria de 64 caracteres>
COOKIE_SECURE=true
NODE_ENV=production
```

Genera el secreto con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

5. Arranca con PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # ejecuta el comando que imprima
curl http://127.0.0.1:3000/api/health   # {"status":"ok"}
```

6. Anota el **DNS público IPv4** de la instancia (por ejemplo `ec2-3-12-34-56.compute-1.amazonaws.com`).

---

## 3. Certificado ACM (us-east-1)

1. **AWS Certificate Manager → Request certificate → Public certificate** en **us-east-1** (CloudFront solo acepta certificados de esa región).
2. Dominio: `abonapp.tu-dominio.com`.
3. Valida por DNS: crea el registro CNAME que indique ACM en tu proveedor de DNS.
4. Espera el estado **Issued**.

---

## 4. Distribución CloudFront

1. **Create distribution**.
2. **Origin 1 (frontend)**:
   - Origin domain: el endpoint de sitio web de S3 (`...s3-website-us-east-1.amazonaws.com`).
   - Protocol: **HTTP only**.
3. **Origin 2 (API)**:
   - Origin domain: DNS público de EC2.
   - Protocol: **HTTP only**, puerto **3000**.
4. **Default behavior (`/*`)**:
   - Origin: S3.
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Cache policy: `CachedOptimized` o la predeterminada.
   - Default root object: `index.html`.
   - Custom error response: 404 → `/404.html` con código 404.
5. **Behavior `/api/*`**:
   - Origin: EC2.
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - **Cache policy: `CachingDisabled`** (la API no se cachea).
   - **Origin request policy: `AllViewer`** (reenvía cookies, headers y query strings; imprescindible para la sesión).
   - Allowed HTTP methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`.
6. **Settings**:
   - Alternate domain name (CNAME): `abonapp.tu-dominio.com`.
   - Custom SSL certificate: el certificado ACM.
   - Supported HTTP versions: HTTP/2 y HTTP/3.
7. Anota el **Distribution ID** (lo usa el workflow).

> Si la API devuelve `502`, revisa que el Security Group permita el puerto 3000 desde CloudFront y que PM2 esté corriendo (`pm2 status`).

---

## 5. DNS del dominio

**Route 53** (si el dominio está ahí):
- Crea un registro **A** con **Alias** hacia la distribución de CloudFront.

**Namecheap / Name.com** (si el dominio está ahí):
- Crea un **CNAME**: host `abonapp`, valor `dxxxxxxxxxxxx.cloudfront.net`.

Espera la propagación y comprueba:

```bash
nslookup abonapp.tu-dominio.com
curl -I https://abonapp.tu-dominio.com
curl https://abonapp.tu-dominio.com/api/health
```

---

## 6. Compilar y subir manualmente (primera vez)

```bash
cd abonapp
NEXT_PUBLIC_API_URL=/api npm run build
aws s3 sync out/ s3://abonapp-frontend-TU-NOMBRE --delete
aws cloudfront create-invalidation \
  --distribution-id TU_DISTRIBUTION_ID --paths "/*"
```

En PowerShell:

```powershell
cd abonapp
$env:NEXT_PUBLIC_API_URL="/api"; npm run build
aws s3 sync out/ s3://abonapp-frontend-TU-NOMBRE --delete
aws cloudfront create-invalidation --distribution-id TU_DISTRIBUTION_ID --paths "/*"
```

---

## 7. CI/CD con GitHub Actions

En **Settings → Secrets and variables → Actions** crea:

| Secreto | Cómo obtenerlo |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS Academy → AWS Details → Access key. |
| `AWS_SECRET_ACCESS_KEY` | AWS Academy → AWS Details → Secret key. |
| `AWS_REGION` | `us-east-1`. |
| `S3_BUCKET` | Nombre del bucket. |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID de la distribución. |
| `EC2_HOST` | DNS público o IP elástica de EC2. |
| `EC2_USER` | `ubuntu`. |
| `EC2_SSH_KEY` | Contenido completo del archivo `.pem`. |
| `EC2_APP_DIR` | `/home/ubuntu/AbonApp`. |

Luego:

1. Haz merge a `main` o entra a **Actions → Deploy → Run workflow**.
2. El job `deploy-frontend` compila con `/api`, sube `out/` a S3 e invalida CloudFront.
3. El job `deploy-backend` entra por SSH, hace `git pull`, `npm ci --omit=dev` y `pm2 startOrReload`.
4. Verifica `https://abonapp.tu-dominio.com/api/health`.

> **AWS Academy:** las credenciales del laboratorio son temporales. Cuando reinicies el lab, actualiza `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` en GitHub.

---

## 8. Checklist de aceptación

- [ ] `https://abonapp.tu-dominio.com` carga la landing con candado HTTPS.
- [ ] `https://abonapp.tu-dominio.com/api/health` responde `{"status":"ok"}`.
- [ ] Registro y login funcionan; al recargar el dashboard la sesión se mantiene.
- [ ] Crear cliente → deuda → abono actualiza saldo y estado.
- [ ] No se puede entrar a `/dashboard` sin sesión (redirige a `/login`).
- [ ] El workflow **CI** pasa en el último PR.
- [ ] El workflow **Deploy** publica cambios sin caída del backend.
- [ ] El README tiene el dominio real y las capturas en `docs/`.

---

## 9. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La sesión no se mantiene | Frontend y API en orígenes distintos, o `COOKIE_SECURE=true` sin HTTPS | Usa CloudFront con `/api` en el mismo dominio y HTTPS. |
| `Cannot find module 'node:sqlite'` | Node < 24 en EC2 | Instala Node 24 (`node -v`). |
| `502 Bad Gateway` en `/api/*` | EC2 apagada, PM2 caído o Security Group sin el puerto 3000 | `pm2 status`, revisa el SG y el origen de CloudFront. |
| El dashboard recarga a `/login` | Cookie bloqueada o `FRONTEND_URL` incorrecto | Revisa `COOKIE_SECURE`, `FRONTEND_URL` y la política `AllViewer` del behavior `/api/*`. |
| 404 al entrar a `/dashboard/` | S3 sin `index.html` como índice o CloudFront con origen REST (no website) | Usa el endpoint de sitio web de S3 como origen. |
| El build apunta a `localhost:3000` | Se compiló sin `NEXT_PUBLIC_API_URL` | Vuelve a compilar con `NEXT_PUBLIC_API_URL=/api`. |
