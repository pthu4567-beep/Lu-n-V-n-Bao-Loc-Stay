const { sql, poolPromise } = require('../db');

// =====================================
// QUẢN LÝ NGƯỜI DÙNG (USERS)
// =====================================

exports.getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, role_id, email, phone, created_at, is_blocked, hotel_id FROM users ORDER BY id DESC');
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role_id, hotel_id } = req.body;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('id', sql.Int, userId);
        request.input('role_id', sql.Int, role_id);

        let query = 'UPDATE users SET role_id = @role_id';
        if (role_id === 4 && hotel_id) {
            query += ', hotel_id = @hotel_id';
            request.input('hotel_id', sql.Int, hotel_id);
        } else {
            query += ', hotel_id = NULL';
        }
        query += ' WHERE id = @id';

        await request.query(query);
        res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { is_blocked } = req.body; // 1: blocked, 0: active
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('id', sql.Int, userId);
        request.input('is_blocked', sql.Bit, is_blocked ? 1 : 0);

        await request.query('UPDATE users SET is_blocked = @is_blocked WHERE id = @id');
        res.json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('id', sql.Int, userId);

        await request.query('DELETE FROM users WHERE id = @id');
        res.json({ success: true, message: 'Xóa tài khoản thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// =====================================
// QUẢN LÝ REVIEWS (ĐÁNH GIÁ)
// =====================================

exports.getReviews = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;

        let query = `
            SELECT r.*, h.name as hotel_name, u.email as user_email
            FROM reviews r
            JOIN bookings b ON r.booking_id = b.id
            JOIN hotels h ON b.hotel_id = h.id
            JOIN users u ON r.user_id = u.id
        `;
        
        const request = pool.request();
        
        if (roleId === 2) {
            query += ` WHERE h.owner_id = @ownerId`;
            request.input('ownerId', sql.Int, userId);
        }

        query += ` ORDER BY r.created_at DESC`;
        
        const result = await request.query(query);
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateReviewStatus = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { status } = req.body; // 'approved', 'hidden'
        const pool = await poolPromise;

        const request = pool.request();
        request.input('id', sql.Int, reviewId);
        request.input('status', sql.VarChar, status);

        await request.query('UPDATE reviews SET status = @status WHERE id = @id');
        res.json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const pool = await poolPromise;

        const request = pool.request();
        request.input('id', sql.Int, reviewId);

        await request.query('DELETE FROM reviews WHERE id = @id');
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// =====================================
// QUẢN LÝ LIÊN HỆ (CONTACTS)
// =====================================

exports.getContacts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.replyContact = async (req, res) => {
    try {
        const contactId = parseInt(req.params.id);
        const pool = await poolPromise;

        const request = pool.request();
        request.input('id', sql.Int, contactId);

        // Update status to replied (in DB we might just have a 'status' column or 'replied' bit)
        // Check if status column exists, if not maybe just update something else. Assuming 'status' column for contact_messages.
        await request.query(`
            IF COL_LENGTH('contact_messages', 'status') IS NOT NULL
            BEGIN
                UPDATE contact_messages SET status = 'replied' WHERE id = @id
            END
        `);
        res.json({ success: true, message: 'Đã đánh dấu phản hồi' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.replyReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { reply_comment } = req.body;
        const pool = await poolPromise;

        if (!reply_comment || reply_comment.trim() === '') {
            return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
        }

        const request = pool.request();
        request.input('reviewId', sql.Int, reviewId);
        request.input('reply', sql.NVarChar, reply_comment);

        await request.query(`
            UPDATE reviews 
            SET reply_comment = @reply 
            WHERE id = @reviewId
        `);

        res.json({ success: true, message: 'Phản hồi đánh giá thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};
