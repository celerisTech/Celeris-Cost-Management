"use client";

import React, { useState, useRef, useCallback } from "react";

/**
 * Generic Virtualized Table Component for 60fps rendering of large datasets.
 */
export default function VirtualTable({
  data = [],
  rowHeight = 48,
  containerHeight = 500,
  renderHeader,
  renderRow,
  keyExtractor,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalRows = data.length;
  const totalHeight = totalRows * rowHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const endIndex = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + 3
  );

  const visibleRows = data.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {renderHeader && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-semibold text-gray-700 dark:text-gray-200 text-sm">
          {renderHeader()}
        </div>
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: containerHeight, overflowY: "auto", position: "relative" }}
        className="custom-scrollbar"
      >
        <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
            }}
          >
            {visibleRows.map((item, idx) => {
              const actualIndex = startIndex + idx;
              const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
              return (
                <div key={key} style={{ height: rowHeight }} className="flex items-center">
                  {renderRow(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
