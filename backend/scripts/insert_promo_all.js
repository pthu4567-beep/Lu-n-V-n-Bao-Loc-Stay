const { sql, poolPromise } = require('./db.js');

async function insertPromoAllHotels() {
    try {
        const pool = await poolPromise;
        const hotels = await pool.request().query("SELECT id FROM hotels");
        
        for (const h of hotels.recordset) {
            // Check if promo already exists for this hotel
            const check = await pool.request()
                .input('hId', sql.Int, h.id)
                .query("SELECT * FROM promotions WHERE hotel_id = @hId AND discount_code = 'GIAM10'");
                
            if (check.recordset.length === 0) {
                await pool.request()
                    .input('hId', sql.Int, h.id)
                    .query("INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) VALUES (@hId, 'GIAM10', 10, '2026-12-31')");
                console.log(`Inserted GIAM10 for hotel ID ${h.id}`);
            }
        }
        console.log('Thành công!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

insertPromoAllHotels();
