const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route lấy thông tin 1 đơn đặt phòng
router.get('/:id', verifyToken, orderController.getBookingById);

// Route người dùng báo đã thanh toán
router.post('/:id/notify-paid', verifyToken, orderController.notifyPaid);

// Hủy đơn đặt phòng khi đang chờ thanh toán
router.post('/:id/cancel-pending', verifyToken, orderController.cancelPendingBooking);

// Đánh giá đơn đặt phòng (Cho khách hàng)
router.post('/:id/reviews', verifyToken, orderController.submitReview);

// Trả phòng sớm
router.post('/:id/early-checkout', verifyToken, orderController.earlyCheckout);

module.exports = router;

