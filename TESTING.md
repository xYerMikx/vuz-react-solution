# Tests

Backend tests live in `backend/`. PostgreSQL and Redis from `docker compose up -d` must be running for the end-to-end file. The API process itself does not need to be running: the e2e suite boots Nest in the same process and talks to the databases.

```bash
cd backend
npm test
npm run test:e2e
```

`npm test` is Jest and does not need the databases. `npm run test:e2e` is the same runner with supertest. Nest 12 is published as ESM, and Jest only loads those packages when Node is started with `--experimental-vm-modules`, so that flag is set on the e2e script.

## Unit

Cursor codec:

- a name cursor and an id cursor survive encode and decode
- a value that is not base64 JSON is rejected
- a cursor with the wrong shape is rejected

Cache key:

- tag order does not change the key
- a different search changes the key
- the cache version is part of the key

Read-through cache:

- a stored value is returned and the loader is not called
- a miss loads the value and stores it
- a failed read still returns the loaded value and does not try to write
- a failed write still returns the loaded value
- unreadable JSON is treated as a miss and loaded again
- a failed version read is reported as unavailable, so the caller skips the cache

Squad rules:

- a seventh id is `SQUAD_FULL`, a repeated id is `DUPLICATE_MEMBER`
- a duplicate on an already full squad is still reported as a duplicate
- an empty roster is allowed
- a squad name is trimmed, and an empty name or a name longer than 40 characters is rejected

## End to end

Auth, against PostgreSQL:

- a password shorter than 8 characters is `400` / `VALIDATION_ERROR`
- register returns the user, sets `httpOnly` `SameSite=Strict` cookies, and does not put a token in the body
- `GET /auth/me` reads the user from the access cookie
- registering the same email again, in any letter case, is `409` / `EMAIL_TAKEN`
- an unknown email and a wrong password are both `401` / `INVALID_CREDENTIALS`
- refresh replaces the refresh cookie; presenting the previous one revokes every session, including the replacement
- logout makes the old refresh cookie fail
- `GET /auth/me` without an access cookie is `401`

Squads, against PostgreSQL, with two registered users. The guard is on every route:

- `GET` and `POST /squads` without an access cookie are `401`
- a squad created by one user is absent from the other user's list
- the other user's `GET`, `PATCH`, `DELETE`, add, and remove on that id are all `404` / `SQUAD_NOT_FOUND`
- the stored name is trimmed
- rename, replace the roster, remove a member, delete the squad
- removing a character who is not in the squad is `404` / `MEMBER_NOT_FOUND`
- adding the same character twice is `409` / `DUPLICATE_MEMBER`
- an unknown character id is `422` / `CHARACTER_NOT_FOUND`
- the seventh character is `422` / `SQUAD_FULL`, and the squad still has 6
- two parallel adds into a squad of 5 finish as one `201` and one `422`, and the squad has 6 members
- two parallel adds of the same character finish as one `201` and one `409`, and the squad has 1 member
- ability averages match the seeded scores and change after a member is removed

Characters, against the seeded database:

- a page of one character, then the next page, and the ids differ
- `search=SCORP` includes Scorpion
- `tags=robot,alien` returns only characters that have at least one of those tags
- `universe=mortal kombat` returns only that universe
- filters contain both `grapple` and `grappling`
- a garbage cursor is `400` / `VALIDATION_ERROR`, and id `999999` is `404` / `CHARACTER_NOT_FOUND`
- after Scorpion is renamed in the database, the cached list still says Scorpion until `chars:version` is incremented
