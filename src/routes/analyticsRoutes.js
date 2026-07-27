const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { getDashboardStats, getRetailerPerformance, getProjectStats } = require("../controllers/analyticsController");

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Dashboard overview stats
router.get('/dashboard', getDashboardStats);

// Retailer performance metrics
router.get('/retailer-performance', getRetailerPerformance);

// Project statistics
router.get('/project-stats', getProjectStats);

module.exports = router;