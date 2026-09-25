"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import { useAuthStore } from "@/app/store/useAuthScreenStore";
import { 
  Calendar, 
  Briefcase, 
  Clock, 
  FileText, 
  Save, 
  Filter,
  BarChart2,
  Users,
  User,
  X,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";

export default function WorkLogsPage() {
  const { user } = useAuthStore();
  const currentUserId = user?.CM_User_ID || user?.id || user?.user_id;
  const isOwner = user?.CM_Role_Description === "Owner" || user?.CM_Role_ID === "ROL000001";

  // Report State
  const [logs, setLogs] = useState([]);
  const [expandedLogGroups, setExpandedLogGroups] = useState(new Set());
  const [expandedProjectGroups, setExpandedProjectGroups] = useState(new Set());
  const [projects, setProjects] = useState([]);
  const [reportProjectId, setReportProjectId] = useState("all");
  const [reportEmployeeId, setReportEmployeeId] = useState("all");
  const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportToDate, setReportToDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUserId) return;
      try {
        const res = await fetch("/api/users-search");
        const data = await res.json();
        if (data.success && data.data) {
          if (isOwner) {
            setEmployees(data.data);
          } else {
            setEmployees(data.data.filter(emp => String(emp.CM_User_ID) === String(currentUserId)));
          }
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, [isOwner, currentUserId]);

  // Fetch Logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const url = new URL("/api/work-logs", window.location.origin);
        if (reportProjectId !== "all") {
          url.searchParams.append("projectId", reportProjectId);
        }
        
        if (!isOwner) {
          url.searchParams.append("userId", currentUserId);
        } else if (reportEmployeeId !== "all") {
          url.searchParams.append("userId", reportEmployeeId);
        }
        
        if (reportFromDate) {
          url.searchParams.append("fromDate", reportFromDate);
        }
        if (reportToDate) {
          url.searchParams.append("toDate", reportToDate);
        }
        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    if (currentUserId) {
      fetchLogs();
    }
  }, [reportProjectId, reportEmployeeId, reportFromDate, reportToDate, currentUserId, isOwner]);

  // Derived state for reported vs not reported employees
  const reportedUserIds = new Set(logs.map(l => String(l.userId)));
  const reportedEmployeesList = employees.filter(emp => reportedUserIds.has(String(emp.CM_User_ID)));
  const notReportedEmployeesList = employees.filter(emp => !reportedUserIds.has(String(emp.CM_User_ID)));

  // Project Summary
  const projectSummaryMap = {};
  logs.forEach(log => {
    const pKey = String(log.projectId);
    if (!projectSummaryMap[pKey]) {
      projectSummaryMap[pKey] = {
        projectId: log.projectId,
        projectName: log.projectName,
        employees: {},
        totalPersonDays: 0,
        totalLogs: 0
      };
    }
    const pGroup = projectSummaryMap[pKey];
    
    const eKey = String(log.userId);
    if (!pGroup.employees[eKey]) {
      pGroup.employees[eKey] = {
        userId: log.userId,
        userName: log.userName,
        userPhoto: log.userPhoto,
        uniqueDates: new Set(),
        totalLogs: 0
      };
    }
    
    const eGroup = pGroup.employees[eKey];
    if (log.date) {
      eGroup.uniqueDates.add(log.date);
    }
    eGroup.totalLogs += 1;
    pGroup.totalLogs += 1;
  });

  const projectSummaryList = Object.values(projectSummaryMap).map(pGroup => {
    const employeeList = Object.values(pGroup.employees).map(emp => ({
      ...emp,
      daysWorked: emp.uniqueDates.size
    })).sort((a, b) => b.daysWorked - a.daysWorked);

    const totalPersonDays = employeeList.reduce((sum, emp) => sum + emp.daysWorked, 0);

    return {
      ...pGroup,
      employeeList,
      totalPersonDays,
      employeeCount: employeeList.length
    };
  }).sort((a, b) => b.totalPersonDays - a.totalPersonDays);

  // Group Detailed Logs by Date and Employee
  const groupedLogs = [];
  logs.forEach(log => {
    const key = `${log.date}_${log.userId}`;
    let group = groupedLogs.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        id: log.id,
        date: log.date,
        userId: log.userId,
        userName: log.userName,
        userPhoto: log.userPhoto,
        entries: []
      };
      groupedLogs.push(group);
    }
    group.entries.push(log);
  });

  return (
    <div className="flex flex-col sm:flex-row h-[100dvh] bg-slate-50 font-sans">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full h-full">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Project Work Logs
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Track your daily work and generate project effort reports.</p>
        </div>

        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2 flex-1 w-full">
                <div className="flex items-center gap-2 text-slate-700 font-bold whitespace-nowrap">
                  <Filter className="w-5 h-5 text-indigo-500" /> Project:
                </div>
                <select
                  value={reportProjectId}
                  onChange={(e) => setReportProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 font-medium bg-slate-50 cursor-pointer text-sm"
                >
                  <option value="all">-- All Projects --</option>
                  {projects.map(p => (
                    <option key={p.CM_Project_ID} value={p.CM_Project_ID}>{p.CM_Project_Name}</option>
                  ))}
                </select>
              </div>

              {isOwner && (
                <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2 flex-1 w-full">
                  <div className="flex items-center gap-2 text-slate-700 font-bold whitespace-nowrap">
                    <User className="w-5 h-5 text-indigo-500" /> Employee:
                  </div>
                  <select
                    value={reportEmployeeId}
                    onChange={(e) => setReportEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 font-medium bg-slate-50 cursor-pointer text-sm"
                  >
                    <option value="all">-- All Employees --</option>
                    {employees.map(emp => (
                      <option key={emp.CM_User_ID} value={emp.CM_User_ID}>{emp.CM_Full_Name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full">
                <div className="flex flex-col flex-1 w-full relative">
                  <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold whitespace-nowrap">
                    <Calendar className="w-5 h-5 text-indigo-500" /> From Date:
                  </div>
                  <div className="relative w-full">
                    <input
                      type="date"
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 font-medium bg-slate-50 cursor-pointer text-sm"
                    />
                    {reportFromDate && (
                      <button 
                        onClick={() => setReportFromDate("")}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-500 transition-colors"
                        title="Clear From Date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col flex-1 w-full relative">
                  <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold whitespace-nowrap">
                    <Calendar className="w-5 h-5 text-indigo-500" /> To Date:
                  </div>
                  <div className="relative w-full">
                    <input
                      type="date"
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-700 font-medium bg-slate-50 cursor-pointer text-sm"
                    />
                    {reportToDate && (
                      <button 
                        onClick={() => setReportToDate("")}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-500 transition-colors"
                        title="Clear To Date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* Attendance Summary */}
            {(isOwner && reportFromDate && reportToDate && reportFromDate === reportToDate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reported */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-emerald-500">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Reported ({reportedEmployeesList.length})
                </h3>
                {reportedEmployeesList.length === 0 ? (
                  <div className="text-sm text-slate-400 font-medium">No one has reported.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {reportedEmployeesList.map(emp => (
                      <div key={emp.CM_User_ID} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {emp.CM_Full_Name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Not Reported */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-rose-500">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  Not Reported ({notReportedEmployeesList.length})
                </h3>
                {notReportedEmployeesList.length === 0 ? (
                  <div className="text-sm text-slate-400 font-medium">Everyone has reported.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {notReportedEmployeesList.map(emp => (
                      <div key={emp.CM_User_ID} className="bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {emp.CM_Full_Name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Project Summary */}
            {isOwner && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8 mb-8">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" /> 
                    Project & Employee Summary (Days Worked)
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider font-bold text-slate-500">
                        <th className="p-4 py-3">Project</th>
                        <th className="p-4 py-3">Total Employees</th>
                        <th className="p-4 py-3 text-right">Total Person-Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectSummaryList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">No data available.</td>
                        </tr>
                      ) : (
                        projectSummaryList.map(item => {
                          const isExpanded = expandedProjectGroups.has(item.projectId);
                          const hasMultiple = item.employeeCount > 1;

                          const toggleProject = () => {
                            const newSet = new Set(expandedProjectGroups);
                            if (newSet.has(item.projectId)) newSet.delete(item.projectId);
                            else newSet.add(item.projectId);
                            setExpandedProjectGroups(newSet);
                          };

                          return (
                            <React.Fragment key={item.projectId}>
                              <tr 
                                className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${hasMultiple ? 'cursor-pointer' : ''}`}
                                onClick={() => hasMultiple && toggleProject()}
                              >
                                <td className="p-4 text-sm font-semibold text-slate-700">
                                  <div className="flex items-center gap-2">
                                    {hasMultiple && (
                                      isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-indigo-500" />
                                    )}
                                    {!hasMultiple && <div className="w-4 h-4" />}
                                    {item.projectName}
                                  </div>
                                </td>
                                <td className="p-4 text-sm font-bold text-indigo-700">
                                  {item.employeeCount} {item.employeeCount === 1 ? 'Employee' : 'Employees'}
                                </td>
                                <td className="p-4 text-sm font-black text-slate-700 text-right">{item.totalPersonDays} {item.totalPersonDays === 1 ? 'day' : 'days'}</td>
                              </tr>
                              
                              {/* Expanded Rows for Employees */}
                              {isExpanded && item.employeeList.map((emp) => (
                                <tr key={`${item.projectId}_${emp.userId}`} className="border-b border-indigo-50 bg-indigo-50/30">
                                  <td className="p-4 text-xs font-medium text-slate-500 pl-12 border-l-2 border-indigo-200 leading-relaxed max-w-[200px]">
                                    {Array.from(emp.uniqueDates).sort().map(d => {
                                      const dt = new Date(d);
                                      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                    }).join(', ')}
                                  </td>
                                  <td className="p-4 text-sm font-bold text-indigo-900 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase overflow-hidden shrink-0">
                                      {emp.userPhoto ? (
                                        <img src={emp.userPhoto} alt={emp.userName} className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-4 h-4" />
                                      )}
                                    </div>
                                    <span className="truncate">{emp.userName}</span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="text-sm font-bold text-slate-600">
                                      {emp.daysWorked} {emp.daysWorked === 1 ? 'day' : 'days'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-500" /> 
                  Detailed Work Logs
                </h3>
              </div>
              
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider font-bold text-slate-500">
                      <th className="p-4 py-3">Date</th>
                      <th className="p-4 py-3">Employee</th>
                      <th className="p-4 py-3">Project</th>
                      <th className="p-4 py-3">Work Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Loading logs...</td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No work logs match this filter.</td>
                      </tr>
                    ) : (
                      groupedLogs.map((group, index) => {
                        const showDate = index === 0 || group.date !== groupedLogs[index - 1].date;
                        const showEmployee = showDate || group.userId !== groupedLogs[index - 1].userId;
                        const isExpanded = expandedLogGroups.has(group.key);
                        const hasMultiple = group.entries.length > 1;

                        const toggleGroup = () => {
                          const newSet = new Set(expandedLogGroups);
                          if (newSet.has(group.key)) newSet.delete(group.key);
                          else newSet.add(group.key);
                          setExpandedLogGroups(newSet);
                        };

                        return (
                          <React.Fragment key={group.key}>
                            {/* Main Row */}
                            <tr 
                              className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${hasMultiple ? 'cursor-pointer' : ''}`}
                              onClick={() => hasMultiple && toggleGroup()}
                            >
                              <td className="p-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                                {showDate && group.date}
                              </td>
                              <td className="p-4 text-sm font-bold text-indigo-700">
                                {showEmployee && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase overflow-hidden shrink-0">
                                      {group.userPhoto ? (
                                        <img src={group.userPhoto} alt={group.userName} className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-4 h-4" />
                                      )}
                                    </div>
                                    <span className="truncate">{group.userName}</span>
                                  </div>
                                )}
                              </td>
                              
                              {hasMultiple ? (
                                <td colSpan="2" className="p-4 text-sm font-semibold text-indigo-500">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    {group.entries.length} Work Logs
                                  </div>
                                </td>
                              ) : (
                                <>
                                  <td className="p-4 text-sm font-semibold text-slate-600">{group.entries[0].projectName}</td>
                                  <td className="p-4 text-sm text-slate-600 line-clamp-2 md:line-clamp-none">{group.entries[0].description}</td>
                                </>
                              )}
                            </tr>

                            {/* Expanded Rows */}
                            {hasMultiple && isExpanded && group.entries.map((log) => (
                              <tr key={log.id} className="border-b border-indigo-50 bg-indigo-50/30">
                                <td className="p-4"></td>
                                <td className="p-4"></td>
                                <td className="p-4 text-sm font-semibold text-indigo-900 border-l-2 border-indigo-200">{log.projectName}</td>
                                <td className="p-4 text-sm text-slate-700 line-clamp-2 md:line-clamp-none">{log.description}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
