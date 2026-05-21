"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';

const SalaryDashboard = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [filters, setFilters] = useState({
    month: String(new Date().getMonth() + 1),
    year: new Date().getFullYear().toString()
  });
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const currentMonth = new Date().getMonth() + 1;


  // Enhanced filtered employees with proper search and filter functionality
  const filteredEmployees = useMemo(() => {
    if (!salaryData?.employees) return [];

    return salaryData.employees.filter((emp) => {
      // Early return if no employees
      if (!emp) return false;

      // Search functionality - search in multiple fields
      const search = searchTerm.toLowerCase().trim();

      // If search term exists, check all relevant fields
      let matchesSearch = true;
      if (search) {
        const laborName = (emp?.laborName || "").toLowerCase();
        const phoneNumber = (emp?.CM_Phone_Number || "").toLowerCase();
        const laborCode = (emp?.CM_Labor_Code || "").toLowerCase();
        const laborType = (emp?.CM_Labor_Type || "").toLowerCase();
        const wageType = (emp?.CM_Wage_Type || "").toLowerCase();

        matchesSearch =
          laborName.includes(search) ||
          phoneNumber.includes(search) ||
          laborCode.includes(search) ||
          laborType.includes(search) ||
          wageType.includes(search) ||
          `${laborName} `.includes(search);
      }

      // Type filter
      const matchesType = typeFilter === "All" || emp?.CM_Labor_Type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === "All" || emp?.CM_Status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [salaryData?.employees, searchTerm, typeFilter, statusFilter]);
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate years (last 5 years and next 1 year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => (currentYear - 1 + i).toString());

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Labor types for filter
  const laborTypes = [
    "All",
    "Labor",
    "Temporary",
    "Permanent",
    "Contract",
    "Office"
  ];

  const statusTypes = [
    "All",
    "Active",
    "Inactive"
  ];

  useEffect(() => {
    fetchSalaryData();
  }, [filters.month, filters.year]);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const response = await fetch(`/api/salary-report?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch salary data');
      }

      const data = await response.json();
      setSalaryData(data);
      setSelectedEmployees(new Set()); // Reset selections when data changes
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const plainCurrency = (amount) => {
    if (!amount && amount !== 0) return 0;
    return Number(amount);
  };

  const getWageTypeLabel = (wageType) => {
    if (!wageType) return '—';

    const wageTypes = {
      'PerDay': 'Daily',
      'PerHour': 'Hourly',
      'PerMonth': 'Monthly'
    };
    return wageTypes[wageType] || wageType;
  };

  const getFilterDisplayText = () => {
    if (!filters.month && !filters.year) return 'All Time';

    const monthName = months.find(m => m.value === filters.month)?.label;

    if (filters.month && filters.year) {
      return `${monthName} ${filters.year}`;
    } else if (filters.year) {
      return `Year ${filters.year}`;
    } else if (filters.month) {
      return `${monthName} ${currentYear}`;
    }

    return 'All Time';
  };

  // Employee selection handlers
  const toggleEmployeeSelection = (employeeId) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedEmployees(newSelection);
  };

  const selectAllEmployees = () => {
    if (filteredEmployees.length > 0) {
      const allIds = filteredEmployees.map(emp => emp.laborId);
      setSelectedEmployees(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedEmployees(new Set());
  };

  // Handle incentive button click - FIXED VERSION
  const handleIncentiveClick = (laborId, laborName, incentiveId = null) => {
    console.log("Incentive click:", { laborId, laborName, incentiveId }); // Debug log

    router.push(
      `/salary-report/add-incentive/${laborId}?name=${encodeURIComponent(laborName)}${incentiveId ? `&incentiveId=${incentiveId}` : ""
      }`
    );
  };

  // Clear search and filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("All");
    setStatusFilter("All");
    setFilters({ month: String(new Date().getMonth() + 1), year: currentYear.toString() });
  };

  // Check if any filter is active
  const isAnyFilterActive = searchTerm || typeFilter !== "All" || statusFilter !== "All" || filters.month || filters.year !== currentYear.toString();

  // --------------------- EXCEL EXPORT ---------------------
  const exportToExcel = () => {
    try {
      const employeesToExport = selectedEmployees.size > 0
        ? salaryData.employees.filter(emp => selectedEmployees.has(emp.laborId))
        : filteredEmployees;

      if (!employeesToExport || employeesToExport.length === 0) {
        toast.error('No data to export');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Calculate totals
      const totalSalary = employeesToExport.reduce((sum, emp) => sum + Number(emp.totalSalary || 0), 0);
      const totalBaseSalary = employeesToExport.reduce((sum, emp) => sum + Number(emp.baseSalary || 0), 0);
      const totalIncentives = employeesToExport.reduce((sum, emp) => sum + Number(emp.incentiveAmount || 0), 0);
      const totalPresentDays = employeesToExport.reduce((sum, emp) => sum + Number(emp.totalPresentDays || 0), 0);

      // Prepare Excel data
      const excelData = [
        ['SALARY REPORT', '', '', '', '', '', '', ''],
        ['Period:', getFilterDisplayText()],
        ['Generated Date:', new Date().toLocaleDateString()],
        ['Total Employees:', employeesToExport.length],
        ['Total Base Salary:', totalBaseSalary],
        ['Total Incentives:', totalIncentives],
        ['Total Salary:', totalSalary],
        [''],
        ['EMPLOYEE SALARY DETAILS'],
        ['Employee Code', 'Employee Name', 'Wage Type', 'Wage Rate', 'Present Days', 'Base Salary', 'Incentives', 'Total Salary']
      ];

      employeesToExport.forEach(emp => {
        excelData.push([
          emp.CM_Labor_Code || 'N/A',
          emp.laborName || 'Unknown Employee',
          getWageTypeLabel(emp.CM_Wage_Type),
          Number(emp.CM_Wage_Amount || 0),
          Number(emp.totalPresentDays || 0),
          Number(emp.baseSalary || 0),
          Number(emp.incentiveAmount || 0),
          Number(emp.totalSalary || 0)
        ]);
      });

      // Add summary
      excelData.push(['']);
      excelData.push(['SUMMARY']);
      excelData.push(['Total Employees:', employeesToExport.length]);
      excelData.push(['Total Present Days:', totalPresentDays]);
      excelData.push(['Total Base Salary:', totalBaseSalary]);
      excelData.push(['Total Incentives:', totalIncentives]);
      excelData.push(['Total Salary Amount:', totalSalary]);

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');

      const periodText = filters.month && filters.year
        ? `${months.find(m => m.value === filters.month)?.label}_${filters.year}`
        : filters.year ? `Year_${filters.year}` : 'All_Time';
      const selectionText = selectedEmployees.size > 0 ? 'Selected' : 'All';
      const fileName = `Salary_Report_${selectionText}_${periodText}_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success(`Excel report downloaded successfully! ${employeesToExport.length} employees included.`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to download Excel report');
    }
  };

  // --------------------- PDF EXPORT ---------------------
  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const employeesToExport = selectedEmployees.size > 0
        ? salaryData.employees.filter(emp => selectedEmployees.has(emp.laborId))
        : filteredEmployees;

      if (!employeesToExport || employeesToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // ---- NUMBER CLEANER ----
      const toNumber = (value) =>
        Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;

      // ------------------------ HEADER ------------------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SALARY REPORT", 40, 50);

      doc.setLineWidth(0.8);
      doc.setDrawColor(180, 180, 180);
      doc.line(40, 60, pageWidth - 40, 60);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Period        : ${getFilterDisplayText()}`, 40, 80);
      doc.text(`Generated  : ${currentDate}  ${currentTime}`, 40, 95);
      doc.text(
        `Report Type : ${selectedEmployees.size > 0 ? "Selected Employees" : "All Employees"}`,
        40,
        110
      );

      doc.text(`Employees  : ${employeesToExport.length}`, 40, 125);

      // ------------------------ SUMMARY BOX ------------------------
      const totalPresentDays = employeesToExport.reduce(
        (sum, emp) => sum + toNumber(emp.totalPresentDays),
        0
      );
      const totalBaseSalary = employeesToExport.reduce(
        (sum, emp) => sum + toNumber(emp.baseSalary),
        0
      );
      const totalIncentives = employeesToExport.reduce(
        (sum, emp) => sum + toNumber(emp.incentiveAmount),
        0
      );
      const totalSalary = employeesToExport.reduce(
        (sum, emp) => sum + toNumber(emp.totalSalary),
        0
      );

      // Summary container box
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.6);
      doc.roundedRect(40, 145, pageWidth - 80, 90, 6, 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("SUMMARY", 50, 165);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Total Present Days: ${totalPresentDays}`, 50, 185);
      doc.text(`• Total Base Salary: ${totalBaseSalary.toLocaleString("en-IN")}`, 50, 205);
      doc.text(`• Total Incentives: ${totalIncentives.toLocaleString("en-IN")}`, 50, 225);
      doc.text(`• Total Salary Payout: ${totalSalary.toLocaleString("en-IN")}`, 50, 245);

      // ------------------------ TABLE ------------------------
      const tableData = employeesToExport.map((emp) => [
        emp.CM_Labor_Code || "N/A",
        emp.laborName || "Unknown Employee",
        getWageTypeLabel(emp.CM_Wage_Type),
        toNumber(emp.CM_Wage_Amount).toLocaleString("en-IN"),
        `${toNumber(emp.totalPresentDays)} days`,
        toNumber(emp.baseSalary).toLocaleString("en-IN"),
        toNumber(emp.incentiveAmount).toLocaleString("en-IN"),
        toNumber(emp.totalSalary).toLocaleString("en-IN"),
      ]);

      autoTable(doc, {
        startY: 265,
        head: [
          [
            "Employee Code",
            "Employee Name",
            "Wage Type",
            "Wage Rate",
            "Present Days",
            "Base Salary",
            "Incentives",
            "Total Salary",
          ],
        ],
        body: tableData,

        styles: {
          fontSize: 8,
          cellPadding: 5,
          textColor: [40, 40, 40],
        },

        headStyles: {
          fillColor: [50, 60, 150],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },

        bodyStyles: {
          halign: "left",
        },

        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },

        margin: { left: 40, right: 40 },
        theme: "grid",
      });

      // ------------------------ FOOTER ------------------------
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.setTextColor(130, 130, 130);

        doc.text(
          `Salary Management System • Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 15,
          { align: "center" }
        );
      }

      // ------------------------ SAVE ------------------------
      const periodText =
        filters.month && filters.year
          ? `${months.find((m) => m.value === filters.month)?.label}_${filters.year}`
          : filters.year
            ? `Year_${filters.year}`
            : "All_Time";

      const fileName = `Salary_Report_${periodText}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;

      doc.save(fileName);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to download PDF");
    }
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

  // Error State
  if (error) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen ">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchSalaryData}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <Navbar />

      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Salary Dashboard
              </h1>
              <div className="flex flex-wrap items-center mt-2 gap-2">
                <span className="font-medium text-gray-600 text-xs sm:text-sm">Period:</span>
                <span className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  {getFilterDisplayText()}
                </span>
                {selectedEmployees.size > 0 && (
                  <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {selectedEmployees.size} selected
                  </span>
                )}
                {filteredEmployees.length !== salaryData?.employees?.length && (
                  <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {filteredEmployees.length} of {salaryData?.employees?.length || 0} shown
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="
              inline-flex items-center justify-center
              px-3 py-2 sm:px-4 sm:py-2 
              bg-gradient-to-r from-blue-500 to-blue-600
              border border-blue-600 
              text-white font-medium 
              rounded-lg shadow-sm 
              hover:from-blue-600 hover:to-blue-700 active:bg-blue-800
              focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
              transition-all duration-200
              w-full sm:w-auto mt-2 sm:mt-0
            "
            >
              <svg
                className="w-4 h-4 mr-2 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base">Back</span>
            </button>
          </div>
        </div>

        {/* Filters & Actions Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200  mb-6 sm:mb-8 text-black">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Filters & Export
            </h2>
          </div>

          <div className="p-4 sm:p-5">
            {/* Search & Filters */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="lg:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search by name, code, or type..."
                  className="w-full pl-10 pr-8 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm sm:text-base"
              >
                {laborTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Employee Types" : type}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm sm:text-base"
              >
                {statusTypes.map(status => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Statuses" : status}
                  </option>
                ))}
              </select>

              {isAnyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Month */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  onClick={() => setFilters({ month: String(new Date().getMonth() + 1), year: currentYear.toString() })}
                  className="w-full px-3 sm:px-4 py-2.5 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  Reset Period
                </button>
              </div>

              {/* Download Dropdown */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
                <div className="w-full relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 text-sm font-medium transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  {showMenu && (
                    <div className="absolute mt-2 w-full sm:w-70 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-20 p-2 animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Excel */}
                      <button
                        onClick={() => { setShowMenu(false); exportToExcel(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                          </svg>
                        </div>
                        <div className="font-medium">Download Excel</div>
                      </button>

                      {/* PDF */}
                      <button
                        onClick={() => { setShowMenu(false); exportToPDF(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="font-medium">Download PDF</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {salaryData?.totals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Card 1 – Total Present Days */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors rounded-lg sm:rounded-xl">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Total Present Days</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                    {salaryData.totals.allEmployeesPresentDays || 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Attendance summary for selected period
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            </div>

            {/* Card 2 – Total Employee Count */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 transition-colors rounded-lg sm:rounded-xl">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m4 0v1m0-1a4 4 0 013-3.87M12 7a4 4 0 110-8 4 4 0 010 8z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Total Employees</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                    {filteredEmployees.length || 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Showing {filteredEmployees.length} of {salaryData.employees?.length || 0}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-r from-purple-400 to-pink-500"></div>
            </div>

            {/* Card 3 – Total Incentives */}
            <div className="group relative bg-gradient-to-br from-white to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:from-emerald-200 group-hover:to-emerald-300 transition-colors rounded-lg sm:rounded-xl">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Total Incentives</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                    {formatCurrency(salaryData.totals.allEmployeesIncentives || 0)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Total incentives for this period
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-r from-emerald-400 to-green-500"></div>
            </div>

            {/* Card 4 – Total Salary Payout */}
            <div className="group relative bg-gradient-to-br from-white to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-teal-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-100 to-teal-200 group-hover:from-teal-200 group-hover:to-teal-300 transition-colors rounded-lg sm:rounded-xl">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-emerald-700">Total Salary Payout</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                    {formatCurrency(salaryData.totals.allEmployeesTotalSalary || 0)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                Total wages processed for this period
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-r from-teal-400 to-cyan-500"></div>
            </div>
          </div>
        )}

        {/* Employee Salary Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Employee Salary Details
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-500">
                Showing {filteredEmployees.length} of {salaryData?.employees?.length || 0} employees
              </div>

              {selectedEmployees.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>

          {/* Responsive Scroll Container */}
          <div className="overflow-x-auto -mx-2 sm:mx-0 text-black">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-[10px] sm:text-xs">
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 w-10 sm:w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredEmployees.length > 0 &&
                        selectedEmployees.size === filteredEmployees.length
                      }
                      onChange={(e) => e.target.checked ? selectAllEmployees() : clearSelection()}
                      className="h-4 w-4 text-indigo-600"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[150px] sm:min-w-[200px]">Employee</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[110px]">Type/Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[100px]">Wage Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[90px]">Rate</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[70px]">Present</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[110px]">Base Salary</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[120px]">Incentives</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 min-w-[120px]">Total</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.laborId}
                    className={`hover:bg-gray-50 transition-all duration-150 ${selectedEmployees.has(employee.laborId)
                      ? "bg-indigo-50/40"
                      : ""
                      }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.laborId)}
                        onChange={() => toggleEmployeeSelection(employee.laborId)}
                        className="h-4 w-4 text-indigo-600"
                      />
                    </td>

                    {/* Employee */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                          {employee.laborName?.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[110px] sm:max-w-none">
                            {employee.laborName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            ID: {employee.CM_Labor_Code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & Status */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full
                  ${employee.CM_Labor_Type === "Permanent" && "bg-green-100 text-green-700"}
                  ${employee.CM_Labor_Type === "Contract" && "bg-blue-100 text-blue-700"}
                  ${employee.CM_Labor_Type === "Temporary" && "bg-yellow-100 text-yellow-700"}
                  ${employee.CM_Labor_Type === "Office" && "bg-purple-100 text-purple-700"}
                `}>
                          {employee.CM_Labor_Type}
                        </span>

                        <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full
                  ${employee.CM_Status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"}
                `}>
                          {employee.CM_Status}
                        </span>
                      </div>
                    </td>

                    {/* Wage Type */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] sm:text-xs">
                        {getWageTypeLabel(employee.CM_Wage_Type)}
                      </span>
                    </td>

                    {/* Rate */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{formatCurrency(employee.CM_Wage_Amount)}</div>
                      <div className="text-xs text-gray-500">
                        {employee.CM_Wage_Type === "PerHour" ? "/hr" :
                          employee.CM_Wage_Type === "PerDay" ? "/day" : "/mon"}
                      </div>
                    </td>

                    {/* Present */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {employee.totalPresentDays || 0} days
                    </td>

                    {/* Base Salary */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(employee.baseSalary || 0)}
                    </td>

                    {/* Incentives */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${employee.incentiveAmount > 0 ? "text-green-600" : "text-gray-400"
                            }`}
                        >
                          {employee.incentiveAmount > 0 ?
                            formatCurrency(employee.incentiveAmount) : "—"}
                        </span>

                        <button
                          onClick={() =>
                            handleIncentiveClick(
                              employee.laborId,
                              employee.laborName,
                              employee.incentiveId || null
                            )
                          }
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                      {formatCurrency(employee.totalSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredEmployees.length === 0 && (
            <div className="text-center py-10">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No employees found</h3>
              <p className="text-gray-500 text-sm mb-3">
                {isAnyFilterActive
                  ? "Try adjusting your filters or search criteria."
                  : "No salary records available for the selected period."}
              </p>

              {isAnyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryDashboard;