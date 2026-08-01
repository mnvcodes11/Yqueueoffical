import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4 border-white/10 border-t-primary-400`}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
