const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  createRetailer,
  getAllRetailers,
  getRetailerProfile,
  updateRetailer,
  deleteRetailer,
  updateRetailerMetrics
} = require("../controllers/retailerController");

const router = express.Router();

// Apply protection to all routes
//router.use(protect);

router
  .route('/')
  .get(getAllRetailers)
  .post(createRetailer);

router
  .route('/:id')
  .get(getRetailerProfile)
  .patch(updateRetailer)
  .delete(deleteRetailer);

router.patch('/:id/metrics', updateRetailerMetrics);

module.exports = router;
