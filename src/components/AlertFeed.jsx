import React from 'react';

export default function AlertFeed({ items = [] }) {
  return (
    <div className="mt-6 text-white">
      <h2 className="text-white font-semibold mb-2">🔔 Flow Highlights</h2>
      <div className="flex flex-col gap-2">
        {items.length ? items.map((a) => (
          <div key={a.id} className="bg-[#1e1e2f] p-3 rounded-xl text-sm">
            <div>{a.text}</div>
            <div className="text-xs text-gray-400">{a.time}</div>
          </div>
        )) : <div className="text-sm text-gray-400">No flow yet.</div>}
      </div>
    </div>
  );
}