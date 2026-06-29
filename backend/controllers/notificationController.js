const { sql, poolPromise } = require('../db');

exports.getNotifications = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userId = req.user.id;

        const request = pool.request();
        request.input('userId', sql.Int, userId);
        
        const result = await request.query(`
            SELECT id, title, message, is_read, created_at
            FROM notifications
            WHERE user_id = @userId
            ORDER BY created_at DESC
        `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('Lỗi khi lấy thông báo:', err.message);
        // Nếu lỗi do bảng chưa tồn tại, trả về mảng rỗng tạm thời
        if (err.message.includes("Invalid object name 'notifications'")) {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userId = req.user.id;
        const notifId = req.params.id;

        const request = pool.request();
        request.input('userId', sql.Int, userId);
        request.input('notifId', sql.Int, notifId);

        await request.query(`
            UPDATE notifications
            SET is_read = 1
            WHERE id = @notifId AND user_id = @userId
        `);

        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
        console.error('Lỗi khi cập nhật thông báo:', err.message);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userId = req.user.id;

        const request = pool.request();
        request.input('userId', sql.Int, userId);

        await request.query(`
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = @userId AND is_read = 0
        `);

        res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (err) {
        console.error('Lỗi khi cập nhật thông báo:', err.message);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
};
