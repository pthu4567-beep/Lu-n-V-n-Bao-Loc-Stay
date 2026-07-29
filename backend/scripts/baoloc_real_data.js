const baolocHomestaysData = [
  {
    hotel_id: 1,
    name: "The Tropicana Garden Bảo Lộc",
    hotel_image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Bungalow Gỗ Rừng Thông', 
        price: 650000, adult: 2, child: 1, 
        amenities: 'Bồn tắm gỗ, Ban công view rừng, Bếp nướng BBQ mini',
        room_image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"]
      },
      { 
        name: 'Nhà Kính Ngắm Sao', 
        price: 850000, adult: 2, child: 0, 
        amenities: 'Giường King, Máy chiếu phim, Trần kính trong suốt',
        room_image: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1598928506311-c55dd61d2d99"]
      },
      { 
        name: 'Villa Gỗ 2 Tầng', 
        price: 1800000, adult: 4, child: 2, 
        amenities: '2 Phòng ngủ, Bếp riêng, Loa Marshall, Sân hiên',
        room_image: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1556910103-1c02745a872e"]
      },
      { 
        name: 'Lều Glamping Mông Cổ', 
        price: 450000, adult: 2, child: 0, 
        amenities: 'Nệm êm, Đèn lều, Khu lửa trại chung, Quạt làm mát',
        room_image: "https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1496080174650-637e3f22fa03"]
      },
      { 
        name: 'Superior Garden View', 
        price: 950000, adult: 2, child: 1, 
        amenities: 'Hướng vườn, Bồn tắm sứ, Cửa sổ lớn, Smart TV',
        room_image: "https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      },
      { 
        name: 'Deluxe Pine Forest', 
        price: 1200000, adult: 2, child: 2, 
        amenities: 'Hướng rừng thông nguyên sinh, Ban công riêng, Bồn tắm sục Jacuzzi',
        room_image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd"]
      }
    ]
  },
  {
    hotel_id: 2,
    name: "DoiDep Tea Resort & Spa",
    hotel_image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Phòng Superior Vườn Trà', 
        price: 1200000, adult: 2, child: 1, 
        amenities: 'Ban công hướng đồi chè, Bồn tắm sứ, Tặng set trà chiều',
        room_image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1556740714-a8395b3bf30f"]
      },
      { 
        name: 'Suite Trăng Mật', 
        price: 2500000, adult: 2, child: 0, 
        amenities: 'Hoa hồng trang trí, Rượu vang đỏ, Bồn tắm khoáng nóng',
        room_image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Biệt Thự Hồ Bơi Riêng', 
        price: 4500000, adult: 6, child: 3, 
        amenities: 'Hồ bơi vô cực, Quản gia riêng, Sân vườn BBQ lớn',
        room_image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1572331165267-854da2b10ccc"]
      },
      { 
        name: 'Phòng Đôi Gia Đình', 
        price: 1800000, adult: 3, child: 2, 
        amenities: '1 Giường đôi & 1 Giường đơn, Khu vui chơi trẻ em',
        room_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1519643381401-22c77e60520e"]
      },
      { 
        name: 'Biệt Thự Trà 1 Phòng Ngủ', 
        price: 2100000, adult: 2, child: 1, 
        amenities: 'Nằm giữa đồi chè, Tắm bùn khoáng miễn phí, Bếp nhỏ',
        room_image: "https://images.unsplash.com/photo-1618773928120-2c788df0a5b2?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1540555700478-4be289fbecef"]
      },
      { 
        name: 'Deluxe View Đồi', 
        price: 1400000, adult: 2, child: 1, 
        amenities: 'Cửa sổ toàn cảnh Panorama, Máy pha cafe, Smart TV 55 inch',
        room_image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      }
    ]
  },
  {
    hotel_id: 3,
    name: "Mộc Trà Farm Bảo Lộc",
    hotel_image: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Phòng Gác Mái Săn Mây', 
        price: 550000, adult: 2, child: 0, 
        amenities: 'Cửa sổ panorama, Dụng cụ pha trà, Lưới sống ảo',
        room_image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1544787219-7f47ccb76574"]
      },
      { 
        name: 'Nhà Gỗ Nhìn Ra Hồ', 
        price: 750000, adult: 2, child: 1, 
        amenities: 'Ban công gỗ, Máy sấy tóc, Nước nóng năng lượng mặt trời',
        room_image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Phòng Tập Thể 6 Giường', 
        price: 150000, adult: 6, child: 0, 
        amenities: 'Tủ khóa riêng, Đèn đọc sách cá nhân, Rèm che riêng tư',
        room_image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4"]
      },
      { 
        name: 'Căn Hộ Studio Nhỏ', 
        price: 900000, adult: 2, child: 2, 
        amenities: 'Bếp từ mini, Tủ lạnh, Bàn ăn, Smart TV',
        room_image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1556910103-1c02745a872e"]
      },
      { 
        name: 'Bungalow Sân Vườn', 
        price: 650000, adult: 2, child: 1, 
        amenities: 'Vườn hoa cẩm tú cầu, Bàn trà đá, Võng xếp',
        room_image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1519643381401-22c77e60520e"]
      },
      { 
        name: 'Phòng Đôi Tiêu Chuẩn', 
        price: 450000, adult: 2, child: 0, 
        amenities: 'Giường Queen, Máy lạnh, Nước suối miễn phí',
        room_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      }
    ]
  },
  {
    hotel_id: 4,
    name: "Je T'aime Villa",
    hotel_image: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Phòng Tiêu Chuẩn Nàng Thơ', 
        price: 400000, adult: 2, child: 1, 
        amenities: 'Phong cách Vintage, Tủ quần áo gỗ, Bàn trang điểm',
        room_image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af"]
      },
      { 
        name: 'Phòng Đôi Ban Công', 
        price: 600000, adult: 2, child: 0, 
        amenities: 'Ban công trồng hoa, Bàn trà ngoài trời, Võng lười',
        room_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1519643381401-22c77e60520e"]
      },
      { 
        name: 'Je T\'aime Suite', 
        price: 1100000, adult: 2, child: 2, 
        amenities: 'Bồn tắm lộ thiên, Máy pha cà phê Espresso, Sofa bed',
        room_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd"]
      },
      { 
        name: 'Villa Cả Căn (15 Khách)', 
        price: 3500000, adult: 10, child: 5, 
        amenities: 'Phòng Karaoke, Dàn âm thanh ngoài trời, Sân đậu xe hơi',
        room_image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4"]
      },
      { 
        name: 'Villa 1 Phòng Ngủ Nhỏ', 
        price: 1200000, adult: 2, child: 1, 
        amenities: 'Không gian riêng tư, Bếp nướng BBQ sân vườn, Sofa văng',
        room_image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1"]
      },
      { 
        name: 'Villa 2 Phòng Ngủ Cổ Điển', 
        price: 1800000, adult: 4, child: 2, 
        amenities: 'Thiết kế Pháp, Lò sưởi giả, Sân vườn BBQ rộng rãi',
        room_image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1600607686527-6fb886090705"]
      }
    ]
  },
  {
    hotel_id: 5,
    name: "Sandals Flora Hotel",
    hotel_image: "https://images.unsplash.com/photo-1551882547-ff40c0d5857a?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Classic Room', 
        price: 800000, adult: 2, child: 1, 
        amenities: 'Điều hòa, Két sắt an toàn, Mini bar, Ăn sáng miễn phí',
        room_image: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Deluxe City View', 
        price: 1100000, adult: 2, child: 1, 
        amenities: 'Cửa sổ lớn ngắm phố, Bàn làm việc, Tivi 50 inch',
        room_image: "https://images.unsplash.com/photo-1592229505726-ca121723b8ef?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      },
      { 
        name: 'Flora Executive Suite', 
        price: 1800000, adult: 2, child: 2, 
        amenities: 'Khu tiếp khách riêng, Bồn tắm sục Jacuzzi, Hoa tươi mỗi ngày',
        room_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd"]
      },
      { 
        name: 'Connecting Room (Gia đình)', 
        price: 2200000, adult: 4, child: 2, 
        amenities: '2 phòng thông nhau, 2 Phòng tắm, Máy lọc không khí',
        room_image: "https://images.unsplash.com/photo-1568495248636-6432b97bd94b?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4"]
      },
      { 
        name: 'Standard City View', 
        price: 700000, adult: 2, child: 0, 
        amenities: 'Thiết kế tối giản, Giường Double, Wifi tốc độ cao',
        room_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      },
      { 
        name: 'Family Suite', 
        price: 1600000, adult: 4, child: 2, 
        amenities: '2 Giường King, Không gian sinh hoạt chung, Bồn tắm',
        room_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd"]
      }
    ]
  },
  {
    hotel_id: 6,
    name: "Bảo Lộc House",
    hotel_image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Phòng Giường Đôi Tiết Kiệm', 
        price: 300000, adult: 2, child: 0, 
        amenities: 'Quạt máy, Bếp chung, Nước lọc miễn phí',
        room_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1556910103-1c02745a872e"]
      },
      { 
        name: 'Phòng 2 Giường Đôi', 
        price: 550000, adult: 4, child: 2, 
        amenities: 'WC trong phòng, Máy lạnh, Bàn ăn trong phòng',
        room_image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Nhà Gỗ Nhỏ Góc Vườn', 
        price: 450000, adult: 2, child: 1, 
        amenities: 'Không gian riêng tư, Sân hiên uống trà, Vườn rau',
        room_image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1544787219-7f47ccb76574"]
      },
      { 
        name: 'Nguyên Căn Homestay', 
        price: 2000000, adult: 8, child: 4, 
        amenities: 'Toàn bộ 4 phòng ngủ, Lò nướng than BBQ, Chỗ đậu 2 xe ô tô',
        room_image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1"]
      },
      { 
        name: 'Phòng Đơn Tiêu Chuẩn', 
        price: 250000, adult: 1, child: 0, 
        amenities: 'Giường đơn, Quạt máy, Tủ quần áo',
        room_image: "https://images.unsplash.com/photo-1536250811985-7977eb05ba97?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af"]
      },
      { 
        name: 'Phòng Gia Đình 6 Người', 
        price: 750000, adult: 6, child: 2, 
        amenities: '3 Giường Queen, Rộng rãi, Gần sân chơi',
        room_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1519643381401-22c77e60520e"]
      }
    ]
  },
  {
    hotel_id: 7,
    name: "Tulip Hotel Bảo Lộc",
    hotel_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Phòng Đơn Tiêu Chuẩn', 
        price: 250000, adult: 1, child: 0, 
        amenities: 'Truyền hình cáp, Nước nóng lạnh, Dọn phòng hàng ngày',
        room_image: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Phòng Đôi Standard', 
        price: 350000, adult: 2, child: 1, 
        amenities: 'Tủ lạnh mini, Trà/Café miễn phí, Khăn tắm thay mới',
        room_image: "https://images.unsplash.com/photo-1592229505726-ca121723b8ef?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      },
      { 
        name: 'Phòng VIP Có Ban Công', 
        price: 550000, adult: 2, child: 1, 
        amenities: 'Tivi thông minh, Ban công ngắm cảnh phố, Máy sấy',
        room_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1519643381401-22c77e60520e"]
      },
      { 
        name: 'Phòng Gia Đình 3 Giường', 
        price: 700000, adult: 6, child: 0, 
        amenities: 'Không gian rộng rãi, Máy lạnh công suất lớn, Bàn ghế tiếp khách',
        room_image: "https://images.unsplash.com/photo-1568495248636-6432b97bd94b?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4"]
      },
      { 
        name: 'Phòng Superior City View', 
        price: 450000, adult: 2, child: 1, 
        amenities: 'Giường King, View trung tâm thành phố, Bàn làm việc',
        room_image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1583847268964-b28dc8f51f92"]
      },
      { 
        name: 'Phòng Gia Đình 4 Giường', 
        price: 850000, adult: 8, child: 2, 
        amenities: 'Phù hợp nhóm bạn, Tủ lạnh lớn, Bàn ăn rộng',
        room_image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1556910103-1c02745a872e"]
      }
    ]
  },
  {
    hotel_id: 8,
    name: "ĐamB'ri Eco Lodge",
    hotel_image: "https://images.unsplash.com/photo-1504280327382-96cb3470786d?auto=format&fit=crop&w=800&q=80",
    room_types: [
      { 
        name: 'Nhà Chòi Gió Cạnh Suối', 
        price: 600000, adult: 2, child: 1, 
        amenities: 'Gần suối tự nhiên, Võng dù, Trà nóng',
        room_image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1544787219-7f47ccb76574"]
      },
      { 
        name: 'Bungalow Tổ Chim', 
        price: 850000, adult: 2, child: 0, 
        amenities: 'Kiến trúc treo trên cây độc đáo, WC khép kín, Bữa sáng tại giường',
        room_image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a"]
      },
      { 
        name: 'Nhà Sàn Gỗ Lớn', 
        price: 2200000, adult: 10, child: 5, 
        amenities: 'Phù hợp hội nhóm, Lửa trại, Cung cấp củi nướng BBQ',
        room_image: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1"]
      },
      { 
        name: 'Lều Safari Cắm Trại', 
        price: 500000, adult: 2, child: 1, 
        amenities: 'Lều cao cấp, Nệm cách nhiệt, Bếp cồn dã ngoại',
        room_image: "https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1496080174650-637e3f22fa03"]
      },
      { 
        name: 'Nhà Gỗ Bungalow Deluxe', 
        price: 950000, adult: 2, child: 1, 
        amenities: 'View thác Đambri, Bồn tắm ngoài trời, Bếp nhỏ',
        room_image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd"]
      },
      { 
        name: 'Biệt Thự Rừng Nguyên Sinh', 
        price: 3200000, adult: 6, child: 3, 
        amenities: 'Khu vực riêng tư, Suối bao quanh, Dịch vụ nướng BBQ tận nơi',
        room_image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        amenities_images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1"]
      }
    ]
  }
];

module.exports = baolocHomestaysData;
