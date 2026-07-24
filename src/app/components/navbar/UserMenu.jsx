// src/app/components/navbar/UserMenu.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  User, 
  LogOut, 
  UserCircle, 
  Sparkles, 
  Moon, 
  Sun, 
  Crown,
  Shield,
  Building,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthScreenStore";

const UserMenu = ({ isSidebarOpen, isUserMenuOpen, setIsUserMenuOpen, onSignOut }) => {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const menuRef = useRef(null);

  const [userInfo, setUserInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync dark mode state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Fetch full user details
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.CM_User_ID) return;
      try {
        const res = await fetch(`/api/users/${user.CM_User_ID}`);
        const data = await res.json();
        if (data) setUserInfo(data);
      } catch (err) {
        console.error("Failed to load user info", err);
      }
    };
    fetchUserInfo();
  }, [user]);

  // Click outside listener for smooth dropdown behavior
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isUserMenuOpen, setIsUserMenuOpen]);

  const handleSignOut = async () => {
    try {
      setIsUserMenuOpen(false);
      if (onSignOut) {
        await onSignOut();
      } else {
        await fetch("/api/logout", { method: "GET" });
        clearAuth();
        router.push("/");
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleTheme = (e) => {
    e.stopPropagation();
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  // User details fallback
  const displayName = userInfo?.CM_Full_Name || user?.CM_Full_Name || user?.name || "User";
  const displayEmail = userInfo?.CM_Email || user?.CM_Email || user?.email || "user@celeris.com";
  const photoUrl = userInfo?.CM_Photo_URL || user?.CM_Photo_URL || user?.photoUrl;
  const companyName = user?.CM_Company_Name || user?.company_name || "Celeris Cost Management";

  // Derive user role badge details
  const getRoleInfo = () => {
    const roleStr = (userInfo?.CM_Role || user?.CM_Role || user?.role || "").toLowerCase();
    if (roleStr.includes("admin")) {
      return { 
        label: "Administrator", 
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", 
        Icon: Crown 
      };
    }
    if (roleStr.includes("manager") || roleStr.includes("lead")) {
      return { 
        label: "Manager", 
        badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", 
        Icon: Shield 
      };
    }
    return { 
      label: roleStr ? roleStr.charAt(0).toUpperCase() + roleStr.slice(1) : "Member", 
      badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", 
      Icon: User 
    };
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.Icon;

  // Extract initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Animation variants
  const dropdownVariants = {
    hidden: isSidebarOpen 
      ? { opacity: 0, y: 12, scale: 0.96 }
      : { opacity: 0, x: -12, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      }
    },
    exit: isSidebarOpen
      ? { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }
      : { opacity: 0, x: -8, scale: 0.96, transition: { duration: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.04, duration: 0.2 }
    })
  };

  return (
    <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="relative" ref={menuRef}>
        {/* User Menu Trigger Button */}
        <motion.button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex items-center w-full ${
            isSidebarOpen ? "justify-between px-3 py-2.5" : "justify-center p-2"
          } rounded-2xl border border-transparent`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          aria-expanded={isUserMenuOpen}
          aria-label="User Account Menu"
        >
          <div className="flex items-center min-w-0">
            {/* Avatar with Status Badge */}
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full ring-2 ring-gray-500/20 dark:ring-gray-400/30 overflow-hidden bg-gray-500 flex items-center justify-center shadow-sm group-hover:ring-indigo-500/50 transition-all">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-white font-bold text-sm tracking-wider">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
              
              {/* Active Online Indicator */}
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
              </span>
            </div>

            {/* User details (Visible when sidebar is open) */}
            {isSidebarOpen && (
              <div className="ml-3 text-left min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {displayName}
                  </p>
                  {roleInfo.label === "Administrator" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {displayEmail}
                </p>
              </div>
            )}
          </div>

          {/* Chevron Dropdown Arrow (Visible when sidebar is open) */}
          {isSidebarOpen && (
            <motion.div
              animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:bg-indigo-100/70 dark:group-hover:bg-indigo-900/50 transition-colors ml-2 flex-shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
            </motion.div>
          )}
        </motion.button>

        {/* Dropdown Menu Popover */}
        <AnimatePresence>
          {isUserMenuOpen && (
            <motion.div
              className={`absolute z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden ${
                isSidebarOpen 
                  ? "bottom-full left-0 right-0 mb-3 w-full min-w-[260px]" 
                  : "left-full bottom-0 ml-3 w-72 min-w-[280px]"
              }`}
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Vibrant Top Accent Line */}
              <div className="h-1 w-full bg-gray-400"></div>

              {/* Profile Card Header in Popover */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full ring-2 ring-gray-500/20 dark:ring-gray-400/30 overflow-hidden bg-gray-500 flex items-center justify-center shadow-md flex-shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-base">
                        {getInitials(displayName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Navigation Links */}
              <div className="p-2 space-y-1">
                {/* Profile Link */}
                <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-gray-50/80 dark:hover:bg-gray-950/50 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 group-hover:bg-gray-100 dark:group-hover:bg-gray-900/80 transition-colors">
                        <UserCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">My Profile</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Account settings & information</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </motion.div>
              </div>

              {/* Sign Out Section */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 group-hover:bg-red-100 dark:group-hover:bg-red-900/60 transition-colors">
                        <LogOut className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-semibold">Sign Out</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-red-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserMenu;