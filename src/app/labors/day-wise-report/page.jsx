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
    FiFilter
} from "react-icons/fi";
import { format } from "date-fns";
import { ArrowLeft } from 'lucide-react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuthStore } from "../../store/useAuthScreenStore";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function DayWiseAttendanceReport() {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [showMenu, setShowMenu] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Handle initial type filter for Engineer role
    useEffect(() => {
        if (user?.CM_Role_ID === "ROL000003") {
            setTypeFilter("Labor");
        }
    }, [user]);

    const fetchReport = async (date) => {
        try {
            setLoading(true);
            const formattedDate = format(date, "yyyy-MM-dd");
            const res = await fetch(`/api/attendance/day-wise-report?date=${formattedDate}`);
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
        fetchReport(selectedDate);
    }, [selectedDate]);
    const exportToExcel = () => {
        if (!filteredEmployees.length) return;

        const worksheetData = filteredEmployees.map((emp, index) => ({
            "S.No": index + 1,
            "Employee Name": emp.fullName,
            "Employee Code": emp.laborCode,
            "Type": emp.type,
            "Status": emp.status,
            "In Time": emp.inTime || "-",
            "Out Time": emp.outTime || "-",
            "Total Hours": emp.totalHours || "-",
            "Remarks": emp.remarks || "-"
        }));

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

        saveAs(file, `Attendance_${format(selectedDate, "dd-MM-yyyy")}.xlsx`);
    };
    const exportToPDF = () => {
        if (!filteredEmployees.length) return;

        const doc = new jsPDF("l", "mm", "a4");

        doc.setFontSize(14);
        doc.text(
            `Day Wise Attendance Report - ${format(selectedDate, "dd MMM yyyy")}`,
            14,
            15
        );

        const tableColumn = [
            "S.No",
            "Employee Name",
            "Code",
            "Type",
            "Status",
            "In Time",
            "Out Time",
            "Hours",
            "Remarks"
        ];

        const tableRows = filteredEmployees.map((emp, index) => [
            index + 1,
            emp.fullName,
            emp.laborCode,
            emp.type,
            emp.status,
            emp.inTime || "-",
            emp.outTime || "-",
            emp.totalHours || "-",
            emp.remarks || "-"
        ]);

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

        doc.save(`Attendance_${format(selectedDate, "dd-MM-yyyy")}.pdf`);
    };


    const getStatusColor = (status) => {
        switch (status) {
            case "Present": return "text-green-600 bg-green-50 border-green-200";
            case "Absent": return "text-red-600 bg-red-50 border-red-200";
            case "Leave": return "text-orange-600 bg-orange-50 border-orange-200";
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
                fetchReport(selectedDate);
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

    const filteredEmployees = reportData?.details?.filter(emp => {
        const searchString = searchTerm.toLowerCase();
        const matchesSearch =
            emp.fullName.toLowerCase().includes(searchString) ||
            emp.laborCode.toLowerCase().includes(searchString) ||
            emp.laborTypeId.toLowerCase().includes(searchString);

        const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
        const matchesType = typeFilter === "All" || emp.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    }) || [];

    // Calculate summary based on current role and type filter (ignore search and status for stats)
    const stats = React.useMemo(() => {
        if (!reportData?.details) return { total: 0, present: 0, absent: 0, leave: 0, halfDay: 0, onDuty: 0, holiday: 0, weekOff: 0 };

        const relevantDetails = reportData.details.filter(emp => {
            // Role restriction
            if (user?.CM_Role_ID === "ROL000003" && emp.type !== "Labor") return false;
            // Type Filter restriction
            if (typeFilter !== "All" && emp.type !== typeFilter) return false;
            return true;
        });

        return {
            total: relevantDetails.length,
            present: relevantDetails.filter(r => r.status === 'Present').length,
            absent: relevantDetails.filter(r => r.status === 'Absent').length,
            leave: relevantDetails.filter(r => r.status === 'Leave').length,
            halfDay: relevantDetails.filter(r => r.status === 'Half-Day').length,
            onDuty: relevantDetails.filter(r => r.status === 'On-Duty').length,
            holiday: relevantDetails.filter(r => r.status === 'Holiday').length,
            weekOff: relevantDetails.filter(r => r.status === 'Week-Off').length,
        };
    }, [reportData, user, typeFilter]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Navbar />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <FiBriefcase className="text-blue-600" />
                                Day-Wise Attendance
                            </h1>
                            <p className="text-gray-500 mt-1">
                                View daily attendance summary and detailed reports
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <ReactDatePicker
                                    selected={selectedDate}
                                    onChange={(date) => setSelectedDate(date)}
                                    className="pl-10 pr-4 py-2.5 text-black border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 w-full sm:w-auto shadow-sm cursor-pointer"
                                    dateFormat="dd MMM yyyy"
                                    maxDate={new Date()}
                                />
                            </div>
                            <button
                                onClick={() => router.push('/labors')}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-white hover:text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
                            >
                                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
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
                            title="On Leave/Other"
                            value={
                                stats.leave +
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
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Table Controls */}
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                            <div className="relative flex-1 max-w-md">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-black border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Employee Type Filter */}
                                <div className="flex items-center gap-2">
                                    <FiUsers className="text-gray-400 shrink-0" />
                                    <select
                                        value={user?.CM_Role_ID === "ROL000003" ? "Labor" : typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        disabled={user?.CM_Role_ID === "ROL000003"}
                                        className={`px-3 sm:px-4 py-3 rounded-lg border-2 border-blue-500 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm text-sm font-medium text-gray-700 transition-all ${user?.CM_Role_ID === "ROL000003" ? "opacity-70 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        {user?.CM_Role_ID === "ROL000003" ? (
                                            <option value="Labor">Labor</option>
                                        ) : (
                                            <>
                                                <option value="All">All Types</option>
                                                <option value="Labor">Labor</option>
                                                <option value="Temporary">Temporary</option>
                                                <option value="Permanent">Permanent</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Office">Office</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                                    <FiFilter className="text-gray-400 shrink-0" />
                                    {["All", "Present", "Absent"].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === status
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                {/* Download Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="flex items-center justify-between w-33 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </div>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Download Dropdown */}
                                    {showMenu && (
                                        <div className="absolute top-full w-50 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
                                            <button
                                                onClick={() => { setShowMenu(false); exportToExcel(); }}
                                                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">Download Excel</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => { setShowMenu(false); exportToPDF(); }}
                                                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
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
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-blue-800 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">In Time</th>
                                        <th className="px-6 py-4">Out Time</th>
                                        <th className="px-6 py-4 text-center">Hours</th>
                                        <th className="px-6 py-4">Remarks</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                Loading data...
                                            </td>
                                        </tr>
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                                No employees found matching your criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.laborTypeId} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{emp.fullName}</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{emp.laborCode}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-600">{emp.type || "—"}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(emp.status)}`}>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {emp.inTime || <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {emp.outTime || <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {emp.totalHours ? (
                                                        <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                            {emp.totalHours}h
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {emp.remarks || <span className="text-gray-300 italic">No detailed remarks</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleEditClick(emp)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Attendance"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                                <p className="text-sm text-gray-500">{editData?.fullName} ({editData?.laborCode})</p>
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
                                    <option value="Leave">Leave</option>
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
        blue: "text-blue-600 bg-blue-100",
        green: "text-green-600 bg-green-100",
        red: "text-red-600 bg-red-100",
        orange: "text-orange-600 bg-orange-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
        >
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${colorMap[color]} shadow-sm`}>
                <span className="text-xl">{icon}</span>
            </div>
        </motion.div>
    );
}
