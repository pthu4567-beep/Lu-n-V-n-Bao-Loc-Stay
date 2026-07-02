const { poolPromise } = require('./db.js');
async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT DISTINCT booking_status FROM bookings;
            SELECT DISTINCT payment_status FROM payments;
        `);
        console.dir(res.recordsets, { depth: null });
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
