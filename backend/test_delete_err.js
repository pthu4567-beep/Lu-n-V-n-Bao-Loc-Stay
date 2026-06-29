const { sql, poolPromise } = require('./db');

async function testDelete() {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        // Lấy một booking ngẫu nhiên để test
        const result = await request.query('SELECT TOP 1 id FROM bookings ORDER BY id DESC');
        if (result.recordset.length > 0) {
            const bId = result.recordset[0].id;
            console.log("Thử xóa booking_id:", bId);
            
            // Xóa các bảng liên quan như trong controller
            await request.query(`DELETE FROM payments WHERE booking_id = ${bId}`);
            await request.query(`DELETE FROM booking_details WHERE booking_id = ${bId}`);
            await request.query(`DELETE FROM reviews WHERE booking_id = ${bId}`);
            
            // Xóa bảng bookings để xem lỗi
            await request.query(`DELETE FROM bookings WHERE id = ${bId}`);
            console.log("Xóa thành công. (Có thể rollback nếu cần nhưng đây là test)");
        } else {
            console.log("Không có booking nào");
        }
    } catch (err) {
        console.error("Lỗi xóa booking:", err.message);
    } finally {
        process.exit(0);
    }
}
testDelete();
