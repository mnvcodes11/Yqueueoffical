import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/Navbar';

const CODE_LENGTH = 6;
const TIMER_SECONDS = 600;

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [values, setValues] = useState(Array(CODE_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const otp = useMemo(() => values.join(''), [values]);
  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
  }, [seconds]);

  const handleChange = (index, value) => {
    if (!/^[0-9]{0,1}$/.test(value)) return;
    const next = [...values];
    next[index] = value;
    setValues(next);

    if (value && index < CODE_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !values[index] && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
    if (event.key === 'Paste' || event.key === 'v' || event.key === 'V') {
      // handled in paste event
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').trim().slice(0, CODE_LENGTH);
    if (!/^[0-9]+$/.test(pasted)) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((char, index) => {
      next[index] = char;
    });
    setValues(next);
    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    setActiveIndex(nextIndex);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      return toast.error('Please enter your email to continue.');
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      toast.success(response.data.message || 'OTP verified.');
      navigate('/reset-password', { state: { email, resetToken: response.data.resetToken } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('A new code has been sent if that account exists.');
      setSeconds(TIMER_SECONDS);
      setValues(Array(CODE_LENGTH).fill(''));
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Verification</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Enter your 6-digit code</h1>
            <p className="mt-3 text-sm text-slate-400">A secure one-time password was sent to your email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">Verification code</label>
              <div className="grid grid-cols-6 gap-3">
                {values.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    className="input-field text-center text-xl font-semibold tracking-[0.36em]"
                  />
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || otp.length < CODE_LENGTH} className="btn-primary w-full py-3">
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-400">
            <span>Time remaining: <strong className="text-white">{formattedTime}</strong></span>
            <button type="button" disabled={seconds > 0 || loading} onClick={handleResend} className="text-cyan-300 font-semibold disabled:text-slate-500">
              Resend code
            </button>
            <span className="text-slate-500">If the code does not arrive, check your spam folder or enter your email again on the previous page.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyOtp;
