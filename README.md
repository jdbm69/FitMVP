# FitMVP

Small **fitness member management** demo: members, plans, memberships, and check-ins. It includes a **REST API** (Express + Prisma + PostgreSQL), a **React** UI (Vite + Tailwind v4), and **Docker Compose** to run database, API, and web together.

---

## What’s in the repo

| Path | Description |
|------|-------------|
| `backend/` | Express API, Prisma schema & migrations, Jest integration tests |
| `frontend/` | React SPA, Vitest + Testing Library tests |
| `docker-compose.yml` | `db` (Postgres), `api`, `web` (Nginx + static build) |
| `TECH_SPEC.md` | API contracts, schema, errors, testing — **canonical spec** |
| `AWS_DIAGRAM_SCHEMA.md` | Reference for an AWS target architecture diagram |

---

## Stack (summary)

- **Backend:** Node.js 20+, Express 5, TypeScript, Zod, Prisma 6, PostgreSQL 16  
- **Frontend:** React 19, React Router 7, Vite 8, Tailwind CSS 4  
- **Ops:** Docker & Docker Compose; Nginx proxies `/api` → API in the `web` image  

---

## Prerequisites

- **Docker Desktop** (recommended for DB + full stack), or PostgreSQL 16+ installed locally  
- **Node.js 20+** and **npm** for local `npm run dev` / tests  

---

## Quick start (full stack)

From the **repository root**:

```bash
docker compose up --build -d
```

| Service | URL / port | Notes |
|---------|------------|--------|
| **web** | http://localhost:8080 | Built UI; browser calls **`/api/...`** on the same origin |
| **api** | http://localhost:3001 | Direct API (CORS enabled for dev) |
| **db** | `localhost:5432` | Postgres (`postgres` / `postgres`, DB `fitness_mvp`) |

The UI build sets `VITE_API_URL=/api`, so requests go to `http://localhost:8080/api/...` and Nginx forwards them to the `api` container.

Stop containers:

```bash
docker compose down
```

Remove containers **and** the Postgres volume:

```bash
docker compose down -v
```

---

## Development without rebuilding images

1. Start only Postgres: `docker compose up -d db`  
2. **Backend:** `cd backend` → copy `backend/.env.example` to `backend/.env` → `npm install` → `npm run prisma:migrate` → `npm run prisma:seed` → `npm run dev` (API on port **3001**).  
3. **Frontend:** `cd frontend` → copy `frontend/.env.example` to `frontend/.env` → `npm install` → `npm run dev` (usually **5173**). Set `VITE_API_URL=http://localhost:3001/api`.

See **`backend/README.md`** and **`frontend/README.md`** for scripts, env vars, and tests.

---

## API and documentation

- **Base URL (local):** `http://localhost:3001/api`  
- **Spec (endpoints, model, errors):** [`TECH_SPEC.md`](./TECH_SPEC.md)  
- **AWS diagram hints:** [`AWS_DIAGRAM_SCHEMA.md`](./AWS_DIAGRAM_SCHEMA.md)  

Health check:

```bash
curl -s http://localhost:3001/api/health
```

---

## Tests

| Location | Command |
|----------|---------|
| Backend | `cd backend && npm test` |
| Frontend | `cd frontend && npm run test` |

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Port **5432**, **3001**, or **8080** already in use | Stop the other process or change host ports in `docker-compose.yml`. |
| API fails to connect to DB | Ensure `DATABASE_URL` in `backend/.env` matches a running Postgres (Compose service `db` or local). |
| Blank UI in Docker | Wait for `web` build; open `http://localhost:8080`. Check browser devtools network for `/api` 502 → API not ready. |
| Prisma migrate errors | DB must exist and be reachable; for a clean DB: `docker compose down -v` then `up` again (dev only). |

---

## Build images separately (CI)

```bash
docker build -t fitmvp-api ./backend
docker build -t fitmvp-web ./frontend
```

The full stack is normally started with **`docker compose`** from this root.
