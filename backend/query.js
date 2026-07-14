const { sql, poolPromise } = require('./db.js');
poolPromise.then(async pool => {
    const res = await pool.request().query('SELECT hotel_id, COUNT(*) as count FROM room_types GROUP BY hotel_id');
    console.log(res.recordset);
    process.exit();
});
