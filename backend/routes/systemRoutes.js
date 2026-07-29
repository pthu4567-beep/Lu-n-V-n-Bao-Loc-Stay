const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { isAdmin } = require('../middleware/authMiddleware');

// --- USERS (CHỈ ADMIN MỚI ĐƯỢC PHÉP) ---
router.get('/users', isAdmin, systemController.getUsers);
router.put('/users/:id/role', isAdmin, systemController.updateUserRole);
router.put('/users/:id/block', isAdmin, systemController.blockUser);
router.delete('/users/:id', isAdmin, systemController.deleteUser);

// --- REVIEWS ---
router.get('/reviews', systemController.getReviews);
router.put('/reviews/:id/status', systemController.updateReviewStatus);
router.delete('/reviews/:id', systemController.deleteReview);
router.post('/reviews/:id/reply', systemController.replyReview);

// --- CONTACTS ---
router.get('/contacts', systemController.getContacts);
router.put('/contacts/:id/reply', systemController.replyContact);
router.post('/contacts/:id/send-email', systemController.sendReplyEmail);

module.exports = router;
