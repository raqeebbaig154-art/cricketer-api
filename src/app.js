const express = require('express');

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

const toApi = (r) => ({
  id: r.id,
  name: r.name,
  jerseyNo: r.jersey_no,
  team: r.team,
  role: r.role,
  matches: r.matches,
  runs: r.runs,
  createdAt: r.created_at,
});

// Validates a request body. Returns { errors: [...], value: {...} }.
function validate(body) {
  const errors = [];
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const isInt = (v) => Number.isInteger(v);

  if (typeof b.name !== 'string' || b.name.trim() === '') errors.push('name is required and must be a non-empty string');
  if (typeof b.team !== 'string' || b.team.trim() === '') errors.push('team is required and must be a non-empty string');
  if (!isInt(b.jerseyNo) || b.jerseyNo < 0 || b.jerseyNo > 999) errors.push('jerseyNo is required and must be an integer between 0 and 999');
  if (!ROLES.includes(b.role)) errors.push(`role is required and must be one of: ${ROLES.join(', ')}`);
  if (b.matches !== undefined && (!isInt(b.matches) || b.matches < 0)) errors.push('matches must be an integer >= 0');
  if (b.runs !== undefined && (!isInt(b.runs) || b.runs < 0)) errors.push('runs must be an integer >= 0');

  return {
    errors,
    value: {
      name: typeof b.name === 'string' ? b.name.trim() : b.name,
      jerseyNo: b.jerseyNo,
      team: typeof b.team === 'string' ? b.team.trim() : b.team,
      role: b.role,
      matches: b.matches ?? 0,
      runs: b.runs ?? 0,
    },
  };
}

function createApp(db) {
  const app = express();
  app.use(express.json());

  const q = {
    all: db.prepare('SELECT * FROM cricketers ORDER BY id'),
    byId: db.prepare('SELECT * FROM cricketers WHERE id = ?'),
    byJersey: db.prepare('SELECT id FROM cricketers WHERE jersey_no = ?'),
    insert: db.prepare(
      'INSERT INTO cricketers (name, jersey_no, team, role, matches, runs) VALUES (@name, @jerseyNo, @team, @role, @matches, @runs)'
    ),
    update: db.prepare(
      'UPDATE cricketers SET name=@name, jersey_no=@jerseyNo, team=@team, role=@role, matches=@matches, runs=@runs WHERE id=@id'
    ),
    del: db.prepare('DELETE FROM cricketers WHERE id = ?'),
  };

  // Rejects ids such as "abc", "1.5", "-3" with 400 before touching the DB.
  const parseId = (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id', details: ['id must be a positive integer'] });
    }
    req.id = Number(req.params.id);
    next();
  };

  // CREATE
  app.post('/api/cricketers', (req, res) => {
    const { errors, value } = validate(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    if (q.byJersey.get(value.jerseyNo)) {
      return res.status(409).json({ error: 'Conflict', details: [`jerseyNo ${value.jerseyNo} is already taken`] });
    }
    const info = q.insert.run(value);
    res.status(201).json(toApi(q.byId.get(info.lastInsertRowid)));
  });

  // READ all (optional ?team= filter)
  app.get('/api/cricketers', (req, res) => {
    let rows = q.all.all();
    if (typeof req.query.team === 'string') {
      rows = rows.filter((r) => r.team.toLowerCase() === req.query.team.toLowerCase());
    }
    res.status(200).json(rows.map(toApi));
  });

  // READ one
  app.get('/api/cricketers/:id', parseId, (req, res) => {
    const row = q.byId.get(req.id);
    if (!row) return res.status(404).json({ error: 'Not Found', details: [`No cricketer with id ${req.id}`] });
    res.status(200).json(toApi(row));
  });

  // UPDATE (full replacement)
  app.put('/api/cricketers/:id', parseId, (req, res) => {
    if (!q.byId.get(req.id)) return res.status(404).json({ error: 'Not Found', details: [`No cricketer with id ${req.id}`] });
    const { errors, value } = validate(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const clash = q.byJersey.get(value.jerseyNo);
    if (clash && clash.id !== req.id) {
      return res.status(409).json({ error: 'Conflict', details: [`jerseyNo ${value.jerseyNo} is already taken`] });
    }
    q.update.run({ ...value, id: req.id });
    res.status(200).json(toApi(q.byId.get(req.id)));
  });

  // DELETE
  app.delete('/api/cricketers/:id', parseId, (req, res) => {
    const info = q.del.run(req.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not Found', details: [`No cricketer with id ${req.id}`] });
    res.status(200).json({ message: `Cricketer ${req.id} deleted` });
  });

  // Malformed JSON and unknown routes return JSON, not HTML.
  app.use((req, res) => res.status(404).json({ error: 'Not Found', details: ['Unknown route'] }));
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON', details: ['Request body is not valid JSON'] });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };
