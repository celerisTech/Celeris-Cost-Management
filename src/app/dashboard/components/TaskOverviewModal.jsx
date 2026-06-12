// src/app/dashboard/components/TaskOverviewModal.jsx
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
    Projector,
    BarChart3,
    CalendarClock,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isToday, isThisWeek, isYesterday } from "date-fns";

const StatusBadge = ({ status }) => {
    const statusConfig = {
        "Completed": { color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: <CheckCircle2 size={14} className="text-emerald-600" />, label: "Completed" },
        "In Progress": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: <Clock size={14} className="text-blue-600" />, label: "In Progress" },
        "Delayed": { color: "bg-rose-100 text-rose-700 border-rose-300", icon: <AlertCircle size={14} className="text-rose-600" />, label: "Delayed" },
        "On Hold": { color: "bg-amber-100 text-amber-700 border-amber-300", icon: <AlertCircle size={14} className="text-amber-600" />, label: "On Hold" },
        "default": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: <Clock size={14} className="text-slate-600" />, label: status || "Pending" }
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm transition-all duration-200`}>
            {config.icon}
            {config.label}
        </span>
    );
};

const TaskCard = ({ task, index, onTaskClick, onPreviewImage }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1 items-start">
                    <button
                        onClick={() => onTaskClick(task.CM_Task_Name)}
                        className="font-semibold text-left text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                        {task.CM_Task_Name}
                    </button>
                    {task.CM_Image_URL && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreviewImage(task.CM_Image_URL);
                            }}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                        >
                            <Projector size={12} />
                            Image
                        </button>
                    )}
                </div>
                <StatusBadge status={task.Latest_Status} />
            </div>
            <div className="text-xs text-slate-500 mb-3">
                Milestone: {task.CM_Milestone_Name || "-"}
            </div>
            <div className="flex flex-col gap-2 mb-3">
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs text-slate-700 border border-slate-200">
                    <span className="font-semibold">Project:</span> {task.CM_Project_Name}
                </div>
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs text-slate-700 border border-slate-200">
                    <span className="font-semibold">Engineer:</span> {task.Engineer_Name || "Unassigned"}
                </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div>Start: {format(new Date(task.CM_Assign_Date), "MMM d, yy")}</div>
                <div>Due: {format(new Date(task.CM_Due_Date), "MMM d, yy")}</div>
            </div>
        </motion.div>
    );
};

const UpdateCard = ({ item, index, onPreviewImage }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <div className="text-xs font-medium text-slate-600">
                    {format(new Date(item.CM_Update_Date), "MMM d, yy HH:mm")}
                </div>
                <StatusBadge status={item.CM_Status} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-2">
                <div className="flex flex-col items-start gap-1">
                    <span>{item.CM_Task_Name}</span>
                    {item.Task_Image_URL && (
                        <button
                            onClick={() => onPreviewImage(item.Task_Image_URL)}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                        >
                            <Projector size={12} />
                            Task Image
                        </button>
                    )}
                </div>
            </h3>
            <div className="text-xs text-slate-500 mb-3">
                {item.CM_Project_Name}
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-3 text-xs italic text-slate-700">
                <div className="flex flex-col items-start gap-2">
                    <span>"{item.CM_Remarks || "No remarks"}"</span>
                    {item.CM_Image_URL && (
                        <button
                            onClick={() => onPreviewImage(item.CM_Image_URL)}
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 bg-blue-100/50 hover:bg-blue-200/50 px-2 py-1 rounded border border-blue-200 transition-colors cursor-zoom-in font-medium not-italic"
                        >
                            <Projector size={12} />
                            View Update Image
                        </button>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700">{item.Engineer_Name}</span>
                <span className="text-slate-500">{item.CM_Work_Hours ? `${item.CM_Work_Hours} hrs` : ""}</span>
            </div>
        </motion.div>
    );
};

export default function TaskOverviewModal({ isOpen, onClose }) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("tasks");
    const [tasks, setTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProject, setFilterProject] = useState("All");
    const [filterEngineer, setFilterEngineer] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [previewImage, setPreviewImage] = useState(null);

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
            const response = await fetch(`/api/dashboard/today-tasks?startDate=${startStr}&endDate=${endStr}&type=${activeTab}`);
            const result = await response.json();
            if (result.success) {
                if (activeTab === "tasks") {
                    setTasks(result.data);
                } else {
                    setHistory(result.data);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${activeTab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const displayedData = activeTab === "tasks" ? tasks : history;

    const baseFilteredData = displayedData.filter(item => {
        const taskName = item.CM_Task_Name || "";
        const projectName = item.CM_Project_Name || "";
        const engineerName = item.Engineer_Name || "";
        const matchesSearch = taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            projectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = filterProject === "All" || projectName === filterProject;
        const matchesEngineer = filterEngineer === "All" || engineerName === filterEngineer;

        return matchesSearch && matchesProject && matchesEngineer;
    });

    const filteredData = baseFilteredData.filter(item => {
        let matchesStatus = true;
        if (filterStatus !== "All") {
            const status = item.Latest_Status || item.CM_Status || "Pending";
            if (filterStatus === "Pending") matchesStatus = status === "Pending";
            else if (filterStatus === "Completed") matchesStatus = status === "Completed";
            else if (filterStatus === "In Progress") matchesStatus = status === "In Progress";
            else if (filterStatus === "Delayed/Hold") matchesStatus = status === "Delayed" || status === "On Hold";
        }
        return matchesStatus;
    });

    const uniqueProjects = ["All", ...new Set(displayedData.map(t => t.CM_Project_Name).filter(Boolean))];
    const uniqueEngineers = ["All", ...new Set(displayedData.map(t => t.Engineer_Name).filter(Boolean))];

    // Task stats
    // Task stats based on search/project/engineer filter
    const getStatus = (t) => t.Latest_Status || t.CM_Status || "Pending";
    const completedTasks = baseFilteredData.filter(t => getStatus(t) === "Completed").length;
    const inProgressTasks = baseFilteredData.filter(t => getStatus(t) === "In Progress").length;
    const delayedTasks = baseFilteredData.filter(t => getStatus(t) === "Delayed" || getStatus(t) === "On Hold").length;
    const pendingTasks = baseFilteredData.filter(t => getStatus(t) === "Pending").length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-4">
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
                                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                                    <CalendarIcon className="text-white" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Task Overview</h2>
                                    <p className="text-slate-600 text-sm">Viewing {activeTab === 'tasks' ? 'tasks' : 'updates'} from {format(startDate, "MMM d")} to {format(endDate, "MMM d, yyyy")}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar sm:flex-wrap sm:justify-end w-full sm:w-auto">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date();
                                            setStartDate(today);
                                            setEndDate(today);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isToday(startDate) && isToday(endDate)
                                                ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-semibold"
                                                : "text-slate-600 hover:text-slate-800"
                                            }`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const yesterday = new Date();
                                            yesterday.setDate(yesterday.getDate() - 1);
                                            setStartDate(yesterday);
                                            setEndDate(yesterday);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isYesterday(startDate) && isYesterday(endDate)
                                                ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-semibold"
                                                : "text-slate-600 hover:text-slate-800"
                                            }`}
                                    >
                                        Yesterday
                                    </button>
                                </div>

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

                                {/* Task/History Toggle */}
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                                    <button
                                        onClick={() => setActiveTab("tasks")}
                                        className={`flex justify-center items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <ClipboardList size={14} className="sm:w-4 sm:h-4" />
                                        <span>Tasks</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("history");
                                            setStartDate(new Date());
                                            setEndDate(new Date());
                                        }}
                                        className={`flex justify-center items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <History size={14} className="sm:w-4 sm:h-4" />
                                        <span>History</span>
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
                                        onClick={() => setFilterStatus(filterStatus === "All" ? "All" : "All")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "All" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-blue-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-md text-blue-600">
                                            <BarChart3 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Total</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{baseFilteredData.length}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Pending" ? "All" : "Pending")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Pending" ? 'border-slate-500 ring-1 ring-slate-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-slate-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-md text-slate-600">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Pending</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{pendingTasks}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Completed" ? "All" : "Completed")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Completed" ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-emerald-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-md text-emerald-600">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Completed</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{completedTasks}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "In Progress" ? "All" : "In Progress")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "In Progress" ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-blue-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-md text-blue-600">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">In Progress</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{inProgressTasks}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFilterStatus(filterStatus === "Delayed/Hold" ? "All" : "Delayed/Hold")}
                                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-lg border ${filterStatus === "Delayed/Hold" ? 'border-amber-500 ring-1 ring-amber-500 shadow-md' : 'border-slate-200 shadow-sm'} cursor-pointer hover:border-amber-300 transition-all`}
                                    >
                                        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-md text-amber-600">
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-slate-500 hidden sm:block">Delayed/Hold</p>
                                            <p className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{delayedTasks}</p>
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
                                    placeholder={`Search ${activeTab === 'tasks' ? 'tasks' : 'updates'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 text-gray-500 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                                        <Filter size={14} className="text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">Filters</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                        <div className="relative flex-1 sm:w-44 lg:w-56">
                                            <Projector className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <select
                                                value={filterProject}
                                                onChange={(e) => setFilterProject(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-blue-400 transition-all"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.6rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                            >
                                                <option value="All">All Projects</option>
                                                {uniqueProjects.filter(p => p !== "All").map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative flex-1 sm:w-44 lg:w-56">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <select
                                                value={filterEngineer}
                                                onChange={(e) => setFilterEngineer(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-blue-400 transition-all"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.6rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                            >
                                                <option value="All">All Engineers</option>
                                                {uniqueEngineers.filter(e => e !== "All").map(e => (
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
                                    <div className="relative">
                                        <Loader2 className="text-blue-600 animate-spin" size={40} />
                                    </div>
                                    <p className="text-slate-600 font-medium">Fetching {activeTab}...</p>
                                </div>
                            ) : filteredData.length > 0 ? (
                                activeTab === "tasks" ? (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block w-full h-full">
                                            <table className="w-full border-collapse text-sm">
                                                <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-300">
                                                    <tr className="text-left font-semibold text-slate-700">
                                                        <th className="px-3 py-1.5 border-r border-slate-300 w-12 text-center bg-slate-200/50">#</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Task Name</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Project</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Engineer</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300 text-center">Start Date</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300 text-center">Due Date</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300 text-center">Latest Status</th>
                                                        <th className="px-3 py-1.5 text-center">Last Updated</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map((task, idx) => (
                                                        <tr key={task.CM_Task_ID} className="hover:bg-blue-50 border-b border-slate-200 transition-colors">
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-500 bg-slate-50 font-mono text-xs">{idx + 1}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-800 font-medium">
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <span className="text-left text-blue-600 font-semibold">
                                                                        {task.CM_Task_Name}
                                                                    </span>
                                                                    {task.CM_Image_URL && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPreviewImage(task.CM_Image_URL);
                                                                            }}
                                                                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                                                                        >
                                                                            <Projector size={12} />
                                                                            Image
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{task.CM_Project_Name}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{task.Engineer_Name}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-600 whitespace-nowrap">{format(new Date(task.CM_Assign_Date), "dd-MMM-yy")}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-600 whitespace-nowrap">{format(new Date(task.CM_Due_Date), "dd-MMM-yy")}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center"><StatusBadge status={task.Latest_Status} /></td>
                                                            <td className="px-3 py-1.5 text-slate-600 text-[12px] text-center whitespace-nowrap">{task.Latest_Update_Date ? format(new Date(task.Latest_Update_Date), "dd-MMM-yy") : "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Mobile Grid View */}
                                        <div className="block md:hidden p-2">
                                            <div className="grid grid-cols-1 gap-2">
                                                {filteredData.map((task, idx) => (
                                                    <TaskCard
                                                        key={task.CM_Task_ID}
                                                        task={task}
                                                        index={idx}
                                                        onTaskClick={(taskName) => {
                                                            setActiveTab("updates");
                                                            setSearchTerm(taskName);
                                                        }}
                                                        onPreviewImage={setPreviewImage}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block w-full h-full">
                                            <table className="w-full border-collapse text-sm">
                                                <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-300">
                                                    <tr className="text-left font-semibold text-slate-700">
                                                        <th className="px-3 py-1.5 border-r border-slate-300 w-12 text-center bg-slate-200/50">#</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Date & Time</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Task Name</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Project</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Engineer</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300 text-center">Status</th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Update </th>
                                                        <th className="px-3 py-1.5 border-r border-slate-300">Update date </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map((item, idx) => (
                                                        <tr key={item.CM_Update_ID} className="hover:bg-blue-50 border-b border-slate-200 transition-colors">
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-500 bg-slate-50 font-mono text-xs">{idx + 1}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600 whitespace-nowrap">{format(new Date(item.CM_Update_Date), "dd-MMM-yy")}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-800 font-medium">
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <span>{item.CM_Task_Name}</span>
                                                                    {item.Task_Image_URL && (
                                                                        <button
                                                                            onClick={() => setPreviewImage(item.Task_Image_URL)}
                                                                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                                                                        >
                                                                            <Projector size={12} />
                                                                            Task Image
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{item.CM_Project_Name}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{item.Engineer_Name}</td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center"><StatusBadge status={item.CM_Status} /></td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600 text-sm min-w-[250px] max-w-md whitespace-normal break-words" title={item.CM_Remarks}>
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <span>{item.CM_Remarks || "-"}</span>
                                                                    {item.CM_Image_URL && (
                                                                        <button
                                                                            onClick={() => setPreviewImage(item.CM_Image_URL)}
                                                                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 transition-colors cursor-zoom-in mt-1"
                                                                        >
                                                                            <Projector size={12} />
                                                                            View Update Image
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                                                                {format(new Date(item.CM_Uploaded_At), "dd-MMM-yy hh:mm a")}
                                                            </td>                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Mobile Grid View */}
                                        <div className="block md:hidden p-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredData.map((item, idx) => (
                                                    <UpdateCard
                                                        key={item.CM_Update_ID}
                                                        item={item}
                                                        index={idx}
                                                        onPreviewImage={setPreviewImage}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-slate-600 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        {activeTab === 'tasks' ? <ClipboardList className="text-slate-400" size={32} /> : <History className="text-slate-400" size={32} />}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">No {activeTab} found</h3>
                                    <p className="max-w-md">
                                        There are no {activeTab} recorded for this date. Try selecting another date or adjusting your filters.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Image Preview Lightbox */}
                    {previewImage && (
                        <div
                            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
                            onClick={() => setPreviewImage(null)}
                        >
                            <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                            <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}
