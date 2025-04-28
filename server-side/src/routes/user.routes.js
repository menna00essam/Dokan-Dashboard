// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  avatarUpload,
  authenticateUser,
  adminAccess,
  superAdminAccess,
  supportAccess,
  accountantAccess,
} = require("../middlewares/user.middleware");

// ===== Public Routes =====
router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);

// ===== Protected Routes (Require Authentication) =====
router.use(authenticateUser);

// ===== User Profile =====
router.get("/profile", userController.getUserProfile);
router.patch("/profile", userController.updateUserProfile);
router.patch("/profile/avatar", avatarUpload, userController.updateAvatar);
router.patch("/profile/password", userController.changePassword);

// ===== User Management (Admin Access) =====
router.get("/:id", adminAccess, userController.getUserById);
router.patch("/:id", adminAccess, userController.updateUser);
router.delete("/:id", superAdminAccess, userController.deleteUser);
router.post("/:id/restore", superAdminAccess, userController.restoreUser);

// ===== Activities =====
router.post("/:id/activities", adminAccess, userController.addActivity);
router.get("/:id/activities", adminAccess, userController.getActivities);

// ===== Support Tickets =====
router.post("/:id/tickets", supportAccess, userController.createTicket);
router.get("/:id/tickets", supportAccess, userController.getTickets);
router.patch("/:id/tickets/:ticketId", supportAccess, userController.updateTicket);

// ===== Credit Management =====
router.post("/:id/credit", accountantAccess, userController.addCredit);
router.get("/:id/credit", adminAccess, userController.getCreditHistory);

// ===== Special Cases =====
router.post("/:id/special-cases", adminAccess, userController.addSpecialCase);
router.get("/:id/special-cases", adminAccess, userController.getSpecialCases);

// ===== Reviews =====
router.post("/:id/reviews", userController.addReview);
router.get("/:id/reviews", userController.getReviews);

// ===== Incentives =====
router.post("/:id/incentives", adminAccess, userController.addIncentive);
router.get("/:id/incentives", adminAccess, userController.getIncentives);

// ===== Tags Management =====
router.post("/:id/tags", adminAccess, userController.assignUserTags);
router.delete("/:id/tags", adminAccess, userController.removeUserTags);

// ===== Segments Management =====
router.post("/:id/segments", adminAccess, userController.assignSegment);
router.delete("/:id/segments/:segmentName", adminAccess, userController.removeSegment);

// ===== User Queries (Filter) =====
router.get("/by-tag/:tag", adminAccess, userController.getUsersByTag);
router.get("/by-segment/:segment", adminAccess, userController.getUsersBySegment);

// ===== Tier Management =====
router.patch("/:id/tier", adminAccess, userController.updateCustomerTier);

// ===== User Status Management =====
router.get("/pending", adminAccess, userController.getPendingUsers);
router.get("/approved", adminAccess, userController.getApprovedUsers);
router.get("/denied", adminAccess, userController.getDeniedUsers);
router.patch("/:id/approve", adminAccess, userController.approveUser);
router.patch("/:id/deny", adminAccess, userController.denyUser);

// ===== Admin Request Management =====
router.patch("/:id/request-admin", adminAccess, userController.handleAdminRequest);
router.get("/admin-requests", adminAccess, userController.getAdminRequests);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.patch('/reset-password/:token', userController.resetPassword);

module.exports = router;
