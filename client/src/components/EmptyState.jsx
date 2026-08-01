import React from 'react';

const EmptyState = ({ title = 'Nothing here yet', message = '', icon: Icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/70 px-6 py-16 text-center">
      {Icon && <Icon className="mb-4 text-slate-400" size={56} />}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
