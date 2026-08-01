import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ links, title }) => {
  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-72 border-r border-white/10 bg-slate-950/70 px-4 py-6 backdrop-blur-xl md:block">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        {title && (
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{title} Portal</p>
          </div>
        )}
        <nav className="space-y-1.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-200 shadow-lg shadow-primary-500/10'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {Icon && <Icon size={18} />}
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
