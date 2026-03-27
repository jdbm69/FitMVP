# FitMVP — Backend API

REST API for **members**, **plans**, **memberships**, and **check-ins**. Built with **Express**, **TypeScript**, **Zod**, and **Prisma** (PostgreSQL).

For contracts and error codes, see the repo root **`TECH_SPEC.md`**.

---

## Requirements

- Node.js **20+**, npm **10+**  
- PostgreSQL **16** (local or Docker)  
- Docker optional (for Compose DB or full stack from repo root)  

---

## Environment

Copy the example file and edit if needed:

```bash
cp .env.example .env
```

On Windows (cmd): `copy .env.example .env`

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (must include `schema=public` if you use Prisma defaults) |
| `PORT` | HTTP port (default **3001** if unset) |

Example for Postgres on localhost (matches `docker-compose` credentials):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitness_mvp?schema=public"
PORT=3001
```

---

## Run locally (API on host, DB in Docker)

From the **repo root**:

```bash
docker compose up -d db
```

Then:

```bash
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API: **http://localhost:3001** — base path for routes is **`/api`** (e.g. `GET http://localhost:3001/api/health`).

---

## Run with Docker (API container)

From the repo root:

```bash
docker compose up --build -d
```

The API is available at **http://localhost:3001**; the UI is served on **http://localhost:8080** (see root `README.md`).

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (`ts-node-dev`, reload on change) |
| `npm run build` | Compile TypeScript → `dist/` (`tsconfig.build.json`) |
| `npm start` | Run compiled `dist/server.js` |
| `npm test` | Jest integration tests (uses test DB — see `tests/setup-db.ts`) |
| `npm run test:watch` | Jest watch mode |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run prisma:deploy` | Apply migrations (production-style) |
| `npm run prisma:seed` | Seed initial plan (`Basic Monthly`) |

---

## HTTP API (overview)

All routes are under **`/api`**.

| Method | Path |
|--------|------|
| `GET` | `/api/health` |
| `GET` | `/api/plans` |
| `POST` | `/api/members` |
| `GET` | `/api/members` (optional `?q=`) — each member includes **`hasActiveMembership`** |
| `GET` | `/api/members/:memberId/summary` |
| `POST` | `/api/members/:memberId/memberships` |
| `POST` | `/api/members/:memberId/memberships/:membershipId/cancel` |
| `POST` | `/api/members/:memberId/check-ins` |

### Example: health

```bash
curl -s http://localhost:3001/api/health
```

### Example: create member

```bash
curl -s -X POST http://localhost:3001/api/members \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"email\":\"jane@example.com\"}"
```

### Errors

JSON shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

Details and codes are documented in **`TECH_SPEC.md`** §5.

---

## Project layout (backend)

```
backend/
├── prisma/           # schema, migrations, seed
├── src/
│   ├── controllers/
│   ├── middlewares/  # error handler
│   ├── routes/
│   ├── services/     # membership rules
│   ├── validators/
│   └── ...
├── tests/            # Jest + Supertest
├── Dockerfile
├── .env.example
├── tsconfig.json     # typecheck (src + tests)
└── tsconfig.build.json
```

---

## Troubleshooting

| Problem | Suggestion |
|---------|------------|
| `P1001` / connection refused | Postgres not running or wrong `DATABASE_URL`. |
| Migration drift | Use `prisma migrate dev` locally; `prisma migrate deploy` in CI/containers. |
| Tests fail on DB | Tests reset tables — ensure `DATABASE_URL` in test env points to a disposable DB (see `tests/setup-env.ts`). |
