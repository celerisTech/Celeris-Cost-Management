// src/app/dashboard/components/FollowupsOverviewModal.jsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    ChevronRight,
    Filter,
    Loader2,
    History,
    ClipboardList,
    User,
    BarChart3,
    Phone,
    Building2,
    MessageSquare,
    Eye
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const StatusBadge = ({ status }) => {
    const statusConfig = {
        "Follow-up Needed": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: <Clock size={14} className="text-blue-600" />, label: "Follow-up Needed" },
        "Interested": { color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: <CheckCircle2 size={14} className="text-emerald-600" />, label: "Interested" },
        "Proposal Sent": { color: "bg-amber-100 text-amber-700 border-amber-300", icon: <AlertCircle size={14} className="text-amber-600" />, label: "Proposal Sent" },
        "Converted": { color: "bg-indigo-100 text-indigo-700 border-indigo-300", icon: <CheckCircle2 size={14} className="text-indigo-600" />, label: "Converted" },
        "Not Interested": { color: "bg-rose-100 text-rose-700 border-rose-300", icon: <AlertCircle size={14} className="text-rose-600" />, label: "Not Interested" },
        "default": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: <Clock size={14} className="text-slate-600" />, label: status || "Pending" }
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color} shadow-sm transition-all duration-200`}>
            {config.icon}
            {config.label}
        </span>
    );
};

const FollowupCard = ({ item, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <User size={16} className="text-slate-500" />
                    {item.CM_Client_Name}
                </h3>
                <StatusBadge status={item.CM_Visit_Status} />
            </div>

            {item.CM_Company_Name && (
                <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-400" />
                    {item.CM_Company_Name}
                </div>
            )}

            <div className="flex flex-col gap-2 mb-3">
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs text-slate-700 border border-slate-200">
                    <span className="font-semibold">Purpose:</span> {item.CM_Purpose}
                </div>
                {item.CM_Remarks && (
                    <div className="px-2 py-1.5 bg-slate-50 rounded text-xs text-slate-600 italic border border-slate-100">
                        "{item.CM_Remarks}"
                    </div>
                )}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                    <Phone size={12} className="text-blue-500" />
                    <span>{item.CM_Phone || "No Phone"}</span>
                </div>
                <div className="font-semibold text-slate-700">
                    Exec: {item.Executive_Name || "Unassigned"}
                </div>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                <div>Visit: {format(new Date(item.CM_Visit_Date), "MMM d, yy")}</div>
                {item.CM_Next_Followup_Date && (
                    <div className="text-amber-700 font-bold">
                        Next: {format(new Date(item.CM_Next_Followup_Date), "MMM d, yy")}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default function FollowupsOverviewModal({ isOpen, onClose }) {
    const [startDate, setStartDate] = useState(() => new Date());
    const [endDate, setEndDate] = useState(() => new Date());
    const [activeTab, setActiveTab] = useState("pending");
    const [followups, setFollowups] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterExecutive, setFilterExecutive] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, startDate, endDate, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const startStr = format(startDate, "yyyy-MM-dd");
            const endStr = format(endDate, "yyyy-MM-dd");
            if (activeTab === "pending") {
                const response = await fetch(`/api/sales-visits?type=pending-followups&fromDate=${startStr}&toDate=${endStr}`);
                const result = await response.json();
                if (Array.isArray(result)) {
                    setFollowups(result);
                }
            } else {
                const response = await fetch(`/api/sales-visits?fromDate=${startStr}&toDate=${endStr}&limit=200`);
                const result = await response.json();
                if (result && Array.isArray(result.visits)) {
                    setHistory(result.visits);
                }
            }
        } catch (error) {
            console.error(`Error fetching follow-ups:`, error);
        } finally {
            setLoading(false);
        }
    };

    const displayedData = activeTab === "pending" ? followups : history;

    // Filters implementation
    const baseFilteredData = displayedData.filter(item => {
        const clientName = item.CM_Client_Name || "";
        const companyName = item.CM_Company_Name || "";
        const purpose = item.CM_Purpose || "";
        const executiveName = item.Executive_Name || "";
        const remarks = item.CM_Remarks || "";

        const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
            remarks.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesExecutive = filterExecutive === "All" || executiveName === filterExecutive;

        return matchesSearch && matchesExecutive;
    });

    const filteredData = baseFilteredData.filter(item => {
        if (filterStatus === "All") return true;
        if (filterStatus === "Other") {
            const s = item.CM_Visit_Status || "Follow-up Needed";
            return s !== "Follow-up Needed" && s !== "Interested" && s !== "Proposal Sent";
        }
        return item.CM_Visit_Status === filterStatus;
    });

    const uniqueExecutives = ["All", ...new Set(displayedData.map(t => t.Executive_Name).filter(Boolean))];

    // Follow-ups stats
    const getStatus = (t) => t.CM_Visit_Status || "Follow-up Needed";
    const pendingCount = baseFilteredData.filter(t => getStatus(t) === "Follow-up Needed").length;
    const interestedCount = baseFilteredData.filter(t => getStatus(t) === "Interested").length;
    const proposalCount = baseFilteredData.filter(t => getStatus(t) === "Proposal Sent").length;
    const otherCount = baseFilteredData.filter(t => getStatus(t) !== "Follow-up Needed" && getStatus(t) !== "Interested" && getStatus(t) !== "Proposal Sent").length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-4 text-slate-800">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 20 }}
                        className="relative w-full max-w-7xl max-h-[90vh] bg-white rounded-md shadow-md border border-slate-200 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-blue-50 relative z-[60]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                                    <Clock className="text-white" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Sales Follow-ups</h2>
                                    <p className="text-slate-600 text-sm">
                                        Viewing {activeTab === 'pending' ? "Today's Follow-ups" : "Today's Visits & Calls"} from {format(startDate, "MMM d")} to {format(endDate, "MMM d, yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar sm:flex-wrap sm:justify-end w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        selectsStart
                                        startDate={startDate}
                                        endDate={endDate}
                                        popperClassName="!z-[9999]"
                                        customInput={
                                            <button className="flex items-center gap-1.5 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 transition-colors whitespace-nowrap">
                                                <CalendarIcon size={14} className="text-blue-500 sm:w-4 sm:h-4" />
                                                <span>{format(startDate, "MMM d")}</span>
                                            </button>
                                        }
                                    />
                                    <span className="text-slate-400 text-xs font-medium">to</span>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate}
                                        popperClassName="!z-[9999]"
                                        customInput={
                                            <button className="flex items-center gap-1.5 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 transition-colors whitespace-nowrap">
                                                <CalendarIcon size={14} className="text-blue-500 sm:w-4 sm:h-4" />
                                                <span>{format(endDate, "MMM d")}</span>
                                            </button>
                                        }
                                    />
                                </div>

                                {/* Pending/History Toggle */}
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setActiveTab("pending");
                                            setStartDate(new Date());
                                            setEndDate(new Date());
                                        }}
                                        className={`flex justify-center items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <Clock size={14} className="sm:w-4 sm:h-4" />
                                        <span>Today's Follow-ups</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("history");
                                            setStartDate(new Date());
                                            setEndDate(new Date());
                                        }}
                                        className={`flex justify-center items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <History size={14} className="sm:w-4 sm:h-4" />
                                        <span>Today's Visits & Calls</span>
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="hidden sm:block p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors absolute top-4 right-4 sm:static"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <button
                                onClick={onClose}
                                className="sm:hidden absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats Bar */}
                        <div className="border-b border-slate-200 bg-slate-50">
                            <div className="px-3 py-1 overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-2 sm:gap-4 min-w-max px-1 py-1">
                                    <div
                                        onClick={() => setFilterStatus("All")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "All" ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-indigo-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-md text-indigo-600">
                                            <BarChart3 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Total</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{baseFilteredData.length}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Follow-up Needed" ? "All" : "Follow-up Needed")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Follow-up Needed" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-blue-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-md text-blue-600">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Follow-up Needed</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{pendingCount}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Interested" ? "All" : "Interested")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Interested" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-emerald-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-md text-emerald-600">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Interested</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{interestedCount}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Proposal Sent" ? "All" : "Proposal Sent")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Proposal Sent" ? 'border-amber-500 ring-1 ring-amber-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-amber-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-md text-amber-600">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Proposal Sent</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{proposalCount}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus("Other")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Other" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-slate-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-md text-slate-600">
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Converted / Others</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{otherCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/20 flex flex-wrap items-center gap-4 justify-between">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search client, company, purpose, remarks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 text-gray-700 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-colors"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                                        <Filter size={14} className="text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">Filters</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                        <div className="relative flex-1 sm:w-48 lg:w-60">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <select
                                                value={filterExecutive}
                                                onChange={(e) => setFilterExecutive(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-indigo-400 transition-all"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.6rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                            >
                                                <option value="All">All Executives</option>
                                                {uniqueExecutives.filter(e => e !== "All").map(e => (
                                                    <option key={e} value={e}>{e}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto bg-white border-t border-slate-300">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 bg-slate-50">
                                    <Loader2 className="text-indigo-600 animate-spin" size={40} />
                                    <p className="text-slate-600 font-medium">Fetching follow-ups data...</p>
                                </div>
                            ) : filteredData.length > 0 ? (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block w-full h-full">
                                        <table className="w-full border-collapse text-sm text-slate-800">
                                            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-300">
                                                <tr className="text-left font-semibold text-slate-700">
                                                    <th className="px-4 py-3.5 border-r border-slate-300 w-12 text-center bg-slate-200/50">#</th>
                                                    <th className="px-4 py-3.5 border-r border-slate-300 w-36">Visit Date</th>
                                                    <th className="px-4 py-3.5 border-r border-slate-300 w-52">Client / Company</th>
                                                    <th className="px-4 py-3.5 border-r border-slate-300">Purpose & Remarks</th>
                                                    <th className="px-4 py-3.5 border-r border-slate-300 w-44">Executive</th>
                                                    <th className="px-4 py-3.5 border-r border-slate-300 w-36 text-center">Next Follow-up</th>
                                                    <th className="px-4 py-3.5 text-center w-36">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((item, idx) => (
                                                    <tr key={item.CM_Visit_ID} className="hover:bg-blue-50/40 border-b border-slate-200 transition-colors">
                                                        <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-500 bg-slate-50 font-mono text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">
                                                            <div className="font-semibold">
                                                                {format(new Date(item.CM_Visit_Date), "dd-MMM-yyyy")}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                Logged: {item.CM_Created_At ? format(new Date(item.CM_Created_At), "HH:mm") : "-"}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-slate-200">
                                                            <p className="font-bold text-slate-800">{item.CM_Client_Name}</p>
                                                            <p className="text-[11px] text-slate-500">{item.CM_Company_Name || "Individual"}</p>
                                                            {item.CM_Phone && (
                                                                <p className="text-[11px] text-blue-600 flex items-center gap-1.5 mt-0.5 font-medium">
                                                                    <Phone size={10} /> {item.CM_Phone}
                                                                </p>
                                                            )}
                                                            <p className="text-[11px] text-slate-500">{item.CM_City || "Individual"}</p>

                                                        </td>
                                                        <td className="px-4 py-3 border-r border-slate-200">
                                                            <div className="font-bold text-indigo-700 text-xs mb-0.5">
                                                                {item.CM_Purpose}
                                                            </div>
                                                            <div className="text-xs text-slate-600 whitespace-normal break-words max-w-lg">
                                                                {item.CM_Remarks || <span className="text-slate-300 italic">No remarks recorded</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                                    {(item.Executive_Name || "U")[0]}
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-700">{item.Executive_Name || "Unassigned"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-slate-200 text-center">
                                                            {item.CM_Next_Followup_Date ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-55 text-amber-700 font-bold border border-amber-200 text-xs shadow-sm bg-amber-50">
                                                                    <Clock size={12} />
                                                                    {format(new Date(item.CM_Next_Followup_Date), "dd-MMM-yy")}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <StatusBadge status={item.CM_Visit_Status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile Grid View */}
                                    <div className="block md:hidden p-3">
                                        <div className="grid grid-cols-1 gap-3">
                                            {filteredData.map((item, idx) => (
                                                <FollowupCard key={item.CM_Visit_ID} item={item} index={idx} />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <History className="text-slate-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">No follow-ups found</h3>
                                    <p className="max-w-md text-sm text-slate-500">
                                        There are no follow-ups or visits matching the selected filters and search term.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
