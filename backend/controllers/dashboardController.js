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
                SUM(CASE WHEN MONTH(b.created_at) = MONTH(DATEADD(month, -1, GETDATE())) AND YEAR(b.created_at) = YEAR(DATEADD(month, -1, GETDATE())) THEN b.total_amount ELSE 0 END) as lastMonthRevenue,
                SUM(CASE WHEN DATEDIFF(week, b.created_at, GETDATE()) = 0 THEN b.total_amount ELSE 0 END) as weekRevenue,
                SUM(CASE WHEN YEAR(b.created_at) = YEAR(GETDATE()) THEN b.total_amount ELSE 0 END) as yearRevenue
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
        const weekRevenue = revRes.recordset[0].weekRevenue || 0;
        const yearRevenue = revRes.recordset[0].yearRevenue || 0;
        
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
                growthPercent,
                weekRevenue,
                yearRevenue
            }
        });
    } catch (err) {
        console.error('LỖI API getDashboardStats:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// API: Lấy dữ liệu biểu đồ doanh thu (tuần hoặc 12 tháng)
exports.getRevenueChart = async (req, res) => {
    try {
        const pool = await poolPromise;
        const roleId = req.user.roleId;
        const userId = req.user.id;
        const { type } = req.query; // 'week' hoặc 'year'

        if (type === 'week') {
            let query = `
                SELECT 
                    CAST(b.created_at AS DATE) as date,
                    SUM(b.total_amount) as total
                FROM bookings b
            `;
            if (roleId === 2) {
                query += ` JOIN hotels h ON b.hotel_id = h.id`;
            }
            query += ` 
                WHERE DATEDIFF(week, b.created_at, GETDATE()) = 0
                AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
            `;
            if (roleId === 2) {
                query += ` AND h.owner_id = @userId`;
            }
            query += ` GROUP BY CAST(b.created_at AS DATE)`;

            const request = pool.request();
            if (roleId === 2) {
                request.input('userId', sql.Int, userId);
            }

            const result = await request.query(query);
            const dbData = result.recordset;

            const chartData = [];
            const curr = new Date();
            // Lấy ngày đầu tuần (Thứ 2)
            const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
            const firstDay = new Date(curr.setDate(first));
            
            const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(firstDay);
                dayDate.setDate(firstDay.getDate() + i);
                
                const found = dbData.find(row => {
                    const rowDate = new Date(row.date);
                    return rowDate.getFullYear() === dayDate.getFullYear() && 
                           rowDate.getMonth() === dayDate.getMonth() && 
                           rowDate.getDate() === dayDate.getDate();
                });

                chartData.push({
                    name: daysOfWeek[i],
                    total: found ? Number(found.total) : 0
                });
            }

            return res.json({ success: true, data: chartData });
        }

        // Mặc định: Biểu đồ năm (12 tháng)
        let query = `
            SELECT 
                MONTH(b.created_at) as month,
                SUM(b.total_amount) as total
            FROM bookings b
        `;

        if (roleId === 2) {
            query += ` JOIN hotels h ON b.hotel_id = h.id`;
        }

        query += ` 
            WHERE YEAR(b.created_at) = YEAR(GETDATE())
            AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
        `;

        if (roleId === 2) {
            query += ` AND h.owner_id = @userId`;
        }

        query += ` GROUP BY MONTH(b.created_at)`;

        const request = pool.request();
        if (roleId === 2) {
            request.input('userId', sql.Int, userId);
        }

        const result = await request.query(query);
        const dbData = result.recordset; 

        const chartData = [];
        for (let i = 1; i <= 12; i++) {
            chartData.push({
                name: `Tháng ${i}`,
                total: 0
            });
        }

        dbData.forEach(row => {
            const monthIndex = row.month - 1; 
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
