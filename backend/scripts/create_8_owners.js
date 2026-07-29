const { sql, poolPromise } = require('./db');
const bcrypt = require('bcryptjs');

const ownerEmails = [
  'tropicana@baolocstay.com',
  'doidep@baolocstay.com',
  'moctra@baolocstay.com',
  'jetaime@baolocstay.com',
  'sandals@baolocstay.com',
  'ceedee@baolocstay.com',
  'tulip@baolocstay.com',
  'dambri@baolocstay.com'
];

async function createOwners() {
    try {
        const pool = await poolPromise;
        
        // Find existing hotels
        const hotelsResult = await pool.request().query("SELECT id, name FROM hotels ORDER BY id ASC");
        const hotels = hotelsResult.recordset;

        if (hotels.length === 0) {
            console.log("No hotels found. Make sure to run seed script first.");
            process.exit(0);
        }

        const ownerHash = await bcrypt.hash('owner123', 10);

        for (let i = 0; i < hotels.length; i++) {
            const hotel = hotels[i];
            const email = ownerEmails[i] || `owner${hotel.id}@baolocstay.com`;
            
            // Check if user exists
            const existingUser = await pool.request().input('email', sql.VarChar, email).query("SELECT id FROM users WHERE email = @email");
            let ownerId;
            
            if (existingUser.recordset.length > 0) {
                ownerId = existingUser.recordset[0].id;
                console.log(`Owner ${email} already exists with ID ${ownerId}`);
            } else {
                const phone = `088888880${i+1}`;
                const userResult = await pool.request()
                    .input('email', sql.VarChar, email)
                    .input('pwd', sql.VarChar, ownerHash)
                    .input('phone', sql.VarChar, phone)
                    .query(`
                        INSERT INTO users (role_id, email, password_hash, phone, created_at)
                        OUTPUT INSERTED.id
                        VALUES (2, @email, @pwd, @phone, GETDATE());
                    `);
                ownerId = userResult.recordset[0].id;
                console.log(`Created new owner account ${email} for hotel ${hotel.name} with ID ${ownerId}`);
                
                await pool.request().input('uid', sql.Int, ownerId).input('email', sql.VarChar, email).query(`
                  INSERT INTO user_profiles (user_id, avatar_url, address)
                  VALUES (@uid, 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + @email, N'Bảo Lộc, Lâm Đồng');
                `);
            }
            
            // Assign hotel to owner
            await pool.request()
                .input('ownerId', sql.Int, ownerId)
                .input('hotelId', sql.Int, hotel.id)
                .query("UPDATE hotels SET owner_id = @ownerId WHERE id = @hotelId");
                
            console.log(`Assigned hotel '${hotel.name}' to owner '${email}'\n`);
        }
        
        console.log("Successfully created and assigned all 8 owner accounts.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createOwners();
