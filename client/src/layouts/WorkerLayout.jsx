import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiGrid, FiCamera } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const links = [
  { to: '/worker/dashboard', label: 'Kitchen Queue', icon: FiGrid },
  { to: '/worker/dashboard/scan', label: 'Scan QR', icon: FiCamera },
];

const WorkerLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex">
        <Sidebar links={links} title="Worker" />
        <main className="mx-auto flex-1 w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkerLayout;
