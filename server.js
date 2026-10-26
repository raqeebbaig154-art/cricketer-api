const { openDb } = require('./src/db');
const { createApp } = require('./src/app');

const PORT = process.env.PORT || 3000;
const db = openDb();
createApp(db).listen(PORT, () => {
  console.log(`Cricketer API running at http://localhost:${PORT}/api/cricketers`);
});
