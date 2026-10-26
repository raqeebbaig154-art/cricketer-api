# Cricketer Management REST API

CRUD REST API built with Node.js, Express and SQLite. Tested with Postman.
Course: SW426 Software Quality Engineering (MUET SZAB Campus, Khairpur Mir's).

## Run
```bash
npm install
npm start          # http://localhost:3000/api/cricketers
```

## Endpoints
| Operation | Method | URL | Success |
|---|---|---|---|
| Create | POST | /api/cricketers | 201 |
| Read all | GET | /api/cricketers (optional `?team=`) | 200 |
| Read one | GET | /api/cricketers/:id | 200 / 404 |
| Update | PUT | /api/cricketers/:id | 200 / 404 |
| Delete | DELETE | /api/cricketers/:id | 200 / 404 |

Request body: `{ "name", "jerseyNo", "team", "role", "matches", "runs" }`
(`role` is Batsman, Bowler, All-rounder or Wicket-keeper). Errors: 400 invalid data, 404 not found, 409 duplicate jersey number.

## Postman tests
Import `postman/cricketer-api.postman_collection.json` into Postman (variable `baseUrl` = http://localhost:3000) and run the collection (15 requests, 45 assertions).
Or from the command line: `npm test` (starts the API on a fresh database and runs the collection with Newman).
