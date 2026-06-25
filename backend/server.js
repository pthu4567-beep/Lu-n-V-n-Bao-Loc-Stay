const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin, isOwner } = require('./middleware/authMiddleware');
const http = require('http');
const { Server } = require('socket.io');

const JWT_SECRET = process.env.JWT_SECRET || 'baolocstay_secret_key';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`[RES] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Body: ${body}`);
        return originalSend.call(this, body);
    };
    next();
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.set('io', io);

// ==========================================
// API 1: Lấy danh sách Homestay (Hỗ trợ tìm kiếm)
// ==========================================
app.get('/api/homestays', async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        // Query đơn giản trước - lấy tất cả hotels
        let query = `SELECT * FROM hotels WHERE status = 'active'`;
        const request = pool.request();

        if (req.query.search) {
            query = `SELECT * FROM hotels WHERE status = 'active' AND (name LIKE @search OR facilities_text LIKE @search OR address LIKE @search)`;
            request.input('search', sql.NVarChar, `%${req.query.search}%`);
        }

        const result = await request.query(query);
        const hotels = result.recordset;

        // Bổ sung ảnh bìa và giá rẻ nhất cho mỗi hotel
        for (let hotel of hotels) {
            try {
                // Lấy ảnh bìa (thumbnail)
                const imgReq = pool.request();
                imgReq.input('hid', sql.Int, hotel.id);
                const imgRes = await imgReq.query('SELECT TOP 1 image_url FROM hotel_images WHERE hotel_id = @hid ORDER BY is_thumbnail DESC');
                hotel.img = imgRes.recordset.length > 0 ? imgRes.recordset[0].image_url : 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?q=80&w=800';

                // Lấy giá thấp nhất
                const priceReq = pool.request();
                priceReq.input('hid', sql.Int, hotel.id);
                const priceRes = await priceReq.query('SELECT MIN(base_price) as min_price FROM room_types WHERE hotel_id = @hid');
                hotel.price = priceRes.recordset[0]?.min_price || 0;

                // Tính điểm đánh giá trung bình
                const ratingReq = pool.request();
                ratingReq.input('hid', sql.Int, hotel.id);
                const ratingRes = await ratingReq.query(`
                    SELECT AVG(CAST(r.rating_score AS FLOAT)) as avg_rating 
                    FROM reviews r 
                    JOIN bookings b ON r.booking_id = b.id 
                    WHERE b.hotel_id = @hid
                `);
                hotel.rating = ratingRes.recordset[0]?.avg_rating ? parseFloat(ratingRes.recordset[0].avg_rating).toFixed(1) : 4.5;
            } catch (innerErr) {
                console.log('Lỗi khi lấy thông tin bổ sung cho hotel', hotel.id, ':', innerErr.message);
                hotel.img = 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?q=80&w=800';
                hotel.price = 0;
                hotel.rating = 4.5;
            }
        }

        console.log(`API /api/homestays trả về ${hotels.length} kết quả`);
        res.json(hotels);
    } catch (err) {
        console.error('LỖI API /api/homestays:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API 2: Lấy chi tiết 1 Homestay (Hỗ trợ lọc ngày trống)
// ==========================================
app.get('/api/homestays/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });
        const hotelId = parseInt(req.params.id);
        const { checkIn, checkOut } = req.query;

        // 1. Thông tin cơ bản
        const hotelReq = pool.request();
        hotelReq.input('id', sql.Int, hotelId);
        const hotelRes = await hotelReq.query('SELECT * FROM hotels WHERE id = @id');
        if (hotelRes.recordset.length === 0) return res.status(404).json({ error: 'Không tìm thấy homestay' });
        const hotel = hotelRes.recordset[0];

        // 2. Hình ảnh
        const imgReq = pool.request();
        imgReq.input('id', sql.Int, hotelId);
        const imgRes = await imgReq.query('SELECT image_url FROM hotel_images WHERE hotel_id = @id');
        hotel.images = imgRes.recordset.map(r => r.image_url);
        if (hotel.images.length === 0) {
            hotel.images = ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200'];
        }

        // 3. Loại phòng + đếm phòng trống theo ngày
        const roomReq = pool.request();
        roomReq.input('id', sql.Int, hotelId);
        roomReq.input('cin', sql.DateTime, checkIn ? new Date(checkIn) : null);
        roomReq.input('cout', sql.DateTime, checkOut ? new Date(checkOut) : null);
        const roomRes = await roomReq.query(`
            SELECT rt.id, rt.name as type, rt.capacity, rt.adult_capacity, rt.child_capacity, rt.base_price as price, rt.room_amenities_text,
                   (SELECT COUNT(*) FROM rooms r 
                    WHERE r.room_type_id = rt.id 
                      AND r.status = 'available'
                      AND r.id NOT IN (
                          SELECT bd.room_id 
                          FROM booking_details bd
                          JOIN bookings b ON bd.booking_id = b.id
                          WHERE b.booking_status NOT IN ('cancelled', 'rejected')
                            AND @cin IS NOT NULL AND @cout IS NOT NULL
                            AND bd.check_in_datetime < @cout
                            AND bd.check_out_datetime > @cin
                      )
                   ) as available
            FROM room_types rt
            WHERE rt.hotel_id = @id
        `);
        hotel.rooms = roomRes.recordset;

        // 4. Lấy danh sách đánh giá đã duyệt
        const revReq = pool.request();
        revReq.input('id', sql.Int, hotelId);
        const revRes = await revReq.query(`
            SELECT r.rating_score, r.comment, r.reply_comment, r.created_at, u.email 
            FROM reviews r
            JOIN bookings b ON r.booking_id = b.id
            JOIN users u ON r.user_id = u.id
            WHERE b.hotel_id = @id AND r.status = 'approved'
            ORDER BY r.created_at DESC
        `);
        hotel.reviewsList = revRes.recordset;

        console.log(`API /api/homestays/${hotelId} - ${hotel.name} - ${hotel.rooms.length} loại phòng`);
        res.json(hotel);
    } catch (err) {
        console.error('LỖI API /api/homestays/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API 3: Đặt phòng (Có chống trùng lặp & Chống overbooking tuyệt đối)
// ==========================================
app.post('/api/bookings', verifyToken, async (req, res) => {
    const { hotelId, roomTypeId, checkIn, checkOut, totalAmount, guestCount } = req.body;
    const userId = req.user.id; // Lấy an toàn từ token JWT đã xác thực
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            // 1. Tìm 1 phòng trống trong khoảng ngày đặt (UPDLOCK, ROWLOCK ngăn overbooking)
            const findReq = new sql.Request(transaction);
            findReq.input('rtId', sql.Int, roomTypeId);
            findReq.input('cin', sql.DateTime, new Date(checkIn));
            findReq.input('cout', sql.DateTime, new Date(checkOut));
            const findRes = await findReq.query(`
                SELECT TOP 1 id FROM rooms WITH (UPDLOCK, ROWLOCK)
                WHERE room_type_id = @rtId 
                  AND status = 'available'
                  AND id NOT IN (
                      SELECT bd.room_id 
                      FROM booking_details bd
                      JOIN bookings b ON bd.booking_id = b.id
                      WHERE b.booking_status NOT IN ('cancelled', 'rejected')
                        AND bd.check_in_datetime < @cout
                        AND bd.check_out_datetime > @cin
                  )
            `);

            if (findRes.recordset.length === 0) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Không còn phòng trống loại này trong khoảng thời gian đã chọn!' });
            }
            const roomId = findRes.recordset[0].id;

            // 2. Tạo đơn đặt phòng
            const bookReq = new sql.Request(transaction);
            bookReq.input('uId', sql.Int, userId);
            bookReq.input('hId', sql.Int, hotelId);
            bookReq.input('total', sql.Decimal(18, 2), totalAmount);
            bookReq.input('guestCount', sql.Int, guestCount || 1);
            const bookRes = await bookReq.query(`
                INSERT INTO bookings (user_id, hotel_id, total_amount, booking_status, guest_count, created_at)
                OUTPUT INSERTED.id
                VALUES (@uId, @hId, @total, 'pending_payment', @guestCount, GETDATE())
            `);
            const newBookingId = bookRes.recordset[0].id;

            // 3. Tạo chi tiết đơn (sửa lỗi thiếu booking_type)
            const detailReq = new sql.Request(transaction);
            detailReq.input('bId', sql.Int, newBookingId);
            detailReq.input('rId', sql.Int, roomId);
            detailReq.input('cin', sql.DateTime, new Date(checkIn));
            detailReq.input('cout', sql.DateTime, new Date(checkOut));
            detailReq.input('price', sql.Decimal(18, 2), totalAmount);
            await detailReq.query(`
                INSERT INTO booking_details (booking_id, room_id, booking_type, check_in_datetime, check_out_datetime, price)
                VALUES (@bId, @rId, 'standard', @cin, @cout, @price)
            `);

            // 4. Tạo bản ghi thanh toán ở trạng thái awaiting_confirmation
            const payReq = new sql.Request(transaction);
            payReq.input('bId', sql.Int, newBookingId);
            payReq.input('amount', sql.Decimal(18, 2), totalAmount);
            await payReq.query(`
                INSERT INTO payments (booking_id, amount, payment_method, payment_status)
                VALUES (@bId, @amount, 'QR_Transfer', 'awaiting_confirmation')
            `);

            await transaction.commit();
            console.log(`ĐẶT PHÒNG THÀNH CÔNG - Booking #${newBookingId}, Room #${roomId}`);

            const io = req.app.get('io');
            if (io) {
                io.emit('room_update', { hotelId, roomTypeId });
            }

            res.json({ success: true, bookingId: newBookingId, roomId, message: 'Đặt phòng thành công!' });
        } catch (txnErr) {
            await transaction.rollback();
            throw txnErr;
        }
    } catch (err) {
        console.error('LỖI API /api/bookings:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đặt phòng: ' + err.message });
    }
});

// ==========================================
// API 4: Lịch sử đặt phòng của 1 User
// ==========================================
app.get('/api/users/:userId/bookings', async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('userId', sql.Int, parseInt(req.params.userId));
        const result = await request.query(`
            SELECT b.id, h.name as homestay, rt.name as room, b.created_at as date, b.total_amount as total, b.booking_status as status
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            LEFT JOIN rooms r ON bd.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE b.user_id = @userId
            ORDER BY b.created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('LỖI API /api/users/:userId/bookings:', err.message);
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// API Đăng ký tài khoản
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    const { email, password, phone } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ email và mật khẩu!' });
    }
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        // Kiểm tra xem email đã tồn tại chưa
        const checkReq = pool.request();
        checkReq.input('email', sql.VarChar, email);
        const checkRes = await checkReq.query('SELECT id FROM users WHERE email = @email');
        if (checkRes.recordset.length > 0) {
            return res.status(400).json({ error: 'Email này đã được đăng ký sử dụng!' });
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới (mặc định role_id = 3 là Customer)
        const insertReq = pool.request();
        insertReq.input('roleId', sql.Int, 3);
        insertReq.input('email', sql.VarChar, email);
        insertReq.input('pwdHash', sql.VarChar, hashedPassword);
        insertReq.input('phone', sql.VarChar, phone || null);

        const result = await insertReq.query(`
            INSERT INTO users (role_id, email, password_hash, phone, created_at)
            OUTPUT INSERTED.id
            VALUES (@roleId, @email, @pwdHash, @phone, GETDATE())
        `);

        const userId = result.recordset[0].id;

        // Tạo một profile rỗng kèm theo
        const profileReq = pool.request();
        profileReq.input('userId', sql.Int, userId);
        await profileReq.query(`
            INSERT INTO user_profiles (user_id, avatar_url, address)
            VALUES (@userId, 'https://i.pravatar.cc/150?img=32', N'')
        `);

        // Tạo token JWT tự động đăng nhập
        const token = jwt.sign({ id: userId, email, roleId: 3 }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Đăng ký tài khoản thành công!',
            token,
            user: { id: userId, email, roleId: 3, phone }
        });
    } catch (err) {
        console.error('LỖI ĐĂNG KÝ:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đăng ký: ' + err.message });
    }
});

// ==========================================
// API Đăng nhập
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ email và mật khẩu!' });
    }
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('email', sql.VarChar, email.trim());
        const result = await request.query('SELECT id, role_id, email, password_hash, phone FROM users WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: 'Email hoặc mật khẩu không chính xác!' });
        }

        const user = result.recordset[0];

        // Đối chiếu mật khẩu
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(400).json({ error: 'Email hoặc mật khẩu không chính xác!' });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, roleId: user.role_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.id, email: user.email, roleId: user.role_id, phone: user.phone }
        });
    } catch (err) {
        console.error('LỖI ĐĂNG NHẬP:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập: ' + err.message });
    }
});

// ==========================================
// API Lấy danh sách bookings của user hiện tại (Dùng JWT)
// ==========================================
app.get('/api/users/my-bookings', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('userId', sql.Int, req.user.id);
        const result = await request.query(`
            SELECT b.id, h.name as homestay, rt.name as room, b.created_at as date, b.total_amount as total, b.booking_status as status,
                   bd.check_out_datetime,
                   (SELECT COUNT(*) FROM reviews rv WHERE rv.booking_id = b.id) as has_review
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            LEFT JOIN rooms r ON bd.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE b.user_id = @userId
            ORDER BY b.created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('LỖI API /api/users/my-bookings:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API Xuất Hóa Đơn (Invoice) cho đơn hàng
// ==========================================
app.get('/api/bookings/:id/invoice', verifyToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('bookingId', sql.Int, bookingId);
        
        // Chỉ lấy những đơn hàng thuộc về user đang đăng nhập (hoặc Admin role=1)
        const checkOwnershipReq = pool.request();
        checkOwnershipReq.input('bId', sql.Int, bookingId);
        const checkRes = await checkOwnershipReq.query('SELECT user_id FROM bookings WHERE id = @bId');
        
        if (checkRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        
        if (String(checkRes.recordset[0].user_id) !== String(req.user.id) && req.user.roleId !== 1 && req.user.roleId !== 2) {
             return res.status(403).json({ error: 'Không có quyền truy cập hóa đơn này' });
        }

        const result = await request.query(`
            SELECT TOP 1
                b.id as booking_id, b.total_amount, b.booking_status, b.created_at,
                u.email as guest_email, u.phone as guest_phone,
                SUBSTRING(u.email, 1, CHARINDEX('@', u.email) - 1) as guest_name,
                h.name as homestay_name, h.address as homestay_address,
                ou.email as owner_email, ou.phone as owner_phone,
                SUBSTRING(ou.email, 1, CHARINDEX('@', ou.email) - 1) as owner_name,
                bd.check_in_datetime, bd.check_out_datetime,
                COALESCE(rt.name, N'Phòng Tiêu Chuẩn') as room_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN hotels h ON b.hotel_id = h.id
            JOIN users ou ON h.owner_id = ou.id
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            LEFT JOIN rooms r ON bd.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id OR bd.booking_type = 'room_type'
            WHERE b.id = @bookingId
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy chi tiết hóa đơn' });
        }

        res.json({ success: true, invoice: result.recordset[0] });
    } catch (err) {
        console.error('LỖI API INVOICE:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API 5: Gửi liên hệ (Contact)
// ==========================================
app.post('/api/contact', async (req, res) => {
    const { ho_lot, ten, email, loi_nhan } = req.body;
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });
        const request = pool.request();
        request.input('ho', sql.NVarChar, ho_lot);
        request.input('ten', sql.NVarChar, ten);
        request.input('email', sql.NVarChar, email);
        request.input('msg', sql.NVarChar, loi_nhan);
        await request.query(`INSERT INTO contact_messages (ho_lot, ten, email, loi_nhan) VALUES (@ho, @ten, @email, @msg)`);
        res.json({ success: true, message: 'Đã gửi liên hệ thành công!' });
    } catch (err) {
        console.error('LỖI API /api/contact:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API Báo đã thanh toán chuyển khoản
// ==========================================
// Đã chuyển sang bookingRoutes.js

// ==========================================
// API Hủy phòng (Tính phần trăm hoàn tiền)
// ==========================================
app.post('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;
    const roleId = req.user.roleId;
    try {
        const pool = await poolPromise;

        // Lấy thông tin booking và check_in_datetime
        const bookReq = pool.request();
        bookReq.input('bId', sql.Int, bookingId);
        const bookRes = await bookReq.query(`
            SELECT b.id, b.user_id, b.hotel_id, b.booking_status, b.total_amount, bd.check_in_datetime, r.room_type_id
            FROM bookings b
            JOIN booking_details bd ON b.id = bd.booking_id
            JOIN rooms r ON bd.room_id = r.id
            WHERE b.id = @bId
        `);

        if (bookRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng này!' });
        }

        const booking = bookRes.recordset[0];

        // Chỉ người đặt phòng hoặc Admin mới được phép hủy
        if (String(booking.user_id) !== String(userId) && roleId !== 1) {
            return res.status(403).json({ error: 'Bạn không có quyền hủy đơn đặt phòng này!' });
        }

        if (booking.booking_status === 'cancelled') {
            return res.status(400).json({ error: 'Đơn đặt phòng này đã được hủy trước đó!' });
        }

        // Tính toán phần trăm hoàn tiền
        const checkInTime = new Date(booking.check_in_datetime);
        const now = new Date();
        const hoursDiff = (checkInTime - now) / (1000 * 60 * 60);

        let refundPercent = 0;
        if (hoursDiff >= 72) {
            refundPercent = 100;
        } else if (hoursDiff >= 24) {
            refundPercent = 50;
        } else {
            refundPercent = 0;
        }

        const refundAmount = (booking.total_amount * refundPercent) / 100;

        // Thực hiện hủy booking và giao dịch thanh toán
        await pool.request()
            .input('bId', sql.Int, bookingId)
            .query(`
                UPDATE bookings SET booking_status = 'cancelled' WHERE id = @bId;
                UPDATE payments SET payment_status = 'cancelled' WHERE booking_id = @bId;
            `);

        const io = req.app.get('io');
        if (io) {
            io.emit('room_update', { hotelId: booking.hotel_id, roomTypeId: booking.room_type_id });
        }

        res.json({
            success: true,
            message: `Đã hủy đơn đặt phòng thành công! Số tiền hoàn trả ước tính: ${refundPercent}% (${refundAmount.toLocaleString('vi-VN')} ₫)`,
            refundPercent,
            refundAmount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi hủy đặt phòng: ' + err.message });
    }
});

// ==========================================
// API DUYỆT THANH TOÁN & QUẢN LÝ (ĐÃ REFACTOR)
// ==========================================
const catalogRoutes = require('./routes/catalogRoutes');
const orderRoutes = require('./routes/orderRoutes');
const systemRoutes = require('./routes/systemRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/admin/catalog', verifyToken, isOwner, catalogRoutes);
app.use('/api/admin/orders', verifyToken, isOwner, orderRoutes);
app.use('/api/admin/system', verifyToken, isOwner, systemRoutes);
app.use('/api/admin/dashboard', verifyToken, isOwner, dashboardRoutes);

// User routes
app.use('/api/bookings', bookingRoutes);

// Khôi phục lại một số alias (do Frontend có thể gọi /api/admin/homestays thay vì /api/admin/catalog/hotels)
const catalogController = require('./controllers/catalogController');
app.get('/api/admin/homestays', verifyToken, isOwner, catalogController.getHotels);
app.post('/api/admin/homestays', verifyToken, isOwner, catalogController.createHotel);
app.put('/api/admin/homestays/:id', verifyToken, isOwner, catalogController.updateHotel);
app.delete('/api/admin/homestays/:id', verifyToken, isOwner, catalogController.deleteHotel);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend Server with WebSockets is running on port ${PORT}`);
});
