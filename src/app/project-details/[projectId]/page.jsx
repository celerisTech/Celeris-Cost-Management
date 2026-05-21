"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ArrowLeft, LayoutDashboard, Calendar, DollarSign, Users, Package, Download, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default function ProjectDetails({ params }) {
  // Properly unwrap params with React.use()
  const { projectId } = React.use(params);

  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/project-details/${projectId}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch project details");
        }

        const data = await res.json();
        setProjectData(data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-6 bg-white rounded-lg shadow-lg text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
          <span className="text-gray-700 font-medium">Loading Project Details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-center">Error: {error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 flex items-center text-orange-600 hover:text-orange-800 mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="p-6 bg-white rounded-lg shadow-lg text-center">
          <p className="text-gray-500">No project data found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 flex items-center text-orange-600 hover:text-orange-800 mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  // Function to export tab data as CSV
  const exportCurrentTabData = () => {
    let csvContent = "";
    let filename = `project-${projectData.project.CM_Project_Code}-`;

    if (activeTab === 'materials') {
      filename += 'materials';
      // Headers
      csvContent = "Product ID,Product Name,Total Qty,Used Qty,Remaining Qty,Unit Type,Unit Price,Used Price,Remaining Price,Total Price\n";
      // Data
      projectData.materials.forEach(m => {
        csvContent += `${m.CM_Product_ID},"${m.CM_Product_Name}",${m.Total_Qty},${m.CM_Used_Quantity},${m.CM_Quantity},${m.CM_Unit_Type},${m.Unit_Price},${m.Used_Price},${m.Remaining_Price},${m.CM_Total_Price}\n`;
      });
    } else if (activeTab === 'labor') {
      filename += 'labor';
      // Headers
      csvContent = "Labor ID,Name,Role,Type,Wage Type,Rate,Days Present,Total Hours,Total Cost\n";
      // Data
      projectData.labor.forEach(l => {
        csvContent += `${l.Labor_ID},"${l.CM_First_Name}","${l.CM_Last_Name}","${l.Role}",${l.CM_Labor_Type},${l.CM_Wage_Type},${l.Hourly_Rate},${l.Days_Present},${l.Total_Hours},${l.Total_Cost}\n`;
      });
    } else if (activeTab === 'workDates') {
      filename += 'workDates';
      // Headers
      csvContent = "Date,Labor Count,Present Count,Total Hours,Daily Cost\n";
      // Data
      projectData.workingDates.forEach(d => {
        csvContent += `${formatDate(d.Work_Date)},${d.Labor_Count},${d.Present_Count},${d.Total_Hours},${d.Daily_Labor_Cost}\n`;
      });
    } else {
      filename += 'overview';
      // Overview data - simple project summary
      csvContent = "Project ID,Project Name,Project Type,Status,Estimated Cost,Actual Cost,Cost Variance,Material Cost,Labor Cost\n";
      csvContent += `${projectData.project.CM_Project_Code},"${projectData.project.CM_Project_Name}",${projectData.project.CM_Project_Type},${projectData.project.CM_Status},${projectData.project.CM_Estimated_Cost},${projectData.project.Actual_Cost},${projectData.project.Cost_Variance},${projectData.project.Total_Material_Cost},${projectData.project.Total_Labor_Cost}\n`;
    }

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getProjectTypeColor = (projectType) => {
    switch (projectType) {
      case 'Web Development':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mobile Application':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Web Application':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectTypeIcon = (projectType) => {
    switch (projectType) {
      case 'Web Development':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'Mobile Application':
        return <Zap className="h-4 w-4 text-purple-600" />;
      case 'Web Application':
        return <Zap className="h-4 w-4 text-green-600" />;
      default:
        return <Zap className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const start = new Date(projectData.project.CM_Planned_Start_Date);
    const end = new Date(projectData.project.CM_Planned_End_Date);
    const today = new Date();

    if (today < start) return 0;
    if (today > end) return 100;

    const totalDuration = end - start;
    const elapsed = today - start;
    return Math.round((elapsed / totalDuration) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      {/* Navbar */}
      <Navbar />
      <div className="md:p-6 flex-1 overflow-y-auto p-3">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          {/* Header with back button and export */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {projectData.project.CM_Project_Name}
                </h2>
                <div className="flex flex-wrap items-center mt-1 gap-2">
                  <span className="text-gray-600 text-sm">Code: {projectData.project.CM_Project_Code}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getProjectTypeColor(projectData.project.CM_Project_Type)}`}>
                    {getProjectTypeIcon(projectData.project.CM_Project_Type)}
                    {projectData.project.CM_Project_Type || "N/A"}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(projectData.project.CM_Status)}`}>
                    {projectData.project.CM_Status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={exportCurrentTabData}
              className="mt-3 md:mt-0 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center text-sm"
            >
              <Download size={16} className="mr-2" />
              Export Data
            </button>
          </div>

          {/* Progress Bar with Task-based Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Project Progress (Based on Tasks)</span>
              <span>{projectData.project.Progress_Percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${projectData.project.Progress_Percentage}%` }}
              ></div>
            </div>

            {/* Task Progress Breakdown */}
            {projectData.project.Task_Progress && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{projectData.project.Task_Progress.completed}</div>
                  <div className="text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{projectData.project.Task_Progress.inProgress}</div>
                  <div className="text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{projectData.project.Task_Progress.pending}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">{projectData.project.Task_Progress.onHold}</div>
                  <div className="text-gray-500">On Hold</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-600">{projectData.project.Task_Progress.total}</div>
                  <div className="text-gray-500">Total Tasks</div>
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Start: {formatDate(projectData.project.CM_Planned_Start_Date)}</span>
              <span>End: {formatDate(projectData.project.CM_Planned_End_Date)}</span>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-6">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "materials", label: "Materials", icon: Package },
                { id: "labor", label: "Labor", icon: Users },
                { id: "workDates", label: "Working Dates", icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 flex items-center whitespace-nowrap ${activeTab === tab.id
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-blue-700 font-medium">Estimated Cost</h3>
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-800 mt-2">{formatCurrency(projectData.project.CM_Estimated_Cost)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-purple-700 font-medium">Actual Cost</h3>
                    <DollarSign className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-800 mt-2">{formatCurrency(projectData.project.Actual_Cost)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${(projectData.project.Cost_Variance || 0) < 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${(projectData.project.Cost_Variance || 0) < 0 ? "text-red-700" : "text-green-700"}`}>Cost Variance</h3>
                    <DollarSign className={`h-5 w-5 ${(projectData.project.Cost_Variance || 0) < 0 ? "text-red-400" : "text-green-400"}`} />
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${(projectData.project.Cost_Variance || 0) < 0 ? "text-red-800" : "text-green-800"}`}>
                    {formatCurrency(projectData.project.Cost_Variance)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <h3 className="text-gray-700 font-medium">Total Material Cost</h3>
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mt-2">{formatCurrency(projectData.project.Total_Material_Cost)}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <div className="flex items-start justify-between">
                    <h3 className="text-teal-700 font-medium">Used Material</h3>
                    <Package className="h-5 w-5 text-teal-400" />
                  </div>
                  <p className="text-xl font-bold text-teal-800 mt-2">{formatCurrency(projectData.project.Used_Material_Cost)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <h3 className="text-indigo-700 font-medium">Remaining Material</h3>
                    <Package className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className="text-xl font-bold text-indigo-800 mt-2">{formatCurrency(projectData.project.Remaining_Material_Cost)}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between">
                    <h3 className="text-amber-700 font-medium">Labor Cost</h3>
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-xl font-bold text-amber-800 mt-2">{formatCurrency(projectData.project.Total_Labor_Cost)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border rounded-lg bg-white">
                  <h3 className="text-lg font-medium mb-3 text-gray-800 flex items-center">
                    <LayoutDashboard className="h-4 w-4 mr-2 text-blue-500" />
                    Project Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 w-28">Project Type</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getProjectTypeColor(projectData.project.CM_Project_Type)}`}>
                        {getProjectTypeIcon(projectData.project.CM_Project_Type)}
                        {projectData.project.CM_Project_Type || "N/A"}
                      </span>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 w-28">Location</p>
                      <p className="font-medium text-gray-800">{projectData.project.CM_Project_Location || "—"}</p>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 w-28">Customer</p>
                      <p className="font-medium text-gray-800">{projectData.project.CM_Customer_Name || "—"}</p>
                    </div>
                    <div className="flex">
                      <p className="text-sm text-gray-500 w-28">Description</p>
                      <p className="font-medium text-gray-800">{projectData.project.CM_Description || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border rounded-lg bg-white">
                  <h3 className="text-lg font-medium mb-3 text-gray-800 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-violet-600" />
                    Schedule & Progress
                  </h3>
                  <div className="space-y-4">
                    <div className="flex border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 w-28">Start Date</p>
                      <p className="font-medium text-gray-800">{formatDate(projectData.project.CM_Planned_Start_Date)}</p>
                    </div>
                    <div className="flex border-b border-gray-100 pb-3">
                      <p className="text-sm text-gray-500 w-28">End Date</p>
                      <p className="font-medium text-gray-800">{formatDate(projectData.project.CM_Planned_End_Date)}</p>
                    </div>
                    {/* Progress Bar with Task-based Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Project Progress (Based on Tasks)</span>
                        <span>{projectData.project.Progress_Percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${projectData.project.Progress_Percentage}%` }}
                        ></div>
                      </div>

                      {/* Task Progress Breakdown */}
                      {projectData.project.Task_Progress && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{projectData.project.Task_Progress.completed}</div>
                            <div className="text-gray-500">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{projectData.project.Task_Progress.inProgress}</div>
                            <div className="text-gray-500">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600">{projectData.project.Task_Progress.pending}</div>
                            <div className="text-gray-500">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">{projectData.project.Task_Progress.onHold}</div>
                            <div className="text-gray-500">On Hold</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600">{projectData.project.Task_Progress.total}</div>
                            <div className="text-gray-500">Total Tasks</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex">
                      <p className="text-sm text-gray-500 w-28">Status</p>
                      <p className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(projectData.project.CM_Status)}`}>
                        {projectData.project.CM_Status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === "materials" && (
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-violet-500" />
                  Project Materials
                </h3>
              </div>

              {/* Material cost summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                  <h4 className="text-sm font-medium text-gray-700">Total Material Cost</h4>
                  <p className="text-xl font-bold text-gray-800 mt-2">{formatCurrency(projectData.project.Total_Material_Cost)}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <h4 className="text-sm font-medium text-teal-700">Used Material Cost</h4>
                  <p className="text-xl font-bold text-teal-800 mt-2">{formatCurrency(projectData.project.Used_Material_Cost)}</p>
                  <p className="text-xs text-teal-600 mt-1">
                    {projectData.project.Total_Material_Cost > 0 ?
                      `${((projectData.project.Used_Material_Cost / projectData.project.Total_Material_Cost) * 100).toFixed(1)}% of total` :
                      '0% of total'
                    }
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="text-sm font-medium text-indigo-700">Remaining Material</h4>
                  <p className="text-xl font-bold text-indigo-800 mt-2">{formatCurrency(projectData.project.Remaining_Material_Cost)}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {projectData.project.Total_Material_Cost > 0 ?
                      `${((projectData.project.Remaining_Material_Cost / projectData.project.Total_Material_Cost) * 100).toFixed(1)}% of total` :
                      '0% of total'
                    }
                  </p>
                </div>
              </div>

              {(!projectData.materials || projectData.materials.length === 0) ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No materials found for this project.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Used Qty</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Remaining</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Used Price</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {projectData.materials.map((material, idx) => (
                            <tr key={`material-${idx}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{material.CM_Product_Name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{material.Total_Qty}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{material.Total_Used_Qty}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{material.Remaining_Qty}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{material.CM_Unit_Type}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(material.Unit_Price)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(material.Used_Price)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(material.Remaining_Price)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(material.CM_Total_Price)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={6}>Total</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(projectData.project.Used_Material_Cost)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(projectData.project.Remaining_Material_Cost)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(projectData.project.Total_Material_Cost)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {projectData.productUpdates && projectData.productUpdates.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-red-800" />
                        Material Usage History
                      </h4>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Original</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Used</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Remaining</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Update Cost</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated By</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {projectData.productUpdates.map((update, idx) => (
                                <tr key={`update-${idx}`} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{update.CM_Product_Name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{update.CM_Original_Quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{update.CM_Used_Quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{update.CM_Remaining_Quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(update.Unit_Cost)}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(update.Update_Cost)}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{update.CM_Updated_By || "—"}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(update.CM_Updated_At)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Labor Tab */}
          {activeTab === "labor" && (
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-yellow-700" />
                  Labor Resources
                </h3>
              </div>

              {(!projectData.labor || projectData.labor.length === 0) ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No labor data found for this project.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Labor Code</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Wage Type</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Present</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {projectData.labor.map((labor, idx) => (
                          <tr key={`labor-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{labor.CM_Labor_Code}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{labor.CM_First_Name}{labor.CM_Last_Name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{labor.Role}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{labor.CM_Labor_Type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{labor.CM_Wage_Type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(labor.Hourly_Rate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{labor.Days_Present}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{labor.Total_Hours}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(labor.Total_Cost)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={8}>Total Labor Cost</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(projectData.project.Total_Labor_Cost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Working Dates Tab */}
          {activeTab === "workDates" && (
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Working Dates
                </h3>
              </div>

              {(!projectData.workingDates || projectData.workingDates.length === 0) ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No working dates found for this project.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Labor Count</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {projectData.workingDates.map((date, idx) => (
                            <tr key={`date-${idx}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{formatDate(date.Work_Date)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{date.Labor_Count}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{date.Present_Count}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{date.Total_Hours}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{formatCurrency(date.Daily_Labor_Cost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-800" />
                      Project Timeline Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="w-28">
                          <p className="text-sm text-gray-600">Start Date</p>
                        </div>
                        <p className="font-medium text-gray-800">{formatDate(projectData.project.CM_Planned_Start_Date)}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-28">
                          <p className="text-sm text-gray-600">End Date</p>
                        </div>
                        <p className="font-medium text-gray-800">{formatDate(projectData.project.CM_Planned_End_Date)}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-28">
                          <p className="text-sm text-gray-600">Working Days</p>
                        </div>
                        <p className="font-medium text-gray-800">{projectData.workingDates.length}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-28">
                          <p className="text-sm text-gray-600">Status</p>
                        </div>
                        <p className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(projectData.project.CM_Status)}`}>
                          {projectData.project.CM_Status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}