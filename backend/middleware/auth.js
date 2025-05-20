const ErrorResponse = require('../utils/errorResponse');

const jwt = require('jsonwebtoken');
const User = require("../models/user");



// check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {

  const { token } = req.cookies;

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('You must log in.', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('You must log in.', 401));
  }

}



exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    // or role === 0, depends on your schema, check accordingly
    return next(new ErrorResponse("Access denied, you must be an admin", 403));
  }
  next();
};




