const { sql, poolPromise } = require('./db.js');

poolPromise.then(async pool => {
    try {
        const res = await pool.request().query("SELECT user_id FROM bookings WHERE id = 6");
        console.dir(res.recordset);
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: res.recordset[0].user_id, roleId: 3 }, 'baolocstay_secret_key');
        console.log(token);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
