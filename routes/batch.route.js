const express = require("express");
const router = express.Router();
const { createBatch } = require("../controllers/batch.controller");
const { protect,authorize } = require("../middlewares/auth.middleware");

router.post("/", protect, authorize("shopkeeper"), createBatch);

module.exports = router;