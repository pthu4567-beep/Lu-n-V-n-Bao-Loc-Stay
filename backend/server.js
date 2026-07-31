const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin, isOwner } = require('./middleware/authMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const { sendOTPEmail } = require('./utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'baolocstay_secret_key';

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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
                hotel.img = hotel.images_text ? hotel.images_text : (imgRes.recordset.length > 0 ? imgRes.recordset[0].image_url : 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?q=80&w=800');

                // Lấy giá thấp nhất
                const priceReq = pool.request();
                priceReq.input('hid', sql.Int, hotel.id);
                const priceRes = await priceReq.query('SELECT MIN(base_price) as min_price FROM room_types WHERE hotel_id = @hid');
                hotel.price = priceRes.recordset[0]?.min_price || 0;

                // Tính điểm đánh giá trung bình
                const ratingReq = pool.request();
                ratingReq.input('hid', sql.Int, hotel.id);
                const ratingRes = await ratingReq.query(`
                    SELECT AVG(CAST(r.rating_score AS FLOAT)) as avg_rating, COUNT(r.id) as review_count
                    FROM reviews r 
                    JOIN bookings b ON r.booking_id = b.id 
                    WHERE b.hotel_id = @hid
                `);
                hotel.rating = ratingRes.recordset[0]?.avg_rating ? parseFloat(ratingRes.recordset[0].avg_rating).toFixed(1) : 4.5;
                hotel.review_count = ratingRes.recordset[0]?.review_count || 0;
            } catch (innerErr) {
                console.log('Lỗi khi lấy thông tin bổ sung cho hotel', hotel.id, ':', innerErr.message);
                hotel.img = hotel.images_text || 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?q=80&w=800';
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
        const dbImages = imgRes.recordset.map(r => r.image_url);
        if (hotel.images_text) {
            hotel.images = [hotel.images_text];
        } else if (dbImages.length > 0) {
            hotel.images = [dbImages[0]];
        } else {
            hotel.images = ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200'];
        }

        // 3. Loại phòng + đếm phòng trống theo ngày
        const roomReq = pool.request();
        roomReq.input('id', sql.Int, hotelId);
        roomReq.input('cin', sql.DateTime, checkIn ? new Date(checkIn) : null);
        roomReq.input('cout', sql.DateTime, checkOut ? new Date(checkOut) : null);
        const roomRes = await roomReq.query(`
            SELECT rt.id, rt.name as type, rt.capacity, rt.adult_capacity, rt.child_capacity, rt.base_price as price, rt.room_amenities_text, rt.image_url, rt.amenities_images_text,
                   (SELECT COUNT(*) FROM rooms r 
                    WHERE r.room_type_id = rt.id 
                      AND r.status = 'available'
                      AND r.id NOT IN (
                          SELECT bd.room_id 
                          FROM booking_details bd
                          JOIN bookings b ON bd.booking_id = b.id
                          WHERE b.booking_status NOT IN ('cancelled', 'rejected')
                            AND NOT (b.booking_status = 'pending_payment' AND DATEDIFF(second, b.created_at, GETDATE()) >= 900)
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
    const { hotelId, rooms, checkIn, checkOut, totalAmount, baseAmount, discountPercent, discountAmount, guestCount } = req.body;
    const userId = req.user.id; // Lấy an toàn từ token JWT đã xác thực
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            let allRoomIdsToBook = [];
            
            // 1. Tìm phòng trống cho TỪNG loại phòng được chọn
            for (let rReq of rooms) {
                const findReq = new sql.Request(transaction);
                findReq.input('rtId', sql.Int, rReq.roomTypeId);
                findReq.input('cin', sql.DateTime, new Date(checkIn));
                findReq.input('cout', sql.DateTime, new Date(checkOut));
                const rCount = rReq.count;
                
                const findRes = await findReq.query(`
                    SELECT TOP (${rCount}) id FROM rooms WITH (UPDLOCK, ROWLOCK)
                    WHERE room_type_id = @rtId 
                      AND status = 'available'
                      AND id NOT IN (
                          SELECT bd.room_id 
                          FROM booking_details bd
                          JOIN bookings b ON bd.booking_id = b.id
                          WHERE b.booking_status NOT IN ('cancelled', 'rejected')
                            AND NOT (b.booking_status = 'pending_payment' AND DATEDIFF(second, b.created_at, GETDATE()) >= 900)
                            AND bd.check_in_datetime < @cout
                            AND bd.check_out_datetime > @cin
                      )
                `);

                if (findRes.recordset.length < rCount) {
                    await transaction.rollback();
                    return res.status(400).json({ error: 'Không đủ số lượng phòng trống cho một trong các loại phòng đã chọn!' });
                }
                
                findRes.recordset.forEach(r => {
                    allRoomIdsToBook.push(r.id);
                });
            }

            let depositAmount = totalAmount;
            let remainingAmount = 0;
            if (totalAmount > 0) {
                depositAmount = totalAmount * 0.3;
                remainingAmount = totalAmount - depositAmount;
            }

            // 2. Tạo đơn đặt phòng
            const bookReq = new sql.Request(transaction);
            bookReq.input('uId', sql.Int, userId);
            bookReq.input('hId', sql.Int, hotelId);
            const finalTotal = baseAmount || totalAmount;
            bookReq.input('total', sql.Decimal(18, 2), finalTotal);
            bookReq.input('deposit', sql.Decimal(18, 2), depositAmount);
            bookReq.input('remaining', sql.Decimal(18, 2), remainingAmount);
            bookReq.input('guestCount', sql.Int, guestCount || 1);
            bookReq.input('discountPct', sql.Float, discountPercent || 0);
            bookReq.input('discountAmt', sql.Decimal(18, 2), discountAmount || 0);
            
            const bookRes = await bookReq.query(`
                INSERT INTO bookings (user_id, hotel_id, total_amount, deposit_amount, remaining_amount, booking_status, guest_count, created_at, discount_percent, discount_amount)
                OUTPUT INSERTED.id
                VALUES (@uId, @hId, @total, @deposit, @remaining, 'pending_payment', @guestCount, GETDATE(), @discountPct, @discountAmt)
            `);
            const newBookingId = bookRes.recordset[0].id;

            // 3. Tạo chi tiết đơn (chia đều giá cho các phòng để đơn giản)
            const pricePerRoom = totalAmount / allRoomIdsToBook.length;
            for (let rId of allRoomIdsToBook) {
                const detailReq = new sql.Request(transaction);
                detailReq.input('bId', sql.Int, newBookingId);
                detailReq.input('rId', sql.Int, rId);
                detailReq.input('cin', sql.DateTime, new Date(checkIn));
                detailReq.input('cout', sql.DateTime, new Date(checkOut));
                detailReq.input('price', sql.Decimal(18, 2), pricePerRoom);
                await detailReq.query(`
                    INSERT INTO booking_details (booking_id, room_id, booking_type, check_in_datetime, check_out_datetime, price)
                    VALUES (@bId, @rId, 'standard', @cin, @cout, @price)
                `);
            }

            // 4. Tạo bản ghi thanh toán ở trạng thái pending
            const payReq = new sql.Request(transaction);
            payReq.input('bId', sql.Int, newBookingId);
            payReq.input('amount', sql.Decimal(18, 2), depositAmount);
            await payReq.query(`
                INSERT INTO payments (booking_id, amount, payment_method, payment_status)
                VALUES (@bId, @amount, 'QR_Transfer', 'pending')
            `);

            await transaction.commit();
            console.log(`ĐẶT PHÒNG THÀNH CÔNG - Booking #${newBookingId}, Rooms: ${allRoomIdsToBook.join(', ')}`);

            const io = req.app.get('io');
            if (io) {
                // Emit for all room types
                rooms.forEach(r => {
                    io.emit('room_update', { hotelId, roomTypeId: r.roomTypeId });
                });
            }

            res.json({ success: true, bookingId: newBookingId, roomId: allRoomIdsToBook[0], depositAmount, remainingAmount, createdAt: new Date().toISOString(), message: 'Đặt phòng thành công!' });
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
            SELECT b.id, h.name as homestay, rt.name as room, b.created_at as date, b.total_amount as total, b.deposit_amount as deposit, b.booking_status as status
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

    // [KIỂM TRA BẢO MẬT MẬT KHẨU]: Khống chế 8 ký tự, có chữ in hoa và ký tự đặc biệt
    if (password.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự!' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa (A-Z)!' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)!' });
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
        insertReq.input('roleId', sql.Int, 3); // Mặc định role = 3 (Khách hàng)
        insertReq.input('email', sql.VarChar, email.trim());
        insertReq.input('pwdHash', sql.VarChar, hashedPassword);
        insertReq.input('phone', sql.VarChar, phone || null);
        insertReq.input('fullName', sql.NVarChar, null);

        const result = await insertReq.query(`
            INSERT INTO users (role_id, email, password_hash, phone, full_name, created_at)
            OUTPUT INSERTED.id
            VALUES (@roleId, @email, @pwdHash, @phone, @fullName, GETDATE())
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

        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký thành công!',
            token,
            user: { id: userId, email, roleId: 3, phone, full_name: null }
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
        const result = await request.query('SELECT id, role_id, email, password_hash, phone, full_name, hotel_id, avatar FROM users WHERE email = @email');

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
            { id: user.id, email: user.email, roleId: user.role_id, hotelId: user.hotel_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.id, email: user.email, roleId: user.role_id, phone: user.phone, full_name: user.full_name, hotelId: user.hotel_id, avatar: user.avatar }
        });
    } catch (err) {
        console.error('LỖI ĐĂNG NHẬP:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập: ' + err.message });
    }
});


// ==========================================
// API Thay đổi Avatar
// ==========================================
app.post('/api/users/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file nào được tải lên.' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        const pool = await poolPromise;
        const request = pool.request();
        request.input('userId', sql.Int, req.user.id);
        request.input('avatarUrl', sql.VarChar, avatarUrl);
        await request.query('UPDATE users SET avatar = @avatarUrl WHERE id = @userId');
        
        const userRes = await pool.request().input('userId', sql.Int, req.user.id).query('SELECT id, role_id, email, phone, full_name, hotel_id, avatar FROM users WHERE id = @userId');
        const updatedUser = userRes.recordset[0];
        
        res.json({
            success: true,
            message: 'Cập nhật avatar thành công!',
            user: { id: updatedUser.id, email: updatedUser.email, roleId: updatedUser.role_id, phone: updatedUser.phone, full_name: updatedUser.full_name, hotelId: updatedUser.hotel_id, avatar: updatedUser.avatar }
        });
    } catch (err) {
        console.error('LỖI UPLOAD AVATAR:', err.message);
        res.status(500).json({ error: 'Lỗi server khi cập nhật avatar: ' + err.message });
    }
});

// ==========================================
// API Quên mật khẩu (Gửi OTP)
// ==========================================
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Vui lòng cung cấp email!' });
    }
    try {
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('email', sql.VarChar, email.trim());
        const result = await request.query('SELECT id, email, password_hash FROM users WHERE email = @email');

        if (result.recordset.length === 0) {
            // Vẫn trả về thành công để tránh việc bị dò tìm email (security best practice)
            return res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi sẽ gửi mã OTP đến email đó.' });
        }

        const user = result.recordset[0];

        // Tạo OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        // Tạo JWT token chứa thông tin OTP, dùng chính password_hash làm secret
        const secret = JWT_SECRET + user.password_hash;
        const payload = {
            id: user.id,
            email: user.email,
            hashedOTP: hashedOTP
        };
        const otpToken = jwt.sign(payload, secret, { expiresIn: '5m' }); // OTP có hiệu lực 5 phút

        sendOTPEmail(user.email, otp, 'forgot').catch(err => console.error('[Background Email Error]:', err.message));

        res.json({ 
            success: true, 
            message: 'Nếu email tồn tại, chúng tôi sẽ gửi mã OTP đến email đó.',
            otpToken: otpToken // Gửi token tạm về frontend để xác thực sau
        });
    } catch (err) {
        console.error('LỖI QUÊN MẬT KHẨU:', err.message);
        res.status(500).json({ error: 'Lỗi server khi yêu cầu quên mật khẩu: ' + err.message });
    }
});

// ==========================================
// API Đặt lại mật khẩu (Xác nhận OTP)
// ==========================================
app.post('/api/auth/reset-password', async (req, res) => {
    const { otpToken, otp, newPassword } = req.body;
    if (!otpToken || !otp || !newPassword) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ mã OTP và mật khẩu mới!' });
    }
    
    try {
        // Decode token để lấy id (chưa verify chữ ký vội vì cần password_hash từ DB)
        const decoded = jwt.decode(otpToken);
        if (!decoded || !decoded.id) {
            return res.status(400).json({ error: 'Token không hợp lệ!' });
        }
        const id = decoded.id;

        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('id', sql.Int, id);
        const result = await request.query('SELECT id, email, password_hash FROM users WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: 'Người dùng không tồn tại!' });
        }

        const user = result.recordset[0];
        const secret = JWT_SECRET + user.password_hash;

        try {
            // Xác thực token
            const verifiedPayload = jwt.verify(otpToken, secret);
            
            // Đối chiếu OTP
            const isOtpValid = await bcrypt.compare(otp, verifiedPayload.hashedOTP);
            if (!isOtpValid) {
                return res.status(400).json({ error: 'Mã OTP không chính xác!' });
            }

            // Nếu OTP hợp lệ, hash mật khẩu mới và lưu vào db
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            const updateReq = pool.request();
            updateReq.input('id', sql.Int, id);
            updateReq.input('pwdHash', sql.VarChar, hashedPassword);
            await updateReq.query('UPDATE users SET password_hash = @pwdHash WHERE id = @id');
            
            res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' });
            
        } catch (jwtError) {
            console.error('Lỗi JWT Reset:', jwtError.message);
            return res.status(400).json({ error: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
        }
        
    } catch (err) {
        console.error('LỖI ĐẶT LẠI MẬT KHẨU:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu: ' + err.message });
    }
});

// ==========================================
// API Cập nhật hồ sơ user (Sửa comment dư)
// ==========================================
app.put('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('userId', sql.Int, req.user.id);
        request.input('fullName', sql.NVarChar, full_name || null);
        request.input('phone', sql.VarChar, phone || null);

        await request.query(`
            UPDATE users 
            SET full_name = @fullName, phone = @phone 
            WHERE id = @userId
        `);

        // Lấy lại thông tin mới nhất
        const userRes = await pool.request().input('userId', sql.Int, req.user.id).query('SELECT id, email, role_id, phone, full_name, avatar FROM users WHERE id = @userId');
        const updatedUser = userRes.recordset[0];

        res.json({
            success: true,
            message: 'Cập nhật hồ sơ thành công!',
            user: { id: updatedUser.id, email: updatedUser.email, roleId: updatedUser.role_id, phone: updatedUser.phone, full_name: updatedUser.full_name, avatar: updatedUser.avatar }
        });
    } catch (err) {
        console.error('LỖI CẬP NHẬT PROFILE:', err.message);
        res.status(500).json({ error: 'Lỗi server khi cập nhật: ' + err.message });
    }
});

// ==========================================
// API Yêu cầu đổi mật khẩu (Gửi OTP)
// ==========================================
app.post('/api/users/request-change-password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới!' });
        }

        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const request = pool.request();
        request.input('userId', sql.Int, req.user.id);
        const result = await request.query('SELECT email, password_hash FROM users WHERE id = @userId');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
        }

        const user = result.recordset[0];

        // Xác minh mật khẩu cũ
        const isValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isValid) {
            return res.status(400).json({ error: 'Mật khẩu cũ không chính xác!' });
        }

        // Tạo OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP và Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Tạo JWT token chứa thông tin OTP và mật khẩu mới
        const payload = {
            userId: req.user.id,
            hashedOTP: hashedOTP,
            hashedNewPassword: hashedNewPassword
        };
        const changePwdToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' }); // Token có hiệu lực 5 phút

        sendOTPEmail(user.email, otp, 'change').catch(err => console.error('[Background Email Error]:', err.message));

        res.json({ 
            success: true, 
            message: 'Mã OTP đã được gửi đến email của bạn.',
            changePwdToken: changePwdToken
        });
    } catch (err) {
        console.error('LỖI YÊU CẦU ĐỔI MẬT KHẨU:', err.message);
        res.status(500).json({ error: 'Lỗi server khi yêu cầu đổi mật khẩu: ' + err.message });
    }
});

// ==========================================
// API Xác nhận đổi mật khẩu (Bằng OTP)
// ==========================================
app.put('/api/users/confirm-change-password', verifyToken, async (req, res) => {
    try {
        const { changePwdToken, otp } = req.body;
        if (!changePwdToken || !otp) {
            return res.status(400).json({ error: 'Vui lòng cung cấp mã OTP và token!' });
        }

        let decoded;
        try {
            decoded = jwt.verify(changePwdToken, JWT_SECRET);
        } catch (jwtError) {
            return res.status(400).json({ error: 'Mã OTP đã hết hạn hoặc token không hợp lệ!' });
        }

        if (decoded.userId !== req.user.id) {
            return res.status(403).json({ error: 'Token không thuộc về tài khoản này!' });
        }

        // Đối chiếu OTP
        const isOtpValid = await bcrypt.compare(otp, decoded.hashedOTP);
        if (!isOtpValid) {
            return res.status(400).json({ error: 'Mã OTP không chính xác!' });
        }

        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        const updateReq = pool.request();
        updateReq.input('userId', sql.Int, req.user.id);
        updateReq.input('pwdHash', sql.VarChar, decoded.hashedNewPassword);
        await updateReq.query('UPDATE users SET password_hash = @pwdHash WHERE id = @userId');

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error('LỖI XÁC NHẬN ĐỔI MẬT KHẨU:', err.message);
        res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu: ' + err.message });
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
// API Khuyến Mãi (Khách hàng)
// ==========================================

// Lấy danh sách khuyến mãi (tất cả hoặc theo hotel)
app.get('/api/promotions', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.id, p.hotel_id, h.name as hotel_name, p.discount_code, p.discount_percent, p.valid_until
            FROM promotions p
            LEFT JOIN hotels h ON p.hotel_id = h.id
            WHERE p.valid_until >= GETDATE()
            ORDER BY p.discount_percent DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('LỖI API /api/promotions:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Lấy ví voucher của user
app.get('/api/users/my-promotions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('uId', sql.Int, userId)
            .query(`
                SELECT up.id as saved_id, up.is_used, up.saved_at, 
                       p.id as promotion_id, p.discount_code, p.discount_percent, p.valid_until,
                       h.name as hotel_name, p.hotel_id
                FROM user_promotions up
                JOIN promotions p ON up.promotion_id = p.id
                LEFT JOIN hotels h ON p.hotel_id = h.id
                WHERE up.user_id = @uId
                ORDER BY up.is_used ASC, p.valid_until ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('LỖI API /api/users/my-promotions:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Lưu voucher
app.post('/api/promotions/save', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { promotion_id } = req.body;
        if (!promotion_id) return res.status(400).json({ success: false, error: 'Thiếu promotion_id' });
        
        const pool = await poolPromise;
        
        // Ktra xem promo có tồn tại không
        const check = await pool.request().input('pId', sql.Int, promotion_id).query('SELECT id FROM promotions WHERE id = @pId');
        if (check.recordset.length === 0) return res.status(404).json({ success: false, error: 'Voucher không tồn tại' });
        
        // Lưu
        await pool.request()
            .input('uId', sql.Int, userId)
            .input('pId', sql.Int, promotion_id)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM user_promotions WHERE user_id = @uId AND promotion_id = @pId)
                BEGIN
                    INSERT INTO user_promotions (user_id, promotion_id) VALUES (@uId, @pId)
                END
            `);
        res.json({ success: true, message: 'Đã lưu voucher vào ví' });
    } catch (err) {
        console.error('LỖI API /api/promotions/save:', err);
        res.status(500).json({ success: false, error: 'Đã xảy ra lỗi hoặc bạn đã lưu mã này rồi' });
    }
});

// ==========================================
// API Áp dụng Mã Khuyến Mãi cho đơn hàng
// ==========================================
app.post('/api/bookings/:id/apply-promotion', verifyToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { discount_code } = req.body;
        const userId = req.user.id;

        if (!discount_code) {
            return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
        }

        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ error: 'Chưa kết nối được Database' });

        // Kiểm tra đơn hàng thuộc về user
        const checkBooking = await pool.request()
            .input('bId', sql.Int, bookingId)
            .query('SELECT hotel_id, user_id, total_amount, booking_status, promotion_id FROM bookings WHERE id = @bId');

        if (checkBooking.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        const booking = checkBooking.recordset[0];
        if (String(booking.user_id) !== String(userId)) {
            return res.status(403).json({ error: 'Không có quyền truy cập đơn hàng này' });
        }
        
        if (booking.booking_status !== 'pending_payment') {
            return res.status(400).json({ error: 'Chỉ có thể áp dụng mã giảm giá khi chưa thanh toán' });
        }
        
        if (booking.promotion_id) {
            return res.status(400).json({ error: 'Đơn hàng này đã áp dụng mã giảm giá' });
        }

        // Kiểm tra mã giảm giá
        const checkPromo = await pool.request()
            .input('code', sql.VarChar, discount_code)
            .input('hotelId', sql.Int, booking.hotel_id)
            .query('SELECT TOP 1 id, discount_percent, valid_until FROM promotions WHERE discount_code = @code AND (hotel_id = @hotelId OR hotel_id IS NULL) ORDER BY (CASE WHEN hotel_id = @hotelId THEN 0 ELSE 1 END)');

        if (checkPromo.recordset.length === 0) {
            return res.status(404).json({ error: 'Mã giảm giá không hợp lệ cho Homestay này' });
        }

        const promo = checkPromo.recordset[0];
        if (new Date(promo.valid_until) < new Date()) {
            return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
        }

        // Kiểm tra xem user đã dùng mã này chưa
        const checkUsed = await pool.request()
            .input('uId', sql.Int, userId)
            .input('pId', sql.Int, promo.id)
            .query('SELECT is_used FROM user_promotions WHERE user_id = @uId AND promotion_id = @pId');
            
        if (checkUsed.recordset.length > 0 && checkUsed.recordset[0].is_used) {
            return res.status(400).json({ error: 'Bạn đã sử dụng mã giảm giá này rồi' });
        }

        // Tính toán lại tiền
        const discount_percent = promo.discount_percent;
        const discount_amount = (booking.total_amount * discount_percent) / 100;
        const newTotal = booking.total_amount - discount_amount;
        const newDeposit = newTotal * 0.3;
        const newRemaining = newTotal - newDeposit;

        // Cập nhật Database
        await pool.request()
            .input('bId', sql.Int, bookingId)
            .input('promoId', sql.Int, promo.id)
            .input('discPercent', sql.Float, discount_percent)
            .input('discAmount', sql.Decimal(18,2), discount_amount)
            .input('deposit', sql.Decimal(18,2), newDeposit)
            .input('remaining', sql.Decimal(18,2), newRemaining)
            .input('uId', sql.Int, userId)
            .query(`
                UPDATE bookings 
                SET promotion_id = @promoId, 
                    discount_percent = @discPercent, 
                    discount_amount = @discAmount,
                    deposit_amount = @deposit,
                    remaining_amount = @remaining
                WHERE id = @bId;

                UPDATE payments
                SET amount = @deposit
                WHERE booking_id = @bId;
                
                -- Đánh dấu là đã sử dụng
                IF EXISTS (SELECT 1 FROM user_promotions WHERE user_id = @uId AND promotion_id = @promoId)
                BEGIN
                    UPDATE user_promotions SET is_used = 1 WHERE user_id = @uId AND promotion_id = @promoId
                END
                ELSE
                BEGIN
                    INSERT INTO user_promotions (user_id, promotion_id, is_used) VALUES (@uId, @promoId, 1)
                END
            `);

        res.json({
            success: true,
            message: 'Áp dụng mã giảm giá thành công',
            discount_percent,
            discount_amount,
            new_deposit: newDeposit,
            new_remaining: newRemaining
        });

    } catch (err) {
        console.error('LỖI API APPLY PROMOTION:', err.message);
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
                b.id as booking_id, b.total_amount, b.deposit_amount, b.remaining_amount, b.booking_status, b.created_at,
                b.discount_percent, b.discount_amount,
                u.email as guest_email, u.phone as guest_phone,
                SUBSTRING(u.email, 1, CHARINDEX('@', u.email) - 1) as guest_name,
                h.name as homestay_name, h.address as homestay_address,
                ou.email as owner_email, ou.phone as owner_phone,
                SUBSTRING(ou.email, 1, CHARINDEX('@', ou.email) - 1) as owner_name,
                bd.check_in_datetime as check_in_datetime, bd.check_out_datetime as check_out_datetime,
                (
                    SELECT STRING_AGG(rt.name + ' (x' + CAST(c.cnt AS VARCHAR) + ')', ', ')
                    FROM (
                        SELECT r.room_type_id, COUNT(*) as cnt
                        FROM booking_details inner_bd
                        JOIN rooms r ON inner_bd.room_id = r.id
                        WHERE inner_bd.booking_id = b.id
                        GROUP BY r.room_type_id
                    ) c
                    JOIN room_types rt ON c.room_type_id = rt.id
                ) as room_type
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

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const { startAutoApproveJob, startExpiredBookingCleanupJob } = require('./cron');

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
    startAutoApproveJob(); // Bắt đầu cron job tự động duyệt đơn
    startExpiredBookingCleanupJob(io); // Bắt đầu cron job tự động hủy đơn quá thời gian giữ phòng (15 phút)
});

