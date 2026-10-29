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

To work on the API without rebuilding the image, stop the `backend` service and run it on the host:

```bash
docker compose stop backend
cd backend
cp .env.example .env
npm install
npm run start:dev
```

## Frontend (development)

```bash
cd frontend
npm install
npm run dev
```
