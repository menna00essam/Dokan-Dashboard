const verifyToken = require("./auth.middleware");
const allowedTo = require("./allowTo.middleware");
const upload = require("./upload.middleware");
const AppError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

const adminRole = 'admin';
const superAdminRole = 'super_admin';
const supportRole = 'support';
const accountantRole = 'accountant';

// Middleware for avatar upload
const avatarUpload = (req, res, next) => {
  req.folderName = 'avatars'; 
  upload.single('avatar')(req, res, next);
};

// Middleware for authentication
const authenticateUser = verifyToken;

// Middleware for role-based access control
const adminAccess = allowedTo(adminRole, superAdminRole);
const superAdminAccess = allowedTo(superAdminRole);
const supportAccess = allowedTo(adminRole, superAdminRole, supportRole);
const accountantAccess = allowedTo(superAdminRole, accountantRole);

// Middleware function for role checking
const allowTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You are not allowed to access this route, unauthorized user",
          403,
          httpStatusText.ERROR
        )
      );
    }
    next();
  };
};

module.exports = {
  avatarUpload,
  authenticateUser,
  adminAccess,
  superAdminAccess,
  supportAccess,
  accountantAccess,
  adminRole,
  superAdminRole,
  supportRole,
  accountantRole,
  allowTo
};