"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useAuthStore } from "../store/useAuthScreenStore";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function EmployeeChatWidget() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
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

  useEffect(() => {
    const updateBounds = () => {
      setDragBounds({
        left: -(window.innerWidth - 200), // Approximate button width + margin
        right: 0,
        top: -(window.innerHeight - 100), // Approximate button height + margin
        bottom: 0,
      });
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  if (!currentUserId || pathname === '/chat') return null;

  return (
    <motion.div
      ref={widgetRef}
      drag
      dragConstraints={dragBounds}
      dragMomentum={false}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setTimeout(() => setIsDragging(false), 10);
      }}
      className="fixed bottom-5 right-5 z-50 print:hidden cursor-grab active:cursor-grabbing"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <button
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
            return;
          }
          router.push("/chat");
        }}
        className={`flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl font-bold text-xs transition-all duration-300 group border border-white/20 pointer-events-auto ${
          isDragging ? "w-12 h-12 p-0 shadow-lg scale-90" : "px-4 py-3 gap-2.5"
        }`}
      >
        <div className="relative shrink-0">
          <MessageSquare className="h-5 w-5" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          )}
        </div>
        <div 
          className={`flex items-center overflow-hidden transition-all duration-300 ${
            isDragging ? "w-0 opacity-0 gap-0" : "w-auto opacity-100 gap-2.5"
          }`}
        >
          <span className="whitespace-nowrap">CS Hub</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition shrink-0" />
        </div>
      </button>
    </motion.div>
  );
}
