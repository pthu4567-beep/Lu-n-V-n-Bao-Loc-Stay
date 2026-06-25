USE QLKhachsanBaoLoc;
GO

-- ==========================================
-- NHÓM 1: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
-- ==========================================

-- 1. Bảng roles (Phân quyền)
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

-- 2. Bảng users (Tài khoản người dùng)
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 3. Bảng user_profiles (Hồ sơ chi tiết)
CREATE TABLE user_profiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE,
    avatar_url VARCHAR(255),
    address VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- NHÓM 2: QUẢN LÝ LƯU TRÚ (HOMESTAY, PHÒNG)
-- ==========================================

-- 4. Bảng hotels (Cơ sở lưu trú)
CREATE TABLE hotels (
    id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    facilities_text NVARCHAR(MAX),
    address NVARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 5. Bảng hotel_images (Hình ảnh khách sạn)
CREATE TABLE hotel_images (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hotel_id INT,
    image_url VARCHAR(255) NOT NULL,
    is_thumbnail BIT DEFAULT 0,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- 6. Bảng room_types (Loại phòng)
CREATE TABLE room_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hotel_id INT,
    name NVARCHAR(100) NOT NULL,
    room_amenities_text NVARCHAR(MAX),
    base_price DECIMAL(10,2) NOT NULL,
    capacity INT DEFAULT 2,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- 7. Bảng rooms (Phòng vật lý)
CREATE TABLE rooms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    room_type_id INT,
    room_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- ==========================================
-- NHÓM 3: ĐẶT PHÒNG, THANH TOÁN & KHUYẾN MÃI
-- ==========================================

-- 8. Bảng promotions (Mã giảm giá)
CREATE TABLE promotions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hotel_id INT,
    discount_code VARCHAR(50) NOT NULL,
    discount_percent FLOAT NOT NULL,
    valid_until DATETIME,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- 9. Bảng bookings (Đơn đặt phòng)
CREATE TABLE bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    hotel_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'pending_payment',
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- 10. Bảng booking_details (Chi tiết phòng được đặt)
CREATE TABLE booking_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT,
    room_id INT,
    booking_type VARCHAR(20) NOT NULL, 
    check_in_datetime DATETIME NOT NULL,
    check_out_datetime DATETIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 11. Bảng payments (Giao dịch thanh toán QR)
CREATE TABLE payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'QR_Transfer',
    payment_status VARCHAR(50) DEFAULT 'awaiting_confirmation',
    verified_by INT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ==========================================
-- NHÓM 4: TƯƠNG TÁC & HỖ TRỢ
-- ==========================================

-- 12. Bảng reviews (Đánh giá)
CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT UNIQUE,
    user_id INT,
    rating_score INT CHECK (rating_score BETWEEN 1 AND 5),
    comment NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 13. Bảng contact_messages (Liên hệ)
CREATE TABLE contact_messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_lot NVARCHAR(100) NOT NULL,
    ten NVARCHAR(50) NOT NULL,
    loi_nhan NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);