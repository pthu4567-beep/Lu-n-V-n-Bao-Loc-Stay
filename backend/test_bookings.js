const { sql, poolPromise } = require('./db.js');

poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT id, user_id FROM bookings WHERE id >= 6");
        console.dir(res.recordset);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
