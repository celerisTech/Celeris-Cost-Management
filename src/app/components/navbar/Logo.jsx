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
              ? "h-13 w-12 object-cover"
              : "h-10 w-10 object-cover"
          }
          alt={companyName || user?.CM_Company_Name || "Company Logo"}
        />
      </div>

      {isSidebarOpen && (
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-pink-800 bg-clip-text text-transparent">
            {companyName || user?.CM_Company_Name}
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