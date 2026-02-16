const express =  require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate.middleware');
const {protect,authorize} = require('../middlewares/auth.middleware');

router.post('/create-order',protect,authorize('customer'),orderController.createOrder);
router.get('/my-orders',protect,authorize('customer'),orderController.getMyOrders);
router.get('/all',protect,authorize('shopkeeper'),orderController.getAllOrders);
router.get('/:id',protect,orderController.getOrderById);
router.put('/:id/status',protect,authorize('shopkeeper'),orderController.updateOrderStatus);
module.exports = router;