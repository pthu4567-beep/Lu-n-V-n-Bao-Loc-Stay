require('dotenv').config();
const { sql, poolPromise } = require('./db');

async function test() {
  const pool = await poolPromise;
  try {
    const result = await pool.request()
      .input('bookingId', sql.Int, 21)
      .query(`
        SELECT TOP 1
            b.id as booking_id, b.total_amount, b.booking_status, b.created_at,
            u.email as guest_email, u.phone as guest_phone,
            up.first_name + ' ' + up.last_name as guest_name,
            h.name as homestay_name, h.address as homestay_address,
            ou.email as owner_email, ou.phone as owner_phone,
            oup.first_name + ' ' + oup.last_name as owner_name,
            bd.check_in_datetime, bd.check_out_datetime,
            COALESCE(rt.name, N'Phòng Tiêu Chuẩn') as room_type
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        JOIN hotels h ON b.hotel_id = h.id
        JOIN users ou ON h.owner_id = ou.id
        LEFT JOIN user_profiles oup ON ou.id = oup.user_id
        LEFT JOIN booking_details bd ON b.id = bd.booking_id
        LEFT JOIN rooms r ON bd.room_id = r.id
        LEFT JOIN room_types rt ON r.room_type_id = rt.id OR bd.booking_type = 'room_type'
        WHERE b.id = @bookingId
      `);
    console.log(result.recordset);
  } catch(e) {
    console.error("SQL ERROR:", e);
  }
  process.exit();
}
test();
