const { poolPromise } = require('./db.js');
async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT @@VERSION");
        console.log(res.recordset[0]);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
