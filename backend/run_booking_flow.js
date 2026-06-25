const API_URL = 'http://127.0.0.1:5000/api';

async function runBookingFlow() {
    console.log('====================================================');
    console.log('BẮT ĐẦU CHẠY THỬ NGHIỆM CHỨC NĂNG CHÍNH: ĐẶT PHÒNG');
    console.log('====================================================');

    try {
        // 1. Đăng ký tài khoản test
        const testUser = {
            email: `testuser_${Date.now()}@example.com`,
            password: 'password123',
            phone: '0123456789'
        };
        console.log(`\n[1] Đang tạo tài khoản mới: ${testUser.email}...`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Register failed');
        const token = regData.token;
        console.log('=> Đăng ký thành công! Đã lấy được JWT Token.');

        // 2. Lấy danh sách Homestay
        console.log('\n[2] Đang lấy danh sách các Homestay hiện có...');
        const homestaysRes = await fetch(`${API_URL}/homestays`);
        const homestays = await homestaysRes.json();
        if (homestays.length === 0) throw new Error('Không có homestay nào trong hệ thống!');
        
        const selectedHomestay = homestays[0];
        console.log(`=> Đã chọn Homestay: ${selectedHomestay.name} (ID: ${selectedHomestay.id})`);

        // 3. Lấy chi tiết Homestay và kiểm tra phòng trống
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const checkInStr = today.toISOString().split('T')[0];
        const checkOutStr = tomorrow.toISOString().split('T')[0];

        console.log(`\n[3] Đang kiểm tra phòng trống cho ngày ${checkInStr} đến ${checkOutStr}...`);
        const detailRes = await fetch(`${API_URL}/homestays/${selectedHomestay.id}?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
        const detailData = await detailRes.json();
        const rooms = detailData.rooms;
        
        const availableRoomTypes = rooms.filter(r => r.available > 0);
        if (availableRoomTypes.length === 0) throw new Error('Không có phòng trống!');
        
        const selectedRoomType = availableRoomTypes[0];
        console.log(`=> Đã tìm thấy phòng trống: ${selectedRoomType.type} (Còn ${selectedRoomType.available} phòng) - Giá: ${selectedRoomType.price}`);

        // 4. Tiến hành đặt phòng
        console.log('\n[4] Tiến hành đặt phòng...');
        const bookingData = {
            hotelId: selectedHomestay.id,
            roomTypeId: selectedRoomType.id,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            totalAmount: selectedRoomType.price
        };

        const bookRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(bookingData)
        });
        const bookData = await bookRes.json();
        if (!bookRes.ok) throw new Error(bookData.error || 'Booking failed');
        
        console.log('=> KẾT QUẢ ĐẶT PHÒNG:', bookData);

        // 5. Kiểm tra lịch sử đặt phòng của User
        console.log('\n[5] Kiểm tra lại lịch sử đặt phòng của user...');
        const historyRes = await fetch(`${API_URL}/users/my-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        
        console.log('=> Lịch sử đặt phòng:');
        console.table(historyData.map(b => ({
            'Mã Đơn': b.id,
            'Homestay': b.homestay,
            'Loại Phòng': b.room,
            'Ngày Đặt': new Date(b.date).toLocaleDateString('vi-VN'),
            'Tổng Tiền': b.total,
            'Trạng Thái': b.status
        })));

        console.log('\n====================================================');
        console.log('✅ CHỨC NĂNG ĐẶT PHÒNG HOẠT ĐỘNG HOÀN HẢO!');
        console.log('====================================================');

    } catch (error) {
        console.error('❌ LỖI TRONG QUÁ TRÌNH CHẠY THỬ NGHIỆM:');
        console.error(error.response ? error.response.data : error.message);
    }
}

runBookingFlow();
