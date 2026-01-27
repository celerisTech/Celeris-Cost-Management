"use client";

import React from "react";
import { Menu, X  } from "lucide-react";

const MobileToggle = ({ isSidebarOpen, onToggle, notifications = [], pendingCount = 0 }) => {
  return (
    <button
      type="button"
      aria-label="Toggle menu"
      onClick={onToggle}
      className="md:hidden fixed top-3 right-5 z-50 p-2 rounded-full bg-white text-gray-700 shadow border border-gray-200 hover:bg-gray-50"
    >
      {isSidebarOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <span className="relative">
          <Menu className="h-5 w-5" />
          {notifications?.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="absolute -top-4 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-yellow-500 text-white text-[10px] leading-4 text-center">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </span>

      )}
    </button>
  );
};

export default MobileToggle;
