const { poolPromise } = require('./db.js');

async function check() {
    try {
        const pool = await poolPromise;
        
        // constraints on bookings
        const res = await pool.request().query(`
            SELECT object_name(parent_object_id) as table_name, name, definition 
            FROM sys.check_constraints 
            WHERE object_name(parent_object_id) IN ('bookings', 'payments')
        `);
        console.dir(res.recordset, { depth: null });
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
