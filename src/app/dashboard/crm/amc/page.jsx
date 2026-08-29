"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Plus, Search, Filter, IndianRupee,
  ChevronLeft, ChevronRight, X, Check, Eye, Trash2, Edit2,
  Loader2, AlertCircle, CheckCircle2, RotateCcw, Building2, ShieldAlert, Clock
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthScreenStore";
import toast from "react-hot-toast";

const AMC_STATUS_OPTIONS = ["Pending", "Paid", "Expired"];

const STATUS_COLORS = {
  "Pending": "bg-amber-100 text-amber-700 border-amber-200",
  "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Expired": "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AMCPage() {
  const { user } = useAuthStore();
  const [amcs, setAmcs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState(null);
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
    CM_Domain_Link: "",
    CM_Start_Date: "",
    CM_Expiry_Date: "",
    CM_Amount: "",
    CM_Status: "Pending",
    CM_AMC_Type: "Website"
  });

  const [products, setProducts] = useState([]);
  const [productSearchText, setProductSearchText] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  useEffect(() => {
    fetchAmcs();
  }, [page, typeFilter, statusFilter, search, fromDate, toDate]);

  useEffect(() => {
    fetchLeads();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/master/visit-products?active=true");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (!isModalOpen || !leadSearchText.trim() || formData.CM_Lead_ID) return;
    const timer = setTimeout(() => {
      fetchLeads(leadSearchText.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [leadSearchText, isModalOpen, formData.CM_Lead_ID]);

  const fetchAmcs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: typeFilter,
        status: statusFilter,
        search,
        fromDate,
        toDate
      });
      const res = await fetch(`/api/sales-amc?${params}`);
      const data = await res.json();
      if (res.ok) {
        setAmcs(data.amcs || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
      }
    } catch (error) {
      toast.error("Failed to fetch AMC records");
    } finally {
      setLoading(false);
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
      console.error("Error fetching leads:", error);
    }
  };

  const openAddModal = () => {
    setFormData({
      CM_Lead_ID: "",
      CM_Domain_Link: "",
      CM_Start_Date: new Date().toISOString().split('T')[0],
      CM_Expiry_Date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      CM_Amount: "",
      CM_Status: "Pending",
      CM_AMC_Type: "Website"
    });
    setLeadSearchText("");
    setProductSearchText("");
    setSelectedAmc(null);
    setIsModalOpen(true);
  };

  const openEditModal = (amc) => {
    setSelectedAmc(amc);
    setFormData({
      CM_Lead_ID: amc.CM_Lead_ID,
      CM_Domain_Link: amc.CM_Domain_Link || "",
      CM_Start_Date: amc.CM_Start_Date ? amc.CM_Start_Date.split('T')[0] : "",
      CM_Expiry_Date: amc.CM_Expiry_Date ? amc.CM_Expiry_Date.split('T')[0] : "",
      CM_Amount: amc.CM_Amount,
      CM_Status: amc.CM_Status,
      CM_AMC_Type: amc.CM_AMC_Type || "Website"
    });
    setLeadSearchText(`${amc.CM_Client_Name} - ${amc.CM_Company_Name || "Individual"}`);
    setProductSearchText(amc.CM_AMC_Type === "Product" ? (amc.CM_Domain_Link || "") : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.CM_Lead_ID) {
      toast.error("Please select a Lead/Client");
      return;
    }
    try {
      setIsSubmitting(true);
      const url = selectedAmc ? `/api/sales-amc?_method=PUT` : "/api/sales-amc";
      const payload = {
        ...formData,
        CM_Created_By: user?.CM_Full_Name || "System",
        CM_Updated_By: user?.CM_Full_Name || "System"
      };
      if (selectedAmc) {
        payload.CM_AMC_ID = selectedAmc.CM_AMC_ID;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(selectedAmc ? "AMC updated successfully" : "AMC added successfully");
        setIsModalOpen(false);
        fetchAmcs();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save AMC");
      }
    } catch (error) {
      toast.error("Error saving AMC record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (amcId) => {
    showConfirm({
      title: "Delete AMC Record",
      message: "Are you sure you want to delete this AMC record? This action cannot be undone.",
      confirmText: "Yes, Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales-amc?_method=DELETE`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              CM_AMC_ID: amcId,
              CM_Updated_By: user?.CM_Full_Name || "System"
            })
          });
          if (res.ok) {
            toast.success("AMC record deleted");
            fetchAmcs();
          } else {
            toast.error("Failed to delete AMC");
          }
        } catch (error) {
          toast.error("Error deleting AMC");
        }
      }
    });
  };

  const resetFilters = () => {
    setLeadFilter("");
    setStatusFilter("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="h-[calc(100vh-16px)] flex flex-col justify-between overflow-hidden bg-white p-2 text-gray-800">

      {/* Top Section */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Annual Maintenance Contracts (AMC)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track client domain and project renewals</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-all shadow-md font-bold text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add AMC Schedule
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 !-mt-1">
          {[
            { label: "Total AMCs", value: stats?.total_count || 0, isCurrency: false, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-500" },
            { label: "Total Value", value: stats?.total_amount || 0, isCurrency: true, icon: IndianRupee, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-500" },
            { label: "Collected Amount", value: stats?.paid_amount || 0, isCurrency: true, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-500" },
            { label: "Pending Amount", value: stats?.pending_amount || 0, isCurrency: true, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-500" },
            { label: "Expiring (10 Days)", value: stats?.expiring_count || 0, isCurrency: false, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-500" },
          ].map((s, i) => (
            <div key={i} className={`px-2 py-1.5 rounded-sm text-gray-800 border-l-4 ${s.border} ${s.bg} shadow-sm transition-transform hover:scale-[1.02]`}>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-0.5">{s.label}</p>
              <div className="flex items-center justify-between">
                <p className={`text-lg font-black ${s.color}`}>
                  {s.isCurrency ? "₹" : ""}{Number(s.value).toLocaleString("en-IN")}
                </p>
                <s.icon className={`h-4 w-4 ${s.color} opacity-40`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 p-2.5 rounded-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 flex-wrap flex-1 w-full">

            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search domain, client, or company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-xs h-8 bg-white"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            </div>

            {/* Filter by AMC Type */}
            <div className="w-36 flex-shrink-0">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-xs h-8 bg-white font-semibold text-gray-700"
              >
                <option value="">All AMC Types</option>
                <option value="Website">Website</option>
                <option value="Product">Product</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="w-36 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-xs h-8 bg-white font-semibold text-gray-700"
              >
                <option value="">All Statuses</option>
                {AMC_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-xs h-8 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-xs h-8 bg-white"
              />
            </div>

            {(typeFilter || statusFilter || search || fromDate || toDate) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-sm text-xs font-bold transition-all h-8 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto my-3 border border-slate-200 rounded-sm shadow-inner min-h-0 bg-slate-50/20">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Loading AMC records...</p>
          </div>
        ) : amcs.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center gap-2.5 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No AMC Records Found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No AMC schedules match your filters. Create a new AMC record to get started.</p>
          </div>
        ) : (
          <table className="w-full min-w-[1000px] text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-[#eef2ff] text-blue-700">
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-12 text-center border border-slate-200 text-blue-700">#</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-48 border border-slate-200 text-blue-700">Client / Lead</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-52 border border-slate-200 text-blue-700">Type & Target</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-28 border border-slate-200 text-blue-700">Start Date</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-28 border border-slate-200 text-blue-700">Expiry Date</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-32 border border-slate-200 text-blue-700 text-right">AMC Amount</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-24 border border-slate-200 text-blue-700 text-center">Status</th>
                <th className="px-2 py-2 text-[12px] font-bold uppercase w-24 border border-slate-200 text-blue-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {amcs.map((amc, idx) => {
                const isExpired = amc.CM_Status === 'Expired' || (amc.CM_Status === 'Pending' && new Date(amc.CM_Expiry_Date) < new Date());
                const statusLabel = isExpired ? 'Expired' : amc.CM_Status;
                const daysLeft = Math.ceil((new Date(amc.CM_Expiry_Date).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

                return (
                  <tr
                    key={amc.CM_AMC_ID}
                    className={`hover:bg-blue-50/20 transition-colors ${idx % 2 === 0 ? "bg-[#f4f7ff]/50" : "bg-white"}`}
                  >
                    <td className="px-2 py-2 text-[12px] text-gray-500 text-center border border-slate-200">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-snug">{amc.CM_Client_Name}</span>
                        <span className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {amc.CM_Company_Name || "Individual"}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-sm">
                      {amc.CM_AMC_Type === "Product" ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-bold rounded-full w-fit">Product</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate">{amc.CM_Domain_Link || "—"}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full w-fit">Website</span>
                          {amc.CM_Domain_Link ? (
                            <a href={amc.CM_Domain_Link.startsWith('http') ? amc.CM_Domain_Link : `https://${amc.CM_Domain_Link}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 font-mono text-[11px] truncate">
                              {amc.CM_Domain_Link}
                            </a>
                          ) : "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-[13px] text-slate-600">
                      {amc.CM_Start_Date ? new Date(amc.CM_Start_Date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-2 py-2 border border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 text-[13px]">
                          {amc.CM_Expiry_Date ? new Date(amc.CM_Expiry_Date).toLocaleDateString("en-IN") : "—"}
                        </span>
                        {amc.CM_Status === 'Pending' && (
                          <span className={`text-[12px] font-bold ${daysLeft < 0 ? "text-red-500" : daysLeft <= 10 ? "text-orange-500 animate-pulse" : "text-slate-400"}`}>
                            {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : daysLeft === 0 ? "Expires Today" : `${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-right font-bold text-slate-800 text-[12px]">
                      ₹{Number(amc.CM_Amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-center">
                      <span className={`inline-block text-[12px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[statusLabel]}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(amc)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all hover:scale-105 shadow-sm border border-slate-200 cursor-pointer"
                          title="Edit AMC"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(amc.CM_AMC_ID)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-all hover:scale-105 shadow-sm border border-rose-100 cursor-pointer"
                          title="Delete AMC"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 p-2.5 rounded-sm flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
          Showing {amcs.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total} Records
        </span>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-7 h-7 rounded-sm flex items-center justify-center border border-gray-300 hover:bg-white transition-colors disabled:opacity-40 cursor-pointer bg-white"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 h-7 flex items-center justify-center text-xs font-bold border border-gray-300 rounded-sm bg-white">
            {page}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage(page + 1)}
            className="w-7 h-7 rounded-sm flex items-center justify-center border border-gray-300 hover:bg-white transition-colors disabled:opacity-40 cursor-pointer bg-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Manual Entry Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">

            {/* Header Banner */}
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 rounded-t-sm">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                {selectedAmc ? "Edit AMC Details" : "Record New AMC Details"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Searchable Client Input */}
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-gray-700 uppercase">Select Client / Lead *</label>
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

                {/* Suggestions Dropdown */}
                {showLeadSuggestions && leadSearchText.trim() !== "" && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-sm text-sm">
                    {filteredLeads.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center">No leads found matching "{leadSearchText}"</div>
                    ) : (
                      filteredLeads.map(l => (
                        <div
                          key={l.CM_Lead_ID}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, CM_Lead_ID: l.CM_Lead_ID }));
                            setLeadSearchText(`${l.CM_Client_Name} - ${l.CM_Company_Name || "Individual"}`);
                            setShowLeadSuggestions(false);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 transition-colors flex flex-col"
                        >
                          <span className="font-bold text-gray-800 text-xs">{l.CM_Client_Name}</span>
                          <span className="text-[10px] text-gray-500">{l.CM_Company_Name || "Individual"} ({l.CM_Phone})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* AMC Type Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">AMC Type</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="CM_AMC_Type"
                      value="Website"
                      checked={formData.CM_AMC_Type === "Website"}
                      onChange={() => {
                        setFormData(prev => ({ ...prev, CM_AMC_Type: "Website", CM_Domain_Link: "" }));
                        setProductSearchText("");
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    Website / Domain
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="CM_AMC_Type"
                      value="Product"
                      checked={formData.CM_AMC_Type === "Product"}
                      onChange={() => {
                        setFormData(prev => ({ ...prev, CM_AMC_Type: "Product", CM_Domain_Link: "" }));
                        setProductSearchText("");
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    Product
                  </label>
                </div>
              </div>

              {/* Conditional Input based on AMC Type */}
              {formData.CM_AMC_Type === "Website" ? (
                /* Domain Link */
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Domain Link / Website Address *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. www.clientwebsite.com"
                    value={formData.CM_Domain_Link || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Domain_Link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm h-9"
                  />
                </div>
              ) : (
                /* Product Search Selection */
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-gray-700 uppercase">Select Product *</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="Search and select product..."
                      value={productSearchText}
                      onFocus={() => setShowProductSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowProductSuggestions(false), 250)}
                      onChange={(e) => {
                        setProductSearchText(e.target.value);
                        setShowProductSuggestions(true);
                        if (formData.CM_Domain_Link) {
                          setFormData(prev => ({ ...prev, CM_Domain_Link: "" }));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm pr-10 h-9"
                    />
                    {formData.CM_Domain_Link && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-extrabold text-sm">✓</span>
                    )}
                  </div>

                  {/* Product Suggestions Dropdown */}
                  {showProductSuggestions && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-sm text-sm">
                      {products.filter(p =>
                        p.Product_Name?.toLowerCase().includes(productSearchText.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 text-center">No active products found</div>
                      ) : (
                        products
                          .filter(p => p.Product_Name?.toLowerCase().includes(productSearchText.toLowerCase()))
                          .map(p => (
                            <div
                              key={p.Product_ID}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, CM_Domain_Link: p.Product_Name }));
                                setProductSearchText(p.Product_Name);
                                setShowProductSuggestions(false);
                              }}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-50 transition-colors text-xs font-semibold text-gray-800"
                            >
                              {p.Product_Name}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Start Date & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.CM_Start_Date || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Start_Date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Expiry Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.CM_Expiry_Date || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Expiry_Date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm h-9"
                  />
                </div>
              </div>

              {/* AMC Amount & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">AMC Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    value={formData.CM_Amount || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Status</label>
                  <select
                    value={formData.CM_Status || ""}
                    onChange={(e) => setFormData({ ...formData, CM_Status: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-xs h-9 bg-white"
                  >
                    {AMC_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 text-xs cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {selectedAmc ? "Update AMC" : "Save AMC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
            <div className={`h-1.5 w-full ${confirmConfig.type === 'danger' ? 'bg-red-600' : 'bg-amber-500'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center shadow-inner ${confirmConfig.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <ShieldAlert size={22} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{confirmConfig.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{confirmConfig.message}</p>
                </div>
                <button onClick={closeConfirm} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-sm transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={closeConfirm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold transition-all cursor-pointer">
                  {confirmConfig.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = confirmConfig.onConfirm;
                    closeConfirm();
                    if (action) action();
                  }}
                  className={`px-5 py-2 rounded-sm text-xs font-bold shadow-md transition-all active:scale-95 text-white cursor-pointer ${confirmConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
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
