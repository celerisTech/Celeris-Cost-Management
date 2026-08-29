"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthScreenStore";
import Link from "next/link";
import FollowupsOverviewModal from "../components/FollowupsOverviewModal";
import {
  Target, MapPin, CreditCard, TrendingUp, Users, Calendar,
  ArrowRight, AlertCircle, CheckCircle2, Clock, IndianRupee,
  BarChart3, ChevronRight, Phone, Building2, Eye, Star, FileText, Settings,
  Check, SlidersHorizontal, ChevronDown,
  User
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtCurrency = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  "New Lead": "bg-blue-100 text-blue-700",
  "Follow-up Call": "bg-teal-100 text-teal-700",
  "Visited": "bg-indigo-100 text-indigo-700",
  "Demo Given": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-amber-100 text-amber-700",
  "Negotiation": "bg-orange-100 text-orange-700",
  "Converted": "bg-emerald-100 text-emerald-700",
  "Rejected": "bg-red-100 text-red-700",
  "On Hold": "bg-gray-100 text-gray-600",
};

export default function CRMDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowupsModalOpen, setIsFollowupsModalOpen] = useState(false);
  const [isAmcModalOpen, setIsAmcModalOpen] = useState(false);
  
  const isAdminOrManager = user?.CM_Role_ID === "ROL000001" || user?.CM_Role_ID === "ROL000002";

  // Filters & Chart Type state
  const [filterType, setFilterType] = useState("This Year");
  const [customRange, setCustomRange] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    fromDate: "",
    toDate: ""
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("bar"); // 'bar' or 'line'
  const [activeChartViewTab, setActiveChartViewTab] = useState("trends"); // 'trends' or 'product'

  const getDateRange = (type, custom = {}) => {
    const today = new Date();
    let from = null;
    let to = today;

    switch (type) {
      case "Today":
        from = new Date();
        from.setHours(0, 0, 0, 0);
        break;
      case "Yesterday":
        from = new Date();
        from.setDate(today.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to = new Date();
        to.setDate(today.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "This Week":
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        from = new Date(today.setDate(diff));
        from.setHours(0, 0, 0, 0);
        to = new Date();
        break;
      case "This Month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "Last Month":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "This Year":
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case "Last Year":
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      case "All Time":
        from = "";
        to = "";
        break;
      case "Custom Month":
        if (custom.month !== undefined && custom.year) {
          from = new Date(custom.year, custom.month, 1);
          to = new Date(custom.year, parseInt(custom.month) + 1, 0, 23, 59, 59, 999);
        }
        break;
      case "Custom Year":
        if (custom.year) {
          from = new Date(custom.year, 0, 1);
          to = new Date(custom.year, 11, 31, 23, 59, 59, 999);
        }
        break;
      case "Custom Date":
        if (custom.fromDate) from = new Date(custom.fromDate);
        if (custom.toDate) to = new Date(custom.toDate);
        break;
      default:
        break;
    }

    const fmtDate = (d) => {
      if (!d) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      fromDate: from ? fmtDate(from) : "",
      toDate: to ? fmtDate(to) : ""
    };
  };

  const fetchDashboard = async (from = "", to = "") => {
    try {
      setLoading(true);
      let url = "/api/sales-leads?type=dashboard";
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterType === "Custom Month" && (customRange.month === undefined || !customRange.year)) return;
    if (filterType === "Custom Year" && !customRange.year) return;
    if (filterType === "Custom Date" && (!customRange.fromDate || !customRange.toDate)) return;

    const { fromDate: from, toDate: to } = getDateRange(filterType, customRange);
    fetchDashboard(from, to);
  }, [filterType, customRange]);

  const chartData = useMemo(() => {
    if (!data?.trend) return [];

    if (filterType === "All Time") {
      const yearlyMap = {};
      data.trend.forEach(item => {
        if (!item.date) return;
        const d = new Date(item.date);
        const yr = d.getFullYear();
        if (isNaN(yr)) return;
        if (!yearlyMap[yr]) {
          yearlyMap[yr] = {
            name: String(yr),
            "Total Leads": 0,
            "Proposals Sent": 0,
            "Converted": 0
          };
        }
        yearlyMap[yr]["Total Leads"] += Number(item.total_leads || 0);
        yearlyMap[yr]["Proposals Sent"] += Number(item.proposal_sent || 0);
        yearlyMap[yr]["Converted"] += Number(item.converted_leads || 0);
      });
      return Object.values(yearlyMap).sort((a, b) => a.name.localeCompare(b.name));
    }

    const isYearly = ["This Year", "Last Year", "Custom Year"].includes(filterType);

    if (isYearly) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = months.map((m, idx) => ({
        name: m,
        "Total Leads": 0,
        "Proposals Sent": 0,
        "Converted": 0,
        monthIdx: idx
      }));

      data.trend.forEach(item => {
        const d = new Date(item.date);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          monthlyData[mIdx]["Total Leads"] += Number(item.total_leads || 0);
          monthlyData[mIdx]["Proposals Sent"] += Number(item.proposal_sent || 0);
          monthlyData[mIdx]["Converted"] += Number(item.converted_leads || 0);
        }
      });
      return monthlyData;
    }

    return data.trend.map(item => {
      const d = new Date(item.date);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      return {
        name: label,
        "Total Leads": Number(item.total_leads || 0),
        "Proposals Sent": Number(item.proposal_sent || 0),
        "Converted": Number(item.converted_leads || 0)
      };
    });
  }, [data?.trend, filterType]);

  const stats = data?.stats || {};
  const followups = data?.pendingFollowups || [];
  const topExecs = data?.topExecutives || [];

  const statCards = [
    {
      label: "Total Leads",
      value: fmt(stats.total_leads),
      icon: Target,
      gradient: "from-blue-50 to-white",
      border: "border-blue-100",
      accent: "border-blue-500",
      textColor: "text-blue-900",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      link: "/dashboard/crm/leads"
    },
    {
      label: "New Leads",
      value: fmt(stats.new_leads),
      icon: Star,
      gradient: "from-indigo-50 to-white",
      border: "border-indigo-100",
      accent: "border-indigo-500",
      textColor: "text-indigo-900",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      link: "/dashboard/crm/leads?status=New+Lead"
    },
    {
      label: "Today's Visits",
      value: fmt(data?.todayVisits),
      icon: MapPin,
      gradient: "from-violet-50 to-white",
      border: "border-violet-100",
      accent: "border-violet-500",
      textColor: "text-violet-900",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      link: "/dashboard/crm/visits"
    },
    {
      label: "Pending Followups",
      value: fmt(stats.pending_followups),
      icon: Clock,
      gradient: "from-amber-50 to-white",
      border: "border-amber-100",
      accent: "border-amber-500",
      textColor: "text-amber-900",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/dashboard/crm/visits?pending=true"
    },
    {
      label: "Converted",
      value: fmt(stats.converted_leads),
      icon: CheckCircle2,
      gradient: "from-emerald-50 to-white",
      border: "border-emerald-100",
      accent: "border-emerald-500",
      textColor: "text-emerald-900",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/dashboard/crm/leads?status=Converted"
    },
    {
      label: "Not Interested",
      value: fmt(stats.rejected_leads),
      icon: AlertCircle,
      gradient: "from-rose-50 to-white",
      border: "border-rose-100",
      accent: "border-rose-500",
      textColor: "text-rose-900",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      link: "/dashboard/crm/leads?status=Not+Interested"
    },
    {
      label: "Total Collection",
      value: fmtCurrency(data?.totalCollection),
      icon: IndianRupee,
      gradient: "from-green-50 to-white",
      border: "border-green-100",
      accent: "border-green-500",
      textColor: "text-green-900",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      link: "/dashboard/crm/payments"
    },
    {
      label: "Proposal Sent",
      value: fmt(stats.proposal_sent),
      icon: FileText,
      gradient: "from-orange-50 to-white",
      border: "border-orange-100",
      accent: "border-orange-500",
      textColor: "text-orange-900",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      link: "/dashboard/crm/leads?status=Proposal+Sent"
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-2 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-indigo-600" />
            Sales Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sales pipeline overview & performance metrics</p>
        </div>
        {isAdminOrManager && (
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/dashboard/crm/compare"
              className="group flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Target size={18} className="transition-transform group-hover:-translate-y-0.5" />
              Compare
            </Link>

            <Link
              href="/dashboard/crm/executive-performance"
              className="group flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Users size={18} className="transition-transform group-hover:-translate-y-0.5" />
              Executive Performance
            </Link>
            
            <Link
              href="/dashboard/crm/today-report"
              className="group flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <FileText size={18} className="transition-transform group-hover:-translate-y-0.5" />
              Today Report
            </Link>
          </div>
        )}
      </div>

      {/* AMC Expiry Alert Section */}
      {data?.expiringAmcCount > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-yellow-500"></div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 animate-pulse shadow-inner">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  AMC Renewals Alert
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                    {data.expiringAmcCount} Expiring
                  </span>
                </h3>
                <p className="text-xs text-amber-700">
                  You have <span className="font-bold text-amber-900">{data.expiringAmcCount}</span> AMCs expiring within the next 10 days. Please follow up for payments.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsAmcModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 hover:scale-105 transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" /> Manage Expiring AMCs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Alerts Section */}
      {(data?.pendingFollowups?.length > 0 || stats.pending_followups > 0) && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          {/* Animated background accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse shadow-inner">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                  Urgent Actions Required
                  <span className="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded-full animate-pulse">
                    {stats.pending_followups} Pending
                  </span>
                </h3>
                <p className="text-xs text-red-700">
                  You have <span className="font-bold text-red-900">{stats.pending_followups}</span> overdue follow-ups and
                  <span className="font-bold text-red-900"> {fmtCurrency(data?.pendingPayments)}</span> pending in collections.
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsFollowupsModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 hover:scale-105 transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" /> Follow-ups
              </button>
              <Link href="/dashboard/crm/visits" className="flex-1 md:flex-none">
                <button className="w-full px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-md flex items-center justify-center gap-1.5">
                  View All
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            href={card.link}
            className={`
              group relative p-3 rounded-xl border-l-4 
              bg-gradient-to-br ${card.gradient} ${card.border} ${card.accent}
              shadow-sm hover:shadow-md transition-all duration-300 
              hover:translate-y-[-2px]
            `}
            style={{
              animation: `fadeIn 0.5s ease-out ${i * 50}ms forwards`,
              opacity: 0
            }}
          >
            {/* Header Content */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-bold ${card.textColor} tracking-widest uppercase mb-1`}>
                  {card.label}
                </p>
                <p className={`text-xl md:text-2xl font-black ${card.textColor} leading-none`}>
                  {card.value}
                </p>
              </div>

              {/* Icon Container */}
              <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor} transition-transform group-hover:scale-110`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>

          </Link>
        ))}
      </div>

      {/* Charts Section */}
      {isAdminOrManager && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">        {/* Main Chart Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 mb-6 pb-2 gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveChartViewTab("trends")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeChartViewTab === "trends"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Trends Overview
            </button>
            <button
              onClick={() => setActiveChartViewTab("product")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeChartViewTab === "product"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Product Wise Distribution
            </button>
          </div>

          {/* FILTER label and main dropdown aligned to the right */}
          <div className="flex items-center gap-3 flex-wrap sm:ml-auto">
            {/* FILTER label and main dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-teal-600 font-bold text-sm tracking-wider uppercase flex items-center gap-1.5 mr-1">
                <SlidersHorizontal size={14} className="stroke-[2.5]" />
                FILTER
              </span>

              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] border ${filterType.startsWith("Custom")
                    ? "border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20 text-[#1e3a8a]"
                    : "border-gray-200"
                    }`}
                >
                  {filterType === "Custom Month" ? "Custom..." : filterType}
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-[350px] overflow-y-auto">
                    {[
                      "Today",
                      "Yesterday",
                      "This Week",
                      "This Month",
                      "Last Month",
                      "This Year",
                      "Last Year",
                      "All Time",
                      "Custom Month",
                      "Custom Year",
                      "Custom Date"
                    ].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFilterType(option);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${filterType === option
                          ? "bg-blue-50/75 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {option}
                        {filterType === option && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conditional inputs side-by-side based on Custom selection */}
            {filterType === "Custom Date" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customRange.fromDate || ""}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                />
                <span className="text-xs font-bold text-gray-400 px-1">TO</span>
                <input
                  type="date"
                  value={customRange.toDate || ""}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, toDate: e.target.value }))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
                />
              </div>
            )}

            {filterType === "Custom Month" && (
              <div className="flex items-center gap-2">
                <select
                  value={customRange.year}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-[#1e3a8a] appearance-none pr-8 relative"
                  style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220%200%2024%2024%22 fill%3D%22none%22 stroke%3D%22%236b7280%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')", backgroundPosition: "right 8px center", backgroundSize: "16px", backgroundRepeat: "no-repeat" }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={customRange.month}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-[#1e3a8a] appearance-none pr-8 relative"
                  style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220%200%2024%2024%22 fill%3D%22none%22 stroke%3D%22%236b7280%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')", backgroundPosition: "right 8px center", backgroundSize: "16px", backgroundRepeat: "no-repeat" }}
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {filterType === "Custom Year" && (
              <div className="flex items-center gap-2">
                <select
                  value={customRange.year}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-[#1e3a8a] appearance-none pr-8 relative"
                  style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220%200%2024%2024%22 fill%3D%22none%22 stroke%3D%22%236b7280%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')", backgroundPosition: "right 8px center", backgroundSize: "16px", backgroundRepeat: "no-repeat" }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {activeChartViewTab === "trends" ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Lead & Conversion Trends ({filterType})
                </h2>
                <p className="text-xs text-gray-500 mt-1">Overview of total leads vs proposals sent vs converted</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
                <button
                  onClick={() => setActiveChartTab("bar")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeChartTab === "bar" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setActiveChartTab("line")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeChartTab === "line" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Line Graph
                </button>
              </div>
            </div>

            <div className="h-80 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 size={40} className="stroke-[1.5] mb-2 opacity-55" />
                  <p className="text-sm">No data available for this range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                        labelStyle={{ fontWeight: "bold", color: "#1F2937" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="Total Leads" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Bar dataKey="Proposals Sent" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      <Bar dataKey="Converted" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                        labelStyle={{ fontWeight: "bold", color: "#1F2937" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Line type="monotone" dataKey="Total Leads" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Proposals Sent" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Converted" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : activeChartViewTab === "product" ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Product Wise Lead Distribution ({filterType})
                </h2>
                <p className="text-xs text-gray-500 mt-1">Lead counts broken down by product requirements</p>
              </div>
            </div>

            <div className="h-80 w-full">
              {!data?.productWise || data.productWise.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 size={40} className="stroke-[1.5] mb-2 opacity-55" />
                  <p className="text-sm">No product data available for this range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.productWise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="product" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                      labelStyle={{ fontWeight: "bold", color: "#1F2937" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="count" name="Leads Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={55} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Client Financials ({filterType})
                </h2>
                <p className="text-xs text-gray-500 mt-1">Project Cost vs Paid vs Payable grouped by Client</p>
              </div>
            </div>

            <div className="h-80 w-full">
              {!data?.clientFinancials || data.clientFinancials.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 size={40} className="stroke-[1.5] mb-2 opacity-55" />
                  <p className="text-sm">No financial data available for this range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clientFinancials} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`} tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                      labelStyle={{ fontWeight: "bold", color: "#1F2937" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="projectCost" name="Project Cost" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="paidAmount" name="Paid Amount" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="payable" name="Payable" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Pending Followups */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Followups
            </h2>
            <Link href="/dashboard/crm/visits" className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">#</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Client Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Company</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 text-center">Followup Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Executive</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-300 opacity-50" />
                      <p className="text-sm font-medium">All caught up! No pending followups.</p>
                    </td>
                  </tr>
                ) : (
                  followups.map((f, i) => (
                    <tr key={i} className="group hover:bg-blue-50/50 transition-colors even:bg-slate-50/30">
                      <td className="px-4 py-2 text-xs text-gray-400 font-mono border-b border-r border-gray-100">{i + 1}</td>
                      <td className="px-4 py-2 text-xs font-semibold text-gray-900 border-b border-r border-gray-100 truncate max-w-[150px]">
                        {f.CM_Client_Name}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 border-b border-r border-gray-100 truncate max-w-[150px]">
                        {f.CM_Company_Name || "—"}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-center font-medium border-b border-r border-gray-100">
                        {(() => {
                          if (!f.CM_Next_Followup_Date) return "—";
                          const fDate = new Date(f.CM_Next_Followup_Date);
                          fDate.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isPast = fDate < today;
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                <Calendar className="h-3 w-3" />
                                {fDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                              </span>
                              <span className={`text-[9px] uppercase tracking-wider font-bold ${isPast ? 'text-red-500' : 'text-blue-500'}`}>
                                {isPast ? "Not Visited" : "Next Follow-up"}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 border-b border-r border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {(f.Executive_Name || "U")[0]}
                          </div>
                          <span className="truncate">{f.Executive_Name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-b border-gray-100">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[f.CM_Visit_Status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {f.CM_Visit_Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <FollowupsOverviewModal
        isOpen={isFollowupsModalOpen}
        onClose={() => setIsFollowupsModalOpen(false)}
      />

      {/* Expiring AMCs Modal */}
      {isAmcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-4xl bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 rounded-t-sm flex-shrink-0">
              <h2 className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                AMCs Expiring in 10 Days
              </h2>
              <button 
                onClick={() => setIsAmcModalOpen(false)} 
                className="hover:bg-white/10 p-1.5 rounded-sm transition-colors cursor-pointer text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="overflow-x-auto border border-slate-200 rounded-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eef2ff] border-b border-slate-200">
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider">Client Name</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider">Company Name</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider">Domain Link</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider text-right">AMC Amount</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-blue-700 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data?.expiringAmcs || data.expiringAmcs.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-xs bg-white">
                          No expiring AMCs found.
                        </td>
                      </tr>
                    ) : (
                      data.expiringAmcs.map((amc, idx) => {
                        const daysLeft = Math.ceil((new Date(amc.CM_Expiry_Date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                        return (
                          <tr 
                            key={amc.CM_AMC_ID} 
                            className={`border-b border-slate-100 text-xs transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? "bg-[#f4f7ff]/30" : "bg-white"}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">{amc.CM_Client_Name}</td>
                            <td className="px-4 py-3 text-slate-600">{amc.CM_Company_Name || "—"}</td>
                            <td className="px-4 py-3 text-blue-600 break-all select-all font-mono">
                              {amc.CM_Domain_Link ? (
                                <a href={amc.CM_Domain_Link.startsWith('http') ? amc.CM_Domain_Link : `https://${amc.CM_Domain_Link}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {amc.CM_Domain_Link}
                                </a>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">
                                  {new Date(amc.CM_Expiry_Date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                <span className={`text-[10px] font-extrabold ${daysLeft < 0 ? "text-red-600 animate-pulse" : daysLeft <= 3 ? "text-orange-600 font-bold" : "text-amber-600"}`}>
                                  {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : daysLeft === 0 ? "Expires Today" : `${daysLeft} days left`}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              ₹{Number(amc.CM_Amount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link href={`/dashboard/crm/payments?leadId=${amc.CM_Lead_ID}&paymentType=AMC&amcId=${amc.CM_AMC_ID}`}>
                                <button className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-[10px]">
                                  Collect AMC
                                </button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-sm flex-shrink-0">
              <button
                onClick={() => setIsAmcModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-sm hover:bg-slate-700 text-xs transition-colors cursor-pointer"
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
