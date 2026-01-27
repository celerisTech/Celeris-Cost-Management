"use client";

import React, { useEffect, useState } from "react";
import {
  Wrench, ArrowLeft, LayoutDashboard, Calendar, DollarSign,
  Users, Package, Truck, Clock, Zap, CheckSquare,
  User, MapPin, FileText, BarChart2, ShieldCheck, CheckCircle, PauseCircle, RefreshCw,
  ChevronDown, ChevronUp, Eye
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
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
              {/* Sun */}
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              {/* Orbit 1 */}
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              {/* Orbit 2 */}
              <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
      <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8">
        <div className=" mx-auto">
          {/* Header with back button, project info and export */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">

              {/* LEFT — Back Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 h-9 md:h-10 rounded-xl 
                          bg-blue-200 text-gray-900 hover:bg-blue-300 
                          transition-colors font-medium"
                aria-label="Back to projects"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Back</span>
              </button>

              {/* CENTER — PROJECT DETAILS */}
              <div className="flex-1 text-center">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
                  {projectData.project.CM_Project_Name}
                </h1>

                <div className="flex flex-wrap justify-center items-center gap-2 mt-1 text-xs md:text-sm text-gray-600">
                  <span>
                    Code:
                    <span className="font-semibold text-gray-900 ml-1">
                      {projectData.project.CM_Project_Code}
                    </span>
                  </span>

                  <span className="text-gray-400">•</span>

                  <span className={`px-2 py-0.5 rounded-full font-medium border ${getProjectTypeColor(projectData.project.CM_Project_Type)}`}>
                    {projectData.project.CM_Project_Type || "N/A"}
                  </span>

                  {projectData.project.Customer_Name && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium text-gray-700">
                        {projectData.project.Customer_Name}
                      </span>
                    </>
                  )}
                </div>

                {/* STATUS BADGE */}
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs md:text-sm font-medium border bg-green-300 ${getStatusColor(projectData.project.CM_Status)}`}
                  >
                    {projectData.project.CM_Status}
                  </span>
                </div>
              </div>

              {/* Download Dropdown */}
              <div className="relative inline-block text-left">
                <div>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

            {/* Progress Bar */}
            <div onClick={() => setActiveTab("milestones")} className="mt-4 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <span className="font-semibold text-gray-700 text-sm md:text-base">Project Task Progress</span>
                <span className="font-bold text-blue-600 text-base md:text-lg">
                  <CountUp end={taskProgressPercentage} duration={1.5} suffix="%" />
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 mb-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 md:h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{
                    width: `${taskProgressPercentage}%`,
                    transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                ></div>
              </div>

              {/* Task Progress Breakdown with Enhanced Styling */}
              {projectData.project.Task_Progress && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mt-4 md:mt-6">
                  {/* Completed */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-2 md:p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="font-bold text-green-700 text-base md:text-xl mb-0.5 md:mb-1">
                      <CountUp end={projectData.project.Task_Progress.completed} duration={2} />
                    </div>
                    <div className="text-green-600 font-medium text-xs md:text-sm">Completed</div>
                    <div className="w-3 md:w-4 h-1 bg-green-400 rounded-full mx-auto mt-1 md:mt-2"></div>
                  </div>

                  {/* In Progress */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-2 md:p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="font-bold text-blue-700 text-base md:text-xl mb-0.5 md:mb-1">
                      <CountUp end={projectData.project.Task_Progress.inProgress} duration={2} />
                    </div>
                    <div className="text-blue-600 font-medium text-xs md:text-sm">In Progress</div>
                    <div className="w-3 md:w-4 h-1 bg-blue-400 rounded-full mx-auto mt-1 md:mt-2"></div>
                  </div>

                  {/* Pending */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-2 md:p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="font-bold text-yellow-700 text-base md:text-xl mb-0.5 md:mb-1">
                      <CountUp end={projectData.project.Task_Progress.pending} duration={2} />
                    </div>
                    <div className="text-yellow-600 font-medium text-xs md:text-sm">Pending</div>
                    <div className="w-3 md:w-4 h-1 bg-yellow-400 rounded-full mx-auto mt-1 md:mt-2"></div>
                  </div>

                  {/* On Hold */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-2 md:p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="font-bold text-orange-700 text-base md:text-xl mb-0.5 md:mb-1">
                      <CountUp end={projectData.project.Task_Progress.onHold} duration={2} />
                    </div>
                    <div className="text-orange-600 font-medium text-xs md:text-sm">On Hold</div>
                    <div className="w-3 md:w-4 h-1 bg-orange-400 rounded-full mx-auto mt-1 md:mt-2"></div>
                  </div>

                  {/* Total Tasks */}
                  <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-300 p-2 md:p-3 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="font-bold text-gray-700 text-base md:text-xl mb-0.5 md:mb-1">
                      <CountUp end={projectData.project.Task_Progress.total} duration={2} />
                    </div>
                    <div className="text-gray-600 font-medium text-xs md:text-sm">Total Tasks</div>
                    <div className="w-3 md:w-4 h-1 bg-gray-400 rounded-full mx-auto mt-1 md:mt-2"></div>
                  </div>
                </div>
              )}

              {/* Date Section */}
              <div className="flex flex-wrap justify-between items-center text-xs md:text-sm text-gray-600 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200 gap-2">
                <div className="flex items-center">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full mr-1.5 md:mr-2"></div>
                  <span>Start: {formatDate(projectData.project.CM_Planned_Start_Date)}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-red-500 rounded-full mr-1.5 md:mr-2"></div>
                  <span>End: {formatDate(projectData.project.CM_Planned_End_Date)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm mb-4 md:mb-6 overflow-x-auto border border-gray-200">
            <div className="min-w-max">
              <nav className="flex border-b border-gray-200 relative">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "labor", label: "Labor", icon: Users },
                  { id: "services", label: "Services", icon: Wrench },
                  { id: "milestones", label: "Milestones & Tasks", icon: CheckSquare },
                  { id: "analytics", label: "Analytics", icon: BarChart2 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-3 md:py-4 px-2 md:px-3 flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap text-xs md:text-sm font-medium transition-all duration-100 ${activeTab === tab.id
                      ? "text-blue-600 font-semibold transform translate-y-[-3px] md:translate-y-[-5px] flex-1 md:min-w-[120px]"
                      : "text-gray-600 hover:text-gray-900 flex-1 md:min-w-[120px]"
                      }`}
                  >
                    {/* Simple 3D Background Effect */}
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-white border border-gray-300 rounded-t-lg shadow-md transform -skew-y-1 scale-105" />
                    )}

                    {/* Simple 3D Icon */}
                    <div className={`transition-all duration-300 ${activeTab === tab.id
                      ? "transform rotate-3 scale-110"
                      : "group-hover:scale-105"
                      }`}>
                      <tab.icon
                        className={`h-3.5 w-3.5 md:h-4 md:w-4 ${activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                          }`}
                      />
                    </div>

                    <span className="relative hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
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
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 md:p-4 flex flex-col">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-blue-700">Estimated Cost</span>
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-600 opacity-70" />
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-blue-800">{formatCurrency(projectData.project.CM_Estimated_Cost)}</span>
                    </div>
                    <div className="bg-purple-50 rounded-xl border border-purple-100 p-3 md:p-4 flex flex-col">
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
                    <div className={`rounded-xl border p-3 md:p-4 flex flex-col ${(projectData.project.Cost_Variance || 0) < 0
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

                {/* Cost Breakdown */}
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                    <BarChart2 className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-indigo-600" />
                    Cost Breakdown
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                    {/* Total Material Cost */}
                    {/* <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-gray-700">Total Material Cost</span>
                        <Package className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-gray-900">{formatCurrency(projectData.project.Total_Material_Cost)}</span>
                      <span className="text-xs text-gray-600 block mt-0.5 md:mt-1">
                        {projectData.project.Actual_Cost > 0 ?
                          `${Math.round((projectData.project.Total_Material_Cost / projectData.project.Actual_Cost) * 100)}% of total cost` :
                          '—'
                        }
                      </span>
                    </div> */}

                    {/* Used Material Cost */}
                    {/* <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-teal-700">Used Material Cost</span>
                        <Package className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-teal-900">{formatCurrency(projectData.project.Used_Material_Cost)}</span>
                      <span className="text-xs text-teal-600 block mt-0.5 md:mt-1">
                        {projectData.project.Total_Material_Cost > 0 ?
                          `${Math.round((projectData.project.Used_Material_Cost / projectData.project.Total_Material_Cost) * 100)}% of material cost` :
                          '—'
                        }
                      </span>
                    </div> */}

                    {/* Remaining Material Cost */}
                    {/* <div className="bg-cyan-50 rounded-xl border border-cyan-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-cyan-700">Remaining Material</span>
                        <Package className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-cyan-900">{formatCurrency(projectData.project.Remaining_Material_Cost)}</span>
                      <span className="text-xs text-cyan-600 block mt-0.5 md:mt-1">
                        {projectData.project.Total_Material_Cost > 0 ?
                          `${Math.round((projectData.project.Remaining_Material_Cost / projectData.project.Total_Material_Cost) * 100)}% of material cost` :
                          '—'
                        }
                      </span>
                    </div> */}

                    {/* Labor Cost */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-amber-700">Labor Cost</span>
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-amber-900">{formatCurrency(projectData.project.Total_Labor_Cost)}</span>
                      <span className="text-xs text-amber-600 block mt-0.5 md:mt-1">
                        {projectData.project.Actual_Cost > 0 ?
                          `${Math.round((projectData.project.Total_Labor_Cost / projectData.project.Actual_Cost) * 100)}% of total cost` :
                          '—'
                        }
                      </span>
                    </div>

                    {/* Transport Cost */}
                    <div className="bg-green-50 rounded-xl border border-green-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-green-700">Transport Cost</span>
                        <Truck className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-green-900">{formatCurrency(projectData.project.Total_Transport_Cost)}</span>
                      <span className="text-xs text-green-600 block mt-0.5 md:mt-1">
                        {projectData.project.Actual_Cost > 0 ?
                          `${Math.round((projectData.project.Total_Transport_Cost / projectData.project.Actual_Cost) * 100)}% of total cost` :
                          '—'
                        }
                      </span>
                    </div>

                    {/* Services Cost - New Card */}
                    {/* <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 md:p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex justify-between items-center mb-1 md:mb-2">
                        <span className="text-xs md:text-sm font-medium text-purple-700">Services Cost</span>
                        <Wrench className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                      </div>
                      <span className="text-base md:text-xl font-bold text-purple-900">{formatCurrency(projectData.project.Total_Services_Cost)}</span>
                      <span className="text-xs text-purple-600 block mt-0.5 md:mt-1">
                        {projectData.project.Actual_Cost > 0 ?
                          `${Math.round((projectData.project.Total_Services_Cost / projectData.project.Actual_Cost) * 100)}% of total cost` :
                          '—'
                        }
                      </span>
                    </div> */}
                  </div>
                </div>

                {/* Project Details and Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-blue-600" />
                      Project Information
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-5">
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
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-violet-600" />
                      Timeline & Schedule
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-5">
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
                  {/* <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 md:p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-blue-800 text-sm md:text-base font-medium mb-0.5 md:mb-1">Materials</h3>
                        <p className="text-xl md:text-2xl font-bold text-blue-900">{projectData.materials?.length || 0}</p>
                      </div>
                      <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                        <Package className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="mt-3 md:mt-4 w-full py-1.5 md:py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div> */}

                  <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 md:p-5">
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

                  <div className="bg-green-50 rounded-xl border border-green-100 p-3 md:p-5">
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
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-amber-600" />
                    Labor Resources
                  </h2>
                </div>

                {/* Labor cost summary */}
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 md:p-5 mb-4 md:mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <h3 className="text-xs md:text-sm font-medium text-amber-700 mb-1 md:mb-2">Total Labor Cost</h3>
                      <p className="text-lg md:text-2xl font-bold text-amber-900">{formatCurrency(projectData.project.Total_Labor_Cost)}</p>
                    </div>
                    <div className="md:border-l md:border-amber-200 md:pl-4">
                      <h3 className="text-xs md:text-sm font-medium text-amber-700 mb-1 md:mb-2">Total Labor</h3>
                      <p className="text-lg md:text-2xl font-bold text-amber-900">{projectData.labor?.length || 0} workers</p>
                    </div>
                    <div className="md:border-l md:border-amber-200 md:pl-4">
                      <h3 className="text-xs md:text-sm font-medium text-amber-700 mb-1 md:mb-2">Working Days</h3>
                      <p className="text-lg md:text-2xl font-bold text-amber-900">{projectData.workingDates?.length || 0} days</p>
                    </div>
                  </div>
                </div>

                {(!projectData.labor || projectData.labor.length === 0) ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8 text-center">
                    <Users className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">No Labor Resources Found</h3>
                    <p className="text-gray-500 text-xs md:text-sm">This project doesn't have any labor resources assigned yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labor Code</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Wage Type</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days Present</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                            <th scope="col" className="px-3 md:px-4 py-2 md:py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectData.labor.map((labor, idx) => {
                            const isExpanded = expandedLabor.has(labor.Labor_ID);
                            // Filter working dates for this specific labor
                            const laborWorkingDates = projectData.workingDates?.filter(date => {
                              return date.CM_Labor_ID === labor.Labor_ID;
                            }) || [];

                            return (
                              <React.Fragment key={`labor-${idx}`}>
                                <tr
                                  onClick={() => toggleLabor(labor.Labor_ID)}
                                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700">{labor.CM_Labor_Code}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-900 font-medium">
                                    {labor.CM_First_Name} {labor.CM_Last_Name}
                                  </td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700">{labor.Role}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700">{labor.CM_Labor_Type}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                      {labor.CM_Wage_Type}
                                    </span>
                                  </td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700 text-right">{formatCurrency(labor.Hourly_Rate)}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">{labor.Days_Present}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-700 text-center">{labor.Total_Hours}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 text-right">{formatCurrency(labor.Total_Cost)}</td>
                                  <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-center">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-500 inline-block" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-500 inline-block" />
                                    )}
                                  </td>
                                </tr>

                                {/* Expandable Working Days Section */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="10" className="px-3 md:px-6 py-4 bg-gray-50">
                                      <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                          Working Days for {labor.CM_First_Name} {labor.CM_Last_Name}
                                        </h4>

                                        {laborWorkingDates.length > 0 ? (
                                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200">
                                              <thead>
                                                <tr className="bg-gray-100">
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Daily Cost</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-200">
                                                {laborWorkingDates.map((date, dateIdx) => (
                                                  <tr key={`labor-date-${dateIdx}`} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-xs text-gray-900">{formatDate(date.Work_Date)}</td>
                                                    <td className="px-3 py-2 text-center">
                                                      {date.Present_Count > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                          Present
                                                        </span>
                                                      ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                          Absent
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-700 text-center">{date.Hours_Worked || date.Total_Hours || '—'}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900 text-right font-medium">{formatCurrency(date.Daily_Cost || date.Daily_Labor_Cost)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                                            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No working days recorded for this labor</p>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <tr className="bg-gray-50 font-medium">
                            <td className="px-3 md:px-4 py-2.5 md:py-3.5 whitespace-nowrap text-xs md:text-sm text-gray-900" colSpan={8}>Total Labor Cost</td>
                            <td className="px-3 md:px-4 py-2.5 md:py-3.5 whitespace-nowrap text-xs md:text-sm text-gray-900 text-right">
                              {formatCurrency(projectData.project.Total_Labor_Cost)}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <Wrench className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-green-600" />
                    Service History
                  </h2>
                </div>

                {!projectData.services || projectData.services.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6 text-center">
                    <Wrench className="h-8 w-8 md:h-10 md:w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No service records found.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 overflow-hidden">
                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-3 p-3">
                      {projectData.services.map((service, idx) => (
                        <div key={`service-mobile-${idx}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Service Type</p>
                              <p className="text-gray-900">{service.CM_Service_Type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                              <p className="text-gray-900 font-medium">{formatCurrency(service.CM_Total_Amount)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 font-medium">Description</p>
                              <p className="text-gray-900">{service.CM_Description}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Date</p>
                              <p className="text-gray-900">{service.CM_Service_Date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Created By</p>
                              <p className="text-gray-900">{service.CM_Created_By}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectData.services.map((service, idx) => (
                            <tr key={`service-${idx}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{service.CM_Service_Type}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{service.CM_Description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(service.CM_Total_Amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                {service.CM_Service_Date}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                {service.CM_Created_By}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Milestones & Tasks Tab */}
            {activeTab === "milestones" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <CheckSquare className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2 text-green-600" />
                    Project Milestones & Tasks
                  </h2>
                </div>

                {(!projectData.milestones || projectData.milestones.length === 0) ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8 text-center">
                    <CheckSquare className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
                    <h3 className="text-gray-700 font-medium mb-1">No Milestones Found</h3>
                    <p className="text-gray-500 text-xs md:text-sm">This project doesn't have any milestones defined yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5 md:space-y-8">
                    {/* Milestones Timeline */}
                    {projectData.milestones.map((milestone, milestoneIndex) => (
                      <div key={`milestone-${milestoneIndex}`} className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
                        {/* Milestone Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                              <h3 className="text-base md:text-lg font-semibold text-gray-900">{milestone.CM_Milestone_Name}</h3>
                            </div>
                            {milestone.CM_Description && (
                              <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3">{milestone.CM_Description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                Start: {formatDate(milestone.CM_Planned_Start_Date)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                End: {formatDate(milestone.CM_Planned_End_Date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tasks for this milestone */}
                        {milestone.tasks && milestone.tasks.length > 0 ? (
                          <div className="mt-4 md:mt-6">
                            <h4 className="text-sm md:text-md font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
                              <CheckSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 text-green-600" />
                              Tasks ({milestone.tasks.length})
                            </h4>
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineer</th>
                                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {milestone.tasks.map((task, taskIndex) => {
                                      const isExpanded = expandedTasks.has(task.CM_Task_ID);
                                      const taskHistory = projectData.taskUpdates?.filter(update =>
                                        update.CM_Task_ID === task.CM_Task_ID
                                      ) || [];

                                      return (
                                        <React.Fragment key={`task-${taskIndex}`}>
                                          <tr
                                            onClick={() => toggleTask(task.CM_Task_ID)}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                          >
                                            <td className="px-4 py-3 text-xs md:text-sm font-medium text-gray-900">
                                              {task.CM_Task_Name}
                                            </td>
                                            <td className="px-4 py-3 text-xs md:text-sm text-gray-700">
                                              {(task.Engineer_First_Name || task.Engineer_Last_Name) ? (
                                                <div className="flex items-center">
                                                  <User className="h-3.5 w-3.5 text-gray-400 mr-2" />
                                                  <span className="truncate max-w-[120px]">
                                                    {task.Engineer_First_Name} {task.Engineer_Last_Name}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 italic">Unassigned</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-xs md:text-sm text-gray-700 text-center">
                                              {formatDate(task.CM_Assign_Date)}
                                            </td>
                                            <td className="px-4 py-3 text-xs md:text-sm text-center">
                                              <span className={`${new Date(task.CM_Due_Date) < new Date() && (task.latestUpdate?.CM_Status !== 'Completed') ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                                {formatDate(task.CM_Due_Date)}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs md:text-sm text-center">
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.latestUpdate?.CM_Status || task.CM_Is_Active)}`}>
                                                {task.latestUpdate?.CM_Status || task.CM_Is_Active}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs md:text-sm text-gray-700">
                                              {task.latestUpdate ? (
                                                <div className="flex flex-col">
                                                  <span className="text-xs font-medium text-gray-900">{formatDate(task.latestUpdate.CM_Update_Date)}</span>
                                                  {task.latestUpdate.CM_Work_Hours && (
                                                    <span className="text-[10px] text-gray-500 mt-0.5 flex items-center">
                                                      <Clock className="h-3 w-3 mr-1" /> {task.latestUpdate.CM_Work_Hours}h
                                                    </span>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-gray-500 inline-block" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4 text-gray-500 inline-block" />
                                              )}
                                            </td>
                                          </tr>

                                          {/* Expanded History */}
                                          {isExpanded && (
                                            <tr>
                                              <td colSpan="7" className="px-4 py-4 bg-gray-50">
                                                <div className="space-y-4 pl-2 md:pl-4">
                                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                                    <Clock className="h-4 w-4 mr-2 text-indigo-600" />
                                                    Task Activity History
                                                  </h4>

                                                  {taskHistory.length > 0 ? (
                                                    <div className="relative border-l-2 border-indigo-200 ml-2 space-y-6 pb-2">
                                                      {taskHistory.map((update, updateIdx) => (
                                                        <div key={`history-${updateIdx}`} className="relative pl-6">
                                                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white"></div>
                                                          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                            <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                                              <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(update.CM_Status)}`}>
                                                                  {update.CM_Status}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{formatDate(update.CM_Update_Date)}</span>
                                                              </div>
                                                              <div className="flex items-center text-xs text-gray-500">
                                                                <User className="h-3.5 w-3.5 mr-1" />
                                                                {update.Engineer_First_Name ? `${update.Engineer_First_Name} ${update.Engineer_Last_Name || ''}` : 'Unknown'}
                                                                {update.CM_Work_Hours && (
                                                                  <span className="ml-3 flex items-center font-medium text-gray-700">
                                                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                                                    {update.CM_Work_Hours}h
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>

                                                            {update.CM_Remarks && (
                                                              <p className="text-sm text-gray-700 mb-2">{update.CM_Remarks}</p>
                                                            )}

                                                            {update.CM_Image_URL && (
                                                              <div className="mt-2 text-right">
                                                                <a
                                                                  href={update.CM_Image_URL}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200"
                                                                  title="View attached image"
                                                                >
                                                                  <Eye className="h-3.5 w-3.5" />
                                                                  View Image
                                                                </a>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <div className="text-center py-4 text-gray-500 text-sm bg-white rounded-lg border border-gray-200 border-dashed">
                                                      No activity recorded for this task yet.
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
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center mt-3 md:mt-4">
                            <p className="text-gray-500 text-xs md:text-sm">No tasks assigned to this milestone.</p>
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
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
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
