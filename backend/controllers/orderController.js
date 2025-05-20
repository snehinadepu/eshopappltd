const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

// Display all orders with pagination
exports.allOrders = async (req, res, next) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await Order.find({}).estimatedDocumentCount();

    const orders = await Order.find()
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    res.status(200).json({
      success: true,
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Display my orders
exports.ordersme = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({
      success: true,
      orders
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Display single order
exports.singleOrder = async (req, res, next) => {
  try {
    const singleOrder = await Order.findById(req.params.id);
    res.status(200).json({
      success: true,
      singleOrder
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Delete order (Admin)
exports.deleteOrderAdmin = async (req, res, next) => {
  try {
    await Order.findByIdAndRemove(req.params.id);
    res.status(200).json({
      success: true,
      message: "Order deleted"
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Mark order as paid (Admin)
exports.updateOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      order: updatedOrder,
      message: "Order marked as paid"
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Mark order as delivered (Admin)
exports.deliverOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    const deliveredOrder = await order.save();

    res.status(200).json({
      success: true,
      order: deliveredOrder,
      message: "Order delivered"
    });
    next();
  } catch (error) {
    return next(new ErrorResponse('Server error', 500));
  }
};

// Create new order
exports.createOrder = async (req, res, next) => {
  try {
    if (req.body.orderItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    } else {
      const order = new Order({
        orderItems: req.body.orderItems,
        shippingAddress: req.body.shippingAddress,
        itemsPrice: req.body.itemsPrice,
        shippingPrice: req.body.shippingPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        user: req.user._id
      });

      const newOrder = await order.save();

      // Decrease stock
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countStock -= item.quantity;
          await product.save();
        }
      }

      res.status(201).json({
        message: "New order created",
        newOrder
      });
    }
  } catch (err) {
    next(err);
  }
};

// Admin Order Summary
exports.orderSumaryAdmin = async (req, res, next) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          nbOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);

    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          nbUsers: { $sum: 1 },
        },
      },
    ]);

    const daylyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      orders,
      users,
      daylyOrders
    });
    next();
  } catch (error) {
    return next(error);
  }
};

// ✅ Razorpay: Mark order as paid after verifying signature
exports.markOrderPaid = async (req, res, next) => {
  const { orderId, paymentId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentId,
      status: "COMPLETED",
      method: "Razorpay",
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Payment marked as successful",
      order: updatedOrder
    });
  } catch (error) {
    return next(new ErrorResponse("Payment update failed", 500));
  }
};
