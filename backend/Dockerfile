FROM node:26-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
COPY frontend/src/data/characters.json /data/characters.json

RUN npx prisma generate && npm run build

ENV CHARACTERS_JSON_PATH=/data/characters.json
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main.js"]
