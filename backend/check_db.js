const { sql, poolPromise } = require('./db.js');

async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'promotions'");
        console.log("PROMOTIONS TABLE:", res.recordset);
        
        // Let's also check columns in bookings
        const res2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'bookings'");
        console.log("BOOKINGS COLUMNS:", res2.recordset.map(r => r.COLUMN_NAME));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
