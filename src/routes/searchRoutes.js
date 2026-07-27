const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { globalSearch } = require("../controllers/searchController");

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Global search endpoint
router.get('/', globalSearch);

module.exports = router;