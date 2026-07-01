const { sql, poolPromise } = require('./db');
async function run() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT id, booking_status FROM bookings WHERE id IN (36, 37)");
    console.log(res.recordset);
    process.exit(0);
}
run();
