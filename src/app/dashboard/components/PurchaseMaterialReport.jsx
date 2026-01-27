"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Download,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function PurchaseMaterialReport() {
  const [data, setData] = useState({
    monthlyData: [],
    yearlyTotals: { total_purchase: 0, total_allocated: 0, total_used: 0 },
    projectUsage: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);


  const currencyCode = "INR";
  const locale = "en-IN";

  // Detect mobile devices
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/purchase-material-report?year=${selectedYear}`);
        if (!res.ok) throw new Error("Failed to fetch purchase material report");
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);
  const downloadExcel = async () => {
    const XLSX = await import("xlsx");

    const { yearlyTotals, monthlyData, projectUsage } = data;

    const wb = XLSX.utils.book_new();

    // ---------- YEARLY TOTALS ----------
    const yearlySheetData = [
      ["Year", selectedYear],
      ["Total Purchase", yearlyTotals.total_purchase],
      ["Total Allocated", yearlyTotals.total_allocated],
      ["Total Used", yearlyTotals.total_used],
    ];

    const yearlySheet = XLSX.utils.aoa_to_sheet(yearlySheetData);
    XLSX.utils.book_append_sheet(wb, yearlySheet, "Yearly Summary");

    // ---------- MONTHLY DATA ----------
    const monthlySheet = XLSX.utils.json_to_sheet(
      monthlyData.map((m) => ({
        Month: m.month_name,
        Purchase: m.purchase_amount,
        Allocated: m.allocated_amount,
        Used: m.used_amount,
      }))
    );
    XLSX.utils.book_append_sheet(wb, monthlySheet, "Monthly Summary");

    // ---------- PROJECT USAGE ----------
    const projectSheet = XLSX.utils.json_to_sheet(
      projectUsage.map((p) => ({
        Project: `${p.CM_Project_Name} (${p.CM_Project_Code})`,
        Type: p.CM_Project_Type,
        Customer: p.CM_Customer_Name,
        Material_Cost: p.total_used_cost,
        Products_Used: p.products_used,
      }))
    );
    XLSX.utils.book_append_sheet(wb, projectSheet, "Project Usage");

    XLSX.writeFile(wb, `Material_Report_${selectedYear}.xlsx`);
  };

  const downloadPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const { yearlyTotals, monthlyData, projectUsage } = data;

    const doc = new jsPDF("p", "mm", "a4");

    // ------------------------------
    // COMPANY DETAILS
    // ------------------------------
    const logo = "/saranlogo.png"; // make sure in /public folder
    const companyName = "Saran Solar Private Limited";
    const companyAddress =
      "131/2, Main Road,\nKullampalayam,\nGobichettipalayam – 638476,\nTamil Nadu, India.";

    // Add Logo (top-left)
    doc.addImage(logo, "PNG", 15, 12, 22, 22);

    // Company Name (bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(companyName, 42, 20);

    // Address (multi-line)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(companyAddress, 42, 26);

    // Decorative Header Line
    doc.setDrawColor(80, 120, 180);
    doc.setLineWidth(0.8);
    doc.line(15, 42, 195, 42);

    // ------------------------------
    // REPORT TITLE
    // ------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Material Analytics Report - ${selectedYear}`, 15, 50);

    // ------------------------------
    // YEARLY TOTALS
    // ------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Yearly Summary", 15, 62);

    autoTable(doc, {
      startY: 66,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      bodyStyles: { fontSize: 11 },
      head: [["Metric", "Amount"]],
      body: [
        ["Total Purchase", yearlyTotals.total_purchase.toLocaleString("en-IN")],
        ["Total Allocated", yearlyTotals.total_allocated.toLocaleString("en-IN")],
        ["Total Used", yearlyTotals.total_used.toLocaleString("en-IN")],
      ],
    });

    // ------------------------------
    // MONTHLY DATA
    // ------------------------------
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Summary", 15, doc.lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      theme: "striped",
      headStyles: { fillColor: [0, 102, 204] },
      bodyStyles: { fontSize: 11 },
      head: [["Month", "Purchase", "Allocated", "Used"]],
      body: monthlyData.map((m) => [
        m.month_name,
        m.purchase_amount.toLocaleString("en-IN"),
        m.allocated_amount.toLocaleString("en-IN"),
        m.used_amount.toLocaleString("en-IN"),
      ]),
    });

    // ------------------------------
    // PROJECT USAGE
    // ------------------------------
    doc.setFont("helvetica", "bold");
    doc.text("Project Usage", 15, doc.lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      theme: "striped",
      headStyles: { fillColor: [0, 102, 204] },
      bodyStyles: { fontSize: 11 },
      head: [["Project", "Type", "Customer", "Material Cost", "Products"]],
      body: projectUsage.map((p) => [
        `${p.CM_Project_Name} (${p.CM_Project_Code})`,
        p.CM_Project_Type,
        p.CM_Customer_Name,
        p.total_used_cost.toLocaleString("en-IN"),
        p.products_used,
      ]),
    });

    // ------------------------------
    // FOOTER
    // ------------------------------
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Report generated by Celeris Solutions • info@saransolar.in ",
      15,
      pageHeight - 10
    );

    doc.save(`Material_Report_${selectedYear}.pdf`);
  };

  const formatIndianRupees = (value) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value || 0));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[200px] backdrop-blur-sm">
          <p className="font-bold text-gray-800 mb-3 border-b pb-2">{label} {selectedYear}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600 font-medium">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {formatIndianRupees(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Simplified mobile tooltip
  const MobileTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg shadow-lg min-w-[150px]">
          <p className="text-white font-bold mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatIndianRupees(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
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
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Data Load Failed</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex-1"
              onClick={() => window.location.reload()}
            >
              Retry Loading
            </button>
            <button
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold flex-1"
              onClick={() => setError(null)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );

  const { monthlyData, yearlyTotals, projectUsage } = data;

  // Ensure we have 12 months of data
  const fullYearData = Array.from({ length: 12 }, (_, i) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const existingMonth = monthlyData.find(m => m.month_name === monthNames[i]);

    return existingMonth || {
      month_name: monthNames[i],
      purchase_amount: 0,
      allocated_amount: 0,
      used_amount: 0,
      year: selectedYear
    };
  });

  // Calculate insights for better international presentation
  const allocationRate = yearlyTotals.total_purchase > 0
    ? ((yearlyTotals.total_allocated / yearlyTotals.total_purchase) * 100).toFixed(1)
    : 0;

  const usageEfficiency = yearlyTotals.total_allocated > 0
    ? ((yearlyTotals.total_used / yearlyTotals.total_allocated) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6  min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 ">
            Material Cost Analytics
          </h1>
        </div>

        {/* Device Indicator & Year Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Year Filter */}
          <div className="flex items-center gap-3 bg-white px-2 py-2 rounded-xl shadow-sm border border-gray-200">
            <label htmlFor="year-select" className="text-gray-700 font-medium text-sm sm:text-base">
              Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium text-sm sm:text-base"
            >
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* Responsive Download Dropdown */}
          <div className="relative inline-block text-left">
            <div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-2 ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
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
              <div className="absolute -right-10 mt-2 w-48 sm:w-56 origin-top-right bg-white rounded-xl shadow-lg ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">

        {/* Yearly Purchase Amount */}
        <div className="text-center p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-blue-100 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-sm sm:text-sm text-blue-600 font-bold tracking-wide">
            Yearly Purchase Amount
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-800 mt-2">
            {formatIndianRupees(yearlyTotals?.total_purchase || 0)}
          </p>
          <div className="w-full bg-blue-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        {/* Allocated Material Amount */}
        <div className="text-center p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-purple-100 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-sm sm:text-sm text-purple-600 font-bold tracking-wide">
            Allocated Material Amount
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-purple-800 mt-2">
            {formatIndianRupees(yearlyTotals?.total_allocated || 0)}
          </p>
          <div className="w-full bg-purple-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(allocationRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Used Material Amount */}
        <div className="text-center p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-green-100 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-sm sm:text-sm text-green-600 font-bold tracking-wide">
            Used Material Amount
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-green-800 mt-2">
            {formatIndianRupees(yearlyTotals?.total_used || 0)}
          </p>
          <div className="w-full bg-green-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(usageEfficiency || 0, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Main Chart Section */}
      <div className="space-y-6">
        {/* 12-Month Bar Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="text-center lg:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">12-Month Material Flow Analysis</h2>
              <p className="text-blue-500 text-md font-semibold sm:text-base mt-1">
                Jan-Dec {selectedYear}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Purchase</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Allocated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Used</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fullYearData}
                margin={{
                  top: 20,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 10 : 20,
                  bottom: isMobile ? 5 : 10
                }}
                barGap={isMobile ? 2 : 8}
                barCategoryGap={isMobile ? 8 : 12}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month_name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: isMobile ? 10 : 12,
                    fontWeight: 600
                  }}
                  interval={isMobile ? 1 : 0}
                  padding={{ left: 5, right: 5 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: isMobile ? 10 : 12,
                    fontWeight: 600
                  }}
                  tickFormatter={(value) => {
                    if (value >= 10000000) return `₹${(value / 10000000).toFixed(0)}Cr`; // Crore
                    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;       // Lakh
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;           // Thousand
                    return `₹${value}`;
                  }}
                  width={isMobile ? 40 : 60}
                />
                <Tooltip content={isMobile ? <MobileTooltip /> : <CustomTooltip />} />
                {!isMobile && (
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-sm font-semibold text-gray-700">{value}</span>
                    )}
                  />
                )}
                <Bar
                  dataKey="purchase_amount"
                  name="Purchase Amount"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-90 transition-opacity"
                />
                <Bar
                  dataKey="allocated_amount"
                  name="Allocated Amount"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-90 transition-opacity"
                />
                <Bar
                  dataKey="used_amount"
                  name="Used Amount"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-90 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Usage Section */}
        {projectUsage.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Project Material Usage - {selectedYear}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Project
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Project Type
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Customer Name
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-right text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Material Cost
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-right text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Products Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectUsage.map((project, index) => (
                    <tr
                      key={index}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors duration-150`}
                    >
                      <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-800 border-b border-gray-200 font-medium">
                        {project.CM_Project_Name}
                        <span className="text-gray-500 text-[11px] ml-1">
                          {project.CM_Project_Code}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-800 border-b border-gray-200 font-medium">
                        {project.CM_Project_Type}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-800 border-b border-gray-200 font-medium">
                        {project.CM_Customer_Name}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-right text-gray-800 border-b border-gray-200">
                        {formatIndianRupees(project.total_used_cost)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-right text-gray-800 border-b border-gray-200">
                        {project.products_used}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}