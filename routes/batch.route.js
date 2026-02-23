const express = require("express");
const router = express.Router();
const { createBatch,deleteBatch,getAllBatches} = require("../controllers/batch.controller");
const { protect,authorize } = require("../middlewares/auth.middleware");

router.post("/", protect, authorize("shopkeeper"), createBatch);

// get all batches
router.get("/", protect, authorize("shopkeeper"), getAllBatches);

// get single batch
// router.get("/:id", protect, authorize("shopkeeper"), getBatchById);

// soft delete batch
router.delete("/:id", protect, authorize("shopkeeper"), deleteBatch);
module.exports = router;