const express =  require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const {protect,authorize} = require('../middlewares/auth.middleware');

router.post("/", protect, authorize("shopkeeper"), productController.createProduct);

// get all products
router.get("/", protect, productController.getAllProducts);

// get single product
router.get("/:id", protect, productController.getProductById);

// update product
router.put("/:id", protect, authorize("shopkeeper"), productController.updateProduct);

// delete product
router.delete("/:id", protect, authorize("shopkeeper"), productController.deleteProduct);
// router.patch('/:id/stock',protect,authorize('shopkeeper'),productController.updateStock);

module.exports = router;