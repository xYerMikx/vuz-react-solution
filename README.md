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

### Auth

| Method | Path                    | Behaviour                                                                                    |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/auth/register` | Creates a user and starts a session. Body: `{ email, password }`. Response: `{ id, email }`. |
| POST   | `/api/v1/auth/login`    | Starts a session for an existing user. Same body and response.                               |
| POST   | `/api/v1/auth/refresh`  | Rotates the refresh cookie and sets a new access cookie.                                     |
| POST   | `/api/v1/auth/logout`   | Revokes the current refresh token and clears both cookies.                                   |
| GET    | `/api/v1/auth/me`       | The user for the access cookie.                                                              |

The challenge does not say what registration should do when the email is already taken. This API answers `409` and `EMAIL_TAKEN`. Login answers `401` and `INVALID_CREDENTIALS` both for an unknown email and for a wrong password, so login cannot be used to discover which addresses exist.

Both tokens are `httpOnly` and `SameSite=Strict` cookies. The response body never contains them. The access cookie is a 15-minute JWT, path `/api/v1`. The refresh cookie is a random value stored only as a SHA-256 hash, path `/api/v1/auth`, and it lasts 30 days. After a reload the browser sends the access cookie with `GET /auth/me`. When that cookie has expired, `POST /auth/refresh` sends the refresh cookie and replaces both. A refresh token that was already rotated revokes every session of that user.

### Squads

Every squad route requires the access cookie. The challenge says a user can only see and change their own squads, and it does not say what happens when the id belongs to someone else. This API treats that as an IDOR rule, not as an extra check after a lookup: `userId` from the cookie is part of the query. A squad owned by another user and a squad that does not exist both answer `404` and `SQUAD_NOT_FOUND`. `403` would confirm that the id is real.

| Method | Path                                         | Behaviour                                                                |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/v1/squads`                             | The current user's squads, without statistics.                           |
| POST   | `/api/v1/squads`                             | Creates a squad. Body: `{ name, characterIds? }`. At most 6 ids.         |
| GET    | `/api/v1/squads/:id`                         | One squad, its characters, and ability averages.                         |
| PATCH  | `/api/v1/squads/:id`                         | Renames and/or replaces the whole roster. Order of ids becomes position. |
| DELETE | `/api/v1/squads/:id`                         | Deletes the squad and its members.                                       |
| POST   | `/api/v1/squads/:id/characters/:characterId` | Adds a character at the next position.                                   |
| DELETE | `/api/v1/squads/:id/characters/:characterId` | Removes a character.                                                     |

A squad has at most 6 characters. Two adds at the same time lock the squad row (`SELECT ... FOR UPDATE`), recount, and only then insert, so the seventh member is `422` `SQUAD_FULL` and the table never holds more than 6. The primary key `(squadId, characterId)` makes a duplicate `409` `DUPLICATE_MEMBER`. An unknown character id is `422` `CHARACTER_NOT_FOUND`. Removing a character who is not in the squad is `404` `MEMBER_NOT_FOUND`; the challenge does not name that case.

The stored name is trimmed and must be 1–40 characters. The challenge does not set a length. Averages are `AVG` in SQL, rounded to 2 decimals. An empty squad has an empty statistics list.

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
cp .env.example .env
npm install
npm run dev
```

The app is at http://localhost:5173. `VITE_API_URL` points at the API (`http://localhost:3000/api/v1`).

The assignment does not describe the auth screens, so login and register share one form and the UI stays as small as that allows. React Hook Form and Zod were chosen so validation lives in a schema and the form owns input state: a field error updates with the current value.
