# Tech Spec — Fitness Member Management Mini-MVP

This document is the **source of truth** for implemented behavior, data model, and API contracts. Implementation lives in `backend/` (Express + Prisma) and `frontend/` (React + Vite).

---

## 1) Implemented scope

**Backend API** (Node.js + Express + TypeScript + PostgreSQL + Prisma):

- **Members:** create, list/search (with `hasActiveMembership` flag), per-member summary.
- **Plans + memberships:** seeded plan (`Basic Monthly`), assign membership, cancel membership.
- **Check-ins:** create only when the member has an **active** membership at check-in time.
- **Critical rule:** a member cannot hold more than one active membership for overlapping periods; assignment uses a serializable transaction + `SELECT … FOR UPDATE` to avoid races.

**Frontend** (React + TypeScript + Vite + Tailwind CSS v4):

- Home: search, member list (rows **highlighted** when `hasActiveMembership` is true), add member modal.
- Member detail: summary, assign/cancel membership, check-in (with rules aligned to the API).

---

## 2) API base URL and endpoints

All routes below are mounted under **`/api`** (e.g. health check: `GET /api/health`).

Base for local development: `http://localhost:3001/api`  
With Docker Compose web container: same-origin **`/api`** on `http://localhost:8080/api` (Nginx proxies to the API service).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `GET` | `/plans` | List plans |
| `POST` | `/members` | Create member |
| `GET` | `/members` | List/search members (`?q=` optional) |
| `GET` | `/members/:memberId/summary` | Member dashboard summary |
| `POST` | `/members/:memberId/memberships` | Assign membership |
| `POST` | `/members/:memberId/memberships/:membershipId/cancel` | Cancel membership |
| `POST` | `/members/:memberId/check-ins` | Check-in |

### `GET /health`

`200`:

```json
{ "status": "ok" }
```

### `GET /plans`

`200` — array of plans (seed includes **Basic Monthly**, `priceCents` 3999).

### `POST /members`

Body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com"
}
```

`201` — created `Member` (no `hasActiveMembership` on this response).

### `GET /members?q=jane`

`200` — filtered by `firstName`, `lastName`, or `email` (contains, case-insensitive).  
Each element includes **`hasActiveMembership: boolean`** (whether the member has an active membership at query time).

Example:

```json
[
  {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "createdAt": "…",
    "updatedAt": "…",
    "hasActiveMembership": true
  }
]
```

### `GET /members/:memberId/summary`

`200`:

```json
{
  "memberId": "uuid",
  "activeMembership": {
    "membershipId": "uuid",
    "planId": "uuid",
    "planName": "Basic Monthly",
    "startsAt": "ISO_DATE",
    "cancelledAt": null
  },
  "lastCheckInAt": "ISO_DATE",
  "checkInsLast30Days": 2
}
```

`activeMembership` is `null` if none active.

### `POST /members/:memberId/memberships`

Body:

```json
{
  "planId": "uuid",
  "startsAt": "2026-03-26T00:00:00.000Z"
}
```

`201` — created membership.

### `POST /members/:memberId/memberships/:membershipId/cancel`

Body:

```json
{
  "effectiveDate": "2026-03-27T00:00:00.000Z"
}
```

`200` — membership updated (`cancelledAt` set).

### `POST /members/:memberId/check-ins`

`201` — check-in created **only** if an active membership exists; otherwise `409` with `ACTIVE_MEMBERSHIP_REQUIRED`.

---

## 3) Relational schema (implemented in Prisma)

Aligned with `backend/prisma/schema.prisma`.

### `Member`

- `id` UUID PK  
- `firstName`, `lastName` text not null  
- `email` text unique not null  
- `createdAt`, `updatedAt`  
- Index: `(lastName, firstName)`

### `Plan`

- `id` UUID PK  
- `name` text unique not null  
- `priceCents` int not null  
- `createdAt`, `updatedAt`

### `Membership`

- `id` UUID PK  
- `memberId` FK → `Member`  
- `planId` FK → `Plan`  
- `startsAt` timestamptz not null  
- `cancelledAt` timestamptz nullable  
- `createdAt`, `updatedAt`  
- Indexes: `(memberId, startsAt)`, `(memberId, cancelledAt)`

### `CheckIn`

- `id` UUID PK  
- `memberId` FK → `Member`  
- `createdAt` timestamptz  
- Index: `(memberId, createdAt)`

---

## 4) Business rules and validation

- Route params (`memberId`, `membershipId`, `planId`): UUIDs validated (Zod).
- Request bodies validated with **Zod**.
- Email unique at database level (`409` + `UNIQUE_CONSTRAINT_VIOLATION` on duplicate).
- Check-in only with active membership (`409` + `ACTIVE_MEMBERSHIP_REQUIRED`).
- Cancellation effective date cannot be before membership start (`400` + `INVALID_CANCELLATION_DATE`).
- Overlapping active memberships prevented (`409` + `ACTIVE_MEMBERSHIP_CONFLICT`).

---

## 5) Error format (standard)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": []
  }
}
```

`details` is present when applicable (e.g. Zod `VALIDATION_ERROR`).

### Common `error.code` values

| Code | Typical HTTP |
|------|----------------|
| `VALIDATION_ERROR` | 400 |
| `ROUTE_NOT_FOUND` | 404 |
| `MEMBER_NOT_FOUND` | 404 |
| `PLAN_NOT_FOUND` | 404 |
| `MEMBERSHIP_NOT_FOUND` | 404 |
| `MEMBERSHIP_ALREADY_CANCELLED` | 409 |
| `ACTIVE_MEMBERSHIP_CONFLICT` | 409 |
| `ACTIVE_MEMBERSHIP_REQUIRED` | 409 |
| `INVALID_CANCELLATION_DATE` | 400 |
| `UNIQUE_CONSTRAINT_VIOLATION` | 409 |
| `WRITE_CONFLICT` | 409 |
| `RECORD_NOT_FOUND` | 404 |
| `DATABASE_REQUEST_FAILED` | 500 |
| `INTERNAL_SERVER_ERROR` | 500 |

---

## 6) Concurrency (single active membership on assign)

- `prisma.$transaction(..., { isolationLevel: "Serializable" })`.
- Member row locked: `SELECT id FROM "Member" WHERE id = $id FOR UPDATE`.
- Overlap checked before insert.

---

## 7) Testing

| Layer | Stack | Location |
|-------|--------|----------|
| Backend | Jest + Supertest | `backend/tests/api.integration.test.ts` |
| Frontend | Vitest + Testing Library | `frontend/src/**/*.test.ts(x)` |

Backend tests assume a test database (see `backend/tests/setup-db.ts`). Frontend tests use **jsdom** and mock `fetch` / `apiRequest` where needed.

---

## 8) Possible extensions (not in this MVP)

- Pagination and sorting on `GET /members`.
- Authentication and authorization.
- Structured logging, request IDs, metrics.
- Load / stress tests for concurrency.
- Rate limiting on sensitive routes.

---

## 9) Review checklist (spec vs repo)

| Item | Status |
|------|--------|
| CRUD-style member + search | OK |
| Plans + seed | OK |
| Assign / cancel membership + validation | OK |
| Check-in gated on active membership | OK |
| No overlapping active memberships (incl. concurrency path) | OK |
| Standard JSON error envelope | OK |
| Frontend list shows active membership (API + UI) | OK |
| Docker Compose full stack | OK |
| Integration + frontend unit/component tests | OK |
