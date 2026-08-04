import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = ({ links, title }) => {
  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-72 border-r border-white/10 bg-[#050816]/70 px-4 py-6 backdrop-blur-2xl md:block">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_70px_rgba(2,8,23,0.4)]">
        {title && (
          <div className="mb-4 flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }} className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">{title} Portal</p>
          </div>
        )}
        <nav className="space-y-1.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-3 py-2.75 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-white shadow-[0_10px_40px_rgba(34,211,238,0.12)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-xl p-2 transition-all duration-300 ${isActive ? 'bg-white/10 text-cyan-300' : 'bg-white/[0.04] text-slate-400 group-hover:text-white'}`}>
                    {Icon && <Icon size={16} />}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
