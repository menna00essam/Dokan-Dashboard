// const express = require('express');
// const { upload } = require('../middlewares/upload.middleware')
// const {
//   updatedImages,
//   getImages,
//   cloudinaryWebhookHandler,
// } = require('../controllers/gallery.controller');

// const router = express.Router();
// // const rateLimit = require('express-rate-limit');

// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100, // max 100 requests per windowMs
// // });

// // router.use(limiter);
// router.post("/:folder", upload.single("image"), uploadController.uploadImage);
// router.get('/updated-images', updatedImages);
// router.get('/images', getImages);

// // router.post("/cloudinary-webhook", cloudinaryWebhookHandler);

// module.exports = router;
///////////////////////////////////////////////////////////////////////////////////////////////////

// const express = require("express");
// const upload = require("../middlewares/upload.middleware");
// const {
//   updatedImages,
//   getImages,
//   uploadImage,
//   cloudinaryWebhookHandler,
// } = require("../controllers/gallery.controller");

// const router = express.Router();

// // router.post("/:folder", upload.single("image"), uploadImage); // استخدم الـ Controller هنا
// router.post("/:folder", (req, res, next) => {
//   console.log("Reached POST /:folder route - Before upload middleware");
//   next();
// }, upload.single("image"), (req, res, next) => {
//   console.log("Reached POST /:folder route - After upload middleware");
//   next();
// }, uploadImage);
// router.get("/updated-images", updatedImages);
// router.get("/images", getImages);

// // router.post("/cloudinary-webhook", cloudinaryWebhookHandler);

// module.exports = router;
/////////////////////////////////
const express = require("express");
const upload = require("../middlewares/upload.middleware");
const {
  updatedImages,
  getImages,
  uploadImage,
  cloudinaryWebhookHandler,
  getImageById,
} = require("../controllers/gallery.controller");


const router = express.Router();
// Asmaa
router.get('/images/:imageId', getImageById);

// استخدم upload.array عشان تستقبل كذا ملف تحت اسم "image"
router.post("/:folder", upload.array("image", 10), uploadImage); // مثال بحد أقصى 10 ملفات

router.get("/updated-images", updatedImages);
router.get("/images", getImages);


// router.post("/cloudinary-webhook", cloudinaryWebhookHandler);

module.exports = router;
