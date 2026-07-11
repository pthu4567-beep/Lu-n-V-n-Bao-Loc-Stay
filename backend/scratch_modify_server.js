const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Import multer
if (!content.includes("const multer = require('multer');")) {
    content = content.replace(
        "const express = require('express');",
        "const express = require('express');\nconst multer = require('multer');\nconst path = require('path');\nconst fs = require('fs');"
    );
}

// 2. Setup multer and upload static dir
if (!content.includes("app.use('/uploads'")) {
    const multerConfig = `
const uploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
`;
    content = content.replace("app.use(express.json());", "app.use(express.json());\n" + multerConfig);
}

// 3. Add POST /api/users/avatar
if (!content.includes("app.post('/api/users/avatar'")) {
    const avatarApi = `
// ==========================================
// API Thay đổi Avatar
// ==========================================
app.post('/api/users/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file nào được tải lên.' });
        }
        const avatarUrl = \`/uploads/avatars/\${req.file.filename}\`;
        
        const pool = await poolPromise;
        const request = pool.request();
        request.input('userId', sql.Int, req.user.id);
        request.input('avatarUrl', sql.VarChar, avatarUrl);
        await request.query('UPDATE users SET avatar = @avatarUrl WHERE id = @userId');
        
        const userRes = await pool.request().input('userId', sql.Int, req.user.id).query('SELECT id, role_id, email, phone, full_name, hotel_id, avatar FROM users WHERE id = @userId');
        const updatedUser = userRes.recordset[0];
        
        res.json({
            success: true,
            message: 'Cập nhật avatar thành công!',
            user: { id: updatedUser.id, email: updatedUser.email, roleId: updatedUser.role_id, phone: updatedUser.phone, full_name: updatedUser.full_name, hotelId: updatedUser.hotel_id, avatar: updatedUser.avatar }
        });
    } catch (err) {
        console.error('LỖI UPLOAD AVATAR:', err.message);
        res.status(500).json({ error: 'Lỗi server khi cập nhật avatar: ' + err.message });
    }
});
`;
    content = content.replace("// ==========================================\n// API Quên mật khẩu", avatarApi + "\n// ==========================================\n// API Quên mật khẩu");
}

// 4. Update login select query
content = content.replace(
    "SELECT id, role_id, email, password_hash, phone, full_name, hotel_id FROM users WHERE email = @email",
    "SELECT id, role_id, email, password_hash, phone, full_name, hotel_id, avatar FROM users WHERE email = @email"
);
content = content.replace(
    "user: { id: user.id, email: user.email, roleId: user.role_id, phone: user.phone, full_name: user.full_name, hotelId: user.hotel_id }",
    "user: { id: user.id, email: user.email, roleId: user.role_id, phone: user.phone, full_name: user.full_name, hotelId: user.hotel_id, avatar: user.avatar }"
);

// 5. Update profile select query
content = content.replace(
    "SELECT id, email, role_id, phone, full_name FROM users WHERE id = @userId",
    "SELECT id, email, role_id, phone, full_name, avatar FROM users WHERE id = @userId"
);
content = content.replace(
    "user: { id: updatedUser.id, email: updatedUser.email, roleId: updatedUser.role_id, phone: updatedUser.phone, full_name: updatedUser.full_name }",
    "user: { id: updatedUser.id, email: updatedUser.email, roleId: updatedUser.role_id, phone: updatedUser.phone, full_name: updatedUser.full_name, avatar: updatedUser.avatar }"
);

fs.writeFileSync('server.js', content, 'utf8');
console.log('Backend updated successfully.');
