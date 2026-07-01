const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'baolocstay_secret_key';

// Middleware xác thực Token JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Truy cập bị từ chối! Không tìm thấy token xác thực.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Lưu thông tin user vào request (id, email, roleId)
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
}

// Middleware xác thực quyền Admin (role_id = 1)
function isAdmin(req, res, next) {
    if (!req.user || req.user.roleId !== 1) {
        return res.status(403).json({ error: 'Quyền truy cập bị từ chối! Yêu cầu quyền quản trị viên (Admin).' });
    }
    next();
}

// Middleware xác thực quyền Chủ Homestay (role_id = 2) hoặc Admin (role_id = 1) hoặc Staff (role_id = 4)
function isOwner(req, res, next) {
    if (!req.user || (req.user.roleId !== 2 && req.user.roleId !== 1 && req.user.roleId !== 4)) {
        return res.status(403).json({ error: 'Quyền truy cập bị từ chối! Yêu cầu quyền quản lý.' });
    }
    next();
}

module.exports = {
    verifyToken,
    isAdmin,
    isOwner
};
