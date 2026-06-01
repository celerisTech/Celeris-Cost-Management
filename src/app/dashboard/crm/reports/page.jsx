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

  const [selectedDate, setSelectedDate] = useState(null);
  const [dateVisits, setDateVisits] = useState([]);
  const [loadingDateVisits, setLoadingDateVisits] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const handleDateClick = async (dateStr) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    setSelectedDate(dateStr);
    setIsDateModalOpen(true);
    setLoadingDateVisits(true);
    try {
      const res = await fetch(`/api/sales-reports?type=Reports&fromDate=${formattedDate}&toDate=${formattedDate}`);
      const data = await res.json();
      if (res.ok) {
        setDateVisits(data.Reports || []);
      } else {
        toast.error("Failed to load visit details");
      }
    } catch (err) {
      toast.error("Failed to load visit details");
    } finally {
      setLoadingDateVisits(false);
    }
  };

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientVisits, setClientVisits] = useState([]);
  const [loadingClientVisits, setLoadingClientVisits] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
    setLoadingClientVisits(true);
    try {
      const res = await fetch(`/api/sales-visits?leadId=${client.CM_Lead_ID}`);
      const data = await res.json();
      if (res.ok) {
        setClientVisits(data.visits || []);
      } else {
        toast.error("Failed to load client visits");
      }
    } catch (err) {
      toast.error("Failed to load client visits");
    } finally {
      setLoadingClientVisits(false);
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
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 font-medium">
                              <button
                                type="button"
                                onClick={() => handleDateClick(d.visit_date)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold text-left transition-colors"
                              >
                                {new Date(d.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-center font-bold text-gray-700">{d.visit_count}</td>
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
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 font-medium truncate max-w-[150px]">
                              <button
                                type="button"
                                onClick={() => handleClientClick(c)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold text-left transition-colors truncate max-w-[140px]"
                              >
                                {c.CM_Client_Name}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-center font-bold text-gray-700">{c.visit_count}</td>
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

      {/* Date-wise Visits Details Modal */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm text-gray-800 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Visits on {selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
              </h2>
              <button 
                onClick={() => setIsDateModalOpen(false)} 
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDateVisits ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                  <p className="font-semibold text-sm">Loading visit details...</p>
                </div>
              ) : dateVisits.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium animate-pulse">No visits found for this date</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">#</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Client Name</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Purpose</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Product Needed</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 text-center">Demo</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {dateVisits.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-slate-400 border-r border-slate-100">{i + 1}</td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900 border-r border-slate-100 uppercase tracking-tight">{v.client_name}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 border-r border-slate-100 italic leading-snug">{v.purpose || "—"}</td>
                          <td className="px-4 py-3 text-xs font-bold text-blue-600 border-r border-slate-100">{v.product_name || "—"}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${v.demo_given === 'Yes' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              {v.demo_given === 'Yes' ? 'ON' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              v.status === 'Converted' ? 'bg-green-100 text-green-700 border border-green-200' : 
                              v.status === 'Proposal Sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              v.status === 'Interested' || v.status === 'Demo Given' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                              v.status === 'Rejected' || v.status === 'Not Interested' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {v.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsDateModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client-wise Visits Details Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm text-gray-800 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Visits for {selectedClient ? (selectedClient.CM_Company_Name ? `${selectedClient.CM_Client_Name} (${selectedClient.CM_Company_Name})` : selectedClient.CM_Client_Name) : ""}
              </h2>
              <button 
                onClick={() => setIsClientModalOpen(false)} 
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingClientVisits ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                  <p className="font-semibold text-sm">Loading visit details...</p>
                </div>
              ) : clientVisits.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium animate-pulse">No visits found for this client</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">#</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Visit Date</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Purpose</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200">Products Discussed</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 text-center">Demo</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {clientVisits.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-slate-400 border-r border-slate-100">{i + 1}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                            {v.CM_Visit_Date ? new Date(v.CM_Visit_Date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 border-r border-slate-100 italic leading-snug">{v.CM_Purpose || "—"}</td>
                          <td className="px-4 py-3 text-xs font-bold text-blue-600 border-r border-slate-100">{v.CM_Product_Discussed || "—"}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${v.CM_Demo_Given === 'Yes' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              {v.CM_Demo_Given === 'Yes' ? 'ON' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              v.CM_Visit_Status === 'Completed' || v.CM_Visit_Status === 'Interested' ? 'bg-green-100 text-green-700 border border-green-200' : 
                              v.CM_Visit_Status === 'Proposal Sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              v.CM_Visit_Status === 'Demo Given' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              v.CM_Visit_Status === 'Cancelled' || v.CM_Visit_Status === 'Not Interested' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {v.CM_Visit_Status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-wider"
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
