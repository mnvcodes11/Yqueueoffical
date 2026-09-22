import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/Navbar';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If an account exists, a reset code has been sent.');
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reset code. Please try again later.');
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
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Account recovery</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Forgot your password?</h1>
            <p className="mt-3 text-sm text-slate-400">Enter your registered email to receive a secure verification code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@college.edu"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending code...' : 'Send verification code'}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-400">
            Remembered your password?{' '}
            <Link to="/login" className="text-cyan-300 font-semibold hover:text-white">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
