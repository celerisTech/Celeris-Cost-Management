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

const TaskCard = ({ task, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-base">
                        {task.CM_Task_Name}
                    </h3>
                    <StatusBadge status={task.Latest_Status} />
                </div>
                
                <div className="flex items-center text-xs text-slate-500 mb-4">
                    <span className="flex items-center">
                        <ChevronRight size={14} className="text-slate-400 mr-1" />
                        {task.CM_Milestone_Name || "No Milestone"}
                    </span>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-4">
                    <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 border border-slate-200">
                        <Projector size={14} className="text-blue-500" />
                        {task.CM_Project_Name}
                    </div>
                    <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 border border-slate-200">
                        <User size={14} className="text-indigo-500" />
                        {task.Engineer_Name}
                    </div>
                </div>
            </div>
            
            <div className="border-t border-slate-100 px-5 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase font-semibold text-slate-500 mb-1">Start Date</span>
                        <div className="flex items-center">
                            <CalendarIcon size={14} className="text-emerald-500 mr-2" />
                            <span className="text-sm font-medium text-slate-700">{format(new Date(task.CM_Assign_Date), "MMM d")}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase font-semibold text-slate-500 mb-1">Due Date</span>
                        <div className="flex items-center">
                            <CalendarClock size={14} className="text-rose-500 mr-2" />
                            <span className="text-sm font-medium text-slate-700">{format(new Date(task.CM_Due_Date), "MMM d")}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {task.Latest_Update_Date && (
                <div className="border-t border-slate-100 px-5 py-2">
                    <p className="text-xs text-slate-500">
                        Updated: {format(new Date(task.Latest_Update_Date), "MMM d, HH:mm")}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

const UpdateCard = ({ item, index }) => {
    const getTimeLabel = (dateStr) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        if (isThisWeek(date)) return format(date, 'EEEE');
        return format(date, 'MMM d');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-3 border-b border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        <span className="text-xs font-medium text-slate-600">{getTimeLabel(item.CM_Update_Date)} at {format(new Date(item.CM_Update_Date), "HH:mm")}</span>
                    </div>
                    <StatusBadge status={item.CM_Status} />
                </div>
            </div>
            
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-base">
                        {item.CM_Task_Name}
                    </h3>
                </div>
                
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 border border-slate-200 mb-4 w-fit">
                    <Projector size={14} className="text-blue-500" />
                    {item.CM_Project_Name}
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <p className="text-slate-700 text-sm italic">
                        "{item.CM_Remarks || "No remarks provided"}"
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
                        <User size={14} className="text-indigo-600" />
                    </div>
                    <div className="text-sm font-medium text-slate-800">{item.Engineer_Name}</div>
                </div>
            </div>
        </motion.div>
    );
};

export default function TaskOverviewModal({ isOpen, onClose }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("tasks");
    const [tasks, setTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProject, setFilterProject] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, selectedDate, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const response = await fetch(`/api/dashboard/today-tasks?date=${dateStr}&type=${activeTab}`);
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

    const filteredData = displayedData.filter(item => {
        const taskName = item.CM_Task_Name || "";
        const projectName = item.CM_Project_Name || "";
        const matchesSearch = taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            projectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = filterProject === "All" || projectName === filterProject;
        return matchesSearch && matchesProject;
    });

    const uniqueProjects = ["All", ...new Set(displayedData.map(t => t.CM_Project_Name))];

    // Task stats
    const completedTasks = displayedData.filter(t => t.Latest_Status === "Completed").length;
    const inProgressTasks = displayedData.filter(t => t.Latest_Status === "In Progress").length;
    const delayedTasks = displayedData.filter(t => t.Latest_Status === "Delayed" || t.Latest_Status === "On Hold").length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
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
                        className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-blue-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                                    <CalendarIcon className="text-white" size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Task Overview</h2>
                                    <p className="text-slate-600 text-sm">Viewing {activeTab === 'tasks' ? 'tasks' : 'updates'} for {format(selectedDate, "MMMM d, yyyy")}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap justify-end">
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setActiveTab("tasks")}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <ClipboardList size={16} />
                                        <span>Active Tasks</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("history")}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        <History size={16} />
                                        <span>Update History</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        customInput={
                                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 hover:shadow transition-colors">
                                                <CalendarIcon size={16} className="text-blue-500" />
                                                <span>Change Date</span>
                                            </button>
                                        }
                                    />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                        <BarChart3 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="font-semibold text-slate-800">{filteredData.length}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="p-2 bg-emerald-100 rounded-md text-emerald-600">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Completed</p>
                                        <p className="font-semibold text-slate-800">{completedTasks}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">In Progress</p>
                                        <p className="font-semibold text-slate-800">{inProgressTasks}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="p-2 bg-amber-100 rounded-md text-amber-600">
                                        <AlertCircle size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Delayed/Hold</p>
                                        <p className="font-semibold text-slate-800">{delayedTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/20 flex flex-wrap items-center gap-4 justify-between">
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

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-slate-500" />
                                    <select
                                        value={filterProject}
                                        onChange={(e) => setFilterProject(e.target.value)}
                                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer"
                                    >
                                        {uniqueProjects.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden">
                                    <button 
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <ArrowUpRight size={18} />
                                    </button>
                                    <button 
                                        className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <ArrowDownLeft size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                    <div className="relative">
                                        <Loader2 className="text-blue-600 animate-spin" size={40} />
                                    </div>
                                    <p className="text-slate-600 font-medium">Fetching {activeTab}...</p>
                                </div>
                            ) : filteredData.length > 0 ? (
                                activeTab === "tasks" ? (
                                    viewMode === 'grid' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredData.map((task, idx) => (
                                                <TaskCard key={task.CM_Task_ID} task={task} index={idx} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                                            <table className="w-full border-collapse">
                                                <thead className="bg-slate-50">
                                                    <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        <th className="px-5 py-3 border-b border-slate-200">Task & Milestone</th>
                                                        <th className="px-4 py-3 border-b border-slate-200">Project</th>
                                                        <th className="px-4 py-3 border-b border-slate-200">Engineer</th>
                                                        <th className="px-4 py-3 border-b border-slate-200">Timeline</th>
                                                        <th className="px-4 py-3 border-b border-slate-200">Latest Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map((task, idx) => (
                                                        <motion.tr
                                                            key={task.CM_Task_ID}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.04 }}
                                                            className="hover:bg-slate-50 transition-colors"
                                                        >
                                                            <td className="px-5 py-4 border-b border-slate-100">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-slate-800 text-sm hover:text-blue-600 transition-colors">
                                                                        {task.CM_Task_Name}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                                        <ChevronRight size={12} className="text-slate-400" />
                                                                        {task.CM_Milestone_Name || "No Milestone"}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 border-b border-slate-100">
                                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2">
                                                                    <Projector size={12} className="text-blue-500" />
                                                                    {task.CM_Project_Name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 border-b border-slate-100">
                                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2">
                                                                    <User size={12} className="text-blue-500" />
                                                                    {task.Engineer_Name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 border-b border-slate-100">
                                                                <div className="flex flex-col gap-1 text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-10 text-slate-500 font-medium">Start:</span>
                                                                        <span className="text-slate-800 font-medium">{format(new Date(task.CM_Assign_Date), "MMM d")}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-10 text-slate-500 font-medium">Due:</span>
                                                                        <span className="text-slate-800 font-medium">{format(new Date(task.CM_Due_Date), "MMM d")}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 border-b border-slate-100">
                                                                <StatusBadge status={task.Latest_Status} />
                                                                {task.Latest_Update_Date && (
                                                                    <p className="text-[10px] text-slate-500 mt-1">
                                                                        Updated: {format(new Date(task.Latest_Update_Date), "MMM d, HH:mm")}
                                                                    </p>
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                ) : (
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-5"}>
                                        {filteredData.map((item, idx) => (
                                            viewMode === 'grid' ? 
                                                <UpdateCard key={item.CM_Update_ID} item={item} index={idx} /> :
                                                <motion.div
                                                    key={item.CM_Update_ID}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className="relative pl-8 pb-6 border-l-2 border-slate-200 last:pb-0"
                                                >
                                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>

                                                    <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
                                                        <div className="flex flex-wrap items-start gap-2 mb-3">
                                                            <h4 className="font-semibold text-slate-800 text-base">{item.CM_Task_Name}</h4>
                                                            <span className="text-slate-300 mx-1">|</span>
                                                            <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 border border-slate-200">
                                                                <Projector size={12} className="text-blue-500" />
                                                                {item.CM_Project_Name}
                                                            </span>
                                                            <StatusBadge status={item.CM_Status} />
                                                        </div>
                                                        <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                                                            "{item.CM_Remarks || "No remarks provided"}"
                                                        </p>

                                                        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-between">
                                                            <div className="flex items-center gap-3 text-slate-600">
                                                                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                                                    <User size={14} className="text-indigo-600" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Engineer</span>
                                                                    <div className="text-sm font-medium text-slate-800">{item.Engineer_Name}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {format(new Date(item.CM_Update_Date), "MMMM d, yyyy 'at' HH:mm")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                        ))}
                                    </div>
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

                        {/* Footer */}
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
                            <span className="font-medium">Task Dashboard • {format(selectedDate, "MMMM d, yyyy")}</span>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Active Session
                                </span>
                                <span>{format(new Date(), "HH:mm:ss")}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
