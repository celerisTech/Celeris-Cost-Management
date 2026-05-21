"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, Calendar, User, Target, MapPin, CreditCard,
  TrendingUp, Download, Printer, FileText, ChevronRight,
  Filter, Loader2, ArrowUpRight, ArrowDownRight, Users, CheckCircle2, AlertCircle
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
    else if (activeTab === "visit" && reportData.dateWise) dataToExport = reportData.dateWise;
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
    doc.text(`Type: ${activeTab === 'Reports' ? 'Detailed Visits' : 'Visit Analytics'}`, 14, 28);

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
    } else if (activeTab === "visit" && reportData.dateWise) {
      const tableColumn = ["Date", "Visits", "Conversion"];
      const tableRows = reportData.dateWise.map(d => [
        new Date(d.visit_date).toLocaleDateString(),
        d.visit_count,
        d.converted
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      });
    }

    doc.save(`Sales_Report_${activeTab}.pdf`);
  };

  const TABS = [
    { id: "Reports", label: "Reports", icon: CreditCard },
    { id: "visit", label: "Visit Analytics", icon: MapPin },
  ];

  return (
    <div className="p-4 md:p-4 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Sales Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500">Comprehensive insights into sales performance and pipeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs shadow-sm uppercase tracking-wider">
            <Download className="h-4 w-4 text-emerald-500" /> Excel
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md font-bold text-xs uppercase tracking-wider">
            <FileText className="h-4 w-4 text-rose-400" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs & Date Filter Design Update */}
      <div className="flex flex-col xl:flex-row gap-6 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        {/* Modern Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl w-full xl:w-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-lg transition-all duration-300 ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-md transform scale-[1.02]" : "text-slate-500 hover:text-slate-700"}`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-indigo-600" : "text-slate-400"}`} /> 
              <span className="whitespace-nowrap uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Date Filter Design */}
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex-1 xl:flex-none min-w-[300px] group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-2 flex-1">
              <input 
                type="date" 
                value={dateRange.from} 
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })} 
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full" 
              />
              <span className="text-slate-300 font-bold">→</span>
              <input 
                type="date" 
                value={dateRange.to} 
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })} 
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full" 
              />
            </div>
            { (dateRange.from || dateRange.to) && (
              <button onClick={() => setDateRange({ from: "", to: "" })} className="text-[10px] text-rose-500 font-black hover:text-rose-600 px-2 py-1 bg-rose-50 rounded-md">CLEAR</button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange({ from: today, to: today });
            }} className="px-3 py-2 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:bg-slate-100 uppercase tracking-widest transition-colors">Day</button>
            <button onClick={() => {
              const now = new Date();
              const weekAgo = new Date();
              weekAgo.setDate(now.getDate() - 7);
              setDateRange({ from: weekAgo.toISOString().split('T')[0], to: now.toISOString().split('T')[0] });
            }} className="px-3 py-2 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:bg-slate-100 uppercase tracking-widest transition-colors">Week</button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
            <p className="font-medium">Generating your report...</p>
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-200" />
            <p className="font-medium">No data available for the selected criteria</p>
          </div>
        ) : (
          <div className="p-0">
            {activeTab === "Reports" && (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">#</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 whitespace-nowrap">Date (Visited)</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 min-w-[180px]">Client Name</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 min-w-[250px]">Purpose / Product Needed</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 min-w-[150px]">Product Name</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 text-center">Demo</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 text-center">Visits</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 min-w-[200px]">Payment Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {reportData?.Reports?.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-50/30 transition-colors even:bg-slate-50/30 group">
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-400 border-b border-r border-slate-100">{i + 1}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-r border-slate-100 whitespace-nowrap">
                          {row.visit_date ? new Date(row.visit_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-black text-slate-900 border-b border-r border-slate-100 uppercase tracking-tight">
                          {row.client_name}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 border-b border-r border-slate-100 italic leading-snug">
                          {row.purpose || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-bold text-blue-600 border-b border-r border-slate-100">
                          {row.product_name || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center border-b border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${row.demo_given === 'Yes' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                            {row.demo_given === 'Yes' ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center border-b border-r border-slate-100">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200 group-hover:bg-gray-600 group-hover:text-white transition-all">
                            {row.visit_count}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center border-b border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            row.status === 'Converted' ? 'bg-green-100 text-green-700 border border-green-200' : 
                            row.status === 'Proposal Sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            row.status === 'Interested' || row.status === 'Demo Given' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                            row.status === 'Rejected' || row.status === 'Not Interested' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            row.status === 'Follow-up Needed' || row.status === 'Visited' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {row.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-100">
                          <div className="flex flex-wrap gap-1">
                            {row.payment_details ? row.payment_details.split('|').map((p, idx) => (
                              <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold whitespace-nowrap">
                                {p.trim()}
                              </span>
                            )) : <span className="text-[10px] text-slate-400 font-medium">No payment history</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "visit" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-800 p-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Date-wise Visits
                  </h3>
                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-center">Visits</th><th className="px-4 py-2 text-right">Conversion</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reportData?.dateWise?.map((d, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-medium">{new Date(d.visit_date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-center">{d.visit_count}</td>
                            <td className="px-4 py-2 text-right text-emerald-600 font-bold">{d.converted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" /> Client-wise Analytics
                  </h3>
                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr><th className="px-4 py-2">Client</th><th className="px-4 py-2 text-center">Visits</th><th className="px-4 py-2 text-right">Value</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reportData?.clientWise?.map((c, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-medium truncate max-w-[150px]">{c.CM_Client_Name}</td>
                            <td className="px-4 py-2 text-center">{c.visit_count}</td>
                            <td className="px-4 py-2 text-right font-bold text-indigo-600">₹{Number(c.last_proposal || 0).toLocaleString()}</td>
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
    </div>
  );
}
