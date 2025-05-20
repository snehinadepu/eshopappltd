const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance with keys from env variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET);


// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  // Validate amount
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Amount is required and should be a valid number" });
  }

  try {
    // Options for order creation
    const options = {
      amount: amount * 100, // Convert rupees to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`, // unique receipt id
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);
    console.log("Create order amount:", amount);


    // Send order info back to client
    return res.json(order);
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// Verify Razorpay payment signature
exports.verifyRazorpayPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing required payment details" });
  }

  // Create HMAC SHA256 signature from order_id and payment_id
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  // Compare generated signature with received signature
  if (generated_signature === razorpay_signature) {
    return res.json({ success: true, message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }
};
