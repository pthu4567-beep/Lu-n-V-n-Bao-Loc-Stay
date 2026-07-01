const { sql, poolPromise } = require('./db');

async function inspect() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME IN ('users', 'roles', 'hotels', 'bookings', 'booking_details')
            ORDER BY TABLE_NAME, ORDINAL_POSITION;
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
inspect();
