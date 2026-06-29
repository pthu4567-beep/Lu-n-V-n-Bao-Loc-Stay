const jwt = require('jsonwebtoken');

const JWT_SECRET = 'baolocstay_secret_key';

async function testApi() {
    try {
        // Tạo token giả cho Admin
        const token = jwt.sign({ id: 1, email: 'admin@gmail.com', roleId: 1 }, JWT_SECRET, { expiresIn: '1h' });

        // Lấy danh sách booking
        const resBookings = await fetch('http://localhost:5000/api/admin/orders/bookings', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const dataBookings = await resBookings.json();
        
        if (dataBookings.data && dataBookings.data.length > 0) {
            const bookingId = dataBookings.data[0].bookingId || dataBookings.data[0].id;
            console.log("Thử xóa booking:", bookingId);
            
            const resDelete = await fetch(`http://localhost:5000/api/admin/orders/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const text = await resDelete.text();
            console.log("Status:", resDelete.status);
            console.log("Raw Response:", text.substring(0, 200));
        } else {
            console.log("Không có booking nào để xóa.", dataBookings);
        }
    } catch (err) {
        console.error("Lỗi:", err.message);
    }
}
testApi();
