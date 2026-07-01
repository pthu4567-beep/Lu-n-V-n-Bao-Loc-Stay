const { sql, poolPromise } = require('./db');

async function inspectRoles() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM roles;
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
inspectRoles();
