const { sql, poolPromise } = require('./db.js');

async function createUserPromotions() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_promotions' and xtype='U')
            BEGIN
                CREATE TABLE user_promotions (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    promotion_id INT NOT NULL,
                    is_used BIT DEFAULT 0,
                    saved_at DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_userPromo_User FOREIGN KEY (user_id) REFERENCES users(id),
                    CONSTRAINT FK_userPromo_Promo FOREIGN KEY (promotion_id) REFERENCES promotions(id),
                    CONSTRAINT UQ_UserPromo UNIQUE (user_id, promotion_id)
                )
            END
        `);
        console.log('Tạo bảng user_promotions thành công (hoặc đã tồn tại)!');
    } catch (e) {
        console.error('Lỗi tạo bảng user_promotions:', e);
    } finally {
        process.exit();
    }
}

createUserPromotions();
