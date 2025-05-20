const express = require("express");
const router = express.Router();

const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/razorpayController");
const { isAuthenticated } = require("../middleware/auth");

router.post("/create-order", isAuthenticated, createRazorpayOrder);
router.post("/verify-payment", isAuthenticated, verifyRazorpayPayment);

module.exports = router;
