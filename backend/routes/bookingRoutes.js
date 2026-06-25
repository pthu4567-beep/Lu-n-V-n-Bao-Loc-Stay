const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route người dùng báo đã thanh toán
router.post('/:id/notify-paid', verifyToken, orderController.notifyPaid);

// Đánh giá đơn đặt phòng (Cho khách hàng)
router.post('/:id/reviews', verifyToken, orderController.submitReview);

// Trả phòng sớm
router.post('/:id/early-checkout', verifyToken, orderController.earlyCheckout);

module.exports = router;
