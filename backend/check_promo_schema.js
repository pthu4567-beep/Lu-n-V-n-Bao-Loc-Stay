const { sql, poolPromise } = require('./db.js');
poolPromise.then(pool => pool.request().query("SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'promotions'")).then(res => console.log(res.recordset)).finally(() => process.exit());
