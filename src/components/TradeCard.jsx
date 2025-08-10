import React from 'react';

export default function TradeCard({ ticker, score, expiry, strike, iv, bid, ask, tags = [] }) {
  const s = parseFloat(score || 0);
  const scoreColor = s >= 9 ? 'bg-green-600' : s >= 8 ? 'bg-yellow-600' : 'bg-gray-600';
  return (
    <div className="rounded-2xl bg-[#1e1e2f] p-4 w-56 text-white flex-shrink-0 hover:scale-105 transition-transform">
      <div className="flex justify-between items-center">
        <div className="font-semibold text-lg">{ticker}</div>
        <div className={`px-2 py-1 rounded-xl text-sm font-bold ${scoreColor}`}>{score || '-'}</div>
      </div>
      <div className="text-xs mt-1 opacity-80">Exp: {expiry || '-'}</div>
      <div className="text-sm mt-1">Strike: ${strike}</div>
      <div className="text-xs mt-2">IV: {iv ?? '-'} | Bid/Ask: {bid ?? '-'} / {ask ?? '-'}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.map((t, i) => (
          <span key={i} className="text-[10px] bg-[#2a2a3f] px-2 py-1 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  );
}