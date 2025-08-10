import React from 'react';

export default function SkeletonLoader({ count = 4 }) {
  return (
    <div className="flex gap-4 overflow-x-auto mt-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse bg-[#1e1e2f] rounded-2xl p-4 w-56 h-32"
        />
      ))}
    </div>
  );
}