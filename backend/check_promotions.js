const { sql, poolPromise } = require('./db.js');

async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'promotions'");
        console.log("PROMOTIONS COLUMNS:", res.recordset);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
