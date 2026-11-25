# Guía de colaboración

Convenciones del equipo para ramas, commits y pull requests en AbonApp.

## 1. Preparar el entorno

```bash
git clone https://github.com/amarinr786-droid/AbonApp.git
cd AbonApp
```

Requisitos:

- **Node.js 24** (`node -v`) — obligatorio por `node:sqlite`.
- npm y Git.

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Frontend (otra terminal):

```bash
cd abonapp
npm install
cp .env.example .env.local
npx next dev -p 3001
```

## 2. Crear una rama

Nunca se trabaja directamente sobre `main`. Cada cambio va en una rama con prefijo según el tipo de trabajo:

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva | `feat/filtro-abonos` |
| `fix/` | Corrección de errores | `fix/fecha-deuda` |
| `docs/` | Documentación | `docs/api-endpoints` |
| `style/` | Cambios visuales o de formato | `style/sidebar` |
| `chore/` | Configuración, dependencias, CI | `chore/actualizar-dependencias` |

```bash
git checkout main
git pull origin main
git checkout -b fix/fecha-deuda
```

Reglas:

- Minúsculas, sin espacios ni tildes; separa palabras con guiones.
- Una rama = un cambio. No mezcles correcciones y estilos en el mismo PR.
- Antes de abrir el PR, sincroniza con `main`:

```bash
git fetch origin
git merge origin/main
```

## 3. Commits

Se usa **Conventional Commits** en español, con el verbo en imperativo:

```text
<tipo>: <descripción breve>
```

Ejemplos reales del repositorio:

```text
fix: corregir endpoint del resumen del dashboard
docs: agregar referencia de la API REST
style: suavizar la barra lateral
ci: omitir el deploy hasta configurar los secretos
```

Recomendaciones:

- Descripción en minúscula y sin punto final.
- Un commit = un cambio lógico.
- Evita mensajes como `cambios`, `arreglos` o `update`.
- Si el cambio necesita contexto, agrégalo en el cuerpo del commit.

## 4. Pull requests

1. Sube la rama:

```bash
git push -u origin fix/fecha-deuda
```

2. Abre el PR en GitHub con:
   - **Título** igual al formato de commit.
   - **Descripción** con: qué hace, cómo se verificó y notas.
3. Agrega como **Reviewer** a otro integrante.
4. El revisor entra a **Files changed → Review changes → Approve**.
5. Solo con la aprobación se hace **Merge pull request**.
6. Borra la rama después del merge.

> La rúbrica exige PRs con **aprobación de un compañero**. No mergees tu propio PR sin revisión.

### Plantilla de descripción

```markdown
## Qué hace este PR

<una o dos frases>

### Cambios

- <cambio 1>
- <cambio 2>

### Cómo se verificó

- `cd backend && npm test`
- `cd abonapp && npm run build`

### Notas

<opcional>
```

## 5. Verificaciones antes de pedir revisión

```bash
# Backend
cd backend
npm test

# Frontend
cd abonapp
npm run lint
NEXT_PUBLIC_API_URL=/api npm run build
```

En PowerShell:

```powershell
cd abonapp
$env:NEXT_PUBLIC_API_URL="/api"; npm run build
```

El PR no debe mergearse si:

- Falla el workflow **CI**.
- El build estático no genera `out/index.html`.
- Se subieron archivos generados (`out/`, `node_modules/`, `*.db`, `.env`).

## 6. Estilo de código

- **Frontend:** TypeScript, componentes funcionales y Tailwind CSS 4. Nombres de componentes en `PascalCase`; archivos de rutas en `kebab-case` cuando aplique.
- **Backend:** CommonJS, rutas en `backend/src/routes/`, acceso a datos con `run`, `get` y `all` de `db.js`.
- No dejes `console.log` de depuración ni código comentado.
- Los textos de la interfaz van en español.

## 7. Qué no se commitea

Está en `.gitignore`:

- `node_modules/`
- `abonapp/out/`
- `abonapp/.next/`
- `backend/abonapp.db*`
- `.env`, `.env.local`
- `dataProject/` (proyecto ajeno a la entrega)

Si agregas una variable de entorno nueva, actualiza el `.env.example` correspondiente.
