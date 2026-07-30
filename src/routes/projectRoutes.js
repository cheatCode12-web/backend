const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
	createProject,
	getProjects,
	updateProject,
	deleteProject,
	assignRetailers,
	removeRetailer,
	getAssignedRetailers,
} = require("../controllers/projectController");

const router = express.Router();

// Public route
router.get("/", getProjects);

// Protected route (requires login)
router.post("/", protect, createProject);
// Protected routes (requires login)
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/retailers", protect, assignRetailers);
router.delete("/:projectId/retailers/:retailerId", protect, removeRetailer);
router.get("/:id/retailers", protect, getAssignedRetailers);

module.exports = router; // ✅ THIS IS VERY IMPORTANT
