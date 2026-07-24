"use client";

import React from "react";

export function SkeletonBox({ className = "", height = "20px", width = "100%" }) {
  return (
    <div
      style={{ height, width }}
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 space-y-3 shadow-sm">
      <SkeletonBox height="24px" width="60%" />
      <SkeletonBox height="16px" width="90%" />
      <SkeletonBox height="16px" width="40%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 space-y-4">
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} height="20px" width={`${100 / cols}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} height="16px" width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
