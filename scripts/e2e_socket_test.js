const { io } = require('../client/node_modules/socket.io-client');
const axios = require('../client/node_modules/axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:5000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadEnv = (filePath) => {
  const envText = fs.readFileSync(filePath, 'utf-8');
  return envText.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = line.split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});
};

const run = async () => {
  console.log('Starting end-to-end socket test...');

  const studentEmail = `student+${Date.now()}@test.local`;
  const workerEmail = `worker+${Date.now()}@test.local`;
  const adminEmail = `admin+${Date.now()}@test.local`;
  const password = 'password123';

  const env = loadEnv(path.resolve(__dirname, '../server/.env'));
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new Error('Missing RAZORPAY_KEY_SECRET in server/.env');
  }

  const ensureAdmin = async () => {
    const adminRes = await axios.post(`${SERVER_URL}/api/auth/signup`, {
      name: 'E2E Admin',
      email: adminEmail,
      password,
      role: 'admin',
    });
    if (!adminRes.data?.success) {
      throw new Error('Admin signup failed: ' + JSON.stringify(adminRes.data));
    }
    return adminRes.data;
  };

  const createAccounts = async () => {
    const admin = await ensureAdmin();
    const adminToken = admin.token;

    const workerRes = await axios.post(
      `${SERVER_URL}/api/auth/create-worker`,
      { name: 'E2E Worker', email: workerEmail, password },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!workerRes.data?.success) {
      throw new Error('Worker creation failed: ' + JSON.stringify(workerRes.data));
    }

    const workerLoginRes = await axios.post(`${SERVER_URL}/api/auth/login`, {
      email: workerEmail,
      password,
      role: 'worker',
    });
    if (!workerLoginRes.data?.success) {
      throw new Error('Worker login failed: ' + JSON.stringify(workerLoginRes.data));
    }

    const studentRes = await axios.post(`${SERVER_URL}/api/auth/signup`, {
      name: 'E2E Student',
      email: studentEmail,
      password,
    });
    if (!studentRes.data?.success) {
      throw new Error('Student signup failed: ' + JSON.stringify(studentRes.data));
    }

    return {
      admin,
      worker: workerRes.data.user,
      student: studentRes.data.user,
      adminToken,
      workerToken: workerLoginRes.data.token,
      studentToken: studentRes.data.token,
    };
  };

  const createFoodItem = async (token) => {
    const res = await axios.post(
      `${SERVER_URL}/api/foods`,
      {
        name: 'E2E Sandwich',
        description: 'Test sandwich',
        category: 'Meals',
        price: 50,
        available: true,
        stock: 10,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.data?.success) {
      throw new Error('Food creation failed: ' + JSON.stringify(res.data));
    }
    return res.data.food;
  };

  const createStudentCart = async (token, foodId) => {
    const res = await axios.post(
      `${SERVER_URL}/api/cart/add`,
      { foodId, quantity: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.data?.success) {
      throw new Error('Add to cart failed: ' + JSON.stringify(res.data));
    }
    return res.data.cart;
  };

  const createOrder = async (token) => {
    const res = await axios.post(
      `${SERVER_URL}/api/orders/checkout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.data?.success) {
      throw new Error('Checkout failed: ' + JSON.stringify(res.data));
    }
    return res.data.order;
  };

  const verifyOrderPaid = async (token, orderId, razorpayOrderId) => {
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|test_payment_id`)
      .digest('hex');

    try {
      const res = await axios.post(
        `${SERVER_URL}/api/payment/verify`,
        {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: 'test_payment_id',
          razorpay_signature: signature,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res;
    } catch (err) {
      if (err.response) {
        return err.response;
      }
      throw err;
    }
  };

  const startSocket = (token) => {
    return io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
    });
  };

  const { adminToken, workerToken, studentToken } = await createAccounts();
  console.log('Accounts ready');

  const foodItem = await createFoodItem(adminToken);
  console.log('Food item created:', foodItem._id || foodItem.id || foodItem);

  await createStudentCart(studentToken, foodItem._id || foodItem.id || foodItem._id);
  console.log('Cart set');

  const studentSocket = startSocket(studentToken);
  const workerSocket = startSocket(workerToken);

  const studentEvents = [];
  const workerEvents = [];

  studentSocket.on('connect', () => console.log('Student socket connected'));
  workerSocket.on('connect', () => console.log('Worker socket connected'));
  studentSocket.on('order:update', (payload) => {
    console.log('Student received order:update', payload.status);
    studentEvents.push(payload);
  });
  workerSocket.on('order:update', (payload) => {
    console.log('Worker received order:update', payload.status);
    workerEvents.push(payload);
  });

  studentSocket.connect();
  workerSocket.connect();

  await sleep(1500);

  const order = await createOrder(studentToken);
  console.log('Order created:', order._id || order.id, 'status', order.status);

  const createPaymentOrderRes = await axios.post(
    `${SERVER_URL}/api/payment/create-order`,
    { orderId: order._id || order.id },
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );
  if (!createPaymentOrderRes.data?.success) {
    throw new Error('Create payment order failed: ' + JSON.stringify(createPaymentOrderRes.data));
  }
  console.log('Payment order created:', createPaymentOrderRes.data);

  const paymentRes = await verifyOrderPaid(
    studentToken,
    order._id || order.id,
    createPaymentOrderRes.data.razorpayOrderId
  );
  if (!paymentRes.data?.success) {
    console.error('Payment verify response body:', JSON.stringify(paymentRes.data, null, 2));
    throw new Error('Payment verification failed: ' + JSON.stringify(paymentRes.data));
  }
  console.log('Payment verification complete');

  await sleep(1500);

  const statusRes = await axios.patch(
    `${SERVER_URL}/api/orders/${order._id || order.id}/status`,
    { status: 'preparing' },
    { headers: { Authorization: `Bearer ${workerToken}` } }
  );
  if (!statusRes.data?.success) {
    throw new Error('Worker failed to advance order: ' + JSON.stringify(statusRes.data));
  }
  console.log('Worker moved order to preparing');

  await sleep(1500);

  console.log('Student events:', studentEvents.map((e) => e.status));
  console.log('Worker events:', workerEvents.map((e) => e.status));

  if (studentEvents.length && workerEvents.length) {
    console.log('E2E socket test passed');
    process.exit(0);
  }

  console.error('E2E socket test failed: missing realtime events');
  process.exit(1);
};

run().catch((err) => {
  console.error('E2E socket test error:', err.message || err);
  process.exit(1);
});
