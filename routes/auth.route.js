const express =  require('express');
const authController = require("../controllers/auth.controller")
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const { registerSchema , loginSchema } = require('../validation/auth.validation');
const {protect} = require('../middlewares/auth.middleware');


router.post('/register',validate(registerSchema),authController.register);
router.post('/login',validate(loginSchema),authController.login);
router.post('/refresh',authController.refreshToken);
router.post('/logout',protect,authController.logout);
module.exports = router;