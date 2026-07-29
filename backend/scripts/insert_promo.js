const { sql, poolPromise } = require('./db.js');

async function insertPromo() {
    try {
        const pool = await poolPromise;
        await pool.request().query("INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) VALUES (5, 'GIAM10', 10, '2026-12-31')");
        console.log('Inserted promotion GIAM10 for hotel 5');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

insertPromo();
