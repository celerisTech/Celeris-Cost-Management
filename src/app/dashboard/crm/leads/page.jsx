"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Target, Plus, Search, Filter, Download, MoreVertical,
  Edit2, Trash2, Eye, Phone, Mail, MapPin, Building2,
  Calendar, User, ChevronLeft, ChevronRight, X, Check,
  ExternalLink, ArrowRight, Loader2, AlertCircle, Star,
  CheckCircle2, Clock, MessageSquare, ClipboardList, Receipt, Settings
} from "lucide-react";
import { FiRotateCcw } from "react-icons/fi";
import { useAuthStore } from "../../../store/useAuthScreenStore";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import VisitStatusMasterPage from "../master/visit-status/page";
import VisitProductsMasterPage from "../master/visit-products/page";
import VisitFormModal from "../components/VisitFormModal";
import LeadFormModal from "../components/LeadFormModal";

const STATUS_OPTIONS = [
  "New Lead", "Follow-up Call", "Visited", "Demo Given", "Proposal Sent",
  "Negotiation", "Converted", "Rejected", "On Hold", "Follow Up"
];

const SOURCE_OPTIONS = [
  "Direct", "Referral", "Website", "Social Media", "Exhibition", "Cold Call", "Other"
];

const STATUS_COLORS = {
  "New Lead": "bg-blue-100 text-blue-700 border-blue-200",
  "Follow-up Call": "bg-teal-100 text-teal-700 border-teal-200",
  "Follow Up": "bg-teal-100 text-teal-700 border-teal-200",
  "Visited": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Demo Given": "bg-purple-100 text-purple-700 border-purple-200",
  "Proposal Sent": "bg-amber-100 text-amber-700 border-amber-200",
  "Negotiation": "bg-orange-100 text-orange-700 border-orange-200",
  "Converted": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
  "On Hold": "bg-gray-100 text-gray-600 border-gray-200",
};

const formatFollowUpDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatFollowUpTime = (value) => {
  if (!value) return "—";
  if (typeof value !== "string") return value;
  const parts = value.split(":");
  const hours = Number(parts[0]);
  if (Number.isNaN(hours)) return value;
  const mins = parts[1] || "00";
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${mins} ${suffix}`;
};

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const { user } = useAuthStore();
  const [leads, setLeads] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [industrials, setIndustrials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10000);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);
  const [statusFilter, setStatusFilter] = useState("");
  const [summaryStats, setSummaryStats] = useState({ total: 0, newLead: 0, converted: 0, proposalSent: 0, notInterested: 0 });
  const [execFilter, setExecFilter] = useState("");
  const [industrialFilter, setIndustrialFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filterCategories, setFilterCategories] = useState([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [dateQuickFilter, setDateQuickFilter] = useState(""); // 'today' | 'yesterday' | ''
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isManageStatusModalOpen, setIsManageStatusModalOpen] = useState(false);
  const [isManageProductModalOpen, setIsManageProductModalOpen] = useState(false);
  const [conversionRemarks, setConversionRemarks] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [visitFormData, setVisitFormData] = useState({});
  const [paymentFormData, setPaymentFormData] = useState({});
  const [leadVisits, setLeadVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [leadPayments, setLeadPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

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

  const [visitStatusOptions, setVisitStatusOptions] = useState([]);
  const [visitStatusColorsMap, setVisitStatusColorsMap] = useState({});

  const [visitProductOptions, setVisitProductOptions] = useState([]);
  const [visitProductColorsMap, setVisitProductColorsMap] = useState({});

  const [industrialInput, setIndustrialInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [subcategoryInput, setSubcategoryInput] = useState("");

  const [isAddingIndustrial, setIsAddingIndustrial] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);

  const [isEditingIndustrial, setIsEditingIndustrial] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);

  const [formData, setFormData] = useState({
    CM_Client_Name: "",
    CM_Company_Name: "",
    CM_Phone: "",
    CM_Alt_Phone: "",
    CM_Email: "",
    CM_Address: "",
    CM_City: "",
    CM_Lead_Source: "",
    CM_Product_Required: "",
    CM_Project_Type: "",
    CM_Expected_Budget: "",
    CM_Sales_Executive_ID: "",
    CM_Lead_Status: "New Lead",
    CM_Followup_Status: "Follow Up",
    CM_Remarks: "",
    CM_Next_Follow_Up_Date: "",
    CM_Next_Follow_Up_Time: "",
    CM_Industrial_ID: "",
    CM_Category_ID: "",
    CM_Subcategory_ID: ""
  });

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

  useEffect(() => {
    fetchExecutives();
    fetchIndustrials();
    fetchFilterCategories("");
    fetchVisitStatuses();
    fetchVisitProducts();
  }, []);

  // Reset page to 1 on filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchLeads();
    }
  }, [statusFilter, execFilter, industrialFilter, categoryFilter, fromDate, toDate, debouncedSearch]);

  // Fetch leads when page changes
  useEffect(() => {
    fetchLeads();
  }, [page]);

  useEffect(() => {
    fetchFilterCategories(industrialFilter);
  }, [industrialFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        status: statusFilter,
        executiveId: execFilter,
        industrialId: industrialFilter,
        categoryId: categoryFilter,
        fromDate,
        toDate
      });
      const res = await fetch(`/api/sales-leads?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads);
        setTotal(data.total);
        if (data.stats) {
          setSummaryStats(data.stats);
        }
        if (selectedLead) {
          const updated = data.leads.find(l => l.CM_Lead_ID == selectedLead.CM_Lead_ID);
          if (updated) {
            setSelectedLead(updated);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
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

  const fetchIndustrials = async () => {
    try {
      const res = await fetch("/api/sales-industrial?type=industrials");
      const data = await res.json();
      if (res.ok) setIndustrials(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async (industrialId) => {
    if (!industrialId) { setCategories([]); setSubcategories([]); return; }
    try {
      const res = await fetch(`/api/sales-industrial?type=categories&industrialId=${industrialId}`);
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) { setSubcategories([]); return; }
    try {
      const res = await fetch(`/api/sales-industrial?type=subcategories&categoryId=${categoryId}`);
      const data = await res.json();
      if (res.ok) setSubcategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchVisitStatuses = async () => {
    try {
      const res = await fetch("/api/master/visit-status?active=true");
      const data = await res.json();
      if (data.success) {
        setVisitStatusOptions(data.data.map(s => s.Status_Name));
        const colors = {};
        data.data.forEach(s => {
          colors[s.Status_Name] = `bg-${s.Color_Code}-100 text-${s.Color_Code}-700 border-${s.Color_Code}-200`;
        });
        setVisitStatusColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit statuses", err);
    }
  };

  const fetchVisitProducts = async () => {
    try {
      const res = await fetch("/api/master/visit-products?active=true");
      const data = await res.json();
      if (data.success) {
        setVisitProductOptions(data.data.map(p => p.Product_Name));
        const colors = {};
        data.data.forEach(p => {
          colors[p.Product_Name] = `bg-${p.Color_Code}-100 text-${p.Color_Code}-700 border-${p.Color_Code}-200`;
        });
        setVisitProductColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit products", err);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
  };

  const openAddModal = () => {
    setFormData({
      CM_Client_Name: "",
      CM_Company_Name: "",
      CM_Phone: "",
      CM_Alt_Phone: "",
      CM_Email: "",
      CM_Address: "",
      CM_City: "",
      CM_Lead_Source: "Direct",
      CM_Product_Required: "",
      CM_Project_Type: "",
      CM_Expected_Budget: "",
      CM_Sales_Executive_ID: (user?.CM_User_ID || user?.id) && executives.some(e => e.CM_User_ID == (user?.CM_User_ID || user?.id)) ? (user?.CM_User_ID || user?.id) : "",
      CM_Lead_Status: "New Lead",
      CM_Followup_Status: "Follow Up",
      CM_Remarks: "",
      CM_Next_Follow_Up_Date: "",
      CM_Next_Follow_Up_Time: "",
      CM_Industrial_ID: "",
      CM_Category_ID: "",
      CM_Subcategory_ID: ""
    });
    setCategories([]);
    setSubcategories([]);
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (lead) => {
    setFormData({
      ...lead,
      CM_Next_Follow_Up_Date: lead.CM_Next_Follow_Up_Date || "",
      CM_Next_Follow_Up_Time: lead.CM_Next_Follow_Up_Time || ""
    });
    setSelectedLead(lead);
    setIsModalOpen(true);
    // Pre-load cascading dropdowns for existing values
    if (lead.CM_Industrial_ID) {
      await fetchCategories(lead.CM_Industrial_ID);
    }
    if (lead.CM_Category_ID) {
      await fetchSubcategories(lead.CM_Category_ID);
    }
  };

  const fetchLeadVisits = async (leadId) => {
    setLoadingVisits(true);
    try {
      const res = await fetch(`/api/sales-visits?leadId=${leadId}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setLeadVisits(data.visits || []);
      } else {
        setLeadVisits([]);
      }
    } catch (error) {
      console.error("Failed to fetch visits", error);
      setLeadVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const fetchLeadPayments = async (leadId) => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/sales-payments?leadId=${leadId}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setLeadPayments(data.payments || []);
      } else {
        setLeadPayments([]);
      }
    } catch (error) {
      console.error("Failed to fetch payments", error);
      setLeadPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const openDetail = (lead) => {
    if (selectedLead && selectedLead.CM_Lead_ID === lead.CM_Lead_ID && isDetailOpen) {
      setIsDetailOpen(false);
      setSelectedLead(null);
    } else {
      setSelectedLead(lead);
      setLeadVisits([]);
      setLeadPayments([]);
      setIsDetailOpen(true);
      setActiveTab("history");
      fetchLeadVisits(lead.CM_Lead_ID);
      fetchLeadPayments(lead.CM_Lead_ID);
    }
  };

  const renderDetailTabs = (lead) => {
    return (
      <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-6 border-b border-gray-200 mb-4 bg-white p-2 rounded-t-lg">
          <button
            onClick={() => setActiveTab('history')}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            History
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{leadVisits.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Payments
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{leadPayments.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Details
          </button>
        </div>

        <div className="p-2">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="flex gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[lead.CM_Lead_Status]}`}>
                        {lead.CM_Lead_Status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Follow-up Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[lead.CM_Followup_Status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {lead.CM_Followup_Status || 'Follow Up'}
                      </span>
                    </div>
                  </div>
                </div>
                {lead.CM_Lead_Status !== "Converted" && (
                  <button
                    onClick={() => setIsConvertModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                  >
                    Convert to Project <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Information Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Company_Name || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sales Executive</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-500" /> {lead.Executive_Name || "Unassigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-500" /> {lead.CM_Phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alt Phone</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Alt_Phone || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" /> {lead.CM_Email || "No email provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                  <p className="text-sm font-bold text-gray-700 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> {lead.CM_Address || "No address provided"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Product_Required || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget</p>
                  <p className="text-sm font-extrabold text-indigo-600">{lead.CM_Expected_Budget ? `₹${Number(lead.CM_Expected_Budget).toLocaleString()}` : "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Lead_Source || "Direct"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Industrial</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Industrial_Name || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Category_Name || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subcategory</p>
                  <p className="text-sm font-bold text-gray-700">{lead.CM_Subcategory_Name || "Not specified"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Follow-up Date</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" /> {formatFollowUpDate(lead.CM_Next_Follow_Up_Date)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Follow-up Time</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" /> {formatFollowUpTime(lead.CM_Next_Follow_Up_Time)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remarks</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed italic">
                  "{lead.CM_Remarks || "No additional remarks recorded."}"
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(lead)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm text-xs"
                >
                  <Edit2 className="h-4 w-4" /> Edit Details
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openAddVisitModal()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Visit
                </button>
              </div>
              {loadingVisits ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <p className="text-xs text-gray-500 font-medium">Loading visit history...</p>
                </div>
              ) : leadVisits.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-bold">No visits recorded yet</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-10 text-center border-r border-gray-200">#</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Visit Date</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-48 border-r border-gray-200">Purpose</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-48 border-r border-gray-200">Remarks</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-24 border-r border-gray-200">Executive</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Next Follow-up</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Status</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-24 border-r border-gray-200">Product</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-16 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leadVisits.map((v, idx) => (
                          <tr key={v.CM_Visit_ID} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-3 py-2 text-xs text-gray-500 text-center border-r border-gray-100">{idx + 1}</td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <p className="text-xs font-bold text-gray-700">
                                {new Date(v.CM_Visit_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <p className="text-xs font-bold text-blue-700 truncate">{v.CM_Purpose}</p>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{v.CM_Remarks || "No remarks recorded"}</p>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100 text-xs text-gray-600 font-semibold truncate">
                              {v.Executive_Name || "Unassigned"}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              {v.CM_Next_Followup_Date ? (
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-xs font-bold text-amber-600">
                                    {new Date(v.CM_Next_Followup_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                  </p>
                                </div>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${visitStatusColorsMap[v.CM_Visit_Status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {v.CM_Visit_Status}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              {v.CM_Visit_Products ? (
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${visitProductColorsMap[v.CM_Visit_Products] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                  {v.CM_Visit_Products}
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => openEditVisitModal(v)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDeleteVisit(v.CM_Visit_ID)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openAddPaymentModal()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Payment
                </button>
              </div>
              {loadingPayments ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <p className="text-xs text-gray-500 font-medium">Loading payment history...</p>
                </div>
              ) : leadPayments.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                  <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-bold">No payments recorded yet</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-10 text-center border-r border-gray-200">#</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Date</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Amount</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-32 border-r border-gray-200">Type</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-28 border-r border-gray-200">Mode</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-24 border-r border-gray-200">Status</th>
                          <th className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase w-16 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leadPayments.map((p, idx) => (
                          <tr key={p.CM_Payment_ID} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-3 py-2 text-xs text-gray-500 text-center border-r border-gray-100">{idx + 1}</td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <p className="text-xs font-bold text-gray-700">
                                {new Date(p.CM_Payment_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <p className="text-sm font-extrabold text-gray-900">₹{Number(p.CM_Amount).toLocaleString()}</p>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${p.CM_Payment_Type === "Advance" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                p.CM_Payment_Type === "Partial Payment" ? "bg-purple-100 text-purple-700 border-purple-200" :
                                  p.CM_Payment_Type === "Final Payment" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                                    p.CM_Payment_Type === "Domain Payment" ? "bg-teal-100 text-teal-700 border-teal-200" :
                                      "bg-gray-100 text-gray-600 border-gray-200"
                                }`}>
                                {p.CM_Payment_Type}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100 text-xs font-medium text-gray-700">
                              {p.CM_Payment_Mode}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-100">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${p.CM_Payment_Status === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                p.CM_Payment_Status === "Paid" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  "bg-red-100 text-red-700 border-red-200"
                                }`}>
                                {p.CM_Payment_Status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => openEditPaymentModal(p)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDeletePayment(p.CM_Payment_ID)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleManageIndustrial = async (action, id = null) => {
    if (!industrialInput.trim() && action !== 'DELETE') return toast.error("Industrial name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'industrial', CM_Industrial_Name: industrialInput, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Industrial_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Industrial ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setIndustrialInput(""); setIsAddingIndustrial(false); setIsEditingIndustrial(false);
        fetchIndustrials();
        if (action === 'DELETE') { setFormData({ ...formData, CM_Industrial_ID: "", CM_Category_ID: "", CM_Subcategory_ID: "" }); setCategories([]); setSubcategories([]); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleManageCategory = async (action, id = null) => {
    if (!formData.CM_Industrial_ID && action !== 'DELETE') return toast.error("Select an Industrial first");
    if (!categoryInput.trim() && action !== 'DELETE') return toast.error("Category name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'category', CM_Category_Name: categoryInput, CM_Industrial_ID: formData.CM_Industrial_ID, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Category_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Category ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setCategoryInput(""); setIsAddingCategory(false); setIsEditingCategory(false);
        fetchCategories(formData.CM_Industrial_ID);
        if (action === 'DELETE') { setFormData({ ...formData, CM_Category_ID: "", CM_Subcategory_ID: "" }); setSubcategories([]); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleManageSubcategory = async (action, id = null) => {
    if (!formData.CM_Category_ID && action !== 'DELETE') return toast.error("Select a Category first");
    if (!subcategoryInput.trim() && action !== 'DELETE') return toast.error("Subcategory name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'subcategory', CM_Subcategory_Name: subcategoryInput, CM_Category_ID: formData.CM_Category_ID, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Subcategory_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Subcategory ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setSubcategoryInput(""); setIsAddingSubcategory(false); setIsEditingSubcategory(false);
        fetchSubcategories(formData.CM_Category_ID);
        if (action === 'DELETE') { setFormData({ ...formData, CM_Subcategory_ID: "" }); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = selectedLead ? "PUT" : "POST";
      const url = selectedLead ? `/api/sales-leads?_method=PUT` : "/api/sales-leads";
      const payload = {
        ...formData,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(selectedLead ? "Lead updated successfully" : "Lead created successfully");
        setIsModalOpen(false);
        fetchLeads();
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

  const handleDelete = (leadId) => {
    showConfirm({
      title: "Delete Lead?",
      message: "Are you sure you want to delete this lead? This action cannot be undone.",
      confirmText: "Yes, Delete Lead",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales-leads?_method=DELETE`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CM_Lead_ID: leadId, CM_Updated_By: user?.CM_User_ID || user?.id })
          });
          if (res.ok) {
            toast.success("Lead deleted");
            fetchLeads();
          }
        } catch (error) {
          toast.error("Failed to delete");
        }
      }
    });
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CM_Lead_ID: selectedLead.CM_Lead_ID,
          CM_Converted_By: user?.CM_User_ID || user?.id,
          CM_Remarks: conversionRemarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Lead converted to project successfully!");
        setIsConvertModalOpen(false);
        setIsDetailOpen(false);
        fetchLeads();
        // Option: Redirect to project dashboard
        // window.location.href = `/projects/${data.CM_Project_ID}`;
      } else {
        toast.error(data.error || "Conversion failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddVisitModal = () => {
    setVisitFormData({
      CM_Lead_ID: selectedLead?.CM_Lead_ID || "",
      CM_Sales_Executive_ID: user?.CM_User_ID || user?.id || "",
      CM_Visit_Date: new Date().toISOString().split('T')[0],
      CM_Purpose: "",
      CM_Product_Discussed: "",
      CM_Scope_Given: "No",
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
      CM_Next_Followup_Time: "",
      CM_Visit_Status: "Follow-up Needed",
      CM_Remarks: "",
      CM_Images: []
    });
    setSelectedVisit(null);
    setIsVisitModalOpen(true);
  };

  const openEditVisitModal = (visit) => {
    setVisitFormData({
      ...visit,
      CM_Visit_Date: visit.CM_Visit_Date ? new Date(visit.CM_Visit_Date).toISOString().split('T')[0] : "",
      CM_Next_Followup_Date: visit.CM_Next_Followup_Date ? new Date(visit.CM_Next_Followup_Date).toISOString().split('T')[0] : ""
    });
    setSelectedVisit(visit);
    setIsVisitModalOpen(true);
  };

  const handleDeleteVisit = (visitId) => {
    showConfirm({
      title: "Delete Visit Record?",
      message: "Are you sure you want to delete this visit record?",
      confirmText: "Yes, Delete Visit",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales-visits?_method=DELETE`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CM_Visit_ID: visitId, CM_Updated_By: user?.CM_User_ID || user?.id })
          });
          if (res.ok) {
            toast.success("Visit deleted");
            fetchLeadVisits(selectedLead.CM_Lead_ID);
            fetchLeads();
          } else {
            toast.error("Failed to delete visit");
          }
        } catch (error) {
          toast.error("An error occurred");
        }
      }
    });
  };

  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = selectedVisit ? `/api/sales-visits?_method=PUT` : "/api/sales-visits";
      const payload = {
        ...visitFormData,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(selectedVisit ? "Visit updated successfully" : "Visit logged successfully");
        setIsVisitModalOpen(false);
        fetchLeadVisits(selectedLead.CM_Lead_ID);
        fetchLeads();
      } else {
        const data = await res.json();
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddPaymentModal = () => {
    setPaymentFormData({
      CM_Lead_ID: selectedLead?.CM_Lead_ID || "",
      CM_Payment_Date: new Date().toISOString().split('T')[0],
      CM_Amount: "",
      CM_Payment_Type: "Advance",
      CM_Payment_Mode: "Bank Transfer",
      CM_Payment_Status: "Paid",
      CM_Remarks: ""
    });
    setSelectedPayment(null);
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (payment) => {
    setPaymentFormData({
      ...payment,
      CM_Payment_Date: payment.CM_Payment_Date ? new Date(payment.CM_Payment_Date).toISOString().split('T')[0] : ""
    });
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePayment = (paymentId) => {
    showConfirm({
      title: "Delete Payment Record?",
      message: "Are you sure you want to delete this payment record?",
      confirmText: "Yes, Delete Payment",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales-payments?_method=DELETE`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CM_Payment_ID: paymentId, CM_Updated_By: user?.CM_User_ID || user?.id })
          });
          if (res.ok) {
            toast.success("Payment deleted");
            fetchLeadPayments(selectedLead.CM_Lead_ID);
          } else {
            toast.error("Failed to delete payment");
          }
        } catch (error) {
          toast.error("An error occurred");
        }
      }
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = selectedPayment ? `/api/sales-payments?_method=PUT` : "/api/sales-payments";
      const payload = {
        ...paymentFormData,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(selectedPayment ? "Payment updated successfully" : "Payment logged successfully");
        setIsPaymentModalOpen(false);
        fetchLeadPayments(selectedLead.CM_Lead_ID);
      } else {
        const data = await res.json();
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(leads.map(l => ({
      "Lead ID": l.CM_Lead_ID,
      "Client Name": l.CM_Client_Name,
      "Company": l.CM_Company_Name,
      "Phone": l.CM_Phone,
      "Email": l.CM_Email,
      "Status": l.CM_Lead_Status,
      "Product": l.CM_Product_Required,
      "Executive": l.Executive_Name,
      "Created At": new Date(l.CM_Created_At).toLocaleString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "Sales_Leads.xlsx");
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6 min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-7 w-7 text-indigo-600" />
            Lead Management
          </h1>
          <p className="text-sm text-gray-500">Track and manage your sales pipeline efficiently</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-all shadow-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all shadow-md font-medium"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats Cards for Leads */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total Leads",
            value: statusFilter ? total : (summaryStats.total || total),
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-500",
            onClick: () => { setStatusFilter(""); setPage(1); }
          },
          {
            label: "New Leads",
            value: statusFilter === "New Lead"
              ? total
              : (statusFilter ? leads.filter(l => l.CM_Lead_Status === "New Lead").length : (summaryStats.newLead ?? leads.filter(l => l.CM_Lead_Status === "New Lead").length)),
            icon: Star,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-500",
            onClick: () => { setStatusFilter("New Lead"); setPage(1); }
          },
          {
            label: "Converted",
            value: statusFilter === "Converted"
              ? total
              : (statusFilter ? leads.filter(l => l.CM_Lead_Status === "Converted" || l.CM_Followup_Status === "Converted" || l.Last_Visit_Status === "Converted").length : (summaryStats.converted ?? leads.filter(l => l.CM_Lead_Status === "Converted" || l.CM_Followup_Status === "Converted" || l.Last_Visit_Status === "Converted").length)),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-500",
            onClick: () => { setStatusFilter("Converted"); setPage(1); }
          },
          {
            label: "Proposal Sent",
            value: statusFilter === "Proposal Sent"
              ? total
              : (statusFilter ? leads.filter(l => l.CM_Lead_Status === "Proposal Sent" || l.CM_Followup_Status === "Proposal Sent" || l.Had_Proposal_Sent === 1 || l.Last_Visit_Status === "Proposal Sent").length : (summaryStats.proposalSent ?? leads.filter(l => l.CM_Lead_Status === "Proposal Sent" || l.CM_Followup_Status === "Proposal Sent" || l.Had_Proposal_Sent === 1 || l.Last_Visit_Status === "Proposal Sent").length)),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-500",
            onClick: () => { setStatusFilter("Proposal Sent"); setPage(1); }
          },
          {
            label: "Not Interested",
            value: ["Rejected", "Not Interested"].includes(statusFilter)
              ? total
              : (statusFilter ? leads.filter(l => ["Rejected", "Not Interested"].includes(l.CM_Lead_Status) || ["Rejected", "Not Interested"].includes(l.CM_Followup_Status) || l.Had_Not_Interested === 1 || ["Rejected", "Not Interested"].includes(l.Last_Visit_Status)).length : (summaryStats.notInterested ?? leads.filter(l => ["Rejected", "Not Interested"].includes(l.CM_Lead_Status) || ["Rejected", "Not Interested"].includes(l.CM_Followup_Status) || l.Had_Not_Interested === 1 || ["Rejected", "Not Interested"].includes(l.Last_Visit_Status)).length)),
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-500",
            onClick: () => { setStatusFilter("Not Interested"); setPage(1); }
          },
        ].map((s, i) => (
          <div key={i} onClick={s.onClick} className={`p-2 rounded-xl text-gray-800 border-l-4 ${s.border} ${s.bg} shadow-sm transition-transform hover:scale-[1.02] cursor-pointer`}>
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-1">{s.label}</p>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <s.icon className={`h-5 w-5 ${s.color} opacity-40`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-2 items-end text-gray-800 w-full overflow-visible pb-3 sticky top-0 z-20 shadow-sm border-b px-2">
        <form onSubmit={handleSearch} className="w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name, company, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none h-[42px]"
            />
          </div>
        </form>

        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px]"
          >
            <option value="">All Statuses</option>
            {visitStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sales Executive</label>
          <select
            value={execFilter}
            onChange={(e) => { setExecFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px]"
          >
            <option value="">All Executives</option>
            {executives.map(e => <option key={e.CM_User_ID} value={e.CM_User_ID}>{e.CM_Full_Name}</option>)}
          </select>
        </div>

        {/* Today / Yesterday Quick Filters (Visible by Default next to Sales Executive) */}
        <div className="flex flex-col gap-1 w-full">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quick Filter</label>
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
              className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all h-[42px] flex-shrink-0 flex-1 sm:flex-none ${dateQuickFilter === 'today'
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
              className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all h-[42px] flex-shrink-0 flex-1 sm:flex-none ${dateQuickFilter === 'yesterday'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600'
                }`}
            >
              Y'day
            </button>
          </div>
        </div>

        {/* Compact Toggle Button */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all font-semibold h-[42px] text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            {isFiltersExpanded ? "Less" : "More"}
          </button>
        </div>

        {isFiltersExpanded && (
          <>
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Industrial</label>
              <select
                value={industrialFilter}
                onChange={(e) => {
                  setIndustrialFilter(e.target.value);
                  setCategoryFilter("");
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px]"
              >
                <option value="">All Industrials</option>
                {industrials.map(i => <option key={i.CM_Industrial_ID} value={i.CM_Industrial_ID}>{i.CM_Industrial_Name}</option>)}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none h-[42px]"
              >
                <option value="">All Categories</option>
                {filterCategories.map(c => (
                  <option key={c.CM_Category_ID} value={c.CM_Category_ID}>{c.CM_Category_Name}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setDateQuickFilter(""); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm h-[42px]"
              />
            </div>

              {/* To Date */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setDateQuickFilter("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 outline-none text-sm h-[42px]"
                />
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setExecFilter("");
                  setIndustrialFilter("");
                  setCategoryFilter("");
                  setDateQuickFilter("");
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                }}
                className="flex items-center justify-center w-[42px] h-[42px] text-white bg-gray-600 hover:bg-gray-700 rounded-lg shadow-sm transition-all mb-[1px]"
                title="Reset Filters"
              >
                <FiRotateCcw size={18} />
              </button>
          </>
        )}
      </div>

      {/* Content Section: Table (Desktop) & Grid (Mobile) */}
      <div className="space-y-4">
        {/* Desktop View (Table) */}
        <div className="hidden lg:block bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-10 text-center border border-gray-300">#</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-30 border border-gray-300">Client / Company</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-20 border border-gray-300">Contact No</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-32 border border-gray-300">Industrial </th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-30 border border-gray-300">Requirement</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-18 border border-gray-300">Next Follow-up</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-24 border border-gray-300">Status</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-24 border border-gray-300">Follow-up Status</th>
                  <th className="px-2 py-2 text-[11px] font-bold uppercase w-24 text-center border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center border border-gray-300"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-2 text-center text-gray-500 border border-gray-300">No leads found</td></tr>
                ) : (
                  Object.entries(
                    leads.reduce((acc, lead) => {
                      const execName = lead.Executive_Name || "Unassigned";
                      if (!acc[execName]) acc[execName] = [];
                      acc[execName].push(lead);
                      return acc;
                    }, {})
                  ).map(([execName, execLeads]) => (
                    <React.Fragment key={execName}>
                      <tr className="bg-gray-100">
                        <td colSpan="9" className="px-2 py-1.5 font-bold text-gray-800 border border-gray-300">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-sm text-blue-600">{execName}</span> <span className="text-[10px] font-normal text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-sm border border-gray-300">{execLeads.length} Leads</span>
                          </div>
                        </td>
                      </tr>
                      {execLeads.map((lead) => (
                        <React.Fragment key={lead.CM_Lead_ID}>
                          <tr
                            onClick={() => openDetail(lead)}
                            className={`hover:bg-blue-50/20 transition-colors cursor-pointer ${selectedLead?.CM_Lead_ID === lead.CM_Lead_ID && isDetailOpen ? 'bg-blue-50/40' : 'bg-white'}`}
                          >
                            <td className="px-2 py-1 text-[11px] text-gray-500 text-center border border-gray-300">{(page - 1) * limit + leads.indexOf(lead) + 1}</td>
                            <td className="px-2 py-1 border border-gray-300">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{lead.CM_Client_Name}</p>
                                <p className="text-[11px] text-gray-500">{lead.CM_Company_Name || "Individual"}</p>
                                <p className="flex items-center gap-1 text-[12px] text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-sm font-medium text-blue-500">{lead.CM_City || ""}</span>
                                </p>                            </div>
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-sm font-medium text-gray-700" onClick={(e) => e.stopPropagation()}>
                              {lead.CM_Phone}
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-sm text-gray-600">
                              <div className="line-clamp-1 text-blue-700">{lead.CM_Industrial_Name || "—"}</div>
                              <div className="line-clamp-1">{lead.CM_Category_Name || "—"}</div>
                              <div className="line-clamp-1">{lead.CM_Subcategory_Name || "—"}</div>
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-sm text-gray-600">
                              <p className="line-clamp-2">{lead.CM_Product_Required || "—"}</p>
                              {lead.CM_Expected_Budget && <p className="text-[11px] font-bold text-blue-600">₹{Number(lead.CM_Expected_Budget).toLocaleString()}</p>}
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-[11px] text-gray-600">
                              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                                <Calendar className="h-3 w-3" />
                                <span>{formatFollowUpDate(lead.CM_Next_Follow_Up_Date)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>{formatFollowUpTime(lead.CM_Next_Follow_Up_Time)}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-center">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-bold border ${STATUS_COLORS[lead.CM_Lead_Status] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
                                {lead.CM_Lead_Status}
                              </span>
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-center">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-bold border ${STATUS_COLORS[lead.CM_Followup_Status] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
                                {lead.CM_Followup_Status || "Follow Up"}
                              </span>
                            </td>
                            <td className="px-2 py-1 border border-gray-300 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center gap-1.5">
                                <button onClick={() => openEditModal(lead)} className="text-gray-500 hover:text-blue-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => openDetail(lead)} className="text-gray-500 hover:text-indigo-600 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDelete(lead.CM_Lead_ID)} className="text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                          {selectedLead?.CM_Lead_ID === lead.CM_Lead_ID && isDetailOpen && (
                            <tr>
                              <td colSpan="9" className="px-1 py-3 bg-gray-50 border border-gray-300">
                                {renderDetailTabs(lead)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View (Cards Grid) */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No leads found</div>
          ) : (
            leads.map((lead) => (
              <div key={lead.CM_Lead_ID} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all cursor-pointer" onClick={() => openDetail(lead)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 leading-none">{lead.CM_Client_Name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">{lead.CM_Company_Name || "Individual"}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[lead.CM_Lead_Status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {lead.CM_Lead_Status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-50 mb-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Product</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{lead.CM_Product_Required || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Executive</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{lead.Executive_Name || "Unassigned"}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Next Follow-up</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Calendar className="h-3 w-3 text-blue-500" /> {formatFollowUpDate(lead.CM_Next_Follow_Up_Date)}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Clock className="h-3 w-3 text-amber-600" /> {formatFollowUpTime(lead.CM_Next_Follow_Up_Time)}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                    <Phone className="h-3 w-3" /> {lead.CM_Phone}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}
                      className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100 hover:bg-amber-50 hover:text-amber-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDetail(lead); }}
                      className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {selectedLead?.CM_Lead_ID === lead.CM_Lead_ID && isDetailOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                    {renderDetailTabs(lead)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-700">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-bold text-gray-700">{Math.min(page * limit, total)}</span> of <span className="font-bold text-gray-700">{total}</span> leads
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === i + 1 ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white border border-transparent hover:border-gray-200"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedLead(null); }}
        selectedLead={selectedLead}
        user={user}
        onSuccess={() => fetchLeads()}
      />

      {/* Detail Slide-over removed, details are rendered inline in expanded row */}

      {/* Visit Add/Edit Modal */}
      <VisitFormModal
        isOpen={isVisitModalOpen}
        onClose={() => { setIsVisitModalOpen(false); setSelectedVisit(null); }}
        selectedVisit={selectedVisit}
        preselectedLeadId={selectedLead?.CM_Lead_ID}
        user={user}
        onSuccess={() => {
          if (selectedLead) {
            fetchLeadVisits(selectedLead.CM_Lead_ID);
          }
          fetchLeads();
        }}
      />

      {/* Payment Add/Edit Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-gray-800">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-500 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {selectedPayment ? "Edit Payment" : "Record New Payment"}
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Lead Name</label>
                <input
                  type="text"
                  readOnly
                  value={selectedLead?.CM_Client_Name || ""}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none text-gray-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Payment Date *</label>
                <input
                  required
                  type="date"
                  value={paymentFormData.CM_Payment_Date || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Payment_Date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Amount *</label>
                <input
                  required
                  type="number"
                  value={paymentFormData.CM_Amount || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Payment Type</label>
                <select
                  value={paymentFormData.CM_Payment_Type || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Payment_Type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                >
                  <option value="Advance">Advance</option>
                  <option value="Partial Payment">Partial Payment</option>
                  <option value="Final Payment">Final Payment</option>
                  <option value="Domain Payment">Domain Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Payment Mode</label>
                <select
                  value={paymentFormData.CM_Payment_Mode || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Payment_Mode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Payment Status</label>
                <select
                  value={paymentFormData.CM_Payment_Status || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Payment_Status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Remarks</label>
                <textarea
                  rows="2"
                  value={paymentFormData.CM_Remarks || ""}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, CM_Remarks: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring focus:ring-blue-500 outline-none resize-none"
                  placeholder="Transaction ID or notes..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {selectedPayment ? "Update Payment" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversion Confirmation Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Convert to Project?</h2>
              <p className="text-gray-500 mb-6">
                This will automatically create a new project in the system using <strong>{selectedLead?.CM_Client_Name}</strong>'s details.
              </p>

              <div className="text-left space-y-2 mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Handover Remarks</label>
                <textarea
                  rows="3"
                  value={conversionRemarks}
                  onChange={(e) => setConversionRemarks(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  placeholder="e.g. Scope confirmed, advance received..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsConvertModalOpen(false)}
                  className="flex-1 px-6 py-3 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvert}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Conversion"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Statuses Modal */}
      {isManageStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
            <div className="pt-2 pb-6">
              <VisitStatusMasterPage onClose={() => { setIsManageStatusModalOpen(false); fetchVisitStatuses(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Manage Products Modal */}
      {isManageProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
            <div className="pt-2 pb-6">
              <VisitProductsMasterPage onClose={() => { setIsManageProductModalOpen(false); fetchVisitProducts(); }} />
            </div>
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
