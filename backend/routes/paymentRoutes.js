const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../controllers/razorpayController");

// Create Razorpay order
router.post("/create-order", createRazorpayOrder);

// Verify Razorpay payment (optional but recommended)
router.post("/verify-payment", verifyRazorpayPayment);

module.exports = router;
