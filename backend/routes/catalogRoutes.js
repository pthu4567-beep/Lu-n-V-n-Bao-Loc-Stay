const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// Middleware từ server.js (Giả sử bạn sẽ truyền vào hoặc lấy từ module auth)
// Tuy nhiên vì ở đây chưa có module auth riêng, ta nên require nó từ file chứa logic xác thực.
// Nhưng vì server.js chứa verifyToken, ta có thể refactor verifyToken ra `middlewares/authMiddleware.js`
// Hoặc đơn giản là truyền middleware khi mount router ở server.js:
// app.use('/api/admin/catalog', verifyToken, isOwner, catalogRoutes);
// Do đó, file routes này chỉ định tuyến.

// --- HOTELS ---
router.get('/hotels', catalogController.getHotels);
router.post('/hotels', catalogController.createHotel);
router.put('/hotels/:id', catalogController.updateHotel);
router.delete('/hotels/:id', catalogController.deleteHotel);

// --- ROOM TYPES ---
router.get('/room-types', catalogController.getRoomTypes);
router.post('/room-types', catalogController.createRoomType);
router.put('/room-types/:id', catalogController.updateRoomType);
router.delete('/room-types/:id', catalogController.deleteRoomType);

// --- ROOMS ---
router.get('/rooms', catalogController.getRooms);
router.post('/rooms', catalogController.createRoom);
router.put('/rooms/:id/status', catalogController.updateRoomStatus);
router.put('/rooms/:id', catalogController.updateRoom);
router.delete('/rooms/:id', catalogController.deleteRoom);

// --- PROMOTIONS ---
router.get('/promotions', catalogController.getPromotions);
router.post('/promotions', catalogController.createPromotion);
router.put('/promotions/:id', catalogController.updatePromotion);
router.delete('/promotions/:id', catalogController.deletePromotion);

module.exports = router;
