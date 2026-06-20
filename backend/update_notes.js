const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:root@localhost:5432/expense_tracker' });
pool.query("UPDATE transactions SET notes = regexp_replace(notes, 'Contract #([0-9a-f]{8})[0-9a-f-]{28}', 'Contract #\\1', 'g') WHERE notes LIKE '%Contract #%';").then(res => { console.log("Rows updated:", res.rowCount); process.exit(0); }).catch(console.error);
