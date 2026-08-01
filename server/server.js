const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const qrRoutes = require('./routes/qrRoutes');

connectDB();

const app = express();
// Core middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'YQueue API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // order placement, checkout, kitchen queue, status transitions
app.use('/api/payment', paymentRoutes); // Razorpay create-order + signature verification
app.use('/api/qr', qrRoutes); // secure single-use pickup QR issuance + worker scan verification

// ---------------------------------------------------------------------
// Still to come in a later phase:
// app.use('/api/analytics', analyticsRoutes);     // admin analytics dashboard
// ---------------------------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// Wrap in a plain http.Server so Socket.IO (real-time queue/order updates)
// can attach to the same port instead of running a second server.
const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT);
