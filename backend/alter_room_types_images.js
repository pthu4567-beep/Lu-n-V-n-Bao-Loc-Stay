const { sql, poolPromise } = require('./db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log("Connected to DB, running migration to add image_url and amenities_images_text to room_types...");

        // Thêm cột image_url
        try {
            await pool.request().query(`ALTER TABLE room_types ADD image_url VARCHAR(255);`);
            console.log("Added column image_url to room_types");
        } catch (e) {
            console.log("Column image_url might already exist.");
        }

        // Thêm cột amenities_images_text
        try {
            await pool.request().query(`ALTER TABLE room_types ADD amenities_images_text NVARCHAR(MAX);`);
            console.log("Added column amenities_images_text to room_types");
        } catch (e) {
            console.log("Column amenities_images_text might already exist.");
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
