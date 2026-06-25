const { sql, poolPromise } = require('./db.js');

poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_status'");
        console.dir(res.recordset);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
