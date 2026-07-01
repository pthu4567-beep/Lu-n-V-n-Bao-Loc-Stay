const { sql, poolPromise } = require('./db');
async function run() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT id, email, role_id, hotel_id FROM users WHERE email='cam@test.com'");
    console.log(res.recordset);
    process.exit(0);
}
run();
