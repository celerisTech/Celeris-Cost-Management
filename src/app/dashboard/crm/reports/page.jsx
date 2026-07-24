"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, Calendar, User, Target, MapPin, CreditCard,
  TrendingUp, Download, Printer, FileText, ChevronRight,
  Filter, Loader2, ArrowUpRight, ArrowDownRight, Users, CheckCircle2, AlertCircle, X
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Reports");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [executiveFilter, setExecutiveFilter] = useState("All");

  const [detailModalConfig, setDetailModalConfig] = useState({ isOpen: false, title: "", type: "", value: "" });
  const [detailVisits, setDetailVisits] = useState([]);
  const [loadingDetailVisits, setLoadingDetailVisits] = useState(false);

  const handleRowClick = async (type, value, title) => {
    setDetailModalConfig({ isOpen: true, title, type, value });
    setLoadingDetailVisits(true);
    try {
      let url = `/api/sales-reports?type=Reports`;

      if (dateRange.from) url += `&fromDate=${dateRange.from}`;
      if (dateRange.to) url += `&toDate=${dateRange.to}`;

      if (type === 'month') {
        url += `&month=${value}`;
      } else if (type === 'industrial') {
        url += `&industrialName=${encodeURIComponent(value)}`;
      } else if (type === 'category') {
        url += `&categoryName=${encodeURIComponent(value)}`;
      } else if (type === 'subcategory') {
        url += `&subcategoryName=${encodeURIComponent(value)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDetailVisits(data.Reports || []);
      } else {
        toast.error("Failed to load details");
      }
    } catch (err) {
      toast.error("Failed to load details");
    } finally {
      setLoadingDetailVisits(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeTab,
        fromDate: dateRange.from,
        toDate: dateRange.to
      });
      const res = await fetch(`/api/sales-reports?${params}`);
      const data = await res.json();
      if (res.ok) setReportData(data);
    } catch (error) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;
    let dataToExport = [];
    if (activeTab === "Reports" && reportData.Reports) dataToExport = reportData.Reports;
    else if (activeTab === "monthWise" && reportData.monthWise) dataToExport = reportData.monthWise;
    else if (activeTab === "industrialWise" && reportData.industrialWise) dataToExport = reportData.industrialWise;
    else if (activeTab === "categoryWise" && reportData.categoryWise) dataToExport = reportData.categoryWise;
    else if (activeTab === "subcategoryWise" && reportData.subcategoryWise) dataToExport = reportData.subcategoryWise;
    else dataToExport = reportData;

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Sales_Report_${activeTab}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(18);
    doc.text("Sales Report & Analytics", 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Type: ${activeTab}`, 14, 28);

    if (activeTab === "Reports" && reportData.Reports) {
      const tableColumn = ["#", "Date", "Client Name", "Purpose", "Product", "Demo", "Visits", "Status"];
      const tableRows = reportData.Reports.map((row, i) => [
        i + 1,
        row.visit_date ? new Date(row.visit_date).toLocaleDateString("en-IN") : "—",
        row.client_name,
        row.purpose || "—",
        row.product_name || "—",
        row.demo_given || "No",
        row.visit_count || 0,
        row.status || "Pending"
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });
    } else if (activeTab === "monthWise" && reportData.monthWise) {
      const tableColumn = ["Month", "Total Visits", "Demos Given", "Converted"];
      const tableRows = reportData.monthWise.map(d => [
        d.month, d.total_visits, d.demos, d.converted
      ]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 } });
    } else if (activeTab === "industrialWise" && reportData.industrialWise) {
      const tableColumn = ["Industrial Name", "Total Visits", "Demos Given", "Converted"];
      const tableRows = reportData.industrialWise.map(d => [
        d.industrial_name, d.total_visits, d.demos, d.converted
      ]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 } });
    } else if (activeTab === "categoryWise" && reportData.categoryWise) {
      const tableColumn = ["Category Name", "Total Visits", "Demos Given", "Converted"];
      const tableRows = reportData.categoryWise.map(d => [
        d.category_name, d.total_visits, d.demos, d.converted
      ]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 } });
    } else if (activeTab === "subcategoryWise" && reportData.subcategoryWise) {
      const tableColumn = ["Subcategory Name", "Total Visits", "Demos Given", "Converted"];
      const tableRows = reportData.subcategoryWise.map(d => [
        d.subcategory_name, d.total_visits, d.demos, d.converted
      ]);

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'grid', headStyles: { fillColor: [79, 70, 229], textColor: 255 } });
    }

    doc.save(`Sales_Report_${activeTab}.pdf`);
  };

  const exportDetailToExcel = () => {
    if (!detailVisits.length) return;
    const dataToExport = filterData(detailVisits);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail Report");
    XLSX.writeFile(wb, `Sales_Detail_Report_${detailModalConfig.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const exportDetailToPDF = () => {
    if (!detailVisits.length) return;
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(18);
    doc.text(`Sales Detail Report: ${detailModalConfig.title}`, 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const dataToExport = filterData(detailVisits);
    const tableColumn = ["#", "Date", "Client Name", "Executive", "Purpose", "Product", "Demo", "Visits", "Status"];
    const tableRows = dataToExport.map((row, i) => [
      i + 1,
      row.visit_date ? new Date(row.visit_date).toLocaleDateString("en-IN") : "—",
      row.client_name,
      row.executive_name || "—",
      row.purpose || "—",
      row.product_name || "—",
      row.demo_given || "No",
      row.visit_count || 0,
      row.status || "Pending"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`Sales_Detail_Report_${detailModalConfig.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const TABS = [
    { id: "Reports", label: "Reports", icon: CreditCard },
    { id: "monthWise", label: "Month Wise", icon: Calendar },
    { id: "industrialWise", label: "Industrial Wise", icon: Target },
    { id: "categoryWise", label: "Category Wise", icon: Users },
    { id: "subcategoryWise", label: "Subcategory Wise", icon: MapPin },
  ];

  const filterData = (dataArray) => {
    if (!dataArray) return [];

    return dataArray.filter(row => {
      // Filter by Executive Name
      if (executiveFilter !== "All") {
        if (!row.executive_name || row.executive_name !== executiveFilter) return false;
      }

      // Filter by Status
      if (statusFilter !== "All" && row.status) {
        if (row.status !== statusFilter) return false;
      }

      // Filter by Search Term
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch = Object.values(row).some(val =>
          val && String(val).toLowerCase().includes(lowerTerm)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const availableExecutives = Array.from(new Set([
    ...(reportData?.Reports || []),
    ...(detailVisits || [])
  ].map(r => r.executive_name).filter(Boolean))).sort();

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
      {/* Ribbon / Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 bg-white border-b border-slate-300 shadow-sm shrink-0 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap pl-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-bold text-slate-800">Sales Reports & Analytics</h1>
        </div>

        {/* Date Filter & Export */}
        <div className="flex items-center gap-2">
          {activeTab === "Reports" && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-2 rounded border border-slate-300 shrink-0">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-[11px] text-slate-700 outline-none h-5 w-24 sm:w-32 placeholder-slate-400"
              />
              <div className="w-[1px] h-4 bg-slate-300 mx-1 shrink-0"></div>
              <select
                value={executiveFilter}
                onChange={e => setExecutiveFilter(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-700 outline-none h-5 cursor-pointer max-w-[100px] truncate"
              >
                <option value="All">All Executives</option>
                {availableExecutives.map(exec => (
                  <option key={exec} value={exec}>{exec}</option>
                ))}
              </select>
              <div className="w-[1px] h-4 bg-slate-300 mx-1 shrink-0"></div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-700 outline-none h-5 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Converted">Converted</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Demo Given">Demo Given</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
                <option value="Visited">Visited</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="bg-white px-3 py-3.5 border-2 border-slate-300 text-[11px] text-slate-700 outline-none h-6 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-slate-500 text-[11px]">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="bg-white px-3 py-3.5 border-2 border-slate-300 text-[11px] text-slate-700 outline-none h-6 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {(dateRange.from || dateRange.to) && (
              <button onClick={() => setDateRange({ from: "", to: "" })} className="text-[10px] text-rose-600 px-1.5 font-bold hover:bg-rose-100 ml-1 h-6 border border-transparent rounded">CLEAR</button>
            )}
          </div>

          <div className="flex gap-1">
            <button onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange({ from: today, to: today });
            }} className="h-7 px-2.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-sm">Today</button>
            <button onClick={() => {
              const now = new Date();
              const weekAgo = new Date();
              weekAgo.setDate(now.getDate() - 7);
              setDateRange({ from: weekAgo.toISOString().split('T')[0], to: now.toISOString().split('T')[0] });
            }} className="h-7 px-2.5 bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-sm">7 Days</button>
          </div>

          <div className="flex gap-1 ml-auto sm:ml-2 border-l border-slate-300 pl-2">
            <button onClick={exportToExcel} className="flex items-center gap-1 h-7 px-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-bold rounded-sm transition-colors">
              <Download className="h-3 w-3 text-emerald-600" /> Excel
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-1 h-7 px-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 text-[11px] font-bold rounded-sm transition-colors">
              <FileText className="h-3 w-3 text-rose-600" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex items-end bg-white border-b border-slate-300 overflow-x-auto scrollbar-hide shrink-0 px-2 pt-2 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center min-w-[100px] px-3 py-1 text-[12px] font-bold px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area (Spreadsheet Grid) */}
      <div className="flex-1 overflow-auto p-2 pb-0">
        <div className="h-full bg-white border border-slate-300 shadow-sm flex flex-col overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="font-bold text-xs">Generating report...</p>
            </div>
          ) : !reportData ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <AlertCircle className="h-8 w-8 mb-2 text-slate-300" />
              <p className="font-bold text-xs">No data available for the selected criteria</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-w-full">
              {activeTab === "Reports" && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                    <tr>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center w-10">#</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Date (Visited)</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Client Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Executive Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 w-1/3">Purpose / Product Needed</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Product Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demo</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Status</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Payment Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filterData(reportData?.Reports)?.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group">
                        <td className="px-2 py-1 text-[11px] font-mono text-slate-400 border border-slate-300 text-center">{i + 1}</td>
                        <td className="px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-300">
                          {row.visit_date ? new Date(row.visit_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td className="px-2 py-1 text-[11px] font-bold text-slate-800 border border-slate-300 uppercase">
                          {row.client_name}
                        </td>
                        <td className="px-2 py-1 text-[11px] font-bold text-slate-700 border border-slate-300">
                          {row.executive_name || "—"}
                        </td>
                        <td className="px-2 py-1 text-[11px] text-slate-600 border border-slate-300">
                          {row.purpose || "—"}
                        </td>
                        <td className="px-2 py-1 text-[11px] font-bold text-blue-700 border border-slate-300">
                          {row.product_name || "—"}
                        </td>
                        <td className="px-2 py-1 text-center border border-slate-300">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.demo_given === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {row.demo_given === 'Yes' ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center border border-slate-300">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${row.status === 'Converted' ? 'bg-green-100 text-green-700' :
                            row.status === 'Proposal Sent' ? 'bg-blue-100 text-blue-700' :
                              row.status === 'Interested' || row.status === 'Demo Given' ? 'bg-indigo-100 text-indigo-700' :
                                row.status === 'Rejected' || row.status === 'Not Interested' ? 'bg-rose-100 text-rose-700' :
                                  row.status === 'Follow-up Needed' || row.status === 'Visited' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-500'
                            }`}>
                            {row.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-2 py-1 border border-slate-300">
                          <div className="flex flex-wrap gap-1">
                            {row.payment_details ? row.payment_details.split('|').map((p, idx) => (
                              <span key={idx} className="text-[10px] font-mono font-medium text-slate-700 bg-slate-100 px-1 border border-slate-200">
                                {p.trim()}
                              </span>
                            )) : <span className="text-[10px] text-slate-400 italic">No payment history</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "monthWise" && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                    <tr>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Month</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Total Visits</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demos Given</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filterData(reportData?.monthWise)?.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group cursor-pointer" onClick={() => handleRowClick('month', row.month, `Visits in ${new Date(row.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}`)}>
                        <td className="px-2 py-1 border border-slate-300 text-blue-700 font-bold group-hover:underline text-[11px]">
                          {new Date(row.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.total_visits}</td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.demos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "industrialWise" && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                    <tr>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Industrial Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Total Visits</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demos Given</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filterData(reportData?.industrialWise)?.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group cursor-pointer" onClick={() => handleRowClick('industrial', row.industrial_name, `Visits for ${row.industrial_name}`)}>
                        <td className="px-2 py-1 border border-slate-300 text-blue-700 font-bold group-hover:underline uppercase text-[11px]">
                          {row.industrial_name}
                        </td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.total_visits}</td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.demos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "categoryWise" && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                    <tr>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Category Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Total Visits</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demos Given</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filterData(reportData?.categoryWise)?.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group cursor-pointer" onClick={() => handleRowClick('category', row.category_name, `Visits for ${row.category_name}`)}>
                        <td className="px-2 py-1 border border-slate-300 text-blue-700 font-bold group-hover:underline uppercase text-[11px]">
                          {row.category_name}
                        </td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.total_visits}</td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.demos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "subcategoryWise" && (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                    <tr>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Subcategory Name</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Total Visits</th>
                      <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demos Given</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filterData(reportData?.subcategoryWise)?.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group cursor-pointer" onClick={() => handleRowClick('subcategory', row.subcategory_name, `Visits for ${row.subcategory_name}`)}>
                        <td className="px-2 py-1 border border-slate-300 text-blue-700 font-bold group-hover:underline uppercase text-[11px]">
                          {row.subcategory_name}
                        </td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.total_visits}</td>
                        <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-700 border border-slate-300">{row.demos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* General Visits Details Modal (Styled like an Excel overlay/dialog) */}
      {detailModalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-black/40 backdrop-blur-sm">
          <div className="bg-white shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col border border-slate-400">
            {/* Modal Header */}
            <div className="px-3 py-2 border-b border-slate-300 bg-slate-100 flex items-center justify-between shadow-sm gap-2">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 whitespace-nowrap">
                <Users className="h-4 w-4 text-emerald-600" />
                {detailModalConfig.title}
              </h2>

              <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-300">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent text-[11px] text-slate-700 outline-none h-5 w-24 sm:w-32 placeholder-slate-400"
                  />
                  <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                  <select
                    value={executiveFilter}
                    onChange={e => setExecutiveFilter(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none h-5 cursor-pointer max-w-[100px] truncate"
                  >
                    <option value="All">All Executives</option>
                    {availableExecutives.map(exec => (
                      <option key={exec} value={exec}>{exec}</option>
                    ))}
                  </select>
                  <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none h-5 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Converted">Converted</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Demo Given">Demo Given</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up Needed">Follow-up Needed</option>
                    <option value="Visited">Visited</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={exportDetailToExcel} className="flex items-center gap-1 h-7 px-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-bold rounded-sm transition-colors">
                    <Download className="h-3 w-3 text-emerald-600" /> Excel
                  </button>
                  <button onClick={exportDetailToPDF} className="flex items-center gap-1 h-7 px-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 text-[11px] font-bold rounded-sm transition-colors">
                    <FileText className="h-3 w-3 text-rose-600" /> PDF
                  </button>
                </div>
              </div>

              <button
                onClick={() => setDetailModalConfig({ ...detailModalConfig, isOpen: false })}
                className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-[#e1dfdd] p-2">
              <div className="bg-white border border-slate-300 shadow-sm min-h-full">
                {loadingDetailVisits ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
                    <p className="font-bold text-[11px]">Loading details...</p>
                  </div>
                ) : detailVisits.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-200 m-2">
                    <p className="text-[11px] text-slate-400 font-bold">No visits found</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#cbd5e1] ring-1 ring-slate-300">
                      <tr>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center w-10">#</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Date (Visited)</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Client Name</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Executive Name</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Purpose / Product Needed</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Product Name</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Demo</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Visits</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 text-center">Status</th>
                        <th className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">Payment Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filterData(detailVisits).map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/50 even:bg-slate-50 group">
                          <td className="px-2 py-1 text-[11px] font-mono text-slate-400 border border-slate-300 text-center">{i + 1}</td>
                          <td className="px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-300">
                            {row.visit_date ? new Date(row.visit_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                          </td>
                          <td className="px-2 py-1 text-[11px] font-bold text-slate-800 border border-slate-300 uppercase">
                            {row.client_name}
                          </td>
                          <td className="px-2 py-1 text-[11px] font-bold text-slate-700 border border-slate-300">
                            {row.executive_name || "—"}
                          </td>
                          <td className="px-2 py-1 text-[11px] text-slate-600 border border-slate-300 italic">
                            {row.purpose || "—"}
                          </td>
                          <td className="px-2 py-1 text-[11px] font-bold text-blue-700 border border-slate-300">
                            {row.product_name || "—"}
                          </td>
                          <td className="px-2 py-1 text-center border border-slate-300">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.demo_given === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                              {row.demo_given === 'Yes' ? 'ON' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center border border-slate-300">
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              {row.visit_count}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center border border-slate-300">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${row.status === 'Converted' ? 'bg-green-100 text-green-700' :
                              row.status === 'Proposal Sent' ? 'bg-blue-100 text-blue-700' :
                                row.status === 'Interested' || row.status === 'Demo Given' ? 'bg-indigo-100 text-indigo-700' :
                                  row.status === 'Rejected' || row.status === 'Not Interested' ? 'bg-rose-100 text-rose-700' :
                                    row.status === 'Follow-up Needed' || row.status === 'Visited' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-500'
                              }`}>
                              {row.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-2 py-1 border border-slate-300">
                            <div className="flex flex-wrap gap-1">
                              {row.payment_details ? row.payment_details.split('|').map((p, idx) => (
                                <span key={idx} className="text-[10px] font-mono font-medium text-slate-700 bg-slate-100 px-1 border border-slate-200">
                                  {p.trim()}
                                </span>
                              )) : <span className="text-[10px] text-slate-400 italic">No payment history</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-3 py-2 border-t border-slate-300 bg-slate-100 flex justify-end">
              <button
                onClick={() => setDetailModalConfig({ ...detailModalConfig, isOpen: false })}
                className="px-4 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-sm hover:bg-slate-50 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
