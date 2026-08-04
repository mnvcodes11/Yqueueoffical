import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiCoffee, FiCpu, FiFileText, FiGrid, FiUserCheck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const links = [
  { to: '/admin/dashboard', label: 'Overview', icon: FiGrid },
  { to: '/admin/dashboard/report', label: 'BI Reports', icon: FiFileText },
  { to: '/admin/dashboard/digital-twin', label: 'Digital Twin', icon: FiCpu },
  { to: '/admin/dashboard/foods', label: 'Manage Food', icon: FiCoffee },
  { to: '/admin/dashboard/workers', label: 'Counter Staff', icon: FiUserCheck },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex">
        <Sidebar links={links} title="Admin" />
        <main className="mx-auto flex-1 w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
