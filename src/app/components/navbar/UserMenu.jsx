// src/app/components/navbar/UserMenu.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthScreenStore";

const UserMenu = ({ isSidebarOpen, isUserMenuOpen, setIsUserMenuOpen }) => {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);

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

  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2
      }
    }),
    hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      x: 5,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="relative">
        <motion.button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
          className={`flex items-center w-full ${
            isSidebarOpen ? "justify-between" : "justify-center"
          } p-2 rounded-lg hover:bg-gray-100 transition-colors`}
          whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            {/* Profile Picture with animation */}
            <motion.div 
              className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {userInfo?.CM_Photo_URL ? (
                <motion.img
                  src={userInfo.CM_Photo_URL}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  initial={{ filter: "grayscale(0%)" }}
                  whileHover={{ filter: "grayscale(30%)" }}
                />
              ) : (
                <User className="h-4 w-4 text-gray-600" />
              )}
            </motion.div>

            {/* Name + Email with animation */}
            {isSidebarOpen && (
              <motion.div 
                className="ml-3 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.p 
                  className="text-sm font-medium text-gray-900 truncate"
                  whileHover={{ x: 2 }}
                >
                  {userInfo?.CM_Full_Name || "Guest"}
                </motion.p>
                <motion.p className="text-xs text-gray-500 truncate">
                  {userInfo?.CM_Email || "guest@example.com"}
                </motion.p>
              </motion.div>
            )}
          </div>

          {/* Dropdown Arrow with animation */}
          {isSidebarOpen && (
            <motion.div
              animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </motion.div>
          )}
        </motion.button>

        {/* Dropdown Menu with animation */}
        <AnimatePresence>
          {isUserMenuOpen && isSidebarOpen && (
            <motion.div 
              className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg py-1 border border-gray-200 z-50"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                custom={0}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </motion.div>
              
              <motion.div
                custom={1}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {/* <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link> */}
              </motion.div>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <motion.button
                custom={2}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleSignOut}
                className="flex w-full items-center text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserMenu;