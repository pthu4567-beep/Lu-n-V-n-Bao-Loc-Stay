const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAdmin, verifyToken } = require('../middleware/authMiddleware'); // Import isAdmin and verifyToken

// --- BOOKINGS ---
router.get('/bookings', orderController.getBookings);
router.put('/bookings/:id/status', orderController.updateBookingStatus);
router.put('/bookings/:id/checkin', orderController.checkInBooking);
router.delete('/bookings/:id', orderController.deleteBooking);

// --- PAYMENTS (Admin only) ---
// Admin restriction should be applied to this route specifically
router.put('/payments/:bookingId/verify', isAdmin, orderController.verifyPayment);
router.put('/bookings/:id/pay-remaining', orderController.payRemaining);

// --- CẬP NHẬT TRẢ PHÒNG SỚM (Admin only) ---
router.put('/bookings/:id/approve-refund', isAdmin, orderController.approveRefund);

module.exports = router;
