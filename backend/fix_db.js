const { sql, poolPromise } = require('./db');

async function fixDb() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            UPDATE rooms
            SET status = 'available'
            WHERE status = 'occupied'
            AND NOT EXISTS (
                SELECT 1 
                FROM booking_details bd 
                JOIN bookings b ON bd.booking_id = b.id
                WHERE bd.room_id = rooms.id 
                  AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
                  AND GETDATE() BETWEEN bd.check_in_datetime AND bd.check_out_datetime
            )
        `);
        console.log("Fixed rows affected:", res.rowsAffected);
        process.exit(0);
    } catch (e) {
        console.error("Lỗi:", e);
        process.exit(1);
    }
}
fixDb();
