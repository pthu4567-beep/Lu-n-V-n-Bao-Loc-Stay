const { sql, poolPromise } = require('../db.js');

async function seedPromotions() {
    try {
        const pool = await poolPromise;
        
        const hotels = await pool.request().query("SELECT id FROM hotels");
        
        const globalPromos = [
            { code: 'GIAM10', percent: 10, validUntil: '2026-12-31', desc: 'Khuyến mãi đặc biệt' },
            { code: 'MUAHE30', percent: 30, validUntil: '2026-08-31', desc: 'Hè rực rỡ' },
            { code: 'TET20', percent: 20, validUntil: '2027-02-15', desc: 'Tết Nguyên Đán' },
            { code: 'TUAN15', percent: 15, validUntil: '2026-12-31', desc: 'Cuối tuần' },
            { code: 'GIAM5', percent: 5, validUntil: '2026-12-31', desc: 'Giảm giá 5%' },
            { code: 'VUIHE5', percent: 5, validUntil: '2026-08-31', desc: 'Vui hè 5%' }
        ];

        for (const p of globalPromos) {
            await pool.request()
                .input('code', sql.VarChar, p.code)
                .input('percent', sql.Float, p.percent)
                .input('valid', sql.Date, p.validUntil)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM promotions WHERE discount_code = @code AND hotel_id IS NULL)
                    BEGIN
                        INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) 
                        VALUES (NULL, @code, @percent, @valid)
                    END
                `);
        }

        // Thêm một số khuyến mãi riêng cho từng homestay
        if (hotels.recordset.length > 0) {
            await pool.request().input('hId', sql.Int, hotels.recordset[0].id)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM promotions WHERE discount_code = 'WELCOME20' AND hotel_id = @hId)
                    BEGIN
                        INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) VALUES (@hId, 'WELCOME20', 20, '2026-12-31')
                    END
                `);
        }
        if (hotels.recordset.length > 1) {
            await pool.request().input('hId', sql.Int, hotels.recordset[1].id)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM promotions WHERE discount_code = 'SUMMER10' AND hotel_id = @hId)
                    BEGIN
                        INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until) VALUES (@hId, 'SUMMER10', 10, '2026-12-31')
                    END
                `);
        }

        // Cập nhật lại hạn sử dụng cho tất cả mã giảm giá để đảm bảo không bị hết hạn
        await pool.request().query("UPDATE promotions SET valid_until = '2027-12-31'");
        console.log(' Đã tạo thành công bộ mã khuyến mãi (GIAM10, MUAHE30, TET20, TUAN15...) cho toàn bộ hệ thống!');
    } catch (e) {
        console.error('Lỗi seed promotions:', e);
    } finally {
        process.exit();
    }
}

seedPromotions();
