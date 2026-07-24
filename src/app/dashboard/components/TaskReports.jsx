"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar as CalendarIcon,
    Search,
    Filter,
    Loader2,
    Projector,
    User,
    ArrowLeft
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isToday, isYesterday } from "date-fns";

export default function TaskReports() {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProject, setFilterProject] = useState("All");
    const [filterEngineer, setFilterEngineer] = useState("All");
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const startStr = format(startDate, "yyyy-MM-dd");
            const endStr = format(endDate, "yyyy-MM-dd");
            const response = await fetch(`/api/dashboard/today-tasks?startDate=${startStr}&endDate=${endStr}&type=history`);
            const result = await response.json();
            if (result.success) {
                setHistory(result.data);
            }
        } catch (error) {
            console.error(`Error fetching updates:`, error);
        } finally {
            setLoading(false);
        }
    };

    const displayedData = history;

    const filteredData = displayedData.filter(item => {
        const taskName = item.CM_Task_Name || "";
        const projectName = item.CM_Project_Name || "";
        const engineerName = item.Engineer_Name || "";
        const remarks = item.CM_Remarks || "";

        const matchesSearch = taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
            engineerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProject = filterProject === "All" || projectName === filterProject;
        const matchesEngineer = filterEngineer === "All" || engineerName === filterEngineer;

        return matchesSearch && matchesProject && matchesEngineer;
    });

    const uniqueProjects = ["All", ...new Set(displayedData.map(t => t.CM_Project_Name).filter(Boolean))];
    const uniqueEngineers = ["All", ...new Set(displayedData.map(t => t.Engineer_Name).filter(Boolean))];

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden border border-slate-200 shadow-sm">
            {/* Header & Date Filters */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Task Reports</h2>
                    <p className="text-slate-600 text-sm">View and filter daily task updates</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar sm:flex-wrap w-full lg:w-auto">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                setStartDate(today);
                                setEndDate(today);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isToday(startDate) && isToday(endDate)
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
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isYesterday(startDate) && isYesterday(endDate)
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
                            customInput={
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 transition-colors whitespace-nowrap">
                                    <CalendarIcon size={14} className="text-blue-500" />
                                    <span>{format(startDate, "MMM d, yyyy")}</span>
                                </button>
                            }
                        />
                        <span className="text-slate-400 text-sm font-medium">to</span>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            customInput={
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 transition-colors whitespace-nowrap">
                                    <CalendarIcon size={14} className="text-blue-500" />
                                    <span>{format(endDate, "MMM d, yyyy")}</span>
                                </button>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3 justify-between">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search updates by task, project, engineer or remarks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                            <Filter size={14} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:block">Filters</span>
                        </div>

                        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                            <div className="relative flex-1 sm:w-48">
                                <Projector className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-blue-400 transition-all"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    <option value="All">All Projects</option>
                                    {uniqueProjects.filter(p => p !== "All").map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative flex-1 sm:w-48">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select
                                    value={filterEngineer}
                                    onChange={(e) => setFilterEngineer(e.target.value)}
                                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-blue-400 transition-all"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
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
            <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
                        <Loader2 className="text-blue-600 animate-spin" size={36} />
                        <p className="text-slate-600 font-medium">Fetching Task Reports...</p>
                    </div>
                ) : filteredData.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {filteredData.map((item, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                                key={item.CM_Update_ID || idx}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Header: Engineer Name & Project */}
                                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-blue-600" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engineer:</span>
                                        <span className="text-sm font-bold text-slate-800">{item.Engineer_Name || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Projector size={16} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project:</span>
                                        <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">{item.CM_Project_Name || "-"}</span>
                                    </div>
                                </div>

                                <div className="p-2 space-y-3">
                                    {/* Task & Dates */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Task Name</span>
                                            <span className="text-sm font-semibold text-slate-900">{item.CM_Task_Name || "-"}</span>
                                        </div>
                                        <div className="sm:text-right">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Task Dates</span>
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 inline-block">
                                                {item.CM_Assign_Date ? format(new Date(item.CM_Assign_Date), "MMM d, yyyy") : "-"} to {item.CM_Due_Date ? format(new Date(item.CM_Due_Date), "MMM d, yyyy") : "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Update Remark & Update Date */}
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Update</span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                Update Date: {item.CM_Uploaded_At ? format(new Date(item.CM_Uploaded_At), "MMM d, yyyy h:mm a") : (item.CM_Update_Date ? format(new Date(item.CM_Update_Date), "MMM d, yyyy h:mm a") : "-")}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-800 leading-relaxed">
                                            {item.CM_Remarks || "No remarks provided."}
                                        </div>
                                        {(item.CM_Image_URL || item.Task_Image_URL) && (
                                            <div className="mt-2.5">
                                                <button
                                                    onClick={() => setPreviewImage(item.CM_Image_URL || item.Task_Image_URL)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                                                >
                                                    <Projector size={14} />
                                                    View Attached Image
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                        <Search size={36} className="text-slate-300" />
                        <p className="font-medium text-lg text-slate-600">No task reports found</p>
                        <p className="text-sm">Try adjusting your filters or search term</p>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-slate-200 transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-lg shadow-2xl bg-slate-900/50"
                            style={{ maxHeight: '80vh' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
