const { poolPromise } = require('./db.js');

async function run() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'refund_amount' AND Object_ID = Object_ID(N'bookings'))
            BEGIN
                ALTER TABLE bookings ADD refund_amount DECIMAL(18,2) CONSTRAINT DF_bookings_refund_amount DEFAULT 0;
                PRINT 'Added refund_amount';
            END
            ELSE
            BEGIN
                PRINT 'Already exists';
            END
        `);
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
