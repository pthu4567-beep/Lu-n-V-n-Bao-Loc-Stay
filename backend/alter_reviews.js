const { sql, poolPromise } = require('./db.js');
poolPromise.then(async pool => {
    try {
        await pool.request().query("ALTER TABLE reviews ADD reply_comment NVARCHAR(MAX) NULL;");
        console.log("Thêm cột reply_comment thành công!");
    } catch (e) {
        if (e.message.includes('already has a column')) {
            console.log("Cột đã tồn tại!");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
});
