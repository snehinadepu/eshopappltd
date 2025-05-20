const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Keep server alive settings
app.keepAliveTimeout = (60 * 1000) + 1000;
app.headersTimeout = (60 * 1000) + 2000;

// Import routes
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoute");
const paymentRoutes = require("./routes/paymentRoutes"); // ✅ Make sure this exists

const errorHandler = require("./middleware/error");

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error:", err));

// Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(cors());

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Routes middleware
app.use("/api", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api/payment", paymentRoutes); // ✅ Correct Razorpay route

// Static assets in production
__dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send("API is running...");
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
const port = process.env.PORT || 8000;
const portfinder = require('portfinder');

portfinder.getPortPromise()
  .then((port) => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('No available ports found:', err);
  });
