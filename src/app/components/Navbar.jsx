// src/app/components/Navbar.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Sidebar from "./navbar/Sidebar";
import MobileToggle from "./navbar/MobileToggle";
import { useAuthStore, useNotificationStore } from "../store/useAuthScreenStore";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { user, setUser } = useAuthStore();
  const { notifications, setNotifications } = useNotificationStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState([]);
  const [loadingPrivileges, setLoadingPrivileges] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Derive company info
  const companyName =
    user?.CM_Company_Name || user?.company?.name || user?.company_name || "Celeris Solutions";
  const companyLogo =
    user?.CM_Company_Logo ||
    user?.company?.logoUrl ||
    user?.company?.logo ||
    user?.company_logo ||
    null;
  const companyInitials = (companyName || "Celeris Solutions")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  // Fetch user privileges
  useEffect(() => {
    const fetchUserPrivileges = async () => {
      if (!user) return;

      const userId = user?.CM_User_ID ?? user?.id ?? user?.user_id;
      const roleId = user?.CM_Role_ID ?? user?.role_id ?? user?.roleId;
      console.log(roleId);

      if (!userId || !roleId) {
        console.warn("User ID or Role ID not available");
        setLoadingPrivileges(false);
        return;
      }

      try {
        setLoadingPrivileges(true);
        const response = await fetch(`/api/user-privileges?userId=${userId}&roleId=${roleId}`);
        const data = await response.json();

        if (data.success) {
          setUserPrivileges(data.data || []);
        } else {
          console.error("Failed to fetch user privileges:", data.message);
          setUserPrivileges([]);
        }
      } catch (error) {
        console.error("Error fetching user privileges:", error);
        setUserPrivileges([]);
      } finally {
        setLoadingPrivileges(false);
      }
    };

    fetchUserPrivileges();
  }, [user]);

  // ✅ Fetch notifications periodically
  useEffect(() => {
    const UserId = user?.CM_User_ID ?? user?.id ?? user?.user_id;
    if (!UserId) return;

    let intervalId;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/count?user_id=${UserId}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 10000); // refresh every 10 sec

    return () => clearInterval(intervalId);
  }, [user?.CM_User_ID, user?.id, user?.user_id, setNotifications]);

  useEffect(() => {
    let intervalId;

    const fetchPendingProducts = async () => {
      try {
        const response = await fetch("/api/product-requests/count", {
          cache: "no-store",
        });
        const data = await response.json();
        if (data.success) {
          setPendingCount(data.pendingCount || 0);
        }
      } catch (error) {
        console.error("Error fetching pending products:", error);
      }
    };

    fetchPendingProducts();
    intervalId = setInterval(fetchPendingProducts, 10000); // every 10 sec

    return () => clearInterval(intervalId);
  }, []);

  // Prevent body scroll on mobile drawer
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Initialize sidebar state on resize
  useEffect(() => {
    const updateState = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsSidebarOpen(isDesktop);
    };
    updateState();
    window.addEventListener("resize", updateState);
    return () => window.removeEventListener("resize", updateState);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setUserPrivileges([]);
    document.cookie.split(";").forEach(function (cookie) {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    router.push("/");
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 🔔 Mobile Toggle with Badge */}
      <MobileToggle
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        notificationsCount={unreadCount}
        pendingCount={pendingCount} // ✅ new prop
      />

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        companyName={companyName}
        companyLogo={companyLogo}
        companyInitials={companyInitials}
        pathname={pathname}
        notificationsCount={unreadCount}
        pendingCount={pendingCount} // ✅ new prop
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        onSignOut={handleLogout}
        userPrivileges={userPrivileges}
        loadingPrivileges={loadingPrivileges}
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
        />
      )}
    </div>
  );
};

export default Navbar;