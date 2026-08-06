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
import { FiClipboard, FiUsers, FiBriefcase, FiGrid } from "react-icons/fi";
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
        <div className="flex flex-col sm:flex-row h-screen bg-white overflow-x-hidden">
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl h-full">
                    <motion.div
                        className="bg-white overflow-hidden min-h-[92vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {/* ---------- EXCEL BLUE HEADER BAR ---------- */}
                        <div className="relative bg-white px-4 sm:px-8 py-6 text-black border-b-3 border-gray-600 shadow-md">
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                {/* Title & Icon */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-xl border border-white/20 shadow-inner flex-shrink-0">
                                        <FiGrid className="text-xl sm:text-xl text-black" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-xl font-black text-black tracking-tight drop-shadow-sm mt-0.5">
                                            Attendance Entry Register
                                        </h1>
                                    </div>
                                </div>

                                {/* Right Button */}
                                <div className="flex sm:justify-end">
                                    <button
                                        onClick={() => router.push("/labors/day-wise-report")}
                                        className="
                                            w-full sm:w-auto
                                            flex items-center justify-center gap-2
                                            px-5 py-2.5
                                            bg-blue-600 hover:bg-blue-500
                                            border border-blue-400
                                            text-white text-xs sm:text-sm font-bold
                                            rounded-xl shadow-md
                                            transition-all duration-200 hover:shadow-lg active:scale-95
                                            "
                                    >
                                        <CheckSquare size={16} />
                                        <span>Attendance Logs</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ---------- EXCEL SHEET TABS BAR ---------- */}
                        <div className="bg-blue-50/70 border-b border-blue-200 px-1.5 sm:px-3 py-2">
                            <div className="w-full">
                                <div className="grid grid-cols-5 gap-1 sm:flex sm:items-center sm:gap-1.5">
                                    {tabs.map((tab) => {
                                        const IconComponent = tab.icon;
                                        const isActive = activeTab === tab.id;

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`
                                                    flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2
                                                    px-1 sm:px-4 py-1.5 sm:py-2 text-[10px] min-[380px]:text-xs sm:text-sm font-bold rounded-lg
                                                    transition-all duration-200 border text-center w-full sm:w-auto
                                                    ${isActive
                                                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                                        : "bg-white text-slate-700 border-blue-200 hover:bg-blue-100/60 hover:text-blue-800"
                                                    }
                                                `}
                                            >
                                                <IconComponent className={`text-xs sm:text-base flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                                                <span className="truncate max-w-full leading-tight">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ---------- TAB CONTENT ---------- */}
                        <div className="p-2 sm:p-2 flex-1 bg-slate-50/40">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full"
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
