const { sql, poolPromise } = require('./db.js');

async function seedPromotions() {
    try {
        const pool = await poolPromise;
        
        // Xóa tất cả promotion cũ (hoặc chỉ xoá nếu muốn làm mới hoàn toàn)
        await pool.request().query("DELETE FROM promotions");

        const hotels = await pool.request().query("SELECT id FROM hotels");
        
        const promos = [
            { code: 'GIAM10', percent: 10, validUntil: '2026-12-31', desc: 'Khuyến mãi đặc biệt' },
            { code: 'MUAHE30', percent: 30, validUntil: '2026-08-31', desc: 'Hè rực rỡ' },
            { code: 'TET20', percent: 20, validUntil: '2027-02-15', desc: 'Tết Nguyên Đán' },
            { code: 'TUAN15', percent: 15, validUntil: '2026-12-31', desc: 'Cuối tuần' }
        ];

        for (const h of hotels.recordset) {
            for (const p of promos) {
                await pool.request()
                    .input('hId', sql.Int, h.id)
                    .input('code', sql.VarChar, p.code)
                    .input('percent', sql.Float, p.percent)
                    .input('valid', sql.Date, p.validUntil)
                    .query(`
                        INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) 
                        VALUES (@hId, @code, @percent, @valid)
                    `);
            }
        }
        console.log(' Đã tạo thành công bộ mã khuyến mãi mới cho toàn bộ Homestay!');
    } catch (e) {
        console.error('Lỗi seed promotions:', e);
    } finally {
        process.exit();
    }
}

seedPromotions();
