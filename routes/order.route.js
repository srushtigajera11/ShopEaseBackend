const express =  require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {protect,authorize} = require('../middlewares/auth.middleware');

// create order (customer)
router.post("/", protect, authorize("customer"), orderController.createOrder);

// customer orders
router.get("/my", protect, authorize("customer"), orderController.getMyOrders);

// shopkeeper orders
router.get("/", protect, authorize("shopkeeper"), orderController.getAllOrders);

// get single order
router.get("/:id", protect, orderController.getOrderById);

// update order status
router.put("/:id/status", protect, authorize("shopkeeper"), orderController.updateOrderStatus);

// cancel order
router.delete("/:id", protect, authorize("customer"), orderController.cancelOrder);

module.exports = router;