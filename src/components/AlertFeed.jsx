// /src/components/AlertFeed.jsx
import React from 'react';

export default function AlertFeed({ title = '🔔 Live Alerts', items = [] }) {
  return (
    <div className="mt-6 text-white">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.length ? (
          items.map((a, idx) => (
            <div
              key={a.id ?? idx}
              className="bg-[#1e1e2f] p-3 rounded-xl text-sm border border-transparent hover:border-[#2a2a3f] transition-colors"
            >
              <div className="leading-snug">{a.text}</div>
              <div className="text-xs text-gray-400 mt-1">{a.time}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No flow yet.</div>
        )}
      </div>
    </div>
  );
}
