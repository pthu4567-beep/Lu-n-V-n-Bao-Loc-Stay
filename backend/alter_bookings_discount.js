const { sql, poolPromise } = require('./db.js');

async function alterBookings() {
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Kiểm tra và thêm cột promotion_id
            await transaction.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'promotion_id'
                )
                BEGIN
                    ALTER TABLE bookings ADD promotion_id INT NULL;
                    ALTER TABLE bookings ADD CONSTRAINT FK_Bookings_Promotions FOREIGN KEY (promotion_id) REFERENCES promotions(id);
                END
            `);

            // Kiểm tra và thêm cột discount_percent
            await transaction.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'discount_percent'
                )
                BEGIN
                    ALTER TABLE bookings ADD discount_percent FLOAT NULL;
                END
            `);

            // Kiểm tra và thêm cột discount_amount
            await transaction.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'discount_amount'
                )
                BEGIN
                    ALTER TABLE bookings ADD discount_amount DECIMAL(18,2) NULL;
                END
            `);

            await transaction.commit();
            console.log('Thêm các cột giảm giá vào bảng bookings thành công!');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (e) {
        console.error('Lỗi Alter DB:', e);
    } finally {
        process.exit();
    }
}

alterBookings();
