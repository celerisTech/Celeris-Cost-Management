"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Plus, Search, Filter, Calendar, IndianRupee,
  ChevronLeft, ChevronRight, X, Check, Eye, Trash2, Edit2,
  Download, Loader2, AlertCircle, CheckCircle2, Building2,
  TrendingUp, Clock, FileText, Receipt, ArrowUpRight, ArrowDownLeft, RotateCcw
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthScreenStore";
import toast from "react-hot-toast";

const PAYMENT_TYPE_OPTIONS = ["Advance", "Partial Payment", "Final Payment", "Domain Payment", "AMC"];
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
  "AMC": "bg-amber-100 text-amber-700",
};

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pendingAmcs, setPendingAmcs] = useState([]);
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
    CM_Remarks: "",
    CM_AMC_ID: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page, leadFilter, statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (!isModalOpen || !leadSearchText.trim() || formData.CM_Lead_ID) return;
    const timer = setTimeout(() => {
      fetchLeads(leadSearchText.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [leadSearchText, isModalOpen, formData.CM_Lead_ID]);

  useEffect(() => {
    if (formData.CM_Lead_ID) {
      fetchLeadSummary(formData.CM_Lead_ID);
      fetchPendingAmcs(formData.CM_Lead_ID);
    } else {
      setSelectedLeadSummary(null);
      setPendingAmcs([]);
    }
  }, [formData.CM_Lead_ID]);

  useEffect(() => {
    if (typeof window !== "undefined" && leads.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLeadId = searchParams.get("leadId");
      const urlPaymentType = searchParams.get("paymentType");
      const urlAmcId = searchParams.get("amcId");

      if (urlLeadId) {
        const matchingLead = leads.find(l => String(l.CM_Lead_ID) === String(urlLeadId));
        if (matchingLead) {
          setIsModalOpen(true);
          setLeadSearchText(`${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}`);
          
          setFormData(prev => ({
            ...prev,
            CM_Lead_ID: urlLeadId,
            CM_Payment_Type: urlPaymentType || "Advance",
            CM_AMC_ID: urlAmcId || "",
            CM_Payment_Date: new Date().toISOString().split('T')[0]
          }));

          fetchLeadSummary(urlLeadId);
          fetchPendingAmcs(urlLeadId);

          if (urlAmcId && urlPaymentType === "AMC") {
            fetch(`/api/sales-amc?amcId=${urlAmcId}`)
              .then(res => res.json())
              .then(amcData => {
                if (amcData && amcData.CM_Amount) {
                  setFormData(prev => ({
                    ...prev,
                    CM_Amount: amcData.CM_Amount
                  }));
                }
              })
              .catch(console.error);
          }

          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [leads]);

  const fetchPendingAmcs = async (leadId) => {
    try {
      const res = await fetch(`/api/sales-amc?leadId=${leadId}&status=Pending`);
      const data = await res.json();
      if (res.ok) {
        setPendingAmcs(data.amcs || []);
      }
    } catch (error) {
      console.error("Error fetching pending AMCs:", error);
    }
  };

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

  const fetchLeads = async (searchQuery = "") => {
    try {
      const url = searchQuery
        ? `/api/sales-leads?limit=100&search=${encodeURIComponent(searchQuery)}`
        : "/api/sales-leads?limit=10000";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        if (searchQuery) {
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l.CM_Lead_ID));
            const newLeads = (data.leads || []).filter(l => !existingIds.has(l.CM_Lead_ID));
            return [...prev, ...newLeads];
          });
        } else {
          setLeads(data.leads || []);
        }
      }
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
    <div className="p-2 md:p-2 h-[calc(100vh-16px)] flex flex-col justify-between space-y-3 overflow-hidden text-gray-800 w-full max-w-full">
      <div className="flex flex-col flex-1 min-h-0 space-y-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-sm hover:bg-gray-400 transition-all shadow-md font-medium text-sm"
          >
            <Plus className="h-4 w-4" /> Record Payment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 !-mt-1">
          {[
            { label: "Total Collected", value: stats?.total_collection || 0, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-500" },
            { label: "Pending Amount", value: stats?.pending_amount || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-500" },
            { label: "Advance Payments", value: stats?.advance_payments || 0, icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-500" },
            { label: "Domain Payments", value: stats?.domain_payments || 0, icon: Receipt, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-500" },
            { label: "Final Payments", value: stats?.final_payments || 0, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-500" },
          ].map((s, i) => (
            <div key={i} className={`px-2 py-1.5 rounded-sm text-gray-800 border-l-4 ${s.border} ${s.bg} shadow-sm transition-transform hover:scale-[1.02]`}>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-0.5">{s.label}</p>
              <div className="flex items-center justify-between">
                <p className={`text-lg font-black ${s.color}`}>₹{Number(s.value).toLocaleString()}</p>
                <s.icon className={`h-4 w-4 ${s.color} opacity-40`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2 items-end text-gray-800 w-full overflow-visible pb-3 border-b px-2 !-mt-2">
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ref #, Remarks, Client..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none h-9 text-sm"
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Filter by Lead</label>
            <select
              value={leadFilter}
              onChange={(e) => { setLeadFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none h-9 text-sm"
            >
              <option value="">All Leads</option>
              {leads.map(l => <option key={l.CM_Lead_ID} value={l.CM_Lead_ID}>{l.CM_Client_Name} ({l.CM_Company_Name || "Ind"})</option>)}
            </select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none h-9 text-sm"
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
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
            className="flex items-center justify-center w-9 h-9 text-white bg-gray-600 hover:bg-gray-700 rounded-sm shadow-sm transition-all mb-[1px]"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col !-mt-2">
          {/* Desktop View */}
          <div className="hidden md:flex bg-white border border-gray-200 overflow-hidden shadow-sm rounded-sm flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="bg-[#eef2ff] text-blue-700 border-b border-slate-200">
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-12 text-center border border-slate-200 text-blue-700">#</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-32 border border-slate-200 text-blue-700">Date</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-48 border border-slate-200 text-blue-700">Lead / Company</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-40 border border-slate-200 text-blue-700">Payment Type</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-48 border border-slate-200 text-blue-700">Mode & Ref</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-32 border border-slate-200 text-blue-700">Amount</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-28 border border-slate-200 text-blue-700 text-center">Status</th>
                    <th className="px-3 py-2 text-[12px] font-bold uppercase w-28 border border-slate-200 text-blue-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="px-4 py-12 text-center border border-slate-200"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500 font-medium border border-slate-200">No records matching your search</td></tr>
                  ) : (
                    payments.map((p, idx) => (
                      <tr key={p.CM_Payment_ID} className={`hover:bg-blue-50/20 transition-colors border border-slate-200 ${idx % 2 === 0 ? 'bg-[#f4f7ff]/50' : 'bg-white'}`}>
                        <td className="px-3 py-2 text-[12px] text-gray-500 text-center border border-slate-200">{(page - 1) * limit + idx + 1}</td>
                        <td className="px-3 py-2 border border-slate-200">
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(p.CM_Payment_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td className="px-3 py-2 border border-slate-200">
                          <p className="text-sm font-bold text-gray-900 truncate">{p.CM_Client_Name}</p>
                          <p className="text-[12px] text-gray-500 truncate">{p.CM_Company_Name || "Individual"}</p>
                        </td>
                        <td className="px-3 py-2 border border-slate-200">
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold ${TYPE_COLORS[p.CM_Payment_Type]}`}>
                            {p.CM_Payment_Type}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-slate-200">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-gray-400" /> {p.CM_Payment_Mode}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{p.CM_Reference_Number || "No reference"}</p>
                        </td>
                        <td className="px-3 py-2 border border-slate-200">
                          <p className="text-sm font-black text-emerald-600">₹{Number(p.CM_Amount).toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-2 border border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold border ${STATUS_COLORS[p.CM_Payment_Status]}`}>
                            {p.CM_Payment_Status}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-slate-200 text-center">
                          <div className="flex justify-center gap-1.5">
                            {p.CM_Receipt_URL && (
                              <a
                                href={p.CM_Receipt_URL}
                                target="_blank"
                                className="w-7 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all hover:scale-105 shadow-sm"
                                title="View Receipt"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => openEditModal(p)}
                              className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all hover:scale-105 shadow-sm"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.CM_Payment_ID)}
                              className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all hover:scale-105 shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid View */}
          <div className="md:hidden overflow-y-auto divide-y divide-gray-100 flex-grow pb-4">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No payment records found</div>
            ) : (
              payments.map((p) => (
                <div key={p.CM_Payment_ID} className="p-4 bg-white space-y-3 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{p.CM_Client_Name}</p>
                      <p className="text-xs text-gray-500">{p.CM_Company_Name || "Individual"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${STATUS_COLORS[p.CM_Payment_Status]}`}>
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
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${TYPE_COLORS[p.CM_Payment_Type]}`}>
                        {p.CM_Payment_Type}
                      </span>
                      <span className="text-xs text-gray-500">{p.CM_Payment_Mode}</span>
                    </div>
                    <div className="flex gap-2">
                      {p.CM_Receipt_URL && (
                        <a href={p.CM_Receipt_URL} target="_blank" className="p-2 bg-blue-50 rounded text-blue-600 border border-blue-100">
                          <Receipt className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => openEditModal(p)} className="p-2 bg-gray-50 rounded text-gray-600 border border-gray-100">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.CM_Payment_ID)} className="p-2 bg-red-50 rounded text-red-600 border border-red-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination sticky bottom container */}
      {total > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 shadow-inner z-20">
          <p className="text-xs text-gray-600">
            Showing <span className="font-bold">{payments.length}</span> of <span className="font-bold">{total}</span> records
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-gray-300 rounded-sm disabled:opacity-30 hover:bg-gray-100 bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-sm text-xs font-bold border transition-all ${page === i + 1
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                      : "text-gray-600 border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-gray-300 rounded-sm disabled:opacity-30 hover:bg-gray-100 bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col text-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-800 text-white">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-400" />
                {selectedPayment ? "Update Payment Record" : "Record New Payment"}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setSelectedPayment(null); }} className="hover:bg-white/10 p-1.5 rounded-sm transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Client Selector & Outstanding Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-gray-700 uppercase">Select Lead *</label>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm pr-10 h-9"
                    />
                    {formData.CM_Lead_ID && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-extrabold text-sm">✓</span>
                    )}
                  </div>

                  {showLeadSuggestions && leadSearchText.trim() !== "" && (
                    <div className="absolute z-[70] left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-sm shadow-xl divide-y divide-gray-100">
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
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs font-medium flex flex-col gap-0.5"
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
                  <div className="p-3 bg-emerald-50 rounded-sm border border-emerald-200 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-0.5">Outstanding Balance</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-emerald-700">₹{Number(selectedLeadSummary.outstanding).toLocaleString()}</span>
                      <span className="text-xs text-gray-600">Expected: ₹{Number(selectedLeadSummary.expected_budget).toLocaleString()}</span>
                    </div>
                    {selectedLeadSummary.domain_paid > 0 && (
                      <div className="mt-1 pt-1 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Domain Payments</span>
                        <span className="text-xs font-bold text-teal-700">₹{Number(selectedLeadSummary.domain_paid).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Payment Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    value={formData.CM_Amount || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold text-sm h-9"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Payment Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.CM_Payment_Date || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Payment Type</label>
                  <select
                    value={formData.CM_Payment_Type || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Type: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
                  >
                    {PAYMENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Payment Mode</label>
                  <select
                    value={formData.CM_Payment_Mode || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Mode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online / GPay / PhonePe</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Status</label>
                  <select
                    value={formData.CM_Payment_Status || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Payment_Status: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
                  >
                    {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {formData.CM_Payment_Type === "AMC" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Link to Pending AMC Schedule *</label>
                  <select
                    required
                    value={formData.CM_AMC_ID || ""}
                    onChange={(e) => {
                      const selectedAmcId = e.target.value;
                      const selectedAmc = pendingAmcs.find(a => String(a.CM_AMC_ID) === String(selectedAmcId));
                      setFormData(prev => ({ 
                        ...prev, 
                        CM_AMC_ID: selectedAmcId,
                        CM_Amount: selectedAmc ? selectedAmc.CM_Amount : prev.CM_Amount
                      }));
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm h-9"
                  >
                    <option value="">-- Select Pending AMC --</option>
                    {pendingAmcs.map(amc => (
                      <option key={amc.CM_AMC_ID} value={amc.CM_AMC_ID}>
                        {amc.CM_Domain_Link || "No Domain Link"} - ₹{Number(amc.CM_Amount).toLocaleString("en-IN")} (Expires: {new Date(amc.CM_Expiry_Date).toLocaleDateString("en-IN")})
                      </option>
                    ))}
                  </select>
                  {pendingAmcs.length === 0 && formData.CM_Lead_ID && (
                    <p className="text-[11px] text-amber-600 font-bold mt-1">
                      ⚠️ No pending AMC schedules found for this client. You can create one manually in the AMC page.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Reference Number / Transaction ID</label>
                <input
                  type="text"
                  value={formData.CM_Reference_Number || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Reference_Number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm h-9"
                  placeholder="e.g. TXN123456789"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Remarks</label>
                <textarea
                  rows="2"
                  value={formData.CM_Remarks || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedPayment(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
          <div className="relative w-full max-w-md bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
            {/* Top Indicator Bar */}
            <div className={`h-1.5 w-full ${confirmConfig.type === 'danger'
                ? 'bg-red-600'
                : 'bg-amber-500'
              }`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center shadow-inner ${confirmConfig.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-amber-100 text-amber-600'
                  }`}>
                  <AlertCircle size={22} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {confirmConfig.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {confirmConfig.message}
                  </p>
                </div>

                <button
                  onClick={closeConfirm}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-sm transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold transition-all"
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
                  className={`px-5 py-2 rounded-sm text-xs font-bold shadow-md transition-all active:scale-95 text-white ${confirmConfig.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-500 hover:bg-amber-600'
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
