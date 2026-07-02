const { poolPromise } = require('./db.js');

async function alterDb() {
    try {
        const pool = await poolPromise;
        console.log("Bat dau cap nhat Database...");

        try {
            await pool.request().query(`
                ALTER TABLE bookings
                ADD deposit_amount DECIMAL(18, 2) DEFAULT 0,
                    remaining_amount DECIMAL(18, 2) DEFAULT 0;
            `);
            console.log("Da them cot deposit_amount va remaining_amount vao bang bookings.");
        } catch (e) {
            console.log("Cot co the da ton tai: " + e.message);
        }

        console.log("Cap nhat Database thanh cong.");
        process.exit(0);
    } catch (err) {
        console.error("Loi migrate:", err);
        process.exit(1);
    }
}
alterDb();
