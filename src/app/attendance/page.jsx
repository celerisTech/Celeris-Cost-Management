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
    const [activeTab, setActiveTab] = useState("labor");
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
        { id: "labor", label: "Labor", icon: FiUsers },
        { id: "temporary", label: "Temporary", icon: FiUsers },
        { id: "permanent", label: "Permanent", icon: FiUsers },
        { id: "contract", label: "Contract", icon: FiUsers },
        { id: "office", label: "Office", icon: FiBriefcase },
    ];

    // Filter tabs for ROL000003 (Engineer) - Show ONLY "Labor"
    const tabs = user?.CM_Role_ID === "ROL000003"
        ? allTabs.filter(tab => tab.id === "labor")
        : allTabs;

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 sm:px-6 bg-gradient-to-br from-slate-50 to-slate-100">

                <div className="mx-auto max-w-6xl">
                    <motion.div
                        className="rounded-2xl shadow-xl border border-white/40 bg-white/60 backdrop-blur-xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                        {/* ---------- HEADER ---------- */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">

                                {/* Left Section */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 sm:p-4 bg-white/20 rounded-2xl shadow-inner backdrop-blur-xl flex-shrink-0">
                                        <FiClipboard className="text-2xl sm:text-3xl text-white" />
                                    </div>

                                    <div>
                                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-wide drop-shadow">
                                            Attendance Management
                                        </h1>
                                        <p className="text-blue-100 text-xs sm:text-sm lg:text-base mt-1">
                                            Manage attendance & live location logs with precision
                                        </p>
                                    </div>
                                </div>

                                {/* Right Section (Button) */}
                                <div className="flex sm:justify-end">
                                    <button
                                        onClick={() => router.push("/labors/day-wise-report")}
                                        className="
                                            w-full sm:w-auto
                                            flex items-center justify-center gap-2
                                            px-4 sm:px-5
                                            py-2.5
                                            bg-white hover:bg-blue-100
                                            text-blue-700 text-sm sm:text-base font-semibold
                                            rounded-xl
                                            shadow-md
                                            transition-all
                                            focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-blue-600
                                            "
                                    >
                                        <CheckSquare size={18} />
                                        Attendance Record
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* ---------- TABS ---------- */}
                        <div className="px-3 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8">
                            <div className="flex justify-center">
                                {/* Scroll container */}
                                <div className="relative w-full max-w-full sm:max-w-fit">
                                    <div
                                        className="
                                            flex items-center gap-1
                                            overflow-x-auto scrollbar-hide
                                            snap-x snap-mandatory
                                            bg-white/80 backdrop-blur-xl
                                            border border-gray-200
                                            rounded-2xl
                                            p-1.5 sm:p-2
                                            shadow-md
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
                                                    relative snap-center flex items-center gap-2
                                                    px-3 sm:px-4 lg:px-5
                                                    py-2 sm:py-2.5
                                                    text-xs sm:text-sm
                                                    font-semibold
                                                    rounded-xl
                                                    whitespace-nowrap
                                                    transition-all
                                                    ${isActive
                                                            ? "text-white"
                                                            : "text-gray-700 hover:bg-gray-100"
                                                        }
                                                `}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {/* Active background */}
                                                    {isActive && (
                                                        <motion.span
                                                            layoutId="activeTab"
                                                            className="absolute inset-0 rounded-xl bg-blue-500 shadow-md"
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 280,
                                                                damping: 22,
                                                            }}
                                                        />
                                                    )}

                                                    <IconComponent className="relative z-10 text-sm sm:text-base" />
                                                    <span className="relative z-10">{tab.label}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ---------- CONTENT ---------- */}
                            <div className="mt-6 sm:mt-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="w-full"
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
