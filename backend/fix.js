const { sql, poolPromise } = require('./db');
async function run() {
    const pool = await poolPromise;
    await pool.request().query("UPDATE users SET hotel_id = 1 WHERE email='cam@test.com'");
    console.log("Updated hotel_id for cam@test.com to 1");
    process.exit(0);
}
run();
