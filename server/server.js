const dotenv = require('dotenv');
const dotenvOptions = { override: process.env.NODE_ENV !== 'production' };
dotenv.config(dotenvOptions);
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocket } = require('./socket');
const { seedFoods } = require('./utils/foodSeed');
const { securityHeaders, apiLimiter, sanitizeMiddleware } = require('./middleware/security');
const { publicLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
app.set('trust proxy', 1);
const normalizeOrigins = (origins) => {
  const normalized = new Set();
  origins.forEach((origin) => {
    const trimmed = String(origin).trim();
    if (!trimmed) return;
    try {
      const url = new URL(trimmed);
      normalized.add(url.origin);
      if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1';
        normalized.add(url.origin);
      }
    } catch (err) {
      normalized.add(trimmed);
    }
  });
  return Array.from(normalized);
};
const allowedOrigins = normalizeOrigins(
  process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://yqueue.vercel.app']
);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
};

app.use(securityHeaders);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(...sanitizeMiddleware);
app.use(apiLimiter);

// Health check
app.get('/api/health', publicLimiter, (req, res) => {
  res.status(200).json({ success: true, message: 'YQueue API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // order placement, checkout, kitchen queue, status transitions
app.use('/api/payment', paymentRoutes); // Razorpay create-order + signature verification
app.use('/api/qr', qrRoutes); // secure single-use pickup QR issuance + worker scan verification
app.use('/api/analytics', analyticsRoutes); // admin analytics dashboard

app.use(notFound);
app.use(errorHandler);

// Wrap in a plain http.Server so Socket.IO (real-time queue/order updates)
// can attach to the same port instead of running a second server.
const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedFoods();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
