"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { motion } from "framer-motion";
import {
    FiCalendar,
    FiSearch,
    FiUserCheck,
    FiUserX,
    FiUsers,
    FiAlertCircle,
    FiBriefcase,
    FiFilter,
    FiChevronLeft,
    FiChevronRight
} from "react-icons/fi";
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    subDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths
} from "date-fns";
import { ArrowLeft } from 'lucide-react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuthStore } from "../../store/useAuthScreenStore";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CloudDownload } from "lucide-react";


export default function DayWiseAttendanceReport() {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportType, setReportType] = useState('day'); // 'day', 'week', 'month'
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [showMenu, setShowMenu] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState("All");
    const router = useRouter();

    // Handle initial type filter for Engineer role
    useEffect(() => {
        if (user?.CM_Role_ID === "ROL000003") {
            setTypeFilter("All");
        }
    }, [user]);

    // Fetch projects for filter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects");
                if (res.ok) {
                    const data = await res.json();
                    setProjects(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        fetchProjects();
    }, []);

    const navigateDate = (direction) => {
        let newDate;
        if (direction === 'prev') {
            if (reportType === 'day') newDate = subDays(selectedDate, 1);
            else if (reportType === 'week') newDate = subWeeks(selectedDate, 1);
            else if (reportType === 'month') newDate = subMonths(selectedDate, 1);
        } else {
            if (reportType === 'day') newDate = addDays(selectedDate, 1);
            else if (reportType === 'week') newDate = addWeeks(selectedDate, 1);
            else if (reportType === 'month') newDate = addMonths(selectedDate, 1);
        }

        // Prevent moving past today
        if (newDate > new Date()) {
            newDate = new Date();
        }
        setSelectedDate(newDate);
    };

    const fetchReport = async (date, type = reportType) => {
        try {
            setLoading(true);
            const formattedDate = format(date, "yyyy-MM-dd");
            const res = await fetch(`/api/attendance/day-wise-report?date=${formattedDate}&reportType=${type}`);
            const data = await res.json();

            if (data.success) {
                setReportData(data.data);
            } else {
                console.error("Failed to fetch report:", data.error);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(selectedDate, reportType);
    }, [selectedDate, reportType]);
    const exportToExcel = () => {
        if (!filteredEmployees.length) return;

        let worksheetData;
        if (reportType === 'day') {
            worksheetData = filteredEmployees.map((emp, index) => ({
                "S.No": index + 1,
                "Employee Name": emp.fullName,
                "Employee Code": emp.laborCode,
                "Project": emp.projectName || "-",
                "Type": emp.type,
                "Status": emp.status,
                "In Time": emp.inTime || "-",
                "Out Time": emp.outTime || "-",
                "Total Hours": emp.totalHours || "-",
                "Remarks": emp.remarks || "-"
            }));
        } else if (reportType === 'week') {
            worksheetData = filteredEmployees.map((emp, index) => ({
                "S.No": index + 1,
                "Employee Name": emp.fullName,
                "Employee Code": emp.laborCode,
                "Type": emp.type,
                "Present Days": emp.weekSummary?.present || 0,
                "Absent Days": emp.weekSummary?.absent || 0,
                "Holiday": emp.weekSummary?.holiday || 0,
                "On-Duty": emp.weekSummary?.onDuty || 0,
                "Half-Day": emp.weekSummary?.halfDay || 0,
                "Week-Off": emp.weekSummary?.weekOff || 0,
                "Total Hours": emp.weekSummary?.totalHours || 0
            }));
        } else {
            worksheetData = filteredEmployees.map((emp, index) => ({
                "S.No": index + 1,
                "Employee Name": emp.fullName,
                "Employee Code": emp.laborCode,
                "Type": emp.type,
                "Present Days": emp.monthSummary?.presentDays || 0,
                "Absent Days": emp.monthSummary?.absentDays || 0,
                "Holiday": emp.monthSummary?.holidayDays || 0,
                "On-Duty": emp.monthSummary?.onDutyDays || 0,
                "Half-Day": emp.monthSummary?.halfDays || 0,
                "Week-Off": emp.monthSummary?.weekOffDays || 0,
                "Total Hours": emp.monthSummary?.totalHours || 0,
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const file = new Blob([excelBuffer], {
            type: "application/octet-stream",
        });

        const fileName = reportType === 'day'
            ? `Attendance_${format(selectedDate, "dd-MM-yyyy")}.xlsx`
            : reportType === 'week'
                ? `Attendance_Week_${format(selectedDate, "dd-MM-yyyy")}.xlsx`
                : `Attendance_${format(selectedDate, "MMM-yyyy")}.xlsx`;

        saveAs(file, fileName);
    };
    const exportToPDF = () => {
        if (!filteredEmployees.length) return;

        const doc = new jsPDF("l", "mm", "a4");

        let title = "";
        let tableColumn = [];
        let tableRows = [];

        if (reportType === "day") {
            title = `Day Wise Attendance Report - ${format(selectedDate, "dd MMM yyyy")}`;

            tableColumn = [
                "S.No",
                "Employee Name",
                "Code",
                "Project",
                "Type",
                "Status",
                "In Time",
                "Out Time",
                "Total Hours",
                "Remarks"
            ];

            tableRows = filteredEmployees.map((emp, index) => [
                index + 1,
                emp.fullName,
                emp.laborCode,
                emp.projectName || "-",
                emp.type,
                emp.status,
                emp.inTime || "-",
                emp.outTime || "-",
                emp.totalHours || "-",
                emp.remarks || "-"
            ]);

        } else if (reportType === "week") {
            title = `Weekly Attendance Report - ${format(selectedDate, "dd MMM yyyy")}`;

            tableColumn = [
                "S.No",
                "Employee Name",
                "Code",
                "Type",
                "Present Days",
                "Absent Days",
                "Holiday",
                "On-Duty",
                "Half-Day",
                "Week-Off",
                "Total Hours"
            ];

            tableRows = filteredEmployees.map((emp, index) => [
                index + 1,
                emp.fullName,
                emp.laborCode,
                emp.type,
                emp.weekSummary?.present || 0,
                emp.weekSummary?.absent || 0,
                emp.weekSummary?.holiday || 0,
                emp.weekSummary?.onDuty || 0,
                emp.weekSummary?.halfDay || 0,
                emp.weekSummary?.weekOff || 0,
                emp.weekSummary?.totalHours || 0
            ]);

        } else {
            title = `Monthly Attendance Report - ${format(selectedDate, "MMM yyyy")}`;

            tableColumn = [
                "S.No",
                "Employee Name",
                "Code",
                "Type",
                "Present Days",
                "Absent Days",
                "Holiday",
                "On-Duty",
                "Half-Day",
                "Week-Off",
                "Total Hours"
            ];

            tableRows = filteredEmployees.map((emp, index) => [
                index + 1,
                emp.fullName,
                emp.laborCode,
                emp.type,
                emp.monthSummary?.presentDays || 0,
                emp.monthSummary?.absentDays || 0,
                emp.monthSummary?.holidayDays || 0,
                emp.monthSummary?.onDutyDays || 0,
                emp.monthSummary?.halfDays || 0,
                emp.monthSummary?.weekOffDays || 0,
                emp.monthSummary?.totalHours || 0
            ]);
        }

        doc.setFontSize(14);
        doc.text(title, 14, 15);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 22,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
            theme: "striped",
        });

        const fileName =
            reportType === "day"
                ? `Attendance_${format(selectedDate, "dd-MM-yyyy")}.pdf`
                : reportType === "week"
                    ? `Attendance_Week_${format(selectedDate, "dd-MM-yyyy")}.pdf`
                    : `Attendance_${format(selectedDate, "MMM-yyyy")}.pdf`;

        doc.save(fileName);
    };



    const getStatusColor = (status) => {
        switch (status) {
            case "Present": return "text-green-600 bg-green-50 border-green-200";
            case "Absent": return "text-red-600 bg-red-50 border-red-200";
            case "Holiday": return "text-purple-600 bg-purple-50 border-purple-200";
            case "Half-Day": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "Holiday": return "text-purple-600 bg-purple-50 border-purple-200";
            case "Week-Off": return "text-gray-600 bg-gray-50 border-gray-200";
            case "On-Duty": return "text-blue-600 bg-blue-50 border-blue-200";
            default: return "text-gray-500 bg-gray-50 border-gray-200";
        }
    };

    const handleEditClick = (emp) => {
        setEditData({
            ...emp,
            date: format(selectedDate, "yyyy-MM-dd")
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateAttendance = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/attendance/day-wise-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    laborTypeId: editData.laborTypeId,
                    date: editData.date,
                    status: editData.status,
                    inTime: editData.inTime,
                    outTime: editData.outTime,
                    totalHours: editData.totalHours,
                    remarks: editData.remarks,
                    companyId: editData.companyId,
                    projectId: editData.projectId,
                    updatedBy: user?.CM_Full_Name || "System"
                })
            });

            const result = await res.json();
            if (result.success) {
                setIsEditModalOpen(false);
                fetchReport(selectedDate, reportType);
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error updating attendance:", error);
            alert("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = React.useMemo(() => {
        if (!reportData?.details) return [];

        const searchString = searchTerm.toLowerCase();
        const filtered = reportData.details.filter(emp => {
            // Role restriction for Engineer
            if (user?.CM_Role_ID === "ROL000003" && emp.type === "Office") return false;

            const matchesSearch =
                emp.fullName.toLowerCase().includes(searchString) ||
                emp.laborCode.toLowerCase().includes(searchString) ||
                emp.laborTypeId.toLowerCase().includes(searchString);

            // For day view, filter by status
            let matchesStatus = true;
            if (reportType === 'day') {
                matchesStatus = statusFilter === "All" || emp.status === statusFilter;
            }

            const matchesType = typeFilter === "All" || emp.type === typeFilter;

            // Project Filter
            let matchesProject = true;
            if (projectFilter !== "All") {
                if (reportType === 'day') {
                    matchesProject = emp.projectId === projectFilter;
                } else if (reportType === 'week') {
                    matchesProject = emp.days?.some(day => day.projectId === projectFilter);
                } else if (reportType === 'month') {
                    matchesProject = emp.dailyData?.some(day => day.projectId === projectFilter);
                }
            }

            return matchesSearch && matchesStatus && matchesType && matchesProject;
        });

        // Sort by Type: Office, Permanent, Temporary, Contract, Labor
        const typeOrder = {
            "Office": 1,
            "Permanent": 2,
            "Temporary": 3,
            "Contract": 4,
            "Labor": 5
        };

        return [...filtered].sort((a, b) => {
            // Group by project if "All" is selected
            if (projectFilter === "All") {
                const projectA = a.projectName || "";
                const projectB = b.projectName || "";
                if (projectA !== projectB) return projectA.localeCompare(projectB);
            }

            const orderA = typeOrder[a.type] || 99;
            const orderB = typeOrder[b.type] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.fullName.localeCompare(b.fullName);
        });
    }, [reportData, searchTerm, statusFilter, typeFilter, reportType, projectFilter, user]);

    // Calculate summary based on current role and type filter (ignore search and status for stats)
    const stats = React.useMemo(() => {
        if (!reportData?.details) return { total: 0, present: 0, absent: 0, holiday: 0, halfDay: 0, onDuty: 0, weekOff: 0 };

        const relevantDetails = reportData.details.filter(emp => {
            // Role restriction
            if (user?.CM_Role_ID === "ROL000003" && emp.type === "Office") return false;
            // Type Filter restriction
            if (typeFilter !== "All" && emp.type !== typeFilter) return false;

            // Project Filter restriction
            if (projectFilter !== "All") {
                if (reportType === 'day') {
                    if (emp.projectId !== projectFilter) return false;
                } else if (reportType === 'week') {
                    if (!emp.days?.some(day => day.projectId === projectFilter)) return false;
                } else if (reportType === 'month') {
                    if (!emp.dailyData?.some(day => day.projectId === projectFilter)) return false;
                }
            }

            return true;
        });

        return {
            total: relevantDetails.length,
            present: relevantDetails.filter(r => r.status === 'Present').length,
            absent: relevantDetails.filter(r => r.status === 'Absent').length,
            holiday: relevantDetails.filter(r => r.status === 'Holiday').length,
            halfDay: relevantDetails.filter(r => r.status === 'Half-Day').length,
            onDuty: relevantDetails.filter(r => r.status === 'On-Duty').length,
            weekOff: relevantDetails.filter(r => r.status === 'Week-Off').length,
        };
    }, [reportData, user, typeFilter, projectFilter, reportType]);

    const weekDates = React.useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 6 });
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }, [selectedDate]);

    const toggleRow = (id) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    const getStatusAbbreviation = (status) => {
        switch (status) {
            case "Present": return "P";
            case "Absent": return "A";
            case "Holiday": return "H";
            case "Leave": return "L";
            case "Half-Day": return "HD";
            case "On-Duty": return "OD";
            case "Week-Off": return "W";
            default: return "-";
        }
    };

    const getMiniStatusColor = (status) => {
        switch (status) {
            case "Present": return "bg-green-100 text-green-700 border-green-200";
            case "Absent": return "bg-red-100 text-red-700 border-red-200";
            case "Holiday": return "bg-purple-100 text-purple-700 border-purple-200";
            case "Leave": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Half-Day": return "bg-yellow-50 text-yellow-600 border-yellow-100";
            case "On-Duty": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Week-Off": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-50 text-gray-400 border-gray-100";
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Navbar />

            <div className="flex-1 overflow-y-auto p-2 sm:p-2 lg:p-2">
                <div className="max-w-auto mx-auto space-y-6">

                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4 bg-white p-2"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <button
                                        onClick={() => router.push('/labors')}
                                        className="flex items-center p-3 text-gray-700 bg-gray-300 hover:bg-gray-300 rounded-full transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <FiBriefcase className="text-blue-600 sm:w-7 sm:h-7" />
                                        <span>{reportType === 'day' ? 'Day-Wise' : reportType === 'week' ? 'Weekly' : 'Monthly'} Attendance</span>
                                    </div>
                                </h1>
                            </div>

                            <div className="flex flex-col items-end gap-2 w-full">

                                {/* Top Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">

                                    {/* View Type Selector */}
                                    <div className="flex items-center bg-gray-100 p-1 rounded-md border border-gray-200 w-full sm:w-auto justify-between sm:justify-start">
                                        {['day', 'week', 'month'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setReportType(type)}
                                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${reportType === type
                                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Date Picker & Navigation */}
                                    <div className="flex items-center justify-between sm:justify-start gap-1 w-full sm:w-auto">

                                        <button
                                            onClick={() => navigateDate('prev')}
                                            className="p-2 text-gray-500 hover:text-blue-600 bg-white border border-blue-100 rounded-md shadow-sm hover:border-blue-300 transition-all active:scale-95"
                                        >
                                            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>

                                        <div className="relative w-full sm:w-[160px]">
                                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />

                                            <ReactDatePicker
                                                selected={selectedDate}
                                                onChange={(date) => setSelectedDate(date)}
                                                className="w-full pl-10 pr-2 py-2 text-xs sm:text-sm font-bold text-blue-800 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm cursor-pointer bg-white hover:border-blue-300 transition-colors text-center"
                                                dateFormat={reportType === 'month' ? 'MMM yyyy' : 'dd MMM yyyy'}
                                                showMonthYearPicker={reportType === 'month'}
                                                maxDate={new Date()}
                                            />
                                        </div>

                                        <button
                                            onClick={() => navigateDate('next')}
                                            disabled={format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                                            className={`p-2 border rounded-md shadow-sm transition-all active:scale-95 ${format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')
                                                    ? 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
                                                    : 'text-gray-500 hover:text-blue-600 bg-white border-blue-100 hover:border-blue-300'
                                                }`}
                                        >
                                            <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Period Text */}
                                {reportData?.date && (
                                    <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium text-right w-full sm:w-auto">
                                        Period: <span className="text-blue-600">{reportData.date}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="Total Employees"
                            value={stats.total}
                            icon={<FiUsers />}
                            color="blue"
                            isLoading={loading}
                        />
                        <StatsCard
                            title="Present"
                            value={stats.present}
                            icon={<FiUserCheck />}
                            color="green"
                            isLoading={loading}
                        />
                        <StatsCard
                            title="Absent"
                            value={stats.absent}
                            icon={<FiUserX />}
                            color="red"
                            isLoading={loading}
                        />
                        <StatsCard
                            title="Holidays/Other"
                            value={
                                stats.halfDay +
                                stats.onDuty +
                                stats.holiday +
                                stats.weekOff
                            }
                            icon={<FiAlertCircle />}
                            color="orange"
                            isLoading={loading}
                        />
                    </div>

                    {/* Employee List Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white overflow-hidden mb-15"
                    >
                        {/* Table Controls */}
                        <div className="p-2 sm:p-3 border-b border-gray-100">
                            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

                                {/* Search */}
                                <div className="relative w-full lg:max-w-md">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-black border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    />
                                </div>

                                {/* Right Controls */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">

                                    {/* Project Filter */}
                                    <div className="flex items-center gap-2 w-full text-black sm:w-auto">
                                        <select
                                            value={projectFilter}
                                            onChange={(e) => setProjectFilter(e.target.value)}
                                            className="w-full sm:w-auto px-4 py-3 rounded-lg border border-blue-500 bg-white text-sm font-medium"
                                        >
                                            <option value="All">All Projects</option>
                                            {projects.map(project => (
                                                <option key={project.CM_Project_ID} value={project.CM_Project_ID}>
                                                    {project.CM_Project_Name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Employee Type */}
                                    <div className="flex items-center gap-2 w-full text-black sm:w-auto">
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full sm:w-auto px-4 py-3 rounded-lg border border-blue-500 bg-white text-sm font-medium"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Labor">Labor</option>
                                            <option value="Temporary">Temporary</option>
                                            <option value="Permanent">Permanent</option>
                                            <option value="Contract">Contract</option>
                                            {user?.CM_Role_ID !== "ROL000003" && <option value="Office">Office</option>}
                                        </select>
                                    </div>

                                    {/* Status Pills */}
                                    {reportType === "day" && (
                                        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
                                            {[
                                                { label: "All", dot: "bg-gray-400" },
                                                { label: "Present", dot: "bg-green-500" },
                                                { label: "Absent", dot: "bg-red-500" },
                                            ].map((item) => {
                                                const isActive = statusFilter === item.label;

                                                return (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => setStatusFilter(item.label)}
                                                        className={`
                                                                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap
                                                                border transition-all duration-200
                                                                ${isActive
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                                            }
                                                                 `}
                                                    >
                                                        <span
                                                            className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-white" : item.dot
                                                                }`}
                                                        />
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Download Menu */}
                                    <div className="relative w-full sm:w-auto">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            disabled={isExporting}
                                            className="flex items-center gap-2 px-3 py-3 bg-green-500 text-white rounded-full shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full justify-center sm:w-auto"

                                        > <CloudDownload className="w-4 h-4" />
                                        </button>

                                        {/* Dropdown */}
                                        {showMenu && (
                                            <div className="absolute right-0 mt-2 w-full sm:w-56 origin-top-right bg-white border border-green-500 rounded-xl shadow-lg ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                                                <div className="p-2">
                                                    {/* Excel Download */}
                                                    <button
                                                        onClick={() => {
                                                            setShowMenu(false);
                                                            exportToExcel();
                                                        }}
                                                        disabled={isExporting} className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group mb-1"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Download Excel</div>
                                                        </div>
                                                    </button>

                                                    {/* PDF Download */}
                                                    <button
                                                        onClick={() => {
                                                            setShowMenu(false);
                                                            exportToPDF();
                                                        }}
                                                        disabled={isExporting} className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Download PDF</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {reportType === 'day' ? (
                                // Day View Table
                                <table className="w-full text-left border-collapse border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-blue-800 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                            <th className="px-6 py-4 border-r border-gray-200">Employee</th>
                                            <th className="px-6 py-4 border-r border-gray-200">Type</th>
                                            <th className="px-6 py-4 border-r border-gray-200">Status</th>
                                            <th className="px-6 py-4 border-r border-gray-200">In Time</th>
                                            <th className="px-6 py-4 border-r border-gray-200">Out Time</th>
                                            <th className="px-6 py-4 text-center border-r border-gray-200">Hours</th>
                                            <th className="px-6 py-4 border-r border-gray-200">Remarks</th>
                                            <th className="px-6 py-4 text-center border-r border-gray-200">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                    Loading data...
                                                </td>
                                            </tr>
                                        ) : filteredEmployees.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                                                    No employees found matching your criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEmployees.map((emp) => (
                                                <tr key={emp.laborTypeId} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-6 py-4 border-r border-gray-200">
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{emp.fullName}</p>
                                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{emp.laborCode}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-200">
                                                        <p className="text-sm text-gray-600">{emp.type || "—"}</p>
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-200">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(emp.status)}`}>
                                                            {emp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200">
                                                        {emp.inTime || <span className="text-gray-300">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200">
                                                        {emp.outTime || <span className="text-gray-300">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center border-r border-gray-200">
                                                        {emp.totalHours ? (
                                                            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                                {emp.totalHours}h
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate border-r border-gray-200">
                                                        {emp.remarks || <span className="text-gray-300 italic">No detailed remarks</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center border-r border-gray-200">
                                                        {(() => {
                                                            const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                                                            const isEngineer = user?.CM_Role_ID === "ROL000003";
                                                            const isOwnerOrManager = user?.CM_Role_ID === "ROL000001" || user?.CM_Role_ID === "ROL000002";
                                                            const canEdit = isOwnerOrManager || (isEngineer && isToday);

                                                            return canEdit ? (
                                                                <button
                                                                    onClick={() => handleEditClick(emp)}
                                                                    className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors shadow-sm active:scale-95"
                                                                    title="Edit Attendance"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                            ) : (
                                                                <div className="p-2 text-gray-300 cursor-not-allowed" title="Past dates can only be edited by Owner/Manager">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            ) : reportType === 'week' ? (
                                // Week View Table
                                <table className="w-full text-left border-collapse text-sm border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-blue-800 text-xs uppercase tracking-wider font-semibold">
                                            <th className="px-4 py-3 sticky left-0 bg-gray-50/80 z-10 border border-gray-200">Employee</th>
                                            <th className="px-4 py-3 border border-gray-200">Type</th>
                                            {weekDates.map((date, idx) => (
                                                <th key={idx} className="px-3 py-3 text-center border border-gray-200">
                                                    <div className="flex flex-col items-center">
                                                        <span>{format(date, 'eee')}</span>
                                                        <span className="text-[10px] opacity-60 font-medium">{format(date, 'dd/MM')}</span>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-center bg-blue-50 border border-gray-200">Total Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                    Loading data...
                                                </td>
                                            </tr>
                                        ) : filteredEmployees.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                                                    No employees found matching your criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEmployees.map((emp) => (
                                                <tr key={emp.laborTypeId} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30">
                                                        <div>
                                                            <p className="font-semibold text-gray-800 text-xs">{emp.fullName}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{emp.laborCode}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 border border-gray-200">{emp.type}</td>
                                                    {emp.days?.map((day, idx) => (
                                                        <td key={idx} className="px-2 py-3 text-center border border-gray-200">
                                                            <div className="flex flex-col items-center gap-1" title={day.projectName || "No Project"}>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${day.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                                    day.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {day.status === 'Present' ? 'P' : day.status === 'Absent' ? 'A' : day.status.charAt(0)}
                                                                </span>
                                                                {day.totalHours > 0 && (
                                                                    <span className="text-xs text-gray-500">{day.totalHours}h</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-center bg-blue-50 font-semibold text-blue-700 border border-gray-200">
                                                        {emp.weekSummary?.totalHours || 0}h
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                // Month View Table
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-blue-800 text-xs uppercase tracking-wider font-semibold">
                                            <th className="px-4 py-4 w-10 border border-gray-200"></th>
                                            <th className="px-6 py-4 border border-gray-200">Employee</th>
                                            <th className="px-6 py-4 border border-gray-200">Type</th>
                                            <th className="px-6 py-4 text-center border border-gray-200">Total Days</th>
                                            <th className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30 border border-gray-200">P</th>
                                            <th className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30 border border-gray-200">A</th>
                                            <th className="px-6 py-4 text-center font-bold text-purple-600 bg-purple-50/30 border border-gray-200">H</th>
                                            <th className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30 border border-gray-200">OD</th>
                                            <th className="px-6 py-4 text-center font-bold text-yellow-600 bg-yellow-50/30 border border-gray-200">HD</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-600 bg-gray-50/30 border border-gray-200">W</th>
                                            <th className="px-6 py-4 text-center font-bold text-blue-800 bg-blue-50 border border-gray-200">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                    Loading data...
                                                </td>
                                            </tr>
                                        ) : filteredEmployees.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="px-6 py-12 text-center text-gray-400">
                                                    No employees found matching your criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEmployees.map((emp) => (
                                                <React.Fragment key={emp.laborTypeId}>
                                                    <tr
                                                        className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${expandedRows.has(emp.laborTypeId) ? 'bg-blue-50/50' : ''}`}
                                                        onClick={() => toggleRow(emp.laborTypeId)}
                                                    >
                                                        <td className="px-4 py-3 text-center border border-gray-200">
                                                            <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                                                <svg
                                                                    className={`w-5 h-5 transition-transform duration-200 ${expandedRows.has(emp.laborTypeId) ? 'rotate-90' : ''}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 border border-gray-200">
                                                            <div>
                                                                <p className="font-semibold text-gray-800">{emp.fullName}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{emp.laborCode}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 border border-gray-200">
                                                            <p className="text-sm text-gray-600">{emp.type || "—"}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-medium text-gray-600 border border-gray-200">
                                                            {emp.monthSummary?.totalDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50/30 border border-gray-200">
                                                            {emp.monthSummary?.presentDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-red-700 bg-red-50/30 border border-gray-200">
                                                            {emp.monthSummary?.absentDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-purple-700 bg-purple-50/30 border border-gray-200">
                                                            {emp.monthSummary?.holidayDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/30 border border-gray-200">
                                                            {emp.monthSummary?.onDutyDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-yellow-700 bg-yellow-50/30 border border-gray-200">
                                                            {emp.monthSummary?.halfDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-gray-700 bg-gray-50/30 border border-gray-200">
                                                            {emp.monthSummary?.weekOffDays || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-blue-800 bg-blue-50 border border-gray-200">
                                                            {emp.monthSummary?.totalHours || 0}h
                                                        </td>
                                                    </tr>

                                                    {/* Expandable Daily View */}
                                                    {expandedRows.has(emp.laborTypeId) && (
                                                        <tr>
                                                            <td colSpan="11" className="p-0 border-t-0">
                                                                <div className="bg-gray-50 p-2 shadow-inner animate-in slide-in-from-top-2 duration-200">
                                                                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                                                                        <div className="bg-gray-100/80 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                                                Daily breakdown - {format(selectedDate, 'MMMM yyyy')}
                                                                            </span>
                                                                            <div className="flex gap-4">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">Present</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">Absent</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">Holiday</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">On-Duty</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">Half-Day</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
                                                                                    <span className="text-[10px] font-medium text-gray-500">Week-Off</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="overflow-x-auto excel-scroll custom-scrollbar">
                                                                            <table className="min-w-full border-collapse">
                                                                                <thead>
                                                                                    <tr>
                                                                                        {emp.dailyData?.map((day, idx) => {
                                                                                            const d = new Date(day.date);
                                                                                            const isWeekend = d.getDay() === 0; // Sunday
                                                                                            return (
                                                                                                <th
                                                                                                    key={idx}
                                                                                                    className={`px-1 py-1.5 border border-gray-200 text-center text-[10px] font-bold min-w-[36px]
                                                                                                        ${isWeekend ? 'bg-red-50/50 text-red-600' : 'bg-gray-50 text-gray-600'}`}
                                                                                                >
                                                                                                    <div className="flex flex-col items-center">
                                                                                                        <span>{format(d, 'd')}</span>
                                                                                                        <span className="text-[8px] opacity-60 uppercase">{format(d, 'EEE').charAt(0)}</span>
                                                                                                    </div>
                                                                                                </th>
                                                                                            );
                                                                                        })}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    <tr>
                                                                                        {emp.dailyData?.map((day, idx) => (
                                                                                            <td
                                                                                                key={idx}
                                                                                                className={`px-1 py-1 border border-gray-200 text-center relative group min-w-[36px]
                                                                                                    ${getMiniStatusColor(day.status)}`}
                                                                                                title={`${format(new Date(day.date), 'dd MMM')}: ${day.status}${day.hours ? ` (${day.hours}h)` : ''}${day.projectName ? ` @ ${day.projectName}` : ''}`}
                                                                                            >
                                                                                                <span className="text-[11px] font-bold">
                                                                                                    {getStatusAbbreviation(day.status)}
                                                                                                </span>
                                                                                                {day.hours > 0 && (
                                                                                                    <div className="absolute -bottom-1 right-0 text-[7px] font-bold bg-white/50 px-0.5 rounded-tl border-l border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                        {day.hours}h
                                                                                                    </div>
                                                                                                )}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-4 flex gap-6 text-[11px] font-medium">
                                                                        <div className="flex items-center gap-2 text-gray-500">
                                                                            <FiAlertCircle className="text-blue-500" />
                                                                            <span>Average Hours per worked day: <span className="text-gray-900 font-bold">{emp.monthSummary?.avgHoursPerDay || 0}h</span></span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-500">
                                                                            <FiUsers className="text-blue-500" />
                                                                            <span>Total Working Hours: <span className="text-gray-900 font-bold">{emp.monthSummary?.totalHours || 0}h</span></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer / Count */}
                        {!loading && filteredEmployees.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 text-right">
                                Showing {filteredEmployees.length} records
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit Attendance</h3>
                                <p className="text-sm text-gray-500">{editData?.fullName} ({editData?.laborCode}) {editData?.projectName ? ` - ${editData.projectName}` : ""}</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editData?.status}
                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    className="w-full px-4 py-2 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Half-Day">Half-Day</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Week-Off">Week-Off</option>
                                    <option value="On-Duty">On-Duty</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">In Time</label>
                                    <input
                                        type="time"
                                        value={editData?.inTime || ""}
                                        onChange={(e) => setEditData({ ...editData, inTime: e.target.value })}
                                        className="w-full px-4 py-2 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Out Time</label>
                                    <input
                                        type="time"
                                        value={editData?.outTime || ""}
                                        onChange={(e) => setEditData({ ...editData, outTime: e.target.value })}
                                        className="w-full px-4 py-2 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editData?.totalHours || ""}
                                    onChange={(e) => setEditData({ ...editData, totalHours: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 8.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <textarea
                                    value={editData?.remarks || ""}
                                    onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                                    className="w-full px-4 py-2 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows="3"
                                    placeholder="Any notes..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateAttendance}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ title, value, icon, color, isLoading }) {
    const colorMap = {
        blue: "text-blue-600 bg-blue-100 border-l-4 border-blue-500",
        green: "text-green-600 bg-green-100 border-l-4 border-green-500",
        red: "text-red-600 bg-red-100 border-l-4 border-red-500",
        orange: "text-orange-600 bg-orange-100 border-l-4 border-orange-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-3 rounded-2xl shadow-sm border-l-4 border-gray-300 flex items-center justify-between"
        >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-xl font-bold text-gray-800">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorMap[color]} shadow-sm`}>
                <span className="text-xl">{icon}</span>
            </div>
        </motion.div>
    );
}
