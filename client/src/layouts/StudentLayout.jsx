import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiGrid, FiCoffee, FiShoppingCart, FiUser, FiPackage } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const links = [
  { to: '/dashboard', label: 'Overview', icon: FiGrid },
  { to: '/dashboard/menu', label: 'Menu', icon: FiCoffee },
  { to: '/dashboard/cart', label: 'Cart', icon: FiShoppingCart },
  { to: '/dashboard/orders', label: 'My Orders', icon: FiPackage },
  { to: '/dashboard/profile', label: 'Profile', icon: FiUser },
];

const StudentLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex">
        <Sidebar links={links} title="Student" />
        <main className="mx-auto flex-1 w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
