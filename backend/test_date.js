const { sql, poolPromise } = require('./db');

async function main() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT TOP 1 created_at FROM bookings ORDER BY id DESC");
    const dateStr = res.recordset[0].created_at;
    console.log("Type of dateStr:", typeof dateStr);
    console.log("Raw date:", dateStr);
    console.log("ISO:", dateStr.toISOString());
    console.log("Local string:", dateStr.toLocaleString('vi-VN'));
    process.exit(0);
}
main();
