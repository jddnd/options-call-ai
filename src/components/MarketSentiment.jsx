import React from 'react';

export default function MarketSentiment() {
  return (
    <div className="bg-[#1e1e2f] rounded-2xl p-4 text-white mt-4">
      <div className="font-bold text-md mb-2">Market Sentiment</div>
      <div className="flex justify-between text-sm">
        <div>
          <div>SPY: <span className="text-green-400 font-semibold">▲</span></div>
          <div>VIX: <span className="text-blue-400">▼</span></div>
        </div>
        <div className="text-green-400">📈</div>
      </div>
    </div>
  );
}