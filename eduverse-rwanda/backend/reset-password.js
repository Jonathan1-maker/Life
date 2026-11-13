require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

const NEW_PASSWORD = 'Test@1234';
const EXCLUDE = 'admin@eduverse.rw';

(async () => {
  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
  const { rows } = await pool.query(
    'UPDATE users SET password=$1, is_active=true WHERE email != $2 RETURNING email',
    [hashed, EXCLUDE]
  );
  rows.forEach(r => console.log(`✅ Reset: ${r.email}`));
  console.log(`Done. ${rows.length} account(s) updated.`);
  process.exit(0);
})();
