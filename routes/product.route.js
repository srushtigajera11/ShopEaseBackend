const express =  require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const {protect,authorize} = require('../middlewares/auth.middleware');

router.post('/create',protect,authorize('shopkeeper'),productController.createProduct);
router.get('/all',protect,productController.getAllProducts);
router.get('/:id',protect,productController.getProductById);
router.put('/:id',protect,authorize('shopkeeper'),productController.updateProduct);
router.delete('/:id',protect,authorize('shopkeeper'),productController.deleteProduct);
router.patch('/:id/stock',protect,authorize('shopkeeper'),productController.updateStock);

module.exports = router;