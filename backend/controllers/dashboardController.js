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

        // Query 4: Khách sạn yêu thích nhất (doanh thu cao nhất)
        let topHotelQuery = `
            SELECT TOP 1
                h.id, h.name, 
                SUM(b.total_amount) as totalRevenue, 
                COUNT(b.id) as totalBookings
            FROM hotels h
            JOIN bookings b ON h.id = b.hotel_id
            WHERE b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
        `;

        const request1 = pool.request();
        const request2 = pool.request();
        const request3 = pool.request();
        const request4 = pool.request();

        // Xử lý phân quyền Owner (roleId = 2)
        if (roleId === 2) {
            occQuery += ` WHERE h.owner_id = @userId`;
            bookQuery += ` WHERE h.owner_id = @userId`;
            revQuery += ` AND h.owner_id = @userId`;
            topHotelQuery += ` AND h.owner_id = @userId`;

            request1.input('userId', sql.Int, userId);
            request2.input('userId', sql.Int, userId);
            request3.input('userId', sql.Int, userId);
            request4.input('userId', sql.Int, userId);
        } else if (roleId === 4) {
            const hotelId = req.user.hotelId;
            occQuery += ` WHERE h.id = @hotelId`;
            bookQuery += ` WHERE h.id = @hotelId`;
            revQuery += ` AND h.id = @hotelId`;
            topHotelQuery += ` AND h.id = @hotelId`;
            request1.input('hotelId', sql.Int, hotelId);
            request2.input('hotelId', sql.Int, hotelId);
            request3.input('hotelId', sql.Int, hotelId);
            request4.input('hotelId', sql.Int, hotelId);
        }
        
        topHotelQuery += `
            GROUP BY h.id, h.name
            ORDER BY totalRevenue DESC
        `;

        const [occRes, bookRes, revRes, topHotelRes] = await Promise.all([
            request1.query(occQuery),
            request2.query(bookQuery),
            request3.query(revQuery),
            request4.query(topHotelQuery)
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

        let topHotel = null;
        let topRoomType = null;
        if (topHotelRes.recordset.length > 0) {
            topHotel = topHotelRes.recordset[0];
            
            // Tìm loại phòng được đặt nhiều nhất của khách sạn này
            const request5 = pool.request();
            request5.input('topHotelId', sql.Int, topHotel.id);
            const topRoomTypeQuery = `
                SELECT TOP 1
                    rt.name, COUNT(bd.id) as totalBookings
                FROM booking_details bd
                JOIN bookings b ON bd.booking_id = b.id
                JOIN rooms r ON bd.room_id = r.id
                JOIN room_types rt ON r.room_type_id = rt.id
                WHERE rt.hotel_id = @topHotelId
                  AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
                GROUP BY rt.name
                ORDER BY totalBookings DESC
            `;
            const topRoomTypeRes = await request5.query(topRoomTypeQuery);
            if (topRoomTypeRes.recordset.length > 0) {
                topRoomType = topRoomTypeRes.recordset[0];
            }
        }

        res.json({
            success: true,
            data: {
                occupancyRate,
                successRate,
                currentRevenue,
                growthPercent,
                weekRevenue,
                yearRevenue,
                topHotel,
                topRoomType
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
            } else if (roleId === 4) {
                query += ` AND b.hotel_id = @hotelId`;
            }
            query += ` GROUP BY CAST(b.created_at AS DATE)`;

            const request = pool.request();
            if (roleId === 2) {
                request.input('userId', sql.Int, userId);
            } else if (roleId === 4) {
                request.input('hotelId', sql.Int, req.user.hotelId);
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

        if (type === 'month') {
            const filterMonth = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
            const filterYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
            
            let query = `
                SELECT 
                    (DATEPART(day, b.created_at) - 1) / 7 + 1 as weekOfMonth,
                    SUM(b.total_amount) as total
                FROM bookings b
            `;
            if (roleId === 2) {
                query += ` JOIN hotels h ON b.hotel_id = h.id`;
            }
            query += ` 
                WHERE MONTH(b.created_at) = @filterMonth AND YEAR(b.created_at) = @filterYear
                AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
            `;
            if (roleId === 2) {
                query += ` AND h.owner_id = @userId`;
            } else if (roleId === 4) {
                query += ` AND b.hotel_id = @hotelId`;
            }
            query += ` GROUP BY (DATEPART(day, b.created_at) - 1) / 7 + 1`;

            const request = pool.request();
            request.input('filterMonth', sql.Int, filterMonth);
            request.input('filterYear', sql.Int, filterYear);
            if (roleId === 2) {
                request.input('userId', sql.Int, userId);
            } else if (roleId === 4) {
                request.input('hotelId', sql.Int, req.user.hotelId);
            }

            const result = await request.query(query);
            const dbData = result.recordset;

            const chartData = [
                { name: 'Tuần 1', total: 0 },
                { name: 'Tuần 2', total: 0 },
                { name: 'Tuần 3', total: 0 },
                { name: 'Tuần 4', total: 0 },
                { name: 'Tuần 5', total: 0 }
            ];

            dbData.forEach(row => {
                const weekIndex = row.weekOfMonth - 1;
                if (weekIndex >= 0 && weekIndex < 5) {
                    chartData[weekIndex].total += Number(row.total) || 0;
                }
            });

            if (chartData[4].total === 0) chartData.pop();

            return res.json({ success: true, data: chartData });
        }

        // Mặc định: Biểu đồ năm (12 tháng)
        const filterYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
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
            WHERE YEAR(b.created_at) = @filterYear
            AND b.booking_status IN ('confirmed', 'checked_in', 'checked_out', 'completed')
        `;

        if (roleId === 2) {
            query += ` AND h.owner_id = @userId`;
        } else if (roleId === 4) {
            query += ` AND b.hotel_id = @hotelId`;
        }

        query += ` GROUP BY MONTH(b.created_at)`;

        const request = pool.request();
        request.input('filterYear', sql.Int, filterYear);
        if (roleId === 2) {
            request.input('userId', sql.Int, userId);
        } else if (roleId === 4) {
            request.input('hotelId', sql.Int, req.user.hotelId);
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
