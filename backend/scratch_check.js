const { sql, poolPromise } = require('./db');

async function checkRoom20() {
    try {
        const pool = await poolPromise;
        const resRoom = await pool.request().query("SELECT * FROM rooms WHERE id = 20 OR room_number = 'P201'");
        console.log("Room:", resRoom.recordset);

        const resBooking = await pool.request().query(`
            SELECT b.id, b.booking_status, bd.check_in_datetime, bd.check_out_datetime, bd.room_id
            FROM bookings b
            JOIN booking_details bd ON b.id = bd.booking_id
            WHERE bd.room_id = 20 OR bd.room_id = (SELECT TOP 1 id FROM rooms WHERE room_number = 'P201')
        `);
        console.log("Bookings:", resBooking.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkRoom20();
