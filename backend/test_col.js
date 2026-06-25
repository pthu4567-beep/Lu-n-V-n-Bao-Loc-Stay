const { sql, poolPromise } = require('./db.js');
poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'room_types'");
        console.dir(res.recordset);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
