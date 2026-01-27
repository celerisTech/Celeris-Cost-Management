// src\app\dashboard\components\BudgetVsExpenses.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Download, BarChart3, TrendingUp, TrendingDown, AlertCircle, Filter, Calendar, PieChart, Grid, Eye, EyeOff } from "lucide-react";

export default function ProjectCostReport() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'yearly', 'type'
  const [showDetailedView, setShowDetailedView] = useState(false);

  const currencyCode = 'INR';
  const locale = 'en-IN';

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/budget-expense");
        if (!res.ok) throw new Error("Failed to fetch project cost report");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, error]);

  const formatIndianRupees = (value) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  // Parse currency values
  const parseCurrency = (value) => {
    if (typeof value === 'string') {
      return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    return Number(value) || 0;
  };

  // Extract years from projects
  const years = useMemo(() => {
    const yearsSet = new Set();
    projects.forEach(project => {
      if (project.CM_Planned_Start_Date) {
        const year = new Date(project.CM_Planned_Start_Date).getFullYear();
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [projects]);

  // Extract project types
  const projectTypes = useMemo(() => {
    const typesSet = new Set();
    projects.forEach(project => {
      if (project.CM_Project_Type) {
        typesSet.add(project.CM_Project_Type);
      }
    });
    return Array.from(typesSet);
  }, [projects]);

  // Filter projects based on selections
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const projectYear = project.CM_Planned_Start_Date ?
        new Date(project.CM_Planned_Start_Date).getFullYear() : null;

      const yearMatch = selectedYear === "All" || projectYear === parseInt(selectedYear);
      const typeMatch = selectedType === "All" || project.CM_Project_Type === selectedType;

      return yearMatch && typeMatch;
    });
  }, [projects, selectedYear, selectedType]);

  // Calculate totals for filtered projects
  const totalEstimatedCost = useMemo(() =>
    filteredProjects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0),
    [filteredProjects]
  );

  const totalActualCost = useMemo(() =>
    filteredProjects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0),
    [filteredProjects]
  );

  const totalVariance = useMemo(() =>
    filteredProjects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0),
    [filteredProjects]
  );

  const variancePercentage = useMemo(() =>
    totalEstimatedCost > 0 ? (totalVariance / totalEstimatedCost) * 100 : 0,
    [totalEstimatedCost, totalVariance]
  );

  // Year-wise breakdown
  const yearlyBreakdown = useMemo(() => {
    const breakdown = {};
    projects.forEach(project => {
      const year = project.CM_Planned_Start_Date ?
        new Date(project.CM_Planned_Start_Date).getFullYear() : 'Unknown';

      if (!breakdown[year]) {
        breakdown[year] = {
          estimated: 0,
          actual: 0,
          variance: 0,
          count: 0
        };
      }

      breakdown[year].estimated += parseCurrency(project.CM_Estimated_Cost);
      breakdown[year].actual += parseCurrency(project.Actual_Cost);
      breakdown[year].variance += parseCurrency(project.Cost_Variance);
      breakdown[year].count++;
    });

    return Object.entries(breakdown).map(([year, data]) => ({
      year,
      ...data,
      variancePercentage: data.estimated > 0 ? (data.variance / data.estimated) * 100 : 0
    })).sort((a, b) => b.year - a.year);
  }, [projects]);

  // Project type breakdown
  const typeBreakdown = useMemo(() => {
    const breakdown = {};
    projects.forEach(project => {
      const type = project.CM_Project_Type || 'Unknown';

      if (!breakdown[type]) {
        breakdown[type] = {
          estimated: 0,
          actual: 0,
          variance: 0,
          count: 0
        };
      }

      breakdown[type].estimated += parseCurrency(project.CM_Estimated_Cost);
      breakdown[type].actual += parseCurrency(project.Actual_Cost);
      breakdown[type].variance += parseCurrency(project.Cost_Variance);
      breakdown[type].count++;
    });

    return Object.entries(breakdown).map(([type, data]) => ({
      type,
      ...data,
      variancePercentage: data.estimated > 0 ? (data.variance / data.estimated) * 100 : 0
    })).sort((a, b) => b.estimated - a.estimated);
  }, [projects]);

  // Download functions
  const downloadExcel = async () => {
    const XLSX = await import("xlsx");

    const wsData = [
      ["Metric", "Amount"],
      ["Total Estimated Cost", totalEstimatedCost],
      ["Total Actual Cost", totalActualCost],
      ["Total Variance", totalVariance],
      ["Variance %", `${variancePercentage.toFixed(1)}%`],
      [],
      ["Year-wise Breakdown"],
      ["Year", "Project Count", "Estimated Cost", "Actual Cost", "Variance", "Variance %"],
    ];

    yearlyBreakdown.forEach((item) => {
      wsData.push([
        item.year,
        item.count,
        item.estimated,
        item.actual,
        item.variance,
        `${item.variancePercentage.toFixed(1)}%`
      ]);
    });

    wsData.push([]);
    wsData.push(["Project Type-wise Breakdown"]);
    wsData.push(["Type", "Project Count", "Estimated Cost", "Actual Cost", "Variance", "Variance %"]);

    typeBreakdown.forEach((item) => {
      wsData.push([
        item.type,
        item.count,
        item.estimated,
        item.actual,
        item.variance,
        `${item.variancePercentage.toFixed(1)}%`
      ]);
    });

    wsData.push([]);
    wsData.push(["Project Details"]);
    wsData.push(["Project Name", "Type", "Year", "Estimated Cost", "Actual Cost", "Variance"]);

    filteredProjects.forEach((p) => {
      wsData.push([
        p.CM_Project_Name,
        p.CM_Project_Type,
        p.CM_Planned_Start_Date ? new Date(p.CM_Planned_Start_Date).getFullYear() : 'N/A',
        parseCurrency(p.CM_Estimated_Cost),
        parseCurrency(p.Actual_Cost),
        parseCurrency(p.Cost_Variance),
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Cost Analysis Report");

    XLSX.writeFile(workbook, "Cost_Analysis_Report.xlsx");
  };

  const downloadPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF("p", "mm", "a4");

    // ---------------------------------------
    // COMPANY HEADER
    // ---------------------------------------
    const logo = "/saranlogo.png";
    doc.addImage(logo, "PNG", 15, 12, 22, 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Saran Solar Private Limited", 42, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "131/2, Main Road,\nKullampalayam,\nGobichettipalayam – 638476,\nTamil Nadu, India.",
      42,
      26
    );

    doc.setDrawColor(70, 130, 180);
    doc.setLineWidth(0.8);
    doc.line(15, 42, 195, 42);

    // ---------------------------------------
    // REPORT TITLE
    // ---------------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Cost Performance Analysis Report", 15, 50);

    // ---------------------------------------
    // FILTER SUMMARY
    // ---------------------------------------
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filters: Year - ${selectedYear} | Type - ${selectedType}`, 15, 58);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 64);

    // ---------------------------------------
    // SUMMARY TABLE
    // ---------------------------------------
    autoTable(doc, {
      startY: 70,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Metric", "Amount"]],
      body: [
        ["Total Estimated Cost", totalEstimatedCost.toLocaleString("en-IN")],
        ["Total Actual Cost", totalActualCost.toLocaleString("en-IN")],
        ["Total Variance", totalVariance.toLocaleString("en-IN")],
        ["Variance %", variancePercentage.toFixed(1) + "%"],
      ],
    });

    // ---------------------------------------
    // YEAR-WISE BREAKDOWN
    // ---------------------------------------
    doc.text("Year-wise Cost Breakdown", 15, doc.lastAutoTable.finalY + 10);

    const yearlyData = yearlyBreakdown.map(item => [
      item.year,
      item.count,
      item.estimated.toLocaleString("en-IN"),
      item.actual.toLocaleString("en-IN"),
      item.variance.toLocaleString("en-IN"),
      item.variancePercentage.toFixed(1) + "%"
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      theme: "striped",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Year", "Projects", "Estimated", "Actual", "Variance", "Variance %"]],
      body: yearlyData,
    });

    // ---------------------------------------
    // TYPE-WISE BREAKDOWN
    // ---------------------------------------
    doc.text("Project Type-wise Breakdown", 15, doc.lastAutoTable.finalY + 10);

    const typeData = typeBreakdown.map(item => [
      item.type,
      item.count,
      item.estimated.toLocaleString("en-IN"),
      item.actual.toLocaleString("en-IN"),
      item.variance.toLocaleString("en-IN"),
      item.variancePercentage.toFixed(1) + "%"
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      theme: "striped",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Type", "Projects", "Estimated", "Actual", "Variance", "Variance %"]],
      body: typeData,
    });

    // ---------------------------------------
    // DETAILED PROJECT LIST
    // ---------------------------------------
    doc.text("Project Details", 15, doc.lastAutoTable.finalY + 10);

    const projectData = filteredProjects.map(p => [
      p.CM_Project_Name,
      p.CM_Project_Type || 'N/A',
      p.CM_Planned_Start_Date ? new Date(p.CM_Planned_Start_Date).getFullYear() : 'N/A',
      parseCurrency(p.CM_Estimated_Cost).toLocaleString("en-IN"),
      parseCurrency(p.Actual_Cost).toLocaleString("en-IN"),
      parseCurrency(p.Cost_Variance).toLocaleString("en-IN"),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Project", "Type", "Year", "Estimated", "Actual", "Variance"]],
      body: projectData,
    });

    // ---------------------------------------
    // FOOTER
    // ---------------------------------------
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Report generated by Celeris Solutions • info@saransolar.in ",
      15,
      pageHeight - 10
    );

    doc.save("Cost_Analysis_Report.pdf");
  };

  // Responsive bar heights
  const maxValue = Math.max(totalEstimatedCost, totalActualCost, Math.abs(totalVariance));
  const baseHeight = isMobile ? 60 : isTablet ? 70 : 80;
  const estimatedHeight = maxValue > 0 ? (totalEstimatedCost / maxValue) * baseHeight : 0;
  const actualHeight = maxValue > 0 ? (totalActualCost / maxValue) * baseHeight : 0;
  const varianceHeight = maxValue > 0 ? (Math.abs(totalVariance) / maxValue) * baseHeight : 0;

  // Color for project types
  const getTypeColor = (type, index) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-yellow-500 to-yellow-600',
      'bg-gradient-to-r from-red-500 to-red-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
    ];
    return colors[index % colors.length];
  };

  // Mobile-specific loading component
  if (loading) {
    if (isMobile) {
      return (
        <div className="flex justify-center items-center h-64 p-4">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Loading cost report...</p>
          </div>
        </div>
      );
    }

    return (
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
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${isMobile ? 'min-h-[300px] p-4' : 'min-h-[400px]'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="relative inline-block mb-4">
            <AlertCircle className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-red-400 mx-auto`} />
            <div className="absolute -inset-2 bg-red-100 rounded-full animate-pulse opacity-30"></div>
          </div>
          <p className="text-red-500 text-base font-medium mb-3">{error}</p>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl  p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-500">
        {/* Enhanced Responsive Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8 flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg`}>
                <BarChart3 className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
              </div>
            </div>
            <div>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
                {isMobile ? 'Cost Dashboard' : 'Cost Performance Dashboard'}
              </h2>
              {!isMobile && (
                <p className="text-sm text-gray-600 mt-1">Real-time budget tracking and analysis</p>
              )}
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("overview")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "overview"
                  ? "bg-white shadow text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"}`}
              >
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Over</span>
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "yearly"
                  ? "bg-white shadow text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"}`}
              >
                <span className="hidden sm:inline">Yearly</span>
                <span className="sm:hidden">Year</span>
              </button>
              <button
                onClick={() => setViewMode("type")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === "type"
                  ? "bg-white shadow text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"}`}
              >
                <span className="hidden sm:inline">By Type</span>
                <span className="sm:hidden">Type</span>
              </button>
            </div>

            {/* Responsive Download Dropdown */}
            <div className="relative inline-block text-left">
              <div>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-4 py-2'} bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <Download className="w-4 h-4" />
                  {isMobile ? 'Export' : 'Download'}
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
                <div className="absolute right-0 mt-2 w-48 sm:w-56 origin-top-right bg-white rounded-xl shadow-lg ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
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
                        <div className="font-medium">{isMobile ? 'Excel' : 'Download Excel'}</div>
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
                        <div className="font-medium">{isMobile ? 'PDF' : 'Download PDF'}</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-6 border border-gray-200/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Calendar className="inline w-3 h-3 mr-1" />
                Select Year
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear("All")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedYear === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  All Years
                </button>
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year.toString())}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedYear === year.toString()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Grid className="inline w-3 h-3 mr-1" />
                Project Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType("All")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedType === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  All Types
                </button>
                {projectTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200/50">
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold text-blue-600">{filteredProjects.length}</span> projects
              {selectedYear !== "All" && ` from ${selectedYear}`}
              {selectedType !== "All" && ` of type "${selectedType}"`}
            </div>
          </div>
        </div>

        {/* Main Content based on View Mode */}
        {viewMode === "overview" && (
          <>
            {/* Overview Bar Chart */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-inner mb-6">
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-700`}>
                  {isMobile ? 'Cost Overview' : 'Cost Comparison Overview'}
                </h3>
              </div>

              {/* Responsive Bars */}
              <div className={`flex items-end justify-between gap-4 sm:gap-6 ${isMobile ? 'h-40' : isTablet ? 'h-48' : 'h-56'} mb-6 lg:mb-8 px-2 sm:px-4`}>
                {/* Estimated Cost Bar */}
                <div className="flex flex-col items-center flex-1 h-full group">
                  <div className="flex flex-col items-center justify-end h-full w-full max-w-16 sm:max-w-20 relative">
                    <div
                      className={`w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-2xl transition-all duration-1000 ease-out relative overflow-hidden ${isAnimating ? 'animate-pulse' : ''}`}
                      style={{ height: `${estimatedHeight}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-300/30 transition-all duration-1000"
                        style={{ height: isAnimating ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 text-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full mx-auto mb-1 sm:mb-2 shadow-md"></div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`}>Estimated</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1 font-medium`}>
                      {isMobile ? formatIndianRupees(totalEstimatedCost).replace('₹', '₹ ') : formatIndianRupees(totalEstimatedCost)}
                    </p>
                  </div>
                </div>

                {/* Actual Cost Bar */}
                <div className="flex flex-col items-center flex-1 h-full group">
                  <div className="flex flex-col items-center justify-end h-full w-full max-w-16 sm:max-w-20 relative">
                    <div
                      className={`w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-2xl transition-all duration-1000 ease-out delay-300 relative overflow-hidden ${isAnimating ? 'animate-pulse' : ''}`}
                      style={{ height: `${actualHeight}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-purple-300/30 transition-all duration-1000 delay-300"
                        style={{ height: isAnimating ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 text-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-purple-500 to-purple-400 rounded-full mx-auto mb-1 sm:mb-2 shadow-md"></div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`}>Actual</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1 font-medium`}>
                      {isMobile ? formatIndianRupees(totalActualCost).replace('₹', '₹ ') : formatIndianRupees(totalActualCost)}
                    </p>
                  </div>
                </div>

                {/* Variance Bar */}
                <div className="flex flex-col items-center flex-1 h-full group">
                  <div className="flex flex-col items-center justify-end h-full w-full max-w-16 sm:max-w-20 relative">
                    <div
                      className={`w-full rounded-t-2xl transition-all duration-1000 ease-out delay-500 relative overflow-hidden ${isAnimating ? 'animate-pulse' : ''} ${totalVariance < 0
                        ? 'bg-gradient-to-t from-red-500 to-red-400'
                        : 'bg-gradient-to-t from-green-500 to-green-400'
                        }`}
                      style={{ height: `${varianceHeight}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      <div
                        className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 delay-500 ${totalVariance < 0 ? 'bg-red-300/30' : 'bg-green-300/30'
                          }`}
                        style={{ height: isAnimating ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 text-center">
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1 sm:mb-2 shadow-md ${totalVariance < 0
                      ? 'bg-gradient-to-br from-red-500 to-red-400'
                      : 'bg-gradient-to-br from-green-500 to-green-400'
                      }`}></div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`}>Variance</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1 font-medium ${totalVariance < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {isMobile ? formatIndianRupees(totalVariance).replace('₹', '₹ ') : formatIndianRupees(totalVariance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Responsive Summary Stats */}
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-4'} mb-6`}>
              <div className={`text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300 group ${isMobile ? '' : 'hover:scale-105'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-blue-700 mb-1`}>
                  {isMobile ? 'Budget' : 'Estimated Budget'}
                </p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-blue-800`}>
                  {isMobile ? formatIndianRupees(totalEstimatedCost).replace('₹', '₹ ') : formatIndianRupees(totalEstimatedCost)}
                </p>
                <div className="mt-1 sm:mt-2 text-xs text-blue-600 bg-blue-200/50 rounded-full px-2 py-1 inline-block">
                  Planned
                </div>
              </div>

              <div className={`text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300 group ${isMobile ? '' : 'hover:scale-105'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-purple-700 mb-1`}>
                  {isMobile ? 'Spent' : 'Actual Cost'}
                </p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-purple-800`}>
                  {isMobile ? formatIndianRupees(totalActualCost).replace('₹', '₹ ') : formatIndianRupees(totalActualCost)}
                </p>
                <div className="mt-1 sm:mt-2 text-xs text-purple-600 bg-purple-200/50 rounded-full px-2 py-1 inline-block">
                  Spent
                </div>
              </div>

              <div className={`text-center p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 group ${isMobile ? '' : 'hover:scale-105'} ${totalVariance < 0
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200/50'
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200/50'
                }`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md group-hover:shadow-lg transition-shadow ${totalVariance < 0
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                  {totalVariance < 0 ? (
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  ) : (
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  )}
                </div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-1 ${totalVariance < 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                  {isMobile ? 'Variance' : 'Cost Variance'}
                </p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${totalVariance < 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                  {isMobile ? formatIndianRupees(totalVariance).replace('₹', '₹ ') : formatIndianRupees(totalVariance)}
                </p>
                <div className={`mt-1 sm:mt-2 text-xs rounded-full px-2 py-1 inline-block ${totalVariance < 0
                  ? 'text-red-600 bg-red-200/50'
                  : 'text-green-600 bg-green-200/50'
                  }`}>
                  {variancePercentage > 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === "yearly" && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-inner mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Year-wise Cost Breakdown
            </h3>

            <div className="space-y-4">
              {yearlyBreakdown.map((item, index) => (
                <div key={item.year} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-8 rounded-lg ${index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Year {item.year}</h4>
                        <p className="text-xs text-gray-500">{item.count} projects</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.variance >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'}`}>
                      {item.variance >= 0 ? '+' : ''}{formatIndianRupees(item.variance)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">Estimated</p>
                      <p className="text-sm font-bold text-blue-800">{formatIndianRupees(item.estimated)}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium">Actual</p>
                      <p className="text-sm font-bold text-purple-800">{formatIndianRupees(item.actual)}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-500">Variance %</p>
                      <p className={`text-sm font-bold ${item.variancePercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "type" && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-inner mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Project Type-wise Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {typeBreakdown.map((item, index) => (
                <div key={item.type} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(item.type, index)}`}>
                        <span className="text-white font-bold text-sm">{item.type.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{item.type}</h4>
                        <p className="text-xs text-gray-500">{item.count} projects</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.variance >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'}`}>
                      {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Estimated</span>
                      <span className="text-sm font-semibold text-blue-700">{formatIndianRupees(item.estimated)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Actual</span>
                      <span className="text-sm font-semibold text-purple-700">{formatIndianRupees(item.actual)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Variance</span>
                      <span className={`text-sm font-semibold ${item.variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatIndianRupees(item.variance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Project List */}
        {showDetailedView && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-inner mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details ({filteredProjects.length})</h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project, index) => {
                    const variance = parseCurrency(project.Cost_Variance);
                    const variancePercent = parseCurrency(project.CM_Estimated_Cost) > 0
                      ? (variance / parseCurrency(project.CM_Estimated_Cost)) * 100
                      : 0;

                    return (
                      <tr key={project.CM_Project_ID} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.CM_Project_Name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{project.CM_Project_Type || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {project.CM_Planned_Start_Date
                            ? new Date(project.CM_Planned_Start_Date).getFullYear()
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatIndianRupees(parseCurrency(project.CM_Estimated_Cost))}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatIndianRupees(parseCurrency(project.Actual_Cost))}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatIndianRupees(variance)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${variance >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'}`}>
                            {variance >= 0 ? 'Under Budget' : 'Over Budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}