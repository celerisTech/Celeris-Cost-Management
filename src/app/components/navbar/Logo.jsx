"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/useAuthScreenStore";

const Logo = ({ companyName, companyLogo, companyInitials, isSidebarOpen }) => {
  const { user } = useAuthStore();

  const allowedRoles = ["ROL000001", "ROL000002"];
  const canGoDashboard = allowedRoles.includes(user?.CM_Role_ID);

  // 🌍 Detect user's preferred locale (fallback to 'en' if unavailable)
  const userLocale = typeof window !== "undefined"
    ? navigator.language || navigator.languages[0] || "en"
    : "en";

  // 📅 Format day & date using the user's locale
  const today = new Date();
  const day = today.toLocaleDateString(userLocale, { weekday: "long" });
  const date = today.toLocaleDateString(userLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const LogoContent = (
    <>
      <div
        className={
          isSidebarOpen
            ? "h-15 w-15 flex items-center justify-center"
            : "h-8 w-10 flex items-center justify-center"
        }
      >
        <img
          src={companyLogo || "/logo.png"}
          className={
            isSidebarOpen
              ? "h-15 w-12 object-cover"
              : "h-12 w-10 object-cover"
          }
          alt={companyName || user?.CM_Company_Name || "Company Logo"}
        />
      </div>

      {isSidebarOpen && (
        <div className="ml-2 flex flex-col">
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent">
            {companyName || user?.CM_Company_Name}
          </span>

          {/* 📅 Day & Date — now localized */}
          <span
            className="
              inline-flex items-center gap-1
              mt-2 px-3 py-1.5
              text-xs sm:text-xs
              font-medium text-yellow-800
              bg-yellow-50
              border border-yellow-300/50
              rounded-full
              shadow-sm
              whitespace-nowrap
            "
            aria-label={`Today is ${day}, ${date}`}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
              />
            </svg>
            <span>{`${day}, ${date}`}</span>
          </span>
        </div>
      )}
    </>
  );

  if (canGoDashboard) {
    return (
      <Link
        href="/dashboard"
        className={isSidebarOpen ? "flex items-center" : "flex justify-center w-full"}
        aria-label={`Go to dashboard for ${companyName || user?.CM_Company_Name}`}
      >
        {LogoContent}
      </Link>
    );
  }

  return (
    <div
      className={
        isSidebarOpen
          ? "flex items-center cursor-default"
          : "flex justify-center w-full cursor-default"
      }
      aria-label={`Logo for ${companyName || user?.CM_Company_Name}`}
    >
      {LogoContent}
    </div>
  );
};

export default Logo;