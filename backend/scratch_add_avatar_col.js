const { poolPromise } = require('./db.js');

async function run() {
  try {
    const pool = await poolPromise;
    // Check if column exists, if not add it
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'
      )
      BEGIN
        ALTER TABLE users ADD avatar VARCHAR(255)
      END
    `);
    console.log('Avatar column is ready in users table');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
run();
