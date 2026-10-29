# Squad of Champions

Fullstack solution to the 360 VUZ "Squad of Champions" challenge: build a squad
of up to six fighting-game characters to defend Earthrealm.

## Repository layout

```
frontend/   React + Redux Toolkit + TypeScript app (Vite, MUI, Feature-Sliced Design)
backend/    NestJS API (PostgreSQL, Redis)
```

## Backend (development)

```bash
cp .env.example .env
docker compose up -d --build
```

That starts PostgreSQL, Redis and the API. The API container applies migrations and seeds the characters.

- API: http://localhost:3000/api/v1
- Health: http://localhost:3000/health
- Swagger: http://localhost:3000/api/docs

### Characters

| Method | Path                         | Behaviour                                                                                                                                                                                                                                              |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/v1/characters`         | One page. Query: `search` (name, case-insensitive), `tags` (comma-separated, a character matches if it has any of them), `universe` (narrows the page), `limit` (1–100, default 20), `cursor`, `sort` (`name` or `id`). Body: `{ items, nextCursor }`. |
| GET    | `/api/v1/characters/filters` | Tag names in first-appearance order, then universe names. `grapple` and `grappling` stay separate.                                                                                                                                                     |
| GET    | `/api/v1/characters/:id`     | One character. Unknown id: `404` and `CHARACTER_NOT_FOUND`.                                                                                                                                                                                            |

A cursor that cannot be decoded is `400` and `VALIDATION_ERROR`. `quote` and `thumbnail` are `null` when the source JSON has no value

#### Why a cursor

The squad builder asks for the next page while the user scrolls. It never jumps to page 12. A cursor is the last row of the current page (`name` and `id`, or only `id` when `sort=id`) and the next query asks for rows strictly after that point. A row inserted or deleted above the page does not shift the rows the client has already seen, and PostgreSQL uses the `(name, id)` index instead of walking past skipped rows with `OFFSET`

#### Cache

The catalogue changes only when the seed runs. The seed increments `chars:version`. Every cache key starts with that version:

- list: `chars:v{version}:{sha1 of the normalized query}`
- filters: `chars:v{version}:filters`

The hash covers search, tags, universe, limit, cursor and sort. Tags are sorted before hashing, so `robot,alien` and `alien,robot` are the same request

Each entry lives for 10 minutes. After a new seed the version no longer matches, so old keys are never read and expire on their own

To work on the API without rebuilding the image, stop the `backend` service and run it on the host:

```bash
docker compose stop backend
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Test instructions and the cases covered are in [TESTING.md](TESTING.md)

## Frontend (development)

```bash
cd frontend
npm install
npm run dev
```
