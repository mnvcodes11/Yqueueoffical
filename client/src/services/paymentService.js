import api from './api';

export const createPaymentOrder = async (orderId) => {
  const res = await api.post('/payment/create-order', { orderId });
  return res.data;
};

export const verifyPayment = async (payload) => {
  const res = await api.post('/payment/verify', payload);
  return res.data;
};

export const cancelPayment = async (orderId) => {
  const res = await api.post('/payment/cancel', { orderId });
  return res.data;
};

// Loads the Razorpay Checkout script once and reuses it on subsequent calls.
let razorpayScriptPromise = null;
export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};
