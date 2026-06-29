const { sql, poolPromise } = require('./db');
const { sendBookingConfirmation } = require('./utils/sendEmail');

const startAutoApproveJob = () => {
    // Chạy mỗi 1 phút
    setInterval(async () => {
        try {
            const pool = await poolPromise;
            // Tìm các đơn hàng đang chờ duyệt ('awaiting_confirmation')
            const result = await pool.request().query(`
                SELECT b.id as booking_id, b.user_id, b.created_at
                FROM bookings b
                LEFT JOIN payments p ON b.id = p.booking_id
                WHERE b.booking_status = 'awaiting_confirmation' OR p.payment_status = 'awaiting_confirmation'
            `);

            for (const row of result.recordset) {
                // Tự động duyệt
                const req = pool.request();
                req.input('bookingId', sql.Int, row.booking_id);
                
                await req.query(`
                    UPDATE bookings 
                    SET booking_status = 'confirmed' 
                    WHERE id = @bookingId;
                    
                    UPDATE payments 
                    SET payment_status = 'paid', verified_by = 1 
                    WHERE booking_id = @bookingId;
                `);

                // Xuất thông báo cho khách hàng
                const notifReq = pool.request();
                notifReq.input('userId', sql.Int, row.user_id);
                notifReq.input('title', sql.NVarChar, 'Đơn hàng được duyệt');
                notifReq.input('message', sql.NVarChar, `Đơn hàng #${row.booking_id} của bạn đã được duyệt thành công! Bạn có thể xem chi tiết trong phần Đơn hàng của tôi.`);
                await notifReq.query(`
                    IF OBJECT_ID('notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO notifications (user_id, title, message)
                        VALUES (@userId, @title, @message)
                    END
                `);
                // Lấy thông tin chi tiết đơn hàng để gửi email
                const emailDataReq = pool.request();
                emailDataReq.input('bId', sql.Int, row.booking_id);
                const emailDataRes = await emailDataReq.query(`
                    SELECT 
                        b.id as bookingId,
                        u.email as customerEmail,
                        u.full_name as customerName,
                        h.name as homestayName,
                        rt.name as roomTypeName,
                        b.created_at as bookingDate,
                        bd.check_in_datetime as checkInDate,
                        bd.check_out_datetime as checkOutDate,
                        p.payment_method as paymentMethod,
                        b.total_amount as totalAmount
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN hotels h ON b.hotel_id = h.id
                    LEFT JOIN booking_details bd ON b.id = bd.booking_id
                    LEFT JOIN rooms r ON bd.room_id = r.id
                    LEFT JOIN room_types rt ON r.room_type_id = rt.id
                    LEFT JOIN payments p ON b.id = p.booking_id
                    WHERE b.id = @bId
                `);

                if (emailDataRes.recordset.length > 0) {
                    const bData = emailDataRes.recordset[0];
                    try {
                        sendBookingConfirmation(bData, bData.customerEmail);
                    } catch (mailErr) {
                        console.error('Lỗi gửi email trong cron:', mailErr);
                    }
                }

                console.log(`[Auto-Approve] Đã tự động duyệt đơn hàng #${row.booking_id}`);
            }
        } catch (err) {
            console.error('Lỗi cron job auto-approve:', err);
        }
    }, 60 * 1000); // 1 phút chạy 1 lần
};

module.exports = { startAutoApproveJob };
