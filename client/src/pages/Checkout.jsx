import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCcw, FiCreditCard, FiShield } from 'react-icons/fi';
import * as orderService from '../services/orderService';
import * as paymentService from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getOrderById(orderId);
        setOrder(res.order);
      } catch (err) {
        toast.error('Could not load this order.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Check your connection.');
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = await paymentService.createPaymentOrder(orderId);

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'YQueue',
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            const res = await paymentService.verifyPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment confirmed! Your order is in the queue.');
            navigate(`/dashboard/orders/${res.order._id}`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed. Contact support if money was deducted.');
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPaying(false);
      });

      rzp.on('payment.cancel', async () => {
        try {
          await paymentService.cancelPayment(orderId);
        } catch {
          // ignore cancellation cleanup errors
        }
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment.');
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order) return null;

  if (order.status !== 'pending_payment') {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-slate-300">This order is already {order.status.replace('_', ' ')}.</p>
        <Link to={`/dashboard/orders/${order._id}`} className="btn-primary mt-4 inline-block">
          View Order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard/cart" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <FiArrowLeft size={16} /> Back to cart
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Secure checkout</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Complete your order</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiShield size={16} className="text-primary-300" /> Payment is verified server-side before pickup is released.
          </div>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.food} className="flex items-center justify-between text-sm text-slate-300">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-lg font-semibold text-white">Total</span>
            <span className="text-xl font-semibold text-primary-200">₹{order.totalPrice}</span>
          </div>
        </div>

        <button onClick={handlePay} disabled={paying} className="btn-primary mt-6 flex w-full items-center justify-center gap-2">
          <FiCreditCard size={16} />
          {paying ? 'Opening payment window...' : `Pay ₹${order.totalPrice} with Razorpay`}
        </button>
        <button
          onClick={async () => {
            try {
              await paymentService.cancelPayment(orderId);
              toast.success('Payment cancelled. You can try again when ready.');
              navigate('/dashboard/orders');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Could not cancel payment.');
            }
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <FiRefreshCcw size={14} /> Cancel and retry later
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">Test mode — no real money is charged.</p>
      </div>
    </div>
  );
};

export default Checkout;
