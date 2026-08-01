import React from 'react';
import { FiMail, FiUser, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Profile overview</h1>
      </div>
      <div className="card mt-6 space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-200"><FiUser size={18} /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Name</p>
            <p className="mt-1 font-medium text-white">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-200"><FiMail size={18} /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</p>
            <p className="mt-1 font-medium text-white">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-200"><FiShield size={18} /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Role</p>
            <p className="mt-1 font-medium capitalize text-white">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
