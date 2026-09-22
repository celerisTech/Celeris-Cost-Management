"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useAuthStore } from "../store/useAuthScreenStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EmployeeChatWidget() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const widgetRef = useRef(null);

  const currentUserId = user?.CM_User_ID || user?.id || user?.user_id;

  useEffect(() => {
    if (!currentUserId) return;

    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${currentUserId}`);
        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        const data = JSON.parse(text);
        if (data && data.success && Array.isArray(data.employees)) {
          const total = data.employees.reduce((acc, emp) => acc + (emp.unreadCount || 0), 0);
          setUnreadTotal(total);
        }
      } catch (err) {
        // silent
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  if (!currentUserId) return null;

  return (
    <motion.div
      ref={widgetRef}
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.05 }}
      className="fixed bottom-5 right-5 z-50 print:hidden cursor-grab active:cursor-grabbing"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <button
        onClick={() => router.push("/chat")}
        className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl font-bold text-xs transition-all group border border-white/20 pointer-events-auto"
      >
        <div className="relative">
          <MessageSquare className="h-5 w-5" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          )}
        </div>
        <span>Employee Chat</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition" />
      </button>
    </motion.div>
  );
}
