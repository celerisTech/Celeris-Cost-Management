"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from "next/navigation";
import {
    Briefcase, Clock, CalendarDays, DollarSign, Pencil,
    HardHat, ArrowLeft, User, Clock3, FileText, Download
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { CalendarGrid } from '../../components/CalendarGrid';
import { StatCard } from '../../components/StatCard';

// =================== HELPER FUNCTIONS ===================
const formatIndianTime = (timeString) => {
    if (!timeString) return '-';
    if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
    }
    const [hours, minutes] = timeString.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;
    return `${hour}:${minutes} ${ampm}`;
};

const calculateSalary = (logs, wageAmount, wageType) => {
    let totalSalary = 0;
    if (!logs || logs.length === 0) return 0;
    wageAmount = parseFloat(wageAmount);
    if (isNaN(wageAmount) || wageAmount <= 0) return 0;

    logs.forEach(log => {
        const status = (log.CM_Status || '').toLowerCase();
        const hours = parseFloat(log.CM_Total_Working_Hours) || 0;
        let dailyAmount = 0;

        if (status === 'present' || status === 'on-duty') {
            if (wageType === 'PerHour') dailyAmount = hours * wageAmount;
            else if (wageType === 'PerDay') dailyAmount = wageAmount;
            else if (wageType === 'PerMonth') dailyAmount = wageAmount / 26;
        } else if (status === 'half-day') {
            if (wageType === 'PerHour') dailyAmount = hours * wageAmount;
            else if (wageType === 'PerDay') dailyAmount = wageAmount * 0.5;
            else if (wageType === 'PerMonth') dailyAmount = (wageAmount / 26) * 0.5;
        }

        if (dailyAmount > 0) totalSalary += dailyAmount;
    });

    return parseFloat(totalSalary.toFixed(2));
};

const calculateDailyWage = (log, laborDetails) => {
    if (!log || !laborDetails) return '0.00';
    const status = (log.CM_Status || '').toLowerCase();
    const hours = parseFloat(log.CM_Total_Working_Hours) || 0;
    const wageAmount = parseFloat(laborDetails.CM_Wage_Amount) || 0;
    const wageType = laborDetails.CM_Wage_Type || 'PerDay';
    if (wageAmount <= 0) return '0.00';

    let dailyAmount = 0;
    if (status === 'present' || status === 'on-duty') {
        if (wageType === 'PerHour') dailyAmount = hours * wageAmount;
        else if (wageType === 'PerDay') dailyAmount = wageAmount;
        else if (wageType === 'PerMonth') dailyAmount = wageAmount / 26;
    } else if (status === 'half-day') {
        if (wageType === 'PerHour') dailyAmount = hours * wageAmount;
        else if (wageType === 'PerDay') dailyAmount = wageAmount * 0.5;
        else if (wageType === 'PerMonth') dailyAmount = (wageAmount / 26) * 0.5;
    }

    return dailyAmount.toFixed(2);
};

// =================== EMPLOYEE PROFILE SECTION ===================
const EmployeeProfileSection = ({ labor }) => {
    if (!labor) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return '—';
        }
    };

    const formatAadhar = (num) => {
        if (!num) return '—';
        const str = String(num);
        return str.length === 12 ? `${str.slice(0, 4)} ${str.slice(4, 8)} ${str.slice(8, 12)}` : str;
    };

    const formatPhoneNumber = (num) => {
        if (!num) return '—';
        const str = String(num).replace(/\D/g, '');
        if (str.length === 10) return `${str.slice(0, 3)} ${str.slice(3, 6)} ${str.slice(6)}`;
        return str;
    };

    return (
        <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <HardHat size={20} className="text-indigo-600" />
                    Employee Profile
                </h3>
            </div>
            {/* Employee Image (Top Right Corner) */}
            {labor.CM_Labor_Image && (
                <div className="absolute top-4 right-4">
                    <img
                        src={labor.CM_Labor_Image}
                        alt="Employee"
                        className="w-20 h-20 rounded-full border-2 border-white shadow-lg object-cover"
                    />
                </div>
            )}

            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Personal Information
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium text-slate-600">Full Name</span>
                                <span className="text-slate-800 text-right">{labor.CM_First_Name} {labor.CM_Last_Name}</span>
                            </div>
                            {labor.CM_Fathers_Name && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Father's Name</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Fathers_Name}</span>
                                </div>
                            )}
                            {labor.CM_Date_Of_Birth && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Date of Birth</span>
                                    <span className="text-slate-800 text-right">{formatDate(labor.CM_Date_Of_Birth)}</span>
                                </div>
                            )}
                            {labor.CM_Labor_Join_Date && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Joining Date</span>
                                    <span className="text-slate-800 text-right">{formatDate(labor.CM_Labor_Join_Date)}</span>
                                </div>
                            )}
                            {labor.CM_Sex && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Gender</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Sex}</span>
                                </div>
                            )}
                            {labor.CM_Marriage_Status && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Marital Status</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Marriage_Status}</span>
                                </div>
                            )}
                            {labor.CM_Previous_Experience && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Experience</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Previous_Experience}</span>
                                </div>
                            )}
                            {labor.CM_Higher_Education && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Education</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Higher_Education}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Professional Information
                        </h4>
                        <div className="space-y-3 text-sm">
                            {labor.CM_Labor_Code && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Employee ID</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Labor_Code}</span>
                                </div>
                            )}
                            {labor.CM_Labor_Roll && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Role</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Labor_Roll}</span>
                                </div>
                            )}
                            {labor.CM_Labor_Type && (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-600">Type</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${labor.CM_Labor_Type === 'Permanent' ? 'bg-green-100 text-green-800' :
                                        labor.CM_Labor_Type === 'Contract' ? 'bg-blue-100 text-blue-800' :
                                            labor.CM_Labor_Type === 'Temporary' ? 'bg-amber-100 text-amber-800' :
                                                labor.CM_Labor_Type === 'Office' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-slate-100 text-slate-800'
                                        }`}>
                                        {labor.CM_Labor_Type}
                                    </span>
                                </div>
                            )}
                            {labor.CM_Status && (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-600">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${labor.CM_Status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                        {labor.CM_Status}
                                    </span>
                                </div>
                            )}
                            {labor.CM_Wage_Type && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Wage Type</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Wage_Type}</span>
                                </div>
                            )}
                            {labor.CM_Wage_Amount && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Wage Amount</span>
                                    <span className="text-slate-800 text-right">₹ {Number(labor.CM_Wage_Amount)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {labor.CM_Created_At && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Added On</span>
                                    <span className="text-slate-800 text-right">{formatDate(labor.CM_Created_At)}</span>
                                </div>
                            )}
                            {labor.CM_Created_By && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Added By</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Created_By}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact & Address */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            Contact & Address
                        </h4>
                        <div className="space-y-3 text-sm">
                            {labor.CM_Email && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Email</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Email}</span>
                                </div>
                            )}
                            {labor.CM_Phone_Number && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Phone</span>
                                    <span className="text-slate-800 text-right">{formatPhoneNumber(labor.CM_Phone_Number)}</span>
                                </div>
                            )}
                            {labor.CM_Alternate_Phone && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Alternate</span>
                                    <span className="text-slate-800 text-right">{formatPhoneNumber(labor.CM_Alternate_Phone)}</span>
                                </div>
                            )}

                            {(labor.CM_Address || labor.CM_City || labor.CM_District || labor.CM_State || labor.CM_Country || labor.CM_Postal_Code) && (
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-slate-600">Address</span>
                                    </div>
                                    <div className="text-slate-600 text-right">
                                        {labor.CM_Address && <div>{labor.CM_Address}</div>}
                                        {(labor.CM_City || labor.CM_District) && (
                                            <div>{[labor.CM_City, labor.CM_District].filter(Boolean).join(', ')}</div>
                                        )}
                                        {(labor.CM_State || labor.CM_Country || labor.CM_Postal_Code) && (
                                            <div>
                                                {[labor.CM_State, labor.CM_Country].filter(Boolean).join(', ')}
                                                {labor.CM_Postal_Code && ` - ${labor.CM_Postal_Code}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identity Documents */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Identity Documents
                        </h4>
                        <div className="space-y-3 text-sm">
                            {labor.CM_Aadhar_Number && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Aadhaar</span>
                                    <span className="text-slate-800 text-right">{formatAadhar(labor.CM_Aadhar_Number)}</span>
                                </div>
                            )}
                            {labor.CM_PAN_Number && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">PAN</span>
                                    <span className="text-slate-800 text-right">{labor.CM_PAN_Number}</span>
                                </div>
                            )}

                            {(labor.CM_Aadhar_Image || labor.CM_PAN_Image) && (
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-slate-600">Documents</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {labor.CM_Aadhar_Image && (
                                            <a
                                                href={labor.CM_Aadhar_Image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                                            >
                                                <FileText size={12} />
                                                Aadhaar
                                            </a>
                                        )}
                                        {labor.CM_PAN_Image && (
                                            <a
                                                href={labor.CM_PAN_Image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs hover:bg-amber-100"
                                            >
                                                <FileText size={12} />
                                                PAN
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banking Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Banking Information
                        </h4>
                        <div className="space-y-3 text-sm">
                            {labor.CM_Bank_Name && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Bank</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Bank_Name}</span>
                                </div>
                            )}
                            {labor.CM_Bank_Branch && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Branch</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Bank_Branch}</span>
                                </div>
                            )}
                            {labor.CM_Account_Holder_Name && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">Account Holder</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Account_Holder_Name}</span>
                                </div>
                            )}
                            {labor.CM_Bank_Account_Number && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">A/C No.</span>
                                    <span className="text-slate-800 text-right">•••• {String(labor.CM_Bank_Account_Number).slice(-4)}</span>
                                </div>
                            )}
                            {labor.CM_Bank_IFSC && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">IFSC</span>
                                    <span className="text-slate-800 text-right">{labor.CM_Bank_IFSC}</span>
                                </div>
                            )}
                            {labor.CM_UPI_ID && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-600">UPI ID</span>
                                    <span className="text-slate-800 text-right">{labor.CM_UPI_ID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================== ATTENDANCE SECTION ===================
const AttendanceSection = ({
    stats,
    logs,
    labor,
    selectedDate,
    setSelectedDate,
    monthFilter,
    yearFilter,
    statusFilter,
}) => {
    return (
        <>
            {/* Stats */}
            {stats === null ? (
                <div className="flex justify-center items-center py-8">
                    <div className="relative w-6 h-6 sm:w-10 sm:h-10">
                        <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
                        <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                >
                    <StatCard
                        icon={Briefcase}
                        title="Projects"
                        value={stats.totalProjects}
                        unit=""
                        color={{ bg: "bg-blue-100", text: "text-blue-600" }}
                    />
                    <StatCard
                        icon={Clock}
                        title="Total Hours"
                        value={stats.totalHours}
                        unit=" hrs"
                        color={{ bg: "bg-green-100", text: "text-green-600" }}
                    />
                    <StatCard
                        icon={CalendarDays}
                        title="Working Days"
                        value={stats.totalWorkingDays}
                        unit=""
                        color={{ bg: "bg-purple-100", text: "text-purple-600" }}
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Total Salary"
                        value={stats.totalSalary}
                        unit="₹"
                        color={{ bg: "bg-emerald-100", text: "text-emerald-600" }}
                    />
                </motion.div>
            )}

            {/* Calendar & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                <div className="lg:col-span-1">
                    <CalendarGrid
                        year={yearFilter}
                        month={monthFilter}
                        logs={logs}
                        selectedDate={selectedDate}
                        onDateClick={setSelectedDate}
                    />
                </div>

                <div className="lg:col-span-2">
                    <DateLogs
                        selectedDate={selectedDate}
                        logs={logs}
                        selectedLabor={labor}
                        calculateDailyWage={calculateDailyWage}
                    />
                </div>
            </div>
        </>
    );
};

// =================== DATE LOGS COMPONENT ===================
const DateLogs = ({ selectedDate, logs, selectedLabor, calculateDailyWage }) => {
    if (!selectedDate) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col items-center justify-center">
                <CalendarDays size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">Select a date to view work logs</p>
            </div>
        );
    }

    const dateFilteredLogs = logs.filter(log => log.CM_Attendance_Date === selectedDate);

    return (
        <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 h-full flex flex-col"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base md:text-lg text-slate-800">
                    Work Logs for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {dateFilteredLogs.length > 0 && (
                    <span className="text-xs md:text-sm text-slate-500">
                        {dateFilteredLogs.length} record{dateFilteredLogs.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {dateFilteredLogs.length > 0 ? (
                <ul className="space-y-3 md:space-y-4 flex-1 overflow-y-auto pr-2 -mr-2">
                    {dateFilteredLogs.map(log => (
                        <LogItem
                            key={log.CM_Attendance_ID}
                            log={log}
                            selectedLabor={selectedLabor}
                            calculateDailyWage={calculateDailyWage}
                        />
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center flex-1 py-10">
                    <CalendarDays size={32} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm">No attendance records for this date</p>
                </div>
            )}
        </motion.div>
    );
};

const LogItem = ({ log, selectedLabor, calculateDailyWage }) => (
    <li className="bg-white border border-slate-200/80 rounded-xl p-3 md:p-4 hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
            <p className="font-bold text-sm md:text-base text-slate-800">
                {log.CM_Project_ID ? (log.CM_Project_Name || `Project: ${log.CM_Project_ID}`) : 'Office Work'}
            </p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold w-fit
        ${log.CM_Status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                    log.CM_Status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                        log.CM_Status === 'Leave' ? 'bg-amber-100 text-amber-700' :
                            log.CM_Status === 'Holiday' ? 'bg-indigo-100 text-indigo-700' :
                                log.CM_Status === 'Half-Day' ? 'bg-yellow-100 text-yellow-700' :
                                    log.CM_Status === 'On-Duty' ? 'bg-green-100 text-green-700' :
                                        log.CM_Status === 'Week-Off' ? 'bg-purple-100 text-purple-700' :
                                            'bg-slate-100 text-slate-600'}`}
            >
                {log.CM_Status}
            </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-slate-600">
            <p><strong>Manager/Engineer:</strong> {log.CM_Created_By || '-'}</p>
            <p><strong>Work Details:</strong> {log.CM_Shift || '-'}</p>

            {(log.CM_Status === 'Present' || log.CM_Status === 'On-Duty') ? (
                <>
                    <p><strong>In Time:</strong> {formatIndianTime(log.CM_In_Time)}</p>
                    <p><strong>Out Time:</strong> {formatIndianTime(log.CM_Out_Time)}</p>
                </>
            ) : (
                <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 italic">
                        {log.CM_Status === 'Half-Day'
                            ? 'Half-Day: 4 hours (Time details not shown)'
                            : 'Time details not applicable for this status'}
                    </p>
                </div>
            )}

            <p><strong>Working Hours:</strong> {log.CM_Total_Working_Hours || '0'} hrs</p>

            {(log.CM_Status === 'Present' || log.CM_Status === 'On-Duty' || log.CM_Status === 'Half-Day') &&
                selectedLabor?.CM_Wage_Type && selectedLabor?.CM_Wage_Amount && (
                    <p><strong>Daily Wage:</strong> ₹ {calculateDailyWage(log, selectedLabor)}</p>
                )
            }
        </div>

        {log.CM_Remarks && (
            <p className="mt-2 text-slate-500 text-xs md:text-sm italic">
                <strong>Remarks:</strong> {log.CM_Remarks}
            </p>
        )}
    </li>
);

// =================== MAIN PAGE ===================
export default function EmployeeDetailsPage() {
    const [labor, setLabor] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [stats, setStats] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'attendance'
    const [showMenu, setShowMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const params = useParams();
    const router = useRouter();
    const laborId = params.id;

    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    // Fetch labor details
    useEffect(() => {
        const fetchLaborData = async () => {
            try {
                setLoading(true);
                const laborRes = await fetch(`/api/labor-details?laborId=${laborId}`);
                if (laborRes.ok) {
                    const laborData = await laborRes.json();
                    if (laborData.labor) {
                        setLabor(laborData.labor);
                    }
                }
            } catch (err) {
                console.error('Error fetching labor data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (laborId) {
            fetchLaborData();
        }
    }, [laborId]);

    // Fetch attendance details
    const fetchLaborDetails = async () => {
        if (!labor) return;
        setStats(null);

        try {
            const res = await fetch(`/api/attendance-entry?laborId=${laborId}&month=${monthFilter}&year=${yearFilter}`);

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const text = await res.text();
            let data = text ? JSON.parse(text) : [];

            setLogs(data);

            const filteredLogs = statusFilter === 'all'
                ? data
                : data.filter(log => log.CM_Status?.toLowerCase() === statusFilter);

            let totalHours = 0;
            let totalWorkingDays = 0;
            const workedDates = new Set();

            filteredLogs.forEach(log => {
                const status = (log.CM_Status || '').toLowerCase();
                const hours = parseFloat(log.CM_Total_Working_Hours) || 0;

                if (log.CM_Attendance_Date) {
                    workedDates.add(log.CM_Attendance_Date);
                }

                if (status === 'present' || status === 'half-day' || status === 'on-duty') {
                    totalHours += hours;
                }
            });

            totalWorkingDays = workedDates.size;
            const uniqueProjects = labor.CM_Labor_Type === 'Office'
                ? 1
                : new Set(filteredLogs.map(log => log.CM_Project_ID).filter(id => id)).size;

            const daysInMonth = new Date(yearFilter, monthFilter, 0).getDate();
            const wageAmount = labor.CM_Wage_Amount;
            const wageType = labor.CM_Wage_Type || 'PerDay';
            const totalSalary = calculateSalary(filteredLogs, wageAmount, wageType);

            setStats({
                totalProjects: uniqueProjects,
                totalHours,
                totalWorkingDays,
                avgHoursPerDay: totalWorkingDays > 0 ? (totalHours / totalWorkingDays) : 0,
                workPercentage: daysInMonth > 0 ? Math.round((totalWorkingDays / daysInMonth) * 100) : 0,
                totalSalary
            });

        } catch (err) {
            console.error('Error fetching labor details:', err);
            setStats({
                totalProjects: 0,
                totalHours: 0,
                totalWorkingDays: 0,
                avgHoursPerDay: 0,
                workPercentage: 0,
                totalSalary: 0
            });
        }
    };

    useEffect(() => {
        if (labor && activeTab === 'attendance') {
            fetchLaborDetails();
        }
    }, [labor, monthFilter, yearFilter, statusFilter, activeTab]);

    // --------------------- EXCEL EXPORT FUNCTIONS ---------------------
    const exportEmployeeDetailsToExcel = async () => {
        if (!labor) return;

        try {
            setIsExporting(true);
            const { utils, writeFile } = await import("xlsx");

            // Employee Details Sheet
            const employeeDetails = [{
                "Labor Code": labor.CM_Labor_Code,
                "Full Name": `${labor.CM_First_Name} ${labor.CM_Last_Name}`,
                "Father's Name": labor.CM_Fathers_Name,
                "Date of Birth": labor.CM_Date_Of_Birth,
                "Gender": labor.CM_Sex,
                "Marital Status": labor.CM_Marriage_Status,
                "Experience": labor.CM_Previous_Experience,
                "Education": labor.CM_Higher_Education,
                "Role": labor.CM_Labor_Roll,
                "Labor Type": labor.CM_Labor_Type,
                "Status": labor.CM_Status,
                "Wage Type": labor.CM_Wage_Type,
                "Wage Amount": labor.CM_Wage_Amount,
                "Email": labor.CM_Email,
                "Phone Number": labor.CM_Phone_Number,
                "Alternate Phone": labor.CM_Alternate_Phone,
                "Address": labor.CM_Address,
                "City": labor.CM_City,
                "District": labor.CM_District,
                "State": labor.CM_State,
                "Country": labor.CM_Country,
                "Postal Code": labor.CM_Postal_Code,
                "Aadhar Number": labor.CM_Aadhar_Number,
                "PAN Number": labor.CM_PAN_Number,
                "Bank Name": labor.CM_Bank_Name,
                "Bank Branch": labor.CM_Bank_Branch,
                "Account Holder": labor.CM_Account_Holder_Name,
                "Account Number": labor.CM_Bank_Account_Number,
                "IFSC": labor.CM_Bank_IFSC,
                "UPI ID": labor.CM_UPI_ID,
                "Added On": labor.CM_Created_At,
                "Added By": labor.CM_Created_By
            }];

            const wsDetails = utils.json_to_sheet(employeeDetails);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, wsDetails, "Employee Details");

            const fileName = `${labor.CM_First_Name}_${labor.CM_Last_Name}_Employee_Details.xlsx`;
            writeFile(wb, fileName);

        } catch (err) {
            console.error("Error exporting employee details to Excel:", err);
            alert("Error exporting employee details");
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    const exportAttendanceToExcel = async () => {
        if (!labor || logs.length === 0) return;

        try {
            setIsExporting(true);
            const { utils, writeFile } = await import("xlsx");

            // Attendance Sheet
            const attendanceData = logs.map(log => ({
                "Date": log.CM_Attendance_Date,
                "Status": log.CM_Status,
                "Project": log.CM_Project_Name || log.CM_Project_ID || 'Office Work',
                "Manager/Engineer": log.CM_Created_By || '-',
                "Work Details": log.CM_Shift || '-',
                "In Time": log.CM_In_Time || '-',
                "Out Time": log.CM_Out_Time || '-',
                "Working Hours": log.CM_Total_Working_Hours || '0',
                "Daily Wage": (labor.CM_Wage_Amount && labor.CM_Wage_Type)
                    ? calculateDailyWage(log, labor)
                    : '0.00',
                "Remarks": log.CM_Remarks || ''
            }));

            const wsAttendance = utils.json_to_sheet(attendanceData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, wsAttendance, "Attendance");

            const fileName = `${labor.CM_First_Name}_${labor.CM_Last_Name}_Attendance_Report.xlsx`;
            writeFile(wb, fileName);

        } catch (err) {
            console.error("Error exporting attendance to Excel:", err);
            alert("Error exporting attendance report");
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    const exportFullReportToExcel = async () => {
        if (!labor) return;

        try {
            setIsExporting(true);
            const { utils, writeFile } = await import("xlsx");

            // Employee Details Sheet
            const employeeDetails = [{
                "Labor Code": labor.CM_Labor_Code,
                "Full Name": `${labor.CM_First_Name} ${labor.CM_Last_Name}`,
                "Role": labor.CM_Labor_Roll,
                "Labor Type": labor.CM_Labor_Type,
                "Status": labor.CM_Status,
                "Wage Type": labor.CM_Wage_Type,
                "Wage Amount": labor.CM_Wage_Amount,
                "Phone": labor.CM_Phone_Number,
                "Email": labor.CM_Email
            }];

            // Attendance Sheet
            const attendanceData = logs.map(log => ({
                "Date": log.CM_Attendance_Date,
                "Status": log.CM_Status,
                "Project": log.CM_Project_Name || log.CM_Project_ID || 'Office Work',
                "In Time": log.CM_In_Time || '-',
                "Out Time": log.CM_Out_Time || '-',
                "Working Hours": log.CM_Total_Working_Hours || '0',
                "Daily Wage": (labor.CM_Wage_Amount && labor.CM_Wage_Type)
                    ? calculateDailyWage(log, labor)
                    : '0.00',
                "Remarks": log.CM_Remarks || ''
            }));

            const wsDetails = utils.json_to_sheet(employeeDetails);
            const wsAttendance = utils.json_to_sheet(attendanceData);

            const wb = utils.book_new();
            utils.book_append_sheet(wb, wsDetails, "Employee Details");
            utils.book_append_sheet(wb, wsAttendance, "Attendance");

            const fileName = `${labor.CM_First_Name}_${labor.CM_Last_Name}_Full_Report.xlsx`;
            writeFile(wb, fileName);

        } catch (err) {
            console.error("Error exporting full report to Excel:", err);
            alert("Error exporting full report");
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    // --------------------- PDF EXPORT FUNCTIONS ---------------------
    const exportEmployeeDetailsToPDF = async () => {
        if (!labor) return;

        try {
            setIsExporting(true);
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF();
            let y = 15;

            // Title
            doc.setFontSize(16);
            doc.text("Employee Details", 14, y);
            y += 10;

            // Employee Information
            doc.setFontSize(11);
            const empInfo = [
                ["Labor Code", labor.CM_Labor_Code],
                ["Full Name", `${labor.CM_First_Name} ${labor.CM_Last_Name}`],
                ["Father's Name", labor.CM_Fathers_Name || "-"],
                ["Date of Birth", labor.CM_Date_Of_Birth || "-"],
                ["Gender", labor.CM_Sex || "-"],
                ["Role", labor.CM_Labor_Roll || "-"],
                ["Labor Type", labor.CM_Labor_Type || "-"],
                ["Status", labor.CM_Status || "-"],
                ["Wage Type", labor.CM_Wage_Type || "-"],
                ["Wage Amount", labor.CM_Wage_Amount ? ` ${labor.CM_Wage_Amount}` : "-"],
                ["Phone", labor.CM_Phone_Number || "-"],
                ["Email", labor.CM_Email || "-"],
                ["Address", labor.CM_Address || "-"]
            ];

            empInfo.forEach(row => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${row[0]}: ${row[1]}`, 14, y);
                y += 6;
            });

            const fileName = `${labor.CM_First_Name}_${labor.CM_Last_Name}_Employee_Details.pdf`;
            doc.save(fileName);

        } catch (err) {
            console.error("Error exporting employee details to PDF:", err);
            alert("Error exporting employee details");
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    const exportAttendanceToPDF = async () => {
        if (!labor || logs.length === 0) return;

        try {
            setIsExporting(true);
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF();

            // Title
            doc.setFontSize(16);
            doc.text(`Attendance Report - ${labor.CM_First_Name} ${labor.CM_Last_Name}`, 14, 15);
            doc.setFontSize(11);
            doc.text(`Period: ${monthFilter}/${yearFilter}`, 14, 22);

            // Attendance Table
            const tableData = logs.map(log => [
                log.CM_Attendance_Date,
                log.CM_Status,
                log.CM_Project_Name || log.CM_Project_ID || 'Office Work',
                log.CM_In_Time || '-',
                log.CM_Out_Time || '-',
                log.CM_Total_Working_Hours || '0',
                (labor.CM_Wage_Amount && labor.CM_Wage_Type) ? ` ${calculateDailyWage(log, labor)}` : '₹ 0.00',
                log.CM_Remarks || ''
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['Date', 'Status', 'Project', 'In Time', 'Out Time', 'Hours', 'Daily Wage', 'Remarks']],
                body: tableData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] }
            });

            const fileName = `${labor.CM_First_Name}_${labor.CM_Last_Name}_Attendance_Report.pdf`;
            doc.save(fileName);

        } catch (err) {
            console.error("Error exporting attendance to PDF:", err);
            alert("Error exporting attendance report");
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMenu && !event.target.closest('.download-menu')) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // =================== LOADING / NOT FOUND ===================
    if (loading) {
        return (
            <div className="flex flex-row h-screen bg-white">
                <Navbar />
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
                    <div className="flex justify-center items-center h-64">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
                            <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
                            <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!labor) {
        return (
            <div className="flex flex-row h-screen bg-white">
                <Navbar />
                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Employee Not Found</h2>
                        <button
                            onClick={() => router.push('/labors')}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Employees
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =================== MAIN UI ===================
    return (
        <div className="flex h-screen bg-white">
            <Navbar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header with Back + Download Right Side */}
                <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">

                    {/* Back Button – stays left, shrinks on mobile */}
                    <button
                        onClick={() => router.push('/labors')}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-white hover:text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
                    >
                        <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Title – grow to fill center, truncate on small screens */}
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 text-center flex-1 min-w-0 truncate px-2">
                        Employee Details
                    </h2>

                    {/* Download Dropdown – right-aligned, full-width on mobile if needed (see note below) */}
                    <div className="relative download-menu w-full sm:w-auto">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            disabled={isExporting}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-white hover:text-white bg-blue-500 hover:bg-blue-700 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
                        >
                            <div className="flex items-center">
                                {isExporting ? (
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                ) : (
                                    <Download size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                                )}
                                <span className="whitespace-nowrap">
                                    {isExporting ? 'Exporting...' : 'Download'}
                                </span>
                            </div>

                            <svg
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown — reposition on mobile (e.g., full-width, bottom-aligned, or use portal) */}
                        {showMenu && (
                            <div
                                className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 p-2 sm:p-2"
                                role="menu"
                                onClick={(e) => e.stopPropagation()} // prevent closing on click inside
                            >
                                {/* Excel Options */}
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                                    Excel Export
                                </div>

                                {[
                                    { name: 'Employee Details', desc: 'Personal & professional info', Icon: User, color: 'blue', onClick: exportEmployeeDetailsToExcel },
                                    { name: 'Attendance Report', desc: 'Work logs and hours', Icon: CalendarDays, color: 'green', onClick: exportAttendanceToExcel, disabled: logs.length === 0 },
                                    { name: 'Full Report', desc: 'Complete employee data', Icon: FileText, color: 'purple', onClick: exportFullReportToExcel },
                                ].map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => { item.onClick(); setShowMenu(false); }}
                                        disabled={isExporting || item.disabled}
                                        className={`flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-${item.color}-50 hover:text-${item.color}-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-1 first:mt-0`}
                                    >
                                        <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-${item.color}-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-${item.color}-200`}>
                                            <item.Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${item.color}-600`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{item.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                                        </div>
                                    </button>
                                ))}

                                {/* PDF Options */}
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 mt-2">
                                    PDF Export
                                </div>

                                {[
                                    { name: 'Employee Details', desc: 'Personal & professional info', Icon: User, color: 'red', onClick: exportEmployeeDetailsToPDF },
                                    { name: 'Attendance Report', desc: 'Work logs and hours', Icon: CalendarDays, color: 'amber', onClick: exportAttendanceToPDF, disabled: logs.length === 0 },
                                ].map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => { item.onClick(); setShowMenu(false); }}
                                        disabled={isExporting || item.disabled}
                                        className={`flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-${item.color}-50 hover:text-${item.color}-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-1`}
                                    >
                                        <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-${item.color}-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-${item.color}-200`}>
                                            <item.Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${item.color}-600`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{item.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Header & Tab Switcher */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Title & Badges */}
                            <div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                                    {labor.CM_First_Name} {labor.CM_Last_Name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <p className="text-slate-500 text-sm">{labor.CM_Labor_Roll}</p>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${labor.CM_Labor_Type === "Permanent"
                                            ? "bg-green-100 text-green-800"
                                            : labor.CM_Labor_Type === "Contract"
                                                ? "bg-blue-100 text-blue-800"
                                                : labor.CM_Labor_Type === "Temporary"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : labor.CM_Labor_Type === "Office"
                                                        ? "bg-purple-100 text-purple-800"
                                                        : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {labor.CM_Labor_Type}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${labor.CM_Status === "Active"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-rose-100 text-rose-800"
                                            }`}
                                    >
                                        {labor.CM_Status}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons + Tab Switcher */}
                            <div className="flex flex-wrap gap-2 md:gap-3 items-center">

                                {/* Tab Switcher */}
                                <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors ${activeTab === 'profile'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        <User size={16} />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('attendance')}
                                        className={`px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors ${activeTab === 'attendance'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Clock3 size={16} />
                                        Attendance
                                    </button>
                                </div>
                                <button
                                    onClick={() => router.push(`/editlabor/${labor.CM_Labor_Type_ID}`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                                >
                                    <Pencil size={18} />Edit
                                </button>

                            </div>
                        </div>

                        {/* Filters (Attendance Tab Only) */}
                        {activeTab === "attendance" && (
                            <div className="w-90 bg-white p-3 rounded-lg border border-slate-200 
                            flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white border border-slate-300 text-gray-800 py-2 px-3 
                                    rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none 
                                    w-full sm:w-auto"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="present">Present</option>
                                    <option value="half-day">Half-Day</option>
                                    <option value="holiday">Holiday</option>
                                    <option value="leave">Leave</option>
                                    <option value="absent">Absent</option>
                                    <option value="on-duty">On-Duty</option>
                                    <option value="week-off">Week-Off</option>
                                </select>

                                {/* Month Filter */}
                                <select
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                                    className="bg-white border border-slate-300 text-gray-800 py-2 px-3 
                                    rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none 
                                    w-full sm:w-auto"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                                        </option>
                                    ))}
                                </select>

                                {/* Year Filter */}
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(parseInt(e.target.value))}
                                    className="bg-white border border-slate-300 text-gray-800 py-2 px-3 
                                    rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none 
                                    w-full sm:w-auto"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}


                        {/* Content Area */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <EmployeeProfileSection labor={labor} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="attendance"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <AttendanceSection
                                        stats={stats}
                                        logs={logs}
                                        labor={labor}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        monthFilter={monthFilter}
                                        yearFilter={yearFilter}
                                        statusFilter={statusFilter}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}