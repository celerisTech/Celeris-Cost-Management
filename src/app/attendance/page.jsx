"use client";
import React, { useState } from "react";
import Labor from "./components/Labor";
import Temporary from "./components/Temporary";
import Permanent from "./components/Permanent";
import Contract from "./components/Contract";
import Office from "./components/Office";
import Navbar from "../components/Navbar";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiClipboard, FiUsers, FiBriefcase } from "react-icons/fi";
import { CheckSquare } from "lucide-react";

import { useAuthStore } from "@/app/store/useAuthScreenStore";

export default function AttendancePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("permanent");
    const router = useRouter();

    const renderContent = () => {
        switch (activeTab) {
            case "temporary":
                return <Temporary />;
            case "permanent":
                return <Permanent />;
            case "contract":
                return <Contract />;
            case "office":
                return <Office />;
            default:
                return <Labor />;
        }
    };

    const allTabs = [
        { id: "permanent", label: "Permanent", icon: FiUsers },
        { id: "office", label: "Office", icon: FiBriefcase },
        { id: "temporary", label: "Temporary", icon: FiUsers },
        { id: "contract", label: "Contract", icon: FiUsers },
        { id: "labor", label: "Labor", icon: FiUsers },
    ];

    // Filter tabs for ROL000003 (Engineer) - Show ONLY "Labor"
    const tabs = user?.CM_Role_ID === "ROL000003"
        ? allTabs.filter(tab => tab.id === "labor")
        : allTabs;

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-indigo-50 overflow-hidden">
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 sm:px-8">
                <div className="mx-auto max-w-7xl h-full">
                    <motion.div
                        className="rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/80 bg-white/60 backdrop-blur-2xl overflow-hidden min-h-[90vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {/* ---------- HEADER ---------- */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 sm:px-10 py-8 sm:py-10">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-20 w-32 h-32 bg-indigo-300 opacity-20 rounded-full blur-2xl"></div>

                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                {/* Left Section */}
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-lg backdrop-blur-md flex-shrink-0">
                                        <FiClipboard className="text-3xl sm:text-4xl text-white drop-shadow-md" />
                                    </div>

                                    <div>
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-sm mb-1">
                                            Attendance Center
                                        </h1>
                                        <p className="text-indigo-100 text-sm sm:text-base font-medium opacity-90">
                                            Manage attendance, shifts, and live location tracking
                                        </p>
                                    </div>
                                </div>

                                {/* Right Section (Button) */}
                                <div className="flex sm:justify-end">
                                    <button
                                        onClick={() => router.push("/labors/day-wise-report")}
                                        className="
                                            w-full sm:w-auto
                                            flex items-center justify-center gap-2.5
                                            px-6 py-3
                                            bg-white/10 hover:bg-white/20
                                            border border-white/20
                                            text-white text-sm sm:text-base font-semibold
                                            rounded-xl
                                            backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)]
                                            transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5
                                            focus:outline-none focus:ring-2 focus:ring-white/50
                                            "
                                    >
                                        <CheckSquare size={18} />
                                        <span>Attendance Record</span>
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* ---------- TABS ---------- */}
                        <div className="px-4 sm:px-10 pt-8 pb-4">
                            <div className="flex justify-start sm:justify-center">
                                {/* Scroll container */}
                                <div className="relative w-full max-w-full sm:max-w-fit">
                                    <div
                                        className="
                                            flex items-center gap-1.5
                                            overflow-x-auto scrollbar-hide
                                            bg-slate-100/80 backdrop-blur-md
                                            border border-slate-200/60
                                            rounded-full
                                            p-1.5
                                            shadow-inner
                                            "
                                    >
                                        {tabs.map((tab) => {
                                            const IconComponent = tab.icon;
                                            const isActive = activeTab === tab.id;

                                            return (
                                                <motion.button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`
                                                    relative flex items-center gap-2
                                                    px-5 py-2.5
                                                    text-sm font-bold
                                                    rounded-full
                                                    whitespace-nowrap
                                                    transition-colors duration-300
                                                    ${isActive
                                                            ? "text-indigo-700"
                                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                                        }
                                                `}
                                                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    {/* Active background */}
                                                    {isActive && (
                                                        <motion.span
                                                            layoutId="activeTabPill"
                                                            className="absolute inset-0 rounded-full bg-white shadow-sm border border-slate-200/50"
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 30,
                                                            }}
                                                        />
                                                    )}

                                                    <IconComponent className={`relative z-10 text-base ${isActive ? 'text-indigo-600' : ''}`} />
                                                    <span className="relative z-10">{tab.label}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ---------- CONTENT ---------- */}
                            <div className="mt-8 flex-1">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="w-full h-full"
                                    >
                                        {renderContent()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
}
