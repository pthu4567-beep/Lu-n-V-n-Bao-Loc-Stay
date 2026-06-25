const { sql, poolPromise } = require('../db');

// =====================================
// QUẢN LÝ HOTELS (KHÁCH SẠN)
// =====================================

exports.getHotels = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;

        let query = 'SELECT * FROM hotels';
        const request = pool.request();

        if (roleId === 2) {
            query += ' WHERE owner_id = @ownerId';
            request.input('ownerId', sql.Int, userId);
        }

        query += ' ORDER BY id DESC';
        const result = await request.query(query);
        res.json({ success: true, message: 'Lấy danh sách homestay thành công', data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.createHotel = async (req, res) => {
    try {
        const { name, description, facilities_text, address, status, images_text } = req.body;
        const pool = await poolPromise;
        const ownerId = req.user.id;

        const request = pool.request();
        request.input('ownerId', sql.Int, ownerId);
        request.input('name', sql.NVarChar, name);
        request.input('description', sql.NVarChar, description || '');
        request.input('facilities_text', sql.NVarChar, facilities_text || '');
        request.input('address', sql.NVarChar, address || '');
        request.input('status', sql.VarChar, status || 'active');
        request.input('images_text', sql.NVarChar, images_text || '');

        const query = `
            INSERT INTO hotels (owner_id, name, description, facilities_text, address, status, images_text)
            OUTPUT inserted.*
            VALUES (@ownerId, @name, @description, @facilities_text, @address, @status, @images_text)
        `;
        const result = await request.query(query);
        res.json({ success: true, message: 'Thêm homestay thành công', data: result.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateHotel = async (req, res) => {
    try {
        const hotelId = parseInt(req.params.id);
        const { name, description, facilities_text, address, status, images_text } = req.body;
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        // Verify ownership
        const checkReq = pool.request();
        checkReq.input('id', sql.Int, hotelId);
        const checkRes = await checkReq.query('SELECT owner_id FROM hotels WHERE id = @id');
        if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy homestay!' });
        if (String(checkRes.recordset[0].owner_id) !== String(userId) && roleId !== 1) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa homestay này!' });
        }

        const request = pool.request();
        request.input('id', sql.Int, hotelId);
        request.input('name', sql.NVarChar, name);
        request.input('description', sql.NVarChar, description || '');
        request.input('facilities_text', sql.NVarChar, facilities_text || '');
        request.input('address', sql.NVarChar, address || '');
        request.input('status', sql.VarChar, status || 'active');
        request.input('images_text', sql.NVarChar, images_text || '');

        const query = `
            UPDATE hotels 
            SET name=@name, description=@description, facilities_text=@facilities_text, address=@address, status=@status, images_text=@images_text
            WHERE id = @id
        `;
        await request.query(query);
        res.json({ success: true, message: 'Cập nhật homestay thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.deleteHotel = async (req, res) => {
    try {
        const hotelId = parseInt(req.params.id);
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        // Verify ownership
        const checkReq = pool.request();
        checkReq.input('id', sql.Int, hotelId);
        const checkRes = await checkReq.query('SELECT owner_id FROM hotels WHERE id = @id');
        if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy homestay!' });
        if (String(checkRes.recordset[0].owner_id) !== String(userId) && roleId !== 1) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa homestay này!' });
        }

        const request = pool.request();
        request.input('id', sql.Int, hotelId);
        await request.query('DELETE FROM hotels WHERE id = @id');
        res.json({ success: true, message: 'Xóa homestay thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// =====================================
// QUẢN LÝ ROOM TYPES (LOẠI PHÒNG)
// =====================================

exports.getRoomTypes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;
        const hotelId = req.query.hotelId;

        if (roleId === 2 && hotelId) {
            const checkReq = pool.request();
            checkReq.input('hotelId', sql.Int, hotelId);
            const checkRes = await checkReq.query('SELECT owner_id FROM hotels WHERE id = @hotelId');
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Khách sạn không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu của khách sạn này' });
            }
        }

        let query = `
            SELECT rt.*, h.name as hotel_name 
            FROM room_types rt 
            JOIN hotels h ON rt.hotel_id = h.id
        `;
        const request = pool.request();
        let conditions = [];

        if (roleId === 2) {
            conditions.push(`h.owner_id = @ownerId`);
            request.input('ownerId', sql.Int, userId);
        }
        if (hotelId) {
            conditions.push(`rt.hotel_id = @hotelId`);
            request.input('hotelId', sql.Int, hotelId);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
        query += ` ORDER BY rt.id DESC`;

        const result = await request.query(query);
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.createRoomType = async (req, res) => {
    try {
        const { hotel_id, name, room_amenities_text, base_price, capacity } = req.body;
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        // Verify ownership
        if (roleId === 2) {
            const checkReq = pool.request();
            checkReq.input('hotelId', sql.Int, hotel_id);
            const checkRes = await checkReq.query('SELECT owner_id FROM hotels WHERE id = @hotelId');
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Khách sạn không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên khách sạn này!' });
            }
        }

        const request = pool.request();
        request.input('hotel_id', sql.Int, hotel_id);
        request.input('name', sql.NVarChar, name);
        request.input('room_amenities_text', sql.NVarChar, room_amenities_text || '');
        request.input('base_price', sql.Decimal(18, 2), base_price);
        request.input('capacity', sql.Int, capacity);

        const query = `
            INSERT INTO room_types (hotel_id, name, room_amenities_text, base_price, capacity)
            OUTPUT inserted.*
            VALUES (@hotel_id, @name, @room_amenities_text, @base_price, @capacity)
        `;
        const result = await request.query(query);
        res.json({ success: true, message: 'Thêm loại phòng thành công', data: result.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateRoomType = async (req, res) => {
    try {
        const roomTypeId = parseInt(req.params.id);
        const { name, room_amenities_text, base_price, capacity } = req.body;
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        if (roleId === 2) {
            const checkReq = pool.request();
            checkReq.input('id', sql.Int, roomTypeId);
            const checkRes = await checkReq.query(`
                SELECT h.owner_id 
                FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id 
                WHERE rt.id = @id
            `);
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Loại phòng không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa loại phòng này!' });
            }
        }

        const request = pool.request();
        request.input('id', sql.Int, roomTypeId);
        request.input('name', sql.NVarChar, name);
        request.input('room_amenities_text', sql.NVarChar, room_amenities_text || '');
        request.input('base_price', sql.Decimal(18, 2), base_price);
        request.input('capacity', sql.Int, capacity);

        await request.query(`
            UPDATE room_types 
            SET name=@name, room_amenities_text=@room_amenities_text, base_price=@base_price, capacity=@capacity
            WHERE id = @id
        `);
        res.json({ success: true, message: 'Cập nhật loại phòng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.deleteRoomType = async (req, res) => {
    try {
        const roomTypeId = parseInt(req.params.id);
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        if (roleId === 2) {
            const checkReq = pool.request();
            checkReq.input('id', sql.Int, roomTypeId);
            const checkRes = await checkReq.query(`
                SELECT h.owner_id 
                FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id 
                WHERE rt.id = @id
            `);
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Loại phòng không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa loại phòng này!' });
            }
        }

        const checkRoomReq = pool.request();
        checkRoomReq.input('id', sql.Int, roomTypeId);
        const checkRoomRes = await checkRoomReq.query(`SELECT COUNT(*) as count FROM rooms WHERE room_type_id = @id`);
        if (checkRoomRes.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa loại phòng đã có phòng vật lý! Vui lòng xóa các phòng con trước.' });
        }

        const request = pool.request();
        request.input('id', sql.Int, roomTypeId);
        await request.query(`DELETE FROM room_types WHERE id = @id`);
        res.json({ success: true, message: 'Xóa loại phòng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// =====================================
// QUẢN LÝ ROOMS (PHÒNG VẬT LÝ)
// =====================================

exports.getRooms = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;
        const hotelId = req.query.hotelId;
        const roomTypeId = req.query.roomTypeId;

        if (roleId === 2 && hotelId) {
            const checkReq = pool.request();
            checkReq.input('hotelId', sql.Int, hotelId);
            const checkRes = await checkReq.query('SELECT owner_id FROM hotels WHERE id = @hotelId');
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Khách sạn không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu của khách sạn này' });
            }
        }

        let query = `
            SELECT r.*, rt.name as room_type_name, h.name as hotel_name,
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM booking_details bd 
                    JOIN bookings b ON bd.booking_id = b.id
                    WHERE bd.room_id = r.id 
                      AND b.booking_status NOT IN ('cancelled', 'rejected', 'completed', 'checked_out')
                      AND GETDATE() BETWEEN bd.check_in_datetime AND bd.check_out_datetime
                ) THEN 'occupied'
                ELSE r.status 
            END as current_status
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.id
            JOIN hotels h ON rt.hotel_id = h.id
        `;
        const request = pool.request();
        let conditions = [];

        if (roleId === 2) {
            conditions.push(`h.owner_id = @ownerId`);
            request.input('ownerId', sql.Int, userId);
        }
        if (hotelId) {
            conditions.push(`rt.hotel_id = @hotelId`);
            request.input('hotelId', sql.Int, hotelId);
        }
        if (roomTypeId) {
            conditions.push(`r.room_type_id = @roomTypeId`);
            request.input('roomTypeId', sql.Int, roomTypeId);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
        query += ` ORDER BY r.id DESC`;

        const result = await request.query(query);
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { room_type_id, room_number, status } = req.body;
        const pool = await poolPromise;
        const request = pool.request();
        request.input('room_type_id', sql.Int, room_type_id);
        request.input('room_number', sql.VarChar, room_number);
        request.input('status', sql.VarChar, status || 'available'); // available, cleaning, maintenance

        const query = `
            INSERT INTO rooms (room_type_id, room_number, status)
            OUTPUT inserted.*
            VALUES (@room_type_id, @room_number, @status)
        `;
        const result = await request.query(query);
        res.json({ success: true, message: 'Sinh phòng mới thành công', data: result.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateRoomStatus = async (req, res) => {
    try {
        const roomId = parseInt(req.params.id);
        const { status } = req.body;
        const pool = await poolPromise;
        const request = pool.request();
        request.input('id', sql.Int, roomId);
        request.input('status', sql.VarChar, status);

        const query = `UPDATE rooms SET status = @status WHERE id = @id`;
        await request.query(query);
        res.json({ success: true, message: 'Cập nhật trạng thái phòng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const roomId = parseInt(req.params.id);
        const { room_number, status } = req.body;
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        if (roleId === 2) {
            const checkReq = pool.request();
            checkReq.input('id', sql.Int, roomId);
            const checkRes = await checkReq.query(`
                SELECT h.owner_id 
                FROM rooms r 
                JOIN room_types rt ON r.room_type_id = rt.id 
                JOIN hotels h ON rt.hotel_id = h.id 
                WHERE r.id = @id
            `);
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa phòng này!' });
            }
        }

        const request = pool.request();
        request.input('id', sql.Int, roomId);
        request.input('room_number', sql.VarChar, room_number);
        request.input('status', sql.VarChar, status || 'available');

        await request.query(`
            UPDATE rooms 
            SET room_number=@room_number, status=@status
            WHERE id = @id
        `);
        res.json({ success: true, message: 'Cập nhật phòng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const roomId = parseInt(req.params.id);
        const pool = await poolPromise;
        const userId = req.user.id;
        const roleId = req.user.roleId;

        if (roleId === 2) {
            const checkReq = pool.request();
            checkReq.input('id', sql.Int, roomId);
            const checkRes = await checkReq.query(`
                SELECT h.owner_id 
                FROM rooms r 
                JOIN room_types rt ON r.room_type_id = rt.id 
                JOIN hotels h ON rt.hotel_id = h.id 
                WHERE r.id = @id
            `);
            if (checkRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
            if (String(checkRes.recordset[0].owner_id) !== String(userId)) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa phòng này!' });
            }
        }

        const checkBookingReq = pool.request();
        checkBookingReq.input('id', sql.Int, roomId);
        const checkBookingRes = await checkBookingReq.query(`
            SELECT COUNT(*) as count 
            FROM booking_details bd
            JOIN bookings b ON bd.booking_id = b.id
            WHERE bd.room_id = @id AND b.booking_status NOT IN ('cancelled', 'rejected', 'completed', 'checked_out')
        `);
        if (checkBookingRes.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa phòng đang có đơn đặt đang hoạt động!' });
        }

        const request = pool.request();
        request.input('id', sql.Int, roomId);
        await request.query(`DELETE FROM rooms WHERE id = @id`);
        res.json({ success: true, message: 'Xóa phòng thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

// =====================================
// QUẢN LÝ PROMOTIONS (KHUYẾN MÃI)
// =====================================

exports.getPromotions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM promotions ORDER BY id DESC');
        res.json({ success: true, message: 'Thành công', data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};

exports.createPromotion = async (req, res) => {
    try {
        const { hotel_id, discount_code, discount_percent, valid_until } = req.body;
        const pool = await poolPromise;
        const request = pool.request();
        request.input('hotel_id', sql.Int, hotel_id);
        request.input('discount_code', sql.VarChar, discount_code);
        request.input('discount_percent', sql.Decimal(5, 2), discount_percent);
        request.input('valid_until', sql.DateTime, valid_until);

        const query = `
            INSERT INTO promotions (hotel_id, discount_code, discount_percent, valid_until)
            OUTPUT inserted.*
            VALUES (@hotel_id, @discount_code, @discount_percent, @valid_until)
        `;
        const result = await request.query(query);
        res.json({ success: true, message: 'Thêm khuyến mãi thành công', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};
