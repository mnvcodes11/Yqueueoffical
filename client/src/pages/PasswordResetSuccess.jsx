import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const PasswordResetSuccess = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card p-10 text-center">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Success</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Your password has been updated</h1>
            <p className="mt-3 text-sm text-slate-400">You can now sign in with your new password.</p>
          </div>
          <Link to="/login" className="btn-primary inline-flex px-6 py-3">
            Go to login
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PasswordResetSuccess;
