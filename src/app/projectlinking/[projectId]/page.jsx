"use client";

import React, { useEffect, useState } from "react";
import {
  Wrench, ArrowLeft, LayoutDashboard, Calendar, DollarSign,
  Users, Package, Truck, Clock, Zap, CheckSquare,
  User, MapPin, FileText, BarChart2, ShieldCheck, CheckCircle, PauseCircle, RefreshCw,
  ChevronDown, ChevronUp, Eye, Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Image from "next/image";
import CountUp from 'react-countup';

// Recharts imports for charting
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, XAxis, YAxis, Bar, CartesianGrid
} from 'recharts';

export default function ProjectDetails({ params }) {
  // Corrected usage: params is an object, not a Promise for client components
  const { projectId } = React.use(params);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  // State for expandable rows
  const [expandedLabor, setExpandedLabor] = useState(new Set());
  const [expandedMaterials, setExpandedMaterials] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Search states
  const [searchLabor, setSearchLabor] = useState("");
  const [searchMilestone, setSearchMilestone] = useState("");
  const [laborMonthFilter, setLaborMonthFilter] = useState(new Date().getMonth().toString());
  const [laborYearFilter, setLaborYearFilter] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/projectlink/${projectId}`);

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


  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
        {/* Navbar */}
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-20 h-20">

              {/* Core Server */}
              <div className="absolute inset-6 bg-blue-600 rounded-lg animate-pulse shadow-lg"></div>

              {/* Data Lines */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-flow"></div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-data-flow-reverse"></div>

              {/* Corner Nodes */}
              <span className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-150"></span>
              <span className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-300"></span>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-500"></span>

            </div>
          </div>
        </div>
      </div>
    );
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-4">
        <div className="p-6 md:p-8 bg-white rounded-xl shadow-md max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-red-700 mb-2">Error Loading Project</h2>
            <p className="text-red-600 mb-4 text-sm md:text-base">{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-4">
        <div className="p-6 md:p-8 bg-white rounded-xl shadow-md text-center max-w-md w-full">
          <FileText className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Project Data</h2>
          <p className="text-gray-500 mb-6 text-sm md:text-base">No project information was found for this ID.</p>
          <button
            onClick={() => router.back()}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center mx-auto transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('en-IN')} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount));
  };

  // Toggle functions for expandable rows
  const toggleLabor = (laborId) => {
    setExpandedLabor(prev => {
      const newSet = new Set(prev);
      if (newSet.has(laborId)) {
        newSet.delete(laborId);
      } else {
        newSet.add(laborId);
      }
      return newSet;
    });
  };

  const toggleMaterial = (materialId) => {
    setExpandedMaterials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  const toggleTask = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const downloadExcel = () => {
    try {
      let csvContent = "";
      let filename = `project-${projectData.project?.CM_Project_Code || "unknown"}-`;

      if (activeTab === 'materials' && projectData.materials?.length > 0) {
        filename += 'materials';
        csvContent = "Product ID,Product Name,Total Qty,Used Qty,Remaining Qty,Unit Type,Unit Price,Used Price,Remaining Price,Total Price\n";
        projectData.materials.forEach(m => {
          csvContent += `${m.CM_Product_ID || ""},"${(m.CM_Product_Name || "").replace(/"/g, '""')}",${m.Total_Qty || 0},${m.Total_Used_Qty || 0},${m.Remaining_Qty || 0},"${m.CM_Unit_Type || ""}",${m.Unit_Price || 0},${m.Used_Price || 0},${m.Remaining_Price || 0},${m.CM_Total_Price || 0}\n`;
        });
      } else if (activeTab === 'labor' && projectData.labor?.length > 0) {
        filename += 'labor';
        csvContent = "Labor ID,Name,Role,Type,Wage Type,Rate,Days Present,Total Hours,Total Cost\n";
        projectData.labor.forEach(l => {
          csvContent += `${l.Labor_ID || ""},"${((l.CM_First_Name || "") + " " + (l.CM_Last_Name || "")).trim().replace(/"/g, '""')}","${(l.Role || "").replace(/"/g, '""')}","${(l.CM_Labor_Type || "").replace(/"/g, '""')}","${(l.CM_Wage_Type || "").replace(/"/g, '""')}",${l.Hourly_Rate || 0},${l.Days_Present || 0},${l.Total_Hours || 0},${l.Total_Cost || 0}\n`;
        });
      } else if (activeTab === 'solarEstimate' && projectData.project?.Solar_Estimate) {
        filename += 'solar-estimate';
        csvContent = "PROJECT ESTIMATE\n";
        csvContent += `Project:,"${(projectData.project.CM_Project_Name || "").replace(/"/g, '""')}"\n`;
        csvContent += `Location:,"${(projectData.project.CM_Project_Location || "").replace(/"/g, '""')}"\n`;
        csvContent += `System Size:,"${(projectData.project.Solar_Estimate?.System_Size || "Mega Watts").replace(/"/g, '""')}"\n\n`;

        csvContent += "EQUIPMENT ITEMS\n";
        csvContent += "Item,Quantity,Unit Price,Total\n";
        if (projectData.project.Solar_Estimate?.Equipment_Items?.length > 0) {
          projectData.project.Solar_Estimate.Equipment_Items.forEach(item => {
            const totalCost = (item.quantity || 1) * (item.unitCost || 0);
            csvContent += `"${(item.name || "").replace(/"/g, '""')}",${item.quantity || 1},${item.unitCost || 0},${totalCost}\n`;
          });
        } else {
          csvContent += "No equipment items,,,\n";
        }
        csvContent += `Equipment Total,,,${projectData.project.Solar_Estimate?.Equipment_Total || 0}\n\n`;

        csvContent += "LABOR ITEMS\n";
        csvContent += "Service,Hours/Units,Rate,Total\n";
        if (projectData.project.Solar_Estimate?.Labor_Items?.length > 0) {
          projectData.project.Solar_Estimate.Labor_Items.forEach(item => {
            const totalCost = (item.hours || 0) * (item.rate || 0);
            csvContent += `"${(item.position || "").replace(/"/g, '""')}",${item.hours || 0},${item.rate || 0},${totalCost}\n`;
          });
        } else {
          csvContent += "No labor items,,,\n";
        }
        csvContent += `Labor Total,,,${projectData.project.Solar_Estimate?.Labor_Total || 0}\n\n`;

        csvContent += "OTHER COSTS\n";
        csvContent += "Description,Amount\n";
        if (projectData.project.Solar_Estimate?.Other_Items?.length > 0) {
          projectData.project.Solar_Estimate.Other_Items.forEach(item => {
            csvContent += `"${(item.name || "").replace(/"/g, '""')}",${item.cost || 0}\n`;
          });
        } else {
          csvContent += "No other costs,\n";
        }
        csvContent += `Other Costs Total,${projectData.project.Solar_Estimate?.Other_Total || 0}\n\n`;

        csvContent += "GRAND TOTAL\n";
        csvContent += `Total Estimate,${projectData.project.Solar_Estimate?.Total || 0}\n`;
      } else if (activeTab === 'workDates' && projectData.workingDates?.length > 0) {
        filename += 'workDates';
        csvContent = "Date,Labor Count,Present Count,Total Hours,Daily Cost\n";
        projectData.workingDates.forEach(d => {
          csvContent += `${formatDate(d.Work_Date)},${d.Labor_Count || 0},${d.Present_Count || 0},${d.Total_Hours || 0},${d.Daily_Labor_Cost || 0}\n`;
        });
      } else if (activeTab === 'services' && projectData.services?.length > 0) {
        filename += 'services';
        csvContent = "Service Type,Description,Service Amount,Tax Amount,Total Amount,Service Date\n";
        projectData.services.forEach(s => {
          csvContent += `"${s.CM_Service_Type}","${(s.CM_Description || "").replace(/"/g, '""')}",${s.CM_Service_Amount || 0},${s.CM_Tax_Amount || 0},${s.CM_Total_Amount || 0},${s.CM_Service_Date || ""}\n`;
        });
      }

      else if (activeTab === 'transport' && projectData.transport?.length > 0) {
        filename += 'transport';
        csvContent = "Transport Type,Description,Amount,Tax Amount,Total Amount,Transport Date\n";
        projectData.transport.forEach(t => {
          csvContent += `"${t.CM_Transport_Type}","${(t.CM_Description || "").replace(/"/g, '""')}",${t.CM_Amount || 0},${t.CM_Tax_Amount || 0},${t.CM_Total_Amount || 0},${t.CM_Transport_Date || ""}\n`;
        });
      }
      else if (activeTab === 'milestones' && (projectData.tasks?.length > 0 || projectData.milestones?.length > 0)) {
        filename += 'milestones-tasks';

        // First add milestones if available
        if (projectData.milestones?.length > 0) {
          csvContent += "MILESTONES\n";
          csvContent += "Milestone Name,Status,Start Date,End Date,Weight %,Description\n";
          projectData.milestones.forEach(m => {
            csvContent += `"${(m.CM_Milestone_Name || "").replace(/"/g, '""')}","${(m.CM_Status || "").replace(/"/g, '""')}",${formatDate(m.CM_Planned_Start_Date)},${formatDate(m.CM_Planned_End_Date)},${m.CM_Percentage_Weightage || 0},"${(m.CM_Description || "").replace(/"/g, '""')}"\n`;
          });
          csvContent += "\n";
        }

        // Add tasks
        csvContent += "TASKS\n";
        csvContent += "Task ID,Task Name,Milestone,Assign Date,Due Date,Status,Engineer\n";
        projectData.tasks?.forEach(t => {
          const milestone = projectData.milestones?.find(m => m.tasks?.some(mt => mt.CM_Task_ID === t.CM_Task_ID));
          csvContent += `${t.CM_Task_ID || ""},"${(t.CM_Task_Name || "").replace(/"/g, '""')}","${(milestone?.CM_Milestone_Name || "").replace(/"/g, '""')}",${formatDate(t.CM_Assign_Date)},${formatDate(t.CM_Due_Date)},"${(t.latestUpdate?.CM_Status || t.CM_Is_Active || "").replace(/"/g, '""')}","${((t.Engineer_First_Name || "") + " " + (t.Engineer_Last_Name || "")).trim().replace(/"/g, '""')}"\n`;
        });

        // Add task updates if available
        if (projectData.taskUpdates?.length > 0) {
          csvContent += "\nTASK UPDATES\n";
          csvContent += "Task Name,Milestone,Date,Status,Work Hours,Remarks,Updated By\n";
          projectData.taskUpdates.forEach(u => {
            csvContent += `"${(u.CM_Task_Name || "").replace(/"/g, '""')}","${(u.CM_Milestone_Name || "").replace(/"/g, '""')}",${formatDate(u.CM_Update_Date)},"${(u.CM_Status || "").replace(/"/g, '""')}",${u.CM_Work_Hours || 0},"${(u.CM_Remarks || "").replace(/"/g, '""')}","${((u.Engineer_First_Name || "") + " " + (u.Engineer_Last_Name || "")).trim().replace(/"/g, '""')}"\n`;
          });
        }
      } else if (activeTab === 'analytics') {
        filename += 'analytics';
        csvContent = "PROJECT ANALYTICS\n\n";

        csvContent += "COST BREAKDOWN\n";
        csvContent += "Category,Amount,Percentage\n";
        csvContent += `Materials,${projectData.project?.Total_Material_Cost || 0},${projectData.project?.Actual_Cost ? Math.round((projectData.project.Total_Material_Cost / projectData.project.Actual_Cost) * 100) : 0}%\n`;
        csvContent += `Labor,${projectData.project?.Total_Labor_Cost || 0},${projectData.project?.Actual_Cost ? Math.round((projectData.project.Total_Labor_Cost / projectData.project.Actual_Cost) * 100) : 0}%\n`;
        csvContent += `Transport,${projectData.project?.Total_Transport_Cost || 0},${projectData.project?.Actual_Cost ? Math.round((projectData.project.Total_Transport_Cost / projectData.project.Actual_Cost) * 100) : 0}%\n`;
        // Add task status distribution
        csvContent += "\nTASK STATUS DISTRIBUTION\n";
        csvContent += "Status,Count\n";
        csvContent += `Completed,${projectData.project?.Task_Progress?.completed || 0}\n`;
        csvContent += `In Progress,${projectData.project?.Task_Progress?.inProgress || 0}\n`;
        csvContent += `Pending,${projectData.project?.Task_Progress?.pending || 0}\n`;
        csvContent += `On Hold,${projectData.project?.Task_Progress?.onHold || 0}\n`;
        csvContent += `Total,${projectData.project?.Task_Progress?.total || 0}\n`;
      } else {
        // Default to overview
        filename += 'overview';
        csvContent = "Project ID,Project Name,Project Type,Status,Estimated Cost,Actual Cost,Cost Variance,Material Cost,Labor Cost,Transport Cost\n";
        csvContent += `${projectData.project?.CM_Project_Code || ""},
                      "${(projectData.project?.CM_Project_Name || "").replace(/"/g, '""')}",
                      "${(projectData.project?.CM_Project_Type || "").replace(/"/g, '""')}",
                      "${(projectData.project?.CM_Status || "").replace(/"/g, '""')}",
                      ${projectData.project?.CM_Estimated_Cost || 0},
                      ${projectData.project?.Actual_Cost || 0},
                      ${projectData.project?.Cost_Variance || 0},
                      ${projectData.project?.Total_Material_Cost || 0},
                      ${projectData.project?.Total_Labor_Cost || 0},
                      ${projectData.project?.Total_Transport_Cost || 0}\n`;
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("An error occurred while generating the Excel file. Please try again.");
    }
  };

  // Tab-specific download function with null checks
  const downloadPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      // FIX: Safe currency formatter (no ₹ symbol)
      const safeCurrency = (val) => {
        const num = Number(val) || 0;
        return "Rs. " + num.toLocaleString("en-IN");
      };

      const doc = new jsPDF();
      let y = 10;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Project: ${projectData.project?.CM_Project_Name || "Untitled"}`, 14, y);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`, 14, y + 8);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 14);
      y += 20;

      /*------------------------------------------------------
       MATERIALS TAB
      ------------------------------------------------------*/
      if (activeTab === "materials" && projectData.materials?.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [
            [
              "Product ID",
              "Name",
              "Total Qty",
              "Used",
              "Remain",
              "Unit",
              "Unit Price",
              "Used Price",
              "Remain Price",
              "Total"
            ]
          ],
          body: projectData.materials.map((m) => [
            m.CM_Product_ID || "",
            m.CM_Product_Name || "",
            m.Total_Qty || 0,
            m.Total_Used_Qty || 0,
            m.Remaining_Qty || 0,
            m.CM_Unit_Type || "",
            safeCurrency(m.Unit_Price),
            safeCurrency(m.Used_Price),
            safeCurrency(m.Remaining_Price),
            safeCurrency(m.CM_Total_Price)
          ]),
          headStyles: { fillColor: [66, 135, 245] }
        });

        y = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Materials Summary", 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Total Material Cost", "Used Material Cost", "Remaining Material Cost", "Usage %"]],
          body: [
            [
              safeCurrency(projectData.project?.Total_Material_Cost),
              safeCurrency(projectData.project?.Used_Material_Cost),
              safeCurrency(projectData.project?.Remaining_Material_Cost),
              `${projectData.project?.Used_Material_Percentage || 0}%`
            ]
          ],
          headStyles: { fillColor: [38, 98, 211] }
        });
      }

      /*------------------------------------------------------
       LABOR TAB
      ------------------------------------------------------*/
      else if (activeTab === "labor" && projectData.labor?.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["ID", "Name", "Role", "Type", "Wage Type", "Rate", "Days", "Hours", "Cost"]],
          body: projectData.labor.map((l) => [
            l.Labor_ID || "",
            `${l.CM_First_Name || ""} ${l.CM_Last_Name || ""}`.trim(),
            l.Role || "",
            l.CM_Labor_Type || "",
            l.CM_Wage_Type || "",
            safeCurrency(l.Hourly_Rate),
            l.Days_Present || 0,
            l.Total_Hours || 0,
            safeCurrency(l.Total_Cost)
          ]),
          headStyles: { fillColor: [245, 158, 11] }
        });

        y = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Labor Summary", 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Total Labor Cost", "Total Labor Count", "Working Days"]],
          body: [
            [
              safeCurrency(projectData.project?.Total_Labor_Cost),
              projectData.labor?.length || 0,
              projectData.workingDates?.length || 0
            ]
          ],
          headStyles: { fillColor: [217, 119, 6] }
        });
      }

      /*------------------------------------------------------
       SOLAR ESTIMATE TAB
      ------------------------------------------------------*/
      else if (activeTab === "solarEstimate" && projectData.project?.Solar_Estimate) {
        const solar = projectData.project.Solar_Estimate;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("SOLAR PROJECT ESTIMATE", 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          body: [
            ["Project", projectData.project.CM_Project_Name || ""],
            ["Location", projectData.project.CM_Project_Location || ""],
            ["System Size", solar.System_Size || "Mega Watts"]
          ],
          theme: "plain",
          styles: { fontSize: 10 }
        });

        y = doc.lastAutoTable.finalY + 10;

        /* EQUIPMENT ITEMS */
        doc.setFont("helvetica", "bold");
        doc.text("EQUIPMENT ITEMS", 14, y);
        y += 6;

        if (solar.Equipment_Items?.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [["Item", "Quantity", "Unit Price", "Total"]],
            body: solar.Equipment_Items.map((i) => [
              i.name || "",
              i.quantity || 1,
              safeCurrency(i.unitCost),
              safeCurrency((i.quantity || 1) * (i.unitCost || 0))
            ]),
            headStyles: { fillColor: [16, 185, 129] },
            foot: [["Equipment Total", "", "", safeCurrency(solar.Equipment_Total)]],
            footStyles: { fillColor: [240, 253, 244], fontStyle: "bold", textColor: [6, 95, 70] }
          });

          y = doc.lastAutoTable.finalY + 10;
        }

        /* LABOR ITEMS */
        doc.setFont("helvetica", "bold");
        doc.text("LABOR ITEMS", 14, y);
        y += 6;

        if (solar.Labor_Items?.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [["Service", "Hours/Units", "Rate", "Total"]],
            body: solar.Labor_Items.map((i) => [
              i.position || "",
              i.hours || 0,
              safeCurrency(i.rate),
              safeCurrency((i.hours || 0) * (i.rate || 0))
            ]),
            headStyles: { fillColor: [124, 58, 237] },
            foot: [["Labor Total", "", "", safeCurrency(solar.Labor_Total)]],
            footStyles: { fillColor: [245, 243, 255], fontStyle: "bold", textColor: [76, 29, 149] }
          });

          y = doc.lastAutoTable.finalY + 10;
        }

        /* OTHER ITEMS */
        doc.setFont("helvetica", "bold");
        doc.text("OTHER COSTS", 14, y);
        y += 6;

        if (solar.Other_Items?.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [["Description", "Amount"]],
            body: solar.Other_Items.map((i) => [i.name || "", safeCurrency(i.cost)]),
            headStyles: { fillColor: [234, 88, 12] },
            foot: [["Other Total", safeCurrency(solar.Other_Total)]],
            footStyles: { fillColor: [255, 247, 237], fontStyle: "bold", textColor: [154, 52, 18] }
          });

          y = doc.lastAutoTable.finalY + 10;
        }

        /* GRAND TOTAL */
        autoTable(doc, {
          startY: y,
          body: [["GRAND TOTAL", safeCurrency(solar.Total)]],
          styles: { fontSize: 12, fontStyle: "bold", halign: "right" },
          theme: "grid",
          tableWidth: "auto",
          margin: { left: 100 }
        });
      }

      /*------------------------------------------------------
       WORKING DATES
      ------------------------------------------------------*/
      else if (activeTab === "workDates" && projectData.workingDates?.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Date", "Labor Count", "Present", "Attendance %", "Hours", "Daily Cost"]],
          body: projectData.workingDates.map((d) => [
            formatDate(d.Work_Date),
            d.Labor_Count || 0,
            d.Present_Count || 0,
            d.Labor_Count ? Math.round((d.Present_Count / d.Labor_Count) * 100) + "%" : "0%",
            d.Total_Hours || 0,
            safeCurrency(d.Daily_Labor_Cost)
          ]),
          headStyles: { fillColor: [79, 70, 229] }
        });

        y = doc.lastAutoTable.finalY + 10;

        const totalDays = projectData.workingDates.length;
        const totalHours = projectData.workingDates.reduce((a, b) => a + (b.Total_Hours || 0), 0);
        const totalCost = projectData.workingDates.reduce((a, b) => a + (b.Daily_Labor_Cost || 0), 0);

        autoTable(doc, {
          startY: y,
          head: [["Total Working Days", "Total Hours", "Total Cost"]],
          body: [[totalDays, totalHours, safeCurrency(totalCost)]],
          headStyles: { fillColor: [67, 56, 202] }
        });
      }
      /*------------------------------------------------------
       SERVICES TAB
       ------------------------------------------------------*/

      else if (activeTab === "services" && projectData.services?.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Service Type", "Description", "Service Amount", "Tax", "Total", "Date"]],
          body: projectData.services.map(s => [
            s.CM_Service_Type,
            s.CM_Description || "",
            safeCurrency(s.CM_Service_Amount),
            safeCurrency(s.CM_Tax_Amount),
            safeCurrency(s.CM_Total_Amount),
            s.CM_Service_Date
          ]),
          headStyles: { fillColor: [34, 197, 94] }
        });
      }

      /*------------------------------------------------------
       TRANSPORT TAB
      ------------------------------------------------------*/
      else if (activeTab === "transport" && projectData.transport?.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Transport Type", "Description", "Amount", "Tax", "Total", "Date"]],
          body: projectData.transport.map(t => [
            t.CM_Transport_Type,
            t.CM_Description || "",
            safeCurrency(t.CM_Amount),
            safeCurrency(t.CM_Tax_Amount),
            safeCurrency(t.CM_Total_Amount),
            t.CM_Transport_Date
          ]),
          headStyles: { fillColor: [168, 85, 247] }
        });
      }

      /*------------------------------------------------------
       ANALYTICS TAB
      ------------------------------------------------------*/
      else if (activeTab === "analytics") {
        doc.setFont("helvetica", "bold");
        doc.text("FINANCIAL ANALYSIS", 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Category", "Amount", "% of Total"]],
          body: [
            ["Estimated Cost", safeCurrency(projectData.project?.CM_Estimated_Cost), "100%"],
            [
              "Actual Cost",
              safeCurrency(projectData.project?.Actual_Cost),
              projectData.project?.CM_Estimated_Cost
                ? `${Math.round(
                  (projectData.project.Actual_Cost /
                    projectData.project.CM_Estimated_Cost) *
                  100
                )}%`
                : "0%"
            ],
            [
              "Material Cost",
              safeCurrency(projectData.project?.Total_Material_Cost),
              projectData.project?.Actual_Cost
                ? `${Math.round(
                  (projectData.project.Total_Material_Cost /
                    projectData.project.Actual_Cost) *
                  100
                )}%`
                : "0%"
            ],
            [
              "Labor Cost",
              safeCurrency(projectData.project?.Total_Labor_Cost),
              projectData.project?.Actual_Cost
                ? `${Math.round(
                  (projectData.project.Total_Labor_Cost /
                    projectData.project.Actual_Cost) *
                  100
                )}%`
                : "0%"
            ]
          ],
          headStyles: { fillColor: [239, 68, 68] }
        });

        y = doc.lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "bold");
        doc.text("TASK STATISTICS", 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Status", "Count", "Percentage"]],
          body: [
            ["Total", projectData.project?.Task_Progress?.total || 0, "100%"],
            [
              "Completed",
              projectData.project?.Task_Progress?.completed || 0,
              projectData.project?.Task_Progress?.total
                ? `${Math.round(
                  (projectData.project.Task_Progress.completed /
                    projectData.project.Task_Progress.total) *
                  100
                )}%`
                : "0%"
            ],
            [
              "In Progress",
              projectData.project?.Task_Progress?.inProgress || 0,
              projectData.project?.Task_Progress?.total
                ? `${Math.round(
                  (projectData.project.Task_Progress.inProgress /
                    projectData.project.Task_Progress.total) *
                  100
                )}%`
                : "0%"
            ],
            [
              "Pending",
              projectData.project?.Task_Progress?.pending || 0,
              projectData.project?.Task_Progress?.total
                ? `${Math.round(
                  (projectData.project.Task_Progress.pending /
                    projectData.project.Task_Progress.total) *
                  100
                )}%`
                : "0%"
            ],
            [
              "On Hold",
              projectData.project?.Task_Progress?.onHold || 0,
              projectData.project?.Task_Progress?.total
                ? `${Math.round(
                  (projectData.project.Task_Progress.onHold /
                    projectData.project.Task_Progress.total) *
                  100
                )}%`
                : "0%"
            ]
          ],
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      /*------------------------------------------------------
       FOOTER + SAVE
      ------------------------------------------------------*/
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Project: ${projectData.project?.CM_Project_Name || ""} (${projectData.project?.CM_Project_Code || ""
          }) | Page ${i} of ${totalPages}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      doc.save(
        `project-${projectData.project?.CM_Project_Code || "unknown"}-${tabName}-${new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF file. Please try again.");
    }
  };

  // Complete Excel export function with null checks
  const downloadAllExcel = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Project Overview Sheet
    const projectOverview = [
      ["PROJECT OVERVIEW"],
      [],
      ["Project ID", projectData.project.CM_Project_Code || "—"],
      ["Project Name", projectData.project.CM_Project_Name || "—"],
      ["Type", projectData.project.CM_Project_Type || "—"],
      ["Status", projectData.project.CM_Status || "—"],
      ["Customer", projectData.project.CM_Customer_Name || "—"],
      ["Location", projectData.project.CM_Project_Location || "—"],
      ["Description", projectData.project.CM_Description || "—"],
      [],
      ["TIMELINE"],
      ["Start Date", formatDate(projectData.project.CM_Planned_Start_Date)],
      ["End Date", formatDate(projectData.project.CM_Planned_End_Date)],
      ["Working Days", projectData.workingDates ? projectData.workingDates.length : 0],
      [],
      ["FINANCIAL SUMMARY"],
      ["Estimated Cost", projectData.project.CM_Estimated_Cost || 0],
      ["Actual Cost", projectData.project.Actual_Cost || 0],
      ["Cost Variance", projectData.project.Cost_Variance || 0],
      ["Material Cost", projectData.project.Total_Material_Cost || 0],
      ["Used Material Cost", projectData.project.Used_Material_Cost || 0],
      ["Remaining Material Cost", projectData.project.Remaining_Material_Cost || 0],
      ["Labor Cost", projectData.project.Total_Labor_Cost || 0],
      ["Transport Cost", projectData.project.Total_Transport_Cost || 0],
      [],
      ["TASK PROGRESS"],
      ["Total Tasks", projectData.project.Task_Progress?.total || 0],
      ["Completed Tasks", projectData.project.Task_Progress?.completed || 0],
      ["In Progress Tasks", projectData.project.Task_Progress?.inProgress || 0],
      ["Pending Tasks", projectData.project.Task_Progress?.pending || 0],
      ["On Hold Tasks", projectData.project.Task_Progress?.onHold || 0],
      ["Progress Percentage", `${taskProgressPercentage || 0}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projectOverview), "Project Overview");

    // ---- MATERIALS SHEET ----
    if (projectData.materials && projectData.materials.length > 0) {
      const materialsData = [
        ["Product ID", "Product Name", "Total Qty", "Used Qty", "Remaining Qty", "Unit Type", "Unit Price", "Used Price", "Remaining Price", "Total Price"],
        ...projectData.materials.map(m => [
          m.CM_Product_ID || "—",
          m.CM_Product_Name || "—",
          m.Total_Qty || 0,
          m.Total_Used_Qty || 0,
          m.Remaining_Qty || 0,
          m.CM_Unit_Type || "—",
          m.Unit_Price || 0,
          m.Used_Price || 0,
          m.Remaining_Price || 0,
          m.CM_Total_Price || 0
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(materialsData), "Materials");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No materials data available"]]), "Materials");
    }

    // ---- MATERIAL UPDATES SHEET ----
    if (projectData.productUpdates && projectData.productUpdates.length > 0) {
      const updatesData = [
        ["Product Name", "Original Qty", "Used Qty", "Remaining", "Unit Price", "Update Cost", "Updated By", "Update Date"],
        ...projectData.productUpdates.map(u => [
          u.CM_Product_Name || "—",
          u.CM_Original_Quantity || 0,
          u.CM_Used_Quantity || 0,
          u.CM_Remaining_Quantity || 0,
          u.Unit_Cost || 0,
          u.Update_Cost || 0,
          u.CM_Updated_By || "—",
          formatDate(u.CM_Updated_At)
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(updatesData), "Material Updates");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No material updates data available"]]), "Material Updates");
    }

    // ---- LABOR SHEET ----
    if (projectData.labor && projectData.labor.length > 0) {
      const laborData = [
        ["Labor ID", "Name", "Role", "Type", "Wage Type", "Rate", "Days Present", "Total Hours", "Total Cost"],
        ...projectData.labor.map(l => [
          l.Labor_ID || "—",
          `${l.CM_First_Name || ""} ${l.CM_Last_Name || ""}`,
          l.Role || "—",
          l.CM_Labor_Type || "—",
          l.CM_Wage_Type || "—",
          l.Hourly_Rate || 0,
          l.Days_Present || 0,
          l.Total_Hours || 0,
          l.Total_Cost || 0
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(laborData), "Labor");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No labor data available"]]), "Labor");
    }

    // ---- WORK DATES SHEET ----
    if (projectData.workingDates && projectData.workingDates.length > 0) {
      const workDatesData = [
        ["Date", "Labor Count", "Present Count", "Attendance %", "Total Hours", "Daily Cost"],
        ...projectData.workingDates.map(d => [
          formatDate(d.Work_Date),
          d.Labor_Count || 0,
          d.Present_Count || 0,
          d.Labor_Count > 0 ? Math.round((d.Present_Count / d.Labor_Count) * 100) + "%" : "0%",
          d.Total_Hours || 0,
          d.Daily_Labor_Cost || 0
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(workDatesData), "Work Dates");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No working dates data available"]]), "Work Dates");
    }

    // ----SERVICES SHEET----
    if (projectData.services?.length > 0) {
      const servicesData = [
        ["Service Type", "Description", "Service Amount", "Tax Amount", "Total Amount", "Date"],
        ...projectData.services.map(s => [
          s.CM_Service_Type,
          s.CM_Description || "—",
          s.CM_Service_Amount || 0,
          s.CM_Tax_Amount || 0,
          s.CM_Total_Amount || 0,
          s.CM_Service_Date || "—"
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(servicesData), "Services");
    }

    // ----TRANSPORT SHEET----
    if (projectData.transport?.length > 0) {
      const transportData = [
        ["Transport Type", "Description", "Amount", "Tax Amount", "Total Amount", "Date"],
        ...projectData.transport.map(t => [
          t.CM_Transport_Type,
          t.CM_Description || "—",
          t.CM_Amount || 0,
          t.CM_Tax_Amount || 0,
          t.CM_Total_Amount || 0,
          t.CM_Transport_Date || "—"
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(transportData), "Transport");
    }

    // ---- MILESTONES SHEET ----
    if (projectData.milestones && projectData.milestones.length > 0) {
      const milestonesData = [
        ["Milestone Name", "Status", "Start Date", "End Date", "Weight %", "Description"],
        ...projectData.milestones.map(m => [
          m.CM_Milestone_Name || "—",
          m.CM_Status || "—",
          formatDate(m.CM_Planned_Start_Date),
          formatDate(m.CM_Planned_End_Date),
          m.CM_Percentage_Weightage || 0,
          m.CM_Description || ""
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(milestonesData), "Milestones");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No milestones data available"]]), "Milestones");
    }

    // ---- TASKS SHEET ----
    if (projectData.tasks && projectData.tasks.length > 0) {
      const tasksData = [
        ["Task ID", "Task Name", "Milestone", "Assign Date", "Due Date", "Status", "Engineer"],
        ...projectData.tasks.map(t => [
          t.CM_Task_ID || "—",
          t.CM_Task_Name || "—",
          projectData.milestones?.find(m => m.tasks?.some(mt => mt.CM_Task_ID === t.CM_Task_ID))?.CM_Milestone_Name || "—",
          formatDate(t.CM_Assign_Date),
          formatDate(t.CM_Due_Date),
          t.latestUpdate?.CM_Status || t.CM_Is_Active || "—",
          `${t.Engineer_First_Name || ""} ${t.Engineer_Last_Name || ""}`
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tasksData), "Tasks");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No tasks data available"]]), "Tasks");
    }

    // ---- TASK UPDATES SHEET ----
    if (projectData.taskUpdates && projectData.taskUpdates.length > 0) {
      const taskUpdatesData = [
        ["Task Name", "Milestone", "Date", "Status", "Work Hours", "Remarks", "Updated By"],
        ...projectData.taskUpdates.map(u => [
          u.CM_Task_Name || "—",
          u.CM_Milestone_Name || "—",
          formatDate(u.CM_Update_Date),
          u.CM_Status || "—",
          u.CM_Work_Hours || "—",
          u.CM_Remarks || "—",
          u.Engineer_First_Name ? `${u.Engineer_First_Name} ${u.Engineer_Last_Name || ''}` : "—"
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskUpdatesData), "Task Updates");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No task updates data available"]]), "Task Updates");
    }

    // ---- SOLAR ESTIMATE SHEET ----
    const solar = projectData.project.Solar_Estimate;
    if (solar) {
      const equipmentItems = solar.Equipment_Items || [];
      const laborItems = solar.Labor_Items || [];
      const otherItems = solar.Other_Items || [];

      const solarData = [
        ["SOLAR PROJECT ESTIMATE"],
        [],
        ["Project", projectData.project.CM_Project_Name || "—"],
        ["Location", projectData.project.CM_Project_Location || "—"],
        ["System Size", solar?.System_Size || "N/A"],
        [],
        ["EQUIPMENT ITEMS"],
        ["Item", "Qty", "Unit Price", "Total"],
        ...equipmentItems.map(i => [
          i.name || "—",
          i.quantity || 0,
          i.unitCost || 0,
          (i.quantity || 0) * (i.unitCost || 0)
        ]),
        ["Equipment Total", "", "", solar?.Equipment_Total || 0],
        [],
        ["LABOR ITEMS"],
        ["Service", "Hours", "Rate", "Total"],
        ...laborItems.map(i => [
          i.position || "—",
          i.hours || 0,
          i.rate || 0,
          (i.hours || 0) * (i.rate || 0)
        ]),
        ["Labor Total", "", "", solar?.Labor_Total || 0],
        [],
        ["OTHER COSTS"],
        ["Description", "Amount"],
        ...otherItems.map(i => [
          i.name || "—",
          i.cost || 0
        ]),
        ["Other Total", solar?.Other_Total || 0],
        [],
        ["GRAND TOTAL", solar?.Total || 0]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(solarData), "Solar Estimate");
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No solar estimate data available"]]), "Solar Estimate");
    }

    // ---- SAVE FILE ----
    XLSX.writeFile(wb, `${projectData.project.CM_Project_Code || "project"}-COMPLETE-REPORT.xlsx`);
  };

  // Complete PDF export function with null checks
  const downloadAllPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    // SAFE CURRENCY FORMATTER (fixes corruption)
    const safeCurrency = (value) => {
      const num = Number(value) || 0;
      return "Rs. " + num.toLocaleString("en-IN");
    };

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Project Report: ${projectData.project.CM_Project_Name || "Untitled"}`, 14, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 6);
    y += 14;

    // ---------- PROJECT OVERVIEW ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Project Overview", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: [
        ["Project ID", projectData.project.CM_Project_Code || "—"],
        ["Project Name", projectData.project.CM_Project_Name || "—"],
        ["Type", projectData.project.CM_Project_Type || "—"],
        ["Status", projectData.project.CM_Status || "—"],
        ["Location", projectData.project.CM_Project_Location || "—"],
        ["Start Date", formatDate(projectData.project.CM_Planned_Start_Date)],
        ["End Date", formatDate(projectData.project.CM_Planned_End_Date)],
        ["Working Days", projectData.workingDates ? projectData.workingDates.length : "0"],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // ---------- FINANCIAL SUMMARY ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Financial Summary", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Financial Metric", "Amount"]],
      body: [
        ["Estimated Cost", safeCurrency(projectData.project.CM_Estimated_Cost)],
        ["Actual Cost", safeCurrency(projectData.project.Actual_Cost)],
        ["Variance", safeCurrency(projectData.project.Cost_Variance)],
        ["Material Cost", safeCurrency(projectData.project.Total_Material_Cost)],
        ["Used Material", safeCurrency(projectData.project.Used_Material_Cost)],
        ["Remaining Material", safeCurrency(projectData.project.Remaining_Material_Cost)],
        ["Labor Cost", safeCurrency(projectData.project.Total_Labor_Cost)],
        ["Labor Cost", safeCurrency(projectData.project.Total_Transport_Cost)],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // ---------- TASK PROGRESS ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Task Progress", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Status", "Count"]],
      body: [
        ["Total Tasks", projectData.project.Task_Progress?.total || 0],
        ["Completed", projectData.project.Task_Progress?.completed || 0],
        ["In Progress", projectData.project.Task_Progress?.inProgress || 0],
        ["Pending", projectData.project.Task_Progress?.pending || 0],
        ["On Hold", projectData.project.Task_Progress?.onHold || 0],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });
    y = doc.lastAutoTable.finalY + 10;

    // ---------- MATERIALS ----------
    doc.addPage();
    y = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Materials Summary", 14, y);
    y += 6;

    if (projectData.materials?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Product Name", "Total Qty", "Used", "Remain", "Unit Price", "Total"]],
        body: projectData.materials.map((m) => [
          m.CM_Product_Name || "—",
          m.Total_Qty || 0,
          m.Total_Used_Qty || 0,
          m.Remaining_Qty || 0,
          safeCurrency(m.Unit_Price),
          safeCurrency(m.CM_Total_Price),
        ]),
        theme: "grid",
        headStyles: { fillColor: [14, 165, 233] },
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.text("No material data available", 14, y);
      y += 10;
    }

    // ---------- LABOR ----------
    doc.addPage();
    y = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Labor Resources", 14, y);
    y += 6;

    if (projectData.labor?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Name", "Role", "Type", "Rate", "Days", "Hours", "Cost"]],
        body: projectData.labor.map((l) => [
          `${l.CM_First_Name || ""} ${l.CM_Last_Name || ""}`,
          l.Role || "—",
          l.CM_Labor_Type || "—",
          safeCurrency(l.Hourly_Rate),
          l.Days_Present || 0,
          l.Total_Hours || 0,
          safeCurrency(l.Total_Cost),
        ]),
        theme: "grid",
        headStyles: { fillColor: [249, 115, 22] },
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.text("No labor data available", 14, y);
      y += 10;
    }

    // ---------- WORKING DATES ----------
    if (y > 220) {
      doc.addPage();
      y = 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Working Dates", 14, y);
    y += 6;

    if (projectData.workingDates?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Labor", "Present", "Hours", "Daily Cost"]],
        body: projectData.workingDates.map((w) => [
          formatDate(w.Work_Date),
          w.Labor_Count || 0,
          w.Present_Count || 0,
          w.Total_Hours || 0,
          safeCurrency(w.Daily_Labor_Cost),
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.text("No working dates data available", 14, y);
      y += 10;
    }

    // ---------- SERVICES ----------
    doc.addPage();
    y = 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Service History", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Type", "Description", "Service Amt", "Tax", "Total", "Date"]],
      body: projectData.services.map(s => [
        s.CM_Service_Type,
        s.CM_Description || "—",
        safeCurrency(s.CM_Service_Amount),
        safeCurrency(s.CM_Tax_Amount),
        safeCurrency(s.CM_Total_Amount),
        s.CM_Service_Date
      ]),
      headStyles: { fillColor: [34, 197, 94] }
    });

    // ---------- TRANSPORT ----------
    doc.addPage();
    y = 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Transport History", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Type", "Description", "Amount", "Tax", "Total", "Date"]],
      body: projectData.transport.map(t => [
        t.CM_Transport_Type,
        t.CM_Description || "—",
        safeCurrency(t.CM_Amount),
        safeCurrency(t.CM_Tax_Amount),
        safeCurrency(t.CM_Total_Amount),
        t.CM_Transport_Date
      ]),
      headStyles: { fillColor: [168, 85, 247] }
    });

    // ---------- TASKS ----------
    doc.addPage();
    y = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Tasks", 14, y);
    y += 6;

    if (projectData.tasks?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Task", "Assigned", "Due", "Status", "Engineer"]],
        body: projectData.tasks.map((t) => [
          t.CM_Task_Name || "—",
          formatDate(t.CM_Assign_Date),
          formatDate(t.CM_Due_Date),
          t.latestUpdate?.CM_Status || t.CM_Is_Active || "—",
          `${t.Engineer_First_Name || ""} ${t.Engineer_Last_Name || ""}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [20, 184, 166] },
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.text("No tasks data available", 14, y);
      y += 10;
    }

    // ---------- FOOTER ----------
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `${projectData.project.CM_Project_Name || "Project"} - ${projectData.project.CM_Project_Code || ""
        } | Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`${projectData.project.CM_Project_Code || "project"}-COMPLETE-REPORT.pdf`);
  };

  // UI helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectTypeColor = (projectType) => {
    switch (projectType) {
      case 'Web Application':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mobile Application':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Web Development':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Others':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'all':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const getProjectTypeIcon = (projectType) => {
    switch (projectType) {
      case 'Web Application':
        return '🌐';
      case 'Mobile Application':
        return '📱';
      case 'Web Development':
        return '💻';
      case 'Others':
        return '📁';
      case 'all':
        return '📊';
      default:
        return '📊';
    }
  };


  // Progress calculations
  const progress = projectData.project.Progress_Percentage || 0;

  // Calculate task progress based on completed vs total tasks
  const completedTasks = projectData.project.Task_Progress?.completed || 0;
  const totalTasks = projectData.project.Task_Progress?.total || 0;
  const taskProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- Data preparation for Recharts ---

  const costChartData = [
    { name: 'Materials', value: projectData.project.Total_Material_Cost || 0 },
    { name: 'Labor', value: projectData.project.Total_Labor_Cost || 0 },
    { name: 'Transport', value: projectData.project.Total_Transport_Cost || 0 },

    ...(projectData.project.CM_Estimated_Cost > 0 &&
      (projectData.project.CM_Estimated_Cost - projectData.project.Actual_Cost > 0)
      ? [{ name: 'Remaining Budget', value: projectData.project.CM_Estimated_Cost - projectData.project.Actual_Cost }]
      : []),

    ...(projectData.project.CM_Estimated_Cost > 0 &&
      (projectData.project.Actual_Cost - projectData.project.CM_Estimated_Cost > 0)
      ? [{ name: 'Over Budget', value: projectData.project.Actual_Cost - projectData.project.CM_Estimated_Cost }]
      : []),
  ].filter(item => item.value > 0);


  const COLORS_COST = ['#4F46E5', '#A78BFA', '#22C55E', '#EF4444']; // Indigo, Purple, Green, Red

  // Task Status Distribution Data
  const taskStatusChartData = [
    { name: 'Completed', value: projectData.project.Task_Progress?.completed || 0, color: '#22C55E' },
    { name: 'In Progress', value: projectData.project.Task_Progress?.inProgress || 0, color: '#3B82F6' },
    { name: 'Pending', value: projectData.project.Task_Progress?.pending || 0, color: '#F97316' },
    { name: 'On Hold', value: projectData.project.Task_Progress?.onHold || 0, color: '#EAB308' },
  ].filter(item => item.value > 0);

  // Task Duration Horizontal Bar Chart Data
  const taskDurationData = projectData.tasks?.map(task => {
    const assignDate = new Date(task.CM_Assign_Date);
    const dueDate = new Date(task.CM_Due_Date);
    const durationMs = dueDate.getTime() - assignDate.getTime();
    const durationDays = durationMs > 0 ? Math.ceil(durationMs / (1000 * 60 * 60 * 24)) : 0; // Duration in days
    return {
      name: task.CM_Task_Name,
      duration: durationDays,
      status: projectData.taskUpdates?.find(u => u.CM_Task_ID === task.CM_Task_ID)?.CM_Status || task.CM_Is_Active,
    };
  }).sort((a, b) => b.duration - a.duration); // Sort by duration (longest first)

  // --- End of Data preparation for Recharts ---
  // Add these helper functions near the other UI helper functions
  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Active': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-2 md:p-2 lg:p-2 xl:p-2">
        <div className=" mx-auto">
          {/* Header with back button, project info and export */}
          <div className="bg-white p-2 md:p-3 mb-2 md:mb-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* LEFT — Back Button */}
                <button
                  onClick={() => router.back()}
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full 
                            bg-gray-100 text-gray-700 hover:bg-gray-200 
                            transition-colors"
                  aria-label="Back to projects"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {/* CENTER — PROJECT DETAILS */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {projectData.project.CM_Project_Name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5 text-[11px] md:text-sm text-gray-600">
                    <span className="whitespace-nowrap">
                      Code: <span className="font-semibold text-gray-900">{projectData.project.CM_Project_Code}</span>
                    </span>

                    <span className="text-gray-300">•</span>

                    <span className={`px-2 py-0.5 rounded-full font-medium border text-[10px] md:text-xs whitespace-nowrap ${getProjectTypeColor(projectData.project.CM_Project_Type)}`}>
                      {projectData.project.CM_Project_Type || "N/A"}
                    </span>

                    {projectData.project.Customer_Name && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-700 truncate max-w-[120px] md:max-w-[200px]">
                          {projectData.project.Customer_Name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Dropdown */}
              <div className="relative inline-block text-left w-full md:w-auto flex justify-end mt-2 md:mt-0">
                <div>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 md:py-2 bg-gray-500 text-white rounded-lg shadow transition-all font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                    <div className="p-2">
                      <button
                        onClick={() => { setShowMenu(false); downloadExcel(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
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
                        onClick={() => { setShowMenu(false); downloadPDF(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
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

                      {/* New "Download All" section with separator */}
                      <div className="border-t border-gray-100 my-1 pt-1">
                        <h3 className="px-3 text-xs font-medium text-gray-500 uppercase mt-1 mb-1">Complete Project Data</h3>

                        <button
                          onClick={() => { setShowMenu(false); downloadAllExcel(); }}
                          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 group"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg mr-3 group-hover:bg-indigo-200 transition-colors">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">All Data (Excel)</div>
                            <p className="text-xs text-gray-500">Full project report</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setShowMenu(false); downloadAllPDF(); }}
                          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 group mt-1"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg mr-3 group-hover:bg-indigo-200 transition-colors">
                            <FileText className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">All Data (PDF)</div>
                            <p className="text-xs text-gray-500">Full project report</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Compact Project Task Progress */}
            <div onClick={() => setActiveTab("milestones")} className="mt-2 bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-yellow-100/50 transition-colors">
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="bg-yellow-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-sm">
                  {taskProgressPercentage}%
                </div>
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest whitespace-nowrap">Task Progress</span>
              </div>

              <div className="flex-1 w-full bg-white/80 rounded-full h-2.5 border border-yellow-100 overflow-hidden shadow-inner">
                <div
                  className="bg-yellow-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                  style={{
                    width: `${taskProgressPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center gap-6 text-[10px] font-black tracking-tighter uppercase">
                <div className="flex items-center gap-1.5 text-green-700">
                  <div className="w-2.5 h-2.5 rounded-sm bg-green-500 shadow-sm"></div>
                  <span>{projectData.project.Task_Progress.completed} DONE</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm"></div>
                  <span>{projectData.project.Task_Progress.inProgress} ACTIVE</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-400 shadow-sm"></div>
                  <span>{projectData.project.Task_Progress.pending} PENDING</span>
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div className="flex flex-wrap justify-between items-center text-[11px] font-bold text-gray-500 mt-4 px-1 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-green-600" />
                <span className="uppercase tracking-widest">Planned Start:</span>
                <span className="text-gray-900">{formatDate(projectData.project.CM_Planned_Start_Date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-red-600" />
                <span className="uppercase tracking-widest">Planned End:</span>
                <span className="text-gray-900">{formatDate(projectData.project.CM_Planned_End_Date)}</span>
              </div>
            </div>
          </div>

          <div className="mb-2 md:mb-2">
            <div className="bg-white p-1 inline-block max-w-full w-full custom-scrollbar">
              <nav className="grid grid-cols-2 md:flex gap-1 w-full">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "labor", label: "Labor", icon: Users },
                  { id: "milestones", label: "Milestones & Tasks", icon: CheckSquare },
                  { id: "analytics", label: "Analytics", icon: BarChart2 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    relative flex items-center gap-2 px-4 md:px-6 py-2.5
                    text-xs md:text-sm font-semibold rounded-lg whitespace-nowrap
                    transition-all duration-200
                    ${activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }
          `}
                  >
                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-blue-600" : "text-gray-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="bg-white p-2 md:p-2">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6 md:space-y-8">
                {/* Financial Summary */}
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-green-600" />
                    Financial Summary
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-blue-50 rounded-xl border-l-4 border-blue-100 p-2 md:p-2 flex flex-col">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-blue-700">Estimated Cost</span>
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-600 opacity-70" />
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-blue-800">{formatCurrency(projectData.project.CM_Estimated_Cost)}</span>
                    </div>
                    <div className="bg-purple-50 rounded-xl border-l-4 border-purple-100 p-2 md:p-2 flex flex-col">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-purple-700">Actual Cost</span>
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-600 opacity-70" />
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-purple-800">{formatCurrency(projectData.project.Actual_Cost)}</span>
                      <span className="text-xs text-purple-600 mt-0.5 md:mt-1">
                        {projectData.project.CM_Estimated_Cost > 0 ?
                          `${Math.round((projectData.project.Actual_Cost / projectData.project.CM_Estimated_Cost) * 100)}% of estimated` :
                          '—'
                        }
                      </span>
                    </div>
                    <div className={`rounded-xl border-l-4 p-2 md:p-2 flex flex-col ${(projectData.project.Cost_Variance || 0) < 0
                      ? "bg-red-50 border-red-100"
                      : "bg-green-50 border-green-100"
                      }`}>
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className={`text-xs md:text-sm font-medium ${(projectData.project.Cost_Variance || 0) < 0
                          ? "text-red-700"
                          : "text-green-700"
                          }`}>Cost Variance</span>
                        <BarChart2 className={`h-4 w-4 md:h-5 md:w-5 opacity-70 ${(projectData.project.Cost_Variance || 0) < 0
                          ? "text-red-600"
                          : "text-green-600"
                          }`} />
                      </div>
                      <span className={`text-lg md:text-2xl font-bold ${(projectData.project.Cost_Variance || 0) < 0
                        ? "text-red-800"
                        : "text-green-800"
                        }`}>{formatCurrency(projectData.project.Cost_Variance)}</span>
                      <span className={`text-xs mt-0.5 md:mt-1 ${(projectData.project.Cost_Variance || 0) < 0
                        ? "text-red-600"
                        : "text-green-600"
                        }`}>
                        {projectData.project.CM_Estimated_Cost > 0 ?
                          `${Math.abs(Math.round((projectData.project.Cost_Variance / projectData.project.CM_Estimated_Cost) * 100))}% ${(projectData.project.Cost_Variance || 0) < 0 ? 'over' : 'under'} budget` :
                          '—'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Details and Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-2 flex items-center">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-blue-600" />
                      Project Information
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 p-2 md:p-2">
                      <dl className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Project Type</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2 flex items-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getProjectTypeColor(projectData.project.CM_Project_Type)}`}>
                              {getProjectTypeIcon(projectData.project.CM_Project_Type)}
                              <span className="ml-1">{projectData.project.CM_Project_Type || "N/A"}</span>
                            </span>
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Location</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2 break-words">
                            {projectData.project.CM_Project_Location || "—"}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Customer</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2 flex items-center">
                            <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 mr-1" />
                            {projectData.project.CM_Customer_Name || "—"}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Description</dt>
                          <dd className="text-xs md:text-sm text-gray-900 sm:col-span-2 break-words">
                            {projectData.project.CM_Description || "No description provided."}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-2 flex items-center">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-violet-600" />
                      Timeline & Schedule
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 p-2 md:p-2">
                      <dl className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Start Date</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2">
                            {formatDate(projectData.project.CM_Planned_Start_Date)}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">End Date</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2">
                            {formatDate(projectData.project.CM_Planned_End_Date)}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Working Days</dt>
                          <dd className="text-xs md:text-sm font-medium text-gray-900 sm:col-span-2">
                            {projectData.workingDates ? projectData.workingDates.length : "0"}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 py-2 md:py-3">
                          <dt className="text-xs md:text-sm font-medium text-gray-500">Status</dt>
                          <dd className="text-xs md:text-sm sm:col-span-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(projectData.project.CM_Status)}`}>
                              {projectData.project.CM_Status}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Resource Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-amber-50 rounded-xl border border-amber-100 p-2 md:p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-amber-800 text-sm md:text-base font-medium mb-0.5 md:mb-1">Labor</h3>
                        <p className="text-xl md:text-2xl font-bold text-amber-900">{projectData.labor?.length || 0}</p>
                      </div>
                      <div className="bg-amber-100 p-2 md:p-3 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('labor')}
                      className="mt-3 md:mt-4 w-full py-1.5 md:py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="bg-green-50 rounded-xl border border-green-100 p-2 md:p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-green-800 text-sm md:text-base font-medium mb-0.5 md:mb-1">Tasks</h3>
                        <p className="text-xl md:text-2xl font-bold text-green-900"><CountUp end={projectData.project.Task_Progress.total} duration={2} /></p>
                      </div>
                      <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                        <CheckSquare className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('milestones')}
                      className="mt-3 md:mt-4 w-full py-1.5 md:py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Labor Tab */}
            {activeTab === "labor" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-amber-600" />
                    Labor Resources
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex gap-2">
                      <select
                        value={laborMonthFilter}
                        onChange={(e) => setLaborMonthFilter(e.target.value)}
                        className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-700 font-medium"
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={i}>
                            {new Date(0, i).toLocaleString('default', { month: 'short' })}
                          </option>
                        ))}
                      </select>
                      <select
                        value={laborYearFilter}
                        onChange={(e) => setLaborYearFilter(e.target.value)}
                        className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-700 font-medium"
                      >
                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative w-full md:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search Labor..."
                        value={searchLabor}
                        onChange={(e) => setSearchLabor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {(!projectData.labor || projectData.labor.length === 0) ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 md:p-3 text-center">
                    <Users className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">No Labor Resources Found</h3>
                    <p className="text-gray-500 text-xs md:text-sm">This project doesn't have any labor resources assigned yet.</p>
                  </div>
                ) : (
                  <div className="bg-white md:border-2 md:border-gray-300 md:overflow-hidden">
                    {/* Mobile View - Labor Cards */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-1">
                      {projectData.labor
                        .filter(l => `${l.CM_First_Name} ${l.CM_Last_Name} ${l.CM_Labor_Code}`.toLowerCase().includes(searchLabor.toLowerCase()))
                        .map((labor, idx) => {
                          const isExpanded = expandedLabor.has(labor.Labor_ID);
                          const laborWorkingDates = projectData.workingDates?.filter(date => date.CM_Labor_ID === labor.Labor_ID) || [];
                          const currentMonth = parseInt(laborMonthFilter);
                          const currentYear = parseInt(laborYearFilter);
                          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                          const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }).toUpperCase();
                          const currentMonthDates = laborWorkingDates.filter(d => {
                            const dt = new Date(d.Work_Date);
                            return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
                          });
                          const monthPresent = currentMonthDates.filter(d => d.Present_Count > 0).length;
                          const monthAbsent = currentMonthDates.filter(d => d.Present_Count === 0).length;

                          return (
                            <div key={`labor-card-${idx}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                              <div onClick={() => toggleLabor(labor.Labor_ID)} className="p-4 cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 uppercase text-sm">{labor.CM_First_Name} {labor.CM_Last_Name}</span>
                                    <span className="text-[10px] text-blue-600 tracking-tighter">{labor.CM_Labor_Code} • {labor.Role}</span>
                                  </div>
                                  <div className="text-right flex flex-col">
                                    <span className="text-xs font-bold text-gray-900">{formatCurrency(labor.Total_Cost)}</span>
                                    <span className="text-[9px] text-gray-500 uppercase">Total Cost</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Wages</span>
                                    <span className="text-[10px] font-bold text-gray-700">{labor.CM_Wage_Type}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Rate</span>
                                    <span className="text-[10px] font-bold text-gray-700">{formatCurrency(labor.Hourly_Rate)}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">{monthName}</span>
                                    <div className="flex gap-1">
                                      <span className="text-green-600 font-bold text-[10px]">{monthPresent}P</span>
                                      <span className="text-red-500 font-bold text-[10px]">{monthAbsent}A</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="bg-gray-50/50 border-t border-gray-100 p-2">
                                  <div className="bg-white border rounded-lg p-3">
                                    <h5 className="text-[10px] font-black text-gray-800 tracking-widest uppercase mb-3 text-center border-b pb-2">
                                      {monthName} {currentYear} ATTENDANCE
                                    </h5>
                                    <div className="grid grid-cols-7 border-t border-l border-gray-200">
                                      {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const dateObj = new Date(currentYear, currentMonth, day);
                                        const isSunday = dateObj.getDay() === 0;
                                        const status = laborWorkingDates.find(d => {
                                          const dDate = new Date(d.Work_Date);
                                          return dDate.getDate() === day && dDate.getMonth() === currentMonth;
                                        });
                                        let statusText = status ? (status.Present_Count > 0 ? "P" : "A") : (isSunday ? "WO" : "-");
                                        let textColor = "text-gray-300";
                                        let bgColor = "bg-white";
                                        if (statusText === "P") { textColor = "text-green-600"; bgColor = "bg-green-50"; }
                                        if (statusText === "A") { textColor = "text-red-600"; bgColor = "bg-red-50"; }
                                        if (statusText === "WO") { textColor = "text-gray-400"; bgColor = "bg-gray-100/50"; }

                                        return (
                                          <div key={`day-mob-${day}`} className={`flex flex-col items-center py-2 border-r border-b border-gray-200 ${bgColor}`}>
                                            <span className="text-[8px] font-bold text-gray-400">{day}</span>
                                            <span className={`text-[10px] font-black ${textColor}`}>{statusText}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Desktop View - Labor Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#f3f4f6] border-b-2 border-gray-300">
                            <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-r border-gray-300 uppercase">NAME & DETAILS</th>
                            <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-r border-gray-300 uppercase">WAGES TYPE</th>
                            <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-r border-gray-300 uppercase">EMPLOYEE TYPE</th>
                            <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-300 uppercase">RATE</th>
                            <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-r border-gray-300 uppercase">ATTENDANCE</th>
                            <th className="px-3 py-2.5 text-right font-bold text-gray-700 border-r border-gray-300 uppercase">TOTAL COST</th>
                            <th className="w-10 bg-gray-50"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {projectData.labor
                            .filter(l => `${l.CM_First_Name} ${l.CM_Last_Name} ${l.CM_Labor_Code}`.toLowerCase().includes(searchLabor.toLowerCase()))
                            .map((labor, idx) => {
                              const isExpanded = expandedLabor.has(labor.Labor_ID);
                              const laborWorkingDates = projectData.workingDates?.filter(date => date.CM_Labor_ID === labor.Labor_ID) || [];

                              // Calculate date breakdown for the current month
                              const today = new Date();
                              const currentMonth = parseInt(laborMonthFilter);
                              const currentYear = parseInt(laborYearFilter);
                              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                              const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }).toUpperCase();
                              
                              const currentMonthDates = laborWorkingDates.filter(d => {
                                const dt = new Date(d.Work_Date);
                                return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
                              });
                              const monthPresent = currentMonthDates.filter(d => d.Present_Count > 0).length;
                              const monthAbsent = currentMonthDates.filter(d => d.Present_Count === 0).length;

                              return (
                                <React.Fragment key={`labor-${idx}`}>
                                  <tr
                                    onClick={() => toggleLabor(labor.Labor_ID)}
                                    className={`border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                  >
                                    <td className="px-3 py-2.5 border-r border-gray-200">
                                      <div className="flex items-center gap-2">
                                       <div className="flex flex-col">
                                          <span className="font-bold text-gray-900 uppercase">{labor.CM_First_Name} {labor.CM_Last_Name}</span>
                                          <span className="text-[10px] text-blue-600 tracking-tighter">{labor.CM_Labor_Code} • {labor.Role}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center border-r border-gray-200 font-medium text-gray-600">
                                      {labor.CM_Wage_Type}
                                    </td>
                                    <td className="px-3 py-2.5 text-center border-r border-gray-200">
                                      <span className="text-blue-600 font-medium">{labor.CM_Labor_Type}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right border-r border-gray-200 font-bold text-gray-900">
                                      {formatCurrency(labor.Hourly_Rate)}
                                    </td>
                                    <td className="px-3 py-2.5 text-center border-r border-gray-200">
                                      <div className="flex flex-col items-center gap-0.5 text-[9px] uppercase font-black tracking-tighter">
                                        <span className="text-gray-500 mb-0.5">{monthName}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{monthPresent} P</span>
                                          <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{monthAbsent} A</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right border-r border-gray-200 font-bold text-gray-900 text-sm">
                                      {formatCurrency(labor.Total_Cost)}
                                    </td>
                                    <td className="px-2 py-2.5 text-center bg-gray-50/50">
                                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                    </td>
                                  </tr>

                                  {isExpanded && (
                                    <tr>
                                      <td colSpan="7" className="p-0 border-b border-gray-300">
                                        <div className="bg-white p-2 space-y-4">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-orange-500" />
                                              Month-wise Attendance Summary
                                            </h4>
                                            <div className="flex gap-2">
                                              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600">
                                                {monthName} {currentYear} <span className="ml-1 text-orange-600">{monthPresent} PRESENT</span>
                                              </span>
                                            </div>
                                          </div>

                                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <h5 className="text-[11px] font-black text-gray-800 tracking-widest uppercase">
                                                DAILY BREAKDOWN - {monthName} {currentYear}
                                              </h5>
                                              <div className="flex gap-4 text-[9px] font-bold uppercase tracking-tighter">
                                                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300"></div> Present</div>
                                                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300"></div> Absent</div>
                                                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-200"></div> Week-Off</div>
                                              </div>
                                            </div>

                                            <div className="grid border-t border-l border-gray-300" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                                              {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const dateObj = new Date(currentYear, currentMonth, day);
                                                const dayLabel = dateObj.toLocaleString('default', { weekday: 'narrow' });
                                                const isSunday = dateObj.getDay() === 0;

                                                const status = laborWorkingDates.find(d => {
                                                  const dDate = new Date(d.Work_Date);
                                                  return dDate.getDate() === day && dDate.getMonth() === currentMonth;
                                                });

                                                let statusText = status ? (status.Present_Count > 0 ? "P" : "A") : (isSunday ? "WO" : "-");
                                                let bgColor = "bg-white";
                                                if (statusText === "P") bgColor = "bg-green-100/80";
                                                if (statusText === "A") bgColor = "bg-red-100/80";
                                                if (statusText === "WO") bgColor = "bg-gray-100/50";

                                                return (
                                                  <div key={day} className="flex flex-col text-center border-r border-b border-gray-300">
                                                    <div className="py-1 text-[9px] font-bold text-gray-500 bg-gray-50/50 border-b border-gray-200">{day}</div>
                                                    <div className={`py-1 text-[8px] font-medium ${isSunday ? 'text-red-500' : 'text-gray-400'}`}>{dayLabel}</div>
                                                    <div className={`py-2 text-[10px] font-black ${bgColor} ${statusText === 'P' ? 'text-green-700' : statusText === 'A' ? 'text-red-700' : 'text-gray-400'}`}>
                                                      {statusText}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                        </tbody>
                        <tfoot className="bg-[#f9fafb] border-t-2 border-gray-300 font-bold">
                          <tr>
                            <td colSpan={5} className="px-3 py-3 text-right text-gray-600 uppercase tracking-widest">Total Project Labor Cost:</td>
                            <td className="px-3 py-3 text-right text-sm text-blue-700 border-r border-gray-300">
                              {formatCurrency(projectData.project.Total_Labor_Cost)}
                            </td>
                            <td className="bg-gray-50"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Milestones & Tasks Tab */}
            {activeTab === "milestones" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <CheckSquare className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-green-600" />
                    Project Milestones & Tasks
                  </h2>

                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search Milestone or Task..."
                      value={searchMilestone}
                      onChange={(e) => setSearchMilestone(e.target.value)}
                    />
                  </div>
                </div>

                {(!projectData.milestones || projectData.milestones.length === 0) ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8 text-center">
                    <CheckSquare className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">No Milestones Found</h3>
                    <p className="text-gray-500 text-xs md:text-sm">This project doesn't have any milestones defined yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5 md:space-y-8">
                    {projectData.milestones
                      .filter(m =>
                        m.CM_Milestone_Name.toLowerCase().includes(searchMilestone.toLowerCase()) ||
                        m.tasks?.some(t => t.CM_Task_Name.toLowerCase().includes(searchMilestone.toLowerCase()))
                      )
                      .map((milestone, milestoneIndex) => (
                        <div key={`milestone-${milestoneIndex}`} className="bg-white border-2 border-gray-300 rounded-md overflow-hidden shadow-sm">
                          {/* Milestone Header */}
                          <div className="bg-[#f3f4f6] px-4 py-3 border-b-2 border-gray-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">{milestone.CM_Milestone_Name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(milestone.CM_Planned_Start_Date)}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(milestone.CM_Planned_End_Date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tasks for this milestone */}
                          {milestone.tasks && milestone.tasks.length > 0 ? (
                            <div className="overflow-x-auto">
                              {/* Mobile View - Task Cards */}
                              <div className="md:hidden grid grid-cols-1 gap-3 p-3">
                                {milestone.tasks
                                  .filter(t => t.CM_Task_Name.toLowerCase().includes(searchMilestone.toLowerCase()) || milestone.CM_Milestone_Name.toLowerCase().includes(searchMilestone.toLowerCase()))
                                  .map((task, taskIndex) => {
                                    const isExpanded = expandedTasks.has(task.CM_Task_ID);
                                    const taskHistory = projectData.taskUpdates?.filter(update => update.CM_Task_ID === task.CM_Task_ID) || [];
                                    const taskStatus = task.latestUpdate?.CM_Status || task.CM_Is_Active;

                                    return (
                                      <div key={`task-card-${taskIndex}`} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div onClick={() => toggleTask(task.CM_Task_ID)} className="p-3 cursor-pointer">
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 uppercase text-xs truncate max-w-[70%]">{task.CM_Task_Name}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getTaskStatusColor(taskStatus)}`}>
                                              {taskStatus}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase">
                                            <div className="flex items-center gap-1 truncate">
                                              <User className="h-3 w-3" /> {task.Engineer_First_Name || 'Unassigned'}
                                            </div>
                                            <div className={`${new Date(task.CM_Due_Date) < new Date() && taskStatus !== 'Completed' ? 'text-red-600' : ''}`}>
                                              DUE: {formatDate(task.CM_Due_Date)}
                                            </div>
                                          </div>
                                        </div>
                                        {isExpanded && (
                                          <div className="bg-white border-t border-gray-100 p-3 space-y-3">
                                            <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                                              <Clock className="h-3.5 w-3.5" /> Activity History
                                            </h4>
                                            {taskHistory.length > 0 ? (
                                              <div className="space-y-2">
                                                {taskHistory.map((update, uIdx) => (
                                                  <div key={`hist-mob-${uIdx}`} className="bg-gray-50 border border-gray-200 rounded p-2 text-[10px]">
                                                    <div className="flex justify-between items-center mb-1">
                                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${getTaskStatusColor(update.CM_Status)}`}>
                                                        {update.CM_Status}
                                                      </span>
                                                      <span className="text-gray-500">{formatDate(update.CM_Update_Date)}</span>
                                                    </div>
                                                    <p className="text-gray-700 italic border-l-2 border-indigo-200 pl-2">"{update.CM_Remarks || 'No remarks'}"</p>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-[9px] text-gray-400 italic text-center py-1">No updates recorded</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>

                              {/* Desktop View - Task Table */}
                              <table className="hidden md:table w-full border-collapse text-xs">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr className="text-left font-bold text-gray-600 font-bold text-gray-800">
                                    <th className="px-4 py-2 border-r border-gray-200 uppercase">Task Name</th>
                                    <th className="px-4 py-2 border-r border-gray-200 uppercase">Personnel</th>
                                    <th className="px-4 py-2 border-r border-gray-200 text-center uppercase">Dates</th>
                                    <th className="px-4 py-2 border-r border-gray-200 text-center uppercase">Status</th>
                                    <th className="px-4 py-2 border-r border-gray-200 uppercase">Last Activity</th>
                                    <th className="w-10 bg-gray-50"></th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {milestone.tasks
                                    .filter(t => t.CM_Task_Name.toLowerCase().includes(searchMilestone.toLowerCase()) || milestone.CM_Milestone_Name.toLowerCase().includes(searchMilestone.toLowerCase()))
                                    .map((task, taskIndex) => {
                                      const isExpanded = expandedTasks.has(task.CM_Task_ID);
                                      const taskHistory = projectData.taskUpdates?.filter(update =>
                                        update.CM_Task_ID === task.CM_Task_ID
                                      ) || [];

                                      return (
                                        <React.Fragment key={`task-${taskIndex}`}>
                                          <tr
                                            onClick={() => toggleTask(task.CM_Task_ID)}
                                            className={`border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}
                                          >
                                            <td className="px-4 py-2.5 border-r border-gray-200 font-bold text-gray-800 uppercase tracking-tight">
                                              {task.CM_Task_Name}
                                            </td>
                                            <td className="px-4 py-2.5 border-r border-gray-200">
                                              {(task.Engineer_First_Name || task.Engineer_Last_Name) ? (
                                                <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                    <User className="h-3 w-3" />
                                                  </div>
                                                  <span className="font-medium text-gray-700">
                                                    {task.Engineer_First_Name} {task.Engineer_Last_Name}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 italic">Unassigned</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-2.5 border-r border-gray-200 text-center">
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-gray-500">ASSIGNED: {formatDate(task.CM_Assign_Date)}</span>
                                                <span className={`font-bold ${new Date(task.CM_Due_Date) < new Date() && (task.latestUpdate?.CM_Status !== 'Completed') ? 'text-red-600' : 'text-gray-700'}`}>
                                                  DUE: {formatDate(task.CM_Due_Date)}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-2.5 border-r border-gray-200 text-center">
                                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${getTaskStatusColor(task.latestUpdate?.CM_Status || task.CM_Is_Active)}`}>
                                                {task.latestUpdate?.CM_Status || task.CM_Is_Active}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2.5 border-r border-gray-200">
                                              {task.latestUpdate ? (
                                                <div className="flex flex-col">
                                                  <span className="font-bold text-gray-900">{formatDate(task.latestUpdate.CM_Update_Date)}</span>
                                                  {task.latestUpdate.CM_Work_Hours && (
                                                    <span className="text-[10px] text-gray-500 font-mono">LABOR: {task.latestUpdate.CM_Work_Hours} HOURS</span>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-gray-400">—</span>
                                              )}
                                            </td>
                                            <td className="px-2 py-2.5 text-center bg-gray-50/50">
                                              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                            </td>
                                          </tr>

                                          {isExpanded && (
                                            <tr>
                                              <td colSpan="6" className="p-0 border-b border-gray-300">
                                                <div className="bg-white p-4 space-y-4">
                                                  <h4 className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> Activity History
                                                  </h4>

                                                  {taskHistory.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                      {taskHistory.map((update, updateIdx) => (
                                                        <div key={`history-${updateIdx}`} className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px]">
                                                          <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getTaskStatusColor(update.CM_Status)}`}>
                                                              {update.CM_Status}
                                                            </span>
                                                            <span className="font-bold text-gray-500">{formatDate(update.CM_Update_Date)}</span>
                                                          </div>
                                                          <p className="text-gray-700 mb-2">"{update.CM_Remarks || 'No remarks provided'}"</p>
                                                          <div className="flex justify-between items-center text-gray-500 font-bold border-t border-gray-200 pt-2">
                                                            <span className="flex items-center gap-1 uppercase"><User className="h-3 w-3" /> {update.Engineer_First_Name || 'System'}</span>
                                                            {update.CM_Work_Hours && <span className="font-mono">{update.CM_Work_Hours}H</span>}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-500 font-bold text-[10px] uppercase">
                                                      No activity recorded
                                                    </div>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="bg-gray-50 py-4 text-center text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                              No tasks found for this milestone
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-3 md:space-y-5 lg:space-y-8">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 lg:mb-4 flex items-center">
                  <BarChart2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 mr-1.5 sm:mr-2 text-indigo-600" />
                  Project Analytics & Visualizations
                </h2>

                {/* Cost Breakdown Pie Chart */}
                <div className="hidden md:block bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
                  <h3 className="text-xs sm:text-sm md:text-md font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center">
                    <DollarSign className="h-3 w-3 sm:h-3.5 md:h-4 w-3 sm:w-3.5 md:w-4 mr-1 sm:mr-1.5 md:mr-2 text-green-600" />
                    Cost Breakdown
                  </h3>
                  {costChartData && costChartData.filter(d => d.value > 0).length > 0 ? (
                    <div className="h-[200px] sm:h-[220px] md:h-[250px] lg:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60} // Fixed outerRadius for consistency
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            minAngle={10}
                            label={({ name, value, percent }) =>
                              `${name}: ${formatCurrency(value)}`
                            }
                          >
                            {costChartData.map((entry, index) => (
                              <Cell key={`cell-cost-${index}`} fill={COLORS_COST[index % COLORS_COST.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(name) => `${name}`}
                            contentStyle={{
                              fontSize: '10px',
                              padding: '4px'
                            }}
                          />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            formatter={(value, entry) => (
                              <span style={{
                                color: entry.color,
                                fontSize: '10px',
                                display: 'inline-block',
                                margin: '2px 4px'
                              }}>
                                {value}: {formatCurrency(entry.payload.value)}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4 sm:py-6 md:py-8">No cost data available for breakdown.</div>
                  )}
                </div>

                {/* Task Status Distribution Pie Chart */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
                  <h3 className="text-xs sm:text-sm md:text-md font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center">
                    <CheckSquare className="h-3 w-3 sm:h-3.5 md:h-4 w-3 sm:w-3.5 md:w-4 mr-1 sm:mr-1.5 md:mr-2 text-blue-600" />
                    Task Status Distribution
                  </h3>
                  {taskStatusChartData && taskStatusChartData.filter(d => d.value > 0).length > 0 ? (
                    <div className="h-[200px] sm:h-[220px] md:h-[250px] lg:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskStatusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60} // Fixed outerRadius for consistency
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value, percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {taskStatusChartData.map((entry, index) => (
                              <Cell key={`cell-task-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value} tasks`}
                            contentStyle={{
                              fontSize: '10px',
                              padding: '4px'
                            }}
                          />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            formatter={(value, entry) => (
                              <span style={{
                                color: entry.color,
                                fontSize: '10px',
                                display: 'inline-block',
                                margin: '2px 4px'
                              }}>
                                {value} ({entry.payload.value})
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4 sm:py-6 md:py-8">No task status data available.</div>
                  )}
                </div>

                {/* Task Progress Summary */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
                  <h3 className="text-xs sm:text-sm md:text-md font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center">
                    <CheckSquare className="h-3 w-3 sm:h-3.5 md:h-4 w-3 sm:w-3.5 md:w-4 mr-1 sm:mr-1.5 md:mr-2 text-purple-600" />
                    Task Progress Summary
                  </h3>

                  <div className="bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100 p-2 sm:p-3 md:p-4 mb-3 sm:mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <span className="text-xs sm:text-sm font-medium text-purple-800">Task Completion</span>
                      <span className="text-xs sm:text-sm md:text-base font-bold text-purple-800 text-right">
                        {completedTasks} of {totalTasks} tasks ({taskProgressPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 sm:h-2 md:h-3 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${taskProgressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-700 mt-1.5 flex items-center justify-center sm:justify-start">
                      <CheckSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      {taskProgressPercentage === 100
                        ? 'All tasks completed'
                        : `${completedTasks} tasks completed, ${totalTasks - completedTasks} remaining`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-2 sm:p-2.5 md:p-3 text-center">
                      <div className="text-base sm:text-lg md:text-xl font-bold text-green-700">
                        {projectData.project.Task_Progress?.completed || 0}
                      </div>
                      <div className="text-xs sm:text-xs md:text-sm text-green-600">Completed</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 sm:p-2.5 md:p-3 text-center">
                      <div className="text-base sm:text-lg md:text-xl font-bold text-blue-700">
                        {projectData.project.Task_Progress?.inProgress || 0}
                      </div>
                      <div className="text-xs sm:text-xs md:text-sm text-blue-600">In Progress</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2 sm:p-2.5 md:p-3 text-center mt-2 sm:mt-0">
                      <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-700">
                        {projectData.project.Task_Progress?.pending || 0}
                      </div>
                      <div className="text-xs sm:text-xs md:text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 sm:p-2.5 md:p-3 text-center mt-2 sm:mt-0">
                      <div className="text-base sm:text-lg md:text-xl font-bold text-orange-700">
                        {projectData.project.Task_Progress?.onHold || 0}
                      </div>
                      <div className="text-xs sm:text-xs md:text-sm text-orange-600">On Hold</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
