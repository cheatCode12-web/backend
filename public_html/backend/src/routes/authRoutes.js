const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  refreshToken,
  invalidateToken,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/change-password", protect, changePassword);
router.post("/invalidate", protect, invalidateToken);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .patch(protect, updateUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
