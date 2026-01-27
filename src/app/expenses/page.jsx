"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Download, Filter, Search, TrendingUp, TrendingDown, BarChart3, ChevronDown, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from '../components/Navbar';

export default function ProjectCostReport() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectType, setSelectedProjectType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Selection state
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // Set currency to Indian Rupees
  const currencyCode = 'INR';
  const locale = 'en-IN';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/budget-expense");
        if (!res.ok) throw new Error("Failed to fetch project cost report");
        const data = await res.json();
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Calculate project type counts
  const projectTypeCounts = React.useMemo(() => {
    const counts = {
      total: projects.length,
      'Web Development': projects.filter(p => p.CM_Project_Type === 'Web Development').length,
      'Mobile Application': projects.filter(p => p.CM_Project_Type === 'Mobile Application').length,
      'Other': 0
    };

    // Add any other project types dynamically
    projects.forEach(project => {
      if (project.CM_Project_Type && !['Web Development', 'Mobile Application'].includes(project.CM_Project_Type)) {
        counts['Other'] = (counts['Other'] || 0) + 1;
        counts[project.CM_Project_Type] = (counts[project.CM_Project_Type] || 0) + 1;
      }
    });

    return counts;
  }, [projects]);

  // Filter projects by project type and search
  useEffect(() => {
    let filtered = projects;

    // Filter by project type
    if (selectedProjectType === 'Other') {
      filtered = filtered.filter(project =>
        project.CM_Project_Type && !['Web Development', 'Mobile Application', 'Web Application'].includes(project.CM_Project_Type)
      );
    } else if (selectedProjectType !== "all") {
      filtered = filtered.filter(project =>
        project.CM_Project_Type === selectedProjectType
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.CM_Project_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.CM_Project_Code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);

    // Reset selection when filters change
    setSelectedProjects(new Set());
    setSelectAll(false);
  }, [selectedProjectType, searchTerm, projects]);

  // Sort functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = React.useMemo(() => {
    if (!sortConfig.key) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredProjects, sortConfig]);

  // Selection handlers
  const toggleProjectSelection = (projectId) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
    setSelectionMode(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProjects(new Set());
      setSelectAll(false);
      setSelectionMode(false);
    } else {
      const allIds = new Set(sortedProjects.map(p => p.CM_Project_ID));
      setSelectedProjects(allIds);
      setSelectAll(true);
      setSelectionMode(true);
    }
  };

  const clearSelection = () => {
    setSelectedProjects(new Set());
    setSelectAll(false);
    setSelectionMode(false);
  };

  const handleProjectClick = (projectId, event) => {
    // Only navigate if not in selection mode and click wasn't on checkbox
    if (!selectionMode && !event?.target.closest('.selection-checkbox')) {
      router.push(`/projectlinking/${projectId}`);
    }
  };

  const formatIndianRupees = (value) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  // Get selected projects data
  const getSelectedProjectsData = () => {
    if (selectedProjects.size === 0) return filteredProjects;
    return filteredProjects.filter(p => selectedProjects.has(p.CM_Project_ID));
  };

  // Helper to get summary totals
  const getProjectSummary = (projects) => {
    const totalEstimated = projects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
    const totalActual = projects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
    const totalVariance = projects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const budgetStatus = `${projects.filter(p => p.Actual_Cost <= p.CM_Estimated_Cost).length}/${projects.length}`;

    return { totalEstimated, totalActual, totalVariance, budgetStatus };
  };

  const exportToExcel = async (selectedOnly = false) => {
    const XLSX = await import("xlsx");
    const dataToExport = selectedOnly ? getSelectedProjectsData() : filteredProjects;

    const summary = getProjectSummary(dataToExport);

    const wsData = [
      ["Summary", "", "", "", "", "", "", ""],
      ["Total Estimated", "", "", summary.totalEstimated, "", "", "", ""],
      ["Total Actual", "", "", summary.totalActual, "", "", "", ""],
      ["Total Variance", "", "", summary.totalVariance, "", "", "", ""],
      ["Budget Status", "", "", summary.budgetStatus, "", "", "", ""],
      [],
      ["Project Type", "Project Code", "Name", "Estimated Cost", "Material Cost", "Labor Cost", "Transport Cost", "Actual Cost", "Variance"],
      ...dataToExport.map(p => [
        p.CM_Project_Type || "N/A",
        p.CM_Project_Code,
        p.CM_Project_Name,
        parseCurrency(p.CM_Estimated_Cost),
        parseCurrency(p.Total_Material_Cost),
        parseCurrency(p.Total_Labor_Cost),
        parseCurrency(p.Total_Transport_Cost),
        parseCurrency(p.Actual_Cost),
        parseCurrency(p.Cost_Variance)
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Project Cost");

    const fileName = selectedOnly
      ? `selected-projects-cost-report.xlsx`
      : `project-cost-report.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = async (selectedOnly = false) => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const dataToExport = selectedOnly ? getSelectedProjectsData() : filteredProjects;

    // Parse Currency
    const parseCurrencyInline = (value) =>
      !value
        ? 0
        : typeof value === "string"
          ? Number(value.replace(/[^0-9.-]+/g, "")) || 0
          : Number(value) || 0;

    // Summary Calculations
    const totalEstimated = dataToExport.reduce(
      (sum, p) => sum + parseCurrencyInline(p.CM_Estimated_Cost), 0
    );
    const totalActual = dataToExport.reduce(
      (sum, p) => sum + parseCurrencyInline(p.Actual_Cost), 0
    );

    const totalVariance = totalEstimated - totalActual;
    const budgetStatus = `${dataToExport.filter(
      (p) => parseCurrencyInline(p.Actual_Cost) <= parseCurrencyInline(p.CM_Estimated_Cost)
    ).length}/${dataToExport.length}`;

    const doc = new jsPDF();

    // --------------------------------------------------------
    // ⭐ COMPANY HEADER SECTION
    // --------------------------------------------------------
    const logo = new Image();
    logo.src = "/saranlogo.png"; // <-- Change path if needed

    // Add Logo
    doc.addImage(logo, "PNG", 14, 10, 20, 20); // (x, y, width, height)

    // Company Name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Saran Solar Pvt Ltd", 40, 15);

    // Address
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("131/2, Main Road,", 40, 23);
    doc.text("Kullampalayam,Gobichettipalayam – 638476, Tamil Nadu, India", 40, 29);
    doc.text("Email: info@saransolar.com", 40, 35);

    // Decorative Line (brand look)
    doc.setDrawColor(70, 130, 180);
    doc.setLineWidth(0.8);
    doc.line(15, 42, 195, 42);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(selectedOnly ? "Selected Projects Cost Report" : "Project Cost Report", 14, 48);

    // --------------------------------------------------------
    // ⭐ SUMMARY TABLE
    // --------------------------------------------------------
    autoTable(doc, {
      startY: 54,
      head: [["Metric", "Amount (INR)"]],
      body: [
        ["Total Estimated Cost", totalEstimated.toLocaleString("en-IN")],
        ["Total Actual Cost", totalActual.toLocaleString("en-IN")],
        ["Total Variance", totalVariance.toLocaleString("en-IN")],
        ["Budget Status", budgetStatus],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 102, 204] },
    });

    // --------------------------------------------------------
    // ⭐ PROJECT TABLE
    // --------------------------------------------------------
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Project Type", "Code", "Name", "Est.", "Material", "Labor", "Transport", "Actual", "Var."]],
      body: dataToExport.map((p) => {
        const est = parseCurrencyInline(p.CM_Estimated_Cost);
        const actual = parseCurrencyInline(p.Actual_Cost);
        const variance = est - actual;

        return [
          p.CM_Project_Type || "N/A",
          p.CM_Project_Code,
          p.CM_Project_Name,
          est.toLocaleString("en-IN"),
          parseCurrencyInline(p.Total_Material_Cost).toLocaleString("en-IN"),
          parseCurrencyInline(p.Total_Labor_Cost).toLocaleString("en-IN"),
          parseCurrencyInline(p.Total_Transport_Cost).toLocaleString("en-IN"),
          actual.toLocaleString("en-IN"),
          variance.toLocaleString("en-IN"),
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 102, 204] },
    });

    // Save
    const fileName = selectedOnly
      ? `selected-projects-cost-report.pdf`
      : `project-cost-report.pdf`;

    doc.save(fileName);
  };


  function parseCurrency(value) {
    if (typeof value === 'string') {
      return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    return Number(value) || 0;
  }

  // Calculate totals based on filtered projects
  const totalEstimatedCost = filteredProjects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
  const totalActualCost = filteredProjects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
  const totalVariance = filteredProjects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);

  // Calculate statistics for selected projects
  const selectedProjectsData = getSelectedProjectsData();
  const selectedEstimatedCost = selectedProjectsData.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
  const selectedActualCost = selectedProjectsData.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
  const selectedVariance = selectedProjectsData.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);

  // Calculate statistics
  const onBudgetProjects = filteredProjects.filter(p => p.Cost_Variance >= 0).length;
  const overBudgetProjects = filteredProjects.filter(p => p.Cost_Variance < 0).length;

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="opacity-0 group-hover:opacity-50 transition-opacity">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

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
      <div className="flex items-center justify-center h-screen ">
        <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-lg sm:text-xl">!</span>
            </div>
            <p className="text-red-600 text-center font-medium text-sm sm:text-base">Error: {error}</p>
            <button
              className="mt-4 sm:mt-6 w-full px-3 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 w-full">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-w-[1800px] mx-auto">

          {/* Header section */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            {/* Title and Controls Row - Responsive */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              {/* Title Section */}
              <div className="flex-shrink-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 lg:gap-3">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                  Project Expenses
                </h2>
              </div>

              {/* Combined Search and Controls Section */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Combined Search and Filter Group */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Project Type Filter - Now inline with search */}
                  <div className="relative inline-block text-left w-full sm:w-auto">
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className="inline-flex justify-between items-center w-full px-4 py-2.5 bg-white border border-blue-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        id="filter-menu-button"
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate hidden sm:inline">
                            {selectedProjectType === 'all'
                              ? `All (${projectTypeCounts.total})`
                              : selectedProjectType === 'Web Application'
                                ? `Web App (${projectTypeCounts['Web Application'] || 0})`
                                : selectedProjectType === 'Mobile Application'
                                  ? `Mobile App (${projectTypeCounts['Mobile Application'] || 0})`
                                  : selectedProjectType === 'Web Development'
                                    ? `Web Dev (${projectTypeCounts['Web Development'] || 0})`
                                    : `Others (${projectTypeCounts['Others'] || 0})`
                            }
                          </span>
                          <span className="text-sm font-medium text-gray-700 truncate sm:hidden">
                            Filter
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''} flex-shrink-0`} />
                      </button>
                    </div>

                    {/* Filter Dropdown Menu */}
                    {showFilterMenu && ( 
                      <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg ring-1  focus:outline-none animate-in fade-in-0 zoom-in-95">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="filter-menu-button">
                          {[
                            { key: 'all', label: `All Projects`, icon: '📊', count: projectTypeCounts.total },
                            { key: 'Web Application', label: `Web Application`, icon: '🌐', count: projectTypeCounts['Web Application'] || 0 },
                            { key: 'Mobile Application', label: `Mobile Application`, icon: '📱', count: projectTypeCounts['Mobile Application'] || 0 },
                            { key: 'Web Development', label: `Web Development`, icon: '💻', count: projectTypeCounts['Web Development'] || 0 },
                            { key: 'Others', label: `Others`, icon: '📁', count: projectTypeCounts['Others'] || 0 }
                          ].map(({ key, label, icon, count }) => (
                            <button
                              key={key}
                              onClick={() => {
                                setSelectedProjectType(key);
                                setShowFilterMenu(false);
                              }}
                              className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-all duration-150 ${selectedProjectType === key
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              role="menuitem"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base">{icon}</span>
                                <span className="font-medium">{label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProjectType === key
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {count}
                                </span>
                                {selectedProjectType === key && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Box */}
                  <div className="relative flex-grow sm:flex-grow-0 sm:w-48 lg:w-56">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 sm:pl-10 pr-10 py-3 sm:py-2 text-sm sm:text-base border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Download Dropdown */}
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden xs:inline">Download</span>
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 origin-top-right bg-white rounded-xl shadow-lg ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                      <div className="p-2">
                        {/* Excel Download */}
                        <button
                          onClick={() => { setShowMenu(false); exportToExcel(selectedProjects.size > 0); }}
                          className="flex items-center w-full px-3 py-2 sm:py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group mb-1"
                        >
                          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-green-200 transition-colors">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-xs sm:text-sm">Download Excel</div>
                            <div className="text-xs text-gray-500">{selectedProjects.size > 0 ? `${selectedProjects.size} selected` : `${filteredProjects.length} all`}</div>
                          </div>
                        </button>

                        {/* PDF Download */}
                        <button
                          onClick={() => { setShowMenu(false); exportToPDF(selectedProjects.size > 0); }}
                          className="flex items-center w-full px-3 py-2 sm:py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group"
                        >
                          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-red-200 transition-colors">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-xs sm:text-sm">Download PDF</div>
                            <div className="text-xs text-gray-500">{selectedProjects.size > 0 ? `${selectedProjects.size} selected` : `${filteredProjects.length} all`}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Cards Grid - Responsive */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  title: selectionMode ? 'Selected Est. Cost' : 'Estimated Cost',
                  value: selectionMode ? selectedEstimatedCost : totalEstimatedCost,
                  icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />,
                  subText: selectionMode ? `${selectedProjects.size} selected` : selectedProjectType === 'all' ? 'All Project Types' : selectedProjectType,
                  bgColor: 'bg-blue-100',
                  textColor: 'text-blue-600'
                },
                {
                  title: selectionMode ? 'Selected Actual Cost' : 'Actual Cost',
                  value: selectionMode ? selectedActualCost : totalActualCost,
                  icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />,
                  subText: selectionMode ? `${selectedProjects.size} selected` : `${filteredProjects.length} projects`,
                  bgColor: 'bg-purple-100',
                  textColor: 'text-purple-600'
                },
                {
                  title: selectionMode ? 'Selected Variance' : 'Cost Variance',
                  value: selectionMode ? selectedVariance : totalVariance,
                  icon: (selectionMode ? selectedVariance : totalVariance) < 0
                    ? <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    : <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />,
                  subText: (selectionMode ? selectedVariance : totalVariance) < 0 ? 'Over Budget' : 'Under Budget',
                  bgColor: (selectionMode ? selectedVariance : totalVariance) < 0 ? 'bg-red-100' : 'bg-green-100',
                  textColor: (selectionMode ? selectedVariance : totalVariance) < 0 ? 'text-red-600' : 'text-green-600',
                  valueColor: (selectionMode ? selectedVariance : totalVariance) < 0 ? 'text-red-900' : 'text-green-900',
                  borderColor: (selectionMode ? selectedVariance : totalVariance) < 0 ? 'border-red-200' : 'border-green-200'
                },
                {
                  title: selectionMode ? 'Selection Status' : 'Budget Status',
                  value: selectionMode ? `${selectedProjects.size}/${filteredProjects.length}` : `${onBudgetProjects}/${filteredProjects.length}`,
                  icon: <span className="text-gray-600 font-bold text-xs sm:text-sm">
                    {selectionMode
                      ? Math.round((selectedProjects.size / filteredProjects.length) * 100)
                      : (filteredProjects.length > 0 ? Math.round((onBudgetProjects / filteredProjects.length) * 100) : 0)
                    }%
                  </span>,
                  subText: selectionMode ? 'projects selected' : `${overBudgetProjects} projects over budget`,
                  bgColor: 'bg-gray-100',
                  textColor: 'text-gray-600'
                }
              ].map((card, index) => (
                <div
                  key={index}
                  className={`bg-white p-3 sm:p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${card.borderColor ? card.borderColor : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{card.title}</p>
                      <p className={`text-lg sm:text-xl font-bold truncate ${card.valueColor || 'text-gray-900'}`}>
                        {typeof card.value === 'number' ? formatIndianRupees(card.value) : card.value}
                      </p>
                    </div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${card.bgColor}`}>
                      {card.icon}
                    </div>
                  </div>
                  <p className={`text-xs ${card.textColor} mt-2 font-medium truncate`}>{card.subText}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile View: Card Layout (0px - 767px) */}
          <div className="block lg:hidden">
            <div className="p-2 sm:p-4 space-y-3">
              {sortedProjects.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg font-medium">No projects found</p>
                  <p className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm">
                    {searchTerm || selectedProjectType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No projects available'
                    }
                  </p>
                </div>
              ) : (
                sortedProjects.map(project => (
                  <div
                    key={project.CM_Project_ID}
                    className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer relative"
                    onClick={(e) => handleProjectClick(project.CM_Project_ID, e)}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectSelection(project.CM_Project_ID);
                        }}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${selectedProjects.has(project.CM_Project_ID)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                          }`}
                      >
                        {selectedProjects.has(project.CM_Project_ID) && (
                          <Check className="w-2 h-2 sm:w-3 sm:h-3" />
                        )}
                      </button>
                    </div>

                    {/* Project info with name and code in same column */}
                    <div className="mb-3 pr-8 sm:pr-10">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate mb-1">
                        {project.CM_Project_Name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">
                          {project.CM_Project_Code}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.CM_Project_Type === 'Web Development'
                          ? 'bg-blue-100 text-blue-800'
                          : project.CM_Project_Type === 'Mobile Application'
                            ? 'bg-purple-100 text-purple-800'
                            : project.CM_Project_Type === 'Web Application'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {project.CM_Project_Type === 'Web Development' ? 'WD' :
                            project.CM_Project_Type === 'Mobile Application' ? 'MA' :
                              project.CM_Project_Type === 'Web Application' ? 'WA' :
                                'OT'}
                        </span>
                      </div>
                    </div>

                    {/* Cost data in compact grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Estimated</p>
                        <p className="font-semibold text-gray-900 truncate">{formatIndianRupees(project.CM_Estimated_Cost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Actual</p>
                        <p className="font-semibold text-gray-900 truncate">{formatIndianRupees(project.Actual_Cost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Variance</p>
                        <p className={`font-semibold truncate ${project.Cost_Variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {project.Cost_Variance < 0 ? '▼ ' : '▲ '}
                          {formatIndianRupees(project.Cost_Variance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Status</p>
                        <p className="font-medium text-gray-700 truncate">
                          {project.Cost_Variance < 0 ? 'Over Budget' : 'On Budget'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tablet View: Compact Table (768px - 1023px) */}
          <div className="hidden lg:block xl:hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-10 px-3 py-3">
                      <button
                        onClick={toggleSelectAll}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mx-auto ${selectAll
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                          }`}
                      >
                        {selectAll && <Check className="w-2 h-2" />}
                      </button>
                    </th>
                    {[
                      { key: 'project_info', label: 'Project Info', width: 'w-[35%]' },
                      { key: 'CM_Project_Type', label: 'Type', width: 'w-[10%]' },
                      { key: 'CM_Estimated_Cost', label: 'Estimated', align: 'right', width: 'w-[15%]' },
                      { key: 'Actual_Cost', label: 'Actual', align: 'right', width: 'w-[15%]' },
                      { key: 'Cost_Variance', label: 'Variance', align: 'right', width: 'w-[15%]' },
                      { key: 'details', label: 'Details', align: 'center', width: 'w-[10%]' }
                    ].map(({ key, label, align = 'left', width }) => (
                      <th
                        key={key}
                        scope="col"
                        className={`px-3 py-3 text-${align} text-xs font-bold text-gray-900 tracking-wider ${width}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProjects.map((project, index) => (
                    <tr
                      key={project.CM_Project_ID}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${selectedProjects.has(project.CM_Project_ID) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                      onClick={(e) => handleProjectClick(project.CM_Project_ID, e)}
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectSelection(project.CM_Project_ID);
                          }}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedProjects.has(project.CM_Project_ID)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                            }`}
                        >
                          {selectedProjects.has(project.CM_Project_ID) && (
                            <Check className="w-2 h-2" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{project.CM_Project_Name}</div>
                          <div className="text-xs text-gray-500 font-mono truncate mt-1">{project.CM_Project_Code}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${project.CM_Project_Type === 'Web Development'
                          ? 'bg-blue-100 text-blue-800'
                          : project.CM_Project_Type === 'Mobile Application'
                            ? 'bg-purple-100 text-purple-800'
                            : project.CM_Project_Type === 'Web Application'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {project.CM_Project_Type === 'Web Development' ? 'WD' :
                            project.CM_Project_Type === 'Mobile Application' ? 'MA' :
                              project.CM_Project_Type === 'Web Application' ? 'WA' :
                                'OT'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">
                        {formatIndianRupees(project.CM_Estimated_Cost)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        {formatIndianRupees(project.Actual_Cost)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${project.Cost_Variance < 0
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                          }`}>
                          {project.Cost_Variance < 0 ? '▼ ' : '▲ '}
                          {formatIndianRupees(project.Cost_Variance)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(project.CM_Project_ID, e);
                          }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desktop View: Full Table Layout (1024px and above) */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-4 py-4">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mx-auto ${selectAll
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 hover:border-blue-500'
                        }`}
                    >
                      {selectAll && <Check className="w-3 h-3" />}
                    </button>
                  </th>
                  {[
                    { key: 'project_info', label: 'Project Name', sortable: false, width: 'w-[25%]' },
                    { key: 'CM_Project_Type', label: 'Project Type', sortable: true, width: 'w-[15%]' },
                    { key: 'CM_Estimated_Cost', label: 'Estimated Cost', sortable: true, align: 'right', width: 'w-[12%]' },
                    // { key: 'Total_Material_Cost', label: 'Material Cost', sortable: true, align: 'right', width: 'w-[12%]' },
                    { key: 'Total_Labor_Cost', label: 'Labor Cost', sortable: true, align: 'right', width: 'w-[12%]' },
                    { key: 'Total_Transport_Cost', label: 'Transport Cost', sortable: true, align: 'right', width: 'w-[12%]' },
                    { key: 'Actual_Cost', label: 'Actual Cost', sortable: true, align: 'right', width: 'w-[12%]' },
                    { key: 'Cost_Variance', label: 'Variance', sortable: true, align: 'right', width: 'w-[12%]' }
                  ].map(({ key, label, sortable, align = 'left', width }) => (
                    <th
                      key={key}
                      scope="col"
                      className={`px-4 py-4 text-${align} text-sm font-bold text-gray-900 tracking-wider group cursor-pointer transition-colors ${width} ${sortable ? 'hover:bg-gray-100' : ''
                        }`}
                      onClick={() => sortable && handleSort(key)}
                    >
                      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} gap-2`}>
                        {label}
                        {sortable && <SortIcon columnKey={key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProjects.map((project, index) => (
                  <tr
                    key={project.CM_Project_ID}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${selectedProjects.has(project.CM_Project_ID) ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                    onClick={(e) => handleProjectClick(project.CM_Project_ID, e)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectSelection(project.CM_Project_ID);
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedProjects.has(project.CM_Project_ID)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                          }`}
                      >
                        {selectedProjects.has(project.CM_Project_ID) && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                          {project.CM_Project_Name}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          {project.CM_Project_Code}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${project.CM_Project_Type === 'Web Development'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : project.CM_Project_Type === 'Mobile Application'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : project.CM_Project_Type === 'Web Application'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                        {project.CM_Project_Type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">
                      {formatIndianRupees(project.CM_Estimated_Cost)}
                    </td>
                    {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatIndianRupees(project.Total_Material_Cost)}
                    </td> */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatIndianRupees(project.Total_Labor_Cost)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatIndianRupees(project.Total_Transport_Cost)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      {formatIndianRupees(project.Actual_Cost)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${project.Cost_Variance < 0
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-green-100 text-green-800 border border-green-200"
                        }`}>
                        {project.Cost_Variance < 0 ? '▼ ' : '▲ '}
                        {formatIndianRupees(project.Cost_Variance)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedProjects.length === 0 && (
            <div className="text-center py-12 hidden lg:block">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No projects found</p>
              <p className="text-gray-400 mt-2 text-base">
                {searchTerm || selectedProjectType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No projects available'
                }
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-3 sm:px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs sm:text-sm">
                  {selectionMode ? (
                    <>
                      <strong>{selectedProjects.size}</strong> of <strong>{filteredProjects.length}</strong> projects selected
                    </>
                  ) : (
                    <>
                      Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
                    </>
                  )}
                </span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectionMode && (
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}