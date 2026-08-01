import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiLogOut, FiUser, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 shadow-lg shadow-primary-600/20">
            <FiZap size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">YQueue</span>
        </Link>

        <div className="flex items-center gap-3">
          {user?.role === 'student' && (
            <>
              <Link to="/dashboard/menu" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                Menu
              </Link>
              <Link to="/dashboard/orders" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                Orders
              </Link>
              <Link to="/dashboard/cart" className="relative rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                <FiShoppingCart size={20} />
              </Link>
            </>
          )}

          {user?.role === 'worker' && (
            <Link to="/worker/dashboard" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
              Kitchen Queue
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200 sm:flex">
                <FiUser size={14} /> {user.name}
              </span>
              <button onClick={handleLogout} className="btn-secondary flex items-center gap-1 text-sm">
                <FiLogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm">Student Login</Link>
              <Link to="/admin/login" className="btn-primary text-sm">Admin Login</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
