const { sql, poolPromise } = require('../db');
const { sendBookingConfirmation } = require('../utils/sendEmail');

exports.getBookings = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;

        let query = `
            SELECT 
                b.id,
                b.id as bookingId, 
                u.email as userEmail, 
                h.name as homestayName, 
                b.total_amount as amount, 
                b.deposit_amount,
                b.remaining_amount,
                b.refund_amount,
                CASE 
                    WHEN b.booking_status = 'refund_pending' THEN 'refund_pending'
                    WHEN p.payment_status = 'paid' AND b.booking_status != 'refund_pending' AND b.booking_status != 'completed' AND b.booking_status != 'checked_in' AND b.booking_status != 'checked_out' THEN 'confirmed' 
                    WHEN b.booking_status = 'completed' THEN 'completed'
                    ELSE COALESCE(b.booking_status, p.payment_status) 
                END as status,
                p.payment_method,
                b.created_at,
                rt.name as roomName,
                bd.check_in_datetime,
                bd.check_out_datetime,
                b.guest_cccd
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
            JOIN users u ON b.user_id = u.id
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            LEFT JOIN rooms r ON bd.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
        `;
        const request = pool.request();

        if (roleId === 2) {
            query += ` WHERE h.owner_id = @ownerId`;
            request.input('ownerId', sql.Int, userId);
        } else if (roleId === 4) {
            query += ` WHERE b.hotel_id = @hotelId`;
            request.input('hotelId', sql.Int, req.user.hotelId);
        }

        query += ` ORDER BY b.created_at DESC`;

        const result = await request.query(query);
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId);
        const pool = await poolPromise;
        const adminId = req.user.id;

        const request = pool.request();
        request.input('bookingId', sql.Int, bookingId);
        request.input('adminId', sql.Int, adminId);

        // Check if there is remaining_amount
        const bookingReq = pool.request();
        bookingReq.input('bookingId', sql.Int, bookingId);
        const bookingRes = await bookingReq.query(`SELECT remaining_amount FROM bookings WHERE id = @bookingId`);
        const b = bookingRes.recordset[0];
        
        let newBookingStatus = 'confirmed';
        let newPaymentStatus = 'paid';

        if (b && b.remaining_amount > 0) {
            newBookingStatus = 'deposited';
            newPaymentStatus = 'partially_paid';
        }

        // Update booking status
        await request.query(`
            UPDATE bookings 
            SET booking_status = '${newBookingStatus}' 
            WHERE id = @bookingId
        `);

        // Update payment status
        await request.query(`
            UPDATE payments 
            SET payment_status = '${newPaymentStatus}', verified_by = @adminId 
            WHERE booking_id = @bookingId
        `);

        // Lấy thông tin chi tiết đơn hàng để gửi email
        const emailDataReq = pool.request();
        emailDataReq.input('bId', sql.Int, bookingId);
        const emailDataRes = await emailDataReq.query(`
            SELECT 
                b.id as bookingId,
                u.email as customerEmail,
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
            // Gọi hàm gửi email bất đồng bộ, bọc trong try...catch
            try {
                // Không dùng await để không làm chậm API
                sendBookingConfirmation(bData, bData.customerEmail);
            } catch (mailErr) {
                console.error('Lỗi khi gọi hàm sendBookingConfirmation:', mailErr);
            }
        }

        res.json({ success: true, message: 'Duyệt thanh toán thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { status, room_id } = req.body; // status: 'checked_in', 'checked_out'
        const pool = await poolPromise;

        const request = pool.request();
        request.input('bookingId', sql.Int, bookingId);
        request.input('status', sql.VarChar, status);

        await request.query(`
            UPDATE bookings 
            SET booking_status = @status 
            WHERE id = @bookingId
        `);

        // If completed/checked out, automatically free the physical room
        if (['completed', 'checked_out', 'cancelled', 'rejected'].includes(status)) {
            const getRoomReq = pool.request();
            getRoomReq.input('bId', sql.Int, bookingId);
            const roomRes = await getRoomReq.query(`SELECT room_id FROM booking_details WHERE booking_id = @bId`);
            
            if (roomRes.recordset.length > 0) {
                for (let i = 0; i < roomRes.recordset.length; i++) {
                    const rId = roomRes.recordset[i].room_id;
                    if (rId) {
                        const roomReq = pool.request();
                        roomReq.input('roomId', sql.Int, rId);
                        await roomReq.query(`
                            UPDATE rooms 
                            SET status = 'available' 
                            WHERE id = @roomId
                        `);
                    }
                }
            }
        }

        res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.notifyPaid = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.user.id;
        const pool = await poolPromise;

        // Query kiểm tra đơn hàng có tồn tại và thuộc về user không
        const checkReq = pool.request();
        checkReq.input('bookingId', sql.Int, bookingId);
        const checkRes = await checkReq.query(`SELECT user_id FROM bookings WHERE id = @bookingId`);

        if (checkRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        if (String(checkRes.recordset[0].user_id) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối!' });
        }

        // Thực hiện 2 lệnh UPDATE
        const updateReq = pool.request();
        updateReq.input('bookingId', sql.Int, bookingId);
        
        await updateReq.query(`
            UPDATE payments 
            SET payment_status = 'awaiting_confirmation' 
            WHERE booking_id = @bookingId;
            
            UPDATE bookings 
            SET booking_status = 'awaiting_confirmation' 
            WHERE id = @bookingId;
        `);

        res.json({ success: true, message: 'Đã thông báo thanh toán thành công!' });
    } catch (err) {
        console.error('Lỗi trong notifyPaid:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.submitReview = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const pool = await poolPromise;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Điểm đánh giá không hợp lệ!' });
        }

        // Check if booking belongs to user
        const checkReq = pool.request();
        checkReq.input('bookingId', sql.Int, bookingId);
        const checkRes = await checkReq.query(`SELECT user_id, booking_status FROM bookings WHERE id = @bookingId`);

        if (checkRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        if (String(checkRes.recordset[0].user_id) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá đơn hàng này!' });
        }

        // Check if already reviewed
        const reviewCheckReq = pool.request();
        reviewCheckReq.input('bookingId', sql.Int, bookingId);
        const reviewCheckRes = await reviewCheckReq.query(`SELECT id FROM reviews WHERE booking_id = @bookingId`);
        if (reviewCheckRes.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá đơn hàng này rồi!' });
        }

        // Insert review
        const insertReq = pool.request();
        insertReq.input('bookingId', sql.Int, bookingId);
        insertReq.input('userId', sql.Int, userId);
        insertReq.input('rating', sql.Int, rating);
        insertReq.input('comment', sql.NVarChar, comment || '');

        await insertReq.query(`
            INSERT INTO reviews (booking_id, user_id, rating_score, comment, status)
            VALUES (@bookingId, @userId, @rating, @comment, 'pending')
        `);

        res.json({ success: true, message: 'Đánh giá thành công! Đang chờ duyệt.' });
    } catch (err) {
        console.error('Lỗi trong submitReview:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.earlyCheckout = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { new_checkout_datetime } = req.body;
        const userId = req.user.id;
        const pool = await poolPromise;

        if (!new_checkout_datetime) {
            return res.status(400).json({ success: false, message: 'Thiếu thời gian trả phòng mới (new_checkout_datetime)' });
        }

        const newCheckout = new Date(new_checkout_datetime);
        const now = new Date();

        // Check if booking exists, belongs to user, and is checked_in
        const checkReq = pool.request();
        checkReq.input('bookingId', sql.Int, bookingId);
        const bookingRes = await checkReq.query(`
            SELECT b.id, b.user_id, b.total_amount, b.booking_status, bd.check_in_datetime, bd.check_out_datetime
            FROM bookings b
            JOIN booking_details bd ON b.id = bd.booking_id
            WHERE b.id = @bookingId
        `);

        if (bookingRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const booking = bookingRes.recordset[0];
        
        // Cập nhật: Cho phép admin/owner thao tác, nếu không phải admin/owner thì check user_id
        if (req.user.roleId === 3 && String(booking.user_id) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên đơn hàng này' });
        }

        if (booking.booking_status !== 'checked_in') {
            return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái đang sử dụng (checked_in)' });
        }

        const oldCheckout = new Date(booking.check_out_datetime);
        const checkIn = new Date(booking.check_in_datetime);

        if (newCheckout >= oldCheckout) {
             return res.status(400).json({ success: false, message: 'Thời gian trả phòng mới phải sớm hơn thời gian trả phòng cũ' });
        }

        // Tính toán số đêm ban đầu
        const msPerDay = 1000 * 60 * 60 * 24;
        const totalNights = Math.round((oldCheckout - checkIn) / msPerDay);
        
        // Tính số đêm chưa sử dụng
        const unusedNights = Math.round((oldCheckout - newCheckout) / msPerDay);

        const pricePerNight = totalNights > 0 ? booking.total_amount / totalNights : 0;
        
        // Số giờ báo trước
        const noticeHours = (newCheckout - now) / (1000 * 60 * 60);

        let refundAmount = 0;
        if (noticeHours >= 48) {
            refundAmount = unusedNights * pricePerNight * 0.8;
        } else if (noticeHours >= 24 && noticeHours < 48) {
            refundAmount = unusedNights * pricePerNight * 0.5;
        } else {
            refundAmount = 0;
        }

        // Cập nhật database
        const updateReq = pool.request();
        updateReq.input('bookingId', sql.Int, bookingId);
        updateReq.input('newCheckout', sql.DateTime, newCheckout);
        updateReq.input('refundAmount', sql.Decimal(18, 2), refundAmount);

        await updateReq.query(`
            UPDATE booking_details SET check_out_datetime = @newCheckout WHERE booking_id = @bookingId;
            UPDATE bookings SET booking_status = 'refund_pending', refund_amount = @refundAmount WHERE id = @bookingId;
        `);

        res.json({ success: true, message: 'Yêu cầu trả phòng sớm đã được ghi nhận', data: { refundAmount } });

    } catch (err) {
        console.error('Lỗi trong earlyCheckout:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.approveRefund = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const pool = await poolPromise;

        const checkReq = pool.request();
        checkReq.input('bookingId', sql.Int, bookingId);
        
        const bookingRes = await checkReq.query(`
            SELECT b.booking_status, bd.room_id 
            FROM bookings b
            JOIN booking_details bd ON b.id = bd.booking_id
            WHERE b.id = @bookingId
        `);

        if (bookingRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const booking = bookingRes.recordset[0];
        if (booking.booking_status !== 'refund_pending') {
             return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái chờ hoàn tiền' });
        }

        const roomId = booking.room_id;

        const updateReq = pool.request();
        updateReq.input('bookingId', sql.Int, bookingId);
        updateReq.input('roomId', sql.Int, roomId);

        await updateReq.query(`
            UPDATE bookings SET booking_status = 'completed' WHERE id = @bookingId;
        `);

        if (roomId) {
            await updateReq.query(`
                UPDATE rooms SET status = 'available' WHERE id = @roomId;
            `);
        }

        res.json({ success: true, message: 'Đã duyệt hoàn tiền và giải phóng phòng thành công' });

    } catch (err) {
        console.error('Lỗi trong approveRefund:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.checkInBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const pool = await poolPromise;

        const request = pool.request();
        request.input('bId', sql.Int, bookingId);
        const checkRes = await request.query("SELECT booking_status FROM bookings WHERE id = @bId");
        
        if (checkRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng!' });
        }
        
        const { cccd } = req.body; // Lấy CCCD từ request body

        if (checkRes.recordset[0].booking_status !== 'confirmed') {
            return res.status(400).json({ error: 'Đơn hàng không ở trạng thái hợp lệ để nhận phòng!' });
        }

        const updateReq = pool.request();
        updateReq.input('bId', sql.Int, bookingId);
        let updateQuery = "UPDATE bookings SET booking_status = 'checked_in'";
        if (cccd) {
            updateQuery += ", guest_cccd = @cccd";
            updateReq.input('cccd', sql.VarChar, cccd);
        }
        updateQuery += " WHERE id = @bId";

        await updateReq.query(updateQuery);

        // Cập nhật trạng thái phòng thành 'occupied' (đã có khách)
        const roomRes = await pool.request()
            .input('bId', sql.Int, bookingId)
            .query("SELECT room_id FROM booking_details WHERE booking_id = @bId");
            
        if (roomRes.recordset.length > 0 && roomRes.recordset[0].room_id) {
            const roomId = roomRes.recordset[0].room_id;
            await pool.request()
                .input('roomId', sql.Int, roomId)
                .query("UPDATE rooms SET status = 'occupied' WHERE id = @roomId");
        }

        res.json({ success: true, message: 'Khách đã nhận phòng thành công!' });
    } catch (err) {
        console.error('Lỗi khi check-in:', err);
        res.status(500).json({ error: 'Lỗi server khi check-in!' });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const roleId = req.user.roleId;
        const pool = await poolPromise;

        // Chỉ admin (roleId 1) và owner (roleId 2) mới được xóa
        if (roleId !== 1 && roleId !== 2) {
             return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
        }

        // Kiểm tra xem đơn hàng có tồn tại không và nếu là owner thì có thuộc khách sạn của mình không
        let checkQuery = `
            SELECT b.id, bd.room_id 
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            WHERE b.id = @bookingId
        `;
        const checkReq = pool.request();
        checkReq.input('bookingId', sql.Int, bookingId);

        if (roleId === 2) {
             checkQuery += ` AND h.owner_id = @ownerId`;
             checkReq.input('ownerId', sql.Int, req.user.id);
        }

        const checkRes = await checkReq.query(checkQuery);
        
        if (checkRes.recordset.length === 0) {
             return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xóa' });
        }

        const deleteReq = pool.request();
        deleteReq.input('bookingId', sql.Int, bookingId);

        // Giải phóng phòng nếu cần thiết trước khi xóa đơn
        const roomsToFree = checkRes.recordset.map(r => r.room_id).filter(id => id != null);
        if (roomsToFree.length > 0) {
            for (let rId of roomsToFree) {
                const roomReq = pool.request();
                roomReq.input('roomId', sql.Int, rId);
                await roomReq.query(`UPDATE rooms SET status = 'available' WHERE id = @roomId`);
            }
        }

        // Xóa các bảng liên quan trước (ON DELETE CASCADE might not be set up)
        await deleteReq.query(`
            DELETE FROM payments WHERE booking_id = @bookingId;
            DELETE FROM booking_details WHERE booking_id = @bookingId;
            DELETE FROM reviews WHERE booking_id = @bookingId;
            DELETE FROM bookings WHERE id = @bookingId;
        `);

        res.json({ success: true, message: 'Xóa đơn hàng thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa đơn hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};
