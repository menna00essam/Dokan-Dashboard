const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/auth.middleware');
const allowedTo = require('../middlewares/allowTo.middleware');
const { upload } = require('../middlewares/upload.middleware');

// Public routes
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);

// Protected routes
router.use(verifyToken);

// User profile
router.get('/profile', userController.getUserProfile);
router.patch('/profile', userController.updateUserProfile);
router.patch('/profile/avatar', upload.single('avatar'), userController.updateAvatar);
router.patch('/profile/password', userController.changePassword);

// User management (Admin only)
router.get('/:id', allowedTo('admin', 'super_admin'), userController.getUserById);
router.patch('/:id', allowedTo('admin', 'super_admin'), userController.updateUser);
router.delete('/:id', allowedTo('super_admin'), userController.deleteUser);
router.post('/:id/restore', allowedTo('super_admin'), userController.restoreUser);

// Activities
router.post('/:id/activities', allowedTo('admin', 'super_admin'), userController.addActivity);
router.get('/:id/activities', allowedTo('admin', 'super_admin'), userController.getActivities);

// Support tickets
router.post('/:id/tickets', allowedTo('admin', 'super_admin', 'support'), userController.createTicket);
router.get('/:id/tickets', allowedTo('admin', 'super_admin', 'support'), userController.getTickets);
router.patch('/:id/tickets/:ticketId', allowedTo('admin', 'super_admin', 'support'), userController.updateTicket);

// Credit management
router.post('/:id/credit', allowedTo('super_admin', 'accountant'), userController.addCredit);
router.get('/:id/credit', allowedTo('admin', 'super_admin', 'accountant'), userController.getCreditHistory);

// Special cases
router.post('/:id/special-cases', allowedTo('admin', 'super_admin'), userController.addSpecialCase);
router.get('/:id/special-cases', allowedTo('admin', 'super_admin'), userController.getSpecialCases);

// Reviews
router.post('/:id/reviews', userController.addReview);
router.get('/:id/reviews', userController.getReviews);

// Incentives
router.post('/:id/incentives', allowedTo('admin', 'super_admin'), userController.addIncentive);
router.get('/:id/incentives', allowedTo('admin', 'super_admin'), userController.getIncentives);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/user.controller');
// const verifyToken = require('../middlewares/auth.middleware');
// const allowedTo = require('../middlewares/allowTo.middleware');
// // const rateLimit = require('express-rate-limit');

// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100, // max 100 requests per windowMs
// // });

// // router.use(limiter);

// router.route('/favourites').get(verifyToken, userController.getFavourites);
// router
//   .route('/')
//   .get(verifyToken, allowedTo('ADMIN'), userController.getAllUsers);

// router
//   .route('/profile/change-password')
//   .put(verifyToken, allowedTo('USER'), userController.changePassword);
// router
//   .route('/profile')
//   .get(verifyToken, allowedTo('USER'), userController.getProfile);
// router.route('/profile/change-img').put(verifyToken, userController.changeIMG);
// router
//   .route('/:userId')
//   .get(verifyToken, allowedTo('ADMIN'), userController.getUser)
//   .patch(verifyToken, allowedTo('ADMIN'), userController.editUser)
//   .delete(verifyToken, allowedTo('ADMIN'), userController.deleteUser);
// router
//   .route('/toggle-favourites')
//   .post(verifyToken, userController.toggleFavourite);

// module.exports = router;