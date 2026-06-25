const { sql, poolPromise } = require('./db.js');

const roomTemplates = [
    // Homestay 1: Tropicana
    [
        { name: 'Bungalow Gỗ Rừng Thông', price: 650000, adult: 2, child: 1, amenities: 'Bồn tắm gỗ, Ban công view rừng, Bếp nướng BBQ mini' },
        { name: 'Nhà Kính Ngắm Sao', price: 850000, adult: 2, child: 0, amenities: 'Giường King, Máy chiếu phim, Trần kính trong suốt' },
        { name: 'Villa Gỗ 2 Tầng', price: 1800000, adult: 4, child: 2, amenities: '2 Phòng ngủ, Bếp riêng, Loa Marshall, Sân hiên' },
        { name: 'Lều Glamping Mông Cổ', price: 450000, adult: 2, child: 0, amenities: 'Nệm êm, Đèn lều, Khu lửa trại chung, Quạt làm mát' }
    ],
    // Homestay 2: DoiDep
    [
        { name: 'Phòng Superior Vườn Trà', price: 1200000, adult: 2, child: 1, amenities: 'Ban công hướng đồi chè, Bồn tắm sứ, Tặng set trà chiều' },
        { name: 'Suite Trăng Mật', price: 2500000, adult: 2, child: 0, amenities: 'Hoa hồng trang trí, Rượu vang đỏ, Bồn tắm khoáng nóng' },
        { name: 'Biệt Thự Hồ Bơi Riêng', price: 4500000, adult: 6, child: 3, amenities: 'Hồ bơi vô cực, Quản gia riêng, Sân vườn BBQ lớn' },
        { name: 'Phòng Đôi Gia Đình', price: 1800000, adult: 3, child: 2, amenities: '1 Giường đôi & 1 Giường đơn, Khu vui chơi trẻ em' }
    ],
    // Homestay 3: Mộc Trà
    [
        { name: 'Phòng Gác Mái Săn Mây', price: 550000, adult: 2, child: 0, amenities: 'Cửa sổ panorama, Dụng cụ pha trà, Lưới sống ảo' },
        { name: 'Nhà Gỗ Nhìn Ra Hồ', price: 750000, adult: 2, child: 1, amenities: 'Ban công gỗ, Máy sấy tóc, Nước nóng năng lượng mặt trời' },
        { name: 'Phòng Tập Thể 6 Giường', price: 150000, adult: 6, child: 0, amenities: 'Tủ khóa riêng, Đèn đọc sách cá nhân, Rèm che riêng tư' },
        { name: 'Căn Hộ Studio Nhỏ', price: 900000, adult: 2, child: 2, amenities: 'Bếp từ mini, Tủ lạnh, Bàn ăn, Smart TV' }
    ],
    // Homestay 4: Je T'aime
    [
        { name: 'Phòng Tiêu Chuẩn Nàng Thơ', price: 400000, adult: 2, child: 1, amenities: 'Phong cách Vintage, Tủ quần áo gỗ, Bàn trang điểm' },
        { name: 'Phòng Đôi Ban Công', price: 600000, adult: 2, child: 0, amenities: 'Ban công trồng hoa, Bàn trà ngoài trời, Võng lười' },
        { name: 'Je T\'aime Suite', price: 1100000, adult: 2, child: 2, amenities: 'Bồn tắm lộ thiên, Máy pha cà phê Espresso, Sofa bed' },
        { name: 'Villa Cả Căn (15 Khách)', price: 3500000, adult: 10, child: 5, amenities: 'Phòng Karaoke, Dàn âm thanh ngoài trời, Sân đậu xe hơi' }
    ],
    // Homestay 5: Sandals Flora
    [
        { name: 'Classic Room', price: 800000, adult: 2, child: 1, amenities: 'Điều hòa, Két sắt an toàn, Mini bar, Ăn sáng miễn phí' },
        { name: 'Deluxe City View', price: 1100000, adult: 2, child: 1, amenities: 'Cửa sổ lớn ngắm phố, Bàn làm việc, Tivi 50 inch' },
        { name: 'Flora Executive Suite', price: 1800000, adult: 2, child: 2, amenities: 'Khu tiếp khách riêng, Bồn tắm sục Jacuzzi, Hoa tươi mỗi ngày' },
        { name: 'Connecting Room (Gia đình)', price: 2200000, adult: 4, child: 2, amenities: '2 phòng thông nhau, 2 Phòng tắm, Máy lọc không khí' }
    ],
    // Homestay 6: Bảo Lộc House
    [
        { name: 'Phòng Giường Đôi Tiết Kiệm', price: 300000, adult: 2, child: 0, amenities: 'Quạt máy, Bếp chung, Nước lọc miễn phí' },
        { name: 'Phòng 2 Giường Đôi', price: 550000, adult: 4, child: 2, amenities: 'WC trong phòng, Máy lạnh, Bàn ăn trong phòng' },
        { name: 'Nhà Gỗ Nhỏ Góc Vườn', price: 450000, adult: 2, child: 1, amenities: 'Không gian riêng tư, Sân hiên uống trà, Vườn rau' },
        { name: 'Nguyên Căn Homestay', price: 2000000, adult: 8, child: 4, amenities: 'Toàn bộ 4 phòng ngủ, Lò nướng than BBQ, Chỗ đậu 2 xe ô tô' }
    ],
    // Homestay 7: Tulip
    [
        { name: 'Phòng Đơn Tiêu Chuẩn', price: 250000, adult: 1, child: 0, amenities: 'Truyền hình cáp, Nước nóng lạnh, Dọn phòng hàng ngày' },
        { name: 'Phòng Đôi Standard', price: 350000, adult: 2, child: 1, amenities: 'Tủ lạnh mini, Trà/Café miễn phí, Khăn tắm thay mới' },
        { name: 'Phòng VIP Có Ban Công', price: 550000, adult: 2, child: 1, amenities: 'Tivi thông minh, Ban công ngắm cảnh phố, Máy sấy' },
        { name: 'Phòng Gia Đình 3 Giường', price: 700000, adult: 6, child: 0, amenities: 'Không gian rộng rãi, Máy lạnh công suất lớn, Bàn ghế tiếp khách' }
    ],
    // Homestay 8: Dambri
    [
        { name: 'Nhà Chòi Gió Cạnh Suối', price: 600000, adult: 2, child: 1, amenities: 'Gần suối tự nhiên, Võng dù, Trà nóng' },
        { name: 'Bungalow Tổ Chim', price: 850000, adult: 2, child: 0, amenities: 'Kiến trúc treo trên cây độc đáo, WC khép kín, Bữa sáng tại giường' },
        { name: 'Nhà Sàn Gỗ Lớn', price: 2200000, adult: 10, child: 5, amenities: 'Phù hợp hội nhóm, Lửa trại, Cung cấp củi nướng BBQ' },
        { name: 'Lều Safari Cắm Trại', price: 500000, adult: 2, child: 1, amenities: 'Lều cao cấp, Nệm cách nhiệt, Bếp cồn dã ngoại' }
    ]
];

poolPromise.then(async pool => {
    try {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Fetch existing rooms mapped by hotel_id
            const res = await transaction.request().query('SELECT id, hotel_id FROM room_types ORDER BY hotel_id, id');
            const roomTypes = res.recordset;

            let hotelMap = {};
            for (let rt of roomTypes) {
                if (!hotelMap[rt.hotel_id]) hotelMap[rt.hotel_id] = [];
                hotelMap[rt.hotel_id].push(rt.id);
            }

            for (let hId = 1; hId <= 8; hId++) {
                const rtIds = hotelMap[hId];
                if (!rtIds) continue;
                
                const templates = roomTemplates[hId - 1];
                for (let i = 0; i < rtIds.length; i++) {
                    const rtId = rtIds[i];
                    // If there are more room types than templates, just cycle or stop
                    if (i >= templates.length) continue;

                    const tpl = templates[i];
                    const totalCap = tpl.adult + tpl.child;

                    await transaction.request()
                        .input('id', sql.Int, rtId)
                        .input('name', sql.NVarChar, tpl.name)
                        .input('price', sql.Decimal(18,2), tpl.price)
                        .input('adult', sql.Int, tpl.adult)
                        .input('child', sql.Int, tpl.child)
                        .input('cap', sql.Int, totalCap)
                        .input('amenities', sql.NVarChar, tpl.amenities)
                        .query(`
                            UPDATE room_types 
                            SET name = @name, 
                                base_price = @price, 
                                adult_capacity = @adult, 
                                child_capacity = @child,
                                capacity = @cap,
                                room_amenities_text = @amenities
                            WHERE id = @id
                        `);
                }
            }

            await transaction.commit();
            console.log('✅ Đã cập nhật thành công dữ liệu riêng biệt cho 8 homestay!');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('❌ Lỗi:', err);
    }
    process.exit(0);
});
