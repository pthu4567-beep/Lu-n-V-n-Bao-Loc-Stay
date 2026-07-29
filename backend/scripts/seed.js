const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');

const mockHomestays = [
  {
    name: "The Tropicana Garden Bảo Lộc",
    address: "B'Lao, TP. Bảo Lộc, Lâm Đồng",
    price: 1850000,
    img: "/images/homestays/tropicana.jpg",
    amenities: "Rừng thông, Sân vườn BBQ, Bồn tắm mộc",
    description: "The Tropicana Garden Bảo Lộc mang đến không gian nghỉ dưỡng biệt lập, bao quanh bởi rừng thông nguyên sinh xanh mướt. Nơi đây là điểm dừng chân hoàn hảo cho những ai muốn tìm lại sự yên bình, thư thái tâm hồn, hít thở bầu không khí trong lành của cao nguyên Lâm Đồng và thưởng thức những buổi tiệc nướng BBQ ngoài trời ấm cúng."
  },
  {
    name: "DoiDep Tea Resort & Spa",
    address: "27 Cao Thắng, Lộc Nga, TP. Bảo Lộc",
    price: 2650000,
    img: "/images/homestays/doidep.jpg",
    amenities: "Hồ bơi, Tắm bùn, Spa, Đồi chè",
    description: "Tea Resort Bảo Lộc (DoiDep) là khu nghỉ dưỡng bùn khoáng và spa cao cấp hàng đầu tại khu vực. Sở hữu cảnh quan đồi chè thơ mộng cùng hồ bơi ngoài trời hiện đại, resort cung cấp các liệu trình tắm bùn, massage và chăm sóc sức khỏe chuyên nghiệp, mang đến trải nghiệm thư giãn đẳng cấp cho cả gia đình."
  },
  {
    name: "Mộc Trà Farm Bảo Lộc",
    address: "Thôn 4, Lộc Tân, Huyện Bảo Lâm, Lâm Đồng",
    price: 850000,
    img: "/images/homestays/moctra.jpg",
    amenities: "Săn mây, View Hồ, Quán Cafe",
    description: "Mộc Trà Farm nằm cạnh hồ nước trong lành với góc view rộng mở, là nơi ngắm bình minh và săn mây lý tưởng. Homestay kết hợp quán cafe sân vườn lãng mạn, phục vụ các loại trà, cafe hảo hạng của địa phương. Không gian mộc mạc, gần gũi thiên nhiên sẽ đem lại cảm giác bình yên khó quên."
  },
  {
    name: "Je T'aime Villa",
    address: "Lộc Châu, TP. Bảo Lộc, Lâm Đồng",
    price: 1450000,
    img: "/images/homestays/jetaime.jpg",
    amenities: "Villa nguyên căn, Sân vườn BBQ, Karaoke",
    description: "Je T'aime Villa là biệt thự nghỉ dưỡng mang phong cách châu Âu tinh tế và lãng mạn. Với không gian sân vườn rộng rãi, khu vực nướng BBQ riêng biệt và phòng karaoke gia đình hiện đại, đây là lựa chọn tuyệt vời cho các nhóm bạn hoặc gia đình đông người muốn tận hưởng kỳ nghỉ tự do và riêng tư."
  },
  {
    name: "Sandals Flora Hotel",
    address: "11 Nguyễn Thái Học, Phường 2, TP. Bảo Lộc",
    price: 750000,
    img: "/images/homestays/sandals.jpg",
    amenities: "Khách sạn trung tâm, Thang máy, Ăn sáng",
    description: "Sandals Flora Hotel tọa lạc tại trung tâm thành phố Bảo Lộc sầm uất, thuận tiện cho việc di chuyển, tham quan và mua sắm. Khách sạn được thiết kế hiện đại, trang bị thang máy tiện lợi, phục vụ buffet sáng đa dạng và sở hữu đội ngũ nhân viên nhiệt tình, chu đáo."
  },
  {
    name: "Bảo Lộc House",
    address: "408 Phan Đình Phùng, Lộc Tiến, TP. Bảo Lộc",
    price: 550000,
    img: "/images/homestays/baoloc_house.jpg",
    amenities: "Homestay gia đình, Bếp chung, Sân vườn BBQ",
    description: "Bảo Lộc House là ngôi nhà chung ấm áp mang đậm chất gia đình. Thiết kế gần gũi với bếp chung đầy đủ dụng cụ để bạn tự tay chuẩn bị món ăn yêu thích, sân vườn ngập tràn hoa lá phù hợp cho những buổi tiệc nướng trò chuyện thâu đêm."
  },
  {
    name: "Tulip Hotel Bảo Lộc",
    address: "Trần Phú, TP. Bảo Lộc",
    price: 450000,
    img: "/images/homestays/tulip.jpg",
    amenities: "Giá rẻ, Gần chợ, Dọn phòng mỗi ngày",
    description: "Tulip Hotel là khách sạn phân khúc bình dân nhưng tiện nghi vượt trội. Nằm ngay sát khu vực chợ Bảo Lộc, khách sạn mang lại sự thuận tiện tuyệt đối cho du khách. Dịch vụ dọn phòng mỗi ngày sạch sẽ, chuyên nghiệp đảm bảo sự hài lòng tối đa với mức chi phí tiết kiệm."
  },
  {
    name: "ĐamB'ri Eco Lodge",
    address: "Khu du lịch ĐamB'ri, TP. Bảo Lộc",
    price: 950000,
    img: "/images/homestays/dambri.jpg",
    amenities: "Gần thác, Glamping, Lửa trại",
    description: "Tọa lạc ngay trong khuôn viên khu du lịch Thác ĐamB'ri kỳ vĩ, ĐamB'ri Eco Lodge mang đến trải nghiệm nghỉ dưỡng sinh thái độc đáo. Du khách có thể trải nghiệm dịch vụ lều trại Glamping sang chảnh bên bờ suối, đốt lửa trại ấm áp dưới trời đêm mát lạnh của đại ngàn."
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

    // Admin user (role_id = 1)
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

    // Owner user (role_id = 2)
    const ownerResult = await pool.request()
      .input('email', sql.VarChar, 'owner@baolocstay.com')
      .input('pwd', sql.VarChar, ownerHash)
      .input('phone', sql.VarChar, '0888888888')
      .query(`
        INSERT INTO users (role_id, email, password_hash, phone, created_at)
        OUTPUT INSERTED.id
        VALUES (2, @email, @pwd, @phone, GETDATE());
      `);
    const ownerId = ownerResult.recordset[0].id;
    await pool.request().input('uid', sql.Int, ownerId).query(`
      INSERT INTO user_profiles (user_id, avatar_url, address)
      VALUES (@uid, 'https://api.dicebear.com/7.x/adventurer/svg?seed=owner', N'Bảo Lộc, Lâm Đồng');
    `);

    // Customer user (role_id = 3)
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
    // 3. Seed Hotels, Room Types, and physical Rooms
    for (const item of mockHomestays) {
      // Insert Hotel
      const hotelResult = await pool.request()
        .input('name', sql.NVarChar, item.name)
        .input('address', sql.NVarChar, item.address)
        .input('facilities', sql.NVarChar, item.amenities)
        .input('ownerId', sql.Int, ownerId)
        .input('description', sql.NVarChar, item.description || '')
        .query(`
          INSERT INTO hotels (name, address, facilities_text, status, owner_id, description) 
          OUTPUT INSERTED.id
          VALUES (@name, @address, @facilities, 'active', @ownerId, @description);
        `);

      const hotelId = hotelResult.recordset[0].id;

      // Insert Image
      await pool.request()
        .input('hotelId', sql.Int, hotelId)
        .input('img', sql.VarChar, item.img)
        .query(`
          INSERT INTO hotel_images (hotel_id, image_url, is_thumbnail)
          VALUES (@hotelId, @img, 1);
        `);

      // Insert Room Type
      const roomTypeResult = await pool.request()
        .input('hotelId', sql.Int, hotelId)
        .input('price', sql.Decimal(10, 2), item.price)
        .query(`
          INSERT INTO room_types (hotel_id, name, base_price, capacity, room_amenities_text)
          OUTPUT INSERTED.id
          VALUES (@hotelId, N'Phòng Tiêu Chuẩn', @price, 2, N'Wifi, Tivi, Điều hòa, Bồn tắm');
        `);
      const roomTypeId = roomTypeResult.recordset[0].id;

      // Insert 5 physical Rooms for this room type
      for (let i = 1; i <= 5; i++) {
        const roomNumber = `P${100 + i}`;
        await pool.request()
          .input('roomTypeId', sql.Int, roomTypeId)
          .input('roomNumber', sql.VarChar, roomNumber)
          .query(`
            INSERT INTO rooms (room_type_id, room_number, status)
            VALUES (@roomTypeId, @roomNumber, 'available');
          `);
      }
    }

    console.log("Successfully seeded database with roles, users, hotels, and 5 physical rooms per hotel!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
