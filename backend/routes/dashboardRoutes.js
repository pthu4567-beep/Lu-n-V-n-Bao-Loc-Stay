const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/revenue-chart', dashboardController.getRevenueChart);

module.exports = router;
