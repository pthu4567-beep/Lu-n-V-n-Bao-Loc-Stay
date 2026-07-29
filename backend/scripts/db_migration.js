const { sql, poolPromise } = require('./db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log("Bat dau cap nhat Database...");

        // 1. Thêm cột guest_cccd vào bảng bookings
        try {
            await pool.request().query(`
                ALTER TABLE bookings
                ADD guest_cccd VARCHAR(20) NULL;
            `);
            console.log("Da them cot guest_cccd vao bang bookings.");
        } catch (e) {
            console.log("Cot guest_cccd co the da ton tai: " + e.message);
        }

        // 2. Thêm cột hotel_id vào bảng users
        try {
            await pool.request().query(`
                ALTER TABLE users
                ADD hotel_id INT NULL;
            `);
            console.log("Da them cot hotel_id vao bang users.");
        } catch (e) {
            console.log("Cot hotel_id co the da ton tai: " + e.message);
        }

        // 3. Them vai tro Staff (ID 4)
        try {
            // Xem neu co ID 4 chua
            const check = await pool.request().query("SELECT id FROM roles WHERE id = 4");
            if (check.recordset.length === 0) {
                // Roles table might have IDENTITY insert ON, let's try inserting with specific ID if possible, or just insert role_name.
                // Normally if it's identity, we can SET IDENTITY_INSERT roles ON
                await pool.request().query(`
                    SET IDENTITY_INSERT roles ON;
                    INSERT INTO roles (id, role_name) VALUES (4, 'Staff');
                    SET IDENTITY_INSERT roles OFF;
                `);
                console.log("Da them Role Staff (4).");
            } else {
                console.log("Role 4 da ton tai.");
            }
        } catch (e) {
            console.log("Loi khi them role 4 (Co the ko co IDENTITY): " + e.message);
            try {
                 await pool.request().query(`
                    INSERT INTO roles (id, role_name) VALUES (4, 'Staff');
                `);
                 console.log("Da them Role Staff (4) (khong co IDENTITY_INSERT).");
            } catch (e2) {
                 console.log("Van khong the them Role 4: " + e2.message);
            }
        }

        console.log("Cap nhat Database thanh cong.");
        process.exit(0);
    } catch (err) {
        console.error("Loi migrate:", err);
        process.exit(1);
    }
}
migrate();
