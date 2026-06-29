const { poolPromise } = require('./db');

async function main() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'");
    console.dir(result.recordset);
    process.exit(0);
}
main();
