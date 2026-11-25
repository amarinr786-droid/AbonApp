# Guía de despliegue en AWS

Objetivo: publicar AbonApp en `https://abonapp.tech` con **Apache** sirviendo el frontend estático y haciendo *reverse proxy* de `/api` hacia Express, todo en la misma instancia **Amazon EC2**. Un solo origen ⇒ la cookie de sesión funciona sin trucos de CORS.

```text
Navegador
   │ HTTPS (Certbot / Let's Encrypt)
   ▼
Apache 2.4 :80/:443  ── EC2 Ubuntu 24.04
   ├── /*      → /var/www/html (export estático out/)
   └── /api/*  → 127.0.0.1:3000 (Express + PM2)
                        │
                        └── SQLite (EBS)
```

> **Requisito de la rúbrica:** la URL final debe ser un dominio propio con DNS configurado. No uses IP, puertos, `localhost` ni dominios por defecto de Netlify/Vercel.

---

## 0. Antes de empezar

- Cuenta de **AWS Academy** con el laboratorio iniciado.
- Dominio **`abonapp.tech`** comprado (plan básico; no hace falta *Domain Safe Pro*).
- Instancia **EC2 Ubuntu 24.04** en ejecución y acceso SSH con el key pair.
- Node.js **24** en la instancia (lo exige `node:sqlite`).

---

## 1. Preparar la EC2

### 1.1 Elastic IP (recomendado)

En **EC2 → Elastic IPs → Allocate Elastic IP address → Associate** con la instancia. Así la IP pública no cambia al detener/reiniciar el laboratorio y el DNS no se rompe.

### 1.2 Security Group

| Puerto | Origen | Uso |
|---|---|---|
| `22` | **Tu IP** | SSH |
| `80` | `0.0.0.0/0` | HTTP (redirige a HTTPS) |
| `443` | `0.0.0.0/0` | HTTPS |

El puerto **3000 no se abre a Internet**: Apache llega a Express por `127.0.0.1` y es el único expuesto (80/443).

### 1.3 Node 24 y PM2

```bash
node -v   # debe ser v24.x
```

Si no lo es:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
node -v
```

---

## 2. Backend (Express + PM2)

```bash
cd ~
git clone https://github.com/amarinr786-droid/AbonApp.git
cd AbonApp/backend
npm ci --omit=dev
```

Crea el `.env` (genera el secreto en el momento):

```bash
SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
cat > .env <<EOF
PORT=3000
FRONTEND_URL=https://abonapp.tech
SESSION_SECRET=$SECRET
COOKIE_SECURE=false
NODE_ENV=production
EOF
```

> Mientras no exista HTTPS, deja `COOKIE_SECURE=false`. Al terminar el paso 5 (Certbot) cámbialo a `true`.

Arranca y verifica:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # ejecuta el comando que imprima para arrancar al bootear
sleep 2
pm2 status         # abonapp-api debe estar online
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok"}
```

Si falla: `pm2 logs abonapp-api --lines 80`.

---

## 3. Frontend (Apache)

### 3.1 Compilar en la EC2

```bash
# swap temporal si la instancia tiene poca RAM (t2/t3.micro)
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi

cd ~/AbonApp/abonapp
npm ci
NEXT_PUBLIC_API_URL=/api npm run build
ls -lh out/index.html
```

> `NEXT_PUBLIC_API_URL` queda incrustada en el JS. Si cambia, hay que recompilar.

Alternativa desde tu PC (evita compilar en la instancia):

```powershell
cd C:\Users\amari\Documents\AbonApp\abonapp
$env:NEXT_PUBLIC_API_URL="/api"; npm run build
scp -i "C:\ruta\llave.pem" -r .\out ubuntu@IP_ELASTICA:/home/ubuntu/
```

### 3.2 Apache

```bash
sudo apt install apache2 -y
sudo a2enmod proxy proxy_http rewrite headers ssl
```

Copia el VirtualHost de referencia del repositorio:

```bash
sudo cp ~/AbonApp/docs/apache-abonapp.conf /etc/apache2/sites-available/000-default.conf
```

O créalo a mano:

```apache
<VirtualHost *:80>
    ServerName abonapp.tech
    ServerAlias www.abonapp.tech

    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    DirectoryIndex index.html

    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    ErrorDocument 404 /404.html
</VirtualHost>
```

Publica el build:

```bash
sudo rsync -a --delete ~/AbonApp/abonapp/out/ /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo apache2ctl configtest
sudo systemctl reload apache2

curl -I http://localhost/
curl -s http://localhost/api/health
```

Prueba en el navegador `http://IP_ELASTICA/`: debe cargar la landing y permitir registro/login.

---

## 4. DNS del dominio

En **Name.com → DNS Records** (o el proveedor donde compraste el dominio):

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| `A` | `@` | **Elastic IP** | 300 |
| `A` | `www` | **Elastic IP** | 300 |

Comprueba la propagación:

```bash
nslookup abonapp.tech
nslookup www.abonapp.tech
```

---

## 5. HTTPS con Certbot

```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d abonapp.tech -d www.abonapp.tech --redirect
```

Certbot crea el VirtualHost `*:443`, instala el certificado y redirige HTTP → HTTPS. Renovación automática con el timer de systemd (`systemctl status certbot.timer`).

**Paso obligatorio:** Apache debe avisar a Express que la petición original llegó por HTTPS. Si falta, `express-session` crea la sesión pero **no envía la cookie `Secure`**, y el dashboard responde `401 No autenticado`.

```bash
sudo nano /etc/apache2/sites-available/000-default-le-ssl.conf
```

Dentro de `<VirtualHost *:443>`:

```apache
RequestHeader set X-Forwarded-Proto "https"
```

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Verifica que la respuesta del login incluya la cookie:

```bash
curl -s -i -X POST https://abonapp.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"TU_CORREO","password":"TU_CLAVE"}' | grep -i set-cookie
```

Debe mostrar `Set-Cookie: connect.sid=...; Secure; HttpOnly; SameSite=None`.

Activa la cookie segura:

```bash
cd ~/AbonApp/backend
sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' .env
pm2 restart abonapp-api --update-env
```

Verifica:

```bash
curl -I https://abonapp.tech
curl -s https://abonapp.tech/api/health
```

---

## 6. CI/CD con GitHub Actions

En **Settings → Secrets and variables → Actions** crea:

| Secreto | Valor |
|---|---|
| `EC2_HOST` | Elastic IP de la instancia. |
| `EC2_USER` | `ubuntu`. |
| `EC2_SSH_KEY` | Contenido completo del archivo `.pem`. |
| `EC2_APP_DIR` | `/home/ubuntu/AbonApp`. |
| `WEB_ROOT` | `/var/www/html`. |

Luego:

1. Haz merge a `main` o entra a **Actions → Deploy → Run workflow**.
2. `deploy-frontend` compila con `/api`, copia `out/` a `/tmp/abonapp-out`, lo publica en `WEB_ROOT`, recarga Apache y comprueba `/api/health`.
3. `deploy-backend` entra por SSH, hace `git pull`, `npm ci --omit=dev` y `pm2 startOrReload`.
4. Verifica `https://abonapp.tech/api/health`.

> **AWS Academy:** la instancia se detiene al cerrar el laboratorio. Mantén una Elastic IP y actualiza `EC2_HOST` si cambia. Mientras no existan los secretos, el workflow se omite con un aviso (no falla). El despliegue manual de las secciones 2 y 3 sigue disponible como respaldo.

---

## 7. Checklist de aceptación

- [ ] `https://abonapp.tech` carga la landing con candado HTTPS.
- [ ] `https://abonapp.tech/api/health` responde `{"status":"ok"}`.
- [ ] Registro y login funcionan; al recargar el dashboard la sesión se mantiene.
- [ ] Crear cliente → deuda → abono actualiza saldo y estado.
- [ ] No se puede entrar a `/dashboard` sin sesión (redirige a `/login`).
- [ ] El workflow **CI** pasa en el último PR.
- [ ] El workflow **Deploy** publica cambios sin caída del backend.
- [ ] El README tiene el dominio real y las capturas en `docs/`.

---

## 8. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La sesión no se mantiene | `COOKIE_SECURE` no coincide con el esquema, o `FRONTEND_URL` incorrecto | HTTP → `false`; HTTPS → `true`. Revisa `FRONTEND_URL=https://abonapp.tech`. |
| Login correcto pero el dashboard dice "No autenticado" | Apache no envía `X-Forwarded-Proto: https` y Express no emite la cookie `Secure` | Agrega `RequestHeader set X-Forwarded-Proto "https"` al VirtualHost `*:443` y recarga Apache. |
| `Cannot find module 'node:sqlite'` | Node < 24 en EC2 | Instala Node 24 (`node -v`). |
| `502 Bad Gateway` en `/api/*` | PM2 caído | `pm2 status` y `pm2 logs abonapp-api`. |
| `503` en `/api/*` | `mod_proxy` deshabilitado | `sudo a2enmod proxy proxy_http` y recarga Apache. |
| 404 al entrar a `/dashboard/` | Falta `DirectoryIndex` o el `rsync` no copió las carpetas | Revisa `/var/www/html/dashboard/index.html` y `rsync`. |
| El build apunta a `localhost:3000` | Se compiló sin `NEXT_PUBLIC_API_URL` | Recompila con `NEXT_PUBLIC_API_URL=/api`. |
| Cambios no se ven tras desplegar | Caché del navegador/CDN | Recarga forzada (`Ctrl+F5`); el `out/` tiene hashes nuevos. |
| Certbot falla | DNS aún no apunta a la IP o falta el puerto 80 | `nslookup abonapp.tech`, abre 80 en el Security Group. |
