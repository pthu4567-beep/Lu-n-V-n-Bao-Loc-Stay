const { sql, poolPromise } = require('./db');

async function fixBookings() {
    try {
        const pool = await poolPromise;
        
        // 1. Find bookings without booking_details
        const missingDetailsRes = await pool.request().query(`
            SELECT b.id, b.hotel_id, b.total_amount, b.created_at, b.booking_status
            FROM bookings b
            LEFT JOIN booking_details bd ON b.id = bd.booking_id
            WHERE bd.id IS NULL
        `);
        
        const bookings = missingDetailsRes.recordset;
        console.log(`Found ${bookings.length} bookings without details.`);
        
        for (let b of bookings) {
            // Find a room for this hotel
            const roomRes = await pool.request()
                .input('hId', sql.Int, b.hotel_id)
                .query(`
                    SELECT TOP 1 r.id as room_id 
                    FROM rooms r
                    JOIN room_types rt ON r.room_type_id = rt.id
                    WHERE rt.hotel_id = @hId
                `);
            
            let roomId = null;
            if (roomRes.recordset.length > 0) {
                roomId = roomRes.recordset[0].room_id;
            } else {
                console.log(`No room found for hotel_id ${b.hotel_id}`);
                continue;
            }

            // Calculate dates
            const created = new Date(b.created_at);
            const checkIn = new Date(created);
            checkIn.setDate(checkIn.getDate() + 1); // check-in next day
            checkIn.setHours(14, 0, 0, 0);
            
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkOut.getDate() + 2); // stay 2 nights
            checkOut.setHours(12, 0, 0, 0);

            // Insert booking_details
            await pool.request()
                .input('bId', sql.Int, b.id)
                .input('rId', sql.Int, roomId)
                .input('cin', sql.DateTime, checkIn)
                .input('cout', sql.DateTime, checkOut)
                .input('price', sql.Decimal(18, 2), b.total_amount)
                .query(`
                    INSERT INTO booking_details (booking_id, room_id, booking_type, check_in_datetime, check_out_datetime, price)
                    VALUES (@bId, @rId, 'standard', @cin, @cout, @price)
                `);
            
            // 2. Add payment record if missing
            const payRes = await pool.request()
                .input('bId', sql.Int, b.id)
                .query(`SELECT id FROM payments WHERE booking_id = @bId`);
                
            if (payRes.recordset.length === 0) {
                let paymentMethod = 'bank_transfer';
                if (b.id % 2 === 0) paymentMethod = 'credit_card';
                
                let paymentStatus = 'pending';
                if (['confirmed', 'checked_in', 'checked_out', 'completed'].includes(b.booking_status)) {
                    paymentStatus = 'paid';
                }
                
                await pool.request()
                    .input('bId', sql.Int, b.id)
                    .input('amount', sql.Decimal(18, 2), b.total_amount)
                    .input('method', sql.VarChar, paymentMethod)
                    .input('status', sql.VarChar, paymentStatus)
                    .query(`
                        INSERT INTO payments (booking_id, amount, payment_method, payment_status)
                        VALUES (@bId, @amount, @method, @status)
                    `);
            }
            
            console.log(`Fixed booking ${b.id}`);
        }
        
        console.log("Done fixing bookings!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixBookings();
