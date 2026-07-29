const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');
const baolocHomestaysData = require('./baoloc_real_data.js');

const mockHomestays = [
  {
    name: "The Tropicana Garden Bảo Lộc",
    address: "B'Lao, TP. Bảo Lộc, Lâm Đồng",
    description: "The Tropicana Garden Bảo Lộc mang đến không gian nghỉ dưỡng biệt lập, bao quanh bởi rừng thông nguyên sinh xanh mướt.",
    status: 'active'
  },
  {
    name: "DoiDep Tea Resort & Spa",
    address: "27 Cao Thắng, Lộc Nga, TP. Bảo Lộc",
    description: "Tea Resort Bảo Lộc (DoiDep) là khu nghỉ dưỡng bùn khoáng và spa cao cấp hàng đầu tại khu vực.",
    status: 'active'
  },
  {
    name: "Mộc Trà Farm Bảo Lộc",
    address: "Thôn 4, Lộc Tân, Huyện Bảo Lâm, Lâm Đồng",
    description: "Mộc Trà Farm nằm cạnh hồ nước trong lành với góc view rộng mở, là nơi ngắm bình minh và săn mây lý tưởng.",
    status: 'active'
  },
  {
    name: "Je T'aime Villa",
    address: "Lộc Châu, TP. Bảo Lộc, Lâm Đồng",
    description: "Je T'aime Villa là biệt thự nghỉ dưỡng mang phong cách châu Âu tinh tế và lãng mạn.",
    status: 'active'
  },
  {
    name: "Sandals Flora Hotel",
    address: "11 Nguyễn Thái Học, Phường 2, TP. Bảo Lộc",
    description: "Sandals Flora Hotel tọa lạc tại trung tâm thành phố Bảo Lộc sầm uất.",
    status: 'active'
  },
  {
    name: "Bảo Lộc House",
    address: "408 Phan Đình Phùng, Lộc Tiến, TP. Bảo Lộc",
    description: "Bảo Lộc House là ngôi nhà chung ấm áp mang đậm chất gia đình.",
    status: 'active'
  },
  {
    name: "Tulip Hotel Bảo Lộc",
    address: "Trần Phú, TP. Bảo Lộc",
    description: "Tulip Hotel là khách sạn phân khúc bình dân nhưng tiện nghi vượt trội.",
    status: 'active'
  },
  {
    name: "ĐamB'ri Eco Lodge",
    address: "Khu du lịch ĐamB'ri, TP. Bảo Lộc",
    description: "Tọa lạc ngay trong khuôn viên khu du lịch Thác ĐamB'ri kỳ vĩ, ĐamB'ri Eco Lodge mang đến trải nghiệm nghỉ dưỡng sinh thái độc đáo.",
    status: 'active'
  }
];

async function seedDatabase() {
  try {
    const pool = await poolPromise;
    console.log("Connected to DB, clearing old data...");

    // Clear old data safely (respecting foreign keys)
    await pool.request().query(`
      DELETE FROM reviews;
      DELETE FROM payments;
      DELETE FROM booking_details;
      DELETE FROM bookings;
      DELETE FROM rooms;
      DELETE FROM room_types;
      DELETE FROM hotel_images;
      DELETE FROM user_promotions;
      DELETE FROM promotions;
      DELETE FROM hotels;
      DELETE FROM user_profiles;
      DELETE FROM users;
      DELETE FROM roles;
      
      DBCC CHECKIDENT ('hotels', RESEED, 0);
      DBCC CHECKIDENT ('hotel_images', RESEED, 0);
      DBCC CHECKIDENT ('room_types', RESEED, 0);
      DBCC CHECKIDENT ('rooms', RESEED, 0);
      DBCC CHECKIDENT ('users', RESEED, 0);
      DBCC CHECKIDENT ('roles', RESEED, 0);
    `);
    console.log("Old data cleared!");

    // 1. Seed Roles
    console.log("Seeding roles...");
    await pool.request().query(`
      INSERT INTO roles (role_name) VALUES ('Admin');
      INSERT INTO roles (role_name) VALUES ('Owner');
      INSERT INTO roles (role_name) VALUES ('Customer');
    `);

    // 2. Seed Users with hashed passwords
    console.log("Seeding users...");
    const adminHash = await bcrypt.hash('admin123', 10);
    const ownerHash = await bcrypt.hash('owner123', 10);
    const customerHash = await bcrypt.hash('customer123', 10);

    const adminResult = await pool.request()
      .input('email', sql.VarChar, 'admin@baolocstay.com')
      .input('pwd', sql.VarChar, adminHash)
      .input('phone', sql.VarChar, '0999999999')
      .query(`
        INSERT INTO users (role_id, email, password_hash, phone, created_at)
        OUTPUT INSERTED.id
        VALUES (1, @email, @pwd, @phone, GETDATE());
      `);
    const adminId = adminResult.recordset[0].id;
    await pool.request().input('uid', sql.Int, adminId).query(`
      INSERT INTO user_profiles (user_id, avatar_url, address)
      VALUES (@uid, 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', N'Quản trị viên Hệ thống');
    `);

    // Owners are created per homestay inside the loop below

    const customerResult = await pool.request()
      .input('email', sql.VarChar, 'customer@test.com')
      .input('pwd', sql.VarChar, customerHash)
      .input('phone', sql.VarChar, '0123456789')
      .query(`
        INSERT INTO users (role_id, email, password_hash, phone, created_at)
        OUTPUT INSERTED.id
        VALUES (3, @email, @pwd, @phone, GETDATE());
      `);
    const customerId = customerResult.recordset[0].id;
    await pool.request().input('uid', sql.Int, customerId).query(`
      INSERT INTO user_profiles (user_id, avatar_url, address)
      VALUES (@uid, 'https://api.dicebear.com/7.x/adventurer/svg?seed=customer', N'Hồ Chí Minh');
    `);

    console.log("Seeding homestays and rooms...");
    
    // 3. Seed Hotels, Room Types, and physical Rooms from baoloc_real_data.js
    const ownerEmails = [
      'tropicana@baolocstay.com',
      'doidep@baolocstay.com',
      'moctra@baolocstay.com',
      'jetaime@baolocstay.com',
      'sandals@baolocstay.com',
      'baolochouse@baolocstay.com',
      'tulip@baolocstay.com',
      'dambri@baolocstay.com'
    ];

    for (let hIndex = 0; hIndex < mockHomestays.length; hIndex++) {
      const mockH = mockHomestays[hIndex];
      const realData = baolocHomestaysData[hIndex];
      const ownerEmail = ownerEmails[hIndex] || `owner${hIndex+1}@baolocstay.com`;

      const ownerResult = await pool.request()
        .input('email', sql.VarChar, ownerEmail)
        .input('pwd', sql.VarChar, ownerHash)
        .input('phone', sql.VarChar, '088888880' + (hIndex + 1))
        .query(`
          INSERT INTO users (role_id, email, password_hash, phone, created_at)
          OUTPUT INSERTED.id
          VALUES (2, @email, @pwd, @phone, GETDATE());
        `);
      const ownerId = ownerResult.recordset[0].id;
      await pool.request().input('uid', sql.Int, ownerId).input('email', sql.VarChar, ownerEmail).query(`
        INSERT INTO user_profiles (user_id, avatar_url, address)
        VALUES (@uid, 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + @email, N'Bảo Lộc, Lâm Đồng');
      `);
      
      // Lấy tất cả tiện nghi của phòng để gom thành tiện nghi chung của KS
      const allAmenities = realData.room_types.map(rt => rt.amenities).join(', ');
      
      const hotelResult = await pool.request()
        .input('name', sql.NVarChar, realData.name)
        .input('address', sql.NVarChar, mockH.address)
        .input('facilities', sql.NVarChar, "WiFi, Bãi đậu xe, " + allAmenities.substring(0, 100))
        .input('ownerId', sql.Int, ownerId)
        .input('description', sql.NVarChar, mockH.description)
        .query(`
          INSERT INTO hotels (name, address, facilities_text, status, owner_id, description) 
          OUTPUT INSERTED.id
          VALUES (@name, @address, @facilities, 'active', @ownerId, @description);
        `);

      const hotelId = hotelResult.recordset[0].id;

      // Insert Hotel Image (real image from baoloc_real_data)
      await pool.request()
        .input('hotelId', sql.Int, hotelId)
        .input('img', sql.VarChar, realData.hotel_image)
        .query(`
          INSERT INTO hotel_images (hotel_id, image_url, is_thumbnail)
          VALUES (@hotelId, @img, 1);
        `);

      // Insert Room Types (6 types per hotel)
      for (const rt of realData.room_types) {
        const capacity = rt.adult + rt.child;
        const amenitiesImagesStr = JSON.stringify(rt.amenities_images); // Save as JSON array string
        
        const roomTypeResult = await pool.request()
          .input('hotelId', sql.Int, hotelId)
          .input('name', sql.NVarChar, rt.name)
          .input('price', sql.Decimal(18, 2), rt.price)
          .input('cap', sql.Int, capacity)
          .input('adult', sql.Int, rt.adult)
          .input('child', sql.Int, rt.child)
          .input('amenities', sql.NVarChar, rt.amenities)
          .input('imgUrl', sql.VarChar, rt.room_image)
          .input('amenitiesImg', sql.NVarChar, amenitiesImagesStr)
          .query(`
            INSERT INTO room_types (hotel_id, name, base_price, capacity, adult_capacity, child_capacity, room_amenities_text, image_url, amenities_images_text)
            OUTPUT INSERTED.id
            VALUES (@hotelId, @name, @price, @cap, @adult, @child, @amenities, @imgUrl, @amenitiesImg);
          `);
        
        const roomTypeId = roomTypeResult.recordset[0].id;

        // Insert 5 physical Rooms for this room type
        for (let i = 1; i <= 5; i++) {
          const roomNumber = `${roomTypeId}-${100 + i}`;
          await pool.request()
            .input('roomTypeId', sql.Int, roomTypeId)
            .input('roomNumber', sql.VarChar, roomNumber)
            .query(`
              INSERT INTO rooms (room_type_id, room_number, status)
              VALUES (@roomTypeId, @roomNumber, 'available');
            `);
        }
      }
    }

    console.log("Successfully seeded database with real data (48 room types total, 240 physical rooms)!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
