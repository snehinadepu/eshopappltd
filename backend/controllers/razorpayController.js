const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Amount is required and should be a valid number" });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Convert rupees to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(201).json(order);
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// Verify Razorpay payment signature
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment details" });
    }

    console.log("ORDER ID:", razorpay_order_id);
    console.log("PAYMENT ID:", razorpay_payment_id);
    console.log("SIGNATURE:", razorpay_signature);

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    console.log("GENERATED SIGNATURE:", generated_signature);

    if (generated_signature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Razorpay verify payment error:", error);
    return res.status(500).json({ message: "Error verifying payment" });
  }
};
