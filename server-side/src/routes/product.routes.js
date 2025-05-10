const express = require('express');
const productController = require('../controllers/product.controller');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');

router.route('/')
  .get(productController.getAllProducts)
  .post(
    (req, res, next) => {
      req.folderName = 'products';
      next();
    },
    upload.fields([]), // استخدم upload.fields([]) هنا
    productController.createProduct
  );
router.route('/search').get(productController.getSearchProducts);
// router.route('/min-price').get(productController.getMinEffectivePrice); // commented out because the handler is not in the controller
// router.route('/max-price').get(productController.getMaxEffectivePrice); // commented out because the handler is not in the controller

router.route('/comparison/:product_id')
  .get(productController.getProductForComparison);
router.route('/:product_id')
  .get(productController.getProductById)
  .put(
    (req, res, next) => {
      req.folderName = 'products';
      next();
    },
    upload.fields([]), // استخدم upload.fields([]) هنا
    productController.updateProduct
  )
  .delete(productController.softDeleteProduct);
router.route('/:product_id/colors').put(productController.updateProductColors);
router.route('/:product_id/stock').get(productController.getProductStock);
// router.post(
//   '/upload-images',
//   (req, res, next) => {
//     req.folderName = 'products';
//     next();
//   },
//   upload.array('images', 10),
//   productController.uploadProductImages
// ); //remove this route

module.exports = router;
