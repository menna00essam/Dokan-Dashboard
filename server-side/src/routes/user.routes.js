const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowedTo = require("../middlewares/allowTo.middleware");
const { avatarUpload } = require("../middlewares/user.middleware");

// ===== Public Routes =====
// Accessible by: anyone (no authentication)
router.post("/", userController.createUser);

// ===== Protected Routes =====
router.use(verifyToken);

// ===== General User Profile =====
// Accessible by: logged-in user
router.get("/profile", userController.getUserProfile);
router.patch("/profile", userController.updateUserProfile);
router.patch("/profile/password", userController.changePassword);
router.patch("/profile/avatar", avatarUpload, userController.updateAvatar);

// ===== User Management =====
// Accessible by: super_admin
router.get("/", allowedTo("super_admin","admin"), userController.getAllUsers);
router.get("/pending", allowedTo("super_admin"), userController.getPendingUsers);
router.get("/approved", allowedTo("super_admin"), userController.getApprovedUsers);
router.get("/denied", allowedTo("super_admin"), userController.getDeniedUsers);
router.patch("/:id/approve", allowedTo("super_admin"), userController.approveUser);
router.patch("/:id/deny", allowedTo("super_admin"), userController.denyUser);


// ===== Bulk Actions =====
// Accessible by: admin, super_admin
router.post("/bulk-delete", allowedTo("admin", "super_admin"), userController.bulkDeleteUsers);
router.patch('/bulk-status', allowedTo('admin', 'super_admin'),userController.bulkUpdateUserStatus);
router.post("/bulk-assign-tags", allowedTo("admin","super_admin"), userController.bulkAssignTags);
router.patch('/bulk-update-tier', allowedTo('admin', 'super_admin'), userController.bulkAssignTier);

// Accessible by: admin, super_admin
router.get("/:id", allowedTo("admin", "super_admin"), userController.getUserById);
router.patch("/:id", allowedTo("admin", "super_admin"), userController.updateUser);

// Accessible by: super_admin only
router.delete("/:id", allowedTo("admin","super_admin"), userController.deleteUser);
router.post("/:id/restore", allowedTo("super_admin"), userController.restoreUser);


// ===== Activities =====
// Accessible by: admin, super_admin
router.post("/:id/activities", allowedTo("admin", "super_admin"), userController.addActivity);
router.get("/:id/activities", allowedTo("admin", "super_admin"), userController.getActivities);

// ===== Support Tickets =====
// Accessible by: support
router.post("/:id/tickets", allowedTo("support"), userController.createTicket);
router.get("/:id/tickets", allowedTo("support"), userController.getTickets);
router.patch("/:id/tickets/:ticketId", allowedTo("support"), userController.updateTicket);

// ===== Credit Management =====
// Add: accountant only
router.post("/:id/credit", allowedTo("accountant"), userController.addCredit);
// View: admin, super_admin
router.get("/:id/credit", allowedTo("admin", "super_admin"), userController.getCreditHistory);

// ===== Special Cases =====
// Accessible by: admin, super_admin
router.post("/:id/special-cases", allowedTo("admin", "super_admin"), userController.addSpecialCase);
router.get("/:id/special-cases", allowedTo("admin", "super_admin"), userController.getSpecialCases);

// ===== Reviews =====
// Accessible by: any authenticated user
router.post("/:id/reviews", userController.addReview);
router.get("/:id/reviews", userController.getReviews);

// ===== Incentives =====
// Accessible by: admin, super_admin
router.post("/:id/incentives", allowedTo("admin", "super_admin"), userController.addIncentive);
router.get("/:id/incentives", allowedTo("admin", "super_admin"), userController.getIncentives);

// ===== Tags =====
// Accessible by: admin, super_admin
router.post("/:id/tags", allowedTo("admin", "super_admin"), userController.assignUserTags);
router.delete("/:id/tags", allowedTo("admin", "super_admin"), userController.removeUserTags);

// ===== Segments =====
// Accessible by: admin, super_admin
router.post("/:id/segments", allowedTo("admin", "super_admin"), userController.assignSegment);
router.delete("/:id/segments/:segmentName", allowedTo("admin", "super_admin"), userController.removeSegment);
router.get("/by-tag/:tag", allowedTo("admin", "super_admin"), userController.getUsersByTag);
router.get("/by-segment/:segment", allowedTo("admin", "super_admin"), userController.getUsersBySegment);

// ===== Tier Management =====
// Accessible by: admin, super_admin
router.patch("/:id/tier", allowedTo("admin", "super_admin"), userController.updateCustomerTier);

// ===== Admin Request Management =====
// Accessible by: admin, super_admin
router.patch("/:id/request-admin", allowedTo("super_admin"), userController.handleAdminRequest);
router.get("/admin-requests", allowedTo("super_admin"), userController.getAdminRequests);


// router.get('/:id/orders',allowedTo('user', 'admin', 'super_admin'),userController.getUserOrders);

module.exports = router;
