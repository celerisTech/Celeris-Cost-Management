// src/app/components/navbar/UserMenu.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  User, 
  LogOut, 
  Settings, 
  UserCircle,
  Sparkles,
  Award,
  Bell,
  Moon,
  Sun,
  Crown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthScreenStore";

const UserMenu = ({ isSidebarOpen, isUserMenuOpen, setIsUserMenuOpen }) => {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.CM_User_ID) {
        console.log("No CM_User_ID found in Zustand user:", user);
        return;
      }
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

  const handleSignOut = async () => {
    try {
      await fetch("/api/logout", { method: "GET" });
      clearAuth();
      router.push("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Premium animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: i * 0.04,
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }),
    hover: {
      backgroundColor: "rgba(99, 102, 241, 0.08)",
      x: 8,
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.97 }
  };

  const glowVariants = {
    initial: { opacity: 0.5, scale: 1 },
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "G";
    const names = name.split(" ");
    return names.map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/20">
      <div className="relative">
        <motion.button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
          className={`flex items-center w-full ${isSidebarOpen ? "justify-between" : "justify-center"
            } p-3 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-300 group`}
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)"
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            {/* Premium Profile Avatar with Glow */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-1 bg-blue-500 rounded-full opacity-50 blur-md"
                variants={glowVariants}
                initial="initial"
                animate="animate"
              />
              
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                {userInfo?.CM_Photo_URL ? (
                  <motion.img
                    src={userInfo.CM_Photo_URL}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    initial={{ filter: "grayscale(0%)" }}
                    whileHover={{ filter: "grayscale(20%)" }}
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {getInitials(userInfo?.CM_Full_Name)}
                  </span>
                )}
                
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
            </motion.div>

            {/* User info with premium styling */}
            {isSidebarOpen && (
              <motion.div
                className="ml-3 text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <motion.p
                  className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1"
                  whileHover={{ x: 3 }}
                >
                  {userInfo?.CM_Full_Name || "Guest"}
                  {userInfo?.CM_Role === "admin" && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </motion.p>
                <motion.p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 bg-green-400 rounded-full"></span>
                  {userInfo?.CM_Email || "guest@example.com"}
                </motion.p>
              </motion.div>
            )}
          </div>

          {/* Dropdown Arrow with premium animation */}
          {isSidebarOpen && (
            <motion.div
              animate={{ 
                rotate: isUserMenuOpen ? 180 : 0,
                scale: isUserMenuOpen ? 1.1 : 1
              }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className="p-1.5 rounded-lg bg-gray-100/50 dark:bg-gray-700/50 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-600/50 transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.div>
          )}
        </motion.button>

        {/* Premium Dropdown Menu */}
        <AnimatePresence>
          {isUserMenuOpen && isSidebarOpen && (
            <motion.div
              className="absolute bottom-full left-0 mb-3 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl py-2 border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Decorative gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              
              {/* User stats preview */}
              {isSidebarOpen && (
                <div className="px-4 py-2 mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-indigo-500" />
                        <span>Celeris Solutions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1"></div>

              <motion.div
                custom={0}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="mr-3 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <UserCircle className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="font-medium">My Profile</span>
                </Link>
              </motion.div>


              <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1"></div>

              <motion.button
                custom={3}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleSignOut}
                className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors group"
              >
                <div className="mr-3 p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                  <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
                <span className="font-medium">Sign Out</span>
              </motion.button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserMenu;