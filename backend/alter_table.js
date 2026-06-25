const { poolPromise } = require('./db');

async function alterTable() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            -- Thêm cột email
            IF NOT EXISTS(SELECT * FROM sys.columns 
                          WHERE Name = N'email' 
                          AND Object_ID = Object_ID(N'contact_messages'))
            BEGIN
                ALTER TABLE contact_messages ADD email NVARCHAR(255);
                PRINT 'Added email column';
            END
            ELSE
            BEGIN
                PRINT 'email column already exists';
            END

            -- Thêm cột phone
            IF NOT EXISTS(SELECT * FROM sys.columns 
                          WHERE Name = N'phone' 
                          AND Object_ID = Object_ID(N'contact_messages'))
            BEGIN
                ALTER TABLE contact_messages ADD phone NVARCHAR(20);
                PRINT 'Added phone column';
            END
            ELSE
            BEGIN
                PRINT 'phone column already exists';
            END

            -- Thêm cột status với mặc định 'pending'
            IF NOT EXISTS(SELECT * FROM sys.columns 
                          WHERE Name = N'status' 
                          AND Object_ID = Object_ID(N'contact_messages'))
            BEGIN
                ALTER TABLE contact_messages ADD status NVARCHAR(50) NOT NULL CONSTRAINT DF_contact_messages_status DEFAULT 'pending';
                PRINT 'Added status column';
            END
            ELSE
            BEGIN
                PRINT 'status column already exists';
            END
        `);
        console.log("Table altered successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Lỗi thay đổi cấu trúc bảng:", err);
        process.exit(1);
    }
}

alterTable();
