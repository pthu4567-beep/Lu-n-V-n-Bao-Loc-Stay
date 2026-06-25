const { sql, poolPromise } = require('./db.js');

poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT id, email, role_id FROM users");
        console.dir(res.recordset);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
