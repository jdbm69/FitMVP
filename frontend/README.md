# FitMVP — Frontend

Single-page app for **searching members**, **creating members**, **viewing detail**, **assigning/cancelling memberships**, and **check-ins**. Built with **React 19**, **TypeScript**, **Vite 8**, **React Router 7**, and **Tailwind CSS 4** (`@tailwindcss/vite`).

The UI expects the REST API described in the repo root **`TECH_SPEC.md`**.

---

## Requirements

- Node.js **20+**  
- Running API (local or Docker) unless you only run static tests  

---

## Configuration

Copy the environment example:

```bash
cp .env.example .env
```

Windows (cmd): `copy .env.example .env`

| Variable | Local dev (Vite) | Docker `web` image |
|----------|------------------|---------------------|
| `VITE_API_URL` | `http://localhost:3001/api` | `/api` (same origin; Nginx proxies to API) |

There is **no trailing slash** on the base URL. The client builds request URLs as `base + path` (e.g. `/members`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (hot reload) |
| `npm run build` | `tsc -b` + production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest once |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Coverage (v8) |

---

## Docker

From the **repo root** (starts `db` + `api` + `web`):

```bash
docker compose up --build -d
```

Open **http://localhost:8080** — API calls use **`/api`** on the same host.

Build only the frontend image (from `frontend/`):

```bash
docker build -t fitmvp-web .
```

Optional build argument:

```bash
docker build --build-arg VITE_API_URL=/api -t fitmvp-web .
```

---

## Features (by screen)

| Area | Behavior |
|------|----------|
| **Home** | Debounced search, member list with **highlight + “Active membership” badge** when the API sets `hasActiveMembership`, add-member modal |
| **Member detail** | Summary, assign membership (hidden if already active), cancel membership, check-in (only with active membership), toast feedback |

---

## Project layout

```
frontend/
├── src/
│   ├── api/           # client + types
│   ├── components/
│   ├── pages/
│   ├── test/          # Vitest setup
│   └── utils/         # e.g. email validation
├── index.html
├── vite.config.ts     # includes Vitest config
├── Dockerfile
└── nginx.conf         # SPA + /api proxy (production image)
```

Styling is **Tailwind utility classes** only, plus `src/index.css` with `@import "tailwindcss"`.

---

## Testing

Tests use **Vitest**, **jsdom**, and **Testing Library** (`src/**/*.test.ts(x)`). Network access is mocked (`fetch` / `apiRequest`); router-heavy pages use **`MemoryRouter`** where needed.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| `Failed to fetch` / network errors | API running? `VITE_API_URL` correct? In Docker, use `/api` and open UI on **8080**, not only Vite’s port. |
| CORS in local dev | API enables CORS; ensure frontend points to `http://localhost:3001/api`. |
| Stale bundle in Docker | Rebuild: `docker compose build web --no-cache`. |
