#!/usr/bin/env bash
# Starts the API on a throw-away database and runs the Postman collection with Newman.
set -e
rm -f test.db test.db-wal test.db-shm
DB_FILE=test.db PORT=3000 node server.js & PID=$!
sleep 1.5
npx --yes newman run postman/cricketer-api.postman_collection.json || STATUS=$?
kill $PID; rm -f test.db test.db-wal test.db-shm
exit ${STATUS:-0}
