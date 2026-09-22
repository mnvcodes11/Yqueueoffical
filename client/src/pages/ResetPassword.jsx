import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/Navbar';

const passwordStrength = (password) => {
  const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce((acc, test) => (test.test(password) ? acc + 1 : acc), 0);
  if (password.length >= 12 && score === 4) return { score: 4, label: 'Excellent', color: 'text-emerald-300' };
  if (password.length >= 10 && score >= 3) return { score: 3, label: 'Strong', color: 'text-cyan-300' };
  if (password.length >= 8 && score >= 2) return { score: 2, label: 'Fair', color: 'text-amber-300' };
  return { score: 1, label: 'Weak', color: 'text-rose-400' };
};

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const passwordsMatch = form.password && form.password === form.confirmPassword;

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!passwordsMatch) {
      return toast.error('Passwords must match.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, password: form.password });
      toast.success('Password updated. Please log in with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset your password.');
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
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Reset password</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Create a secure new password</h1>
            <p className="mt-3 text-sm text-slate-400">Your new password should be strong and unique for student account protection.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">New password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Confirm password</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-medium text-slate-100">Password strength: <span className={strength.color}>{strength.label}</span></p>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>• At least 8 characters</li>
                <li>• Uppercase letter</li>
                <li>• Lowercase letter</li>
                <li>• Number</li>
                <li>• Special character</li>
              </ul>
            </div>

            <button type="submit" disabled={loading || !passwordsMatch} className="btn-primary w-full py-3">
              {loading ? 'Updating password...' : 'Reset password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
