const { sql, poolPromise } = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;

        // Query 1: Tỷ lệ lấp đầy (Occupancy)
        let occQuery = `
            SELECT 
                COUNT(*) as totalRooms,
                SUM(CASE WHEN r.status != 'available' THEN 1 ELSE 0 END) as occupiedRooms
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.id
            JOIN hotels h ON rt.hotel_id = h.id
        `;

        // Query 2: Tỷ lệ thành công (Booking Success)
        let bookQuery = `
            SELECT 
                COUNT(*) as totalBookings,
                SUM(CASE WHEN b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed') THEN 1 ELSE 0 END) as successBookings
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
        `;

        // Query 3: Doanh thu & Tăng trưởng
        let revQuery = `
            SELECT 
                SUM(CASE WHEN MONTH(b.created_at) = MONTH(GETDATE()) AND YEAR(b.created_at) = YEAR(GETDATE()) THEN b.total_amount ELSE 0 END) as currentRevenue,
                SUM(CASE WHEN MONTH(b.created_at) = MONTH(DATEADD(month, -1, GETDATE())) AND YEAR(b.created_at) = YEAR(DATEADD(month, -1, GETDATE())) THEN b.total_amount ELSE 0 END) as lastMonthRevenue
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.id
            WHERE b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
        `;

        const request1 = pool.request();
        const request2 = pool.request();
        const request3 = pool.request();

        // Xử lý phân quyền Owner (roleId = 2)
        if (roleId === 2) {
            occQuery += ` WHERE h.owner_id = @userId`;
            bookQuery += ` WHERE h.owner_id = @userId`;
            revQuery += ` AND h.owner_id = @userId`;

            request1.input('userId', sql.Int, userId);
            request2.input('userId', sql.Int, userId);
            request3.input('userId', sql.Int, userId);
        }

        const [occRes, bookRes, revRes] = await Promise.all([
            request1.query(occQuery),
            request2.query(bookQuery),
            request3.query(revQuery)
        ]);

        const totalRooms = occRes.recordset[0].totalRooms || 0;
        const occupiedRooms = occRes.recordset[0].occupiedRooms || 0;
        const occupancyRate = totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

        const totalBookings = bookRes.recordset[0].totalBookings || 0;
        const successBookings = bookRes.recordset[0].successBookings || 0;
        const successRate = totalBookings === 0 ? 0 : Math.round((successBookings / totalBookings) * 100);

        const currentRevenue = revRes.recordset[0].currentRevenue || 0;
        const lastMonthRevenue = revRes.recordset[0].lastMonthRevenue || 0;
        
        let growthPercent = 0;
        if (lastMonthRevenue === 0) {
            growthPercent = currentRevenue > 0 ? 100 : 0;
        } else {
            growthPercent = Math.round(((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
        }

        res.json({
            success: true,
            data: {
                occupancyRate,
                successRate,
                currentRevenue,
                growthPercent
            }
        });
    } catch (err) {
        console.error('LỖI API getDashboardStats:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// API: Lấy dữ liệu biểu đồ doanh thu 12 tháng
exports.getRevenueChart = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;

        // Câu lệnh SQL lấy tổng doanh thu theo từng tháng trong năm hiện tại
        let query = `
            SELECT 
                MONTH(b.created_at) as month,
                SUM(b.total_amount) as total
            FROM bookings b
        `;

        // Nếu là Owner (roleId = 2), cần JOIN với bảng hotels để lọc theo owner_id
        if (roleId === 2) {
            query += ` JOIN hotels h ON b.hotel_id = h.id`;
        }

        // Chỉ tính các đơn đã xác nhận/hoàn thành trong năm nay
        query += ` 
            WHERE YEAR(b.created_at) = YEAR(GETDATE())
            AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
        `;

        // Nếu là Owner, thêm điều kiện lọc
        if (roleId === 2) {
            query += ` AND h.owner_id = @userId`;
        }

        // Nhóm theo tháng
        query += ` GROUP BY MONTH(b.created_at)`;

        const request = pool.request();
        if (roleId === 2) {
            request.input('userId', sql.Int, userId);
        }

        const result = await request.query(query);
        const dbData = result.recordset; // Trả về mảng [{ month: 1, total: 500000 }, ...]

        // Tạo sẵn mảng 12 tháng với tổng doanh thu ban đầu là 0
        const chartData = [];
        for (let i = 1; i <= 12; i++) {
            chartData.push({
                name: `Tháng ${i}`,
                total: 0
            });
        }

        // Đổ dữ liệu từ SQL vào mảng 12 tháng
        dbData.forEach(row => {
            const monthIndex = row.month - 1; // Vì mảng bắt đầu từ 0
            if (monthIndex >= 0 && monthIndex < 12) {
                chartData[monthIndex].total = Number(row.total) || 0;
            }
        });

        res.json({ success: true, data: chartData });
    } catch (err) {
        console.error('LỖI API getRevenueChart:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
