"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin, Plus, Search, Filter, Calendar, User, Clock,
  ChevronLeft, ChevronRight, X, Check, Eye, Trash2, Edit2,
  Image as ImageIcon, MoreVertical, Loader2, AlertCircle,
  ArrowRight, CheckCircle2, MessageSquare, Phone,
  TrendingUp, Activity, ClipboardList, Info, Settings
} from "lucide-react";
import { FiRotateCcw } from "react-icons/fi";
import { useAuthStore } from "../../../store/useAuthScreenStore";
import toast from "react-hot-toast";
import VisitStatusMasterPage from "../master/visit-status/page";
import VisitProductsMasterPage from "../master/visit-products/page";

function VisitsContent() {
  const { user } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [industrials, setIndustrials] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusColorsMap, setStatusColorsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10000);
  const [leadFilter, setLeadFilter] = useState("");
  const [execFilter, setExecFilter] = useState("");
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "");
  const [productOptions, setProductOptions] = useState([]);
  const [productColorsMap, setProductColorsMap] = useState({});
  const [productFilter, setProductFilter] = useState(() => searchParams.get("product") || "");
  const [pendingOnly, setPendingOnly] = useState(() => searchParams.get("pending") === "true");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
    const product = searchParams.get("product");
    if (product) {
      setProductFilter(product);
    }
    const pending = searchParams.get("pending");
    if (pending === "true") {
      setPendingOnly(true);
    } else if (pending === "false") {
      setPendingOnly(false);
    }
  }, [searchParams]);
  const [industrialFilter, setIndustrialFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateQuickFilter, setDateQuickFilter] = useState(""); // 'today' | 'yesterday' | ''
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isManageStatusModalOpen, setIsManageStatusModalOpen] = useState(false);
  const [isManageProductModalOpen, setIsManageProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table or timeline

  const [leadSearchText, setLeadSearchText] = useState("");
  const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);

  const filteredLeads = useMemo(() => {
    const query = leadSearchText.trim().toLowerCase();
    if (!query) return [];
    // Split by non-alphanumeric characters to get search tokens
    const tokens = query.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return leads.filter(l => {
      const clientName = (l.CM_Client_Name || "").toLowerCase();
      const companyName = (l.CM_Company_Name || "").toLowerCase();
      const targetText = `${clientName} ${companyName}`;
      // Every search token must exist in client or company name
      return tokens.every(token => targetText.includes(token));
    });
  }, [leads, leadSearchText]);

  const [formData, setFormData] = useState({
    CM_Lead_ID: "",
    CM_Sales_Executive_ID: user?.id || "",
    CM_Visit_Date: new Date().toISOString().split('T')[0],
    CM_Purpose: "",
    CM_Product_Discussed: "",
    CM_Scope_Given: "",
    CM_Demo_Given: "No",
    CM_Proposal_Value: "",
    CM_GST_Type: "Exclusive",
    CM_Scope_Alteration: "",
    CM_Value_Alteration: "",
    CM_Further_Enhancement: "",
    CM_Issues_Raised: "",
    CM_Project_Handed_Over: "No",
    CM_Trial_Version_Given: "No",
    CM_Next_Followup_Date: "",
    CM_Visit_Status: "Follow-up Needed",
    CM_Visit_Products: "",
    CM_Remarks: "",
    CM_Images: []
  });

  useEffect(() => {
    fetchIndustrials();
    fetchFilterCategories("");
    fetchStatuses();
    fetchProducts();
    fetchLeads();
    fetchExecutives();
  }, []);

  useEffect(() => {
    fetchFilterCategories(industrialFilter);
  }, [industrialFilter]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchVisits();
    }
  }, [leadFilter, execFilter, statusFilter, productFilter, fromDate, toDate, debouncedSearch, industrialFilter, categoryFilter, pendingOnly]);

  // Fetch visits when page changes
  useEffect(() => {
    fetchVisits();
  }, [page]);

  const fetchFilterCategories = async (industrialId) => {
    try {
      const url = industrialId
        ? `/api/sales-industrial?type=categories&industrialId=${industrialId}`
        : "/api/sales-industrial?type=categories";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setFilterCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/master/visit-status?active=true");
      const data = await res.json();
      if (data.success) {
        setStatusOptions(data.data.map(s => s.Status_Name));
        const colors = {};
        data.data.forEach(s => {
          colors[s.Status_Name] = `bg-${s.Color_Code}-100 text-${s.Color_Code}-700 border-${s.Color_Code}-200`;
        });
        setStatusColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit statuses", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/master/visit-products?active=true");
      const data = await res.json();
      if (data.success) {
        setProductOptions(data.data.map(p => p.Product_Name));
        const colors = {};
        data.data.forEach(p => {
          colors[p.Product_Name] = `bg-${p.Color_Code}-100 text-${p.Color_Code}-700 border-${p.Color_Code}-200`;
        });
        setProductColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit products", err);
    }
  };

  const fetchIndustrials = async () => {
    try {
      const res = await fetch("/api/sales-industrial?type=industrials");
      const data = await res.json();
      if (res.ok) setIndustrials(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        leadId: leadFilter,
        executiveId: execFilter,
        status: statusFilter,
        product: productFilter,
        fromDate: fromDate,
        toDate: toDate,
        search: debouncedSearch,
        industrialId: industrialFilter,
        categoryId: categoryFilter,
        pending: pendingOnly ? "true" : "false"
      });
      const res = await fetch(`/api/sales-visits?${params}`);
      const data = await res.json();
      if (res.ok) {
        setVisits(data.visits);
        setTotal(data.total);
      }
    } catch (error) {
      toast.error("Failed to fetch visits");
    } finally {
      setLoading(false);
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

  const fetchExecutives = async () => {
    try {
      const res = await fetch("/api/sales-leads?type=executives");
      const data = await res.json();
      if (res.ok) setExecutives(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openAddModal = () => {
    setFormData({
      CM_Lead_ID: "",
      CM_Sales_Executive_ID: (user?.CM_User_ID || user?.id) && executives.some(e => e.CM_User_ID == (user?.CM_User_ID || user?.id)) ? (user?.CM_User_ID || user?.id) : "",
      CM_Visit_Date: new Date().toISOString().split('T')[0],
      CM_Purpose: "",
      CM_Product_Discussed: "",
      CM_Scope_Given: "",
      CM_Demo_Given: "No",
      CM_Proposal_Value: "",
      CM_GST_Type: "Exclusive",
      CM_Scope_Alteration: "",
      CM_Value_Alteration: "",
      CM_Further_Enhancement: "",
      CM_Issues_Raised: "",
      CM_Project_Handed_Over: "No",
      CM_Trial_Version_Given: "No",
      CM_Next_Followup_Date: "",
      CM_Visit_Status: "Follow-up Needed",
      CM_Visit_Products: "",
      CM_Remarks: "",
      CM_Images: []
    });
    setLeadSearchText("");
    setSelectedVisit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (visit) => {
    setFormData({ ...visit });
    const matchingLead = leads.find(l => l.CM_Lead_ID == visit.CM_Lead_ID);
    setLeadSearchText(matchingLead ? `${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}` : "");
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = selectedVisit ? "PUT" : "POST";
      const url = selectedVisit ? `/api/sales-visits?_method=PUT` : "/api/sales-visits";
      const payload = {
        ...formData,
        CM_Created_By: user?.CM_User_ID || user?.name || user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.name || user?.CM_User_ID || user?.id
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(selectedVisit ? "Visit updated" : "Visit logged");
        setIsModalOpen(false);
        fetchVisits();
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

  const handleDelete = async (visitId) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/sales-visits?_method=DELETE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CM_Visit_ID: visitId, CM_Updated_By: user?.id })
      });
      if (res.ok) {
        toast.success("Visit deleted");
        fetchVisits();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-4 min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {pendingOnly ? (
              <Clock className="h-7 w-7 text-amber-500 animate-pulse" />
            ) : (
              <MapPin className="h-7 w-7 text-indigo-600" />
            )}
            {pendingOnly ? "Pending Follow-ups" : "Visit Tracking"}
          </h1>
          <p className="text-sm text-gray-500">
            {pendingOnly ? "View and manage pending customer follow-ups (Interested / Follow-up Needed)" : "Record and track customer visits and demos"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex p-1 bg-gray-200 rounded-lg shadow-inner">
            <button
              onClick={() => { setPendingOnly(false); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!pendingOnly ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              All Visits
            </button>
            <button
              onClick={() => { setPendingOnly(true); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${pendingOnly ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              Pending Follow-ups
            </button>
          </div>

          <div className="flex p-1 bg-gray-200 rounded-lg shadow-inner">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "timeline" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              Timeline
            </button>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all shadow-md font-medium"
          >
            <Plus className="h-4 w-4" /> Add Visit / Calls
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 items-end text-gray-800 w-full overflow-visible pb-3 pt-2 sticky top-0 z-20 shadow-sm border-b px-2">
        <div className="col-span-2 md:col-span-3 xl:col-span-1 w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search purpose, client, remarks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Product</label>
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
          >
            <option value="">All Products</option>
            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Executive</label>
          <select
            value={execFilter}
            onChange={(e) => { setExecFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
          >
            <option value="">All Executives</option>
            {executives.map(e => <option key={e.CM_User_ID} value={e.CM_User_ID}>{e.CM_Full_Name}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Industrial</label>
          <select
            value={industrialFilter}
            onChange={(e) => {
              setIndustrialFilter(e.target.value);
              setCategoryFilter("");
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
          >
            <option value="">All Industrials</option>
            {industrials.map(i => <option key={i.CM_Industrial_ID} value={i.CM_Industrial_ID}>{i.CM_Industrial_Name}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px] text-sm font-medium"
          >
            <option value="">All Categories</option>
            {filterCategories.map(c => (
              <option key={c.CM_Category_ID} value={c.CM_Category_ID}>{c.CM_Category_Name}</option>
            ))}
          </select>
        </div>

        {/* Today / Yesterday Quick Filters */}
        <div className="flex flex-col gap-1 w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Quick Filter</label>
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                setFromDate(todayStr);
                setToDate(todayStr);
                setDateQuickFilter('today');
                setPage(1);
              }}
              className={`px-1 py-2 text-[11px] font-bold rounded-lg border transition-all h-[42px] w-full ${dateQuickFilter === 'today'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600'
                }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                setFromDate(yesterdayStr);
                setToDate(yesterdayStr);
                setDateQuickFilter('yesterday');
                setPage(1);
              }}
              className={`px-1 py-2 text-[11px] font-bold rounded-lg border transition-all h-[42px] w-full ${dateQuickFilter === 'yesterday'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600'
                }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
            {pendingOnly ? "Followup From" : "From Date"}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setDateQuickFilter(""); setPage(1); }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm font-medium h-[42px]"
          />
        </div>

        <div className="w-full">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
            {pendingOnly ? "Followup To" : "To Date"}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setDateQuickFilter(""); setPage(1); }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm font-medium h-[42px]"
          />
        </div>

        <button
          onClick={() => {
            setSearch("");
            setStatusFilter("");
            setProductFilter("");
            setExecFilter("");
            setIndustrialFilter("");
            setCategoryFilter("");
            setDateQuickFilter("");
            setFromDate("");
            setToDate("");
            setPage(1);
          }}
          className="flex items-center justify-center w-[42px] h-[42px] text-white bg-gray-600 hover:bg-gray-700 rounded-lg shadow-sm transition-all"
          title="Reset Filters"
        >
          <FiRotateCcw size={18} />
        </button>
      </div>

      {/* Content Area */}
      {viewMode === "table" ? (
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-10 text-center border border-gray-300">#</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-25 border border-gray-300">Visit Date</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-48 border border-gray-300">Client / Company</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-64 border border-gray-300">Purpose & Description</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-25 border border-gray-300">Next Followup</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-28 border border-gray-300">Status</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-28 border border-gray-300">Product</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-24 text-center border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-12 text-center border border-gray-300"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : visits.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-2 text-center text-gray-500 border border-gray-300">No visits found</td></tr>
                ) : (
                  Object.entries(
                    visits.reduce((acc, v) => {
                      const execName = v.Executive_Name || "Unassigned";
                      if (!acc[execName]) acc[execName] = [];
                      acc[execName].push(v);
                      return acc;
                    }, {})
                  ).map(([execName, execVisits]) => (
                    <React.Fragment key={execName}>
                      <tr className="bg-gray-100">
                        <td colSpan="8" className="px-2 py-1.5 font-bold text-gray-800 border border-gray-300">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-sm text-blue-600">{execName}</span> <span className="text-[10px] font-normal text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-sm border border-gray-300">{execVisits.length} Visits</span>
                          </div>
                        </td>
                      </tr>
                      {execVisits.map((v, idx) => (
                        <tr key={v.CM_Visit_ID} className="hover:bg-blue-50/20 transition-colors cursor-pointer bg-white">
                          <td className="px-2 py-1 text-[11px] text-gray-500 text-center border border-gray-300">{(page - 1) * limit + idx + 1}</td>
                          <td className="px-2 py-1 border border-gray-300">
                            <p className="text-sm font-medium text-gray-700">
                              {new Date(v.CM_Visit_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            {v.CM_Visit_Time && (
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {new Date(`2000-01-01T${v.CM_Visit_Time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            <p className="text-sm font-bold text-gray-900 truncate">{v.CM_Client_Name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{v.CM_Company_Name || "Individual"}</p>
                            {(v.CM_Industrial_Name || v.CM_Category_Name) && (
                              <p className="text-[10px] text-indigo-600 font-semibold truncate mt-0.5">
                                {v.CM_Industrial_Name}{v.CM_Category_Name ? ` - ${v.CM_Category_Name}` : ""}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            <p className="text-sm font-bold text-blue-700 truncate flex items-center gap-1">
                              <Activity className="h-3 w-3" /> {v.CM_Purpose}
                            </p>
                            <p className="text-[12px] text-gray-600 line-clamp-2">{v.CM_Remarks || "No additional remarks"}</p>
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {v.CM_Next_Followup_Date ? (
                              <>
                                <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {new Date(v.CM_Next_Followup_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                </p>
                                {v.CM_Next_Followup_Time && (
                                  <p className="text-[10px] text-gray-500 mt-0.5 pl-4">
                                    {v.CM_Next_Followup_Time}
                                  </p>
                                )}
                              </>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-1 border border-gray-300 text-center">
                            <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-bold border ${statusColorsMap[v.CM_Visit_Status] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                              {v.CM_Visit_Status}
                            </span>
                          </td>
                          <td className="px-2 py-1 border border-gray-300 text-center">
                            {v.CM_Visit_Products && (
                              <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-bold border ${productColorsMap[v.CM_Visit_Products] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                                {v.CM_Visit_Products}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 border border-gray-300 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => openEditModal(v)} className="text-gray-500 hover:text-blue-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDelete(v.CM_Visit_ID)} className="text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100 pl-10">
          {visits.map((v) => (
            <div key={v.CM_Visit_ID} className="relative group">
              <div className="absolute -left-[35px] top-4 w-8 h-8 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                <MapPin className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all">
                {/* Timeline Item Header (Excel Style Row) */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <div className="flex-1 flex items-center gap-4">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">#{v.CM_Visit_ID}</span>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      {new Date(v.CM_Visit_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border-l border-gray-200 pl-4">
                      <User className="h-4 w-4 text-gray-600" />
                      {v.Executive_Name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.CM_Visit_Products && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${productColorsMap[v.CM_Visit_Products] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {v.CM_Visit_Products}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusColorsMap[v.CM_Visit_Status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                      {v.CM_Visit_Status}
                    </span>
                  </div>
                </div>

                {/* Timeline Item Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-gray-100">
                  <div className="p-4 col-span-1">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Client / Company</p>
                    <p className="text-sm font-bold text-gray-900">{v.CM_Client_Name}</p>
                    <p className="text-xs text-gray-500">{v.CM_Company_Name || "Individual"}</p>
                    {(v.CM_Industrial_Name || v.CM_Category_Name) && (
                      <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                        {v.CM_Industrial_Name}{v.CM_Category_Name ? ` - ${v.CM_Category_Name}` : ""}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-600">
                      <Phone className="h-3 w-3" /> {v.CM_Phone}
                    </div>
                  </div>

                  <div className="p-4 col-span-2 bg-gray-50/30">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Purpose & Discussion</p>
                    <p className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> {v.CM_Purpose}
                    </p>
                    <p className="mt-2 text-xs text-gray-600 italic border-t border-gray-100 pt-2">{v.CM_Remarks || "No additional remarks recorded"}</p>
                  </div>

                  <div className="p-4 col-span-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Financial / Followup</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Proposal:</span>
                          <span className="text-sm font-bold text-indigo-600">₹{Number(v.CM_Proposal_Value || 0).toLocaleString()}</span>
                        </div>
                        {v.CM_Next_Followup_Date && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Next:</span>
                              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(v.CM_Next_Followup_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                              </span>
                            </div>
                            {v.CM_Next_Followup_Time && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Time:</span>
                                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {v.CM_Next_Followup_Time}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => openEditModal(v)} className="flex-1 p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-all border border-gray-100 flex items-center justify-center">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(v.CM_Visit_ID)} className="flex-1 p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-all border border-gray-100 flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm text-gray-800">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-500 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {selectedVisit ? "Update Visit Log" : "Log New Client Visit"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Select Lead *</label>
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
                      // Clear the selected lead ID if they type something new
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

                {/* Suggestions List Dropdown */}
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
                {/* Hidden input to enforce html5 required field validation on the selected ID */}
                <input
                  type="hidden"
                  name="CM_Lead_ID"
                  value={formData.CM_Lead_ID || ""}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Visit Date *</label>
                <input
                  required
                  type="date"
                  value={formData.CM_Visit_Date || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Visit_Date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Purpose of Visit *</label>
                <input
                  required
                  type="text"
                  value={formData.CM_Purpose || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Purpose: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  placeholder="e.g. Site Survey, Product Demo, Negotiation..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sales Executive</label>
                <select
                  value={formData.CM_Sales_Executive_ID || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Sales_Executive_ID: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Executive</option>
                  {executives.map(e => <option key={e.CM_User_ID} value={e.CM_User_ID}>{e.CM_Full_Name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Next Follow-up Date</label>
                <input
                  type="date"
                  value={formData.CM_Next_Followup_Date || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Followup_Date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Next Follow-up Time</label>
                <input
                  type="time"
                  value={formData.CM_Next_Followup_Time || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Followup_Time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Demo Given?</span>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-inner">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} type="button" onClick={() => setFormData({ ...formData, CM_Demo_Given: opt })} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${formData.CM_Demo_Given === opt ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Handed Over?</span>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-inner">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} type="button" onClick={() => setFormData({ ...formData, CM_Project_Handed_Over: opt })} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${formData.CM_Project_Handed_Over === opt ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0">Visit Status</label>
                  <button type="button" onClick={() => setIsManageStatusModalOpen(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100">
                    <Settings size={12} /> Manage Options
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(s => (
                    <button key={s} type="button" onClick={() => setFormData({ ...formData, CM_Visit_Status: s })} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.CM_Visit_Status === s ? `${statusColorsMap[s] || "bg-blue-100 text-blue-700 border-blue-200"} shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0">Visit Product</label>
                  <button type="button" onClick={() => setIsManageProductModalOpen(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100">
                    <Settings size={12} /> Manage Options
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ ...formData, CM_Visit_Products: "" })} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${!formData.CM_Visit_Products ? `bg-gray-100 text-gray-700 border-gray-300 shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>None</button>
                  {productOptions.map(p => (
                    <button key={p} type="button" onClick={() => setFormData({ ...formData, CM_Visit_Products: p })} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${formData.CM_Visit_Products === p ? `${productColorsMap[p] || "bg-blue-100 text-blue-700 border-blue-200"} shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{p}</button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Detailed Remarks & Issues</label>
                <textarea
                  rows="3"
                  value={formData.CM_Remarks || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring focus:ring-blue-500 outline-none resize-none"
                  placeholder="Record what was discussed, any issues raised, scope changes..."
                />
              </div>

              <div className="md:col-span-2 py-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-50 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 shadow-xl shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {selectedVisit ? "Update Log Entry" : "Save Visit Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Statuses Modal */}
      {isManageStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
            <div className="pt-2 pb-6">
              <VisitStatusMasterPage onClose={() => { setIsManageStatusModalOpen(false); fetchStatuses(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Manage Products Modal */}
      {isManageProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
            <div className="pt-2 pb-6">
              <VisitProductsMasterPage onClose={() => { setIsManageProductModalOpen(false); fetchProducts(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-500 font-medium">Loading visits...</div>}>
      <VisitsContent />
    </Suspense>
  );
}
