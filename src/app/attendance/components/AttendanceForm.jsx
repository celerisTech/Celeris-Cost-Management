"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/app/store/useAuthScreenStore";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiUser,
  FiClock,
  FiSave,
  FiMapPin,
  FiCheck,
  FiX,
  FiFilter,
  FiSearch,
  FiBriefcase,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiNavigation,
  FiWatch,
  FiEdit2,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import { TbUsersGroup } from "react-icons/tb";

const Select = dynamic(() => import("react-select"), { ssr: false });

function AttendanceForm({ laborType }) {
  const { user } = useAuthStore();
  const [date, setDate] = useState("");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [globalProject, setGlobalProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [locationRestricted, setLocationRestricted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const RESTRICTED_ROLES = ["ROL000003"];

  // Calculate stats
  useEffect(() => {
    const present = Object.values(attendanceState).filter(a => a.status === "Present").length;
    const absent = Object.values(attendanceState).filter(a => a.status === "Absent").length;
    const halfDay = Object.values(attendanceState).filter(a => a.status === "Half-Day").length;
    setStats({
      present,
      absent,
      halfDay,
      total: present + absent + halfDay
    });
  }, [attendanceState]);

  // Initialize
  useEffect(() => {
    if (user?.CM_Role_ID) {
      setUserRole(user.CM_Role_ID);
      setLocationRestricted(RESTRICTED_ROLES.includes(user.CM_Role_ID));
    }
    const today = new Date();
    setDate(today.toISOString().split("T")[0]);
  }, [user]);

  // Fetch Projects & Employees
  useEffect(() => {
    if (!user?.CM_Company_ID) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projRes, laborRes] = await Promise.all([
          fetch(`/api/project-labor-attendance?companyId=${user.CM_Company_ID}`),
          fetch(`/api/labor-attendance?type=${laborType}`)
        ]);

        const projData = await projRes.json();
        const laborData = await laborRes.json();

        setProjects(projData);
        setEmployees(laborData);

        // Initialize attendance state
        const initialState = {};
        laborData.forEach(emp => {
          initialState[emp.CM_Labor_Type_ID] = {
            status: "Absent",
            projectId: null,
            inTime: { hour: "9", minute: "00", period: "AM" },
            outTime: { hour: "6", minute: "00", period: "PM" },
            shift: "",
            remarks: "",
            laborId: emp.CM_Labor_Type_ID,
            laborName: `${emp.CM_First_Name} ${emp.CM_Last_Name}`,
            laborCode: emp.CM_Labor_Code
          };
        });
        setAttendanceState(initialState);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, laborType]);

  // Fetch Existing Attendance
  useEffect(() => {
    if (!date || !user?.CM_Company_ID || employees.length === 0) return;

    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/attendance-entry?companyId=${user.CM_Company_ID}&date=${date}`);
        const data = await res.json();

        const newAttendanceState = { ...attendanceState };

        if (Array.isArray(data)) {
          data.forEach(record => {
            if (newAttendanceState[record.CM_Labor_ID]) {
              const parseTime = (timeStr) => {
                if (!timeStr) return { hour: "9", minute: "00", period: "AM" };
                const [h, m] = timeStr.split(':');
                let hour = parseInt(h);
                const period = hour >= 12 ? "PM" : "AM";
                if (hour > 12) hour -= 12;
                if (hour === 0) hour = 12;
                return { hour: hour.toString(), minute: m, period };
              };

              newAttendanceState[record.CM_Labor_ID] = {
                ...newAttendanceState[record.CM_Labor_ID],
                status: record.CM_Status,
                projectId: record.CM_Project_ID,
                inTime: parseTime(record.CM_In_Time),
                outTime: parseTime(record.CM_Out_Time),
                shift: record.CM_Shift || "",
                remarks: record.CM_Remarks || "",
              };
            }
          });
        }

        setAttendanceState(newAttendanceState);

      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [date, user, employees]);

  // Handle Global Project Change
  const handleGlobalProjectChange = (selected) => {
    setGlobalProject(selected);
    setAttendanceState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key] = { ...next[key], projectId: selected?.value || null };
      });
      return next;
    });
  };

  // Handle Row Updates
  const updateRow = (id, field, value) => {
    setAttendanceState(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  // Helper to format time for API
  const formatTime = (timeObj) => {
    let hour = parseInt(timeObj.hour, 10);
    if (timeObj.period === "PM" && hour !== 12) hour += 12;
    if (timeObj.period === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${timeObj.minute}:00`;
  };

  const calculateTotalHours = (inT, outT) => {
    let start = parseInt(inT.hour);
    if (inT.period === "PM" && start !== 12) start += 12;
    if (inT.period === "AM" && start === 12) start = 0;

    let end = parseInt(outT.hour);
    if (outT.period === "PM" && end !== 12) end += 12;
    if (outT.period === "AM" && end === 12) end = 0;

    let diff = end - start + (parseInt(outT.minute) - parseInt(inT.minute)) / 60;
    if (diff < 0) diff += 24;
    return diff.toFixed(2);
  };

  // Get Location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Validation
  const validateSubmission = () => {
    if (locationRestricted && (!globalProject || !globalProject.value)) {
      toast.error("Engineers must select a Project to mark attendance.");
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateSubmission()) return;
    setIsSubmitting(true);

    try {
      let locationData = null;

      if (locationRestricted) {
        try {
          toast.loading("Verifying location...", { id: "loc" });
          locationData = await getCurrentLocation();

          const R = 6371000;
          const pLat = globalProject.latitude;
          const pLon = globalProject.longitude;
          const pRad = globalProject.radius || 100;

          const dLat = (pLat - locationData.latitude) * Math.PI / 180;
          const dLon = (pLon - locationData.longitude) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(locationData.latitude * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance > pRad) {
            throw new Error(`You are ${Math.round(distance)}m away from ${globalProject.label}.`);
          }

          toast.success("Location Verified!", { id: "loc" });
        } catch (err) {
          toast.error(err.message || "Location check failed", { id: "loc" });
          setIsSubmitting(false);
          return;
        }
      }

      const records = Object.values(attendanceState).map(record => {
        const total = calculateTotalHours(record.inTime, record.outTime);
        return {
          laborId: record.laborId,
          date: date,
          companyId: user.CM_Company_ID,
          status: record.status,
          projectId: record.projectId,
          shift: record.shift,
          inTime: formatTime(record.inTime),
          outTime: formatTime(record.outTime),
          totalHours: record.status === "Half-Day" ? 4.0 : (record.status === "Absent" ? 0 : total),
          remarks: record.remarks,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
          createdBy: user?.CM_Full_Name || "System",
          userRole: userRole,
          locationRestricted: locationRestricted
        };
      });

      const res = await fetch("/api/attendance-bulk-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records)
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`✅ Successfully saved attendance for ${result.results.success} employees!`);
      } else {
        toast.error(result.error || "Submission failed");
      }

    } catch (error) {
      console.error(error);
      toast.error("Submission failed due to network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(e =>
    `${e.CM_First_Name} ${e.CM_Last_Name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Half-Day": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Absent": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Week-Off": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Quick Status Update
  const updateAllStatus = (status) => {
    const newState = { ...attendanceState };
    Object.keys(newState).forEach(key => {
      newState[key] = { ...newState[key], status };
    });
    setAttendanceState(newState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                Attendance Management
              </h1>
              <p className="text-slate-600 flex items-center gap-2">
                <FiUsers className="text-slate-400" />
                <span className="capitalize">{laborType} Employees • {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-blue-500">
                <TbUsersGroup className="text-blue-500" />
                <span className="text-sm text-black">{stats.total} Employees</span>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Present</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{stats.present}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 rounded-full h-2 transition-all duration-500" 
                  style={{ width: `${(stats.present / stats.total) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Absent</p>
                  <h3 className="text-2xl font-bold text-rose-600">{stats.absent}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                  <FiX className="w-6 h-6 text-rose-500" />
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-rose-500 rounded-full h-2 transition-all duration-500" 
                  style={{ width: `${(stats.absent / stats.total) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Half Day</p>
                  <h3 className="text-2xl font-bold text-amber-600">{stats.halfDay}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-amber-500 rounded-full h-2 transition-all duration-500" 
                  style={{ width: `${(stats.halfDay / stats.total) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Hours</p>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {Object.values(attendanceState).reduce((acc, curr) => {
                      if (curr.status === "Present") {
                        return acc + parseFloat(calculateTotalHours(curr.inTime, curr.outTime));
                      }
                      if (curr.status === "Half-Day") return acc + 4;
                      return acc;
                    }, 0).toFixed(1)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FiWatch className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Total worked hours today</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by employee name..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-blue-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 outline-none transition-all text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  {/* Date Picker */}
                  <div className="relative sm:w-64">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-blue-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-500 hover:border-slate-400 bg-white text-slate-700 transition-colors"
                >
                  <FiFilter />
                  <span className="hidden sm:inline">Filters</span>
                </button>
                
                {laborType !== "Office" && (
                  <div className="w-64">
                    <Select
                      options={projects.map(p => ({
                        value: p.CM_Project_ID,
                        label: p.CM_Project_Name,
                        latitude: p.CM_Latitude,
                        longitude: p.CM_Longitude,
                        radius: p.CM_Radius_Meters
                      }))}
                      value={globalProject}
                      onChange={handleGlobalProjectChange}
                      placeholder={locationRestricted ? "Select Project (Required)" : "Global Project"}
                      className="text-sm text-black py-3"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "0.75rem",
                          borderColor: "#6ca9f5ff",
                          minHeight: "50px",
                          boxShadow: "none",
                          "&:hover": {
                            borderColor: "#5a9bf7ff"
                          }
                        })
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Buttons */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 mr-2">Quick Actions:</span>
                  <button
                    onClick={() => updateAllStatus("Present")}
                    className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors text-sm font-medium"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => updateAllStatus("Absent")}
                    className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors text-sm font-medium"
                  >
                    Mark All Absent
                  </button>
                  <button
                    onClick={() => updateAllStatus("Half-Day")}
                    className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors text-sm font-medium"
                  >
                    Mark All Half Day
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Responsive Table / Grid */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                  <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">Loading Attendance Data</h3>
                <p className="text-slate-500">Please wait while we fetch the latest records...</p>
              </div>
            ) : (
              <>
                {/* Desktop/Tablet: Table View */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee Name</th>
                        <th className="p-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        {laborType !== "Office" && (
                          <th className="p-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Project</th>
                        )}
                        <th className="p-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Time</th>
                        <th className="p-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Shift & Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.map(emp => {
                        const state = attendanceState[emp.CM_Labor_Type_ID] || {};
                        const isPresent = state.status === "Present" || state.status === "Half-Day";

                        return (
                          <motion.tr
                            key={emp.CM_Labor_Type_ID}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`hover:bg-slate-50/50 transition-colors ${!isPresent ? "bg-slate-50/30" : ""}`}
                          >
                            {/* Employee */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium text-slate-800">
                                    {emp.CM_First_Name} {emp.CM_Last_Name}
                                  </h4>
                                  <p className="text-sm text-slate-500 font-mono">{emp.CM_Labor_Code}</p>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateRow(emp.CM_Labor_Type_ID, "status", isPresent ? "Absent" : "Present")}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${isPresent
                                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                        : "bg-white border-slate-300 text-slate-400 hover:border-slate-400"
                                      }`}
                                  >
                                    {isPresent ? <FiCheck className="w-5 h-5" /> : <FiX className="w-5 h-5" />}
                                  </button>
                                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(state.status)}`}>
                                    {state.status}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Project */}
                            {laborType !== "Office" && (
                              <td className="p-4">
                                <Select
                                  isDisabled={!isPresent || locationRestricted}
                                  options={projects.map(p => ({
                                    value: p.CM_Project_ID,
                                    label: p.CM_Project_Name
                                  }))}
                                  value={projects.find(p => p.CM_Project_ID === state.projectId) ? {
                                    value: state.projectId,
                                    label: projects.find(p => p.CM_Project_ID === state.projectId).CM_Project_Name
                                  } : null}
                                  onChange={(opt) => updateRow(emp.CM_Labor_Type_ID, "projectId", opt?.value)}
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderRadius: "0.5rem",
                                      borderColor: "#cbd5e1",
                                      minHeight: "38px",
                                      backgroundColor: !isPresent ? "#f8fafc" : "white"
                                    }),
                                    menuPortal: base => ({ ...base, zIndex: 9999 })
                                  }}
                                  placeholder={locationRestricted ? (globalProject?.label || "Global") : "Select project..."}
                                  className="text-sm min-w-[200px]"
                                />
                              </td>
                            )}

                            {/* Time */}
                            <td className="p-4">
                              <div className={`space-y-2 ${!isPresent ? "opacity-40" : ""}`}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-sm text-slate-600 w-8">IN</span>
                                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                    <select
                                      value={state.inTime?.hour}
                                      onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, hour: e.target.value })}
                                      className="bg-transparent border-none outline-none text-sm text-slate-700 px-2 py-1"
                                      disabled={!isPresent}
                                    >
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                        <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                      )}
                                    </select>
                                    <span className="text-slate-400">:</span>
                                    <input
                                      type="text"
                                      value={state.inTime?.minute || "00"}
                                      onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, minute: e.target.value })}
                                      className="w-12 bg-transparent border-none outline-none text-sm text-slate-700 text-center"
                                      disabled={!isPresent}
                                    />
                                    <button
                                      onClick={() => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, period: state.inTime.period === "AM" ? "PM" : "AM" })}
                                      className="px-2 py-1 text-xs text-black font-medium bg-white border border-green-300 rounded hover:bg-slate-50"
                                      disabled={!isPresent}
                                    >
                                      {state.inTime?.period}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                  <span className="text-sm text-slate-600 w-8">OUT</span>
                                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                    <select
                                      value={state.outTime?.hour}
                                      onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, hour: e.target.value })}
                                      className="bg-transparent border-none outline-none text-sm text-slate-700 px-2 py-1"
                                      disabled={!isPresent}
                                    >
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                        <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                      )}
                                    </select>
                                    <span className="text-slate-800">:</span>
                                    <input
                                      type="text"
                                      value={state.outTime?.minute || "00"}
                                      onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, minute: e.target.value })}
                                      className="w-12 bg-transparent border-none outline-none text-sm text-slate-700 text-center"
                                      disabled={!isPresent}
                                    />
                                    <button
                                      onClick={() => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, period: state.outTime.period === "AM" ? "PM" : "AM" })}
                                      className="px-2 py-1 text-xs text-black font-medium bg-white border border-green-300 rounded hover:bg-slate-50"
                                      disabled={!isPresent}
                                    >
                                      {state.outTime?.period}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="p-4">
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Shift/Work Type"
                                  value={state.shift || ""}
                                  onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "shift", e.target.value)}
                                  className="w-full text-black bg-slate-50 border border-blue-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <textarea
                                  placeholder="Add remarks..."
                                  value={state.remarks || ""}
                                  onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "remarks", e.target.value)}
                                  className="w-full text-black bg-slate-50 border border-blue-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-16"
                                  rows={2}
                                />
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}

                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan={laborType !== "Office" ? 5 : 4} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <FiUser className="w-10 h-10 text-slate-400" />
                              </div>
                              <h3 className="text-lg font-medium text-slate-700 mb-2">No Employees Found</h3>
                              <p className="text-slate-500 max-w-md">
                                {searchTerm 
                                  ? `No employees match "${searchTerm}". Try a different search term.`
                                  : "No employees available for the selected criteria."
                                }
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Grid/Card View */}
                <div className="md:hidden space-y-4 p-2">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <FiUser className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-2">No Employees Found</h3>
                      <p className="text-slate-500">
                        {searchTerm 
                          ? `No employees match "${searchTerm}".`
                          : "No employees available."
                        }
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const state = attendanceState[emp.CM_Labor_Type_ID] || {};
                      const isPresent = state.status === "Present" || state.status === "Half-Day";

                      return (
                        <motion.div
                          key={emp.CM_Labor_Type_ID}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                        >
                          {/* Employee Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">
                                  {emp.CM_First_Name} {emp.CM_Last_Name}
                                </h4>
                                <p className="text-xs text-slate-500 font-mono">{emp.CM_Labor_Code}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(state.status)}`}>
                              {state.status}
                            </span>
                          </div>

                          {/* Status Toggle */}
                          <div className="mb-4">
                            <button
                              onClick={() => updateRow(emp.CM_Labor_Type_ID, "status", isPresent ? "Absent" : "Present")}
                              className={`w-full py-2 rounded-lg border-2 font-medium transition-colors ${
                                isPresent
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              {isPresent ? "Mark Absent" : "Mark Present"}
                            </button>
                          </div>

                          {/* Project (if applicable) */}
                          {laborType !== "Office" && (
                            <div className="mb-3">
                              <label className="text-xs text-slate-500 block mb-1">Project</label>
                              <Select
                                isDisabled={!isPresent || locationRestricted}
                                options={projects.map(p => ({
                                  value: p.CM_Project_ID,
                                  label: p.CM_Project_Name
                                }))}
                                value={projects.find(p => p.CM_Project_ID === state.projectId) ? {
                                  value: state.projectId,
                                  label: projects.find(p => p.CM_Project_ID === state.projectId).CM_Project_Name
                                } : null}
                                onChange={(opt) => updateRow(emp.CM_Labor_Type_ID, "projectId", opt?.value)}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    borderRadius: "0.5rem",
                                    borderColor: "#cbd5e1",
                                    minHeight: "36px",
                                    fontSize: "0.875rem",
                                    backgroundColor: !isPresent ? "#f8fafc" : "white"
                                  }),
                                  menuPortal: base => ({ ...base, zIndex: 9999 })
                                }}
                                placeholder={locationRestricted ? (globalProject?.label || "Global") : "Select project..."}
                                className="text-sm"
                              />
                            </div>
                          )}

                          {/* Time IN/OUT */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">In Time</label>
                              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                <select
                                  value={state.inTime?.hour}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, hour: e.target.value })}
                                  className="bg-transparent border-none outline-none text-sm text-slate-700 px-1 py-0.5"
                                  disabled={!isPresent}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                  )}
                                </select>
                                <span>:</span>
                                <input
                                  type="text"
                                  value={state.inTime?.minute || "00"}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, minute: e.target.value })}
                                  className="w-10 bg-transparent border-none outline-none text-sm text-center"
                                  disabled={!isPresent}
                                />
                                <button
                                  onClick={() => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, period: state.inTime.period === "AM" ? "PM" : "AM" })}
                                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded ml-1"
                                  disabled={!isPresent}
                                >
                                  {state.inTime?.period}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block mb-1">Out Time</label>
                              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                <select
                                  value={state.outTime?.hour}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, hour: e.target.value })}
                                  className="bg-transparent border-none outline-none text-sm text-slate-700 px-1 py-0.5"
                                  disabled={!isPresent}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                  )}
                                </select>
                                <span>:</span>
                                <input
                                  type="text"
                                  value={state.outTime?.minute || "00"}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, minute: e.target.value })}
                                  className="w-10 bg-transparent border-none outline-none text-sm text-center"
                                  disabled={!isPresent}
                                />
                                <button
                                  onClick={() => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, period: state.outTime.period === "AM" ? "PM" : "AM" })}
                                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded ml-1"
                                  disabled={!isPresent}
                                >
                                  {state.outTime?.period}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Shift & Remarks */}
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Shift/Work Type"
                              value={state.shift || ""}
                              onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "shift", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none"
                            />
                            <textarea
                              placeholder="Remarks"
                              value={state.remarks || ""}
                              onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "remarks", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none resize-none h-12"
                              rows={1}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-800">{filteredEmployees.length}</span> of{" "}
                <span className="font-semibold text-slate-800">{employees.length}</span> employees
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-slate-600">Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-xs text-slate-600">Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-slate-600">Half Day</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || filteredEmployees.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <FiLoader className="animate-spin" />
                      Saving Changes...
                    </span>
                  ) : (
                    "Save Attendance"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location Alert for Engineers */}
        {locationRestricted && !globalProject && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <FiNavigation className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800">Location Verification Required</h4>
                <p className="text-sm text-amber-700">
                  As an engineer, you must select a project site to enable location-based attendance tracking.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AttendanceForm;