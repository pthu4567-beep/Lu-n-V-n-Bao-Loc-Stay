const { sql, poolPromise } = require('./db.js');
poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'reviews'");
        console.dir(res.recordset.map(r => r.COLUMN_NAME));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
