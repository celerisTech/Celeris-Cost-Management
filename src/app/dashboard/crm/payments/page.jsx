"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Plus, Search, Filter, Calendar, IndianRupee,
  ChevronLeft, ChevronRight, X, Check, Eye, Trash2, Edit2,
  Download, Loader2, AlertCircle, CheckCircle2, Building2,
  TrendingUp, Clock, FileText, Receipt, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthScreenStore";
import toast from "react-hot-toast";

const PAYMENT_TYPE_OPTIONS = ["Advance", "Partial Payment", "Final Payment", "Domain Payment"];
const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Failed"];

const STATUS_COLORS = {
  "Pending": "bg-amber-100 text-amber-700 border-amber-200",
  "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Failed": "bg-red-100 text-red-700 border-red-200",
};

const TYPE_COLORS = {
  "Advance": "bg-blue-100 text-blue-700",
  "Partial Payment": "bg-purple-100 text-purple-700",
  "Final Payment": "bg-indigo-100 text-indigo-700",
  "Domain Payment": "bg-teal-100 text-teal-700",
};

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [leadFilter, setLeadFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedLeadSummary, setSelectedLeadSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSearchText, setLeadSearchText] = useState("");
  const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null
  });

  const showConfirm = ({ title, message, confirmText = 'Yes, Delete', cancelText = 'Cancel', type = 'danger', onConfirm }) => {
    setConfirmConfig({
      show: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, show: false }));
  };

  const filteredLeads = leads.filter(l =>
    l.CM_Client_Name?.toLowerCase().includes(leadSearchText.toLowerCase()) ||
    l.CM_Company_Name?.toLowerCase().includes(leadSearchText.toLowerCase())
  );

  const [formData, setFormData] = useState({
    CM_Lead_ID: "",
    CM_Payment_Date: new Date().toISOString().split('T')[0],
    CM_Payment_Type: "Advance",
    CM_Amount: "",
    CM_Payment_Mode: "Cash",
    CM_Reference_Number: "",
    CM_Payment_Status: "Paid",
    CM_Receipt_URL: "",
    CM_Remarks: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchLeads();
  }, [page, leadFilter, statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    if (formData.CM_Lead_ID) {
      fetchLeadSummary(formData.CM_Lead_ID);
    } else {
      setSelectedLeadSummary(null);
    }
  }, [formData.CM_Lead_ID]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        leadId: leadFilter,
        status: statusFilter,
        fromDate,
        toDate,
        search
      });
      const res = await fetch(`/api/sales-payments?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments);
        setTotal(data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        type: "dashboard",
        fromDate,
        toDate
      });
      const res = await fetch(`/api/sales-payments?${params}`);
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/sales-leads?limit=1000");
      const data = await res.json();
      if (res.ok) setLeads(data.leads);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeadSummary = async (leadId) => {
    try {
      const res = await fetch(`/api/sales-payments?type=lead-summary&leadId=${leadId}`);
      const data = await res.json();
      if (res.ok) setSelectedLeadSummary(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openAddModal = () => {
    setFormData({
      CM_Lead_ID: "",
      CM_Payment_Date: new Date().toISOString().split('T')[0],
      CM_Payment_Type: "Advance",
      CM_Amount: "",
      CM_Payment_Mode: "Online",
      CM_Reference_Number: "",
      CM_Payment_Status: "Paid",
      CM_Receipt_URL: "",
      CM_Remarks: ""
    });
    setLeadSearchText("");
    setSelectedPayment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (payment) => {
    setFormData({ ...payment });
    const matchingLead = leads.find(l => l.CM_Lead_ID == payment.CM_Lead_ID);
    setLeadSearchText(matchingLead ? `${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}` : "");
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = selectedPayment ? "PUT" : "POST";
      const url = selectedPayment ? `/api/sales-payments?_method=PUT` : "/api/sales-payments";
      const payload = {
        ...formData,
        CM_Created_By: user?.id,
        CM_Updated_By: user?.id
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(selectedPayment ? "Payment updated" : "Payment recorded");
        setIsModalOpen(false);
        fetchPayments();
        fetchStats();
      } else {
        const error = await res.json();
        toast.error(error.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (paymentId) => {
    showConfirm({
      title: "Delete Payment Record?",
      message: "Are you sure you want to delete this payment record? This action cannot be undone.",
      confirmText: "Yes, Delete Payment",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales-payments?_method=DELETE`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CM_Payment_ID: paymentId, CM_Updated_By: user?.id })
          });
          if (res.ok) {
            toast.success("Payment deleted");
            fetchPayments();
            fetchStats();
          }
        } catch (error) {
          toast.error("Delete failed");
        }
      }
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6 min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Sales Payments
          </h1>
          <p className="text-sm text-gray-500">Track collections, advances, and pending balances</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all shadow-md font-medium"
        >
          <Plus className="h-4 w-4" /> Record Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: "Total Collected", value: stats?.total_collection || 0, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Pending Amount", value: stats?.pending_amount || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Advance Payments", value: stats?.advance_payments || 0, icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Domain Payments", value: stats?.domain_payments || 0, icon: Receipt, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
          { label: "Final Payments", value: stats?.final_payments || 0, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        ].map((s, i) => (
          <div key={i} className={`p-3 rounded-xl border-l-4 ${s.border} ${s.bg} shadow-sm transition-transform hover:scale-[1.02]`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-white/80 ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
            </div>
            <p className={`text-xl font-black ${s.color}`}>₹{Number(s.value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="bg-white p-2 flex flex-wrap gap-4 items-end text-gray-800">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
            <input
              type="text"
              placeholder="Ref #, Remarks, Client..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Filter by Lead</label>
          <select
            value={leadFilter}
            onChange={(e) => { setLeadFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none"
          >
            <option value="">All Leads</option>
            {leads.map(l => <option key={l.CM_Lead_ID} value={l.CM_Lead_ID}>{l.CM_Client_Name} ({l.CM_Company_Name || "Ind"})</option>)}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            {PAYMENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="w-full sm:w-36">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm h-[42px]"
          />
        </div>

        <div className="w-full sm:w-36">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm h-[42px]"
          />
        </div>

        <button
          onClick={() => {
            setLeadFilter("");
            setStatusFilter("");
            setSearch("");
            const d = new Date();
            setFromDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
            setToDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
            setPage(1);
          }}
          className="px-6 py-2.5 text-white bg-gray-600 hover:bg-gray-700 font-bold transition-all rounded-lg h-[42px] shadow-sm"
        >
          Reset
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-12 text-center border-r border-gray-200">#</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-32 border-r border-gray-200">Date</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-48 border-r border-gray-200">Lead / Company</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-48 border-r border-gray-200">Payment Type</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-40 border-r border-gray-200">Mode & Ref</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-32 border-r border-gray-200">Amount</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200 text-center">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500 font-medium">No records matching your search</td></tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={p.CM_Payment_ID} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-2.5 text-[11px] text-gray-600 text-center border-r border-gray-100">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(p.CM_Payment_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.CM_Client_Name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{p.CM_Company_Name || "Individual"}</p>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${TYPE_COLORS[p.CM_Payment_Type]}`}>
                        {p.CM_Payment_Type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100">
                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-gray-400" /> {p.CM_Payment_Mode}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{p.CM_Reference_Number || "No reference"}</p>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100">
                      <p className="text-sm font-black text-emerald-600">₹{Number(p.CM_Amount).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[p.CM_Payment_Status]}`}>
                        {p.CM_Payment_Status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        {p.CM_Receipt_URL && (
                          <a href={p.CM_Receipt_URL} target="_blank" className="p-1 text-gray-600 hover:text-blue-600 transition-colors" title="View Receipt">
                            <Receipt className="h-4 w-4" />
                          </a>
                        )}
                        <button onClick={() => openEditModal(p)} className="p-1 text-gray-600 hover:text-amber-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.CM_Payment_ID)} className="p-1 text-gray-600 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No payment records found</div>
          ) : (
            payments.map((p) => (
              <div key={p.CM_Payment_ID} className="p-4 bg-white space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.CM_Client_Name}</p>
                    <p className="text-xs text-gray-500">{p.CM_Company_Name || "Individual"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[p.CM_Payment_Status]}`}>
                    {p.CM_Payment_Status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Amount</p>
                    <p className="text-sm font-black text-emerald-600">₹{Number(p.CM_Amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Date</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(p.CM_Payment_Date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${TYPE_COLORS[p.CM_Payment_Type]}`}>
                      {p.CM_Payment_Type}
                    </span>
                    <span className="text-xs text-gray-500">{p.CM_Payment_Mode}</span>
                  </div>
                  <div className="flex gap-2">
                    {p.CM_Receipt_URL && (
                      <a href={p.CM_Receipt_URL} target="_blank" className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                        <Receipt className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => openEditModal(p)} className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.CM_Payment_ID)} className="p-2 bg-red-50 rounded-lg text-red-600 border border-red-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <p className="text-xs text-gray-500">Showing <span className="font-bold">{payments.length}</span> of <span className="font-bold">{total}</span> records</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold ${page === i + 1 ? "bg-indigo-600 text-white" : "text-gray-500 border border-gray-200"}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-600 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {selectedPayment ? "Update Payment Record" : "Record New Payment"}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setSelectedPayment(null); }} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Client Selector & Outstanding Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Lead *</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="Search or enter company/client name..."
                      value={leadSearchText}
                      onFocus={() => setShowLeadSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLeadSuggestions(false), 250)}
                      onChange={(e) => {
                        setLeadSearchText(e.target.value);
                        setShowLeadSuggestions(true);
                        if (formData.CM_Lead_ID) {
                          setFormData(prev => ({ ...prev, CM_Lead_ID: "" }));
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none pr-10"
                    />
                    {formData.CM_Lead_ID && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-extrabold text-sm">✓</span>
                    )}
                  </div>

                  {showLeadSuggestions && leadSearchText.trim() !== "" && (
                    <div className="absolute z-[70] left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-50">
                      {filteredLeads.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 italic">No matching leads found</div>
                      ) : (
                        filteredLeads.map((l) => (
                          <button
                            key={l.CM_Lead_ID}
                            type="button"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, CM_Lead_ID: l.CM_Lead_ID }));
                              setLeadSearchText(`${l.CM_Client_Name} - ${l.CM_Company_Name || "Individual"}`);
                              setShowLeadSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-xs font-medium flex flex-col gap-0.5"
                          >
                            <span className="font-bold text-gray-900">{l.CM_Client_Name}</span>
                            <span className="text-[10px] text-gray-500">{l.CM_Company_Name || "Individual"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="CM_Lead_ID"
                    value={formData.CM_Lead_ID || ""}
                    required
                  />
                </div>

                {selectedLeadSummary && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-indigo-700">₹{Number(selectedLeadSummary.outstanding).toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-500">Budget: ₹{Number(selectedLeadSummary.expected_budget).toLocaleString()}</span>
                    </div>
                    {selectedLeadSummary.domain_paid > 0 && (
                      <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Domain Payments</span>
                        <span className="text-sm font-bold text-teal-700">₹{Number(selectedLeadSummary.domain_paid).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    value={formData.CM_Amount || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none font-black text-lg text-blue-600"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.CM_Payment_Date || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Type</label>
                  <select
                    value={formData.CM_Payment_Type || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  >
                    {PAYMENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Mode</label>
                  <select
                    value={formData.CM_Payment_Mode || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Mode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online / GPay / PhonePe</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <select
                    value={formData.CM_Payment_Status || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  >
                    {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference Number / Transaction ID</label>
                <input
                  type="text"
                  value={formData.CM_Reference_Number || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Reference_Number: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  placeholder="e.g. TXN123456789"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remarks</label>
                <textarea
                  rows="2"
                  value={formData.CM_Remarks || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="py-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-50 mt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedPayment(null); }} className="flex-1 px-6 py-3 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  {selectedPayment ? "Update Payment" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Confirmation Alert Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100">
            {/* Top Indicator Bar */}
            <div className={`h-2.5 w-full ${
              confirmConfig.type === 'danger'
                ? 'bg-gradient-to-r from-rose-500 to-red-600'
                : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  confirmConfig.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  <AlertCircle size={26} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {confirmConfig.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {confirmConfig.message}
                  </p>
                </div>

                <button
                  onClick={closeConfirm}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                >
                  {confirmConfig.cancelText || "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const action = confirmConfig.onConfirm;
                    closeConfirm();
                    if (action) action();
                  }}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 text-white ${
                    confirmConfig.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                  }`}
                >
                  {confirmConfig.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
