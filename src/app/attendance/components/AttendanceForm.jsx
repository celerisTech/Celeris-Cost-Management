"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store/useAuthScreenStore";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiUser,
  FiClock,
  FiSave,
  FiCheck,
  FiX,
  FiFilter,
  FiSearch,
  FiLoader,
  FiCheckCircle,
  FiUsers,
  FiNavigation,
  FiWatch,
  FiGrid,
  FiCheckSquare
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

  // Initialize date & role
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
        const rawLaborData = await laborRes.json();
        const laborData = rawLaborData.filter(emp => emp.CM_Status === 'Active');

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
            shift: "Day",
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
                shift: record.CM_Shift || "Day",
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
    `${e.CM_First_Name} ${e.CM_Last_Name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.CM_Labor_Code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status Badge Helper
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-emerald-200 text-gray-700 font-bold border-emerald-400";
      case "Half-Day": return "bg-amber-200 text-gray-700 font-bold border-amber-400";
      case "Absent": return "bg-rose-100 text-gray-700 font-bold border-rose-400";
      case "Week-Off": return "bg-blue-100 text-gray-700 font-bold border-blue-400";
      default: return "bg-slate-200 text-slate-700 border-slate-300";
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
    <div className="space-y-4">
      {/* ---------- HEADER METRICS BAR (EXCEL STYLE) ---------- */}
      <div className="bg-white border border-blue-200 rounded-xl p-2 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1">
          <div>
            <h2 className="text-xl sm:text-xl font-black text-blue-500 tracking-tight flex items-center gap-2">
              <FiGrid className="text-blue-500" />
              Daily Attendance Sheet
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <TbUsersGroup className="text-blue-700 text-lg" />
              <span className="text-xs font-bold text-blue-900">{stats.total} Total Staff</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || filteredEmployees.length === 0}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md border border-blue-900 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Saving Sheet...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Excel Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/70 border-l-4 border-emerald-600 rounded-lg p-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present</p>
              <h3 className="text-2xl font-black text-emerald-700">{stats.present}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FiCheckCircle size={20} />
            </div>
          </div>

          <div className="bg-rose-50/70 border-l-4 border-rose-600 rounded-lg p-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Absent</p>
              <h3 className="text-2xl font-black text-rose-700">{stats.absent}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
              <FiX size={20} />
            </div>
          </div>

          <div className="bg-amber-50/70 border-l-4 border-amber-600 rounded-lg p-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Half Day</p>
              <h3 className="text-2xl font-black text-amber-700">{stats.halfDay}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              <FiClock size={20} />
            </div>
          </div>

          <div className="bg-blue-50/70 border-l-4 border-blue-600 rounded-lg p-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Hours</p>
              <h3 className="text-2xl font-black text-blue-800">
                {Object.values(attendanceState).reduce((acc, curr) => {
                  if (curr.status === "Present") {
                    return acc + parseFloat(calculateTotalHours(curr.inTime, curr.outTime));
                  }
                  if (curr.status === "Half-Day") return acc + 4;
                  return acc;
                }, 0).toFixed(1)} hrs
              </h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
              <FiWatch size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- TOOLBAR & FILTERS ---------- */}
      <div className="bg-white">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search & Date Input */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                type="text"
                placeholder="Filter by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-slate-800 font-medium placeholder-slate-400 bg-white"
              />
            </div>

            <div className="relative">
              <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-slate-800 font-medium bg-white"
              />
            </div>
          </div>

          {/* Quick Actions & Project Picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 bg-white text-blue-900 font-bold text-xs shadow-sm transition-colors"
            >
              <FiFilter className="text-blue-700" />
              <span>Bulk Quick Actions</span>
            </button>

            {laborType !== "Office" && (
              <div className="w-56 sm:w-64">
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
                  placeholder={locationRestricted ? "Select Project *" : "Global Project"}
                  className="text-xs text-black"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      borderColor: "#93c5fd",
                      minHeight: "38px",
                      fontSize: "0.85rem",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#2563eb" }
                    })
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Batch Status Buttons */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-3 border-t border-blue-100 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">Set All:</span>
            <button
              onClick={() => updateAllStatus("Present")}
              className="px-3 py-1.5 rounded-lg bg-emerald-200 text-gray-700 font-bold text-xs hover:bg-emerald-300 shadow-sm transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => updateAllStatus("Absent")}
              className="px-3 py-1.5 rounded-lg bg-rose-200 text-gray-700 font-bold text-xs hover:bg-rose-300 shadow-sm transition-colors"
            >
              Mark All Absent
            </button>
            <button
              onClick={() => updateAllStatus("Half-Day")}
              className="px-3 py-1.5 rounded-lg bg-amber-200 text-gray-700 font-bold text-xs hover:bg-amber-300 shadow-sm transition-colors"
            >
              Mark All Half Day
            </button>
            <button
              onClick={() => updateAllStatus("Week-Off")}
              className="px-3 py-1.5 rounded-lg bg-blue-200 text-gray-700 font-bold text-xs hover:bg-blue-300 shadow-sm transition-colors"
            >
              Mark All Week Off
            </button>
          </motion.div>
        )}
      </div>

      {/* ---------- RESPONSIVE EXCEL TABLE & MOBILE GRID ---------- */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3 border border-blue-200">
              <FiLoader className="w-7 h-7 text-blue-700 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-blue-900 mb-1">Loading Excel Spreadsheet Data</h3>
            <p className="text-xs text-slate-500">Fetching employee records for {laborType}...</p>
          </div>
        ) : (
          <>
            {/* ================= DESKTOP VIEW: EXCEL SPREADSHEET TABLE ================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border border-blue-200 bg-white text-xs">
                <thead>
                  <tr className="bg-blue-200 text-gray-800 border-b-2 border-blue-500 text-left font-bold uppercase tracking-wider">
                    <th className="border border-blue-300/60 p-2.5 w-12 text-center">#</th>
                    <th className="border border-blue-300/60 p-2.5 min-w-[200px]">Employee Name & Code</th>
                    <th className="border border-blue-300/60 p-2.5 w-36 text-center">Status</th>
                    {laborType !== "Office" && (
                      <th className="border border-blue-300/60 p-2.5 min-w-[180px]">Project Assignment</th>
                    )}
                    <th className="border border-blue-300/60 p-2.5 w-36 text-center">In Time</th>
                    <th className="border border-blue-300/60 p-2.5 w-36 text-center">Out Time</th>
                    <th className="border border-blue-300/60 p-2.5 w-28 text-center">Shift</th>
                    <th className="border border-blue-300/60 p-2.5 min-w-[200px]">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredEmployees.map((emp, index) => {
                    const state = attendanceState[emp.CM_Labor_Type_ID] || {};
                    const isPresent = state.status === "Present" || state.status === "Half-Day";
                    const isOdd = index % 2 === 1;

                    return (
                      <tr
                        key={emp.CM_Labor_Type_ID}
                        className={`transition-colors hover:bg-blue-100/50 ${isOdd ? "bg-blue-50/40" : "bg-white"} ${!isPresent ? "opacity-90" : ""}`}
                      >
                        {/* Index */}
                        <td className="border border-blue-200 p-2 text-center font-bold text-slate-700 bg-slate-50">
                          {index + 1}
                        </td>

                        {/* Employee Name */}
                        <td className="border border-blue-200 p-2">
                          <div className="font-bold text-slate-900 text-sm">
                            {emp.CM_First_Name} {emp.CM_Last_Name}
                          </div>
                          <div className="text-[11px] text-blue-700 font-semibold">{emp.CM_Labor_Code}</div>
                        </td>

                        {/* Status Selector */}
                        <td className="border border-blue-200 p-1 text-center">
                          <select
                            value={state.status}
                            onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "status", e.target.value)}
                            className={`w-full py-1.5 px-2 text-xs rounded border outline-none font-bold cursor-pointer transition-all ${getStatusColor(state.status)}`}
                          >
                            <option value="Present" className="bg-white text-emerald-300 font-bold">Present</option>
                            <option value="Absent" className="bg-white text-rose-700 font-bold">Absent</option>
                            <option value="Half-Day" className="bg-white text-amber-700 font-bold">Half-Day</option>
                            <option value="Week-Off" className="bg-white text-blue-700 font-bold">Week-Off</option>
                          </select>
                        </td>

                        {/* Project Select */}
                        {laborType !== "Office" && (
                          <td className="border border-blue-200 p-1">
                            <select
                              disabled={!isPresent || locationRestricted}
                              value={state.projectId || ""}
                              onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "projectId", e.target.value)}
                              className="w-full py-1.5 px-2 text-xs border border-blue-200 rounded outline-none bg-white text-slate-800 focus:border-blue-600 disabled:bg-slate-100 disabled:opacity-60"
                            >
                              <option value="" disabled>{locationRestricted ? (globalProject?.label || "Global Project Required") : "Select project..."}</option>
                              {projects.map(p => (
                                <option key={p.CM_Project_ID} value={p.CM_Project_ID}>{p.CM_Project_Name}</option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* In Time */}
                        <td className="border border-blue-200 p-1 text-center">
                          <div className={`flex items-center justify-center bg-white border border-blue-200 rounded py-1 px-1 ${!isPresent ? "opacity-40 pointer-events-none" : ""}`}>
                            <select
                              value={state.inTime?.hour}
                              onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, hour: e.target.value })}
                              className="bg-transparent outline-none text-xs font-bold text-slate-800 w-7 text-center"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                              )}
                            </select>
                            <span className="text-slate-400 font-bold">:</span>
                            <input
                              type="text"
                              value={state.inTime?.minute || "00"}
                              onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, minute: e.target.value })}
                              className="w-6 bg-transparent outline-none text-xs font-bold text-slate-800 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, period: state.inTime.period === "AM" ? "PM" : "AM" })}
                              className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-900 font-bold rounded hover:bg-blue-200 ml-1"
                            >
                              {state.inTime?.period}
                            </button>
                          </div>
                        </td>

                        {/* Out Time */}
                        <td className="border border-blue-200 p-1 text-center">
                          <div className={`flex items-center justify-center bg-white border border-blue-200 rounded py-1 px-1 ${!isPresent ? "opacity-40 pointer-events-none" : ""}`}>
                            <select
                              value={state.outTime?.hour}
                              onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, hour: e.target.value })}
                              className="bg-transparent outline-none text-xs font-bold text-slate-800 w-7 text-center"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                              )}
                            </select>
                            <span className="text-slate-400 font-bold">:</span>
                            <input
                              type="text"
                              value={state.outTime?.minute || "00"}
                              onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, minute: e.target.value })}
                              className="w-6 bg-transparent outline-none text-xs font-bold text-slate-800 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, period: state.outTime.period === "AM" ? "PM" : "AM" })}
                              className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-900 font-bold rounded hover:bg-blue-200 ml-1"
                            >
                              {state.outTime?.period}
                            </button>
                          </div>
                        </td>

                        {/* Shift */}
                        <td className="border border-blue-200 p-1">
                          <input
                            type="text"
                            placeholder="Shift"
                            value={state.shift || ""}
                            onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "shift", e.target.value)}
                            className="w-full py-1.5 px-2 text-xs border border-blue-200 rounded outline-none bg-white text-slate-800 text-center font-medium focus:border-blue-600"
                          />
                        </td>

                        {/* Remarks */}
                        <td className="border border-blue-200 p-1">
                          <input
                            type="text"
                            placeholder="Remarks..."
                            value={state.remarks || ""}
                            onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "remarks", e.target.value)}
                            className="w-full py-1.5 px-2 text-xs border border-blue-200 rounded outline-none bg-white text-slate-800 focus:border-blue-600"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={laborType !== "Office" ? 8 : 7} className="p-8 text-center bg-white">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2 border border-blue-200">
                            <FiUser className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-blue-900 mb-1">No Employees Found</h3>
                          <p className="text-xs text-slate-500">
                            {searchTerm ? `No employee matching "${searchTerm}"` : "No employees registered under this category."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE VIEW: RESPONSIVE EXCEL GRID CARDS ================= */}
            <div className="md:hidden p-3 bg-slate-50">
              {filteredEmployees.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-blue-200">
                  <FiUser className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-blue-900">No Employees Found</h3>
                  <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredEmployees.map((emp, index) => {
                    const state = attendanceState[emp.CM_Labor_Type_ID] || {};
                    const isPresent = state.status === "Present" || state.status === "Half-Day";

                    return (
                      <div
                        key={emp.CM_Labor_Type_ID}
                        className="bg-white rounded-xl border border-blue-300 shadow-sm overflow-hidden flex flex-col"
                      >
                        {/* Header Bar */}
                        <div className="bg-blue-100 text-gray-700 px-3 py-2 flex items-center justify-between border-b border-blue-900">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center border border-blue-500">
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-xs text-gray-700">
                                {emp.CM_First_Name} {emp.CM_Last_Name}
                              </h4>
                              <span className="text-[10px] text-gray-600">{emp.CM_Labor_Code}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(state.status)}`}>
                            {state.status}
                          </span>
                        </div>

                        {/* Body Grid Controls */}
                        <div className="p-3 space-y-3 bg-white text-xs">
                          {/* Quick Status Buttons */}
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Mark Status</label>
                            <div className="grid grid-cols-4 gap-1">
                              {["Present", "Absent", "Half-Day", "Week-Off"].map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => updateRow(emp.CM_Labor_Type_ID, "status", st)}
                                  className={`py-1.5 px-1 rounded text-[10px] font-bold border text-center transition-all ${
                                    state.status === st ? getStatusColor(st) : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50"
                                  }`}
                                >
                                  {st === "Half-Day" ? "Half" : st === "Week-Off" ? "Off" : st}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Project Assignment */}
                          {laborType !== "Office" && (
                            <div>
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Project Site</label>
                              <select
                                disabled={!isPresent || locationRestricted}
                                value={state.projectId || ""}
                                onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "projectId", e.target.value)}
                                className="w-full py-1.5 px-2 text-xs border border-blue-300 rounded bg-white text-slate-800 outline-none disabled:bg-slate-100 disabled:opacity-60"
                              >
                                <option value="" disabled>{locationRestricted ? (globalProject?.label || "Global Project Required") : "Select project..."}</option>
                                {projects.map(p => (
                                  <option key={p.CM_Project_ID} value={p.CM_Project_ID}>{p.CM_Project_Name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Times Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">In Time</label>
                              <div className={`flex items-center justify-between border border-blue-200 rounded p-1 bg-blue-50/30 ${!isPresent ? "opacity-50 pointer-events-none" : ""}`}>
                                <select
                                  value={state.inTime?.hour}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, hour: e.target.value })}
                                  className="bg-transparent outline-none text-xs font-bold text-slate-800"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                  )}
                                </select>
                                <span className="font-bold text-slate-400">:</span>
                                <input
                                  type="text"
                                  value={state.inTime?.minute || "00"}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, minute: e.target.value })}
                                  className="w-5 bg-transparent outline-none text-xs font-bold text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateRow(emp.CM_Labor_Type_ID, "inTime", { ...state.inTime, period: state.inTime.period === "AM" ? "PM" : "AM" })}
                                  className="px-1 py-0.5 text-[9px] bg-blue-700 text-white font-bold rounded"
                                >
                                  {state.inTime?.period}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Out Time</label>
                              <div className={`flex items-center justify-between border border-blue-200 rounded p-1 bg-blue-50/30 ${!isPresent ? "opacity-50 pointer-events-none" : ""}`}>
                                <select
                                  value={state.outTime?.hour}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, hour: e.target.value })}
                                  className="bg-transparent outline-none text-xs font-bold text-slate-800"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => 
                                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                                  )}
                                </select>
                                <span className="font-bold text-slate-400">:</span>
                                <input
                                  type="text"
                                  value={state.outTime?.minute || "00"}
                                  onChange={e => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, minute: e.target.value })}
                                  className="w-5 bg-transparent outline-none text-xs font-bold text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateRow(emp.CM_Labor_Type_ID, "outTime", { ...state.outTime, period: state.outTime.period === "AM" ? "PM" : "AM" })}
                                  className="px-1 py-0.5 text-[9px] bg-blue-700 text-white font-bold rounded"
                                >
                                  {state.outTime?.period}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Shift & Remarks */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Shift (e.g. Day)"
                                value={state.shift || ""}
                                onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "shift", e.target.value)}
                                className="w-full border border-blue-200 rounded px-2 py-1 text-xs outline-none bg-white font-medium"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Remarks..."
                                value={state.remarks || ""}
                                onChange={(e) => updateRow(emp.CM_Labor_Type_ID, "remarks", e.target.value)}
                                className="w-full border border-blue-200 rounded px-2 py-1 text-xs outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ---------- FOOTER SAVE BAR ---------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-bold text-blue-900">
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || filteredEmployees.length === 0}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-lg shadow-md border border-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="animate-spin" />
              <span>Submitting Attendance...</span>
            </>
          ) : (
            <>
              <FiCheckSquare size={16} />
              <span>Save & Submit Register</span>
            </>
          )}
        </button>
      </div>

      {/* Location Warning for Engineers */}
      {locationRestricted && !globalProject && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3">
          <FiNavigation className="text-amber-700 text-lg flex-shrink-0" />
          <p className="text-xs font-bold text-amber-900">
            Engineer Location Guard Enabled: Please select a Project Site in the toolbar above before submitting attendance.
          </p>
        </div>
      )}
    </div>
  );
}

export default AttendanceForm;