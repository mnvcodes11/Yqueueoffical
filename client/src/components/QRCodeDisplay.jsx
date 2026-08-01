import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeDisplay = ({ token, size = 220 }) => {
  if (!token) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-[1.75rem] border border-primary-400/20 bg-gradient-to-br from-white to-slate-100 p-4 shadow-[0_20px_60px_rgba(37,99,235,0.2)]">
        <QRCodeSVG value={token} size={size} level="M" />
      </div>
      <p className="mt-3 max-w-xs text-center text-xs leading-6 text-slate-400">
        Show this at the counter. It is single-use and expires automatically once scanned.
      </p>
    </div>
  );
};

export default QRCodeDisplay;
